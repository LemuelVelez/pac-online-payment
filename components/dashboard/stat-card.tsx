import type React from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  footer?: React.ReactNode
}

export function StatCard({ title, value, icon: Icon, iconColor, iconBgColor, footer }: StatCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-white text-2xl font-bold">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </CardContent>
    </Card>
  )
}

interface StatCardFooterProps {
  label: string
  children: React.ReactNode
}

export function StatCardFooter({ label, children }: StatCardFooterProps) {
  return (
    <>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      {children}
    </>
  )
}

interface ProgressFooterProps {
  value: number
  label: string
}

export function ProgressFooter({ value, label }: ProgressFooterProps) {
  return (
    <div className="space-y-2">
      <Progress value={value} className="h-2 bg-slate-700" />
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  )
}
