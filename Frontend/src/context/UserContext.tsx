import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = {
  firstName: string;
  lastName: string;
  avatarDataUrl?: string; // base64 data url preview
};

type UserContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  updateUser: (u: Partial<User>) => void;
};

const Ctx = createContext<UserContextType | undefined>(undefined);

const KEY = "globetrotter.user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user));
      else localStorage.removeItem(KEY);
    } catch {}
  }, [user]);

  const value = useMemo<UserContextType>(
    () => ({
      user,
      setUser,
      updateUser: (u) => setUser((prev) => (prev ? { ...prev, ...u } : { firstName: "", lastName: "", ...u } as User)),
    }),
    [user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
