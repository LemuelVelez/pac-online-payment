"use client"

import type React from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return <DashboardLayout allowedRoles={["admin"]}>{children}</DashboardLayout>
}
