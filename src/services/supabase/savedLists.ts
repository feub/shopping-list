import { supabase } from './client';
import type { Database } from '../../types/database';
import { validateListName } from '../../utils/validation';
import { sanitizeListName, sanitizeText } from '../../utils/sanitization';
import Logger from '../../utils/logger';

type SavedList = Database['public']['Tables']['saved_lists']['Row'];
type SavedListInsert = Database['public']['Tables']['saved_lists']['Insert'];
type SavedListItem = Database['public']['Tables']['saved_list_items']['Row'];
type SavedListItemInsert = Database['public']['Tables']['saved_list_items']['Insert'];

export class SavedListsService {
  /**
   * Get all saved lists for a user
   */
  static async getUserSavedLists(userId: string) {
    try {
      const { data, error } = await supabase
        .from('saved_lists')
        .select(`
          *,
          saved_list_items(*)
        `)
        .eq('created_by', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        Logger.error('Error fetching saved lists:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get saved lists:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single saved list by ID
   */
  static async getSavedListById(savedListId: string) {
    try {
      const { data, error } = await supabase
        .from('saved_lists')
        .select(`
          *,
          saved_list_items(*)
        `)
        .eq('id', savedListId)
        .single();

      if (error) {
        Logger.error('Error fetching saved list:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get saved list:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new saved list with items
   */
  static async createSavedList(
    userId: string,
    name: string,
    description: string | null,
    items: { text: string; quantity?: number; notes?: string | null; order_index: number }[]
  ) {
    try {
      validateListName(name);

      // Create the saved list
      const { data: savedList, error: listError } = await supabase
        .from('saved_lists')
        .insert({
          name: sanitizeListName(name),
          description: description ? sanitizeText(description) : null,
          created_by: userId,
        })
        .select()
        .single();

      if (listError) {
        Logger.error('Error creating saved list:', listError);
        throw listError;
      }

      // Create the items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          saved_list_id: savedList.id,
          text: sanitizeText(item.text),
          quantity: item.quantity || 1,
          notes: item.notes ? sanitizeText(item.notes) : null,
          order_index: item.order_index,
        }));

        const { error: itemsError } = await supabase
          .from('saved_list_items')
          .insert(itemsToInsert);

        if (itemsError) {
          Logger.error('Error creating saved list items:', itemsError);
          // Clean up the saved list if items creation failed
          await supabase.from('saved_lists').delete().eq('id', savedList.id);
          throw itemsError;
        }
      }

      Logger.log('Saved list created successfully:', savedList.id);
      return { data: savedList, error: null };
    } catch (error) {
      Logger.error('Failed to create saved list:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a saved list
   */
  static async updateSavedList(
    savedListId: string,
    updates: { name?: string; description?: string | null }
  ) {
    try {
      const updateData: any = {
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
        .from('saved_lists')
        .update(updateData)
        .eq('id', savedListId)
        .select()
        .single();

      if (error) {
        Logger.error('Error updating saved list:', error);
        throw error;
      }

      Logger.log('Saved list updated successfully:', savedListId);
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to update saved list:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a saved list with new items (replaces all existing items)
   */
  static async updateSavedListWithItems(
    savedListId: string,
    name: string,
    description: string | null,
    items: { text: string; quantity?: number; notes?: string | null; order_index: number }[]
  ) {
    try {
      validateListName(name);

      // Update the saved list metadata
      const { error: updateError } = await supabase
        .from('saved_lists')
        .update({
          name: sanitizeListName(name),
          description: description ? sanitizeText(description) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedListId);

      if (updateError) {
        Logger.error('Error updating saved list:', updateError);
        throw updateError;
      }

      // Delete all existing items
      const { error: deleteError } = await supabase
        .from('saved_list_items')
        .delete()
        .eq('saved_list_id', savedListId);

      if (deleteError) {
        Logger.error('Error deleting saved list items:', deleteError);
        throw deleteError;
      }

      // Insert new items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          saved_list_id: savedListId,
          text: sanitizeText(item.text),
          quantity: item.quantity || 1,
          notes: item.notes ? sanitizeText(item.notes) : null,
          order_index: item.order_index,
        }));

        const { error: insertError } = await supabase
          .from('saved_list_items')
          .insert(itemsToInsert);

        if (insertError) {
          Logger.error('Error inserting saved list items:', insertError);
          throw insertError;
        }
      }

      Logger.log('Saved list updated successfully:', savedListId);
      return { error: null };
    } catch (error) {
      Logger.error('Failed to update saved list with items:', error);
      return { error };
    }
  }

  /**
   * Delete a saved list
   */
  static async deleteSavedList(savedListId: string) {
    try {
      // Delete items first
      await supabase.from('saved_list_items').delete().eq('saved_list_id', savedListId);

      // Delete the saved list
      const { error } = await supabase.from('saved_lists').delete().eq('id', savedListId);

      if (error) {
        Logger.error('Error deleting saved list:', error);
        throw error;
      }

      Logger.log('Saved list deleted successfully:', savedListId);
      return { error: null };
    } catch (error) {
      Logger.error('Failed to delete saved list:', error);
      return { error };
    }
  }

  /**
   * Clone a saved list to a regular shopping list
   */
  static async cloneToList(savedListId: string, targetListId: string) {
    try {
      // Get saved list items
      const { data: savedItems, error: fetchError } = await supabase
        .from('saved_list_items')
        .select('*')
        .eq('saved_list_id', savedListId)
        .order('order_index', { ascending: true });

      if (fetchError) {
        Logger.error('Error fetching saved list items:', fetchError);
        throw fetchError;
      }

      if (!savedItems || savedItems.length === 0) {
        return { data: [], error: null };
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Get current item count to set order_index
      const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', targetListId)
        .eq('is_deleted', false);

      const startIndex = count || 0;

      // Create items in the target list
      const itemsToInsert = savedItems.map((savedItem, index) => ({
        list_id: targetListId,
        text: savedItem.text,
        quantity: savedItem.quantity?.toString() || null,
        notes: savedItem.notes,
        order_index: startIndex + index,
        is_bought: false,
        version: 1,
        created_by: user?.id || null,
      }));

      const { data, error: insertError } = await supabase
        .from('items')
        .insert(itemsToInsert)
        .select();

      if (insertError) {
        Logger.error('Error cloning items to list:', insertError);
        throw insertError;
      }

      // Update usage stats
      await supabase
        .from('saved_lists')
        .update({
          usage_count: supabase.rpc('increment', { x: 1 }),
          last_used_at: new Date().toISOString(),
        })
        .eq('id', savedListId);

      Logger.log('Saved list cloned successfully');
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to clone saved list:', error);
      return { data: null, error };
    }
  }
}
