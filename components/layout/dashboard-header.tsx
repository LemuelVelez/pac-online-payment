/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Menu, User, Settings, LogOut, Power, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/components/auth/auth-provider"
import { roleDisplayNames } from "@/components/navigation/role-navigation"
import { getCachedProfilePhoto } from "@/lib/profile"

interface DashboardHeaderProps {
  onOpenSidebar: () => void
}

export function DashboardHeader({ onOpenSidebar }: DashboardHeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuth()

  // Control the dropdown and dialogs explicitly to avoid focus/overlay glitches
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [confirmLogoutAllOpen, setConfirmLogoutAllOpen] = useState(false)

  // Loading states for spinners
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)

  // Avatar handling (use profile photo if available, fall back to user.avatar)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar || getCachedProfilePhoto() || undefined)

  useEffect(() => {
    // Whenever auth user changes, refresh avatar (user.avatar may come from provider)
    setAvatarUrl(user?.avatar || getCachedProfilePhoto() || undefined)
  }, [user?.avatar])

  useEffect(() => {
    // Listen to updates from profile page (upload/save)
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail?.url) setAvatarUrl(detail.url as string)
      else setAvatarUrl(getCachedProfilePhoto() || user?.avatar || undefined)
    }
    const onStorage = () => setAvatarUrl(getCachedProfilePhoto() || user?.avatar || undefined)

    window.addEventListener("profile-photo-changed", onChanged as EventListener)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("profile-photo-changed", onChanged as EventListener)
      window.removeEventListener("storage", onStorage)
    }
  }, [user?.avatar])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }
  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true)
    try {
      await logout(true) // all devices
    } finally {
      setIsLoggingOutAll(false)
    }
  }

  const openConfirmLogout = () => {
    setMenuOpen(false)
    setConfirmLogoutOpen(true)
  }
  const openConfirmLogoutAll = () => {
    setMenuOpen(false)
    setConfirmLogoutAllOpen(true)
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

  const initials = useMemo(() => {
    const n = (user?.name || "").trim()
    if (!n) return "U"
    const parts = n.split(/\s+/).slice(0, 2)
    return parts.map((s) => s[0]?.toUpperCase()).join("")
  }, [user?.name])

  // ---------- Notifications (student-only, persisted read state) ----------
  type Notif = { id: string; title: string; description?: string; href?: string; priority?: number }
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const userId = (user as any)?.$id || (user as any)?.id || (user as any)?.userId || "guest"
  const readKey = `notif.read.v2.${userId}`
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(readKey)
      if (raw) setReadIds(new Set(JSON.parse(raw)))
      else setReadIds(new Set())
    } catch {
      setReadIds(new Set())
    }
  }, [readKey])

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        window.localStorage.setItem(readKey, JSON.stringify(Array.from(next)))
      } catch { }
      return next
    })
  }

  useEffect(() => {
    if ((user?.role || "").toLowerCase() !== "student") {
      setNotifs([])
      return
    }

    const getNum = (k: string): number | undefined => {
      const v = window.localStorage.getItem(k)
      if (!v) return undefined
      const n = Number(v)
      return Number.isFinite(n) ? n : undefined
    }

    const pendingCount = getNum("student.notif.pendingCount") ?? getNum("payment.pendingCount") ?? 0
    const repliedCount = getNum("student.notif.repliedCount") ?? getNum("message.repliedCount") ?? 0
    const totalFees = getNum("student.notif.totalFees") ?? getNum("fees.total")
    const paidTotal = getNum("student.notif.paidTotal") ?? getNum("fees.paidTotal")

    const items: Notif[] = []

    items.push({
      id: "gmail-reminder-1",
      title: "PayMongo receipt",
      description:
        "Please check the Gmail you use to input during your transaction in PayMongo to see your PayMongo receipt after you made a payment.",
      href: "/make-payment",
      priority: 1,
    })

    if (pendingCount && pendingCount > 0) {
      items.push({
        id: `pending-${pendingCount}`,
        title: `${pendingCount} pending payment${pendingCount > 1 ? "s" : ""}`,
        description: "Finish your checkout to complete the payment.",
        href: "/payment-history",
        priority: 2,
      })
    }

    if (repliedCount && repliedCount > 0) {
      items.push({
        id: `cashier-replies-${repliedCount}`,
        title: `Cashier replied (${repliedCount})`,
        description: "Open Payment History to view messages and attachments.",
        href: "/payment-history",
        priority: 3,
      })
    }

    if (typeof totalFees === "number" && Number.isFinite(totalFees)) {
      const paid = (typeof paidTotal === "number" && Number.isFinite(paidTotal)) ? paidTotal : 0
      const balance = Math.max(0, totalFees - paid)
      items.push({
        id: `balance-${Math.round(balance)}`,
        title: `Current balance: ₱${balance.toLocaleString()}`,
        description: `Total fees: ₱${totalFees.toLocaleString()} • Paid: ₱${paid.toLocaleString()}`,
        href: "/make-payment",
        priority: 4,
      })
    }

    items.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
    setNotifs(items)
  }, [user?.role])

  const visibleNotifs = useMemo(() => notifs.filter((n) => !readIds.has(n.id)), [notifs, readIds])
  const unreadCount = visibleNotifs.length
  // -----------------------------------------------------------------------

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
          {/* ====== ONLY THIS NOTIFICATION BLOCK MODIFIED ====== */}
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <button className="relative text-gray-400 hover:text-white cursor-pointer" aria-label="Notifications">
                <Bell className="h-6 w-6" />
                {/* Hide badge entirely when there are zero unread */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96 bg-slate-800 border-slate-700 text-white">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />

              {user?.role?.toLowerCase() === "student" ? (
                visibleNotifs.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-slate-300">No notifications.</div>
                ) : (
                  <div className="max-h-[70vh] overflow-y-auto">
                    {visibleNotifs.map((n, i) => (
                      <div key={n.id}>
                        <DropdownMenuItem
                          className="hover:bg-slate-700 cursor-pointer py-3"
                          onSelect={(e) => {
                            e.preventDefault()
                            markAsRead(n.id)
                            setNotifOpen(false)
                            if (n.href) router.push(n.href)
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{n.title}</span>
                            {n.description ? (
                              <span className="mt-0.5 text-xs text-slate-300">{n.description}</span>
                            ) : null}
                          </div>
                        </DropdownMenuItem>
                        {i < visibleNotifs.length - 1 ? (
                          <DropdownMenuSeparator className="bg-slate-700" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="px-3 py-4 text-sm text-slate-300">No notifications for your role.</div>
              )}

              {visibleNotifs.length > 0 ? (
                <>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    className="hover:bg-slate-700 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault()
                      visibleNotifs.forEach((n) => markAsRead(n.id))
                      setNotifOpen(false)
                    }}
                  >
                    Mark all as read
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* ====== END OF NOTIFICATION BLOCK MOD ====== */}

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer border border-slate-600">
                <AvatarImage src={avatarUrl || ""} alt={user?.name || "Avatar"} />
                <AvatarFallback className="bg-slate-700 text-white">
                  {initials}
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

              {/* Log out (all devices) — open controlled dialog */}
              <DropdownMenuItem
                className="hover:bg-slate-700 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault()
                  openConfirmLogoutAll()
                }}
              >
                <Power className="mr-2 h-4 w-4" />
                <span>Log out (all devices)</span>
              </DropdownMenuItem>

              {/* Logout (current device) — open controlled dialog */}
              <DropdownMenuItem
                className="hover:bg-slate-700 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault()
                  openConfirmLogout()
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Confirm: Log out (all devices) */}
          <AlertDialog
            open={confirmLogoutAllOpen}
            onOpenChange={(open) => {
              if (!isLoggingOutAll) setConfirmLogoutAllOpen(open)
            }}
          >
            <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Log out from all devices?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-300">
                  This will end your session on this browser and any other devices where you are signed in.
                  You’ll need to log in again everywhere.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 text-white border-slate-700" disabled={isLoggingOutAll}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="inline-flex items-center"
                  disabled={isLoggingOutAll}
                  onClick={handleLogoutAll}
                  aria-busy={isLoggingOutAll}
                >
                  {isLoggingOutAll ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging out…
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Log out everywhere
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Confirm: Logout (current device) */}
          <AlertDialog
            open={confirmLogoutOpen}
            onOpenChange={(open) => {
              if (!isLoggingOut) setConfirmLogoutOpen(open)
            }}
          >
            <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Log out of this device?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-300">
                  This will end your current session on this browser only.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 text-white border-slate-700" disabled={isLoggingOut}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="inline-flex items-center"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  aria-busy={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging out…
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  )
}
