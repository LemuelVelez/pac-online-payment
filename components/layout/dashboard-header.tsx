/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Menu, User, Settings, LogOut, Power, Loader2, Trash2 as Delete, Check } from "lucide-react"
import { toast } from "sonner"

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/components/auth/auth-provider"
import { roleDisplayNames } from "@/components/navigation/role-navigation"
import { getCachedProfilePhoto } from "@/lib/profile"

import {
  type NotificationDoc,
  listUserNotifications,
  subscribeToNotificationFeed,
  startPaymentAndMessageBridges,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  parseNotificationText,
  startCashierRealtimeBridge,
  startAdminRealtimeBridge,
} from "@/lib/notification"

interface DashboardHeaderProps {
  onOpenSidebar: () => void
}

function timeAgo(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const diff = Math.max(0, Date.now() - d.getTime())
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const dd = Math.floor(h / 24)
  return `${dd}d ago`
}

type RowState = { saving?: boolean; deleting?: boolean }

export function DashboardHeader({ onOpenSidebar }: DashboardHeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuth()

  // Role helpers
  const role = (user as any)?.role as string | undefined
  const hideNotifications = role === "business-office"

  // Profile menu state
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [confirmLogoutAllOpen, setConfirmLogoutAllOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar || getCachedProfilePhoto() || undefined)
  useEffect(() => {
    setAvatarUrl(user?.avatar || getCachedProfilePhoto() || undefined)
  }, [user?.avatar])
  useEffect(() => {
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
    try { await logout() } finally { setIsLoggingOut(false) }
  }
  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true)
    try { await logout(true) } finally { setIsLoggingOutAll(false) }
  }
  const openConfirmLogout = () => { setMenuOpen(false); setConfirmLogoutOpen(true) }
  const openConfirmLogoutAll = () => { setMenuOpen(false); setConfirmLogoutAllOpen(true) }

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

  /* ===================== Appwrite Notifications (userId-based) ===================== */
  const [notifOpen, setNotifOpen] = useState(false)
  const [loadingNotifs, setLoadingNotifs] = useState(true)
  const [items, setItems] = useState<NotificationDoc[]>([])
  const [rowState, setRowState] = useState<Record<string, RowState>>({})
  const meRef = useRef<{ id: string } | null>(null)
  const userId: string | undefined =
    (user as any)?.$id || (user as any)?.id || (user as any)?.userId || undefined

  const unreadCount = useMemo(() => items.filter((n) => n.status === "unread").length, [items])

  useEffect(() => {
    // If not logged in OR role is business-office, skip notifications entirely
    if (!userId || hideNotifications) {
      setItems([])
      setLoadingNotifs(false)
      return
    }
    meRef.current = { id: String(userId) }

    let stopNotifs: null | (() => void) = null
    let stopStudentBridge: null | (() => void) = null
    let stopCashierBridge: null | (() => void) = null
    let stopAdminBridge: null | (() => void) = null
    let mounted = true

      ; (async () => {
        setLoadingNotifs(true)
        try {
          const list = await listUserNotifications(userId, 50)
          if (!mounted) return
          setItems(list)

          stopNotifs = subscribeToNotificationFeed(
            userId,
            (doc) => {
              setItems((prev) => {
                const exists = prev.some((p) => p.$id === doc.$id)
                return exists ? prev : [doc, ...prev].sort((a, b) => b.$createdAt.localeCompare(a.$createdAt))
              })
            },
            (doc) => setItems((prev) => prev.map((p) => (p.$id === doc.$id ? doc : p))),
            (removedId) => setItems((prev) => prev.filter((p) => p.$id !== removedId))
          )

          // Student-side bridge (kept)
          stopStudentBridge = startPaymentAndMessageBridges(userId)

          // Cashier-side bridge (kept)
          const isCashier = role === "cashier"
          if (isCashier) {
            stopCashierBridge = startCashierRealtimeBridge(userId)
          }

          // Admin-side bridge (kept)
          const isAdmin = role === "admin"
          if (isAdmin) {
            stopAdminBridge = startAdminRealtimeBridge(userId)
          }
        } catch (err: any) {
          toast.error("Notifications failed to load", { description: err?.message || "Please try again." })
        } finally {
          if (mounted) setLoadingNotifs(false)
        }
      })()

    return () => {
      mounted = false
      try { stopNotifs?.() } catch { }
      try { stopStudentBridge?.() } catch { }
      try { stopCashierBridge?.() } catch { }
      try { stopAdminBridge?.() } catch { }
    }
  }, [userId, role, hideNotifications])

  const onMarkAsRead = useCallback(async (id: string) => {
    setRowState((s) => ({ ...s, [id]: { ...s[id], saving: true } }))
    try {
      const updated = await markNotificationRead(id)
      setItems((prev) => prev.map((p) => (p.$id === id ? updated : p)))
      toast.success("Marked as read")
    } catch (e: any) {
      toast.error("Failed to mark as read", { description: e?.message || "Please try again." })
    } finally {
      setRowState((s) => ({ ...s, [id]: { ...s[id], saving: false } } ))
    }
  }, [])

  const onDelete = useCallback(async (id: string) => {
    setRowState((s) => ({ ...s, [id]: { ...s[id], deleting: true } }))
    try {
      await deleteNotification(id, { onlyIfRead: true })
      setItems((prev) => prev.filter((p) => p.$id !== id))
      toast.success("Notification deleted")
    } catch (e: any) {
      toast.error("Delete failed", { description: e?.message || "Please mark it as read first." })
    } finally {
      setRowState((s) => ({ ...s, [id]: { ...s[id], deleting: false } } ))
    }
  }, [])

  const onMarkAllRead = useCallback(async () => {
    if (!meRef.current) return
    try {
      await markAllNotificationsRead(meRef.current.id)
      setItems((prev) => prev.map((p) => (p.status === "unread" ? { ...p, status: "read" } : p)))
      toast.success("All notifications marked as read")
    } catch (e: any) {
      toast.error("Could not mark all as read", { description: e?.message || "Please try again." })
    }
  }, [])

  /** Fallback: route guesser for legacy notifications without href tag */
  const fallbackHref = (cleanText: string): string | undefined => {
    const t = cleanText.toLowerCase()
    if (t.includes("cashier replied") || t.includes("payment ")) return "/payment-history"
    if (t.includes("pending") || t.includes("online payment") || t.includes("student message")) return "/cashier/transactions"
    if (t.includes("new user registered")) return "/admin/users"
    return undefined
  }

  const handleOpenNotification = async (doc: NotificationDoc) => {
    const { clean, href } = parseNotificationText(doc.notification)
    if (doc.status === "unread") {
      try { await onMarkAsRead(doc.$id) } catch { }
    }
    const target = href || fallbackHref(clean)
    setNotifOpen(false)
    if (target) router.push(target)
  }
  /* ============================================================================= */

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
          {/* ====== NOTIFICATIONS (hidden for business-office) ====== */}
          {!hideNotifications && (
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <button className="relative text-gray-400 hover:text-white cursor-pointer" aria-label="Notifications">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>

              {/* Modified this line to make the notifications dropdown responsive on small screens.
                  It now uses an arbitrary width that is the minimum of 24rem (desktop) and 92vw (mobile). */}
              <DropdownMenuContent align="end" className="w-[min(24rem,92vw)] bg-slate-800 border-slate-700 text-white">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />

                {loadingNotifs ? (
                  <div className="px-3 py-6 text-sm text-slate-300 flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </div>
                ) : items.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-slate-300">No notifications.</div>
                ) : (
                  <div className="max-h-[70vh] overflow-y-auto">
                    {items.map((n, i) => {
                      const st = rowState[n.$id] || {}
                      const unread = n.status === "unread"
                      const { clean, href } = parseNotificationText(n.notification)
                      return (
                        <div key={n.$id}>
                          <DropdownMenuItem
                            className="hover:bg-slate-700 cursor-pointer py-3"
                            onSelect={async (e) => {
                              e.preventDefault()
                              await handleOpenNotification(n)
                            }}
                          >
                            <div className="flex w-full items-start gap-3">
                              <span
                                className={`mt-2 h-2 w-2 rounded-full ${unread ? "bg-blue-400" : "bg-slate-600"}`}
                                aria-hidden
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm">{clean}</div>
                                <div className="mt-1 text-xs text-slate-300">{timeAgo(n.$createdAt)}</div>
                                {href ? <span className="sr-only">Opens {href}</span> : null}
                              </div>
                              <div className="flex items-center gap-1">
                                {unread ? (
                                  <button
                                    className="text-blue-300 hover:text-blue-200"
                                    title="Mark as read"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      await onMarkAsRead(n.$id)
                                    }}
                                    disabled={!!st.saving}
                                  >
                                    {st.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                  </button>
                                ) : (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        className="text-red-300 hover:text-red-200"
                                        title="Delete (only read)"
                                        disabled={!!st.deleting}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {st.deleting ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Delete className="h-4 w-4" />
                                        )}
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete notification?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-300">
                                          This action cannot be undone. Only <b>read</b> notifications can be deleted.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-600 hover:bg-red-700"
                                          onClick={async () => {
                                            await onDelete(n.$id)
                                          }}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          </DropdownMenuItem>
                          {i < items.length - 1 ? (
                            <DropdownMenuSeparator className="bg-slate-700" />
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}

                {items.length > 0 ? (
                  <>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      className="hover:bg-slate-700 cursor-pointer"
                      onSelect={async (e) => {
                        e.preventDefault()
                        await onMarkAllRead()
                        setNotifOpen(false)
                      }}
                    >
                      Mark all as read
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Profile + Menu */}
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
                <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 cursor-pointer" disabled={isLoggingOutAll}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="inline-flex items-center cursor-pointer"
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
                <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 cursor-pointer" disabled={isLoggingOut}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="inline-flex items-center cursor-pointer"
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
