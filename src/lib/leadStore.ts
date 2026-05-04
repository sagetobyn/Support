import type { SellerCategory, ShippingPlatform } from "@/lib/calculator";

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
  createdAt: string;
}

export const calculatorLeadStorageKey = "rtoshield:calculator-leads";

function readStorage(storage: Storage, key: string) {
  try {
    return JSON.parse(storage.getItem(key) || "[]") as CalculatorLead[];
  } catch {
    return [];
  }
}

export function listCalculatorLeads(storage?: Storage) {
  if (!storage) return [];
  return readStorage(storage, calculatorLeadStorageKey);
}

export function saveCalculatorLead(lead: Omit<CalculatorLead, "id" | "createdAt">, storage?: Storage) {
  if (!storage) throw new Error("Storage is required to save calculator leads.");
  const record: CalculatorLead = {
    ...lead,
    id: `lead-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    createdAt: new Date().toISOString()
  };
  const next = [record, ...readStorage(storage, calculatorLeadStorageKey)];
  storage.setItem(calculatorLeadStorageKey, JSON.stringify(next));
  return record;
}

export function deleteLead(id: string, storage?: Storage) {
  if (!storage) return [];
  const next = readStorage(storage, calculatorLeadStorageKey).filter((lead) => lead.id !== id);
  storage.setItem(calculatorLeadStorageKey, JSON.stringify(next));
  return next;
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

export function exportLeadsCsv(leads: CalculatorLead[]) {
  const headers: Array<keyof CalculatorLead> = [
    "id",
    "brandName",
    "contactName",
    "category",
    "monthlyOrders",
    "codPercentage",
    "rtoPercentage",
    "averageOrderValue",
    "shippingPlatform",
    "contact",
    "notes",
    "consent",
    "createdAt"
  ];
  return [headers.join(","), ...leads.map((lead) => headers.map((key) => csvEscape(lead[key])).join(","))].join("\n");
}
