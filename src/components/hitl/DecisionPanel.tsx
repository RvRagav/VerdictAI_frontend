import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, RotateCcw, Lock, ShieldAlert, UserCog } from 'lucide-react'
import OverrideModal from './OverrideModal'

/**
 * DecisionPanel — bottom of column 3 of the HITL card. Officer ID input +
 * Confirm / Override buttons. Override opens the structured modal.
 */

interface DecisionPanelProps {
  canConfirm: boolean
  canOverride: boolean
  overrideDisabledReason: string | null
  gfrRuleNumber: string | null
  requiresSecondOfficer: boolean
  onDecision: (decision: 'confirm' | 'override', officerId: string, reason?: string, reasonText?: string) => void
  loading?: boolean
}

export default function DecisionPanel({
  canConfirm,
  canOverride,
  overrideDisabledReason,
  gfrRuleNumber,
  requiresSecondOfficer,
  onDecision,
  loading,
}: DecisionPanelProps) {
  const [officerId, setOfficerId] = useState('')
  const [showOverride, setShowOverride] = useState(false)

  const handleConfirm = () => {
    if (!officerId.trim()) return
    onDecision('confirm', officerId.trim())
  }

  const handleOverride = (reason: string, reasonText: string) => {
    if (!officerId.trim()) return
    onDecision('override', officerId.trim(), reason, reasonText)
    setShowOverride(false)
  }

  const confirmDisabled = !canConfirm || !officerId.trim() || loading
  const overrideDisabled = !canOverride || !officerId.trim() || loading

  return (
    <div className="card-lift p-5 relative overflow-visible">
      <div className="absolute -top-10 -right-10 w-40 h-40 orb orb-violet opacity-15 pointer-events-none" aria-hidden />

      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[rgba(148,123,220,0.08)] border border-[rgba(148,123,220,0.12)] flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-[#c4b5fd]" strokeWidth={1.8} />
          </div>
          <div className="text-[13px] font-medium text-white">Decision</div>
        </div>

        <label className="block text-[10.5px] uppercase tracking-[0.12em] text-zinc-500 font-medium mb-1.5">
          Officer ID
        </label>
        <div className="relative mb-4">
          <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" strokeWidth={1.8} />
          <input
            type="text"
            value={officerId}
            onChange={(e) => setOfficerId(e.target.value)}
            placeholder="Enter your officer ID"
            className="input pl-9"
          />
        </div>

        {requiresSecondOfficer && (
          <div className="mb-4 text-[11px] text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" strokeWidth={1.8} />
            Second officer verification required for this case.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#0a0710] bg-gradient-to-b from-emerald-300 to-emerald-400 shadow-[0_8px_20px_-6px_rgba(52,211,153,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_28px_-6px_rgba(52,211,153,0.55),inset_0_1px_0_rgba(255,255,255,0.4)] transition disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.2} />
            Confirm
          </button>

          <button
            type="button"
            onClick={() => setShowOverride(true)}
            disabled={overrideDisabled}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#0a0710] bg-gradient-to-b from-amber-300 to-amber-400 shadow-[0_8px_20px_-6px_rgba(251,191,36,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_28px_-6px_rgba(251,191,36,0.55),inset_0_1px_0_rgba(255,255,255,0.4)] transition disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {canOverride ? (
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.2} />
            ) : (
              <Lock className="w-3.5 h-3.5" strokeWidth={2.2} />
            )}
            Override
          </button>
        </div>

        {/* Override-disabled panel */}
        {!canOverride && overrideDisabledReason && (
          <div className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5 text-rose-300" strokeWidth={2} />
              <span className="text-[11px] font-medium text-rose-300">Override locked</span>
            </div>
            <div className="text-[11px] text-zinc-400 leading-relaxed">{overrideDisabledReason}</div>
            {gfrRuleNumber && (
              <div className="mt-1 text-[10.5px] text-zinc-500 mono">
                Locked by GFR {gfrRuleNumber}
              </div>
            )}
          </div>
        )}
      </div>

      {showOverride && createPortal(
        <OverrideModal
          onSubmit={handleOverride}
          onClose={() => setShowOverride(false)}
        />,
        document.body
      )}
    </div>
  )
}
