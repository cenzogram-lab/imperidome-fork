// Local wrapper around @caffeineai/core-infrastructure's useActor hook.
// Binds the project's generated createActor function so callers don't need to pass it.
import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

// Re-export a zero-argument useActor that is pre-wired to the backend canister.
// All pages in this project import from this file.
export function useActor() {
  return _useActor(createActor);
}
