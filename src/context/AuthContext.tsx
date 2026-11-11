"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AuthUser, UserRole } from "@/types";

interface DemoAccount {
  email: string;
  password: string;
  user: AuthUser;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "admin@bloodbank.com",
    password: "admin123",
    user: {
      id: "USR-ADMIN",
      name: "Dr. Ayesha Siddiqua",
      email: "admin@bloodbank.com",
      role: "admin",
      title: "Chief Medical Officer",
    },
  },
  {
    email: "staff@bloodbank.com",
    password: "staff123",
    user: {
      id: "USR-STAFF",
      name: "Md. Karim Hossain",
      email: "staff@bloodbank.com",
      role: "staff",
      title: "Blood Bank Coordinator",
    },
  },
];

const AUTH_STORAGE_KEY = "bbms_auth_user_v1";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => { ok: boolean; error?: string; user?: AuthUser };
  loginAsRole: (role: UserRole) => AuthUser;
  logout: () => void;
  permissions: {
    canDeleteDonor: boolean;
    canResetData: boolean;
    canManageStock: boolean;
    canProcessRequests: boolean;
    canEditDonors: boolean;
  };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthUser;
        if (parsed && parsed.email && parsed.role) {
          setUser(parsed);
        }
      }
    } catch {
      // Ignore corrupt auth storage
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    try {
      if (nextUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota issues
    }
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const match = DEMO_ACCOUNTS.find(
        (acc) =>
          acc.email.toLowerCase() === normalizedEmail &&
          acc.password === password
      );
      if (!match) {
        return {
          ok: false,
          error:
            "Invalid email or password. Use the demo credentials provided below.",
        };
      }
      persistUser(match.user);
      return { ok: true, user: match.user };
    },
    [persistUser]
  );

  const loginAsRole = useCallback(
    (role: UserRole) => {
      const account =
        DEMO_ACCOUNTS.find((a) => a.user.role === role) ?? DEMO_ACCOUNTS[0];
      persistUser(account.user);
      return account.user;
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    persistUser(null);
  }, [persistUser]);

  const isAdmin = user?.role === "admin";
  const permissions = {
    canDeleteDonor: isAdmin,
    canResetData: isAdmin,
    canManageStock: Boolean(user),
    canProcessRequests: Boolean(user),
    canEditDonors: Boolean(user),
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginAsRole,
        logout,
        permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
