"use client"

import type React from "react"

import { useState } from "react"
import { DashboardHeader } from "./dashboard-header"
import { DashboardSidebar } from "./dashboard-sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const handleOpenSidebar = () => {
        setIsSidebarOpen(true)
    }

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false)
    }

    return (
        <div className="flex mb-8 h-screen bg-gray-100 dark:bg-gray-900">
            <DashboardSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <DashboardHeader onOpenSidebar={handleOpenSidebar} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900">{children}</main>
            </div>
        </div>
    )
}
