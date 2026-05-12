import { buildCalculatorLeadCsv, createCalculatorLeadConsentSnapshot, type CalculatorLead } from "@/features/leads";

export type { CalculatorLead };

export const calculatorLeadStorageKey = "wembro:calculator-leads";
export const previousCalculatorLeadStorageKey = "rtoshield:calculator-leads";

function readStorage(storage: Storage, key: string) {
  try {
    return JSON.parse(storage.getItem(key) || "[]") as CalculatorLead[];
  } catch {
    return [];
  }
}

export function listCalculatorLeads(storage?: Storage) {
  if (!storage) return [];
  const current = readStorage(storage, calculatorLeadStorageKey);
  return current.length ? current : readStorage(storage, previousCalculatorLeadStorageKey);
}

export function saveCalculatorLead(lead: Omit<CalculatorLead, "id" | "createdAt">, storage?: Storage) {
  if (!storage) throw new Error("Storage is required to save calculator leads.");
  const createdAt = new Date().toISOString();
  const record: CalculatorLead = {
    ...lead,
    privacyConsent: lead.privacyConsent ?? createCalculatorLeadConsentSnapshot(lead.consent, createdAt),
    id: `lead-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    createdAt
  };
  const next = [record, ...listCalculatorLeads(storage)];
  storage.setItem(calculatorLeadStorageKey, JSON.stringify(next));
  return record;
}

export function deleteLead(id: string, storage?: Storage) {
  if (!storage) return [];
  const next = listCalculatorLeads(storage).filter((lead) => lead.id !== id);
  storage.setItem(calculatorLeadStorageKey, JSON.stringify(next));
  return next;
}

export function exportLeadsCsv(leads: CalculatorLead[]) {
  return buildCalculatorLeadCsv(leads);
}
