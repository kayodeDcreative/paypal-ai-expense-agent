/**
 * PayPal REST API helpers
 * Supports both live sandbox calls and graceful fallback to mock data
 */

import { PayPalTransaction } from "./types";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";

// ─── Access Token ─────────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "PayPal credentials not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local"
    );
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal token error (${res.status}): ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

// ─── Fetch Transactions ───────────────────────────────────────────────────────

export interface PayPalTransactionListParams {
  startDate?: string; // ISO date string
  endDate?: string;
  pageSize?: number;
  page?: number;
}

export async function fetchPayPalTransactions(
  params: PayPalTransactionListParams = {}
): Promise<PayPalTransaction[]> {
  const token = await getPayPalAccessToken();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const startDate =
    params.startDate ?? thirtyDaysAgo.toISOString().split(".")[0] + "Z";
  const endDate = params.endDate ?? now.toISOString().split(".")[0] + "Z";
  const pageSize = params.pageSize ?? 100;

  const url = new URL(`${PAYPAL_API_BASE}/v1/reporting/transactions`);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set("fields", "all");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal transactions error (${res.status}): ${err}`);
  }

  const data = await res.json();

  // Normalize PayPal API response to our internal type
  return (data.transaction_details ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any): PayPalTransaction => {
      const info = item.transaction_info;
      const payer = item.payer_info;

      const amountValue = parseFloat(
        info.transaction_amount?.value ?? "0"
      );

      const statusMap: Record<string, PayPalTransaction["status"]> = {
        S: "COMPLETED",
        P: "PENDING",
        V: "REVERSED",
        F: "FAILED",
        D: "FAILED",
        R: "REFUNDED",
      };

      return {
        id: info.transaction_id,
        date: info.transaction_initiation_date,
        description:
          info.transaction_subject ??
          info.transaction_note ??
          info.paypal_reference_id ??
          "PayPal Transaction",
        amount: amountValue,
        currency: info.transaction_amount?.currency_code ?? "USD",
        status: statusMap[info.transaction_status] ?? "COMPLETED",
        type: amountValue < 0 ? "PAYMENT" : "PAYMENT",
        counterparty:
          payer?.payer_name?.alternate_full_name ??
          payer?.email_address ??
          "Unknown",
        counterpartyEmail: payer?.email_address,
        invoiceId: info.invoice_id,
        note: info.transaction_note,
      };
    }
  );
}

// ─── Check if credentials are configured ────────────────────────────────────

export function hasPayPalCredentials(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET
  );
}
