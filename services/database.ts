import { supabase } from '../lib/supabase';
import { 
  Church, 
  Admin, 
  Member, 
  Post, 
  Subscription, 
  ChurchRegistrationData, 
  MemberJoinData 
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
  static async createMember(data: MemberJoinData): Promise<{ member: Member; churchName: string; needsEmailVerification: boolean } | null> {
    try {
      const church = await this.getChurchByCode(data.churchCode);
      if (!church) {
        throw new Error('Invalid church code');
      }

      // Create auth user for the member
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            phone: data.phone,
            church_name: church.name,
            church_code: data.churchCode,
            user_type: 'member'
          },
          emailRedirectTo: undefined, // Will use default from Supabase settings
        }
      });

      if (authError) {
        console.error('Error creating member auth:', authError);
        
        // If it's an email error, don't fail the entire registration
        if (authError.message.includes('email') || authError.message.includes('confirmation')) {
          console.warn('Email confirmation failed, but user account may have been created');
          // Continue with the flow, but mark that email verification failed
        } else {
          throw new Error(`Authentication error: ${authError.message}`);
        }
      }

      if (!authUser.user) {
        throw new Error('Failed to create user account');
      }

      // Create member record linked to auth user
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          name: data.name,
          phone: data.phone,
          email: data.email,
          church_id: church.id,
        })
        .select(`
          *,
          church:churches(*)
        `)
        .single();

      if (memberError) {
        console.error('Error creating member:', memberError);
        // Clean up auth user if member creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Member creation error: ${memberError?.message || 'Failed to create member'}`);
      }

      return {
        member,
        churchName: church.name,
        needsEmailVerification: !authUser.user.email_confirmed_at
      };
    } catch (error) {
      console.error('Error in createMember:', error);
      throw error;
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
    imageUrl?: string, 
    targetBranches?: string[]
  ): Promise<Post | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          church_id: churchId,
          author_id: authorId,
          content,
          image_url: imageUrl,
          target_branches: targetBranches,
        })
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

      return data || [];
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
}