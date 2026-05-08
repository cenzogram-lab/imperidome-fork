import { create } from "zustand";
import { getSession } from "../hooks/useSession";

const EDIT_MODE_KEY = "imperidome_edit_mode_enabled";
const SUPER_ADMIN_EMAIL = "vincenzo@imperidome.com";
const BROADCAST_CHANNEL_NAME = "sitetext-invalidate";
const PERIODIC_REFETCH_INTERVAL_MS = 30_000;

function readPersistedEditMode(): boolean {
  try {
    const session = getSession();
    if (session?.email !== SUPER_ADMIN_EMAIL) return false;
    return localStorage.getItem(EDIT_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

// Module-level actor ref — set whenever fetchAllSiteText is called so the
// BroadcastChannel listener and the periodic re-fetch timer can re-invoke it
// without needing a React hook.
let _actorRef: {
  getAllSiteText: () => Promise<Array<[string, string]>>;
} | null = null;

let _broadcastChannel: BroadcastChannel | null = null;
let _periodicTimer: ReturnType<typeof setInterval> | null = null;

function ensureBroadcastChannel() {
  if (_broadcastChannel) return;
  try {
    _broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    _broadcastChannel.onmessage = () => {
      // Another window saved — re-fetch to stay in sync
      if (_actorRef) {
        useSiteTextStore.getState().fetchAllSiteText(_actorRef);
      }
    };
  } catch {
    // BroadcastChannel not supported in this environment — skip silently
  }
}

function ensurePeriodicRefetch() {
  if (_periodicTimer) return;
  _periodicTimer = setInterval(() => {
    if (_actorRef) {
      useSiteTextStore.getState().fetchAllSiteText(_actorRef);
    }
  }, PERIODIC_REFETCH_INTERVAL_MS);
}

/** Call after a successful updateSiteText to notify all other open windows. */
export function broadcastSiteTextInvalidation() {
  try {
    // Use a one-shot channel for sending so we don't trigger our own listener
    const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    ch.postMessage({ type: "invalidate" });
    ch.close();
  } catch {
    // BroadcastChannel not available — no-op
  }
}

interface SiteTextStore {
  textMap: Record<string, string>;
  editMode: boolean;
  isLoading: boolean;
  setEditMode: (val: boolean) => void;
  setTextMap: (map: Record<string, string>) => void;
  updateText: (key: string, value: string) => void;
  getText: (key: string, defaultValue: string) => string;
  fetchAllSiteText: (actor: {
    getAllSiteText: () => Promise<Array<[string, string]>>;
  }) => Promise<void>;
}

export const useSiteTextStore = create<SiteTextStore>((set, get) => ({
  textMap: {},
  editMode: readPersistedEditMode(),
  isLoading: false,

  setEditMode: (val) => {
    try {
      localStorage.setItem(EDIT_MODE_KEY, val ? "true" : "false");
    } catch {
      // localStorage unavailable — continue without persistence
    }
    set({ editMode: val });
  },

  setTextMap: (map) => set({ textMap: map }),

  updateText: (key, value) =>
    set((state) => ({
      textMap: { ...state.textMap, [key]: value },
    })),

  getText: (key, defaultValue) => {
    const stored = get().textMap[key];
    return stored !== undefined && stored !== "" ? stored : defaultValue;
  },

  fetchAllSiteText: async (actor) => {
    // Save actor ref for use by BroadcastChannel listener and periodic timer
    _actorRef = actor;

    // Start cross-window sync and periodic re-fetch on first call
    ensureBroadcastChannel();
    ensurePeriodicRefetch();

    set({ isLoading: true });
    try {
      const entries = await actor.getAllSiteText();
      const map: Record<string, string> = {};
      for (const [k, v] of entries) {
        map[k] = v;
      }
      set({ textMap: map });
    } catch (err) {
      console.error("[useSiteTextStore] fetchAllSiteText failed:", err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
