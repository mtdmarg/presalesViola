"use client"

import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ChangePasswordDialog from "./ChangePasswordDialog"
import { LogOut, Menu } from "lucide-react"

interface HeaderUser {
  username: string
  full_name: string | null
  role: "admin" | "viewer"
}

function getInitials(name: string | null, username: string): string {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return username.slice(0, 2).toUpperCase()
}

export default function Header({
  user,
  onMenuClick,
}: {
  user: HeaderUser
  onMenuClick?: () => void
}) {
  const initials = getInitials(user.full_name, user.username)
  const displayName = user.full_name ?? user.username

  return (
    <header className="h-14 bg-white border-b border-zinc-200 flex items-center gap-2 px-4 md:px-6 flex-shrink-0">
      {/* Hamburger — solo mobile */}
      <button
        className="md:hidden p-2 rounded-md text-zinc-500 hover:bg-zinc-100 transition-colors"
        onClick={onMenuClick}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Avatar con dropdown de perfil */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity rounded-lg px-2 py-1" />
          }
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-zinc-900 leading-tight">{displayName}</p>
            <p className="text-xs text-zinc-400 leading-tight">{user.username}</p>
          </div>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs font-medium bg-zinc-200 text-zinc-700">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">

          {/* Info del usuario — fuera de Group para evitar GroupLabel constraint */}
          <div className="px-3 py-2 border-b border-zinc-100 mb-1">
            <p className="font-medium text-sm text-zinc-900">{displayName}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{user.username}</p>
            <div className="mt-1.5">
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="text-xs"
              >
                {user.role === "admin" ? "Administrador" : "Viewer"}
              </Badge>
            </div>
          </div>

          {/* Acciones — dentro de Group */}
          <DropdownMenuGroup>
            {/* Cambiar contraseña */}
            <div className="px-1 py-0.5">
              <ChangePasswordDialog />
            </div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Cerrar sesión */}
          <div className="px-1 py-1">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>

        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
