import { supabase } from '../lib/supabase';
import { 
  Church, 
  Admin, 
  Member, 
  Post, 
  Subscription, 
  ChurchRegistrationData, 
  MemberJoinData,
  Reaction,
  ReactionType,
  PostReaction
} from '../types';
import { generateChurchCode } from '../lib/utils';

export class DatabaseService {
  // Church operations
  static async createChurch(data: ChurchRegistrationData): Promise<{ church: Church; admin: Admin; needsEmailVerification: boolean } | null> {
    try {
      const churchCode = generateChurchCode();
      
      // Create church
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .insert({
          name: data.churchName,
          address: data.churchAddress,
          is_hq: data.isHq,
          parent_hq_id: data.hqChurchCode ? 
            (await this.getChurchByCode(data.hqChurchCode))?.id : null,
          church_code: churchCode,
          subscription_tier: data.memberCount,
        })
        .select()
        .single();

      if (churchError || !church) {
        console.error('Error creating church:', churchError);
        throw new Error(`Database error: ${churchError?.message || 'Failed to create church'}`);
      }

      // Create admin user account with email verification
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: data.adminPassword,
        options: {
          data: {
            full_name: data.adminName,
            role: data.adminRole,
            church_name: data.churchName,
            church_code: churchCode,
          },
          emailRedirectTo: undefined, // Will use default from Supabase settings
        }
      });

      if (authError) {
        console.error('Error creating admin auth:', authError);
        
        // If it's an email error, don't fail the entire registration
        if (authError.message.includes('email') || authError.message.includes('confirmation')) {
          console.warn('Email confirmation failed, but user account may have been created');
          // Continue with the flow, but mark that email verification failed
        } else {
          // Clean up church record if auth creation fails for other reasons
          await supabase.from('churches').delete().eq('id', church.id);
          throw new Error(`Authentication error: ${authError.message}`);
        }
      }

      if (!authUser.user) {
        throw new Error('Failed to create user account');
      }

      // Create admin record
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: authUser.user.id,
          church_id: church.id,
          role: data.adminRole,
          name: data.adminName,
          email: data.adminEmail,
          phone: data.adminPhone,
        })
        .select()
        .single();

      if (adminError || !admin) {
        console.error('Error creating admin:', adminError);
        // Clean up church and auth user if admin creation fails
        await supabase.from('churches').delete().eq('id', church.id);
        throw new Error(`Admin creation error: ${adminError?.message || 'Failed to create admin'}`);
      }

      // Create initial subscription record if trial is wanted
      if (data.wantsTrial) {
        await this.createTrialSubscription(church.id);
      }

      return { 
        church, 
        admin, 
        needsEmailVerification: !authUser.user.email_confirmed_at 
      };
    } catch (error) {
      console.error('Error in createChurch:', error);
      throw error;
    }
  }

  static async createTrialSubscription(churchId: string): Promise<void> {
    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

      await supabase
        .from('subscriptions')
        .insert({
          church_id: churchId,
          status: 'trialing',
          current_period_end: trialEndDate.toISOString(),
        });
    } catch (error) {
      console.error('Error creating trial subscription:', error);
      // Don't throw here as it's not critical for church creation
    }
  }

  static async getChurchByCode(code: string): Promise<Church | null> {
    try {
      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('church_code', code)
        .single();

      if (error) {
        console.error('Error getting church by code:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getChurchByCode:', error);
      return null;
    }
  }

  static async getChurchById(id: string): Promise<Church | null> {
    try {
      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error getting church by id:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getChurchById:', error);
      return null;
    }
  }

  static async getChurchBranches(hqId: string): Promise<Church[]> {
    try {
      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('parent_hq_id', hqId);

      if (error) {
        console.error('Error getting church branches:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChurchBranches:', error);
      return [];
    }
  }

  // Member operations
  static async createMember(data: MemberJoinData & { user_id?: string }): Promise<Member | null> {
    try {
      const church = await this.getChurchByCode(data.churchCode);
      if (!church) {
        throw new Error('Invalid church code');
      }

      const { data: member, error } = await supabase
        .from('members')
        .insert({
          user_id: data.user_id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          church_id: church.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating member:', error);
        return null;
      }

      return member;
    } catch (error) {
      console.error('Error in createMember:', error);
      return null;
    }
  }

  static async getMemberByUserId(userId: string): Promise<Member | null> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error getting member by user ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getMemberByUserId:', error);
      return null;
    }
  }

  static async updateMemberDeviceToken(memberId: string, deviceToken: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('members')
        .update({ device_token: deviceToken })
        .eq('id', memberId);

      if (error) {
        console.error('Error updating member device token:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMemberDeviceToken:', error);
      return false;
    }
  }

  static async getChurchMembers(churchId: string): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting church members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChurchMembers:', error);
      return [];
    }
  }

  // Admin operations
  static async getAdminByUserId(userId: string): Promise<Admin | null> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error getting admin by user ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAdminByUserId:', error);
      return null;
    }
  }

  static async inviteAdmin(email: string, churchId: string, role: string, invitedBy: string): Promise<boolean> {
    try {
      // Send invitation email logic would go here
      // For now, we'll just create a placeholder admin record
      console.log('Admin invitation would be sent to:', email);
      return true;
    } catch (error) {
      console.error('Error in inviteAdmin:', error);
      return false;
    }
  }

  // Post operations
  static async createPost(
    churchId: string, 
    authorId: string, 
    content: string, 
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    targetBranches?: string[]
  ): Promise<Post | null> {
    try {
      const insertData: any = {
        church_id: churchId,
        author_id: authorId,
        content,
        target_branches: targetBranches,
      };

      // Set the appropriate URL field based on media type
      if (mediaUrl && mediaType) {
        if (mediaType === 'image') {
          insertData.image_url = mediaUrl;
        } else if (mediaType === 'video') {
          insertData.video_url = mediaUrl;
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(insertData)
        .select(`
          *,
          author:admins(*),
          church:churches(*)
        `)
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createPost:', error);
      return null;
    }
  }

  static async getChurchFeed(churchId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_church_feed', { target_church_id: churchId });

      if (error) {
        console.error('Error getting church feed:', error);
        return [];
      }

      // Transform flat data into nested structure expected by the frontend
      const transformedData = (data || []).map((post: any) => ({
        id: post.id,
        church_id: post.church_id,
        author_id: post.author_id,
        content: post.content,
        image_url: post.image_url,
        target_branches: post.target_branches,
        created_at: post.created_at,
        author: {
          id: post.author_id,
          name: post.author_name,
          role: post.author_role,
        },
        church: {
          id: post.church_id,
          name: post.church_name,
        }
      }));

      return transformedData;
    } catch (error) {
      console.error('Error in getChurchFeed:', error);
      return [];
    }
  }

  // Subscription operations
  static async createSubscription(
    churchId: string, 
    stripeCustomerId: string, 
    stripeSubscriptionId: string,
    status: string,
    currentPeriodEnd: string
  ): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          church_id: churchId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          status,
          current_period_end: currentPeriodEnd,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createSubscription:', error);
      return null;
    }
  }

  static async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('Error updating subscription status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSubscriptionStatus:', error);
      return false;
    }
  }

  static async getChurchSubscription(churchId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('church_id', churchId)
        .single();

      if (error) {
        console.error('Error getting church subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getChurchSubscription:', error);
      return null;
    }
  }

  // Reaction operations
  static async setReaction(postId: string, userId: string, reactionType: ReactionType): Promise<Reaction | null> {
    try {
      // Use upsert to replace any existing reaction for this user on this post
      const { data, error } = await supabase
        .from('reactions')
        .upsert({
          post_id: postId,
          user_id: userId,
          reaction_type: reactionType,
        }, {
          onConflict: 'post_id,user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error setting reaction:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in setReaction:', error);
      return null;
    }
  }

  static async removeReaction(postId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing reaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeReaction:', error);
      return false;
    }
  }

  static async getPostReactions(postId: string, userId?: string): Promise<PostReaction[]> {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('reaction_type, user_id')
        .eq('post_id', postId);

      if (error) {
        console.error('Error getting post reactions:', error);
        return [];
      }

      // Find user's current reaction if any
      let userReactionType: ReactionType | null = null;
      if (userId) {
        const userReaction = (data || []).find(r => r.user_id === userId);
        userReactionType = userReaction ? userReaction.reaction_type as ReactionType : null;
      }

      // Group reactions by type and count
      const reactionCounts = (data || []).reduce((acc: Record<ReactionType, number>, reaction) => {
        const type = reaction.reaction_type as ReactionType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<ReactionType, number>);

      // Convert to array format with user reaction status
      return Object.entries(reactionCounts).map(([type, count]) => ({
        type: type as ReactionType,
        count,
        userReacted: userReactionType === type,
      }));
    } catch (error) {
      console.error('Error in getPostReactions:', error);
      return [];
    }
  }
}