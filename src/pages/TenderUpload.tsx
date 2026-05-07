import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  ScrollText,
  FileDiff,
  PackageCheck,
  Stamp,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Plus,
  AlertCircle,
  Users,
  Building2,
  Check,
  Loader2,
} from 'lucide-react'
import FileUploader from '../components/documents/FileUploader'
import DocumentList from '../components/documents/DocumentList'
import ProcessingTimeline from '../components/documents/ProcessingTimeline'
import StatusChip from '../components/common/StatusChip'
import EmptyState from '../components/common/EmptyState'
import { useTenders, useTender } from '../hooks/useTender'
import {
  uploadDocument,
  getCriteria,
} from '../api/client'
import type { Document } from '../types'
import { formatDate } from '../utils/formatters'

type DocTypeKey = 'nit' | 'corrigendum' | 'bidder_submission' | 'certificate'

const DOC_TYPES: {
  key: DocTypeKey
  label: string
  description: string
  icon: typeof FileText
}[] = [
  { key: 'nit',               label: 'NIT',              description: 'Notice Inviting Tender',          icon: ScrollText    },
  { key: 'corrigendum',       label: 'Corrigendum',      description: 'Amendments to NIT',               icon: FileDiff      },
  { key: 'bidder_submission', label: 'Bidder submission',description: 'Per-bidder technical / financial',icon: PackageCheck  },
  { key: 'certificate',       label: 'Certificate',      description: 'Stamps, CA attestations, etc.',   icon: Stamp         },
]

export default function TenderUpload() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tenderId = searchParams.get('tender') || ''
  const navigate = useNavigate()

  if (!tenderId) {
    return <TenderPicker />
  }
  return <TenderUploadInner tenderId={tenderId} onClearTender={() => setSearchParams({})} onDone={(id) => navigate(`/schema-review?tender=${id}`)} />
}

/* ------------------------------------------------------------------ */
/*                       Picker (no tender selected)                  */
/* ------------------------------------------------------------------ */

function TenderPicker() {
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
      <div className="card p-5 text-[13px] text-rose-300 border-rose-500/20">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <HeroHeader
        eyebrow="Document ingest"
        title={<>Choose a tender to <span className="display text-[#c4b5fd]">feed documents into.</span></>}
        body="Pick an existing tender or create one from the dashboard. Every document you upload is hashed, OCR'd and linked."
      />

      {tenders.length === 0 ? (
        <EmptyState
          title="No tenders yet"
          description="Head to the dashboard to create your first tender evaluation workflow."
          action={{ label: 'Go to dashboard', onClick: () => navigate('/') }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(148,123,220,0.06)]">
            <div>
              <div className="text-[13px] font-medium text-white">Available tenders</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Click to open ingest workspace</div>
            </div>
            <span className="chip chip-slate">{tenders.length} total</span>
          </div>
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
                  onClick={() => navigate(`/upload?tender=${t.id}`)}
                  className="group cursor-pointer hover:bg-[rgba(148,123,220,0.03)] transition"
                >
                  <td className="table-cell">
                    <div className="text-[13px] text-white font-medium truncate max-w-[360px]">{t.title}</div>
                    <div className="text-[10.5px] text-zinc-600 mono mt-0.5">{t.id.slice(0, 12)}</div>
                  </td>
                  <td className="table-cell">
                    <span className="chip chip-slate">{t.department}</span>
                  </td>
                  <td className="table-cell">
                    <StatusChip status={t.status} />
                  </td>
                  <td className="table-cell text-zinc-500 text-[12px]">{formatDate(t.created_at)}</td>
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

/* ------------------------------------------------------------------ */
/*                     Main ingest workspace                          */
/* ------------------------------------------------------------------ */

interface TenderUploadInnerProps {
  tenderId: string
  onDone: (tenderId: string) => void
  onClearTender: () => void
}

function TenderUploadInner({ tenderId, onDone, onClearTender }: TenderUploadInnerProps) {
  const { tender, loading, error, refetch } = useTender(tenderId)
  const [docType, setDocType] = useState<DocTypeKey>('nit')
  const [selectedBidder, setSelectedBidder] = useState<string | null>(null)
  const [newBidderName, setNewBidderName] = useState('')
  const [creatingBidder, setCreatingBidder] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processError, setProcessError] = useState<string | null>(null)
  const [hasCriteria, setHasCriteria] = useState(false)

  // Hydrate from tender payload
  useEffect(() => {
    if (tender?.documents) setDocuments(tender.documents as unknown as Document[])
  }, [tender?.documents])

  const bidders = tender?.bidders ?? []
  const needsBidder = docType === 'bidder_submission' || docType === 'certificate'

  const ingestReady = useMemo(() => {
    if (needsBidder && !selectedBidder) return false
    return true
  }, [needsBidder, selectedBidder])

  const handleFiles = async (files: File[]) => {
    setUploadError(null)
    if (needsBidder && !selectedBidder) {
      setUploadError('Select or create a bidder before uploading bidder documents.')
      throw new Error('No bidder selected')
    }
    for (const file of files) {
      const doc = await uploadDocument(
        tenderId,
        file,
        docType,
        needsBidder ? selectedBidder ?? undefined : undefined,
      )
      setDocuments((prev) => [...prev, doc])
    }
    void refetch()
  }

  const handleCreateBidder = async () => {
    if (!newBidderName.trim()) return
    setCreatingBidder(true)
    try {
      const base = import.meta.env.VITE_API_BASE ?? ''
      const res = await fetch(`${base}/api/v1/tenders/${tenderId}/bidders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: newBidderName.trim(),
          pan_number: '',
          registration_number: '',
        }),
      })
      if (!res.ok) {
        throw new Error('Failed to create bidder')
      }
      const created = await res.json()
      setSelectedBidder(created.id)
      setNewBidderName('')
      await refetch()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Bidder creation failed')
    } finally {
      setCreatingBidder(false)
    }
  }

  const handleProcess = async () => {
    setProcessError(null)
    setProcessing(true)
    try {
      const base = import.meta.env.VITE_API_BASE ?? ''
      const res = await fetch(`${base}/api/v1/tenders/${tenderId}/process`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.detail?.error?.message || 'Processing failed')
      }
      // Poll for criteria availability (short wait, then navigate anyway)
      await new Promise(r => setTimeout(r, 400))
      try {
        const criteria = await getCriteria(tenderId)
        if (criteria.length > 0) setHasCriteria(true)
      } catch {
        /* best-effort */
      }
      onDone(tenderId)
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[rgba(167,139,250,0.2)] border-t-[#c4b5fd] animate-spin" />
          <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Loading tender</div>
        </div>
      </div>
    )
  }

  if (error || !tender) {
    return (
      <div className="card p-5 text-[13px] text-rose-300 border-rose-500/20">
        {error || 'Tender not found'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Tender header card ─────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="card-lift p-6 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-16 w-56 h-56 orb orb-violet opacity-15 pointer-events-none" aria-hidden />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="section-title">Ingest workspace</span>
              <span className="text-zinc-700">·</span>
              <span className="mono text-[11px] text-zinc-500">{tender.id.slice(0, 12)}</span>
            </div>
            <h1 className="text-[22px] font-medium text-white tracking-tight leading-tight">{tender.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="chip chip-slate">{tender.department}</span>
              <span className="chip chip-slate">{tender.category}</span>
              <StatusChip status={tender.status} />
            </div>
          </div>
          <button
            onClick={onClearTender}
            className="btn btn-ghost text-[11px]"
          >
            Switch tender
          </button>
        </div>
      </motion.section>

      {/* ─── Doc type selector ──────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="section-title">Step 1</div>
            <h2 className="text-[15px] font-medium text-white mt-1">Document type</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DOC_TYPES.map((t) => {
            const active = t.key === docType
            const Icon = t.icon
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setDocType(t.key)
                  if (t.key !== 'bidder_submission' && t.key !== 'certificate') setSelectedBidder(null)
                }}
                className={`relative text-left p-4 rounded-2xl border transition-all ${
                  active
                    ? 'bg-[rgba(167,139,250,0.08)] border-[rgba(167,139,250,0.35)] shadow-[0_0_40px_-12px_rgba(167,139,250,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]'
                    : 'bg-[rgba(21,16,31,0.5)] border-[rgba(148,123,220,0.08)] hover:border-[rgba(148,123,220,0.2)]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                  active ? 'bg-[rgba(167,139,250,0.12)]' : 'bg-[rgba(148,123,220,0.06)]'
                }`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-[#c4b5fd]' : 'text-zinc-400'}`} strokeWidth={1.8} />
                </div>
                <div className="text-[13px] font-medium text-white">{t.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{t.description}</div>
                {active && (
                  <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#c4b5fd]" />
                )}
              </button>
            )
          })}
        </div>
      </motion.section>

      {/* ─── Bidder selector ──────────────────────────────── */}
      <AnimatePresence>
        {needsBidder && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="section-title">Step 2</div>
                <h2 className="text-[15px] font-medium text-white mt-1">Pick or add bidder</h2>
              </div>
            </div>
            <div className="card p-4 space-y-3">
              {bidders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {bidders.map((b) => {
                    const active = b.id === selectedBidder
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBidder(b.id)}
                        className={`text-left p-3 rounded-xl border flex items-center gap-3 transition ${
                          active
                            ? 'bg-[rgba(167,139,250,0.08)] border-[rgba(167,139,250,0.3)]'
                            : 'bg-[rgba(10,7,16,0.4)] border-[rgba(148,123,220,0.08)] hover:border-[rgba(148,123,220,0.2)]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] text-zinc-100 truncate">{b.company_name}</div>
                          <div className="text-[10px] text-zinc-600 mono mt-0.5">{b.id.slice(0, 8)}</div>
                        </div>
                        {active && <Check className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={2.4} />}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" strokeWidth={1.8} />
                  <input
                    type="text"
                    value={newBidderName}
                    placeholder="Add new bidder (company name)"
                    onChange={(e) => setNewBidderName(e.target.value)}
                    className="input pl-9"
                  />
                </div>
                <button
                  onClick={handleCreateBidder}
                  disabled={!newBidderName.trim() || creatingBidder}
                  className="btn btn-primary disabled:opacity-40"
                >
                  {creatingBidder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />}
                  Add
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Upload zone ───────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="section-title">Step {needsBidder ? '3' : '2'}</div>
            <h2 className="text-[15px] font-medium text-white mt-1">Upload documents</h2>
          </div>
        </div>
        {uploadError && (
          <div className="mb-3 card p-3 flex items-center gap-2.5 text-[12px] text-rose-300 border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
            {uploadError}
          </div>
        )}
        <FileUploader
          onFiles={handleFiles}
          accept=".pdf,.docx,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
          disabled={!ingestReady}
          hint={
            ingestReady
              ? 'PDF · DOCX · PNG · JPG · TIFF · BMP up to 50MB. Scans and photos are OCR\'d automatically.'
              : 'Pick a bidder first to enable uploads.'
          }
        />
      </motion.section>

      {/* ─── Documents table ───────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="card overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(148,123,220,0.06)]">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
            <div className="text-[13px] font-medium text-white">Uploaded documents</div>
          </div>
          <span className="chip chip-slate">{documents.length} file{documents.length === 1 ? '' : 's'}</span>
        </div>
        <DocumentList documents={documents} />
      </motion.section>

      {/* ─── Process CTA ───────────────────────────────────── */}
      {documents.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="card-lift p-6 relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 orb orb-pink opacity-15 pointer-events-none" aria-hidden />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-medium text-white">Ready to extract criteria?</h3>
              <p className="text-[12px] text-zinc-500 mt-1 max-w-md leading-relaxed">
                We'll run OCR and pull out every eligibility clause as structured criteria with thresholds and GFR references.
              </p>
              {processError && (
                <div className="mt-2 text-[11.5px] text-rose-300">{processError}</div>
              )}
            </div>
            <button
              onClick={handleProcess}
              disabled={processing}
              className="btn btn-primary disabled:opacity-50 shrink-0"
            >
              {processing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                  Processing
                </>
              ) : hasCriteria ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
                  Continue to schema review
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
                  Process documents
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </>
              )}
            </button>
          </div>
        </motion.section>
      )}

      {/* ─── Live processing timeline ──────────────────────── */}
      {processing && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ProcessingTimeline tenderId={tenderId} active={processing} />
        </motion.section>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function HeroHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: React.ReactNode
  body: string
}) {
  return (
    <section className="relative rounded-3xl overflow-hidden border border-[rgba(148,123,220,0.1)] bg-gradient-to-br from-[#15101f] via-[#15101f] to-[#0a0710] grid-pattern">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[460px] h-[460px] orb orb-violet opacity-30" aria-hidden />
      <div className="relative z-10 px-10 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(148,123,220,0.2)] bg-[rgba(148,123,220,0.06)]"
        >
          <Sparkles className="w-3 h-3 text-[#c4b5fd]" strokeWidth={2.2} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#c4b5fd]">{eyebrow}</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="hero-title max-w-2xl mx-auto mt-5"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 text-[13px] text-zinc-400 max-w-lg mx-auto leading-relaxed"
        >
          {body}
        </motion.p>
      </div>
    </section>
  )
}
