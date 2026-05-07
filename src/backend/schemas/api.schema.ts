import { z } from 'zod'

// ─── Orders ────────────────────────────────────────────────────────────────

export const orderImportSchema = z.object({
  orders: z.array(
    z.object({
      orderId: z.string(),
      awb: z.string().optional().nullable(),
      customerPhone: z.string().optional().nullable(),
      status: z.string(),
      riskScore: z.number().optional().nullable(),
      riskLevel: z.string().optional().nullable(),
      codAmount: z.number().optional().nullable(),
      paymentMode: z.string().optional().nullable(),
    })
  )
})

export const orderUpdateSchema = z.object({
  status: z.string().optional(),
  riskScore: z.number().optional().nullable(),
  riskLevel: z.string().optional().nullable(),
  awb: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  codAmount: z.number().optional().nullable(),
  paymentMode: z.string().optional().nullable(),
})

// ─── NDR Cases ─────────────────────────────────────────────────────────────

export const ndrCaseCreateSchema = z.object({
  orderId: z.string(),
  reason: z.string(),
  status: z.string().default('open'),
})

export const ndrCaseUpdateSchema = z.object({
  status: z.string(),
})

// ─── Actions ───────────────────────────────────────────────────────────────

export const actionCreateSchema = z.object({
  type: z.string(),
  status: z.string().default('pending'),
  orderId: z.string().optional().nullable(),
  ndrCaseId: z.string().optional().nullable(),
})

export const actionUpdateSchema = z.object({
  status: z.string(),
})

// ─── Savings Events ────────────────────────────────────────────────────────

export const savingsEventCreateSchema = z.object({
  type: z.string(),
  amount: z.number().positive(),
  status: z.enum(['estimated', 'confirmed']).default('estimated'),
})

// ─── Audit Logs ────────────────────────────────────────────────────────────

export const auditLogCreateSchema = z.object({
  action: z.string(),
  targetId: z.string().optional().nullable(),
  details: z.record(z.unknown()).optional().nullable(),
})

// ─── Brand ─────────────────────────────────────────────────────────────────

export const brandUpdateSchema = z.object({
  name: z.string().min(1).max(100),
})

// ─── Onboarding ────────────────────────────────────────────────────────────

export const onboardSchema = z.object({
  brandName: z.string().min(1).max(100),
})
