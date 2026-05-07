import { useLocation } from 'react-router-dom'
import { Search, Bell, ChevronRight } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/upload': 'Document Ingest',
  '/schema-review': 'Schema Review',
  '/evaluation': 'Evaluation',
  '/hitl': 'Review Queue',
  '/reports': 'Reports',
}

const CRUMBS: Record<string, string[]> = {
  '/': ['Workspace', 'Overview'],
  '/upload': ['Workspace', 'Ingest'],
  '/schema-review': ['Workspace', 'Schema Review'],
  '/evaluation': ['Workspace', 'Evaluation'],
  '/hitl': ['Workspace', 'Review Queue'],
  '/reports': ['Workspace', 'Reports'],
}

export default function Header() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ||
    (pathname.startsWith('/hitl/') ? 'Review Card' : 'VerdictAI')
  const crumbs = CRUMBS[pathname] ||
    (pathname.startsWith('/hitl/') ? ['Workspace', 'Review Queue', 'Card'] : ['Workspace'])

  return (
    <header className="h-14 sticky top-0 z-20 flex items-center justify-between px-6 border-b border-[rgba(148,123,220,0.06)] bg-[#0a0710]/70 backdrop-blur-xl">
      <div>
        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-zinc-700" />}
              <span className={i === crumbs.length - 1 ? 'text-zinc-200' : ''}>
                {c}
              </span>
            </span>
          ))}
        </div>
        <div className="text-[15px] font-medium tracking-tight text-white mt-0.5">
          {title}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Search tenders, bidders…"
            className="w-full pl-8 pr-2 py-1.5 bg-[rgba(10,7,16,0.6)] border border-[rgba(148,123,220,0.1)] rounded-lg text-[12px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[rgba(167,139,250,0.4)] transition"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 px-1.5 py-0.5 rounded border border-[rgba(148,123,220,0.1)] bg-[rgba(148,123,220,0.04)] mono">
            ⌘K
          </kbd>
        </div>

        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-[rgba(10,7,16,0.6)] border border-[rgba(148,123,220,0.1)] text-zinc-400 hover:text-zinc-200 hover:bg-[rgba(148,123,220,0.05)] transition">
          <Bell className="w-3.5 h-3.5" strokeWidth={1.8} />
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#c4b5fd] rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#6366f1] flex items-center justify-center text-[11px] font-semibold text-white">
          PS
        </div>
      </div>
    </header>
  )
}
