/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
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
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Download, Edit, Trash2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Spinner } from "@/components/ui/spinner"
import type { UserDoc, UserRecord } from "@/lib/users"
import {
  deleteUserProfile,
  listAllUsers,
  updateUserProfile,
  adminUpdateUserAccount,
  adminCreateUserAccount,
} from "@/lib/users"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

type UserVM = {
  id: string
  name: string
  email: string
  role: UserRecord["role"]
  status: UserRecord["status"]
  createdAt: string
  studentId?: string
  _doc: UserDoc
}

const roleLabel = (r: UserRecord["role"]) =>
  r === "business-office" ? "Business Office" : r.charAt(0).toUpperCase() + r.slice(1)

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserVM[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | UserRecord["role"]>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | UserRecord["status"]>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [working, setWorking] = useState<{
    id?: string
    fullName: string
    email: string
    role: UserRecord["role"]
    status: UserRecord["status"]
    studentId?: string
  }>({ fullName: "", email: "", role: "student", status: "active", studentId: "" })

  const [confirmUser, setConfirmUser] = useState<UserVM | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const docs = await listAllUsers()
      setUsers(
        docs.map((d) => ({
          id: d.$id,
          name: d.fullName ?? "",
          email: d.email ?? "",
          role: d.role ?? "student",
          status: d.status ?? "active",
          createdAt: d.createdAt ?? d.$createdAt,
          studentId: d.studentId,
          _doc: d,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const columns: ColumnDef<UserVM>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const r = row.getValue("role") as UserRecord["role"]
          const variant =
            r === "admin" ? "destructive" : r === "cashier" ? "default" : r === "business-office" ? "secondary" : "outline"
          return <Badge variant={variant}>{roleLabel(r)}</Badge>
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.getValue("status") as UserRecord["status"]
          const variant = s === "active" ? "default" : "secondary"
          return <Badge variant={variant}>{s === "active" ? "Active" : "Inactive"}</Badge>
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const u = row.original
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setMode("edit")
                  setWorking({
                    id: u.id,
                    fullName: u.name,
                    email: u.email,
                    role: u.role,
                    status: u.status,
                    studentId: u.studentId ?? "",
                  })
                  setSaveError(null)
                  setDialogOpen(true)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600"
                onClick={() => setConfirmUser(u)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((u) => {
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchesRole = roleFilter === "all" || u.role === roleFilter
      const matchesStatus = statusFilter === "all" || u.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  const resetForm = () => setWorking({ fullName: "", email: "", role: "student", status: "active", studentId: "" })

  const openCreate = () => {
    setMode("create")
    resetForm()
    setSaveError(null)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)

    const payload: Omit<UserRecord, "createdAt" | "updatedAt"> = {
      fullName: working.fullName.trim(),
      email: working.email.trim(),
      role: working.role,
      status: working.status,
      studentId: (working.studentId ?? "").trim() || undefined,
    }

    try {
      if (mode === "create") {
        const result = await adminCreateUserAccount({
          fullName: payload.fullName,
          email: payload.email,
          role: payload.role,
          status: payload.status,
          studentId: payload.studentId,
        })

        const profile = (result as any).profile ?? {}
        const vm: UserVM = {
          id: profile.$id ?? (result as any).$id,
          name: profile.fullName ?? payload.fullName,
          email: profile.email ?? payload.email,
          role: (profile.role as UserRecord["role"]) ?? payload.role,
          status: (profile.status as UserRecord["status"]) ?? payload.status,
          createdAt: profile.$createdAt ?? new Date().toISOString(),
          studentId: profile.studentId ?? payload.studentId,
          _doc: profile as UserDoc,
        }

        setUsers((prev) => [vm, ...prev])
        setDialogOpen(false)
        toast.success("User created", { description: vm.name || vm.email })
      } else {
        const id = working.id!
        const original = users.find((u) => u.id === id)

        // Decide if account needs an update (name/email changes)
        const wantsNameChange = payload.fullName !== (original?.name ?? "")
        const wantsEmailChange =
          payload.email.toLowerCase() !== (original?.email ?? "").toLowerCase()

        // 1) Update Appwrite Account FIRST to avoid divergence
        if (wantsNameChange || wantsEmailChange) {
          // Basic email sanity check to avoid 400 from Appwrite
          if (wantsEmailChange) {
            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
            if (!emailOk) {
              const msg = "Please enter a valid email address."
              setSaveError(msg)
              toast.error("Invalid email", { description: msg })
              setSaving(false)
              return
            }
          }

          await adminUpdateUserAccount(id, {
            fullName: wantsNameChange ? payload.fullName : undefined,
            email: wantsEmailChange ? payload.email : undefined,
          })
        }

        // 2) Update the profile document AFTER account success
        const updated = await updateUserProfile(id, payload)

        setUsers((prev) =>
          prev.map((x) =>
            x.id === id
              ? {
                  ...x,
                  name: updated.fullName,
                  email: updated.email,
                  role: updated.role,
                  status: updated.status,
                  studentId: updated.studentId,
                  _doc: updated,
                }
              : x
          )
        )

        setDialogOpen(false)
        toast.success("User updated", { description: updated.fullName || updated.email })
      }
    } catch (e: any) {
      const msg = e?.message || "Save failed"
      setSaveError(msg)
      toast.error("Save failed", { description: msg })
    } finally {
      setSaving(false)
    }
  }

  const exportCSV = () => {
    if (!filteredUsers.length) return
    const headers = ["Name", "Email", "Role", "Status", "Student ID", "Created At"]
    const rows = filteredUsers.map((u) => [
      u.name,
      u.email,
      roleLabel(u.role),
      u.status === "active" ? "Active" : "Inactive",
      u.studentId ?? "",
      new Date(u.createdAt).toLocaleString(),
    ])

    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((v) => {
            const s = String(v ?? "")
            const needsQuote = /[",\n]/.test(s)
            const escaped = s.replace(/"/g, '""')
            return needsQuote ? `"${escaped}"` : escaped
          })
          .join(",")
      )
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users_export_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Exported users CSV", { description: `${filteredUsers.length} row(s) exported` })
  }

  const confirmDelete = async () => {
    if (!confirmUser) return
    setDeleting(true)
    try {
      await deleteUserProfile(confirmUser.id)
      setUsers((prev) => prev.filter((x) => x.id !== confirmUser.id))
      toast.success("User deleted", { description: confirmUser.name || confirmUser.email })
      setConfirmUser(null)
    } catch (e: any) {
      toast.error("Delete failed", { description: e?.message || "Something went wrong while deleting the user." })
    } finally {
      setDeleting(false)
    }
  }

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
                <CardDescription className="text-gray-300">
                  {loading ? "Loading…" : `Total: ${filteredUsers.length} user${filteredUsers.length === 1 ? "" : "s"}`}
                </CardDescription>
              </div>
              <Button className="bg-primary hover:bg-primary/90" onClick={openCreate} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-2 sm:overflow-x-auto">
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text:white">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="business-office">Business Office</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-slate-600 text-white hover:bg-slate-700"
                  onClick={exportCSV}
                  disabled={loading || filteredUsers.length === 0}
                  title={filteredUsers.length === 0 ? "No users to export" : undefined}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-gray-300">
                <Spinner className="h-4 w-4" />
                Loading users…
              </div>
            ) : (
              <DataTable columns={columns} data={filteredUsers} />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Add New User" : "Edit User"}</DialogTitle>
            <DialogDescription className="text-gray-300">
              {mode === "create" ? "Create a new user profile" : "Update user profile"}
            </DialogDescription>
          </DialogHeader>

          {!!saveError && (
            <div className="mb-2 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-200">
              {saveError}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                className="bg-slate-700 border-slate-600"
                value={working.fullName}
                onChange={(e) => setWorking((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                className="bg-slate-700 border-slate-600"
                value={working.email}
                onChange={(e) => setWorking((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={working.role}
                onValueChange={(v) =>
                  setWorking((p) => ({ ...p, role: v as UserRecord["role"], studentId: v === "student" ? p.studentId : "" }))
                }
              >
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

            {working.role === "student" && (
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  placeholder="Enter student ID"
                  className="bg-slate-700 border-slate-600"
                  value={working.studentId ?? ""}
                  onChange={(e) => setWorking((p) => ({ ...p, studentId: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={working.status} onValueChange={(v) => setWorking((p) => ({ ...p, status: v as UserRecord["status"] }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Saving…
                </span>
              ) : mode === "create" ? (
                "Create User"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmUser} onOpenChange={(o) => (!o && !deleting ? setConfirmUser(null) : null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {confirmUser ? `This will permanently remove "${confirmUser.name}". This action cannot be undone.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
