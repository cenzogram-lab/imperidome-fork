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
import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
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
    navigate({ to: "/login" as any });
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
      navigate({ to: "/login" as any });
    } else if (session.role === "admin" && currentPath !== "/portal/profile") {
      navigate({ to: "/admin/dashboard" as any });
    }
  }, [session, navigate, currentPath]);

  // Mid-session expiry check — poll every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getSession();
      if (!current) {
        clearSession();
        navigate({ to: "/login" as any });
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [clearSession, navigate]);

  function handleManualLogout() {
    clearSession();
    navigate({ to: "/login" as any });
  }

  // Don't render portal content while redirecting
  // Exception: admins may access /portal/profile to change their password
  if (
    !session ||
    (session.role === "admin" && currentPath !== "/portal/profile")
  )
    return null;

  return (
    <div className="min-h-screen" style={{ background: "#0A0B14" }}>
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
          background: "rgba(14,16,32,1)",
          borderRight: "1px solid #1C1F33",
        }}
      >
        {/* Wordmark */}
        <div style={{ padding: "24px" }}>
          <span
            className="text-white font-bold"
            style={{ fontSize: "20px", letterSpacing: "0.15em" }}
          >
            <EditableText
              textKey="portal.sidebar.wordmark"
              defaultText="Imperidome"
              as="span"
            />
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
                  color: isActive ? "#5EF08A" : "#7A7D90",
                  fontSize: "14px",
                  fontWeight: isActive ? 500 : 400,
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>
                  {item.icon}
                </span>
                <EditableText
                  textKey={item.labelKey}
                  defaultText={item.label}
                  as="span"
                />
              </Link>
            );
          })}
        </nav>

        {/* Bottom: email + logout */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid #1C1F33",
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
            background: "#0A0B14",
            borderBottom: "1px solid #1C1F33",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <h1
            className="font-bold"
            style={{ color: "#EEF0F8", fontSize: "18px", margin: 0 }}
          >
            {pageTitle}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#7A7D90", fontSize: "14px" }}>
              {session.firstName}
            </span>
            <button
              type="button"
              data-ocid="portal.notifications.button"
              aria-label="Notifications"
              onClick={() => navigate({ to: "/portal/dashboard" as any })}
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
      </div>

      {/* ===== BOTTOM TAB BAR (mobile only) ===== */}
      <nav
        data-ocid="portal.tab_bar.panel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={
          {
            background: "rgba(14,16,32,1)",
            borderTop: "1px solid #1C1F33",
            display: "flex",
            alignItems: "stretch",
            overflowX: "auto",
            scrollbarWidth: "none" as const,
            WebkitOverflowScrolling: "touch" as const,
            msOverflowStyle: "none" as const,
            minHeight: "60px",
          } as React.CSSProperties
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
                color: isActive ? "#5EF08A" : "#7A7D90",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              {item.icon}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: isActive ? 500 : 400,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {item.tabLabelKey ? (
                  <EditableText
                    textKey={item.tabLabelKey}
                    defaultText={item.tabLabel ?? item.label}
                    as="span"
                  />
                ) : (
                  item.tabLabel
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
