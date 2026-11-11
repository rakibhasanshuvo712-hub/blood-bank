"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AvailabilityMode,
  BLOOD_GROUPS,
  BloodBankStatePayload,
  BloodGroup,
  BloodRequest,
  BloodStockMap,
  CloudProviderMode,
  Donor,
  StockLogEntry,
  StockLogType,
  UrgencyLevel,
} from "@/types";
import {
  INITIAL_BLOOD_STOCK,
  INITIAL_DONORS,
  INITIAL_REQUESTS,
  INITIAL_STOCK_LOGS,
} from "@/data/initialData";
import {
  formatPhoneDisplay,
  isEligibleBy90DayRule,
  isValidBDPhone,
  normalizePhone,
  resolveDonorAvailability,
} from "@/lib/utils";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const STORAGE_KEY = "bbms_hybrid_data_v1";

export interface DonorInput {
  fullName: string;
  bloodGroup: BloodGroup;
  phone: string;
  address: string;
  lastDonationDate: string;
  availabilityMode: AvailabilityMode;
  isAvailable: boolean;
  notes?: string;
}

export interface RequestInput {
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  hospital: string;
  contactNumber: string;
  urgency: UrgencyLevel;
  requestDate: string;
  notes?: string;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface BloodBankContextValue {
  donors: Donor[];
  stock: BloodStockMap;
  stockLogs: StockLogEntry[];
  requests: BloodRequest[];
  isHydrated: boolean;
  cloudMode: CloudProviderMode;
  lastSyncedAt: string | null;
  summary: {
    totalDonors: number;
    availableDonors: number;
    totalUnits: number;
    pendingRequests: number;
    criticalGroups: BloodGroup[];
  };
  addDonor: (input: DonorInput) => ActionResult;
  updateDonor: (id: string, input: DonorInput) => ActionResult;
  deleteDonor: (id: string) => ActionResult;
  toggleDonorAvailability: (id: string) => void;
  adjustStock: (
    bloodGroup: BloodGroup,
    delta: number,
    reason?: string,
    type?: StockLogType
  ) => ActionResult;
  addRequest: (input: RequestInput) => ActionResult;
  approveRequest: (requestId: string) => ActionResult;
  rejectRequest: (requestId: string, reason?: string) => ActionResult;
  getMatchingAvailableDonors: (bloodGroup: BloodGroup) => Donor[];
  resetDemoData: () => void;
}

const BloodBankContext = createContext<BloodBankContextValue | undefined>(
  undefined
);

function createDefaultPayload(): BloodBankStatePayload {
  return {
    donors: INITIAL_DONORS,
    stock: { ...INITIAL_BLOOD_STOCK },
    stockLogs: INITIAL_STOCK_LOGS,
    requests: INITIAL_REQUESTS,
    updatedAt: new Date().toISOString(),
  };
}

export function BloodBankProvider({ children }: { children: React.ReactNode }) {
  const { user, permissions } = useAuth();
  const { showToast } = useToast();

  const [donors, setDonors] = useState<Donor[]>(INITIAL_DONORS);
  const [stock, setStock] = useState<BloodStockMap>({ ...INITIAL_BLOOD_STOCK });
  const [stockLogs, setStockLogs] = useState<StockLogEntry[]>(INITIAL_STOCK_LOGS);
  const [requests, setRequests] = useState<BloodRequest[]>(INITIAL_REQUESTS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [cloudMode, setCloudMode] = useState<CloudProviderMode>("local");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Initial load from LocalStorage and optional cloud health/sync check
  useEffect(() => {
    let active = true;

    async function hydrate() {
      let localLoaded = false;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<BloodBankStatePayload>;
          if (
            Array.isArray(parsed.donors) &&
            parsed.stock &&
            Array.isArray(parsed.requests)
          ) {
            if (active) {
              setDonors(parsed.donors);
              setStock(parsed.stock);
              setStockLogs(
                Array.isArray(parsed.stockLogs)
                  ? parsed.stockLogs
                  : INITIAL_STOCK_LOGS
              );
              setRequests(parsed.requests);
              setLastSyncedAt(parsed.updatedAt ?? null);
            }
            localLoaded = true;
          }
        }
      } catch {
        // Fallback to initial data
      }

      if (!localLoaded) {
        const defaults = createDefaultPayload();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        } catch {
          // Ignore quota errors
        }
      }

      // Check if optional Firebase / Neon.tech cloud backend is configured
      try {
        const healthRes = await fetch("/api/health", { cache: "no-store" });
        if (healthRes.ok && active) {
          const health = (await healthRes.json()) as {
            provider?: CloudProviderMode;
          };
          const provider = health.provider ?? "local";
          setCloudMode(provider);

          if (provider !== "local") {
            const syncRes = await fetch("/api/sync", { cache: "no-store" });
            if (syncRes.ok && active) {
              const syncData = (await syncRes.json()) as {
                synced?: boolean;
                data?: BloodBankStatePayload | null;
              };
              if (syncData.synced && syncData.data?.donors) {
                setDonors(syncData.data.donors);
                setStock(syncData.data.stock);
                setStockLogs(syncData.data.stockLogs ?? []);
                setRequests(syncData.data.requests);
                setLastSyncedAt(syncData.data.updatedAt);
                localStorage.setItem(
                  STORAGE_KEY,
                  JSON.stringify(syncData.data)
                );
              }
            }
          }
        }
      } catch {
        // Offline or local-only mode; silent fallback
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const persistState = useCallback(
    (next: Omit<BloodBankStatePayload, "updatedAt">) => {
      const payload: BloodBankStatePayload = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      setLastSyncedAt(payload.updatedAt);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore storage errors
      }

      if (cloudMode !== "local") {
        fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {
          // LocalStorage remains source of truth if remote sync fails transiently
        });
      }
    },
    [cloudMode]
  );

  const actorName = user ? `${user.name} (${user.role.toUpperCase()})` : "System";

  const addDonor = useCallback(
    (input: DonorInput): ActionResult => {
      const fullName = input.fullName.trim();
      const address = input.address.trim();
      const normalized = normalizePhone(input.phone);

      if (fullName.length < 3) {
        return { ok: false, error: "Full name must be at least 3 characters." };
      }
      if (!isValidBDPhone(input.phone)) {
        return {
          ok: false,
          error:
            "Enter a valid 11-digit Bangladeshi mobile number (e.g., 01711-234567).",
        };
      }
      if (address.length < 4) {
        return { ok: false, error: "Please enter a valid address/location." };
      }

      const duplicate = donors.find(
        (d) => normalizePhone(d.phone) === normalized
      );
      if (duplicate) {
        return {
          ok: false,
          error: `Duplicate phone number detected! Already registered to ${duplicate.fullName} (${duplicate.id}).`,
        };
      }

      const nextNum =
        donors.reduce((max, d) => {
          const n = parseInt(d.id.replace(/\D/g, ""), 10);
          return Number.isNaN(n) ? max : Math.max(max, n);
        }, 1000) + 1;

      const computedAvailable =
        input.availabilityMode === "auto"
          ? isEligibleBy90DayRule(input.lastDonationDate)
          : input.isAvailable;

      const newDonor: Donor = {
        id: `DNR-${nextNum}`,
        fullName,
        bloodGroup: input.bloodGroup,
        phone: formatPhoneDisplay(normalized),
        address,
        lastDonationDate: input.lastDonationDate,
        availabilityMode: input.availabilityMode,
        isAvailable: computedAvailable,
        notes: input.notes?.trim() || undefined,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      const nextDonors = [newDonor, ...donors];
      setDonors(nextDonors);
      persistState({ donors: nextDonors, stock, stockLogs, requests });
      showToast(
        "Donor Registered",
        `${newDonor.fullName} (${newDonor.bloodGroup}) added as ${newDonor.id}.`,
        "success"
      );
      return { ok: true };
    },
    [donors, persistState, requests, showToast, stock, stockLogs]
  );

  const updateDonor = useCallback(
    (id: string, input: DonorInput): ActionResult => {
      const fullName = input.fullName.trim();
      const address = input.address.trim();
      const normalized = normalizePhone(input.phone);

      if (fullName.length < 3) {
        return { ok: false, error: "Full name must be at least 3 characters." };
      }
      if (!isValidBDPhone(input.phone)) {
        return {
          ok: false,
          error:
            "Enter a valid 11-digit Bangladeshi mobile number (e.g., 01711-234567).",
        };
      }
      if (address.length < 4) {
        return { ok: false, error: "Please enter a valid address/location." };
      }

      const duplicate = donors.find(
        (d) => d.id !== id && normalizePhone(d.phone) === normalized
      );
      if (duplicate) {
        return {
          ok: false,
          error: `Phone number already belongs to ${duplicate.fullName} (${duplicate.id}).`,
        };
      }

      const computedAvailable =
        input.availabilityMode === "auto"
          ? isEligibleBy90DayRule(input.lastDonationDate)
          : input.isAvailable;

      const nextDonors = donors.map((d) =>
        d.id === id
          ? {
              ...d,
              fullName,
              bloodGroup: input.bloodGroup,
              phone: formatPhoneDisplay(normalized),
              address,
              lastDonationDate: input.lastDonationDate,
              availabilityMode: input.availabilityMode,
              isAvailable: computedAvailable,
              notes: input.notes?.trim() || undefined,
            }
          : d
      );

      setDonors(nextDonors);
      persistState({ donors: nextDonors, stock, stockLogs, requests });
      showToast("Donor Updated", `${fullName}'s profile has been updated.`, "success");
      return { ok: true };
    },
    [donors, persistState, requests, showToast, stock, stockLogs]
  );

  const deleteDonor = useCallback(
    (id: string): ActionResult => {
      if (!permissions.canDeleteDonor) {
        showToast(
          "Permission Denied",
          "Only Admin users can delete donor records.",
          "error"
        );
        return { ok: false, error: "Admin permission required." };
      }
      const target = donors.find((d) => d.id === id);
      if (!target) return { ok: false, error: "Donor not found." };

      const nextDonors = donors.filter((d) => d.id !== id);
      setDonors(nextDonors);
      persistState({ donors: nextDonors, stock, stockLogs, requests });
      showToast(
        "Donor Removed",
        `${target.fullName} (${target.id}) was deleted.`,
        "info"
      );
      return { ok: true };
    },
    [donors, permissions.canDeleteDonor, persistState, requests, showToast, stock, stockLogs]
  );

  const toggleDonorAvailability = useCallback(
    (id: string) => {
      const target = donors.find((d) => d.id === id);
      if (!target) return;

      const currentStatus = resolveDonorAvailability(target);
      const nextStatus = !currentStatus;

      const nextDonors = donors.map((d) =>
        d.id === id
          ? {
              ...d,
              isAvailable: nextStatus,
              availabilityMode: "manual" as AvailabilityMode,
            }
          : d
      );
      setDonors(nextDonors);
      persistState({ donors: nextDonors, stock, stockLogs, requests });
      showToast(
        "Availability Updated",
        `${target.fullName} marked as ${nextStatus ? "Available" : "Unavailable"}.`,
        "info"
      );
    },
    [donors, persistState, requests, showToast, stock, stockLogs]
  );

  const adjustStock = useCallback(
    (
      bloodGroup: BloodGroup,
      delta: number,
      reason?: string,
      type?: StockLogType
    ): ActionResult => {
      if (delta === 0) return { ok: true };

      const prevUnits = stock[bloodGroup] ?? 0;
      const newUnits = prevUnits + delta;

      if (newUnits < 0) {
        showToast(
          "Insufficient Stock",
          `Cannot deduct ${Math.abs(delta)} unit(s) of ${bloodGroup}. Only ${prevUnits} unit(s) available.`,
          "error"
        );
        return {
          ok: false,
          error: `Insufficient ${bloodGroup} stock (${prevUnits} units available).`,
        };
      }

      const nextStock: BloodStockMap = {
        ...stock,
        [bloodGroup]: newUnits,
      };

      const logEntry: StockLogEntry = {
        id: `LOG-${Date.now().toString().slice(-5)}`,
        bloodGroup,
        change: delta,
        previousUnits: prevUnits,
        newUnits,
        reason:
          reason?.trim() ||
          (delta > 0
            ? `Manual stock addition (+${delta} unit${delta > 1 ? "s" : ""})`
            : `Manual stock issuance (${delta} unit${Math.abs(delta) > 1 ? "s" : ""})`),
        type: type ?? (delta > 0 ? "addition" : "issuance"),
        performedBy: actorName,
        timestamp: new Date().toISOString(),
      };

      const nextLogs = [logEntry, ...stockLogs];
      setStock(nextStock);
      setStockLogs(nextLogs);
      persistState({ donors, stock: nextStock, stockLogs: nextLogs, requests });

      if (newUnits < 3 && delta < 0) {
        showToast(
          `Critical Stock Alert: ${bloodGroup}`,
          `${bloodGroup} dropped to ${newUnits} unit(s). Immediate replenishment needed.`,
          "warning"
        );
      } else {
        showToast(
          `Stock Updated (${bloodGroup})`,
          `${prevUnits} → ${newUnits} units`,
          "success"
        );
      }

      return { ok: true };
    },
    [actorName, donors, persistState, requests, showToast, stock, stockLogs]
  );

  const addRequest = useCallback(
    (input: RequestInput): ActionResult => {
      const patientName = input.patientName.trim();
      const hospital = input.hospital.trim();
      const normalized = normalizePhone(input.contactNumber);

      if (patientName.length < 3) {
        return { ok: false, error: "Patient name must be at least 3 characters." };
      }
      if (hospital.length < 3) {
        return { ok: false, error: "Hospital/location is required." };
      }
      if (!isValidBDPhone(input.contactNumber)) {
        return {
          ok: false,
          error:
            "Enter a valid 11-digit Bangladeshi contact number (e.g., 01715-889900).",
        };
      }
      if (input.unitsNeeded < 1 || input.unitsNeeded > 20) {
        return {
          ok: false,
          error: "Units needed must be between 1 and 20.",
        };
      }

      const nextNum =
        requests.reduce((max, r) => {
          const n = parseInt(r.id.replace(/\D/g, ""), 10);
          return Number.isNaN(n) ? max : Math.max(max, n);
        }, 2000) + 1;

      const newReq: BloodRequest = {
        id: `REQ-${nextNum}`,
        patientName,
        bloodGroup: input.bloodGroup,
        unitsNeeded: input.unitsNeeded,
        hospital,
        contactNumber: formatPhoneDisplay(normalized),
        urgency: input.urgency,
        requestDate: input.requestDate,
        status: "Pending",
        notes: input.notes?.trim() || undefined,
      };

      const nextRequests = [newReq, ...requests];
      setRequests(nextRequests);
      persistState({ donors, stock, stockLogs, requests: nextRequests });
      showToast(
        "Blood Request Logged",
        `${newReq.id} for ${newReq.patientName} (${newReq.bloodGroup}, ${newReq.unitsNeeded} unit${newReq.unitsNeeded > 1 ? "s" : ""}).`,
        newReq.urgency === "Emergency" ? "warning" : "success"
      );
      return { ok: true };
    },
    [donors, persistState, requests, showToast, stock, stockLogs]
  );

  const approveRequest = useCallback(
    (requestId: string): ActionResult => {
      if (!permissions.canProcessRequests) {
        return { ok: false, error: "Unauthorized action." };
      }

      const target = requests.find((r) => r.id === requestId);
      if (!target) return { ok: false, error: "Request not found." };
      if (target.status !== "Pending") {
        return { ok: false, error: "Only pending requests can be approved." };
      }

      const available = stock[target.bloodGroup] ?? 0;
      if (available < target.unitsNeeded) {
        showToast(
          "Insufficient Blood Stock",
          `Need ${target.unitsNeeded} unit(s) of ${target.bloodGroup}, but only ${available} available. Use 'Find Matching Donors' to source blood first.`,
          "error"
        );
        return {
          ok: false,
          error: `Insufficient ${target.bloodGroup} stock (${available} available, ${target.unitsNeeded} required).`,
        };
      }

      const newUnits = available - target.unitsNeeded;
      const nextStock: BloodStockMap = {
        ...stock,
        [target.bloodGroup]: newUnits,
      };

      const now = new Date().toISOString();
      const nextRequests = requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "Approved" as const,
              processedBy: actorName,
              processedAt: now,
            }
          : r
      );

      const logEntry: StockLogEntry = {
        id: `LOG-${Date.now().toString().slice(-5)}`,
        bloodGroup: target.bloodGroup,
        change: -target.unitsNeeded,
        previousUnits: available,
        newUnits,
        reason: `Issued for Request ${target.id} (${target.patientName} - ${target.hospital})`,
        type: "request_approved",
        performedBy: actorName,
        timestamp: now,
        relatedRequestId: target.id,
      };

      const nextLogs = [logEntry, ...stockLogs];
      setStock(nextStock);
      setRequests(nextRequests);
      setStockLogs(nextLogs);
      persistState({
        donors,
        stock: nextStock,
        stockLogs: nextLogs,
        requests: nextRequests,
      });

      showToast(
        "Request Approved & Blood Issued",
        `Deducted ${target.unitsNeeded} unit(s) of ${target.bloodGroup}. Remaining stock: ${newUnits}.`,
        newUnits < 3 ? "warning" : "success"
      );
      return { ok: true };
    },
    [
      actorName,
      donors,
      permissions.canProcessRequests,
      persistState,
      requests,
      showToast,
      stock,
      stockLogs,
    ]
  );

  const rejectRequest = useCallback(
    (requestId: string, reason?: string): ActionResult => {
      if (!permissions.canProcessRequests) {
        return { ok: false, error: "Unauthorized action." };
      }

      const target = requests.find((r) => r.id === requestId);
      if (!target) return { ok: false, error: "Request not found." };
      if (target.status !== "Pending") {
        return { ok: false, error: "Only pending requests can be rejected." };
      }

      const now = new Date().toISOString();
      const nextRequests = requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "Rejected" as const,
              processedBy: actorName,
              processedAt: now,
              notes: reason?.trim()
                ? `${r.notes ? `${r.notes} | ` : ""}Rejection Note: ${reason.trim()}`
                : r.notes,
            }
          : r
      );

      setRequests(nextRequests);
      persistState({ donors, stock, stockLogs, requests: nextRequests });
      showToast(
        "Request Rejected",
        `${target.id} for ${target.patientName} marked as Rejected.`,
        "info"
      );
      return { ok: true };
    },
    [
      actorName,
      donors,
      permissions.canProcessRequests,
      persistState,
      requests,
      showToast,
      stock,
      stockLogs,
    ]
  );

  const getMatchingAvailableDonors = useCallback(
    (bloodGroup: BloodGroup): Donor[] => {
      return donors.filter(
        (d) => d.bloodGroup === bloodGroup && resolveDonorAvailability(d)
      );
    },
    [donors]
  );

  const resetDemoData = useCallback(() => {
    const defaults = createDefaultPayload();
    setDonors(defaults.donors);
    setStock(defaults.stock);
    setStockLogs(defaults.stockLogs);
    setRequests(defaults.requests);
    persistState({
      donors: defaults.donors,
      stock: defaults.stock,
      stockLogs: defaults.stockLogs,
      requests: defaults.requests,
    });
    showToast(
      "Demo Data Restored",
      "All donors, stock units, requests, and logs have been reset to initial sample data.",
      "info"
    );
  }, [persistState, showToast]);

  const summary = useMemo(() => {
    const availableDonors = donors.filter((d) =>
      resolveDonorAvailability(d)
    ).length;
    const totalUnits = BLOOD_GROUPS.reduce(
      (sum, bg) => sum + (stock[bg] ?? 0),
      0
    );
    const pendingRequests = requests.filter(
      (r) => r.status === "Pending"
    ).length;
    const criticalGroups = BLOOD_GROUPS.filter((bg) => (stock[bg] ?? 0) < 3);

    return {
      totalDonors: donors.length,
      availableDonors,
      totalUnits,
      pendingRequests,
      criticalGroups,
    };
  }, [donors, requests, stock]);

  return (
    <BloodBankContext.Provider
      value={{
        donors,
        stock,
        stockLogs,
        requests,
        isHydrated,
        cloudMode,
        lastSyncedAt,
        summary,
        addDonor,
        updateDonor,
        deleteDonor,
        toggleDonorAvailability,
        adjustStock,
        addRequest,
        approveRequest,
        rejectRequest,
        getMatchingAvailableDonors,
        resetDemoData,
      }}
    >
      {children}
    </BloodBankContext.Provider>
  );
}

export function useBloodBank() {
  const ctx = useContext(BloodBankContext);
  if (!ctx) {
    throw new Error("useBloodBank must be used within a BloodBankProvider");
  }
  return ctx;
}
