import type { Item } from '../types/models';
import Logger from '../utils/logger';
import { supabase } from './supabase/client';

export class EmailService {
  static async sendBoughtList(
    toEmail: string,
    listName: string,
    items: Item[],
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          toEmail,
          listName,
          items: items.map(item => ({ text: item.text, quantity: item.quantity })),
        },
      });

      if (error) {
        Logger.error('Edge Function error:', error);
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }

      Logger.log(`Bought list email sent to ${toEmail}`);
      return { error: null };
    } catch (error) {
      Logger.error('Failed to send bought list email:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}
