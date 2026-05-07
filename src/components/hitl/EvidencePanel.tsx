import { motion } from 'framer-motion'
import { ImageIcon, MapPin, Fingerprint, FileText } from 'lucide-react'
import type { BoundingBox, EntityMatchResult } from '../../types'
import ConfidenceBar from '../evaluation/ConfidenceBar'

/**
 * EvidencePanel — column 2 of the HITL review card.
 * Shows document ref, a mock page with the bbox overlay, extracted value
 * (prominently), OCR+extraction confidence, and entity-match result.
 */

interface EvidencePanelProps {
  extractedValue: unknown
  sourceDocumentId: string
  sourcePageNumber: number
  sourceBbox: BoundingBox
  ocrConfidence: number
  extractionConfidence: number
  entityMatch: EntityMatchResult | null
  pageImageUrl?: string
}

export default function EvidencePanel({
  extractedValue,
  sourceDocumentId,
  sourcePageNumber,
  sourceBbox,
  ocrConfidence,
  extractionConfidence,
  entityMatch,
  pageImageUrl,
}: EvidencePanelProps) {
  const bboxStyle = normalizeBbox(sourceBbox)

  return (
    <div className="card p-5 h-full flex flex-col">
      <Header />

      {/* Mock page with bbox overlay */}
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-[rgba(148,123,220,0.12)] bg-[rgba(10,7,16,0.6)] mb-4">
        {pageImageUrl ? (
          <img
            src={pageImageUrl}
            alt={`Page ${sourcePageNumber}`}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <PageMock pageNumber={sourcePageNumber} />
        )}
        {/* bbox overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute rounded-md ring-1 ring-[#c4b5fd]/70 bg-[#c4b5fd]/10 shadow-[0_0_20px_-4px_rgba(196,181,253,0.5)]"
          style={bboxStyle}
          aria-hidden
        />
      </div>

      {/* Extracted value — hero */}
      <div className="rounded-xl border border-[rgba(148,123,220,0.12)] bg-[rgba(148,123,220,0.04)] p-4 mb-3">
        <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium mb-2">
          Extracted value
        </div>
        <div className="text-[15px] text-zinc-100 mono leading-snug break-words">
          {renderExtracted(extractedValue)}
        </div>
      </div>

      {/* Confidence block */}
      <div className="space-y-2.5 mb-3">
        <ConfRow label="OCR confidence"        value={ocrConfidence} />
        <ConfRow label="Extraction confidence" value={extractionConfidence} />
      </div>

      {/* Source ref */}
      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mono pt-3 border-t border-[rgba(148,123,220,0.06)]">
        <MapPin className="w-3 h-3 text-zinc-600" strokeWidth={1.8} />
        <span>doc {sourceDocumentId.slice(0, 8)} · p{sourcePageNumber}</span>
      </div>

      {/* Entity match */}
      {entityMatch && (
        <div
          className={`mt-3 rounded-xl p-3 border ${
            entityMatch.is_match
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Fingerprint
              className={`w-3.5 h-3.5 ${entityMatch.is_match ? 'text-emerald-300' : 'text-amber-300'}`}
              strokeWidth={1.8}
            />
            <span
              className={`text-[11px] font-medium ${entityMatch.is_match ? 'text-emerald-300' : 'text-amber-300'}`}
            >
              Entity match · {(entityMatch.similarity_score * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mono">
            {entityMatch.extracted_name} → {entityMatch.registered_name}
          </div>
          {entityMatch.mismatch_type && (
            <div className="mt-1 text-[10.5px] text-zinc-500">
              Mismatch type: <span className="text-zinc-300">{entityMatch.mismatch_type.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center">
        <ImageIcon className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
      </div>
      <div className="text-[13px] font-medium text-white">Evidence</div>
    </div>
  )
}

function ConfRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10.5px] uppercase tracking-[0.1em] text-zinc-500">{label}</div>
      </div>
      <ConfidenceBar confidence={value} size="xs" />
    </div>
  )
}

function PageMock({ pageNumber }: { pageNumber: number }) {
  return (
    <div className="absolute inset-0 p-6 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 mb-2">
        <FileText className="w-3 h-3 text-zinc-700" strokeWidth={1.8} />
        <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-700">page {pageNumber}</div>
      </div>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full bg-[rgba(148,123,220,0.08)]"
          style={{ width: `${60 + ((i * 37) % 35)}%` }}
        />
      ))}
    </div>
  )
}

function normalizeBbox(b: BoundingBox) {
  // bbox fields can be normalized floats (0-1) or pixel ints. Assume 0-1.
  const { x_min, y_min, x_max, y_max } = b
  if ([x_min, y_min, x_max, y_max].every(v => v >= 0 && v <= 1)) {
    return {
      left:   `${x_min * 100}%`,
      top:    `${y_min * 100}%`,
      width:  `${Math.max((x_max - x_min) * 100, 2)}%`,
      height: `${Math.max((y_max - y_min) * 100, 2)}%`,
    }
  }
  // fallback — draw a generic rectangle at 30% / 35% / 40% / 12%
  return { left: '30%', top: '35%', width: '40%', height: '12%' }
}

function renderExtracted(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
