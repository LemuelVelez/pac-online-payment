import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/providers"
import { RbacGate } from "@/lib/appwrite-rbac"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "PAC Salug Campus - Online Payment System",
  description: "Web-Based Online Payment System for PAC Salug Campus",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <RbacGate>{children}</RbacGate>
        </Providers>
      </body>
    </html>
  )
}
