"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserTable } from "@/components/admin/user-table"
import { UserForm } from "@/components/admin/user-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Filter, Download, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

// Mock data for users
const allUsers = [
    {
        id: "USR-1001",
        name: "John Smith",
        email: "john.smith@example.com",
        role: "Student",
        status: "Active",
        dateCreated: "2023-08-15",
    },
    {
        id: "USR-1002",
        name: "Maria Garcia",
        email: "maria.garcia@example.com",
        role: "Cashier",
        status: "Active",
        dateCreated: "2023-08-14",
    },
    {
        id: "USR-1003",
        name: "Robert Johnson",
        email: "robert.johnson@example.com",
        role: "Business Office",
        status: "Active",
        dateCreated: "2023-08-12",
    },
    {
        id: "USR-1004",
        name: "Sarah Williams",
        email: "sarah.williams@example.com",
        role: "Student",
        status: "Inactive",
        dateCreated: "2023-08-10",
    },
    {
        id: "USR-1005",
        name: "David Brown",
        email: "david.brown@example.com",
        role: "Student",
        status: "Active",
        dateCreated: "2023-08-09",
    },
    {
        id: "USR-1006",
        name: "Jennifer Davis",
        email: "jennifer.davis@example.com",
        role: "Admin",
        status: "Active",
        dateCreated: "2023-08-05",
    },
    {
        id: "USR-1007",
        name: "Michael Miller",
        email: "michael.miller@example.com",
        role: "Student",
        status: "Active",
        dateCreated: "2023-08-03",
    },
    {
        id: "USR-1008",
        name: "Elizabeth Wilson",
        email: "elizabeth.wilson@example.com",
        role: "Cashier",
        status: "Active",
        dateCreated: "2023-07-28",
    },
    {
        id: "USR-1009",
        name: "James Moore",
        email: "james.moore@example.com",
        role: "Student",
        status: "Inactive",
        dateCreated: "2023-07-25",
    },
    {
        id: "USR-1010",
        name: "Patricia Taylor",
        email: "patricia.taylor@example.com",
        role: "Business Office",
        status: "Active",
        dateCreated: "2023-07-20",
    },
]

export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])

    // Filter users based on search term and filters
    const filteredUsers = allUsers.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.id.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase()
        const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase()

        return matchesSearch && matchesRole && matchesStatus
    })

    const handleUserSelection = (userId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedUsers([...selectedUsers, userId])
        } else {
            setSelectedUsers(selectedUsers.filter((id) => id !== userId))
        }
    }

    const handleSelectAllUsers = (isSelected: boolean) => {
        if (isSelected) {
            setSelectedUsers(filteredUsers.map((user) => user.id))
        } else {
            setSelectedUsers([])
        }
    }

    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">User Management</h1>
                        <p className="text-gray-300">Manage system users and their roles</p>
                    </div>
                    <div className="mt-4 flex space-x-3 md:mt-0">
                        <Button
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-700"
                            onClick={() => alert("Export functionality would be implemented here")}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddUserDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="all-users" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-4 lg:max-w-[600px]">
                        <TabsTrigger value="all-users" className="cursor-pointer">
                            All Users
                        </TabsTrigger>
                        <TabsTrigger value="students" className="cursor-pointer">
                            Students
                        </TabsTrigger>
                        <TabsTrigger value="staff" className="cursor-pointer">
                            Staff
                        </TabsTrigger>
                        <TabsTrigger value="admins" className="cursor-pointer">
                            Admins
                        </TabsTrigger>
                    </TabsList>

                    <Card className="bg-slate-800/60 border-slate-700 text-white mb-6">
                        <CardContent className="p-6">
                            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search users..."
                                        className="pl-10 bg-slate-700 border-slate-600"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex space-x-4">
                                    <div className="w-[150px]">
                                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                                            <SelectTrigger className="bg-slate-700 border-slate-600">
                                                <div className="flex items-center">
                                                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                    <span className="truncate">Role</span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="all">All Roles</SelectItem>
                                                <SelectItem value="student">Student</SelectItem>
                                                <SelectItem value="cashier">Cashier</SelectItem>
                                                <SelectItem value="business office">Business Office</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-[150px]">
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="bg-slate-700 border-slate-600">
                                                <div className="flex items-center">
                                                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                                                    <span className="truncate">Status</span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <TabsContent value="all-users">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>All Users</CardTitle>
                                    <CardDescription className="text-gray-300">Showing {filteredUsers.length} users</CardDescription>
                                </div>
                                {selectedUsers.length > 0 && (
                                    <Button variant="destructive" size="sm" className="cursor-pointer">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Selected ({selectedUsers.length})
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <UserTable
                                    users={filteredUsers}
                                    selectedUsers={selectedUsers}
                                    onSelectUser={handleUserSelection}
                                    onSelectAll={handleSelectAllUsers}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="students">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Students</CardTitle>
                                <CardDescription className="text-gray-300">Manage student accounts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserTable
                                    users={filteredUsers.filter((user) => user.role === "Student")}
                                    selectedUsers={selectedUsers}
                                    onSelectUser={handleUserSelection}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="staff">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Staff</CardTitle>
                                <CardDescription className="text-gray-300">
                                    Manage staff accounts (Cashiers and Business Office)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserTable
                                    users={filteredUsers.filter((user) => user.role === "Cashier" || user.role === "Business Office")}
                                    selectedUsers={selectedUsers}
                                    onSelectUser={handleUserSelection}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="admins">
                        <Card className="bg-slate-800/60 border-slate-700 text-white">
                            <CardHeader>
                                <CardTitle>Administrators</CardTitle>
                                <CardDescription className="text-gray-300">Manage administrator accounts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserTable
                                    users={filteredUsers.filter((user) => user.role === "Admin")}
                                    selectedUsers={selectedUsers}
                                    onSelectUser={handleUserSelection}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Add User Dialog */}
                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                    <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription className="text-gray-300">
                                Fill in the details to create a new user account
                            </DialogDescription>
                        </DialogHeader>
                        <UserForm
                            onSubmit={(data) => {
                                console.log("Form submitted with data:", data)
                                setIsAddUserDialogOpen(false)
                                // In a real app, we would add the user to the database here
                            }}
                            onCancel={() => setIsAddUserDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}
