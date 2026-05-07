import { useState, useEffect, useCallback } from 'react'
import type { Tender } from '../types'
import { getTenders, getTender, createTender } from '../api/client'

export function useTenders() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTenders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTenders()
      setTenders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTenders()
  }, [fetchTenders])

  const create = async (data: { title: string; department: string; category: string }) => {
    const tender = await createTender(data)
    setTenders((prev) => [tender, ...prev])
    return tender
  }

  return { tenders, loading, error, refetch: fetchTenders, create }
}

export function useTender(id: string | undefined) {
  const [tender, setTender] = useState<Tender | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTender = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getTender(id)
      setTender(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tender')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTender()
  }, [fetchTender])

  return { tender, loading, error, refetch: fetchTender }
}
