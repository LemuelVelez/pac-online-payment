"use client"

import { useRouter } from "next/navigation"
import { Bell, Menu, User, Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/auth-provider"
import { roleDisplayNames } from "@/components/navigation/role-navigation"

interface DashboardHeaderProps {
  onOpenSidebar: () => void
}

export function DashboardHeader({ onOpenSidebar }: DashboardHeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const handleProfileClick = () => {
    const rolePrefix = user?.role === "student" ? "" : `/${user?.role}`
    router.push(`${rolePrefix}/profile`)
  }

  const handleSettingsClick = () => {
    const rolePrefix = user?.role === "student" ? "" : `/${user?.role}`
    router.push(`${rolePrefix}/settings`)
  }

  const displayName = user?.role ? roleDisplayNames[user.role] : "Dashboard"
  const notificationCount = user?.role === "admin" ? 5 : user?.role === "business-office" ? 4 : 3

  return (
    <header className="bg-slate-800/50 border-b border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white lg:hidden cursor-pointer" onClick={onOpenSidebar}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-white">{displayName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative text-gray-400 hover:text-white cursor-pointer">
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {notificationCount}
            </span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer border border-slate-600">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                <AvatarFallback className="bg-slate-700 text-white">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700 text-white">
              <DropdownMenuLabel>{user?.name || "My Account"}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="hover:bg-slate-700 cursor-pointer" onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-slate-700 cursor-pointer" onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="hover:bg-slate-700 cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
