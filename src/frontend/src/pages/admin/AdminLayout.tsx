import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart2,
  Bell,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  GitBranch,
  Globe,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Package,
  Send,
  Server,
  Settings,
  Settings2,
  ShoppingBag,
  Star,
  Table2,
  Target,
  Type,
  User,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SessionTimeoutModal } from "../../components/SessionTimeoutModal";
import { useActor } from "../../hooks/useActor";
import { useIdleTimer } from "../../hooks/useIdleTimer";
import { useSession } from "../../hooks/useSession";
import { useSiteTextStore } from "../../store/useSiteTextStore";

// ─── PWA: BeforeInstallPromptEvent (non-standard browser API) ────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── TypeScript declarations for non-standard Navigator Connection API ───────
declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
  interface NetworkInformation {
    downlink?: number;
    effectiveType?: string;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
type ConnectionStatus = "Strong" | "Moderate" | "Weak" | "Offline";

interface ConnectionSpeed {
  status: ConnectionStatus;
  animDuration: number;
}

// ─── useConnectionSpeed hook ─────────────────────────────────────────────────
function readConnectionSpeed(): ConnectionSpeed {
  if (typeof navigator === "undefined" || !navigator.onLine) {
    return { status: "Offline", animDuration: 0 };
  }

  const conn =
    navigator.connection ??
    navigator.mozConnection ??
    navigator.webkitConnection;

  if (!conn) {
    return { status: "Strong", animDuration: 1.2 };
  }

  const { effectiveType, downlink } = conn;

  if (
    effectiveType === "slow-2g" ||
    (downlink !== undefined && downlink < 0.1)
  ) {
    return { status: "Weak", animDuration: 9.0 };
  }
  if (
    effectiveType === "2g" ||
    (downlink !== undefined && downlink >= 0.1 && downlink < 1)
  ) {
    return { status: "Weak", animDuration: 6.0 };
  }
  if (
    effectiveType === "3g" ||
    (downlink !== undefined && downlink >= 1 && downlink <= 5)
  ) {
    return { status: "Moderate", animDuration: 3.0 };
  }
  return { status: "Strong", animDuration: 1.2 };
}

function useConnectionSpeed(): ConnectionSpeed {
  const [speed, setSpeed] = useState<ConnectionSpeed>(readConnectionSpeed);

  useEffect(() => {
    function update() {
      setSpeed(readConnectionSpeed());
    }

    const intervalId = setInterval(update, 5000);

    const conn =
      navigator.connection ??
      navigator.mozConnection ??
      navigator.webkitConnection;

    if (conn) {
      conn.addEventListener("change", update as EventListener);
    }

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      clearInterval(intervalId);
      if (conn) {
        conn.removeEventListener("change", update as EventListener);
      }
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return speed;
}

// ─── ConnectionCog component ──────────────────────────────────────────────────
function ConnectionCog() {
  const { status, animDuration } = useConnectionSpeed();

  const isOffline = status === "Offline";

  const iconColor = isOffline ? "#EF4444" : "#9CA3AF";

  const statusColors: Record<ConnectionStatus, string> = {
    Strong: "#5EF08A",
    Moderate: "#FBBF24",
    Weak: "#F97316",
    Offline: "#EF4444",
  };

  const labelColor = statusColors[status];

  const spinStyle: React.CSSProperties = isOffline
    ? {
        animation: "pulse 1.5s ease-in-out infinite",
        color: iconColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }
    : {
        animation: `cogSpin ${animDuration}s linear infinite`,
        color: iconColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };

  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes cogSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      <div
        data-ocid="admin.connection-cog.indicator"
        title={`Connection: ${status}`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          cursor: "default",
          userSelect: "none",
        }}
      >
        <div style={spinStyle}>
          <Settings size={18} />
        </div>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: labelColor,
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {status}
        </span>
      </div>
    </>
  );
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  ocid: string;
  hasRedDot?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

export default function AdminLayout({
  children,
  pageTitle = "Dashboard",
}: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { session, clearSession } = useSession();
  const { actor, isFetching } = useActor();
  const { editMode, setEditMode, fetchAllSiteText } = useSiteTextStore();
  const [unreviewedCount, setUnreviewedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const backdropTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── PWA: Service worker registration (admin scope only) ─────────────────
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/admin-sw.js", { scope: "/admin/" })
        .then((reg) => {
          console.log("[PWA] Admin SW registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Admin SW registration failed:", err);
        });
    }
  }, []);

  // ─── PWA: Capture install prompt ─────────────────────────────────────────
  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  // ─── Scroll preservation ────────────────────────────────────────────────────
  // The <main> element is the actual scrollable container (overflow-y-auto).
  // We track scroll position continuously via onScroll and unconditionally
  // restore it after every render. The unconditional restore (no `if` guard)
  // is the key: React can silently reset scrollTop during reconciliation, and
  // the conditional check was allowing that reset to stick.
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollTop = useRef(0);

  // After EVERY render, unconditionally restore scrollTop to what the user set.
  // This prevents any React state update (notifications badge, site text fetch,
  // actor isFetching transition, etc.) from snapping the view back to the top.
  useLayoutEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = lastScrollTop.current;
    }
  });

  const SUPER_ADMIN_EMAIL = "vincenzo@imperidome.com";

  // ─── PWA: Install handler ─────────────────────────────────────────────────
  async function handleInstallApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  // ─── Session timeout ────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    clearSession();
    navigate({ to: "/login" as any });
  }, [clearSession, navigate]);

  const { isWarning, timeRemaining, resetTimer } = useIdleTimer({
    onWarn: () => {
      // Warning state is handled by isWarning flag — no extra side effects needed
    },
    onLogout: handleLogout,
  });

  useEffect(() => {
    if (!session || session.role !== "admin") {
      navigate({ to: "/login" as any });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, navigate]);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getAdminStats()
      .then((s) => {
        setUnreviewedCount(Number(s.unreviewedQuestionnaires));
      })
      .catch(() => {});
  }, [actor, isFetching]);

  useEffect(() => {
    if (!actor || isFetching) return;
    fetchAllSiteText(actor as Parameters<typeof fetchAllSiteText>[0]);
  }, [actor, isFetching, fetchAllSiteText]);

  useEffect(() => {
    if (backdropTimer.current) clearTimeout(backdropTimer.current);
    if (sidebarOpen) {
      backdropTimer.current = setTimeout(() => {
        setBackdropVisible(true);
      }, 10);
    } else {
      setBackdropVisible(false);
    }
    return () => {
      if (backdropTimer.current) clearTimeout(backdropTimer.current);
    };
  }, [sidebarOpen]);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  const navGroups: NavGroup[] = [
    {
      id: "overview",
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: <LayoutDashboard size={16} />,
          path: "/admin/dashboard",
          ocid: "admin.nav.dashboard.link",
        },
        {
          label: "Analytics",
          icon: <BarChart2 size={16} />,
          path: "/admin/analytics",
          ocid: "admin.nav.analytics.link",
        },
      ],
    },
    {
      id: "crm",
      label: "Clients & CRM",
      items: [
        {
          label: "Clients",
          icon: <Users size={16} />,
          path: "/admin/clients",
          ocid: "admin.nav.clients.link",
        },
        {
          label: "Questionnaires",
          icon: <ClipboardList size={16} />,
          path: "/admin/questionnaires",
          ocid: "admin.nav.questionnaires.link",
          hasRedDot: unreviewedCount > 0,
        },
        {
          label: "Leads",
          icon: <Target size={16} />,
          path: "/admin/leads",
          ocid: "admin.nav.leads.link",
        },
        {
          label: "Referrals",
          icon: <GitBranch size={16} />,
          path: "/admin/referrals",
          ocid: "admin.nav.referrals.link",
        },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      items: [
        {
          label: "Orders",
          icon: <ShoppingBag size={16} />,
          path: "/admin/orders",
          ocid: "admin.nav.orders.link",
        },
        {
          label: "Stripe Settings",
          icon: <CreditCard size={16} />,
          path: "/admin/stripe-settings",
          ocid: "admin.nav.stripe-settings.link",
        },
        {
          label: "Spreadsheet",
          icon: <Table2 size={16} />,
          path: "/admin/spreadsheet",
          ocid: "admin.nav.spreadsheet.link",
        },
      ],
    },
    {
      id: "content",
      label: "Content & Marketing",
      items: [
        {
          label: "Reviews",
          icon: <Star size={16} />,
          path: "/admin/reviews",
          ocid: "admin.nav.reviews.link",
        },
        {
          label: "Services",
          icon: <Package size={16} />,
          path: "/admin/services",
          ocid: "admin.nav.products.link",
        },
        {
          label: "Builds",
          icon: <Globe size={16} />,
          path: "/admin/builds",
          ocid: "admin.nav.builds.link",
        },
        {
          label: "Portfolio",
          icon: <LayoutGrid size={16} />,
          path: "/admin/portfolio",
          ocid: "admin.nav.portfolio.link",
        },
        {
          label: "Blog",
          icon: <BookOpen size={16} />,
          path: "/admin/blog",
          ocid: "admin.nav.blog.link",
        },
        {
          label: "Bulk Email",
          icon: <Send size={16} />,
          path: "/admin/bulk-email",
          ocid: "admin.nav.bulk-email.link",
        },
        {
          label: "Email Templates",
          icon: <Mail size={16} />,
          path: "/admin/email-templates",
          ocid: "admin.nav.email-templates.link",
        },
        {
          label: "Email Logs",
          icon: <FileText size={16} />,
          path: "/admin/email-logs",
          ocid: "admin.nav.email-logs.link",
        },
        {
          label: "Site Text",
          icon: <Type size={16} />,
          path: "/admin/site-text",
          ocid: "admin.nav.site-text.link",
        },
      ],
    },
    {
      id: "system",
      label: "System",
      items: [
        {
          label: "Notification Log",
          icon: <Bell size={16} />,
          path: "/admin/notifications",
          ocid: "admin.nav.notifications.link",
        },
        {
          label: "Push Settings",
          icon: <Settings2 size={16} />,
          path: "/admin/notification-settings",
          ocid: "admin.nav.notification-settings.link",
        },
        {
          label: "Google Calendar",
          icon: <CalendarCheck size={16} />,
          path: "/admin/google-calendar",
          ocid: "admin.nav.google-calendar.link",
        },
        {
          label: "Fleet",
          icon: <Server size={16} />,
          path: "/admin/fleet",
          ocid: "admin.nav.fleet.link",
        },
        {
          label: "Profile",
          icon: <User size={16} />,
          path: "/admin/profile",
          ocid: "admin.nav.profile.link",
        },
      ],
    },
  ];

  // Determine which group contains the active path
  function getActiveGroupId(path: string): string {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.path === path) return group.id;
      }
    }
    return "overview";
  }

  const initialOpenGroup = getActiveGroupId(currentPath);

  // Track open groups — only one group open at a time (accordion style),
  // but multiple can be opened manually. We use a Set stored as an array.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      overview: false,
      crm: false,
      finance: false,
      content: false,
      system: false,
    };
    initial[initialOpenGroup] = true;
    return initial;
  });

  // When the active path changes (navigation), ensure the containing group is open
  // biome-ignore lint/correctness/useExhaustiveDependencies: getActiveGroupId is stable (defined in render body, no captured state)
  useEffect(() => {
    const activeGroup = getActiveGroupId(currentPath);
    setOpenGroups((prev) => {
      if (prev[activeGroup]) return prev;
      return { ...prev, [activeGroup]: true };
    });
  }, [currentPath]);

  if (!session || session.role !== "admin") return null;

  const adminEmail = session.email;

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  /** Nav items + bottom section only — used in the mobile drawer's inner scrollable div */
  function MobileSidebarNav({ onNavClick }: { onNavClick?: () => void }) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          paddingTop: "8px",
        }}
      >
        {/* Grouped nav */}
        <nav
          style={{
            padding: "0 12px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {navGroups.map((group) => {
            const isOpen = openGroups[group.id];
            const hasActiveItem = group.items.some(
              (item) => currentPath === item.path,
            );
            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  type="button"
                  data-ocid={`admin.nav.group.${group.id}.toggle`}
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "7px 16px 5px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: hasActiveItem
                        ? "rgba(94,240,138,0.7)"
                        : "rgba(122,125,144,0.55)",
                    }}
                  >
                    {group.label}
                  </span>
                  <ChevronDown
                    size={12}
                    style={{
                      color: hasActiveItem
                        ? "rgba(94,240,138,0.7)"
                        : "rgba(122,125,144,0.45)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Group items */}
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? "600px" : "0",
                    transition: "max-height 0.25s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                  }}
                >
                  {group.items.map((item) => {
                    const isActive = currentPath === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path as any}
                        data-ocid={item.ocid}
                        onClick={onNavClick}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 16px 9px 24px",
                          borderRadius: "8px",
                          background: isActive
                            ? "rgba(94,240,138,0.1)"
                            : "transparent",
                          color: isActive ? "#5EF08A" : "#7A7D90",
                          fontSize: "13.5px",
                          fontWeight: isActive ? 600 : 400,
                          textDecoration: "none",
                          transition: "background 0.15s, color 0.15s",
                          position: "relative",
                        }}
                      >
                        <span style={{ flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.hasRedDot && (
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#EF4444",
                              flexShrink: 0,
                            }}
                            aria-label="Unreviewed submissions"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid #1C1F33",
            marginTop: "auto",
          }}
        >
          {adminEmail === SUPER_ADMIN_EMAIL && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                borderRadius: "8px",
                background: editMode
                  ? "rgba(57,255,20,0.08)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${editMode ? "rgba(57,255,20,0.3)" : "#1C1F33"}`,
              }}
            >
              <button
                type="button"
                data-ocid="admin.edit-site-text.toggle"
                onClick={() => setEditMode(!editMode)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: editMode ? "#39FF14" : "#7A7D90",
                    whiteSpace: "nowrap",
                  }}
                >
                  {editMode ? "✏️ Edit Mode: ON" : "✏️ Edit Site Text"}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    width: "32px",
                    height: "18px",
                    borderRadius: "999px",
                    background: editMode ? "#39FF14" : "#374151",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: editMode ? "16px" : "2px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: editMode ? "#0a0a0a" : "#6B7280",
                      transition: "left 0.2s, background 0.2s",
                    }}
                  />
                </span>
              </button>
              {editMode && (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "10px",
                    color: "rgba(57,255,20,0.6)",
                    lineHeight: 1.4,
                  }}
                >
                  Click text on live pages to edit
                </p>
              )}
            </div>
          )}
          <p
            style={{
              color: "#7A7D90",
              fontSize: "12px",
              marginBottom: "8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {adminEmail}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="admin.logout.button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#f87171",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            <LogOut size={12} />
            Log Out
          </button>
        </div>
      </div>
    );
  }

  function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
    return (
      <div
        style={
          {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          } as React.CSSProperties
        }
      >
        {/* Wordmark + badge */}
        <div style={{ padding: "24px 24px 0", flexShrink: 0 }}>
          <span
            style={{
              fontSize: "20px",
              letterSpacing: "0.15em",
              marginBottom: "8px",
              fontWeight: 700,
              color: "#5EF08A",
              display: "block",
            }}
          >
            IMPERIDOME
          </span>
          <span
            style={{
              display: "inline-block",
              background: "rgba(94,240,138,0.15)",
              color: "#5EF08A",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "2px 8px",
              borderRadius: "4px",
              marginBottom: "16px",
              textTransform: "uppercase",
            }}
          >
            Admin Panel
          </span>
        </div>

        {/* Grouped nav */}
        <nav
          style={{
            padding: "0 12px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {navGroups.map((group) => {
            const isOpen = openGroups[group.id];
            const hasActiveItem = group.items.some(
              (item) => currentPath === item.path,
            );
            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  type="button"
                  data-ocid={`admin.nav.group.${group.id}.toggle`}
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "7px 16px 5px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: hasActiveItem
                        ? "rgba(94,240,138,0.7)"
                        : "rgba(122,125,144,0.55)",
                    }}
                  >
                    {group.label}
                  </span>
                  <ChevronDown
                    size={12}
                    style={{
                      color: hasActiveItem
                        ? "rgba(94,240,138,0.7)"
                        : "rgba(122,125,144,0.45)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Group items */}
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? "600px" : "0",
                    transition: "max-height 0.25s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                  }}
                >
                  {group.items.map((item) => {
                    const isActive = currentPath === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path as any}
                        data-ocid={item.ocid}
                        onClick={onNavClick}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 16px 9px 24px",
                          borderRadius: "8px",
                          background: isActive
                            ? "rgba(94,240,138,0.1)"
                            : "transparent",
                          color: isActive ? "#5EF08A" : "#7A7D90",
                          fontSize: "13.5px",
                          fontWeight: isActive ? 600 : 400,
                          textDecoration: "none",
                          transition: "background 0.15s, color 0.15s",
                          position: "relative",
                        }}
                      >
                        <span style={{ flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.hasRedDot && (
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#EF4444",
                              flexShrink: 0,
                            }}
                            aria-label="Unreviewed submissions"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid #1C1F33",
            marginTop: "auto",
            flexShrink: 0,
          }}
        >
          {/* Edit Site Text toggle — Super Admin only */}
          {adminEmail === SUPER_ADMIN_EMAIL && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                borderRadius: "8px",
                background: editMode
                  ? "rgba(57,255,20,0.08)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${editMode ? "rgba(57,255,20,0.3)" : "#1C1F33"}`,
              }}
            >
              <button
                type="button"
                data-ocid="admin.edit-site-text.toggle"
                onClick={() => setEditMode(!editMode)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: editMode ? "#39FF14" : "#7A7D90",
                    whiteSpace: "nowrap",
                  }}
                >
                  {editMode ? "✏️ Edit Mode: ON" : "✏️ Edit Site Text"}
                </span>
                {/* Pill toggle */}
                <span
                  style={{
                    flexShrink: 0,
                    width: "32px",
                    height: "18px",
                    borderRadius: "999px",
                    background: editMode ? "#39FF14" : "#374151",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: editMode ? "16px" : "2px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: editMode ? "#0a0a0a" : "#6B7280",
                      transition: "left 0.2s, background 0.2s",
                    }}
                  />
                </span>
              </button>
              {editMode && (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "10px",
                    color: "rgba(57,255,20,0.6)",
                    lineHeight: 1.4,
                  }}
                >
                  Click text on live pages to edit
                </p>
              )}
            </div>
          )}

          <p
            style={{
              color: "#7A7D90",
              fontSize: "12px",
              marginBottom: "8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {adminEmail}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="admin.logout.button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#f87171",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            <LogOut size={12} />
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0B14" }}>
      {/* Session timeout warning modal */}
      <SessionTimeoutModal
        isOpen={isWarning}
        timeRemaining={timeRemaining}
        onStayLoggedIn={resetTimer}
      />

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        data-ocid="admin.sidebar.panel"
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen z-40"
        style={{
          width: "240px",
          background: "rgba(14,16,32,1)",
          borderRight: "1px solid #1C1F33",
          overflow: "hidden",
          height: "100vh",
        }}
      >
        <SidebarContent />
      </aside>

      {/* ===== MOBILE OVERLAY BACKDROP ===== */}
      {sidebarOpen && (
        <button
          type="button"
          data-ocid="admin.sidebar.overlay"
          onClick={closeSidebar}
          onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.7)",
            opacity: backdropVisible ? 1 : 0,
            transition: "opacity 0.2s ease",
            border: "none",
            cursor: "pointer",
            width: "100%",
            height: "100%",
          }}
          aria-label="Close menu"
        />
      )}

      {/* ===== MOBILE SIDEBAR PANEL ===== */}
      <aside
        data-ocid="admin.sidebar.mobile.panel"
        className="md:hidden fixed top-0 left-0 z-50"
        style={{
          width: "240px",
          height: "100dvh",
          background: "rgba(14,16,32,1)",
          borderRight: "1px solid #1C1F33",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        aria-hidden={!sidebarOpen}
      >
        {/* Pinned header — never scrolls */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 16px 0 24px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "18px",
                letterSpacing: "0.15em",
                fontWeight: 700,
                color: "#5EF08A",
                display: "block",
              }}
            >
              IMPERIDOME
            </span>
            <span
              style={{
                display: "inline-block",
                background: "rgba(94,240,138,0.15)",
                color: "#5EF08A",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                padding: "2px 8px",
                borderRadius: "4px",
                marginTop: "4px",
                textTransform: "uppercase",
              }}
            >
              Admin Panel
            </span>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7A7D90",
              padding: "4px",
              flexShrink: 0,
              alignSelf: "flex-start",
            }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        {/* Scrollable nav area */}
        <div
          style={
            {
              flex: "1 1 0",
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            } as React.CSSProperties
          }
        >
          <MobileSidebarNav onNavClick={closeSidebar} />
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="md:ml-[240px] flex flex-col h-screen">
        {/* Header bar */}
        <header
          data-ocid="admin.header.panel"
          className="sticky top-0 z-30 flex-shrink-0"
          style={{
            height: "64px",
            background: "rgba(14,16,32,1)",
            borderBottom: "1px solid #1C1F33",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
          }}
        >
          {/* Mobile */}
          <div
            className="flex md:hidden w-full items-center"
            style={{ position: "relative" }}
          >
            <button
              type="button"
              data-ocid="admin.hamburger.button"
              aria-label="Open menu"
              onClick={() => {
                setSidebarOpen(true);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#EEF0F8",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                zIndex: 1,
              }}
            >
              <Menu size={22} />
            </button>
            <h1
              className="font-bold"
              style={{
                color: "#EEF0F8",
                fontSize: "17px",
                margin: 0,
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              {pageTitle}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginLeft: "auto",
                zIndex: 1,
              }}
            >
              <span
                style={{
                  background: "rgba(94,240,138,0.15)",
                  color: "#5EF08A",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: "12px",
                }}
              >
                Admin
              </span>
              {/* Connection Cog — Mobile */}
              <ConnectionCog />
              {/* PWA Install — Mobile */}
              {installPrompt && (
                <button
                  type="button"
                  data-ocid="admin.install-app.button"
                  aria-label="Install Admin App"
                  onClick={handleInstallApp}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(184,134,11,0.15)",
                    border: "1px solid rgba(184,134,11,0.45)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    padding: "4px 8px",
                    color: "#d4a017",
                    fontSize: "11px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  ↓ Install
                </button>
              )}
              <button
                type="button"
                data-ocid="admin.notifications.button"
                aria-label="Notifications"
                onClick={() => navigate({ to: "/admin/dashboard" as any })}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: "#EEF0F8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Bell size={20} />
              </button>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex w-full items-center justify-between">
            <h1
              className="font-bold"
              style={{ color: "#EEF0F8", fontSize: "18px", margin: 0 }}
            >
              {pageTitle}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  background: "rgba(94,240,138,0.15)",
                  color: "#5EF08A",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: "12px",
                }}
              >
                Admin
              </span>
              {/* Connection Cog — Desktop */}
              <ConnectionCog />
              {/* PWA Install — Desktop */}
              {installPrompt && (
                <button
                  type="button"
                  data-ocid="admin.install-app.button"
                  aria-label="Install Admin App"
                  onClick={handleInstallApp}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(184,134,11,0.12)",
                    border: "1px solid rgba(184,134,11,0.4)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    padding: "5px 12px",
                    color: "#d4a017",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <span style={{ fontSize: "14px", lineHeight: 1 }}>↓</span>
                  Install App
                </button>
              )}
              <button
                type="button"
                data-ocid="admin.notifications.button"
                aria-label="Notifications"
                onClick={() => navigate({ to: "/admin/dashboard" as any })}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: "#EEF0F8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Bell size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto"
          style={{
            padding: "clamp(16px, 4vw, 32px)",
            overflowX: "hidden",
            minWidth: 0,
          }}
          onScroll={(e) => {
            lastScrollTop.current = e.currentTarget.scrollTop;
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
