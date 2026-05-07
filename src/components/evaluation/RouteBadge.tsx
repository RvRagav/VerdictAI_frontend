import { Zap, Eye, ShieldAlert } from 'lucide-react'
import { Route } from '../../types'

/**
 * RouteBadge — auto_commit / hitl_review / mandatory_review routing signal.
 * Mandatory variant carries a subtle pulsing dot to draw the eye.
 */

interface RouteBadgeProps {
  route: Route | string
  size?: 'sm' | 'md'
  pulse?: boolean
}

const MAP = {
  [Route.AUTO_COMMIT]: {
    icon: Zap,
    variant: 'sky' as const,
    label: 'Auto',
    dot: 'bg-sky-400',
  },
  [Route.HITL_REVIEW]: {
    icon: Eye,
    variant: 'amber' as const,
    label: 'HITL',
    dot: 'bg-amber-400',
  },
  [Route.MANDATORY_REVIEW]: {
    icon: ShieldAlert,
    variant: 'rose' as const,
    label: 'Mandatory',
    dot: 'bg-rose-400',
  },
}

export default function RouteBadge({ route, size = 'sm', pulse = true }: RouteBadgeProps) {
  const meta = MAP[route as Route] || MAP[Route.HITL_REVIEW]
  const Icon = meta.icon
  const isMandatory = route === Route.MANDATORY_REVIEW

  const pad = size === 'md' ? 'px-2.5 py-1 text-[12px]' : 'px-2 py-0.5 text-[11px]'
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'

  return (
    <span className={`chip chip-${meta.variant} ${pad}`}>
      {isMandatory && pulse ? (
        <span className="relative flex w-2 h-2 mr-0.5">
          <span className={`absolute inline-flex h-full w-full rounded-full ${meta.dot} opacity-60 animate-ping`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${meta.dot}`} />
        </span>
      ) : (
        <Icon className={iconSize} strokeWidth={2} />
      )}
      {meta.label}
    </span>
  )
}
