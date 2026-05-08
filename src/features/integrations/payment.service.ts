import type { IntegrationCredentials, PaymentLinkRequest, PaymentLinkResult, PaymentType } from "./types";
import { IntegrationRepository } from "./integration.repository";
import { getPaymentAdapter } from "./payment-adapters/index";

const integrationRepo = new IntegrationRepository();

// Creates a real prepaid payment link via the seller's connected payment provider.
// Used to convert risky COD orders to prepaid (Razorpay/Cashfree).
export async function createPaymentLink(params: {
  brandId: string;
  integrationId: string;
  request: PaymentLinkRequest;
}): Promise<PaymentLinkResult> {
  const integration = await integrationRepo.getById(params.brandId, params.integrationId);
  if (!integration) return { ok: false, error: "Payment integration not found" };

  const adapter = getPaymentAdapter(integration.type as PaymentType);
  if (!adapter) return { ok: false, error: `No payment adapter for type "${integration.type}"` };

  const credentials: IntegrationCredentials | null = await integrationRepo.getCredentials(params.brandId, params.integrationId);
  if (!credentials) return { ok: false, error: "Credentials missing" };

  try {
    const result = await adapter.createPaymentLink(credentials, params.request);
    if (result.updatedCredentials) {
      await integrationRepo.updateStatus(params.brandId, params.integrationId, { credentials: result.updatedCredentials });
    }
    return result;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
