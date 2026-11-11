import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Donor, StockStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize Bangladeshi phone numbers for duplicate checking.
 * Strips spaces, hyphens, and leading +88 / 88 country codes.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length === 13) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Validate Bangladeshi mobile number (01[3-9]XXXXXXXX) or standard 11-digit mobile.
 */
export function isValidBDPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^01[3-9]\d{8}$/.test(normalized);
}

/**
 * Format normalized phone into readable 01XXX-XXXXXX format if 11 digits.
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
  }
  return phone;
}

/**
 * Compute days elapsed since last donation date (YYYY-MM-DD).
 * Returns null if never donated / empty date.
 */
export function getDaysSinceDonation(lastDonationDate: string): number | null {
  if (!lastDonationDate) return null;
  const last = new Date(`${lastDonationDate}T00:00:00`);
  if (Number.isNaN(last.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today.getTime() - last.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 90-day medical eligibility check for whole blood donation.
 */
export function isEligibleBy90DayRule(lastDonationDate: string): boolean {
  const days = getDaysSinceDonation(lastDonationDate);
  if (days === null) return true;
  return days >= 90;
}

/**
 * Resolve effective donor availability respecting both auto 90-day rule and manual toggle.
 */
export function resolveDonorAvailability(donor: Pick<Donor, "isAvailable" | "availabilityMode" | "lastDonationDate">): boolean {
  if (donor.availabilityMode === "manual") {
    return donor.isAvailable;
  }
  return isEligibleBy90DayRule(donor.lastDonationDate);
}

export function getStockStatus(units: number): StockStatus {
  if (units < 3) return "Critical";
  if (units <= 5) return "Low Stock";
  return "Sufficient";
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return isoStr;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRelativeDaysAgoISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
