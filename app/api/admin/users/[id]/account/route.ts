/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

function envOrThrow(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

function toMessage(x: unknown): string {
  if (x instanceof Error) return x.message;
  if (x && typeof x === "object" && "message" in x) {
    const m = (x as any).message;
    if (typeof m === "string") return m;
  }
  try {
    return typeof x === "string" ? x : JSON.stringify(x);
  } catch {
    return String(x);
  }
}

function buildApiUrl(endpoint: string, path: string) {
  const clean = endpoint.replace(/\/+$/, "");
  const withV1 = /\/v1$/.test(clean) ? clean : `${clean}/v1`;
  return `${withV1}${path}`;
}

async function adminCall(
  endpoint: string,
  projectId: string,
  apiKey: string,
  path: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const url = buildApiUrl(endpoint, path);
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      // "X-Appwrite-Mode": "admin", // optional; keys generally imply admin
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      txt || `Appwrite admin PATCH ${path} failed (${res.status})`
    );
  }
  return res.json().catch(() => ({}));
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const endpoint = envOrThrow("NEXT_PUBLIC_APPWRITE_ENDPOINT");
    const projectId = envOrThrow("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    const apiKey = envOrThrow("APPWRITE_API_KEY");

    const { fullName, email } = (await req.json()) as {
      fullName?: string;
      email?: string;
    };

    if (!fullName && !email) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ops: Promise<unknown>[] = [];
    if (typeof fullName === "string") {
      ops.push(
        adminCall(endpoint, projectId, apiKey, `/users/${params.id}/name`, {
          name: fullName,
        })
      );
    }
    if (typeof email === "string") {
      ops.push(
        adminCall(endpoint, projectId, apiKey, `/users/${params.id}/email`, {
          email,
        })
      );
    }

    const results = await Promise.allSettled(ops);
    const failed = results.find((r) => r.status === "rejected");
    if (failed) {
      const reason = (failed as PromiseRejectedResult).reason;
      return NextResponse.json(
        { ok: false, error: toMessage(reason) || "Failed to update account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: toMessage(e) || "Server error" },
      { status: 500 }
    );
  }
}
