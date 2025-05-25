"use client"

import type React from "react"

import { useState } from "react"
import { DashboardHeader } from "./dashboard-header"
import { DashboardSidebar } from "./dashboard-sidebar"
import { RoleGuard } from "@/components/auth/role-guard"
import type { UserRole } from "@/components/auth/auth-provider"

interface DashboardLayoutProps {
    children: React.ReactNode
    allowedRoles?: UserRole[]
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const handleOpenSidebar = () => {
        setIsSidebarOpen(true)
    }

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false)
    }

    const content = (
        <div className="flex max-h-screen bg-gray-100 dark:bg-gray-900">
            <DashboardSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
            <div className="flex flex-col flex-1 overflow-y-auto">
                <DashboardHeader onOpenSidebar={handleOpenSidebar} />
                <main className="bg-white dark:bg-gray-900">{children}</main>
            </div>
        </div>
    )

    // If allowedRoles is specified, wrap with RoleGuard
    if (allowedRoles && allowedRoles.length > 0) {
        return <RoleGuard allowedRoles={allowedRoles}>{content}</RoleGuard>
    }

    return content
}
