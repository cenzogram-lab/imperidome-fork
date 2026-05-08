import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";

const POLL_INTERVAL_MS = 30_000;

function isDownError(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes("ic0508") ||
    msg.includes("stopped") ||
    msg.includes("canister")
  );
}

export default function CanaryBanner() {
  const [isDown, setIsDown] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const actor = await createActorWithConfig(createActor);
      await (actor as backendInterface).getPublishedBlogPosts();
      setIsDown(false);
    } catch (err) {
      if (isDownError(err) || err instanceof Error) {
        setIsDown(true);
      }
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkHealth]);

  if (!isDown) return null;

  return (
    <div
      data-ocid="canary.banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#FEF3C7",
        color: "#92400E",
        padding: "10px 16px",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <AlertTriangle size={16} color="#D97706" />
      <span>
        Service temporarily unavailable. Please try again in a few minutes.
      </span>
    </div>
  );
}
