import { CloudProviderMode } from "@/types";

export function detectCloudProvider(): CloudProviderMode {
  if (process.env.FIREBASE_DATABASE_URL?.trim()) {
    return "firebase";
  }
  if (process.env.NEON_SQL_ENDPOINT?.trim() && process.env.DATABASE_URL?.trim()) {
    return "neon";
  }
  return "local";
}
