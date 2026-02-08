import { supabase } from './client';
import type { Database } from '../../types/database';
import { sanitizeText } from '../../utils/sanitization';
import Logger from '../../utils/logger';

type FavoriteItem = Database['public']['Tables']['favorite_items']['Row'];
type FavoriteItemInsert = Database['public']['Tables']['favorite_items']['Insert'];

export class FavoritesService {
  /**
   * Get all favorite items for a user
   */
  static async getUserFavorites(userId: string) {
    try {
      const { data, error } = await supabase
        .from('favorite_items')
        .select('*')
        .eq('user_id', userId)
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        Logger.error('Error fetching favorite items:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get favorite items:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new favorite item
   */
  static async createFavorite(
    userId: string,
    text: string,
    quantity?: number,
    notes?: string | null
  ) {
    try {
      if (!text.trim()) {
        throw new Error('Item text cannot be empty');
      }

      const { data, error } = await supabase
        .from('favorite_items')
        .insert({
          user_id: userId,
          text: sanitizeText(text),
          quantity: quantity || 1,
          notes: notes ? sanitizeText(notes) : null,
        })
        .select()
        .single();

      if (error) {
        Logger.error('Error creating favorite item:', error);
        throw error;
      }

      Logger.log('Favorite item created successfully:', data.id);
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to create favorite item:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a favorite item
   */
  static async updateFavorite(
    favoriteId: string,
    updates: { text?: string; quantity?: number; notes?: string | null }
  ) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.text !== undefined) {
        if (!updates.text.trim()) {
          throw new Error('Item text cannot be empty');
        }
        updateData.text = sanitizeText(updates.text);
      }

      if (updates.quantity !== undefined) {
        updateData.quantity = updates.quantity;
      }

      if (updates.notes !== undefined) {
        updateData.notes = updates.notes ? sanitizeText(updates.notes) : null;
      }

      const { data, error } = await supabase
        .from('favorite_items')
        .update(updateData)
        .eq('id', favoriteId)
        .select()
        .single();

      if (error) {
        Logger.error('Error updating favorite item:', error);
        throw error;
      }

      Logger.log('Favorite item updated successfully:', favoriteId);
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to update favorite item:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a favorite item
   */
  static async deleteFavorite(favoriteId: string) {
    try {
      const { error } = await supabase
        .from('favorite_items')
        .delete()
        .eq('id', favoriteId);

      if (error) {
        Logger.error('Error deleting favorite item:', error);
        throw error;
      }

      Logger.log('Favorite item deleted successfully:', favoriteId);
      return { error: null };
    } catch (error) {
      Logger.error('Failed to delete favorite item:', error);
      return { error };
    }
  }

  /**
   * Add a favorite item to a shopping list and update usage stats
   */
  static async addFavoriteToList(favoriteId: string, targetListId: string) {
    try {
      // Get the favorite item
      const { data: favorite, error: fetchError } = await supabase
        .from('favorite_items')
        .select('*')
        .eq('id', favoriteId)
        .single();

      if (fetchError) {
        Logger.error('Error fetching favorite item:', fetchError);
        throw fetchError;
      }

      if (!favorite) {
        throw new Error('Favorite item not found');
      }

      // Get current item count to set order_index
      const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', targetListId)
        .eq('is_deleted', false);

      const orderIndex = count || 0;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create item in the target list
      const { data, error: insertError } = await supabase
        .from('items')
        .insert({
          list_id: targetListId,
          text: favorite.text,
          quantity: favorite.quantity,
          notes: favorite.notes,
          order_index: orderIndex,
          is_bought: false,
          version: 1,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (insertError) {
        Logger.error('Error adding favorite to list:', insertError);
        throw insertError;
      }

      // Update usage stats
      await supabase
        .from('favorite_items')
        .update({
          usage_count: (favorite.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', favoriteId);

      Logger.log('Favorite item added to list successfully');
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to add favorite to list:', error);
      return { data: null, error };
    }
  }
}
