import { motion } from 'framer-motion'

/**
 * StatusChip — maps arbitrary status strings to the chip variants defined
 * in index.css. Keeps VerdictAI's tender-state vocabulary in one place.
 */

interface StatusChipProps {
  status: string
}

const MAP: Record<string, { label: string; variant: 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' }> = {
  // Tender workflow states
  DOCUMENTS_UPLOADED:      { label: 'Uploaded',      variant: 'slate'   },
  PROCESSING_OCR:          { label: 'OCR',           variant: 'sky'     },
  OCR_COMPLETE:            { label: 'OCR done',      variant: 'sky'     },
  EXTRACTING_CRITERIA:     { label: 'Extracting',    variant: 'violet'  },
  SCHEMA_PENDING_REVIEW:   { label: 'Review schema', variant: 'amber'   },
  SCHEMA_APPROVED:         { label: 'Schema ok',     variant: 'emerald' },
  DEBARMENT_CHECK:         { label: 'Debarment',     variant: 'sky'     },
  DEBARMENT_FLAGGED:       { label: 'Debarred',      variant: 'rose'    },
  EVALUATING:              { label: 'Evaluating',    variant: 'violet'  },
  VERDICTS_COMPUTED:       { label: 'Verdicts',      variant: 'violet'  },
  HITL_PENDING:            { label: 'HITL review',   variant: 'amber'   },
  EVALUATION_COMPLETE:     { label: 'Complete',      variant: 'emerald' },
  REPORT_GENERATED:        { label: 'Reported',      variant: 'emerald' },

  // Generic document / bidder / evaluation states
  pending:                 { label: 'Pending',       variant: 'amber'   },
  processing:              { label: 'Processing',    variant: 'sky'     },
  complete:                { label: 'Complete',      variant: 'emerald' },
  error:                   { label: 'Error',         variant: 'rose'    },
  evaluating:              { label: 'Evaluating',    variant: 'violet'  },
  evaluated:               { label: 'Evaluated',     variant: 'emerald' },
  excluded:                { label: 'Excluded',      variant: 'rose'    },
  extracted:               { label: 'Extracted',     variant: 'slate'   },
  reviewed:                { label: 'Reviewed',      variant: 'violet'  },
  approved:                { label: 'Approved',      variant: 'emerald' },
  auto_committed:          { label: 'Auto-committed',variant: 'sky'     },
  pending_review:          { label: 'Pending review',variant: 'amber'   },
  resolved:                { label: 'Resolved',      variant: 'emerald' },
  clear:                   { label: 'Clear',         variant: 'emerald' },
  flagged:                 { label: 'Flagged',       variant: 'rose'    },
}

export default function StatusChip({ status }: StatusChipProps) {
  const meta = MAP[status] || { label: status.replace(/_/g, ' '), variant: 'slate' as const }
  return (
    <motion.span
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`chip chip-${meta.variant}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          meta.variant === 'emerald' ? 'bg-emerald-400' :
          meta.variant === 'amber'   ? 'bg-amber-400'   :
          meta.variant === 'rose'    ? 'bg-rose-400'    :
          meta.variant === 'sky'     ? 'bg-sky-400'     :
          meta.variant === 'violet'  ? 'bg-[#c4b5fd]'   :
                                        'bg-zinc-500'
        }`}
      />
      {meta.label}
    </motion.span>
  )
}
