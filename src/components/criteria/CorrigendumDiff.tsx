import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, FileDiff } from 'lucide-react'
import { formatDate } from '../../utils/formatters'

/**
 * CorrigendumDiff — modal showing an "original → amended" pair for a
 * criterion that was touched by a corrigendum.
 */

interface CorrigendumDiffProps {
  original: string
  amended: string
  corrigendumId: string
  amendmentDate: string
  onClose: () => void
}

export default function CorrigendumDiff({
  original,
  amended,
  corrigendumId,
  amendmentDate,
  onClose,
}: CorrigendumDiffProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0710]/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="card-lift p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center">
                <FileDiff className="w-4 h-4 text-[#c4b5fd]" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[14px] font-medium text-white">Corrigendum amendment</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  <span className="mono">{corrigendumId?.slice(0, 8) || '—'}</span>
                  <span className="mx-1.5 text-zinc-700">·</span>
                  {formatDate(amendmentDate)}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg border border-[rgba(148,123,220,0.1)] bg-[rgba(10,7,16,0.6)] flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-[rgba(148,123,220,0.05)] transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <DiffBlock label="Original" body={original} tone="rose" />
            <div className="flex items-center justify-center py-0.5">
              <ArrowRight className="w-4 h-4 text-zinc-600" strokeWidth={1.8} />
            </div>
            <DiffBlock label="Amended" body={amended} tone="emerald" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function DiffBlock({ label, body, tone }: { label: string; body: string; tone: 'rose' | 'emerald' }) {
  const bg =
    tone === 'rose'
      ? 'bg-rose-500/5 border-rose-500/20'
      : 'bg-emerald-500/5 border-emerald-500/20'
  const fg =
    tone === 'rose' ? 'text-rose-300' : 'text-emerald-300'

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className={`text-[10px] uppercase tracking-[0.15em] font-semibold mb-2 ${fg}`}>
        {label}
      </div>
      <div className="text-[13px] text-zinc-200 leading-relaxed">{body}</div>
    </div>
  )
}
