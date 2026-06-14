import { Footer } from "@/components/Footer";

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  FolderDown,
  FolderOpen,
  Gift,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PenSquare,
  Receipt,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { EditableText } from "../../components/EditableText";
import { SessionTimeoutModal } from "../../components/SessionTimeoutModal";
import { useIdleTimer } from "../../hooks/useIdleTimer";
import { getSession, useSession } from "../../hooks/useSession";

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  ocid: string;
  tabOcid?: string;
  tabLabel?: string;
  labelKey: string;
  tabLabelKey?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    labelKey: "portal.nav.dashboard.label",
    icon: <LayoutDashboard size={16} />,
    path: "/portal/dashboard",
    ocid: "portal.nav.dashboard.link",
    tabOcid: "portal.tab.dashboard.link",
    tabLabel: "Dashboard",
    tabLabelKey: "portal.tab.dashboard.label",
  },
  {
    label: "My Projects",
    labelKey: "portal.nav.projects.label",
    icon: <FolderOpen size={16} />,
    path: "/portal/projects",
    ocid: "portal.nav.projects.link",
    tabOcid: "portal.tab.projects.link",
    tabLabel: "Projects",
    tabLabelKey: "portal.tab.projects.label",
  },
  {
    label: "Questionnaires",
    labelKey: "portal.nav.questionnaires.label",
    icon: <ClipboardList size={16} />,
    path: "/portal/questionnaires",
    ocid: "portal.nav.questionnaires.link",
    tabOcid: "portal.tab.questionnaires.link",
    tabLabel: "Forms",
    tabLabelKey: "portal.tab.questionnaires.label",
  },
  {
    label: "Subscriptions",
    labelKey: "portal.nav.subscriptions.label",
    icon: <CreditCard size={16} />,
    path: "/portal/subscriptions",
    ocid: "portal.nav.subscriptions.link",
    tabOcid: "portal.tab.subscriptions.link",
    tabLabel: "Plans",
    tabLabelKey: "portal.tab.subscriptions.label",
  },
  {
    label: "Invoices",
    labelKey: "portal.nav.invoices.label",
    icon: <FileText size={16} />,
    path: "/portal/invoices",
    ocid: "portal.nav.invoices.link",
    tabOcid: "portal.tab.invoices.link",
    tabLabel: "Invoices",
    tabLabelKey: "portal.tab.invoices.label",
  },
  {
    label: "Billing",
    labelKey: "portal.nav.billing.label",
    icon: <CreditCard size={16} />,
    path: "/portal/billing",
    ocid: "portal.nav.billing.link",
    tabOcid: "portal.tab.billing.link",
    tabLabel: "Billing",
    tabLabelKey: "portal.tab.billing.label",
  },
  {
    label: "Annual Statement",
    labelKey: "portal.nav.annual_statement.label",
    icon: <FileText size={16} />,
    path: "/portal/annual-statement",
    ocid: "portal.nav.annual_statement.link",
    tabOcid: "portal.tab.annual_statement.link",
    tabLabel: "Statement",
    tabLabelKey: "portal.tab.annual_statement.label",
  },
  {
    label: "Messages",
    labelKey: "portal.nav.messages.label",
    icon: <MessageCircle size={16} />,
    path: "/portal/messages",
    ocid: "portal.nav.messages.link",
    tabOcid: "portal.tab.messages.link",
    tabLabel: "Messages",
    tabLabelKey: "portal.tab.messages.label",
  },
  {
    label: "Edit Requests",
    labelKey: "portal.nav.edit-requests.label",
    icon: <PenSquare size={16} />,
    path: "/portal/edit-requests",
    ocid: "portal.nav.edit-requests.link",
    tabOcid: "portal.tab.edit-requests.link",
    tabLabel: "Edits",
    tabLabelKey: "portal.tab.edit-requests.label",
  },
  {
    label: "Reviews",
    labelKey: "portal.nav.reviews.label",
    icon: <Star size={16} />,
    path: "/portal/reviews",
    ocid: "portal.nav.reviews.link",
    tabOcid: "portal.tab.reviews.link",
    tabLabel: "Reviews",
    tabLabelKey: "portal.tab.reviews.label",
  },
  {
    label: "Files",
    labelKey: "portal.nav.files.label",
    icon: <FolderDown size={16} />,
    path: "/portal/files",
    ocid: "portal.nav.files.link",
    tabOcid: "portal.tab.files.link",
    tabLabel: "Files",
    tabLabelKey: "portal.tab.files.label",
  },
  {
    label: "Referrals",
    labelKey: "portal.nav.referrals.label",
    icon: <Gift size={16} />,
    path: "/portal/referrals",
    ocid: "portal.nav.referrals.link",
    tabOcid: "portal.tab.referrals.link",
    tabLabel: "Referrals",
    tabLabelKey: "portal.tab.referrals.label",
  },
  {
    label: "Shop",
    labelKey: "portal.nav.shop.label",
    icon: <ShoppingBag size={16} />,
    path: "/portal/shop",
    ocid: "portal.nav.shop.link",
    tabOcid: "portal.tab.shop.link",
    tabLabel: "Shop",
    tabLabelKey: "portal.tab.shop.label",
  },
  {
    label: "Requests",
    labelKey: "portal.nav.requests.label",
    icon: <Receipt size={16} />,
    path: "/portal/requests",
    ocid: "portal.nav.requests.link",
    tabOcid: "portal.tab.requests.link",
    tabLabel: "Requests",
    tabLabelKey: "portal.tab.requests.label",
  },
  {
    label: "Profile",
    labelKey: "portal.nav.profile.label",
    icon: <User size={16} />,
    path: "/portal/profile",
    ocid: "portal.nav.profile.link",
    tabOcid: "portal.tab.profile.link",
    tabLabel: "Profile",
    tabLabelKey: "portal.tab.profile.label",
  },
];

const tabItems = navItems.filter((item) => item.tabOcid);

interface PortalLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

export default function PortalLayout({
  children,
  pageTitle = "Dashboard",
}: PortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { session, clearSession } = useSession();

  // ─── Session timeout ────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    clearSession();
    navigate({ to: "/login" });
  }, [clearSession, navigate]);

  const { isWarning, timeRemaining, resetTimer } = useIdleTimer({
    onWarn: () => {
      // Warning state driven by isWarning flag
    },
    onLogout: handleLogout,
  });

  // Route protection: redirect unauthenticated users to /login, redirect admins to /admin/dashboard
  // Exception: admins may visit /portal/profile to change their password
  useEffect(() => {
    if (!session) {
      navigate({ to: "/login" });
    } else if (session.role === "admin" && currentPath !== "/portal/profile") {
      navigate({ to: "/admin/dashboard" });
    }
  }, [session, navigate, currentPath]);

  // Mid-session expiry check — poll every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const current = getSession();
      if (!current) {
        clearSession();
        navigate({ to: "/login" });
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [clearSession, navigate]);

  function handleManualLogout() {
    clearSession();
    navigate({ to: "/login" });
  }

  // Don't render portal content while redirecting
  // Exception: admins may access /portal/profile to change their password
  if (
    !session ||
    (session.role === "admin" && currentPath !== "/portal/profile")
  )
    return null;

  return (
    <div className="min-h-screen" style={{ background: "#0F172A" }}>
      {/* Session timeout warning modal */}
      <SessionTimeoutModal
        isOpen={isWarning}
        timeRemaining={timeRemaining}
        onStayLoggedIn={resetTimer}
      />

      {/* ===== SIDEBAR (desktop only) ===== */}
      <aside
        data-ocid="portal.sidebar.panel"
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen z-40"
        style={{
          width: "240px",
          background: "#0F172A",
          borderRight: "1px solid rgba(34,197,94,0.1)",
        }}
      >
        {/* Wordmark */}
        <div style={{ padding: "24px" }}>
          <span
            style={{
              fontSize: "20px",
              letterSpacing: "0.15em",
              fontWeight: 700,
              color: "#22C55E",
              display: "block",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              textShadow:
                "0 0 6px rgba(94,240,138,0.5), 0 0 20px rgba(71,85,105,0.3)",
              marginBottom: "4px",
            }}
          >
            <span className="font-medium text-white">IMPERIDOME</span>
          </span>
          <span
            style={{
              display: "inline-block",
              background: "rgba(34,197,94,0.08)",
              color: "#22C55E",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              padding: "2px 8px",
              borderRadius: "4px",
              textTransform: "uppercase" as const,
              border: "1px solid rgba(94,240,138,0.25)",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >
            <span className="font-medium text-white">Client Portal</span>
          </span>
        </div>

        {/* Nav links */}
        <nav
          className="flex-1 overflow-y-auto"
          style={{
            padding: "0 12px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-ocid={item.ocid}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: isActive ? "rgba(94,240,138,0.1)" : "transparent",
                  color: isActive ? "#22C55E" : "#7A7D90",
                  fontSize: "14px",
                  fontWeight: isActive ? 500 : 400,
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                  fontFamily: isActive
                    ? "'JetBrains Mono', 'Fira Code', monospace"
                    : undefined,
                  borderLeft: isActive
                    ? "3px solid #22C55E"
                    : "3px solid transparent",
                }}
              >
                <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>
                  {item.icon}
                </span>
                <span className="font-medium text-white">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: email + logout */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid rgba(34,197,94,0.08)",
          }}
        >
          <p
            style={{
              color: "#7A7D90",
              fontSize: "12px",
              marginBottom: "8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >
            {session.email}
          </p>
          <button
            type="button"
            onClick={handleManualLogout}
            data-ocid="portal.logout.button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#EF4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            <LogOut size={12} />
            <EditableText
              textKey="portal.logout.label"
              defaultText="Log Out"
              as="span"
            />
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT (offset by sidebar on desktop) ===== */}
      <div className="md:ml-[240px] flex flex-col min-h-screen">
        {/* Header bar */}
        <header
          data-ocid="portal.header.panel"
          className="sticky top-0 z-30"
          style={{
            height: "64px",
            background: "#0F172A",
            borderBottom: "1px solid rgba(71,85,105,0.3)",
            boxShadow: "0 2px 20px rgba(94,240,138,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <h1
            className="font-bold"
            style={{
              color: "#22C55E",
              fontSize: "18px",
              margin: 0,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              letterSpacing: "0.06em",
              textShadow: "0 0 8px rgba(94,240,138,0.4)",
            }}
          >
            <span className="font-medium text-white">{pageTitle}</span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                color: "#22C55E",
                fontSize: "14px",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                opacity: 0.8,
              }}
            >
              {session.firstName}
            </span>
            <button
              type="button"
              data-ocid="portal.notifications.button"
              aria-label="Notifications"
              onClick={() => navigate({ to: "/portal/messages" })}
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
        </header>

        {/* Page content */}
        <main
          className="flex-1"
          style={{ padding: "20px 16px 80px" }}
          data-ocid="portal.main.content"
        >
          {children}
        </main>
        {/* Footer — hidden on mobile (bottom tab bar takes priority), visible md+ */}
        <div className="hidden md:block">
          <Footer />
        </div>
        {/* Footer — mobile: shown above tab bar padding, compact */}
        <div className="md:hidden" style={{ paddingBottom: "60px" }}>
          <Footer />
        </div>
      </div>

      {/* ===== BOTTOM TAB BAR (mobile only) ===== */}
      <nav
        data-ocid="portal.tab_bar.panel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={
          {
            background: "#0F172A",
            borderTop: "1px solid rgba(71,85,105,0.3)",
            display: "flex",
            alignItems: "stretch",
            overflowX: "auto",
            scrollbarWidth: "none" as const,
            WebkitOverflowScrolling: "touch" as const,
            msOverflowStyle: "none" as const,
            minHeight: "60px",
          } as CSSProperties
        }
      >
        <style>{`
          [data-ocid="portal.tab_bar.panel"]::-webkit-scrollbar { display: none; }
        `}</style>
        {tabItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-ocid={item.tabOcid}
              style={{
                flexShrink: 0,
                minWidth: "50px",
                minHeight: "52px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                padding: "0 10px",
                color: isActive ? "#22C55E" : "#7A7D90",
                textDecoration: "none",
                transition: "color 0.15s",
                borderBottom: isActive
                  ? "2px solid #22C55E"
                  : "2px solid transparent",
                boxShadow: isActive ? "0 2px 8px rgba(34,197,94,0.1)" : "none",
              }}
            >
              {item.icon}
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  fontFamily: isActive
                    ? "'JetBrains Mono', 'Fira Code', monospace"
                    : undefined,
                  letterSpacing: isActive ? "0.05em" : undefined,
                }}
              >
                <span className="font-medium text-white">
                  {item.tabLabel ?? item.label}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
