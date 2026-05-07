import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Verdict } from '../../types'

/**
 * VerdictBadge — PASS/FAIL/REVIEW with a soft coloured glow to make
 * the verdict the most legible element in a busy row.
 */

interface VerdictBadgeProps {
  verdict: Verdict | string
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
}

type Variant = {
  icon: typeof CheckCircle2
  label: string
  fg: string
  bg: string
  border: string
  glow: string
  dot: string
}

const VARIANTS: Record<string, Variant> = {
  [Verdict.PASS]: {
    icon:   CheckCircle2,
    label:  'PASS',
    fg:     'text-emerald-300',
    bg:     'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    glow:   'shadow-[0_0_24px_-6px_rgba(52,211,153,0.45)]',
    dot:    'bg-emerald-400',
  },
  [Verdict.FAIL]: {
    icon:   XCircle,
    label:  'FAIL',
    fg:     'text-rose-300',
    bg:     'bg-rose-500/10',
    border: 'border-rose-500/25',
    glow:   'shadow-[0_0_24px_-6px_rgba(251,113,133,0.45)]',
    dot:    'bg-rose-400',
  },
  [Verdict.REVIEW]: {
    icon:   AlertCircle,
    label:  'REVIEW',
    fg:     'text-amber-300',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/25',
    glow:   'shadow-[0_0_24px_-6px_rgba(251,191,36,0.45)]',
    dot:    'bg-amber-400',
  },
}

export default function VerdictBadge({ verdict, size = 'sm', glow = true }: VerdictBadgeProps) {
  const v = VARIANTS[verdict] || VARIANTS[Verdict.REVIEW]
  const Icon = v.icon

  const pad = size === 'lg' ? 'px-3 py-1.5 text-[13px]' : size === 'md' ? 'px-2.5 py-1 text-[12px]' : 'px-2 py-0.5 text-[11px]'
  const iconSize = size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-tight ${pad} ${v.bg} ${v.fg} ${v.border} ${glow ? v.glow : ''}`}
    >
      <Icon className={iconSize} strokeWidth={2.2} />
      {v.label}
    </motion.span>
  )
}
