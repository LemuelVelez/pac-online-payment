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
    <Card className="bg-white text-slate-900 w-full mx-auto">
      <CardHeader className="text-center border-b border-slate-200 pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
            P
          </div>
          <h2 className="text-xl font-bold">PAC Salug Campus</h2>
        </div>
        <p className="text-sm text-slate-500">Philippine Advent College - Salug Campus</p>
        <p className="text-sm text-slate-500">Zamboanga del Norte</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-center mb-1">PAYMENT RECEIPT</h3>
          <p className="text-sm text-slate-500 text-center">Official Receipt</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-slate-500">Receipt No.</p>
            <p className="font-medium">{receiptNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Date</p>
            <p className="font-medium">{date}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Student ID</p>
            <p className="font-medium">{studentId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Payment Method</p>
            <p className="font-medium">{paymentMethod}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-500">Student Name</p>
          <p className="font-medium">{studentName}</p>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2 mb-6">
          <div className="flex justify-between font-medium">
            <span>Description</span>
            <span>Amount</span>
          </div>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-slate-600">{item.description}</span>
              <span>{item.amount}</span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{total}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-slate-200 pt-4">
        <Button variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  )
}
