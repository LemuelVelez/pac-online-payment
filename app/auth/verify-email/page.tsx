/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAccount } from "@/lib/appwrite"

export default function VerifyEmailPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string>("")
    const [info, setInfo] = useState<string>("")
    const [needsLogin, setNeedsLogin] = useState(false)
    const [isVerified, setIsVerified] = useState<boolean | null>(null)
    const [email, setEmail] = useState<string>("")

    const refreshStatus = async () => {
        setError("")
        try {
            const me = await getAccount().get()
            setEmail(me.email)
            setIsVerified(!!me.emailVerification)
        } catch (err: any) {
            setNeedsLogin(true)
            setIsVerified(null)
            setEmail("")
            setError("You need to login to verify your email.")
        }
    }

    useEffect(() => {
        ; (async () => {
            await refreshStatus()
            setLoading(false)
        })()
    }, [])

    const sendVerification = async () => {
        setError("")
        setInfo("")
        setSending(true)
        try {
            const origin = window.location.origin
            const verifyCallbackUrl = `${origin}/auth/verify-email/callback`
            await getAccount().createVerification(verifyCallbackUrl)
            setInfo("Verification email sent. Please check your inbox.")
        } catch (err: any) {
            setError(err?.message ?? "Failed to send verification email.")
        } finally {
            setSending(false)
        }
    }

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
                            <CardTitle className="text-white">Email Verification</CardTitle>
                            <CardDescription>
                                {loading ? "Checking your verification status..." : "Verify your email to secure your account."}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {error && (
                                <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {info && (
                                <Alert className="bg-emerald-500/20 border-emerald-500/50 text-emerald-200">
                                    <AlertDescription>{info}</AlertDescription>
                                </Alert>
                            )}

                            {!loading && needsLogin && (
                                <div className="text-sm text-gray-300">
                                    Please{" "}
                                    <Link href="/auth" className="underline text-purple-300">
                                        login
                                    </Link>{" "}
                                    first, then return here to verify your email.
                                </div>
                            )}

                            {!loading && !needsLogin && isVerified === true && (
                                <div className="flex items-center gap-2 text-emerald-300">
                                    <BadgeCheck className="h-5 w-5" />
                                    <span>Your email ({email}) is already verified.</span>
                                </div>
                            )}

                            {!loading && !needsLogin && isVerified === false && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-amber-200">
                                        <MailCheck className="h-5 w-5" />
                                        <span>Your email ({email}) is not verified.</span>
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        Click the button below and follow the link in your inbox to complete verification.
                                    </p>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-700 pt-6">
                            <Button
                                variant="outline"
                                className="cursor-pointer w-full sm:w-auto text-slate-700 hover:text-white border-slate-700 hover:bg-slate-700"
                                onClick={refreshStatus}
                                disabled={loading}
                            >
                                Refresh Status
                            </Button>
                            <Button
                                className="cursor-pointer w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                onClick={sendVerification}
                                disabled={loading || needsLogin || isVerified === true || sending}
                            >
                                {sending ? "Sending..." : "Send Verification Email"}
                            </Button>
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
