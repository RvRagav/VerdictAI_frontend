import { motion } from 'framer-motion'
import { Brain, Flag, Route as RouteIcon, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import { Verdict } from '../../types'
import VerdictBadge from '../evaluation/VerdictBadge'

/**
 * AnalysisPanel — top of column 3 of the HITL card.
 *
 * Contains the system's verdict, a circular confidence gauge, the routing
 * reason, any flags raised during evaluation, plus the officer-grade
 * confidence_note and next_action from the explanation builder.
 */

interface AnalysisPanelProps {
  verdict: Verdict
  confidence: number
  evaluationMethod: string
  routingReason: string
  flags: string[]
  /**
   * Officer-grade note describing HOW the value was extracted and at
   * what confidence. Surfaced under the gauge when present.
   */
  confidenceNote?: string
  /** Specific next-step prompt from the explanation builder. */
  nextAction?: string
  /**
   * Triggered when the extraction could only partially read the
   * underlying evidence — e.g. OCR confidence below 0.75, stamp
   * obscuration, or no fiscal-year match. Surfaces a partial-info
   * banner so the officer knows exactly what was uncertain.
   */
  partialReasons?: string[]
}

export default function AnalysisPanel({
  verdict,
  confidence,
  evaluationMethod,
  routingReason,
  flags,
  confidenceNote,
  nextAction,
  partialReasons,
}: AnalysisPanelProps) {
  const pct = Math.round(Math.min(Math.max(confidence * 100, 0), 100))

  const color =
    pct >= 80 ? '#34d399'
    : pct >= 60 ? '#fbbf24'
    : '#fb7185'

  const r = 36
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  const hasPartial = Boolean(partialReasons && partialReasons.length > 0)

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
        </div>
        <div className="text-[13px] font-medium text-white">System analysis</div>
      </div>

      {/* Gauge + verdict */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative w-24 h-24 shrink-0">
          <svg width="96" height="96" className="-rotate-90">
            <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(148, 123, 220, 0.1)" strokeWidth="5" />
            <motion.circle
              cx="48" cy="48" r={r}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[20px] font-semibold text-white mono tabular-nums">{pct}</div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 mt-0.5">conf</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <VerdictBadge verdict={verdict} size="lg" />
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-zinc-500 mt-3 mb-1">
            Method
          </div>
          <div className="text-[12px] text-zinc-300 capitalize">
            {evaluationMethod.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Partial-information banner */}
      {hasPartial && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 mb-3"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" strokeWidth={2} />
            <span className="text-[10.5px] uppercase tracking-[0.15em] text-amber-200 font-medium">
              Partial information
            </span>
          </div>
          <ul className="space-y-1">
            {partialReasons!.map((reason, i) => (
              <li key={i} className="text-[11.5px] text-amber-100/90 flex items-start gap-1.5 leading-relaxed">
                <span className="mt-1 w-1 h-1 rounded-full bg-amber-300 shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Routing reason */}
      <div className="rounded-xl border border-[rgba(148,123,220,0.08)] bg-[rgba(10,7,16,0.4)] p-3 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <RouteIcon className="w-3 h-3 text-[#c4b5fd]" strokeWidth={1.8} />
          <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">
            Routing reason
          </span>
        </div>
        <div className="text-[12px] text-zinc-300 leading-relaxed">{routingReason}</div>
      </div>

      {/* Confidence note */}
      {confidenceNote && (
        <div className="rounded-xl border border-[rgba(148,123,220,0.08)] bg-[rgba(10,7,16,0.4)] p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Info className="w-3 h-3 text-[#c4b5fd]" strokeWidth={1.8} />
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">
              Extraction note
            </span>
          </div>
          <div className="text-[11.5px] text-zinc-400 leading-relaxed">{confidenceNote}</div>
        </div>
      )}

      {/* Next action */}
      {nextAction && (
        <div className="rounded-xl border border-[rgba(196,181,253,0.18)] bg-[rgba(167,139,250,0.06)] p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ArrowRight className="w-3 h-3 text-[#c4b5fd]" strokeWidth={2} />
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#c4b5fd] font-medium">
              Next action
            </span>
          </div>
          <div className="text-[12px] text-zinc-200 leading-relaxed">{nextAction}</div>
        </div>
      )}

      {/* Flags */}
      {flags.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Flag className="w-3 h-3 text-amber-300" strokeWidth={1.8} />
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">
              Flags
            </span>
          </div>
          <div className="space-y-1.5">
            {flags.map((flag, i) => (
              <div
                key={i}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-200"
              >
                {flag}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
