/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAccount } from "@/lib/appwrite"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const account = getAccount()
            const resetUrl = `${window.location.origin}/auth/reset-password`
            await account.createRecovery(email, resetUrl)
            setSuccess(true)
        } catch (err: any) {
            setError(err?.message ?? "Failed to send password reset email. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-h-screen overflow-y-auto bg-slate-800 flex flex-col min-h-screen">
            <header className="container mx-auto py-6 px-4">
                <Link href="/auth" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back to Login</span>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Image
                            src="/images/logo.png"
                            alt="PAC Salug Campus logo"
                            width={64}
                            height={64}
                            className="h-16 w-16 object-contain mx-auto mb-4"
                            priority
                        />
                        <h1 className="text-2xl font-bold text-white">PAC Salug Campus</h1>
                        <p className="text-gray-300">Online Payment System</p>
                    </div>

                    <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white">Reset Password</CardTitle>
                            <CardDescription>
                                Enter your email address and we&apos;ll send you a link to reset your password
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <Alert className="mb-4 bg-red-500/20 border-red-500/50 text-red-200">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {success ? (
                                <Alert className="mb-4 bg-green-500/20 border-green-500/50 text-green-200">
                                    <AlertDescription>
                                        Password reset link has been sent to your email. Please check your inbox or spam folder.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-white">
                                            Email
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="Enter your email"
                                                className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Sending..." : "Send Reset Link"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-center border-t border-slate-700 pt-6">
                            <p className="text-sm text-gray-400">
                                Remember your password?{" "}
                                <Link href="/auth" className="text-purple-400 hover:text-purple-300">
                                    Back to login
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
