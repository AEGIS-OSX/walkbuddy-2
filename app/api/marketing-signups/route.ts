import { NextResponse } from "next/server";

type MarketingSignupPayload = {
  email?: unknown;
  zip?: unknown;
  name?: unknown;
  utm?: unknown;
  source?: unknown;
};

type AvailabilityStatus = "served" | "pending";

type MarketingSignupResponse = {
  availability_status: AvailabilityStatus;
  pricing_range: "18–25";
  earliest_beta_date?: string;
  expansion_quarter?: string;
};

type ErrorResponse = {
  error: string;
};

type NormalizedMarketingSignupPayload = {
  email: string;
  zip: string;
  name?: string;
  utm?: Record<string, string>;
  source?: string;
};

const validationError = "Please enter a valid email and a 5-digit ZIP code.";
const duplicateError = "This ZIP and email are already on our list. We just sent a confirmation.";
const unexpectedError = "Unexpected error. Please try again.";
const submittedEmailZipPairs = new Set<string>();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const zipPattern = /^\d{5}$/;

function isMarketingSignupPayload(value: unknown): value is MarketingSignupPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry: unknown) => typeof entry === "string");
}

function normalizePayload(payload: MarketingSignupPayload): NormalizedMarketingSignupPayload | null {
  if (typeof payload.email !== "string" || typeof payload.zip !== "string") {
    return null;
  }

  const email = payload.email.trim().toLowerCase();
  const zip = payload.zip.trim();
  const name = typeof payload.name === "string" ? payload.name.trim() : undefined;
  const source = typeof payload.source === "string" ? payload.source.trim() : undefined;
  const utm = isStringRecord(payload.utm) ? payload.utm : undefined;

  if (!emailPattern.test(email) || !zipPattern.test(zip)) {
    return null;
  }

  return {
    email,
    zip,
    ...(name ? { name } : {}),
    ...(utm ? { utm } : {}),
    ...(source ? { source } : {})
  };
}

function getAvailabilityResponse(zip: string): MarketingSignupResponse {
  if (zip.startsWith("787")) {
    return {
      availability_status: "served",
      pricing_range: "18–25",
      earliest_beta_date: "2026-07-15"
    };
  }

  return {
    availability_status: "pending",
    pricing_range: "18–25",
    expansion_quarter: "Q3 2026"
  };
}

export async function POST(request: Request): Promise<NextResponse<MarketingSignupResponse | ErrorResponse>> {
  try {
    const body: unknown = await request.json();

    if (!isMarketingSignupPayload(body)) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const normalizedPayload = normalizePayload(body);

    if (!normalizedPayload) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const duplicateKey = `${normalizedPayload.email}:${normalizedPayload.zip}`;

    if (submittedEmailZipPairs.has(duplicateKey)) {
      return NextResponse.json({ error: duplicateError }, { status: 409 });
    }

    submittedEmailZipPairs.add(duplicateKey);

    // TODO: Replace stub with Postgres insert + ESP forward when credentials land.
    return NextResponse.json(getAvailabilityResponse(normalizedPayload.zip), { status: 200 });
  } catch {
    return NextResponse.json({ error: unexpectedError }, { status: 500 });
  }
}
