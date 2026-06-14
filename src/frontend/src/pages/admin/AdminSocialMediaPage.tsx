import {
  AlertTriangle,
  CheckCircle2,
  Facebook,
  Instagram,
  Linkedin,
  RefreshCw,
  Save,
  Share2,
  Youtube,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { backendInterface } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

interface SaveStatus {
  type: "idle" | "saving" | "success" | "error";
  message?: string;
}

// ─── TikTok icon (lucide doesn't have one) ───────────────────────────────────
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.28 8.28 0 0 0 4.84 1.55V7.05a4.85 4.85 0 0 1-1.07-.36z" />
    </svg>
  );
}

// ─── Platform config ─────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    key: "facebookUrl" as const,
    label: "Facebook Page URL",
    icon: Facebook,
    placeholder: "https://www.facebook.com/yourpage",
    hint: "Paste your Facebook Page URL. Used to embed your page\u2019s latest posts in the public Social Feed section.",
    ocid: "admin.social-media.facebook.input",
    color: "#1877F2",
  },
  {
    key: "instagramUrl" as const,
    label: "Instagram Post URL",
    icon: Instagram,
    placeholder: "https://www.instagram.com/p/XXXXX/",
    hint: "Paste a specific Instagram post URL (e.g. https://www.instagram.com/p/XXXXX/). This will show that exact post \u2014 it does not auto-update to your newest post.",
    ocid: "admin.social-media.instagram.input",
    color: "#E1306C",
  },
  {
    key: "tiktokUrl" as const,
    label: "TikTok Video URL",
    icon: TikTokIcon,
    placeholder: "https://www.tiktok.com/@user/video/1234567890",
    hint: "Paste a specific TikTok video URL (e.g. https://www.tiktok.com/@user/video/1234567890). This will show that exact video \u2014 it does not auto-update to your newest content.",
    ocid: "admin.social-media.tiktok.input",
    color: "#69C9D0",
  },
  {
    key: "linkedinUrl" as const,
    label: "LinkedIn Profile or Company Page URL",
    icon: Linkedin,
    placeholder: "https://www.linkedin.com/company/yourcompany",
    hint: "Paste your LinkedIn company page or personal profile URL. Displayed using the official LinkedIn Page embed badge.",
    ocid: "admin.social-media.linkedin.input",
    color: "#0A66C2",
  },
  {
    key: "youtubeUrl" as const,
    label: "YouTube Channel URL",
    icon: Youtube,
    placeholder: "https://www.youtube.com/@yourchannel",
    hint: "Paste your YouTube channel URL. Both formats work: the modern https://www.youtube.com/@channelname or the older https://www.youtube.com/channel/UC\u2026 format.",
    ocid: "admin.social-media.youtube.input",
    color: "#FF0000",
  },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminSocialMediaPage() {
  const { actor, isFetching } = useActor();

  const [values, setValues] = useState<Record<PlatformKey, string>>({
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: "idle" });
  const [configLoadError, setConfigLoadError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  // ── Load existing config (callable on mount and manually) ─────────────────
  const loadConfig = useCallback(async () => {
    if (!actor || isFetching) return;
    setReloading(true);
    try {
      const result = await (actor as backendInterface).getSocialMediaConfig();
      if ("ok" in result) {
        const cfg = result.ok;
        setValues({
          facebookUrl: cfg.facebookUrl ?? "",
          instagramUrl: cfg.instagramUrl ?? "",
          tiktokUrl: cfg.tiktokUrl ?? "",
          linkedinUrl: cfg.linkedinUrl ?? "",
          youtubeUrl: cfg.youtubeUrl ?? "",
        });
        setConfigLoadError(null);
      } else {
        setConfigLoadError(
          "Failed to load social media configuration. Please refresh the page.",
        );
      }
    } catch {
      setConfigLoadError(
        "Failed to load social media configuration. Please refresh the page.",
      );
    } finally {
      setReloading(false);
    }
  }, [actor, isFetching]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!actor) return;

    setSaveStatus({ type: "saving" });

    const config = {
      facebookUrl: values.facebookUrl.trim(),
      instagramUrl: values.instagramUrl.trim(),
      tiktokUrl: values.tiktokUrl.trim(),
      linkedinUrl: values.linkedinUrl.trim(),
      youtubeUrl: values.youtubeUrl.trim(),
    };

    try {
      const result = await (actor as backendInterface).setSocialMediaConfig(
        config,
      );

      if ("ok" in result || "okAlreadyAdvanced" in result) {
        setSaveStatus({
          type: "success",
          message: "Social media settings saved successfully.",
        });
        setTimeout(() => setSaveStatus({ type: "idle" }), 4000);
      } else {
        setSaveStatus({
          type: "error",
          message: `Failed to save: ${
            "err" in result ? result.err : "Unknown error"
          }`,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSaveStatus({ type: "error", message: `Failed to save: ${msg}` });
    }
  }

  const configuredCount = Object.values(values).filter((v) => v.trim()).length;

  return (
    <AdminLayout pageTitle="Social Media">
      <div className="max-w-2xl space-y-8">
        {/* ── Config Load Error ────────────────────────────────────────── */}
        {configLoadError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-xs font-medium">
              {configLoadError}
            </p>
          </div>
        )}

        {/* ── Status Header ───────────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(10,11,20,0.85)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "12px",
          }}
          className="flex items-center gap-4 p-5"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#5EF08A]/15">
            <Share2 size={20} className="text-[#5EF08A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Social Media Integration
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              Configure your social profile URLs. The public{" "}
              <span className="text-gray-300 font-medium">Social Feed</span>{" "}
              section displays official embed widgets for each connected
              platform \u2014 only platforms with a configured URL will appear.
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
              configuredCount > 0
                ? "bg-[#5EF08A]/15 text-[#5EF08A]"
                : "bg-white/8 text-gray-400"
            }`}
          >
            {configuredCount > 0
              ? `${configuredCount} CONNECTED`
              : "NOT CONNECTED"}
          </div>
        </div>

        {/* ── Configuration Form ──────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(10,11,20,0.85)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "12px",
          }}
          className="overflow-hidden"
        >
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Save size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm flex-1">
              <TypewriterText className="matrix-heading" text="Platform URLs" />
            </h2>
            <button
              type="button"
              onClick={loadConfig}
              disabled={reloading}
              data-ocid="admin.social-media.reload.button"
              className="border border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-400 px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={13}
                className={reloading ? "animate-spin" : ""}
              />
              Reload
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-6">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              return (
                <div key={platform.key}>
                  <label
                    htmlFor={`social-${platform.key}`}
                    style={{
                      color: "#5EF08A",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ color: platform.color }}>
                      <Icon size={13} />
                    </span>
                    {platform.label}
                  </label>
                  <input
                    id={`social-${platform.key}`}
                    type="url"
                    value={values[platform.key]}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [platform.key]: e.target.value,
                      }))
                    }
                    placeholder={platform.placeholder}
                    autoComplete="off"
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      border: "1px solid rgba(94,240,138,0.3)",
                      color: "#EEF0F8",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      width: "100%",
                      fontFamily: "'Courier New', monospace",
                      outline: "none",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                    className=""
                    data-ocid={platform.ocid}
                  />
                  <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
                    {platform.hint}
                  </p>
                </div>
              );
            })}

            {saveStatus.type === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#5EF08A]/10 border border-[#5EF08A]/20">
                <CheckCircle2 size={14} className="text-[#5EF08A] shrink-0" />
                <p className="text-[#5EF08A] text-xs font-medium">
                  {saveStatus.message}
                </p>
              </div>
            )}
            {saveStatus.type === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">{saveStatus.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saveStatus.type === "saving"}
              data-ocid="admin.social-media.save.button"
              style={{
                background:
                  saveStatus.type === "saving"
                    ? "rgba(94,240,138,0.2)"
                    : "#5EF08A",
                color: "#0A0B14",
                fontWeight: 700,
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                cursor:
                  saveStatus.type === "saving" ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Save size={14} />
              {saveStatus.type === "saving" ? "Saving\u2026" : "Save Settings"}
            </button>
          </form>
        </div>

        {/* ── How Embeds Work ─────────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(10,11,20,0.85)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "12px",
          }}
          className="overflow-hidden"
        >
          <div className="p-5 border-b border-white/10">
            <h2 className="text-white font-semibold text-sm">
              <TypewriterText
                className="matrix-heading"
                text="How the Social Feed Works"
              />
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              {
                title: "Official embeds only",
                body: "Each platform\u2019s content loads directly from their servers using their official embed widgets \u2014 no API keys, no backend data fetching, no third-party scraping.",
              },
              {
                title: "Automatic visibility",
                body: "Each platform\u2019s slot only appears on the public site if you have entered a URL for it. Empty platforms are hidden \u2014 no blank cards or placeholders.",
              },
              {
                title: "Responsive grid",
                body: "The Social Feed section displays in a responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile. Each card shows the platform name and logo above the embed.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="flex gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(94,240,138,0.15)" }}
                >
                  <span
                    className="text-[8px] font-black"
                    style={{ color: "#5EF08A" }}
                  >
                    ✓
                  </span>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
