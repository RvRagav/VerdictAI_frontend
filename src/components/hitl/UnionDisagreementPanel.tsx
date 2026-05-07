import { motion } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  FileSearch,
  GitMerge,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react'
import type { Verdict } from '../../types'

/**
 * UnionDisagreementPanel — the signature screen of VerdictAI.
 *
 * Renders both union branches (Rules engine + LLM) side-by-side with
 * their verdicts, confidences, and full reasoning. The center badge
 * collapses to a crisp "AGREE" / "DISAGREE" / "PARTIAL" chip so a
 * judge can see at a glance whether the two branches concur.
 *
 * Data is read from evidence.extracted_value.union when present. If
 * we only have a flat `union: {rules, llm}` branch map (older
 * deterministic types) we still render a compact strip.
 */

interface UnionData {
  rules_verdict?: string
  llm_verdict?: string
  consensus_verdict?: string
  agreement?: 'agree' | 'disagree' | 'partial' | string
  agreement_score?: number
  rules_reasoning?: string
  llm_reasoning?: string
  key_quote?: string
}

interface AnalysisExplanation {
  headline?: string
  detail?: string
  facts?: string[]
  source_reference?: string
  confidence_note?: string
  next_action?: string
}

interface Props {
  union?: UnionData | null
  unionBranches?: Record<string, string> | null
  rulesReasoningFallback?: string
  llmReasoningFallback?: string
  explanation?: AnalysisExplanation | null
}

export default function UnionDisagreementPanel({
  union,
  unionBranches,
  rulesReasoningFallback,
  llmReasoningFallback,
  explanation,
}: Props) {
  // No union data and no branch map → render nothing.
  const hasRichUnion = Boolean(
    union && (union.rules_verdict || union.llm_verdict),
  )
  const hasCompactBranches = Boolean(
    !hasRichUnion && unionBranches && Object.keys(unionBranches).length >= 2,
  )
  if (!hasRichUnion && !hasCompactBranches) return null

  // Rich path — qualitative cases with full Rules + LLM branches.
  if (hasRichUnion && union) {
    const rulesVerdict = (union.rules_verdict || 'REVIEW') as Verdict
    const llmVerdict = (union.llm_verdict || 'REVIEW') as Verdict
    const consensus = (union.consensus_verdict || rulesVerdict) as Verdict
    const agreement = union.agreement || (rulesVerdict === llmVerdict ? 'agree' : 'disagree')
    const rulesReasoning = union.rules_reasoning || rulesReasoningFallback
    const llmReasoning = union.llm_reasoning || llmReasoningFallback
    const keyQuote = union.key_quote

    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="card-lift relative overflow-hidden"
      >
        <div className="absolute -top-20 right-1/3 w-64 h-64 orb orb-pink opacity-15 pointer-events-none" aria-hidden />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 orb orb-violet opacity-15 pointer-events-none" aria-hidden />

        <div className="relative p-5">
          {/* Header strip */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[rgba(148,123,220,0.1)] border border-[rgba(148,123,220,0.2)] flex items-center justify-center">
                <GitMerge className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[13px] font-medium text-white">Dual-branch adjudication</div>
                <div className="text-[10.5px] uppercase tracking-[0.15em] text-zinc-500 mt-0.5">
                  Rules engine · cross-validated with LLM
                </div>
              </div>
            </div>
            <AgreementBadge agreement={agreement} />
          </div>

          {/* Two-column branches */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
            <BranchCard
              tone="rules"
              title="Rules branch"
              subtitle="Regex + semantic similarity · deterministic"
              icon={FileSearch}
              verdict={rulesVerdict}
              reasoning={rulesReasoning}
            />

            {/* Center collapser */}
            <div className="hidden md:flex flex-col items-center justify-center px-2">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-10 h-10 rounded-full border border-[rgba(148,123,220,0.25)] bg-[rgba(10,7,16,0.6)] flex items-center justify-center"
              >
                <ArrowRightLeft className="w-4 h-4 text-[#c4b5fd]" strokeWidth={1.8} />
              </motion.div>
              <div className="text-[9.5px] uppercase tracking-[0.15em] text-zinc-500 mt-2">
                cross-check
              </div>
            </div>

            <BranchCard
              tone="llm"
              title="LLM branch"
              subtitle="Claude 3.5 Haiku · reasoning"
              icon={Cpu}
              verdict={llmVerdict}
              reasoning={llmReasoning}
            />
          </div>

          {/* Consensus row */}
          <div className="mt-4 rounded-xl border border-[rgba(148,123,220,0.12)] bg-[rgba(10,7,16,0.4)] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Sparkles className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={2} />
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.15em] text-zinc-500">
                  Consensus verdict
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <VerdictPill verdict={consensus} size="md" />
                  {typeof union.agreement_score === 'number' && (
                    <span className="text-[11px] text-zinc-400 mono">
                      agreement {Math.round(union.agreement_score * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            {keyQuote && (
              <div className="max-w-md text-right">
                <div className="text-[9.5px] uppercase tracking-[0.15em] text-zinc-500 mb-0.5">
                  Key quote
                </div>
                <div className="text-[11.5px] text-zinc-300 italic leading-snug">
                  "{keyQuote}"
                </div>
              </div>
            )}
          </div>

          {/* Officer-grade explanation */}
          {explanation?.headline && (
            <div className="mt-4 rounded-xl border border-[rgba(196,181,253,0.18)] bg-[rgba(167,139,250,0.05)] p-4">
              <div className="text-[10.5px] uppercase tracking-[0.15em] text-[#c4b5fd] font-medium mb-2">
                Officer-grade explanation
              </div>
              <div className="text-[14px] text-white font-medium leading-snug">
                {explanation.headline}
              </div>
              {explanation.detail && (
                <div className="text-[12px] text-zinc-300 mt-1.5 leading-relaxed">
                  {explanation.detail}
                </div>
              )}
              {explanation.facts && explanation.facts.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {explanation.facts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-400 leading-relaxed">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-[#c4b5fd] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(explanation.source_reference || explanation.next_action) && (
                <div className="mt-3 pt-3 border-t border-[rgba(148,123,220,0.08)] grid gap-2 text-[11.5px] text-zinc-400">
                  {explanation.source_reference && (
                    <div>
                      <span className="uppercase tracking-[0.15em] text-[10px] text-zinc-500 mr-2">
                        Source
                      </span>
                      {explanation.source_reference}
                    </div>
                  )}
                  {explanation.next_action && (
                    <div>
                      <span className="uppercase tracking-[0.15em] text-[10px] text-[#c4b5fd] mr-2">
                        Next
                      </span>
                      {explanation.next_action}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>
    )
  }

  // Compact path — numeric / categorical / temporal cases just have a
  // branch name → verdict map.
  const entries = Object.entries(unionBranches || {})
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <GitMerge className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
        <div className="text-[12px] font-medium text-white">Branch verdicts</div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {entries.map(([branch, verdict]) => (
          <div
            key={branch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(148,123,220,0.12)] bg-[rgba(10,7,16,0.5)]"
          >
            <span className="text-[10.5px] uppercase tracking-[0.15em] text-zinc-500">
              {branch}
            </span>
            <VerdictPill verdict={verdict as Verdict} size="sm" />
          </div>
        ))}
      </div>
      {explanation?.headline && (
        <div className="mt-3 pt-3 border-t border-[rgba(148,123,220,0.08)] text-[12px] text-zinc-300 leading-relaxed">
          {explanation.headline}
        </div>
      )}
    </motion.section>
  )
}

/* ─── internals ─── */

function AgreementBadge({ agreement }: { agreement: string }) {
  const a = agreement.toLowerCase()
  if (a === 'agree') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] font-medium">
        <ShieldCheck className="w-3 h-3" strokeWidth={2.2} />
        Branches agree
      </span>
    )
  }
  if (a === 'partial') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[11px] font-medium">
        <ShieldAlert className="w-3 h-3" strokeWidth={2.2} />
        Partial agreement
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 text-[11px] font-medium">
      <ShieldAlert className="w-3 h-3" strokeWidth={2.2} />
      Branches disagree
    </span>
  )
}

function BranchCard({
  tone,
  title,
  subtitle,
  icon: Icon,
  verdict,
  reasoning,
}: {
  tone: 'rules' | 'llm'
  title: string
  subtitle: string
  icon: typeof FileSearch
  verdict: Verdict
  reasoning?: string
}) {
  const palette =
    tone === 'rules'
      ? {
          bgTop: 'from-[rgba(148,123,220,0.1)]',
          border: 'border-[rgba(148,123,220,0.18)]',
          iconBg: 'bg-[rgba(148,123,220,0.14)]',
          iconFg: 'text-[#c4b5fd]',
        }
      : {
          bgTop: 'from-[rgba(236,72,153,0.08)]',
          border: 'border-[rgba(236,72,153,0.18)]',
          iconBg: 'bg-[rgba(236,72,153,0.12)]',
          iconFg: 'text-[#f9a8d4]',
        }
  return (
    <div
      className={`relative rounded-2xl border ${palette.border} bg-gradient-to-b ${palette.bgTop} to-transparent p-4`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${palette.iconBg} border ${palette.border} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${palette.iconFg}`} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-medium text-white truncate">{title}</div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 mt-0.5 truncate">
            {subtitle}
          </div>
        </div>
      </div>
      <div className="mb-2">
        <VerdictPill verdict={verdict} size="md" />
      </div>
      <div className="text-[11.5px] text-zinc-400 leading-relaxed min-h-[2.5rem]">
        {reasoning ? reasoning : <span className="text-zinc-600 italic">No reasoning captured</span>}
      </div>
    </div>
  )
}

function VerdictPill({ verdict, size = 'md' }: { verdict: Verdict; size?: 'sm' | 'md' }) {
  const styles =
    verdict === 'PASS'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : verdict === 'FAIL'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  const sizing = size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11.5px]'
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-medium tracking-wide ${styles} ${sizing}`}>
      {verdict}
    </span>
  )
}
