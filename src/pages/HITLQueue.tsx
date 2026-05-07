import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ShieldAlert,
  Eye,
  ListFilter,
  Coffee,
  Building2,
} from 'lucide-react'
import { useHITLQueue } from '../hooks/useHITL'
import { useTenders, useTender } from '../hooks/useTender'
import RouteBadge from '../components/evaluation/RouteBadge'
import EmptyState from '../components/common/EmptyState'
import StatusChip from '../components/common/StatusChip'
import { formatDate } from '../utils/formatters'

type Filter = 'all' | 'mandatory' | 'hitl'

export default function HITLQueue() {
  const [searchParams] = useSearchParams()
  const tenderId = searchParams.get('tender') || ''
  const navigate = useNavigate()

  if (!tenderId) return <TenderPickerForQueue />
  return <QueueInner tenderId={tenderId} onOpen={(id) => navigate(`/hitl/${id}`)} />
}

/* ───────────── Picker ───────────── */

function TenderPickerForQueue() {
  const { tenders, loading, error } = useTenders()
  const navigate = useNavigate()

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

  if (error) {
    return (
      <div className="card p-5 text-[13px] text-rose-300 border-rose-500/20">{error}</div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="section-title">Review queue</div>
        <h1 className="text-[22px] font-medium text-white mt-1 tracking-tight">Pick a tender to review cases</h1>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Tender</th>
              <th className="table-header">Department</th>
              <th className="table-header">Status</th>
              <th className="table-header">Created</th>
              <th className="table-header w-10" />
            </tr>
          </thead>
          <tbody>
            {tenders.map((t, i) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/hitl?tender=${t.id}`)}
                className="group cursor-pointer hover:bg-[rgba(148,123,220,0.03)] transition"
              >
                <td className="table-cell">
                  <div className="text-[13px] text-white font-medium truncate max-w-[360px]">{t.title}</div>
                  <div className="text-[10.5px] text-zinc-600 mono mt-0.5">{t.id.slice(0, 12)}</div>
                </td>
                <td className="table-cell"><span className="chip chip-slate">{t.department}</span></td>
                <td className="table-cell"><StatusChip status={t.status} /></td>
                <td className="table-cell text-zinc-500 text-[12px]">{formatDate(t.created_at)}</td>
                <td className="table-cell">
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-[#c4b5fd] transition" strokeWidth={1.8} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ───────────── Queue inner ───────────── */

function QueueInner({ tenderId, onOpen }: { tenderId: string; onOpen: (evalId: string) => void }) {
  const { queue, loading, error } = useHITLQueue(tenderId)
  const { tender } = useTender(tenderId)
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const all = queue.length
    const mandatory = queue.filter(q => q.route === 'mandatory_review').length
    const hitl = queue.filter(q => q.route === 'hitl_review').length
    return { all, mandatory, hitl }
  }, [queue])

  const visible = useMemo(() => {
    if (filter === 'mandatory') return queue.filter(q => q.route === 'mandatory_review')
    if (filter === 'hitl')      return queue.filter(q => q.route === 'hitl_review')
    return queue
  }, [queue, filter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[rgba(167,139,250,0.2)] border-t-[#c4b5fd] animate-spin" />
          <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Loading queue</div>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="card p-5 text-[13px] text-rose-300 border-rose-500/20">{error}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-lift p-6 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-12 w-52 h-52 orb orb-pink opacity-20 pointer-events-none" aria-hidden />
        <div className="relative flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="section-title">Review queue</span>
              <span className="text-zinc-700">·</span>
              <span className="mono text-[11px] text-zinc-500">{tenderId.slice(0, 12)}</span>
            </div>
            <h1 className="text-[22px] font-medium text-white tracking-tight leading-tight truncate">
              {tender?.title || 'Tender'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {tender?.department && <span className="chip chip-slate">{tender.department}</span>}
              <span className="chip chip-amber">
                <Eye className="w-3 h-3" strokeWidth={2.2} />
                {counts.all} pending
              </span>
              {counts.mandatory > 0 && (
                <span className="chip chip-rose">
                  <ShieldAlert className="w-3 h-3" strokeWidth={2.2} />
                  {counts.mandatory} mandatory
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-full border border-[rgba(148,123,220,0.1)] bg-[rgba(21,16,31,0.6)] w-fit">
        <TabButton active={filter === 'all'}       onClick={() => setFilter('all')}       icon={ListFilter}  label="All"       count={counts.all} />
        <TabButton active={filter === 'mandatory'} onClick={() => setFilter('mandatory')} icon={ShieldAlert} label="Mandatory" count={counts.mandatory} variant="rose"  />
        <TabButton active={filter === 'hitl'}      onClick={() => setFilter('hitl')}      icon={Eye}         label="HITL"      count={counts.hitl}      variant="amber" />
      </div>

      {/* Queue list */}
      {visible.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title="No cases pending review"
          description="The officer queue is clear. New cases will appear here automatically as they route."
        />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {visible.map((item, i) => {
              const isMandatory = item.route === 'mandatory_review'
              return (
                <motion.button
                  key={item.evaluation_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onOpen(item.evaluation_id)}
                  className={`w-full text-left card card-hover p-4 flex items-center gap-4 relative overflow-hidden ${
                    isMandatory
                      ? 'before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-gradient-to-b before:from-amber-400/80 before:via-amber-400/40 before:to-transparent'
                      : ''
                  }`}
                >
                  {/* Left: route + bidder */}
                  <div className="flex items-center gap-2 shrink-0 w-56">
                    <RouteBadge route={item.route} />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center shrink-0">
                        <Building2 className="w-3 h-3 text-[#c4b5fd]" strokeWidth={1.8} />
                      </div>
                      <div className="text-[12.5px] text-zinc-200 truncate">{item.bidder}</div>
                    </div>
                  </div>

                  {/* Middle: criterion */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-zinc-100 truncate">{item.criterion}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{item.reason}</div>
                  </div>

                  {/* Right: confidence ring + arrow */}
                  <div className="flex items-center gap-3 shrink-0">
                    <ConfidenceRing value={item.confidence} />
                    <ArrowRight className="w-4 h-4 text-zinc-600" strokeWidth={1.8} />
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

/* ───────────── Subcomponents ───────────── */

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  variant = 'violet',
}: {
  active: boolean
  onClick: () => void
  icon: typeof Eye
  label: string
  count: number
  variant?: 'violet' | 'amber' | 'rose'
}) {
  const accent =
    variant === 'amber' ? 'text-amber-300' :
    variant === 'rose'  ? 'text-rose-300'  :
                          'text-[#c4b5fd]'
  const bg = active
    ? 'bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.3)] text-white'
    : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] transition ${bg}`}
    >
      <Icon className={`w-3.5 h-3.5 ${active ? accent : ''}`} strokeWidth={1.8} />
      <span>{label}</span>
      <span className={`mono text-[10.5px] ${active ? accent : 'text-zinc-600'}`}>{count}</span>
    </button>
  )
}

function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(Math.min(Math.max(value * 100, 0), 100))
  const r = 15
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  const color = pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#fb7185'

  return (
    <div className="relative w-10 h-10">
      <svg width="40" height="40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(148, 123, 220, 0.1)" strokeWidth="3" />
        <motion.circle
          cx="20" cy="20" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="mono text-[9.5px] font-semibold tabular-nums" style={{ color }}>
          {pct}
        </span>
      </div>
    </div>
  )
}
