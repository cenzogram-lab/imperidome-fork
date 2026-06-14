import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  Clipboard,
  Copy,
  Edit,
  FileText,
  Gift,
  Settings,
  X,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ActivityLog,
  CrmClient,
  Order,
  backendInterface,
} from "../../backend.d";
import { EditableText } from "../../components/EditableText";
import ProjectTimeline from "../../components/ProjectTimeline";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

const formatOrderStatus = (status: string): string => {
  const map: Record<string, string> = {
    buildInProgress: "Build In Progress",
    depositReceived: "Deposit Received",
    live: "Live",
    draft: "Draft",
    paid: "Paid",
    canceled: "Canceled",
    active: "Active",
    pending: "Pending",
    questionnairePending: "Questionnaire Pending",
    questionnaireComplete: "Questionnaire Complete",
    depositSent: "Deposit Sent",
    launching: "Launching",
    paused: "Paused",
    cancelled: "Cancelled",
    revisionsInProgress: "Revisions In Progress",
    draftReady: "Draft Ready",
  };
  return map[status] ?? status;
};

function Skeleton({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(94,240,138,0.06)",
        borderRadius: "6px",
        animation: "pulse 1.5s ease-in-out infinite",
        border: "1px solid rgba(94,240,138,0.08)",
        ...style,
      }}
    />
  );
}

function OnboardingCenterCTA() {
  return (
    <div
      data-ocid="dashboard.onboarding-center.cta"
      style={{
        borderRadius: "12px",
        border: "1px solid rgba(94,240,138,0.3)",
        background: "rgba(14,16,32,0.85)",
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "10px",
          background: "rgba(94,240,138,0.10)",
          border: "1px solid rgba(94,240,138,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#5EF08A",
          marginBottom: "4px",
        }}
      >
        <FileText size={22} />
      </div>
      <h3
        className="matrix-heading"
        style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}
      >
        <TypewriterText text="Project Brief" speed={40} />
      </h3>
      <p
        className="matrix-muted"
        style={{ margin: 0, fontSize: "14px", lineHeight: "1.6" }}
      >
        Fill out your project brief to kick off your build.
      </p>
      <Link
        to="/onboarding"
        data-ocid="dashboard.onboarding-center.cta-button"
        className="matrix-btn"
        style={{
          marginTop: "8px",
          padding: "10px 22px",
          borderRadius: "8px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Start Project Brief →
      </Link>
    </div>
  );
}

interface EarnFreeHostingSectionProps {
  userEmail: string;
  actor: {
    getMyReferralCode: (email: string) => Promise<string | null>;
    getMyReferralConversions: (email: string) => Promise<bigint>;
  } | null;
  actorReady: boolean;
}

function EarnFreeHostingSection({
  userEmail,
  actor,
  actorReady,
}: EarnFreeHostingSectionProps) {
  const [referralCode, setReferralCode] = useState<string | null | undefined>(
    undefined,
  );
  const [conversions, setConversions] = useState<number>(0);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const referralUrl = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : null;
  const loadReferralData = useCallback(async () => {
    if (!actor || !userEmail) return;
    try {
      const [code, count] = await Promise.all([
        actor.getMyReferralCode(userEmail),
        actor.getMyReferralConversions(userEmail),
      ]);
      setReferralCode(code ?? null);
      setConversions(Number(count));
      setReferralError(null);
    } catch {
      setReferralCode(null);
      setReferralError("Could not load referral code.");
    }
  }, [actor, userEmail]);
  useEffect(() => {
    if (!actorReady || !userEmail) return;
    loadReferralData();
  }, [actorReady, userEmail, loadReferralData]);
  function handleCopy() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2500);
    });
  }
  const isLoading = referralCode === undefined;
  return (
    <div
      data-ocid="dashboard.referral.panel"
      className="matrix-card"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background:
            "linear-gradient(90deg, transparent 0%, #5EF08A 50%, transparent 100%)",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "rgba(94,240,138,0.10)",
            border: "1px solid rgba(94,240,138,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#5EF08A",
            flexShrink: 0,
          }}
        >
          <Gift size={20} />
        </div>
        <div>
          <h3
            className="matrix-heading"
            style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}
          >
            <TypewriterText text="Earn Free Hosting" speed={40} />
          </h3>
          <p
            className="matrix-muted"
            style={{ margin: "2px 0 0", fontSize: "13px" }}
          >
            <TypewriterText text="Share your link. Get rewarded." speed={30} />
          </p>
        </div>
      </div>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px",
            borderRadius: "8px",
            background: "rgba(94,240,138,0.05)",
            border: "1px solid rgba(94,240,138,0.15)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "2px solid rgba(94,240,138,0.3)",
              borderTopColor: "#5EF08A",
              animation: "spin 0.8s linear infinite",
              flexShrink: 0,
            }}
          />
          <span className="matrix-muted" style={{ fontSize: "14px" }}>
            Loading referral info...
          </span>
        </div>
      ) : referralError ? (
        <p
          data-ocid="dashboard.referral.error_state"
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#FCA5A5",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "rgba(69,10,10,0.25)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {referralError}
        </p>
      ) : referralUrl ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
            <div
              data-ocid="dashboard.referral.link-display"
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: "8px",
                background: "rgba(94,240,138,0.04)",
                border: "1px solid rgba(94,240,138,0.2)",
                fontSize: "13px",
                color: "#5EF08A",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                userSelect: "all",
                fontFamily: "monospace",
              }}
            >
              {referralUrl}
            </div>
            <button
              type="button"
              data-ocid="dashboard.referral.copy-button"
              onClick={handleCopy}
              aria-label={copied ? "Link copied!" : "Copy referral link"}
              className="matrix-btn"
              style={{
                flexShrink: 0,
                padding: "0 16px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? (
                <>
                  <CheckCircle size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Link
                </>
              )}
            </button>
          </div>
          <div
            data-ocid="dashboard.referral.conversions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background:
                  conversions > 0
                    ? "rgba(94,240,138,0.12)"
                    : "rgba(255,255,255,0.04)",
                border:
                  conversions > 0
                    ? "1px solid rgba(94,240,138,0.25)"
                    : "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: conversions > 0 ? "#5EF08A" : "rgba(255,255,255,0.3)",
                flexShrink: 0,
              }}
            >
              <span
                style={{ fontSize: "16px", fontWeight: 800, lineHeight: 1 }}
              >
                {conversions}
              </span>
            </div>
            <div>
              <p
                className="matrix-text"
                style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}
              >
                {conversions === 1
                  ? "1 successful referral"
                  : conversions > 0
                    ? `${conversions} successful referrals`
                    : "0 successful referrals so far"}
              </p>
              <p
                className="matrix-muted"
                style={{ margin: "2px 0 0", fontSize: "12px" }}
              >
                Each referral that makes their first purchase counts
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p
          className="matrix-muted"
          style={{ margin: 0, fontSize: "14px", lineHeight: "1.55" }}
        >
          Your referral link will be available once your account is set up.
        </p>
      )}
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}

export default function PortalDashboardPage() {
  const { session } = useSession();
  const firstName = session?.firstName ?? "";
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [activity, setActivity] = useState<ActivityLog[] | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState(false);
  const [briefStatus, setBriefStatus] = useState<string | null | undefined>(
    undefined,
  );
  const [siteService, setSiteService] = useState<boolean>(false);
  const [clientData, setClientData] = useState<CrmClient | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    async function load() {
      if (!userEmail) return;
      try {
        const [ord, acts] = await Promise.all([
          (actor as backendInterface).getMyOrders(),
          (actor as backendInterface).getMyActivity(),
        ]);
        if (!cancelled) {
          const orders = Array.isArray(ord) ? ord : [];
          const activeOrder =
            orders.find((o) => {
              const key = Object.keys(
                o.status as unknown as Record<string, unknown>,
              )[0];
              return key !== "live" && key !== "cancelled";
            }) ??
            orders[0] ??
            null;
          setOrder(activeOrder);
          setActivity(acts);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    async function loadBriefStatus() {
      if (!userEmail) {
        if (!cancelled) setBriefStatus(null);
        return;
      }
      try {
        const status = await (actor as backendInterface).getClientBriefStatus(
          userEmail,
        );
        if (!cancelled) setBriefStatus(status ?? null);
      } catch {
        if (!cancelled) setBriefStatus(null);
      }
      try {
        const client = await (actor as backendInterface).getClientByEmail(
          userEmail,
        );
        if (!cancelled && client) {
          const hasService = (client.activeServices ?? []).some(
            (s: string) => s.trim().length > 0,
          );
          setSiteService(hasService);
          setClientData(client);
        } else if (!cancelled) setClientData(null);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("getClientByEmail failed in loadBriefStatus:", err);
        }
        if (!cancelled) setClientData(null);
      }
    }
    load();
    loadBriefStatus();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, userEmail]);

  const isLoading =
    isFetching || (order === undefined && activity === undefined && !loadError);
  const showActionRequired =
    siteService && (briefStatus === "Pending" || briefStatus === null);
  const showSubmittedBanner = briefStatus === "Submitted";

  const quickActions: Array<{
    label: string;
    icon: ReactNode;
    path:
      | "/portal/questionnaires"
      | "/portal/invoices"
      | "/portal/edit-requests"
      | "/portal/subscriptions"
      | "/onboarding";
    ocid: string;
  }> = [
    {
      icon: <Clipboard size={22} />,
      label: "Complete Questionnaire",
      path: "/portal/questionnaires",
      ocid: "dashboard.questionnaire.link",
    },
    {
      icon: <FileText size={22} />,
      label: "View Invoices",
      path: "/portal/invoices",
      ocid: "dashboard.invoices.link",
    },
    {
      icon: <Edit size={22} />,
      label: "Submit Edit Request",
      path: "/portal/edit-requests",
      ocid: "dashboard.edit-requests.link",
    },
    {
      icon: <Settings size={22} />,
      label: "Manage Subscription",
      path: "/portal/subscriptions",
      ocid: "dashboard.subscriptions.link",
    },
    {
      icon: <Clipboard size={22} />,
      label: "Project Brief",
      path: "/onboarding",
      ocid: "dashboard.project-brief.link",
    },
  ];

  return (
    <PortalLayout pageTitle="Dashboard">
      <style>
        {
          "@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } } @keyframes spin { to { transform: rotate(360deg); } }"
        }
      </style>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          data-ocid="dashboard.welcome.panel"
          className="matrix-card"
          style={{ borderColor: "rgba(94,240,138,0.25)" }}
        >
          {isLoading ? (
            <>
              <Skeleton
                style={{ height: "28px", width: "260px", marginBottom: "8px" }}
              />
              <Skeleton style={{ height: "18px", width: "320px" }} />
            </>
          ) : (
            <>
              <h2
                className="matrix-heading"
                style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}
              >
                <TypewriterText
                  text={`Welcome back${firstName ? `, ${firstName}` : ""}.`}
                  speed={40}
                />
              </h2>
              <p
                className="matrix-muted"
                style={{ margin: "6px 0 0", fontSize: "14px" }}
              >
                <TypewriterText
                  text="Here is where your project stands today."
                  speed={25}
                />
              </p>
            </>
          )}
        </div>

        {clientData != null && (
          <ProjectTimeline
            currentMilestone={(() => {
              const raw = (
                clientData as
                  | (CrmClient & { currentMilestone?: bigint | number })
                  | null
              )?.currentMilestone;
              if (raw == null) return 0;
              return typeof raw === "bigint" ? Number(raw) : Number(raw);
            })()}
            milestoneUpdatedAt={
              (
                clientData as
                  | (CrmClient & {
                      milestoneUpdatedAt?: bigint | number | null;
                    })
                  | null
              )?.milestoneUpdatedAt ?? null
            }
          />
        )}

        {showActionRequired && (
          <div data-ocid="dashboard.action-required.panel">
            <OnboardingCenterCTA />
          </div>
        )}

        {showSubmittedBanner && (
          <div
            data-ocid="dashboard.brief-submitted.panel"
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(94,240,138,0.3)",
              background: "rgba(5,46,22,0.35)",
              padding: "20px 24px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                lineHeight: 1,
                marginTop: "2px",
                color: "#5EF08A",
              }}
              aria-hidden="true"
            >
              ✓
            </span>
            <div>
              <h3
                className="matrix-heading"
                style={{
                  margin: "0 0 4px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#5EF08A",
                }}
              >
                <TypewriterText
                  text="Build Status: Reviewing Brief"
                  speed={35}
                />
              </h3>
              <p
                className="matrix-muted"
                style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}
              >
                <TypewriterText
                  text="Your questionnaire has been received. Our team will contact you within 24 hours."
                  speed={20}
                />
              </p>
            </div>
          </div>
        )}

        <div data-ocid="dashboard.project.card" className="matrix-card">
          <h3
            className="matrix-heading"
            style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 700 }}
          >
            <TypewriterText text="Your Current Project" speed={40} />
          </h3>
          {isLoading ? (
            <div className="grid grid-cols-2" style={{ gap: "24px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton
                    style={{
                      height: "12px",
                      width: "60px",
                      marginBottom: "8px",
                    }}
                  />
                  <Skeleton style={{ height: "20px", width: "120px" }} />
                </div>
              ))}
            </div>
          ) : order ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2"
              style={{ gap: "24px" }}
            >
              <div data-ocid="dashboard.project.tier.panel">
                <p
                  className="matrix-label"
                  style={{ margin: "0 0 4px", fontSize: "12px" }}
                >
                  TIER
                </p>
                <p
                  className="matrix-text"
                  style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}
                >
                  <TypewriterText text={order.tier_code || "—"} speed={40} />
                </p>
              </div>
              <div data-ocid="dashboard.project.status.panel">
                <p
                  className="matrix-label"
                  style={{ margin: "0 0 4px", fontSize: "12px" }}
                >
                  STATUS
                </p>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "rgba(94,240,138,0.12)",
                    color: "#5EF08A",
                    border: "1px solid rgba(94,240,138,0.4)",
                  }}
                >
                  {formatOrderStatus(
                    typeof order.status === "object" && order.status !== null
                      ? (Object.keys(
                          order.status as Record<string, unknown>,
                        )[0] ?? String(order.status))
                      : String(order.status),
                  )}
                </span>
              </div>
              <div data-ocid="dashboard.project.delivery.panel">
                <p
                  className="matrix-label"
                  style={{ margin: "0 0 4px", fontSize: "12px" }}
                >
                  DELIVERY WINDOW
                </p>
                <p
                  className="matrix-text"
                  style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}
                >
                  <TypewriterText
                    text={order.delivery_window || "—"}
                    speed={40}
                  />
                </p>
              </div>
              <div data-ocid="dashboard.project.launch.panel">
                <p
                  className="matrix-label"
                  style={{ margin: "0 0 4px", fontSize: "12px" }}
                >
                  LAUNCH TARGET
                </p>
                <p
                  className="matrix-text"
                  style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}
                >
                  <TypewriterText
                    text={order.launch_target || "—"}
                    speed={40}
                  />
                </p>
              </div>
            </div>
          ) : (
            <p className="matrix-muted" style={{ margin: 0, fontSize: "14px" }}>
              <TypewriterText
                text="No active project yet. Ready to get started?"
                speed={30}
              />
            </p>
          )}
        </div>

        <div data-ocid="dashboard.quick-actions.panel" className="matrix-card">
          <h3
            className="matrix-heading"
            style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}
          >
            <TypewriterText text="Quick Actions" speed={40} />
          </h3>
          <div
            className="grid grid-cols-2 sm:grid-cols-4"
            style={{ gap: "12px" }}
          >
            {quickActions.map(({ icon, label, path, ocid }) => (
              <Link
                key={path}
                to={path}
                data-ocid={ocid}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px 8px",
                  borderRadius: "10px",
                  border: "1px solid rgba(94,240,138,0.2)",
                  background: "rgba(94,240,138,0.04)",
                  color: "#5EF08A",
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "border-color 0.2s, background 0.2s",
                  minHeight: "44px",
                }}
              >
                {icon}
                <span
                  className="matrix-label"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    lineHeight: "1.3",
                  }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <EarnFreeHostingSection
          userEmail={userEmail}
          actor={actor}
          actorReady={!isFetching}
        />
      </div>
    </PortalLayout>
  );
}
