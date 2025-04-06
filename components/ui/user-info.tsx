"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function UserInfo() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-right hidden sm:block">
        <p className="font-medium">{user.nombre || "Usuario"}</p>
      </div>
      <Avatar className="h-9 w-9 border border-primary/20">
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {user.nombre?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

