'use client'
import { PanelLeft } from 'lucide-react'

export default function NavBar({ onToggleSidebar }) {
  return (
    <header className="w-full bg-white border-b border-slate-200 p-3 flex items-center justify-between">
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 transition"
      >
        <PanelLeft className="w-4 h-4 text-slate-900" />
      </button>
      <div />
    </header>
  )
}
