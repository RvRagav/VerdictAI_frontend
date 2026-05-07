import { motion } from 'framer-motion'
import { Inbox, type LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

/**
 * Centered empty state with an icon and optional action.
 * Uses the same glowing-orb motif as the rest of the app, but subdued.
 */

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
  className?: string
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col items-center justify-center py-16 px-6 overflow-hidden ${className}`}
    >
      {/* Faint ambient glow behind icon */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 orb orb-violet opacity-15 blur-3xl pointer-events-none"
        aria-hidden
      />

      <div className="relative w-14 h-14 rounded-2xl bg-[rgba(148,123,220,0.06)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-[#c4b5fd]" strokeWidth={1.8} />
      </div>

      <h3 className="relative text-[15px] font-medium text-white tracking-tight">{title}</h3>
      {description && (
        <p className="relative text-[12px] text-zinc-500 text-center max-w-sm mt-2 leading-relaxed">
          {description}
        </p>
      )}

      {children && <div className="relative mt-5">{children}</div>}

      {action && (
        <button onClick={action.onClick} className="relative btn btn-primary mt-6">
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
