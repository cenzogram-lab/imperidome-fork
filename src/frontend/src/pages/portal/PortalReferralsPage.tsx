import {
  Check,
  Copy,
  Gift,
  Loader2,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  loading: boolean;
  ocid: string;
}

function StatCard({ icon, label, value, loading, ocid }: StatCardProps) {
  return (
    <div
      data-ocid={ocid}
      style={{
        flex: 1,
        minWidth: "160px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(17,19,34,0.8)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "rgba(94,240,138,0.1)",
          border: "1px solid rgba(94,240,138,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#5EF08A",
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#7A7D90",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </p>
        {loading ? (
          <div
            style={{
              height: "28px",
              width: "60px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.06)",
              animation: "shimmer 1.4s ease-in-out infinite",
            }}
          />
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              color: "#EEF0F8",
              lineHeight: 1,
            }}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copied toast (inline, green, auto-fades)
// ---------------------------------------------------------------------------
function CopiedToast({ visible }: { visible: boolean }) {
  return (
    <div
      data-ocid="referrals.copied.toast"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 9999,
        padding: "12px 20px",
        borderRadius: "10px",
        background: "rgba(5,46,22,0.97)",
        border: "1px solid rgba(94,240,138,0.4)",
        color: "#86EFAC",
        fontSize: "14px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      <Check size={14} strokeWidth={3} />
      Copied!
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PortalReferralsPage() {
  const { session } = useSession();
  const clientEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [conversions, setConversions] = useState<bigint | null>(null);
  const [clicks, setClicks] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [clicksError, setClicksError] = useState<string | null>(null);
  const [conversionsError, setConversionsError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const referralUrl = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : "";

  // Fetch referral code + conversion count on mount
  useEffect(() => {
    if (!actor || isFetching || !clientEmail) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setCodeError(null);
      setClicksError(null);
      setConversionsError(null);

      // Fetch each stat independently so one failure doesn't block the others
      const [codeResult, convsResult, clksResult] = await Promise.allSettled([
        actor!.getOrCreateMyReferralCode(),
        actor!.getMyReferralConversions(clientEmail),
        actor!.getMyReferralClicks(),
      ]);

      if (!cancelled) {
        if (codeResult.status === "fulfilled") {
          setReferralCode(codeResult.value);
        } else {
          setCodeError("Could not load referral link. Refresh to try again.");
        }

        if (convsResult.status === "fulfilled") {
          setConversions(convsResult.value);
        } else {
          setConversionsError("Could not load conversions.");
        }

        if (clksResult.status === "fulfilled") {
          setClicks(clksResult.value);
        } else {
          setClicksError("Could not load clicks.");
        }

        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, clientEmail]);

  function handleCopy() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2500);
    });
  }

  const isLoading = isFetching || loading;
  // Overall error only when all three queries failed
  const totalError = !!codeError && !!clicksError && !!conversionsError;

  return (
    <PortalLayout pageTitle="Referrals">
      <div
        data-ocid="referrals.page"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          maxWidth: "760px",
        }}
      >
        {/* Page header */}
        <div data-ocid="referrals.page-header">
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#EEF0F8",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Gift size={22} style={{ color: "#5EF08A" }} />
            Referral Program
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#7A7D90" }}>
            Share your unique link and earn rewards when your referrals become
            clients.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div
            data-ocid="referrals.loading_state"
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(17,19,34,0.8)",
              padding: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              color: "#7A7D90",
              fontSize: "14px",
            }}
          >
            <Loader2
              size={18}
              style={{ animation: "spin 0.8s linear infinite" }}
            />
            Loading your referral link…
          </div>
        )}

        {/* Error state — only when all three queries failed */}
        {!isLoading && totalError && (
          <div
            data-ocid="referrals.error_state"
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(69,10,10,0.3)",
              padding: "20px 24px",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", color: "#FCA5A5" }}>
              Unable to load your referral data. Please refresh the page and try
              again.
            </p>
          </div>
        )}

        {/* Main content — shown as long as not all queries failed */}
        {!isLoading && !totalError && (
          <>
            {/* Stat cards row */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <StatCard
                icon={<MousePointerClick size={18} />}
                label="Total Clicks"
                value={
                  clicksError ? "Error" : clicks !== null ? Number(clicks) : "—"
                }
                loading={false}
                ocid="referrals.clicks.card"
              />
              {clicksError && (
                <p
                  style={{
                    width: "100%",
                    margin: "-16px 0 0",
                    fontSize: "11px",
                    color: "#FCA5A5",
                  }}
                >
                  {clicksError}
                </p>
              )}
              <StatCard
                icon={<TrendingUp size={18} />}
                label="Conversions"
                value={
                  conversionsError
                    ? "Error"
                    : conversions !== null
                      ? Number(conversions)
                      : "—"
                }
                loading={false}
                ocid="referrals.conversions.card"
              />
              {conversionsError && (
                <p
                  style={{
                    width: "100%",
                    margin: "-16px 0 0",
                    fontSize: "11px",
                    color: "#FCA5A5",
                  }}
                >
                  {conversionsError}
                </p>
              )}
            </div>

            {/* Referral link card — or inline error if code failed */}
            {codeError ? (
              <div
                data-ocid="referrals.link.error_state"
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(69,10,10,0.3)",
                  padding: "20px 24px",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", color: "#FCA5A5" }}>
                  {codeError}
                </p>
              </div>
            ) : (
              <div
                data-ocid="referrals.link.card"
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(94,240,138,0.2)",
                  background: "rgba(17,19,34,0.8)",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: "0 0 6px",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#EEF0F8",
                    }}
                  >
                    Your Referral Link
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#7A7D90",
                      lineHeight: "1.5",
                    }}
                  >
                    Share this link with friends or colleagues. You’ll receive
                    credit every time someone signs up.
                  </p>
                </div>

                {/* Plain text URL */}
                <p
                  data-ocid="referrals.url.text"
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#7A7D90",
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                  }}
                >
                  {referralUrl}
                </p>

                {/* Copyable input + button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0",
                    borderRadius: "8px",
                    border: "1px solid rgba(94,240,138,0.35)",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <input
                    data-ocid="referrals.url.input"
                    type="text"
                    readOnly
                    value={referralUrl}
                    aria-label="Referral link"
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#B0B3C6",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      minWidth: 0,
                    }}
                  />
                  <button
                    type="button"
                    data-ocid="referrals.copy.button"
                    onClick={handleCopy}
                    aria-label="Copy referral link"
                    style={{
                      flexShrink: 0,
                      padding: "12px 18px",
                      minHeight: "44px",
                      background: copied
                        ? "rgba(94,240,138,0.2)"
                        : "rgba(94,240,138,0.1)",
                      border: "none",
                      borderLeft: "1px solid rgba(94,240,138,0.25)",
                      cursor: "pointer",
                      color: "#5EF08A",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      transition: "background 0.2s",
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={14} strokeWidth={3} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Code badge */}
                {referralCode && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#7A7D90",
                        fontWeight: 500,
                      }}
                    >
                      Your code:
                    </span>
                    <span
                      data-ocid="referrals.code.badge"
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        background: "rgba(94,240,138,0.1)",
                        border: "1px solid rgba(94,240,138,0.25)",
                        color: "#5EF08A",
                        fontSize: "13px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        fontFamily: "monospace",
                      }}
                    >
                      {referralCode}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* How it works */}
            <div
              data-ocid="referrals.how-it-works.card"
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(17,19,34,0.8)",
                padding: "24px 28px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#B0B3C6",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                How It Works
              </h3>
              <ol
                style={{
                  margin: 0,
                  padding: "0 0 0 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {[
                  "Copy your unique referral link above.",
                  "Share it with friends, family, or colleagues who need a website or digital service.",
                  "When they sign up and become a client, your conversion count goes up.",
                  "We\u2019ll reach out to discuss your reward \u2014 thank you for spreading the word!",
                ].map((step) => (
                  <li
                    key={step.slice(0, 20)}
                    style={{
                      fontSize: "14px",
                      color: "#7A7D90",
                      lineHeight: "1.6",
                    }}
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>

      {/* Copied toast */}
      <CopiedToast visible={copied} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </PortalLayout>
  );
}
