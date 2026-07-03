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
  Tag
} from "lucide-react"

interface SidebarProps {
  userRol: string
}

export default function Sidebar({ userRol }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { name: "Punto de Venta", href: "/pos", icon: Store, roles: ["ADMIN", "VENDEDORA"] },
    { name: "Inventario", href: "/inventario", icon: Package, roles: ["ADMIN", "VENDEDORA", "CONTADOR"] },
    { name: "Etiquetas", href: "/inventario/etiquetas", icon: Tag, roles: ["ADMIN", "VENDEDORA"] },
    { name: "Proveedores", href: "/proveedores", icon: Users, roles: ["ADMIN", "CONTADOR", "VENDEDORA"] },
    { name: "Producción", href: "/produccion", icon: Scissors, roles: ["ADMIN", "CONTADOR"] },
    { name: "Cuentas", href: "/cuentas", icon: Wallet, roles: ["ADMIN", "CONTADOR"] },
    { name: "Reportes", href: "/reportes", icon: BarChart3, roles: ["ADMIN", "CONTADOR"] },
    { name: "Configuración", href: "/configuracion", icon: Settings, roles: ["ADMIN"] },
  ]

  const filteredNav = navItems.filter(item => item.roles.includes(userRol))

  return (
    <aside className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-surface-elevated)] hidden md:flex flex-col h-full z-20 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] shadow-[0_0_10px_rgba(255,231,0,0.5)]" />
      
      <div className="h-16 flex items-center px-6 border-b border-[var(--color-surface-elevated)]">
        <span className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
          el
          <span className="bg-gradient-to-br from-[var(--color-primary)] to-[#FFA500] bg-clip-text text-transparent">
            Parche
          </span>
        </span>
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
                className={`group flex items-center px-3 py-3 text-sm font-bold rounded-xl transition-all duration-300 relative ${
                  isActive 
                    ? "bg-gradient-to-r from-[var(--color-primary)] to-[#FFCC00] text-black shadow-[0_0_15px_rgba(255,231,0,0.4)] translate-x-1" 
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-white"
                }`}
              >
                <Icon 
                  className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                    isActive ? "text-black" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-secondary)]"
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
