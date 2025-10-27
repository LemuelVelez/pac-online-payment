"use client"

import * as React from "react"

type ReceiptLine = { description: string; amount: string }

type PlanFeeItem = { name: string; amount: number }

type PlanDetails = {
  program: string
  units: number
  tuitionPerUnit: number
  registrationFee: number
  feeItems: PlanFeeItem[]
  planTotal?: number
} | null

type Summary = {
  totalFees?: number
  previouslyPaid?: number
  amountPaidNow?: number
  balanceAfter?: number
}

export type PaymentReceiptProps = {
  receiptNumber: string
  date: string
  studentId?: string | null
  studentName?: string | null
  paymentMethod?: string | null
  /** Line items actually charged on this receipt */
  items?: ReceiptLine[]
  /** Grand total of this receipt (already formatted) */
  total: string
  /** Selected fee plan (optional) */
  plan?: PlanDetails
  /** Totals & balances (optional) */
  summary?: Summary
}

function peso(n?: number) {
  return `₱${Number(n || 0).toLocaleString()}`
}

export function PaymentReceipt(props: PaymentReceiptProps) {
  const {
    receiptNumber,
    date,
    studentId,
    studentName,
    paymentMethod,
    plan,
    summary,
  } = props

  // Compute a plan total if not supplied
  const computedPlanTotal =
    plan
      ? (plan.registrationFee || 0) +
      (plan.units || 0) * (plan.tuitionPerUnit || 0) +
      (Array.isArray(plan.feeItems) ? plan.feeItems.reduce((s, f) => s + Number(f.amount || 0), 0) : 0)
      : 0

  const planTotal = (plan?.planTotal ?? computedPlanTotal) || 0

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white text-slate-900">
      <div className="border-b bg-emerald-600 p-5 text-white">
        <div className="text-lg font-bold">Official Receipt</div>
        <div className="opacity-90">Receipt ID: {receiptNumber}</div>
      </div>

      <div className="p-5">
        {/* Header info */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-slate-500">Student Name</div>
            <div className="font-semibold">{studentName || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Student ID</div>
            <div className="font-semibold">{studentId || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Issued Date</div>
            <div className="font-semibold">{date}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Payment Method</div>
            <div className="font-semibold">{paymentMethod || "—"}</div>
          </div>
        </div>

        {/* Selected Fee Plan (optional) */}
        {plan ? (
          <div className="mb-5 rounded-md border border-slate-200">
            <div className="border-b bg-slate-50 px-4 py-2 text-sm font-medium">Selected Fee Plan</div>
            <div className="p-4">
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-xs text-slate-500">Program</div>
                  <div className="font-semibold">{plan.program}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Units</div>
                  <div className="font-semibold">{plan.units}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tuition per Unit</div>
                  <div className="font-semibold">{peso(plan.tuitionPerUnit)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Registration Fee</div>
                  <div className="font-semibold">{peso(plan.registrationFee)}</div>
                </div>
              </div>

              {/* Fee Items (not "feeItemsJson") */}
              {Array.isArray(plan.feeItems) && plan.feeItems.length > 0 ? (
                <div className="overflow-hidden rounded-md border border-slate-200">
                  <div className="bg-slate-50 px-3 py-2 text-sm font-medium">Fee Items</div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 text-left text-sm text-slate-600">
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="px-3 py-2">
                            Tuition × Units ({plan.units} × {peso(plan.tuitionPerUnit)})
                          </td>
                          <td className="px-3 py-2 text-right">
                            {peso((plan.units || 0) * (plan.tuitionPerUnit || 0))}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2">Registration Fee</td>
                          <td className="px-3 py-2 text-right">{peso(plan.registrationFee)}</td>
                        </tr>
                        {plan.feeItems.map((fi, idx) => (
                          <tr key={`${fi.name}-${idx}`}>
                            <td className="px-3 py-2">{fi.name}</td>
                            <td className="px-3 py-2 text-right">{peso(fi.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold">
                          <td className="px-3 py-2 text-right">Plan Total</td>
                          <td className="px-3 py-2 text-right">{peso(planTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Summary (Amount Paid / Current Balance) */}
        {summary ? (
          <div className="rounded-md border border-slate-200">
            <div className="bg-slate-50 px-4 py-2 text-sm font-medium">Payment Summary</div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs text-slate-500">Total Fees</div>
                <div className="font-semibold">{peso(summary.totalFees)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Previously Paid</div>
                <div className="font-semibold">{peso(summary.previouslyPaid)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Amount Paid (This Transaction)</div>
                <div className="font-semibold">{peso(summary.amountPaidNow)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Current Balance</div>
                <div className="font-semibold">{peso(summary.balanceAfter)}</div>
              </div>
            </div>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-slate-500">
          This is a system-generated receipt. No signature required.
        </p>
      </div>
    </div>
  )
}
