import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { useActor } from "./useActor";

const STORAGE_KEY = "imperidome_referral_code";
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

interface StoredReferral {
  code: string;
  expires: number;
}

function getStoredReferral(): StoredReferral | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredReferral;
  } catch {
    return null;
  }
}

function isExpired(stored: StoredReferral): boolean {
  return Date.now() > stored.expires;
}

/**
 * Runs on every route change (mount of a top-level component) to:
 * 1. Evict expired referral codes from localStorage.
 * 2. Capture a new ?ref=CODE from the URL if none is stored.
 * 3. Call actor.trackReferralClick(code) only on first detection.
 */
export function useReferralTracker(): void {
  const { actor } = useActor();

  useEffect(() => {
    // Step 1 — evict expired code
    const stored = getStoredReferral();
    if (stored && isExpired(stored)) {
      localStorage.removeItem(STORAGE_KEY);
    }

    // Step 2 — check for ?ref=CODE in the current URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (!code) return;

    // Step 3 — only store + track if no valid code is currently saved
    const existing = getStoredReferral();
    if (existing && !isExpired(existing)) return; // already tracked from a prior visit

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ code, expires: Date.now() + TTL_MS }),
    );

    // Fire-and-forget click tracking — fail silently
    if (actor) {
      (actor as backendInterface).trackReferralClick(code).catch(() => {});
    }
  }, [actor]); // re-runs when actor becomes available; URL is read fresh each time
}
