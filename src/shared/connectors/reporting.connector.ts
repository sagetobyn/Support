import type { BrandSettings, Order, PolicyRecommendation, SavingsEvent } from "@/types/domain";
import { generateWeeklyFounderReport } from "@/features/weekly-report";
import { generateMonthlyStrategyReport } from "@/features/monthly-strategy";

export function runReportingConnector(brand: BrandSettings, orders: Order[], savingsEvents: SavingsEvent[], policies: PolicyRecommendation[] = []) {
  return {
    weekly: generateWeeklyFounderReport({ brand, orders, savingsEvents, policies }),
    monthly: generateMonthlyStrategyReport({ brand, orders, savingsEvents, policies })
  };
}
