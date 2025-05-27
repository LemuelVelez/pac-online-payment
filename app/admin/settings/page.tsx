"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, Database, Mail, Save, Server, Shield, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Tab configuration for mobile dropdown
const tabOptions = [
    { value: "general", label: "General" },
    { value: "security", label: "Security" },
    { value: "email", label: "Email" },
    { value: "backup", label: "Backup" },
]

export default function AdminSettingsPage() {
    const [isSuccess, setIsSuccess] = useState(false)
    const [isBackupInProgress, setIsBackupInProgress] = useState(false)
    const [activeTab, setActiveTab] = useState("general")

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSuccess(true)
        setTimeout(() => {
            setIsSuccess(false)
        }, 3000)
    }

    const handleBackupNow = () => {
        setIsBackupInProgress(true)
        setTimeout(() => {
            setIsBackupInProgress(false)
        }, 3000)
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">System Settings</h1>
                    <p className="text-gray-300">Configure and manage system settings</p>
                </div>

                {isSuccess && (
                    <Alert className="mb-6 bg-green-500/20 border-green-500/50 text-green-200">
                        <Check className="h-4 w-4" />
                        <AlertDescription>Settings have been saved successfully!</AlertDescription>
                    </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Mobile Dropdown - visible on extra small screens */}
                    <div className="mb-6 sm:hidden">
                        <Select value={activeTab} onValueChange={setActiveTab}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <div className="flex items-center">
                                    <SelectValue placeholder="Select Settings" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                {tabOptions.map((tab) => (
                                    <SelectItem key={tab.value} value={tab.value} className="focus:bg-slate-700">
                                        {tab.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Desktop Tabs - unchanged, hidden on mobile */}
                    <div className="hidden sm:block">
                        <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-4 lg:max-w-[600px]">
                            <TabsTrigger value="general" className="cursor-pointer">
                                General
                            </TabsTrigger>
                            <TabsTrigger value="security" className="cursor-pointer">
                                Security
                            </TabsTrigger>
                            <TabsTrigger value="email" className="cursor-pointer">
                                Email
                            </TabsTrigger>
                            <TabsTrigger value="backup" className="cursor-pointer">
                                Backup
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="general">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription className="text-gray-300">Configure general system settings</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="system-name">System Name</Label>
                                        <Input
                                            id="system-name"
                                            defaultValue="PAC Salug Campus - Online Payment System"
                                            className="bg-slate-700 border-slate-600"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="institution-name">Institution Name</Label>
                                        <Input
                                            id="institution-name"
                                            defaultValue="Philippine Advent College - Salug Campus"
                                            className="bg-slate-700 border-slate-600"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contact-email">Contact Email</Label>
                                        <Input
                                            id="contact-email"
                                            type="email"
                                            defaultValue="info@pacsalug.edu.ph"
                                            className="bg-slate-700 border-slate-600"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contact-phone">Contact Phone</Label>
                                        <Input id="contact-phone" defaultValue="(123) 456-7890" className="bg-slate-700 border-slate-600" />
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone</Label>
                                        <Select defaultValue="asia-manila">
                                            <SelectTrigger id="timezone" className="bg-slate-700 border-slate-600">
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="asia-manila">Asia/Manila (GMT+8)</SelectItem>
                                                <SelectItem value="america-new_york">America/New_York (GMT-4)</SelectItem>
                                                <SelectItem value="europe-london">Europe/London (GMT+1)</SelectItem>
                                                <SelectItem value="australia-sydney">Australia/Sydney (GMT+10)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date-format">Date Format</Label>
                                        <Select defaultValue="mm-dd-yyyy">
                                            <SelectTrigger id="date-format" className="bg-slate-700 border-slate-600">
                                                <SelectValue placeholder="Select date format" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                                                <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                                                <SelectItem value="yyyy-mm-dd">YYYY/MM/DD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select defaultValue="php">
                                            <SelectTrigger id="currency" className="bg-slate-700 border-slate-600">
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="php">Philippine Peso (₱)</SelectItem>
                                                <SelectItem value="usd">US Dollar ($)</SelectItem>
                                                <SelectItem value="eur">Euro (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                                            <p className="text-sm text-gray-400">
                                                When enabled, the system will be inaccessible to regular users
                                            </p>
                                        </div>
                                        <Switch id="maintenance-mode" />
                                    </div>

                                    <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Settings
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription className="text-gray-300">
                                    Configure security and authentication settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Password Policy</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="min-password-length">Minimum Password Length</Label>
                                            <Select defaultValue="8">
                                                <SelectTrigger id="min-password-length" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select minimum length" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="6">6 characters</SelectItem>
                                                    <SelectItem value="8">8 characters</SelectItem>
                                                    <SelectItem value="10">10 characters</SelectItem>
                                                    <SelectItem value="12">12 characters</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="require-uppercase">Require Uppercase Letters</Label>
                                                <p className="text-sm text-gray-400">Passwords must contain at least one uppercase letter</p>
                                            </div>
                                            <Switch id="require-uppercase" defaultChecked />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="require-numbers">Require Numbers</Label>
                                                <p className="text-sm text-gray-400">Passwords must contain at least one number</p>
                                            </div>
                                            <Switch id="require-numbers" defaultChecked />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="require-special">Require Special Characters</Label>
                                                <p className="text-sm text-gray-400">Passwords must contain at least one special character</p>
                                            </div>
                                            <Switch id="require-special" defaultChecked />
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Account Security</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="session-timeout">Session Timeout</Label>
                                            <Select defaultValue="30">
                                                <SelectTrigger id="session-timeout" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select timeout period" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="15">15 minutes</SelectItem>
                                                    <SelectItem value="30">30 minutes</SelectItem>
                                                    <SelectItem value="60">1 hour</SelectItem>
                                                    <SelectItem value="120">2 hours</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
                                                <p className="text-sm text-gray-400">
                                                    Require two-factor authentication for all admin accounts
                                                </p>
                                            </div>
                                            <Switch id="two-factor-auth" defaultChecked />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="login-attempts">Account Lockout</Label>
                                                <p className="text-sm text-gray-400">Lock accounts after 5 failed login attempts</p>
                                            </div>
                                            <Switch id="login-attempts" defaultChecked />
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">API Security</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="api-key">API Key</Label>
                                            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                                                <Input
                                                    id="api-key"
                                                    value="sk_live_51KjTuRJcLsQJ8zN7XYgipnWx"
                                                    readOnly
                                                    className="bg-slate-700 border-slate-600 flex-1"
                                                />
                                                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                                    Regenerate
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="api-access">Enable API Access</Label>
                                                <p className="text-sm text-gray-400">Allow external systems to access the API</p>
                                            </div>
                                            <Switch id="api-access" defaultChecked />
                                        </div>
                                    </div>

                                    <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Save Security Settings
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="email">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Email Settings</CardTitle>
                                <CardDescription className="text-gray-300">
                                    Configure email server and notification settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">SMTP Configuration</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtp-server">SMTP Server</Label>
                                            <Input id="smtp-server" defaultValue="smtp.gmail.com" className="bg-slate-700 border-slate-600" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="smtp-port">SMTP Port</Label>
                                            <Input id="smtp-port" defaultValue="587" className="bg-slate-700 border-slate-600" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="smtp-username">SMTP Username</Label>
                                            <Input
                                                id="smtp-username"
                                                defaultValue="notifications@pacsalug.edu.ph"
                                                className="bg-slate-700 border-slate-600"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="smtp-password">SMTP Password</Label>
                                            <Input
                                                id="smtp-password"
                                                type="password"
                                                defaultValue="••••••••••••"
                                                className="bg-slate-700 border-slate-600"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="smtp-encryption">Use SSL/TLS</Label>
                                                <p className="text-sm text-gray-400">Enable encryption for email communication</p>
                                            </div>
                                            <Switch id="smtp-encryption" defaultChecked />
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Email Notifications</h3>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="payment-notifications">Payment Notifications</Label>
                                                <p className="text-sm text-gray-400">Send email notifications for payment transactions</p>
                                            </div>
                                            <Switch id="payment-notifications" defaultChecked />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="user-notifications">User Account Notifications</Label>
                                                <p className="text-sm text-gray-400">Send email notifications for account activities</p>
                                            </div>
                                            <Switch id="user-notifications" defaultChecked />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="system-notifications">System Notifications</Label>
                                                <p className="text-sm text-gray-400">Send email notifications for system events</p>
                                            </div>
                                            <Switch id="system-notifications" defaultChecked />
                                        </div>
                                    </div>

                                    <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="border-slate-600 text-white hover:bg-slate-700"
                                            onClick={() => alert("Test email sent!")}
                                        >
                                            Send Test Email
                                        </Button>
                                        <Button type="submit" className="bg-primary hover:bg-primary/90">
                                            <Mail className="mr-2 h-4 w-4" />
                                            Save Email Settings
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="backup">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Backup & Restore</CardTitle>
                                <CardDescription className="text-gray-300">
                                    Configure database backup and restore settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Automatic Backups</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="backup-frequency">Backup Frequency</Label>
                                            <Select defaultValue="daily">
                                                <SelectTrigger id="backup-frequency" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="hourly">Hourly</SelectItem>
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="backup-time">Backup Time</Label>
                                            <Select defaultValue="2">
                                                <SelectTrigger id="backup-time" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select time" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="0">12:00 AM</SelectItem>
                                                    <SelectItem value="2">2:00 AM</SelectItem>
                                                    <SelectItem value="4">4:00 AM</SelectItem>
                                                    <SelectItem value="6">6:00 AM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="backup-retention">Backup Retention</Label>
                                            <Select defaultValue="30">
                                                <SelectTrigger id="backup-retention" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select retention period" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="7">7 days</SelectItem>
                                                    <SelectItem value="14">14 days</SelectItem>
                                                    <SelectItem value="30">30 days</SelectItem>
                                                    <SelectItem value="90">90 days</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Backup Storage</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="storage-location">Storage Location</Label>
                                            <Select defaultValue="local">
                                                <SelectTrigger id="storage-location" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select storage location" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="local">Local Storage</SelectItem>
                                                    <SelectItem value="cloud">Cloud Storage</SelectItem>
                                                    <SelectItem value="both">Both (Local & Cloud)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cloud-provider">Cloud Provider</Label>
                                            <Select defaultValue="aws">
                                                <SelectTrigger id="cloud-provider" className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select cloud provider" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="aws">Amazon S3</SelectItem>
                                                    <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                                                    <SelectItem value="azure">Microsoft Azure</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cloud-bucket">Cloud Bucket/Container</Label>
                                            <Input
                                                id="cloud-bucket"
                                                defaultValue="pacsalug-backups"
                                                className="bg-slate-700 border-slate-600"
                                            />
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-700" />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Manual Backup & Restore</h3>
                                        <Alert className="bg-blue-500/20 border-blue-500/50 text-blue-200">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Last backup was created on September 1, 2023 at 2:00 AM. Backup size: 256 MB.
                                            </AlertDescription>
                                        </Alert>

                                        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                                            <Button
                                                type="button"
                                                className="bg-primary hover:bg-primary/90"
                                                onClick={handleBackupNow}
                                                disabled={isBackupInProgress}
                                            >
                                                {isBackupInProgress ? (
                                                    <>
                                                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                fill="none"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                        </svg>
                                                        Backing up...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Database className="mr-2 h-4 w-4" />
                                                        Backup Now
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-slate-600 text-white hover:bg-slate-700"
                                            >
                                                <Server className="mr-2 h-4 w-4" />
                                                Restore from Backup
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-slate-600 text-white hover:bg-slate-700"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download Backup
                                            </Button>
                                        </div>
                                    </div>

                                    <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Backup Settings
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
