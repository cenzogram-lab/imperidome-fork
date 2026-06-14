import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  ChangeEvent,
  DragEvent as ReactDragEvent,
} from "react";

import { toast } from "sonner";

import type { backendInterface } from "../../backend.d";
import type { EmailTemplate } from "../../backend.d";
import { ADMIN_EMAIL_KEY } from "../../constants";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem(ADMIN_EMAIL_KEY) ?? "";
}

// ─── DualMediaField ───────────────────────────────────────────────────────────
function DualMediaField({
  label,
  value,
  onChange,
  accept = "image/*",
  disabled = false,
  inputId,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  disabled?: boolean;
  inputId?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const blobStorage = (
        window as {
          __icpBlobStorage?: {
            ExternalBlob?: {
              fromBytes: (b: Uint8Array) => {
                getDirectURL: () => Promise<string>;
              };
            };
          };
        }
      ).__icpBlobStorage;
      if (!blobStorage?.ExternalBlob?.fromBytes) {
        throw new Error("Storage extension not loaded");
      }
      const blob = blobStorage.ExternalBlob.fromBytes(bytes);
      const url = await blob.getDirectURL();
      onChange(url);
    } catch {
      setUploadError("Upload failed — please paste a URL instead");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  }

  function handleDragOver(e: ReactDragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragEnter(e: ReactDragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: ReactDragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  async function handleDrop(e: ReactDragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  }

  if (value.trim()) {
    // Compact thumbnail preview mode
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={value.trim()}
            alt="Preview"
            style={{
              height: "52px",
              width: "auto",
              maxWidth: "110px",
              objectFit: "cover",
              borderRadius: "5px",
              border: "1px solid rgba(94,240,138,0.3)",
              display: "block",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "4px 11px",
                borderRadius: "5px",
                border: "1px solid rgba(94,240,138,0.4)",
                background: "rgba(94,240,138,0.06)",
                color: "#5EF08A",
                fontSize: "11px",
                fontWeight: 600,
                cursor: disabled || uploading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap" as const,
              }}
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
              style={{
                padding: "4px 11px",
                borderRadius: "5px",
                border: "1px solid rgba(248,113,113,0.3)",
                background: "transparent",
                color: "#f87171",
                fontSize: "11px",
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                whiteSpace: "nowrap" as const,
              }}
            >
              Remove
            </button>
          </div>
          {uploading && (
            <span
              style={{
                display: "inline-block",
                width: "13px",
                height: "13px",
                border: "2px solid rgba(94,240,138,0.25)",
                borderTopColor: "#5EF08A",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
          )}
        </div>
        <input
          id={inputId}
          type="url"
          placeholder="or paste a URL"
          value={value}
          onChange={(e) => {
            setUploadError(null);
            onChange(e.target.value);
          }}
          disabled={disabled}
          style={{
            width: "100%",
            border: "1px solid #1C1F33",
            borderRadius: 6,
            padding: "8px 11px",
            fontSize: 13,
            color: "#EEF0F8",
            background: "rgba(19,21,36,1)",
            outline: "none",
            boxSizing: "border-box" as const,
          }}
        />
        {uploadError && (
          <p style={{ color: "#f87171", fontSize: 11, margin: 0 }}>
            {uploadError}
          </p>
        )}
        <input
          type="file"
          accept={accept}
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // Drop zone mode (no image set)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <button
        type="button"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        disabled={disabled || uploading}
        style={{
          border: dragOver
            ? "2px dashed rgba(94,240,138,0.9)"
            : "2px dashed rgba(94,240,138,0.3)",
          borderRadius: "7px",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          cursor: disabled || uploading ? "not-allowed" : "pointer",
          background: dragOver
            ? "rgba(94,240,138,0.07)"
            : "rgba(94,240,138,0.02)",
          transition: "border-color 0.15s, background 0.15s",
          boxShadow: dragOver ? "0 0 8px rgba(94,240,138,0.12)" : "none",
          outline: "none",
          width: "100%",
          textAlign: "left" as const,
        }}
      >
        <span style={{ fontSize: "20px", lineHeight: 1 }}>🖼</span>
        <span
          style={{
            color: dragOver ? "#5EF08A" : "#7A7D90",
            fontSize: "11px",
            fontWeight: 600,
            textAlign: "center",
            transition: "color 0.15s",
          }}
        >
          {uploading
            ? "Uploading…"
            : dragOver
              ? "Drop to upload"
              : "Drop image here or click to upload"}
        </span>
        {!uploading && (
          <span
            style={{
              color: "#7A7D90",
              fontSize: "10px",
              background: "rgba(94,240,138,0.05)",
              border: "1px solid rgba(94,240,138,0.2)",
              borderRadius: "4px",
              padding: "2px 9px",
            }}
          >
            Upload {label}
          </span>
        )}
        {uploading && (
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "2px solid rgba(94,240,138,0.25)",
              borderTopColor: "#5EF08A",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        )}
      </button>
      <input
        id={inputId}
        type="url"
        placeholder="or paste a URL"
        value={value}
        onChange={(e) => {
          setUploadError(null);
          onChange(e.target.value);
        }}
        disabled={disabled}
        style={{
          width: "100%",
          border: "1px solid #1C1F33",
          borderRadius: 6,
          padding: "10px 12px",
          fontSize: 14,
          color: "#EEF0F8",
          background: "rgba(19,21,36,1)",
          outline: "none",
          boxSizing: "border-box" as const,
        }}
      />
      {uploadError && (
        <p style={{ color: "#f87171", fontSize: 11, margin: 0 }}>
          {uploadError}
        </p>
      )}
      <input
        type="file"
        accept={accept}
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

interface TemplateConfig {
  id: string;
  triggerLabel: string;
  triggerCategory: string;
  defaultSubject: string;
  defaultBody: string;
}

function getTemplates(
  adminEmail: string,
  siteAuditPrice: string,
): TemplateConfig[] {
  return [
    {
      id: "email_verification",
      triggerLabel: "Email Verification",
      triggerCategory: "ACCOUNT",
      defaultSubject: "Verify Your Imperidome Account",
      defaultBody:
        "Hi {{client_name}}, thanks for signing up for Imperidome. Click the link below to verify your email address and activate your account. This link expires in 24 hours.",
    },
    {
      id: "password_reset",
      triggerLabel: "Password Reset",
      triggerCategory: "ACCOUNT",
      defaultSubject: "Reset Your Imperidome Password",
      defaultBody:
        "Hi {{client_name}}, we received a request to reset your Imperidome password. Click the link below to set a new password. If you did not request this, you can safely ignore this email.",
    },
    {
      id: "questionnaire_unlocked",
      triggerLabel: "Questionnaire Unlocked",
      triggerCategory: "QUESTIONNAIRE",
      defaultSubject: "Your Intake Form Is Ready",
      defaultBody:
        "Hi {{client_name}}, your intake form is now ready. Please complete it so we can start building your site. The more detail you provide, the better your result. Log in to your client portal to get started.",
    },
    {
      id: "questionnaire_submitted_client",
      triggerLabel: "Questionnaire Submitted Client",
      triggerCategory: "QUESTIONNAIRE",
      defaultSubject: "We Received Your Intake Form",
      defaultBody:
        "Hi {{client_name}}, we received your intake form for {{business_name}}. Your project is now in queue. We will reach out if we have any questions before we begin your build.",
    },
    {
      id: "questionnaire_submitted_admin",
      triggerLabel: "Questionnaire Submitted Admin",
      triggerCategory: "QUESTIONNAIRE ADMIN",
      defaultSubject: "New Questionnaire Submitted",
      defaultBody:
        "A new questionnaire has been submitted. Client: {{client_name}} \u2014 Business: {{business_name}} \u2014 Tier: {{project_tier}}. Log in to the admin panel to review the submission.",
    },
    {
      id: "deposit_invoice_sent",
      triggerLabel: "Deposit Invoice Sent",
      triggerCategory: "BILLING",
      defaultSubject: "Your Deposit Invoice Is Ready",
      defaultBody:
        "Hi {{client_name}}, your deposit invoice for {{business_name}} is ready. The invoice amount is {{invoice_amount}} and is due by {{due_date}}. Click below to pay securely via Stripe. {{stripe_link}}",
    },
    {
      id: "deposit_confirmed",
      triggerLabel: "Deposit Confirmed",
      triggerCategory: "BILLING",
      defaultSubject: "Deposit Confirmed \u2014 Your Build Is Queued",
      defaultBody:
        "Hi {{client_name}}, we received your deposit for {{business_name}}. Your build is now officially in queue. We will notify you when work begins and when your first draft is ready.",
    },
    {
      id: "draft_ready",
      triggerLabel: "Draft Ready",
      triggerCategory: "PROJECT",
      defaultSubject: "Your First Draft Is Ready to Review",
      defaultBody:
        "Hi {{client_name}}, your first draft for {{business_name}} is ready for review. Log in to your client portal to view it and submit any feedback. Your delivery window runs through {{due_date}}.",
    },
    {
      id: "site_launched",
      triggerLabel: "Site Launched",
      triggerCategory: "PROJECT",
      defaultSubject: "Your Site Is Live \u2014 Welcome to Imperidome",
      defaultBody:
        "Hi {{client_name}}, your site for {{business_name}} is now live. Welcome to Imperidome \u2014 it has been a pleasure working with you. Your site launched on {{launch_date}}. Contact us anytime if you need anything.",
    },
    {
      id: "billing_reminder",
      triggerLabel: "Billing Reminder",
      triggerCategory: "BILLING",
      defaultSubject: "Your Upcoming Payment",
      defaultBody:
        "Hi {{client_name}}, a reminder that your next payment of {{invoice_amount}} for {{business_name}} is due on {{due_date}}. Log in to your portal to view your invoice or update your payment method.",
    },
    {
      id: "subscription_confirmed",
      triggerLabel: "Subscription Confirmed",
      triggerCategory: "BILLING",
      defaultSubject: "Your subscription is now active",
      defaultBody:
        "Hi {{client_name}}, your subscription to {{planName}} is now active. Your next billing date is {{nextBillingDate}}. You can manage your subscription anytime in your client portal: {{portalLink}}. Questions? Contact us at {{adminEmail}}.",
    },
    {
      id: "subscription_activated",
      triggerLabel: "Subscription Activated",
      triggerCategory: "BILLING",
      defaultSubject: "Your {{product_name}} subscription is now active",
      defaultBody:
        "Hi {{client_name}},\n\nYour {{product_name}} subscription ({{plan}}, {{billing_amount}}) is now active as of {{billing_start_date}}.\n\nIf you have any questions, please contact the Imperidome team.\n\nThank you for choosing Imperidome.",
    },
    {
      id: "payment_failed",
      triggerLabel: "Payment Failed",
      triggerCategory: "BILLING",
      defaultSubject: "Payment Failed \u2014 Action Required",
      defaultBody:
        "Hi {{client_name}}, we were unable to process your payment of {{invoice_amount}} for {{business_name}}. Please update your payment method or contact us to avoid a service interruption. {{stripe_link}}",
    },
    {
      id: "growth_call",
      triggerLabel: "90-Day Growth Call",
      triggerCategory: "MILESTONE",
      defaultSubject: "Time to Talk Growth \u2014 Book Your Free Call",
      defaultBody:
        "Hi {{client_name}}, it has been 90 days since your site launched. We would love to connect and talk about what is working, what could be improved, and how we can help you grow. Book your free 30-minute call here: {{calendly_link}}",
    },
    {
      id: "consultation_confirmed",
      triggerLabel: "Consultation Confirmed",
      triggerCategory: "LEAD",
      defaultSubject: "Your Free Consultation Is Confirmed \u2014 Imperidome",
      defaultBody: `Hi {{client_name}},\n\nWe've received your free consultation request and you're in good hands.\n\nOur team will review your request and be in touch within 1 business day.\n\nRequested Time: {{requested_time}}\nBusiness Type: {{business_type}}\n\nIn the meantime, feel free to browse our services at imperidome.com.\n\nQuestions? Contact us at ${adminEmail || "your admin email"}.\n\nWarm regards,\nThe Imperidome Team`,
    },
    {
      id: "audit_in_progress",
      triggerLabel: "Audit In Progress",
      triggerCategory: "LEAD",
      defaultSubject: "Your Site Audit Is Underway \u2014 Imperidome",
      defaultBody: `Hi {{client_name}},\n\nYour ${siteAuditPrice} Site Audit has been received and our team is already on it.\n\nHere's what we're auditing:\n- Mobile performance\n- SEO basics\n- Lead capture effectiveness\n- Trust signals\n- Conversion gap analysis\n\nBusiness: {{business_type}}\nExpected delivery: within 48 hours\n\nWe'll send you the full report as soon as it's ready.\n\nQuestions? Contact us at ${adminEmail || "your admin email"}.\n\nWarm regards,\nThe Imperidome Team`,
    },
  ];
}

function getPreviewBody(
  config: TemplateConfig,
  body: string,
  adminEmail: string,
): string {
  if (config.id === "subscription_confirmed") {
    return body
      .replace(/\{\{planName\}\}/g, "Professional Plan")
      .replace(/\{\{nextBillingDate\}\}/g, "June 1, 2026")
      .replace(
        /\{\{portalLink\}\}/g,
        "https://imperidome.com/portal/subscriptions",
      )
      .replace(/\{\{adminEmail\}\}/g, adminEmail || "your admin email")
      .replace(/\{\{client_name\}\}/g, "Client");
  }
  return body;
}

function getPreviewSubject(config: TemplateConfig, subject: string): string {
  if (config.id === "subscription_confirmed") {
    return "Your subscription is now active";
  }
  return subject;
}

const labelStyle: CSSProperties = {
  display: "block",
  color: "#7A7D90",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 4,
};

function formatTimestamp(ns: bigint): string {
  if (ns === 0n) return "—";
  if (Number.isNaN(Number(ns))) return "—";
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function sanitizeEmailBody(raw: string): string {
  return (
    raw
      // Decode double-escaped entities first (e.g. &amp;lt;br&amp;gt;)
      .replace(/&amp;lt;br&amp;gt;/gi, "\n")
      .replace(/&amp;lt;br\s*\/&amp;gt;/gi, "\n")
      // Replace <br>, <br/>, <br /> (and encoded variants) with newlines
      .replace(/&lt;br\s*\/?&gt;/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      // Decode remaining double-escaped tags before stripping
      .replace(/&amp;lt;[^&]*&amp;gt;/gi, "")
      // Strip any remaining HTML tags
      .replace(/<[^>]*>/g, "")
      // Decode common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      // Collapse 3+ consecutive blank lines to 2
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function TemplateCard({
  config,
  index,
  saved,
  onSave,
  onSendTest,
  adminEmail = "",
}: {
  config: TemplateConfig;
  index: number;
  saved: EmailTemplate | undefined;
  onSave: (triggerKey: string, subject: string, body: string) => Promise<void>;
  onSendTest: (subject: string, htmlBody: string) => Promise<void>;
  adminEmail?: string;
}) {
  const [subject, setSubject] = useState(
    saved?.subject ?? config.defaultSubject,
  );
  const [body, setBody] = useState(
    saved?.body ? sanitizeEmailBody(saved.body) : config.defaultBody,
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<
    string | undefined
  >(undefined);
  const [videoLinkUrl, setVideoLinkUrl] = useState<string | undefined>(
    undefined,
  );
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const testSentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Parse optional CAFFEINE_MEDIA marker from a saved body string,
   *  populate the media state fields, and return the body without the marker. */
  const extractMediaFromBody = useCallback(
    (
      rawBody: string,
    ): {
      cleanBody: string;
      imgUrl: string | undefined;
      vidThumb: string | undefined;
      vidLink: string | undefined;
    } => {
      const markerRe = /^<!--\s*CAFFEINE_MEDIA:\s*(\{.*?\})\s*-->\n?/s;
      const match = rawBody.match(markerRe);
      if (!match) {
        // No marker found — return undefined for media fields to preserve the
        // undefined sentinel and avoid defeating the race-condition protection.
        return {
          cleanBody: rawBody,
          imgUrl: undefined,
          vidThumb: undefined,
          vidLink: undefined,
        };
      }
      try {
        const parsed = JSON.parse(match[1]) as {
          imageUrl?: string;
          videoThumbnailUrl?: string;
          videoLinkUrl?: string;
        };
        return {
          cleanBody: rawBody.slice(match[0].length),
          imgUrl: parsed.imageUrl,
          vidThumb: parsed.videoThumbnailUrl,
          vidLink: parsed.videoLinkUrl,
        };
      } catch {
        return {
          cleanBody: rawBody,
          imgUrl: undefined,
          vidThumb: undefined,
          vidLink: undefined,
        };
      }
    },
    [],
  );

  function showError(err: unknown) {
    const detail =
      err instanceof Error ? err.message : typeof err === "string" ? err : null;
    setSaveError("Save Failed \u2014 please try again");
    setSaveErrorDetail(detail || null);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setSaveError(null);
      setSaveErrorDetail(null);
    }, 5000);
  }

  useEffect(() => {
    if (saved) {
      const sanitized = sanitizeEmailBody(saved.body);
      const mediaResult = extractMediaFromBody(sanitized);
      setSubject(saved.subject);
      setBody(mediaResult.cleanBody);
      // Only update media fields when the marker was found (value is not undefined).
      // This preserves the undefined sentinel and prevents the race-condition where
      // a rapid save before this effect fires would overwrite saved media with "".
      if (mediaResult.imgUrl !== undefined) setImageUrl(mediaResult.imgUrl);
      if (mediaResult.vidThumb !== undefined)
        setVideoThumbnailUrl(mediaResult.vidThumb);
      if (mediaResult.vidLink !== undefined)
        setVideoLinkUrl(mediaResult.vidLink);
    }
  }, [saved, extractMediaFromBody]);

  const cardNum = index + 1;

  async function handleSendTest() {
    const imageBlock = (imageUrl ?? "").trim()
      ? `<div style="text-align:center;margin:0 0 24px 0;"><img src="${(imageUrl ?? "").trim()}" alt="" style="max-width:600px;width:100%;border:0;display:block;margin:0 auto;" /></div>`
      : "";
    const videoBlock =
      (videoThumbnailUrl ?? "").trim() && (videoLinkUrl ?? "").trim()
        ? `<div style="text-align:center;margin:24px 0 0 0;"><a href="${(videoLinkUrl ?? "").trim()}" style="display:inline-block;text-decoration:none;"><img src="${(videoThumbnailUrl ?? "").trim()}" alt="Watch Video" style="max-width:560px;width:100%;border:0;display:block;margin:0 auto;" /></a><p style="color:#00e87d;font-size:14px;margin:8px 0 0 0;">&#9654; Watch Video</p></div>`
        : "";
    const htmlBody = [imageBlock, body.trim(), videoBlock]
      .filter(Boolean)
      .join("\n");
    setSendingTest(true);
    try {
      await onSendTest(subject, htmlBody);
      if (testSentTimerRef.current) clearTimeout(testSentTimerRef.current);
    } catch {
      toast.error("Failed to send test email. Please try again.");
      if (testSentTimerRef.current) clearTimeout(testSentTimerRef.current);
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Build image block if imageUrl is set
      const imageBlock = (imageUrl ?? "").trim()
        ? `<div style="text-align:center;margin:0 0 24px 0;"><img src="${(imageUrl ?? "").trim()}" alt="" style="max-width:600px;width:100%;border:0;display:block;margin:0 auto;" /></div>`
        : "";
      // Build video block if both video fields are set
      const videoBlock =
        (videoThumbnailUrl ?? "").trim() && (videoLinkUrl ?? "").trim()
          ? `<div style="text-align:center;margin:24px 0 0 0;"><a href="${(videoLinkUrl ?? "").trim()}" style="display:inline-block;text-decoration:none;"><img src="${(videoThumbnailUrl ?? "").trim()}" alt="Watch Video" style="max-width:560px;width:100%;border:0;display:block;margin:0 auto;" /></a><p style="color:#00e87d;font-size:14px;margin:8px 0 0 0;">&#9654; Watch Video</p></div>`
          : "";
      // Compose enriched body — image block before text, video block after
      const enrichedBody = [imageBlock, body.trim(), videoBlock]
        .filter(Boolean)
        .join("\n");
      // Prepend round-trip media marker so fields can be restored on next load
      const hasMedia =
        (imageUrl ?? "").trim() ||
        (videoThumbnailUrl ?? "").trim() ||
        (videoLinkUrl ?? "").trim();
      const mediaMarker = hasMedia
        ? `<!-- CAFFEINE_MEDIA: ${JSON.stringify({ imageUrl: (imageUrl ?? "").trim(), videoThumbnailUrl: (videoThumbnailUrl ?? "").trim(), videoLinkUrl: (videoLinkUrl ?? "").trim() })} -->\n`
        : "";
      const bodyToSave = mediaMarker + enrichedBody;
      await onSave(config.id, subject, bodyToSave);
      setShowSaved(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowSaved(false), 3000);
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    border: "1px solid #1C1F33",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 14,
    color: "#EEF0F8",
    background: "rgba(19,21,36,1)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      data-ocid={`email_templates.template.card.${cardNum}`}
      style={{
        background: "rgba(17,19,34,0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid #1C1F33",
        borderRadius: 8,
        padding: 24,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          color: "#5EF08A",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {config.triggerCategory}
      </div>
      <div
        style={{
          color: "#EEF0F8",
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        {config.triggerLabel}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor={`subject-${config.id}`} style={labelStyle}>
          Subject Line
        </label>
        <input
          id={`subject-${config.id}`}
          data-ocid={`email_templates.subject.input.${cardNum}`}
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor={`body-${config.id}`} style={labelStyle}>
          Body Copy
        </label>
        <textarea
          id={`body-${config.id}`}
          data-ocid={`email_templates.body.textarea.${cardNum}`}
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Header Image */}
      <div
        data-ocid={`email_templates.image_url.input.${cardNum}`}
        style={{ marginBottom: 12 }}
      >
        <label htmlFor={`img-url-${config.id}`} style={labelStyle}>
          Header Image URL
        </label>
        <DualMediaField
          label="Header Image"
          value={imageUrl ?? ""}
          onChange={setImageUrl}
          accept="image/*"
          disabled={saving}
          inputId={`img-url-${config.id}`}
        />
        <p
          style={{
            color: "#7A7D90",
            fontSize: 11,
            margin: "4px 0 0",
            lineHeight: 1.5,
          }}
        >
          When set, this image appears at the top of the email, above the body
          content.
        </p>
      </div>

      {/* Video block fields */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid #1C1F33",
          borderRadius: 6,
          padding: "12px 14px",
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <p
          style={{
            color: "#7A7D90",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            margin: 0,
          }}
        >
          Video Block
        </p>
        <div data-ocid={`email_templates.video_thumbnail_url.input.${cardNum}`}>
          <label htmlFor={`vid-thumb-${config.id}`} style={labelStyle}>
            Video Thumbnail URL
          </label>
          <DualMediaField
            label="Video Thumbnail"
            value={videoThumbnailUrl ?? ""}
            onChange={setVideoThumbnailUrl}
            accept="image/*"
            disabled={saving}
            inputId={`vid-thumb-${config.id}`}
          />
        </div>
        <div>
          <label htmlFor={`vlink-${config.id}`} style={labelStyle}>
            Video Link URL
          </label>
          <input
            id={`vlink-${config.id}`}
            data-ocid={`email_templates.video_link_url.input.${cardNum}`}
            type="url"
            placeholder="https://youtu.be/..."
            value={videoLinkUrl ?? ""}
            onChange={(e) => setVideoLinkUrl(e.target.value)}
            style={inputStyle}
          />
        </div>
        <p style={{ color: "#7A7D90", fontSize: 11, margin: 0 }}>
          Both video fields must be filled to include the clickable video block.
        </p>
      </div>

      <div
        style={{
          color: "#7A7D90",
          fontFamily: "monospace",
          fontSize: 12,
          marginBottom: 16,
          lineHeight: 1.8,
        }}
      >
        Available variables: {"{{client_name}}"} {"{{business_name}}"}{" "}
        {"{{project_tier}}"} {"{{stripe_link}}"} {"{{invoice_amount}}"}{" "}
        {"{{due_date}}"} {"{{launch_date}}"} {"{{calendly_link}}"}{" "}
        {"{{business_type}}"} {"{{requested_time}}"}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          data-ocid={`email_templates.save.button.${cardNum}`}
          onClick={handleSave}
          disabled={saving}
          style={{
            background: "#5EF08A",
            color: "#061209",
            border: "none",
            borderRadius: 6,
            padding: "8px 20px",
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          data-ocid={`email_templates.preview.button.${cardNum}`}
          onClick={() => setShowPreview(true)}
          style={{
            background: "transparent",
            border: "1px solid rgba(94,240,138,0.35)",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 600,
            color: "#5EF08A",
            cursor: "pointer",
          }}
        >
          Preview
        </button>
        {config.id !== "subscription_confirmed" && (
          <button
            type="button"
            data-ocid={`email_templates.send_test.button.${cardNum}`}
            onClick={handleSendTest}
            disabled={sendingTest}
            style={{
              background: "transparent",
              border: "1px solid rgba(251,191,36,0.35)",
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              color: sendingTest ? "#7A7D90" : "#FBBF24",
              cursor: sendingTest ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap" as const,
            }}
          >
            {sendingTest ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    border: "2px solid rgba(251,191,36,0.25)",
                    borderTopColor: "#FBBF24",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Sending…
              </>
            ) : (
              "Send Test"
            )}
          </button>
        )}
        {showSaved && (
          <span
            data-ocid={`email_templates.saved.success_state.${cardNum}`}
            style={{
              color: "#5EF08A",
              fontSize: 13,
              fontWeight: 500,
              marginLeft: 12,
            }}
          >
            Saved \u2713
          </span>
        )}
        {saveError && (
          <span
            data-ocid={`email_templates.save_error_state.${cardNum}`}
            style={{
              color: "#f87171",
              fontSize: 13,
              fontWeight: 500,
              marginLeft: 12,
            }}
          >
            {saveError}
          </span>
        )}
      </div>
      {config.id === "subscription_confirmed" && (
        <div
          data-ocid={`email_templates.test_notice.${cardNum}`}
          style={{
            color: "#7A7D90",
            fontSize: 13,
            fontWeight: 500,
            marginTop: 8,
          }}
        >
          To test this template, trigger a test subscription from the Stripe
          dashboard.
        </div>
      )}
      {saveErrorDetail && (
        <div style={{ color: "#f87171", fontSize: 11, marginTop: 4 }}>
          {saveErrorDetail}
        </div>
      )}
      {saved && (
        <div style={{ color: "#7A7D90", fontSize: 12, marginTop: 8 }}>
          Last edited: {formatTimestamp(saved.updated_at)}
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreview && (
        <div
          data-ocid={`email_templates.preview.dialog.${cardNum}`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreview(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowPreview(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "640px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "10px",
              border: "1px solid rgba(94,240,138,0.4)",
              background: "rgba(13,15,26,0.98)",
              boxShadow: "0 0 40px rgba(94,240,138,0.08)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(94,240,138,0.15)",
                flexShrink: 0,
              }}
            >
              <div>
                <span
                  style={{
                    color: "#5EF08A",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  Email Preview
                </span>
                <span
                  style={{ color: "#7A7D90", fontSize: 12, marginLeft: 10 }}
                >
                  {config.triggerLabel}
                </span>
              </div>
              <button
                type="button"
                data-ocid={`email_templates.preview.close_button.${cardNum}`}
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
                style={{
                  background: "none",
                  border: "1px solid #1C1F33",
                  borderRadius: 6,
                  color: "#7A7D90",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: "4px 10px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
            {/* Modal body — email client simulation */}
            <div style={{ padding: 20, overflowY: "auto" }}>
              <div
                style={{
                  background: "#ffffff",
                  maxWidth: 600,
                  margin: "0 auto",
                  borderRadius: 6,
                  padding: 24,
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {/* Subject meta */}
                <div
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 12,
                    marginBottom: 16,
                  }}
                >
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: 11,
                      margin: "0 0 4px",
                    }}
                  >
                    From: Imperidome &lt;{adminEmail || "..."}
                    &gt;
                  </p>
                  <p
                    style={{
                      color: "#111827",
                      fontSize: 14,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {getPreviewSubject(config, subject) || (
                      <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                        No subject yet…
                      </span>
                    )}
                  </p>
                </div>
                {/* Header image */}
                {(imageUrl ?? "").trim() && (
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <img
                      src={(imageUrl ?? "").trim()}
                      alt="Header"
                      style={{
                        maxWidth: "100%",
                        width: "100%",
                        height: "auto",
                        display: "block",
                        margin: "0 auto",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                )}
                {/* Body text */}
                <div
                  style={{
                    color: "#1f2937",
                    fontSize: 14,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {getPreviewBody(config, body, adminEmail) || (
                    <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                      No body text yet…
                    </span>
                  )}
                </div>
                {/* Video block */}
                {(videoThumbnailUrl ?? "").trim() &&
                  (videoLinkUrl ?? "").trim() && (
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: 20,
                        paddingTop: 16,
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <a
                        href={(videoLinkUrl ?? "").trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          textDecoration: "none",
                        }}
                      >
                        <img
                          src={(videoThumbnailUrl ?? "").trim()}
                          alt="Watch Video"
                          style={{
                            maxWidth: "100%",
                            width: "100%",
                            height: "auto",
                            display: "block",
                            margin: "0 auto",
                            borderRadius: 4,
                          }}
                        />
                      </a>
                      <p
                        style={{
                          color: "#00a85a",
                          fontSize: 13,
                          margin: "8px 0 0",
                          fontWeight: 600,
                        }}
                      >
                        &#9654; Watch Video
                      </p>
                    </div>
                  )}
                {/* Footer */}
                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 14,
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: 11,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    You received this email as a client of Imperidome.{" "}
                    <span style={{ textDecoration: "underline" }}>
                      Unsubscribe
                    </span>{" "}
                    · Imperidome ·{" "}
                    {adminEmail ? adminEmail.split("@")[1] || "..." : "..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEmailTemplatesPage() {
  const { actor, isFetching } = useActor();
  const [savedTemplates, setSavedTemplates] = useState<
    Record<string, EmailTemplate>
  >({});
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [siteAuditPrice, setSiteAuditPrice] = useState<string>("$99");
  const [emailHealth, setEmailHealth] = useState<{
    totalFailures: bigint;
    last24hFailures: bigint;
    lastFailureTimestamp: bigint;
  } | null>(null);

  // getEmailHealth was added to the backend after the last bindgen run.
  // Extend the interface locally until bindings are regenerated.
  type BackendWithHealth = typeof actor & {
    getEmailHealth: () => Promise<{
      totalFailures: bigint;
      last24hFailures: bigint;
      lastFailureTimestamp: bigint;
    }>;
  };

  useEffect(() => {
    const fetchSiteAuditPrice = async () => {
      try {
        const products = await (
          actor as backendInterface
        ).getAllProductsAdmin();
        const auditProduct = products.find((p) =>
          p.name.toLowerCase().includes("site audit"),
        );
        if (auditProduct) {
          setSiteAuditPrice(
            `${Math.round(Number(auditProduct.price_onetime || 9900) / 100)}`,
          );
        }
      } catch {
        /* keep default */
      }
    };
    fetchSiteAuditPrice();
  }, [actor]);

  useEffect(() => {
    if (isFetching || !actor) return;
    actor
      .getAdminContactEmail()
      .then(setAdminEmail)
      .catch(() => {});
    async function load() {
      try {
        let templates: EmailTemplate[] = [];
        try {
          templates = await (actor as backendInterface).getEmailTemplates();
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn("getEmailTemplates error (treating as empty):", err);
          }
          templates = [];
        }
        const map: Record<string, EmailTemplate> = {};
        for (const t of templates) {
          map[t.trigger_key] = t;
        }
        // Only seed templates that are missing — never overwrite existing customizations.
        const missing = getTemplates(adminEmail, siteAuditPrice).filter(
          (cfg) => !map[cfg.id],
        );
        if (missing.length > 0) {
          await Promise.all(
            missing.map((cfg) =>
              (actor as backendInterface)
                .saveEmailTemplate(cfg.id, cfg.defaultSubject, cfg.defaultBody)
                .catch((e: unknown) => {
                  if (import.meta.env.DEV) {
                    console.warn(`Failed to seed template ${cfg.id}:`, e);
                  }
                }),
            ),
          );
          try {
            const refreshed = await (
              actor as backendInterface
            ).getEmailTemplates();
            for (const t of refreshed) {
              map[t.trigger_key] = t;
            }
          } catch {
            /* ignore */
          }
        }
        setSavedTemplates(map);
      } finally {
        setLoading(false);
      }
    }
    load();
    async function fetchHealth() {
      try {
        const health = await (
          actor as unknown as BackendWithHealth
        ).getEmailHealth();
        setEmailHealth(health);
      } catch (err) {
        console.error("Failed to fetch email health:", err);
      }
    }
    fetchHealth();
  }, [actor, isFetching, adminEmail, siteAuditPrice]);

  async function handleSendTest(
    subject: string,
    htmlBody: string,
  ): Promise<void> {
    if (!actor) return;
    const adminEmail = getAdminEmail();
    const createResult = await (actor as backendInterface).createEmailCampaign(
      subject,
      htmlBody,
      [adminEmail ?? ""],
      null,
    );
    if ("err" in createResult) {
      toast.error(`Failed to send test email: ${createResult.err}`);
      return;
    }
    const campaignId = createResult.ok;
    const sendResult = await (actor as backendInterface).sendNowEmailCampaign(
      campaignId,
    );
    if ("err" in sendResult) {
      toast.error(`Failed to send test email: ${sendResult.err}`);
      return;
    }
    toast.success(`Test email sent to ${adminEmail}`);
  }

  async function handleSave(triggerKey: string, subject: string, body: string) {
    if (!actor) return;
    try {
      await (actor as backendInterface).saveEmailTemplate(
        triggerKey,
        subject,
        body,
      );
      toast.success("Template saved.");
    } catch (err) {
      toast.error("Failed to save template. Please try again.");
      if (import.meta.env.DEV) {
        console.error(err);
      }
      return;
    }
    try {
      const templates = await (actor as backendInterface).getEmailTemplates();
      const map: Record<string, EmailTemplate> = {};
      for (const t of templates) {
        map[t.trigger_key] = t;
      }
      setSavedTemplates(map);
    } catch {
      // non-critical: template was saved, just refresh failed
    }
  }

  return (
    <AdminLayout pageTitle="Email Templates">
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 40px" }}>
        {emailHealth && emailHealth.last24hFailures > 0n && (
          <div className="mb-4 p-3 bg-yellow-900/40 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
            Warning: {Number(emailHealth.last24hFailures)} email(s) failed in
            the last 24 hours. Check your email provider settings.
          </div>
        )}
        {/* Intro card */}
        <div
          data-ocid="email_templates.intro.card"
          style={{
            background: "rgba(17,19,34,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid #1C1F33",
            borderRadius: 8,
            padding: 24,
            marginBottom: 32,
            width: "100%",
          }}
        >
          <h3
            style={{
              color: "#EEF0F8",
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Email Templates
          </h3>
          <p
            style={{
              color: "#7A7D90",
              fontSize: 14,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            These are the automated emails sent to clients at each stage of
            their project. Edit the subject line and body copy for each trigger.
            Changes save to the database immediately and apply to all future
            sends from any device.
          </p>
        </div>

        {loading && (
          <div
            data-ocid="email_templates.loading_state"
            style={{
              textAlign: "center",
              padding: 40,
              color: "#7A7D90",
              fontSize: 14,
            }}
          >
            Loading templates...
          </div>
        )}

        {!loading &&
          getTemplates(adminEmail, siteAuditPrice).map((config, index) => (
            <TemplateCard
              key={config.id}
              config={config}
              index={index}
              saved={savedTemplates[config.id]}
              onSave={handleSave}
              onSendTest={handleSendTest}
              adminEmail={adminEmail}
            />
          ))}
      </div>
    </AdminLayout>
  );
}
