import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface PaymentReceiptProps {
  // Required data for the receipt
  receiptNumber: string
  date: string
  studentId: string
  studentName: string
  paymentMethod: string
  /**
   * Real-time items only. Leave undefined/empty when no breakdown exists.
   * The component will then show only the total.
   */
  items?: {
    description: string
    amount: string
  }[]
  total: string

  // Optional branding (no hardcoded defaults)
  brandLogoSrc?: string
  brandName?: string
  brandSubtitle?: string
  brandAddress?: string
}

export function PaymentReceipt({
  receiptNumber,
  date,
  studentId,
  studentName,
  paymentMethod,
  items,
  total,
  brandLogoSrc,
  brandName,
  brandSubtitle,
  brandAddress,
}: PaymentReceiptProps) {
  const hasItems = Array.isArray(items) && items.length > 0

  return (
    <Card className="bg-white text-slate-900 w-full max-w-xs mx-auto">
      <CardHeader className="text-center border-b border-slate-200 pb-1 pt-2">
        {(brandLogoSrc || brandName) && (
          <div className="flex items-center justify-center gap-2 mb-1">
            {brandLogoSrc ? (
              <Image
                src={brandLogoSrc}
                alt={brandName ? `${brandName} Logo` : "Organization Logo"}
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
                priority
              />
            ) : null}
            {brandName ? <h2 className="text-base font-bold">{brandName}</h2> : null}
          </div>
        )}

        {brandSubtitle ? <p className="text-[10px] text-slate-500">{brandSubtitle}</p> : null}
        {brandAddress ? <p className="text-[10px] text-slate-500">{brandAddress}</p> : null}
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

        {hasItems ? (
          <>
            <Separator className="my-2" />
            <div className="space-y-1 mb-2">
              <div className="flex justify-between font-medium text-xs">
                <span>Description</span>
                <span>Amount</span>
              </div>
              {items!.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-slate-600">{item.description}</span>
                  <span>{item.amount}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <Separator className="my-2" />

        <div className="flex justify-between font-bold text-sm">
          <span>Total</span>
          <span>{total}</span>
        </div>

        {!hasItems ? (
          <p className="mt-1 text-[10px] text-slate-500 text-center">
            No itemized breakdown available yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
