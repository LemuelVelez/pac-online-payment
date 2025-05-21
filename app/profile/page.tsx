"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Mail, Phone, Save, User, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false)

    // Mock student data
    const studentData = {
        id: "2023-0001",
        name: "John Smith",
        email: "johnsmith@example.com",
        phone: "(123) 456-7890",
        course: "BS Computer Science",
        yearLevel: "Third Year",
        address: "123 College St., Salug, Zamboanga del Norte",
        birthdate: "1999-05-15",
        gender: "Male",
        emergencyContact: "Mary Smith",
        emergencyPhone: "(123) 456-7891",
        joinedDate: "August 2021",
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">My Profile</h1>
                    <p className="text-gray-300">View and manage your personal information</p>
                </div>

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="bg-slate-800 border-slate-700 mb-8 grid w-full grid-cols-2 lg:max-w-[400px]">
                        <TabsTrigger value="info" className="cursor-pointer">
                            Personal Information
                        </TabsTrigger>
                        <TabsTrigger value="academic" className="cursor-pointer">
                            Academic Profile
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <Card className="lg:col-span-2 bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription className="text-gray-300">Manage your personal details</CardDescription>
                                    </div>
                                    {!isEditing ? (
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            className="bg-primary hover:bg-primary/90 cursor-pointer"
                                        >
                                            Edit Profile
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setIsEditing(false)}
                                                className="text-gray-400 hover:text-white cursor-pointer"
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                            <Button className="bg-primary hover:bg-primary/90 cursor-pointer">
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="fullName">Full Name</Label>
                                                <Input
                                                    id="fullName"
                                                    defaultValue={studentData.name}
                                                    readOnly={!isEditing}
                                                    className="bg-slate-700 border-slate-600"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="studentId">Student ID</Label>
                                                <Input
                                                    id="studentId"
                                                    defaultValue={studentData.id}
                                                    readOnly={true}
                                                    className="bg-slate-700 border-slate-600"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    defaultValue={studentData.email}
                                                    readOnly={!isEditing}
                                                    className="bg-slate-700 border-slate-600"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input
                                                    id="phone"
                                                    defaultValue={studentData.phone}
                                                    readOnly={!isEditing}
                                                    className="bg-slate-700 border-slate-600"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="birthdate">Date of Birth</Label>
                                                <Input
                                                    id="birthdate"
                                                    type="date"
                                                    defaultValue={studentData.birthdate}
                                                    readOnly={!isEditing}
                                                    className="bg-slate-700 border-slate-600"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender">Gender</Label>
                                                <Select disabled={!isEditing} defaultValue={studentData.gender.toLowerCase()}>
                                                    <SelectTrigger id="gender" className="bg-slate-700 border-slate-600">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-700" />

                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input
                                                id="address"
                                                defaultValue={studentData.address}
                                                readOnly={!isEditing}
                                                className="bg-slate-700 border-slate-600"
                                            />
                                        </div>

                                        <Separator className="bg-slate-700" />

                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Emergency Contact</h3>
                                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="emergencyName">Contact Name</Label>
                                                    <Input
                                                        id="emergencyName"
                                                        defaultValue={studentData.emergencyContact}
                                                        readOnly={!isEditing}
                                                        className="bg-slate-700 border-slate-600"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="emergencyPhone">Contact Phone</Label>
                                                    <Input
                                                        id="emergencyPhone"
                                                        defaultValue={studentData.emergencyPhone}
                                                        readOnly={!isEditing}
                                                        className="bg-slate-700 border-slate-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-8">
                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Profile Photo</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center">
                                        <div className="relative mb-4">
                                            <Avatar className="h-32 w-32 border-4 border-slate-700">
                                                <AvatarImage src="https://github.com/shadcn.png" alt="Profile" />
                                                <AvatarFallback className="bg-slate-700 text-4xl">JS</AvatarFallback>
                                            </Avatar>
                                            {isEditing && (
                                                <div className="absolute -bottom-2 -right-2 rounded-full bg-primary p-2 text-white cursor-pointer">
                                                    <Camera className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-medium text-lg">{studentData.name}</h3>
                                            <p className="text-gray-400 text-sm">{studentData.id}</p>
                                        </div>
                                        {isEditing && (
                                            <Button
                                                variant="outline"
                                                className="mt-4 border-slate-600 text-white hover:bg-slate-700 cursor-pointer"
                                            >
                                                Upload New Photo
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/60 border-slate-700 text-white">
                                    <CardHeader>
                                        <CardTitle>Contact Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <Mail className="mr-2 h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Email</p>
                                                    <p>{studentData.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <Phone className="mr-2 h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Phone</p>
                                                    <p>{studentData.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <User className="mr-2 h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Member since</p>
                                                    <p>{studentData.joinedDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="academic">
                        <div className="grid grid-cols-1 gap-8">
                            <Card className="bg-slate-800/60 border-slate-700 text-white">
                                <CardHeader>
                                    <CardTitle>Academic Information</CardTitle>
                                    <CardDescription className="text-gray-300">Your current academic details</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Course</Label>
                                                <div className="rounded-md bg-slate-700 px-3 py-2 border border-slate-600">
                                                    {studentData.course}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Year Level</Label>
                                                <div className="rounded-md bg-slate-700 px-3 py-2 border border-slate-600">
                                                    {studentData.yearLevel}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Enrolled Since</Label>
                                                <div className="rounded-md bg-slate-700 px-3 py-2 border border-slate-600">
                                                    {studentData.joinedDate}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Current Status</Label>
                                                <div className="rounded-md bg-green-700/20 text-green-400 px-3 py-2 border border-green-700/30">
                                                    Enrolled
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-700" />

                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Current Term</h3>
                                            <div className="overflow-hidden overflow-x-auto rounded-lg border border-slate-700">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-slate-700 bg-slate-900/50 text-left text-sm font-medium text-gray-300">
                                                            <th className="px-6 py-3">Subject Code</th>
                                                            <th className="px-6 py-3">Subject Name</th>
                                                            <th className="px-6 py-3">Units</th>
                                                            <th className="px-6 py-3">Schedule</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-700">
                                                        <tr className="text-sm">
                                                            <td className="px-6 py-4 font-medium">CS101</td>
                                                            <td className="px-6 py-4">Introduction to Programming</td>
                                                            <td className="px-6 py-4">3</td>
                                                            <td className="px-6 py-4">MWF 8:30-10:00 AM</td>
                                                        </tr>
                                                        <tr className="text-sm">
                                                            <td className="px-6 py-4 font-medium">CS202</td>
                                                            <td className="px-6 py-4">Data Structures and Algorithms</td>
                                                            <td className="px-6 py-4">3</td>
                                                            <td className="px-6 py-4">TTh 1:00-2:30 PM</td>
                                                        </tr>
                                                        <tr className="text-sm">
                                                            <td className="px-6 py-4 font-medium">MATH201</td>
                                                            <td className="px-6 py-4">Calculus</td>
                                                            <td className="px-6 py-4">3</td>
                                                            <td className="px-6 py-4">MWF 10:30-12:00 PM</td>
                                                        </tr>
                                                        <tr className="text-sm">
                                                            <td className="px-6 py-4 font-medium">ENG101</td>
                                                            <td className="px-6 py-4">English Composition</td>
                                                            <td className="px-6 py-4">3</td>
                                                            <td className="px-6 py-4">TTh 8:30-10:00 AM</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t border-slate-700 pt-6">
                                    <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 cursor-pointer">
                                        Print Enrollment Certificate
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
