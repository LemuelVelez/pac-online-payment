/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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
      "X-Appwrite-Response-Format": "1.8.0",
      "X-Appwrite-Mode": "admin",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = (j && (j.message || j.error)) || "";
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* noop */
      }
    }
    const msg = detail || `Appwrite admin PATCH ${path} failed (${res.status})`;
    throw new Error(msg);
  }

  return res.json().catch(() => ({}));
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const endpoint = envOrThrow("NEXT_PUBLIC_APPWRITE_ENDPOINT");
    const projectId = envOrThrow("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    const apiKey = envOrThrow("APPWRITE_API_KEY");

    const { id } = await context.params;

    const { fullName, email } = (await req.json()) as {
      fullName?: string;
      email?: string;
    };

    if (!fullName && !email) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (typeof fullName === "string") {
      await adminCall(endpoint, projectId, apiKey, `/users/${id}/name`, {
        name: fullName,
      });
    }

    if (typeof email === "string") {
      await adminCall(endpoint, projectId, apiKey, `/users/${id}/email`, {
        email,
      });
      // NOTE: Changing email resets email verification on Appwrite.
      // Optionally control it with:
      // await adminCall(endpoint, projectId, apiKey, `/users/${id}/verification`, { emailVerification: false });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: toMessage(e) || "Failed to update account" },
      { status: 500 }
    );
  }
}
