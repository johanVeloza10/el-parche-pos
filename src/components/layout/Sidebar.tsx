"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Store, 
  Package, 
  Users, 
  Settings, 
  BarChart3, 
  Wallet,
  Scissors,
  Tag,
  X,
  Layers
} from "lucide-react"

interface SidebarProps {
  userRol: string
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ userRol, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { name: "Punto de Venta", href: "/pos", icon: Store, roles: ["ADMIN", "VENDEDORA"] },
    { name: "Apartados", href: "/apartados", icon: Layers, roles: ["ADMIN", "VENDEDORA"] },
    { name: "Inventario", href: "/inventario", icon: Package, roles: ["ADMIN", "VENDEDORA", "CONTADOR"] },
    { name: "Etiquetas", href: "/inventario/etiquetas", icon: Tag, roles: ["ADMIN", "VENDEDORA"] },
    { name: "Proveedores", href: "/proveedores", icon: Users, roles: ["ADMIN", "CONTADOR", "VENDEDORA"] },
    { name: "Producción", href: "/produccion", icon: Scissors, roles: ["ADMIN", "CONTADOR"] },
    { name: "Cuentas", href: "/cuentas", icon: Wallet, roles: ["ADMIN", "CONTADOR"] },
    { name: "Caja Diaria", href: "/caja", icon: Store, roles: ["ADMIN", "VENDEDORA"] },
    { name: "Reportes", href: "/reportes", icon: BarChart3, roles: ["ADMIN", "CONTADOR"] },
    { name: "Configuración", href: "/configuracion", icon: Settings, roles: ["ADMIN"] },
  ]

  const filteredNav = navItems.filter(item => item.roles.includes(userRol))

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--color-surface)] border-r border-[var(--color-surface-elevated)] flex flex-col h-full transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    } relative`}>
      {/* Costura brillante de la Bandera de Colombia en el tope */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#FCD116] via-[#003893] to-[#CE1126]" />
      
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-surface-elevated)] relative">
        <span className="font-heading text-2xl uppercase tracking-[0.15em] text-white flex items-baseline gap-1 select-none">
          <span className="font-light italic text-zinc-400 lowercase font-serif">el</span>
          <span className="font-bold text-white">Parche</span>
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-elevated)]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-2 px-3">
          {filteredNav.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative ${
                  isActive 
                    ? "border-stitch-gold text-white shadow-[0_0_15px_rgba(255,231,0,0.08)] translate-x-1" 
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-white"
                }`}
              >
                <Icon 
                  className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                    isActive ? "text-[var(--color-logo-yellow)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-logo-cyan)]"
                  }`} 
                  aria-hidden="true" 
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[var(--color-surface-elevated)]">
        <div className="bg-[#181818] rounded-xl p-4 flex flex-col items-center text-center border border-zinc-800">
          <p className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">Sesión iniciada como</p>
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[var(--color-secondary)] to-blue-400 px-3 py-1 text-xs font-black text-black shadow-[0_0_10px_rgba(0,229,255,0.3)] tracking-wide">
            {userRol}
          </span>
        </div>
      </div>
    </aside>
  )
}
