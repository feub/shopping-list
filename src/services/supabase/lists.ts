import { supabase } from './client';
import type { Database } from '../../types/database';
import { validateListName } from '../../utils/validation';
import { sanitizeListName, sanitizeText } from '../../utils/sanitization';
import Logger from '../../utils/logger';

type List = Database['public']['Tables']['lists']['Row'];
type ListInsert = Database['public']['Tables']['lists']['Insert'];
type ListUpdate = Database['public']['Tables']['lists']['Update'];

export class ListsService {
  /**
   * Get all lists for the current user
   */
  static async getUserLists(userId: string) {
    try {
      // Note: RLS policy on lists table already filters to only lists the user is a member of
      // We don't need to manually filter by list_members here
      Logger.log('getUserLists called for userId:', userId);

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('updated_at', { ascending: false });

      Logger.log('getUserLists result:', {
        dataCount: data?.length || 0,
        data: data?.map(l => ({ id: l.id, name: l.name })),
        error
      });

      if (error) {
        Logger.error('Error fetching user lists:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get user lists:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single list by ID
   */
  static async getListById(listId: string) {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          list_members(user_id, role)
        `)
        .eq('id', listId)
        .single();

      if (error) {
        Logger.error('Error fetching list:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get list:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all members of a list with their profile information
   */
  static async getListMembers(listId: string) {
    try {
      const { data, error } = await supabase
        .from('list_members')
        .select(`
          id,
          user_id,
          role,
          added_at,
          profiles:user_id (
            email,
            display_name
          )
        `)
        .eq('list_id', listId)
        .order('added_at', { ascending: true });

      if (error) {
        Logger.error('Error fetching list members:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get list members:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new list
   */
  static async createList(userId: string, name: string, description?: string) {
    try {
      validateListName(name);

      // Create the list
      const { data: list, error: listError } = await supabase
        .from('lists')
        .insert({
          name: sanitizeListName(name),
          description: description ? sanitizeText(description) : null,
          created_by: userId,
          version: 1,
        })
        .select()
        .single();

      if (listError) {
        Logger.error('Error creating list:', listError);
        throw listError;
      }

      // Add the creator as owner
      const { error: memberError } = await supabase
        .from('list_members')
        .insert({
          list_id: list.id,
          user_id: userId,
          role: 'owner',
        });

      if (memberError) {
        Logger.error('Error adding list owner:', memberError);
        // Clean up the list if member creation failed
        await supabase.from('lists').delete().eq('id', list.id);
        throw memberError;
      }

      Logger.log('List created successfully:', list.id);
      return { data: list, error: null };
    } catch (error) {
      Logger.error('Failed to create list:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a list
   */
  static async updateList(listId: string, updates: { name?: string; description?: string }) {
    try {
      const updateData: ListUpdate = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) {
        validateListName(updates.name);
        updateData.name = sanitizeListName(updates.name);
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description ? sanitizeText(updates.description) : null;
      }

      const { data, error } = await supabase
        .from('lists')
        .update(updateData)
        .eq('id', listId)
        .select()
        .single();

      if (error) {
        Logger.error('Error updating list:', error);
        throw error;
      }

      Logger.log('List updated successfully:', listId);
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to update list:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a list (soft delete)
   */
  static async deleteList(listId: string) {
    try {
      const { error } = await supabase
        .from('lists')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', listId);

      if (error) {
        Logger.error('Error deleting list:', error);
        throw error;
      }

      Logger.log('List deleted successfully:', listId);
      return { error: null };
    } catch (error) {
      Logger.error('Failed to delete list:', error);
      return { error };
    }
  }

  /**
   * Add a member to a list
   */
  static async addListMember(listId: string, userId: string, role: 'viewer' | 'editor' = 'editor') {
    try {
      const { data, error } = await supabase
        .from('list_members')
        .insert({
          list_id: listId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) {
        Logger.error('Error adding list member:', error);
        throw error;
      }

      Logger.log('List member added successfully');
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to add list member:', error);
      return { data: null, error };
    }
  }

  /**
   * Remove a member from a list
   */
  static async removeListMember(listId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('list_members')
        .delete()
        .eq('list_id', listId)
        .eq('user_id', userId);

      if (error) {
        Logger.error('Error removing list member:', error);
        throw error;
      }

      Logger.log('List member removed successfully');
      return { error: null };
    } catch (error) {
      Logger.error('Failed to remove list member:', error);
      return { error };
    }
  }

  /**
   * Update a member's role
   */
  static async updateMemberRole(listId: string, userId: string, role: 'viewer' | 'editor' | 'owner') {
    try {
      const { data, error } = await supabase
        .from('list_members')
        .update({ role })
        .eq('list_id', listId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        Logger.error('Error updating member role:', error);
        throw error;
      }

      Logger.log('Member role updated successfully');
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to update member role:', error);
      return { data: null, error };
    }
  }
}
