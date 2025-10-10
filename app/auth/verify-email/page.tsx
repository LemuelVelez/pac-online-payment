/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, MailCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAccount, getOrCreateUserRole, roleToDashboard } from "@/lib/appwrite"

const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyEmailPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)        // initial page check state
    const [refreshing, setRefreshing] = useState(false) // button: refresh
    const [sending, setSending] = useState(false)       // button: send email
    const [continuing, setContinuing] = useState(false) // button: continue to dashboard

    const [error, setError] = useState<string>("")
    const [info, setInfo] = useState<string>("")
    const [needsLogin, setNeedsLogin] = useState(false)
    const [isVerified, setIsVerified] = useState<boolean | null>(null)
    const [email, setEmail] = useState<string>("")

    // Cooldown state for "Send Verification Email"
    const [cooldown, setCooldown] = useState<number>(0)

    // Key for localStorage, tie to email if available so cooldown is per-account
    const cooldownKey = useMemo(
        () => (email ? `verifyEmailLastSentAt:${email}` : "verifyEmailLastSentAt"),
        [email]
    )

    const computeSecondsLeft = (lastSentAtMs: number | null) => {
        if (!lastSentAtMs) return 0
        const elapsed = Math.floor((Date.now() - lastSentAtMs) / 1000)
        const left = RESEND_COOLDOWN_SECONDS - elapsed
        return left > 0 ? left : 0
    }

    const loadCooldownFromStorage = () => {
        try {
            const raw = localStorage.getItem(cooldownKey)
            const lastSentAt = raw ? parseInt(raw, 10) : null
            const left = computeSecondsLeft(lastSentAt)
            setCooldown(left)
        } catch {
            setCooldown(0)
        }
    }

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

    // Initial status check
    useEffect(() => {
        ; (async () => {
            await refreshStatus()
            setLoading(false)
        })()
    }, [])

    // Load cooldown whenever we know the email (or key changes)
    useEffect(() => {
        if (typeof window === "undefined") return
        // Slight defer to ensure email has been set before reading
        loadCooldownFromStorage()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cooldownKey])

    // Tick down the cooldown every second
    useEffect(() => {
        if (cooldown <= 0) return
        const id = setInterval(() => {
            setCooldown((s) => (s > 1 ? s - 1 : 0))
        }, 1000)
        return () => clearInterval(id)
    }, [cooldown])

    const sendVerification = async () => {
        setError("")
        setInfo("")
        setSending(true)
        try {
            const origin = window.location.origin
            const verifyCallbackUrl = `${origin}/auth/verify-email/callback`
            await getAccount().createVerification(verifyCallbackUrl)

            // Start cooldown
            try {
                localStorage.setItem(cooldownKey, String(Date.now()))
            } catch {
                // ignore storage errors
            }
            setCooldown(RESEND_COOLDOWN_SECONDS)

            setInfo("Verification email sent. Please check your inbox.")
        } catch (err: any) {
            setError(err?.message ?? "Failed to send verification email.")
        } finally {
            setSending(false)
        }
    }

    const onRefreshClick = async () => {
        setRefreshing(true)
        try {
            await refreshStatus()
            // Also re-check cooldown in case account/email changed
            loadCooldownFromStorage()
        } finally {
            setRefreshing(false)
        }
    }

    const goToDashboard = async () => {
        setContinuing(true)
        setError("")
        try {
            const me = await getAccount().get()
            if (!me.emailVerification) {
                setInfo("Please verify your email first.")
                return
            }
            const role = await getOrCreateUserRole(me.$id, me.email, me.name)
            router.replace(roleToDashboard(role))
        } catch (e) {
            setError("Unable to route to dashboard.")
        } finally {
            setContinuing(false)
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

                        {/* Responsive, non-overflowing footer */}
                        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between border-t border-slate-700 pt-6">
                            <Button
                                variant="outline"
                                className="cursor-pointer w-full sm:w-auto text-slate-700 hover:text-white border-slate-700 hover:bg-slate-700 inline-flex items-center gap-2"
                                onClick={onRefreshClick}
                                disabled={loading || refreshing}
                                title="Refresh your verification status"
                            >
                                {refreshing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Refreshing…
                                    </>
                                ) : (
                                    <>Refresh Status</>
                                )}
                            </Button>

                            <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:flex-wrap gap-3">
                                <Button
                                    className="cursor-pointer w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 inline-flex items-center gap-2"
                                    onClick={sendVerification}
                                    disabled={loading || needsLogin || isVerified === true || sending || cooldown > 0}
                                    title={
                                        cooldown > 0
                                            ? `You can resend in ${cooldown}s`
                                            : "Send a verification email to your address"
                                    }
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending…
                                        </>
                                    ) : cooldown > 0 ? (
                                        <>Resend in {cooldown}s</>
                                    ) : (
                                        <>Send Verification Email</>
                                    )}
                                </Button>

                                {isVerified === true && (
                                    <Button
                                        variant="secondary"
                                        className="cursor-pointer w-full sm:w-auto inline-flex items-center gap-2"
                                        onClick={goToDashboard}
                                        disabled={continuing}
                                        title="Continue to your dashboard"
                                    >
                                        {continuing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Continuing…
                                            </>
                                        ) : (
                                            <>Continue to Dashboard</>
                                        )}
                                    </Button>
                                )}
                            </div>
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
