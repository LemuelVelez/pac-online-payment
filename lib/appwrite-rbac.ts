"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getCurrentUserSafe, getOrCreateUserRole, roleToDashboard } from "@/lib/appwrite"

type Role = "admin" | "cashier" | "business-office" | "student"

const ROUTE_RULES: Array<{ prefix: string; allow: Role[] }> = [
  { prefix: "/admin", allow: ["admin"] },
  { prefix: "/cashier", allow: ["cashier", "admin"] },
  { prefix: "/business-office", allow: ["business-office", "admin"] },
  { prefix: "/dashboard", allow: ["student"] },
]

function normalizeRole(r?: string | null): Role {
  const k = (r ?? "").toLowerCase()
  if (k === "admin") return "admin"
  if (k === "cashier") return "cashier"
  if (k === "business-office" || k === "business_office" || k === "businessoffice") return "business-office"
  return "student"
}

function matchRule(pathname: string) {
  return ROUTE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"))
}

export function useSessionRole() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<null | { id: string; name?: string | null; email?: string | null }>(null)
  const [role, setRole] = useState<Role>("student")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = await getCurrentUserSafe()
        if (!mounted) return
        if (!me) {
          setUser(null)
          setRole("student")
        } else {
          setUser({ id: me.$id, name: me.name, email: me.email })
          const r = await getOrCreateUserRole(me.$id, me.email, me.name)
          if (!mounted) return
          setRole(normalizeRole(r))
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const dashboardHref = useMemo(() => roleToDashboard(role), [role])

  return { loading, user, role, dashboardHref }
}

/** Global RBAC route guard */
export function RbacGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading, user, role } = useSessionRole()
  const redirected = useRef(false)

  useEffect(() => {
    if (loading || redirected.current) return
    const rule = matchRule(pathname)
    if (!rule) return

    if (!user) {
      redirected.current = true
      const next = encodeURIComponent(pathname)
      // use `redirect` to align with /auth
      router.replace(`/auth?redirect=${next}`)
      return
    }

    const isAllowed = rule.allow.includes(role)
    if (!isAllowed) {
      redirected.current = true
      router.replace(roleToDashboard(role))
    }
  }, [loading, user, role, pathname, router])

  return children
}
