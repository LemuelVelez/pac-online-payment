/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Info, Save, Lock, Camera, Loader2, Eye, EyeOff, User } from "lucide-react"
import { toast } from "sonner"

import {
    getUserProfile,
    updateUserProfile,
    uploadProfilePhoto,
    getPhotoUrl,
    rememberProfilePhotoUrl,
    type UserProfileDoc,
} from "@/lib/profile"

import { getAccount } from "@/lib/appwrite"

export default function CashierSettingsPage() {
    // account info state
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    // password state
    const [pwdCurrent, setPwdCurrent] = useState("")
    const [pwdNew, setPwdNew] = useState("")
    const [pwdConfirm, setPwdConfirm] = useState("")
    const [changingPwd, setChangingPwd] = useState(false)
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        ; (async () => {
            setLoading(true)
            try {
                const p = (await getUserProfile()) as UserProfileDoc | null
                if (!p) {
                    setFullName("")
                    setEmail("")
                    setPhotoUrl(null)
                    return
                }
                setFullName(p.fullName ?? "")
                setEmail(p.email ?? "")

                const url = getPhotoUrl({
                    directUrl: p.photoUrl ?? null,
                    bucketId: p.photoBucketId ?? null,
                    fileId: p.photoFileId ?? null,
                })
                if (url) {
                    setPhotoUrl(url)
                    rememberProfilePhotoUrl(url)
                }
            } catch (e: any) {
                toast.error("Failed to load profile", { description: e?.message ?? "Please try again." })
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const initials = useMemo(() => {
        const n = (fullName || "").trim()
        if (!n) return "NA"
        const parts = n.split(/\s+/).slice(0, 2)
        return parts.map((s) => s[0]?.toUpperCase()).join("")
    }, [fullName])

    const onPickFile = () => fileInputRef.current?.click()

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setUploading(true)
        try {
            // EXACTLY like app/profile/page.tsx
            const res = await uploadProfilePhoto(f) // { bucketId, fileId, url }
            await updateUserProfile({
                photoBucketId: res.bucketId,
                photoFileId: res.fileId,
                photoUrl: res.url, // store the direct URL
                photoUpdatedAt: new Date().toISOString(),
            })
            const displayUrl = getPhotoUrl({ directUrl: res.url })
            if (displayUrl) {
                setPhotoUrl(displayUrl)
                rememberProfilePhotoUrl(displayUrl) // keep header/avatar in sync
            }
            toast.success("Profile photo updated")
        } catch (e: any) {
            toast.error("Upload failed", { description: e?.message ?? "Please try again." })
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = ""
            setUploading(false)
        }
    }

    const onSave = async () => {
        setSaving(true)
        try {
            await updateUserProfile({
                fullName: fullName.trim(),
                email: email.trim(),
            })
            toast.success("Account details saved.")
        } catch (e: any) {
            toast.error("Save failed", { description: e?.message ?? "Please try again." })
        } finally {
            setSaving(false)
        }
    }

    const onChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pwdCurrent || !pwdNew || !pwdConfirm) {
            toast.error("Please fill in all password fields.")
            return
        }
        if (pwdNew !== pwdConfirm) {
            toast.error("New passwords do not match.")
            return
        }
        if (pwdNew.length < 8) {
            toast.error("Password must be at least 8 characters.")
            return
        }
        setChangingPwd(true)
        try {
            const account = getAccount()
            await account.updatePassword(pwdNew, pwdCurrent)
            toast.success("Your password has been changed successfully!")
            setPwdCurrent("")
            setPwdNew("")
            setPwdConfirm("")
        } catch (e: any) {
            toast.error("Password change failed", { description: e?.message ?? "Please try again." })
        } finally {
            setChangingPwd(false)
        }
    }

    return (
        <DashboardLayout allowedRoles={["cashier"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Cashier Settings</h1>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Account Information */}
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="mr-2 h-5 w-5" />
                                Account Information
                            </CardTitle>
                            <CardDescription className="text-gray-300">Update your account details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Profile Photo (same behavior as profile page) */}
                            <div className="flex flex-col items-center">
                                <div className="relative mb-4">
                                    <Avatar className="h-32 w-32 border-4 border-slate-700">
                                        {photoUrl ? (
                                            <AvatarImage
                                                src={photoUrl}
                                                alt="Profile Photo"
                                                onError={() => setPhotoUrl(null)}
                                            />
                                        ) : (
                                            <AvatarImage src="" alt="Profile Photo" />
                                        )}
                                        <AvatarFallback className="bg-slate-700 text-3xl">{initials}</AvatarFallback>
                                    </Avatar>
                                    <button
                                        type="button"
                                        onClick={onPickFile}
                                        className="absolute -bottom-2 -right-2 rounded-full bg-primary p-2 text-white shadow cursor-pointer"
                                        title="Change photo"
                                    >
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                    </button>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={onUpload}
                                />

                                <p className="text-xs text-gray-400">PNG/JPG up to ~3–5MB recommended</p>
                            </div>

                            <Separator className="my-6 bg-slate-700" />

                            {/* Basic fields */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full-name">Full Name</Label>
                                    <Input
                                        id="full-name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="bg-slate-700 border-slate-600"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-slate-700 border-slate-600"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span className="text-sm text-green-500">{loading ? "Loading…" : "Account loaded"}</span>
                                </div>
                                <Button onClick={onSave} disabled={saving || loading} className="bg-primary hover:bg-primary/90">
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {saving ? "Saving…" : "Save Changes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Password & Security */}
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Lock className="mr-2 h-5 w-5" />
                                Password &amp; Security
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                                Change your password and security settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-6 bg-blue-500/20 border-blue-500/50 text-blue-200">
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Password must be at least 8 characters and ideally include uppercase letters, numbers, and special
                                    characters.
                                </AlertDescription>
                            </Alert>

                            <form onSubmit={onChangePassword} className="space-y-4">
                                {/* Current Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="current-password"
                                            type={showCurrent ? "text" : "password"}
                                            value={pwdCurrent}
                                            onChange={(e) => setPwdCurrent(e.target.value)}
                                            className="bg-slate-700 border-slate-600 pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 px-3 text-gray-300"
                                            onClick={() => setShowCurrent((v) => !v)}
                                            aria-label={showCurrent ? "Hide current password" : "Show current password"}
                                        >
                                            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showNew ? "text" : "password"}
                                            value={pwdNew}
                                            onChange={(e) => setPwdNew(e.target.value)}
                                            className="bg-slate-700 border-slate-600 pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 px-3 text-gray-300"
                                            onClick={() => setShowNew((v) => !v)}
                                            aria-label={showNew ? "Hide new password" : "Show new password"}
                                        >
                                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showConfirm ? "text" : "password"}
                                            value={pwdConfirm}
                                            onChange={(e) => setPwdConfirm(e.target.value)}
                                            className="bg-slate-700 border-slate-600 pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 px-3 text-gray-300"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                                        >
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" disabled={changingPwd} className="w-full bg-primary hover:bg-primary/90">
                                    {changingPwd ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {changingPwd ? "Changing…" : "Change Password"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
