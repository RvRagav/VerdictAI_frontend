import { motion } from 'framer-motion'

/**
 * ConfidenceBar — red → yellow → green gradient bar with an inline
 * mono percentage readout. Used in evaluation tables and HITL cards.
 */

interface ConfidenceBarProps {
  confidence: number
  size?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export default function ConfidenceBar({
  confidence,
  size = 'sm',
  showLabel = true,
  className = '',
}: ConfidenceBarProps) {
  const pct = Math.round(Math.min(Math.max(confidence * 100, 0), 100))

  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' }

  const grad =
    pct >= 80 ? 'from-emerald-400 to-emerald-500'
    : pct >= 60 ? 'from-amber-400 to-amber-500'
    : 'from-rose-400 to-rose-500'

  const labelColor =
    pct >= 80 ? 'text-emerald-300'
    : pct >= 60 ? 'text-amber-300'
    : 'text-rose-300'

  return (
    <div className={`flex items-center gap-2 min-w-[100px] ${className}`}>
      <div className={`flex-1 rounded-full overflow-hidden bg-[rgba(148,123,220,0.06)] ${heights[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${grad}`}
        />
      </div>
      {showLabel && (
        <span className={`mono text-[11px] tabular-nums w-9 text-right ${labelColor}`}>
          {pct}%
        </span>
      )}
    </div>
  )
}
