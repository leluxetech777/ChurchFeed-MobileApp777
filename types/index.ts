export interface Church {
  id: string;
  name: string;
  address: string;
  is_hq: boolean;
  parent_hq_id?: string;
  church_code: string;
  subscription_tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  created_at: string;
}

export interface Admin {
  id: string;
  user_id: string;
  church_id: string;
  role: 'Head Pastor' | 'Pastor' | 'Secretary';
  invited_by?: string;
  created_at: string;
  email: string;
  name: string;
  phone: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  church_id: string;
  device_token?: string;
  created_at: string;
}

export interface Post {
  id: string;
  church_id: string;
  author_id: string;
  content: string;
  image_url?: string;
  target_branches?: string[];
  created_at: string;
  author?: Admin;
  church?: Church;
}

export interface Subscription {
  id: string;
  church_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing';
  current_period_end: string;
  created_at: string;
}

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  role: UserRole;
  church_id: string;
  admin?: Admin;
  member?: Member;
}

export type SubscriptionTier = {
  id: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  name: string;
  memberRange: string;
  price: number;
  maxMembers: number;
};

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  { id: 'tier1', name: 'New Church', memberRange: '0-50 members', price: 10, maxMembers: 50 },
  { id: 'tier2', name: 'Growing Church', memberRange: '51-150 members', price: 15, maxMembers: 150 },
  { id: 'tier3', name: 'Established Church', memberRange: '151-499 members', price: 20, maxMembers: 499 },
  { id: 'tier4', name: 'Mega Church', memberRange: '500+ members', price: 50, maxMembers: Infinity },
];

export interface ChurchRegistrationData {
  churchName: string;
  churchAddress: string;
  isHq: boolean;
  hqChurchCode?: string;
  adminName: string;
  adminRole: 'Head Pastor' | 'Pastor' | 'Secretary';
  adminPhone: string;
  adminEmail: string;
  memberCount: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  wantsTrial: boolean;
}

export interface MemberJoinData {
  name: string;
  phone: string;
  email: string;
  churchCode: string;
}