'use client'

import { useCallback, useEffect, useState } from 'react'
import { ordersApi, ndrApi, actionsApi, savingsApi, brandApi, usersApi, type ApiTypes } from './client'

export interface AppData {
  brand: ApiTypes.Brand | null
  user: ApiTypes.UserProfile | null
  orders: ApiTypes.Order[]
  ndrCases: ApiTypes.NdrCase[]
  actions: ApiTypes.Action[]
  savings: { events: ApiTypes.SavingsEvent[]; total: number; breakdown: ApiTypes.SavingsBreakdown[] }
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useAppData(): AppData {
  const [brand, setBrand] = useState<ApiTypes.Brand | null>(null)
  const [user, setUser] = useState<ApiTypes.UserProfile | null>(null)
  const [orders, setOrders] = useState<ApiTypes.Order[]>([])
  const [ndrCases, setNdrCases] = useState<ApiTypes.NdrCase[]>([])
  const [actions, setActions] = useState<ApiTypes.Action[]>([])
  const [savings, setSavings] = useState<AppData['savings']>({ events: [], total: 0, breakdown: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [userRes, brandRes, ordersRes, ndrRes, actionsRes, savingsRes] = await Promise.allSettled([
        usersApi.me(),
        brandApi.get(),
        ordersApi.list(),
        ndrApi.list(),
        actionsApi.list(),
        savingsApi.get(),
      ])

      if (userRes.status === 'fulfilled') setUser(userRes.value.user)
      if (brandRes.status === 'fulfilled') setBrand(brandRes.value.brand)
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders)
      if (ndrRes.status === 'fulfilled') setNdrCases(ndrRes.value.cases)
      if (actionsRes.status === 'fulfilled') setActions(actionsRes.value.actions)
      if (savingsRes.status === 'fulfilled') setSavings(savingsRes.value)

      // Surface first settled error
      const firstError = [userRes, brandRes, ordersRes, ndrRes, actionsRes, savingsRes]
        .find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
      if (firstError) setError(firstError.reason?.message ?? 'Failed to load some data')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { brand, user, orders, ndrCases, actions, savings, loading, error, refresh: load }
}
