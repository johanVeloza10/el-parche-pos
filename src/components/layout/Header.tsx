"use client"

import { LogOut, Menu, Bell, AlertTriangle } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    rol: string
  }
  onMenuClick?: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const [pendientesDian, setPendientesDian] = useState(0)

  useEffect(() => {
    const fetchAlertas = () => {
      // Solo el admin y contador necesitan ver las alertas críticas de la DIAN
      if (user.rol === "VENDEDORA") return;

      fetch("/api/alertas/dian")
        .then(res => res.json())
        .then(data => {
          if (typeof data.pendientes === 'number') {
            setPendientesDian(data.pendientes)
          }
        })
        .catch(err => console.error("Error fetching DIAN alerts", err))
    }

    fetchAlertas()
    const interval = setInterval(fetchAlertas, 60000) // Poll every 1 min
    return () => clearInterval(interval)
  }, [user.rol])

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[var(--color-surface)] border-b border-[var(--color-surface-elevated)] z-10 shadow-sm relative">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] opacity-40 shadow-[0_0_8px_rgba(0,229,255,0.4)]" />

      <div className="flex items-center flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden -ml-2 p-2 rounded-md text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)]"
        >
          <span className="sr-only">Abrir menú</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        
        <div className="hidden md:block">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            El Parche <span className="text-[var(--color-primary)]">POS</span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user.rol !== "VENDEDORA" && (
          <button 
            className={`p-2 rounded-full transition-colors relative flex items-center ${
              pendientesDian > 0 
                ? "text-red-500 hover:bg-red-500/10" 
                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-elevated)]"
            }`}
            title={pendientesDian > 0 ? `${pendientesDian} documentos DIAN pendientes` : "Sin alertas"}
          >
            {pendientesDian > 0 ? <AlertTriangle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            {pendientesDian > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[9px] font-bold text-white ring-2 ring-[var(--color-surface)] shadow-[0_0_8px_rgba(229,0,28,0.6)]">
                {pendientesDian}
              </span>
            )}
          </button>
        )}
        
        <div className="h-8 w-px bg-[var(--color-surface-elevated)] mx-2" />
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-white">{user.name}</span>
            <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[150px]">{user.email}</span>
          </div>
          
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] flex items-center justify-center text-black font-black text-sm shadow-[0_0_12px_rgba(0,229,255,0.4)] border border-white/20">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <button
            onClick={() => signOut()}
            className="ml-2 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] rounded-full hover:bg-[var(--color-surface-elevated)] transition-colors group"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  )
}
