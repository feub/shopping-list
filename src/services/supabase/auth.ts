import { supabase } from './client';
import { validateEmail, validatePassword } from '../../utils/validation';
import { sanitizeText } from '../../utils/sanitization';
import Logger from '../../utils/logger';

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  static async signUp({ email, password, displayName }: SignUpData) {
    try {
      // Validate inputs
      validateEmail(email);
      validatePassword(password);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName ? sanitizeText(displayName) : undefined,
          },
        },
      });

      if (error) {
        Logger.error('Sign up error:', error);
        throw error;
      }

      Logger.log('User signed up successfully');
      return { data, error: null };
    } catch (error) {
      Logger.error('Sign up failed:', error);
      return { data: null, error };
    }
  }

  static async signIn({ email, password }: SignInData) {
    try {
      // Validate inputs
      validateEmail(email);
      validatePassword(password);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Logger.error('Sign in error:', error);
        throw error;
      }

      Logger.log('User signed in successfully');
      return { data, error: null };
    } catch (error) {
      Logger.error('Sign in failed:', error);
      return { data: null, error };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        Logger.error('Sign out error:', error);
        throw error;
      }

      Logger.log('User signed out successfully');
      return { error: null };
    } catch (error) {
      Logger.error('Sign out failed:', error);
      return { error };
    }
  }

  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        Logger.error('Get session error:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Get session failed:', error);
      return { data: null, error };
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        Logger.error('Get user error:', error);
        throw error;
      }

      return { user, error: null };
    } catch (error) {
      Logger.error('Get user failed:', error);
      return { user: null, error };
    }
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
}
