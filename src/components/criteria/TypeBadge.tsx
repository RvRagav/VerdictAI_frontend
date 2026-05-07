import { Hash, Tag, CalendarClock, Layers, MessageSquareText } from 'lucide-react'
import { CriterionType } from '../../types'

/**
 * TypeBadge — criterion type pill. Each type gets its own chip colour so
 * the eye can cluster rows by criterion family at a glance.
 */

interface TypeBadgeProps {
  type: CriterionType | string
}

type Meta = {
  label: string
  variant: 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate'
  icon: typeof Hash
}

const MAP: Record<string, Meta> = {
  [CriterionType.NUMERIC_THRESHOLD]:      { label: 'Numeric',     variant: 'sky',     icon: Hash              },
  [CriterionType.CATEGORICAL_PRESENCE]:   { label: 'Categorical', variant: 'violet',  icon: Tag               },
  [CriterionType.TEMPORAL_RECENCY]:       { label: 'Temporal',    variant: 'emerald', icon: CalendarClock     },
  [CriterionType.COMPOSITE]:              { label: 'Composite',   variant: 'amber',   icon: Layers            },
  [CriterionType.QUALITATIVE_ASSESSMENT]: { label: 'Qualitative', variant: 'rose',    icon: MessageSquareText },
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  const meta = MAP[type] || { label: String(type), variant: 'slate' as const, icon: Hash }
  const Icon = meta.icon
  return (
    <span className={`chip chip-${meta.variant}`}>
      <Icon className="w-3 h-3" strokeWidth={2} />
      {meta.label}
    </span>
  )
}
