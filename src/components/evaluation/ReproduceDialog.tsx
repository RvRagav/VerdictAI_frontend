import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Hash,
  X,
  GitCompareArrows,
  Database,
  Sparkles,
} from 'lucide-react'
import { reproduceEvaluation, type ReproduceResult } from '../../api/client'

/**
 * ReproduceDialog — a floating panel that triggers the re-runner and
 * shows a byte-for-byte verification result. Every VerdictAI evaluation
 * can be reproduced from stored inputs; a mismatch is evidence of
 * tampering, a match is the signature "trust" surface.
 */

interface Props {
  tenderId: string
  reportId?: string
  open: boolean
  onClose: () => void
}

type Phase = 'idle' | 'running' | 'done' | 'error'

export default function ReproduceDialog({ tenderId, reportId, open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ReproduceResult | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const start = async () => {
    setPhase('running')
    setErr(null)
    setResult(null)
    try {
      const r = await reproduceEvaluation(tenderId, reportId)
      setResult(r)
      setPhase('done')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Reproduction failed')
      setPhase('error')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl card-lift relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-20 w-64 h-64 orb orb-violet opacity-20 pointer-events-none" aria-hidden />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 orb orb-pink opacity-15 pointer-events-none" aria-hidden />

            <div className="relative p-6">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-[rgba(148,123,220,0.08)] transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[rgba(148,123,220,0.1)] border border-[rgba(148,123,220,0.25)] flex items-center justify-center">
                  <GitCompareArrows className="w-4 h-4 text-[#c4b5fd]" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-[16px] font-medium text-white tracking-tight">
                    Reproduce evaluation
                  </div>
                  <div className="text-[11.5px] text-zinc-500 mt-0.5">
                    Re-runs the pipeline from stored inputs and compares byte-for-byte
                  </div>
                </div>
              </div>

              {/* Body */}
              {phase === 'idle' && (
                <IdleBody onStart={start} />
              )}

              {phase === 'running' && (
                <RunningBody />
              )}

              {phase === 'error' && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-[12.5px] text-rose-300">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                    <span className="font-medium">Reproduction failed</span>
                  </div>
                  <div className="text-[12px] text-rose-300/80 leading-relaxed">{err}</div>
                  <button onClick={start} className="btn btn-ghost mt-3 text-[11px]">
                    Try again
                  </button>
                </div>
              )}

              {phase === 'done' && result && (
                <ResultBody result={result} onRerun={start} />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── subpanels ─── */

function IdleBody({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <div className="rounded-xl border border-[rgba(148,123,220,0.12)] bg-[rgba(10,7,16,0.4)] p-4 mb-4">
        <div className="text-[12.5px] text-zinc-300 leading-relaxed">
          VerdictAI re-runs the full extract + evaluate pipeline from stored document
          hashes and cached LLM responses, then hashes both the original and reproduced
          result sets. A match proves the evaluation is tamper-evident and deterministic.
        </div>
      </div>
      <button
        onClick={onStart}
        className="btn btn-primary w-full justify-center"
      >
        <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
        Run reproduction
      </button>
    </div>
  )
}

function RunningBody() {
  const steps = [
    'Loading stored evaluations',
    'Re-running L3 extraction',
    'Re-running L4 evaluation',
    'Comparing verdicts & hashing',
  ]
  return (
    <div className="py-2">
      <div className="flex items-center gap-2 text-[12.5px] text-zinc-300 mb-4">
        <Loader2 className="w-4 h-4 text-[#c4b5fd] animate-spin" strokeWidth={2} />
        Re-running the pipeline from stored inputs…
      </div>
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <motion.li
            key={s}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.2 }}
            className="flex items-center gap-2.5 text-[11.5px] text-zinc-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c4b5fd] animate-pulse" />
            {s}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function ResultBody({ result, onRerun }: { result: ReproduceResult; onRerun: () => void }) {
  const ok = result.match
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Headline */}
      <div
        className={`rounded-xl border p-4 mb-4 flex items-start gap-3 ${
          ok
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-amber-500/30 bg-amber-500/5'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
            ok
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}
        >
          {ok
            ? <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            : <AlertTriangle className="w-4 h-4" strokeWidth={2} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[13.5px] font-medium ${ok ? 'text-emerald-200' : 'text-amber-100'}`}>
            {ok ? 'Byte-identical match' : 'Divergences detected'}
          </div>
          <div className="text-[11.5px] text-zinc-400 mt-1 leading-relaxed">
            {result.summary}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Stat label="Evaluations" value={String(result.total_compared)} />
        <Stat
          label="Matched"
          value={String(result.matches)}
          tone={ok ? 'emerald' : undefined}
        />
        <Stat
          label="Diffs"
          value={String(result.diffs.length)}
          tone={result.diffs.length === 0 ? 'emerald' : 'amber'}
        />
        <Stat label="LLM cache hits" value={String(result.cache_hits)} />
      </div>

      {/* Hash rows */}
      <div className="space-y-3 mb-4">
        <HashRow
          label="Original run hash"
          value={result.reproducibility_hash_original}
        />
        <HashRow
          label="Reproduced run hash"
          value={result.reproducibility_hash_reproduced}
          highlight={ok}
        />
      </div>

      {/* Diff list */}
      {result.diffs.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-4 max-h-44 overflow-auto">
          <div className="text-[10.5px] uppercase tracking-[0.15em] text-amber-200 mb-2">
            Divergences
          </div>
          <ul className="space-y-1.5">
            {result.diffs.slice(0, 20).map((d, i) => (
              <li key={i} className="text-[11px] text-amber-100/90 font-mono">
                <span className="text-amber-200/60">#{String(d.evaluation_id).slice(0, 8)}</span>{' '}
                <span className="text-white">{d.field}</span>:{' '}
                <span className="text-amber-200">{String(d.original)}</span>{' '}
                <span className="text-zinc-500">→</span>{' '}
                <span className="text-amber-100">{String(d.reproduced)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500">
          <Database className="w-3 h-3" strokeWidth={1.8} />
          <span className="mono">{result.tender_id.slice(0, 12)}</span>
        </div>
        <button onClick={onRerun} className="btn btn-ghost text-[11px]">
          Run again
        </button>
      </div>
    </motion.div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'emerald' | 'amber' }) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-200'
      : tone === 'amber'
      ? 'text-amber-200'
      : 'text-white'
  return (
    <div className="rounded-xl border border-[rgba(148,123,220,0.1)] bg-[rgba(10,7,16,0.5)] px-3 py-2.5">
      <div className="text-[9.5px] uppercase tracking-[0.15em] text-zinc-500">{label}</div>
      <div className={`text-[17px] font-semibold mono tabular-nums ${toneClass} mt-0.5`}>
        {value}
      </div>
    </div>
  )
}

function HashRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1">
        <Hash className="w-3 h-3" strokeWidth={2} />
        {label}
      </div>
      <div
        className={`mono text-[10.5px] px-3 py-2 rounded-xl border break-all ${
          highlight
            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
            : 'border-[rgba(148,123,220,0.12)] bg-[rgba(10,7,16,0.6)] text-zinc-300'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
