import type { LucideIcon } from "lucide-react"

interface TransactionItemProps {
    icon: LucideIcon
    iconColor: string
    iconBgColor: string
    title: string
    date: string
    amount: string
    status: string
    statusColor: string
}

export function TransactionItem({
    icon: Icon,
    iconColor,
    iconBgColor,
    title,
    date,
    amount,
    status,
    statusColor,
}: TransactionItemProps) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full ${iconBgColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                    <p className="text-white font-medium">{title}</p>
                    <p className="text-gray-400 text-sm">{date}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-white font-medium">{amount}</p>
                <p className={statusColor}>{status}</p>
            </div>
        </div>
    )
}
