import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Upload,
  Cpu,
  ScanText,
  ScrollText,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Activity,
} from 'lucide-react'
import { getTenderStatus } from '../../api/client'

/**
 * ProcessingTimeline — live timeline that polls /tenders/{id}/status
 * and animates the pipeline phases. Intended to be rendered while the
 * user waits for the synchronous /process endpoint to return.
 *
 * Phases map from backend tender state transitions:
 *   DOCUMENTS_UPLOADED → PROCESSING_OCR → OCR_COMPLETE →
 *   EXTRACTING_CRITERIA → SCHEMA_PENDING_REVIEW → SCHEMA_APPROVED →
 *   EVALUATING → EVALUATION_COMPLETE
 */

type PhaseKey =
  | 'upload'
  | 'ocr'
  | 'extract'
  | 'schema'
  | 'union'
  | 'done'

interface Phase {
  key: PhaseKey
  label: string
  detail: string
  icon: typeof Upload
  matchStates: string[]
}

const PHASES: Phase[] = [
  {
    key: 'upload',
    label: 'Documents received',
    detail: 'SHA-256 hash + metadata stored',
    icon: Upload,
    matchStates: ['DOCUMENTS_UPLOADED'],
  },
  {
    key: 'ocr',
    label: 'OCR + page extraction',
    detail: 'OpenCV preprocess, Tesseract, word objects',
    icon: ScanText,
    matchStates: ['PROCESSING_OCR', 'OCR_COMPLETE'],
  },
  {
    key: 'extract',
    label: 'Criteria extraction',
    detail: 'L2 ETS Builder — rules + LLM union',
    icon: ScrollText,
    matchStates: ['EXTRACTING_CRITERIA'],
  },
  {
    key: 'schema',
    label: 'Schema ready',
    detail: 'Awaiting officer review',
    icon: Cpu,
    matchStates: ['SCHEMA_PENDING_REVIEW', 'SCHEMA_APPROVED', 'DEBARMENT_CHECK', 'DEBARMENT_FLAGGED'],
  },
  {
    key: 'union',
    label: 'Evaluation',
    detail: 'Cross-validated verdicts per bidder',
    icon: Sparkles,
    matchStates: ['EVALUATING', 'VERDICTS_COMPUTED', 'HITL_PENDING'],
  },
  {
    key: 'done',
    label: 'Complete',
    detail: 'Audit chain sealed',
    icon: CheckCircle2,
    matchStates: ['EVALUATION_COMPLETE', 'REPORT_GENERATED'],
  },
]

interface Props {
  tenderId: string
  active: boolean
  /** Called with the final status when the pipeline reaches done or the tenderstatus stops advancing */
  onSettled?: (status: string, progress: number) => void
}

export default function ProcessingTimeline({ tenderId, active, onSettled }: Props) {
  const [status, setStatus] = useState<string>('DOCUMENTS_UPLOADED')
  const [progress, setProgress] = useState<number>(0)
  const [err, setErr] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number>(0)
  const startedAtRef = useRef<number>(Date.now())
  const settledRef = useRef(false)

  // Tick elapsed time
  useEffect(() => {
    if (!active) return
    startedAtRef.current = Date.now()
    settledRef.current = false
    const t = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current)
    }, 200)
    return () => clearInterval(t)
  }, [active])

  // Poll tender status
  useEffect(() => {
    if (!active) return
    let alive = true
    const load = async () => {
      try {
        const s = await getTenderStatus(tenderId)
        if (!alive) return
        setStatus(s.status)
        setProgress(s.progress_pct)
        setErr(null)
        if (
          !settledRef.current &&
          (s.status === 'EVALUATION_COMPLETE' ||
            s.status === 'REPORT_GENERATED' ||
            s.status === 'SCHEMA_PENDING_REVIEW' ||
            s.status === 'SCHEMA_APPROVED')
        ) {
          settledRef.current = true
          onSettled?.(s.status, s.progress_pct)
        }
      } catch (e) {
        if (!alive) return
        setErr(e instanceof Error ? e.message : 'Status poll failed')
      }
    }
    load()
    const id = setInterval(load, 800)
    return () => { alive = false; clearInterval(id) }
  }, [tenderId, active, onSettled])

  const currentPhaseIndex = resolveCurrentPhase(status)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[rgba(148,123,220,0.12)] bg-gradient-to-br from-[#15101f] via-[#15101f] to-[#0a0710] p-5">
      <div className="absolute -top-20 -right-10 w-48 h-48 orb orb-violet opacity-25 pointer-events-none" aria-hidden />
      <div className="absolute -bottom-20 -left-10 w-40 h-40 orb orb-pink opacity-15 pointer-events-none" aria-hidden />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[rgba(148,123,220,0.1)] border border-[rgba(148,123,220,0.25)] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-[13px] font-medium text-white">Live pipeline</div>
              <div className="text-[10.5px] uppercase tracking-[0.15em] text-zinc-500 mt-0.5">
                {status.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] uppercase tracking-[0.15em] text-zinc-500">Elapsed</div>
            <div className="text-[13px] mono text-white tabular-nums mt-0.5">{formatElapsed(elapsedMs)}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mb-5">
          <div className="h-1.5 w-full rounded-full bg-[rgba(148,123,220,0.08)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.max(progress, 5), 100)}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-[#c4b5fd] to-[#f9a8d4]"
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.15em] text-zinc-500">
            <span>Start</span>
            <span className="text-[#c4b5fd] mono">{progress}%</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Phases */}
        <ol className="space-y-2.5">
          {PHASES.map((p, i) => {
            const state =
              i < currentPhaseIndex ? 'done'
              : i === currentPhaseIndex ? 'active'
              : 'pending'
            return <PhaseRow key={p.key} phase={p} state={state} />
          })}
        </ol>

        {err && (
          <div className="mt-4 flex items-center gap-2 text-[11.5px] text-rose-300">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
            {err}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── subpieces ─── */

function PhaseRow({ phase, state }: { phase: Phase; state: 'done' | 'active' | 'pending' }) {
  const Icon = phase.icon
  return (
    <li className="flex items-start gap-3">
      <div className="shrink-0 pt-0.5">
        <AnimatePresence mode="wait" initial={false}>
          {state === 'done' ? (
            <motion.div
              key="done"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center"
            >
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
            </motion.div>
          ) : state === 'active' ? (
            <motion.div
              key="active"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-7 h-7 rounded-lg bg-[rgba(167,139,250,0.15)] border border-[rgba(167,139,250,0.4)] text-[#c4b5fd] flex items-center justify-center"
            >
              <span className="absolute inset-0 rounded-lg border border-[rgba(167,139,250,0.4)] animate-ping opacity-60" aria-hidden />
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            </motion.div>
          ) : (
            <motion.div
              key="pending"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-7 h-7 rounded-lg bg-[rgba(10,7,16,0.5)] border border-[rgba(148,123,220,0.1)] text-zinc-500 flex items-center justify-center"
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-[12.5px] font-medium ${
          state === 'pending'
            ? 'text-zinc-500'
            : state === 'active'
            ? 'text-white'
            : 'text-zinc-200'
        }`}>
          {phase.label}
        </div>
        <div className={`text-[11px] mt-0.5 leading-relaxed ${
          state === 'active' ? 'text-[#c4b5fd]' : 'text-zinc-500'
        }`}>
          {phase.detail}
        </div>
      </div>
    </li>
  )
}

/* ─── helpers ─── */

function resolveCurrentPhase(status: string): number {
  // Find the first phase that claims this status
  for (let i = 0; i < PHASES.length; i++) {
    if (PHASES[i].matchStates.includes(status)) return i
  }
  // Fallbacks for unknown states
  if (status === 'EVALUATION_COMPLETE' || status === 'REPORT_GENERATED') {
    return PHASES.length - 1
  }
  return 0
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const mm = Math.floor(totalSec / 60)
  const ss = totalSec % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}
