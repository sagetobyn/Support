import type { DispatchResult, IntegrationCredentials, MessageDispatch, MessagingType } from "./types";
import { IntegrationRepository } from "./integration.repository";
import { getMessagingAdapter } from "./messaging-adapters/index";

const integrationRepo = new IntegrationRepository();

// Dispatches an outbound message via a connected messaging integration.
// Increments sentCount on success; surfaces auth errors clearly.
export async function dispatchMessage(params: {
  brandId: string;
  integrationId: string;
  message: MessageDispatch;
}): Promise<DispatchResult> {
  const integration = await integrationRepo.getById(params.brandId, params.integrationId);
  if (!integration) return { ok: false, status: "failed", error: "Integration not found" };

  const adapter = getMessagingAdapter(integration.type as MessagingType);
  if (!adapter) return { ok: false, status: "failed", error: `No messaging adapter registered for type "${integration.type}"` };

  const credentials: IntegrationCredentials | null = await integrationRepo.getCredentials(params.brandId, params.integrationId);
  if (!credentials) return { ok: false, status: "failed", error: "Credentials missing" };

  let result: DispatchResult;
  try {
    result = await adapter.sendMessage(credentials, params.message);
  } catch (err) {
    return { ok: false, status: "failed", error: err instanceof Error ? err.message : String(err) };
  }

  // Persist any refreshed credentials and bump the sent counter
  if (result.ok || result.updatedCredentials) {
    await integrationRepo.updateStatus(params.brandId, params.integrationId, {
      ...(result.updatedCredentials && { credentials: result.updatedCredentials }),
      ...(result.ok && { lastSyncAt: new Date(), lastSyncStatus: "ok", lastSyncError: null }),
      ...(!result.ok && { lastSyncStatus: "error", lastSyncError: result.error ?? "Send failed" }),
    });
  }

  return result;
}
