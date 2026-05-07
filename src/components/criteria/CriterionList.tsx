import type { Criterion } from '../../types'
import CriterionCard from './CriterionCard'
import EmptyState from '../common/EmptyState'
import { ScrollText } from 'lucide-react'

interface CriterionListProps {
  criteria: Criterion[]
  onViewDiff?: (criterionId: string) => void
  columns?: 1 | 2
}

/**
 * CriterionList — 2-col grid of criterion cards on wide screens, single
 * column on small screens. Prefers CSS grid so cards line up vertically.
 */
export default function CriterionList({ criteria, onViewDiff, columns = 2 }: CriterionListProps) {
  if (criteria.length === 0) {
    return (
      <EmptyState
        title="No criteria extracted"
        description="Upload and process tender documents to extract evaluation criteria."
        icon={ScrollText}
      />
    )
  }

  const gridCols = columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
      {criteria.map((c, i) => (
        <CriterionCard key={c.id} criterion={c} index={i} onViewDiff={onViewDiff} />
      ))}
    </div>
  )
}
