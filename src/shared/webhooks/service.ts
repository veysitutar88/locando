import 'server-only';
import { NotFoundError } from '@/shared/db/errors';
import { webhookConfigsRepo } from '@/shared/db/webhook-configs-repo';
import { webhookDeliveriesRepo } from '@/shared/db/webhook-deliveries-repo';
import {
  type WebhookEventType,
  type WebhookPayload,
} from './events';
import { getNextAttemptAt, WEBHOOK_MAX_ATTEMPTS } from './retry';
import {
  createWebhookSignature,
  createWebhookTimestamp,
} from './signature';

type FetchImpl = typeof fetch;

function getDefaultFetch(): FetchImpl {
  return globalThis.fetch.bind(globalThis);
}

type EnqueueArgs = {
  tenantId: string;
  eventType: WebhookEventType;
  data: Record<string, unknown>;
};

export async function enqueueWebhookEvent(args: EnqueueArgs): Promise<number> {
  const configs = await webhookConfigsRepo.findEnabledByTenant(args.tenantId);
  if (configs.length === 0) return 0;

  const payload: WebhookPayload = {
    tenantId: args.tenantId,
    eventType: args.eventType,
    occurredAt: new Date().toISOString(),
    data: args.data,
  };

  for (const config of configs) {
    await webhookDeliveriesRepo.create(args.tenantId, {
      webhookConfigId: config.id,
      eventType: args.eventType,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: WEBHOOK_MAX_ATTEMPTS,
      nextAttemptAt: new Date(),
    });
  }

  return configs.length;
}

type DeliverOutcome = 'delivered' | 'pending_retry' | 'failed';

type DeliverArgs = {
  tenantId: string;
  deliveryId: string;
  fetchImpl?: FetchImpl;
};

export async function deliverWebhookDelivery(
  args: DeliverArgs,
): Promise<DeliverOutcome> {
  const fetchImpl = args.fetchImpl ?? getDefaultFetch();

  const delivery = await webhookDeliveriesRepo.findById(
    args.tenantId,
    args.deliveryId,
  );
  if (!delivery) throw new NotFoundError('webhook_delivery', args.deliveryId);

  if (delivery.status !== 'pending') {
    return delivery.status === 'delivered' ? 'delivered' : 'failed';
  }

  if (!delivery.webhookConfigId) {
    await webhookDeliveriesRepo.markFailed(args.tenantId, delivery.id, {
      error: 'Webhook config missing or disabled',
      nextAttemptAt: null,
    });
    return 'failed';
  }

  const config = await webhookConfigsRepo.findById(
    args.tenantId,
    delivery.webhookConfigId,
  );
  if (!config || !config.enabled) {
    await webhookDeliveriesRepo.markFailed(args.tenantId, delivery.id, {
      error: 'Webhook config missing or disabled',
      nextAttemptAt: null,
    });
    return 'failed';
  }

  // payload was created by enqueueWebhookEvent as WebhookPayload; jsonb
  // round-trips it as `unknown` — we trust the shape we wrote.
  const body = JSON.stringify(delivery.payload);
  const timestamp = createWebhookTimestamp();
  const signature = createWebhookSignature({
    secret: config.signingSecret,
    payload: body,
    timestamp,
  });

  let response: Response | undefined;
  try {
    response = await fetchImpl(config.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-locando-event': delivery.eventType,
        'x-locando-delivery-id': delivery.id,
        'x-locando-signature': signature,
        'x-locando-timestamp': timestamp,
      },
      body,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown webhook delivery error';
    const next = getNextAttemptAt(delivery.attempts + 1);
    await webhookDeliveriesRepo.markFailed(args.tenantId, delivery.id, {
      error: message,
      nextAttemptAt: next,
    });
    return next ? 'pending_retry' : 'failed';
  }

  if (response.ok) {
    await webhookDeliveriesRepo.markDelivered(
      args.tenantId,
      delivery.id,
      response.status,
    );
    return 'delivered';
  }

  const next = getNextAttemptAt(delivery.attempts + 1);
  await webhookDeliveriesRepo.markFailed(args.tenantId, delivery.id, {
    error: `HTTP ${response.status}`,
    responseStatus: response.status,
    nextAttemptAt: next,
  });
  return next ? 'pending_retry' : 'failed';
}

type DeliverPendingArgs = {
  limit?: number;
  fetchImpl?: FetchImpl;
};

type DeliverPendingResult = {
  delivered: number;
  pendingRetry: number;
  failed: number;
};

export async function deliverPendingWebhooks(
  args: DeliverPendingArgs = {},
): Promise<DeliverPendingResult> {
  const due = await webhookDeliveriesRepo.findPendingDue(args.limit);
  const result: DeliverPendingResult = {
    delivered: 0,
    pendingRetry: 0,
    failed: 0,
  };

  for (const delivery of due) {
    const outcome = await deliverWebhookDelivery({
      tenantId: delivery.tenantId,
      deliveryId: delivery.id,
      fetchImpl: args.fetchImpl,
    });
    if (outcome === 'delivered') result.delivered += 1;
    else if (outcome === 'pending_retry') result.pendingRetry += 1;
    else result.failed += 1;
  }

  return result;
}
