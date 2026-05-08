import type { IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, SyncResult } from "./types";
import { IntegrationRepository } from "./integration.repository";
import { OrderRepository } from "@/backend/repositories/order.repository";

const integrationRepo = new IntegrationRepository();
const orderRepo = new OrderRepository();

// Convert adapter output to the shape OrderRepository.batchUpsert expects.
function toOrderUpsert(brandId: string, input: IntegrationOrderInput) {
  return {
    orderId: input.orderId,
    awb: input.awb ?? null,
    customerPhone: input.phone ?? null,
    status: input.finalStatus ?? input.shipmentStatus ?? "unknown",
    codAmount: input.paymentMode === "COD" ? input.orderValue : null,
    paymentMode: input.paymentMode,
    riskScore: null,
    riskLevel: null,
    brand: { connect: { id: brandId } },
  };
}

export async function syncIntegration(params: {
  brandId: string;
  integrationId: string;
  adapter: IntegrationAdapter;
  since?: Date;
}): Promise<SyncResult> {
  const { brandId, integrationId, adapter, since } = params;
  const now = new Date();
  const errors: string[] = [];

  const credentials: IntegrationCredentials | null = await integrationRepo.getCredentials(brandId, integrationId);
  if (!credentials) {
    const error = "Integration not found or credentials missing.";
    await integrationRepo.updateStatus(brandId, integrationId, {
      lastSyncAt: now,
      lastSyncStatus: "error",
      lastSyncError: error,
      status: "error",
    });
    return { integrationId, ordersIngested: 0, ordersSkipped: 0, errors: [error], syncedAt: now.toISOString() };
  }

  let orders: IntegrationOrderInput[] = [];
  let updatedCredentials: IntegrationCredentials | undefined;
  try {
    const result = await adapter.fetchOrders(credentials, since);
    orders = result.orders;
    updatedCredentials = result.updatedCredentials;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    errors.push(`Fetch failed: ${error}`);
    await integrationRepo.updateStatus(brandId, integrationId, {
      lastSyncAt: now,
      lastSyncStatus: "error",
      lastSyncError: error,
      status: "error",
    });
    return { integrationId, ordersIngested: 0, ordersSkipped: 0, errors, syncedAt: now.toISOString() };
  }

  let ingested = 0;
  let skipped = 0;

  if (orders.length > 0) {
    try {
      const upsertRows = orders.map((o) => toOrderUpsert(brandId, o));
      await orderRepo.batchUpsert(brandId, upsertRows as Parameters<typeof orderRepo.batchUpsert>[1]);
      ingested = orders.length;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      errors.push(`Upsert failed: ${error}`);
      skipped = orders.length;
    }
  }

  const integration = await integrationRepo.getById(brandId, integrationId);
  const totalSynced = (integration?.syncedCount ?? 0) + ingested;

  await integrationRepo.updateStatus(brandId, integrationId, {
    lastSyncAt: now,
    lastSyncStatus: errors.length ? "error" : "ok",
    lastSyncError: errors.length ? errors.join("; ") : null,
    status: errors.length ? "error" : "active",
    syncedCount: totalSynced,
    ...(updatedCredentials && { credentials: updatedCredentials }),
  });

  return { integrationId, ordersIngested: ingested, ordersSkipped: skipped, errors, syncedAt: now.toISOString() };
}
