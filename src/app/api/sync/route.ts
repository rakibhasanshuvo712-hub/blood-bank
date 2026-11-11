import { NextRequest, NextResponse } from "next/server";
import { BloodBankStatePayload } from "@/types";
import { detectCloudProvider } from "@/lib/cloudProvider";

/**
 * Optional Cloud Sync Endpoint (Firebase RTDB REST or Neon.tech HTTP SQL).
 * In zero-config Vercel deployments without env vars, gracefully responds with mode: "local".
 */
export async function GET() {
  const provider = detectCloudProvider();

  if (provider === "firebase") {
    try {
      const baseUrl = process.env.FIREBASE_DATABASE_URL!.replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/bloodbank_state.json`, {
        cache: "no-store",
      });
      if (!res.ok) {
        return NextResponse.json(
          { mode: "firebase", synced: false, error: `HTTP ${res.status}` },
          { status: 200 }
        );
      }
      const data = await res.json();
      return NextResponse.json({ mode: "firebase", synced: true, data });
    } catch {
      return NextResponse.json({ mode: "firebase", synced: false });
    }
  }

  if (provider === "neon") {
    try {
      const endpoint = process.env.NEON_SQL_ENDPOINT!;
      const connStr = process.env.DATABASE_URL!;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Neon-Connection-String": connStr,
        },
        body: JSON.stringify({
          query:
            "SELECT payload FROM bloodbank_snapshots WHERE id = 'default' LIMIT 1;",
        }),
      });
      if (!res.ok) {
        return NextResponse.json({ mode: "neon", synced: false });
      }
      const result = await res.json();
      const row = result?.rows?.[0];
      return NextResponse.json({
        mode: "neon",
        synced: true,
        data: row?.payload ?? null,
      });
    } catch {
      return NextResponse.json({ mode: "neon", synced: false });
    }
  }

  return NextResponse.json({
    mode: "local",
    synced: false,
    message: "Running in zero-config LocalStorage mode.",
  });
}

export async function POST(req: NextRequest) {
  const provider = detectCloudProvider();
  let payload: BloodBankStatePayload;

  try {
    payload = (await req.json()) as BloodBankStatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (provider === "firebase") {
    try {
      const baseUrl = process.env.FIREBASE_DATABASE_URL!.replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/bloodbank_state.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return NextResponse.json({
        mode: "firebase",
        synced: res.ok,
      });
    } catch {
      return NextResponse.json({ mode: "firebase", synced: false });
    }
  }

  if (provider === "neon") {
    try {
      const endpoint = process.env.NEON_SQL_ENDPOINT!;
      const connStr = process.env.DATABASE_URL!;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Neon-Connection-String": connStr,
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS bloodbank_snapshots (
              id TEXT PRIMARY KEY,
              payload JSONB NOT NULL,
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            INSERT INTO bloodbank_snapshots (id, payload, updated_at)
            VALUES ('default', $1::jsonb, NOW())
            ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW();
          `,
          params: [JSON.stringify(payload)],
        }),
      });
      return NextResponse.json({
        mode: "neon",
        synced: res.ok,
      });
    } catch {
      return NextResponse.json({ mode: "neon", synced: false });
    }
  }

  return NextResponse.json({
    mode: "local",
    synced: true,
  });
}
