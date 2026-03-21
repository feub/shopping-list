import { supabase } from './client';
import type { Database } from '../../types/database';
import Logger from '../../utils/logger';

type StockRow = Database['public']['Tables']['stock']['Row'];

export interface StockRowWithProduct extends StockRow {
  products: { name: string } | null;
}

export class StockService {
  /**
   * Fetch all stock entries for a list, joined with product name.
   * Ordered alphabetically by product name.
   */
  static async getListStock(listId: string) {
    try {
      const { data, error } = await supabase
        .from('stock')
        .select(`
          *,
          products ( name )
        `)
        .eq('list_id', listId)
        .order('updated_at', { ascending: false });

      if (error) {
        Logger.error('Error fetching list stock:', error);
        throw error;
      }

      return { data: data as StockRowWithProduct[], error: null };
    } catch (error) {
      Logger.error('Failed to get list stock:', error);
      return { data: null, error };
    }
  }

  /**
   * Atomically increment stock via the upsert_stock RPC.
   * Used as fire-and-forget when an item is marked as bought.
   * Pass a positive delta only — decrement uses decrementStock instead.
   */
  static async incrementStock(productId: string, listId: string, delta: number = 1) {
    try {
      const { error } = await supabase.rpc('upsert_stock', {
        p_product_id: productId,
        p_list_id: listId,
        p_quantity_delta: delta,
      });

      if (error) {
        Logger.error('Error incrementing stock:', error);
        throw error;
      }

      Logger.log('Stock incremented for product:', productId);
      return { error: null };
    } catch (error) {
      Logger.error('Failed to increment stock:', error);
      return { error };
    }
  }

  /**
   * Decrement stock for a product with a guard: only updates if current
   * quantity >= delta (prevents going below zero).
   * Returns { blocked: true } if the guard prevented the update.
   */
  static async decrementStock(
    stockId: string,
    currentQuantity: number,
    delta: number = 1
  ) {
    try {
      if (currentQuantity < delta) {
        return { data: null, error: null, blocked: true };
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('stock')
        .update({
          quantity: currentQuantity - delta,
          updated_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stockId)
        .gte('quantity', delta) // DB-level guard
        .select()
        .maybeSingle();

      if (error) {
        Logger.error('Error decrementing stock:', error);
        throw error;
      }

      // data is null if the gte guard blocked the update (race condition safety)
      if (!data) {
        return { data: null, error: null, blocked: true };
      }

      Logger.log('Stock decremented for stock entry:', stockId);
      return { data: data as StockRow, error: null, blocked: false };
    } catch (error) {
      Logger.error('Failed to decrement stock:', error);
      return { data: null, error, blocked: false };
    }
  }

  /**
   * Set stock quantity and unit directly (used from the edit modal in StockScreen).
   * Creates the row if it doesn't exist.
   */
  static async setStock(
    productId: string,
    listId: string,
    quantity: number,
    unit: string | null
  ) {
    try {
      if (quantity < 0) {
        throw new Error('Stock quantity cannot be negative');
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('stock')
        .upsert(
          {
            product_id: productId,
            list_id: listId,
            quantity,
            unit,
            updated_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'product_id,list_id' }
        )
        .select()
        .single();

      if (error) {
        Logger.error('Error setting stock:', error);
        throw error;
      }

      Logger.log('Stock set for product:', productId);
      return { data: data as StockRow, error: null };
    } catch (error) {
      Logger.error('Failed to set stock:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a stock entry (removes product from inventory tracking for this list).
   */
  static async deleteStock(stockId: string) {
    try {
      const { error } = await supabase
        .from('stock')
        .delete()
        .eq('id', stockId);

      if (error) {
        Logger.error('Error deleting stock entry:', error);
        throw error;
      }

      Logger.log('Stock entry deleted:', stockId);
      return { error: null };
    } catch (error) {
      Logger.error('Failed to delete stock entry:', error);
      return { error };
    }
  }
}
