"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface Customer {
  firstName: string;
  lastName: string;
  email: string;
}

interface AccountContextType {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  accessToken: string | null;
}

const AccountContext = createContext<AccountContextType | null>(null);

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}

const TOKEN_KEY = "brow-atelier-customer-token";

export function AccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) return;

    setAccessToken(saved);
    fetch(`/api/account?action=me&token=${encodeURIComponent(saved)}`)
      .then((res) => res.json())
      .then(({ customer: c }) => {
        if (c) setCustomer(c);
        else {
          localStorage.removeItem(TOKEN_KEY);
          setAccessToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAccessToken(null);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { accessToken: token, customer: c } = data;
      setAccessToken(token);
      setCustomer(c);
      localStorage.setItem(TOKEN_KEY, token);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", email, password, firstName, lastName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { accessToken: token, customer: c } = data;
      setAccessToken(token);
      setCustomer(c);
      localStorage.setItem(TOKEN_KEY, token);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCustomer(null);
    setAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AccountContext.Provider value={{ customer, loading, login, register, logout, accessToken }}>
      {children}
    </AccountContext.Provider>
  );
}
