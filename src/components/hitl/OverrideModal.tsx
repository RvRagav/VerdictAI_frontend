import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

/**
 * OverrideModal — structured-reason + freetext override capture.
 * Opens when the officer presses Override on the HITL card.
 */

interface OverrideModalProps {
  onSubmit: (reason: string, reasonText: string) => void
  onClose: () => void
}

const STRUCTURED_REASONS = [
  { value: 'data_extraction_error',  label: 'Data extraction error' },
  { value: 'ocr_quality_issue',      label: 'OCR quality issue' },
  { value: 'ambiguous_clause',       label: 'Ambiguous clause interpretation' },
  { value: 'domain_context',         label: 'Domain context override' },
  { value: 'entity_name_variant',    label: 'Entity name variant accepted' },
  { value: 'documentation_missing',  label: 'Documentation missing but explainable' },
  { value: 'other',                  label: 'Other (explain below)' },
]

export default function OverrideModal({ onSubmit, onClose }: OverrideModalProps) {
  const [reason, setReason]   = useState(STRUCTURED_REASONS[0].value)
  const [text, setText]       = useState('')

  const canSubmit = reason && text.trim().length >= 8

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0710]/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="card-lift p-6 max-w-md w-full relative overflow-hidden"
        >
          {/* subtle amber glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 orb orb-pink opacity-15 pointer-events-none" aria-hidden />

          <div className="relative flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-300" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[14px] font-medium text-white">Override verdict</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Your reasoning will be audit-logged.</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg border border-[rgba(148,123,220,0.1)] bg-[rgba(10,7,16,0.6)] flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-[rgba(148,123,220,0.05)] transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative space-y-4">
            <div>
              <label className="block text-[10.5px] uppercase tracking-[0.12em] text-zinc-500 font-medium mb-1.5">
                Structured reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input appearance-none bg-[rgba(10,7,16,0.6)]"
              >
                {STRUCTURED_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] uppercase tracking-[0.12em] text-zinc-500 font-medium mb-1.5">
                Justification
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe why the system verdict is being overridden. Minimum 8 characters."
                rows={4}
                className="input resize-none"
              />
              <div className="mt-1 text-[10px] text-zinc-600 text-right">
                {text.trim().length} / 8 min
              </div>
            </div>
          </div>

          <div className="relative flex gap-2 mt-5">
            <button
              onClick={() => canSubmit && onSubmit(reason, text.trim())}
              disabled={!canSubmit}
              className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex-1 justify-center"
            >
              Confirm override
            </button>
            <button onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
