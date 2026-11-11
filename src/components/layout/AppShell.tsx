"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Boxes,
  ClipboardList,
  Droplet,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Database,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBloodBank } from "@/context/BloodBankContext";
import { useToast } from "@/context/ToastContext";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/donors", label: "Donor Registry", icon: Users },
  { href: "/inventory", label: "Blood Inventory", icon: Boxes },
  { href: "/requests", label: "Blood Requests", icon: ClipboardList },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout, permissions } = useAuth();
  const { summary, cloudMode, resetDemoData } = useBloodBank();
  const { showToast } = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && user && pathname === "/login") {
      router.replace("/");
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Droplet className="h-10 w-10 text-crimson-600 animate-pulse fill-crimson-600" />
          <p className="text-sm font-medium text-slate-600">
            Initializing Blood Bank Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!user || pathname === "/login") {
    return <LoginScreen />;
  }

  const currentNav =
    NAV_ITEMS.find((item) => item.href === pathname) ?? NAV_ITEMS[0];

  const handleResetConfirm = () => {
    if (!permissions.canResetData) {
      showToast(
        "Admin Permission Required",
        "Switch to the Admin account to reset demo data.",
        "error"
      );
      setResetModalOpen(false);
      return;
    }
    resetDemoData();
    setResetModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    showToast("Signed Out", "You have been logged out safely.", "info");
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 transition-all duration-200 lg:static lg:translate-x-0",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-crimson-600 text-white shadow-sm">
              <Droplet className="h-5 w-5 fill-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-white truncate">
                  LifePulse BBMS
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  Bangladesh Blood Bank
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const badgeCount =
              item.href === "/requests" && summary.pendingRequests > 0
                ? summary.pendingRequests
                : item.href === "/inventory" && summary.criticalGroups.length > 0
                  ? summary.criticalGroups.length
                  : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-crimson-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
                  collapsed && "lg:justify-center lg:px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!collapsed && badgeCount !== null && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      active
                        ? "bg-white/20 text-white"
                        : item.href === "/inventory"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-sky-500/20 text-sky-300"
                    )}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Storage Mode + Reset Demo Data */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {!collapsed && (
            <div className="rounded-xl bg-slate-800/70 px-3 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {cloudMode === "local"
                    ? "LocalStorage (Zero-Config)"
                    : cloudMode === "firebase"
                      ? "Hybrid + Firebase Sync"
                      : "Hybrid + Neon.tech Sync"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                All CRUD edits auto-saved locally.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            title="Reset Demo Data"
            className={cn(
              "w-full flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-colors",
              collapsed && "lg:justify-center lg:px-2"
            )}
          >
            <RotateCcw className="h-4 w-4 shrink-0 text-amber-400" />
            {!collapsed && <span>Reset Demo Data</span>}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className={cn(
              "w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-red-950/60 hover:text-red-200 transition-colors",
              collapsed && "lg:justify-center lg:px-2"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {currentNav.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {summary.criticalGroups.length > 0 && (
              <Link
                href="/inventory"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <span>
                  {summary.criticalGroups.length} Critical Stock
                  {summary.criticalGroups.length > 1 ? "s" : ""} (
                  {summary.criticalGroups.join(", ")})
                </span>
              </Link>
            )}

            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 pl-3 pr-1.5 py-1">
              <div className="hidden md:block text-right">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {user.title}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                  user.role === "admin"
                    ? "bg-crimson-600 text-white"
                    : "bg-sky-600 text-white"
                )}
              >
                {user.role === "admin" ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5" />
                )}
                {user.role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Reset Demo Data Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Restore Initial Demo Data?"
        subtitle="Reset all donors, stock counts, requests, and activity logs."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
            This will overwrite your current browser LocalStorage state with the
            default 18 Bangladeshi donors, 8 blood group stock levels, and 8
            sample hospital blood requests.
          </div>
          {!permissions.canResetData && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              Note: You are currently signed in as <strong>Staff</strong>. Only{" "}
              <strong>Admin</strong> accounts can reset demo data.
            </div>
          )}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetConfirm}
              disabled={!permissions.canResetData}
              className="rounded-xl bg-crimson-600 px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Restore Demo Data
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
