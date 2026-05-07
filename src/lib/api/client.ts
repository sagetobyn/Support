/**
 * Typed API client for all /api/v1/* endpoints.
 * Use this on the client side (browser) for data fetching.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

function get<T>(path: string) {
  return apiFetch<T>(path)
}

function post<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

function patch<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
}

// ─── Brand ────────────────────────────────────────────────────────────────────

export const brandApi = {
  get: () => get<{ brand: ApiTypes.Brand }>('/brand'),
  update: (name: string) => patch<{ brand: ApiTypes.Brand }>('/brand', { name }),
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  list: () => get<{ orders: ApiTypes.Order[] }>('/orders'),
  getById: (id: string) => get<{ order: ApiTypes.Order }>(`/orders/${id}`),
  update: (id: string, data: Partial<ApiTypes.OrderUpdate>) =>
    patch<{ order: ApiTypes.Order }>(`/orders/${id}`, data),
  import: (orders: ApiTypes.OrderImportRow[]) =>
    post<{ success: boolean; count: number }>('/orders/import', { orders }),
}

// ─── NDR Cases ────────────────────────────────────────────────────────────────

export const ndrApi = {
  list: () => get<{ cases: ApiTypes.NdrCase[] }>('/ndr'),
  getById: (id: string) => get<{ case: ApiTypes.NdrCase }>(`/ndr/${id}`),
  create: (data: ApiTypes.NdrCaseCreate) => post<{ case: ApiTypes.NdrCase }>('/ndr', data),
  updateStatus: (id: string, status: string) =>
    patch<{ case: ApiTypes.NdrCase }>(`/ndr/${id}`, { status }),
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export const actionsApi = {
  list: (filters?: { orderId?: string; ndrCaseId?: string }) => {
    const params = new URLSearchParams()
    if (filters?.orderId) params.set('orderId', filters.orderId)
    if (filters?.ndrCaseId) params.set('ndrCaseId', filters.ndrCaseId)
    const qs = params.toString()
    return get<{ actions: ApiTypes.Action[] }>(`/actions${qs ? `?${qs}` : ''}`)
  },
  getById: (id: string) => get<{ action: ApiTypes.Action }>(`/actions/${id}`),
  create: (data: ApiTypes.ActionCreate) => post<{ action: ApiTypes.Action }>('/actions', data),
  updateStatus: (id: string, status: string) =>
    patch<{ action: ApiTypes.Action }>(`/actions/${id}`, { status }),
}

// ─── Savings ──────────────────────────────────────────────────────────────────

export const savingsApi = {
  get: () => get<{ events: ApiTypes.SavingsEvent[]; total: number; breakdown: ApiTypes.SavingsBreakdown[] }>('/savings'),
  record: (data: ApiTypes.SavingsEventCreate) =>
    post<{ event: ApiTypes.SavingsEvent }>('/savings', data),
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export const auditApi = {
  list: (limit?: number) =>
    get<{ logs: ApiTypes.AuditLog[] }>(`/audit${limit ? `?limit=${limit}` : ''}`),
  log: (data: ApiTypes.AuditLogCreate) => post<{ log: ApiTypes.AuditLog }>('/audit', data),
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  me: () => get<{ user: ApiTypes.UserProfile }>('/users/me'),
  onboard: (brandName: string) =>
    post<{ user: ApiTypes.UserProfile; alreadyOnboarded?: boolean }>('/users/me', { brandName }),
}

// ─── Types ────────────────────────────────────────────────────────────────────

export namespace ApiTypes {
  export interface Brand {
    id: string
    name: string
    createdAt: string
    updatedAt: string
  }

  export interface Order {
    id: string
    brandId: string
    orderId: string
    awb: string | null
    customerPhone: string | null
    status: string
    riskScore: number | null
    riskLevel: string | null
    codAmount: number | null
    paymentMode: string | null
    createdAt: string
    updatedAt: string
  }

  export interface OrderUpdate {
    status: string
    awb: string | null
    customerPhone: string | null
    riskScore: number | null
    riskLevel: string | null
    codAmount: number | null
    paymentMode: string | null
  }

  export interface OrderImportRow {
    orderId: string
    awb?: string | null
    customerPhone?: string | null
    status: string
    riskScore?: number | null
    riskLevel?: string | null
    codAmount?: number | null
    paymentMode?: string | null
  }

  export interface NdrCase {
    id: string
    brandId: string
    orderId: string
    reason: string
    status: string
    createdAt: string
    updatedAt: string
    order?: Order
  }

  export interface NdrCaseCreate {
    orderId: string
    reason: string
    status?: string
  }

  export interface Action {
    id: string
    brandId: string
    orderId: string | null
    ndrCaseId: string | null
    type: string
    status: string
    createdAt: string
    updatedAt: string
  }

  export interface ActionCreate {
    type: string
    status?: string
    orderId?: string | null
    ndrCaseId?: string | null
  }

  export interface SavingsEvent {
    id: string
    brandId: string
    type: string
    amount: number
    status: string
    createdAt: string
  }

  export interface SavingsEventCreate {
    type: string
    amount: number
    status?: 'estimated' | 'confirmed'
  }

  export interface SavingsBreakdown {
    type: string
    _sum: { amount: number | null }
    _count: { id: number }
  }

  export interface AuditLog {
    id: string
    brandId: string
    userId: string | null
    action: string
    targetId: string | null
    details: Record<string, unknown> | null
    createdAt: string
    user?: { email: string; role: string } | null
  }

  export interface AuditLogCreate {
    action: string
    targetId?: string | null
    details?: Record<string, unknown> | null
  }

  export interface UserProfile {
    id: string
    brandId: string
    email: string
    role: string
    createdAt: string
    updatedAt: string
    brand?: Brand
  }
}
