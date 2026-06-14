import { useState } from "react";

export interface ImperidomeSession {
  email: string;
  firstName: string;
  role: string;
}

const TOKEN_KEY = "imperidome_token";
const OLD_SESSION_KEY = "imperidome_session";
const ADMIN_EMAIL_KEY = "imperidome_admin_email";

/** Pass through session data as-is; role is determined entirely by the backend. */
function normalizeAdminSession(data: ImperidomeSession): ImperidomeSession {
  return data;
}

const ADMIN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const CLIENT_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours

interface StoredToken {
  token: string;
  expiry: number;
}

/** One-time migration: move old localStorage session → new sessionStorage format */
function migrateOldSession(): void {
  try {
    const old = localStorage.getItem(OLD_SESSION_KEY);
    if (!old) return;
    const data = JSON.parse(old) as ImperidomeSession;
    // Only migrate if no new token already exists
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      const expiryMs = (data.role ?? "").includes("admin")
        ? ADMIN_EXPIRY_MS
        : CLIENT_EXPIRY_MS;
      const stored: StoredToken = {
        token: JSON.stringify(data),
        expiry: Date.now() + expiryMs,
      };
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
      // Persist email for cross-tab fallback
      if ((data.role ?? "").includes("admin") && data.email) {
        localStorage.setItem(ADMIN_EMAIL_KEY, data.email);
      }
    }
    localStorage.removeItem(OLD_SESSION_KEY);
  } catch {
    // Ignore migration errors — not fatal
  }
}

// Run migration once on module load
migrateOldSession();

export function getSession(): ImperidomeSession | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredToken;
    if (Date.now() > stored.expiry) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return JSON.parse(stored.token) as ImperidomeSession;
  } catch {
    return null;
  }
}

export function saveSession(data: ImperidomeSession): void {
  const normalized = normalizeAdminSession(data);
  const expiryMs = (normalized.role ?? "").includes("admin")
    ? ADMIN_EXPIRY_MS
    : CLIENT_EXPIRY_MS;
  const stored: StoredToken = {
    token: JSON.stringify(normalized),
    expiry: Date.now() + expiryMs,
  };
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
  // Persist email to localStorage so getAdminEmail() works across tabs
  if ((normalized.role ?? "").includes("admin") && normalized.email) {
    localStorage.setItem(ADMIN_EMAIL_KEY, normalized.email);
  }
}

export function clearSessionStorage(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  // AUDIT-010: purge admin email from localStorage so it does not persist on shared devices
  localStorage.removeItem(ADMIN_EMAIL_KEY);
}

export function useSession() {
  const [session, setSessionState] = useState<ImperidomeSession | null>(() =>
    getSession(),
  );

  function setSession(data: ImperidomeSession) {
    saveSession(data);
    setSessionState(data);
  }

  function clearSession() {
    clearSessionStorage();
    setSessionState(null);
  }

  return { session, setSession, clearSession };
}
