"use client"

import Link from "next/link"
import ViolaLogo from "./ViolaLogo"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Megaphone,
  UserCog,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/leads", label: "Leads", icon: <Users size={18} /> },
  { href: "/campanas", label: "Campañas", icon: <Megaphone size={18} /> },
  { href: "/usuarios", label: "Usuarios", icon: <UserCog size={18} />, adminOnly: true },
]

interface SidebarProps {
  role: "admin" | "viewer"
  onClose?: () => void
}

export default function Sidebar({ role, onClose }: SidebarProps) {
  const pathname = usePathname()
  const visibleItems = navItems.filter((item) => !item.adminOnly || role === "admin")

  return (
    <aside className="w-64 h-full flex-shrink-0 bg-zinc-900 text-zinc-100 flex flex-col">
      {/* Logo + close button (close solo visible en mobile) */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800">
        <ViolaLogo width={150} className="invert brightness-200" />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden ml-3 p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                isActive
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              )}
            >
              <span className={cn(isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-100")}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-zinc-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">MTDM Company © {new Date().getFullYear()}</p>
      </div>
    </aside>
  )
}
