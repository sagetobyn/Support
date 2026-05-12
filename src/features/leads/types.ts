import type { SellerCategory, ShippingPlatform } from "@/lib/calculator";
import type { LeadQualificationStage } from "./qualification.service";

export interface LeadQualificationSnapshot {
  stage: LeadQualificationStage;
  score: number;
  title: string;
  nextStep: string;
}

export interface CalculatorLeadAssumptionsSnapshot {
  monthlyLeakage: number;
  dailyLeakage: number;
  rtoLossPerOrder: number;
  savingAt10: number;
  savingAt20: number;
  savingAt30: number;
  pilotSoftwareCost: number;
  targetRtoReductionPercentage: number;
  grossMarginPercentage: number;
  forwardShippingCost: number;
  returnShippingCost: number;
  packagingCost: number;
  estimatedCac: number;
  codFee: number;
  supportOpsCost: number;
  formulaBasis: string;
}

export interface CalculatorLeadConsentSnapshot {
  summaryOnly: boolean;
  noCustomerLevelData: boolean;
  consentFlag: boolean;
  capturedAt: string;
  statement: string;
}

export interface CalculatorLead {
  id: string;
  brandName: string;
  contactName: string;
  category: SellerCategory;
  monthlyOrders: number;
  codPercentage: number;
  rtoPercentage: number;
  averageOrderValue: number;
  shippingPlatform: ShippingPlatform;
  contact: string;
  notes: string;
  consent: boolean;
  assumptions?: CalculatorLeadAssumptionsSnapshot;
  privacyConsent?: CalculatorLeadConsentSnapshot;
  qualification?: LeadQualificationSnapshot;
  createdAt: string;
}
