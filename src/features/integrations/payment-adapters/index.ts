import type { PaymentAdapter, PaymentType } from "../types";
import { RazorpayAdapter } from "./razorpay.adapter";
import { CashfreeAdapter } from "./cashfree.adapter";

const paymentRegistry: Partial<Record<PaymentType, PaymentAdapter>> = {
  razorpay: new RazorpayAdapter(),
  cashfree: new CashfreeAdapter(),
};

export function getPaymentAdapter(type: PaymentType): PaymentAdapter | undefined {
  return paymentRegistry[type];
}

export { RazorpayAdapter, CashfreeAdapter };
