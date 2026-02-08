import { useState, useEffect, useCallback, useRef } from 'react';
import { ItemsService, CreateItemData, UpdateItemData } from '../services/supabase';
import { RealtimeService, ItemChange } from '../services/supabase/realtime';
import type { Item } from '../types/models';
import Logger from '../utils/logger';

export const useList = (listId: string) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch items for the list
  const fetchItems = useCallback(async () => {
    if (!listId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await ItemsService.getListItems(listId);

    if (fetchError) {
      Logger.error('Error fetching items:', fetchError);
      setError(fetchError as Error);
      setItems([]);
    } else {
      // Map database items to app models
      const mappedItems: Item[] = (data || []).map((item: any) => ({
        id: item.id,
        listId: item.list_id,
        text: item.text,
        quantity: item.quantity || undefined,
        notes: item.notes || undefined,
        isBought: item.is_bought,
        orderIndex: item.order_index,
        version: item.version,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        deletedAt: item.deleted_at || undefined,
        createdBy: item.created_by || undefined,
        createdByName: item.profiles?.display_name || item.profiles?.email || undefined,
      }));
      setItems(mappedItems);
    }

    setLoading(false);
  }, [listId]);

  // Load items on mount and when listId changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Track if we're currently performing an operation to avoid processing our own changes
  const isPerformingOperation = useRef(false);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!listId) return;

    const handleRealtimeChange = (change: ItemChange) => {
      // Skip if we're performing an operation (avoid processing our own changes)
      if (isPerformingOperation.current) {
        return;
      }

      const dbItem = change.item;
      const mappedItem: Item = {
        id: dbItem.id,
        listId: dbItem.list_id,
        text: dbItem.text,
        quantity: dbItem.quantity || undefined,
        notes: dbItem.notes || undefined,
        isBought: dbItem.is_bought,
        orderIndex: dbItem.order_index,
        version: dbItem.version,
        createdAt: dbItem.created_at,
        updatedAt: dbItem.updated_at,
        deletedAt: dbItem.deleted_at || undefined,
      };

      if (change.type === 'INSERT') {
        Logger.log('Real-time: Item added by another user');
        setItems(prev => {
          // Check if item already exists (to avoid duplicates)
          if (prev.some(item => item.id === mappedItem.id)) {
            return prev;
          }
          return [...prev, mappedItem];
        });
      } else if (change.type === 'UPDATE') {
        Logger.log('Real-time: Item updated by another user');
        setItems(prev => prev.map(item =>
          item.id === mappedItem.id ? mappedItem : item
        ));
      } else if (change.type === 'DELETE') {
        Logger.log('Real-time: Item deleted by another user');
        setItems(prev => prev.filter(item => item.id !== mappedItem.id));
      }
    };

    // Subscribe to real-time changes
    RealtimeService.subscribeToListItems(listId, handleRealtimeChange);

    // Cleanup subscription on unmount
    return () => {
      RealtimeService.unsubscribeFromListItems(listId);
    };
  }, [listId]);

  // Add a new item
  const addItem = useCallback(async (text: string, quantity?: string, notes?: string, currentUserName?: string) => {
    if (!listId) return;

    isPerformingOperation.current = true;
    const orderIndex = items.length;

    const { data, error: createError } = await ItemsService.createItem({
      listId,
      text,
      quantity,
      notes,
      orderIndex,
    });

    if (createError) {
      Logger.error('Error creating item:', createError);
      setError(createError as Error);
      isPerformingOperation.current = false;
      return;
    }

    if (data) {
      const newItem: Item = {
        id: data.id,
        listId: data.list_id,
        text: data.text,
        quantity: data.quantity || undefined,
        notes: data.notes || undefined,
        isBought: data.is_bought,
        orderIndex: data.order_index,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        deletedAt: data.deleted_at || undefined,
        createdBy: data.created_by || undefined,
        createdByName: (data as any).profiles?.display_name || (data as any).profiles?.email || currentUserName || undefined,
      };
      setItems(prev => [...prev, newItem]);
    }

    // Reset flag after a short delay to allow real-time event to be skipped
    setTimeout(() => {
      isPerformingOperation.current = false;
    }, 500);
  }, [listId, items.length]);

  // Update an item
  const updateItem = useCallback(async (itemId: string, updates: UpdateItemData) => {
    const { data, error: updateError } = await ItemsService.updateItem(itemId, updates);

    if (updateError) {
      Logger.error('Error updating item:', updateError);
      setError(updateError as Error);
      return;
    }

    if (data) {
      const updatedItem: Item = {
        id: data.id,
        listId: data.list_id,
        text: data.text,
        quantity: data.quantity || undefined,
        notes: data.notes || undefined,
        isBought: data.is_bought,
        orderIndex: data.order_index,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        deletedAt: data.deleted_at || undefined,
      };
      setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
    }
  }, []);

  // Toggle item bought status
  const toggleItem = useCallback(async (itemId: string, isBought: boolean) => {
    isPerformingOperation.current = true;

    const { data, error: toggleError } = await ItemsService.toggleItemBought(itemId, isBought);

    if (toggleError) {
      Logger.error('Error toggling item:', toggleError);
      setError(toggleError as Error);
      isPerformingOperation.current = false;
      return;
    }

    if (data) {
      const updatedItem: Item = {
        id: data.id,
        listId: data.list_id,
        text: data.text,
        quantity: data.quantity || undefined,
        notes: data.notes || undefined,
        isBought: data.is_bought,
        orderIndex: data.order_index,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        deletedAt: data.deleted_at || undefined,
      };
      setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
    }

    setTimeout(() => {
      isPerformingOperation.current = false;
    }, 500);
  }, []);

  // Delete an item
  const deleteItem = useCallback(async (itemId: string) => {
    isPerformingOperation.current = true;

    const { error: deleteError } = await ItemsService.deleteItem(itemId);

    if (deleteError) {
      Logger.error('Error deleting item:', deleteError);
      setError(deleteError as Error);
      isPerformingOperation.current = false;
      return;
    }

    setItems(prev => prev.filter(item => item.id !== itemId));

    setTimeout(() => {
      isPerformingOperation.current = false;
    }, 500);
  }, []);

  // Reorder items
  const reorderItems = useCallback(async (reorderedItems: Item[]) => {
    // Optimistically update UI
    setItems(reorderedItems);

    // Update order indexes
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      orderIndex: index,
    }));

    const { error: reorderError } = await ItemsService.reorderItems(updates);

    if (reorderError) {
      Logger.error('Error reordering items:', reorderError);
      setError(reorderError as Error);
      // Revert on error
      fetchItems();
    }
  }, [fetchItems]);

  // Clear all bought items
  const clearBoughtItems = useCallback(async () => {
    if (!listId) return;

    const { error: clearError } = await ItemsService.clearBoughtItems(listId);

    if (clearError) {
      Logger.error('Error clearing bought items:', clearError);
      setError(clearError as Error);
      return;
    }

    setItems(prev => prev.filter(item => !item.isBought));
  }, [listId]);

  // Get items separated by bought status
  const unboughtItems = items.filter(item => !item.isBought);
  const boughtItems = items.filter(item => item.isBought);

  return {
    items,
    unboughtItems,
    boughtItems,
    loading,
    error,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    reorderItems,
    clearBoughtItems,
    refetch: fetchItems,
  };
};
