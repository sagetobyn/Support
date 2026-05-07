import { z } from 'zod'

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

export const ndrCaseCreateSchema = z.object({
  orderId: z.string(),
  reason: z.string(),
  status: z.string().default('open'),
})

export const ndrCaseUpdateSchema = z.object({
  status: z.string(),
})
