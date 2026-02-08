import { supabase } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import Logger from '../../utils/logger';

type Item = Database['public']['Tables']['items']['Row'];

export type ItemChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface ItemChange {
  type: ItemChangeType;
  item: Item;
  old?: Item;
}

export type ItemChangeHandler = (change: ItemChange) => void;

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to real-time changes for a list's items
   */
  static subscribeToListItems(
    listId: string,
    onChange: ItemChangeHandler
  ): RealtimeChannel {
    // Check if already subscribed
    const existingChannel = this.channels.get(listId);
    if (existingChannel) {
      Logger.log('Already subscribed to list:', listId);
      return existingChannel;
    }

    // Create a new channel
    const channel = supabase
      .channel(`list-items-${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          Logger.log('Real-time INSERT:', payload.new);
          onChange({
            type: 'INSERT',
            item: payload.new as Item,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          Logger.log('Real-time UPDATE:', payload.new);
          onChange({
            type: 'UPDATE',
            item: payload.new as Item,
            old: payload.old as Item,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          Logger.log('Real-time DELETE:', payload.old);
          onChange({
            type: 'DELETE',
            item: payload.old as Item,
          });
        }
      )
      .subscribe((status) => {
        Logger.log('Subscription status:', status);
      });

    this.channels.set(listId, channel);
    return channel;
  }

  /**
   * Unsubscribe from a list's items
   */
  static unsubscribeFromListItems(listId: string): void {
    const channel = this.channels.get(listId);

    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(listId);
      Logger.log('Unsubscribed from list:', listId);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    this.channels.forEach((channel, listId) => {
      supabase.removeChannel(channel);
      Logger.log('Unsubscribed from list:', listId);
    });
    this.channels.clear();
  }

  /**
   * Get active subscriptions count
   */
  static getActiveSubscriptionsCount(): number {
    return this.channels.size;
  }
}
