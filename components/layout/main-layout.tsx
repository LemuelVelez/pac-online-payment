import type React from "react"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"

interface MainLayoutProps {
    children: React.ReactNode
    showFullFooter?: boolean
}

export function MainLayout({ children, showFullFooter = true }: MainLayoutProps) {
    return (
        <div className="max-h-screen bg-gradient-to-br bg-slate-800 flex flex-col overflow-y-auto">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter fullFooter={showFullFooter} />
        </div>
    )
}
