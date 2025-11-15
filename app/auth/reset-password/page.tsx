/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAccount } from "@/lib/appwrite"
import { toast } from "sonner"

export default function ResetPasswordPage() {
    const sp = useSearchParams()
    const router = useRouter()
    const userId = sp.get("userId") ?? ""
    const secret = sp.get("secret") ?? ""

    const [password, setPassword] = useState<string>("")
    const [confirm, setConfirm] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault()
        setError("")
        if (!userId || !secret) {
            setError("Invalid or missing reset link. Please use the link from your email.")
            return
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.")
            return
        }
        if (password !== confirm) {
            setError("Passwords do not match.")
            return
        }

        setIsLoading(true)
        try {
            const account = getAccount()
            await account.updateRecovery(userId, secret, password)
            setSuccess(true)
            toast.success("Password updated", {
                description: "You can now log in with your new password.",
            })
        } catch (err: any) {
            setError(err?.message ?? "Failed to reset password. Please try again.")
        } finally {
            setIsLoading(false)
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
                            <CardTitle className="text-white">Set a new password</CardTitle>
                            <CardDescription>Enter and confirm your new password to finish resetting.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!userId || !secret ? (
                                <Alert className="mb-4 bg-amber-500/20 border-amber-500/50 text-amber-200">
                                    <AlertDescription>
                                        This page requires a valid reset link. Please open the link from your email again.
                                    </AlertDescription>
                                </Alert>
                            ) : null}

                            {error && (
                                <Alert className="mb-4 bg-red-500/20 border-red-500/50 text-red-200">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {success ? (
                                <Alert className="mb-4 bg-green-500/20 border-green-500/50 text-green-200">
                                    <AlertDescription className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4" />
                                        Password updated successfully. You can now{" "}
                                        <Link href="/auth" className="underline text-white">
                                            log in
                                        </Link>
                                        .
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-white">
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Enter new password"
                                                className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm" className="text-white">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="confirm"
                                                type="password"
                                                placeholder="Re-enter new password"
                                                className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                value={confirm}
                                                onChange={(e) => setConfirm(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full cursor-pointer bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
                                        disabled={isLoading || !userId || !secret}
                                    >
                                        {isLoading ? "Updating..." : "Update Password"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-center border-t border-slate-700 pt-6">
                            <p className="text-sm text-gray-400">
                                Back to{" "}
                                <Link href="/auth" className="text-sky-400 hover:text-sky-300">
                                    Login
                                </Link>
                            </p>
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
