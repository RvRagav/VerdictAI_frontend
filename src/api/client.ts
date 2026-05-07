import type {
  Tender,
  Document,
  Criterion,
  Evaluation,
  EvaluationSummary,
  HITLCardData,
  AuditEvent,
  CPMEntry,
  ApiErrorResponse,
} from '../types'

const BASE_URL = `${import.meta.env.VITE_API_BASE ?? ''}/api/v1`

// --- Error handling ---

class ApiError extends Error {
  code: string
  details: Record<string, unknown>

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null
    try {
      errorData = await response.json()
    } catch {
      // response body not JSON
    }
    if (errorData?.error) {
      throw new ApiError(
        errorData.error.code,
        errorData.error.message,
        errorData.error.details
      )
    }
    throw new ApiError(
      `HTTP_${response.status}`,
      `Request failed with status ${response.status}`,
      {}
    )
  }
  return response.json()
}

// --- Tender endpoints ---

export async function getTenders(): Promise<Tender[]> {
  const res = await fetch(`${BASE_URL}/tenders`)
  return handleResponse<Tender[]>(res)
}

export async function createTender(data: {
  title: string
  department: string
  category: string
}): Promise<Tender> {
  const res = await fetch(`${BASE_URL}/tenders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Tender>(res)
}

export async function getTender(id: string): Promise<Tender> {
  const res = await fetch(`${BASE_URL}/tenders/${id}`)
  return handleResponse<Tender>(res)
}

// --- Document endpoints ---

export async function uploadDocument(
  tenderId: string,
  file: File,
  docType: string,
  bidderId?: string
): Promise<Document> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('tender_id', tenderId)
  formData.append('doc_type', docType)
  if (bidderId) formData.append('bidder_id', bidderId)

  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse<Document>(res)
}

// --- Criteria endpoints ---

export async function getCriteria(tenderId: string): Promise<Criterion[]> {
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/criteria`)
  return handleResponse<Criterion[]>(res)
}

export async function approveSchema(
  tenderId: string,
  officerId: string
): Promise<{ status: string; approved_at: string }> {
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/schema/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer_id: officerId }),
  })
  return handleResponse<{ status: string; approved_at: string }>(res)
}

export async function getCriterionDiff(
  tenderId: string,
  criterionId: string
): Promise<{ original: string; amended: string; corrigendum_id: string; amendment_date: string }> {
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/criteria/${criterionId}/diff`)
  return handleResponse(res)
}

// --- Evaluation endpoints ---

export async function triggerEvaluation(
  tenderId: string
): Promise<{ status: string; bidder_count: number }> {
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/evaluate`, {
    method: 'POST',
  })
  return handleResponse(res)
}

export async function getEvaluations(
  tenderId: string,
  params?: { bidder_id?: string; status?: string; route?: string }
): Promise<Evaluation[]> {
  const searchParams = new URLSearchParams()
  if (params?.bidder_id) searchParams.set('bidder_id', params.bidder_id)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.route) searchParams.set('route', params.route)
  const qs = searchParams.toString()
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/evaluations${qs ? `?${qs}` : ''}`)
  return handleResponse<Evaluation[]>(res)
}

export async function getSummary(tenderId: string): Promise<EvaluationSummary> {
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/summary`)
  return handleResponse<EvaluationSummary>(res)
}

// --- HITL endpoints ---

export async function getHITLQueue(
  tenderId: string,
  route?: string
): Promise<Array<{
  evaluation_id: string
  bidder: string
  criterion: string
  confidence: number
  route: string
  reason: string
}>> {
  const qs = route ? `?route=${route}` : ''
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/hitl/queue${qs}`)
  return handleResponse(res)
}

export async function getHITLCard(evaluationId: string): Promise<HITLCardData> {
  const res = await fetch(`${BASE_URL}/hitl/${evaluationId}/card`)
  return handleResponse<HITLCardData>(res)
}

export async function submitDecision(
  evaluationId: string,
  data: {
    decision: 'confirm' | 'override'
    officer_id: string
    reason?: string
    reason_text?: string
  }
): Promise<{ status: string; audit_event_id: number }> {
  const res = await fetch(`${BASE_URL}/hitl/${evaluationId}/decide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

// --- Audit endpoints ---

export async function getAuditTrail(
  tenderId: string,
  params?: { event_type?: string; from?: string; to?: string }
): Promise<AuditEvent[]> {
  const searchParams = new URLSearchParams()
  if (params?.event_type) searchParams.set('event_type', params.event_type)
  if (params?.from) searchParams.set('from', params.from)
  if (params?.to) searchParams.set('to', params.to)
  const qs = searchParams.toString()
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/audit${qs ? `?${qs}` : ''}`)
  return handleResponse<AuditEvent[]>(res)
}

export async function generateReport(
  tenderId: string,
  officerId: string
): Promise<{ report_id: string; download_url: string; sha256_hash: string }> {
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer_id: officerId }),
  })
  return handleResponse(res)
}

// --- Reproducibility ---

export interface ReproduceResult {
  match: boolean
  tender_id: string
  report_id: string | null
  total_compared: number
  matches: number
  diffs: Array<{
    evaluation_id: string | number
    field: string
    original: unknown
    reproduced: unknown
    delta?: number
  }>
  byte_identical_excluding_timestamps: boolean
  reproducibility_hash_original: string
  reproducibility_hash_reproduced: string
  cache_hits: number
  cache_misses: number
  summary: string
}

export async function reproduceEvaluation(
  tenderId: string,
  reportId?: string
): Promise<ReproduceResult> {
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/reproduce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report_id: reportId ?? null }),
  })
  return handleResponse<ReproduceResult>(res)
}

// --- Tender status (for live timeline) ---

export async function getTenderStatus(tenderId: string): Promise<{
  status: string
  progress_pct: number
  current_step: string
  updated_at?: string
}> {
  const res = await fetch(`${BASE_URL}/tenders/${tenderId}/status`)
  return handleResponse(res)
}

// --- CPM endpoints ---

export async function searchCPM(params: {
  query: string
  department?: string
  category?: string
  limit?: number
}): Promise<CPMEntry[]> {
  const searchParams = new URLSearchParams()
  searchParams.set('query', params.query)
  if (params.department) searchParams.set('department', params.department)
  if (params.category) searchParams.set('category', params.category)
  if (params.limit) searchParams.set('limit', String(params.limit))
  const res = await fetch(`${BASE_URL}/cpm/search?${searchParams.toString()}`)
  return handleResponse<CPMEntry[]>(res)
}

export async function getCPMStats(): Promise<{
  total_entries: number
  by_department: Record<string, number>
  by_category: Record<string, number>
  calibration_ready: boolean
}> {
  const res = await fetch(`${BASE_URL}/cpm/stats`)
  return handleResponse(res)
}

export { ApiError }
