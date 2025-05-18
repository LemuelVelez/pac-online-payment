import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
    return (
        <header className="container mx-auto py-6 px-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                    P
                </div>
                <h1 className="text-white text-xl font-bold">PAC Salug Campus</h1>
            </div>
            <div className="flex gap-4">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                    About
                </Button>
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                    Help
                </Button>
                <Button variant="outline" className="text-white border-white hover:bg-white/10">
                    Contact
                </Button>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        </header>
    )
}
