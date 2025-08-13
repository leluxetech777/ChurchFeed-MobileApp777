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
  static async createChurch(data: ChurchRegistrationData): Promise<{ church: Church; admin: Admin } | null> {
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
        return null;
      }

      // Create admin user account
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: 'temporary_password_123!', // User will need to reset
      });

      if (authError || !authUser.user) {
        console.error('Error creating admin auth:', authError);
        return null;
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
        return null;
      }

      return { church, admin };
    } catch (error) {
      console.error('Error in createChurch:', error);
      return null;
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
  static async createMember(data: MemberJoinData): Promise<Member | null> {
    try {
      const church = await this.getChurchByCode(data.churchCode);
      if (!church) {
        throw new Error('Invalid church code');
      }

      const { data: member, error } = await supabase
        .from('members')
        .insert({
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