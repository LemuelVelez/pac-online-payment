import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
    icon: LucideIcon
    title: string
    description: string
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
    return (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-all">
            <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-purple-400" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">{title}</h4>
            <p className="text-gray-300">{description}</p>
        </div>
    )
}
