import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Area,
  AreaChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts'
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Gavel,
  Scale,
  FileCheck,
  Activity,
  CircleDot,
  X,
  Sparkles,
  TrendingUp,
  Layers,
} from 'lucide-react'
import { useTenders } from '../hooks/useTender'
import { formatDate } from '../utils/formatters'

/** Count-up number animation */
function Counter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number | null>(null)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(value * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value, duration])
  return <span className="tabular-nums">{display}</span>
}

export default function Dashboard() {
  const { tenders, loading, error, create } = useTenders()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', department: '', category: '' })
  const [creating, setCreating] = useState(false)

  const total = tenders.length
  const active = tenders.filter(t =>
    ['EVALUATING', 'HITL_PENDING', 'SCHEMA_PENDING_REVIEW', 'DEBARMENT_CHECK', 'VERDICTS_COMPUTED'].includes(t.status)
  ).length
  const done = tenders.filter(t =>
    ['EVALUATION_COMPLETE', 'REPORT_GENERATED'].includes(t.status)
  ).length
  const pending = tenders.filter(t =>
    ['DOCUMENTS_UPLOADED', 'SCHEMA_PENDING_REVIEW', 'HITL_PENDING'].includes(t.status)
  ).length

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.department || !form.category) return
    setCreating(true)
    try {
      const t = await create(form)
      setForm({ title: '', department: '', category: '' })
      setShowCreate(false)
      if (t?.id) navigate(`/upload?tender=${t.id}`)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[rgba(167,139,250,0.2)] border-t-[#c4b5fd] animate-spin" />
          <div className="text-[11px] text-zinc-500 uppercase tracking-[0.15em]">Loading overview</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-sm text-rose-300">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative rounded-3xl overflow-hidden border border-[rgba(148,123,220,0.1)] bg-gradient-to-br from-[#15101f] via-[#15101f] to-[#0a0710] grid-pattern">
        {/* glowing orb behind */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] orb orb-violet opacity-50" aria-hidden />

        <div className="relative z-10 px-10 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(148,123,220,0.2)] bg-[rgba(148,123,220,0.06)] mb-6"
          >
            <Sparkles className="w-3 h-3 text-[#c4b5fd]" strokeWidth={2.2} />
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#c4b5fd]">
              Criterion-Aware Evaluation
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="hero-title max-w-3xl mx-auto"
          >
            Transform tender evaluation <br />
            with <span className="display text-[#c4b5fd]">explainable AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-[14px] text-zinc-400 max-w-xl mx-auto leading-relaxed"
          >
            Every verdict traces to a document, page and value. Every officer decision
            becomes institutional memory. Audit-ready by design.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex items-center justify-center gap-2.5"
          >
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
              New tender
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="btn btn-dark"
            >
              Upload documents
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── Inline create form ───────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="card-lift p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[13px] font-semibold text-white">Create a tender evaluation</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Start a new procurement workflow.</p>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-7 h-7 rounded-lg border border-[rgba(148,123,220,0.1)] flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-[rgba(148,123,220,0.05)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Tender title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Department (CRPF, PWD...)"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input"
                />
                <div className="md:col-span-3 flex gap-2 mt-1">
                  <button type="submit" disabled={creating} className="btn btn-primary disabled:opacity-50">
                    {creating ? 'Creating…' : 'Create tender'}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── METRIC ROW ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-title">Platform metrics</div>
            <h2 className="text-[18px] font-medium text-white mt-1">At a glance</h2>
          </div>
          <button className="chip chip-slate">
            <CircleDot className="w-3 h-3 text-emerald-400" />
            Live data
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total tenders"
            value={total}
            icon={Layers}
            ringColor="#a78bfa"
            pct={100}
            trend="+12%"
            trendUp={true}
            delay={0.0}
          />
          <MetricCard
            label="Active"
            value={active}
            icon={Activity}
            ringColor="#c4b5fd"
            pct={total > 0 ? Math.round(active / total * 100) : 0}
            trend={`${active}/${total}`}
            trendUp={true}
            delay={0.08}
          />
          <MetricCard
            label="Completed"
            value={done}
            icon={FileCheck}
            ringColor="#86efac"
            pct={total > 0 ? Math.round(done / total * 100) : 0}
            trend={`${done > 0 ? Math.round(done / total * 100) : 0}%`}
            trendUp={true}
            delay={0.16}
          />
          <MetricCard
            label="Awaiting review"
            value={pending}
            icon={Gavel}
            ringColor="#fcd34d"
            pct={total > 0 ? Math.round(pending / total * 100) : 0}
            trend={`${pending}`}
            trendUp={false}
            delay={0.24}
          />
        </div>
      </section>

      {/* ─── MAIN CONTENT ROW ──────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tender list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(148,123,220,0.06)]">
            <div>
              <h3 className="text-[13px] font-medium text-white">Recent tenders</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Click to resume workflow</p>
            </div>
            <span className="chip chip-slate">{tenders.length} total</span>
          </div>

          {tenders.length === 0 ? (
            <div className="px-5 py-20 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[rgba(148,123,220,0.08)] flex items-center justify-center">
                <Layers className="w-4 h-4 text-[#a78bfa]" />
              </div>
              <div className="text-[13px] text-zinc-300">No tenders yet</div>
              <div className="text-[11px] text-zinc-500 mt-1">Start your first evaluation above.</div>
            </div>
          ) : (
            <div>
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
                  {tenders.slice(0, 10).map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.04 }}
                      onClick={() => navigate(`/upload?tender=${t.id}`)}
                      className="group cursor-pointer hover:bg-[rgba(148,123,220,0.03)] transition-colors"
                    >
                      <td className="table-cell">
                        <div className="text-white text-[13px] font-medium truncate max-w-[320px]">
                          {t.title}
                        </div>
                        <div className="text-[10.5px] text-zinc-600 mono mt-0.5">
                          {t.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="chip chip-slate">{t.department}</span>
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="table-cell text-zinc-500 text-[12px]">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="table-cell">
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-[#c4b5fd] transition" strokeWidth={1.8} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Capabilities / value pillars */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <CapabilityCard
            icon={ShieldCheck}
            title="GFR compliant"
            desc="Override hierarchy enforced in code. Mandatory FAIL cannot be silently approved."
            chip="82% auto-commit"
            chipVariant="violet"
          />
          <CapabilityCard
            icon={Scale}
            title="Rules + LLM union"
            desc="Cross-validated criterion extraction. Claude 3.5 Haiku + deterministic regex."
            chip="2 branches agree"
            chipVariant="emerald"
          />
          <CapabilityCard
            icon={Gavel}
            title="Never silent"
            desc="Ambiguous cases surface to officer with both interpretations side-by-side."
            chip="100% traceable"
            chipVariant="amber"
          />
        </motion.div>
      </section>

      {/* ─── Activity trendline ─────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-title">Evaluation throughput</div>
            <h3 className="text-[15px] font-medium text-white mt-1">Last 30 days</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip chip-violet">
              <TrendingUp className="w-3 h-3" />
              +24%
            </span>
          </div>
        </div>
        <TrendlineChart />
      </motion.section>
    </div>
  )
}

/* ───────── Subcomponents ───────── */

interface MetricCardProps {
  label: string
  value: number
  icon: any
  ringColor: string
  pct: number
  trend: string
  trendUp: boolean
  delay: number
}

function MetricCard({ label, value, icon: Icon, ringColor, pct, trend, trendUp, delay }: MetricCardProps) {
  const data = [{ value: pct, fill: ringColor }]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="card card-hover p-5 relative overflow-hidden"
    >
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-20 blur-2xl"
        style={{ background: ringColor }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="w-9 h-9 rounded-xl bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center mb-4">
            <Icon className="w-4 h-4" style={{ color: ringColor }} strokeWidth={1.8} />
          </div>
          <div className="text-[32px] font-semibold text-white tracking-tight leading-none">
            <Counter value={value} />
          </div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 mt-2 font-medium">
            {label}
          </div>
        </div>

        <div className="relative w-16 h-16 -mt-1">
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="mono text-[10px] font-semibold" style={{ color: ringColor }}>
              {pct}%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[rgba(148,123,220,0.06)] flex items-center justify-between">
        <span className={`text-[11px] ${trendUp ? 'text-emerald-300' : 'text-zinc-500'}`}>{trend}</span>
        <span className="text-[10px] text-zinc-600 mono">vs last month</span>
      </div>
    </motion.div>
  )
}

function CapabilityCard({
  icon: Icon,
  title,
  desc,
  chip,
  chipVariant,
}: {
  icon: any
  title: string
  desc: string
  chip: string
  chipVariant: 'violet' | 'emerald' | 'amber'
}) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#c4b5fd]" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[13px] font-medium text-white">{title}</h4>
            <span className={`chip chip-${chipVariant}`}>{chip}</span>
          </div>
          <p className="text-[11.5px] text-zinc-500 mt-1.5 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: string }> = {
    DOCUMENTS_UPLOADED: { label: 'Uploaded', variant: 'chip-slate' },
    PROCESSING_OCR: { label: 'OCR', variant: 'chip-sky' },
    OCR_COMPLETE: { label: 'OCR done', variant: 'chip-sky' },
    EXTRACTING_CRITERIA: { label: 'Extracting', variant: 'chip-violet' },
    SCHEMA_PENDING_REVIEW: { label: 'Review schema', variant: 'chip-amber' },
    SCHEMA_APPROVED: { label: 'Schema ok', variant: 'chip-emerald' },
    DEBARMENT_CHECK: { label: 'Debarment', variant: 'chip-sky' },
    DEBARMENT_FLAGGED: { label: 'Debarred', variant: 'chip-rose' },
    EVALUATING: { label: 'Evaluating', variant: 'chip-violet' },
    VERDICTS_COMPUTED: { label: 'Verdicts', variant: 'chip-violet' },
    HITL_PENDING: { label: 'HITL review', variant: 'chip-amber' },
    EVALUATION_COMPLETE: { label: 'Complete', variant: 'chip-emerald' },
    REPORT_GENERATED: { label: 'Reported', variant: 'chip-emerald' },
  }
  const meta = map[status] || { label: status, variant: 'chip-slate' }
  return <span className={`chip ${meta.variant}`}>{meta.label}</span>
}

function TrendlineChart() {
  // Synthetic trendline — showcase visual
  const data = Array.from({ length: 30 }, (_, i) => ({
    d: i,
    v: 8 + Math.round(Math.sin(i / 4) * 4 + (i / 3) + Math.random() * 2),
  }))
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="#c4b5fd"
            strokeWidth={2}
            fill="url(#areaGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
