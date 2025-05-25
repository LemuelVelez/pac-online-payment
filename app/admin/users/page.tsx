/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Download, Edit, Trash2 } from "lucide-react"

export default function AdminUsersPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")

    // Mock user data
    const users = [
        {
            id: "1",
            name: "John Smith",
            email: "john.smith@example.com",
            role: "Student",
            status: "Active",
            lastLogin: "2024-01-15 10:30 AM",
            createdAt: "2023-08-20",
        },
        {
            id: "2",
            name: "Maria Garcia",
            email: "maria.garcia@example.com",
            role: "Cashier",
            status: "Active",
            lastLogin: "2024-01-15 09:15 AM",
            createdAt: "2023-06-10",
        },
        {
            id: "3",
            name: "Robert Chen",
            email: "robert.chen@example.com",
            role: "Business Office",
            status: "Active",
            lastLogin: "2024-01-14 04:45 PM",
            createdAt: "2023-05-15",
        },
        {
            id: "4",
            name: "Sarah Johnson",
            email: "sarah.johnson@example.com",
            role: "Admin",
            status: "Active",
            lastLogin: "2024-01-15 11:00 AM",
            createdAt: "2023-01-10",
        },
        {
            id: "5",
            name: "Michael Brown",
            email: "michael.brown@example.com",
            role: "Student",
            status: "Inactive",
            lastLogin: "2023-12-20 02:30 PM",
            createdAt: "2023-09-05",
        },
    ]

    const columns = [
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }: { row: any }) => {
                const role = row.getValue("role") as string
                const variant =
                    role === "Admin"
                        ? "destructive"
                        : role === "Cashier"
                            ? "default"
                            : role === "Business Office"
                                ? "secondary"
                                : "outline"
                return <Badge variant={variant}>{role}</Badge>
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }: { row: any }) => {
                const status = row.getValue("status") as string
                const variant = status === "Active" ? "default" : "secondary"
                return <Badge variant={variant}>{status}</Badge>
            },
        },
        {
            accessorKey: "lastLogin",
            header: "Last Login",
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: any }) => {
                const user = row.original
                return (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => console.log("Edit user:", user.id)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => console.log("Delete user:", user.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    // Filter users based on search and filters
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === "all" || user.role.toLowerCase().replace(" ", "-") === roleFilter
        const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter

        return matchesSearch && matchesRole && matchesStatus
    })

    return (
        <DashboardLayout allowedRoles={["admin"]}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-gray-300">Manage system users and their permissions</p>
                </div>

                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>All Users</CardTitle>
                                <CardDescription className="text-gray-300">Total: {filteredUsers.length} users</CardDescription>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-primary hover:bg-primary/90">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add User
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                                    <DialogHeader>
                                        <DialogTitle>Add New User</DialogTitle>
                                        <DialogDescription className="text-gray-300">Create a new user account</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" placeholder="Enter full name" className="bg-slate-700 border-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="Enter email"
                                                className="bg-slate-700 border-slate-600"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Select>
                                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                    <SelectItem value="student">Student</SelectItem>
                                                    <SelectItem value="cashier">Cashier</SelectItem>
                                                    <SelectItem value="business-office">Business Office</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Enter password"
                                                className="bg-slate-700 border-slate-600"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                            Cancel
                                        </Button>
                                        <Button className="bg-primary hover:bg-primary/90">Create User</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-slate-700 border-slate-600"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="cashier">Cashier</SelectItem>
                                        <SelectItem value="business-office">Business Office</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>

                        {/* Users Table */}
                        <DataTable columns={columns} data={filteredUsers} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
