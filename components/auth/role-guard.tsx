"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth, type UserRole } from "@/components/auth/auth-provider"

interface RoleGuardProps {
    allowedRoles: UserRole[]
    children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!isLoading && !user) {
            // User is not logged in, redirect to login
            router.push(`/auth?redirect=${encodeURIComponent(pathname)}`)
            return
        }

        if (!isLoading && user && !allowedRoles.includes(user.role)) {
            // User doesn't have the required role, redirect based on their role
            switch (user.role) {
                case "admin":
                    router.push("/admin/dashboard")
                    break
                case "cashier":
                    router.push("/cashier/dashboard")
                    break
                case "business-office":
                    router.push("/business-office/dashboard")
                    break
                case "student":
                    router.push("/dashboard")
                    break
                default:
                    router.push("/auth")
            }
        }
    }, [isLoading, user, router, allowedRoles, pathname])

    // Show nothing while checking authentication
    if (isLoading || !user || !allowedRoles.includes(user.role)) {
        return null
    }

    return <>{children}</>
}
