import { supabase } from './client';
import type { Database } from '../../types/database';
import Logger from '../../utils/logger';

type Profile = Database['public']['Tables']['profiles']['Row'];

export class ProfilesService {
  /**
   * Get a user by their email address (case-insensitive)
   */
  static async getUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', email)
        .single();

      if (error) {
        Logger.error('Error fetching user by email:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get user by email:', error);
      return { data: null, error };
    }
  }

  /**
   * Get multiple user profiles by their IDs
   */
  static async getProfilesByIds(userIds: string[]) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (error) {
        Logger.error('Error fetching profiles by IDs:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get profiles by IDs:', error);
      return { data: null, error };
    }
  }
}
