import axios from 'axios';

// Accept both VITE_APP_API_BASE and legacy VITE_API_BASE
const baseURL = import.meta.env.VITE_APP_API_BASE || import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// ---- Auth Refresh / 401 Handling ----
let isRefreshing = false;
// Waiters are simple callbacks with no arguments (we only signal completion/failure)
let waiters: Array<{resolve: () => void; reject: () => void}> = [];

function notifyAll(err?: any) {
  if (err) {
    waiters.forEach(w => w.reject());
  } else {
    waiters.forEach(w => w.resolve());
  }
  waiters = [];
}

api.interceptors.response.use(r => r, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && !original._retry) {
    original._retry = true;
    try {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await api.post('/auth/refresh');
          notifyAll();
        } catch (e) {
          notifyAll(e);
          throw e;
        } finally { isRefreshing = false; }
      } else {
        await new Promise<void>((resolve, reject) => waiters.push({ resolve, reject }));
      }
      return api(original);
    } catch (e) {
      // final failure -> broadcast logout event so contexts can react
      window.dispatchEvent(new CustomEvent('auth:logout'));
      // Redirect to homepage globally on auth failure (session missing/expired)
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.replace('/');
      }
      throw e;
    }
  }
  if (error.response?.status === 401 || error.response?.status === 403) {
    // Ensure logout broadcast even if we already tried refresh (idempotent)
    window.dispatchEvent(new CustomEvent('auth:logout'));
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.replace('/');
    }
  }
  return Promise.reject(error);
});

// Helper to fetch auth status (used in context bootstrap / profile)
export async function getAuthStatus() {
  const { data } = await api.get('/auth/status');
  return data; // { authenticated: boolean, user?: { id, email, mfaActive } }
}

// Auth endpoints
export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(payload: { email: string; password: string; first_name: string; last_name: string; phone: string; city: string; country: string; additional_info: string; photo_url: string; }) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function getTrips() {
  const { data } = await api.get('/trips');
  return data;
}

export async function createTrip(payload: any) {
  const { data } = await api.post('/trips', payload);
  return data;
}

export async function getTrip(tripId: number | string) {
  const { data } = await api.get(`/trips/${tripId}`);
  return data;
}

export async function getItinerary(tripId: number | string) {
  const { data } = await api.get(`/trips/${tripId}/itinerary`);
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    // Fire event regardless so UI clears stale user state if server already expired session
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
}

// Simple helper for safe API with mock fallback
export async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch (e) {
    if (import.meta.env.VITE_ENABLE_MOCKS === 'true') return fallback;
    throw e;
  }
}
