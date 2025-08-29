import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { DatabaseService } from '../services/database';
import { User, UserRole, Admin, Member } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, role?: 'admin' | 'member') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  registerMember: (memberData: any) => Promise<{ success: boolean; member?: Member; error?: string }>;
  currentMember: Member | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MEMBER_STORAGE_KEY = 'churchfeed_member';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  // Load member from storage on app start
  useEffect(() => {
    loadMemberFromStorage();
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadMemberFromStorage = async () => {
    try {
      const memberData = await AsyncStorage.getItem(MEMBER_STORAGE_KEY);
      if (memberData) {
        setCurrentMember(JSON.parse(memberData));
      }
    } catch (error) {
      console.error('Error loading member from storage:', error);
    }
  };

  const saveMemberToStorage = async (member: Member) => {
    try {
      await AsyncStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(member));
      setCurrentMember(member);
    } catch (error) {
      console.error('Error saving member to storage:', error);
    }
  };

  const loadUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Check if user is an admin
      const admin = await DatabaseService.getAdminByUserId(supabaseUser.id);
      
      if (admin) {
        setUser({
          id: supabaseUser.id,
          role: 'admin',
          church_id: admin.church_id,
          admin,
        });
        return;
      }

      // Check if user is a member
      const member = await DatabaseService.getMemberByUserId(supabaseUser.id);
      
      if (member) {
        setUser({
          id: supabaseUser.id,
          role: 'member',
          church_id: member.church_id,
          member,
        });
        setCurrentMember(member);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signIn = async (email: string, password: string, role?: 'admin' | 'member'): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      // Keep member data for rejoining
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const registerMember = async (memberData: any): Promise<{ success: boolean; member?: Member; error?: string }> => {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: memberData.email,
        password: memberData.password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Create member record
      const member = await DatabaseService.createMember({
        ...memberData,
        user_id: authData.user.id,
      });
      
      if (member) {
        await saveMemberToStorage(member);
        return { success: true, member };
      } else {
        return { success: false, error: 'Failed to register member' };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    registerMember,
    currentMember,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}