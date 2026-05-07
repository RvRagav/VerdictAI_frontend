import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  ScrollText,
  ShieldAlert,
  Sparkles,
  UserCog,
  AlertTriangle,
  ArrowRight,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import CriterionList from '../components/criteria/CriterionList'
import CorrigendumDiff from '../components/criteria/CorrigendumDiff'
import EmptyState from '../components/common/EmptyState'
import StatusChip from '../components/common/StatusChip'
import ProgressBar from '../components/common/ProgressBar'
import { useTender } from '../hooks/useTender'
import {
  getCriteria,
  approveSchema,
  getCriterionDiff,
} from '../api/client'
import type { Criterion } from '../types'

export default function SchemaReview() {
  const [searchParams] = useSearchParams()
  const tenderId = searchParams.get('tender') || ''
  const navigate = useNavigate()
  const { tender } = useTender(tenderId || undefined)

  const [criteria, setCriteria] = useState<(Criterion & { _sources?: string[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [officerId, setOfficerId] = useState('')
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [diffData, setDiffData] = useState<{
    original: string
    amended: string
    corrigendum_id: string
    amendment_date: string
  } | null>(null)

  useEffect(() => {
    if (!tenderId) { setLoading(false); return }
    setLoading(true)
    getCriteria(tenderId)
      .then((data) => {
        setCriteria(data as (Criterion & { _sources?: string[] })[])
        setApproved(data.some((c) => c.status === 'approved'))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load criteria'))
      .finally(() => setLoading(false))
  }, [tenderId])

  const handleApprove = async () => {
    if (!officerId.trim() || !tenderId) return
    setApproving(true)
    try {
      await approveSchema(tenderId, officerId.trim())
      setApproved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed')
    } finally {
      setApproving(false)
    }
  }

  const handleViewDiff = async (criterionId: string) => {
    if (!tenderId) return
    try {
      const diff = await getCriterionDiff(tenderId, criterionId)
      if (diff.amended) {
        setDiffData({
          original: diff.original,
          amended: diff.amended,
          corrigendum_id: diff.corrigendum_id || '—',
          amendment_date: diff.amendment_date || '',
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load diff')
    }
  }

  const progressPct = useMemo(() => {
    const s = tender?.status
    if (!s) return 0
    const mapping: Record<string, number> = {
      DOCUMENTS_UPLOADED: 10,
      PROCESSING_OCR: 25,
      OCR_COMPLETE: 40,
      EXTRACTING_CRITERIA: 55,
      SCHEMA_PENDING_REVIEW: 70,
      SCHEMA_APPROVED: 100,
    }
    return mapping[s] ?? 0
  }, [tender?.status])

  const amendmentCount = criteria.filter(c => (c.amendment_history?.length ?? 0) > 0).length
  const hasCorrigendumDoc = tender?.documents?.some((d: any) => d.doc_type === 'corrigendum')
  const missingCorrigendum = hasCorrigendumDoc && amendmentCount === 0
  const mandatoryCount = criteria.filter(c => c.is_mandatory).length
  const gfrLockedCount = criteria.filter(c => !c.gfr_override_permitted && c.gfr_rule_number).length

  if (!tenderId) {
    return (
      <EmptyState
        title="No tender selected"
        description="Navigate from the dashboard or the ingest picker to choose a tender for schema review."
        action={{ label: 'Open ingest', onClick: () => navigate('/upload') }}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[rgba(167,139,250,0.2)] border-t-[#c4b5fd] animate-spin" />
          <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Loading criteria</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header card ───────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-lift p-6 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-12 w-52 h-52 orb orb-violet opacity-20 pointer-events-none" aria-hidden />
        <div className="relative flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="section-title">Schema review</span>
              <span className="text-zinc-700">·</span>
              <span className="mono text-[11px] text-zinc-500">{tenderId.slice(0, 12)}</span>
            </div>
            <h1 className="text-[22px] font-medium text-white tracking-tight leading-tight truncate">
              {tender?.title || 'Tender'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {tender?.department && <span className="chip chip-slate">{tender.department}</span>}
              {tender?.category && <span className="chip chip-slate">{tender.category}</span>}
              {tender?.status && <StatusChip status={tender.status} />}
              {approved && (
                <span className="chip chip-emerald">
                  <CheckCircle2 className="w-3 h-3" strokeWidth={2.2} />
                  Approved
                </span>
              )}
            </div>
          </div>

          <div className="w-60 shrink-0 hidden md:block">
            <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">
              Processing progress
            </div>
            <ProgressBar value={progressPct} showLabel variant="violet" size="sm" />
            <div className="text-[10.5px] text-zinc-600 mono mt-1.5">{tender?.status || '—'}</div>
          </div>
        </div>
      </motion.section>

      {/* ─── Amendment-indicator banner ─────────────────── */}
      {missingCorrigendum && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 flex items-start gap-3 border-amber-500/25 bg-amber-500/5"
        >
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-amber-200 font-medium">Corrigendum may not have been applied</div>
            <div className="text-[11.5px] text-zinc-500 mt-1 leading-relaxed">
              A corrigendum document was uploaded but no criterion has amendment history attached. Processing may need a re-run, or the corrigendum may not have matched any clause.
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="card p-3 flex items-center gap-2.5 text-[12px] text-rose-300 border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
          {error}
        </div>
      )}

      {/* ─── Stats strip ───────────────────────────────── */}
      {criteria.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={ScrollText}  label="Total criteria"   value={criteria.length}    color="#c4b5fd" />
          <StatCard icon={Sparkles}    label="With amendments"  value={amendmentCount}     color="#7dd3fc" />
          <StatCard icon={ShieldAlert} label="Mandatory"        value={mandatoryCount}     color="#fda4af" />
          <StatCard icon={Lock}        label="GFR locked"       value={gfrLockedCount}     color="#fcd34d" />
        </section>
      )}

      {/* ─── Criteria grid ──────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-title">Extracted criteria</div>
            <h2 className="text-[15px] font-medium text-white mt-1">
              Review each criterion before approval
            </h2>
          </div>
        </div>
        <CriterionList criteria={criteria} onViewDiff={handleViewDiff} columns={2} />
      </section>

      {/* ─── Approve CTA ────────────────────────────────── */}
      {!approved && criteria.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-lift p-6 relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 orb orb-violet opacity-20 pointer-events-none" aria-hidden />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
                <div className="text-[13px] font-medium text-white">Approve schema</div>
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed max-w-md">
                Locks the criterion schema and unlocks evaluation. Officer ID is audit-logged in the hash chain.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" strokeWidth={1.8} />
                <input
                  type="text"
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  placeholder="Officer ID"
                  className="input pl-9 w-48"
                />
              </div>
              <button
                onClick={handleApprove}
                disabled={approving || !officerId.trim()}
                className="btn btn-primary disabled:opacity-40"
              >
                {approving
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving</>
                  : <><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.2} /> Approve schema</>
                }
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* ─── Approved → next step ──────────────────────── */}
      {approved && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-lift p-6 relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 orb orb-pink opacity-15 pointer-events-none" aria-hidden />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-medium text-white">Schema locked</h3>
              <p className="text-[12px] text-zinc-500 mt-1 max-w-md leading-relaxed">
                All criteria are approved. You can now trigger bidder evaluation to generate verdicts.
              </p>
            </div>
            <button onClick={() => navigate(`/evaluation?tender=${tenderId}`)} className="btn btn-primary">
              Go to evaluation
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        </motion.section>
      )}

      {/* ─── Diff modal ─────────────────────────────────── */}
      {diffData && (
        <CorrigendumDiff
          original={diffData.original}
          amended={diffData.amended}
          corrigendumId={diffData.corrigendum_id}
          amendmentDate={diffData.amendment_date}
          onClose={() => setDiffData(null)}
        />
      )}
    </div>
  )
}

/* ─── StatCard ──────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: number; color: string }) {
  return (
    <div className="card card-hover p-4 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-15 blur-2xl" style={{ background: color }} aria-hidden />
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <div className="text-[20px] font-semibold text-white tabular-nums leading-none">{value}</div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-zinc-500 mt-1">{label}</div>
        </div>
      </div>
    </div>
  )
}
