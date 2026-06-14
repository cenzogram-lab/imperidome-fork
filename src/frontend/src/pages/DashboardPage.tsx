import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  FileEdit,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Lock,
  LogOut,
  Plug,
  Settings,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect, useState } from "react";
import { create } from "zustand";
import PerformanceSnapshot from "../components/PerformanceSnapshot";
import TypewriterText from "../components/TypewriterText";
import { useActor } from "../hooks/useActor";

// ─── Tab Store ────────────────────────────────────────────────────────────────
type Tab =
  | "overview"
  | "myproject"
  | "invoices"
  | "editrequests"
  | "profile"
  | "content-editor"
  | "engine-room"
  | "blog-manager";

interface DashboardStore {
  activeTab: Tab;
  setTab: (tab: Tab) => void;
}

const useDashboard = create<DashboardStore>((set) => ({
  activeTab: "overview",
  setTab: (tab) => set({ activeTab: tab }),
}));

// ─── Tier Store ───────────────────────────────────────────────────────────────
type TierName =
  | "Speedy Basic"
  | "Speedy Booking"
  | "Speedy Storefronts"
  | "Stay Sharp"
  | "Stay Ahead"
  | "Full Partner"
  | "Enterprise Scale";

interface TierStore {
  activeTier: TierName;
  setTier: (tier: TierName) => void;
}

const useTierStore = create<TierStore>((set) => ({
  activeTier: "Speedy Basic",
  setTier: (tier) => set({ activeTier: tier }),
}));

// ─── Tier Pills Data ──────────────────────────────────────────────────────────
const TIER_PILLS: { label: TierName; price: string }[] = [
  { label: "Speedy Basic", price: "$19" },
  { label: "Speedy Booking", price: "$39" },
  { label: "Speedy Storefronts", price: "$49" },
  { label: "Stay Sharp", price: "$89" },
  { label: "Stay Ahead", price: "$249" },
  { label: "Full Partner", price: "$549" },
  { label: "Enterprise Scale", price: "$799" },
];

// ─── Sidebar Feature Items ────────────────────────────────────────────────────
interface FeatureItem {
  label: string;
  unlocked: boolean;
  upgradeMsg?: string;
}

const TIER_FEATURES: Record<TierName, FeatureItem[]> = {
  "Speedy Basic": [
    { label: "Content Editor", unlocked: true },
    {
      label: "Booking Calendar",
      unlocked: false,
      upgradeMsg: "Upgrade to Speedy Booking $39",
    },
    {
      label: "Inventory Manager",
      unlocked: false,
      upgradeMsg: "Upgrade to Speedy Booking $39",
    },
    {
      label: "Digital Menu",
      unlocked: false,
      upgradeMsg: "Upgrade to Speedy Booking $39",
    },
    {
      label: "Blog Hub",
      unlocked: false,
      upgradeMsg: "Upgrade to Speedy Booking $39",
    },
  ],
  "Speedy Booking": [
    { label: "Content Editor", unlocked: true },
    { label: "Engine Room", unlocked: true },
    {
      label: "Review Requests",
      unlocked: false,
      upgradeMsg: "Upgrade to Speedy Storefronts $49",
    },
    {
      label: "Advanced CRM",
      unlocked: false,
      upgradeMsg: "Upgrade to Speedy Storefronts $49",
    },
    {
      label: "E-Commerce",
      unlocked: false,
      upgradeMsg: "Upgrade to Speedy Storefronts $49",
    },
  ],
  "Speedy Storefronts": [
    { label: "Content Editor", unlocked: true },
    { label: "Engine Room", unlocked: true },
    {
      label: "Promo Codes",
      unlocked: false,
      upgradeMsg: "Upgrade to Stay Sharp $89",
    },
    {
      label: "Category Filters",
      unlocked: false,
      upgradeMsg: "Upgrade to Stay Sharp $89",
    },
    {
      label: "Abandoned Cart",
      unlocked: false,
      upgradeMsg: "Upgrade to Stay Sharp $89",
    },
  ],
  "Stay Sharp": [
    { label: "Content Editor", unlocked: true },
    { label: "Blog Manager", unlocked: true },
    {
      label: "Booking Engine",
      unlocked: false,
      upgradeMsg: "Upgrade to Stay Ahead $249",
    },
    {
      label: "Ordering System",
      unlocked: false,
      upgradeMsg: "Upgrade to Stay Ahead $249",
    },
    {
      label: "Email Sequences",
      unlocked: false,
      upgradeMsg: "Upgrade to Stay Ahead $249",
    },
  ],
  "Stay Ahead": [
    { label: "Content Editor", unlocked: true },
    { label: "Blog Manager", unlocked: true },
    { label: "Engine Room", unlocked: true },
    {
      label: "Promo Codes",
      unlocked: false,
      upgradeMsg: "Upgrade to Full Partner $549",
    },
    {
      label: "Multi-Location",
      unlocked: false,
      upgradeMsg: "Upgrade to Full Partner $549",
    },
  ],
  "Full Partner": [
    { label: "Content Editor", unlocked: true },
    { label: "Blog Manager", unlocked: true },
    { label: "Engine Room", unlocked: true },
    { label: "Promo Codes", unlocked: true },
    {
      label: "B2B Wholesale",
      unlocked: false,
      upgradeMsg: "Upgrade to Enterprise Scale $799",
    },
    {
      label: "Custom API",
      unlocked: false,
      upgradeMsg: "Upgrade to Enterprise Scale $799",
    },
  ],
  "Enterprise Scale": [
    { label: "Content Editor", unlocked: true },
    { label: "Blog Manager", unlocked: true },
    { label: "Engine Room", unlocked: true },
    { label: "Promo Codes", unlocked: true },
    { label: "B2B Wholesale", unlocked: true },
    { label: "Custom API", unlocked: true },
    { label: "Multi-Location", unlocked: true },
    { label: "Advanced CRM", unlocked: true },
  ],
};

// ─── Constants ────────────────────────────────────────────────────────────────
const GLASS = {
  background: "rgba(17,19,34,0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid #1C1F33",
  borderRadius: "12px",
  padding: "24px",
};

const navItems: { id: Tab | "logout"; icon: React.ReactNode; label: string }[] =
  [
    { id: "overview", icon: <LayoutDashboard size={18} />, label: "Overview" },
    {
      id: "content-editor",
      icon: <FileEdit size={18} />,
      label: "Content Editor",
    },
    { id: "engine-room", icon: <Settings size={18} />, label: "Engine Room" },
    { id: "myproject", icon: <FolderOpen size={18} />, label: "My Project" },
    { id: "invoices", icon: <FileText size={18} />, label: "Invoices" },
    { id: "editrequests", icon: <Edit size={18} />, label: "Edit Requests" },
    { id: "profile", icon: <User size={18} />, label: "Profile" },
    { id: "logout", icon: <LogOut size={18} />, label: "Logout" },
  ];

const _steps = ["Questionnaire", "Deposit", "Build", "Review", "Launch"];
const _stepStatus: ("done" | "current" | "future")[] = [
  "done",
  "done",
  "current",
  "future",
  "future",
];

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
interface UpgradeModalProps {
  msg: string;
  onClose: () => void;
}

function UpgradeModal({ msg, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();
  return (
    <div
      data-ocid="dashboard.modal"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          border: "none",
          cursor: "default",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          background: "rgba(17,19,34,0.97)",
          border: "1px solid #1C1F33",
          borderRadius: "12px",
          padding: "28px",
          maxWidth: "380px",
          width: "90%",
          position: "relative",
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          data-ocid="dashboard.close_button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            color: "#7A7D90",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          <X size={16} />
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              background: "rgba(94,240,138,0.1)",
              borderRadius: "8px",
              padding: "8px",
              display: "flex",
            }}
          >
            <Lock size={18} color="#5EF08A" />
          </div>
          <h3
            style={{
              color: "#EEF0F8",
              fontWeight: 700,
              fontSize: "16px",
              margin: 0,
            }}
          >
            Feature Locked
          </h3>
        </div>

        <p
          style={{
            color: "#7A7D90",
            fontSize: "14px",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          {msg}
        </p>

        <button
          type="button"
          data-ocid="dashboard.confirm_button"
          onClick={() => navigate({ to: "/intake" })}
          style={{
            background: "#5EF08A",
            color: "#0A0B14",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "11px 20px",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            width: "100%",
          }}
        >
          Upgrade Now
        </button>
      </motion.div>
    </div>
  );
}

// ─── Overview Sub-Components ──────────────────────────────────────────────────

const METRIC_CARDS = [
  { label: "Page Views", value: "1,247", change: "+12%" },
  { label: "Form Submissions", value: "34", change: "+8%" },
  { label: "Load Speed", value: "1.2s", change: "-5%" },
  { label: "Uptime", value: "99.97%", change: null },
];

function MetricCards() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "16px",
      }}
    >
      {METRIC_CARDS.map((m) => (
        <div
          key={m.label}
          style={{
            background: "rgba(17,19,34,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid #1C1F33",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <p
            style={{
              color: "#7A7D90",
              fontSize: "12px",
              margin: "0 0 8px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <TypewriterText text={m.label} as="span" speed={30} />
          </p>
          <p
            style={{
              color: "#EEF0F8",
              fontSize: "24px",
              fontWeight: 700,
              margin: "0 0 6px",
            }}
          >
            {m.value}
          </p>
          {m.change && (
            <span
              style={{
                color: "#5EF08A",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {m.change} ▲
            </span>
          )}
          {!m.change && (
            <span
              style={{ color: "#5EF08A", fontSize: "12px", fontWeight: 600 }}
            >
              ● Live
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

const TRAFFIC_POINTS = [40, 80, 60, 90, 70, 110, 95];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function TrafficChart() {
  const w = 300;
  const h = 80;
  const maxVal = Math.max(...TRAFFIC_POINTS);
  const pts = TRAFFIC_POINTS.map(
    (v, i) =>
      `${(i / (TRAFFIC_POINTS.length - 1)) * w},${h - (v / maxVal) * (h - 8)}`,
  ).join(" ");

  return (
    <div style={GLASS}>
      <p
        style={{
          color: "#7A7D90",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 16px",
        }}
      >
        Weekly Traffic
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: "100%", height: "80px" }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Weekly traffic chart"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="0"
            y1={h * t}
            x2={w}
            y2={h * t}
            stroke="#1C1F33"
            strokeWidth="1"
          />
        ))}
        <polyline
          points={pts}
          fill="none"
          stroke="#5EF08A"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "8px",
        }}
      >
        {DAYS.map((d) => (
          <span key={d} style={{ color: "#7A7D90", fontSize: "11px" }}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

const MOCK_LEADS = [
  { name: "Sarah M.", source: "Google Search", time: "2h ago" },
  { name: "James T.", source: "Facebook Ad", time: "5h ago" },
  { name: "Priya K.", source: "Referral", time: "1d ago" },
  { name: "Carlos R.", source: "Direct", time: "2d ago" },
  { name: "Wei L.", source: "Google Search", time: "3d ago" },
];

function RecentLeads() {
  return (
    <div style={{ ...GLASS, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1C1F33" }}>
        <p
          style={{
            color: "#7A7D90",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          Recent Leads
        </p>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Name", "Source", "Time"].map((h) => (
              <th
                key={h}
                style={{
                  color: "#7A7D90",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "10px 20px",
                  textAlign: "left",
                  fontWeight: 600,
                  borderBottom: "1px solid #1C1F33",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_LEADS.map((lead, i) => (
            <tr
              key={lead.name}
              data-ocid={`overview.leads.item.${i + 1}`}
              style={{ borderBottom: "1px solid #1C1F33" }}
            >
              <td
                style={{
                  color: "#EEF0F8",
                  padding: "12px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {lead.name}
              </td>
              <td
                style={{
                  color: "#7A7D90",
                  padding: "12px 20px",
                  fontSize: "13px",
                }}
              >
                {lead.source}
              </td>
              <td
                style={{
                  color: "#7A7D90",
                  padding: "12px 20px",
                  fontSize: "13px",
                }}
              >
                {lead.time}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const APPOINTMENTS = [
  { time: "9:00 AM", service: "Hair Consultation" },
  { time: "11:30 AM", service: "Color Treatment" },
  { time: "2:00 PM", service: "Blowout & Style" },
];

function TodayAppointments() {
  return (
    <div style={GLASS}>
      <p
        style={{
          color: "#7A7D90",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 16px",
        }}
      >
        Today's Appointments
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {APPOINTMENTS.map((a, i) => (
          <div
            key={a.time}
            data-ocid={`overview.appointments.item.${i + 1}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "10px 14px",
              background: "rgba(94,240,138,0.04)",
              border: "1px solid rgba(94,240,138,0.12)",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                color: "#5EF08A",
                fontWeight: 700,
                fontSize: "13px",
                minWidth: "72px",
              }}
            >
              {a.time}
            </span>
            <span style={{ color: "#EEF0F8", fontSize: "14px" }}>
              {a.service}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TRAFFIC_MONTHS = [
  3200, 3800, 4100, 3600, 4400, 4900, 5100, 4700, 5400, 5800, 6200, 6800,
];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function MonthlyTrendChart() {
  const w = 400;
  const h = 80;
  const maxVal = Math.max(...TRAFFIC_MONTHS);
  const pts = TRAFFIC_MONTHS.map(
    (v, i) =>
      `${(i / (TRAFFIC_MONTHS.length - 1)) * w},${h - (v / maxVal) * (h - 8)}`,
  ).join(" ");

  return (
    <div style={GLASS}>
      <p
        style={{
          color: "#7A7D90",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 16px",
        }}
      >
        Monthly Revenue Trend
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: "100%", height: "80px" }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Monthly revenue trend chart"
      >
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="0"
            y1={h * t}
            x2={w}
            y2={h * t}
            stroke="#1C1F33"
            strokeWidth="1"
          />
        ))}
        <polyline
          points={pts}
          fill="none"
          stroke="#5EF08A"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "8px",
        }}
      >
        {MONTH_LABELS.map((m) => (
          <span key={m} style={{ color: "#7A7D90", fontSize: "10px" }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Content ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const { activeTier } = useTierStore();

  const renderTierContent = () => {
    switch (activeTier) {
      case "Speedy Basic":
        return (
          <>
            <TrafficChart />
            <RecentLeads />
          </>
        );

      case "Speedy Booking":
        return (
          <>
            <TrafficChart />
            <TodayAppointments />
            <RecentLeads />
          </>
        );

      case "Speedy Storefronts":
        return (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "16px",
              }}
            >
              {[
                { label: "Gross Sales", value: "$1,247", sub: "this month" },
                { label: "Total Orders", value: "34", sub: "this month" },
                { label: "Visitors", value: "847", sub: "this month" },
              ].map((c) => (
                <div key={c.label} style={GLASS}>
                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: "12px",
                      margin: "0 0 8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {c.label}
                  </p>
                  <p
                    style={{
                      color: "#5EF08A",
                      fontSize: "28px",
                      fontWeight: 700,
                      margin: "0 0 4px",
                    }}
                  >
                    {c.value}
                  </p>
                  <span style={{ color: "#7A7D90", fontSize: "12px" }}>
                    {c.sub}
                  </span>
                </div>
              ))}
            </div>
            <TrafficChart />
          </>
        );

      case "Stay Sharp":
        return (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Bounce Rate */}
              <div style={GLASS}>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: "0 0 8px",
                  }}
                >
                  Bounce Rate
                </p>
                <p
                  style={{
                    color: "#EEF0F8",
                    fontSize: "32px",
                    fontWeight: 700,
                    margin: "0 0 6px",
                  }}
                >
                  42.3%
                </p>
                <span
                  style={{
                    color: "#F59E0B",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  +2.1% vs last week
                </span>
              </div>

              {/* Top Traffic Sources */}
              <div style={GLASS}>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: "0 0 14px",
                  }}
                >
                  Top Traffic Sources
                </p>
                {[
                  { label: "Google Organic", pct: 48 },
                  { label: "Direct", pct: 22 },
                  { label: "Referral", pct: 15 },
                  { label: "Social", pct: 10 },
                  { label: "Other", pct: 5 },
                ].map((s) => (
                  <div key={s.label} style={{ marginBottom: "10px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ color: "#EEF0F8", fontSize: "13px" }}>
                        {s.label}
                      </span>
                      <span
                        style={{
                          color: "#5EF08A",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        {s.pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "4px",
                        background: "#1C1F33",
                        borderRadius: "9999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${s.pct}%`,
                          background: "#5EF08A",
                          borderRadius: "9999px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                type="button"
                data-ocid="overview.export_leads_button"
                style={{
                  background: "#5EF08A",
                  color: "#061209",
                  fontWeight: 700,
                  borderRadius: "8px",
                  padding: "11px 24px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Export Lead Database
              </button>
            </div>
          </>
        );

      case "Stay Ahead":
        return (
          <>
            {/* Revenue */}
            <div style={GLASS}>
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 8px",
                }}
              >
                Revenue
              </p>
              <p
                style={{
                  color: "#5EF08A",
                  fontSize: "36px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                $8,420
                <span
                  style={{
                    color: "#7A7D90",
                    fontSize: "14px",
                    fontWeight: 400,
                    marginLeft: "8px",
                  }}
                >
                  this month
                </span>
              </p>
            </div>

            {/* Sub-stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "16px",
              }}
            >
              {[
                { label: "Appointments", value: "47" },
                { label: "Orders", value: "23" },
                { label: "Avg Order Value", value: "$182" },
              ].map((c) => (
                <div key={c.label} style={GLASS}>
                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: "12px",
                      margin: "0 0 8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {c.label}
                  </p>
                  <p
                    style={{
                      color: "#EEF0F8",
                      fontSize: "28px",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {c.value}
                  </p>
                </div>
              ))}
            </div>

            <MonthlyTrendChart />
          </>
        );

      case "Full Partner":
        return (
          <>
            {/* MRR + Churn */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div style={GLASS}>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "12px",
                    margin: "0 0 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  MRR
                </p>
                <p
                  style={{
                    color: "#5EF08A",
                    fontSize: "30px",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  $4,890
                </p>
              </div>
              <div style={GLASS}>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "12px",
                    margin: "0 0 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Churn Rate
                </p>
                <p
                  style={{
                    color: "#EEF0F8",
                    fontSize: "30px",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  1.2%
                </p>
              </div>
            </div>

            {/* Top Selling Items */}
            <div style={GLASS}>
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 16px",
                }}
              >
                Top Selling Items
              </p>
              {[
                { item: "Classic Cut", sales: 89 },
                { item: "Color Treatment", sales: 64 },
                { item: "Beard Trim", sales: 51 },
                { item: "Blowout", sales: 43 },
                { item: "Deep Condition", sales: 38 },
              ].map((r, i) => (
                <div
                  key={r.item}
                  data-ocid={`overview.top_items.item.${i + 1}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < 4 ? "1px solid #1C1F33" : "none",
                  }}
                >
                  <span style={{ color: "#EEF0F8", fontSize: "14px" }}>
                    {r.item}
                  </span>
                  <span
                    style={{
                      color: "#5EF08A",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    ×{r.sales}
                  </span>
                </div>
              ))}
            </div>

            {/* CLV */}
            <div style={GLASS}>
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "12px",
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Customer Lifetime Value
              </p>
              <p
                style={{
                  color: "#EEF0F8",
                  fontSize: "30px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                $1,240
              </p>
            </div>
          </>
        );

      case "Enterprise Scale":
        return (
          <>
            {/* MRR + Churn */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div style={GLASS}>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "12px",
                    margin: "0 0 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  MRR
                </p>
                <p
                  style={{
                    color: "#5EF08A",
                    fontSize: "30px",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  $4,890
                </p>
              </div>
              <div style={GLASS}>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "12px",
                    margin: "0 0 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Churn Rate
                </p>
                <p
                  style={{
                    color: "#EEF0F8",
                    fontSize: "30px",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  1.2%
                </p>
              </div>
            </div>

            {/* Top Selling Items */}
            <div style={GLASS}>
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 16px",
                }}
              >
                Top Selling Items
              </p>
              {[
                { item: "Classic Cut", sales: 89 },
                { item: "Color Treatment", sales: 64 },
                { item: "Beard Trim", sales: 51 },
                { item: "Blowout", sales: 43 },
                { item: "Deep Condition", sales: 38 },
              ].map((r, i) => (
                <div
                  key={r.item}
                  data-ocid={`overview.top_items.item.${i + 1}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < 4 ? "1px solid #1C1F33" : "none",
                  }}
                >
                  <span style={{ color: "#EEF0F8", fontSize: "14px" }}>
                    {r.item}
                  </span>
                  <span
                    style={{
                      color: "#5EF08A",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    ×{r.sales}
                  </span>
                </div>
              ))}
            </div>

            {/* CLV */}
            <div style={GLASS}>
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "12px",
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Customer Lifetime Value
              </p>
              <p
                style={{
                  color: "#EEF0F8",
                  fontSize: "30px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                $1,240
              </p>
            </div>

            {/* Custom Reporting */}
            <div style={{ ...GLASS, padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #1C1F33",
                }}
              >
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: 0,
                  }}
                >
                  Custom Reporting
                </p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Report", "Period", "Status"].map((h) => (
                      <th
                        key={h}
                        style={{
                          color: "#7A7D90",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          padding: "10px 20px",
                          textAlign: "left",
                          fontWeight: 600,
                          borderBottom: "1px solid #1C1F33",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      report: "Revenue Breakdown",
                      period: "Mar 2026",
                      status: "Ready",
                    },
                    {
                      report: "Lead Attribution",
                      period: "Q1 2026",
                      status: "Ready",
                    },
                    {
                      report: "Churn Analysis",
                      period: "Mar 2026",
                      status: "Processing",
                    },
                  ].map((row, i) => (
                    <tr
                      key={row.report}
                      data-ocid={`overview.reports.item.${i + 1}`}
                      style={{ borderBottom: "1px solid #1C1F33" }}
                    >
                      <td
                        style={{
                          color: "#EEF0F8",
                          padding: "12px 20px",
                          fontSize: "14px",
                        }}
                      >
                        {row.report}
                      </td>
                      <td
                        style={{
                          color: "#7A7D90",
                          padding: "12px 20px",
                          fontSize: "13px",
                        }}
                      >
                        {row.period}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span
                          style={{
                            background:
                              row.status === "Ready"
                                ? "rgba(94,240,138,0.12)"
                                : "rgba(245,158,11,0.12)",
                            color:
                              row.status === "Ready" ? "#5EF08A" : "#F59E0B",
                            borderRadius: "9999px",
                            padding: "2px 10px",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PerformanceSnapshot />
      <MetricCards />
      {renderTierContent()}
    </div>
  );
}

function MyProjectTab() {
  return (
    <div style={GLASS}>
      <h3
        style={{
          color: "#EEF0F8",
          fontWeight: 700,
          fontSize: "18px",
          marginBottom: "4px",
        }}
      >
        Enterprise Scale — Custom Build
      </h3>
      <p style={{ color: "#7A7D90", fontSize: "13px", marginBottom: "20px" }}>
        Currently in Build phase
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid #1C1F33",
          }}
        >
          <span style={{ color: "#7A7D90", fontSize: "13px" }}>
            Estimated Launch
          </span>
          <span style={{ color: "#EEF0F8", fontSize: "13px", fontWeight: 600 }}>
            June 15, 2026
          </span>
        </div>
        <div style={{ padding: "12px 0", borderBottom: "1px solid #1C1F33" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "#7A7D90", fontSize: "13px" }}>
              Revisions Used
            </span>
            <span
              style={{ color: "#EEF0F8", fontSize: "13px", fontWeight: 600 }}
            >
              2 / 5
            </span>
          </div>
          <div
            style={{
              height: "6px",
              background: "#1C1F33",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "40%",
                background: "#5EF08A",
                borderRadius: "9999px",
              }}
            />
          </div>
        </div>
        <div style={{ padding: "12px 0", borderBottom: "1px solid #1C1F33" }}>
          <span
            style={{
              color: "#7A7D90",
              fontSize: "13px",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Build Details
          </span>
          <span style={{ color: "#EEF0F8", fontSize: "14px" }}>
            Custom design · AI integration · Stripe checkout · CMS
          </span>
        </div>
      </div>
    </div>
  );
}

function InvoicesTab() {
  return (
    <div style={{ ...GLASS, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1C1F33" }}>
        <h3
          style={{
            color: "#EEF0F8",
            fontWeight: 700,
            fontSize: "16px",
            margin: 0,
          }}
        >
          Invoices
        </h3>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Invoice", "Description", "Amount", "Status", "Date"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      color: "#7A7D90",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "12px 24px",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: "1px solid #1C1F33" }}>
              <td
                style={{
                  color: "#EEF0F8",
                  padding: "16px 24px",
                  fontSize: "14px",
                }}
              >
                INV-001
              </td>
              <td
                style={{
                  color: "#EEF0F8",
                  padding: "16px 24px",
                  fontSize: "14px",
                }}
              >
                Deposit (50%)
              </td>
              <td
                style={{
                  color: "#EEF0F8",
                  padding: "16px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                $7,000
              </td>
              <td style={{ padding: "16px 24px" }}>
                <span
                  style={{
                    background: "rgba(94,240,138,0.15)",
                    color: "#5EF08A",
                    borderRadius: "9999px",
                    padding: "3px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Paid
                </span>
              </td>
              <td
                style={{
                  color: "#7A7D90",
                  padding: "16px 24px",
                  fontSize: "13px",
                }}
              >
                Mar 5, 2026
              </td>
            </tr>
            <tr style={{ borderTop: "1px solid #1C1F33" }}>
              <td
                style={{
                  color: "#EEF0F8",
                  padding: "16px 24px",
                  fontSize: "14px",
                }}
              >
                INV-002
              </td>
              <td
                style={{
                  color: "#EEF0F8",
                  padding: "16px 24px",
                  fontSize: "14px",
                }}
              >
                Final Balance (50%)
              </td>
              <td
                style={{
                  color: "#EEF0F8",
                  padding: "16px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                $7,000
              </td>
              <td style={{ padding: "16px 24px" }}>
                <span
                  style={{
                    background: "rgba(245,158,11,0.15)",
                    color: "#F59E0B",
                    borderRadius: "9999px",
                    padding: "3px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Pending
                </span>
              </td>
              <td
                style={{
                  color: "#7A7D90",
                  padding: "16px 24px",
                  fontSize: "13px",
                }}
              >
                Due Jun 15, 2026
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditRequestsTab() {
  const requests = [
    { title: "Logo update", status: "Completed", date: "Submitted Mar 10" },
    {
      title: "Hero copy revision",
      status: "In Review",
      date: "Submitted Mar 18",
    },
    { title: "Add FAQ section", status: "Pending", date: "Submitted Mar 20" },
  ];
  const badgeStyle = (status: string) => {
    if (status === "Completed")
      return { background: "rgba(94,240,138,0.15)", color: "#5EF08A" };
    if (status === "In Review")
      return { background: "rgba(59,130,246,0.15)", color: "#60A5FA" };
    return { background: "rgba(245,158,11,0.15)", color: "#F59E0B" };
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          data-ocid="edit_requests.open_modal_button"
          style={{
            background: "#5EF08A",
            color: "#061209",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "10px 20px",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          + New Request
        </button>
      </div>
      <div style={{ ...GLASS, padding: 0, overflow: "hidden" }}>
        {requests.map((req, i) => (
          <div
            key={req.title}
            data-ocid={`edit_requests.item.${i + 1}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom:
                i < requests.length - 1 ? "1px solid #1C1F33" : "none",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <span
                style={{
                  color: "#EEF0F8",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "block",
                }}
              >
                {req.title}
              </span>
              <span style={{ color: "#7A7D90", fontSize: "12px" }}>
                {req.date}
              </span>
            </div>
            <span
              style={{
                ...badgeStyle(req.status),
                borderRadius: "9999px",
                padding: "3px 12px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {req.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab() {
  return (
    <div style={GLASS}>
      <h3
        style={{
          color: "#EEF0F8",
          fontWeight: 700,
          fontSize: "18px",
          marginBottom: "20px",
        }}
      >
        Profile
      </h3>
      {[
        { label: "Name", value: "Alex Johnson" },
        { label: "Email", value: "alex@acmecorp.com" },
        { label: "Company", value: "Acme Corp" },
        { label: "Plan", value: "Enterprise Scale" },
        { label: "Member Since", value: "March 1, 2026" },
      ].map((row) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid #1C1F33",
          }}
        >
          <span style={{ color: "#7A7D90", fontSize: "13px" }}>
            {row.label}
          </span>
          <span style={{ color: "#EEF0F8", fontSize: "14px", fontWeight: 500 }}>
            {row.value}
          </span>
        </div>
      ))}
      <div style={{ marginTop: "20px" }}>
        <button
          type="button"
          data-ocid="profile.edit_button"
          style={{
            background: "transparent",
            color: "#EEF0F8",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "9px 20px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}

// ─── Content Editor Tab ───────────────────────────────────────────────────────
function ContentEditorTab() {
  const { activeTier } = useTierStore();

  const pageOptions: Record<string, string[]> = {
    "Speedy Basic": ["Home"],
    "Speedy Booking": ["Home", "Booking Portal"],
    "Speedy Storefronts": ["Home", "Store", "Checkout"],
    "Stay Sharp": ["Home", "About", "Blog", "Contact"],
    "Stay Ahead": ["Home", "About", "Blog", "Contact", "Booking", "Services"],
    "Full Partner": [
      "Home",
      "About",
      "Blog",
      "Contact",
      "Booking",
      "Services",
      "Store",
      "Checkout",
    ],
    "Enterprise Scale": [
      "Home",
      "About",
      "Blog",
      "Contact",
      "Booking",
      "Services",
      "Store",
      "Checkout",
      "Careers",
      "Case Studies",
    ],
  };

  const pages = pageOptions[activeTier] ?? ["Home"];
  const isBasic = activeTier === "Speedy Basic";

  const [selectedPage, setSelectedPage] = useState(pages[0]);
  const [fields, setFields] = useState<
    Record<string, Record<string, string | boolean>>
  >({});

  const getField = (field: string, defaultVal: string | boolean = "") => {
    return fields[selectedPage]?.[field] ?? defaultVal;
  };
  const setField = (field: string, value: string | boolean) => {
    setFields((prev) => ({
      ...prev,
      [selectedPage]: { ...(prev[selectedPage] ?? {}), [field]: value },
    }));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(19,21,36,1)",
    border: "1px solid #1C1F33",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#EEF0F8",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#7A7D90",
    fontSize: "13px",
    fontWeight: 500,
    marginBottom: "6px",
  };

  return (
    <div>
      <h2
        style={{
          color: "#EEF0F8",
          fontSize: "20px",
          fontWeight: 700,
          marginBottom: "6px",
        }}
      >
        Content Editor
      </h2>
      <p style={{ color: "#7A7D90", fontSize: "14px", marginBottom: "24px" }}>
        Edit the content displayed on your site pages.
      </p>

      {isBasic && (
        <div
          style={{
            background: "rgba(94,240,138,0.05)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            color: "#7A7D90",
            fontSize: "13px",
          }}
        >
          Self-managed. No agency edits included in your plan.
        </div>
      )}

      {!isBasic && (
        <div style={{ marginBottom: "24px" }}>
          <label htmlFor="ce-page" style={labelStyle}>
            Select Page
          </label>
          <select
            id="ce-page"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {pages.map((p) => (
              <option key={p} value={p} style={{ background: "#0A0B14" }}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        style={{
          ...GLASS,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div>
          <label htmlFor="ce-headline" style={labelStyle}>
            Hero Headline
          </label>
          <input
            id="ce-headline"
            type="text"
            placeholder="e.g. Welcome to Our Business"
            value={getField("heroHeadline") as string}
            onChange={(e) => setField("heroHeadline", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="ce-subheadline" style={labelStyle}>
            Hero Sub-headline
          </label>
          <textarea
            id="ce-subheadline"
            placeholder="e.g. We help businesses grow with smart solutions."
            value={getField("heroSub") as string}
            onChange={(e) => setField("heroSub", e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div>
          <label htmlFor="ce-about" style={labelStyle}>
            About Section
          </label>
          <textarea
            id="ce-about"
            placeholder="Brief description of your business..."
            value={getField("about") as string}
            onChange={(e) => setField("about", e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div>
          <label htmlFor="ce-email" style={labelStyle}>
            Contact Email
          </label>
          <input
            id="ce-email"
            type="email"
            placeholder="hello@yourbusiness.com"
            value={getField("contactEmail") as string}
            onChange={(e) => setField("contactEmail", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="ce-phone" style={labelStyle}>
            Business Phone
          </label>
          <input
            id="ce-phone"
            type="tel"
            placeholder="(555) 000-0000"
            value={getField("phone") as string}
            onChange={(e) => setField("phone", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="ce-address" style={labelStyle}>
            Business Address
          </label>
          <input
            id="ce-address"
            type="text"
            placeholder="123 Main St, City, State 00000"
            value={getField("address") as string}
            onChange={(e) => setField("address", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{ color: "#EEF0F8", fontSize: "14px", fontWeight: 500 }}
            >
              Show Business Hours
            </div>
            <div
              style={{ color: "#7A7D90", fontSize: "12px", marginTop: "2px" }}
            >
              Display your hours of operation on the page
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setField("showHours", !(getField("showHours", false) as boolean))
            }
            style={{
              width: "44px",
              height: "24px",
              borderRadius: "12px",
              border: "none",
              background: getField("showHours", false) ? "#5EF08A" : "#1C1F33",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "3px",
                left: getField("showHours", false) ? "23px" : "3px",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>
      </div>

      <button
        type="button"
        data-ocid="content_editor.save_button"
        onClick={() => {
          alert("Changes saved! Your site will update within 5 minutes.");
        }}
        style={{
          display: "block",
          width: "100%",
          marginTop: "24px",
          padding: "14px",
          background: "#5EF08A",
          color: "#0A0B14",
          border: "none",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Save Changes
      </button>
      <p
        style={{
          textAlign: "center",
          color: "#7A7D90",
          fontSize: "12px",
          marginTop: "10px",
        }}
      >
        Changes go live within 5 minutes.
      </p>
    </div>
  );
}

// ─── Engine Room Tab ──────────────────────────────────────────────────────────
function EngineRoomTab() {
  const { activeTier } = useTierStore();
  const navigate = useNavigate();
  const [inventoryItems, setInventoryItems] = useState([
    {
      id: 1,
      name: "Classic T-Shirt",
      price: "$24.99",
      stock: 45,
      inStock: true,
    },
    {
      id: 2,
      name: "Premium Hoodie",
      price: "$59.99",
      stock: 12,
      inStock: true,
    },
    { id: 3, name: "Baseball Cap", price: "$18.99", stock: 0, inStock: false },
    {
      id: 4,
      name: "Canvas Tote Bag",
      price: "$14.99",
      stock: 78,
      inStock: true,
    },
    { id: 5, name: "Phone Case", price: "$19.99", stock: 0, inStock: false },
  ]);

  const UpgradeOverlay = ({ message }: { message: string }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 300,
      }}
    >
      <div
        style={{
          background: "rgba(17,19,34,0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid #1C1F33",
          borderRadius: 16,
          padding: "48px 40px",
          textAlign: "center",
          maxWidth: 480,
        }}
      >
        <div style={{ color: "#9CA3AF", fontSize: 48, marginBottom: 16 }}>
          🔒
        </div>
        <h3
          style={{
            color: "#EEF0F8",
            fontWeight: 700,
            fontSize: 22,
            marginBottom: 12,
          }}
        >
          Engine Room Locked
        </h3>
        <p style={{ color: "#9CA3AF", marginBottom: 28, lineHeight: 1.6 }}>
          {message}
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/intake" })}
          style={{
            background: "#5EF08A",
            color: "#0A0B14",
            fontWeight: 700,
            border: "none",
            borderRadius: 10,
            padding: "12px 32px",
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );

  if (activeTier === "Speedy Basic") {
    return (
      <UpgradeOverlay message="Upgrade to Speedy Booking $39/mo to unlock the Scheduling Engine." />
    );
  }

  if (activeTier === "Stay Sharp") {
    return (
      <UpgradeOverlay message="Upgrade to Stay Ahead $249/mo to unlock the full Engine Room." />
    );
  }

  if (activeTier === "Speedy Booking") {
    const mockAppointments = [
      {
        id: 1,
        time: "10:00 AM",
        service: "Website Consultation",
        client: "John D.",
      },
      { id: 2, time: "1:30 PM", service: "SEO Review", client: "Sarah M." },
      {
        id: 3,
        time: "3:00 PM",
        service: "Design Walkthrough",
        client: "Carlos R.",
      },
    ];
    const hours = [
      "9am",
      "10am",
      "11am",
      "12pm",
      "1pm",
      "2pm",
      "3pm",
      "4pm",
      "5pm",
      "6pm",
    ];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ color: "#EEF0F8", fontWeight: 700, fontSize: 20 }}>
            Scheduling Engine
          </h3>
          <button
            type="button"
            style={{
              background: "#5EF08A",
              color: "#0A0B14",
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            + Add Appointment
          </button>
        </div>
        <div
          style={{
            background: "rgba(17,19,34,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid #1C1F33",
            borderRadius: 12,
            padding: 20,
            overflowX: "auto",
          }}
        >
          <h4 style={{ color: "#EEF0F8", fontWeight: 600, marginBottom: 16 }}>
            Weekly Availability
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px repeat(7, 1fr)",
              gap: 4,
              minWidth: 600,
            }}
          >
            <div />
            {days.map((d) => (
              <div
                key={d}
                style={{
                  color: "#9CA3AF",
                  fontSize: 12,
                  textAlign: "center",
                  fontWeight: 600,
                  padding: "4px 0",
                }}
              >
                {d}
              </div>
            ))}
            {hours.map((h) => (
              <Fragment key={h}>
                <div
                  style={{
                    color: "#9CA3AF",
                    fontSize: 12,
                    paddingRight: 8,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {h}
                </div>
                {days.map((d) => (
                  <div
                    key={d + h}
                    style={{
                      height: 36,
                      borderRadius: 6,
                      background:
                        (h === "10am" && d === "Mon") ||
                        (h === "1pm" && d === "Tue") ||
                        (h === "3pm" && d === "Wed")
                          ? "rgba(94,240,138,0.15)"
                          : "rgba(28,31,51,0.6)",
                      border: "1px solid #1C1F33",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
        <div
          style={{
            background: "rgba(17,19,34,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid #1C1F33",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h4 style={{ color: "#EEF0F8", fontWeight: 600, marginBottom: 16 }}>
            Today's Appointments
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mockAppointments.map((appt) => (
              <div
                key={appt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "rgba(28,31,51,0.6)",
                  borderRadius: 8,
                  border: "1px solid #1C1F33",
                }}
              >
                <div>
                  <span
                    style={{
                      color: "#5EF08A",
                      fontWeight: 600,
                      marginRight: 12,
                    }}
                  >
                    {appt.time}
                  </span>
                  <span style={{ color: "#EEF0F8" }}>{appt.service}</span>
                  <span style={{ color: "#9CA3AF", marginLeft: 8 }}>
                    — {appt.client}
                  </span>
                </div>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    color: "#EF4444",
                    border: "1px solid #EF4444",
                    borderRadius: 6,
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTier === "Speedy Storefronts") {
    const used = 23;
    const cap = 30;
    const atCap = used >= cap;
    const pct = (used / cap) * 100;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ color: "#EEF0F8", fontWeight: 700, fontSize: 20 }}>
            Inventory Manager
          </h3>
          <button
            type="button"
            disabled={atCap}
            style={{
              background: atCap ? "#1C1F33" : "#5EF08A",
              color: atCap ? "#9CA3AF" : "#0A0B14",
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              cursor: atCap ? "not-allowed" : "pointer",
            }}
          >
            + Add Item
          </button>
        </div>
        <div
          style={{
            background: "rgba(17,19,34,0.7)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${atCap ? "#F59E0B" : "#1C1F33"}`,
            borderRadius: 10,
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ color: "#EEF0F8", fontWeight: 600 }}>
              {used}/{cap} products used
            </span>
            <span style={{ color: "#9CA3AF", fontSize: 13 }}>
              {cap - used} remaining
            </span>
          </div>
          <div
            style={{
              background: "#1C1F33",
              borderRadius: 999,
              height: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#5EF08A",
                width: `${pct}%`,
                height: "100%",
                borderRadius: 999,
              }}
            />
          </div>
          {atCap && (
            <div
              style={{
                marginTop: 10,
                color: "#F59E0B",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              ⚠ Item Limit Reached — Upgrade to Tier 4A to add more products
            </div>
          )}
        </div>
        <div
          style={{
            background: "rgba(17,19,34,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid #1C1F33",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                {["Name", "Price", "Stock", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "#9CA3AF",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #1C1F33" }}>
                  <td style={{ padding: "12px 16px", color: "#EEF0F8" }}>
                    {item.name}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "#5EF08A",
                      fontWeight: 600,
                    }}
                  >
                    {item.price}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#9CA3AF" }}>
                    {item.stock}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setInventoryItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? { ...i, inStock: !i.inStock }
                              : i,
                          ),
                        )
                      }
                      style={{
                        background: item.inStock
                          ? "rgba(94,240,138,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: item.inStock ? "#5EF08A" : "#EF4444",
                        border: `1px solid ${item.inStock ? "#5EF08A" : "#EF4444"}`,
                        borderRadius: 6,
                        padding: "4px 12px",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {item.inStock ? "In Stock" : "Out of Stock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Stay Ahead, Full Partner, Enterprise Scale
  const isFullPartnerPlus =
    activeTier === "Full Partner" || activeTier === "Enterprise Scale";

  const baseCards = [
    {
      icon: "📊",
      title: "SEO Tools",
      desc: "Meta titles, descriptions, and keyword targets per page",
    },
    {
      icon: "⚡",
      title: "Speed Optimizer",
      desc: "Image compression, caching, and CDN configuration",
    },
    {
      icon: "🖥",
      title: "Integrations",
      desc: "Google Analytics, Facebook Pixel, Mailchimp, Zapier",
    },
    {
      icon: "🛡",
      title: "Backup Manager",
      desc: "Daily backups and one-click restore",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h3 style={{ color: "#EEF0F8", fontWeight: 700, fontSize: 20 }}>
        Engine Room
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {baseCards.map((card) => (
          <div
            key={card.title}
            style={{
              background: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid #1C1F33",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 12, fontSize: 24 }}>{card.icon}</div>
            <h4
              style={{
                color: "#EEF0F8",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              {card.title}
            </h4>
            <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.6 }}>
              {card.desc}
            </p>
          </div>
        ))}
        {isFullPartnerPlus && (
          <>
            <div
              style={{
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid #1C1F33",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ marginBottom: 12, fontSize: 24 }}>🏷</div>
              <h4
                style={{
                  color: "#EEF0F8",
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                Promo Code Engine
              </h4>
              <p
                style={{
                  color: "#9CA3AF",
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                Create and manage discount codes for your store.
              </p>
              <button
                type="button"
                style={{
                  background: "#5EF08A",
                  color: "#0A0B14",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                + Create Code
              </button>
            </div>
            <div
              style={{
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid #1C1F33",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ marginBottom: 12, fontSize: 24 }}>📦</div>
              <h4
                style={{
                  color: "#EEF0F8",
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                Product Capacity
              </h4>
              <div
                style={{
                  color: "#5EF08A",
                  fontSize: 28,
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                23{" "}
                <span
                  style={{ color: "#9CA3AF", fontSize: 16, fontWeight: 400 }}
                >
                  / 500
                </span>
              </div>
              <div
                style={{
                  background: "#1C1F33",
                  borderRadius: 999,
                  height: 8,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    background: "#5EF08A",
                    width: "4.6%",
                    height: "100%",
                    borderRadius: 999,
                  }}
                />
              </div>
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>
                477 product slots remaining
              </p>
            </div>
            <div
              style={{
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid #1C1F33",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ marginBottom: 12, fontSize: 24 }}>📍</div>
              <h4
                style={{
                  color: "#EEF0F8",
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 16,
                }}
              >
                Multi-Location
              </h4>
              {["New York", "Los Angeles", "Chicago"].map((loc, i) => (
                <div
                  key={loc}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <span style={{ color: "#EEF0F8", fontSize: 14 }}>{loc}</span>
                  <div
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 999,
                      background: i === 0 ? "#5EF08A" : "#1C1F33",
                      border: "1px solid #1C1F33",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#EEF0F8",
                        position: "absolute",
                        top: 2,
                        left: i === 0 ? 22 : 3,
                        transition: "left 0.2s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid #1C1F33",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ marginBottom: 12, fontSize: 24 }}>⚠️</div>
              <h4
                style={{
                  color: "#EEF0F8",
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                Failed Payment Recovery
              </h4>
              <p
                style={{
                  color: "#9CA3AF",
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                Automatically retry and recover failed subscription payments.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#9CA3AF", fontSize: 14 }}>
                  Auto-retry enabled
                </span>
                <div
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 999,
                    background: "#5EF08A",
                    border: "1px solid #1C1F33",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#EEF0F8",
                      position: "absolute",
                      top: 2,
                      left: 22,
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Blog Manager Tab ─────────────────────────────────────────────────────────
function BlogManagerTab() {
  const { activeTier } = useTierStore();
  const navigate = useNavigate();

  const speedyTiers: TierName[] = [
    "Speedy Basic",
    "Speedy Booking",
    "Speedy Storefronts",
  ];
  const isLocked = speedyTiers.includes(activeTier);

  const mockPosts = [
    "How to Get More Bookings With Your Website",
    "5 Signs You Need a New Website",
    "Why Fast Websites Win Customers",
  ];

  if (isLocked) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <div
          style={{
            background: "rgba(17,19,34,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid #1C1F33",
            borderRadius: "16px",
            padding: "48px 40px",
            textAlign: "center",
            maxWidth: "420px",
          }}
        >
          <Lock size={36} color="#9CA3AF" style={{ margin: "0 auto 16px" }} />
          <h3
            style={{
              color: "#EEF0F8",
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            Blog Manager Locked
          </h3>
          <p
            style={{ color: "#9CA3AF", fontSize: "14px", marginBottom: "24px" }}
          >
            Upgrade to Stay Sharp $89/mo to unlock.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/intake" })}
            style={{
              background: "#5EF08A",
              color: "#0A0B14",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            color: "#EEF0F8",
            fontSize: "20px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Blog Manager
        </h2>
        <button
          type="button"
          data-ocid="blog.new_post_button"
          style={{
            background: "#5EF08A",
            color: "#0A0B14",
            border: "none",
            borderRadius: "8px",
            padding: "8px 18px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          + New Post
        </button>
      </div>
      <div
        style={{
          background: "rgba(17,19,34,0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid #1C1F33",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1C1F33" }}>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  color: "#9CA3AF",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Title
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  color: "#9CA3AF",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  color: "#9CA3AF",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {mockPosts.map((title, i) => (
              <tr
                key={title}
                style={{
                  borderBottom:
                    i < mockPosts.length - 1 ? "1px solid #1C1F33" : "none",
                }}
              >
                <td
                  style={{
                    padding: "14px 16px",
                    color: "#EEF0F8",
                    fontSize: "14px",
                  }}
                >
                  {title}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span
                    style={{
                      background: "rgba(94,240,138,0.1)",
                      color: "#5EF08A",
                      border: "1px solid rgba(94,240,138,0.2)",
                      borderRadius: "6px",
                      padding: "2px 10px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Published
                  </span>
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <span style={{ display: "inline-flex", gap: "8px" }}>
                    <button
                      type="button"
                      data-ocid={`blog.item.${i + 1}`}
                      style={{
                        background: "rgba(94,240,138,0.1)",
                        color: "#5EF08A",
                        border: "1px solid rgba(94,240,138,0.2)",
                        borderRadius: "6px",
                        padding: "4px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      data-ocid={`blog.delete_button.${i + 1}`}
                      style={{
                        background: "rgba(236,72,153,0.1)",
                        color: "#f472b6",
                        border: "1px solid rgba(236,72,153,0.2)",
                        borderRadius: "6px",
                        padding: "4px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Growth Hub Modal ─────────────────────────────────────────────────────────
function GrowthHubModal({
  isOpen,
  onClose,
  activeTier,
}: { isOpen: boolean; onClose: () => void; activeTier: TierName }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const speedyTiers: TierName[] = [
    "Speedy Basic",
    "Speedy Booking",
    "Speedy Storefronts",
  ];
  const isSpeedy = speedyTiers.includes(activeTier);
  const referralLink = "imperidome.com/ref/username";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addOns = [
    { name: "Local SEO Booster", price: "$199/mo" },
    { name: "Lead Capture Upgrade", price: "$99/mo" },
    { name: "Review Generation System", price: "$99/mo" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          data-ocid="growth_hub.modal"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(17,19,34,0.9)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0D0F1E",
              border: "1px solid #1C1F33",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              data-ocid="growth_hub.close_button"
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid #1C1F33",
                borderRadius: "8px",
                padding: "6px",
                cursor: "pointer",
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>

            <h2
              style={{
                color: "#EEF0F8",
                fontSize: "22px",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              🔌 Imperidome Growth Hub
            </h2>
            <p
              style={{
                color: "#9CA3AF",
                fontSize: "13px",
                marginBottom: "28px",
              }}
            >
              Your hub for edits, billing, add-ons, and referrals.
            </p>

            {/* Section 1 — Submit Edit Request */}
            <div style={{ marginBottom: "28px" }}>
              <h3
                style={{
                  color: "#EEF0F8",
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "12px",
                  borderBottom: "1px solid #1C1F33",
                  paddingBottom: "8px",
                }}
              >
                Submit Edit Request
              </h3>
              {isSpeedy && (
                <div
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    marginBottom: "14px",
                    color: "#fbbf24",
                    fontSize: "12px",
                  }}
                >
                  Edits are billed at $125/hr. Upgrade to Stay Sharp for
                  included monthly edits.
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    htmlFor="gh-page-select"
                    style={{
                      color: "#9CA3AF",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Page / Section
                  </label>
                  <select
                    id="gh-page-select"
                    data-ocid="growth_hub.select"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(19,21,36,1)",
                      border: "1px solid #1C1F33",
                      borderRadius: "8px",
                      color: "#EEF0F8",
                      fontSize: "13px",
                    }}
                  >
                    <option>Homepage — Hero</option>
                    <option>Homepage — About</option>
                    <option>Contact Page</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="gh-description"
                    style={{
                      color: "#9CA3AF",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    id="gh-description"
                    rows={3}
                    placeholder="Describe the edit you need..."
                    data-ocid="growth_hub.textarea"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(19,21,36,1)",
                      border: "1px solid #1C1F33",
                      borderRadius: "8px",
                      color: "#EEF0F8",
                      fontSize: "13px",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="gh-attach-url"
                    style={{
                      color: "#9CA3AF",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Attach URL (optional)
                  </label>
                  <input
                    id="gh-attach-url"
                    type="url"
                    placeholder="https://..."
                    data-ocid="growth_hub.input"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(19,21,36,1)",
                      border: "1px solid #1C1F33",
                      borderRadius: "8px",
                      color: "#EEF0F8",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  type="button"
                  data-ocid="growth_hub.submit_button"
                  style={{
                    background: "#5EF08A",
                    color: "#0A0B14",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    alignSelf: "flex-start",
                  }}
                >
                  Submit Request
                </button>
              </div>
            </div>

            {/* Section 2 — Billing & Invoices */}
            <div style={{ marginBottom: "28px" }}>
              <h3
                style={{
                  color: "#EEF0F8",
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "12px",
                  borderBottom: "1px solid #1C1F33",
                  paddingBottom: "8px",
                }}
              >
                Billing & Invoices
              </h3>
              <div
                style={{
                  background: "rgba(17,19,34,0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid #1C1F33",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "#9CA3AF",
                      fontSize: "12px",
                      margin: "0 0 4px",
                    }}
                  >
                    Next Billing Date
                  </p>
                  <p
                    style={{
                      color: "#EEF0F8",
                      fontSize: "16px",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    February 1, 2026
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="growth_hub.secondary_button"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #1C1F33",
                    color: "#EEF0F8",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Manage Billing
                </button>
              </div>
            </div>

            {/* Section 3 — Add-On Store */}
            <div style={{ marginBottom: "28px" }}>
              <h3
                style={{
                  color: "#EEF0F8",
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "12px",
                  borderBottom: "1px solid #1C1F33",
                  paddingBottom: "8px",
                }}
              >
                Add-On Store
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                }}
              >
                {addOns.map((addon, i) => (
                  <div
                    key={addon.name}
                    data-ocid={`growth_hub.item.${i + 1}`}
                    style={{
                      background: "rgba(17,19,34,0.7)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid #1C1F33",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <p
                      style={{
                        color: "#EEF0F8",
                        fontWeight: 700,
                        fontSize: "13px",
                        margin: 0,
                      }}
                    >
                      {addon.name}
                    </p>
                    <p
                      style={{
                        color: "#5EF08A",
                        fontWeight: 700,
                        fontSize: "15px",
                        margin: 0,
                      }}
                    >
                      {addon.price}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/intake" })}
                      data-ocid={`growth_hub.primary_button.${i + 1}`}
                      style={{
                        background: "#5EF08A",
                        color: "#0A0B14",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                        marginTop: "4px",
                      }}
                    >
                      Activate
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4 — Referral Engine */}
            <div>
              <h3
                style={{
                  color: "#EEF0F8",
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "12px",
                  borderBottom: "1px solid #1C1F33",
                  paddingBottom: "8px",
                }}
              >
                Referral Engine
              </h3>
              <div
                style={{
                  background: "rgba(17,19,34,0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid #1C1F33",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <p
                  style={{
                    color: "#EEF0F8",
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  Refer a business owner, get your next month free.
                </p>
                <p
                  style={{
                    color: "#9CA3AF",
                    fontSize: "12px",
                    marginBottom: "14px",
                  }}
                >
                  Share your unique link and we will credit your next billing
                  cycle when they sign up.
                </p>
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "rgba(19,21,36,1)",
                      border: "1px solid #1C1F33",
                      borderRadius: "8px",
                      color: "#5EF08A",
                      fontSize: "13px",
                      fontFamily: "monospace",
                    }}
                  >
                    {referralLink}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    data-ocid="growth_hub.toggle"
                    style={{
                      background: copied
                        ? "rgba(94,240,138,0.15)"
                        : "rgba(255,255,255,0.05)",
                      border: "1px solid #1C1F33",
                      color: copied ? "#5EF08A" : "#EEF0F8",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
                <p
                  style={{
                    color: "#9CA3AF",
                    fontSize: "11px",
                    marginTop: "10px",
                  }}
                >
                  Active referrals: 0
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const tabContent: Record<Tab, React.ReactNode> = {
  overview: <OverviewTab />,
  "content-editor": <ContentEditorTab />,
  myproject: <MyProjectTab />,
  invoices: <InvoicesTab />,
  editrequests: <EditRequestsTab />,
  profile: <ProfileTab />,
  "engine-room": <EngineRoomTab />,
  "blog-manager": <BlogManagerTab />,
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { activeTab, setTab } = useDashboard();
  const { activeTier, setTier } = useTierStore();
  const [upgradeModal, setUpgradeModal] = useState<string | null>(null);
  const [isGrowthHubOpen, setIsGrowthHubOpen] = useState(false);
  const { actor, isFetching } = useActor();
  const [catalogPrices, setCatalogPrices] = useState<Record<string, number>>(
    {},
  );
  useEffect(() => {
    if (isFetching || !actor) return;
    actor
      .getProducts()
      .then((prods) => {
        const prices: Record<string, number> = {};
        for (const p of prods) {
          prices[p.name] =
            ((p.price_monthly ?? p.price_onetime ?? 0) as number) / 100;
        }
        setCatalogPrices(prices);
      })
      .catch(() => {});
  }, [isFetching, actor]);

  const featureItems = TIER_FEATURES[activeTier];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0A0B14",
        overflow: "hidden",
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: "240px",
          minWidth: "240px",
          background: "rgba(14,16,32,1)",
          borderRight: "1px solid #1C1F33",
          display: "flex",
          flexDirection: "column",
          padding: "28px 0 20px",
          overflowY: "auto",
        }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <div
          style={{ padding: "0 24px 28px", borderBottom: "1px solid #1C1F33" }}
        >
          <span
            style={{
              color: "#5EF08A",
              fontWeight: 800,
              fontSize: "20px",
              letterSpacing: "0.1em",
            }}
          >
            IMPERIDOME
          </span>
        </div>

        {/* Primary Nav */}
        <nav style={{ padding: "16px 12px" }}>
          {navItems.map((item) => {
            const isLogout = item.id === "logout";
            const isActive = !isLogout && activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`dashboard.${item.id}_tab`}
                onClick={() => {
                  if (!isLogout) setTab(item.id as Tab);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive
                    ? "rgba(94,240,138,0.08)"
                    : "transparent",
                  color: isActive ? "#5EF08A" : "#7A7D90",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 400,
                  textAlign: "left",
                  marginBottom: "4px",
                  borderLeft: isActive
                    ? "2px solid #5EF08A"
                    : "2px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#EEF0F8";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#7A7D90";
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Features Divider */}
        <div style={{ padding: "0 12px" }}>
          <div
            style={{ borderTop: "1px solid #1C1F33", margin: "4px 0 8px" }}
          />
          <p
            style={{
              color: "#7A7D90",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "4px 12px 8px",
            }}
          >
            Features
          </p>

          {/* Tier Feature Items */}
          {featureItems.map((item) => (
            <button
              type="button"
              key={item.label}
              data-ocid={`dashboard.${item.label.toLowerCase().replace(/\s+/g, "_")}_tab`}
              onClick={() => {
                if (!item.unlocked && item.upgradeMsg) {
                  setUpgradeModal(item.upgradeMsg);
                } else if (item.unlocked && item.label === "Content Editor") {
                  setTab("content-editor" as Tab);
                } else if (item.unlocked && item.label === "Engine Room") {
                  setTab("engine-room" as Tab);
                } else if (item.unlocked && item.label === "Blog Manager") {
                  setTab("blog-manager" as Tab);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: item.unlocked ? "#7A7D90" : "rgba(156,163,175,0.4)",
                cursor: item.unlocked ? "default" : "pointer",
                fontSize: "13px",
                fontWeight: 400,
                textAlign: "left",
                marginBottom: "2px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (item.unlocked)
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#EEF0F8";
              }}
              onMouseLeave={(e) => {
                if (item.unlocked)
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#7A7D90";
              }}
            >
              <span>{item.label}</span>
              {!item.unlocked && (
                <Lock size={12} color="rgba(156,163,175,0.4)" />
              )}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Growth Hub Button */}
        <div style={{ padding: "12px 12px 0" }}>
          <button
            type="button"
            data-ocid="dashboard.growth_hub_button"
            onClick={() => setIsGrowthHubOpen(true)}
            style={{
              background: "rgba(94,240,138,0.08)",
              border: "1px solid rgba(94,240,138,0.2)",
              color: "#5EF08A",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plug size={14} />
            Imperidome Growth Hub
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Demo Banner */}
        <div
          data-ocid="dashboard.demo_banner"
          style={{
            background: "rgba(245,158,11,0.1)",
            borderBottom: "1px solid rgba(245,158,11,0.2)",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={15} color="#F59E0B" />
          <span style={{ color: "#F59E0B", fontSize: "13px", fontWeight: 500 }}>
            Previewing Client Experience — Live Data Disabled
          </span>
        </div>

        {/* Tier Switcher */}
        <div
          data-ocid="dashboard.tier_switcher"
          style={{
            overflowX: "auto",
            display: "flex",
            gap: "8px",
            padding: "12px 28px",
            borderBottom: "1px solid #1C1F33",
            flexShrink: 0,
          }}
        >
          {TIER_PILLS.map(({ label, price }) => {
            const isActive = activeTier === label;
            return (
              <button
                type="button"
                key={label}
                data-ocid={`dashboard.tier_${label.toLowerCase().replace(/\s+/g, "_")}_toggle`}
                onClick={() => setTier(label)}
                style={{
                  background: isActive ? "#5EF08A" : "transparent",
                  border: isActive ? "none" : "1px solid #1C1F33",
                  color: isActive ? "#0A0B14" : "#9CA3AF",
                  borderRadius: "9999px",
                  padding: "6px 16px",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#EEF0F8";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#9CA3AF";
                }}
              >
                {label}{" "}
                {catalogPrices[label] !== undefined
                  ? `${catalogPrices[label]}`
                  : price}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 28px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {upgradeModal && (
          <UpgradeModal
            msg={upgradeModal}
            onClose={() => setUpgradeModal(null)}
          />
        )}
      </AnimatePresence>

      <GrowthHubModal
        isOpen={isGrowthHubOpen}
        onClose={() => setIsGrowthHubOpen(false)}
        activeTier={activeTier}
      />

      {/* Contact section */}
      <div
        style={{
          marginTop: "64px",
          borderTop: "1px solid rgba(57,255,20,0.08)",
          paddingTop: "24px",
          paddingBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px 32px",
        }}
        data-ocid="dashboard.footer.contact"
      >
        <span
          style={{
            fontSize: "11px",
            color: "rgba(122,125,144,0.6)",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            letterSpacing: "0.08em",
          }}
        >
          WEBLY LLC
        </span>
        <a
          href="mailto:Vincenzo@imperidome.com"
          style={{
            fontSize: "11px",
            color: "rgba(94,240,138,0.6)",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          data-ocid="dashboard.footer.email"
        >
          <span
            style={{
              color: "rgba(94,240,138,0.4)",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            EMAIL
          </span>
          Vincenzo@imperidome.com
        </a>
        <a
          href="tel:+18565533446"
          style={{
            fontSize: "11px",
            color: "rgba(94,240,138,0.6)",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          data-ocid="dashboard.footer.phone"
        >
          <span
            style={{
              color: "rgba(94,240,138,0.4)",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            PHONE
          </span>
          856 553 3446
        </a>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
