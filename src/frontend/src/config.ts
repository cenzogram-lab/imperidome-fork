// Hardcoded canister ID fallback — ensures the actor always initialises
// even when env.json or process.env.CANISTER_ID_BACKEND are missing.
export const PRODUCTION_CANISTER_ID = "jqylk-byaaa-aaaal-qbymq-cai";

const _resolvedCanisterId =
  process.env.CANISTER_ID_BACKEND ||
  process.env.VITE_CANISTER_ID_BACKEND ||
  (() => {
    console.warn(
      "WARNING: Using hardcoded production canister ID. " +
        "Set VITE_CANISTER_ID_BACKEND in your environment to avoid " +
        "connecting to the wrong canister in forks or staging environments.",
    );
    return PRODUCTION_CANISTER_ID;
  })();

export const BACKEND_CANISTER_ID = _resolvedCanisterId;

export const loadConfig = async () => {
  try {
    const response = await fetch("/env.json");
    if (!response.ok) return BACKEND_CANISTER_ID;
    const config = await response.json();
    return config.CANISTER_ID_BACKEND &&
      config.CANISTER_ID_BACKEND !== "undefined"
      ? config.CANISTER_ID_BACKEND
      : BACKEND_CANISTER_ID;
  } catch {
    return BACKEND_CANISTER_ID;
  }
};

// Re-export createActorWithConfig from the infrastructure package so that
// CanaryBanner and any other components that import from '../config' continue
// to work without changes.
export { createActorWithConfig } from "@caffeineai/core-infrastructure";

export const canisterId = BACKEND_CANISTER_ID;
