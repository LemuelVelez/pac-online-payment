"use client"

import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SupportCardProps {
  icon: LucideIcon
  title: string
  description: string
  buttonText: string
  onClick?: () => void
}

export function SupportCard({ icon: Icon, title, description, buttonText, onClick }: SupportCardProps) {
  return (
    <div className="p-4 bg-slate-700/30 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-5 w-5 text-purple-400" />
        <p className="text-white font-medium">{title}</p>
      </div>
      <p className="text-gray-300 text-sm mb-3">{description}</p>
      <Button
        variant="outline"
        className="w-full text-white border-slate-600 hover:bg-slate-700 hover:text-white"
        onClick={onClick}
      >
        {buttonText}
      </Button>
    </div>
  )
}
