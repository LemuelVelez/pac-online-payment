/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Minimal PayMongo client for client-side redirection via Payment Links.
 * NOTE: Using a secret key in the browser is not recommended for production.
 * Move these calls to a server route if possible.
 */

const PAYMONGO_SECRET = process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY ?? "";
const PAYMONGO_PUBLIC = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY ?? "";
const API_BASE = "https://api.paymongo.com/v1";

export type PaymongoLinkInput = {
  /** Amount in Philippine Pesos (e.g., 1500 for ₱1,500.00). Decimals allowed. */
  amount: number;
  /** Short description that will show on the checkout page. */
  description?: string;
  /** Optional remark (e.g., course/year or internal ref). */
  remarks?: string;
  /** Arbitrary metadata to help you reconcile later. */
  metadata?: Record<string, any>;
};

export type PaymongoLinkResponse = {
  id: string;
  checkoutUrl: string;
  amount: number; // in centavos
  status: string;
};

/** Convert ₱ to centavos (PayMongo expects integer centavos). */
export function phpToCentavo(amountPhp: number): number {
  return Math.round((Number.isFinite(amountPhp) ? amountPhp : 0) * 100);
}

/** Create a Payment Link and return the checkout URL. */
export async function createPaymentLink(
  input: PaymongoLinkInput
): Promise<PaymongoLinkResponse> {
  if (!PAYMONGO_SECRET) {
    throw new Error(
      "Missing NEXT_PUBLIC_PAYMONGO_SECRET_KEY. Please set it in .env."
    );
  }

  const body = {
    data: {
      attributes: {
        amount: phpToCentavo(input.amount),
        currency: "PHP",
        description: input.description ?? "Tuition / School Fees",
        remarks: input.remarks ?? "",
        metadata: input.metadata ?? {},
      },
    },
  };

  const res = await fetch(`${API_BASE}/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // PayMongo requires a trailing ":" for Basic auth
      Authorization: `Basic ${btoa(`${PAYMONGO_SECRET}:`)}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errTxt = await res.text().catch(() => "");
    throw new Error(
      `PayMongo error (${res.status}): ${res.statusText}\n${errTxt}`
    );
  }

  const json: any = await res.json();
  const data = json?.data;
  const attrs = data?.attributes ?? {};

  return {
    id: data?.id as string,
    checkoutUrl: attrs?.checkout_url as string,
    amount: attrs?.amount as number,
    status: attrs?.status as string,
  };
}

/** (Optional) Retrieve a Payment Link by id. */
export async function retrievePaymentLink(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/links/${id}`, {
    headers: {
      Authorization: `Basic ${btoa(`${PAYMONGO_SECRET}:`)}`,
    },
  });
  if (!res.ok) {
    const errTxt = await res.text().catch(() => "");
    throw new Error(
      `PayMongo retrieve error (${res.status}): ${res.statusText}\n${errTxt}`
    );
  }
  return res.json();
}

// Exporting the public key too, in case you later switch to card tokenization.
export const PAYMONGO_PUBLIC_KEY = PAYMONGO_PUBLIC;
