import { NextResponse } from "next/server";
import { getPayPalAccessToken, hasPayPalCredentials } from "@/lib/paypal";

export async function GET() {
  if (!hasPayPalCredentials()) {
    return NextResponse.json(
      {
        error: "PayPal credentials not configured",
        hint: "Add NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local",
      },
      { status: 400 }
    );
  }

  try {
    const token = await getPayPalAccessToken();
    return NextResponse.json({ success: true, tokenLength: token.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to obtain PayPal token", detail: message },
      { status: 502 }
    );
  }
}
