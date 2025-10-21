/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { NextResponse } from "next/server";
import { Query } from "appwrite"; // ✅ use official builders
import { randomBytes } from "crypto";

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
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>,
  searchParams?: Record<string, string | string[] | undefined>
): Promise<any> {
  let url = buildApiUrl(endpoint, path);

  if (searchParams) {
    const qp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (Array.isArray(v)) {
        for (const item of v) qp.append(k, item);
      } else if (typeof v === "string") {
        qp.append(k, v);
      }
    }
    const qs = qp.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      "X-Appwrite-Mode": "admin",
      "X-Appwrite-Response-Format": "1.8.0", // ✅ keep response shape stable
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
        ? " (Check APPWRITE_API_KEY scopes: users.read, users.write, databases.read, databases.write)"
        : "";

    const msg =
      detail ||
      `Appwrite admin ${method} ${path} failed (${res.status})${scopeHint}`;
    throw new Error(msg);
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
}

function randomPassword(len: number = 16) {
  return randomBytes(len).toString("base64url");
}

/** GET /api/admin/users
 *  - ?limit=100&cursor={id} for paginated fetch
 *  - ?all=1 to fetch-and-aggregate all (server side)
 */
export async function GET(req: Request) {
  try {
    const endpoint = envOrThrow("NEXT_PUBLIC_APPWRITE_ENDPOINT");
    const projectId = envOrThrow("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    const apiKey = envOrThrow("APPWRITE_API_KEY");
    const DB_ID = envOrThrow("NEXT_PUBLIC_APPWRITE_DATABASE_ID");
    const USERS_COL_ID = envOrThrow("NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID");

    const url = new URL(req.url);
    const all = url.searchParams.get("all") === "1";
    const limitParam = Number(url.searchParams.get("limit") || "100");
    const limit = Math.max(1, Math.min(100, limitParam));
    let cursor = url.searchParams.get("cursor") || undefined;

    const collect: any[] = [];
    let nextCursor: string | undefined;
    let total: number | undefined;

    const fetchOnce = async (cur?: string) => {
      // ✅ Build queries with Appwrite's Query helpers (prevents syntax errors)
      const queries: string[] = [
        Query.limit(limit),
        Query.orderDesc("$updatedAt"),
      ];
      if (cur) queries.push(Query.cursorAfter(cur));

      const res = await adminFetch(
        endpoint,
        projectId,
        apiKey,
        `/databases/${DB_ID}/collections/${USERS_COL_ID}/documents`,
        "GET",
        undefined,
        { "queries[]": queries }
      );

      const docs = Array.isArray(res?.documents) ? res.documents : [];
      const pageTotal =
        typeof res?.total === "number"
          ? (res.total as number)
          : Array.isArray(res?.documents)
          ? res.documents.length
          : 0;

      if (total === undefined) total = pageTotal;

      if (docs.length === limit) {
        nextCursor = docs[docs.length - 1]?.$id as string | undefined;
      } else {
        nextCursor = undefined;
      }

      return docs as any[];
    };

    if (all) {
      for (;;) {
        const docs = await fetchOnce(cursor);
        collect.push(...docs);
        if (!nextCursor) break;
        cursor = nextCursor;
      }
      return NextResponse.json({
        ok: true,
        documents: collect,
        total: collect.length,
      });
    } else {
      const docs = await fetchOnce(cursor);
      return NextResponse.json({
        ok: true,
        documents: docs,
        nextCursor,
        limit,
        total: typeof total === "number" ? total : undefined,
      });
    }
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error:
          toMessage(e) ||
          "Failed to list users. Check API key scopes and collection permissions.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const endpoint = envOrThrow("NEXT_PUBLIC_APPWRITE_ENDPOINT");
    const projectId = envOrThrow("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    const apiKey = envOrThrow("APPWRITE_API_KEY");
    const DB_ID = envOrThrow("NEXT_PUBLIC_APPWRITE_DATABASE_ID");
    const USERS_COL_ID = envOrThrow("NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID");

    const {
      fullName,
      email,
      password,
      role,
      status,
      studentId,
    } = (await req.json()) as {
      fullName: string;
      email: string;
      password?: string;
      role?: string;
      status?: string;
      studentId?: string;
    };

    if (!fullName || !email) {
      return NextResponse.json(
        { ok: false, error: "fullName and email are required" },
        { status: 400 }
      );
    }

    const pwd =
      password && password.length >= 8 ? password : randomPassword(12);

    // 1) Create Appwrite Account (Users API)
    const createdUser = await adminFetch(
      endpoint,
      projectId,
      apiKey,
      `/users`,
      "POST",
      {
        userId: "unique()",
        name: fullName,
        email,
        password: pwd,
      }
    );

    const userId: string = createdUser?.$id ?? createdUser?.id;

    // 2) Create profile document in DB (server-side, admin key)
    const profileData: Record<string, unknown> = {
      userId,
      email,
      fullName,
      role: role ?? "student",
      status: status ?? "active",
    };
    if (studentId) profileData.studentId = studentId;

    const profileDoc = await adminFetch(
      endpoint,
      projectId,
      apiKey,
      `/databases/${DB_ID}/collections/${USERS_COL_ID}/documents`,
      "POST",
      {
        documentId: userId,
        data: profileData,
        permissions: [
          `read("user:${userId}")`,
          `update("user:${userId}")`,
          `delete("user:${userId}")`,
        ],
      }
    );

    return NextResponse.json({
      $id: userId,
      email: createdUser?.email ?? email,
      name: createdUser?.name ?? fullName,
      tempPassword: password ? undefined : pwd,
      profile: profileDoc,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error:
          toMessage(e) ||
          "Server error. Verify APPWRITE_API_KEY scopes for users/databases.",
      },
      { status: 500 }
    );
  }
}
