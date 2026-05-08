import { useActor } from "@/hooks/useActor";
import { getSession } from "@/hooks/useSession";
import { Bell, CreditCard, FileText, Share2, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AdminNotification as BackendAdminNotification,
  backendInterface,
} from "../backend";

// Local shape that adds the `type` field used for icon display
interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: bigint;
  read: boolean;
}
// BackendAdminNotification is imported for module-level type safety
void (null as unknown as BackendAdminNotification);

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const NEON = "#39FF14";
const TEXT = "#EEF0F8";
const MUTED = "#7A7D90";

const PANEL_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  width: 340,
  maxHeight: 480,
  background: "rgba(10,10,12,0.95)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(57,255,20,0.18)",
  borderRadius: 12,
  boxShadow:
    "0 0 0 1px rgba(57,255,20,0.08), 0 8px 32px rgba(0,0,0,0.7), 0 24px 64px rgba(0,0,0,0.5)",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(ts: bigint): string {
  const msNow = Date.now();
  const msThen = Number(ts / 1_000_000n);
  const diffSec = Math.floor((msNow - msThen) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  const size = 15;
  switch (type) {
    case "signup":
      return <UserPlus size={size} color={NEON} />;
    case "lead":
      return <FileText size={size} color="#60a5fa" />;
    case "payment":
      return <CreditCard size={size} color="#34d399" />;
    case "referral":
      return <Share2 size={size} color="#a78bfa" />;
    default:
      return <Bell size={size} color={MUTED} />;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NotificationBell() {
  const { actor, isFetching } = useActor();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!actor) return;
    try {
      const data = (await (actor as backendInterface).getAdminNotifications(
        getAdminEmail(),
      )) as unknown as AdminNotification[];
      setNotifications(data);
    } catch {
      // silently fail — bell should not block the dashboard
    }
  }, [actor]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!actor || isFetching) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [actor, isFetching, fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleMarkRead(id: string) {
    if (!actor) return;
    try {
      await (actor as backendInterface).markNotificationRead(
        getAdminEmail(),
        id,
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // silent
    }
  }

  async function handleMarkAllRead() {
    if (!actor) return;
    try {
      await (actor as backendInterface).markAllNotificationsRead(
        getAdminEmail(),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      // Show success toast for 3 seconds
      setToastVisible(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000);
    } catch {
      // silent
    }
  }

  return (
    <div
      ref={panelRef}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {/* ── Bell trigger button ── */}
      <button
        type="button"
        data-ocid="admin.notifications.bell"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "relative",
          background: open ? "rgba(57,255,20,0.10)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(57,255,20,0.35)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 8,
          width: 38,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.2s, border-color 0.2s",
          flexShrink: 0,
        }}
      >
        <Bell size={17} color={open ? NEON : TEXT} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            data-ocid="admin.notifications.badge"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              minWidth: 17,
              height: 17,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
              boxShadow: "0 0 6px rgba(239,68,68,0.7)",
              pointerEvents: "none",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div style={PANEL_STYLE} data-ocid="admin.notifications.panel">
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              flexShrink: 0,
            }}
          >
            <span style={{ color: TEXT, fontWeight: 700, fontSize: 14 }}>
              Notifications
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  data-ocid="admin.notifications.mark_all_read"
                  onClick={handleMarkAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: NEON,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: 4,
                    opacity: 0.85,
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                  opacity: 0.5,
                }}
              >
                <X size={14} color={TEXT} />
              </button>
            </div>
          </div>

          {/* Success toast */}
          {toastVisible && (
            <div
              data-ocid="admin.notifications.success_state"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                background: "rgba(57,255,20,0.10)",
                borderBottom: "1px solid rgba(57,255,20,0.18)",
                flexShrink: 0,
              }}
            >
              <span style={{ color: NEON, fontSize: 13, fontWeight: 600 }}>
                ✓ All notifications cleared
              </span>
            </div>
          )}

          {/* Notification list */}
          <div
            data-ocid="admin.notifications.list"
            style={{ overflowY: "auto", flex: 1 }}
          >
            {notifications.length === 0 ? (
              <div
                data-ocid="admin.notifications.empty_state"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 20px",
                  gap: 10,
                }}
              >
                <Bell size={28} color="rgba(255,255,255,0.12)" />
                <p
                  style={{
                    color: MUTED,
                    fontSize: 13,
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notif, idx) => {
                const isLast = idx === notifications.length - 1;
                return (
                  <button
                    type="button"
                    key={notif.id}
                    data-ocid={`admin.notifications.item.${idx + 1}`}
                    onClick={() => handleMarkRead(notif.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      width: "100%",
                      padding: "13px 16px",
                      background: notif.read
                        ? "transparent"
                        : "rgba(57,255,20,0.04)",
                      borderLeft: notif.read
                        ? "3px solid transparent"
                        : `3px solid ${NEON}`,
                      borderRight: "none",
                      borderTop: "none",
                      borderBottom: isLast
                        ? "none"
                        : "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        background: "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <NotifIcon type={notif.type} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: notif.read ? MUTED : TEXT,
                          fontSize: 13,
                          fontWeight: notif.read ? 500 : 700,
                          margin: 0,
                          lineHeight: 1.35,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {notif.title}
                      </p>
                      <p
                        style={{
                          color: MUTED,
                          fontSize: 12,
                          margin: "3px 0 0",
                          lineHeight: 1.4,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <span
                      style={{
                        color: MUTED,
                        fontSize: 11,
                        flexShrink: 0,
                        paddingTop: 2,
                        opacity: 0.7,
                      }}
                    >
                      {relativeTime(notif.timestamp)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
