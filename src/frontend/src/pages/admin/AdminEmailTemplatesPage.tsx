import { useEffect, useRef, useState } from "react";

import type { backendInterface } from "../../backend.d";
import type { EmailTemplate } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

interface TemplateConfig {
  id: string;
  triggerLabel: string;
  triggerCategory: string;
  defaultSubject: string;
  defaultBody: string;
}

const TEMPLATES: TemplateConfig[] = [
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
    defaultBody:
      "Hi {{client_name}},\n\nWe've received your free consultation request and you're in good hands.\n\nOur team will review your request and be in touch within 1 business day.\n\nRequested Time: {{requested_time}}\nBusiness Type: {{business_type}}\n\nIn the meantime, feel free to browse our services at imperidome.com.\n\nQuestions? Contact us at vincenzo@imperidome.com\n\nWarm regards,\nThe Imperidome Team",
  },
  {
    id: "audit_in_progress",
    triggerLabel: "Audit In Progress",
    triggerCategory: "LEAD",
    defaultSubject: "Your Site Audit Is Underway \u2014 Imperidome",
    defaultBody:
      "Hi {{client_name}},\n\nYour $99 Site Audit has been received and our team is already on it.\n\nHere's what we're auditing:\n- Mobile performance\n- SEO basics\n- Lead capture effectiveness\n- Trust signals\n- Conversion gap analysis\n\nBusiness: {{business_type}}\nExpected delivery: within 48 hours\n\nWe'll send you the full report as soon as it's ready.\n\nQuestions? Contact us at vincenzo@imperidome.com\n\nWarm regards,\nThe Imperidome Team",
  },
];

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#7A7D90",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 4,
};

function formatTimestamp(ns: bigint): string {
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
}: {
  config: TemplateConfig;
  index: number;
  saved: EmailTemplate | undefined;
  onSave: (triggerKey: string, subject: string, body: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState(
    saved?.subject ?? config.defaultSubject,
  );
  const [body, setBody] = useState(
    saved?.body ? sanitizeEmailBody(saved.body) : config.defaultBody,
  );
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setSubject(saved.subject);
      setBody(sanitizeEmailBody(saved.body));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const cardNum = index + 1;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(config.id, subject, body);
      setShowSaved(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowSaved(false), 3000);
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
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

      <div style={{ marginBottom: 8 }}>
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

      <div
        style={{
          color: "#7A7D90",
          fontFamily: "monospace",
          fontSize: 12,
          marginTop: 8,
          marginBottom: 16,
          lineHeight: 1.8,
        }}
      >
        Available variables: {"{{client_name}}"} {"{{business_name}}"}{" "}
        {"{{project_tier}}"} {"{{stripe_link}}"} {"{{invoice_amount}}"}{" "}
        {"{{due_date}}"} {"{{launch_date}}"} {"{{calendly_link}}"}{" "}
        {"{{business_type}}"} {"{{requested_time}}"}
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
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
    </div>
  );
}

export default function AdminEmailTemplatesPage() {
  const { actor } = useActor();
  const [savedTemplates, setSavedTemplates] = useState<
    Record<string, EmailTemplate>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    async function load() {
      try {
        let templates: EmailTemplate[] = [];
        try {
          templates = await (actor as backendInterface).getEmailTemplates();
        } catch (err) {
          console.warn("getEmailTemplates error (treating as empty):", err);
          templates = [];
        }
        const map: Record<string, EmailTemplate> = {};
        for (const t of templates) {
          map[t.trigger_key] = t;
        }
        // Only seed templates that are missing — never overwrite existing customizations.
        const missing = TEMPLATES.filter((cfg) => !map[cfg.id]);
        if (missing.length > 0) {
          await Promise.all(
            missing.map((cfg) =>
              (actor as backendInterface)
                .saveEmailTemplate(
                  getAdminEmail(),
                  cfg.id,
                  cfg.defaultSubject,
                  cfg.defaultBody,
                )
                .catch((e: unknown) =>
                  console.warn(`Failed to seed template ${cfg.id}:`, e),
                ),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  async function handleSave(triggerKey: string, subject: string, body: string) {
    if (!actor) return;
    await (actor as backendInterface).saveEmailTemplate(
      getAdminEmail(),
      triggerKey,
      subject,
      body,
    );
    const templates = await (actor as backendInterface).getEmailTemplates();
    const map: Record<string, EmailTemplate> = {};
    for (const t of templates) {
      map[t.trigger_key] = t;
    }
    setSavedTemplates(map);
  }

  return (
    <AdminLayout pageTitle="Email Templates">
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 40px" }}>
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
          TEMPLATES.map((config, index) => (
            <TemplateCard
              key={config.id}
              config={config}
              index={index}
              saved={savedTemplates[config.id]}
              onSave={handleSave}
            />
          ))}
      </div>
    </AdminLayout>
  );
}
