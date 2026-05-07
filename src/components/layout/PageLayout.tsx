import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

interface Props {
  children: ReactNode
}

export default function PageLayout({ children }: Props) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-[#0a0710] relative overflow-x-hidden">
      {/* Ambient background orbs — the signature visual motif */}
      <div className="fixed top-[-20%] left-[20%] w-[600px] h-[600px] orb orb-violet" aria-hidden />
      <div className="fixed top-[40%] right-[-10%] w-[500px] h-[500px] orb orb-pink opacity-30" aria-hidden />
      <div className="fixed bottom-[-10%] left-[10%] w-[500px] h-[500px] orb orb-indigo opacity-30" aria-hidden />

      {/* Noise layer — subtle texture */}
      <div className="fixed inset-0 bg-noise pointer-events-none" aria-hidden />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header />
        <main className="flex-1 px-8 py-8 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[1400px] mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
