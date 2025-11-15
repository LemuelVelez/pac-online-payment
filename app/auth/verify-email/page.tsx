/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, MailCheck, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAccount, getOrCreateUserRole, roleToDashboard } from "@/lib/appwrite"
import { toast } from "sonner"

const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyEmailPage() {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [sending, setSending] = useState(false)
    const [continuing, setContinuing] = useState(false)
    const [updatingEmail, setUpdatingEmail] = useState(false)
    const [signingOut, setSigningOut] = useState(false)

    const [error, setError] = useState<string>("")
    const [info, setInfo] = useState<string>("")
    const [needsLogin, setNeedsLogin] = useState(false)
    const [isVerified, setIsVerified] = useState<boolean | null>(null)
    const [email, setEmail] = useState<string>("")

    const [newEmail, setNewEmail] = useState<string>("")
    const [currentPassword, setCurrentPassword] = useState<string>("")
    const [showPassword, setShowPassword] = useState<boolean>(false)

    const [cooldown, setCooldown] = useState<number>(0)
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

    // ✅ Stabilize this function so exhaustive-deps is satisfied
    const loadCooldownFromStorage = useCallback(() => {
        try {
            const raw = localStorage.getItem(cooldownKey)
            const lastSentAt = raw ? parseInt(raw, 10) : null
            const left = computeSecondsLeft(lastSentAt)
            setCooldown(left)
        } catch {
            setCooldown(0)
        }
    }, [cooldownKey])

    const refreshStatus = async () => {
        setError("")
        try {
            const me = await getAccount().get()
            setEmail(me.email)
            setIsVerified(!!me.emailVerification)
            setNewEmail(me.email)
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

    useEffect(() => {
        if (typeof window === "undefined") return
        loadCooldownFromStorage()
    }, [loadCooldownFromStorage])

    useEffect(() => {
        if (cooldown <= 0) return
        const id = setInterval(() => setCooldown((s) => (s > 1 ? s - 1 : 0)), 1000)
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
            try {
                localStorage.setItem(cooldownKey, String(Date.now()))
            } catch { }
            setCooldown(RESEND_COOLDOWN_SECONDS)
            setInfo("Verification email sent. Please check your inbox or spam folder.")
            toast.success("Verification email sent", {
                description: "Check your inbox or spam folder to verify your email.",
            })
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
            loadCooldownFromStorage()
        } finally {
            setRefreshing(false)
        }
    }

    const onChangeEmail = async () => {
        setError("")
        setInfo("")
        if (!newEmail || !currentPassword) {
            setError("Please enter your new email and your current password.")
            return
        }
        if (newEmail === email) {
            setError("The new email is the same as your current email.")
            return
        }

        setUpdatingEmail(true)
        try {
            await getAccount().updateEmail(newEmail, currentPassword)
            setEmail(newEmail)
            setIsVerified(false)
            try {
                const origin = window.location.origin
                const verifyCallbackUrl = `${origin}/auth/verify-email/callback`
                await getAccount().createVerification(verifyCallbackUrl)
                try {
                    localStorage.setItem(`verifyEmailLastSentAt:${newEmail}`, String(Date.now()))
                } catch { }
                setCooldown(RESEND_COOLDOWN_SECONDS)
            } catch { }
            setInfo("Email updated. We've sent a new verification link to your new address.")
            setCurrentPassword("")
            toast.success("Email updated", {
                description: "A new verification link has been sent to your new email.",
            })
        } catch (err: any) {
            setError(err?.message ?? "Could not update email. Please double-check your password.")
        } finally {
            setUpdatingEmail(false)
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
        } catch {
            setError("Unable to route to dashboard.")
        } finally {
            setContinuing(false)
        }
    }

    const onSignOut = async () => {
        setSigningOut(true)
        try {
            await getAccount().deleteSession("current")
        } catch {
        } finally {
            setSigningOut(false)
            router.replace("/auth")
        }
    }

    return (
        <div className="min-h-screen max-h-screen overflow-y-auto bg-slate-800 flex flex-col">
            <header className="container mx-auto py-6 px-4">
                <Link href="/auth" className="flex items-center gap-2 text-white hover:text-sky-300 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back to Login</span>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Image
                            src="/images/logo.jpg"
                            alt="PAC Salug Campus logo"
                            width={64}
                            height={64}
                            className="h-16 w-16 object-contain mx-auto mb-4"
                            priority
                        />
                        <h1 className="text-2xl font-bold text-white">PAC Salug Campus</h1>
                        <p className="text-gray-300">Online Payment System</p>
                    </div>

                    <Card className="border-sky-500/20 bg-slate-800/50 backdrop-blur-sm">
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
                                    <Link href="/auth" className="underline text-sky-400">
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
                                        Click the button below and follow the link in your inbox or spam folder to complete verification.
                                    </p>
                                </div>
                            )}

                            {!loading && !needsLogin && isVerified === false && (
                                <div className="mt-6 rounded-md border border-slate-700 p-4 bg-slate-900/40">
                                    <h3 className="text-sm font-semibold text-white mb-3">Entered the wrong email?</h3>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="new-email" className="text-sm text-gray-200">
                                                New email
                                            </Label>
                                            <Input
                                                id="new-email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="bg-slate-900/50 border-slate-700 text-white"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                                spellCheck={false}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="current-password" className="text-sm text-gray-200">
                                                Current password
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="current-password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter your password"
                                                    className="bg-slate-900/50 border-slate-700 text-white pr-10"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    autoComplete="current-password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                    title={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                            <Button
                                                className="inline-flex items-center gap-2 w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
                                                onClick={onChangeEmail}
                                                disabled={updatingEmail || !newEmail || !currentPassword}
                                                title="Update your email and resend the verification link"
                                            >
                                                {updatingEmail ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Updating…
                                                    </>
                                                ) : (
                                                    <>Change Email & Resend</>
                                                )}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="inline-flex items-center gap-2 w-full sm:w-auto text-slate-200 border-slate-700 hover:bg-slate-800"
                                                onClick={onSignOut}
                                                disabled={signingOut}
                                                title="Sign out and return to login"
                                            >
                                                {signingOut ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Signing out…
                                                    </>
                                                ) : (
                                                    <>Sign out</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between border-t border-slate-700 pt-6">
                            <Button
                                variant="outline"
                                className="cursor-pointer w-full sm:w-auto text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700 inline-flex items-center gap-2"
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
                                    className="cursor-pointer w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 inline-flex items-center gap-2"
                                    onClick={sendVerification}
                                    disabled={loading || needsLogin || isVerified === true || sending || cooldown > 0}
                                    title={cooldown > 0 ? `You can resend in ${cooldown}s` : "Send a verification email to your address"}
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
