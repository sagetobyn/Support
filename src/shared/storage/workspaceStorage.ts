import { defaultBrand } from "@/data/seed";
import type {
  ActionItem,
  AuditLog,
  BrandSettings,
  CustomerResponse,
  ImportRecord,
  Message,
  NdrCase,
  Order,
  PolicyRecommendation,
  PolicySimulation,
  SavingsEvent,
  Store,
  WeeklyReport,
  MonthlyStrategyReport,
} from "@/types/domain";
import type { PlanId } from "@/features/plans";

export const storageVersion = "starter_v1";
export const workspaceStorageKey = `rtoshield:${storageVersion}`;
export const legacyStorageKey = "rtoshield:v0.2";

export interface StarterWorkspaceState {
  storageVersion: typeof storageVersion;
  currentPlan: PlanId;
  brand: BrandSettings;
  orders: Order[];
  ndrCases: NdrCase[];
  messages: Message[];
  responses: CustomerResponse[];
  savingsEvents: SavingsEvent[];
  actions: ActionItem[];
  audits: AuditLog[];
  imports: ImportRecord[];
  stores?: Store[];
  policyRecommendations?: PolicyRecommendation[];
  weeklyReports?: WeeklyReport[];
  monthlyStrategyReports?: MonthlyStrategyReport[];
  policySimulations?: PolicySimulation[];
  exports?: Array<Record<string, unknown>>;
  overLimit?: boolean;
  migrationWarning?: string;
}

export function emptyStarterWorkspace(): StarterWorkspaceState {
  return {
    storageVersion,
    currentPlan: "starter",
    brand: { ...defaultBrand, softwareCost: 2999, monthlyOrderLimit: 500 },
    orders: [],
    ndrCases: [],
    messages: [],
    responses: [],
    savingsEvents: [],
    actions: [],
    audits: [],
    imports: []
  };
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadWorkspaceState(fallback: StarterWorkspaceState = emptyStarterWorkspace()) {
  if (!canUseLocalStorage()) return fallback;
  try {
    const current = window.localStorage.getItem(workspaceStorageKey);
    if (current) return { ...fallback, ...(JSON.parse(current) as Partial<StarterWorkspaceState>), storageVersion };

    const legacy = window.localStorage.getItem(legacyStorageKey);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<StarterWorkspaceState>;
      return {
        ...fallback,
        ...parsed,
        storageVersion,
        currentPlan: "starter" as const,
        brand: { ...fallback.brand, ...parsed.brand, softwareCost: 2999, monthlyOrderLimit: 500 },
        migrationWarning: "Migrated local demo workspace from v0.2 to Starter storage."
      };
    }
  } catch {
    return { ...fallback, migrationWarning: "Could not read saved workspace, using a clean Starter workspace." };
  }
  return fallback;
}

export function saveWorkspaceState(state: StarterWorkspaceState) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(workspaceStorageKey, JSON.stringify({ ...state, storageVersion }));
}

export function exportWorkspaceBackup(state: StarterWorkspaceState) {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function importWorkspaceBackup(json: string) {
  const parsed = JSON.parse(json) as StarterWorkspaceState;
  return { ...emptyStarterWorkspace(), ...parsed, storageVersion, currentPlan: "starter" as const };
}

export function clearWorkspaceState() {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(workspaceStorageKey);
}
