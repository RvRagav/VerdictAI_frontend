import { useState, useEffect, useCallback } from 'react'
import type { HITLCardData } from '../types'
import { getHITLQueue, getHITLCard, submitDecision } from '../api/client'

interface HITLQueueItem {
  evaluation_id: string
  bidder: string
  criterion: string
  confidence: number
  route: string
  reason: string
}

export function useHITLQueue(tenderId: string | undefined) {
  const [queue, setQueue] = useState<HITLQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    if (!tenderId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getHITLQueue(tenderId)
      setQueue(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch HITL queue')
    } finally {
      setLoading(false)
    }
  }, [tenderId])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  return { queue, loading, error, refetch: fetchQueue }
}

export function useHITLCard(evaluationId: string | undefined) {
  const [card, setCard] = useState<HITLCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCard = useCallback(async () => {
    if (!evaluationId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getHITLCard(evaluationId)
      setCard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch HITL card')
    } finally {
      setLoading(false)
    }
  }, [evaluationId])

  useEffect(() => {
    fetchCard()
  }, [fetchCard])

  const decide = async (data: {
    decision: 'confirm' | 'override'
    officer_id: string
    reason?: string
    reason_text?: string
  }) => {
    if (!evaluationId) throw new Error('No evaluation ID')
    return submitDecision(evaluationId, data)
  }

  return { card, loading, error, refetch: fetchCard, decide }
}
