import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  GitBranch,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ReferralStat } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

// ─── Glassmorphism card style (matches admin panel system) ────────────────────
const glassCard: React.CSSProperties = {
  background: "rgba(10,10,10,0.75)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",
  border: "1px solid rgba(57,255,20,0.12)",
  borderRadius: "12px",
  boxShadow:
    "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.6), 0 2px 0 rgba(255,255,255,0.06) inset",
};

const neonGreen = "#39FF14";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        ...glassCard,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        flex: "1 1 140px",
        minWidth: "140px",
      }}
    >
      <span
        style={{
          color: "#7A7D90",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "#fff",
          fontSize: "22px",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Generate Partner Link Modal ──────────────────────────────────────────────
interface GenerateModalProps {
  adminEmail: string;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#ccc",
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

function GenerateModal({ adminEmail, onClose, onSuccess }: GenerateModalProps) {
  const { actor, isFetching } = useActor();
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleBackdropKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") onClose();
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor || isFetching) return;
    setLoading(true);
    try {
      const url = await actor.generatePartnerLink(
        adminEmail,
        partnerName.trim(),
        partnerEmail.trim(),
      );
      setGeneratedUrl(url);
      onSuccess(url);
    } catch (err) {
      toast.error("Failed to generate partner link. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function copyUrl() {
    if (!generatedUrl) return;
    navigator.clipboard
      .writeText(generatedUrl)
      .then(() => toast.success("Link copied!"))
      .catch(() => {});
  }

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <dialog
        open
        aria-label="Generate Partner Link"
        style={{
          width: "100%",
          maxWidth: "480px",
          position: "relative",
          display: "block",
          border: "1px solid rgba(57,255,20,0.12)",
          background: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.8)",
          borderRadius: "12px",
          margin: 0,
          padding: "32px",
          color: "#fff",
        }}
      >
        {/* Close */}
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#7A7D90",
            padding: "4px",
            display: "flex",
          }}
        >
          <X size={18} />
        </button>

        <h2
          style={{
            color: "#fff",
            fontSize: "18px",
            fontWeight: 700,
            margin: "0 0 6px",
          }}
        >
          Generate Partner Link
        </h2>
        <p style={{ color: "#7A7D90", fontSize: "13px", margin: "0 0 24px" }}>
          Create a unique referral link for a new partner.
        </p>

        {!generatedUrl ? (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label htmlFor="partner-name" style={labelStyle}>
                Partner Name
              </label>
              <input
                id="partner-name"
                ref={nameRef}
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. Jane Smith"
                required
                data-ocid="admin.referrals.partner-name.input"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="partner-email" style={labelStyle}>
                Partner Email
              </label>
              <input
                id="partner-email"
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="e.g. jane@company.com"
                required
                data-ocid="admin.referrals.partner-email.input"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !partnerName.trim() || !partnerEmail.trim()}
              data-ocid="admin.referrals.generate.submit"
              style={{
                marginTop: "8px",
                padding: "12px 24px",
                background: loading ? "rgba(57,255,20,0.3)" : neonGreen,
                color: "#0a0a0a",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <GitBranch size={16} />
              )}
              {loading ? "Generating…" : "Generate Link"}
            </button>
          </form>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                padding: "12px",
                background: "rgba(57,255,20,0.06)",
                border: "1px solid rgba(57,255,20,0.25)",
                borderRadius: "8px",
              }}
            >
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 6px",
                }}
              >
                Partner Link Generated
              </p>
              <p
                style={{
                  color: neonGreen,
                  fontSize: "13px",
                  wordBreak: "break-all",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {generatedUrl}
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={copyUrl}
                data-ocid="admin.referrals.copy-url.button"
                style={{
                  flex: 1,
                  padding: "10px",
                  background: neonGreen,
                  color: "#0a0a0a",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Copy size={14} />
                Copy Link
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 16px",
                  background: "rgba(255,255,255,0.06)",
                  color: "#ccc",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </dialog>
      <style>
        {
          "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"
        }
      </style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminReferralsPage() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const adminEmail = getAdminEmail();

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery<ReferralStat[]>({
    queryKey: ["referralStats", adminEmail],
    queryFn: async () => {
      if (!actor || !adminEmail) return [];
      return actor.getReferralStats(adminEmail);
    },
    enabled: !!actor && !isFetching && !!adminEmail,
  });

  // Sort by conversions descending
  const sorted = (stats ?? [])
    .slice()
    .sort(
      (a, b) =>
        Number(b.successfulConversions) - Number(a.successfulConversions),
    );

  const totalClicks = sorted.reduce((acc, s) => acc + Number(s.totalClicks), 0);
  const totalConversions = sorted.reduce(
    (acc, s) => acc + Number(s.successfulConversions),
    0,
  );

  function handleGenerateSuccess(_url: string) {
    queryClient.invalidateQueries({ queryKey: ["referralStats"] });
    toast.success("Partner link generated successfully!");
  }

  return (
    <AdminLayout pageTitle="Referrals">
      {/* ── Header row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              color: "#fff",
              fontSize: "22px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Referral Control Center
          </h1>
          <p style={{ color: "#7A7D90", fontSize: "13px", margin: "4px 0 0" }}>
            All active referral links, click counts, and first-purchase
            conversions.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => refetch()}
            aria-label="Refresh referral stats"
            data-ocid="admin.referrals.refresh.button"
            style={{
              padding: "10px 14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#ccc",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              transition: "background 0.2s",
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            data-ocid="admin.referrals.generate-partner.button"
            style={{
              padding: "10px 18px",
              background: neonGreen,
              color: "#0a0a0a",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow:
                "0 0 12px rgba(57,255,20,0.4), 0 0 32px rgba(57,255,20,0.15)",
              transition: "opacity 0.2s",
            }}
          >
            <Plus size={16} />
            Generate Partner Link
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "28px",
        }}
      >
        <StatCard label="Active Links" value={sorted.length} />
        <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} />
        <StatCard
          label="Conversions"
          value={totalConversions.toLocaleString()}
        />
        <StatCard
          label="Conversion Rate"
          value={
            totalClicks > 0
              ? `${((totalConversions / totalClicks) * 100).toFixed(1)}%`
              : "—"
          }
        />
      </div>

      {/* ── Table card ── */}
      <div style={{ ...glassCard, overflow: "hidden" }}>
        {isLoading ? (
          <div
            style={{
              padding: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              color: "#7A7D90",
            }}
          >
            <Loader2
              size={20}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span>Loading referral data…</span>
          </div>
        ) : isError ? (
          <div
            style={{ padding: "60px", textAlign: "center", color: "#f87171" }}
          >
            <p style={{ margin: 0 }}>Failed to load referral stats.</p>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                marginTop: "12px",
                color: neonGreen,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Retry
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div
            data-ocid="admin.referrals.empty-state"
            style={{ padding: "72px", textAlign: "center" }}
          >
            <GitBranch
              size={40}
              style={{
                color: "rgba(57,255,20,0.3)",
                margin: "0 auto 16px",
                display: "block",
              }}
            />
            <p
              style={{
                color: "#fff",
                fontSize: "16px",
                fontWeight: 600,
                margin: "0 0 6px",
              }}
            >
              No referral links yet
            </p>
            <p
              style={{ color: "#7A7D90", fontSize: "13px", margin: "0 0 20px" }}
            >
              Generate your first partner link to start tracking referrals.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              data-ocid="admin.referrals.empty-cta.button"
              style={{
                padding: "10px 20px",
                background: neonGreen,
                color: "#0a0a0a",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              + Generate Partner Link
            </button>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              WebkitOverflowScrolling:
                "touch" as React.CSSProperties["WebkitOverflowScrolling"],
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 640,
              }}
            >
              <thead>
                <tr
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {[
                    "Referral Code",
                    "Referrer Name",
                    "Referrer Email",
                    "Total Clicks",
                    "Conversions",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 20px",
                        textAlign:
                          h === "Total Clicks" || h === "Conversions"
                            ? "right"
                            : "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#7A7D90",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((stat, idx) => (
                  <ReferralRow
                    key={stat.code}
                    stat={stat}
                    zebra={idx % 2 === 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <GenerateModal
          adminEmail={adminEmail}
          onClose={() => setShowModal(false)}
          onSuccess={handleGenerateSuccess}
        />
      )}
    </AdminLayout>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function ReferralRow({ stat, zebra }: { stat: ReferralStat; zebra: boolean }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard
      .writeText(stat.code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  }

  const conversions = Number(stat.successfulConversions);
  const clicks = Number(stat.totalClicks);

  return (
    <tr
      data-ocid={`admin.referrals.row.${stat.code}`}
      style={{
        background: zebra ? "rgba(255,255,255,0.02)" : "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.15s",
      }}
    >
      {/* Code */}
      <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
        <span
          style={{
            fontFamily: "monospace",
            background: "rgba(57,255,20,0.08)",
            color: neonGreen,
            padding: "3px 10px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {stat.code}
        </span>
      </td>

      {/* Name */}
      <td
        style={{
          padding: "14px 20px",
          color: "#fff",
          fontSize: "14px",
          whiteSpace: "nowrap",
        }}
      >
        {stat.referrerName || "—"}
      </td>

      {/* Email */}
      <td
        style={{
          padding: "14px 20px",
          color: "#7A7D90",
          fontSize: "13px",
          whiteSpace: "nowrap",
        }}
      >
        {stat.referrerEmail}
      </td>

      {/* Clicks */}
      <td
        style={{
          padding: "14px 20px",
          textAlign: "right",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {clicks.toLocaleString()}
      </td>

      {/* Conversions */}
      <td
        style={{
          padding: "14px 20px",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            color: conversions > 0 ? neonGreen : "#7A7D90",
            fontSize: "14px",
            fontWeight: 700,
            textShadow:
              conversions > 0 ? "0 0 8px rgba(57,255,20,0.5)" : "none",
          }}
        >
          {conversions.toLocaleString()}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button
            type="button"
            onClick={copyCode}
            aria-label={`Copy referral code ${stat.code}`}
            data-ocid={`admin.referrals.copy.${stat.code}`}
            title="Copy code"
            style={{
              padding: "6px 12px",
              background: copied
                ? "rgba(57,255,20,0.2)"
                : "rgba(255,255,255,0.06)",
              border: copied
                ? "1px solid rgba(57,255,20,0.4)"
                : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: copied ? neonGreen : "#ccc",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.15s",
            }}
          >
            <Copy size={12} />
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={`${window.location.origin}?ref=${stat.code}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open referral link for ${stat.code}`}
            data-ocid={`admin.referrals.open.${stat.code}`}
            title="Preview link"
            style={{
              padding: "6px 10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "#ccc",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s",
            }}
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </td>
    </tr>
  );
}
