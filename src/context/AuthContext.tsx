import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService, SignUpData, SignInData } from '../services/supabase/auth';
import { NotificationService } from '../services/notifications';
import type { User, Session } from '@supabase/supabase-js';
import Logger from '../utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ data: any; error: any }>;
  signIn: (data: SignInData) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        const { data, error } = await AuthService.getSession();

        if (error) {
          Logger.error('Failed to get initial session:', error);
          setUser(null);
          setSession(null);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          if (data.session?.user) {
            NotificationService.registerForPushNotifications(data.session.user.id);
          }
        }
      } catch (error) {
        Logger.error('Error initializing auth:', error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up auth state listener
    const subscription = AuthService.onAuthStateChange((event, session) => {
      Logger.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        NotificationService.registerForPushNotifications(session.user.id);
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data: SignUpData) => {
    try {
      const result = await AuthService.signUp(data);
      if (result.data && !result.error) {
        setUser(result.data.user);
        setSession(result.data.session);
      }
      return result;
    } catch (error) {
      Logger.error('Sign up error in context:', error);
      return { data: null, error };
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      const result = await AuthService.signIn(data);
      if (result.data && !result.error) {
        setUser(result.data.user);
        setSession(result.data.session);
      }
      return result;
    } catch (error) {
      Logger.error('Sign in error in context:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const result = await AuthService.signOut();
      if (!result.error) {
        setUser(null);
        setSession(null);
      }
      return result;
    } catch (error) {
      Logger.error('Sign out error in context:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
