export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type AvailabilityMode = "auto" | "manual";

export interface Donor {
  id: string;
  fullName: string;
  bloodGroup: BloodGroup;
  phone: string;
  address: string;
  lastDonationDate: string; // YYYY-MM-DD or ""
  isAvailable: boolean;
  availabilityMode: AvailabilityMode;
  notes?: string;
  createdAt: string;
}

export type BloodStockMap = Record<BloodGroup, number>;

export type StockStatus = "Sufficient" | "Low Stock" | "Critical";

export type StockLogType =
  | "addition"
  | "issuance"
  | "adjustment"
  | "request_approved";

export interface StockLogEntry {
  id: string;
  bloodGroup: BloodGroup;
  change: number;
  previousUnits: number;
  newUnits: number;
  reason: string;
  type: StockLogType;
  performedBy: string;
  timestamp: string;
  relatedRequestId?: string;
}

export type UrgencyLevel = "Normal" | "Urgent" | "Emergency";
export type RequestStatus = "Pending" | "Approved" | "Rejected";

export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  hospital: string;
  contactNumber: string;
  urgency: UrgencyLevel;
  requestDate: string; // YYYY-MM-DD
  status: RequestStatus;
  notes?: string;
  processedBy?: string;
  processedAt?: string;
}

export type UserRole = "admin" | "staff";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

export type CloudProviderMode = "local" | "firebase" | "neon";

export interface BloodBankStatePayload {
  donors: Donor[];
  stock: BloodStockMap;
  stockLogs: StockLogEntry[];
  requests: BloodRequest[];
  updatedAt: string;
}
