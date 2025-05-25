import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"

export default function AdminUsersLoading() {
    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">User Management</h1>
                        <p className="text-gray-300">Manage system users, roles, and permissions</p>
                    </div>
                    <div className="mt-4 flex space-x-3 sm:mt-0">
                        <Skeleton className="h-10 w-[100px]" />
                        <Skeleton className="h-10 w-[100px]" />
                    </div>
                </div>

                <Card className="bg-slate-800/60 border-slate-700 text-white">
                    <CardHeader>
                        <div className="flex items-center">
                            <Users className="mr-2 h-5 w-5 text-primary" />
                            <CardTitle>System Users</CardTitle>
                        </div>
                        <CardDescription className="text-gray-400">View and manage all users in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <Skeleton className="h-10 w-[400px]" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-10 w-[250px]" />
                                <Skeleton className="h-10 w-[200px]" />
                            </div>

                            <div className="rounded-md border border-slate-700">
                                <div className="border-b border-slate-700 bg-slate-800/50 p-4">
                                    <div className="grid grid-cols-5 gap-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-[50px] ml-auto" />
                                    </div>
                                </div>

                                {Array.from({ length: 5 }).map((_, index) => (
                                    <div key={index} className="border-b border-slate-700 p-4">
                                        <div className="grid grid-cols-5 gap-4">
                                            <Skeleton className="h-4 w-[150px]" />
                                            <Skeleton className="h-4 w-[180px]" />
                                            <Skeleton className="h-4 w-[100px]" />
                                            <Skeleton className="h-4 w-[120px]" />
                                            <Skeleton className="h-4 w-[30px] ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <Skeleton className="h-8 w-[150px]" />
                                <Skeleton className="h-8 w-[200px]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
