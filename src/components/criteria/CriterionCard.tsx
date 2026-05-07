import { motion } from 'framer-motion'
import { FileDiff, ShieldAlert, Sparkles, CheckCheck, ScrollText } from 'lucide-react'
import type { Criterion } from '../../types'
import TypeBadge from './TypeBadge'
import GFRBadge from './GFRBadge'

/**
 * CriterionCard — a single criterion rendered as a full-width glass card.
 *
 * Design intent:
 *  - Criterion text is the hero.
 *  - Threshold value is surfaced as a stylised pill (the "measurable thing").
 *  - Source clause is parked on the right.
 *  - _sources badges reveal the UNION signature (rules + LLM).
 *  - Amendment history exposes a "View diff" affordance.
 */

interface CriterionCardProps {
  criterion: Criterion & { _sources?: string[] }
  index: number
  onViewDiff?: (id: string) => void
}

export default function CriterionCard({ criterion, index, onViewDiff }: CriterionCardProps) {
  const hasAmendments = (criterion.amendment_history?.length ?? 0) > 0
  const sources = (criterion as any)._sources as string[] | undefined

  // Decide union banner variant
  const hasRules = sources?.includes('rules')
  const hasLLM   = sources?.includes('llm')
  const unionBanner: { label: string; variant: 'emerald' | 'sky' | 'violet' } | null =
    hasRules && hasLLM ? { label: 'Rules + LLM agree', variant: 'emerald' } :
    hasRules            ? { label: 'Rules only',       variant: 'sky'     } :
    hasLLM              ? { label: 'LLM only',         variant: 'violet'  } :
                          null

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card card-hover p-5 relative overflow-hidden"
    >
      {/* Subtle left gradient for mandatory rows */}
      {criterion.is_mandatory && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-rose-400/80 via-rose-400/30 to-transparent" aria-hidden />
      )}

      {/* Head: chips + source clause */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
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
          {criterion.status === 'approved' && (
            <span className="chip chip-emerald">
              <CheckCheck className="w-3 h-3" strokeWidth={2.2} />
              Approved
            </span>
          )}
        </div>

        <div className="shrink-0 text-right">
          {criterion.source_clause_ref && (
            <div className="inline-flex items-center gap-1 text-[10.5px] text-zinc-500 mono">
              <ScrollText className="w-3 h-3 text-zinc-600" strokeWidth={1.8} />
              {criterion.source_clause_ref}
            </div>
          )}
        </div>
      </div>

      {/* Criterion text */}
      <p className="text-[14px] text-zinc-100 leading-relaxed">
        {criterion.criterion_text}
      </p>

      {/* Threshold pill */}
      {criterion.threshold_value && (
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(148,123,220,0.15)] bg-[rgba(148,123,220,0.06)]">
          <Sparkles className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={2} />
          <span className="text-[11.5px] text-zinc-300">
            <span className="mono">
              {formatThreshold(criterion.threshold_value)}
            </span>
            {criterion.measurement_period && (
              <>
                <span className="text-zinc-600 mx-1.5">·</span>
                <span className="text-zinc-500">{criterion.measurement_period}</span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Footer row — union signature + diff action */}
      {(unionBanner || hasAmendments) && (
        <div className="mt-4 pt-3 border-t border-[rgba(148,123,220,0.06)] flex items-center justify-between gap-3">
          {unionBanner ? (
            <span className={`chip chip-${unionBanner.variant}`}>
              <Sparkles className="w-3 h-3" strokeWidth={2.2} />
              {unionBanner.label}
            </span>
          ) : <span />}
          {hasAmendments && onViewDiff && (
            <button
              type="button"
              onClick={() => onViewDiff(criterion.id)}
              className="inline-flex items-center gap-1.5 text-[11px] text-[#c4b5fd] hover:text-white transition"
            >
              <FileDiff className="w-3 h-3" strokeWidth={2} />
              View corrigendum diff
            </button>
          )}
        </div>
      )}
    </motion.article>
  )
}

function formatThreshold(t: Criterion['threshold_value']): string {
  if (!t) return ''
  // t can be a parsed object or a plain string stored in DB
  if (typeof t === 'string') return t
  const v = typeof t === 'object' && t !== null ? t : null
  if (!v) return String(t)
  const value = (v as any).value
  const unit  = (v as any).unit
  if (value === undefined && unit === undefined) return JSON.stringify(t)
  return [value, unit].filter(Boolean).join(' ').trim() || JSON.stringify(t)
}
