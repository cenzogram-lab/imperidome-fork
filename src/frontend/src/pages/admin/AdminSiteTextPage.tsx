import {
  ChevronDown,
  ChevronUp,
  Globe,
  Images,
  Info,
  Link,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  Type,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MarqueeLogo, backendInterface } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import {
  broadcastSiteTextInvalidation,
  useSiteTextStore,
} from "../../store/useSiteTextStore";
import AdminLayout from "./AdminLayout";

const NEON = "#39FF14";
const MUTED = "#7A7D90";
const BORDER = "1px solid #1C1F33";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

// ── Social Media Links editor ──────────────────────────────────────────────

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    key: "social.instagram_url",
    placeholder: "https://instagram.com/youraccount",
  },
  {
    label: "X (Twitter)",
    key: "social.twitter_url",
    placeholder: "https://x.com/youraccount",
  },
  {
    label: "LinkedIn",
    key: "social.linkedin_url",
    placeholder: "https://linkedin.com/company/youraccount",
  },
  {
    label: "TikTok",
    key: "social.tiktok_url",
    placeholder: "https://tiktok.com/@youraccount",
  },
  {
    label: "YouTube",
    key: "social.youtube_url",
    placeholder: "https://youtube.com/@youraccount",
  },
] as const;

function SocialLinksPanel({
  actor,
}: {
  actor: {
    updateSiteText: (
      k: string,
      v: string,
      adminEmail: string,
    ) => Promise<boolean>;
  } | null;
}) {
  const { textMap, updateText } = useSiteTextStore();
  const adminEmail = getAdminEmail();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const { key } of SOCIAL_LINKS) {
        if (!(key in prev)) next[key] = textMap[key] ?? "";
      }
      return next;
    });
  }, [textMap]);

  const handleSave = async (key: string) => {
    if (!actor) return;
    setSaving((s) => ({ ...s, [key]: true }));
    setErrors((e) => ({ ...e, [key]: "" }));
    try {
      await actor.updateSiteText(key, drafts[key] ?? "", adminEmail);
      updateText(key, drafts[key] ?? "");
      broadcastSiteTextInvalidation();
      setSaved((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000);
    } catch {
      setErrors((e) => ({ ...e, [key]: "Save failed. Try again." }));
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  return (
    <div style={{ marginBottom: "48px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "6px",
        }}
      >
        <Globe size={20} color={NEON} />
        <h2
          style={{
            color: "#EEF0F8",
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Social Media Links
        </h2>
      </div>
      <p style={{ color: MUTED, fontSize: "14px", marginBottom: "20px" }}>
        Paste your social media profile URLs below. These power the icons in the
        site footer. Links open in a new tab on the live site. Leave blank to
        keep the icon inactive.
      </p>

      <div
        style={{
          border: BORDER,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(14,16,32,1)",
            borderBottom: BORDER,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Globe size={14} color={NEON} />
          <span
            style={{
              color: "#EEF0F8",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            Social Profiles
          </span>
        </div>

        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {SOCIAL_LINKS.map(({ label, key, placeholder }) => {
            const draft = drafts[key] ?? "";
            const isSaving = saving[key] ?? false;
            const isSaved = saved[key] ?? false;
            const errMsg = errors[key] ?? "";

            return (
              <div key={key}>
                <label
                  htmlFor={`social-url-${key}`}
                  style={{
                    display: "block",
                    color: MUTED,
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {label}
                  <span
                    style={{
                      color: "rgba(122,125,144,0.5)",
                      fontWeight: 400,
                      marginLeft: "8px",
                    }}
                  >
                    ({key})
                  </span>
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    id={`social-url-${key}`}
                    type="url"
                    placeholder={placeholder}
                    value={draft}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [key]: e.target.value }))
                    }
                    data-ocid={`admin.social_links.${key}.input`}
                    style={{
                      flex: 1,
                      background: "rgba(10,10,10,0.9)",
                      border: "1px solid #1C1F33",
                      color: "#EEF0F8",
                      borderRadius: "8px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = NEON;
                      e.currentTarget.style.boxShadow =
                        "0 0 0 2px rgba(57,255,20,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#1C1F33";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSave(key)}
                    disabled={isSaving}
                    data-ocid={`admin.social_links.${key}.save_button`}
                    style={{
                      padding: "9px 18px",
                      borderRadius: "8px",
                      border: "none",
                      background: isSaved ? "rgba(57,255,20,0.15)" : "#5EF08A",
                      color: isSaved ? NEON : "#0A0B14",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: isSaving ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 0.15s, color 0.15s",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      flexShrink: 0,
                    }}
                  >
                    {isSaving ? (
                      <Loader2
                        size={13}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : isSaved ? (
                      "✓ Saved"
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
                {errMsg && (
                  <p
                    style={{
                      color: "#f87171",
                      fontSize: "12px",
                      margin: "4px 0 0",
                    }}
                  >
                    {errMsg}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Google Apps Script URL editor ────────────────────────────────────────────

function GoogleScriptPanel({
  actor,
}: {
  actor: {
    updateSiteText: (
      k: string,
      v: string,
      adminEmail: string,
    ) => Promise<boolean>;
  } | null;
}) {
  const { textMap, updateText } = useSiteTextStore();
  const adminEmail = getAdminEmail();
  const KEY = "google_script_url";

  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    setDraft((prev) => (prev === "" ? (textMap[KEY] ?? "") : prev));
  }, [textMap]);

  const handleSave = async () => {
    if (!actor) return;
    setSaving(true);
    setErrMsg("");
    try {
      await actor.updateSiteText(KEY, draft, adminEmail);
      updateText(KEY, draft);
      broadcastSiteTextInvalidation();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setErrMsg("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginBottom: "48px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "6px",
        }}
      >
        <Link size={20} color={NEON} />
        <h2
          style={{
            color: "#EEF0F8",
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Google Calendar Integration
        </h2>
      </div>
      <p style={{ color: MUTED, fontSize: "14px", marginBottom: "20px" }}>
        Paste your Google Apps Script Web App URL below. This URL is called
        automatically when a new lead books a meeting — it creates the Google
        Calendar event, generates a Google Meet link, and sends 5-minute
        reminders to both you and the client.
      </p>

      <div style={{ border: BORDER, borderRadius: "12px", overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(14,16,32,1)",
            borderBottom: BORDER,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Link size={14} color={NEON} />
          <span
            style={{
              color: "#EEF0F8",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            Google Apps Script URL
          </span>
        </div>

        <div style={{ padding: "20px" }}>
          <label
            htmlFor="google-script-url"
            style={{
              display: "block",
              color: MUTED,
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "6px",
              letterSpacing: "0.04em",
            }}
          >
            Web App URL
            <span
              style={{
                color: "rgba(122,125,144,0.5)",
                fontWeight: 400,
                marginLeft: "8px",
              }}
            >
              (google_script_url)
            </span>
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="google-script-url"
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              data-ocid="admin.google_script.url_input"
              style={{
                flex: 1,
                background: "rgba(10,10,10,0.9)",
                border: "1px solid #1C1F33",
                color: "#EEF0F8",
                borderRadius: "8px",
                padding: "9px 12px",
                fontSize: "13px",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = NEON;
                e.currentTarget.style.boxShadow =
                  "0 0 0 2px rgba(57,255,20,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#1C1F33";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              data-ocid="admin.google_script.save_button"
              style={{
                padding: "9px 18px",
                borderRadius: "8px",
                border: "none",
                background: saved ? "rgba(57,255,20,0.15)" : "#5EF08A",
                color: saved ? NEON : "#0A0B14",
                fontSize: "13px",
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                flexShrink: 0,
              }}
            >
              {saving ? (
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : saved ? (
                "✓ Saved"
              ) : (
                "Save"
              )}
            </button>
          </div>
          {errMsg && (
            <p
              style={{ color: "#f87171", fontSize: "12px", margin: "4px 0 0" }}
            >
              {errMsg}
            </p>
          )}

          {/* Helper note */}
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 14px",
              background: "rgba(57,255,20,0.04)",
              border: "1px solid rgba(57,255,20,0.15)",
              borderRadius: "7px",
            }}
          >
            <Info
              size={13}
              color={NEON}
              style={{ flexShrink: 0, marginTop: "1px" }}
            />
            <p
              style={{
                color: "#C8FACD",
                fontSize: "12px",
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Deploy your Google Apps Script as a Web App (Execute as: Me, Who
              has access: Anyone). Copy the{" "}
              <code
                style={{
                  background: "rgba(57,255,20,0.1)",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              >
                /exec
              </code>{" "}
              URL and paste it here. When a lead selects Google Meet, the script
              receives the booking details, creates a Calendar event with a Meet
              link, sets 5-minute popup and email reminders, and returns the
              Meet URL to save in the CRM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Homepage Video URL editor ──────────────────────────────────────────────

function HomepageVideoPanel({
  actor,
}: {
  actor: {
    updateSiteText: (
      k: string,
      v: string,
      adminEmail: string,
    ) => Promise<boolean>;
  } | null;
}) {
  const { textMap, updateText } = useSiteTextStore();
  const adminEmail = getAdminEmail();
  const KEY = "homepage_video_url";

  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    setDraft((prev) => (prev === "" ? (textMap[KEY] ?? "") : prev));
  }, [textMap]);

  const handleSave = async () => {
    if (!actor) return;
    setSaving(true);
    setErrMsg("");
    try {
      await actor.updateSiteText(KEY, draft, adminEmail);
      updateText(KEY, draft);
      broadcastSiteTextInvalidation();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setErrMsg("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginBottom: "48px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "6px",
        }}
      >
        <Video size={20} color={NEON} />
        <h2
          style={{
            color: "#EEF0F8",
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Homepage Video
        </h2>
      </div>
      <p style={{ color: MUTED, fontSize: "14px", marginBottom: "20px" }}>
        Paste a YouTube embed URL to activate the video showcase on the
        homepage. Leave blank to show the branded placeholder with a play icon.
      </p>

      <div style={{ border: BORDER, borderRadius: "12px", overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(14,16,32,1)",
            borderBottom: BORDER,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Video size={14} color={NEON} />
          <span
            style={{
              color: "#EEF0F8",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            Homepage Video URL
          </span>
        </div>

        <div style={{ padding: "20px" }}>
          <label
            htmlFor="homepage-video-url"
            style={{
              display: "block",
              color: MUTED,
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "6px",
              letterSpacing: "0.04em",
            }}
          >
            Video URL
            <span
              style={{
                color: "rgba(122,125,144,0.5)",
                fontWeight: 400,
                marginLeft: "8px",
              }}
            >
              (homepage_video_url)
            </span>
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="homepage-video-url"
              type="url"
              placeholder="Paste YouTube embed URL or direct video URL"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              data-ocid="admin.homepage_video.input"
              style={{
                flex: 1,
                background: "rgba(10,10,10,0.9)",
                border: "1px solid #1C1F33",
                color: "#EEF0F8",
                borderRadius: "8px",
                padding: "9px 12px",
                fontSize: "13px",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = NEON;
                e.currentTarget.style.boxShadow =
                  "0 0 0 2px rgba(57,255,20,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#1C1F33";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              data-ocid="admin.homepage_video.save_button"
              style={{
                padding: "9px 18px",
                borderRadius: "8px",
                border: "none",
                background: saved ? "rgba(57,255,20,0.15)" : "#5EF08A",
                color: saved ? NEON : "#0A0B14",
                fontSize: "13px",
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                flexShrink: 0,
              }}
            >
              {saving ? (
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : saved ? (
                "✓ Saved"
              ) : (
                "Save"
              )}
            </button>
          </div>
          {errMsg && (
            <p
              style={{ color: "#f87171", fontSize: "12px", margin: "4px 0 0" }}
            >
              {errMsg}
            </p>
          )}

          {/* Helper note */}
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 14px",
              background: "rgba(57,255,20,0.04)",
              border: "1px solid rgba(57,255,20,0.15)",
              borderRadius: "7px",
            }}
          >
            <Info
              size={13}
              color={NEON}
              style={{ flexShrink: 0, marginTop: "1px" }}
            />
            <p
              style={{
                color: "#C8FACD",
                fontSize: "12px",
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Use a YouTube embed URL for best results:{" "}
              <code
                style={{
                  background: "rgba(57,255,20,0.1)",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              >
                https://www.youtube.com/embed/VIDEO_ID
              </code>
              . Standard YouTube watch links (youtube.com/watch?v=...) and
              youtu.be links are also automatically converted. Leave blank to
              show the branded placeholder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Showcase Video URL editor ──────────────────────────────────────────────

const SHOWCASE_CATEGORIES = [
  {
    label: "Custom Sites",
    prefix: "showcase_custom_sites_video",
    count: 6,
    cards: [
      "Client Showcase #1",
      "Client Showcase #2",
      "Client Showcase #3",
      "Client Showcase #4",
      "Client Showcase #5",
      "Client Showcase #6",
    ],
  },
  {
    label: "Speedy Sites",
    prefix: "showcase_speedy_sites_video",
    count: 6,
    cards: [
      "48-Hour Delivery #1",
      "Booking Site Launch",
      "Product Storefront",
      "Menu Storefront",
      "Recurring Subscription Site",
      "Express Launch #6",
    ],
  },
  {
    label: "SaaS Plans",
    prefix: "showcase_saas_plans_video",
    count: 6,
    cards: [
      "Keep It Live Plan",
      "Stay Sharp Plan",
      "Stay Ahead Plan",
      "Full Partner Plan",
      "Enterprise Partner",
      "Maintenance in Action",
    ],
  },
  {
    label: "Cinematic Ads",
    prefix: "showcase_cinematic_ads_video",
    count: 6,
    cards: [
      "15-Second Hook Ad",
      "30-Second Brand Spot",
      "60-Second Campaign Ad",
      "Pilot Retainer — Q1",
      "Pro Retainer — Q2",
      "Elite Retainer Showcase",
    ],
  },
  {
    label: "Product Ads",
    prefix: "showcase_product_ads_video",
    count: 6,
    cards: [
      "Flash One-Shot",
      "Starter Pack — Month 1",
      "Scale Package — Month 1",
      "Scale Package — Month 2",
      "Product Identity Lock",
      "Surreal Physics Showcase",
    ],
  },
  {
    label: "AI Receptionist",
    prefix: "showcase_ai_receptionist_video",
    count: 6,
    cards: [
      "Safety Net in Action",
      "AI Receptionist — Live Call",
      "The Closer — Booking Demo",
      "CRM Integration Demo",
      "After-Hours Lead Capture",
      "Full Setup Walkthrough",
    ],
  },
  {
    label: "Growth Hub",
    prefix: "showcase_growth_hub_video",
    count: 6,
    cards: [
      "Local SEO Campaign",
      "Google Ads Management",
      "Lead Capture Upgrade",
      "Review Generation System",
      "PWA Upgrade in Action",
      "Annual Site Refresh",
    ],
  },
] as const;

function ShowcaseVideosPanel({
  actor,
}: {
  actor: {
    updateSiteText: (
      k: string,
      v: string,
      adminEmail: string,
    ) => Promise<boolean>;
  } | null;
}) {
  const { textMap, updateText } = useSiteTextStore();
  const adminEmail = getAdminEmail();

  // Local state: key → draft value
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialise drafts from the store whenever textMap changes
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const cat of SHOWCASE_CATEGORIES) {
      for (let i = 1; i <= cat.count; i++) {
        const key = `${cat.prefix}_${i}`;
        initial[key] = textMap[key] ?? "";
      }
    }
    setDrafts((prev) => {
      // Only update keys that haven't been touched by the user
      const next = { ...prev };
      for (const [k, v] of Object.entries(initial)) {
        if (!(k in prev)) next[k] = v;
      }
      return next;
    });
  }, [textMap]);

  const handleSave = async (key: string) => {
    if (!actor) return;
    setSaving((s) => ({ ...s, [key]: true }));
    setErrors((e) => ({ ...e, [key]: "" }));
    try {
      await actor.updateSiteText(key, drafts[key] ?? "", adminEmail);
      updateText(key, drafts[key] ?? "");
      broadcastSiteTextInvalidation();
      setSaved((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000);
    } catch {
      setErrors((e) => ({ ...e, [key]: "Save failed. Try again." }));
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  return (
    <div style={{ marginTop: "48px" }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "6px",
        }}
      >
        <Video size={20} color={NEON} />
        <h2
          style={{
            color: "#EEF0F8",
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Showcase Videos
        </h2>
      </div>
      <p style={{ color: MUTED, fontSize: "14px", marginBottom: "24px" }}>
        Paste a YouTube, Vimeo, or direct video URL for each showcase card.
        Leave blank to show the placeholder. Changes go live instantly.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {SHOWCASE_CATEGORIES.map((cat) => (
          <div
            key={cat.label}
            style={{
              border: BORDER,
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Category header */}
            <div
              style={{
                padding: "14px 20px",
                background: "rgba(14,16,32,1)",
                borderBottom: BORDER,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Video size={14} color={NEON} />
              <span
                style={{
                  color: "#EEF0F8",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                {cat.label}
              </span>
            </div>

            {/* Video URL inputs */}
            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {Array.from({ length: cat.count }, (_, idx) => {
                const slotNum = idx + 1;
                const key = `${cat.prefix}_${slotNum}`;
                const cardTitle = cat.cards[idx];
                const draft = drafts[key] ?? "";
                const isSaving = saving[key] ?? false;
                const isSaved = saved[key] ?? false;
                const errMsg = errors[key] ?? "";

                return (
                  <div key={key}>
                    <label
                      htmlFor={`showcase-video-${key}`}
                      style={{
                        display: "block",
                        color: MUTED,
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "6px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {cat.label} — Video {slotNum}
                      <span
                        style={{
                          color: "rgba(122,125,144,0.5)",
                          fontWeight: 400,
                          marginLeft: "8px",
                        }}
                      >
                        ({cardTitle})
                      </span>
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        id={`showcase-video-${key}`}
                        type="url"
                        placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…"
                        value={draft}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [key]: e.target.value }))
                        }
                        data-ocid={`admin.showcase_videos.${key}.input`}
                        style={{
                          flex: 1,
                          background: "rgba(10,10,10,0.9)",
                          border: "1px solid #1C1F33",
                          color: "#EEF0F8",
                          borderRadius: "8px",
                          padding: "9px 12px",
                          fontSize: "13px",
                          outline: "none",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = NEON;
                          e.currentTarget.style.boxShadow =
                            "0 0 0 2px rgba(57,255,20,0.12)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#1C1F33";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSave(key)}
                        disabled={isSaving}
                        data-ocid={`admin.showcase_videos.${key}.save_button`}
                        style={{
                          padding: "9px 18px",
                          borderRadius: "8px",
                          border: "none",
                          background: isSaved
                            ? "rgba(57,255,20,0.15)"
                            : "#5EF08A",
                          color: isSaved ? NEON : "#0A0B14",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: isSaving ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                          transition: "background 0.15s, color 0.15s",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          flexShrink: 0,
                        }}
                      >
                        {isSaving ? (
                          <Loader2
                            size={13}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : isSaved ? (
                          "✓ Saved"
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                    {errMsg && (
                      <p
                        style={{
                          color: "#f87171",
                          fontSize: "12px",
                          marginTop: "4px",
                          margin: "4px 0 0",
                        }}
                      >
                        {errMsg}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Logo Marquee management panel ───────────────────────────────────────

function LogoMarqueePanel({ actor }: { actor: backendInterface | null }) {
  const adminEmail = getAdminEmail();

  const [logos, setLogos] = useState<MarqueeLogo[]>([]);
  const [loadingLogos, setLoadingLogos] = useState(false);
  const [logoError, setLogoError] = useState("");

  // Add form state
  const [addUrl, setAddUrl] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  // Per-item operation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (!actor) return;
    let cancelled = false;
    setLoadingLogos(true);
    setLogoError("");
    actor
      .getMarqueeLogos()
      .then((result) => {
        if (cancelled) return;
        const sorted = [...result].sort(
          (x, y) => Number(x.order) - Number(y.order),
        );
        setLogos(sorted);
      })
      .catch(() => {
        if (!cancelled) setLogoError("Failed to load logos.");
      })
      .finally(() => {
        if (!cancelled) setLoadingLogos(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor]);

  const handleAdd = async () => {
    if (!actor || !addUrl.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await actor.addMarqueeLogo(
        addUrl.trim(),
        addLabel.trim(),
        adminEmail,
      );
      if (res.__kind__ === "ok") {
        setAddUrl("");
        setAddLabel("");
        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 2000);
        actor
          .getMarqueeLogos()
          .then((result) => {
            const sorted = [...result].sort(
              (x, y) => Number(x.order) - Number(y.order),
            );
            setLogos(sorted);
          })
          .catch(() => {});
      } else {
        setAddError(res.err);
      }
    } catch {
      setAddError("Failed to add logo. Try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    setDeletingId(id);
    try {
      await actor.deleteMarqueeLogo(id, adminEmail);
      setLogos((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setLogoError("Failed to delete logo.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (!actor) return;
    const newLogos = [...logos];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newLogos.length) return;
    [newLogos[index], newLogos[swapIdx]] = [newLogos[swapIdx], newLogos[index]];
    setLogos(newLogos);
    setReordering(true);
    try {
      await actor.reorderMarqueeLogos(
        newLogos.map((l) => l.id),
        adminEmail,
      );
    } catch {
      setLogoError("Failed to save order.");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div style={{ marginTop: "48px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "6px",
        }}
      >
        <Images size={20} color={NEON} />
        <h2
          style={{
            color: "#EEF0F8",
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Logo Marquee
        </h2>
      </div>
      <p style={{ color: MUTED, fontSize: "14px", marginBottom: "20px" }}>
        Manage the logos that scroll across the homepage marquee strip. Add,
        remove, or reorder logos here. Changes go live instantly.
      </p>

      <div
        style={{
          border: BORDER,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(14,16,32,1)",
            borderBottom: BORDER,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Images size={14} color={NEON} />
          <span
            style={{
              color: "#EEF0F8",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            Marquee Logos
          </span>
          {reordering && (
            <Loader2
              size={12}
              color={MUTED}
              style={{
                marginLeft: "auto",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
        </div>

        <div style={{ padding: "20px" }}>
          {/* Loading */}
          {loadingLogos && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: MUTED,
                fontSize: "13px",
                padding: "24px 0",
              }}
              data-ocid="admin.logo_marquee.loading_state"
            >
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Loading logos…
            </div>
          )}

          {/* Error */}
          {logoError && (
            <p
              style={{
                color: "#f87171",
                fontSize: "12px",
                margin: "0 0 12px",
              }}
              data-ocid="admin.logo_marquee.error_state"
            >
              {logoError}
            </p>
          )}

          {!loadingLogos && (
            <>
              {/* Logo list */}
              {logos.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: MUTED,
                    fontSize: "13px",
                  }}
                  data-ocid="admin.logo_marquee.empty_state"
                >
                  <Images
                    size={28}
                    color={MUTED}
                    style={{ margin: "0 auto 10px" }}
                  />
                  <p style={{ margin: 0 }}>
                    No logos yet. Add your first logo below.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                  data-ocid="admin.logo_marquee.list"
                >
                  {logos.map((logo, idx) => (
                    <div
                      key={logo.id}
                      data-ocid={`admin.logo_marquee.item.${idx + 1}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        background: "rgba(10,10,10,0.6)",
                        border: "1px solid #1C1F33",
                        borderRadius: "8px",
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: "64px",
                          height: "32px",
                          flexShrink: 0,
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: "4px",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={logo.logoUrl}
                          alt={logo.logoLabel || "Logo"}
                          style={{
                            maxHeight: "28px",
                            maxWidth: "60px",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>

                      {/* Label */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: "13px",
                          color: "#EEF0F8",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {logo.logoLabel || (
                          <span style={{ color: MUTED }}>No label</span>
                        )}
                      </span>

                      {/* Up / Down reorder */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "up")}
                          disabled={idx === 0 || reordering}
                          data-ocid={`admin.logo_marquee.move_up.${idx + 1}`}
                          title="Move up"
                          style={{
                            padding: "2px 5px",
                            border: "1px solid #1C1F33",
                            borderRadius: "4px",
                            background: "transparent",
                            color: idx === 0 ? "rgba(122,125,144,0.3)" : MUTED,
                            cursor:
                              idx === 0 || reordering
                                ? "not-allowed"
                                : "pointer",
                            display: "flex",
                            alignItems: "center",
                            lineHeight: 1,
                          }}
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "down")}
                          disabled={idx === logos.length - 1 || reordering}
                          data-ocid={`admin.logo_marquee.move_down.${idx + 1}`}
                          title="Move down"
                          style={{
                            padding: "2px 5px",
                            border: "1px solid #1C1F33",
                            borderRadius: "4px",
                            background: "transparent",
                            color:
                              idx === logos.length - 1
                                ? "rgba(122,125,144,0.3)"
                                : MUTED,
                            cursor:
                              idx === logos.length - 1 || reordering
                                ? "not-allowed"
                                : "pointer",
                            display: "flex",
                            alignItems: "center",
                            lineHeight: 1,
                          }}
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(logo.id)}
                        disabled={deletingId === logo.id}
                        data-ocid={`admin.logo_marquee.delete_button.${idx + 1}`}
                        title="Remove logo"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #374151",
                          background: "transparent",
                          color: deletingId === logo.id ? MUTED : "#f87171",
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor:
                            deletingId === logo.id ? "not-allowed" : "pointer",
                          flexShrink: 0,
                          transition: "border-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (deletingId !== logo.id)
                            e.currentTarget.style.borderColor = "#f87171";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#374151";
                        }}
                      >
                        {deletingId === logo.id ? (
                          <Loader2
                            size={12}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add logo form */}
              <div
                style={{
                  borderTop: logos.length > 0 ? BORDER : "none",
                  paddingTop: logos.length > 0 ? "20px" : 0,
                }}
              >
                <p
                  style={{
                    color: MUTED,
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    marginBottom: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  Add Logo
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    type="url"
                    placeholder="Logo image URL (https://…)"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    data-ocid="admin.logo_marquee.url_input"
                    style={{
                      flex: "1 1 240px",
                      background: "rgba(10,10,10,0.9)",
                      border: "1px solid #1C1F33",
                      color: "#EEF0F8",
                      borderRadius: "8px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = NEON;
                      e.currentTarget.style.boxShadow =
                        "0 0 0 2px rgba(57,255,20,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#1C1F33";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={addLabel}
                    onChange={(e) => setAddLabel(e.target.value)}
                    data-ocid="admin.logo_marquee.label_input"
                    style={{
                      flex: "1 1 160px",
                      background: "rgba(10,10,10,0.9)",
                      border: "1px solid #1C1F33",
                      color: "#EEF0F8",
                      borderRadius: "8px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = NEON;
                      e.currentTarget.style.boxShadow =
                        "0 0 0 2px rgba(57,255,20,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#1C1F33";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={adding || !addUrl.trim()}
                    data-ocid="admin.logo_marquee.add_button"
                    style={{
                      padding: "9px 20px",
                      borderRadius: "8px",
                      border: "none",
                      background: addSuccess
                        ? "rgba(57,255,20,0.15)"
                        : adding || !addUrl.trim()
                          ? "rgba(94,240,138,0.4)"
                          : "#5EF08A",
                      color: addSuccess ? NEON : "#0A0B14",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor:
                        adding || !addUrl.trim() ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 0.15s, color 0.15s",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      flexShrink: 0,
                    }}
                  >
                    {adding ? (
                      <Loader2
                        size={13}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : addSuccess ? (
                      "✓ Added"
                    ) : (
                      "+ Add Logo"
                    )}
                  </button>
                </div>
                {addError && (
                  <p
                    style={{
                      color: "#f87171",
                      fontSize: "12px",
                      margin: "6px 0 0",
                    }}
                    data-ocid="admin.logo_marquee.add_error_state"
                  >
                    {addError}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSiteTextPage() {
  const { actor, isFetching } = useActor();
  const { textMap, fetchAllSiteText, updateText } = useSiteTextStore();
  const [loading, setLoading] = useState(false);
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);
    try {
      await fetchAllSiteText(actor as Parameters<typeof fetchAllSiteText>[0]);
    } catch {
      setError("Failed to load site text overrides.");
    } finally {
      setLoading(false);
    }
  }, [actor, isFetching, fetchAllSiteText]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReset = async (key: string) => {
    if (!actor) return;
    setResettingKey(key);
    try {
      await (actor as backendInterface).updateSiteText(
        key,
        "",
        getAdminEmail(),
      );
      updateText(key, "");
      broadcastSiteTextInvalidation();
    } catch {
      setError("Failed to reset override. Please try again.");
    } finally {
      setResettingKey(null);
    }
  };

  const allEntries = Object.entries(textMap).filter(([, v]) => v !== "");

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return allEntries;
    const q = searchQuery.toLowerCase();
    return allEntries.filter(
      ([key, value]) =>
        key.toLowerCase().includes(q) || value.toLowerCase().includes(q),
    );
  }, [allEntries, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <AdminLayout pageTitle="Site Text">
      <div style={{ maxWidth: "900px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <Type size={20} color={NEON} />
            <h1
              style={{
                color: "#EEF0F8",
                fontSize: "20px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Site Text Overrides
            </h1>
          </div>
          <p style={{ color: MUTED, fontSize: "14px", margin: 0 }}>
            All text currently overriding the site defaults. Resetting a key
            restores the original hardcoded text.
          </p>
        </div>

        {/* SEO tip callout */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 16px",
            background: "rgba(57,255,20,0.05)",
            border: "1px solid rgba(57,255,20,0.18)",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <Info
            size={15}
            color={NEON}
            style={{ flexShrink: 0, marginTop: "1px" }}
          />
          <p
            style={{
              color: "#C8FACD",
              fontSize: "13px",
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: NEON }}>SEO tip:</strong> Edit keys like{" "}
            <code
              style={{
                background: "rgba(57,255,20,0.1)",
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              meta.title.home
            </code>
            ,{" "}
            <code
              style={{
                background: "rgba(57,255,20,0.1)",
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              meta.title.products
            </code>
            ,{" "}
            <code
              style={{
                background: "rgba(57,255,20,0.1)",
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              meta.title.portfolio
            </code>
            ,{" "}
            <code
              style={{
                background: "rgba(57,255,20,0.1)",
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              meta.title.blog
            </code>
            ,{" "}
            <code
              style={{
                background: "rgba(57,255,20,0.1)",
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              meta.title.process
            </code>{" "}
            to control what shows in browser tabs and search results. You can
            also set{" "}
            <code
              style={{
                background: "rgba(57,255,20,0.1)",
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              meta.description.*
            </code>{" "}
            keys for each page.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              color: "#f87171",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: MUTED,
              fontSize: "14px",
              padding: "48px 0",
            }}
            data-ocid="admin.site-text.loading"
          >
            <Loader2
              size={18}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Loading overrides…
          </div>
        )}

        {/* Search bar + count */}
        {!loading && allEntries.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            {/* Search input row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <div style={{ position: "relative", flex: 1, maxWidth: "480px" }}>
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: MUTED,
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  data-ocid="admin.site-text.search_input"
                  placeholder="Search by key or value…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(10,10,10,0.9)",
                    border: "1px solid #1C1F33",
                    color: "#EEF0F8",
                    borderRadius: "8px",
                    padding: "9px 12px 9px 36px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = NEON;
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(57,255,20,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1C1F33";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              {hasSearch && (
                <button
                  type="button"
                  data-ocid="admin.site-text.clear_search_button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "8px 14px",
                    borderRadius: "7px",
                    border: "1px solid #374151",
                    background: "transparent",
                    color: MUTED,
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "border-color 0.15s, color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#EEF0F8";
                    e.currentTarget.style.color = "#EEF0F8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#374151";
                    e.currentTarget.style.color = MUTED;
                  }}
                >
                  <X size={13} />
                  Clear
                </button>
              )}
            </div>
            {/* Match count */}
            <p style={{ color: MUTED, fontSize: "13px", margin: 0 }}>
              {hasSearch
                ? `${filteredEntries.length} of ${allEntries.length} text override${allEntries.length !== 1 ? "s" : ""} match`
                : `${allEntries.length} text override${allEntries.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}

        {/* Empty state — no overrides at all */}
        {!loading && allEntries.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              border: BORDER,
              borderRadius: "12px",
              background: "rgba(17,19,34,0.5)",
            }}
            data-ocid="admin.site-text.empty"
          >
            <Type size={32} color={MUTED} style={{ margin: "0 auto 12px" }} />
            <p
              style={{ color: "#EEF0F8", fontWeight: 600, marginBottom: "6px" }}
            >
              No overrides yet
            </p>
            <p style={{ color: MUTED, fontSize: "13px", margin: 0 }}>
              Enable "Edit Mode" in the sidebar, then click any text on the live
              site to create an override.
            </p>
          </div>
        )}

        {/* Empty state — search found nothing */}
        {!loading &&
          allEntries.length > 0 &&
          hasSearch &&
          filteredEntries.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                border: BORDER,
                borderRadius: "12px",
                background: "rgba(17,19,34,0.5)",
              }}
              data-ocid="admin.site-text.search_empty"
            >
              <Search
                size={28}
                color={MUTED}
                style={{ margin: "0 auto 12px" }}
              />
              <p
                style={{
                  color: "#EEF0F8",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                No text overrides match your search.
              </p>
              <button
                type="button"
                data-ocid="admin.site-text.empty_clear_button"
                onClick={() => setSearchQuery("")}
                style={{
                  marginTop: "8px",
                  padding: "8px 20px",
                  borderRadius: "7px",
                  border: "1px solid rgba(57,255,20,0.35)",
                  background: "rgba(57,255,20,0.07)",
                  color: NEON,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear search
              </button>
            </div>
          )}

        {/* Table */}
        {!loading && filteredEntries.length > 0 && (
          <div
            style={{
              border: BORDER,
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr 100px",
                padding: "12px 20px",
                background: "rgba(14,16,32,1)",
                borderBottom: BORDER,
                gap: "16px",
              }}
            >
              {["Key", "Current Value", "Actions"].map((col) => (
                <span
                  key={col}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: MUTED,
                  }}
                >
                  {col}
                </span>
              ))}
            </div>

            {/* Rows */}
            {filteredEntries.map(([key, value], i) => (
              <div
                key={key}
                data-ocid={`admin.site-text.row.${key}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "220px 1fr 100px",
                  padding: "14px 20px",
                  gap: "16px",
                  alignItems: "center",
                  background:
                    i % 2 === 0 ? "rgba(17,19,34,0.4)" : "transparent",
                  borderBottom:
                    i < filteredEntries.length - 1 ? BORDER : "none",
                }}
              >
                {/* Key */}
                <code
                  style={{
                    fontSize: "12px",
                    color: NEON,
                    fontFamily: "monospace",
                    background: "rgba(57,255,20,0.06)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {key}
                </code>

                {/* Value */}
                <span
                  style={{
                    fontSize: "13px",
                    color: "#EEF0F8",
                    lineHeight: 1.5,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {value}
                </span>

                {/* Reset action */}
                <button
                  type="button"
                  data-ocid={`admin.site-text.reset.${key}`}
                  onClick={() => handleReset(key)}
                  disabled={resettingKey === key}
                  title="Reset to default"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #374151",
                    background: "transparent",
                    color: resettingKey === key ? MUTED : "#f87171",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: resettingKey === key ? "not-allowed" : "pointer",
                    transition: "border-color 0.15s, color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (resettingKey !== key) {
                      e.currentTarget.style.borderColor = "#f87171";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#374151";
                  }}
                >
                  {resettingKey === key ? (
                    <Loader2
                      size={12}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <RotateCcw size={12} />
                  )}
                  Reset
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        {!loading && (
          <p
            style={{
              marginTop: "24px",
              fontSize: "12px",
              color: "rgba(122,125,144,0.6)",
            }}
          >
            💡 To edit text live: toggle "Edit Site Text" in the sidebar, then
            visit the homepage and click any outlined text element.
          </p>
        )}

        {/* Google Calendar Integration editor */}
        <GoogleScriptPanel actor={actor as backendInterface | null} />

        {/* Social Media Links editor */}
        <SocialLinksPanel actor={actor as backendInterface | null} />

        {/* Homepage Video editor */}
        <HomepageVideoPanel actor={actor as backendInterface | null} />

        {/* Showcase Videos editor */}
        <ShowcaseVideosPanel actor={actor as backendInterface | null} />

        {/* Logo Marquee manager */}
        <LogoMarqueePanel actor={actor as backendInterface | null} />
      </div>

      <style>
        {
          "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"
        }
      </style>
    </AdminLayout>
  );
}
