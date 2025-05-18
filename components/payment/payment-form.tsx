"use client"

import type React from "react"

import { useState } from "react"
import { CreditCard, Calendar, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaymentFormProps {
  amount: string
  description: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function PaymentForm({ amount, description, onSuccess, onCancel }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // In a real implementation, this would generate a Paymongo checkout URL
    // and redirect the user to that URL
    setTimeout(() => {
      setIsProcessing(false)
      alert("In production, you would be redirected to Paymongo's secure payment page.")
      if (onSuccess) onSuccess()
    }, 1000)
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-white">Complete Payment</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-2">
          <p className="text-2xl font-bold text-white">{amount}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-white">Payment Method</Label>
              <RadioGroup
                defaultValue="card"
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-800 p-4 hover:bg-slate-700/50 hover:text-white peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:text-white cursor-pointer"
                  >
                    <CreditCard className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Card</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="ewallet" id="ewallet" className="peer sr-only" />
                  <Label
                    htmlFor="ewallet"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-800 p-4 hover:bg-slate-700/50 hover:text-white peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:text-white cursor-pointer"
                  >
                    <svg className="mb-2 h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M21 12V7H5C4.46957 7 3.96086 6.78929 3.58579 6.41421C3.21071 6.03914 3 5.53043 3 5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19V7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H21V16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M18 16C19.6569 16 21 14.6569 21 13C21 11.3431 19.6569 10 18 10C16.3431 10 15 11.3431 15 13C15 14.6569 16.3431 16 18 16Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-sm font-medium">E-Wallet</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
                  <Label
                    htmlFor="bank"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-800 p-4 hover:bg-slate-700/50 hover:text-white peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:text-white cursor-pointer"
                  >
                    <svg className="mb-2 h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M4 10V17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 10V17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20 10V17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 17H22"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 7H22"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 7L12.01 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 3L21 3L12 7L3 3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-sm font-medium">Bank</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === "card" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-white">
                    Cardholder Name
                  </Label>
                  <Input
                    id="cardName"
                    placeholder="Name on card"
                    className="bg-slate-900/50 border-slate-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-white">
                    Card Number
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-white">
                      Expiry Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc" className="text-white">
                      CVC
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="cvc"
                        placeholder="123"
                        className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "ewallet" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ewalletType" className="text-white">
                    E-Wallet Provider
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue placeholder="Select e-wallet" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="grabpay">GrabPay</SelectItem>
                      <SelectItem value="paymaya">Maya</SelectItem>
                      <SelectItem value="coins">Coins.ph</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="text-white">
                    Mobile Number
                  </Label>
                  <Input
                    id="mobileNumber"
                    placeholder="09XX XXX XXXX"
                    className="bg-slate-900/50 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
            )}

            {paymentMethod === "bank" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="text-white">
                    Bank
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="bdo">BDO</SelectItem>
                      <SelectItem value="bpi">BPI</SelectItem>
                      <SelectItem value="metrobank">Metrobank</SelectItem>
                      <SelectItem value="unionbank">UnionBank</SelectItem>
                      <SelectItem value="landbank">Landbank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    You will be redirected to your bank&apos;s website to complete the payment.
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t border-slate-700 pt-4">
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          disabled={isProcessing}
          onClick={handleSubmit}
        >
          {isProcessing ? "Preparing Secure Checkout..." : "Proceed to Secure Checkout"}
        </Button>
        <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-slate-700" onClick={onCancel}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}
