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
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          toEmail,
          listName,
          items: items.map(item => ({ text: item.text, quantity: item.quantity })),
        },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (error) {
        let message = 'Failed to send email. Please try again.';
        try {
          const body = await (error as any).context?.json?.();
          if (body?.error) {
            message = body.error;
          }
        } catch (_) {}
        Logger.error('Send email error:', message);
        return { error: new Error(message) };
      }

      return { error: null };
    } catch (error) {
      Logger.error('Failed to send bought list email:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}
