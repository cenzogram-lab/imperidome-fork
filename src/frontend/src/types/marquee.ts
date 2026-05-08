/**
 * Marquee logo types — re-exports MarqueeLogo from the generated backend
 * bindings and provides a MarqueeBackend alias pointing at backendInterface.
 * Import from this file instead of writing inline types in consuming components.
 */

export type { MarqueeLogo } from "../backend";
export type { backendInterface as MarqueeBackend } from "../backend";
