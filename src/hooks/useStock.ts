import { useState, useEffect, useCallback } from 'react';
import { StockService } from '../services/supabase';
import type { StockEntry } from '../types/models';
import type { StockRowWithProduct } from '../services/supabase/stock';
import Logger from '../utils/logger';

function mapStockRow(row: StockRowWithProduct): StockEntry {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? 'Unknown Product',
    listId: row.list_id,
    quantity: row.quantity,
    unit: row.unit ?? null,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? null,
  };
}

export const useStock = (listId: string) => {
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStock = useCallback(async () => {
    if (!listId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await StockService.getListStock(listId);

    if (fetchError) {
      Logger.error('Error fetching stock:', fetchError);
      setError(fetchError as Error);
      setStockEntries([]);
    } else {
      setStockEntries((data ?? []).map(mapStockRow));
    }

    setLoading(false);
  }, [listId]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  /**
   * Decrement a stock entry by delta (default 1).
   * Optimistically updates UI; reverts on error or if guarded (already at 0).
   * Returns false if the operation was blocked (quantity already 0).
   */
  const decrementStock = useCallback(async (
    stockId: string,
    currentQuantity: number,
    delta: number = 1
  ): Promise<boolean> => {
    if (currentQuantity < delta) {
      return false;
    }

    // Optimistic update
    setStockEntries(prev => prev.map(entry =>
      entry.id === stockId
        ? { ...entry, quantity: Math.max(0, entry.quantity - delta) }
        : entry
    ));

    const { data, error: decrementError, blocked } = await StockService.decrementStock(
      stockId,
      currentQuantity,
      delta
    );

    if (decrementError) {
      Logger.error('Error decrementing stock:', decrementError);
      setError(decrementError as Error);
      fetchStock(); // revert optimistic update
      return false;
    }

    if (blocked) {
      // Race condition: someone else decremented first — revert and refetch
      fetchStock();
      return false;
    }

    if (data) {
      setStockEntries(prev => prev.map(entry =>
        entry.id === stockId ? { ...entry, quantity: data.quantity } : entry
      ));
    }

    return true;
  }, [fetchStock]);

  /**
   * Set quantity and unit for a product/list pair directly.
   * Creates the stock row if it doesn't exist yet.
   */
  const setStockQuantity = useCallback(async (
    productId: string,
    quantity: number,
    unit: string | null
  ) => {
    const { data, error: setError } = await StockService.setStock(productId, listId, quantity, unit);

    if (setError) {
      Logger.error('Error setting stock:', setError);
      setError(setError as Error);
      return;
    }

    if (data) {
      setStockEntries(prev => {
        const exists = prev.some(entry => entry.productId === productId);
        if (exists) {
          return prev.map(entry =>
            entry.productId === productId
              ? { ...entry, quantity: data.quantity, unit: data.unit }
              : entry
          );
        }
        // New entry — refetch to get product name join
        fetchStock();
        return prev;
      });
    }
  }, [listId, fetchStock]);

  /**
   * Remove a stock entry entirely (untrack this product for this list).
   */
  const removeStockEntry = useCallback(async (stockId: string) => {
    const { error: deleteError } = await StockService.deleteStock(stockId);

    if (deleteError) {
      Logger.error('Error removing stock entry:', deleteError);
      setError(deleteError as Error);
      return;
    }

    setStockEntries(prev => prev.filter(entry => entry.id !== stockId));
  }, []);

  return {
    stockEntries,
    loading,
    error,
    decrementStock,
    setStockQuantity,
    removeStockEntry,
    refetch: fetchStock,
  };
};
