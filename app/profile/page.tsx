/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Camera, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
    getUserProfile,
    updateUserProfile,
    uploadProfilePhoto,
    getPhotoUrl,
    rememberProfilePhotoUrl,
} from "@/lib/profile"

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [studentId, setStudentId] = useState("")
    const [course, setCourse] = useState("")
    const [yearLevel, setYearLevel] = useState<"1st" | "2nd" | "3rd" | "4th" | "">("")
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        ; (async () => {
            setLoading(true)
            try {
                const p = await getUserProfile()
                if (!p) {
                    setFullName("")
                    setEmail("")
                    setStudentId("")
                    setCourse("")
                    setYearLevel("")
                    setPhotoUrl(null)
                    return
                }
                setFullName(p.fullName ?? "")
                setEmail(p.email ?? "")
                setStudentId(p.studentId ?? "")
                setCourse(p.course ?? "")
                setYearLevel((p.yearLevel as any) ?? "")

                const url = getPhotoUrl({
                    directUrl: p.photoUrl ?? null,
                    bucketId: p.photoBucketId ?? null,
                    fileId: p.photoFileId ?? null,
                })
                if (url) {
                    setPhotoUrl(url)
                    rememberProfilePhotoUrl(url) // keep header/avatar in sync
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

    const onSave = async () => {
        setSaving(true)
        try {
            await updateUserProfile({
                fullName: fullName.trim(),
                email: email.trim(),
                studentId: studentId.trim(),
                course: course.trim(),
                yearLevel: yearLevel || undefined,
            })
            toast.success("Profile saved.")
        } catch (e: any) {
            toast.error("Save failed", { description: e?.message ?? "Please try again." })
        } finally {
            setSaving(false)
        }
    }

    const onPickFile = () => fileInputRef.current?.click()

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setUploading(true)
        try {
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

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">My Profile</h1>
                    <p className="text-gray-300">Update your details and profile photo</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Photo card */}
                    <Card className="bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Profile Photo</CardTitle>
                            <CardDescription className="text-gray-300">Upload a clear, recent photo</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
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
                        </CardContent>
                    </Card>

                    {/* Form card */}
                    <Card className="lg:col-span-2 bg-slate-800/60 border-slate-700 text-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription className="text-gray-300">Only required fields are shown</CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {loading ? (
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input
                                                id="fullName"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="bg-slate-700 border-slate-600"
                                                placeholder="e.g., Juan Dela Cruz"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="bg-slate-700 border-slate-600"
                                                placeholder="name@example.com"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="studentId">Student ID</Label>
                                            <Input
                                                id="studentId"
                                                value={studentId}
                                                onChange={(e) => setStudentId(e.target.value)}
                                                className="bg-slate-700 border-slate-600"
                                                placeholder="e.g., 2025-000123"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="course">Course</Label>
                                            <Input
                                                id="course"
                                                value={course}
                                                onChange={(e) => setCourse(e.target.value)}
                                                className="bg-slate-700 border-slate-600"
                                                placeholder="e.g., BS Computer Science"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="yearLevel">Year Level</Label>
                                            <Select
                                                value={yearLevel || ""}
                                                onValueChange={(v) => setYearLevel(v as any)}
                                            >
                                                <SelectTrigger id="yearLevel" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select year level" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                    <SelectItem value="1st" className="cursor-pointer">1st</SelectItem>
                                                    <SelectItem value="2nd" className="cursor-pointer">2nd</SelectItem>
                                                    <SelectItem value="3rd" className="cursor-pointer">3rd</SelectItem>
                                                    <SelectItem value="4th" className="cursor-pointer">4th</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div className="text-sm text-gray-400">
                                        Make sure your email matches the one you use in payments so receipts reach you.
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-end gap-3">
                            <Button onClick={onSave} disabled={saving || loading} className="cursor-pointer">
                                {saving ? (
                                    <span className="inline-flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center">
                                        <Save className="mr-2 h-4 w-4" /> Save Changes
                                    </span>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
