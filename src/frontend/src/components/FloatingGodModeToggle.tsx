/**
 * FloatingGodModeToggle — Persistent floating pencil button.
 *
 * Visible only when logged in as the Super Admin (vincenzo@imperidome.com).
 * Toggles Edit Site Text mode ON/OFF from any page without going to the dashboard.
 */

import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";
import { getSession } from "../hooks/useSession";
import { useSiteTextStore } from "../store/useSiteTextStore";

const SUPER_ADMIN_EMAIL = "vincenzo@imperidome.com";
const NEON = "#39FF14";

function getSessionEmail(): string | null {
  return getSession()?.email ?? null;
}

export function FloatingGodModeToggle() {
  const editMode = useSiteTextStore((s) => s.editMode);
  const setEditMode = useSiteTextStore((s) => s.setEditMode);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { actor, isFetching } = useActor();

  // Re-check session on mount and whenever storage changes (login/logout)
  useEffect(() => {
    function check() {
      setIsSuperAdmin(getSessionEmail() === SUPER_ADMIN_EMAIL);
    }
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  // Bug 5: Sync edit mode from backend when tab becomes visible/focused
  // so a second browser tab reflects the live state
  useEffect(() => {
    if (!isSuperAdmin) return;

    const syncFromBackend = async () => {
      if (!actor || isFetching) return;
      try {
        const backendActor = actor as unknown as {
          getEditMode?: () => Promise<boolean>;
          getSiteEditMode?: () => Promise<boolean>;
        };
        // Try known backend method names for retrieving edit mode
        if (typeof backendActor.getEditMode === "function") {
          const liveMode = await backendActor.getEditMode();
          setEditMode(liveMode);
        } else if (typeof backendActor.getSiteEditMode === "function") {
          const liveMode = await backendActor.getSiteEditMode();
          setEditMode(liveMode);
        }
        // If neither method exists on the backend, leave local state as-is
        // (backend may not persist edit mode — it's an admin-only UI state)
      } catch {
        // Silent — sync failure should not disrupt the UI
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncFromBackend();
      }
    };

    const handleFocus = () => {
      syncFromBackend();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isSuperAdmin, actor, isFetching, setEditMode]);

  if (!isSuperAdmin) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9998,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            whiteSpace: "nowrap",
            backgroundColor: "#0a0a0a",
            border: `1px solid ${editMode ? NEON : "#374151"}`,
            borderRadius: "6px",
            padding: "5px 10px",
            fontSize: "12px",
            fontWeight: 600,
            color: editMode ? NEON : "#9CA3AF",
            letterSpacing: "0.04em",
            pointerEvents: "none",
            boxShadow: editMode
              ? "0 0 10px rgba(57,255,20,0.25)"
              : "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          Edit Mode: {editMode ? "ON" : "OFF"}
        </div>
      )}

      {/* Button */}
      <button
        type="button"
        data-ocid="floating.god-mode-toggle"
        aria-label={`Toggle Edit Mode — currently ${editMode ? "ON" : "OFF"}`}
        onClick={() => setEditMode(!editMode)}
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: `1.5px solid ${editMode ? NEON : "#374151"}`,
          backgroundColor: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
          boxShadow: editMode
            ? "0 0 8px rgba(57,255,20,0.5), 0 0 24px rgba(57,255,20,0.2)"
            : "0 2px 12px rgba(0,0,0,0.5)",
          color: editMode ? NEON : "#6B7280",
          transform: "scale(1)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        ✏️
      </button>
    </div>
  );
}

export default FloatingGodModeToggle;
