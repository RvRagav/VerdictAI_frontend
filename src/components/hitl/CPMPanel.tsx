import { motion } from 'framer-motion'
import { BookOpen, ArrowRight } from 'lucide-react'
import type { CPMEntry } from '../../types'
import VerdictBadge from '../evaluation/VerdictBadge'
import { formatDate } from '../../utils/formatters'

/**
 * CPMPanel — middle of column 3 of the HITL card.
 * Shows up to 3 recent CPM (Case Precedent Memory) precedents as a
 * vertical timeline. Each entry carries officer, verdict, and date.
 */

interface CPMPanelProps {
  precedents: CPMEntry[]
  max?: number
}

export default function CPMPanel({ precedents, max = 3 }: CPMPanelProps) {
  const shown = precedents.slice(0, max)

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
        </div>
        <div className="text-[13px] font-medium text-white">CPM precedents</div>
        <span className="chip chip-slate ml-auto">{precedents.length}</span>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-[12px] text-zinc-500">No similar precedents</div>
          <div className="text-[10.5px] text-zinc-600 mt-1">This will be the first decision of its kind.</div>
        </div>
      ) : (
        <div className="relative space-y-3 pl-4">
          {/* timeline line */}
          <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-[#c4b5fd]/40 via-[#c4b5fd]/10 to-transparent" aria-hidden />

          {shown.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* dot */}
              <span className="absolute -left-[14px] top-2 w-2.5 h-2.5 rounded-full bg-[#c4b5fd] ring-2 ring-[#15101f]" />

              <div className="rounded-xl border border-[rgba(148,123,220,0.08)] bg-[rgba(10,7,16,0.4)] p-3">
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="text-[11.5px] text-zinc-300 leading-snug flex-1">
                    {p.criterion_text}
                  </div>
                  <VerdictBadge verdict={p.verdict} glow={false} />
                </div>
                {p.resolved_interpretation && (
                  <div className="text-[11px] text-zinc-500 leading-snug mt-1">
                    {p.resolved_interpretation}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-[10.5px] text-zinc-600 mono">
                  <span>{p.department || '—'}</span>
                  <ArrowRight className="w-3 h-3" strokeWidth={1.8} />
                  <span className="capitalize">{p.officer_action}</span>
                  <span className="ml-auto">{formatDate(p.created_at)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
