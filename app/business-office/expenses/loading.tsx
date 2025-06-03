import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex h-screen items-center justify-center bg-slate-900">
            <div className="text-center">
                <div className="mb-4 flex justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <p className="text-gray-400">Loading expense data...</p>
            </div>
        </div>
    )
}
