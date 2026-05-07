import { motion } from 'framer-motion'
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import type { Document } from '../../types'
import ConfidenceBar from '../evaluation/ConfidenceBar'

/**
 * DocumentList — table of uploaded tender documents with per-row status,
 * OCR confidence, page count, and optional per-row process/delete actions.
 */

interface DocumentListProps {
  documents: Document[]
  onProcess?: (doc: Document) => void
  processing?: boolean
}

const DOC_TYPE_META: Record<string, { label: string; variant: 'violet' | 'amber' | 'sky' | 'emerald' }> = {
  nit:               { label: 'NIT',          variant: 'sky'     },
  corrigendum:       { label: 'Corrigendum',  variant: 'amber'   },
  bidder_submission: { label: 'Bid',          variant: 'violet'  },
  certificate:       { label: 'Certificate',  variant: 'emerald' },
}

const STATUS_ICON = {
  complete:   { icon: CheckCircle2, color: 'text-emerald-300', label: 'Complete',   spin: false },
  processing: { icon: Loader2,      color: 'text-sky-300',     label: 'Processing', spin: true  },
  pending:    { icon: Clock,        color: 'text-amber-300',   label: 'Pending',    spin: false },
  error:      { icon: AlertCircle,  color: 'text-rose-300',    label: 'Error',      spin: false },
} as const

export default function DocumentList({ documents, onProcess, processing }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-[12px] text-zinc-500">
        No documents uploaded yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-header">File</th>
            <th className="table-header">Type</th>
            <th className="table-header">Pages</th>
            <th className="table-header">OCR</th>
            <th className="table-header">Status</th>
            {onProcess && <th className="table-header w-24" />}
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, i) => {
            const typeMeta = DOC_TYPE_META[doc.doc_type] || { label: doc.doc_type, variant: 'violet' as const }
            const status = STATUS_ICON[doc.processing_status] || STATUS_ICON.pending
            const StatusIcon = status.icon

            return (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="group hover:bg-[rgba(148,123,220,0.03)] transition-colors"
              >
                <td className="table-cell">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-[rgba(148,123,220,0.06)] border border-[rgba(148,123,220,0.1)] flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] text-zinc-100 truncate max-w-[280px]">{doc.filename}</div>
                      <div className="text-[10px] text-zinc-600 mono mt-0.5">
                        {doc.sha256_hash?.slice(0, 12) || doc.id.slice(0, 12)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`chip chip-${typeMeta.variant}`}>{typeMeta.label}</span>
                </td>
                <td className="table-cell mono text-[12px] text-zinc-400">
                  {doc.page_count || '—'}
                </td>
                <td className="table-cell">
                  <ConfidenceBar
                    confidence={doc.avg_ocr_confidence || 0}
                    size="xs"
                  />
                </td>
                <td className="table-cell">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] ${status.color}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${status.spin ? 'animate-spin' : ''}`} strokeWidth={2} />
                    {status.label}
                  </span>
                </td>
                {onProcess && (
                  <td className="table-cell">
                    <button
                      type="button"
                      onClick={() => onProcess(doc)}
                      disabled={processing || doc.processing_status === 'processing'}
                      className="btn btn-ghost py-1 px-2.5 text-[11px] disabled:opacity-40"
                    >
                      <Sparkles className="w-3 h-3" strokeWidth={2} />
                      Process
                    </button>
                  </td>
                )}
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
