/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ShieldCheck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAccount } from "@/lib/appwrite"

export default function VerifyEmailCallbackPage() {
    const sp = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string>("")

    useEffect(() => {
        ; (async () => {
            const userId = sp.get("userId") ?? ""
            const secret = sp.get("secret") ?? ""
            if (!userId || !secret) {
                setError("Invalid verification link. Missing parameters.")
                setLoading(false)
                return
            }
            try {
                await getAccount().updateVerification(userId, secret)
                setSuccess(true)
            } catch (err: any) {
                setError(err?.message ?? "Verification failed. The link may have expired.")
            } finally {
                setLoading(false)
            }
        })()
    }, [sp])

    return (
        <div className="min-h-screen max-h-screen overflow-y-auto bg-slate-800 flex flex-col">
            <header className="container mx-auto py-6 px-4">
                <Link href="/auth" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back to Login</span>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                            P
                        </div>
                        <h1 className="text-2xl font-bold text-white">PAC Salug Campus</h1>
                        <p className="text-gray-300">Online Payment System</p>
                    </div>

                    <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white">Verify Email</CardTitle>
                            <CardDescription>Finalizing verification…</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {loading && (
                                <Alert className="bg-slate-700/50 border-slate-600 text-gray-200">
                                    <AlertDescription>Processing your verification link…</AlertDescription>
                                </Alert>
                            )}

                            {!loading && success && (
                                <Alert className="bg-emerald-500/20 border-emerald-500/50 text-emerald-200">
                                    <AlertDescription className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5" />
                                        Your email is now verified. You can proceed to login.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {!loading && !success && error && (
                                <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
                                    <AlertDescription className="flex items-center gap-2">
                                        <XCircle className="h-5 w-5" />
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-center border-t border-slate-700 pt-6">
                            <Link href="/auth">
                                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                                    Go to Login
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </main>

            <footer className="py-6 text-center text-gray-400 text-sm">
                <p>© {new Date().getFullYear()} PAC Salug Campus. All rights reserved.</p>
            </footer>
        </div>
    )
}
