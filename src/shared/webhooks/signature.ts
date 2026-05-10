import { createHmac } from 'node:crypto';

export function createWebhookTimestamp(): string {
  return new Date().toISOString();
}

type CreateSignatureArgs = {
  secret: string;
  payload: string;
  timestamp?: string;
};

export function createWebhookSignature({
  secret,
  payload,
  timestamp,
}: CreateSignatureArgs): string {
  const ts = timestamp ?? createWebhookTimestamp();
  const hex = createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex');
  return `sha256=${hex}`;
}
