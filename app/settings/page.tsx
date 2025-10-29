/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAccount } from "@/lib/appwrite"
import { Loader2, Lock, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showMsg, setShowMsg] = useState<{ type: "error" | "success"; text: string } | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const validate = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            return "Please fill in all fields."
        }
        if (newPassword.length < 8) {
            return "New password must be at least 8 characters long."
        }
        if (newPassword !== confirmPassword) {
            return "New password and confirmation do not match."
        }
        if (currentPassword === newPassword) {
            return "New password must be different from your current password."
        }
        return null
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setShowMsg(null)
        const err = validate()
        if (err) {
            setShowMsg({ type: "error", text: err })
            return
        }

        setSubmitting(true)
        try {
            const account = getAccount()

            // Appwrite SDK signature compatibility:
            // Try (newPassword, oldPassword), then fall back to object form if needed.
            try {
                await (account as any).updatePassword(newPassword, currentPassword)
            } catch {
                await (account as any).updatePassword({ password: newPassword, oldPassword: currentPassword })
            }

            setShowMsg({ type: "success", text: "Password updated successfully." })
            toast.success("Password changed", { description: "Your password was updated." })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setShowCurrent(false)
            setShowNew(false)
            setShowConfirm(false)
        } catch (e: any) {
            const message =
                e?.message ||
                e?.response?.message ||
                "Failed to update password. Please make sure your current password is correct."
            setShowMsg({ type: "error", text: message })
            toast.error("Save failed", { description: message })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">Password</h1>
                    <p className="text-gray-300">Change your password</p>
                </div>

                {showMsg?.type === "error" ? (
                    <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-red-200">
                        <AlertDescription>{showMsg.text}</AlertDescription>
                    </Alert>
                ) : null}

                {showMsg?.type === "success" ? (
                    <Alert className="mb-6 bg-emerald-500/20 border-emerald-500/50 text-emerald-200">
                        <AlertDescription className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {showMsg.text}
                        </AlertDescription>
                    </Alert>
                ) : null}

                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <form onSubmit={onSubmit}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Change Password
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                                Enter your current password and choose a new one.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* Current password */}
                            <div className="space-y-2">
                                <Label htmlFor="current" className="text-gray-200">
                                    Current password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="current"
                                        type={showCurrent ? "text" : "password"}
                                        autoComplete="current-password"
                                        className="bg-slate-700 border-slate-600 pr-10"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={showCurrent ? "Hide current password" : "Show current password"}
                                        aria-pressed={showCurrent}
                                        onClick={() => setShowCurrent((s) => !s)}
                                        className="absolute inset-y-0 right-1 my-auto h-8 w-8 text-gray-300 hover:text-white"
                                    >
                                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* New password */}
                            <div className="space-y-2">
                                <Label htmlFor="new" className="text-gray-200">
                                    New password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="new"
                                        type={showNew ? "text" : "password"}
                                        autoComplete="new-password"
                                        className="bg-slate-700 border-slate-600 pr-10"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={showNew ? "Hide new password" : "Show new password"}
                                        aria-pressed={showNew}
                                        onClick={() => setShowNew((s) => !s)}
                                        className="absolute inset-y-0 right-1 my-auto h-8 w-8 text-gray-300 hover:text-white"
                                    >
                                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-400">Minimum 8 characters.</p>
                            </div>

                            {/* Confirm new password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirm" className="text-gray-200">
                                    Confirm new password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirm"
                                        type={showConfirm ? "text" : "password"}
                                        autoComplete="new-password"
                                        className="bg-slate-700 border-slate-600 pr-10"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                                        aria-pressed={showConfirm}
                                        onClick={() => setShowConfirm((s) => !s)}
                                        className="absolute inset-y-0 right-1 my-auto h-8 w-8 text-gray-300 hover:text-white"
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end mt-4">
                            <Button type="submit" disabled={submitting} className="cursor-pointer">
                                {submitting ? (
                                    <span className="inline-flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving…
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center">
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </span>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    )
}
