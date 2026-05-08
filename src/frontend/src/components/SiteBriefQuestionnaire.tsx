import { useEffect, useState } from "react";
import type { QuestionDefinition, backendInterface } from "../backend";
import { useActor } from "../hooks/useActor";

// ---------------------------------------------------------------------------
// DynamicBriefForm — renders a list of QuestionDefinitions as a single-page
// scrollable form (no step-by-step — matches existing multi-section approach).
// Used by both Speedy and Custom brief when backend has questions configured.
// ---------------------------------------------------------------------------
interface DynamicBriefFormProps {
  questions: QuestionDefinition[];
  tierCode: string;
  accentColor: string;
  submitLabel: string;
  onSubmitSuccess: () => void;
  isCustom?: boolean;
}

function DynamicBriefForm({
  questions,
  tierCode,
  accentColor,
  submitLabel,
  onSubmitSuccess,
  isCustom,
}: DynamicBriefFormProps) {
  const { actor } = useActor();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    () => {
      const init: Record<string, string | string[]> = {};
      for (const q of questions) {
        init[q.id] = q.inputType === "checkbox" ? [] : "";
      }
      return init;
    },
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (fieldErrors[id]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;

    // Validate required fields
    const errors: Record<string, string> = {};
    for (const q of questions) {
      if (!q.required) continue;
      const val = answers[q.id];
      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === "string" && !val.trim()) ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) errors[q.id] = `"${q.questionLabel}" is required.`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError("Please fill in all required fields before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const serialized: Record<string, string> = {};
      for (const [key, val] of Object.entries(answers)) {
        serialized[key] = Array.isArray(val) ? val.join(", ") : val;
      }

      const questionnaireType = isCustom
        ? `${tierCode.toUpperCase()} - Custom Site Brief`
        : `${tierCode} - Speedy Site Brief`;

      await (actor as backendInterface).submitQuestionnaire(
        questionnaireType,
        JSON.stringify(serialized),
      );
      await (actor as backendInterface).updateClientBriefStatus("Submitted");
      setSubmitted(true);
      onSubmitSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        data-ocid="dynamic-brief.success"
        style={{
          padding: "24px",
          borderRadius: "10px",
          background: `${accentColor}14`,
          border: `1px solid ${accentColor}40`,
          textAlign: "center",
        }}
      >
        <div
          style={{ fontSize: "36px", marginBottom: "12px" }}
          aria-hidden="true"
        >
          ✓
        </div>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "18px",
            fontWeight: 700,
            color: accentColor,
          }}
        >
          Brief submitted!
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#B0B3C6",
            lineHeight: "1.6",
          }}
        >
          Build Status: Reviewing Brief. Our team will contact you within 24
          hours to confirm your project timeline.
        </p>
      </div>
    );
  }

  const dynInputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(14,16,32,0.8)",
    border: "1px solid #2A2D45",
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#EEF0F8",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const dynTextareaStyle: React.CSSProperties = {
    ...dynInputStyle,
    resize: "vertical",
    minHeight: "88px",
  };

  const dynSelectStyle: React.CSSProperties = {
    ...dynInputStyle,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-ocid="dynamic-brief.form"
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      noValidate
    >
      {questions.map((q) => {
        const val = answers[q.id];
        const err = fieldErrors[q.id];

        return (
          <div
            key={q.id}
            data-ocid={`dynamic-brief.field.${q.id}`}
            style={{ display: "flex", flexDirection: "column", gap: "6px" }}
          >
            <label
              htmlFor={`dbf-${q.id}`}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#B0B3C6",
              }}
            >
              {q.questionLabel}
              {q.required && (
                <span
                  style={{ color: "#F87171", marginLeft: "4px" }}
                  aria-hidden="true"
                >
                  *
                </span>
              )}
            </label>

            {q.description && (
              <span
                style={{
                  fontSize: "11px",
                  color: "#7A7D90",
                  marginTop: "-2px",
                }}
              >
                {q.description}
              </span>
            )}

            {q.inputType === "text" && (
              <input
                id={`dbf-${q.id}`}
                type="text"
                style={dynInputStyle}
                value={typeof val === "string" ? val : ""}
                disabled={submitting}
                placeholder={q.placeholder}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}

            {q.inputType === "textarea" && (
              <textarea
                id={`dbf-${q.id}`}
                style={dynTextareaStyle}
                value={typeof val === "string" ? val : ""}
                disabled={submitting}
                placeholder={q.placeholder}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}

            {q.inputType === "date" && (
              <input
                id={`dbf-${q.id}`}
                type="date"
                style={{ ...dynInputStyle, maxWidth: "240px" }}
                value={typeof val === "string" ? val : ""}
                disabled={submitting}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}

            {q.inputType === "select" && (
              <select
                id={`dbf-${q.id}`}
                style={dynSelectStyle}
                value={typeof val === "string" ? val : ""}
                disabled={submitting}
                onChange={(e) => handleChange(q.id, e.target.value)}
              >
                <option value="">Select…</option>
                {q.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {q.inputType === "checkbox" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {q.options.map((opt) => {
                  const selected: string[] = Array.isArray(val) ? val : [];
                  const checked = selected.includes(opt);
                  return (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13px",
                        color: "#B0B3C6",
                        cursor: submitting ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={submitting}
                        onChange={() => {
                          const next = checked
                            ? selected.filter((v) => v !== opt)
                            : [...selected, opt];
                          handleChange(q.id, next);
                        }}
                        style={{ accentColor }}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            )}

            {err && (
              <span
                data-ocid={`dynamic-brief.field-error.${q.id}`}
                style={{ fontSize: "12px", color: "#F87171" }}
              >
                {err}
              </span>
            )}
          </div>
        );
      })}

      {submitError && (
        <p
          data-ocid="dynamic-brief.error"
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#F87171",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "6px",
            padding: "10px 14px",
          }}
        >
          {submitError}
        </p>
      )}

      <button
        type="submit"
        data-ocid="dynamic-brief.submit"
        disabled={submitting || !actor}
        style={{
          alignSelf: "flex-start",
          padding: "12px 28px",
          borderRadius: "8px",
          background: submitting ? `${accentColor}66` : accentColor,
          color: "#061209",
          fontWeight: 700,
          fontSize: "14px",
          border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
          transition: "opacity 0.15s",
        }}
      >
        {submitting ? "Submitting…" : submitLabel}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Shared Props type
// ---------------------------------------------------------------------------
interface Props {
  serviceType: "custom" | "speedy";
  serviceName: string;
  userEmail: string;
  clientName?: string;
  productTier?: string;
  onSubmitSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Custom tier level detection (module scope)
// ---------------------------------------------------------------------------
function getCustomTierLevel(tier: string): {
  showStep2: boolean;
  engine: "booking" | "restaurant" | "none";
  showStep4a: boolean;
  showStep4b: boolean;
  showStep4c: boolean;
  showStep5: boolean;
} {
  const t = tier.toUpperCase();
  // Tier 4A
  if (t.includes("DIGITAL STOREFRONT"))
    return {
      showStep2: true,
      engine: "none",
      showStep4a: true,
      showStep4b: false,
      showStep4c: false,
      showStep5: false,
    };
  // Tier 4B — also show 3B (restaurant engine)
  if (t.includes("RESTAURANT EMPIRE"))
    return {
      showStep2: true,
      engine: "restaurant",
      showStep4a: false,
      showStep4b: true,
      showStep4c: false,
      showStep5: false,
    };
  // Tier 4C — also show 3A (booking engine)
  if (t.includes("MEMBERSHIP ENGINE"))
    return {
      showStep2: true,
      engine: "booking",
      showStep4a: false,
      showStep4b: false,
      showStep4c: true,
      showStep5: false,
    };
  // Tier 5
  if (t.includes("ENTERPRISE SCALE"))
    return {
      showStep2: true,
      engine: "none",
      showStep4a: false,
      showStep4b: false,
      showStep4c: false,
      showStep5: true,
    };
  // Tier 3A
  if (t.includes("BOOKING PRO"))
    return {
      showStep2: true,
      engine: "booking",
      showStep4a: false,
      showStep4b: false,
      showStep4c: false,
      showStep5: false,
    };
  // Tier 3B
  if (t.includes("RESTAURANT PRO"))
    return {
      showStep2: true,
      engine: "restaurant",
      showStep4a: false,
      showStep4b: false,
      showStep4c: false,
      showStep5: false,
    };
  // Tier 1 (no Step 2)
  if (t.includes("DIGITAL PRESENCE"))
    return {
      showStep2: false,
      engine: "none",
      showStep4a: false,
      showStep4b: false,
      showStep4c: false,
      showStep5: false,
    };
  // All other Tier 2+
  return {
    showStep2: true,
    engine: "none",
    showStep4a: false,
    showStep4b: false,
    showStep4c: false,
    showStep5: false,
  };
}

// ---------------------------------------------------------------------------
// Custom tier price lookup (module scope)
// ---------------------------------------------------------------------------
function getCustomTierPrice(tier: string): string {
  const t = tier.toUpperCase();
  if (t.includes("DIGITAL PRESENCE")) return "$749–$949";
  if (t.includes("AUTHORITY SITE")) return "$1,800–$2,200";
  if (t.includes("BOOKING PRO")) return "$3,900–$4,600";
  if (t.includes("RESTAURANT PRO")) return "$4,100–$4,900";
  if (t.includes("RESTAURANT EMPIRE")) return "$8,500–$10,000";
  if (t.includes("DIGITAL STOREFRONT")) return "$6,500–$7,200";
  if (t.includes("MEMBERSHIP ENGINE")) return "$7,400+";
  if (t.includes("ENTERPRISE SCALE")) return "$14,000+";
  return "see pricing";
}

// ---------------------------------------------------------------------------
// Custom form — interfaces (module scope)
// ---------------------------------------------------------------------------
interface CsPreQualState {
  pq2: string; // Monthly Plan
  pq3: string; // Full Name
  pq3b: string; // Email
  pq3c: string; // Phone
  pq4: string; // Launch Date
  pq5: string; // Content Provision
  pq6: boolean; // Revision checkbox
  pq7: string; // Brand Voice
}
interface CsIdentityState {
  s11: string;
  s12: string;
  s13: string;
  s14: string;
  s15: string;
  s16: string;
}
interface CsHeroState {
  s17: string;
  s18: string;
  s19: string;
  s110: string;
  s111: string;
  s112: string;
}
interface CsAboutState {
  s113: string;
  s114: string;
  s115: string;
  s116: string;
}
interface CsTrustState {
  s117: string;
  s118: string;
  s119: string;
  s120: string;
  s121: string;
}
interface CsSeoState {
  s122: string;
  s123: string;
  s124: string;
  s125: string;
  s126: string;
  s127: string;
  s128: string;
  s129: string;
  s130: string;
  s131: string;
  s132: string;
}
interface CsSitemapState {
  s21: string;
  s22: string;
  s23: string;
}
interface CsServicePagesState {
  s24: string;
  s25: string;
  s26: string;
}
interface CsSeoCompState {
  s27: string;
  s28: string;
  s29: string;
  s210: string;
}
interface CsGalleryState {
  s211: string;
  s212: string;
}
interface CsTeamState {
  s213: string;
}
interface CsLocalSeoState {
  s214: string;
  s215: string;
  s216: string;
  s217: string;
}
interface CsReviewsBlogState {
  s218: string;
  s219: string;
  s220: string;
  s221: string;
}
interface CsBookingEngineState {
  sa1: string;
  sa2: string;
  sa3: string;
  sa4: string;
  sa5: string;
  sa6: string;
  sa7: string;
  sa8: string;
  sa9: string;
  sa10: string;
  sa11: string;
  sa12: string;
  sa13: string;
  sa14: string;
  sa15: string;
  sa16: string;
}
interface CsRestaurantEngineState {
  sb1: string;
  sb2: string;
  sb3: string;
  sb4: string;
  sb5: string;
  sb6: string;
  sb7: string;
  sb8: string;
  sb9: string;
  sb10: string;
  sb11: string;
  sb12: string;
  sb13: string;
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(14,16,32,0.8)",
  border: "1px solid #2A2D45",
  borderRadius: "6px",
  padding: "10px 12px",
  fontSize: "14px",
  color: "#EEF0F8",
  outline: "none",
  boxSizing: "border-box",
};

// ---------------------------------------------------------------------------
// Custom form — shared section header (module scope)
// ---------------------------------------------------------------------------
interface CsSectionHeaderProps {
  step: string;
  title: string;
  color?: string;
}
function CsSectionHeader({
  step,
  title,
  color = "#818CF8",
}: CsSectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "6px",
        marginTop: "4px",
        paddingBottom: "10px",
        borderBottom: `2px solid ${color}33`,
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "0.1em",
          color,
          textTransform: "uppercase",
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderRadius: "4px",
          padding: "2px 7px",
          whiteSpace: "nowrap",
        }}
      >
        {step}
      </span>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#C7CAE0",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
      <div style={{ flex: 1, height: "1px", background: `${color}20` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom form — field wrapper (module scope)
// ---------------------------------------------------------------------------
interface CsFieldProps {
  fieldId: string;
  label: string;
  required?: boolean;
  star?: boolean;
  children: React.ReactNode;
  hint?: string;
}
function CsField({
  fieldId,
  label,
  required,
  star,
  children,
  hint,
}: CsFieldProps) {
  return (
    <div
      data-ocid={`custom-brief.field.${fieldId}`}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <label
        htmlFor={`cbf-${fieldId}`}
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#B0B3C6",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#818CF8",
            marginRight: "6px",
            letterSpacing: "0.04em",
          }}
        >
          {fieldId}
        </span>
        {label}
        {star && (
          <span
            style={{ color: "#FBBF24", marginLeft: "5px", fontSize: "12px" }}
            title="Bonus field"
          >
            ★
          </span>
        )}
        {required && (
          <span
            style={{ color: "#F97316", marginLeft: "3px" }}
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <span style={{ fontSize: "11px", color: "#7A7D90", marginTop: "4px" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CUSTOM SECTION COMPONENTS — ALL AT MODULE SCOPE
// ---------------------------------------------------------------------------

// CsPreQual — PQ1–PQ7
interface CsPreQualProps {
  values: CsPreQualState;
  tierName: string;
  tierPrice: string;
  disabled: boolean;
  onChange: (field: keyof CsPreQualState, value: string | boolean) => void;
}
function CsPreQual({
  values,
  tierName,
  tierPrice,
  disabled,
  onChange,
}: CsPreQualProps) {
  const iStyle = inputStyle;
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader step="Pre-Qualification" title="PQ1–PQ7" />

      {/* PQ1 — read-only tier display */}
      <CsField fieldId="PQ1" label="Confirm Tier">
        <div
          id="cbf-PQ1"
          style={{
            ...iStyle,
            background: "rgba(129,140,248,0.08)",
            border: "1px solid rgba(129,140,248,0.3)",
            color: "#C7CAE0",
            fontSize: "13px",
          }}
        >
          <strong style={{ color: "#818CF8" }}>{tierName}</strong>
          {" — "}
          <span style={{ color: "#86EFAC" }}>{tierPrice}</span>
        </div>
      </CsField>

      {/* PQ2 — Monthly Plan */}
      <CsField fieldId="PQ2" label="Monthly Maintenance Plan">
        <select
          id="cbf-PQ2"
          style={sStyle}
          value={values.pq2}
          disabled={disabled}
          onChange={(e) => onChange("pq2", e.target.value)}
        >
          <option value="">None</option>
          <option value="Keep It Live ($29/mo)">Keep It Live ($29/mo)</option>
          <option value="Stay Sharp ($89/mo)">Stay Sharp ($89/mo)</option>
          <option value="Stay Ahead ($249/mo)">Stay Ahead ($249/mo)</option>
          <option value="Full Partner ($549/mo)">Full Partner ($549/mo)</option>
        </select>
      </CsField>

      {/* PQ3 — Full Name */}
      <CsField fieldId="PQ3" label="Full Name" required>
        <input
          id="cbf-PQ3"
          type="text"
          style={iStyle}
          value={values.pq3}
          disabled={disabled}
          placeholder="Your full legal name"
          onChange={(e) => onChange("pq3", e.target.value)}
        />
      </CsField>

      {/* PQ3b — Email */}
      <CsField fieldId="PQ3b" label="Email Address" required>
        <input
          id="cbf-PQ3b"
          type="email"
          style={iStyle}
          value={values.pq3b}
          disabled={disabled}
          placeholder="your@email.com"
          onChange={(e) => onChange("pq3b", e.target.value)}
        />
      </CsField>

      {/* PQ3c — Phone */}
      <CsField fieldId="PQ3c" label="Phone Number">
        <input
          id="cbf-PQ3c"
          type="tel"
          style={iStyle}
          value={values.pq3c}
          disabled={disabled}
          placeholder="+1 (555) 000-0000"
          onChange={(e) => onChange("pq3c", e.target.value)}
        />
      </CsField>

      {/* PQ4 — Launch Date */}
      <CsField fieldId="PQ4" label="Preferred Launch Date">
        <input
          id="cbf-PQ4"
          type="date"
          style={iStyle}
          value={values.pq4}
          disabled={disabled}
          onChange={(e) => onChange("pq4", e.target.value)}
        />
      </CsField>

      {/* PQ5 — Content Provision */}
      <CsField fieldId="PQ5" label="Content Provision" required>
        <select
          id="cbf-PQ5"
          style={sStyle}
          value={values.pq5}
          disabled={disabled}
          onChange={(e) => onChange("pq5", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="I will provide all content">
            I will provide all content
          </option>
          <option value="I need content written">I need content written</option>
          <option value="Mix (some provided, some written)">
            Mix (some provided, some written)
          </option>
        </select>
      </CsField>

      {/* PQ6 — Revision Acknowledgment */}
      <CsField fieldId="PQ6" label="Revision Acknowledgment" required>
        <label
          htmlFor="cbf-PQ6"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <input
            id="cbf-PQ6"
            type="checkbox"
            checked={values.pq6}
            disabled={disabled}
            onChange={(e) => onChange("pq6", e.target.checked)}
            style={{
              marginTop: "2px",
              accentColor: "#818CF8",
              cursor: "inherit",
            }}
          />
          <span
            style={{ fontSize: "13px", color: "#B0B3C6", lineHeight: "1.5" }}
          >
            I understand this build includes{" "}
            <strong style={{ color: "#EEF0F8" }}>2 rounds of revisions</strong>{" "}
            after the initial build.
          </span>
        </label>
      </CsField>

      {/* PQ7 — Brand Voice */}
      <CsField fieldId="PQ7" label="Brand Voice" required>
        <select
          id="cbf-PQ7"
          style={sStyle}
          value={values.pq7}
          disabled={disabled}
          onChange={(e) => onChange("pq7", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Professional">Professional</option>
          <option value="Friendly">Friendly</option>
          <option value="Bold">Bold</option>
          <option value="Luxury">Luxury</option>
        </select>
      </CsField>
    </div>
  );
}

// CsIdentity — 1.1–1.6
interface CsIdentityProps {
  values: CsIdentityState;
  disabled: boolean;
  onChange: (field: keyof CsIdentityState, value: string) => void;
}
function CsIdentity({ values, disabled, onChange }: CsIdentityProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader step="Step 1" title="Identity (1.1–1.6)" />
      <CsField fieldId="1.1" label="Business Name" required>
        <input
          id="cbf-1.1"
          type="text"
          style={iStyle}
          value={values.s11}
          disabled={disabled}
          placeholder="Your official business name"
          onChange={(e) => onChange("s11", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.2" label="Business Description">
        <textarea
          id="cbf-1.2"
          style={tStyle}
          value={values.s12}
          disabled={disabled}
          placeholder="1–2 sentences describing what your business does"
          onChange={(e) => onChange("s12", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.3" label="Region Served">
        <input
          id="cbf-1.3"
          type="text"
          style={iStyle}
          value={values.s13}
          disabled={disabled}
          placeholder="City / State / Region"
          onChange={(e) => onChange("s13", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.4" label="Ideal Customer">
        <textarea
          id="cbf-1.4"
          style={tStyle}
          value={values.s14}
          disabled={disabled}
          placeholder="Describe your ideal customer — age, location, needs, budget"
          onChange={(e) => onChange("s14", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.5" label="Competitive Edge">
        <textarea
          id="cbf-1.5"
          style={tStyle}
          value={values.s15}
          disabled={disabled}
          placeholder="What sets you apart from competitors?"
          onChange={(e) => onChange("s15", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.6" label="Stats / Social Proof">
        <textarea
          id="cbf-1.6"
          style={tStyle}
          value={values.s16}
          disabled={disabled}
          placeholder='e.g., "500+ clients, 10 years in business, 4.9★ Google rating"'
          onChange={(e) => onChange("s16", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsHero — 1.7–1.12
interface CsHeroProps {
  values: CsHeroState;
  disabled: boolean;
  onChange: (field: keyof CsHeroState, value: string) => void;
}
function CsHero({ values, disabled, onChange }: CsHeroProps) {
  const iStyle = inputStyle;
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader step="Step 1" title="Hero Section (1.7–1.12)" />
      <CsField fieldId="1.7" label="Hero Headline" required>
        <input
          id="cbf-1.7"
          type="text"
          style={iStyle}
          value={values.s17}
          disabled={disabled}
          placeholder="The main headline on your homepage"
          onChange={(e) => onChange("s17", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.8" label="Sub-headline">
        <input
          id="cbf-1.8"
          type="text"
          style={iStyle}
          value={values.s18}
          disabled={disabled}
          placeholder="Supporting line beneath the headline"
          onChange={(e) => onChange("s18", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.9" label="CTA Button Text">
        <input
          id="cbf-1.9"
          type="text"
          style={iStyle}
          value={values.s19}
          disabled={disabled}
          placeholder='e.g., "Book Now", "Get a Free Quote", "Order Online"'
          onChange={(e) => onChange("s19", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.10" label="CTA Destination">
        <select
          id="cbf-1.10"
          style={sStyle}
          value={values.s110}
          disabled={disabled}
          onChange={(e) => onChange("s110", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Scroll to section">Scroll to section</option>
          <option value="Call phone number">Call phone number</option>
          <option value="Link to page">Link to page</option>
        </select>
      </CsField>
      <CsField fieldId="1.11" label="Trust Badge Text">
        <input
          id="cbf-1.11"
          type="text"
          style={iStyle}
          value={values.s111}
          disabled={disabled}
          placeholder='e.g., "Licensed & Insured", "5-Star Rated", "BBB Accredited"'
          onChange={(e) => onChange("s111", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.12" label="Background Preference">
        <select
          id="cbf-1.12"
          style={sStyle}
          value={values.s112}
          disabled={disabled}
          onChange={(e) => onChange("s112", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Solid color">Solid color</option>
          <option value="Gradient">Gradient</option>
          <option value="Photo">Photo</option>
          <option value="Video">Video</option>
          <option value="I'll decide later">I'll decide later</option>
        </select>
      </CsField>
    </div>
  );
}

// CsAboutServices — 1.13–1.16
interface CsAboutServicesProps {
  values: CsAboutState;
  disabled: boolean;
  onChange: (field: keyof CsAboutState, value: string) => void;
}
function CsAboutServices({ values, disabled, onChange }: CsAboutServicesProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader step="Step 1" title="About & Services (1.13–1.16)" />
      <CsField fieldId="1.13" label="Brand Story" required>
        <textarea
          id="cbf-1.13"
          style={{ ...tStyle, minHeight: "110px" }}
          value={values.s113}
          disabled={disabled}
          placeholder="Your about us / origin story — how it started, your mission, what drives you"
          onChange={(e) => onChange("s113", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.14" label="Name & Title">
        <input
          id="cbf-1.14"
          type="text"
          style={iStyle}
          value={values.s114}
          disabled={disabled}
          placeholder='e.g., "Jane Smith, Founder & Lead Designer"'
          onChange={(e) => onChange("s114", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.15" label="Service List">
        <textarea
          id="cbf-1.15"
          style={{ ...tStyle, minHeight: "130px" }}
          value={values.s115}
          disabled={disabled}
          placeholder={
            "List services: Name + 1-sentence description each.\nOne service per line.\nExample:\nHaircut — Precision cuts tailored to your face shape.\nColor — Full color or highlights using premium products."
          }
          onChange={(e) => onChange("s115", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.16" label="Show Pricing on Site">
        <select
          id="cbf-1.16"
          style={sStyle}
          value={values.s116}
          disabled={disabled}
          onChange={(e) => onChange("s116", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </CsField>
    </div>
  );
}

// CsTrustContact — 1.17–1.21
interface CsTrustContactProps {
  values: CsTrustState;
  disabled: boolean;
  onChange: (field: keyof CsTrustState, value: string) => void;
}
function CsTrustContact({ values, disabled, onChange }: CsTrustContactProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader step="Step 1" title="Trust & Contact (1.17–1.21)" />
      <CsField fieldId="1.17" label="Testimonials (3–5)" required>
        <textarea
          id="cbf-1.17"
          style={{ ...tStyle, minHeight: "130px" }}
          value={values.s117}
          disabled={disabled}
          placeholder={
            '"Amazing service, highly recommend!" — Sarah M.\n"Professional and fast. Best in the city." — John D.\n"Worth every penny. Results speak for themselves." — Maria R.'
          }
          onChange={(e) => onChange("s117", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.18" label="Submission Email" required>
        <input
          id="cbf-1.18"
          type="email"
          style={iStyle}
          value={values.s118}
          disabled={disabled}
          placeholder="Where contact form submissions are sent (e.g., hello@yourbiz.com)"
          onChange={(e) => onChange("s118", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.19" label="Business Phone">
        <input
          id="cbf-1.19"
          type="tel"
          style={iStyle}
          value={values.s119}
          disabled={disabled}
          placeholder="+1 (555) 000-0000"
          onChange={(e) => onChange("s119", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.20" label="Business Address">
        <input
          id="cbf-1.20"
          type="text"
          style={iStyle}
          value={values.s120}
          disabled={disabled}
          placeholder='123 Main St, Austin TX 78701 — or type "Fully Online"'
          onChange={(e) => onChange("s120", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.21" label="Business Hours">
        <input
          id="cbf-1.21"
          type="text"
          style={iStyle}
          value={values.s121}
          disabled={disabled}
          placeholder="e.g., Mon–Fri 9am–6pm, Sat 10am–4pm, Closed Sun"
          onChange={(e) => onChange("s121", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsSeoSocial — 1.22–1.32
interface CsSeoSocialProps {
  values: CsSeoState;
  disabled: boolean;
  onChange: (field: keyof CsSeoState, value: string) => void;
}
function CsSeoSocial({ values, disabled, onChange }: CsSeoSocialProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader step="Step 1" title="SEO & Social (1.22–1.32)" />
      <CsField fieldId="1.22" label="Domain Name">
        <input
          id="cbf-1.22"
          type="text"
          style={iStyle}
          value={values.s122}
          disabled={disabled}
          placeholder='e.g., yourbusiness.com or "I need one"'
          onChange={(e) => onChange("s122", e.target.value)}
        />
      </CsField>
      <CsField
        fieldId="1.23"
        label="Browser Tab Title"
        required
        hint={`${values.s123.length}/60 characters`}
      >
        <input
          id="cbf-1.23"
          type="text"
          style={iStyle}
          value={values.s123}
          disabled={disabled}
          maxLength={60}
          placeholder="e.g., Apex HVAC | Austin's Top-Rated Heating & Cooling"
          onChange={(e) => onChange("s123", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.24" label="Target Keywords">
        <textarea
          id="cbf-1.24"
          style={tStyle}
          value={values.s124}
          disabled={disabled}
          placeholder="3–5 keywords/phrases separated by commas&#10;e.g., Austin HVAC, AC repair Austin, heating and cooling Austin"
          onChange={(e) => onChange("s124", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.25" label="Brand Colors">
        <input
          id="cbf-1.25"
          type="text"
          style={iStyle}
          value={values.s125}
          disabled={disabled}
          placeholder='Hex codes, e.g., "#1A1A2E, #E94560" — or describe your colors'
          onChange={(e) => onChange("s125", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.26" label="Logo URL">
        <input
          id="cbf-1.26"
          type="text"
          style={iStyle}
          value={values.s126}
          disabled={disabled}
          placeholder="Direct link to logo (Google Drive, Dropbox, etc.)"
          onChange={(e) => onChange("s126", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.27" label="Website Style">
        <select
          id="cbf-1.27"
          style={sStyle}
          value={values.s127}
          disabled={disabled}
          onChange={(e) => onChange("s127", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Modern & Minimal">Modern & Minimal</option>
          <option value="Bold & Energetic">Bold & Energetic</option>
          <option value="Elegant & Luxury">Elegant & Luxury</option>
          <option value="Warm & Friendly">Warm & Friendly</option>
          <option value="Industrial">Industrial</option>
          <option value="Corporate">Corporate</option>
        </select>
      </CsField>
      <CsField fieldId="1.28" label="Google Business Profile URL">
        <input
          id="cbf-1.28"
          type="text"
          style={iStyle}
          value={values.s128}
          disabled={disabled}
          placeholder="https://g.page/yourbusiness"
          onChange={(e) => onChange("s128", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.29" label="Social Media Links">
        <textarea
          id="cbf-1.29"
          style={tStyle}
          value={values.s129}
          disabled={disabled}
          placeholder={
            "Instagram: https://instagram.com/yourbiz\nFacebook: https://facebook.com/yourbiz\nLinkedIn: https://linkedin.com/company/yourbiz"
          }
          onChange={(e) => onChange("s129", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.30" label="Click-to-Call Number">
        <input
          id="cbf-1.30"
          type="tel"
          style={iStyle}
          value={values.s130}
          disabled={disabled}
          placeholder="+1 (555) 000-0000"
          onChange={(e) => onChange("s130", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.31" label="Google Analytics ID" star>
        <input
          id="cbf-1.31"
          type="text"
          style={iStyle}
          value={values.s131}
          disabled={disabled}
          placeholder="G-XXXXXXX"
          onChange={(e) => onChange("s131", e.target.value)}
        />
      </CsField>
      <CsField fieldId="1.32" label="Click-to-Text Phone Number" star>
        <input
          id="cbf-1.32"
          type="tel"
          style={iStyle}
          value={values.s132}
          disabled={disabled}
          placeholder="+1 (555) 000-0000"
          onChange={(e) => onChange("s132", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsSitemap — 2.1–2.3
interface CsSitemapProps {
  values: CsSitemapState;
  disabled: boolean;
  onChange: (field: keyof CsSitemapState, value: string) => void;
}
function CsSitemap({ values, disabled, onChange }: CsSitemapProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader
        step="Step 2"
        title="Sitemap & Navigation (2.1–2.3)"
        color="#A78BFA"
      />
      <CsField fieldId="2.1" label="Sitemap">
        <textarea
          id="cbf-2.1"
          style={{ ...tStyle, minHeight: "100px" }}
          value={values.s21}
          disabled={disabled}
          placeholder={
            "List all pages, one per line:\nHome\nAbout\nServices\nPortfolio\nContact"
          }
          onChange={(e) => onChange("s21", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.2" label="Navigation Order">
        <input
          id="cbf-2.2"
          type="text"
          style={iStyle}
          value={values.s22}
          disabled={disabled}
          placeholder='e.g., "Home | About | Services | Gallery | Contact"'
          onChange={(e) => onChange("s22", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.3" label="Dedicated Service Pages">
        <select
          id="cbf-2.3"
          style={sStyle}
          value={values.s23}
          disabled={disabled}
          onChange={(e) => onChange("s23", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </CsField>
    </div>
  );
}

// CsServicePages — 2.4–2.6
interface CsServicePagesProps {
  values: CsServicePagesState;
  disabled: boolean;
  onChange: (field: keyof CsServicePagesState, value: string) => void;
}
function CsServicePages({ values, disabled, onChange }: CsServicePagesProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader
        step="Step 2"
        title="Service Page Details (2.4–2.6)"
        color="#A78BFA"
      />
      <CsField fieldId="2.4" label="Service Page Count">
        <input
          id="cbf-2.4"
          type="number"
          min={1}
          max={8}
          style={iStyle}
          value={values.s24}
          disabled={disabled}
          placeholder="Up to 8 pages"
          onChange={(e) => onChange("s24", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.5" label="Service Page Details">
        <textarea
          id="cbf-2.5"
          style={{ ...tStyle, minHeight: "200px" }}
          value={values.s25}
          disabled={disabled}
          placeholder={
            "For each page:\nName / SEO Title / Body content / Bullet points / Image URL\nUse --- to separate pages\n\n---\nName: HVAC Installation\nSEO Title: Expert HVAC Installation Austin TX\nBody: We install all major brands...\nBullets: Licensed & insured / Same-day service / 10-year warranty\nImage: https://img.url"
          }
          onChange={(e) => onChange("s25", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.6" label="Service Page Images">
        <textarea
          id="cbf-2.6"
          style={tStyle}
          value={values.s26}
          disabled={disabled}
          placeholder={
            "Image URLs for each service page, one per line:\nhttps://img.url/service1.jpg\nhttps://img.url/service2.jpg"
          }
          onChange={(e) => onChange("s26", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsSeoComp — 2.7–2.10
interface CsSeoCompProps {
  values: CsSeoCompState;
  disabled: boolean;
  onChange: (field: keyof CsSeoCompState, value: string) => void;
}
function CsSeoComp({ values, disabled, onChange }: CsSeoCompProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader
        step="Step 2"
        title="SEO & Competitors (2.7–2.10)"
        color="#A78BFA"
      />
      <CsField fieldId="2.7" label="City SEO Targets">
        <textarea
          id="cbf-2.7"
          style={tStyle}
          value={values.s27}
          disabled={disabled}
          placeholder={
            "Cities to target for local SEO, one per line:\nAustin\nRound Rock\nCedar Park\nGeorgetown"
          }
          onChange={(e) => onChange("s27", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.8" label="Top 3 Competitors">
        <input
          id="cbf-2.8"
          type="text"
          style={iStyle}
          value={values.s28}
          disabled={disabled}
          placeholder="Names or URLs, comma-separated"
          onChange={(e) => onChange("s28", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.9" label="Site-Wide CTA">
        <input
          id="cbf-2.9"
          type="text"
          style={iStyle}
          value={values.s29}
          disabled={disabled}
          placeholder='The main call to action repeated throughout the site, e.g., "Get a Free Quote"'
          onChange={(e) => onChange("s29", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.10" label="FAQs (8–12)">
        <textarea
          id="cbf-2.10"
          style={{ ...tStyle, minHeight: "200px" }}
          value={values.s210}
          disabled={disabled}
          placeholder={
            "Q: How long does installation take?\nA: Most installations are completed within 4–6 hours.\n\nQ: Do you offer warranties?\nA: Yes, all installations come with a 10-year parts and labor warranty."
          }
          onChange={(e) => onChange("s210", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsGallery — 2.11–2.12
interface CsGalleryProps {
  values: CsGalleryState;
  disabled: boolean;
  onChange: (field: keyof CsGalleryState, value: string) => void;
}
function CsGallery({ values, disabled, onChange }: CsGalleryProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader
        step="Step 2"
        title="Before/After Gallery (2.11–2.12)"
        color="#A78BFA"
      />
      <CsField fieldId="2.11" label="Gallery Image URLs">
        <textarea
          id="cbf-2.11"
          style={{ ...tStyle, minHeight: "110px" }}
          value={values.s211}
          disabled={disabled}
          placeholder={
            "Before/After pairs, one per line:\nBefore: https://img.url/before1.jpg / After: https://img.url/after1.jpg\nBefore: https://img.url/before2.jpg / After: https://img.url/after2.jpg"
          }
          onChange={(e) => onChange("s211", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.12" label="Gallery Section Title">
        <input
          id="cbf-2.12"
          type="text"
          style={iStyle}
          value={values.s212}
          disabled={disabled}
          placeholder='e.g., "Our Work", "Transformations", "Before & After"'
          onChange={(e) => onChange("s212", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsTeam — 2.13
interface CsTeamProps {
  values: CsTeamState;
  disabled: boolean;
  onChange: (field: keyof CsTeamState, value: string) => void;
}
function CsTeam({ values, disabled, onChange }: CsTeamProps) {
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "120px",
    fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader
        step="Step 2"
        title="Team Members (2.13)"
        color="#A78BFA"
      />
      <CsField fieldId="2.13" label="Team Members">
        <textarea
          id="cbf-2.13"
          style={tStyle}
          value={values.s213}
          disabled={disabled}
          placeholder={
            "Name / Bio / Photo URL — use --- to separate members\n\nJane Smith / Founder & Lead Designer. 10+ years in the industry. / https://img.url/jane.jpg\n---\nMike Torres / Senior Technician. Certified in all major brands. / https://img.url/mike.jpg"
          }
          onChange={(e) => onChange("s213", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsLocalSeo — 2.14–2.17
interface CsLocalSeoProps {
  values: CsLocalSeoState;
  disabled: boolean;
  onChange: (field: keyof CsLocalSeoState, value: string) => void;
}
function CsLocalSeo({ values, disabled, onChange }: CsLocalSeoProps) {
  const iStyle = inputStyle;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader
        step="Step 2"
        title="Local SEO & Analytics (2.14–2.17)"
        color="#A78BFA"
      />
      <CsField fieldId="2.14" label="Google Place ID">
        <input
          id="cbf-2.14"
          type="text"
          style={iStyle}
          value={values.s214}
          disabled={disabled}
          placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
          onChange={(e) => onChange("s214", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.15" label="Map Cities">
        <input
          id="cbf-2.15"
          type="text"
          style={iStyle}
          value={values.s215}
          disabled={disabled}
          placeholder="Comma-separated cities, e.g., Austin, Round Rock, Cedar Park"
          onChange={(e) => onChange("s215", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.16" label="Analytics ID">
        <input
          id="cbf-2.16"
          type="text"
          style={iStyle}
          value={values.s216}
          disabled={disabled}
          placeholder="G-XXXXXXX"
          onChange={(e) => onChange("s216", e.target.value)}
        />
      </CsField>
      <CsField fieldId="2.17" label="Google Search Console">
        <input
          id="cbf-2.17"
          type="text"
          style={iStyle}
          value={values.s217}
          disabled={disabled}
          placeholder="Verification code or URL"
          onChange={(e) => onChange("s217", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsReviewsBlog — 2.18–2.21
interface CsReviewsBlogProps {
  values: CsReviewsBlogState;
  disabled: boolean;
  onChange: (field: keyof CsReviewsBlogState, value: string) => void;
}
function CsReviewsBlog({ values, disabled, onChange }: CsReviewsBlogProps) {
  const iStyle = inputStyle;
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader
        step="Step 2"
        title="Reviews & Blog (2.18–2.21 ★)"
        color="#A78BFA"
      />
      <CsField fieldId="2.18" label="Google Reviews Display" star>
        <select
          id="cbf-2.18"
          style={sStyle}
          value={values.s218}
          disabled={disabled}
          onChange={(e) => onChange("s218", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="5-Star reviews only">5-Star reviews only</option>
          <option value="Show all reviews">Show all reviews</option>
        </select>
      </CsField>
      <CsField fieldId="2.19" label="Google Reviews Widget Location" star>
        <select
          id="cbf-2.19"
          style={sStyle}
          value={values.s219}
          disabled={disabled}
          onChange={(e) => onChange("s219", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Homepage">Homepage</option>
          <option value="Dedicated Reviews page">Dedicated Reviews page</option>
          <option value="Both">Both</option>
        </select>
      </CsField>
      <CsField fieldId="2.20" label="Blog Setup Needed?" star>
        <select
          id="cbf-2.20"
          style={sStyle}
          value={values.s220}
          disabled={disabled}
          onChange={(e) => onChange("s220", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </CsField>
      <CsField fieldId="2.21" label="Blog Categories" star>
        <input
          id="cbf-2.21"
          type="text"
          style={iStyle}
          value={values.s221}
          disabled={disabled}
          placeholder='Comma-separated, e.g., "Tips, News, Case Studies, How-To"'
          onChange={(e) => onChange("s221", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsBookingEngine — 3A.1–3A.16
interface CsBookingEngineProps {
  values: CsBookingEngineState;
  disabled: boolean;
  onChange: (field: keyof CsBookingEngineState, value: string) => void;
}
function CsBookingEngine({ values, disabled, onChange }: CsBookingEngineProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader
        step="Step 3A"
        title="Booking Pro Engine (3A.1–3A.16)"
        color="#F472B6"
      />
      <CsField
        fieldId="3A.1"
        label="Bookable Services"
        required
        hint="PHOTO URL IS MANDATORY for each service"
      >
        <textarea
          id="cbf-3A.1"
          style={{ ...tStyle, minHeight: "170px" }}
          value={values.sa1}
          disabled={disabled}
          placeholder={
            "Name / Duration / Price / Photo URL — use --- to separate\n\nHaircut / 45min / $65 / https://img.url/haircut.jpg\n---\nColor Treatment / 90min / $150 / https://img.url/color.jpg\n---\nBlowout / 30min / $45 / https://img.url/blowout.jpg"
          }
          onChange={(e) => onChange("sa1", e.target.value)}
        />
        <span style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}>
          ★ Photo URL is mandatory for each service
        </span>
      </CsField>
      <CsField fieldId="3A.2" label="Staff Members">
        <textarea
          id="cbf-3A.2"
          style={tStyle}
          value={values.sa2}
          disabled={disabled}
          placeholder={
            "Name / Role / Photo URL — use --- to separate\n\nJane Smith / Lead Stylist / https://img.url/jane.jpg\n---\nMike Torres / Senior Technician / https://img.url/mike.jpg"
          }
          onChange={(e) => onChange("sa2", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.3" label="Booking Hours">
        <input
          id="cbf-3A.3"
          type="text"
          style={iStyle}
          value={values.sa3}
          disabled={disabled}
          placeholder="e.g., Mon–Fri 9am–5pm, Sat 10am–2pm, Closed Sun"
          onChange={(e) => onChange("sa3", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.4" label="Payment Capture">
        <select
          id="cbf-3A.4"
          style={sStyle}
          value={values.sa4}
          disabled={disabled}
          onChange={(e) => onChange("sa4", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="No payment">No payment</option>
          <option value="Deposit only">Deposit only</option>
          <option value="Full payment upfront">Full payment upfront</option>
        </select>
      </CsField>
      <CsField fieldId="3A.5" label="Deposit Amount">
        <input
          id="cbf-3A.5"
          type="text"
          style={iStyle}
          value={values.sa5}
          disabled={disabled}
          placeholder='Dollar amount or percentage, e.g., "$50" or "25%"'
          onChange={(e) => onChange("sa5", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.6" label="Cancellation Policy">
        <textarea
          id="cbf-3A.6"
          style={tStyle}
          value={values.sa6}
          disabled={disabled}
          placeholder="Describe your cancellation and refund policy"
          onChange={(e) => onChange("sa6", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.7" label="Hours Before Cancel">
        <input
          id="cbf-3A.7"
          type="number"
          min={0}
          style={iStyle}
          value={values.sa7}
          disabled={disabled}
          placeholder="How many hours notice required to cancel (e.g., 24)"
          onChange={(e) => onChange("sa7", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.8" label="Online Reschedule/Cancel">
        <select
          id="cbf-3A.8"
          style={sStyle}
          value={values.sa8}
          disabled={disabled}
          onChange={(e) => onChange("sa8", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </CsField>
      <CsField fieldId="3A.9" label="Booking Confirmation Email" required>
        <input
          id="cbf-3A.9"
          type="email"
          style={iStyle}
          value={values.sa9}
          disabled={disabled}
          placeholder="confirmations@yourbusiness.com"
          onChange={(e) => onChange("sa9", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.10" label="24-Hour Reminder Email">
        <input
          id="cbf-3A.10"
          type="email"
          style={iStyle}
          value={values.sa10}
          disabled={disabled}
          placeholder="reminders@yourbusiness.com (can be same as above)"
          onChange={(e) => onChange("sa10", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.11" label="Post-Service Follow-Up Email">
        <input
          id="cbf-3A.11"
          type="email"
          style={iStyle}
          value={values.sa11}
          disabled={disabled}
          placeholder="followup@yourbusiness.com"
          onChange={(e) => onChange("sa11", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.12" label="CRM Stages">
        <textarea
          id="cbf-3A.12"
          style={tStyle}
          value={values.sa12}
          disabled={disabled}
          placeholder={
            "List your pipeline stages, one per line:\nNew Lead\nBooked\nCompleted\nFollow-Up\nWin"
          }
          onChange={(e) => onChange("sa12", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.13" label="Admin Notification Email">
        <input
          id="cbf-3A.13"
          type="email"
          style={iStyle}
          value={values.sa13}
          disabled={disabled}
          placeholder="admin@yourbusiness.com — notified of new bookings"
          onChange={(e) => onChange("sa13", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.14" label="Intake Form Questions">
        <textarea
          id="cbf-3A.14"
          style={tStyle}
          value={values.sa14}
          disabled={disabled}
          placeholder={
            "Questions to ask during booking, one per line:\nWhat service are you booking?\nAny allergies or sensitivities?\nHave you been a client before?"
          }
          onChange={(e) => onChange("sa14", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.15" label="Booking Page Main Headline" star>
        <input
          id="cbf-3A.15"
          type="text"
          style={iStyle}
          value={values.sa15}
          disabled={disabled}
          placeholder='e.g., "Book Your Appointment Online"'
          onChange={(e) => onChange("sa15", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3A.16" label="Booking Page Sub-description" star>
        <textarea
          id="cbf-3A.16"
          style={tStyle}
          value={values.sa16}
          disabled={disabled}
          placeholder="A short intro paragraph for your booking page"
          onChange={(e) => onChange("sa16", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// CsRestaurantEngine — 3B.1–3B.13
interface CsRestaurantEngineProps {
  values: CsRestaurantEngineState;
  disabled: boolean;
  onChange: (field: keyof CsRestaurantEngineState, value: string) => void;
}
function CsRestaurantEngine({
  values,
  disabled,
  onChange,
}: CsRestaurantEngineProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CsSectionHeader
        step="Step 3B"
        title="Restaurant Pro Engine (3B.1–3B.13)"
        color="#F97316"
      />
      <CsField fieldId="3B.1" label="Order Types" required>
        <select
          id="cbf-3B.1"
          style={sStyle}
          value={values.sb1}
          disabled={disabled}
          onChange={(e) => onChange("sb1", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Pickup only">Pickup only</option>
          <option value="Delivery only">Delivery only</option>
          <option value="Both pickup and delivery">
            Both pickup and delivery
          </option>
        </select>
      </CsField>
      <CsField fieldId="3B.2" label="Average Prep Time">
        <input
          id="cbf-3B.2"
          type="text"
          style={iStyle}
          value={values.sb2}
          disabled={disabled}
          placeholder='e.g., "15–20 minutes"'
          onChange={(e) => onChange("sb2", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3B.3" label="Kitchen Notification Email" required>
        <input
          id="cbf-3B.3"
          type="email"
          style={iStyle}
          value={values.sb3}
          disabled={disabled}
          placeholder="kitchen@yourbusiness.com"
          onChange={(e) => onChange("sb3", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3B.4" label="Order Confirmation Email">
        <input
          id="cbf-3B.4"
          type="email"
          style={iStyle}
          value={values.sb4}
          disabled={disabled}
          placeholder="orders@yourbusiness.com"
          onChange={(e) => onChange("sb4", e.target.value)}
        />
      </CsField>
      <CsField
        fieldId="3B.5"
        label="Full Menu"
        required
        hint="PHOTO URL IS MANDATORY for each item"
      >
        <textarea
          id="cbf-3B.5"
          style={{ ...tStyle, minHeight: "200px" }}
          value={values.sb5}
          disabled={disabled}
          placeholder={
            "Category / Item Name / Price / Description / Photo URL — use --- to separate\n\nStarters / Loaded Fries / $9 / Crispy fries with cheese and bacon / https://img.url/fries.jpg\n---\nMains / Smash Burger / $14 / Double smash patty with special sauce / https://img.url/burger.jpg\n---\nDesserts / Cheesecake / $8 / New York style cheesecake / https://img.url/cheesecake.jpg"
          }
          onChange={(e) => onChange("sb5", e.target.value)}
        />
        <span style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}>
          ★ Photo URL is mandatory for each menu item
        </span>
      </CsField>
      <CsField fieldId="3B.6" label="Menu Modifiers">
        <textarea
          id="cbf-3B.6"
          style={tStyle}
          value={values.sb6}
          disabled={disabled}
          placeholder={
            "Customizations, one group per line:\nProtein: Chicken / Beef / Tofu\nSize: Small / Regular / Large\nExtras: Add Avocado +$2 / Add Bacon +$3"
          }
          onChange={(e) => onChange("sb6", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3B.7" label="Delivery Radius">
        <input
          id="cbf-3B.7"
          type="text"
          style={iStyle}
          value={values.sb7}
          disabled={disabled}
          placeholder='Miles or zone description, e.g., "5-mile radius" or "Zip codes 78701, 78702"'
          onChange={(e) => onChange("sb7", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3B.8" label="Minimum Order Amount">
        <input
          id="cbf-3B.8"
          type="text"
          style={iStyle}
          value={values.sb8}
          disabled={disabled}
          placeholder='e.g., "$15" or "No minimum"'
          onChange={(e) => onChange("sb8", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3B.9" label="Operating Hours for Orders">
        <input
          id="cbf-3B.9"
          type="text"
          style={iStyle}
          value={values.sb9}
          disabled={disabled}
          placeholder="If different from business hours, e.g., Orders 11am–9pm daily"
          onChange={(e) => onChange("sb9", e.target.value)}
        />
      </CsField>
      <CsField fieldId="3B.10" label="Dine-In / Table Reservation">
        <select
          id="cbf-3B.10"
          style={sStyle}
          value={values.sb10}
          disabled={disabled}
          onChange={(e) => onChange("sb10", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes, include table booking">
            Yes, include table booking
          </option>
          <option value="No">No</option>
        </select>
      </CsField>
      <CsField fieldId="3B.11" label="Catering Available">
        <select
          id="cbf-3B.11"
          style={sStyle}
          value={values.sb11}
          disabled={disabled}
          onChange={(e) => onChange("sb11", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </CsField>
      <CsField fieldId="3B.12" label="Special Instructions Field">
        <select
          id="cbf-3B.12"
          style={sStyle}
          value={values.sb12}
          disabled={disabled}
          onChange={(e) => onChange("sb12", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes, show on checkout">Yes, show on checkout</option>
          <option value="No">No</option>
        </select>
      </CsField>
      <CsField fieldId="3B.13" label="Catering Form Fields" star>
        <textarea
          id="cbf-3B.13"
          style={tStyle}
          value={values.sb13}
          disabled={disabled}
          placeholder={
            "List the fields for your catering inquiry form, one per line:\nEvent Date\nGuest Count\nVenue / Location\nEvent Type (Wedding, Corporate, Birthday, etc.)\nBudget Range\nSpecial Dietary Needs"
          }
          onChange={(e) => onChange("sb13", e.target.value)}
        />
      </CsField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Part 2 — State interfaces (module scope)
// ---------------------------------------------------------------------------
interface CsDigitalStorefrontState {
  s4a1: string;
  s4a2: string;
  s4a3: string;
  s4a4: string;
  s4a5: string;
  s4a6: string;
  s4a7: string;
  s4a8: string;
  s4a9: string;
  s4a10: string;
  s4a11: string;
  s4a12: string;
  s4a13: string;
  s4a14: string;
}
interface CsRestaurantEmpireState {
  s4b1: string;
  s4b2: string;
  s4b3: string;
  s4b4: string;
  s4b5: string;
  s4b6: string;
  s4b7: string;
  s4b8: string;
  s4b9: string;
  s4b10: string;
  s4b11: string;
  s4b12: string;
  s4b13: string;
  s4b14: string;
  s4b15: string;
  s4b16: string;
  s4b17: string;
  s4b18: string;
}
interface CsMembershipEngineState {
  s4c1: string;
  s4c2: string;
  s4c3: string;
  s4c4: string;
  s4c5: string;
  s4c6: string;
  s4c7: string;
  s4c8: string;
  s4c9: string;
  s4c10: string;
  s4c11: string;
  s4c12: string;
  s4c13: string;
}
interface CsEnterpriseState {
  s51: string;
  s52: string;
  s53: string;
  s54: string;
  s55: string;
  s56: string;
  s57: string;
  s58: string;
  s59: string;
  s510: string;
  s511: string;
  s512: string;
  s513: string;
  s514: string;
  s515: string;
  s516: string;
  s517: string;
  s518: string;
  s519: string;
  s520: string;
  s521: string;
  s522: string;
  s523: string;
  s524: string;
  s525: string;
  s526: string;
  s527: string;
}

// ---------------------------------------------------------------------------
// Part 2 — CsDigitalStorefront (4A.1–4A.14) — MODULE SCOPE
// ---------------------------------------------------------------------------
interface CsDigitalStorefrontProps {
  state: CsDigitalStorefrontState;
  disabled: boolean;
  onChange: (field: keyof CsDigitalStorefrontState, value: string) => void;
}
function CsDigitalStorefront({
  state,
  disabled,
  onChange,
}: CsDigitalStorefrontProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  const groupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    borderRadius: "8px",
    background: "rgba(16,185,129,0.03)",
    border: "1px solid rgba(16,185,129,0.12)",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <CsSectionHeader
        step="Step 4A"
        title="Digital Storefront Engine (4A.1–4A.14)"
        color="#10B981"
      />

      {/* Group A: E-Commerce Setup */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#10B981",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          E-Commerce Setup
        </span>
        <CsField
          fieldId="4A.1"
          label="Product Categories"
          required
          hint="Comma-separated list of your store's main categories"
        >
          <input
            id="cbf-4A.1"
            type="text"
            style={iStyle}
            value={state.s4a1}
            disabled={disabled}
            placeholder="e.g., Apparel, Accessories, Home Goods, Gift Cards"
            onChange={(e) => onChange("s4a1", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4A.2"
          label="Product Catalog — Name, Price, Image URL per item"
          required
          hint="One product per line. Photo URL is mandatory."
        >
          <textarea
            id="cbf-4A.2"
            style={{ ...tStyle, minHeight: "170px" }}
            value={state.s4a2}
            disabled={disabled}
            placeholder={
              "Classic Tee / $35 / https://img.url/tee.jpg\nSignature Cap / $28 / https://img.url/cap.jpg\nCanvas Tote / $22 / https://img.url/tote.jpg"
            }
            onChange={(e) => onChange("s4a2", e.target.value)}
          />
          <span
            style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}
          >
            ★ Photo URL is mandatory for each product
          </span>
        </CsField>
        <CsField
          fieldId="4A.3"
          label="Featured Collections"
          hint="Names of special collections to highlight on the store"
        >
          <input
            id="cbf-4A.3"
            type="text"
            style={iStyle}
            value={state.s4a3}
            disabled={disabled}
            placeholder="e.g., Summer Collection, Best Sellers, New Arrivals"
            onChange={(e) => onChange("s4a3", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4A.4"
          label="Homepage Spotlight Product(s)"
          hint="Products to feature in the hero/spotlight section of the homepage"
        >
          <input
            id="cbf-4A.4"
            type="text"
            style={iStyle}
            value={state.s4a4}
            disabled={disabled}
            placeholder="Product names to spotlight, comma-separated"
            onChange={(e) => onChange("s4a4", e.target.value)}
          />
        </CsField>
        <CsField fieldId="4A.5" label="Shipping Logic" required>
          <select
            id="cbf-4A.5"
            style={sStyle}
            value={state.s4a5}
            disabled={disabled}
            onChange={(e) => onChange("s4a5", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Flat Rate">Flat Rate</option>
            <option value="Weight-Based">Weight-Based</option>
            <option value="Free Over Threshold">Free Over Threshold</option>
            <option value="Local Pickup Only">Local Pickup Only</option>
          </select>
        </CsField>
        <CsField
          fieldId="4A.6"
          label="Shipping Rules"
          hint="Rates, thresholds, carriers, free shipping threshold, etc."
        >
          <textarea
            id="cbf-4A.6"
            style={tStyle}
            value={state.s4a6}
            disabled={disabled}
            placeholder={
              "Flat rate: $5.99 per order\nFree shipping on orders over $75\nCarrier: USPS Priority Mail\nEstimated delivery: 3–5 business days"
            }
            onChange={(e) => onChange("s4a6", e.target.value)}
          />
        </CsField>
        <CsField fieldId="4A.7" label="Origin / Ship-From Address" required>
          <input
            id="cbf-4A.7"
            type="text"
            style={iStyle}
            value={state.s4a7}
            disabled={disabled}
            placeholder="123 Main St, Austin TX 78701"
            onChange={(e) => onChange("s4a7", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4A.8"
          label="Sales Tax States"
          hint="States where you collect and remit sales tax"
        >
          <input
            id="cbf-4A.8"
            type="text"
            style={iStyle}
            value={state.s4a8}
            disabled={disabled}
            placeholder="e.g., TX, CA, NY — or 'None' if not applicable"
            onChange={(e) => onChange("s4a8", e.target.value)}
          />
        </CsField>
      </div>

      {/* Group B: Order Management */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#10B981",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Order Management
        </span>
        <CsField fieldId="4A.9" label="Order Confirmation Email" required>
          <input
            id="cbf-4A.9"
            type="email"
            style={iStyle}
            value={state.s4a9}
            disabled={disabled}
            placeholder="orders@yourbusiness.com"
            onChange={(e) => onChange("s4a9", e.target.value)}
          />
        </CsField>
        <CsField fieldId="4A.10" label="Shipping Update Notification Email">
          <input
            id="cbf-4A.10"
            type="email"
            style={iStyle}
            value={state.s4a10}
            disabled={disabled}
            placeholder="shipping@yourbusiness.com (can be same as above)"
            onChange={(e) => onChange("s4a10", e.target.value)}
          />
        </CsField>
        <CsField fieldId="4A.11" label="Return & Refund Policy">
          <textarea
            id="cbf-4A.11"
            style={{ ...tStyle, minHeight: "110px" }}
            value={state.s4a11}
            disabled={disabled}
            placeholder={
              "Items may be returned within 30 days of delivery in original condition.\nShipping costs are non-refundable.\nRefunds processed within 5–7 business days."
            }
            onChange={(e) => onChange("s4a11", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4A.12"
          label="Promo Codes"
          hint="List existing codes to load, or 'None'"
        >
          <input
            id="cbf-4A.12"
            type="text"
            style={iStyle}
            value={state.s4a12}
            disabled={disabled}
            placeholder='e.g., WELCOME10 (10% off), SUMMER20 (20% off) — or "None"'
            onChange={(e) => onChange("s4a12", e.target.value)}
          />
        </CsField>
        <CsField fieldId="4A.13" label="Customer Account Requirement">
          <select
            id="cbf-4A.13"
            style={sStyle}
            value={state.s4a13}
            disabled={disabled}
            onChange={(e) => onChange("s4a13", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Required">
              Required — must create account to purchase
            </option>
            <option value="Optional">
              Optional — account available but not required
            </option>
            <option value="Guest Checkout Only">Guest Checkout Only</option>
          </select>
        </CsField>
      </div>

      {/* Group C: Custom Touches */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#FBBF24",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          ★ Custom Touches
        </span>
        <CsField
          fieldId="4A.14"
          label="Custom Order Confirmation Page Message"
          star
          hint="Text shown to customers after a successful purchase"
        >
          <textarea
            id="cbf-4A.14"
            style={tStyle}
            value={state.s4a14}
            disabled={disabled}
            placeholder={
              'e.g., "Thank you for your order! You\'ll receive a shipping confirmation email within 1–2 business days. We appreciate your support!"'
            }
            onChange={(e) => onChange("s4a14", e.target.value)}
          />
        </CsField>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Part 2 — CsRestaurantEmpire (4B.1–4B.18) — MODULE SCOPE
// ---------------------------------------------------------------------------
interface CsRestaurantEmpireProps {
  state: CsRestaurantEmpireState;
  disabled: boolean;
  onChange: (field: keyof CsRestaurantEmpireState, value: string) => void;
}
function CsRestaurantEmpire({
  state,
  disabled,
  onChange,
}: CsRestaurantEmpireProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  const groupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    borderRadius: "8px",
    background: "rgba(251,146,60,0.03)",
    border: "1px solid rgba(251,146,60,0.12)",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <CsSectionHeader
        step="Step 4B"
        title="Restaurant Empire Engine (4B.1–4B.18)"
        color="#FB923C"
      />

      {/* Group A: Multi-Location Setup */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#FB923C",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Multi-Location Setup
        </span>
        <CsField
          fieldId="4B.1"
          label="Number of Locations"
          required
          hint="Maximum 3 locations"
        >
          <select
            id="cbf-4B.1"
            style={sStyle}
            value={state.s4b1}
            disabled={disabled}
            onChange={(e) => onChange("s4b1", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </CsField>
        <CsField
          fieldId="4B.2"
          label="Per-Location Details"
          required
          hint="Address / Phone / Hours / Manager Name — one location per line"
        >
          <textarea
            id="cbf-4B.2"
            style={{ ...tStyle, minHeight: "140px" }}
            value={state.s4b2}
            disabled={disabled}
            placeholder={
              "Location 1: 123 Main St, Austin TX | (512) 555-0001 | Mon–Fri 11am–10pm, Sat–Sun 10am–11pm | Maria Johnson\nLocation 2: 456 Oak Ave, Round Rock TX | (512) 555-0002 | Daily 11am–10pm | Carlos Rivera"
            }
            onChange={(e) => onChange("s4b2", e.target.value)}
          />
        </CsField>
        <CsField fieldId="4B.3" label="Menu Type" required>
          <select
            id="cbf-4B.3"
            style={sStyle}
            value={state.s4b3}
            disabled={disabled}
            onChange={(e) => onChange("s4b3", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Shared Menu Across All Locations">
              Shared Menu Across All Locations
            </option>
            <option value="Each Location Has Its Own Menu">
              Each Location Has Its Own Menu
            </option>
          </select>
        </CsField>
        <CsField
          fieldId="4B.4"
          label="Kitchen Notification Emails Per Location"
          hint="One email per line, labeled by location"
        >
          <textarea
            id="cbf-4B.4"
            style={tStyle}
            value={state.s4b4}
            disabled={disabled}
            placeholder={
              "Location 1: kitchen1@yourbiz.com\nLocation 2: kitchen2@yourbiz.com\nLocation 3: kitchen3@yourbiz.com"
            }
            onChange={(e) => onChange("s4b4", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4B.5"
          label="Is branding consistent across all locations?"
        >
          <select
            id="cbf-4B.5"
            style={sStyle}
            value={state.s4b5}
            disabled={disabled}
            onChange={(e) => onChange("s4b5", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Yes — same branding everywhere">
              Yes — same branding everywhere
            </option>
            <option value="No — describe differences below">
              No — describe differences below
            </option>
          </select>
        </CsField>
      </div>

      {/* Group B: Advanced Features */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#FB923C",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Advanced Features
        </span>
        <CsField fieldId="4B.6" label="Reservations Needed?">
          <select
            id="cbf-4B.6"
            style={sStyle}
            value={state.s4b6}
            disabled={disabled}
            onChange={(e) => onChange("s4b6", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </CsField>
        <CsField fieldId="4B.7" label="Event Booking / Private Dining?">
          <select
            id="cbf-4B.7"
            style={sStyle}
            value={state.s4b7}
            disabled={disabled}
            onChange={(e) => onChange("s4b7", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </CsField>
        <CsField fieldId="4B.8" label="Catering Portal Needed?">
          <select
            id="cbf-4B.8"
            style={sStyle}
            value={state.s4b8}
            disabled={disabled}
            onChange={(e) => onChange("s4b8", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </CsField>
        <CsField fieldId="4B.9" label="Gift Cards?">
          <select
            id="cbf-4B.9"
            style={sStyle}
            value={state.s4b9}
            disabled={disabled}
            onChange={(e) => onChange("s4b9", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </CsField>
        <CsField
          fieldId="4B.10"
          label="Loyalty Program?"
          hint="If Yes, describe the program structure"
        >
          <textarea
            id="cbf-4B.10"
            style={tStyle}
            value={state.s4b10}
            disabled={disabled}
            placeholder={
              "Yes — Points-based: 1 point per $1 spent, redeem 100 points for $5 off\n— or —\nNo"
            }
            onChange={(e) => onChange("s4b10", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4B.11"
          label="Email Marketing Integration?"
          hint="If Yes, which platform?"
        >
          <textarea
            id="cbf-4B.11"
            style={tStyle}
            value={state.s4b11}
            disabled={disabled}
            placeholder={"Yes — Mailchimp\n— or —\nNo"}
            onChange={(e) => onChange("s4b11", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4B.12"
          label="Online Ordering Platform Currently Used"
          hint="If switching from an existing platform, name it"
        >
          <input
            id="cbf-4B.12"
            type="text"
            style={iStyle}
            value={state.s4b12}
            disabled={disabled}
            placeholder='e.g., Toast, Square, Clover, DoorDash — or "None"'
            onChange={(e) => onChange("s4b12", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4B.13"
          label="Catering Request Form Fields"
          hint="List the fields you need on your catering inquiry form"
        >
          <textarea
            id="cbf-4B.13"
            style={tStyle}
            value={state.s4b13}
            disabled={disabled}
            placeholder={
              "Event Date\nGuest Count\nVenue / Location\nEvent Type (Wedding, Corporate, Birthday, etc.)\nBudget Range\nDietary Restrictions"
            }
            onChange={(e) => onChange("s4b13", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4B.14"
          label="Online Ordering Integration"
          hint="Are you currently using any third-party online ordering platform? List them or write 'None'"
        >
          <input
            id="cbf-4B.14"
            type="text"
            style={iStyle}
            value={state.s4b14}
            disabled={disabled}
            placeholder='e.g., DoorDash, Uber Eats, Toast, Square — or "None"'
            onChange={(e) => onChange("s4b14", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4B.15"
          label="Staff Permission Levels"
          hint="How many staff need access? What permission levels do you need?"
        >
          <input
            id="cbf-4B.15"
            type="text"
            style={iStyle}
            value={state.s4b15}
            disabled={disabled}
            placeholder='e.g., "5 staff — Manager, Cashier, Kitchen" or describe your roles'
            onChange={(e) => onChange("s4b15", e.target.value)}
          />
        </CsField>
      </div>

      {/* Group C: ★ Additional Details */}
      <div
        style={{
          ...groupStyle,
          background: "rgba(251,191,36,0.03)",
          border: "1px solid rgba(251,191,36,0.12)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#FBBF24",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          ★ Additional Details
        </span>
        <CsField
          fieldId="4B.16"
          label="Reservation Details"
          star
          hint="Party size range / Time slot increments / Buffer between reservations"
        >
          <textarea
            id="cbf-4B.16"
            style={tStyle}
            value={state.s4b16}
            disabled={disabled}
            placeholder={
              "Party size: 1–10 guests\nTime slot increments: 30 minutes\nBuffer between reservations: 15 minutes"
            }
            onChange={(e) => onChange("s4b16", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4B.17"
          label="Waitlist Display Copy"
          star
          hint="Text shown to guests when the restaurant is fully booked"
        >
          <textarea
            id="cbf-4B.17"
            style={tStyle}
            value={state.s4b17}
            disabled={disabled}
            placeholder={
              "We're fully booked for this time, but we'd love to seat you when a table opens up. Join our waitlist and we'll text you as soon as a spot is available."
            }
            onChange={(e) => onChange("s4b17", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4B.18"
          label="Email for Daily Automated Sales Reports"
          star
        >
          <input
            id="cbf-4B.18"
            type="email"
            style={iStyle}
            value={state.s4b18}
            disabled={disabled}
            placeholder="reports@yourbusiness.com"
            onChange={(e) => onChange("s4b18", e.target.value)}
          />
        </CsField>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Part 2 — CsMembershipEngine (4C.1–4C.13) — MODULE SCOPE
// ---------------------------------------------------------------------------
interface CsMembershipEngineProps {
  state: CsMembershipEngineState;
  disabled: boolean;
  onChange: (field: keyof CsMembershipEngineState, value: string) => void;
}
function CsMembershipEngine({
  state,
  disabled,
  onChange,
}: CsMembershipEngineProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  const groupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    borderRadius: "8px",
    background: "rgba(167,139,250,0.03)",
    border: "1px solid rgba(167,139,250,0.12)",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <CsSectionHeader
        step="Step 4C"
        title="Membership Engine (4C.1–4C.13)"
        color="#A78BFA"
      />

      {/* Group A: Membership Structure */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#A78BFA",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Membership Structure
        </span>
        <CsField
          fieldId="4C.1"
          label="Membership Levels"
          required
          hint="Name / Price / Billing Cycle / What's Included — one per line"
        >
          <textarea
            id="cbf-4C.1"
            style={{ ...tStyle, minHeight: "140px" }}
            value={state.s4c1}
            disabled={disabled}
            placeholder={
              "Basic / $49/mo / Monthly / Access to all group classes + locker room\nPro / $89/mo / Monthly / Everything in Basic + 2 personal training sessions\nElite / $149/mo / Monthly / All access + unlimited PT + nutrition coaching\nAnnual Pro / $799/yr / Annual / Pro features at a discounted annual rate"
            }
            onChange={(e) => onChange("s4c1", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4C.2"
          label="Class Packs Available?"
          hint="If Yes, describe: Name / # of classes / price / expiry"
        >
          <textarea
            id="cbf-4C.2"
            style={tStyle}
            value={state.s4c2}
            disabled={disabled}
            placeholder={
              "Yes:\n5-Class Pack / 5 classes / $75 / Expires in 60 days\n10-Class Pack / 10 classes / $130 / Expires in 90 days\n— or —\nNo"
            }
            onChange={(e) => onChange("s4c2", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4C.3"
          label="Class Schedule"
          hint="Name / Day / Time / Room or Location — one class per line"
        >
          <textarea
            id="cbf-4C.3"
            style={{ ...tStyle, minHeight: "130px" }}
            value={state.s4c3}
            disabled={disabled}
            placeholder={
              "Yoga Flow / Mon & Wed / 7:00am / Studio A\nHIIT Bootcamp / Tue & Thu / 6:00pm / Main Floor\nSpin Class / Sat / 9:00am / Cycle Room\nPilates / Sun / 10:00am / Studio B"
            }
            onChange={(e) => onChange("s4c3", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4C.4"
          label="Portal Self-Service Options"
          hint="What can members do in the portal? Check all that apply"
        >
          <textarea
            id="cbf-4C.4"
            style={tStyle}
            value={state.s4c4}
            disabled={disabled}
            placeholder={
              "Cancel membership\nPause membership\nUpgrade / downgrade plan\nDownload invoices\nBook classes\nUpdate payment method"
            }
            onChange={(e) => onChange("s4c4", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4C.5"
          label="Waitlist Enabled?"
          hint="If Yes, describe the logic — auto-enroll, notification method, etc."
        >
          <textarea
            id="cbf-4C.5"
            style={tStyle}
            value={state.s4c5}
            disabled={disabled}
            placeholder={
              "Yes — Auto-enroll when a spot opens. Notify member via email and SMS 2 hours before class.\n— or —\nNo"
            }
            onChange={(e) => onChange("s4c5", e.target.value)}
          />
        </CsField>
      </div>

      {/* Group B: ★ Check-In & Operations */}
      <div
        style={{
          ...groupStyle,
          background: "rgba(251,191,36,0.03)",
          border: "1px solid rgba(251,191,36,0.12)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#FBBF24",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          ★ Check-In & Operations
        </span>
        <CsField fieldId="4C.6" label="Member Check-In Method" star required>
          <select
            id="cbf-4C.6"
            style={sStyle}
            value={state.s4c6}
            disabled={disabled}
            onChange={(e) => onChange("s4c6", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="QR Scan">
              QR Scan — member scans QR code at door
            </option>
            <option value="Manual Check-In">
              Manual Check-In — staff marks attendance
            </option>
            <option value="Geofence">
              Geofence — auto check-in when member enters location
            </option>
          </select>
        </CsField>
      </div>

      {/* Group C: Growth & Retention */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#A78BFA",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Growth & Retention
        </span>
        <CsField
          fieldId="4C.7"
          label="Referral Program Landing Page URL"
          hint="URL of existing page, or 'Build new page'"
        >
          <input
            id="cbf-4C.7"
            type="text"
            style={iStyle}
            value={state.s4c7}
            disabled={disabled}
            placeholder='https://yourbiz.com/refer — or "Build new page"'
            onChange={(e) => onChange("s4c7", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4C.8"
          label="Reminder Email — Days Before Class"
          hint="How many days before class should the reminder send?"
        >
          <input
            id="cbf-4C.8"
            type="number"
            min={1}
            style={iStyle}
            value={state.s4c8}
            disabled={disabled}
            placeholder="e.g., 1 (for 24-hour reminder) or 2"
            onChange={(e) => onChange("s4c8", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4C.9"
          label="Failed Payment Recovery Email"
          hint="Text sent when a member's payment fails"
        >
          <textarea
            id="cbf-4C.9"
            style={tStyle}
            value={state.s4c9}
            disabled={disabled}
            placeholder={
              "Hi [Name], your recent payment of $89 didn't go through. Please update your payment method in your member portal to avoid losing access. Need help? Reply to this email."
            }
            onChange={(e) => onChange("s4c9", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4C.10"
          label="Cancellation Confirmation Email"
          hint="Text sent when a member cancels their membership"
        >
          <textarea
            id="cbf-4C.10"
            style={tStyle}
            value={state.s4c10}
            disabled={disabled}
            placeholder={
              "Hi [Name], your membership has been cancelled. You'll retain access through the end of your current billing period. We hope to see you again!"
            }
            onChange={(e) => onChange("s4c10", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4C.11"
          label="PWA Upgrade — Progressive Web App ($299)"
        >
          <select
            id="cbf-4C.11"
            style={sStyle}
            value={state.s4c11}
            disabled={disabled}
            onChange={(e) => onChange("s4c11", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Yes – Add PWA Upgrade ($299)">
              Yes – Add PWA Upgrade ($299)
            </option>
            <option value="No">No</option>
          </select>
        </CsField>
      </div>

      {/* Group D: ★ Brand Voice */}
      <div
        style={{
          ...groupStyle,
          background: "rgba(251,191,36,0.03)",
          border: "1px solid rgba(251,191,36,0.12)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#FBBF24",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          ★ Brand Voice
        </span>
        <CsField
          fieldId="4C.12"
          label="Custom Welcome Message for Member Portal"
          star
          hint="Shown after the member logs in for the first time"
        >
          <textarea
            id="cbf-4C.12"
            style={tStyle}
            value={state.s4c12}
            disabled={disabled}
            placeholder={
              "Welcome to [Studio Name], [First Name]! We're so glad you're here. Your membership is now active — explore your schedule, book your first class, and let's get moving. 🏋️"
            }
            onChange={(e) => onChange("s4c12", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="4C.13"
          label="Referral Program Terms"
          star
          hint="Full terms text shown on the referral landing page"
        >
          <textarea
            id="cbf-4C.13"
            style={{ ...tStyle, minHeight: "110px" }}
            value={state.s4c13}
            disabled={disabled}
            placeholder={
              "Refer a friend and both of you get 1 free month. Referral must sign up for a minimum 3-month membership. Discount applied to the billing cycle following the referral's first payment. No cash value. One referral bonus per month."
            }
            onChange={(e) => onChange("s4c13", e.target.value)}
          />
        </CsField>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Part 2 — CsEnterprise (5.1–5.27) — MODULE SCOPE
// ---------------------------------------------------------------------------
interface CsEnterpriseProps {
  state: CsEnterpriseState;
  disabled: boolean;
  onChange: (field: keyof CsEnterpriseState, value: string) => void;
}
function CsEnterprise({ state, disabled, onChange }: CsEnterpriseProps) {
  const iStyle = inputStyle;
  const tStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: "88px",
    fontFamily: "inherit",
  };
  const sStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  const groupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    borderRadius: "8px",
    background: "rgba(234,179,8,0.03)",
    border: "1px solid rgba(234,179,8,0.12)",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <CsSectionHeader
        step="Step 5"
        title="Enterprise Scale (5.1–5.27)"
        color="#EAB308"
      />

      {/* Section A: Scope */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#EAB308",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Scope
        </span>
        <CsField
          fieldId="5.1"
          label="Number of Locations / Business Units"
          required
        >
          <input
            id="cbf-5.1"
            type="text"
            style={iStyle}
            value={state.s51}
            disabled={disabled}
            placeholder="e.g., 5 retail locations + 1 HQ + 2 warehouses"
            onChange={(e) => onChange("s51", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.2"
          label="Purpose of the Platform"
          required
          hint="Describe in 2–3 sentences what this system needs to accomplish"
        >
          <textarea
            id="cbf-5.2"
            style={tStyle}
            value={state.s52}
            disabled={disabled}
            placeholder={
              "A multi-tenant SaaS platform for managing franchise operations, including inventory, staff scheduling, customer CRM, and real-time sales reporting across all locations."
            }
            onChange={(e) => onChange("s52", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.3"
          label="Full Custom Requirements"
          required
          hint="Detailed description of everything you need built"
        >
          <textarea
            id="cbf-5.3"
            style={{ ...tStyle, minHeight: "200px" }}
            value={state.s53}
            disabled={disabled}
            placeholder={
              "Describe your complete requirements in as much detail as possible:\n\n- Custom CRM with deal pipeline, contact management, and automated follow-up sequences\n- Multi-location inventory management with low-stock alerts\n- Staff scheduling with role-based access (Manager, Staff, Read-only)\n- Real-time sales dashboard with daily/weekly/monthly breakdown\n- Client portal with order history, invoice downloads, and subscription management\n- Webhook integration with Shopify and QuickBooks"
            }
            onChange={(e) => onChange("s53", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.4"
          label="Timeline / Hard Deadlines"
          hint="Any specific launch dates, events, or fiscal deadlines to build around"
        >
          <input
            id="cbf-5.4"
            type="text"
            style={iStyle}
            value={state.s54}
            disabled={disabled}
            placeholder="e.g., Must launch before Q3 2026 / No hard deadline / Annual conference Oct 15"
            onChange={(e) => onChange("s54", e.target.value)}
          />
        </CsField>
      </div>

      {/* Section B: CRM */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#EAB308",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          CRM
        </span>
        <CsField
          fieldId="5.5"
          label="CRM Pipeline Stages"
          hint="List your deal/project stages in order"
        >
          <textarea
            id="cbf-5.5"
            style={tStyle}
            value={state.s55}
            disabled={disabled}
            placeholder={
              "New Lead\nQualified\nProposal Sent\nNegotiation\nWon\nLost\nOnboarding\nActive Client"
            }
            onChange={(e) => onChange("s55", e.target.value)}
          />
        </CsField>
        <CsField fieldId="5.6" label="Number of Staff Admin Accounts">
          <input
            id="cbf-5.6"
            type="number"
            min={1}
            style={iStyle}
            value={state.s56}
            disabled={disabled}
            placeholder="Total number of team members who need system access"
            onChange={(e) => onChange("s56", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.7"
          label="Permission Levels"
          hint="Describe what each role can see and do"
        >
          <textarea
            id="cbf-5.7"
            style={{ ...tStyle, minHeight: "130px" }}
            value={state.s57}
            disabled={disabled}
            placeholder={
              "Super Admin — full access to all data, settings, and billing\nManager — access to their location's data, can manage staff schedules\nStaff — can view assigned tasks and update order status only\nRead-Only — view-only access for reporting"
            }
            onChange={(e) => onChange("s57", e.target.value)}
          />
        </CsField>
      </div>

      {/* Section C: Portals */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#EAB308",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Portals
        </span>
        <CsField
          fieldId="5.8"
          label="Wholesale Pricing Tiers"
          hint="Tier name / minimum order / discount % — one tier per line"
        >
          <textarea
            id="cbf-5.8"
            style={tStyle}
            value={state.s58}
            disabled={disabled}
            placeholder={
              "Reseller / $500 min / 15% off retail\nDistributor / $2,000 min / 25% off retail\nPartner / $5,000 min / 35% off retail"
            }
            onChange={(e) => onChange("s58", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.9"
          label="IDX / MLS Provider Name"
          hint="If real estate features are needed"
        >
          <input
            id="cbf-5.9"
            type="text"
            style={iStyle}
            value={state.s59}
            disabled={disabled}
            placeholder='e.g., IDX Broker, iHomefinder, Spark API — or "N/A"'
            onChange={(e) => onChange("s59", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.10"
          label="Search Filters Needed"
          hint="List all search/filter types for product, property, or content searches"
        >
          <textarea
            id="cbf-5.10"
            style={tStyle}
            value={state.s510}
            disabled={disabled}
            placeholder={
              "Price range\nLocation / ZIP code\nProperty type (Single family, Condo, Commercial)\nBedrooms / Bathrooms\nSquare footage\nYear built\nSchool district"
            }
            onChange={(e) => onChange("s510", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.11"
          label="Agent / Staff Profile Fields"
          hint="Fields shown on agent/team profile pages"
        >
          <textarea
            id="cbf-5.11"
            style={tStyle}
            value={state.s511}
            disabled={disabled}
            placeholder={
              "Headshot photo\nFull name & title\nPhone & email\nYears of experience\nSpecialties\nLanguages spoken\nCurrent listings\nClient testimonials\nLicense number"
            }
            onChange={(e) => onChange("s511", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.12"
          label="Portal Types Needed"
          hint="Check all that apply"
        >
          <textarea
            id="cbf-5.12"
            style={tStyle}
            value={state.s512}
            disabled={disabled}
            placeholder={
              "Client Portal\nVendor / Supplier Portal\nAgent / Partner Portal\nEmployee / Staff Portal\nFranchisee Portal"
            }
            onChange={(e) => onChange("s512", e.target.value)}
          />
        </CsField>
      </div>

      {/* Section D: Tech & Integrations */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#EAB308",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Tech & Integrations
        </span>
        <CsField
          fieldId="5.13"
          label="API Integrations Required"
          hint="List each with name and purpose"
        >
          <textarea
            id="cbf-5.13"
            style={tStyle}
            value={state.s513}
            disabled={disabled}
            placeholder={
              "Stripe — payment processing\nQuickBooks — accounting sync\nShopify — product catalog sync\nTwilio — SMS notifications\nGoogle Calendar — appointment scheduling"
            }
            onChange={(e) => onChange("s513", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.14"
          label="Existing Software to Connect"
          hint="CRM, ERP, POS, accounting software, etc."
        >
          <input
            id="cbf-5.14"
            type="text"
            style={iStyle}
            value={state.s514}
            disabled={disabled}
            placeholder='e.g., Salesforce CRM, SAP ERP, Square POS, Xero — or "None"'
            onChange={(e) => onChange("s514", e.target.value)}
          />
        </CsField>
        <CsField fieldId="5.15" label="Custom Metrics / KPIs to Track">
          <textarea
            id="cbf-5.15"
            style={{ ...tStyle, minHeight: "110px" }}
            value={state.s515}
            disabled={disabled}
            placeholder={
              "Monthly Recurring Revenue (MRR)\nCustomer Acquisition Cost (CAC)\nChurn rate by location\nAverage order value\nLead-to-close conversion rate\nStaff productivity per shift"
            }
            onChange={(e) => onChange("s515", e.target.value)}
          />
        </CsField>
        <CsField fieldId="5.16" label="Email Platform">
          <select
            id="cbf-5.16"
            style={sStyle}
            value={state.s516}
            disabled={disabled}
            onChange={(e) => onChange("s516", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Mailchimp">Mailchimp</option>
            <option value="Klaviyo">Klaviyo</option>
            <option value="HubSpot">HubSpot</option>
            <option value="ActiveCampaign">ActiveCampaign</option>
            <option value="Brevo (Sendinblue)">Brevo (Sendinblue)</option>
            <option value="Other">Other — specify in sequences field</option>
          </select>
        </CsField>
        <CsField
          fieldId="5.17"
          label="Email Sequences Needed"
          hint="List automation flows required"
        >
          <textarea
            id="cbf-5.17"
            style={tStyle}
            value={state.s517}
            disabled={disabled}
            placeholder={
              "Welcome series (3 emails over 7 days)\nAbandon cart recovery (2 follow-ups)\nOnboarding drip for new clients (5 emails over 14 days)\nWin-back campaign for inactive clients (30-day trigger)\nMonthly newsletter"
            }
            onChange={(e) => onChange("s517", e.target.value)}
          />
        </CsField>
      </div>

      {/* Section E: Project Management */}
      <div style={groupStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#EAB308",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Project Management
        </span>
        <CsField
          fieldId="5.18"
          label="Preferred Status Call Times"
          hint="Days and times that work best for weekly check-ins"
        >
          <input
            id="cbf-5.18"
            type="text"
            style={iStyle}
            value={state.s518}
            disabled={disabled}
            placeholder="e.g., Tuesdays 10am–12pm CST or Thursdays 2–4pm CST"
            onChange={(e) => onChange("s518", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.19"
          label="Primary Decision Maker"
          required
          hint="Name / Title / Email / Phone"
        >
          <textarea
            id="cbf-5.19"
            style={tStyle}
            value={state.s519}
            disabled={disabled}
            placeholder={
              "Name: Sarah Johnson\nTitle: VP of Digital Operations\nEmail: sarah@company.com\nPhone: (512) 555-0100"
            }
            onChange={(e) => onChange("s519", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.20"
          label="Secondary Contact"
          hint="Name / Title / Email / Phone"
        >
          <textarea
            id="cbf-5.20"
            style={tStyle}
            value={state.s520}
            disabled={disabled}
            placeholder={
              "Name: Marcus Lee\nTitle: IT Director\nEmail: marcus@company.com\nPhone: (512) 555-0101"
            }
            onChange={(e) => onChange("s520", e.target.value)}
          />
        </CsField>
      </div>

      {/* Section F: ★ Enterprise Essentials */}
      <div
        style={{
          ...groupStyle,
          background: "rgba(251,191,36,0.03)",
          border: "1px solid rgba(251,191,36,0.18)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#FBBF24",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          ★ Enterprise Essentials
        </span>
        <CsField
          fieldId="5.21"
          label="Legal Entity Name"
          star
          required
          hint="Registered business name as it appears on legal documents"
        >
          <input
            id="cbf-5.21"
            type="text"
            style={iStyle}
            value={state.s521}
            disabled={disabled}
            placeholder="e.g., Acme Holdings LLC / Johnson Enterprises Inc."
            onChange={(e) => onChange("s521", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.22"
          label="Billing Contact Name & Email"
          star
          required
        >
          <input
            id="cbf-5.22"
            type="text"
            style={iStyle}
            value={state.s522}
            disabled={disabled}
            placeholder="John Smith — billing@company.com"
            onChange={(e) => onChange("s522", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.23"
          label="Tech Stack Requirements or Preferences"
          star
          hint="Languages, frameworks, databases, cloud providers"
        >
          <textarea
            id="cbf-5.23"
            style={tStyle}
            value={state.s523}
            disabled={disabled}
            placeholder={
              "Must use: React frontend, Node.js API\nDatabase: PostgreSQL preferred\nHosting: AWS (we have existing infrastructure)\nNo preference on other tooling"
            }
            onChange={(e) => onChange("s523", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.24"
          label="Targeted SEO Page Count"
          star
          hint="How many pages should be fully SEO-optimized"
        >
          <input
            id="cbf-5.24"
            type="number"
            min={1}
            style={iStyle}
            value={state.s524}
            disabled={disabled}
            placeholder="e.g., 25 pages"
            onChange={(e) => onChange("s524", e.target.value)}
          />
        </CsField>
        <CsField
          fieldId="5.25"
          label="Custom API Webhook URL"
          star
          hint="URL where event data should be sent (new orders, new leads, etc.)"
        >
          <input
            id="cbf-5.25"
            type="url"
            style={iStyle}
            value={state.s525}
            disabled={disabled}
            placeholder="https://yourapp.com/webhooks/imperidome-events"
            onChange={(e) => onChange("s525", e.target.value)}
          />
        </CsField>
        <CsField fieldId="5.26" label="Server Location Preference" star>
          <select
            id="cbf-5.26"
            style={sStyle}
            value={state.s526}
            disabled={disabled}
            onChange={(e) => onChange("s526", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="United States">United States</option>
            <option value="European Union">
              European Union (GDPR-compliant)
            </option>
            <option value="Asia-Pacific">Asia-Pacific</option>
            <option value="No Preference">No Preference</option>
          </select>
        </CsField>
        <CsField
          fieldId="5.27"
          label="Employee Portal Needed?"
          star
          hint="A separate login portal for internal staff/employees"
        >
          <select
            id="cbf-5.27"
            style={sStyle}
            value={state.s527}
            disabled={disabled}
            onChange={(e) => onChange("s527", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </CsField>
      </div>
    </div>
  );
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "88px",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#B0B3C6",
};

const requiredDot: React.CSSProperties = {
  color: "#F97316",
  marginLeft: "3px",
};

const SPIN_CSS = "@keyframes spin { to { transform: rotate(360deg); } }";
function SpinKeyframes() {
  return <style>{SPIN_CSS}</style>;
}

// ---------------------------------------------------------------------------
// Speedy form — section header helper (module scope)
// ---------------------------------------------------------------------------
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}
function SpeedySectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: subtitle ? "6px" : "16px",
        marginTop: "8px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: "#5EF08A",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      <div
        style={{
          flex: 1,
          height: "1px",
          background: "rgba(94,240,138,0.15)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speedy form — field wrapper (module scope)
// ---------------------------------------------------------------------------
interface FieldProps {
  fieldId: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}
function SpeedyField({ fieldId, label, required, children }: FieldProps) {
  return (
    <div
      data-ocid={`speedy-brief.field.${fieldId}`}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <label htmlFor={`sbf-${fieldId}`} style={labelStyle}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#5EF08A",
            marginRight: "6px",
            letterSpacing: "0.04em",
          }}
        >
          {fieldId}
        </span>
        {label}
        {required && (
          <span style={requiredDot} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speedy Global Fields sub-component (module scope)
// ---------------------------------------------------------------------------
interface GlobalFieldsState {
  PQ1: boolean;
  PQ2: string;
  PQ3: string;
  PQ4: string;
  PQ5: string;
  PQ6: string;
  PQ7: boolean;
  PQ_VOICE: string;
  SS1: string;
  SS2: string;
  SS3: string;
  SS4: string;
  SS5: string;
  SS6: string;
  SS7: string;
  SS8: string;
  SS9: string;
  SS10: string;
  SS11: string;
  SS12: string;
  SS13: string;
  SS14: string;
  SS15: string;
  SS16: string;
  SS17: string;
  SS18: string;
  SS19: string;
  SS20: string;
  SS21: string;
  SS22: string;
}

interface GlobalFieldsProps {
  values: GlobalFieldsState;
  tierName: string;
  tierPrice: string;
  disabled: boolean;
  onChange: (field: keyof GlobalFieldsState, value: string | boolean) => void;
}

function GlobalFields({
  values,
  tierName,
  tierPrice,
  disabled,
  onChange,
}: GlobalFieldsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* ── Pre-Qualification ── */}
      <SpeedySectionHeader title="Pre-Qualification" />

      {/* PQ1 */}
      <SpeedyField
        fieldId="PQ1"
        label={`Confirm: ${tierName} (${tierPrice} build)`}
        required
      >
        <label
          htmlFor="sbf-PQ1"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <input
            id="sbf-PQ1"
            type="checkbox"
            checked={values.PQ1}
            disabled={disabled}
            onChange={(e) => onChange("PQ1", e.target.checked)}
            style={{
              marginTop: "2px",
              accentColor: "#5EF08A",
              cursor: "inherit",
            }}
          />
          <span
            style={{ fontSize: "13px", color: "#B0B3C6", lineHeight: "1.5" }}
          >
            I confirm I am purchasing the{" "}
            <strong style={{ color: "#EEF0F8" }}>{tierName}</strong> (
            {tierPrice} build) and understand the scope of this package.
          </span>
        </label>
      </SpeedyField>

      {/* PQ2 */}
      <SpeedyField fieldId="PQ2" label="Full Name" required>
        <input
          id="sbf-PQ2"
          type="text"
          style={inputStyle}
          value={values.PQ2}
          disabled={disabled}
          placeholder="Your full name"
          onChange={(e) => onChange("PQ2", e.target.value)}
        />
      </SpeedyField>

      {/* PQ3 */}
      <SpeedyField fieldId="PQ3" label="Email" required>
        <input
          id="sbf-PQ3"
          type="email"
          style={inputStyle}
          value={values.PQ3}
          disabled={disabled}
          placeholder="your@email.com"
          onChange={(e) => onChange("PQ3", e.target.value)}
        />
      </SpeedyField>

      {/* PQ4 */}
      <SpeedyField fieldId="PQ4" label="Phone" required>
        <input
          id="sbf-PQ4"
          type="tel"
          style={inputStyle}
          value={values.PQ4}
          disabled={disabled}
          placeholder="+1 (555) 000-0000"
          onChange={(e) => onChange("PQ4", e.target.value)}
        />
      </SpeedyField>

      {/* PQ5 */}
      <SpeedyField fieldId="PQ5" label="Preferred launch date" required>
        <input
          id="sbf-PQ5"
          type="date"
          style={inputStyle}
          value={values.PQ5}
          disabled={disabled}
          onChange={(e) => onChange("PQ5", e.target.value)}
        />
      </SpeedyField>

      {/* PQ6 */}
      <SpeedyField fieldId="PQ6" label="Content provision" required>
        <select
          id="sbf-PQ6"
          style={selectStyle}
          value={values.PQ6}
          disabled={disabled}
          onChange={(e) => onChange("PQ6", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="I will provide">I will provide</option>
          <option value="Need it written">Need it written</option>
          <option value="Mix">Mix</option>
        </select>
      </SpeedyField>

      {/* PQ7 */}
      <SpeedyField
        fieldId="PQ7"
        label="Revision acknowledgment (1 round)"
        required
      >
        <label
          htmlFor="sbf-PQ7"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <input
            id="sbf-PQ7"
            type="checkbox"
            checked={values.PQ7}
            disabled={disabled}
            onChange={(e) => onChange("PQ7", e.target.checked)}
            style={{
              marginTop: "2px",
              accentColor: "#5EF08A",
              cursor: "inherit",
            }}
          />
          <span
            style={{ fontSize: "13px", color: "#B0B3C6", lineHeight: "1.5" }}
          >
            I understand this package includes{" "}
            <strong style={{ color: "#EEF0F8" }}>1 round of revisions</strong>{" "}
            after the initial build.
          </span>
        </label>
      </SpeedyField>

      {/* PQ_VOICE */}
      <SpeedyField fieldId="PQ_VOICE" label="Brand Voice" required>
        <select
          id="sbf-PQ_VOICE"
          style={selectStyle}
          value={values.PQ_VOICE}
          disabled={disabled}
          onChange={(e) => onChange("PQ_VOICE", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Professional">Professional</option>
          <option value="Friendly">Friendly</option>
          <option value="Bold">Bold</option>
          <option value="Luxury">Luxury</option>
        </select>
      </SpeedyField>

      {/* ── Identity ── */}
      <SpeedySectionHeader title="Identity" />

      <SpeedyField fieldId="SS1" label="Business name" required>
        <input
          id="sbf-SS1"
          type="text"
          style={inputStyle}
          value={values.SS1}
          disabled={disabled}
          placeholder="Your official business name"
          onChange={(e) => onChange("SS1", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS2" label="Business type" required>
        <input
          id="sbf-SS2"
          type="text"
          style={inputStyle}
          value={values.SS2}
          disabled={disabled}
          placeholder="e.g., Salon, Restaurant, Boutique, Freelancer"
          onChange={(e) => onChange("SS2", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SS3"
        label="What does your business do? (1-2 sentences)"
        required
      >
        <textarea
          id="sbf-SS3"
          style={textareaStyle}
          value={values.SS3}
          disabled={disabled}
          placeholder="Brief description of your business and what you offer"
          onChange={(e) => onChange("SS3", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS4" label="City/State/Region served" required>
        <input
          id="sbf-SS4"
          type="text"
          style={inputStyle}
          value={values.SS4}
          disabled={disabled}
          placeholder="e.g., Austin, TX or Nationwide"
          onChange={(e) => onChange("SS4", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SS5"
        label="Primary service/product to feature"
        required
      >
        <input
          id="sbf-SS5"
          type="text"
          style={inputStyle}
          value={values.SS5}
          disabled={disabled}
          placeholder="Your most important offering to highlight"
          onChange={(e) => onChange("SS5", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS6" label="Domain name">
        <input
          id="sbf-SS6"
          type="text"
          style={inputStyle}
          value={values.SS6}
          disabled={disabled}
          placeholder="e.g., mybusiness.com or 'I need one'"
          onChange={(e) => onChange("SS6", e.target.value)}
        />
      </SpeedyField>

      {/* ── Content ── */}
      <SpeedySectionHeader title="Content" />

      <SpeedyField fieldId="SS7" label="Hero headline" required>
        <input
          id="sbf-SS7"
          type="text"
          style={inputStyle}
          value={values.SS7}
          disabled={disabled}
          placeholder="e.g., 'The Best BBQ in Austin'"
          onChange={(e) => onChange("SS7", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SS8"
        label="Primary CTA button text/action"
        required
      >
        <input
          id="sbf-SS8"
          type="text"
          style={inputStyle}
          value={values.SS8}
          disabled={disabled}
          placeholder="e.g., 'Book Now', 'Order Online', 'Get a Quote'"
          onChange={(e) => onChange("SS8", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SS9"
        label="Tagline/Trust badge (e.g. Licensed/Insured)"
      >
        <input
          id="sbf-SS9"
          type="text"
          style={inputStyle}
          value={values.SS9}
          disabled={disabled}
          placeholder="e.g., 'Licensed & Insured · 5-Star Rated'"
          onChange={(e) => onChange("SS9", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS10" label="About Us (2-3 sentences)" required>
        <textarea
          id="sbf-SS10"
          style={textareaStyle}
          value={values.SS10}
          disabled={disabled}
          placeholder="A short paragraph about your business story and mission"
          onChange={(e) => onChange("SS10", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SS11"
        label="Up to 3 services (Name + 1 sentence description each)"
        required
      >
        <textarea
          id="sbf-SS11"
          style={{ ...textareaStyle, minHeight: "110px" }}
          value={values.SS11}
          disabled={disabled}
          placeholder={
            "1. Haircut — Precision cuts tailored to your face shape.\n2. Color — Full color or highlights using premium products.\n3. Blowout — Smooth, styled finish that lasts days."
          }
          onChange={(e) => onChange("SS11", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS12" label="Testimonials (1-3 quotes + names)">
        <textarea
          id="sbf-SS12"
          style={{ ...textareaStyle, minHeight: "110px" }}
          value={values.SS12}
          disabled={disabled}
          placeholder={
            '"Amazing service!" — Jane D.\n"Best in town, hands down." — Mike R.'
          }
          onChange={(e) => onChange("SS12", e.target.value)}
        />
      </SpeedyField>

      {/* ── Brand & SEO ── */}
      <SpeedySectionHeader title="Brand & SEO" />

      <SpeedyField fieldId="SS13" label="Phone" required>
        <input
          id="sbf-SS13"
          type="tel"
          style={inputStyle}
          value={values.SS13}
          disabled={disabled}
          placeholder="+1 (555) 000-0000"
          onChange={(e) => onChange("SS13", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS14" label="Email for submissions" required>
        <input
          id="sbf-SS14"
          type="email"
          style={inputStyle}
          value={values.SS14}
          disabled={disabled}
          placeholder="Where you want contact form submissions sent"
          onChange={(e) => onChange("SS14", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SS15"
        label="Physical address (or 'Fully Online')"
        required
      >
        <input
          id="sbf-SS15"
          type="text"
          style={inputStyle}
          value={values.SS15}
          disabled={disabled}
          placeholder="123 Main St, Austin TX 78701 — or 'Fully Online'"
          onChange={(e) => onChange("SS15", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS16" label="Business hours" required>
        <input
          id="sbf-SS16"
          type="text"
          style={inputStyle}
          value={values.SS16}
          disabled={disabled}
          placeholder="e.g., Mon–Fri 9am–6pm, Sat 10am–4pm, Closed Sun"
          onChange={(e) => onChange("SS16", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS17" label="Brand colors (hex)">
        <input
          id="sbf-SS17"
          type="text"
          style={inputStyle}
          value={values.SS17}
          disabled={disabled}
          placeholder="e.g., #1A1A2E, #FF6B35"
          onChange={(e) => onChange("SS17", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS18" label="Logo (URL)">
        <input
          id="sbf-SS18"
          type="url"
          style={inputStyle}
          value={values.SS18}
          disabled={disabled}
          placeholder="https://drive.google.com/file/... or Dropbox link"
          onChange={(e) => onChange("SS18", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS19" label="Google Business Profile URL">
        <input
          id="sbf-SS19"
          type="url"
          style={inputStyle}
          value={values.SS19}
          disabled={disabled}
          placeholder="https://g.page/yourbusiness"
          onChange={(e) => onChange("SS19", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS20" label="Social links">
        <textarea
          id="sbf-SS20"
          style={textareaStyle}
          value={values.SS20}
          disabled={disabled}
          placeholder={
            "Instagram: https://instagram.com/yourbiz\nFacebook: https://facebook.com/yourbiz"
          }
          onChange={(e) => onChange("SS20", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SS21" label="Primary keywords (3-5)" required>
        <input
          id="sbf-SS21"
          type="text"
          style={inputStyle}
          value={values.SS21}
          disabled={disabled}
          placeholder="e.g., Austin hair salon, balayage specialist, hair color Austin"
          onChange={(e) => onChange("SS21", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SS22"
        label="Browser tab title (60 chars max)"
        required
      >
        <input
          id="sbf-SS22"
          type="text"
          style={inputStyle}
          value={values.SS22}
          disabled={disabled}
          maxLength={60}
          placeholder="e.g., Glam Studio | Austin's Top Hair Salon"
          onChange={(e) => onChange("SS22", e.target.value)}
        />
        <span style={{ fontSize: "11px", color: "#7A7D90", marginTop: "4px" }}>
          {values.SS22.length}/60 characters
        </span>
      </SpeedyField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speedy Booking Sub-Tier (module scope)
// ---------------------------------------------------------------------------
interface BookingState {
  SSB1: string;
  SSB2: string;
  SSB3: string;
  SSB4: string;
  SSB5: string;
  SSB6: string;
  SSB7: string;
  SSB8: string;
  SSB9: string;
  SSB10: string;
  SSB11: string;
}

interface BookingSubTierProps {
  values: BookingState;
  disabled: boolean;
  onChange: (field: keyof BookingState, value: string) => void;
}

function BookingSubTier({ values, disabled, onChange }: BookingSubTierProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <SpeedySectionHeader
        title="Booking Details"
        subtitle="Speedy Booking sub-tier"
      />

      <SpeedyField
        fieldId="SSB1"
        label="List bookable services (Name-Duration-Price-Image URL)"
        required
      >
        <textarea
          id="sbf-SSB1"
          style={{ ...textareaStyle, minHeight: "110px" }}
          value={values.SSB1}
          disabled={disabled}
          placeholder={
            "Consultation - 30min - $50 - https://img.url\nFull Service - 90min - $150 - https://img.url"
          }
          onChange={(e) => onChange("SSB1", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSB2" label="Number of staff (max 1)">
        <input
          id="sbf-SSB2"
          type="number"
          min={0}
          max={1}
          style={inputStyle}
          value={values.SSB2}
          disabled={disabled}
          placeholder="1"
          onChange={(e) => onChange("SSB2", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSB3" label="Payment capture" required>
        <select
          id="sbf-SSB3"
          style={selectStyle}
          value={values.SSB3}
          disabled={disabled}
          onChange={(e) => onChange("SSB3", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="None">None</option>
          <option value="Deposit">Deposit</option>
          <option value="Full">Full</option>
        </select>
      </SpeedyField>

      <SpeedyField fieldId="SSB4" label="Deposit amount">
        <input
          id="sbf-SSB4"
          type="text"
          style={inputStyle}
          value={values.SSB4}
          disabled={disabled}
          placeholder="e.g., $25 or 20%"
          onChange={(e) => onChange("SSB4", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSB5" label="Cancellation policy">
        <textarea
          id="sbf-SSB5"
          style={textareaStyle}
          value={values.SSB5}
          disabled={disabled}
          placeholder="e.g., Cancellations within 24 hours forfeit the deposit"
          onChange={(e) => onChange("SSB5", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSB6" label="Hours before cancel">
        <input
          id="sbf-SSB6"
          type="number"
          min={0}
          style={inputStyle}
          value={values.SSB6}
          disabled={disabled}
          placeholder="e.g., 24"
          onChange={(e) => onChange("SSB6", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSB7" label="Online reschedule/cancel?">
        <select
          id="sbf-SSB7"
          style={selectStyle}
          value={values.SSB7}
          disabled={disabled}
          onChange={(e) => onChange("SSB7", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </SpeedyField>

      <SpeedyField fieldId="SSB8" label="Booking confirmation email" required>
        <input
          id="sbf-SSB8"
          type="email"
          style={inputStyle}
          value={values.SSB8}
          disabled={disabled}
          placeholder="confirmations@yourbusiness.com"
          onChange={(e) => onChange("SSB8", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSB9" label="24-hour reminder email">
        <input
          id="sbf-SSB9"
          type="email"
          style={inputStyle}
          value={values.SSB9}
          disabled={disabled}
          placeholder="reminders@yourbusiness.com"
          onChange={(e) => onChange("SSB9", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSB10" label="Booking page headline">
        <input
          id="sbf-SSB10"
          type="text"
          style={inputStyle}
          value={values.SSB10}
          disabled={disabled}
          placeholder="e.g., 'Book Your Appointment'"
          onChange={(e) => onChange("SSB10", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSB11" label="Booking page sub-description">
        <textarea
          id="sbf-SSB11"
          style={textareaStyle}
          value={values.SSB11}
          disabled={disabled}
          placeholder="A short intro paragraph for your booking page"
          onChange={(e) => onChange("SSB11", e.target.value)}
        />
      </SpeedyField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speedy Product Storefront Sub-Tier (module scope)
// ---------------------------------------------------------------------------
interface ProductState {
  SSP1: string;
  SSP2: string;
  SSP3: string;
  SSP4: string;
  SSP5: string;
  SSP6: string;
  SSP7: string;
  SSP8: string;
}

interface ProductSubTierProps {
  values: ProductState;
  disabled: boolean;
  onChange: (field: keyof ProductState, value: string) => void;
}

function ProductSubTier({ values, disabled, onChange }: ProductSubTierProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <SpeedySectionHeader
        title="Product Store Details"
        subtitle="Speedy Product Storefront sub-tier"
      />

      <SpeedyField
        fieldId="SSP1"
        label="Up to 10 products (Name-Price-Image URL-Short Description)"
        required
      >
        <textarea
          id="sbf-SSP1"
          style={{ ...textareaStyle, minHeight: "140px" }}
          value={values.SSP1}
          disabled={disabled}
          placeholder={
            "Classic Tee - $35 - https://img.url - Soft 100% cotton crew neck\nSignature Cap - $28 - https://img.url - Embroidered logo cap"
          }
          onChange={(e) => onChange("SSP1", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSP2" label="Shipping logic" required>
        <select
          id="sbf-SSP2"
          style={selectStyle}
          value={values.SSP2}
          disabled={disabled}
          onChange={(e) => onChange("SSP2", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Flat">Flat</option>
          <option value="Weight">Weight</option>
          <option value="Pickup">Pickup</option>
        </select>
      </SpeedyField>

      <SpeedyField fieldId="SSP3" label="Flat rate amount">
        <input
          id="sbf-SSP3"
          type="text"
          style={inputStyle}
          value={values.SSP3}
          disabled={disabled}
          placeholder="e.g., $5.99"
          onChange={(e) => onChange("SSP3", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSP4" label="Return/refund policy">
        <textarea
          id="sbf-SSP4"
          style={textareaStyle}
          value={values.SSP4}
          disabled={disabled}
          placeholder="e.g., Returns accepted within 30 days of delivery with original receipt"
          onChange={(e) => onChange("SSP4", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSP5" label="Order confirmation email" required>
        <input
          id="sbf-SSP5"
          type="email"
          style={inputStyle}
          value={values.SSP5}
          disabled={disabled}
          placeholder="orders@yourbusiness.com"
          onChange={(e) => onChange("SSP5", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSP6" label="Store page headline">
        <input
          id="sbf-SSP6"
          type="text"
          style={inputStyle}
          value={values.SSP6}
          disabled={disabled}
          placeholder="e.g., 'Shop Our Collection'"
          onChange={(e) => onChange("SSP6", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSP7" label="Store page sub-description">
        <textarea
          id="sbf-SSP7"
          style={textareaStyle}
          value={values.SSP7}
          disabled={disabled}
          placeholder="Intro paragraph for your store page"
          onChange={(e) => onChange("SSP7", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SSP8"
        label="List product variants (Size, Color, etc.)"
      >
        <textarea
          id="sbf-SSP8"
          style={textareaStyle}
          value={values.SSP8}
          disabled={disabled}
          placeholder={"Sizes: XS, S, M, L, XL\nColors: Black, White, Navy"}
          onChange={(e) => onChange("SSP8", e.target.value)}
        />
      </SpeedyField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speedy Menu Storefront Sub-Tier (module scope)
// ---------------------------------------------------------------------------
interface MenuState {
  SSM1: string;
  SSM2: string;
  SSM3: string;
  SSM4: string;
  SSM5: string;
  SSM6: string;
  SSM7: string;
  SSM8: string;
  SSM9: string;
}

interface MenuSubTierProps {
  values: MenuState;
  disabled: boolean;
  onChange: (field: keyof MenuState, value: string) => void;
}

function MenuSubTier({ values, disabled, onChange }: MenuSubTierProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <SpeedySectionHeader
        title="Menu Store Details"
        subtitle="Speedy Menu Storefront sub-tier"
      />

      <SpeedyField
        fieldId="SSM1"
        label="Up to 10 menu items (Category-Name-Price-Description-Image URL)"
        required
      >
        <textarea
          id="sbf-SSM1"
          style={{ ...textareaStyle, minHeight: "140px" }}
          value={values.SSM1}
          disabled={disabled}
          placeholder={
            "Starters - Loaded Fries - $9 - Crispy fries with cheese and bacon - https://img.url\nMains - Smash Burger - $14 - Double smash patty with special sauce - https://img.url"
          }
          onChange={(e) => onChange("SSM1", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSM2" label="Order types" required>
        <select
          id="sbf-SSM2"
          style={selectStyle}
          value={values.SSM2}
          disabled={disabled}
          onChange={(e) => onChange("SSM2", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="Pickup">Pickup</option>
          <option value="Delivery">Delivery</option>
          <option value="Both">Both</option>
        </select>
      </SpeedyField>

      <SpeedyField fieldId="SSM3" label="Prep/wait time">
        <input
          id="sbf-SSM3"
          type="text"
          style={inputStyle}
          value={values.SSM3}
          disabled={disabled}
          placeholder="e.g., 15-20 minutes for pickup"
          onChange={(e) => onChange("SSM3", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSM4" label="Kitchen notification email" required>
        <input
          id="sbf-SSM4"
          type="email"
          style={inputStyle}
          value={values.SSM4}
          disabled={disabled}
          placeholder="kitchen@yourbusiness.com"
          onChange={(e) => onChange("SSM4", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSM5" label="Order confirmation email" required>
        <input
          id="sbf-SSM5"
          type="email"
          style={inputStyle}
          value={values.SSM5}
          disabled={disabled}
          placeholder="orders@yourbusiness.com"
          onChange={(e) => onChange("SSM5", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSM6" label="Delivery radius/zone">
        <input
          id="sbf-SSM6"
          type="text"
          style={inputStyle}
          value={values.SSM6}
          disabled={disabled}
          placeholder="e.g., 5-mile radius or zip codes 78701, 78702"
          onChange={(e) => onChange("SSM6", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSM7" label="Minimum order amount">
        <input
          id="sbf-SSM7"
          type="text"
          style={inputStyle}
          value={values.SSM7}
          disabled={disabled}
          placeholder="e.g., $15 minimum for delivery"
          onChange={(e) => onChange("SSM7", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSM8" label="Menu page headline">
        <input
          id="sbf-SSM8"
          type="text"
          style={inputStyle}
          value={values.SSM8}
          disabled={disabled}
          placeholder="e.g., 'Order Fresh · Delivered Fast'"
          onChange={(e) => onChange("SSM8", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SSM9"
        label="Daily ordering hours (If different from business hours)"
      >
        <input
          id="sbf-SSM9"
          type="text"
          style={inputStyle}
          value={values.SSM9}
          disabled={disabled}
          placeholder="e.g., Orders accepted 11am–9pm daily"
          onChange={(e) => onChange("SSM9", e.target.value)}
        />
      </SpeedyField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speedy Recurring Storefront Sub-Tier (module scope)
// ---------------------------------------------------------------------------
interface RecurringState {
  SSR1: string;
  SSR2: string;
  SSR3: string;
  SSR4: string;
  SSR5: string;
  SSR6: string;
  SSR7: string;
  SSR8: string;
}

interface RecurringSubTierProps {
  values: RecurringState;
  disabled: boolean;
  onChange: (field: keyof RecurringState, value: string) => void;
}

function RecurringSubTier({
  values,
  disabled,
  onChange,
}: RecurringSubTierProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <SpeedySectionHeader
        title="Subscription Details"
        subtitle="Speedy Recurring Storefront sub-tier"
      />

      <SpeedyField
        fieldId="SSR1"
        label="Up to 3 subscription tiers (Name-Cycle-Price-What's included)"
        required
      >
        <textarea
          id="sbf-SSR1"
          style={{ ...textareaStyle, minHeight: "140px" }}
          value={values.SSR1}
          disabled={disabled}
          placeholder={
            "Basic - Monthly - $19 - Access to members newsletter + 10% discount\nPro - Monthly - $49 - Everything in Basic + priority support + exclusive content\nElite - Annual - $399 - All features + personal strategy call"
          }
          onChange={(e) => onChange("SSR1", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSR2" label="Member cancellation policy">
        <textarea
          id="sbf-SSR2"
          style={textareaStyle}
          value={values.SSR2}
          disabled={disabled}
          placeholder="e.g., Members may cancel anytime; access continues until end of billing period"
          onChange={(e) => onChange("SSR2", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField
        fieldId="SSR3"
        label="Subscription confirmation email"
        required
      >
        <input
          id="sbf-SSR3"
          type="email"
          style={inputStyle}
          value={values.SSR3}
          disabled={disabled}
          placeholder="members@yourbusiness.com"
          onChange={(e) => onChange("SSR3", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSR4" label="Failed payment recovery email">
        <input
          id="sbf-SSR4"
          type="email"
          style={inputStyle}
          value={values.SSR4}
          disabled={disabled}
          placeholder="billing@yourbusiness.com"
          onChange={(e) => onChange("SSR4", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSR5" label="Cancellation confirmation message">
        <textarea
          id="sbf-SSR5"
          style={textareaStyle}
          value={values.SSR5}
          disabled={disabled}
          placeholder="e.g., 'Your subscription has been cancelled. You'll retain access until [date].'"
          onChange={(e) => onChange("SSR5", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSR6" label="Subscription page headline">
        <input
          id="sbf-SSR6"
          type="text"
          style={inputStyle}
          value={values.SSR6}
          disabled={disabled}
          placeholder="e.g., 'Choose Your Membership'"
          onChange={(e) => onChange("SSR6", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSR7" label="Subscription page sub-description">
        <textarea
          id="sbf-SSR7"
          style={textareaStyle}
          value={values.SSR7}
          disabled={disabled}
          placeholder="Intro paragraph explaining the value of joining"
          onChange={(e) => onChange("SSR7", e.target.value)}
        />
      </SpeedyField>

      <SpeedyField fieldId="SSR8" label="Free trial period?">
        <select
          id="sbf-SSR8"
          style={selectStyle}
          value={values.SSR8}
          disabled={disabled}
          onChange={(e) => onChange("SSR8", e.target.value)}
        >
          <option value="">Select…</option>
          <option value="None">None</option>
          <option value="7 Days">7 Days</option>
          <option value="14 Days">14 Days</option>
          <option value="30 Days">30 Days</option>
        </select>
      </SpeedyField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier price lookup helper
// ---------------------------------------------------------------------------
function getTierPrice(tier: string): string {
  const t = tier.toUpperCase();
  if (t === "SPEEDY BASIC") return "$149";
  if (t === "SPEEDY BOOKING") return "$249";
  if (t === "SPEEDY PRODUCT STOREFRONT") return "$349";
  if (t === "SPEEDY MENU STOREFRONT") return "$349";
  if (t === "SPEEDY RECURRING STOREFRONT") return "$349";
  return "see pricing";
}

// ---------------------------------------------------------------------------
// SpeedySiteBrief — Speedy-specific form (module scope)
// ---------------------------------------------------------------------------
interface SpeedySiteBriefProps {
  productTier: string;
  userEmail: string;
  clientName?: string;
  onSubmitSuccess: () => void;
}

function SpeedySiteBrief({
  productTier,
  userEmail,
  clientName,
  onSubmitSuccess,
}: SpeedySiteBriefProps) {
  const { actor } = useActor();
  const tierName = productTier || "Speedy Basic";
  const tierUpper = tierName.toUpperCase();

  // Dynamic questions: null=not-loaded, []=empty(use fallback), [q,...]= use dynamic
  const [dynamicQuestions, setDynamicQuestions] = useState<
    QuestionDefinition[] | null
  >(null);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState(false);

  useEffect(() => {
    if (!actor || !tierName) return;
    let cancelled = false;
    setIsLoadingDynamic(true);
    (actor as backendInterface)
      .getQuestionDefinitions(tierName)
      .then((defs) => {
        if (cancelled) return;
        const sorted = [...defs].sort(
          (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
        );
        if (sorted.length === 0) {
          console.info(
            `[SpeedySiteBrief] No dynamic questions for "${tierName}". Using hardcoded fallback.`,
          );
        }
        setDynamicQuestions(sorted);
      })
      .catch(() => {
        if (!cancelled) {
          console.warn(
            "[SpeedySiteBrief] Failed to fetch dynamic questions. Using hardcoded fallback.",
          );
          setDynamicQuestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDynamic(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, tierName]);

  const useDynamic = dynamicQuestions !== null && dynamicQuestions.length > 0;
  const tierPrice = getTierPrice(tierName);

  // Determine sub-tier
  const subTier: "booking" | "product" | "menu" | "recurring" | "none" =
    tierUpper === "SPEEDY BOOKING"
      ? "booking"
      : tierUpper === "SPEEDY PRODUCT STOREFRONT"
        ? "product"
        : tierUpper === "SPEEDY MENU STOREFRONT"
          ? "menu"
          : tierUpper === "SPEEDY RECURRING STOREFRONT"
            ? "recurring"
            : "none";

  // ── Global state ──
  const [global, setGlobal] = useState<GlobalFieldsState>({
    PQ1: false,
    PQ2: clientName ?? "",
    PQ3: userEmail ?? "",
    PQ4: "",
    PQ5: "",
    PQ6: "",
    PQ7: false,
    PQ_VOICE: "",
    SS1: "",
    SS2: "",
    SS3: "",
    SS4: "",
    SS5: "",
    SS6: "",
    SS7: "",
    SS8: "",
    SS9: "",
    SS10: "",
    SS11: "",
    SS12: "",
    SS13: "",
    SS14: "",
    SS15: "",
    SS16: "",
    SS17: "",
    SS18: "",
    SS19: "",
    SS20: "",
    SS21: "",
    SS22: "",
  });

  function handleGlobalChange(
    field: keyof GlobalFieldsState,
    value: string | boolean,
  ) {
    setGlobal((prev) => ({ ...prev, [field]: value }));
  }

  // ── Booking sub-tier state ──
  const [booking, setBooking] = useState<BookingState>({
    SSB1: "",
    SSB2: "",
    SSB3: "",
    SSB4: "",
    SSB5: "",
    SSB6: "",
    SSB7: "",
    SSB8: "",
    SSB9: "",
    SSB10: "",
    SSB11: "",
  });

  function handleBookingChange(field: keyof BookingState, value: string) {
    setBooking((prev) => ({ ...prev, [field]: value }));
  }

  // ── Product sub-tier state ──
  const [product, setProduct] = useState<ProductState>({
    SSP1: "",
    SSP2: "",
    SSP3: "",
    SSP4: "",
    SSP5: "",
    SSP6: "",
    SSP7: "",
    SSP8: "",
  });

  function handleProductChange(field: keyof ProductState, value: string) {
    setProduct((prev) => ({ ...prev, [field]: value }));
  }

  // ── Menu sub-tier state ──
  const [menu, setMenu] = useState<MenuState>({
    SSM1: "",
    SSM2: "",
    SSM3: "",
    SSM4: "",
    SSM5: "",
    SSM6: "",
    SSM7: "",
    SSM8: "",
    SSM9: "",
  });

  function handleMenuChange(field: keyof MenuState, value: string) {
    setMenu((prev) => ({ ...prev, [field]: value }));
  }

  // ── Recurring sub-tier state ──
  const [recurring, setRecurring] = useState<RecurringState>({
    SSR1: "",
    SSR2: "",
    SSR3: "",
    SSR4: "",
    SSR5: "",
    SSR6: "",
    SSR7: "",
    SSR8: "",
  });

  function handleRecurringChange(field: keyof RecurringState, value: string) {
    setRecurring((prev) => ({ ...prev, [field]: value }));
  }

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function validate(): string | null {
    if (!global.PQ1) return "Please confirm your tier selection (PQ1).";
    if (!global.PQ2.trim()) return "Full name is required (PQ2).";
    if (!global.PQ3.trim()) return "Email is required (PQ3).";
    if (!global.PQ4.trim()) return "Phone is required (PQ4).";
    if (!global.PQ5.trim()) return "Preferred launch date is required (PQ5).";
    if (!global.PQ6) return "Content provision selection is required (PQ6).";
    if (!global.PQ7) return "Please acknowledge the revision policy (PQ7).";
    if (!global.PQ_VOICE) return "Brand voice selection is required.";
    if (!global.SS1.trim()) return "Business name is required (SS1).";
    if (!global.SS2.trim()) return "Business type is required (SS2).";
    if (!global.SS3.trim()) return "Business description is required (SS3).";
    if (!global.SS4.trim()) return "City/State/Region is required (SS4).";
    if (!global.SS5.trim()) return "Primary service/product is required (SS5).";
    if (!global.SS7.trim()) return "Hero headline is required (SS7).";
    if (!global.SS8.trim()) return "Primary CTA is required (SS8).";
    if (!global.SS10.trim()) return "About Us is required (SS10).";
    if (!global.SS11.trim()) return "Services list is required (SS11).";
    if (!global.SS13.trim()) return "Phone is required (SS13).";
    if (!global.SS14.trim()) return "Email for submissions is required (SS14).";
    if (!global.SS15.trim()) return "Physical address is required (SS15).";
    if (!global.SS16.trim()) return "Business hours are required (SS16).";
    if (!global.SS21.trim()) return "Primary keywords are required (SS21).";
    if (!global.SS22.trim()) return "Browser tab title is required (SS22).";
    // Sub-tier validations
    if (subTier === "booking") {
      if (!booking.SSB1.trim())
        return "Bookable services list is required (SSB1).";
      if (!booking.SSB3) return "Payment capture is required (SSB3).";
      if (!booking.SSB8.trim())
        return "Booking confirmation email is required (SSB8).";
    }
    if (subTier === "product") {
      if (!product.SSP1.trim()) return "Product list is required (SSP1).";
      if (!product.SSP2) return "Shipping logic is required (SSP2).";
      if (!product.SSP5.trim())
        return "Order confirmation email is required (SSP5).";
    }
    if (subTier === "menu") {
      if (!menu.SSM1.trim()) return "Menu items are required (SSM1).";
      if (!menu.SSM2) return "Order types are required (SSM2).";
      if (!menu.SSM4.trim())
        return "Kitchen notification email is required (SSM4).";
      if (!menu.SSM5.trim())
        return "Order confirmation email is required (SSM5).";
    }
    if (subTier === "recurring") {
      if (!recurring.SSR1.trim())
        return "Subscription tiers are required (SSR1).";
      if (!recurring.SSR3.trim())
        return "Subscription confirmation email is required (SSR3).";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      // Build answers object keyed by field ID
      const answers: Record<string, string> = {
        productTier: tierName,
        name: global.PQ2,
        email: global.PQ3,
        // Pre-qualification
        PQ1: global.PQ1 ? "Confirmed" : "Not confirmed",
        PQ2: global.PQ2,
        PQ3: global.PQ3,
        PQ4: global.PQ4,
        PQ5: global.PQ5,
        PQ6: global.PQ6,
        PQ7: global.PQ7 ? "Acknowledged" : "Not acknowledged",
        PQ_VOICE: global.PQ_VOICE,
        // Identity
        SS1: global.SS1,
        SS2: global.SS2,
        SS3: global.SS3,
        SS4: global.SS4,
        SS5: global.SS5,
        SS6: global.SS6,
        // Content
        SS7: global.SS7,
        SS8: global.SS8,
        SS9: global.SS9,
        SS10: global.SS10,
        SS11: global.SS11,
        SS12: global.SS12,
        // Brand & SEO
        SS13: global.SS13,
        SS14: global.SS14,
        SS15: global.SS15,
        SS16: global.SS16,
        SS17: global.SS17,
        SS18: global.SS18,
        SS19: global.SS19,
        SS20: global.SS20,
        SS21: global.SS21,
        SS22: global.SS22,
      };

      // Add sub-tier answers
      if (subTier === "booking") {
        Object.assign(answers, booking);
      } else if (subTier === "product") {
        Object.assign(answers, product);
      } else if (subTier === "menu") {
        Object.assign(answers, menu);
      } else if (subTier === "recurring") {
        Object.assign(answers, recurring);
      }

      const questionnaireType = `${tierName} - Speedy Site Brief`;
      await actor.submitQuestionnaire(
        questionnaireType,
        JSON.stringify(answers),
      );

      const emailToUpdate = global.PQ3.trim() || userEmail;
      if (emailToUpdate) {
        await (actor as backendInterface).updateClientBriefStatus("Submitted");
      }

      setSubmitted(true);
      onSubmitSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Loading spinner while dynamic questions are being fetched
  if (isLoadingDynamic) {
    return (
      <div
        data-ocid="speedy-brief.loading_state"
        style={{
          padding: "32px",
          textAlign: "center",
          color: "#7A7D90",
          fontSize: "14px",
        }}
      >
        Loading questionnaire…
      </div>
    );
  }

  // Dynamic form when backend has questions configured for this tier
  if (useDynamic) {
    return (
      <DynamicBriefForm
        questions={dynamicQuestions!}
        tierCode={tierName}
        accentColor="#5EF08A"
        submitLabel="Submit My Speedy Brief"
        onSubmitSuccess={onSubmitSuccess}
      />
    );
  }

  if (submitted) {
    return (
      <div
        data-ocid="speedy-brief.success"
        style={{
          padding: "20px",
          borderRadius: "10px",
          background: "rgba(94,240,138,0.08)",
          border: "1px solid rgba(94,240,138,0.25)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "32px",
            marginBottom: "12px",
          }}
          aria-hidden="true"
        >
          ✓
        </div>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#5EF08A",
          }}
        >
          Your Speedy Site Brief has been submitted!
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#86EFAC",
            lineHeight: "1.6",
          }}
        >
          Build Status: Reviewing Brief. Our team will contact you within 24
          hours to confirm your project timeline.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-ocid="speedy-brief.form"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      noValidate
    >
      <SpinKeyframes />

      {/* Tier badge */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "8px",
          background: "rgba(94,240,138,0.06)",
          border: "1px solid rgba(94,240,138,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: "#5EF08A",
            textTransform: "uppercase",
          }}
        >
          {tierName}
        </span>
        <span style={{ fontSize: "11px", color: "#7A7D90" }}>·</span>
        <span style={{ fontSize: "12px", color: "#86EFAC" }}>
          {tierPrice} build
        </span>
        {subTier !== "none" && (
          <>
            <span style={{ fontSize: "11px", color: "#7A7D90" }}>·</span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#B0B3C6",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "999px",
                padding: "2px 8px",
                textTransform: "capitalize",
              }}
            >
              {subTier} sub-tier included
            </span>
          </>
        )}
      </div>

      {/* Global Fields */}
      <GlobalFields
        values={global}
        tierName={tierName}
        tierPrice={tierPrice}
        disabled={submitting}
        onChange={handleGlobalChange}
      />

      {/* Sub-Tier Fields */}
      {subTier === "booking" && (
        <BookingSubTier
          values={booking}
          disabled={submitting}
          onChange={handleBookingChange}
        />
      )}
      {subTier === "product" && (
        <ProductSubTier
          values={product}
          disabled={submitting}
          onChange={handleProductChange}
        />
      )}
      {subTier === "menu" && (
        <MenuSubTier
          values={menu}
          disabled={submitting}
          onChange={handleMenuChange}
        />
      )}
      {subTier === "recurring" && (
        <RecurringSubTier
          values={recurring}
          disabled={submitting}
          onChange={handleRecurringChange}
        />
      )}

      {/* Error */}
      {submitError && (
        <p
          data-ocid="speedy-brief.error"
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#F87171",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "6px",
            padding: "10px 14px",
          }}
        >
          {submitError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        data-ocid="speedy-brief.submit"
        disabled={submitting || !actor}
        style={{
          alignSelf: "flex-start",
          padding: "12px 28px",
          borderRadius: "8px",
          background: submitting ? "rgba(94,240,138,0.4)" : "#5EF08A",
          color: "#061209",
          fontWeight: 700,
          fontSize: "14px",
          border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "opacity 0.15s",
        }}
      >
        {submitting ? (
          <>
            <span
              style={{
                width: "14px",
                height: "14px",
                border: "2px solid rgba(6,18,9,0.4)",
                borderTopColor: "#061209",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
            Submitting…
          </>
        ) : (
          "Submit My Speedy Brief"
        )}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Custom Site Brief component (module scope — keeps all hooks at top level)
// ---------------------------------------------------------------------------
interface CustomSiteBriefProps {
  productTier: string;
  userEmail: string;
  clientName?: string;
  onSubmitSuccess: () => void;
}

function CustomSiteBrief({
  productTier,
  userEmail,
  clientName,
  onSubmitSuccess,
}: CustomSiteBriefProps) {
  const { actor } = useActor();
  const tier = productTier || "Custom Site";
  const { showStep2, engine, showStep4a, showStep4b, showStep4c, showStep5 } =
    getCustomTierLevel(tier);
  const tierPrice = getCustomTierPrice(tier);

  // Dynamic questions: null=not-loaded, []=empty(use fallback), [q,...]= use dynamic
  const [dynamicQuestions, setDynamicQuestions] = useState<
    QuestionDefinition[] | null
  >(null);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState(false);

  useEffect(() => {
    if (!actor || !tier) return;
    let cancelled = false;
    setIsLoadingDynamic(true);
    (actor as backendInterface)
      .getQuestionDefinitions(tier)
      .then((defs) => {
        if (cancelled) return;
        const sorted = [...defs].sort(
          (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
        );
        if (sorted.length === 0) {
          console.info(
            `[CustomSiteBrief] No dynamic questions for "${tier}". Using hardcoded fallback.`,
          );
        }
        setDynamicQuestions(sorted);
      })
      .catch(() => {
        if (!cancelled) {
          console.warn(
            "[CustomSiteBrief] Failed to fetch dynamic questions. Using hardcoded fallback.",
          );
          setDynamicQuestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDynamic(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, tier]);

  const useDynamic = dynamicQuestions !== null && dynamicQuestions.length > 0;

  // ── State: Step 1 sections ──
  const [preQual, setPreQual] = useState<CsPreQualState>({
    pq2: "",
    pq3: clientName ?? "",
    pq3b: userEmail ?? "",
    pq3c: "",
    pq4: "",
    pq5: "",
    pq6: false,
    pq7: "",
  });
  const [identity, setIdentity] = useState<CsIdentityState>({
    s11: "",
    s12: "",
    s13: "",
    s14: "",
    s15: "",
    s16: "",
  });
  const [hero, setHero] = useState<CsHeroState>({
    s17: "",
    s18: "",
    s19: "",
    s110: "",
    s111: "",
    s112: "",
  });
  const [about, setAbout] = useState<CsAboutState>({
    s113: "",
    s114: "",
    s115: "",
    s116: "",
  });
  const [trust, setTrust] = useState<CsTrustState>({
    s117: "",
    s118: "",
    s119: "",
    s120: "",
    s121: "",
  });
  const [seo, setSeo] = useState<CsSeoState>({
    s122: "",
    s123: "",
    s124: "",
    s125: "",
    s126: "",
    s127: "",
    s128: "",
    s129: "",
    s130: "",
    s131: "",
    s132: "",
  });

  // ── State: Step 2 sections ──
  const [sitemap, setSitemap] = useState<CsSitemapState>({
    s21: "",
    s22: "",
    s23: "",
  });
  const [servicePages, setServicePages] = useState<CsServicePagesState>({
    s24: "",
    s25: "",
    s26: "",
  });
  const [seoComp, setSeoComp] = useState<CsSeoCompState>({
    s27: "",
    s28: "",
    s29: "",
    s210: "",
  });
  const [gallery, setGallery] = useState<CsGalleryState>({
    s211: "",
    s212: "",
  });
  const [team, setTeam] = useState<CsTeamState>({ s213: "" });
  const [localSeo, setLocalSeo] = useState<CsLocalSeoState>({
    s214: "",
    s215: "",
    s216: "",
    s217: "",
  });
  const [reviewsBlog, setReviewsBlog] = useState<CsReviewsBlogState>({
    s218: "",
    s219: "",
    s220: "",
    s221: "",
  });

  // ── State: Step 3A ──
  const [bookingEngine, setBookingEngine] = useState<CsBookingEngineState>({
    sa1: "",
    sa2: "",
    sa3: "",
    sa4: "",
    sa5: "",
    sa6: "",
    sa7: "",
    sa8: "",
    sa9: "",
    sa10: "",
    sa11: "",
    sa12: "",
    sa13: "",
    sa14: "",
    sa15: "",
    sa16: "",
  });

  // ── State: Step 3B ──
  const [restaurantEngine, setRestaurantEngine] =
    useState<CsRestaurantEngineState>({
      sb1: "",
      sb2: "",
      sb3: "",
      sb4: "",
      sb5: "",
      sb6: "",
      sb7: "",
      sb8: "",
      sb9: "",
      sb10: "",
      sb11: "",
      sb12: "",
      sb13: "",
    });

  // ── State: Part 2 — Step 4A ──
  const [dsState, setDsState] = useState<CsDigitalStorefrontState>({
    s4a1: "",
    s4a2: "",
    s4a3: "",
    s4a4: "",
    s4a5: "",
    s4a6: "",
    s4a7: "",
    s4a8: "",
    s4a9: "",
    s4a10: "",
    s4a11: "",
    s4a12: "",
    s4a13: "",
    s4a14: "",
  });

  // ── State: Part 2 — Step 4B ──
  const [reState, setReState] = useState<CsRestaurantEmpireState>({
    s4b1: "",
    s4b2: "",
    s4b3: "",
    s4b4: "",
    s4b5: "",
    s4b6: "",
    s4b7: "",
    s4b8: "",
    s4b9: "",
    s4b10: "",
    s4b11: "",
    s4b12: "",
    s4b13: "",
    s4b14: "",
    s4b15: "",
    s4b16: "",
    s4b17: "",
    s4b18: "",
  });

  // ── State: Part 2 — Step 4C ──
  const [meState, setMeState] = useState<CsMembershipEngineState>({
    s4c1: "",
    s4c2: "",
    s4c3: "",
    s4c4: "",
    s4c5: "",
    s4c6: "",
    s4c7: "",
    s4c8: "",
    s4c9: "",
    s4c10: "",
    s4c11: "",
    s4c12: "",
    s4c13: "",
  });

  // ── State: Part 2 — Step 5 ──
  const [entState, setEntState] = useState<CsEnterpriseState>({
    s51: "",
    s52: "",
    s53: "",
    s54: "",
    s55: "",
    s56: "",
    s57: "",
    s58: "",
    s59: "",
    s510: "",
    s511: "",
    s512: "",
    s513: "",
    s514: "",
    s515: "",
    s516: "",
    s517: "",
    s518: "",
    s519: "",
    s520: "",
    s521: "",
    s522: "",
    s523: "",
    s524: "",
    s525: "",
    s526: "",
    s527: "",
  });

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ── Typed setters ──
  function handlePreQual(field: keyof CsPreQualState, value: string | boolean) {
    setPreQual((prev) => ({ ...prev, [field]: value }));
  }
  function handleIdentity(field: keyof CsIdentityState, value: string) {
    setIdentity((prev) => ({ ...prev, [field]: value }));
  }
  function handleHero(field: keyof CsHeroState, value: string) {
    setHero((prev) => ({ ...prev, [field]: value }));
  }
  function handleAbout(field: keyof CsAboutState, value: string) {
    setAbout((prev) => ({ ...prev, [field]: value }));
  }
  function handleTrust(field: keyof CsTrustState, value: string) {
    setTrust((prev) => ({ ...prev, [field]: value }));
  }
  function handleSeo(field: keyof CsSeoState, value: string) {
    setSeo((prev) => ({ ...prev, [field]: value }));
  }
  function handleSitemap(field: keyof CsSitemapState, value: string) {
    setSitemap((prev) => ({ ...prev, [field]: value }));
  }
  function handleServicePages(field: keyof CsServicePagesState, value: string) {
    setServicePages((prev) => ({ ...prev, [field]: value }));
  }
  function handleSeoComp(field: keyof CsSeoCompState, value: string) {
    setSeoComp((prev) => ({ ...prev, [field]: value }));
  }
  function handleGallery(field: keyof CsGalleryState, value: string) {
    setGallery((prev) => ({ ...prev, [field]: value }));
  }
  function handleTeam(field: keyof CsTeamState, value: string) {
    setTeam((prev) => ({ ...prev, [field]: value }));
  }
  function handleLocalSeo(field: keyof CsLocalSeoState, value: string) {
    setLocalSeo((prev) => ({ ...prev, [field]: value }));
  }
  function handleReviewsBlog(field: keyof CsReviewsBlogState, value: string) {
    setReviewsBlog((prev) => ({ ...prev, [field]: value }));
  }
  function handleBookingEngine(
    field: keyof CsBookingEngineState,
    value: string,
  ) {
    setBookingEngine((prev) => ({ ...prev, [field]: value }));
  }
  function handleRestaurantEngine(
    field: keyof CsRestaurantEngineState,
    value: string,
  ) {
    setRestaurantEngine((prev) => ({ ...prev, [field]: value }));
  }
  function handleDigitalStorefront(
    field: keyof CsDigitalStorefrontState,
    value: string,
  ) {
    setDsState((prev) => ({ ...prev, [field]: value }));
  }
  function handleRestaurantEmpire(
    field: keyof CsRestaurantEmpireState,
    value: string,
  ) {
    setReState((prev) => ({ ...prev, [field]: value }));
  }
  function handleMembershipEngine(
    field: keyof CsMembershipEngineState,
    value: string,
  ) {
    setMeState((prev) => ({ ...prev, [field]: value }));
  }
  function handleEnterprise(field: keyof CsEnterpriseState, value: string) {
    setEntState((prev) => ({ ...prev, [field]: value }));
  }

  // ── Validation ──
  function validate(): string | null {
    if (!preQual.pq3.trim()) return "Full Name is required (PQ3).";
    if (!preQual.pq3b.trim()) return "Email Address is required (PQ3b).";
    if (!preQual.pq6) return "Please acknowledge the revision policy (PQ6).";
    if (!identity.s11.trim()) return "Business Name is required (1.1).";
    if (!hero.s17.trim()) return "Hero Headline is required (1.7).";
    if (!about.s113.trim()) return "Brand Story is required (1.13).";
    if (!trust.s117.trim()) return "Testimonials are required (1.17).";
    if (!trust.s118.trim()) return "Submission Email is required (1.18).";
    if (!seo.s123.trim()) return "Browser Tab Title is required (1.23).";
    if (engine === "booking" && !bookingEngine.sa1.trim())
      return "Bookable Services list is required (3A.1).";
    if (engine === "booking" && !bookingEngine.sa9.trim())
      return "Booking Confirmation Email is required (3A.9).";
    if (engine === "restaurant" && !restaurantEngine.sb1)
      return "Order Types is required (3B.1).";
    if (engine === "restaurant" && !restaurantEngine.sb3.trim())
      return "Kitchen Notification Email is required (3B.3).";
    if (engine === "restaurant" && !restaurantEngine.sb5.trim())
      return "Full Menu is required (3B.5).";
    // Part 2 validations
    if (showStep4a && !dsState.s4a1.trim())
      return "Product Categories are required (4A.1).";
    if (showStep4a && !dsState.s4a5)
      return "Shipping Logic selection is required (4A.5).";
    if (showStep4b && !reState.s4b1)
      return "Number of Locations is required (4B.1).";
    if (showStep4b && !reState.s4b3) return "Menu Type is required (4B.3).";
    if (showStep4c && !meState.s4c1.trim())
      return "Membership Levels are required (4C.1).";
    if (showStep4c && !meState.s4c6)
      return "Member Check-In Method is required (4C.6).";
    if (showStep5 && !entState.s51.trim())
      return "Number of Locations / Business Units is required (5.1).";
    if (showStep5 && !entState.s52.trim())
      return "Platform Purpose is required (5.2).";
    if (showStep5 && !entState.s53.trim())
      return "Full Custom Requirements are required (5.3).";
    if (showStep5 && !entState.s521.trim())
      return "Legal Entity Name is required (5.21).";
    if (showStep5 && !entState.s522.trim())
      return "Billing Contact Name & Email is required (5.22).";
    return null;
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const serialized: Record<string, string | boolean> = {
        // Pre-qual
        PQ1_tier: tier,
        PQ2_monthlyPlan: preQual.pq2,
        PQ3_fullName: preQual.pq3,
        PQ3b_email: preQual.pq3b,
        PQ3c_phone: preQual.pq3c,
        PQ4_launchDate: preQual.pq4,
        PQ5_contentProvision: preQual.pq5,
        PQ6_revisionAck: preQual.pq6 ? "Acknowledged" : "Not acknowledged",
        PQ7_brandVoice: preQual.pq7,
        // Step 1: Identity
        "1.1_businessName": identity.s11,
        "1.2_businessDescription": identity.s12,
        "1.3_regionServed": identity.s13,
        "1.4_idealCustomer": identity.s14,
        "1.5_competitiveEdge": identity.s15,
        "1.6_stats": identity.s16,
        // Step 1: Hero
        "1.7_heroHeadline": hero.s17,
        "1.8_subHeadline": hero.s18,
        "1.9_ctaText": hero.s19,
        "1.10_ctaDestination": hero.s110,
        "1.11_trustBadge": hero.s111,
        "1.12_backgroundPref": hero.s112,
        // Step 1: About
        "1.13_brandStory": about.s113,
        "1.14_nameTitle": about.s114,
        "1.15_serviceList": about.s115,
        "1.16_showPricing": about.s116,
        // Step 1: Trust
        "1.17_testimonials": trust.s117,
        "1.18_submissionEmail": trust.s118,
        "1.19_businessPhone": trust.s119,
        "1.20_businessAddress": trust.s120,
        "1.21_businessHours": trust.s121,
        // Step 1: SEO
        "1.22_domain": seo.s122,
        "1.23_browserTabTitle": seo.s123,
        "1.24_keywords": seo.s124,
        "1.25_brandColors": seo.s125,
        "1.26_logoUrl": seo.s126,
        "1.27_websiteStyle": seo.s127,
        "1.28_googleBusiness": seo.s128,
        "1.29_socialLinks": seo.s129,
        "1.30_clickToCall": seo.s130,
        "1.31_analyticsId": seo.s131,
        "1.32_clickToText": seo.s132,
      };

      if (showStep2) {
        Object.assign(serialized, {
          "2.1_sitemap": sitemap.s21,
          "2.2_navOrder": sitemap.s22,
          "2.3_dedicatedServicePages": sitemap.s23,
          "2.4_servicePageCount": servicePages.s24,
          "2.5_servicePageDetails": servicePages.s25,
          "2.6_servicePageImages": servicePages.s26,
          "2.7_citySeoTargets": seoComp.s27,
          "2.8_competitors": seoComp.s28,
          "2.9_siteWideCta": seoComp.s29,
          "2.10_faqs": seoComp.s210,
          "2.11_galleryImages": gallery.s211,
          "2.12_galleryTitle": gallery.s212,
          "2.13_teamMembers": team.s213,
          "2.14_googlePlaceId": localSeo.s214,
          "2.15_mapCities": localSeo.s215,
          "2.16_analyticsId": localSeo.s216,
          "2.17_searchConsole": localSeo.s217,
          "2.18_reviewsDisplay": reviewsBlog.s218,
          "2.19_reviewsLocation": reviewsBlog.s219,
          "2.20_blogNeeded": reviewsBlog.s220,
          "2.21_blogCategories": reviewsBlog.s221,
        });
      }

      if (engine === "booking") {
        Object.assign(serialized, {
          "3A.1_bookableServices": bookingEngine.sa1,
          "3A.2_staffMembers": bookingEngine.sa2,
          "3A.3_bookingHours": bookingEngine.sa3,
          "3A.4_paymentCapture": bookingEngine.sa4,
          "3A.5_depositAmount": bookingEngine.sa5,
          "3A.6_cancellationPolicy": bookingEngine.sa6,
          "3A.7_hoursBeforeCancel": bookingEngine.sa7,
          "3A.8_onlineReschedule": bookingEngine.sa8,
          "3A.9_confirmationEmail": bookingEngine.sa9,
          "3A.10_reminderEmail": bookingEngine.sa10,
          "3A.11_followUpEmail": bookingEngine.sa11,
          "3A.12_crmStages": bookingEngine.sa12,
          "3A.13_adminEmail": bookingEngine.sa13,
          "3A.14_intakeQuestions": bookingEngine.sa14,
          "3A.15_bookingHeadline": bookingEngine.sa15,
          "3A.16_bookingSubDesc": bookingEngine.sa16,
        });
      }

      if (engine === "restaurant") {
        Object.assign(serialized, {
          "3B.1_orderTypes": restaurantEngine.sb1,
          "3B.2_prepTime": restaurantEngine.sb2,
          "3B.3_kitchenEmail": restaurantEngine.sb3,
          "3B.4_confirmationEmail": restaurantEngine.sb4,
          "3B.5_fullMenu": restaurantEngine.sb5,
          "3B.6_menuModifiers": restaurantEngine.sb6,
          "3B.7_deliveryRadius": restaurantEngine.sb7,
          "3B.8_minimumOrder": restaurantEngine.sb8,
          "3B.9_operatingHours": restaurantEngine.sb9,
          "3B.10_dineIn": restaurantEngine.sb10,
          "3B.11_catering": restaurantEngine.sb11,
          "3B.12_specialInstructions": restaurantEngine.sb12,
          "3B.13_cateringFields": restaurantEngine.sb13,
        });
      }

      // Part 2 — Step 4A: Digital Storefront
      if (showStep4a) {
        Object.assign(serialized, {
          "4A.1_productCategories": dsState.s4a1,
          "4A.2_catalog": dsState.s4a2,
          "4A.3_featuredCollections": dsState.s4a3,
          "4A.4_homepageSpotlight": dsState.s4a4,
          "4A.5_shippingLogic": dsState.s4a5,
          "4A.6_shippingRules": dsState.s4a6,
          "4A.7_originAddress": dsState.s4a7,
          "4A.8_salesTaxStates": dsState.s4a8,
          "4A.9_orderConfirmationEmail": dsState.s4a9,
          "4A.10_shippingUpdateEmail": dsState.s4a10,
          "4A.11_returnPolicy": dsState.s4a11,
          "4A.12_promoCodes": dsState.s4a12,
          "4A.13_customerAccountReq": dsState.s4a13,
          "4A.14_orderConfirmationMessage": dsState.s4a14,
        });
      }

      // Part 2 — Step 4B: Restaurant Empire
      if (showStep4b) {
        Object.assign(serialized, {
          "4B.1_locationCount": reState.s4b1,
          "4B.2_locationDetails": reState.s4b2,
          "4B.3_menuType": reState.s4b3,
          "4B.4_kitchenEmails": reState.s4b4,
          "4B.5_brandingConsistent": reState.s4b5,
          "4B.6_reservationsNeeded": reState.s4b6,
          "4B.7_eventBooking": reState.s4b7,
          "4B.8_cateringPortal": reState.s4b8,
          "4B.9_giftCards": reState.s4b9,
          "4B.10_loyaltyProgram": reState.s4b10,
          "4B.11_emailMarketing": reState.s4b11,
          "4B.12_existingPlatform": reState.s4b12,
          "4B.13_cateringFormFields": reState.s4b13,
          "4B.14_onlineOrderingIntegration": reState.s4b14,
          "4B.15_staffPermissionLevels": reState.s4b15,
          "4B.16_reservationDetails": reState.s4b16,
          "4B.17_waitlistCopy": reState.s4b17,
          "4B.18_salesReportEmail": reState.s4b18,
        });
      }

      // Part 2 — Step 4C: Membership Engine
      if (showStep4c) {
        Object.assign(serialized, {
          "4C.1_membershipLevels": meState.s4c1,
          "4C.2_classPacks": meState.s4c2,
          "4C.3_classSchedule": meState.s4c3,
          "4C.4_portalSelfService": meState.s4c4,
          "4C.5_waitlist": meState.s4c5,
          "4C.6_checkInMethod": meState.s4c6,
          "4C.7_referralLandingPage": meState.s4c7,
          "4C.8_reminderEmailDays": meState.s4c8,
          "4C.9_recoveryEmail": meState.s4c9,
          "4C.10_cancellationEmail": meState.s4c10,
          "4C.11_pwaUpgrade": meState.s4c11,
          "4C.12_welcomeMessage": meState.s4c12,
          "4C.13_referralTerms": meState.s4c13,
        });
      }

      // Part 2 — Step 5: Enterprise Scale
      if (showStep5) {
        Object.assign(serialized, {
          "5.1_locations": entState.s51,
          "5.2_platformPurpose": entState.s52,
          "5.3_fullRequirements": entState.s53,
          "5.4_timeline": entState.s54,
          "5.5_crmStages": entState.s55,
          "5.6_staffAccounts": entState.s56,
          "5.7_permissionLevels": entState.s57,
          "5.8_wholesalePricing": entState.s58,
          "5.9_idxProvider": entState.s59,
          "5.10_searchFilters": entState.s510,
          "5.11_agentProfileFields": entState.s511,
          "5.12_portalTypes": entState.s512,
          "5.13_apiIntegrations": entState.s513,
          "5.14_existingSoftware": entState.s514,
          "5.15_customMetrics": entState.s515,
          "5.16_emailPlatform": entState.s516,
          "5.17_emailSequences": entState.s517,
          "5.18_statusCallTimes": entState.s518,
          "5.19_decisionMaker": entState.s519,
          "5.20_secondaryContact": entState.s520,
          "5.21_legalEntityName": entState.s521,
          "5.22_billingContact": entState.s522,
          "5.23_techStack": entState.s523,
          "5.24_seoPageCount": entState.s524,
          "5.25_webhookUrl": entState.s525,
          "5.26_serverLocation": entState.s526,
          "5.27_employeePortal": entState.s527,
        });
      }

      // Metadata
      serialized._productTier = tier;
      serialized._clientEmail = preQual.pq3b || userEmail;
      serialized._clientName = preQual.pq3 || clientName || "";

      const questionnaireType = `${tier.toUpperCase()} - Custom Site Brief`;
      await actor.submitQuestionnaire(
        questionnaireType,
        JSON.stringify(serialized),
      );

      const emailToUpdate = (preQual.pq3b || userEmail).trim();
      if (emailToUpdate) {
        await (actor as backendInterface).updateClientBriefStatus("Submitted");
      }

      setSubmitted(true);
      onSubmitSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Loading spinner while dynamic questions are being fetched
  if (isLoadingDynamic) {
    return (
      <div
        data-ocid="custom-brief.loading_state"
        style={{
          padding: "32px",
          textAlign: "center",
          color: "#7A7D90",
          fontSize: "14px",
        }}
      >
        Loading questionnaire…
      </div>
    );
  }

  // Dynamic form when backend has questions configured for this tier
  if (useDynamic) {
    return (
      <DynamicBriefForm
        questions={dynamicQuestions!}
        tierCode={tier}
        accentColor="#818CF8"
        submitLabel="Submit My Custom Site Brief"
        onSubmitSuccess={onSubmitSuccess}
        isCustom
      />
    );
  }

  // ── Success state ──
  if (submitted) {
    return (
      <div
        data-ocid="custom-brief.success"
        style={{
          padding: "24px",
          borderRadius: "10px",
          background: "rgba(129,140,248,0.08)",
          border: "1px solid rgba(129,140,248,0.3)",
          textAlign: "center",
        }}
      >
        <div
          style={{ fontSize: "36px", marginBottom: "12px" }}
          aria-hidden="true"
        >
          ✓
        </div>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#818CF8",
          }}
        >
          Custom Site Brief submitted!
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#A5B4FC",
            lineHeight: "1.6",
          }}
        >
          Build Status: Reviewing Brief. Our team will contact you within 24
          hours to confirm your project timeline.
        </p>
      </div>
    );
  }

  // ── Step progress indicator ──
  const steps = ["Step 1: Core Foundation"];
  if (showStep2) steps.push("Step 2: Multi-Page Expansion");
  if (engine === "booking") steps.push("Step 3A: Booking Engine");
  if (engine === "restaurant") steps.push("Step 3B: Restaurant Engine");
  if (showStep4a) steps.push("Step 4A: Digital Storefront");
  if (showStep4b) steps.push("Step 4B: Restaurant Empire");
  if (showStep4c) steps.push("Step 4C: Membership Engine");
  if (showStep5) steps.push("Step 5: Enterprise Scale");

  return (
    <form
      onSubmit={handleSubmit}
      data-ocid="custom-brief.form"
      style={{ display: "flex", flexDirection: "column", gap: "28px" }}
      noValidate
    >
      <SpinKeyframes />

      {/* Tier badge */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "8px",
          background: "rgba(129,140,248,0.07)",
          border: "1px solid rgba(129,140,248,0.25)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: "#818CF8",
            textTransform: "uppercase",
          }}
        >
          {tier}
        </span>
        <span style={{ fontSize: "11px", color: "#4B4F6A" }}>·</span>
        <span style={{ fontSize: "12px", color: "#A5B4FC" }}>{tierPrice}</span>
        <span style={{ fontSize: "11px", color: "#4B4F6A" }}>·</span>
        <span style={{ fontSize: "11px", color: "#7C85A8" }}>
          Custom Site Brief
        </span>
      </div>

      {/* Step progress */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <span
            key={s}
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "999px",
              background:
                i === 0
                  ? "rgba(129,140,248,0.15)"
                  : i === steps.length - 1 && engine !== "none"
                    ? "rgba(249,115,22,0.12)"
                    : "rgba(167,139,250,0.12)",
              border:
                i === 0
                  ? "1px solid rgba(129,140,248,0.4)"
                  : i === steps.length - 1 && engine !== "none"
                    ? "1px solid rgba(249,115,22,0.3)"
                    : "1px solid rgba(167,139,250,0.3)",
              color:
                i === 0
                  ? "#818CF8"
                  : i === steps.length - 1 && engine !== "none"
                    ? "#FB923C"
                    : "#A78BFA",
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* ── STEP 1 ── */}
      <div
        style={{
          padding: "20px",
          borderRadius: "10px",
          background: "rgba(129,140,248,0.04)",
          border: "1px solid rgba(129,140,248,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <CsPreQual
          values={preQual}
          tierName={tier}
          tierPrice={tierPrice}
          disabled={submitting}
          onChange={handlePreQual}
        />
        <CsIdentity
          values={identity}
          disabled={submitting}
          onChange={handleIdentity}
        />
        <CsHero values={hero} disabled={submitting} onChange={handleHero} />
        <CsAboutServices
          values={about}
          disabled={submitting}
          onChange={handleAbout}
        />
        <CsTrustContact
          values={trust}
          disabled={submitting}
          onChange={handleTrust}
        />
        <CsSeoSocial values={seo} disabled={submitting} onChange={handleSeo} />
      </div>

      {/* ── STEP 2 ── */}
      {showStep2 && (
        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            background: "rgba(167,139,250,0.04)",
            border: "1px solid rgba(167,139,250,0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <CsSitemap
            values={sitemap}
            disabled={submitting}
            onChange={handleSitemap}
          />
          <CsServicePages
            values={servicePages}
            disabled={submitting}
            onChange={handleServicePages}
          />
          <CsSeoComp
            values={seoComp}
            disabled={submitting}
            onChange={handleSeoComp}
          />
          <CsGallery
            values={gallery}
            disabled={submitting}
            onChange={handleGallery}
          />
          <CsTeam values={team} disabled={submitting} onChange={handleTeam} />
          <CsLocalSeo
            values={localSeo}
            disabled={submitting}
            onChange={handleLocalSeo}
          />
          <CsReviewsBlog
            values={reviewsBlog}
            disabled={submitting}
            onChange={handleReviewsBlog}
          />
        </div>
      )}

      {/* ── STEP 3A ── */}
      {engine === "booking" && (
        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            background: "rgba(244,114,182,0.04)",
            border: "1px solid rgba(244,114,182,0.15)",
          }}
        >
          <CsBookingEngine
            values={bookingEngine}
            disabled={submitting}
            onChange={handleBookingEngine}
          />
        </div>
      )}

      {/* ── STEP 3B ── */}
      {engine === "restaurant" && (
        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            background: "rgba(249,115,22,0.04)",
            border: "1px solid rgba(249,115,22,0.15)",
          }}
        >
          <CsRestaurantEngine
            values={restaurantEngine}
            disabled={submitting}
            onChange={handleRestaurantEngine}
          />
        </div>
      )}

      {/* ── STEP 4A: Digital Storefront ── */}
      {showStep4a && (
        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            background: "rgba(16,185,129,0.04)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderLeft: "3px solid #10B981",
          }}
        >
          <CsDigitalStorefront
            state={dsState}
            disabled={submitting}
            onChange={handleDigitalStorefront}
          />
        </div>
      )}

      {/* ── STEP 4B: Restaurant Empire ── */}
      {showStep4b && (
        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            background: "rgba(251,146,60,0.04)",
            border: "1px solid rgba(251,146,60,0.2)",
            borderLeft: "3px solid #FB923C",
          }}
        >
          <CsRestaurantEmpire
            state={reState}
            disabled={submitting}
            onChange={handleRestaurantEmpire}
          />
        </div>
      )}

      {/* ── STEP 4C: Membership Engine ── */}
      {showStep4c && (
        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            background: "rgba(167,139,250,0.04)",
            border: "1px solid rgba(167,139,250,0.2)",
            borderLeft: "3px solid #A78BFA",
          }}
        >
          <CsMembershipEngine
            state={meState}
            disabled={submitting}
            onChange={handleMembershipEngine}
          />
        </div>
      )}

      {/* ── STEP 5: Enterprise Scale ── */}
      {showStep5 && (
        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            background: "rgba(234,179,8,0.04)",
            border: "1px solid rgba(234,179,8,0.2)",
            borderLeft: "3px solid #EAB308",
          }}
        >
          <CsEnterprise
            state={entState}
            disabled={submitting}
            onChange={handleEnterprise}
          />
        </div>
      )}

      {/* Error */}
      {submitError && (
        <p
          data-ocid="custom-brief.error"
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#F87171",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "6px",
            padding: "10px 14px",
          }}
        >
          {submitError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        data-ocid="custom-brief.submit"
        disabled={submitting || !actor}
        style={{
          alignSelf: "flex-start",
          padding: "13px 32px",
          borderRadius: "8px",
          background: submitting ? "rgba(129,140,248,0.4)" : "#818CF8",
          color: "#0A0B14",
          fontWeight: 700,
          fontSize: "14px",
          border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "opacity 0.15s",
        }}
      >
        {submitting ? (
          <>
            <span
              style={{
                width: "14px",
                height: "14px",
                border: "2px solid rgba(10,11,20,0.4)",
                borderTopColor: "#0A0B14",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
            Submitting…
          </>
        ) : (
          "Submit My Custom Site Brief"
        )}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main component — pure dispatcher, no hooks of its own
// ---------------------------------------------------------------------------
export default function SiteBriefQuestionnaire({
  serviceType,
  serviceName,
  userEmail,
  clientName,
  productTier,
  onSubmitSuccess,
}: Props) {
  if (serviceType === "speedy") {
    return (
      <SpeedySiteBrief
        productTier={productTier ?? serviceName}
        userEmail={userEmail}
        clientName={clientName}
        onSubmitSuccess={onSubmitSuccess}
      />
    );
  }
  return (
    <CustomSiteBrief
      productTier={productTier ?? serviceName}
      userEmail={userEmail}
      clientName={clientName}
      onSubmitSuccess={onSubmitSuccess}
    />
  );
}
