const _resolvedCanisterId = (() => {
  // import.meta.env.* is the correct way to read Vite-injected env vars in browser bundles.
  // process.env.* fallbacks are kept for SSR/Node contexts.
  const id =
    (import.meta.env.VITE_CANISTER_ID_BACKEND as string) ||
    (import.meta.env.CANISTER_ID_BACKEND as string) ||
    (typeof process !== 'undefined' ? process.env.CANISTER_ID_BACKEND : '') ||
    (typeof process !== 'undefined' ? process.env.VITE_CANISTER_ID_BACKEND : '') ||
    "";
  if (!id) {
    console.error(
      "ERROR: VITE_CANISTER_ID_BACKEND is not set. " +
        "The backend actor cannot be initialised. " +
        "Ensure the platform build injects CANISTER_ID_BACKEND via vite.config.js.",
    );
  }
  return id;
})();

export const BACKEND_CANISTER_ID = _resolvedCanisterId;

export const loadConfig = async () => {
  try {
    const response = await fetch("/env.json");
    if (!response.ok) return BACKEND_CANISTER_ID;
    const config = await response.json();
    const runtimeId =
      (config.backend_canister_id && config.backend_canister_id !== "undefined"
        ? config.backend_canister_id
        : null) ||
      (config.CANISTER_ID_BACKEND && config.CANISTER_ID_BACKEND !== "undefined"
        ? config.CANISTER_ID_BACKEND
        : null);
    return runtimeId || BACKEND_CANISTER_ID;
  } catch {
    return BACKEND_CANISTER_ID;
  }
};

// Re-export createActorWithConfig from the infrastructure package so that
// CanaryBanner and any other components that import from '../config' continue
// to work without changes.
export { createActorWithConfig } from "@caffeineai/core-infrastructure";

export const canisterId = BACKEND_CANISTER_ID;
