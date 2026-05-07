import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  FileUp,
  FileCheck2,
  FileDiff,
  BadgeCheck,
  ShieldCheck,
  Scale,
  Gavel,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  Search,
  Play,
  Pause,
  Hash,
  Activity,
  ArrowUpRight,
} from 'lucide-react'
import { useTenders } from '../hooks/useTender'
import { getAuditTrail } from '../api/client'
import type { AuditEvent } from '../types'
import EmptyState from '../components/common/EmptyState'
import StatusChip from '../components/common/StatusChip'
import { formatDate, formatDateTime } from '../utils/formatters'

/**
 * AuditTrail — live hash-chained event viewer.
 *
 * Polls /tenders/{id}/audit every 3s while streaming. Each event has
 * an event_type, actor, timestamp, and data_summary. The chain is
 * rendered as a vertical timeline with type-specific icons.
 */

export default function AuditTrail() {
  const [searchParams] = useSearchParams()
  const tenderId = searchParams.get('tender') || ''

  if (!tenderId) return <AuditTenderPicker />
  return <AuditInner tenderId={tenderId} />
}

/* ─── picker ─── */

function AuditTenderPicker() {
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
  if (error) return <div className="card p-5 text-[13px] text-rose-300 border-rose-500/20">{error}</div>

  return (
    <div className="space-y-8">
      <section className="relative rounded-3xl overflow-hidden border border-[rgba(148,123,220,0.1)] bg-gradient-to-br from-[#15101f] via-[#15101f] to-[#0a0710] grid-pattern">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[460px] h-[460px] orb orb-violet opacity-30" aria-hidden />
        <div className="relative z-10 px-10 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(148,123,220,0.2)] bg-[rgba(148,123,220,0.06)]">
            <History className="w-3 h-3 text-[#c4b5fd]" strokeWidth={2.2} />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#c4b5fd]">Audit trail</span>
          </div>
          <h1 className="hero-title max-w-2xl mx-auto mt-5">
            Every event, <span className="display text-[#c4b5fd]">hash-chained.</span>
          </h1>
          <p className="mt-4 text-[13px] text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Pick a tender to stream its tamper-evident event log. SHA-256 prev/entry hashes ensure nothing's been silently changed.
          </p>
        </div>
      </section>

      {tenders.length === 0 ? (
        <EmptyState title="No tenders yet" description="Ingest a tender to generate audit events." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Tender</th>
                <th className="table-header">Department</th>
                <th className="table-header">Status</th>
                <th className="table-header">Created</th>
                <th className="table-header w-12" />
              </tr>
            </thead>
            <tbody>
              {tenders.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/audit?tender=${t.id}`)}
                  className="group cursor-pointer hover:bg-[rgba(148,123,220,0.03)] transition"
                >
                  <td className="table-cell">
                    <div className="text-[13px] text-white font-medium truncate max-w-[360px]">{t.title}</div>
                    <div className="text-[10.5px] text-zinc-600 mono mt-0.5">{t.id.slice(0, 12)}</div>
                  </td>
                  <td className="table-cell"><span className="chip chip-slate">{t.department}</span></td>
                  <td className="table-cell"><StatusChip status={t.status} /></td>
                  <td className="table-cell text-[12px] text-zinc-500">{formatDate(t.created_at)}</td>
                  <td className="table-cell">
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-[#c4b5fd] transition" strokeWidth={1.8} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── inner ─── */

function AuditInner({ tenderId }: { tenderId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null)
  const navigate = useNavigate()

  // Polling loop
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const data = await getAuditTrail(tenderId)
        if (!active) return
        setEvents(data)
        setError(null)
        setLastPolledAt(new Date())
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Failed to load audit trail')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    if (!streaming) return () => { active = false }
    const id = setInterval(load, 3000)
    return () => { active = false; clearInterval(id) }
  }, [tenderId, streaming])

  const filtered = useMemo(() => {
    let out = events
    if (typeFilter) out = out.filter(e => e.event_type === typeFilter)
    if (filter.trim()) {
      const q = filter.toLowerCase()
      out = out.filter(e => {
        const summary = typeof e.event_data === 'string'
          ? e.event_data
          : JSON.stringify(e.event_data)
        return (
          e.event_type.toLowerCase().includes(q) ||
          (e.actor || '').toLowerCase().includes(q) ||
          summary.toLowerCase().includes(q)
        )
      })
    }
    return out
  }, [events, typeFilter, filter])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of events) counts[e.event_type] = (counts[e.event_type] || 0) + 1
    return counts
  }, [events])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[rgba(167,139,250,0.2)] border-t-[#c4b5fd] animate-spin" />
          <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Loading audit events</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="card-lift p-6 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-12 w-56 h-56 orb orb-violet opacity-20 pointer-events-none" aria-hidden />
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
              <span className="section-title">Audit trail</span>
              <span className="text-zinc-700">·</span>
              <span className="mono text-[11px] text-zinc-500">{tenderId.slice(0, 12)}</span>
            </div>
            <h1 className="text-[22px] font-medium text-white tracking-tight leading-tight">
              Hash-chained <span className="display text-[#c4b5fd]">event log</span>
            </h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="chip chip-slate">
                <Activity className="w-3 h-3" strokeWidth={2} />
                {events.length} events
              </span>
              {lastPolledAt && (
                <span className="chip chip-slate">
                  Last sync {formatDateTime(lastPolledAt.toISOString())}
                </span>
              )}
              <span
                className={`chip ${streaming ? 'chip-emerald' : 'chip-slate'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${streaming ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}
                />
                {streaming ? 'Streaming' : 'Paused'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStreaming(s => !s)}
              className="btn btn-ghost text-[11.5px] border border-[rgba(148,123,220,0.15)]"
            >
              {streaming
                ? <><Pause className="w-3.5 h-3.5" strokeWidth={2} /> Pause</>
                : <><Play className="w-3.5 h-3.5" strokeWidth={2} /> Resume</>
              }
            </button>
            <button
              onClick={() => navigate('/audit')}
              className="btn btn-ghost text-[11.5px]"
            >
              Switch tender
            </button>
          </div>
        </div>
      </motion.section>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
        <div className="card p-4">
          <div className="text-[10.5px] uppercase tracking-[0.15em] text-zinc-500 mb-3">
            Filter by event type
          </div>
          <div className="flex flex-wrap gap-1.5">
            <TypeChip
              label="All"
              active={typeFilter === null}
              onClick={() => setTypeFilter(null)}
              count={events.length}
            />
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <TypeChip
                  key={k}
                  label={k}
                  active={typeFilter === k}
                  onClick={() => setTypeFilter(k)}
                  count={v}
                />
              ))}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10.5px] uppercase tracking-[0.15em] text-zinc-500 mb-3">
            Search
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" strokeWidth={1.8} />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Actor, event type, bidder id, criterion id…"
              className="input pl-9"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-3 text-[12px] text-rose-300 border-rose-500/20">
          {error}
        </div>
      )}

      {/* Timeline */}
      <div className="card p-5 relative overflow-hidden">
        <div className="absolute -bottom-24 -left-12 w-56 h-56 orb orb-pink opacity-10 pointer-events-none" aria-hidden />
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-[12.5px] text-zinc-500">
            No events match your filters.
          </div>
        ) : (
          <div className="relative pl-5">
            {/* vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-[rgba(148,123,220,0.25)] to-transparent" />

            <AnimatePresence initial={false}>
              {filtered.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.015, 0.4) }}
                  className="relative pl-6 pb-4 last:pb-0"
                >
                  {/* dot */}
                  <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-[#15101f] border border-[rgba(148,123,220,0.3)] flex items-center justify-center">
                    <EventIcon type={e.event_type} />
                  </div>
                  {/* card */}
                  <div className="rounded-xl border border-[rgba(148,123,220,0.1)] bg-[rgba(10,7,16,0.5)] px-4 py-3 hover:border-[rgba(148,123,220,0.2)] transition">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[12.5px] font-medium text-white">
                          {prettyEventType(e.event_type)}
                        </span>
                        <span className="chip chip-slate">{e.actor || 'system'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] text-zinc-500 mono">
                          {formatDateTime(e.timestamp)}
                        </span>
                        <span className="text-[10.5px] text-zinc-600 mono">#{e.id}</span>
                      </div>
                    </div>
                    <div className="text-[11.5px] text-zinc-400 mono mt-2 leading-relaxed break-all">
                      {formatEventData(e.event_data)}
                    </div>
                    {(e.prev_hash || e.entry_hash) && (
                      <div className="mt-2 flex items-center gap-2 text-[10.5px] text-zinc-500 mono">
                        <Hash className="w-3 h-3 text-zinc-600" strokeWidth={2} />
                        <span>
                          prev <span className="text-zinc-400">{(e.prev_hash || '').slice(0, 10) || '—'}</span>
                        </span>
                        <span className="text-zinc-700">·</span>
                        <span>
                          entry <span className="text-[#c4b5fd]">{(e.entry_hash || '').slice(0, 10) || '—'}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── pieces ─── */

function TypeChip({
  label, active, onClick, count,
}: {
  label: string
  active: boolean
  onClick: () => void
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] transition ${
        active
          ? 'bg-[rgba(167,139,250,0.12)] border-[rgba(167,139,250,0.3)] text-[#c4b5fd]'
          : 'bg-[rgba(10,7,16,0.5)] border-[rgba(148,123,220,0.08)] text-zinc-400 hover:border-[rgba(148,123,220,0.18)]'
      }`}
    >
      <span>{label}</span>
      <span className="mono text-[10px] text-zinc-500">{count}</span>
    </button>
  )
}

function EventIcon({ type }: { type: string }) {
  const cls = 'w-3 h-3'
  switch (type) {
    case 'document_received':
      return <FileUp className={`${cls} text-[#c4b5fd]`} strokeWidth={2} />
    case 'ocr_completed':
      return <FileCheck2 className={`${cls} text-emerald-300`} strokeWidth={2} />
    case 'corrigendum_linked':
      return <FileDiff className={`${cls} text-amber-300`} strokeWidth={2} />
    case 'schema_approved':
      return <BadgeCheck className={`${cls} text-emerald-300`} strokeWidth={2} />
    case 'debarment_checked':
      return <ShieldCheck className={`${cls} text-[#c4b5fd]`} strokeWidth={2} />
    case 'evidence_extracted':
      return <FileText className={`${cls} text-[#c4b5fd]`} strokeWidth={2} />
    case 'verdict_computed':
      return <Scale className={`${cls} text-[#c4b5fd]`} strokeWidth={2} />
    case 'case_routed':
      return <Gavel className={`${cls} text-amber-300`} strokeWidth={2} />
    case 'officer_decision':
      return <ClipboardCheck className={`${cls} text-emerald-300`} strokeWidth={2} />
    case 'override_attempted':
      return <AlertTriangle className={`${cls} text-rose-300`} strokeWidth={2} />
    case 'report_generated':
      return <FileText className={`${cls} text-[#c4b5fd]`} strokeWidth={2} />
    default:
      return <Activity className={`${cls} text-zinc-400`} strokeWidth={2} />
  }
}

function prettyEventType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatEventData(d: unknown): string {
  if (!d) return '—'
  if (typeof d === 'string') return d
  try {
    return JSON.stringify(d)
  } catch {
    return String(d)
  }
}
