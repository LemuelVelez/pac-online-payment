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

async function adminFetch(
  endpoint: string,
  projectId: string,
  apiKey: string,
  path: string,
  method: "PATCH" | "DELETE",
  body?: Record<string, unknown>
): Promise<any> {
  const url = buildApiUrl(endpoint, path);
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      "X-Appwrite-Mode": "admin",
      "X-Appwrite-Response-Format": "1.8.0",
    },
    body: body ? JSON.stringify(body) : undefined,
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
    const scopeHint =
      res.status === 401 || res.status === 403
        ? " (Check APPWRITE_API_KEY scopes: databases.read, databases.write, users.read, users.write)"
        : "";
    throw new Error(
      detail ||
        `Appwrite admin ${method} ${path} failed (${res.status})${scopeHint}`
    );
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const endpoint = envOrThrow("NEXT_PUBLIC_APPWRITE_ENDPOINT");
    const projectId = envOrThrow("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    const apiKey = envOrThrow("APPWRITE_API_KEY");
    const DB_ID = envOrThrow("NEXT_PUBLIC_APPWRITE_DATABASE_ID");
    const USERS_COL_ID = envOrThrow("NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID");

    const { id } = await context.params;

    const patch = (await req.json()) as {
      fullName?: string;
      email?: string;
      role?: string;
      status?: string;
      studentId?: string;
      lastLogin?: string;
    };

    const data: Record<string, unknown> = {};
    if (patch.fullName !== undefined)
      data.fullName = (patch.fullName ?? "").trim();
    if (patch.email !== undefined) data.email = (patch.email ?? "").trim();
    if (patch.role !== undefined) data.role = patch.role;
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.studentId !== undefined)
      data.studentId = (patch.studentId ?? "").trim();
    if (patch.lastLogin !== undefined) data.lastLogin = patch.lastLogin;

    const updated = await adminFetch(
      endpoint,
      projectId,
      apiKey,
      `/databases/${DB_ID}/collections/${USERS_COL_ID}/documents/${id}`,
      "PATCH",
      { data }
    );

    return NextResponse.json({ ok: true, document: updated });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error:
          toMessage(e) ||
          "Failed to update user profile (server). Check API key scopes.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const endpoint = envOrThrow("NEXT_PUBLIC_APPWRITE_ENDPOINT");
    const projectId = envOrThrow("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    const apiKey = envOrThrow("APPWRITE_API_KEY");
    const DB_ID = envOrThrow("NEXT_PUBLIC_APPWRITE_DATABASE_ID");
    const USERS_COL_ID = envOrThrow("NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID");

    const { id } = await context.params;

    // Try deleting the Appwrite Account (Users API) **and** the profile document.
    // We ignore 404s so deletes are idempotent.
    const ignoreNotFound = (err: unknown) =>
      err instanceof Error && /404|not\s*found/i.test(err.message);

    let accountErr: Error | null = null;
    try {
      await adminFetch(endpoint, projectId, apiKey, `/users/${id}`, "DELETE");
    } catch (e) {
      if (!ignoreNotFound(e)) accountErr = e as Error;
    }

    let docErr: Error | null = null;
    try {
      await adminFetch(
        endpoint,
        projectId,
        apiKey,
        `/databases/${DB_ID}/collections/${USERS_COL_ID}/documents/${id}`,
        "DELETE"
      );
    } catch (e) {
      if (!ignoreNotFound(e)) docErr = e as Error;
    }

    if (accountErr || docErr) {
      const messages = [
        accountErr ? `Account delete failed: ${accountErr.message}` : null,
        docErr ? `Profile doc delete failed: ${docErr.message}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      return NextResponse.json({ ok: false, error: messages }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error:
          toMessage(e) ||
          "Failed to delete user (server). Check users/databases scopes.",
      },
      { status: 500 }
    );
  }
}
