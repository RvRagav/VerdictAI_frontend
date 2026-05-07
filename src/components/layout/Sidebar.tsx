import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutGrid,
  Upload,
  ClipboardList,
  ScanSearch,
  Gavel,
  FileText,
  Activity,
  History,
  Sparkles,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutGrid },
  { to: '/upload', label: 'Ingest', icon: Upload },
  { to: '/schema-review', label: 'Schema', icon: ClipboardList },
  { to: '/evaluation', label: 'Evaluation', icon: ScanSearch },
  { to: '/hitl', label: 'Review Queue', icon: Gavel },
  { to: '/audit', label: 'Audit Trail', icon: History },
  { to: '/reports', label: 'Reports', icon: FileText },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-60 shrink-0 h-screen fixed top-0 left-0 flex flex-col px-4 py-5 border-r border-[rgba(148,123,220,0.08)] bg-[#0a0710]/80 backdrop-blur-xl z-30">
      {/* Brand */}
      <NavLink to="/" className="flex items-center gap-2.5 px-1 mb-8 group">
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#c4b5fd] to-[#8b5cf6] flex items-center justify-center glow-violet shrink-0">
          <Sparkles className="w-4 h-4 text-[#1a1527]" strokeWidth={2.5} />
        </div>
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-tight text-white">
            Verdict<span className="serif font-normal text-[#c4b5fd]">AI</span>
          </div>
          <div className="text-[9.5px] uppercase tracking-[0.18em] text-zinc-500 mt-1">
            Procurement Intelligence
          </div>
        </div>
      </NavLink>

      {/* Section label */}
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 px-1 mb-2">
        Workspace
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon className="w-[15px] h-[15px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
              {isActive && (
                <motion.span
                  layoutId="nav-dot"
                  className="ml-auto w-1 h-1 rounded-full bg-[#c4b5fd]"
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer: system status */}
      <div className="mt-auto pt-4 border-t border-[rgba(148,123,220,0.06)] px-1">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <span>System online</span>
          <Activity className="w-3 h-3 ml-auto text-zinc-600" strokeWidth={1.8} />
        </div>
        <div className="text-[9.5px] text-zinc-600 mt-1.5 mono">
          v1.0 · claude-3.5-haiku
        </div>
      </div>
    </aside>
  )
}
