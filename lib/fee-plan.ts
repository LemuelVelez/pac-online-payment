/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Models } from "appwrite"
import { getDatabases, ID, Query, Permission, Role, getEnvIds } from "@/lib/appwrite"

export type FeeItemRecord = {
  id: string
  name: string
  amount: number
}

export type FeePlanRecord = {
  program: string
  units: number
  tuitionPerUnit: number
  registrationFee: number
  feeItems: FeeItemRecord[]
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

export type FeePlanDoc = Models.Document & FeePlanRecord

type FeePlanStorage = Omit<FeePlanRecord, "feeItems" | "createdAt" | "updatedAt"> & {
  feeItemsJson: string
}
type FeePlanStorageDoc = Models.Document & FeePlanStorage

function ids() {
  const { DB_ID } = getEnvIds()
  const FEE_PLANS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_FEE_PLANS_COLLECTION_ID as string
  if (!DB_ID || !FEE_PLANS_COL_ID) {
    console.warn("[fee-plan] Missing DB / Fee Plans collection env IDs.")
  }
  return { DB_ID, FEE_PLANS_COL_ID }
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function normalizeNumbers<T extends Partial<FeePlanRecord>>(v: T): T {
  return {
    ...v,
    units: Number(v.units ?? 0),
    tuitionPerUnit: Number(v.tuitionPerUnit ?? 0),
    registrationFee: Number(v.registrationFee ?? 0),
    feeItems: (v.feeItems ?? []).map((f) => ({
      id: f.id || uid(),
      name: (f.name ?? "").trim(),
      amount: Number(f.amount ?? 0),
    })),
  } as T
}

function fromStorage(doc: FeePlanStorageDoc): FeePlanDoc {
  let feeItems: FeeItemRecord[] = []
  try {
    const raw = (doc as any).feeItemsJson ?? "[]"
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      feeItems = parsed.map((f) => ({
        id: f.id ?? uid(),
        name: (f.name ?? "").trim(),
        amount: Number(f.amount ?? 0),
      }))
    }
  } catch {
    feeItems = []
  }
  const { ...rest } = doc as any
  return {
    ...rest,
    feeItems,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  } as FeePlanDoc
}

function toStoragePayload(input: Partial<FeePlanRecord>): Partial<FeePlanStorage> {
  const norm = normalizeNumbers(input)
  const out: Partial<FeePlanStorage> = {}
  if (norm.program !== undefined) out.program = (norm.program ?? "").trim()
  if (norm.units !== undefined) out.units = Number(norm.units || 0)
  if (norm.tuitionPerUnit !== undefined) out.tuitionPerUnit = Number(norm.tuitionPerUnit || 0)
  if (norm.registrationFee !== undefined) out.registrationFee = Number(norm.registrationFee || 0)
  if (norm.isActive !== undefined) out.isActive = !!norm.isActive
  if (norm.feeItems !== undefined) out.feeItemsJson = JSON.stringify(norm.feeItems ?? [])
  return out
}

export async function createFeePlan(input: Omit<FeePlanRecord, "createdAt" | "updatedAt">): Promise<FeePlanDoc> {
  const db = getDatabases()
  const { DB_ID, FEE_PLANS_COL_ID } = ids()
  const norm = normalizeNumbers(input)
  const storagePayload: FeePlanStorage = {
    program: (norm.program ?? "").trim() || "Untitled Fee Plan",
    units: Number(norm.units || 0),
    tuitionPerUnit: Number(norm.tuitionPerUnit || 0),
    registrationFee: Number(norm.registrationFee || 0),
    feeItemsJson: JSON.stringify(norm.feeItems ?? []),
    isActive: input.isActive ?? true,
  }
  const doc = await db.createDocument<FeePlanStorageDoc>(
    DB_ID,
    FEE_PLANS_COL_ID,
    ID.unique(),
    storagePayload,
    [Permission.read(Role.any()), Permission.update(Role.users()), Permission.delete(Role.users())]
  )
  return fromStorage(doc)
}

export async function updateFeePlan(id: string, patch: Partial<FeePlanRecord>): Promise<FeePlanDoc> {
  const db = getDatabases()
  const { DB_ID, FEE_PLANS_COL_ID } = ids()
  const storagePatch = toStoragePayload({
    ...patch,
    program: typeof patch.program === "string" ? patch.program.trim() : undefined,
  })
  const doc = await db.updateDocument<FeePlanStorageDoc>(DB_ID, FEE_PLANS_COL_ID, id, storagePatch)
  return fromStorage(doc)
}

export async function deleteFeePlan(id: string): Promise<void> {
  const db = getDatabases()
  const { DB_ID, FEE_PLANS_COL_ID } = ids()
  await db.deleteDocument(DB_ID, FEE_PLANS_COL_ID, id)
}

export async function getFeePlan(id: string): Promise<FeePlanDoc> {
  const db = getDatabases()
  const { DB_ID, FEE_PLANS_COL_ID } = ids()
  const doc = await db.getDocument<FeePlanStorageDoc>(DB_ID, FEE_PLANS_COL_ID, id)
  return fromStorage(doc)
}

export async function listFeePlansPage(limit = 50, cursorAfter?: string) {
  const db = getDatabases()
  const { DB_ID, FEE_PLANS_COL_ID } = ids()
  const queries: string[] = [Query.orderDesc("$updatedAt"), Query.limit(Math.max(1, Math.min(100, limit)))]
  if (cursorAfter) queries.push(Query.cursorAfter(cursorAfter))
  const res = await db.listDocuments<FeePlanStorageDoc>(DB_ID, FEE_PLANS_COL_ID, queries)
  const docs = (res.documents ?? []).map(fromStorage)
  const nextCursor = docs.length >= limit ? docs[docs.length - 1].$id : undefined
  return { docs, nextCursor }
}

export async function listAllFeePlans(): Promise<FeePlanDoc[]> {
  const all: FeePlanDoc[] = []
  let cursor: string | undefined
  for (;;) {
    const { docs, nextCursor } = await listFeePlansPage(100, cursor)
    all.push(...docs)
    if (!nextCursor) break
    cursor = nextCursor
  }
  return all
}

export async function duplicateFeePlan(id: string): Promise<FeePlanDoc> {
  const src = await getFeePlan(id)
  const copy: Omit<FeePlanRecord, "createdAt" | "updatedAt"> = {
    program: `${src.program} (Copy)`,
    units: src.units,
    tuitionPerUnit: src.tuitionPerUnit,
    registrationFee: src.registrationFee,
    feeItems: (src.feeItems ?? []).map((f) => ({ ...f, id: uid() })),
    isActive: src.isActive ?? true,
  }
  return createFeePlan(copy)
}

export function computeTotals(plan: Pick<FeePlanRecord, "units" | "tuitionPerUnit" | "registrationFee" | "feeItems">) {
  const tuition = (Number(plan.units) || 0) * (Number(plan.tuitionPerUnit) || 0)
  const others = (plan.feeItems ?? []).reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const total = (Number(plan.registrationFee) || 0) + tuition + others
  return { tuition, others, total }
}
