import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart2,
  Bell,
  CheckCircle,
  ClipboardList,
  DollarSign,
  FileText,
  Globe,
  Mail,
  RefreshCw,
  Repeat,
  ShoppingBag,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { backendInterface } from "../../backend.d";
import type {
  DashboardMetrics,
  Order,
  PendingNotification,
  Subscription,
} from "../../backend.d";
import NotificationBell from "../../components/NotificationBell";
import { ADMIN_EMAIL_KEY } from "../../constants";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout, { useAdminPendingRefresh } from "./AdminLayout";

// ─── VAPID Helper ─────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ─── Shared Styles ──────────────────────────────────────────────────────────
const DARK_CARD: CSSProperties = {
  background: "rgba(30,41,59,0.85)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(148,163,184,0.15)",
  borderRadius: "10px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const ENTERPRISE_GREEN = "#22C55E";
const ENTERPRISE_PURPLE = "#7B61FF";
const ENTERPRISE_CORAL = "#FF6B6B";
const ENTERPRISE_AMBER = "#FBBF24";
const MUTED = "#94A3B8";
const TEXT = "#EEF0F8";

// Alias old names for backward compatibility
const NEON = ENTERPRISE_GREEN;
const NEON_PURPLE = ENTERPRISE_PURPLE;
const NEON_CORAL = ENTERPRISE_CORAL;
const NEON_AMBER = ENTERPRISE_AMBER;

// ─── Types ───────────────────────────────────────────────────────────────────
interface RevenueDay {
  date: string;
  revenue: number;
}

interface StripeChargeData {
  data?: Array<{
    amount: number;
    created: number;
    status?: string;
  }>;
}

interface MonthRevenue {
  current: number;
  prior: number;
  pctChange: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseRevenueData(stripeJson: string): RevenueDay[] {
  try {
    const parsed = JSON.parse(stripeJson) as StripeChargeData;
    const charges = parsed?.data ?? [];
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const buckets: Record<string, number> = {};
    // Pre-fill last 30 days with 0
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo + i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      buckets[key] = 0;
    }

    for (const charge of charges) {
      const ts = charge.created * 1000;
      if (ts < thirtyDaysAgo) continue;
      const d = new Date(ts);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      buckets[key] = (buckets[key] ?? 0) + charge.amount / 100;
    }

    return Object.entries(buckets).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  } catch {
    return [];
  }
}

function formatDollar(val: number) {
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Compute current-month and prior-month revenue totals from Stripe charges JSON */
function parseMonthRevenue(stripeJson: string): MonthRevenue {
  try {
    const parsed = JSON.parse(stripeJson) as StripeChargeData;
    const charges = parsed?.data ?? [];
    const now = new Date();
    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();
    const priorMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    ).getTime();
    const priorMonthEnd = currentMonthStart;

    let current = 0;
    let prior = 0;

    for (const charge of charges) {
      const ts = charge.created * 1000;
      if (ts >= currentMonthStart) current += charge.amount / 100;
      else if (ts >= priorMonthStart && ts < priorMonthEnd)
        prior += charge.amount / 100;
    }

    const pctChange =
      prior === 0 ? null : Math.round(((current - prior) / prior) * 100);

    return { current, prior, pctChange };
  } catch {
    return { current: 0, prior: 0, pctChange: null };
  }
}

function getActivityDotColor(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("paid") || t.includes("subscription")) return NEON;
  if (t.includes("audit")) return NEON_AMBER;
  if (t.includes("lead") || t.includes("consult")) return "#60a5fa";
  if (t.includes("cancel") || t.includes("error")) return NEON_CORAL;
  return MUTED;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
interface StatCardProps {
  ocid: string;
  icon: ReactNode;
  label: string;
  value: number | null;
  accent?: "green" | "amber" | "red";
  loading: boolean;
}

function StatCard({
  ocid,
  icon,
  label,
  value,
  accent = "green",
  loading,
}: StatCardProps) {
  const _color =
    accent === "amber" ? NEON_AMBER : accent === "red" ? "#f87171" : TEXT;
  const borderColor =
    accent === "amber" && value && value > 0
      ? "rgba(251,191,36,0.35)"
      : accent === "red" && value && value > 0
        ? "rgba(248,113,113,0.35)"
        : "#1C1F33";

  return (
    <div
      data-ocid={ocid}
      className="p-4 sm:p-[22px]"
      style={{
        ...DARK_CARD,
        position: "relative",
        border: `1px solid ${borderColor}`,
        transition: "border-color 0.2s",
      }}
    >
      <span style={{ position: "absolute", top: "16px", right: "16px" }}>
        {icon}
      </span>
      {loading ? (
        <>
          <Skeleton
            style={{
              width: 60,
              height: 36,
              marginBottom: 6,
              background: "rgba(255,255,255,0.05)",
            }}
          />
          <Skeleton
            style={{
              width: 110,
              height: 13,
              background: "rgba(255,255,255,0.05)",
            }}
          />
        </>
      ) : (
        <>
          <p
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#22C55E",
              margin: 0,
              lineHeight: 1.1,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {value ?? "—"}
          </p>
          <p
            style={{
              fontSize: 11,
              color: MUTED,
              margin: "6px 0 0",
              lineHeight: 1.4,
              fontFamily: "Inter, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {label}
          </p>
        </>
      )}
    </div>
  );
}

// Custom tooltip for AreaChart
function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(17,19,34,0.95)",
        border: "1px solid #1C1F33",
        borderRadius: 6,
        padding: "8px 12px",
      }}
    >
      <p style={{ color: MUTED, fontSize: 11, margin: "0 0 2px" }}>{label}</p>
      <p style={{ color: NEON, fontSize: 14, fontWeight: 700, margin: 0 }}>
        {formatDollar(payload[0].value)}
      </p>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem(ADMIN_EMAIL_KEY) ?? "";
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { actor, isFetching } = useActor();
  const { refreshPendingSubCount } = useAdminPendingRefresh();

  // ─── Tab state ─────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<"dashboard" | "pending">(
    "dashboard",
  );
  const [pendingSubs, setPendingSubs] = useState<Subscription[]>([]);
  const [pendingSubsLoading, setPendingSubsLoading] = useState(false);
  const [pendingSubsError, setPendingSubsError] = useState("");
  const [activatingIds, setActivatingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(
    null,
  );
  const [stripeFetchFailed, setStripeFetchFailed] = useState(false);
  const [monthRevenue, setMonthRevenue] = useState<MonthRevenue | null>(null);
  const [totalLeads, setTotalLeads] = useState<number | null>(null);
  const [soldOrdersCount, setSoldOrdersCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [metricsError, setMetricsError] = useState(false);
  const [leadsError, setLeadsError] = useState(false);

  // ─── Push notification permission banner ──────────────────────────────────
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const [pushToast, setPushToast] = useState<string | null>(null);
  const pushToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showPushToast = useCallback((msg: string) => {
    setPushToast(msg);
    if (pushToastTimer.current) clearTimeout(pushToastTimer.current);
    pushToastTimer.current = setTimeout(() => setPushToast(null), 5000);
  }, []);

  // Determine if banner should show on mount
  useEffect(() => {
    const denied = localStorage.getItem("push_permission_denied");
    const granted = localStorage.getItem("push_permission_granted");
    if (denied || granted) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    setShowPushBanner(true);
  }, []);

  // Poll for pending push notifications every 30s (reliable fallback)
  useEffect(() => {
    if (!actor || isFetching) return;
    const adminEmail = getAdminEmail();
    // Guard: do not fire push notification calls until admin email is hydrated
    if (!adminEmail) return;
    async function pollPending() {
      if (document.visibilityState !== "visible") return;
      if (!actor) return;
      // Re-check email inside poll in case session cleared
      const email = getAdminEmail();
      if (!email) return;
      try {
        const result = await actor.getPendingPushNotifications();
        if ("ok" in result && result.ok.length > 0) {
          for (const n of result.ok) {
            showPushToast(`${n.title}: ${n.body}`);
          }
          await actor.clearPendingPushNotifications();
        }
      } catch {
        // silent — poll failure is not critical
      }
    }
    pollPending();
    pushPollRef.current = setInterval(pollPending, 30_000);
    return () => {
      if (pushPollRef.current) clearInterval(pushPollRef.current);
    };
  }, [actor, isFetching, showPushToast]);

  async function handleEnableNotifications() {
    if (!actor) return;
    setPushSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const vapidKey = await actor.getVapidPublicKey().catch(() => "");
        if (!vapidKey) {
          showPushToast(
            "VAPID key not configured — set it in Notification Settings.",
          );
          setShowPushBanner(false);
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
            .buffer as ArrayBuffer,
        });
        const json = sub.toJSON();
        const endpoint = sub.endpoint;
        const p256dh = json.keys?.p256dh ?? "";
        const auth = json.keys?.auth ?? "";
        const adminEmail = getAdminEmail();
        if (!adminEmail) {
          showPushToast("Session expired. Please refresh.");
          return;
        }
        await actor.savePushSubscription(endpoint, p256dh, auth);
        localStorage.setItem("push_permission_granted", "true");
        showPushToast("Push notifications enabled!");
        setShowPushBanner(false);
      } else if (permission === "denied") {
        localStorage.setItem("push_permission_denied", "true");
        setShowPushBanner(false);
      }
    } catch (err) {
      showPushToast(
        `Failed to enable notifications: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setPushSubscribing(false);
    }
  }

  const fetchData = useCallback(async () => {
    if (!actor) return;
    const adminEmail = getAdminEmail();
    if (!adminEmail) return;

    // Use allSettled so a single failing call doesn't blank the entire dashboard.
    const [metricsSettled, configSettled, leadsSettled, ordersSettled] =
      await Promise.allSettled([
        actor.getDashboardMetrics(),
        actor.isStripeConfigured(),
        actor.getLeads(),
        actor.getAdminAllOrders(),
      ]);

    // ── getDashboardMetrics ──
    if (metricsSettled.status === "fulfilled") {
      setMetrics(metricsSettled.value as DashboardMetrics);
      setMetricsError(false);
    } else {
      setMetrics(null);
      setMetricsError(true);
    }

    // ── isStripeConfigured ──
    const configOk =
      configSettled.status === "fulfilled" ? configSettled.value : false;
    setStripeConfigured(
      configSettled.status === "fulfilled" ? configSettled.value : false,
    );

    // ── getLeads ──
    if (leadsSettled.status === "fulfilled") {
      setTotalLeads(leadsSettled.value.length);
      setLeadsError(false);
    } else {
      setTotalLeads(null);
      setLeadsError(true);
    }

    // ── getAdminAllOrders ──
    if (ordersSettled.status === "fulfilled") {
      const soldStatuses = [
        "depositReceived",
        "live",
        "buildInProgress",
        "launched",
      ];
      const soldCount = ordersSettled.value.filter((o) =>
        soldStatuses.includes(
          Object.keys(o.status as unknown as Record<string, unknown>)[0],
        ),
      ).length;
      setSoldOrdersCount(soldCount);
      const revenue = ordersSettled.value.reduce(
        (sum: number, o: Order) => sum + (o.amount > 0 ? o.amount : 0),
        0,
      );
      setTotalRevenue(revenue);
    }

    // ── Stripe revenue (only if Stripe is configured) ──
    try {
      if (configOk) {
        const stripeResult = await actor
          .getStripeDashboardData()
          .catch(() => ({ err: "unavailable" }) as { err: string });
        if ("ok" in stripeResult) {
          setRevenueData(parseRevenueData(stripeResult.ok));
          setMonthRevenue(parseMonthRevenue(stripeResult.ok));
          setStripeFetchFailed(false);
        } else {
          setRevenueData([]);
          setMonthRevenue(null);
          setStripeFetchFailed(true);
        }
      } else {
        setRevenueData([]);
        setMonthRevenue(null);
        setStripeFetchFailed(false);
      }
    } catch {
      setRevenueData([]);
      setMonthRevenue(null);
      setStripeFetchFailed(true);
    }

    setLastRefresh(new Date());
    setLoading(false);
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    fetchData();

    intervalRef.current = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchData();
    }, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [actor, isFetching, fetchData]);

  // ─── Load pending subscriptions when tab is activated ─────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional refresh-key pattern
  useEffect(() => {
    if (activeView !== "pending" || !actor || isFetching) return;
    let cancelled = false;
    setPendingSubsLoading(true);
    setPendingSubsError("");
    (async () => {
      try {
        const result = await (
          actor as backendInterface
        ).getPendingSubscriptions();
        if (!cancelled) {
          setPendingSubs(result as Subscription[]);
          setPendingSubsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setPendingSubsError(
            err instanceof Error
              ? err.message
              : "Failed to load pending subscriptions.",
          );
          setPendingSubsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeView, actor, isFetching, pendingRefreshKey]);

  async function handleActivatePendingSubscription(sub: Subscription) {
    if (!actor) return;
    const subIdStr = sub.id.toString();
    setActivatingIds((prev) => new Set([...prev, subIdStr]));
    setRowErrors((prev) => {
      const n = { ...prev };
      delete n[subIdStr];
      return n;
    });
    try {
      const result = await (actor as backendInterface).activateSubscription(
        subIdStr,
      );
      if (result.__kind__ === "ok") {
        setPendingSubs((prev) =>
          prev.filter((s) => s.id.toString() !== subIdStr),
        );
        setActivatingIds((prev) => {
          const n = new Set(prev);
          n.delete(subIdStr);
          return n;
        });
        // Refresh sidebar badge count
        refreshPendingSubCount();
        // Send activation email — silent on failure
        try {
          await (actor as backendInterface).resendEmail(
            sub.client_id.toString(),
            "subscription_activated",
          );
        } catch (emailErr) {
          console.error("Activation email failed:", emailErr);
        }
      } else {
        setRowErrors((prev) => ({ ...prev, [subIdStr]: result.err }));
        setActivatingIds((prev) => {
          const n = new Set(prev);
          n.delete(subIdStr);
          return n;
        });
      }
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [subIdStr]: err instanceof Error ? err.message : "Activation failed",
      }));
      setActivatingIds((prev) => {
        const n = new Set(prev);
        n.delete(subIdStr);
        return n;
      });
    }
  }

  // Derived values
  const totalClients = metrics ? Number(metrics.totalClients) : null;
  const totalWebsites = metrics ? Number(metrics.totalWebsites) : null;
  const totalSubs = metrics ? Number(metrics.totalActiveSubscriptions) : null;
  const totalProducts = metrics ? Number(metrics.totalProducts) : null;
  const unreviewed = metrics ? Number(metrics.unreviewedQuestionnaires) : null;
  const outstanding = metrics ? Number(metrics.outstandingInvoices) : null;

  // Distribution pie data
  const distData = [
    { name: "Websites", value: totalWebsites ?? 0 },
    { name: "Subscriptions", value: totalSubs ?? 0 },
    { name: "One-Time Services", value: totalProducts ?? 0 },
  ];
  const distColors = [NEON, NEON_PURPLE, NEON_CORAL];
  const hasDistData = distData.some((d) => d.value > 0);

  // Recent activity
  const recentActivity = metrics?.recentActivity?.slice(0, 5) ?? [];

  function formatPendingDate(ts: bigint): string {
    if (!ts || ts === 0n) return "—";
    const ms = ts / 1_000_000n;
    return new Date(Number(ms)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <AdminLayout pageTitle="Dashboard">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* ── Tab Switcher ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            borderBottom: "1px solid #1C1F33",
            paddingBottom: 0,
          }}
        >
          <button
            type="button"
            data-ocid="admin.dashboard.tab.dashboard"
            onClick={() => setActiveView("dashboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: activeView === "dashboard" ? 700 : 500,
              color: activeView === "dashboard" ? "#22C55E" : "#7A7D90",
              borderBottom:
                activeView === "dashboard"
                  ? "2px solid #22C55E"
                  : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.15s",
              letterSpacing: "0.01em",
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            data-ocid="admin.dashboard.tab.pending_subscriptions"
            onClick={() => {
              if (activeView !== "pending") {
                setActiveView("pending");
                setPendingRefreshKey((k) => k + 1);
              }
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: activeView === "pending" ? 700 : 500,
              color: activeView === "pending" ? "#22C55E" : "#7A7D90",
              borderBottom:
                activeView === "pending"
                  ? "2px solid #22C55E"
                  : "2px solid transparent",
              marginBottom: -1,
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "color 0.15s",
              letterSpacing: "0.01em",
            }}
          >
            Pending Subscriptions
            {pendingSubs.length > 0 && (
              <span
                style={{
                  background: "rgba(34,197,94,0.12)",
                  color: "#22C55E",
                  border: "1px solid rgba(34,197,94,0.30)",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                  minWidth: 20,
                  textAlign: "center",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {pendingSubs.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Pending Subscriptions Panel ── */}
        {activeView === "pending" && (
          <div
            data-ocid="admin.dashboard.pending_subs.panel"
            style={{
              ...DARK_CARD,
              padding: "24px",
            }}
          >
            <h3
              style={{
                color: TEXT,
                fontSize: 15,
                fontWeight: 700,
                margin: "0 0 18px",
              }}
            >
              Pending Subscriptions
            </h3>

            {pendingSubsError && (
              <div
                data-ocid="admin.dashboard.pending_subs.error_state"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 7,
                  padding: "10px 14px",
                  color: "#f87171",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {pendingSubsError}
              </div>
            )}

            {pendingSubsLoading ? (
              <div
                data-ocid="admin.dashboard.pending_subs.loading_state"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[1, 2, 3].map((k) => (
                  <Skeleton
                    key={k}
                    style={{
                      width: "100%",
                      height: 44,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 6,
                    }}
                  />
                ))}
              </div>
            ) : pendingSubs.length === 0 ? (
              <div
                data-ocid="admin.dashboard.pending_subs.empty_state"
                style={{
                  textAlign: "center",
                  color: MUTED,
                  fontSize: 14,
                  padding: "32px 0",
                }}
              >
                No pending subscriptions.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 600,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                      {[
                        "Client Email",
                        "Product",
                        "Plan",
                        "Date Ordered",
                        "Actions",
                      ].map((col) => (
                        <th
                          key={col}
                          style={{
                            padding: "8px 12px",
                            textAlign: "left",
                            fontSize: 11,
                            fontWeight: 700,
                            color: MUTED,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSubs.map((sub, idx) => {
                      const subIdStr = sub.id.toString();
                      const isActivating = activatingIds.has(subIdStr);
                      const rowErr = rowErrors[subIdStr];
                      return (
                        <tr
                          key={subIdStr}
                          data-ocid={`admin.dashboard.pending_subs.item.${idx + 1}`}
                          style={{ borderBottom: "1px solid #1C1F33" }}
                        >
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 13,
                              color: TEXT,
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {sub.clientEmail || "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 13,
                              color: TEXT,
                            }}
                          >
                            {sub.plan_name || "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 13,
                              color: TEXT,
                              textTransform: "capitalize",
                            }}
                          >
                            {sub.billing_cycle || "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 13,
                              color: MUTED,
                            }}
                          >
                            {formatPendingDate(sub.created_at)}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              <button
                                type="button"
                                data-ocid={`admin.dashboard.pending_subs.activate_button.${idx + 1}`}
                                disabled={isActivating}
                                onClick={() =>
                                  handleActivatePendingSubscription(sub)
                                }
                                style={{
                                  background: isActivating
                                    ? "rgba(34,197,94,0.06)"
                                    : "rgba(34,197,94,0.12)",
                                  color: "#22C55E",
                                  border: "1px solid rgba(34,197,94,0.35)",
                                  borderRadius: 6,
                                  padding: "6px 14px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: isActivating
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: isActivating ? 0.65 : 1,
                                  whiteSpace: "nowrap",
                                  transition: "background 0.2s",
                                }}
                              >
                                {isActivating ? "Activating..." : "Activate"}
                              </button>
                              {rowErr && (
                                <span
                                  data-ocid={`admin.dashboard.pending_subs.row_error.${idx + 1}`}
                                  style={{
                                    fontSize: 11,
                                    color: "#f87171",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {rowErr}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeView === "dashboard" && (
          <>
            {/* ── Push Permission Banner ── */}
            {showPushBanner && (
              <div
                data-ocid="admin.dashboard.push_banner"
                style={{
                  background: "rgba(184,134,11,0.10)",
                  border: "1px solid rgba(184,134,11,0.35)",
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <Bell
                  size={18}
                  color="#d4a017"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <p
                  style={{
                    flex: 1,
                    margin: 0,
                    fontSize: 13,
                    color: "#EEF0F8",
                    lineHeight: 1.55,
                    minWidth: 200,
                  }}
                >
                  Stay on top of your business — enable push notifications to
                  get alerts when new clients sign up, orders come in, and more.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    data-ocid="admin.dashboard.push_banner.enable_button"
                    disabled={pushSubscribing}
                    onClick={handleEnableNotifications}
                    style={{
                      background: "#d4a017",
                      color: "#0A0B14",
                      border: "none",
                      borderRadius: 7,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: pushSubscribing ? "not-allowed" : "pointer",
                      opacity: pushSubscribing ? 0.7 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pushSubscribing ? "Enabling…" : "Enable Notifications"}
                  </button>
                  <button
                    type="button"
                    data-ocid="admin.dashboard.push_banner.dismiss_button"
                    onClick={() => {
                      localStorage.setItem("push_permission_denied", "true");
                      setShowPushBanner(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#7A7D90",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Push Toast ── */}
            {pushToast && (
              <div
                data-ocid="admin.dashboard.push.toast"
                style={{
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  color: "#22C55E",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Bell size={14} />
                {pushToast}
              </div>
            )}

            {/* ── Header row ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <h2
                  style={{
                    color: TEXT,
                    fontWeight: 800,
                    fontSize: 22,
                    margin: 0,
                  }}
                >
                  Executive Dashboard
                </h2>
                {lastRefresh && (
                  <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0" }}>
                    Last updated {lastRefresh.toLocaleTimeString()} ·
                    auto-refreshes every 60s
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <NotificationBell />
                <button
                  type="button"
                  data-ocid="admin.dashboard.refresh.btn"
                  onClick={fetchData}
                  style={{
                    background: "rgba(0,255,163,0.08)",
                    border: "1px solid rgba(0,255,163,0.25)",
                    borderRadius: 8,
                    color: NEON,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "7px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <RefreshCw size={13} />
                  Refresh
                </button>
              </div>
            </div>

            {/* ── Stat metrics partial-failure notice ── */}
            {!loading && (metricsError || leadsError) && (
              <div
                data-ocid="admin.dashboard.metrics.error_state"
                style={{
                  background: "rgba(251,191,36,0.07)",
                  border: "1px solid rgba(251,191,36,0.22)",
                  borderRadius: 8,
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  color: NEON_AMBER,
                }}
              >
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>
                  Some stats failed to load and are showing{" "}
                  <strong style={{ color: TEXT }}>"—"</strong>. Hit{" "}
                  <strong style={{ color: TEXT }}>Refresh</strong> to retry.
                </span>
              </div>
            )}

            {/* ── 6 Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                ocid="admin.dashboard.stats.total_clients"
                icon={<Users size={17} color={NEON} />}
                label="Total Clients"
                value={totalClients}
                loading={loading}
              />
              <StatCard
                ocid="admin.dashboard.stats.total_websites"
                icon={<Globe size={17} color={NEON} />}
                label="Total Websites"
                value={totalWebsites}
                loading={loading}
              />
              <StatCard
                ocid="admin.dashboard.stats.active_subscriptions"
                icon={<Repeat size={17} color={NEON} />}
                label="Active Subscriptions"
                value={totalSubs}
                loading={loading}
              />
              <StatCard
                ocid="admin.dashboard.stats.total_products"
                icon={<ShoppingBag size={17} color={NEON} />}
                label="Orders"
                value={soldOrdersCount}
                loading={loading}
              />
              <StatCard
                ocid="admin.dashboard.stats.unreviewed_q"
                icon={
                  <ClipboardList
                    size={17}
                    color={unreviewed && unreviewed > 0 ? NEON_AMBER : NEON}
                  />
                }
                label="Unreviewed Questionnaires"
                value={unreviewed}
                accent={unreviewed && unreviewed > 0 ? "amber" : "green"}
                loading={loading}
              />
              <StatCard
                ocid="admin.dashboard.stats.outstanding_invoices"
                icon={
                  <DollarSign
                    size={17}
                    color={outstanding && outstanding > 0 ? "#f87171" : NEON}
                  />
                }
                label="Outstanding Invoices"
                value={outstanding}
                accent={outstanding && outstanding > 0 ? "red" : "green"}
                loading={loading}
              />
            </div>

            {/* ── Alert for unreviewed questionnaires ── */}
            {!loading && unreviewed !== null && unreviewed > 0 && (
              <div
                data-ocid="admin.dashboard.alert.panel"
                style={{
                  background: "rgba(251,191,36,0.07)",
                  border: "1px solid rgba(251,191,36,0.22)",
                  borderRadius: 8,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <AlertTriangle
                  size={16}
                  color={NEON_AMBER}
                  style={{ flexShrink: 0 }}
                />
                <p style={{ flex: 1, margin: 0, fontSize: 13, color: MUTED }}>
                  <strong style={{ color: TEXT }}>{unreviewed}</strong>{" "}
                  questionnaire{unreviewed !== 1 ? "s" : ""} awaiting review.
                </p>
                <Link
                  to="/admin/questionnaires"
                  data-ocid="admin.dashboard.review.button"
                  style={{
                    background: NEON_AMBER,
                    color: "#0a0a0a",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "7px 14px",
                    borderRadius: 7,
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  Review Now
                </Link>
              </div>
            )}

            {/* ── Charts Row ── */}
            <div
              className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4"
              style={{ overflow: "hidden" }}
            >
              {/* Revenue Growth Chart */}
              <div
                data-ocid="admin.dashboard.revenue.chart"
                style={{ ...DARK_CARD, padding: "24px 20px 16px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <BarChart2 size={16} color={NEON} />
                    <h3
                      style={{
                        color: TEXT,
                        fontSize: 15,
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      Revenue Growth — Last 30 Days
                    </h3>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {/* Stripe status indicator */}
                    {stripeConfigured !== null && (
                      <div
                        data-ocid="admin.dashboard.stripe.status"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          background: stripeConfigured
                            ? "rgba(94,240,138,0.08)"
                            : "rgba(251,191,36,0.08)",
                          border: `1px solid ${stripeConfigured ? "rgba(94,240,138,0.25)" : "rgba(251,191,36,0.25)"}`,
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {stripeConfigured ? (
                          <>
                            <CheckCircle size={11} color="#22C55E" />
                            <span style={{ color: "#22C55E" }}>
                              Stripe Connected
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle size={11} color={NEON_AMBER} />
                            <span style={{ color: NEON_AMBER }}>
                              Stripe Not Configured
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {stripeConfigured && stripeFetchFailed && (
                      <button
                        type="button"
                        data-ocid="admin.dashboard.revenue.refresh_button"
                        onClick={fetchData}
                        style={{
                          background: "rgba(0,255,163,0.06)",
                          border: "1px solid rgba(0,255,163,0.2)",
                          borderRadius: 6,
                          color: NEON,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "4px 10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <RefreshCw size={10} />
                        Retry
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <Skeleton
                    style={{
                      width: "100%",
                      height: 200,
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 6,
                    }}
                  />
                ) : revenueData.length === 0 ? (
                  <div
                    style={{
                      height: 200,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <BarChart2 size={32} color="#2a2d45" />
                    <p
                      style={{
                        color: MUTED,
                        fontSize: 13,
                        margin: 0,
                        textAlign: "center",
                        maxWidth: 300,
                        lineHeight: 1.5,
                      }}
                    >
                      {stripeConfigured === false
                        ? "Configure your Stripe keys in Settings to see revenue data"
                        : stripeFetchFailed
                          ? "Stripe is configured. Revenue data requires live environment — data loads on production."
                          : "No revenue data for the last 30 days"}
                    </p>
                    {stripeConfigured === false && (
                      <Link
                        to="/admin/stripe-settings"
                        style={{
                          color: NEON_AMBER,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: "underline",
                          marginTop: 4,
                        }}
                      >
                        Go to Stripe Settings →
                      </Link>
                    )}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={210}>
                    <AreaChart
                      data={revenueData}
                      margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="revenueGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={NEON}
                            stopOpacity={0.22}
                          />
                          <stop
                            offset="100%"
                            stopColor={NEON}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <filter id="neonGlow">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid
                        stroke="#1C1F33"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: MUTED, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fill: MUTED, fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatDollar}
                        width={58}
                      />
                      <Tooltip
                        content={<RevenueTooltip />}
                        cursor={{ stroke: "#1C1F33", strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={NEON}
                        strokeWidth={2.5}
                        fill="url(#revenueGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: NEON, strokeWidth: 0 }}
                        style={{ filter: "url(#neonGlow)" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Product Distribution Chart */}
              <div
                data-ocid="admin.dashboard.distribution.chart"
                style={{ ...DARK_CARD, padding: "24px 20px 16px" }}
              >
                <h3
                  style={{
                    color: TEXT,
                    fontSize: 15,
                    fontWeight: 700,
                    margin: "0 0 20px",
                  }}
                >
                  Product Distribution
                </h3>

                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Skeleton
                      style={{
                        width: 150,
                        height: 150,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    />
                    <Skeleton
                      style={{
                        width: "80%",
                        height: 13,
                        background: "rgba(255,255,255,0.04)",
                      }}
                    />
                    <Skeleton
                      style={{
                        width: "60%",
                        height: 13,
                        background: "rgba(255,255,255,0.04)",
                      }}
                    />
                  </div>
                ) : !hasDistData ? (
                  <div
                    style={{
                      height: 200,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <ShoppingBag size={32} color="#2a2d45" />
                    <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>
                      No product data yet
                    </p>
                  </div>
                ) : (
                  <div>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={distData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {distData.map((entry, idx) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={distColors[idx]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number, name: string) => [val, name]}
                          contentStyle={{
                            background: "rgba(17,19,34,0.95)",
                            border: "1px solid #1C1F33",
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                          itemStyle={{ color: TEXT }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Custom legend */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      {distData.map((entry, idx) => (
                        <div
                          key={entry.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              background: distColors[idx],
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: MUTED, fontSize: 12, flex: 1 }}>
                            {entry.name}
                          </span>
                          <span
                            style={{
                              color: TEXT,
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Month-over-Month Revenue Strip ── */}
            {!loading && monthRevenue !== null && (
              <div
                data-ocid="admin.dashboard.mom_revenue.panel"
                style={{
                  ...DARK_CARD,
                  padding: "18px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <DollarSign size={16} color={NEON} />
                  <span style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>
                    Month-over-Month Revenue
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 32,
                    flexWrap: "wrap",
                    marginLeft: "auto",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        color: MUTED,
                        fontSize: 11,
                        margin: "0 0 2px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      This Month
                    </p>
                    <p
                      style={{
                        color: NEON,
                        fontSize: 22,
                        fontWeight: 800,
                        margin: 0,
                      }}
                    >
                      {formatDollar(monthRevenue.current)}
                    </p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        color: MUTED,
                        fontSize: 11,
                        margin: "0 0 2px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Last Month
                    </p>
                    <p
                      style={{
                        color: TEXT,
                        fontSize: 22,
                        fontWeight: 800,
                        margin: 0,
                      }}
                    >
                      {formatDollar(monthRevenue.prior)}
                    </p>
                  </div>
                  {monthRevenue.pctChange !== null && (
                    <div
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background:
                          monthRevenue.pctChange >= 0
                            ? "rgba(0,255,163,0.1)"
                            : "rgba(248,113,113,0.1)",
                        border: `1px solid ${monthRevenue.pctChange >= 0 ? "rgba(0,255,163,0.3)" : "rgba(248,113,113,0.3)"}`,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 800,
                          color: monthRevenue.pctChange >= 0 ? NEON : "#f87171",
                        }}
                      >
                        {monthRevenue.pctChange >= 0 ? "+" : ""}
                        {monthRevenue.pctChange}%
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 10,
                          color: MUTED,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        vs last month
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Order Totals ── */}
            {!loading && metrics !== null && (
              <div
                data-ocid="admin.dashboard.order_totals.panel"
                style={{
                  ...DARK_CARD,
                  padding: "18px 24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <ShoppingBag size={16} color={NEON} />
                  <h3
                    style={{
                      color: TEXT,
                      fontSize: 15,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Order Totals
                  </h3>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 32,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Total orders count */}
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        color: MUTED,
                        fontSize: 11,
                        margin: "0 0 2px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Total Orders
                    </p>
                    <p
                      data-ocid="admin.dashboard.order_totals.total_orders"
                      style={{
                        color: NEON,
                        fontSize: 22,
                        fontWeight: 800,
                        margin: 0,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {metrics.totalOrders !== undefined
                        ? Number(metrics.totalOrders)
                        : "—"}
                    </p>
                  </div>
                  {/* Total revenue from live order amounts */}
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        color: MUTED,
                        fontSize: 11,
                        margin: "0 0 2px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Total Revenue
                    </p>
                    <p
                      data-ocid="admin.dashboard.order_totals.total_revenue"
                      style={{
                        color: NEON,
                        fontSize: 22,
                        fontWeight: 800,
                        margin: 0,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {`${totalRevenue.toFixed(2)}`}
                    </p>
                  </div>
                  {/* Total order value */}
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        color: MUTED,
                        fontSize: 11,
                        margin: "0 0 2px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Total Value
                    </p>
                    <p
                      data-ocid="admin.dashboard.order_totals.total_value"
                      style={{
                        color: NEON,
                        fontSize: 22,
                        fontWeight: 800,
                        margin: 0,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {metrics.totalOrderValue !== undefined
                        ? `$${(
                            Number(metrics.totalOrderValue) / 100
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}` // NOTE: $ prefix required here — do not remove
                        : "—"}
                    </p>
                  </div>
                  {/* Status breakdown */}
                  {metrics.ordersByStatus !== undefined &&
                    metrics.ordersByStatus.length > 0 && (
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <p
                          style={{
                            color: MUTED,
                            fontSize: 11,
                            margin: "0 0 8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          By Status
                        </p>
                        <div
                          data-ocid="admin.dashboard.order_totals.by_status"
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px 18px",
                          }}
                        >
                          {metrics.ordersByStatus.map(([status, count]) => (
                            <span
                              key={status}
                              style={{
                                fontSize: 13,
                                color: TEXT,
                                fontFamily: "Inter, sans-serif",
                              }}
                            >
                              <span style={{ color: MUTED }}>{status}:</span>{" "}
                              <strong style={{ color: NEON }}>
                                {Number(count)}
                              </strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* ── Conversion Funnel ── */}
            {!loading && metrics !== null && (
              <div
                data-ocid="admin.dashboard.funnel.panel"
                style={{ ...DARK_CARD, padding: "24px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <BarChart2 size={16} color={NEON} />
                  <h3
                    style={{
                      color: TEXT,
                      fontSize: 15,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Lead-to-Client Funnel
                  </h3>
                </div>

                {(() => {
                  const leadsVal = totalLeads ?? 0;
                  const depositsVal =
                    Number(metrics.totalWebsites ?? 0) + soldOrdersCount;
                  const clientsVal = Number(metrics.totalClients ?? 0);
                  const subsVal = Number(metrics.totalActiveSubscriptions ?? 0);

                  const stages = [
                    {
                      label: "Leads",
                      value: leadsVal,
                      color: "#60a5fa",
                      ocid: "admin.dashboard.funnel.leads",
                    },
                    {
                      label: "Deposits / Projects",
                      value: depositsVal,
                      color: NEON_PURPLE,
                      ocid: "admin.dashboard.funnel.deposits",
                    },
                    {
                      label: "Active Clients",
                      value: clientsVal,
                      color: NEON,
                      ocid: "admin.dashboard.funnel.clients",
                    },
                    {
                      label: "Subscriptions",
                      value: subsVal,
                      color: NEON_AMBER,
                      ocid: "admin.dashboard.funnel.subscriptions",
                    },
                  ];

                  const topValue = stages[0].value || 1;

                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {stages.map((stage) => {
                        const barWidth = Math.max(
                          (stage.value / topValue) * 100,
                          stage.value > 0 ? 3 : 0,
                        );
                        const pct =
                          stages[0].value > 0
                            ? Math.round((stage.value / stages[0].value) * 100)
                            : null;

                        return (
                          <div
                            key={stage.label}
                            data-ocid={stage.ocid}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div style={{ width: 90, flexShrink: 0 }}>
                              <span
                                style={{
                                  color: MUTED,
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {stage.label}
                              </span>
                            </div>
                            <div
                              style={{
                                flex: 1,
                                height: 28,
                                background: "rgba(255,255,255,0.04)",
                                borderRadius: 6,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${barWidth}%`,
                                  background: stage.color,
                                  borderRadius: 6,
                                  opacity: 0.85,
                                  transition: "width 0.4s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  paddingRight: barWidth > 15 ? 8 : 0,
                                }}
                              >
                                {barWidth > 15 && (
                                  <span
                                    style={{
                                      color: "#0A0B14",
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {stage.value}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              style={{
                                width: 72,
                                flexShrink: 0,
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 8,
                              }}
                            >
                              {barWidth <= 15 && (
                                <span
                                  style={{
                                    color: TEXT,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {stage.value}
                                </span>
                              )}
                              {pct !== null && (
                                <span style={{ color: MUTED, fontSize: 11 }}>
                                  {pct}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <p
                        style={{
                          color: MUTED,
                          fontSize: 11,
                          margin: "8px 0 0",
                          lineHeight: 1.5,
                        }}
                      >
                        Percentages relative to total leads. Deposits/Projects =
                        total websites + sold orders.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Recent Activity Feed ── */}
            <div
              data-ocid="admin.dashboard.activity.panel"
              style={{ ...DARK_CARD, padding: "24px" }}
            >
              <h3
                style={{
                  color: TEXT,
                  fontSize: 15,
                  fontWeight: 700,
                  margin: "0 0 16px",
                }}
              >
                Recent Activity
              </h3>

              {loading ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {["a", "b", "c", "d", "e"].map((k) => (
                    <div
                      key={k}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Skeleton
                        style={{
                          width: 3,
                          height: 36,
                          borderRadius: 2,
                          background: "rgba(255,255,255,0.05)",
                        }}
                      />
                      <Skeleton
                        style={{
                          flex: 1,
                          height: 14,
                          background: "rgba(255,255,255,0.05)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>
                  No recent activity yet.
                </p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 0 }}
                >
                  {recentActivity.map((item, idx) => {
                    const dotColor = getActivityDotColor(item);
                    const isLast = idx === recentActivity.length - 1;
                    const itemKey = `${item.slice(0, 30)}-${idx}`;
                    return (
                      <div
                        key={itemKey}
                        data-ocid={`admin.dashboard.activity.item.${idx + 1}`}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "12px 0",
                          borderBottom: isLast ? "none" : "1px solid #1C1F33",
                        }}
                      >
                        {/* Left neon border accent */}
                        <div
                          style={{
                            width: 3,
                            height: 36,
                            borderRadius: 2,
                            background: dotColor,
                            flexShrink: 0,
                            marginTop: 2,
                            boxShadow: `0 0 6px ${dotColor}55`,
                          }}
                        />
                        <p
                          style={{
                            color: TEXT,
                            fontSize: 13,
                            margin: 0,
                            lineHeight: 1.5,
                            flex: 1,
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {item}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Quick Links ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 14,
              }}
            >
              {[
                {
                  ocid: "admin.dashboard.quick.link.1",
                  icon: <Users size={22} color={NEON} />,
                  label: "View All Clients",
                  to: "/admin/clients",
                },
                {
                  ocid: "admin.dashboard.quick.link.2",
                  icon: <ClipboardList size={22} color={NEON} />,
                  label: "Review Questionnaires",
                  to: "/admin/questionnaires",
                },
                {
                  ocid: "admin.dashboard.quick.link.3",
                  icon: <FileText size={22} color={NEON} />,
                  label: "Manage Orders",
                  to: "/admin/orders",
                },
                {
                  ocid: "admin.dashboard.quick.link.4",
                  icon: <Mail size={22} color={NEON} />,
                  label: "Email Templates",
                  to: "/admin/email-templates",
                },
              ].map((card) => (
                <Link
                  key={card.ocid}
                  to={card.to as never}
                  data-ocid={card.ocid}
                  style={{
                    ...DARK_CARD,
                    padding: "18px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    textDecoration: "none",
                    transition: "border-color 0.15s",
                  }}
                >
                  {card.icon}
                  <span
                    style={{
                      color: TEXT,
                      fontWeight: 700,
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    {card.label}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
