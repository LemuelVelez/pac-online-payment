import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Printer } from "lucide-react"

interface PaymentReceiptProps {
  receiptNumber: string
  date: string
  studentId: string
  studentName: string
  paymentMethod: string
  items: {
    description: string
    amount: string
  }[]
  total: string
}

export function PaymentReceipt({
  receiptNumber,
  date,
  studentId,
  studentName,
  paymentMethod,
  items,
  total,
}: PaymentReceiptProps) {
  return (
    <Card className="bg-white text-slate-900 w-full max-w-xs mx-auto">
      <CardHeader className="text-center border-b border-slate-200 pb-1 pt-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          {/* Uses /public/images/logo.png */}
          <Image
            src="/images/logo.png"
            alt="PAC Salug Campus Logo"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            priority
          />
          <h2 className="text-base font-bold">PAC Salug Campus</h2>
        </div>
        <p className="text-[10px] text-slate-500">Philippine Advent College - Salug Campus</p>
        <p className="text-[10px] text-slate-500">Zamboanga del Norte</p>
      </CardHeader>

      <CardContent className="pt-2 pb-2">
        <div className="mb-2">
          <h3 className="text-base font-bold text-center mb-0.5">PAYMENT RECEIPT</h3>
          <p className="text-[10px] text-slate-500 text-center">Official Receipt</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p className="text-[10px] text-slate-500">Receipt No.</p>
            <p className="font-medium text-xs">{receiptNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Date</p>
            <p className="font-medium text-xs">{date}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Student ID</p>
            <p className="font-medium text-xs">{studentId}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Payment Method</p>
            <p className="font-medium text-xs">{paymentMethod}</p>
          </div>
        </div>

        <div className="mb-2">
          <p className="text-[10px] text-slate-500">Student Name</p>
          <p className="font-medium text-xs">{studentName}</p>
        </div>

        <Separator className="my-2" />

        <div className="space-y-1 mb-2">
          <div className="flex justify-between font-medium text-xs">
            <span>Description</span>
            <span>Amount</span>
          </div>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="text-slate-600">{item.description}</span>
              <span>{item.amount}</span>
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="flex justify-between font-bold text-sm">
          <span>Total</span>
          <span>{total}</span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-slate-200 pt-2 pb-2">
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Printer className="h-3 w-3" />
          Print
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      </CardFooter>
    </Card>
  )
}
