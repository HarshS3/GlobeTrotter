import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarDataUrl?: string; // photo url or data url
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

  // load persisted snapshot & then hydrate from server status
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    let cancelled = false;
    import('@/lib/api').then(({ getAuthStatus }) => {
      getAuthStatus().then(status => {
        if (cancelled) return;
        if (status.authenticated && status.user) {
          setUser(u => ({
            id: status.user.id,
            email: status.user.email,
            firstName: u?.firstName || '',
            lastName: u?.lastName || '',
            avatarDataUrl: u?.avatarDataUrl
          }));
        } else if (!status.authenticated) {
          setUser(null);
          // On initial bootstrap, if user is on a protected page without auth, redirect home
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            window.location.replace('/');
          }
        }
      }).catch(() => {/* ignore */});
    });
    const onLogout = () => {
      setUser(null);
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.replace('/');
      }
    };
    window.addEventListener('auth:logout', onLogout);
    return () => { cancelled = true; window.removeEventListener('auth:logout', onLogout); };
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
  updateUser: (u) => setUser((prev) => (prev ? { ...prev, ...u } : { id: 0, email: '', firstName: '', lastName: '', ...u } as User)),
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
