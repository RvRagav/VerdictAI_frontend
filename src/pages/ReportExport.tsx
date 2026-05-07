import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Download,
  Hash,
  CheckCircle2,
  AlertCircle,
  Copy,
  ShieldCheck,
  Loader2,
  UserCog,
  Sparkles,
  ScrollText,
  Clock,
  GitCompareArrows,
} from 'lucide-react'
import { generateReport } from '../api/client'
import { useTender, useTenders } from '../hooks/useTender'
import EmptyState from '../components/common/EmptyState'
import StatusChip from '../components/common/StatusChip'
import ReproduceDialog from '../components/evaluation/ReproduceDialog'
import { formatDate, formatDateTime } from '../utils/formatters'

export default function ReportExport() {
  const [searchParams] = useSearchParams()
  const tenderId = searchParams.get('tender') || ''

  if (!tenderId) return <ReportTenderPicker />
  return <ReportInner tenderId={tenderId} />
}

/* ─── Picker ─── */

function ReportTenderPicker() {
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
    return <div className="card p-5 text-[13px] text-rose-300 border-rose-500/20">{error}</div>
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="section-title">Reports</div>
        <h1 className="text-[22px] font-medium text-white mt-1 tracking-tight">
          Pick a tender to export
        </h1>
      </div>
      {tenders.length === 0 ? (
        <EmptyState
          title="No tenders yet"
          description="Create a tender and complete evaluation to generate an audit-signed report."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <tbody>
              {tenders.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/reports?tender=${t.id}`)}
                  className="group cursor-pointer hover:bg-[rgba(148,123,220,0.03)] transition"
                >
                  <td className="table-cell">
                    <div className="text-[13px] text-white font-medium truncate">{t.title}</div>
                    <div className="text-[10.5px] text-zinc-600 mono mt-0.5">{t.id.slice(0, 12)}</div>
                  </td>
                  <td className="table-cell"><StatusChip status={t.status} /></td>
                  <td className="table-cell text-[12px] text-zinc-500">{formatDate(t.created_at)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── Inner ─── */

function ReportInner({ tenderId }: { tenderId: string }) {
  const { tender } = useTender(tenderId)
  const [officerId, setOfficerId]    = useState('')
  const [generating, setGenerating]  = useState(false)
  const [error, setError]            = useState<string | null>(null)
  const [copied, setCopied]          = useState(false)
  const [reproduceOpen, setReproduceOpen] = useState(false)
  const [result, setResult]          = useState<{
    report_id: string
    download_url: string
    sha256_hash: string
    generated_at: string
  } | null>(null)

  const handleGenerate = async () => {
    if (!officerId.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const res = await generateReport(tenderId, officerId.trim())
      setResult({
        ...res,
        generated_at: new Date().toISOString(),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.sha256_hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-lift p-6 relative overflow-hidden"
      >
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 orb orb-violet opacity-20 pointer-events-none" aria-hidden />
        <div className="relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(148,123,220,0.2)] bg-[rgba(148,123,220,0.06)] mb-4">
            <Sparkles className="w-3 h-3 text-[#c4b5fd]" strokeWidth={2.2} />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#c4b5fd]">Audit-signed export</span>
          </div>
          <h1 className="text-[26px] font-medium text-white tracking-tight leading-tight">
            Generate <span className="display text-[#c4b5fd]">final report</span>
          </h1>
          <p className="text-[13px] text-zinc-400 mt-3 max-w-md mx-auto leading-relaxed">
            Hash-chained PDF with every verdict, source reference, and officer decision. Tamper-evident by design.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="mono text-[11px] text-zinc-600">{tenderId.slice(0, 12)}</span>
            {tender?.status && <StatusChip status={tender.status} />}
          </div>
          {tender?.title && (
            <div className="text-[13px] text-zinc-300 mt-3 max-w-md mx-auto truncate">
              {tender.title}
            </div>
          )}
        </div>
      </motion.section>

      {/* Generate card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="card p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
          <div className="text-[13px] font-medium text-white">Sign & export</div>
        </div>
        <p className="text-[12px] text-zinc-500 leading-relaxed mb-4">
          Your officer ID will be appended as the signing actor on the audit hash chain.
        </p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" strokeWidth={1.8} />
            <input
              type="text"
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              placeholder="Officer ID"
              className="input pl-9"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !officerId.trim()}
            className="btn btn-primary disabled:opacity-40 shrink-0"
          >
            {generating
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating</>
              : <><FileText className="w-3.5 h-3.5" strokeWidth={2} /> Generate report</>
            }
          </button>
        </div>
        {error && (
          <div className="mt-3 text-[11.5px] text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" strokeWidth={1.8} />
            {error}
          </div>
        )}
      </motion.section>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="card-lift p-6 relative overflow-hidden border-emerald-500/20"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl bg-emerald-500/30" aria-hidden />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" strokeWidth={2} />
                </div>
                <div className="text-[14px] font-medium text-white">Report generated</div>
                <span className="chip chip-emerald ml-auto">
                  <Clock className="w-3 h-3" strokeWidth={2.2} />
                  {formatDateTime(result.generated_at)}
                </span>
              </div>

              <div className="space-y-4">
                <Field label="Report ID" mono>{result.report_id}</Field>

                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium mb-1.5">
                    <Hash className="w-3 h-3" strokeWidth={2} />
                    SHA-256 audit hash
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 mono text-[11px] text-zinc-200 bg-[rgba(10,7,16,0.6)] border border-[rgba(148,123,220,0.12)] rounded-xl px-3 py-2.5 break-all">
                      {result.sha256_hash}
                    </div>
                    <button
                      onClick={handleCopy}
                      title="Copy hash"
                      className="w-9 h-9 shrink-0 rounded-xl border border-[rgba(148,123,220,0.12)] bg-[rgba(10,7,16,0.6)] flex items-center justify-center text-zinc-400 hover:text-[#c4b5fd] hover:bg-[rgba(148,123,220,0.05)] transition"
                    >
                      {copied
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" strokeWidth={2} />
                        : <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                      }
                    </button>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  <a
                    href={`${import.meta.env.VITE_API_BASE ?? ''}${result.download_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary inline-flex"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={2} />
                    Download PDF
                  </a>
                  <button
                    onClick={() => setReproduceOpen(true)}
                    className="btn btn-ghost inline-flex border border-[rgba(148,123,220,0.2)]"
                  >
                    <GitCompareArrows className="w-3.5 h-3.5" strokeWidth={2} />
                    Reproduce evaluation
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* What's included */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <ScrollText className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
          <div className="text-[13px] font-medium text-white">This report includes</div>
        </div>
        <ul className="space-y-2">
          {[
            'Audit trail hash chain from document intake to final verdict',
            'Criterion-level verdicts with confidence and evaluation method',
            'Source references — document, page, and bounding box',
            'Officer decisions with structured reasons and timestamps',
            'CPM (Case Precedent Memory) citations for every review',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-400 leading-relaxed">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#c4b5fd] mt-0.5 shrink-0" strokeWidth={2} />
              {item}
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Standalone reproduce action when no report yet */}
      {!result && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <GitCompareArrows className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
            <div className="text-[13px] font-medium text-white">Verify reproducibility</div>
          </div>
          <p className="text-[12px] text-zinc-500 leading-relaxed mb-3">
            Re-run the evaluation pipeline from stored inputs and compare byte-for-byte. No report required.
          </p>
          <button
            onClick={() => setReproduceOpen(true)}
            className="btn btn-ghost border border-[rgba(148,123,220,0.2)]"
          >
            <GitCompareArrows className="w-3.5 h-3.5" strokeWidth={2} />
            Reproduce evaluation
          </button>
        </motion.section>
      )}

      <ReproduceDialog
        open={reproduceOpen}
        tenderId={tenderId}
        reportId={result?.report_id}
        onClose={() => setReproduceOpen(false)}
      />
    </div>
  )
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium mb-1.5">{label}</div>
      <div className={`text-[12.5px] text-zinc-200 bg-[rgba(10,7,16,0.6)] border border-[rgba(148,123,220,0.12)] rounded-xl px-3 py-2 ${mono ? 'mono' : ''}`}>
        {children}
      </div>
    </div>
  )
}
