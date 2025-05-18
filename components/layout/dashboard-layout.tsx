"use client"

import type React from "react"

import { useState } from "react"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-10 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />
                {children}
            </div>
        </div>
    )
}
