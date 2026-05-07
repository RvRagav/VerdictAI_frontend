import { Lock, Unlock } from 'lucide-react'

/**
 * GFRBadge — marks a criterion as bound to a General Financial Rule.
 * When override is NOT permitted the badge uses rose (lock). Otherwise slate.
 */

interface GFRBadgeProps {
  overridePermitted: boolean
  ruleNumber: string | null
}

export default function GFRBadge({ overridePermitted, ruleNumber }: GFRBadgeProps) {
  if (!ruleNumber) return null

  return (
    <span className={`chip ${overridePermitted ? 'chip-slate' : 'chip-rose'}`}>
      {overridePermitted
        ? <Unlock className="w-3 h-3" strokeWidth={2} />
        : <Lock   className="w-3 h-3" strokeWidth={2} />
      }
      GFR <span className="mono">{ruleNumber}</span>
    </span>
  )
}
