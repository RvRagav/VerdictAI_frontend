import { motion } from 'framer-motion'

/**
 * Thin gradient bar. Used for confidence readouts and generic % progress.
 *
 * Variant semantics:
 *  - violet     → default (primary accent)
 *  - confidence → red → yellow → green depending on value
 *  - pass       → emerald
 *  - warn       → amber
 *  - fail       → rose
 */

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
  variant?: 'violet' | 'confidence' | 'pass' | 'warn' | 'fail'
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  size = 'sm',
  showLabel = false,
  variant = 'violet',
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' }

  const gradient = (() => {
    if (variant === 'confidence') {
      if (pct >= 80) return 'from-emerald-400 to-emerald-500'
      if (pct >= 60) return 'from-amber-400 to-amber-500'
      return 'from-rose-400 to-rose-500'
    }
    if (variant === 'pass')   return 'from-emerald-400 to-emerald-500'
    if (variant === 'warn')   return 'from-amber-400 to-amber-500'
    if (variant === 'fail')   return 'from-rose-400 to-rose-500'
    return 'from-[#c4b5fd] to-[#a78bfa]'
  })()

  const labelColor = (() => {
    if (variant === 'confidence') {
      if (pct >= 80) return 'text-emerald-300'
      if (pct >= 60) return 'text-amber-300'
      return 'text-rose-300'
    }
    if (variant === 'pass') return 'text-emerald-300'
    if (variant === 'warn') return 'text-amber-300'
    if (variant === 'fail') return 'text-rose-300'
    return 'text-[#c4b5fd]'
  })()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-[rgba(148,123,220,0.06)] rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        />
      </div>
      {showLabel && (
        <span className={`text-[11px] mono w-10 text-right tabular-nums ${labelColor}`}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}
