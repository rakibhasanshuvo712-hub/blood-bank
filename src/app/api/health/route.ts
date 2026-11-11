import { NextResponse } from "next/server";
import { detectCloudProvider } from "@/lib/cloudProvider";

export async function GET() {
  const provider = detectCloudProvider();
  return NextResponse.json({
    ok: true,
    provider,
    zeroConfigLocalStorage: true,
    timestamp: new Date().toISOString(),
  });
}
