import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import { Home, Menu, X, ClipboardList, Brain } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="p-4 flex items-center bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <Link to="/" className="ml-4 flex items-center gap-2">
          <Brain className="w-6 h-6 text-cyan-400" />
          <span className="text-lg font-bold text-white tracking-tight">
            Life Strategy<span className="text-cyan-400"> AI</span>
          </span>
        </Link>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">Navigation</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-gray-300 hover:text-white"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600/20 border border-cyan-600/30 text-cyan-400 transition-colors',
            }}
          >
            <Home size={18} />
            <span className="font-medium">Home</span>
          </Link>
          <Link
            to="/questionnaire"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-gray-300 hover:text-white"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600/20 border border-cyan-600/30 text-cyan-400 transition-colors',
            }}
          >
            <ClipboardList size={18} />
            <span className="font-medium">Questionnaire</span>
          </Link>
        </nav>
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
