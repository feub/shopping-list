import { supabase } from './client';
import type { Database } from '../../types/database';
import { validateItemText, validateQuantity } from '../../utils/validation';
import { sanitizeText } from '../../utils/sanitization';
import Logger from '../../utils/logger';

type Item = Database['public']['Tables']['items']['Row'];
type ItemInsert = Database['public']['Tables']['items']['Insert'];
type ItemUpdate = Database['public']['Tables']['items']['Update'];

export interface CreateItemData {
  listId: string;
  text: string;
  quantity?: string;
  notes?: string;
  orderIndex: number;
}

export interface UpdateItemData {
  text?: string;
  quantity?: string;
  notes?: string;
  isBought?: boolean;
  orderIndex?: number;
}

export class ItemsService {
  /**
   * Get all items for a list
   */
  static async getListItems(listId: string) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles:created_by (
            display_name,
            email
          )
        `)
        .eq('list_id', listId)
        .eq('is_deleted', false)
        .order('order_index', { ascending: true });

      if (error) {
        Logger.error('Error fetching list items:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get list items:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single item by ID
   */
  static async getItemById(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        Logger.error('Error fetching item:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to get item:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new item
   */
  static async createItem({ listId, text, quantity, notes, orderIndex }: CreateItemData) {
    try {
      validateItemText(text);
      if (quantity) {
        validateQuantity(quantity);
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('items')
        .insert({
          list_id: listId,
          text: sanitizeText(text),
          quantity: quantity ? sanitizeText(quantity) : null,
          notes: notes ? sanitizeText(notes) : null,
          order_index: orderIndex,
          is_bought: false,
          version: 1,
          created_by: user?.id || null,
        })
        .select(`
          *,
          profiles:created_by (
            display_name,
            email
          )
        `)
        .single();

      if (error) {
        Logger.error('Error creating item:', error);
        throw error;
      }

      Logger.log('Item created successfully:', data.id);
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to create item:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an item
   */
  static async updateItem(itemId: string, updates: UpdateItemData) {
    try {
      const updateData: ItemUpdate = {
        updated_at: new Date().toISOString(),
      };

      if (updates.text !== undefined) {
        validateItemText(updates.text);
        updateData.text = sanitizeText(updates.text);
      }

      if (updates.quantity !== undefined) {
        if (updates.quantity) {
          validateQuantity(updates.quantity);
          updateData.quantity = sanitizeText(updates.quantity);
        } else {
          updateData.quantity = null;
        }
      }

      if (updates.notes !== undefined) {
        updateData.notes = updates.notes ? sanitizeText(updates.notes) : null;
      }

      if (updates.isBought !== undefined) {
        updateData.is_bought = updates.isBought;
      }

      if (updates.orderIndex !== undefined) {
        updateData.order_index = updates.orderIndex;
      }

      const { data, error } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        Logger.error('Error updating item:', error);
        throw error;
      }

      Logger.log('Item updated successfully:', itemId);
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to update item:', error);
      return { data: null, error };
    }
  }

  /**
   * Toggle item bought status
   */
  static async toggleItemBought(itemId: string, isBought: boolean) {
    try {
      const { data, error } = await supabase
        .from('items')
        .update({
          is_bought: isBought,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        Logger.error('Error toggling item bought status:', error);
        throw error;
      }

      Logger.log('Item bought status toggled:', itemId);
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to toggle item bought status:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete an item (soft delete)
   */
  static async deleteItem(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('items')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        Logger.error('Error deleting item:', error);
        throw error;
      }

      Logger.log('Item deleted successfully:', itemId);
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to delete item:', error);
      return { data: null, error };
    }
  }

  /**
   * Reorder items in a list
   */
  static async reorderItems(updates: { id: string; orderIndex: number }[]) {
    try {
      const promises = updates.map(({ id, orderIndex }) =>
        supabase
          .from('items')
          .update({
            order_index: orderIndex,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        Logger.error('Errors reordering items:', errors);
        throw errors[0].error;
      }

      Logger.log('Items reordered successfully');
      return { error: null };
    } catch (error) {
      Logger.error('Failed to reorder items:', error);
      return { error };
    }
  }

  /**
   * Bulk create items
   */
  static async createItems(items: CreateItemData[]) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const itemsToInsert = items.map(item => {
        validateItemText(item.text);
        if (item.quantity) {
          validateQuantity(item.quantity);
        }

        return {
          list_id: item.listId,
          text: sanitizeText(item.text),
          quantity: item.quantity ? sanitizeText(item.quantity) : null,
          notes: item.notes ? sanitizeText(item.notes) : null,
          order_index: item.orderIndex,
          is_bought: false,
          version: 1,
          created_by: user?.id || null,
        };
      });

      const { data, error } = await supabase
        .from('items')
        .insert(itemsToInsert)
        .select();

      if (error) {
        Logger.error('Error bulk creating items:', error);
        throw error;
      }

      Logger.log('Items created successfully:', data.length);
      return { data, error: null };
    } catch (error) {
      Logger.error('Failed to bulk create items:', error);
      return { data: null, error };
    }
  }

  /**
   * Clear all bought items from a list
   */
  static async clearBoughtItems(listId: string) {
    try {
      const { error } = await supabase
        .from('items')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('list_id', listId)
        .eq('is_bought', true);

      if (error) {
        Logger.error('Error clearing bought items:', error);
        throw error;
      }

      Logger.log('Bought items cleared successfully');
      return { error: null };
    } catch (error) {
      Logger.error('Failed to clear bought items:', error);
      return { error };
    }
  }
}
