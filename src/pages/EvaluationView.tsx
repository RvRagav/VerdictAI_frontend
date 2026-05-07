import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts'
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldAlert,
  ChevronRight,
  Building2,
  Sparkles,
  ArrowUpRight,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import VerdictBadge from '../components/evaluation/VerdictBadge'
import ConfidenceBar from '../components/evaluation/ConfidenceBar'
import RouteBadge from '../components/evaluation/RouteBadge'
import EmptyState from '../components/common/EmptyState'
import StatusChip from '../components/common/StatusChip'
import { useEvaluations } from '../hooks/useEvaluation'
import { useTender, useTenders } from '../hooks/useTender'
import { triggerEvaluation } from '../api/client'
import type { Evaluation } from '../types'

export default function EvaluationView() {
  const [searchParams] = useSearchParams()
  const tenderId = searchParams.get('tender') || ''

  // If no tender in URL, try to pick the most recent one that's in an evaluable state
  if (!tenderId) {
    return <EvaluationTenderPicker />
  }

  return <EvaluationInner tenderId={tenderId} />
}

function EvaluationTenderPicker() {
  const navigate = useNavigate()
  const { tenders, loading } = useTenders()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[rgba(167,139,250,0.2)] border-t-[#c4b5fd] animate-spin" />
          <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Loading tenders</div>
        </div>
      </div>
    )
  }

  // Auto-select the first tender that's in SCHEMA_APPROVED or later
  const evaluable = tenders.filter(t =>
    ['SCHEMA_APPROVED', 'EVALUATING', 'HITL_PENDING', 'EVALUATION_COMPLETE', 'REPORT_GENERATED'].includes(t.status)
  )
  if (evaluable.length === 1) {
    navigate(`/evaluation?tender=${evaluable[0].id}`, { replace: true })
    return null
  }

  return (
    <EmptyState
      title="No tender selected"
      description="Pick a tender from the dashboard to view bidder evaluations."
      action={{ label: 'Go to dashboard', onClick: () => navigate('/') }}
    />
  )
}

function EvaluationInner({ tenderId }: { tenderId: string }) {
  const navigate = useNavigate()
  const { tender } = useTender(tenderId || undefined)
  const { evaluations, summary, loading, error, refetch } = useEvaluations(tenderId || undefined)

  const [triggering, setTriggering] = useState(false)
  const [triggerError, setTriggerError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const handleTrigger = async () => {
    if (!tenderId) return
    setTriggering(true)
    setTriggerError(null)
    try {
      await triggerEvaluation(tenderId)
      await refetch()
    } catch (e) {
      setTriggerError(e instanceof Error ? e.message : 'Trigger failed')
    } finally {
      setTriggering(false)
    }
  }

  const byBidder = useMemo(() => {
    const groups = new Map<string, Evaluation[]>()
    for (const e of evaluations) {
      if (!groups.has(e.bidder_id)) groups.set(e.bidder_id, [])
      groups.get(e.bidder_id)!.push(e)
    }
    return Array.from(groups.entries())
  }, [evaluations])

  const totals = useMemo(() => {
    const total = evaluations.length
    const autoCommit = evaluations.filter(e => e.route === 'auto_commit').length
    const hitl = evaluations.filter(e => e.route === 'hitl_review').length
    const mandatory = evaluations.filter(e => e.route === 'mandatory_review').length
    const passed = evaluations.filter(e => e.verdict === 'PASS').length
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
    return { total, autoCommit, hitl, mandatory, passRate }
  }, [evaluations])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[rgba(167,139,250,0.2)] border-t-[#c4b5fd] animate-spin" />
          <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Loading evaluations</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header card ──────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-lift p-6 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-12 w-52 h-52 orb orb-violet opacity-20 pointer-events-none" aria-hidden />
        <div className="relative flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="section-title">Evaluation</span>
              <span className="text-zinc-700">·</span>
              <span className="mono text-[11px] text-zinc-500">{tenderId.slice(0, 12)}</span>
            </div>
            <h1 className="text-[22px] font-medium text-white tracking-tight leading-tight truncate">
              {tender?.title || 'Tender'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {tender?.department && <span className="chip chip-slate">{tender.department}</span>}
              {tender?.status && <StatusChip status={tender.status} />}
              <span className="chip chip-slate">{byBidder.length} bidder{byBidder.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>
      </motion.section>

      {error && (
        <div className="card p-3 flex items-center gap-2.5 text-[12px] text-rose-300 border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
          {error}
        </div>
      )}

      {/* ─── Summary tiles ────────────────────────────── */}
      {evaluations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="section-title">At a glance</div>
              <h2 className="text-[15px] font-medium text-white mt-1">Evaluation summary</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <RadialCard
              icon={Scale}
              label="Total"
              value={totals.total}
              pct={100}
              color="#c4b5fd"
            />
            <RadialCard
              icon={Zap}
              label="Auto-committed"
              value={totals.autoCommit}
              pct={totals.total ? Math.round((totals.autoCommit / totals.total) * 100) : 0}
              color="#7dd3fc"
            />
            <RadialCard
              icon={AlertCircle}
              label="HITL pending"
              value={totals.hitl}
              pct={totals.total ? Math.round((totals.hitl / totals.total) * 100) : 0}
              color="#fcd34d"
            />
            <RadialCard
              icon={ShieldAlert}
              label="Mandatory review"
              value={totals.mandatory}
              pct={totals.total ? Math.round((totals.mandatory / totals.total) * 100) : 0}
              color="#fda4af"
            />
            <RadialCard
              icon={CheckCircle2}
              label="Pass rate"
              value={totals.passRate}
              pct={totals.passRate}
              color="#6ee7b7"
              suffix="%"
            />
          </div>
        </section>
      )}

      {/* ─── Empty state + trigger ──────────────────── */}
      {evaluations.length === 0 && (summary?.total ?? 0) === 0 && (
        <div className="card-lift p-10 relative overflow-hidden">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 orb orb-violet opacity-20 pointer-events-none" aria-hidden />
          <div className="relative flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(148,123,220,0.06)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-[#c4b5fd]" strokeWidth={1.8} />
            </div>
            <h3 className="text-[16px] font-medium text-white">No evaluations yet</h3>
            <p className="text-[12px] text-zinc-500 mt-1.5 max-w-md leading-relaxed">
              Trigger bidder evaluation to generate verdicts for every criterion across every bidder. Results will appear here in real time.
            </p>
            {triggerError && (
              <div className="mt-3 text-[11.5px] text-rose-300">{triggerError}</div>
            )}
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="btn btn-primary mt-6 disabled:opacity-40"
            >
              {triggering
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Triggering</>
                : <><Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} /> Trigger evaluation</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ─── Bidder-grouped table ───────────────────── */}
      {byBidder.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Per-bidder verdicts</div>
              <h2 className="text-[15px] font-medium text-white mt-1">Expand to drill into criteria</h2>
            </div>
          </div>

          {byBidder.map(([bidderId, rows]) => (
            <BidderBlock
              key={bidderId}
              bidderId={bidderId}
              rows={rows}
              companyName={
                summary?.by_bidder.find(b => b.bidder_id === bidderId)?.company_name ||
                `Bidder ${bidderId.slice(0, 8)}`
              }
              expanded={expanded.has(bidderId)}
              onToggle={() => setExpanded(s => {
                const n = new Set(s)
                if (n.has(bidderId)) n.delete(bidderId)
                else n.add(bidderId)
                return n
              })}
              onRowClick={(ev) => {
                if (ev.status === 'pending_review' || ev.status === 'pending') {
                  navigate(`/hitl/${ev.id}`)
                }
              }}
            />
          ))}
        </section>
      )}
    </div>
  )
}

/* ─────────────── Bidder block ─────────────── */

function BidderBlock({
  bidderId,
  rows,
  companyName,
  expanded,
  onToggle,
  onRowClick,
}: {
  bidderId: string
  rows: Evaluation[]
  companyName: string
  expanded: boolean
  onToggle: () => void
  onRowClick: (ev: Evaluation) => void
}) {
  const pass = rows.filter(r => r.verdict === 'PASS').length
  const fail = rows.filter(r => r.verdict === 'FAIL').length
  const review = rows.filter(r => r.verdict === 'REVIEW').length

  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[rgba(148,123,220,0.03)] transition"
      >
        <div className="w-9 h-9 rounded-xl bg-[rgba(148,123,220,0.06)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-[#c4b5fd]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[13px] font-medium text-white truncate">{companyName}</div>
          <div className="text-[10.5px] text-zinc-600 mono mt-0.5">{bidderId.slice(0, 12)}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <CountCell color="emerald" value={pass} label="pass" />
          <CountCell color="rose" value={fail} label="fail" />
          <CountCell color="amber" value={review} label="rev" />
        </div>
        <ChevronRight
          className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
          strokeWidth={1.8}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[rgba(148,123,220,0.06)]"
          >
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Criterion</th>
                  <th className="table-header">Verdict</th>
                  <th className="table-header w-44">Confidence</th>
                  <th className="table-header">Route</th>
                  <th className="table-header">Officer</th>
                  <th className="table-header">Status</th>
                  <th className="table-header w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const clickable = r.status === 'pending_review' || r.status === 'pending'
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => clickable && onRowClick(r)}
                      className={`group hover:bg-[rgba(148,123,220,0.03)] transition ${clickable ? 'cursor-pointer' : ''}`}
                    >
                      <td className="table-cell">
                        <div className="text-[12.5px] text-zinc-200 truncate max-w-[340px]">
                          {r.criterion_id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="table-cell"><VerdictBadge verdict={r.verdict} /></td>
                      <td className="table-cell"><ConfidenceBar confidence={r.confidence} size="xs" /></td>
                      <td className="table-cell"><RouteBadge route={r.route} pulse={false} /></td>
                      <td className="table-cell">
                        {r.officer_decision ? (
                          <span className={`chip ${r.officer_decision === 'confirmed' ? 'chip-emerald' : 'chip-amber'}`}>
                            {r.officer_decision}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <StatusChip status={r.status} />
                      </td>
                      <td className="table-cell">
                        {clickable && (
                          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-[#c4b5fd] transition" strokeWidth={1.8} />
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CountCell({ color, value, label }: { color: 'emerald' | 'rose' | 'amber'; value: number; label: string }) {
  const fg =
    color === 'emerald' ? 'text-emerald-300' :
      color === 'rose' ? 'text-rose-300' :
        'text-amber-300'
  const bg =
    color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
      color === 'rose' ? 'bg-rose-500/10 border-rose-500/20' :
        'bg-amber-500/10 border-amber-500/20'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10.5px] ${bg}`}>
      <span className={`font-semibold tabular-nums ${fg}`}>{value}</span>
      <span className="text-zinc-500 uppercase tracking-wider">{label}</span>
    </span>
  )
}

/* ─────────────── Radial card ─────────────── */

function RadialCard({
  icon: Icon,
  label,
  value,
  pct,
  color,
  suffix,
}: {
  icon: LucideIcon
  label: string
  value: number
  pct: number
  color: string
  suffix?: string
}) {
  const data = [{ value: pct, fill: color }]
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card card-hover p-4 relative overflow-hidden"
    >
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 blur-2xl" style={{ background: color }} aria-hidden />
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center">
          <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[22px] font-semibold text-white tabular-nums leading-none">
            {value}{suffix || ''}
          </div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-zinc-500 mt-1 font-medium">
            {label}
          </div>
        </div>
        <div className="w-12 h-12 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="72%"
              outerRadius="100%"
              data={data}
              startAngle={90}
              endAngle={90 - (360 * pct) / 100}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={20}
                background={{ fill: 'rgba(148, 123, 220, 0.06)' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}
