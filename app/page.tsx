"use client"

/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, CreditCard, ShieldCheck, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/main-layout"
import { SectionHeading } from "@/components/ui/section-heading"
import { FeatureCard } from "@/components/ui/feature-card"
import { StepItem } from "@/components/ui/step-item"
import { useSessionRole } from "@/lib/appwrite-rbac"

export default function Home() {
  const { loading, user, dashboardHref } = useSessionRole()
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    if (!loading) setIsAuthed(!!user)
  }, [loading, user])

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <section className="flex flex-col md:flex-row gap-12 items-center mb-20">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pay Your Fees{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
                Online
              </span>
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              A secure and convenient way to pay your tuition and other fees online. No more queues, no more waiting.
            </p>
            <div className="flex">
              {!isAuthed && (
                <Button className="text-white bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 px-8 py-6 text-lg">
                  <Link href="/auth">Get Started</Link>
                </Button>
              )}
              {isAuthed && (
                <Button className="text-white bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 px-8 py-6 text-lg">
                  <Link href={dashboardHref}>Go to Dashboard</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 opacity-75 blur"></div>
              <div className="relative bg-slate-800 p-6 rounded-lg">
                <img
                  src="/images/students-online-payment.png"
                  alt="Online Payment Illustration"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <SectionHeading title="Why Choose Our Online Payment System?" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={CreditCard}
              title="Multiple Payment Options"
              description="Pay using GCash, PayMaya, bank transfers, and other e-wallets for maximum convenience."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Secure Transactions"
              description="Advanced encryption and security measures to protect your financial information."
            />
            <FeatureCard
              icon={Clock}
              title="Real-time Updates"
              description="Instant confirmation and real-time tracking of your payment history."
            />
          </div>
        </section>

        <section className="mb-20">
          <div className="bg-gradient-to-r from-sky-500/50 to-blue-500/50 p-8 rounded-lg">
            <SectionHeading title="How It Works" className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <StepItem number={1} title="Login" description="Sign in with your student credentials" />
              <StepItem number={2} title="Select Fee" description="Choose the fee you want to pay" />
              <StepItem number={3} title="Pay Online" description="Complete payment using your preferred method" />
              <StepItem number={4} title="Get Receipt" description="Receive digital receipt and confirmation" isLast />
            </div>
          </div>
        </section>

        <section>
          <div className="text-center mb-12">
            <SectionHeading
              title="Ready to Get Started?"
              description="Join hundreds of students who are already enjoying the convenience of our online payment system."
            />
            <Button className="text-white bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 px-8 py-6 text-lg">
              <Link href={isAuthed ? dashboardHref : "/auth"}>
                {isAuthed ? "Go to Dashboard" : "Login Now"}
              </Link>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}
