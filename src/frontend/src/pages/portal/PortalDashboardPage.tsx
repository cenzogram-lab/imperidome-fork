import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  Clipboard,
  Copy,
  CreditCard,
  Edit,
  FileText,
  Gift,
  Lock,
  Package,
  Settings,
  ShoppingBag,
  Unlock,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Referral Engine Section
// ---------------------------------------------------------------------------
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
    } catch {
      setReferralCode(null);
    }
  }, [actor, userEmail]);

  // Initial load — fetch existing referral code only, never auto-create
  useEffect(() => {
    if (!actorReady) return;
    loadReferralData();
  }, [actorReady, loadReferralData]);

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
      style={{
        borderRadius: "14px",
        border: "1px solid rgba(57,255,20,0.28)",
        background: "rgba(10,10,10,0.75)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        padding: "24px",
        boxShadow:
          "0 0 0 1px rgba(57,255,20,0.06), 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Neon accent glow behind header */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background:
            "linear-gradient(90deg, transparent 0%, #39FF14 50%, transparent 100%)",
          opacity: 0.7,
        }}
      />

      {/* Header */}
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
            background: "rgba(57,255,20,0.10)",
            border: "1px solid rgba(57,255,20,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#39FF14",
            flexShrink: 0,
            boxShadow: "0 0 12px rgba(57,255,20,0.2)",
          }}
        >
          <Gift size={20} />
        </div>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}
          >
            <EditableText
              textKey="portal.dashboard.referral.heading"
              defaultText="Earn Free Hosting"
              as="span"
            />
          </h3>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <EditableText
              textKey="portal.dashboard.referral.subheading"
              defaultText="Share your link. Get rewarded."
              as="span"
            />
          </p>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px",
            borderRadius: "8px",
            background: "rgba(57,255,20,0.05)",
            border: "1px solid rgba(57,255,20,0.15)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "2px solid rgba(57,255,20,0.3)",
              borderTopColor: "#39FF14",
              animation: "referralSpin 0.8s linear infinite",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
            Loading referral info...
          </span>
        </div>
      ) : referralUrl ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Link display row */}
          <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
            <div
              data-ocid="dashboard.referral.link-display"
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: "8px",
                background: "rgba(57,255,20,0.04)",
                border: "1px solid rgba(57,255,20,0.2)",
                fontSize: "13px",
                color: "#39FF14",
                fontWeight: 600,
                letterSpacing: "0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                userSelect: "all",
              }}
            >
              {referralUrl}
            </div>
            <button
              type="button"
              data-ocid="dashboard.referral.copy-button"
              onClick={handleCopy}
              aria-label={copied ? "Link copied!" : "Copy referral link"}
              style={{
                flexShrink: 0,
                padding: "0 16px",
                borderRadius: "8px",
                border: copied
                  ? "1px solid rgba(57,255,20,0.6)"
                  : "1px solid rgba(57,255,20,0.35)",
                background: copied
                  ? "rgba(57,255,20,0.18)"
                  : "rgba(57,255,20,0.10)",
                color: "#39FF14",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
                transition: "background 0.2s, border-color 0.2s",
                whiteSpace: "nowrap",
                boxShadow: copied ? "0 0 12px rgba(57,255,20,0.3)" : "none",
              }}
            >
              {copied ? (
                <>
                  <CheckCircle size={14} />
                  <EditableText
                    textKey="portal.dashboard.referral.copied-label"
                    defaultText="Copied!"
                    as="span"
                  />
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <EditableText
                    textKey="portal.dashboard.referral.copy-label"
                    defaultText="Copy Link"
                    as="span"
                  />
                </>
              )}
            </button>
          </div>

          {/* Conversion counter */}
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
                    ? "rgba(57,255,20,0.12)"
                    : "rgba(255,255,255,0.04)",
                border:
                  conversions > 0
                    ? "1px solid rgba(57,255,20,0.25)"
                    : "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: conversions > 0 ? "#39FF14" : "rgba(255,255,255,0.3)",
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
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {conversions === 1
                  ? "1 successful referral"
                  : conversions > 0
                    ? `${conversions} successful referrals`
                    : "0 successful referrals so far"}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.referral.conversion-helper"
                  defaultText="Each referral that makes their first purchase counts"
                  as="span"
                />
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "rgba(255,255,255,0.5)",
            lineHeight: "1.55",
          }}
        >
          <EditableText
            textKey="portal.dashboard.referral.unavailable"
            defaultText="Your referral link will be available once your account is set up."
            as="span"
          />
        </p>
      )}

      <style>{`
        @keyframes referralSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
import type {
  ActivityLog,
  CrmClient,
  Order,
  backendInterface,
} from "../../backend";
import { EditableText } from "../../components/EditableText";
import ProjectTimeline from "../../components/ProjectTimeline";
import SiteBriefQuestionnaire from "../../components/SiteBriefQuestionnaire";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CUSTOM_SITE_NAMES = [
  "DIGITAL PRESENCE",
  "AUTHORITY SITE",
  "BOOKING PRO",
  "RESTAURANT PRO",
  "RESTAURANT EMPIRE",
  "DIGITAL STOREFRONT",
  "MEMBERSHIP ENGINE",
  "ENTERPRISE SCALE",
];

const SPEEDY_SITE_NAMES = [
  "SPEEDY BASIC",
  "SPEEDY BOOKING",
  "SPEEDY PRODUCT STOREFRONT",
  "SPEEDY MENU STOREFRONT",
  "SPEEDY RECURRING STOREFRONT",
];

function detectSiteServiceType(
  services: string[],
): { serviceName: string; serviceType: "custom" | "speedy" } | null {
  for (const svc of services) {
    const upper = svc.toUpperCase();
    if (CUSTOM_SITE_NAMES.some((n) => upper.includes(n))) {
      const match = CUSTOM_SITE_NAMES.find((n) => upper.includes(n));
      return { serviceName: match ?? svc, serviceType: "custom" };
    }
    if (SPEEDY_SITE_NAMES.some((n) => upper.includes(n))) {
      const match = SPEEDY_SITE_NAMES.find((n) => upper.includes(n));
      return { serviceName: match ?? svc, serviceType: "speedy" };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  questionnairePending: {
    label: "QUESTIONNAIRE PENDING",
    color: "#92400e",
    bg: "#FEF9C3",
    dot: "#EAB308",
  },
  questionnaireComplete: {
    label: "QUESTIONNAIRE COMPLETE",
    color: "#1e40af",
    bg: "#DBEAFE",
    dot: "#3B82F6",
  },
  depositSent: {
    label: "DEPOSIT SENT",
    color: "#9a3412",
    bg: "#FFEDD5",
    dot: "#F97316",
  },
  depositReceived: {
    label: "DEPOSIT RECEIVED",
    color: "#166534",
    bg: "#DCFCE7",
    dot: "#86EFAC",
  },
  buildInProgress: {
    label: "BUILD IN PROGRESS",
    color: "#1d4ed8",
    bg: "#DBEAFE",
    dot: "#5EF08A",
  },
  draftReady: {
    label: "DRAFT READY",
    color: "#6b21a8",
    bg: "#F3E8FF",
    dot: "#A855F7",
  },
  revisionsInProgress: {
    label: "REVISIONS IN PROGRESS",
    color: "#92400e",
    bg: "#FEF3C7",
    dot: "#F59E0B",
  },
  launching: {
    label: "LAUNCHING",
    color: "#0f766e",
    bg: "#CCFBF1",
    dot: "#0F766E",
  },
  live: { label: "LIVE", color: "#166534", bg: "#DCFCE7", dot: "#166534" },
  paused: {
    label: "PAUSED",
    color: "#7A7D90",
    bg: "#F3F4F6",
    dot: "#7A7D90",
  },
  cancelled: {
    label: "CANCELLED",
    color: "#991b1b",
    bg: "#FEE2E2",
    dot: "#991B1B",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status.toUpperCase(),
      color: "#7A7D90",
      bg: "#F3F4F6",
      dot: "#7A7D90",
    }
  );
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const date = new Date(ms);
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(40,45,70,0.8)",
        borderRadius: "6px",
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Upgrade Info Modal
// ---------------------------------------------------------------------------
interface UpgradeModalProps {
  lockedCard: "custom" | "speedy";
  onClose: () => void;
}
function UpgradeModal({ lockedCard, onClose }: UpgradeModalProps) {
  const isCustomLocked = lockedCard === "custom";
  const title = isCustomLocked ? "How to Upgrade" : "Premium Tier Included";
  const body = isCustomLocked
    ? "This full Custom Site Brief is part of our Premium Custom Sites package. To unlock it, upgrade to any Custom Sites plan — from Digital Presence all the way to Enterprise Scale."
    : "You're on a Custom Sites plan which includes Premium Onboarding. The Speedy Brief is designed for our quick-launch products and is bundled into your package at no extra cost.";
  const cta = isCustomLocked ? "Explore Custom Sites →" : null;

  return (
    <div
      data-ocid="padlock.upgrade-modal.overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        data-ocid="padlock.upgrade-modal.content"
        style={{
          background: "rgba(17,19,34,0.98)",
          border: "1px solid rgba(94,240,138,0.2)",
          borderRadius: "14px",
          padding: "32px",
          maxWidth: "440px",
          width: "100%",
          position: "relative",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close */}
        <button
          type="button"
          aria-label="Close"
          data-ocid="padlock.upgrade-modal.close"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Enter" && onClose()}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255,255,255,0.06)",
            border: "none",
            borderRadius: "6px",
            color: "#7A7D90",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
          }}
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "12px",
            background: isCustomLocked
              ? "rgba(249,115,22,0.12)"
              : "rgba(94,240,138,0.10)",
            border: isCustomLocked
              ? "1px solid rgba(249,115,22,0.3)"
              : "1px solid rgba(94,240,138,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
            color: isCustomLocked ? "#F97316" : "#5EF08A",
          }}
        >
          {isCustomLocked ? <Lock size={24} /> : <CheckCircle size={24} />}
        </div>

        <h2
          style={{
            margin: "0 0 12px",
            fontSize: "20px",
            fontWeight: 800,
            color: "#EEF0F8",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "15px",
            color: "#B0B3C6",
            lineHeight: "1.65",
          }}
        >
          {body}
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          {cta && (
            <a
              href="/services/custom-sites"
              data-ocid="padlock.upgrade-modal.cta"
              style={{
                flex: 1,
                padding: "11px 20px",
                borderRadius: "8px",
                background: "#F97316",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                textAlign: "center",
                display: "block",
              }}
            >
              {cta}
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            onKeyDown={(e) => e.key === "Enter" && onClose()}
            data-ocid="padlock.upgrade-modal.dismiss"
            style={{
              flex: 1,
              padding: "11px 20px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#B0B3C6",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <EditableText
              textKey="portal.dashboard.upgrade-modal.dismiss-label"
              defaultText="Got It"
              as="span"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Locked Card Overlay
// ---------------------------------------------------------------------------
interface LockedCardOverlayProps {
  message: string;
  onClick: () => void;
}
function LockedCardOverlay({ message, onClick }: LockedCardOverlayProps) {
  return (
    <button
      type="button"
      aria-label={`Locked: ${message}. Click to learn more.`}
      data-ocid="padlock.locked-overlay"
      onClick={onClick}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        background: "rgba(8,10,22,0.72)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        cursor: "pointer",
        border: "none",
        zIndex: 10,
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#B0B3C6",
        }}
      >
        <Lock size={22} />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          fontWeight: 600,
          color: "#B0B3C6",
          textAlign: "center",
          lineHeight: "1.45",
          maxWidth: "200px",
        }}
      >
        {message}
      </p>
      <span
        style={{
          fontSize: "11px",
          color: "#5EF08A",
          fontWeight: 600,
          letterSpacing: "0.03em",
        }}
      >
        <EditableText
          textKey="portal.dashboard.locked-overlay.cta"
          defaultText="Click to learn more →"
          as="span"
        />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Dual-Card Onboarding Section
// ---------------------------------------------------------------------------
interface DualCardOnboardingProps {
  serviceType: "custom" | "speedy";
  serviceName: string;
  userEmail: string;
  clientName: string;
  productTier: string;
  onBriefSubmitted: () => void;
}

function DualCardOnboarding({
  serviceType,
  serviceName,
  userEmail,
  clientName,
  productTier,
  onBriefSubmitted,
}: DualCardOnboardingProps) {
  const [expandedCard, setExpandedCard] = useState<"custom" | "speedy" | null>(
    null,
  );
  const [upgradeModal, setUpgradeModal] = useState<"custom" | "speedy" | null>(
    null,
  );

  const customLocked = serviceType === "speedy";
  const speedyLocked = serviceType === "custom";

  // Toggle the active (unlocked) card's form
  function handleUnlockedToggle(card: "custom" | "speedy") {
    setExpandedCard((prev) => (prev === card ? null : card));
  }

  return (
    <>
      {/* Section header */}
      <div
        data-ocid="dashboard.onboarding-center.header"
        style={{ marginBottom: "16px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px",
          }}
        >
          <span style={{ fontSize: "16px" }} aria-hidden="true">
            ⚠
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: 800,
              color: "#FED7AA",
              letterSpacing: "-0.01em",
            }}
          >
            <EditableText
              textKey="portal.dashboard.onboarding.action-required-heading"
              defaultText="Action Required: Complete Your Site Brief"
              as="span"
            />
          </h3>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#FCA57E",
            lineHeight: "1.5",
          }}
        >
          <EditableText
            textKey="portal.dashboard.onboarding.action-required-body"
            defaultText="Your build slot is secured — but your project won't start until we receive your questionnaire. Select the form below that matches your purchase."
            as="span"
          />
        </p>
      </div>

      {/* Two-card grid */}
      <div
        data-ocid="dashboard.onboarding-center.cards"
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: "16px" }}
      >
        {/* ── CARD A: Custom Site Brief ── */}
        <div
          data-ocid="dashboard.onboarding.card-custom"
          style={{
            position: "relative",
            borderRadius: "12px",
            border: customLocked
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(94,240,138,0.3)",
            background: customLocked
              ? "rgba(14,16,32,0.6)"
              : "rgba(14,16,32,0.85)",
            overflow: "hidden",
            transition: "border-color 0.2s",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "20px 20px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
              opacity: customLocked ? 0.35 : 1,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                {!customLocked ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "#5EF08A",
                    }}
                  >
                    <Unlock size={15} />
                  </span>
                ) : (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "#7A7D90",
                    }}
                  >
                    <Lock size={15} />
                  </span>
                )}
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: customLocked ? "#7A7D90" : "#5EF08A",
                  }}
                >
                  <EditableText
                    textKey="portal.dashboard.onboarding.card-custom.form-label"
                    defaultText="Form A"
                    as="span"
                  />
                </span>
                {!customLocked && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#5EF08A",
                      background: "rgba(94,240,138,0.1)",
                      border: "1px solid rgba(94,240,138,0.25)",
                      borderRadius: "999px",
                      padding: "2px 8px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <EditableText
                      textKey="portal.dashboard.onboarding.card-custom.available-badge"
                      defaultText="Available"
                      as="span"
                    />
                  </span>
                )}
              </div>
              <h4
                style={{
                  margin: "0 0 4px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#EEF0F8",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.onboarding.card-custom.title"
                  defaultText="Custom Site Brief"
                  as="span"
                />
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#7A7D90",
                  lineHeight: "1.45",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.onboarding.card-custom.description"
                  defaultText="Full design brief for custom-built websites. Tailored questions based on your specific tier."
                  as="span"
                />
              </p>
            </div>
          </div>

          {/* Card body — expand / form */}
          {!customLocked && (
            <div style={{ padding: "0 20px 20px" }}>
              <button
                type="button"
                data-ocid="dashboard.onboarding.card-custom.toggle"
                onClick={() => handleUnlockedToggle("custom")}
                style={{
                  marginTop: "16px",
                  padding: "9px 18px",
                  borderRadius: "7px",
                  background:
                    expandedCard === "custom"
                      ? "rgba(94,240,138,0.15)"
                      : "#5EF08A",
                  color: expandedCard === "custom" ? "#5EF08A" : "#061209",
                  fontWeight: 700,
                  fontSize: "13px",
                  border:
                    expandedCard === "custom"
                      ? "1px solid rgba(94,240,138,0.4)"
                      : "none",
                  cursor: "pointer",
                  width: "100%",
                  display: "block",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {expandedCard === "custom" ? (
                  <EditableText
                    textKey="portal.dashboard.onboarding.card-custom.hide-label"
                    defaultText="Hide Form"
                    as="span"
                  />
                ) : (
                  <EditableText
                    textKey="portal.dashboard.onboarding.card-custom.complete-label"
                    defaultText="Complete Brief →"
                    as="span"
                  />
                )}
              </button>

              {expandedCard === "custom" && (
                <div style={{ marginTop: "20px" }}>
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      background: "rgba(94,240,138,0.06)",
                      border: "1px solid rgba(94,240,138,0.15)",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#86EFAC",
                        lineHeight: "1.5",
                      }}
                    >
                      <strong>Tier:</strong> {productTier || serviceName} —
                      questions are filtered to your specific plan. Fill in the
                      details below and our team will get to work.
                    </p>
                  </div>
                  <SiteBriefQuestionnaire
                    serviceType="custom"
                    serviceName={serviceName}
                    userEmail={userEmail}
                    clientName={clientName}
                    productTier={productTier}
                    onSubmitSuccess={onBriefSubmitted}
                  />
                </div>
              )}
            </div>
          )}

          {/* Locked overlay */}
          {customLocked && (
            <LockedCardOverlay
              message="Custom Brief — Upgrade to unlock Premium Onboarding."
              onClick={() => setUpgradeModal("custom")}
            />
          )}
        </div>

        {/* ── CARD B: Speedy Site Brief ── */}
        <div
          data-ocid="dashboard.onboarding.card-speedy"
          style={{
            position: "relative",
            borderRadius: "12px",
            border: speedyLocked
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(94,240,138,0.3)",
            background: speedyLocked
              ? "rgba(14,16,32,0.6)"
              : "rgba(14,16,32,0.85)",
            overflow: "hidden",
            transition: "border-color 0.2s",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "20px 20px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
              opacity: speedyLocked ? 0.35 : 1,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                {!speedyLocked ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "#5EF08A",
                    }}
                  >
                    <Unlock size={15} />
                  </span>
                ) : (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "#7A7D90",
                    }}
                  >
                    <Lock size={15} />
                  </span>
                )}
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: speedyLocked ? "#7A7D90" : "#5EF08A",
                  }}
                >
                  <EditableText
                    textKey="portal.dashboard.onboarding.card-speedy.form-label"
                    defaultText="Form B"
                    as="span"
                  />
                </span>
                {!speedyLocked && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#5EF08A",
                      background: "rgba(94,240,138,0.1)",
                      border: "1px solid rgba(94,240,138,0.25)",
                      borderRadius: "999px",
                      padding: "2px 8px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <EditableText
                      textKey="portal.dashboard.onboarding.card-speedy.available-badge"
                      defaultText="Available"
                      as="span"
                    />
                  </span>
                )}
              </div>
              <h4
                style={{
                  margin: "0 0 4px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#EEF0F8",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.onboarding.card-speedy.title"
                  defaultText="Speedy Site Brief"
                  as="span"
                />
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#7A7D90",
                  lineHeight: "1.45",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.onboarding.card-speedy.description"
                  defaultText="Quick-launch onboarding form. Streamlined questions designed for fast turnaround builds."
                  as="span"
                />
              </p>
            </div>
          </div>

          {/* Card body — expand / form */}
          {!speedyLocked && (
            <div style={{ padding: "0 20px 20px" }}>
              <button
                type="button"
                data-ocid="dashboard.onboarding.card-speedy.toggle"
                onClick={() => handleUnlockedToggle("speedy")}
                style={{
                  marginTop: "16px",
                  padding: "9px 18px",
                  borderRadius: "7px",
                  background:
                    expandedCard === "speedy"
                      ? "rgba(94,240,138,0.15)"
                      : "#5EF08A",
                  color: expandedCard === "speedy" ? "#5EF08A" : "#061209",
                  fontWeight: 700,
                  fontSize: "13px",
                  border:
                    expandedCard === "speedy"
                      ? "1px solid rgba(94,240,138,0.4)"
                      : "none",
                  cursor: "pointer",
                  width: "100%",
                  display: "block",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {expandedCard === "speedy" ? (
                  <EditableText
                    textKey="portal.dashboard.onboarding.card-speedy.hide-label"
                    defaultText="Hide Form"
                    as="span"
                  />
                ) : (
                  <EditableText
                    textKey="portal.dashboard.onboarding.card-speedy.complete-label"
                    defaultText="Complete Brief →"
                    as="span"
                  />
                )}
              </button>

              {expandedCard === "speedy" && (
                <div style={{ marginTop: "20px" }}>
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      background: "rgba(94,240,138,0.06)",
                      border: "1px solid rgba(94,240,138,0.15)",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#86EFAC",
                        lineHeight: "1.5",
                      }}
                    >
                      <strong>Tier:</strong> {productTier || serviceName} —
                      questions are filtered to your specific plan. Fill in the
                      details below and we'll have your site ready fast.
                    </p>
                  </div>
                  <SiteBriefQuestionnaire
                    serviceType="speedy"
                    serviceName={serviceName}
                    userEmail={userEmail}
                    clientName={clientName}
                    productTier={productTier}
                    onSubmitSuccess={onBriefSubmitted}
                  />
                </div>
              )}
            </div>
          )}

          {/* Locked overlay */}
          {speedyLocked && (
            <LockedCardOverlay
              message="Speedy Brief — Included in your Premium Tier."
              onClick={() => setUpgradeModal("speedy")}
            />
          )}
        </div>
      </div>

      {/* Upgrade modal */}
      {upgradeModal && (
        <UpgradeModal
          lockedCard={upgradeModal}
          onClose={() => setUpgradeModal(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
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

  // Brief status state
  const [briefStatus, setBriefStatus] = useState<string | null | undefined>(
    undefined,
  );
  const [siteService, setSiteService] = useState<{
    serviceName: string;
    serviceType: "custom" | "speedy";
  } | null>(null);
  const [briefJustSubmitted, setBriefJustSubmitted] = useState(false);

  // Client CRM record (for milestone data)
  const [clientData, setClientData] = useState<CrmClient | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;

    async function load() {
      try {
        const [ord, acts] = await Promise.all([
          actor!.getMyOrders(),
          actor!.getMyActivity(),
        ]);
        if (!cancelled) {
          const orders = Array.isArray(ord) ? ord : [];
          const activeOrder =
            orders.find((o) => {
              const key = Object.keys(o.status)[0];
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
        const status = await actor!.getClientBriefStatus(userEmail);
        if (!cancelled) setBriefStatus(status ?? null);

        const client = await actor!.getClientByEmail(userEmail);
        if (!cancelled && client) {
          const detected = detectSiteServiceType(client.activeServices ?? []);
          setSiteService(detected);
          setClientData(client);
        } else if (!cancelled) {
          setClientData(null);
        }
      } catch {
        if (!cancelled) {
          setBriefStatus(null);
          setClientData(null);
        }
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
    siteService !== null &&
    (briefStatus === "Pending" || briefStatus === null) &&
    !briefJustSubmitted;
  const showSubmittedBanner = briefStatus === "Submitted" || briefJustSubmitted;

  async function handleBriefSubmitted() {
    setBriefJustSubmitted(true);
    if (actor && userEmail) {
      try {
        await (actor as backendInterface).updateClientBriefStatus("Submitted");
        setBriefStatus("Submitted");
        const updatedClient = await actor.getClientByEmail(userEmail);
        if (updatedClient) {
          setClientData(updatedClient);
        }
      } catch {
        // Optimistic update already applied via briefJustSubmitted
      }
    }
  }

  // Quick actions
  const quickActions = [
    {
      icon: <Clipboard size={22} />,
      label: "Complete Questionnaire",
      textKey: "portal.dashboard.quick-action.questionnaire",
      path: "/portal/questionnaires",
      ocid: "dashboard.questionnaire.link",
    },
    {
      icon: <FileText size={22} />,
      label: "View Invoices",
      textKey: "portal.dashboard.quick-action.invoices",
      path: "/portal/invoices",
      ocid: "dashboard.invoices.link",
    },
    {
      icon: <Edit size={22} />,
      label: "Submit Edit Request",
      textKey: "portal.dashboard.quick-action.edit-requests",
      path: "/portal/edit-requests",
      ocid: "dashboard.edit-requests.link",
    },
    {
      icon: <Settings size={22} />,
      label: "Manage Subscription",
      textKey: "portal.dashboard.quick-action.subscriptions",
      path: "/portal/subscriptions",
      ocid: "dashboard.subscriptions.link",
    },
  ];

  return (
    <PortalLayout pageTitle="Dashboard">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .qa-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.10);
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ===== WELCOME BANNER ===== */}
        <div
          data-ocid="dashboard.welcome.panel"
          style={{
            background: "rgba(14,16,32,1)",
            borderRadius: "8px",
            padding: "24px",
          }}
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
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#EEF0F8",
                }}
              >
                Welcome back{firstName ? `, ${firstName}` : ""}.
              </h2>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "14px",
                  color: "#7A7D90",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.welcome.subheading"
                  defaultText="Here is where your project stands today."
                  as="span"
                />
              </p>
            </>
          )}
        </div>

        {/* ===== PROJECT TIMELINE (All clients with a CRM record) ===== */}
        {clientData != null && (
          <ProjectTimeline
            currentMilestone={
              typeof (
                clientData as (CrmClient & { currentMilestone?: number }) | null
              )?.currentMilestone === "number"
                ? (clientData as CrmClient & { currentMilestone: number })
                    .currentMilestone
                : 0
            }
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

        {/* ===== DUAL-CARD ONBOARDING (Pending) ===== */}
        {showActionRequired && siteService && (
          <div
            data-ocid="dashboard.action-required.panel"
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(251,146,60,0.35)",
              background: "rgba(124,45,18,0.14)",
              padding: "20px 20px 24px",
            }}
          >
            <DualCardOnboarding
              serviceType={siteService.serviceType}
              serviceName={siteService.serviceName}
              userEmail={userEmail}
              clientName={firstName}
              productTier={siteService.serviceName}
              onBriefSubmitted={handleBriefSubmitted}
            />
          </div>
        )}

        {/* ===== BRIEF SUBMITTED CONFIRMATION ===== */}
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
              style={{ fontSize: "20px", lineHeight: 1, marginTop: "2px" }}
              aria-hidden="true"
            >
              ✓
            </span>
            <div>
              <h3
                style={{
                  margin: "0 0 4px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#5EF08A",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.brief-submitted.heading"
                  defaultText="Build Status: Reviewing Brief"
                  as="span"
                />
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#86EFAC",
                  lineHeight: "1.5",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.brief-submitted.body"
                  defaultText="Your questionnaire has been received. Our team will contact you within 24 hours."
                  as="span"
                />
              </p>
            </div>
          </div>
        )}

        {/* ===== PROJECT STATUS CARD ===== */}
        <div
          data-ocid="dashboard.project.card"
          style={{
            background: "rgba(17,19,34,0.7)",
            borderRadius: "8px",
            padding: "24px",
            border: "1px solid #1C1F33",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            <EditableText
              textKey="portal.dashboard.project-card.heading"
              defaultText="Your Current Project"
              as="span"
            />
          </h3>

          {isLoading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
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
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              {/* Tier */}
              <div data-ocid="dashboard.project.tier.panel">
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "12px",
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <EditableText
                    textKey="portal.dashboard.project-card.tier-label"
                    defaultText="Tier"
                    as="span"
                  />
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  {order.tier_code}
                </p>
              </div>

              {/* Status */}
              <div data-ocid="dashboard.project.status.panel">
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "12px",
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <EditableText
                    textKey="portal.dashboard.project-card.status-label"
                    defaultText="Status"
                    as="span"
                  />
                </p>
                {(() => {
                  const cfg = getStatusConfig(order.status);
                  return (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        background: cfg.bg,
                        color: cfg.color,
                      }}
                    >
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Delivery Window */}
              <div data-ocid="dashboard.project.delivery.panel">
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "12px",
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <EditableText
                    textKey="portal.dashboard.project-card.delivery-label"
                    defaultText="Delivery Window"
                    as="span"
                  />
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  {order.delivery_window || "—"}
                </p>
              </div>

              {/* Launch Target */}
              <div data-ocid="dashboard.project.launch.panel">
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "12px",
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <EditableText
                    textKey="portal.dashboard.project-card.launch-label"
                    defaultText="Launch Target"
                    as="span"
                  />
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  {order.launch_target || "—"}
                </p>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div
              data-ocid="dashboard.project.empty_state"
              style={{ textAlign: "center", padding: "32px 0" }}
            >
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "15px",
                  color: "#7A7D90",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.project-card.empty-state"
                  defaultText="No active project yet. Ready to get started?"
                  as="span"
                />
              </p>
              <Link
                to="/get-started"
                data-ocid="dashboard.get-started.button"
                style={{
                  display: "inline-block",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  background: "#5EF08A",
                  color: "#061209",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                <EditableText
                  textKey="portal.dashboard.project-card.get-started-cta"
                  defaultText="Get Started"
                  as="span"
                />
              </Link>
            </div>
          )}
        </div>

        {/* ===== QUICK ACTIONS ROW ===== */}
        <div
          data-ocid="dashboard.quick-actions.panel"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "16px" }}
        >
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(17,19,34,0.7)",
                    borderRadius: "8px",
                    border: "1px solid #1C1F33",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Skeleton
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    }}
                  />
                  <Skeleton style={{ width: "100px", height: "14px" }} />
                </div>
              ))
            : quickActions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path as never}
                  data-ocid={action.ocid}
                  className="qa-card"
                  style={{
                    background: "rgba(17,19,34,0.7)",
                    borderRadius: "8px",
                    border: "1px solid #1C1F33",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "box-shadow 0.15s",
                  }}
                >
                  <span
                    style={{
                      color: "#0F766E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-hidden="true"
                  >
                    {action.icon}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#EEF0F8",
                      textAlign: "center",
                    }}
                  >
                    <EditableText
                      textKey={action.textKey}
                      defaultText={action.label}
                      as="span"
                    />
                  </span>
                </Link>
              ))}
        </div>

        {/* ===== RECENT ACTIVITY FEED ===== */}
        <div
          data-ocid="dashboard.activity.panel"
          style={{
            background: "rgba(17,19,34,0.7)",
            borderRadius: "8px",
            padding: "24px",
            border: "1px solid #1C1F33",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            <EditableText
              textKey="portal.dashboard.activity.heading"
              defaultText="Recent Activity"
              as="span"
            />
          </h3>

          {isLoading ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Skeleton
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      flexShrink: 0,
                    }}
                  />
                  <Skeleton style={{ flex: 1, height: "14px" }} />
                  <Skeleton style={{ width: "60px", height: "12px" }} />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <p
              data-ocid="dashboard.activity.error_state"
              style={{ color: "#991B1B", fontSize: "14px", margin: 0 }}
            >
              <EditableText
                textKey="portal.dashboard.activity.error"
                defaultText="Could not load activity. Please refresh."
                as="span"
              />
            </p>
          ) : !activity || activity.length === 0 ? (
            <p
              data-ocid="dashboard.activity.empty_state"
              style={{ color: "#7A7D90", fontSize: "14px", margin: 0 }}
            >
              <EditableText
                textKey="portal.dashboard.activity.empty-state"
                defaultText="No activity yet. Your project updates will appear here."
                as="span"
              />
            </p>
          ) : (
            <ul
              style={{ listStyle: "none", margin: 0, padding: 0 }}
              data-ocid="dashboard.activity.list"
            >
              {activity.slice(0, 5).map((item, idx) => {
                const cfg = getStatusConfig(item.status_at_time);
                return (
                  <li
                    key={String(item.id)}
                    data-ocid={`dashboard.activity.item.${idx + 1}`}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      paddingBottom: "12px",
                      marginBottom: "12px",
                      borderBottom:
                        idx < Math.min(activity.length, 5) - 1
                          ? "1px solid #1C1F33"
                          : "none",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: cfg.dot,
                        marginTop: "5px",
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: "14px",
                        color: "#EEF0F8",
                        lineHeight: "1.4",
                      }}
                    >
                      {item.description}
                    </span>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: "12px",
                        color: "#7A7D90",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatTimestamp(item.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ===== REFERRAL SECTION ===== */}
        <EarnFreeHostingSection
          userEmail={userEmail}
          actor={actor as backendInterface}
          actorReady={!isFetching && !!actor}
        />
      </div>
    </PortalLayout>
  );
}
