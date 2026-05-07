import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
import type { BidderSummaryItem } from '../../types'

/**
 * BidderSummary — per-bidder aggregate cards with a stacked pass/fail/review
 * bar. Used in the Evaluation page as the summary layer above the per-row table.
 */

interface BidderSummaryProps {
  bidders: BidderSummaryItem[]
}

export default function BidderSummary({ bidders }: BidderSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bidders.map((b, i) => {
        const total = b.total || 1
        const passPct = (b.pass / total) * 100
        const failPct = (b.fail / total) * 100
        const revPct  = (b.review / total) * 100

        return (
          <motion.div
            key={b.bidder_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="card card-hover p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#c4b5fd]" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white truncate">{b.company_name}</div>
                <div className="text-[10.5px] text-zinc-600 mono">{b.bidder_id.slice(0, 8)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat label="PASS"   value={b.pass}   color="text-emerald-300" />
              <Stat label="FAIL"   value={b.fail}   color="text-rose-300"    />
              <Stat label="REVIEW" value={b.review} color="text-amber-300"   />
            </div>

            <div className="flex h-1.5 rounded-full overflow-hidden bg-[rgba(148,123,220,0.06)]">
              <motion.div initial={{ width: 0 }} animate={{ width: `${passPct}%` }} transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }} className="bg-emerald-400/80" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${failPct}%` }} transition={{ duration: 0.7, delay: 0.05, ease: [0.16,1,0.3,1] }} className="bg-rose-400/80"   />
              <motion.div initial={{ width: 0 }} animate={{ width: `${revPct}%` }}  transition={{ duration: 0.7, delay: 0.1, ease: [0.16,1,0.3,1] }}  className="bg-amber-400/80"  />
            </div>

            <div className="mt-3 flex items-center justify-between text-[10.5px] text-zinc-600 mono">
              <span>{b.total} criteria</span>
              <span>{Math.round(passPct)}% pass</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-[17px] font-semibold tabular-nums ${color}`}>{value}</div>
      <div className="text-[9.5px] uppercase tracking-[0.12em] text-zinc-600 mt-0.5">{label}</div>
    </div>
  )
}
