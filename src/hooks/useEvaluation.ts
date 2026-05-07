import { useState, useEffect, useCallback } from 'react'
import type { Evaluation, EvaluationSummary } from '../types'
import { getEvaluations, getSummary } from '../api/client'

export function useEvaluations(tenderId: string | undefined) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [summary, setSummary] = useState<EvaluationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvaluations = useCallback(async () => {
    if (!tenderId) return
    setLoading(true)
    setError(null)
    try {
      const [evals, sum] = await Promise.all([
        getEvaluations(tenderId),
        getSummary(tenderId),
      ])
      setEvaluations(evals)
      setSummary(sum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch evaluations')
    } finally {
      setLoading(false)
    }
  }, [tenderId])

  useEffect(() => {
    fetchEvaluations()
  }, [fetchEvaluations])

  return { evaluations, summary, loading, error, refetch: fetchEvaluations }
}

export function useEvaluationPolling(tenderId: string | undefined, intervalMs = 5000) {
  const { evaluations, summary, loading, error, refetch } = useEvaluations(tenderId)
  const [polling, setPolling] = useState(false)

  const startPolling = useCallback(() => setPolling(true), [])
  const stopPolling = useCallback(() => setPolling(false), [])

  useEffect(() => {
    if (!polling || !tenderId) return
    const interval = setInterval(refetch, intervalMs)
    return () => clearInterval(interval)
  }, [polling, tenderId, intervalMs, refetch])

  return { evaluations, summary, loading, error, refetch, polling, startPolling, stopPolling }
}
