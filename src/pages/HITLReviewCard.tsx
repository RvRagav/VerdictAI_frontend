import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ShieldAlert,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { useHITLCard } from '../hooks/useHITL'
import { submitDecision } from '../api/client'
import EvidencePanel from '../components/hitl/EvidencePanel'
import AnalysisPanel from '../components/hitl/AnalysisPanel'
import CPMPanel from '../components/hitl/CPMPanel'
import DecisionPanel from '../components/hitl/DecisionPanel'
import UnionDisagreementPanel from '../components/hitl/UnionDisagreementPanel'
import TypeBadge from '../components/criteria/TypeBadge'
import GFRBadge from '../components/criteria/GFRBadge'

export default function HITLReviewCard() {
  const { evaluationId } = useParams<{ evaluationId: string }>()
  const { card, loading, error } = useHITLCard(evaluationId)
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[rgba(167,139,250,0.2)] border-t-[#c4b5fd] animate-spin" />
          <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Loading review card</div>
        </div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="card p-5 text-[13px] text-rose-300 border-rose-500/20">
        {error || 'Card not found'}
      </div>
    )
  }

  // ── Normalise criterion shape: backend returns either "text" or
  //    "criterion_text" depending on version. Read both.
  const rawCriterion = card.criterion as unknown as Record<string, unknown>
  const criterion = {
    criterion_text:
      (rawCriterion['criterion_text'] as string) ||
      (rawCriterion['text'] as string) ||
      '',
    criterion_type:
      (rawCriterion['criterion_type'] as string) ||
      (rawCriterion['type'] as string) ||
      '',
    threshold_value: parseMaybeJson(rawCriterion['threshold_value']),
    is_mandatory: Boolean(rawCriterion['is_mandatory']),
    gfr_override_permitted: Boolean(rawCriterion['gfr_override_permitted']),
    gfr_rule_number: (rawCriterion['gfr_rule_number'] as string | null) || null,
    source_clause_ref: (rawCriterion['source_clause_ref'] as string) || '',
    acceptable_evidence_types: (rawCriterion['acceptable_evidence_types'] as string[]) || [],
    measurement_period: (rawCriterion['measurement_period'] as string | null) || null,
  }

  const handleDecision = async (
    decision: 'confirm' | 'override',
    officerId: string,
    reason?: string,
    reasonText?: string,
  ) => {
    if (!evaluationId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitDecision(evaluationId, {
        decision,
        officer_id: officerId,
        reason,
        reason_text: reasonText,
      })
      navigate('/hitl')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const threshold = criterion.threshold_value

  // ── Pull union data + explanation from the evidence / analysis payloads.
  const ev = card.evidence?.extracted_value as unknown
  let unionRich: Record<string, unknown> | null = null
  let unionBranches: Record<string, string> | null = null
  let rulesReasoning: string | undefined
  let llmReasoning: string | undefined

  if (ev && typeof ev === 'object') {
    const evObj = ev as Record<string, unknown>

    // Rich union (qualitative assessment)
    if (evObj.union && typeof evObj.union === 'object') {
      const u = evObj.union as Record<string, unknown>
      if (u.rules_verdict || u.llm_verdict || u.consensus_verdict) {
        unionRich = u
        rulesReasoning = (u.rules_reasoning as string) || undefined
        llmReasoning = (u.llm_reasoning as string) || (evObj.llm_reasoning as string) || undefined
      } else {
        // compact branch map
        unionBranches = u as Record<string, string>
      }
    }
  }

  // Evaluation_method heuristic: if both branches available, use union reasonings.
  if (!rulesReasoning && !llmReasoning && !unionRich && !unionBranches) {
    // nothing to render
  }

  const explanation = (card.analysis as unknown as Record<string, unknown>)?.explanation as
    | { headline?: string; detail?: string; facts?: string[]; source_reference?: string; confidence_note?: string; next_action?: string }
    | null
    | undefined

  return (
    <div className="space-y-5">
      {/* ─── Top bar ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/hitl')}
          className="btn btn-ghost"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          Back to queue
        </button>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.15em] text-zinc-500">Review card</div>
          <div className="text-[11px] mono text-zinc-500 mt-0.5">{evaluationId?.slice(0, 12)}</div>
        </div>
      </div>

      {/* ─── Criterion header ───────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="card-lift p-6 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-12 w-56 h-56 orb orb-violet opacity-20 pointer-events-none" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
            <span className="section-title">Criterion under review</span>
          </div>
          <p className="text-[18px] text-zinc-100 leading-snug tracking-tight">
            {criterion.criterion_text}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <TypeBadge type={criterion.criterion_type} />
            {criterion.is_mandatory && (
              <span className="chip chip-rose">
                <ShieldAlert className="w-3 h-3" strokeWidth={2.2} />
                Mandatory
              </span>
            )}
            <GFRBadge
              overridePermitted={criterion.gfr_override_permitted}
              ruleNumber={criterion.gfr_rule_number}
            />
            {criterion.source_clause_ref && (
              <span className="chip chip-slate mono">{criterion.source_clause_ref}</span>
            )}
          </div>
          {threshold !== null && threshold !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(148,123,220,0.15)] bg-[rgba(148,123,220,0.06)]">
              <Sparkles className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={2} />
              <span className="mono text-[11.5px] text-zinc-300">
                {formatThreshold(threshold)}
              </span>
              {criterion.measurement_period && (
                <>
                  <span className="text-zinc-700 mx-0.5">·</span>
                  <span className="text-[11.5px] text-zinc-500">{criterion.measurement_period}</span>
                </>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── Union / disagreement hero ──────────── */}
      <UnionDisagreementPanel
        union={unionRich as never}
        unionBranches={unionBranches}
        rulesReasoningFallback={rulesReasoning}
        llmReasoningFallback={llmReasoning}
        explanation={explanation ?? null}
      />

      {submitError && (
        <div className="card p-3 text-[12px] text-rose-300 border-rose-500/20">{submitError}</div>
      )}

      {/* ─── 3-col layout ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <CriterionDetailCol criterion={criterion} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <EvidencePanel
            extractedValue={card.evidence.extracted_value}
            sourceDocumentId={card.evidence.source_document_id}
            sourcePageNumber={card.evidence.source_page_number}
            sourceBbox={card.evidence.source_bbox}
            ocrConfidence={card.evidence.ocr_confidence}
            extractionConfidence={card.evidence.extraction_confidence}
            entityMatch={(card.evidence as unknown as { entity_match_result?: unknown })?.entity_match_result as never}
            pageImageUrl={card.evidence.page_image_url}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <AnalysisPanel
            verdict={card.analysis.verdict}
            confidence={card.analysis.confidence}
            evaluationMethod={card.analysis.evaluation_method}
            routingReason={card.analysis.routing_reason}
            flags={card.analysis.flags}
            confidenceNote={explanation?.confidence_note}
            nextAction={explanation?.next_action}
            partialReasons={derivePartialReasons(card, explanation)}
          />
          <CPMPanel precedents={card.cpm_precedents} />
          <DecisionPanel
            canConfirm={card.decision_options.can_confirm}
            canOverride={card.decision_options.can_override}
            overrideDisabledReason={card.decision_options.override_disabled_reason}
            gfrRuleNumber={card.decision_options.gfr_rule_number}
            requiresSecondOfficer={card.decision_options.requires_second_officer}
            onDecision={handleDecision}
            loading={submitting}
          />
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Helpers ─── */

interface NormalisedCriterion {
  criterion_text: string
  criterion_type: string
  threshold_value: unknown
  is_mandatory: boolean
  gfr_override_permitted: boolean
  gfr_rule_number: string | null
  source_clause_ref: string
  acceptable_evidence_types: string[]
  measurement_period: string | null
}

function CriterionDetailCol({ criterion }: { criterion: NormalisedCriterion }) {
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center">
          <ScrollText className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
        </div>
        <div className="text-[13px] font-medium text-white">Criterion detail</div>
      </div>

      <div className="space-y-4 text-[12.5px] text-zinc-300">
        <DetailBlock label="Criterion text">
          <div className="leading-relaxed text-zinc-200">{criterion.criterion_text}</div>
        </DetailBlock>

        <DetailBlock label="Type">
          <TypeBadge type={criterion.criterion_type} />
        </DetailBlock>

        {criterion.threshold_value !== null && criterion.threshold_value !== undefined && (
          <DetailBlock label="Threshold">
            <div className="mono text-[12.5px] text-zinc-200">
              {formatThreshold(criterion.threshold_value)}
            </div>
          </DetailBlock>
        )}

        {criterion.source_clause_ref && (
          <DetailBlock label="Source clause">
            <span className="mono text-zinc-400">{criterion.source_clause_ref}</span>
          </DetailBlock>
        )}

        <DetailBlock label="Mandatory">
          <div className="flex items-center gap-2">
            {criterion.is_mandatory ? (
              <span className="chip chip-rose">
                <ShieldAlert className="w-3 h-3" strokeWidth={2.2} />
                Mandatory
              </span>
            ) : (
              <span className="chip chip-slate">Optional</span>
            )}
            {criterion.gfr_rule_number && (
              <GFRBadge
                overridePermitted={criterion.gfr_override_permitted}
                ruleNumber={criterion.gfr_rule_number}
              />
            )}
          </div>
        </DetailBlock>

        {criterion.acceptable_evidence_types?.length > 0 && (
          <DetailBlock label="Acceptable evidence">
            <div className="flex flex-wrap gap-1">
              {criterion.acceptable_evidence_types.map((t, i) => (
                <span key={i} className="chip chip-slate">{t}</span>
              ))}
            </div>
          </DetailBlock>
        )}
      </div>
    </div>
  )
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium mb-1.5">
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}

function parseMaybeJson(v: unknown): unknown {
  if (v === null || v === undefined) return null
  if (typeof v !== 'string') return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

/**
 * Inspect the HITL card payload and produce a list of human-readable
 * reasons why the extraction is partial / uncertain. Drives the
 * "Partial information" banner in AnalysisPanel.
 */
function derivePartialReasons(
  card: { evidence: { ocr_confidence: number; extraction_confidence: number; extracted_value: unknown; entity_match_flag?: boolean; entity_match?: unknown } | Record<string, unknown>; analysis: { flags: string[] } },
  explanation: { facts?: string[] } | null | undefined,
): string[] {
  const out: string[] = []
  const ev = (card.evidence || {}) as Record<string, unknown>
  const ocr = typeof ev.ocr_confidence === 'number' ? ev.ocr_confidence : null
  const extraction = typeof ev.extraction_confidence === 'number' ? ev.extraction_confidence : null

  if (ocr !== null && ocr < 0.7) {
    out.push(`OCR confidence ${Math.round(ocr * 100)}% — text may be misread.`)
  }
  if (extraction !== null && extraction < 0.75) {
    out.push(`Extraction confidence ${Math.round(extraction * 100)}% — key value not fully trusted.`)
  }

  const value = ev.extracted_value as Record<string, unknown> | null
  if (value && typeof value === 'object') {
    if ('amount' in value && (value.amount === null || value.amount === undefined)) {
      out.push('Numeric amount could not be located in source.')
    }
    if ('fiscal_year' in value && !value.fiscal_year) {
      out.push('Fiscal year for the figure was not detected.')
    }
    if ('found' in value && value.found === false) {
      out.push('Required document / certificate was not found.')
    }
    if ('is_valid' in value && value.is_valid === null) {
      out.push('Certificate validity date could not be read.')
    }
  }

  if (Array.isArray(explanation?.facts)) {
    for (const f of explanation!.facts!) {
      if (typeof f !== 'string') continue
      const low = f.toLowerCase()
      if (low.includes('stamp') && low.includes('obscur')) {
        out.push(f.replace(/^⚠\s*/, ''))
      }
    }
  }

  if (card.analysis?.flags?.includes('entity_mismatch')) {
    out.push('Bidder name on documents differs from registered entity.')
  }

  return out
}

function formatThreshold(t: unknown): string {
  if (t === null || t === undefined) return ''
  if (typeof t === 'string') return t
  if (typeof t !== 'object') return String(t)
  const obj = t as Record<string, unknown>
  const value = obj.value
  const unit = obj.unit
  if (value === undefined && unit === undefined) {
    try { return JSON.stringify(t) } catch { return String(t) }
  }
  return [value, unit].filter(Boolean).join(' ').trim()
}
