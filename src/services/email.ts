import type { Item } from '../types/models';
import Logger from '../utils/logger';

const BREVO_API_URL = process.env.EXPO_PUBLIC_BREVO_API_URL ?? 'https://api.brevo.com/v3/smtp/email';
const API_KEY = process.env.EXPO_PUBLIC_BREVO_API_KEY ?? '';
const SENDER_EMAIL = process.env.EXPO_PUBLIC_BREVO_SENDER_EMAIL ?? '';
const SENDER_NAME = process.env.EXPO_PUBLIC_BREVO_SENDER_NAME ?? 'Shopping List';

export class EmailService {
  static async sendBoughtList(
    toEmail: string,
    listName: string,
    items: Item[],
  ): Promise<{ error: Error | null }> {
    try {
      if (!API_KEY || !SENDER_EMAIL) {
        return { error: new Error('Email service not configured. Check BREVO env variables.') };
      }

      const date = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const textContent = [
        `Shopping List: ${listName}`,
        `Date: ${date}`,
        '',
        ...items.map(item => {
          const qty = item.quantity ? ` (${item.quantity})` : '';
          return `✓ ${item.text}${qty}`;
        }),
        '',
        'Sent from Shopping List app',
      ].join('\n');

      const itemsHtml = items
        .map(item => {
          const qty = item.quantity
            ? ` <span style="color:#888;font-size:0.9em;">(${item.quantity})</span>`
            : '';
          return `<li style="padding:8px 0;border-bottom:1px solid #eee;list-style:none;">
            <span style="color:#8B8C3C;margin-right:8px;">✓</span>${item.text}${qty}
          </li>`;
        })
        .join('');

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
</head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;">
  <h2 style="color:#C07A30;margin-bottom:4px;">${listName}</h2>
  <p style="color:#888;margin-top:0;">${date}</p>
  <ul style="padding:0;margin:16px 0;">
    ${itemsHtml}
  </ul>
  <p style="margin-top:24px;color:#aaa;font-size:0.8em;">Sent from Shopping List app</p>
</body>
</html>`;

      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: SENDER_EMAIL },
          to: [{ email: toEmail }],
          subject: `Shopping List: ${listName}`,
          textContent,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Logger.error('Brevo API error:', errorData);
        return { error: new Error((errorData as any).message ?? `HTTP ${response.status}`) };
      }

      Logger.log(`Bought list email sent to ${toEmail}`);
      return { error: null };
    } catch (error) {
      Logger.error('Failed to send bought list email:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}
