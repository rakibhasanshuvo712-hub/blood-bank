"use client";

import React from "react";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { BloodBankProvider } from "@/context/BloodBankContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <BloodBankProvider>{children}</BloodBankProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
