import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../../utils/logger';
import type { Item } from '../../types/models';

const KEYS = {
  ITEMS_PREFIX: 'items_list_',
  LAST_SYNC: 'last_sync_',
  PENDING_OPERATIONS: 'pending_operations',
} as const;

export interface StoredItem extends Item {
  // Local-only fields for offline support
  pendingSync?: boolean;
  locallyCreated?: boolean;
  locallyModified?: boolean;
  locallyDeleted?: boolean;
}

export class AsyncStorageService {
  /**
   * Get all items for a list from local storage
   */
  static async getListItems(listId: string): Promise<StoredItem[]> {
    try {
      const key = `${KEYS.ITEMS_PREFIX}${listId}`;
      const data = await AsyncStorage.getItem(key);

      if (!data) {
        return [];
      }

      const items: StoredItem[] = JSON.parse(data);
      // Filter out deleted items unless they're pending sync
      return items.filter(item => !item.isDeleted || item.pendingSync);
    } catch (error) {
      Logger.error('Error getting items from storage:', error);
      return [];
    }
  }

  /**
   * Save items for a list to local storage
   */
  static async saveListItems(listId: string, items: StoredItem[]): Promise<void> {
    try {
      const key = `${KEYS.ITEMS_PREFIX}${listId}`;
      await AsyncStorage.setItem(key, JSON.stringify(items));
      Logger.log('Items saved to local storage:', items.length);
    } catch (error) {
      Logger.error('Error saving items to storage:', error);
      throw error;
    }
  }

  /**
   * Add or update a single item in local storage
   */
  static async upsertItem(listId: string, item: StoredItem): Promise<void> {
    try {
      const items = await this.getListItems(listId);
      const existingIndex = items.findIndex(i => i.id === item.id);

      if (existingIndex >= 0) {
        items[existingIndex] = item;
      } else {
        items.push(item);
      }

      await this.saveListItems(listId, items);
    } catch (error) {
      Logger.error('Error upserting item:', error);
      throw error;
    }
  }

  /**
   * Delete an item from local storage (soft delete)
   */
  static async deleteItem(listId: string, itemId: string): Promise<void> {
    try {
      const items = await this.getListItems(listId);
      const itemIndex = items.findIndex(i => i.id === itemId);

      if (itemIndex >= 0) {
        items[itemIndex].isDeleted = true;
        items[itemIndex].locallyDeleted = true;
        items[itemIndex].pendingSync = true;
        await this.saveListItems(listId, items);
      }
    } catch (error) {
      Logger.error('Error deleting item from storage:', error);
      throw error;
    }
  }

  /**
   * Get last sync timestamp for a list
   */
  static async getLastSync(listId: string): Promise<string | null> {
    try {
      const key = `${KEYS.LAST_SYNC}${listId}`;
      return await AsyncStorage.getItem(key);
    } catch (error) {
      Logger.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Set last sync timestamp for a list
   */
  static async setLastSync(listId: string, timestamp: string): Promise<void> {
    try {
      const key = `${KEYS.LAST_SYNC}${listId}`;
      await AsyncStorage.setItem(key, timestamp);
    } catch (error) {
      Logger.error('Error setting last sync time:', error);
    }
  }

  /**
   * Clear all local data for a list
   */
  static async clearListData(listId: string): Promise<void> {
    try {
      const itemsKey = `${KEYS.ITEMS_PREFIX}${listId}`;
      const syncKey = `${KEYS.LAST_SYNC}${listId}`;

      await AsyncStorage.multiRemove([itemsKey, syncKey]);
      Logger.log('Cleared local data for list:', listId);
    } catch (error) {
      Logger.error('Error clearing list data:', error);
    }
  }

  /**
   * Get items pending sync
   */
  static async getItemsPendingSync(listId: string): Promise<StoredItem[]> {
    try {
      const items = await this.getListItems(listId);
      return items.filter(item => item.pendingSync);
    } catch (error) {
      Logger.error('Error getting pending items:', error);
      return [];
    }
  }

  /**
   * Mark item as synced
   */
  static async markItemSynced(listId: string, itemId: string): Promise<void> {
    try {
      const items = await this.getListItems(listId);
      const item = items.find(i => i.id === itemId);

      if (item) {
        item.pendingSync = false;
        item.locallyCreated = false;
        item.locallyModified = false;
        item.locallyDeleted = false;
        await this.saveListItems(listId, items);
      }
    } catch (error) {
      Logger.error('Error marking item as synced:', error);
    }
  }

  /**
   * Clear all data (for logout)
   */
  static async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key =>
        key.startsWith(KEYS.ITEMS_PREFIX) ||
        key.startsWith(KEYS.LAST_SYNC) ||
        key === KEYS.PENDING_OPERATIONS
      );

      await AsyncStorage.multiRemove(appKeys);
      Logger.log('Cleared all local data');
    } catch (error) {
      Logger.error('Error clearing all data:', error);
    }
  }
}
