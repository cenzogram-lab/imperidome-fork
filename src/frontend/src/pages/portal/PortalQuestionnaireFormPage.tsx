import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  Order,
  QuestionDefinition,
  Questionnaire,
  backendInterface,
} from "../../backend";
import { useActor } from "../../hooks/useActor";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface QuestionnaireAnswers {
  businessName: string;
  industry: string;
  primaryGoal: string;
  pages: string[];
  launchDate: string;
}

const PAGES_OPTIONS = [
  "Home",
  "About",
  "Services",
  "Contact",
  "Blog",
  "Other",
] as const;

const TOTAL_STEPS = 5;

function emptyAnswers(): QuestionnaireAnswers {
  return {
    businessName: "",
    industry: "",
    primaryGoal: "",
    pages: [],
    launchDate: "",
  };
}

function calcProgress(answers: QuestionnaireAnswers): number {
  let filled = 0;
  if (answers.businessName.trim()) filled++;
  if (answers.industry.trim()) filled++;
  if (answers.primaryGoal.trim()) filled++;
  if (answers.pages.length > 0) filled++;
  if (answers.launchDate.trim()) filled++;
  return Math.round((filled / TOTAL_STEPS) * 100);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "#E2E8F0",
        borderRadius: "6px",
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Dynamic field renderer for a single QuestionDefinition
// ---------------------------------------------------------------------------
interface DynamicFieldProps {
  question: QuestionDefinition;
  value: string | string[];
  onChange: (id: string, value: string | string[]) => void;
  fieldError?: string;
  disabled?: boolean;
}

function DynamicField({
  question,
  value,
  onChange,
  fieldError,
  disabled,
}: DynamicFieldProps) {
  const { id, questionLabel, placeholder, inputType, options, required } =
    question;

  const labelEl = (
    <label
      htmlFor={`dyn-${id}`}
      style={{
        display: "block",
        fontSize: "17px",
        fontWeight: 700,
        color: "#EEF0F8",
        marginBottom: "16px",
      }}
    >
      {questionLabel}
      {required && (
        <span
          style={{ color: "#F87171", marginLeft: "4px" }}
          aria-hidden="true"
        >
          *
        </span>
      )}
    </label>
  );

  const errorEl = fieldError ? (
    <div
      data-ocid="questionnaires.field.error_state"
      style={{ marginTop: "6px", fontSize: "13px", color: "#F87171" }}
    >
      {fieldError}
    </div>
  ) : null;

  if (inputType === "text") {
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        {labelEl}
        <input
          id={`dyn-${id}`}
          type="text"
          className="form-input"
          data-ocid={`questionnaires.dyn-${id}.input`}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(id, e.target.value)}
        />
        {errorEl}
      </div>
    );
  }

  if (inputType === "textarea") {
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        {labelEl}
        <textarea
          id={`dyn-${id}`}
          className="form-input"
          data-ocid={`questionnaires.dyn-${id}.textarea`}
          rows={4}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "15px",
            color: "#EEF0F8",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
            background: "rgba(14,16,32,0.9)",
            resize: "vertical",
          }}
          onChange={(e) => onChange(id, e.target.value)}
        />
        {errorEl}
      </div>
    );
  }

  if (inputType === "date") {
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        {labelEl}
        <input
          id={`dyn-${id}`}
          type="date"
          className="form-input"
          data-ocid={`questionnaires.dyn-${id}.input`}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          style={{ maxWidth: "280px" }}
          onChange={(e) => onChange(id, e.target.value)}
        />
        {errorEl}
      </div>
    );
  }

  if (inputType === "select") {
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        {labelEl}
        <select
          id={`dyn-${id}`}
          className="form-input"
          data-ocid={`questionnaires.dyn-${id}.select`}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          style={{ cursor: "pointer", appearance: "none" }}
          onChange={(e) => onChange(id, e.target.value)}
        >
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errorEl}
      </div>
    );
  }

  if (inputType === "checkbox") {
    const selected: string[] = Array.isArray(value) ? value : [];
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        <p
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#EEF0F8",
            margin: "0 0 16px",
          }}
        >
          {questionLabel}
          {required && (
            <span
              style={{ color: "#F87171", marginLeft: "4px" }}
              aria-hidden="true"
            >
              *
            </span>
          )}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`checkbox-label${checked ? " checked" : ""}`}
                data-ocid={`questionnaires.dyn-${id}.${opt.toLowerCase().replace(/\s+/g, "-")}.checkbox`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((v) => v !== opt)
                      : [...selected, opt];
                    onChange(id, next);
                  }}
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                    accentColor: "#39FF14",
                    flexShrink: 0,
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
        {errorEl}
      </div>
    );
  }

  // Fallback: render as text
  return (
    <div data-ocid={`questionnaires.dyn-${id}.panel`}>
      {labelEl}
      <input
        id={`dyn-${id}`}
        type="text"
        className="form-input"
        data-ocid={`questionnaires.dyn-${id}.input`}
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(id, e.target.value)}
      />
      {errorEl}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PortalQuestionnaireFormPage() {
  const params = useParams({ strict: false }) as { orderId?: string };
  const orderId = params.orderId ?? "";
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();

  // tierCode is derived from the matched questionnaire or order record
  const [tierCode, setTierCode] = useState<string>("");
  const [questionnaire, setQuestionnaire] = useState<
    Questionnaire | null | undefined
  >(undefined);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(emptyAnswers());
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Dynamic questions state
  // null = not fetched yet, [] = fetched but empty (use hardcoded fallback)
  const [dynamicQuestions, setDynamicQuestions] = useState<
    QuestionDefinition[] | null
  >(null);
  const [dynamicAnswers, setDynamicAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Load existing questionnaire (if any) and order tier_code
  useEffect(() => {
    if (!actor || isFetching || !orderId) return;
    let cancelled = false;
    async function load() {
      try {
        const [qs, ords] = await Promise.all([
          actor!.getMyQuestionnaires(),
          actor!.getMyOrders(),
        ]);
        if (cancelled) return;

        const matched = qs.find((q) => String(q.order_id) === orderId) ?? null;
        setQuestionnaire(matched);

        let code = matched?.tier_code ?? "";
        if (!code) {
          const order: Order | undefined = ords.find(
            (o) => String(o.id) === orderId,
          );
          code = order?.tier_code ?? "";
        }
        setTierCode(code);

        if (matched?.answers && !matched.submitted) {
          try {
            const parsed = JSON.parse(matched.answers) as QuestionnaireAnswers;
            setAnswers(parsed);
          } catch {
            // ignore parse error — keep empty
          }
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, orderId]);

  // Fetch dynamic question definitions once tierCode is known
  useEffect(() => {
    if (!actor || isFetching || !tierCode) return;
    let cancelled = false;
    async function fetchQuestions() {
      setIsLoadingQuestions(true);
      try {
        const defs = await (actor as backendInterface).getQuestionDefinitions(
          tierCode,
        );
        if (cancelled) return;
        const sorted = [...defs].sort(
          (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
        );
        if (sorted.length === 0) {
          console.info(
            `[PortalQuestionnaireFormPage] No dynamic questions for "${tierCode}". Using hardcoded fallback.`,
          );
        }
        setDynamicQuestions(sorted);
        if (sorted.length > 0) {
          // Initialize dynamic answer slots
          const init: Record<string, string | string[]> = {};
          for (const q of sorted) {
            init[q.id] = q.inputType === "checkbox" ? [] : "";
          }
          setDynamicAnswers(init);
        }
      } catch {
        if (!cancelled) {
          console.warn(
            "[PortalQuestionnaireFormPage] Failed to fetch dynamic questions. Using hardcoded fallback.",
          );
          setDynamicQuestions([]);
        }
      } finally {
        if (!cancelled) setIsLoadingQuestions(false);
      }
    }
    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, tierCode]);

  const isLoading =
    isFetching ||
    isLoadingQuestions ||
    (questionnaire === undefined && !loadError && !!orderId);

  // Use dynamic questions when backend returned a non-empty array
  const useDynamic = dynamicQuestions !== null && dynamicQuestions.length > 0;
  const totalStepsDisplay = useDynamic ? dynamicQuestions!.length : TOTAL_STEPS;

  // ---------------------------------------------------------------------------
  // Dynamic answers handler
  // ---------------------------------------------------------------------------
  function handleDynamicChange(id: string, value: string | string[]) {
    setDynamicAnswers((prev) => ({ ...prev, [id]: value }));
    if (fieldErrors[id]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------
  function handleNext() {
    if (currentStep < totalStepsDisplay) {
      setCurrentStep((s) => s + 1);
    }
  }

  // ---------------------------------------------------------------------------
  // Submit — dynamic path
  // ---------------------------------------------------------------------------
  async function handleDynamicSubmit() {
    if (!actor || !dynamicQuestions) return;

    const errors: Record<string, string> = {};
    for (const q of dynamicQuestions) {
      if (!q.required) continue;
      const val = dynamicAnswers[q.id];
      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === "string" && !val.trim()) ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) {
        errors[q.id] = `"${q.questionLabel}" is required.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError("Please fill in all required fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Serialize checkbox arrays to comma-separated strings
      const serialized: Record<string, string> = {};
      for (const [key, val] of Object.entries(dynamicAnswers)) {
        serialized[key] = Array.isArray(val) ? val.join(", ") : val;
      }

      const result = await (actor as backendInterface).submitQuestionnaire(
        tierCode,
        JSON.stringify(serialized),
      );
      void result;
      setSubmitted(true);
    } catch {
      setSubmitError(
        "Something went wrong during submission. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Submit — hardcoded fallback path (original logic, unchanged)
  // ---------------------------------------------------------------------------
  async function handleHardcodedSubmit() {
    if (!actor) return;

    const missing: string[] = [];
    if (!answers.businessName.trim()) missing.push("Business Name");
    if (!answers.industry.trim()) missing.push("Industry or Business Type");
    if (!answers.primaryGoal.trim()) missing.push("Primary Goal");
    if (answers.pages.length === 0) missing.push("Pages You Need");
    if (!answers.launchDate.trim()) missing.push("Preferred Launch Date");

    if (missing.length > 0) {
      setSubmitError(
        `Please fill in all required fields before submitting: ${missing.join(", ")}.`,
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await (actor as backendInterface).submitQuestionnaire(
        tierCode,
        JSON.stringify(answers),
      );
      void result;
      setSubmitted(true);
    } catch {
      setSubmitError(
        "Something went wrong during submission. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (useDynamic) {
      await handleDynamicSubmit();
    } else {
      await handleHardcodedSubmit();
    }
  }

  const progress = useDynamic
    ? Math.round((currentStep / totalStepsDisplay) * 100)
    : calcProgress(answers);

  // ---------------------------------------------------------------------------
  // Submitted success screen
  // ---------------------------------------------------------------------------
  if (submitted) {
    return (
      <PortalLayout pageTitle="Questionnaire">
        <div
          data-ocid="questionnaires.success_state"
          style={{
            background: "rgba(14,16,32,1)",
            borderRadius: "12px",
            padding: "48px 24px",
            border: "1px solid #39FF14",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <CheckCircle size={48} color="#39FF14" />
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            Questionnaire Submitted!
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#7A7D90",
              maxWidth: "460px",
              lineHeight: "1.6",
            }}
          >
            We received your intake form. Your build is now in queue. Expect
            your first draft within your delivery window.
          </p>
          <button
            type="button"
            data-ocid="questionnaires.back-to-questionnaires.button"
            onClick={() => navigate({ to: "/portal/questionnaires" as any })}
            style={{
              marginTop: "8px",
              padding: "10px 24px",
              borderRadius: "8px",
              background: "#39FF14",
              color: "#061209",
              fontWeight: 700,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to Questionnaires
          </button>
        </div>
      </PortalLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PortalLayout pageTitle="Questionnaire">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 15px;
          color: #EEF0F8;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          background: rgba(14,16,32,0.9);
        }
        .form-input:focus {
          border-color: #39FF14;
          box-shadow: 0 0 0 3px rgba(57,255,20,0.12);
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          font-size: 15px;
          color: #EEF0F8;
          font-weight: 500;
          transition: background 0.15s, border-color 0.15s;
          user-select: none;
          background: rgba(14,16,32,0.6);
        }
        .checkbox-label:hover {
          background: rgba(57,255,20,0.06);
          border-color: rgba(57,255,20,0.4);
        }
        .checkbox-label.checked {
          background: rgba(57,255,20,0.08);
          border-color: #39FF14;
        }
      `}</style>

      <div style={{ maxWidth: "640px" }}>
        {/* Back link */}
        <button
          type="button"
          data-ocid="questionnaires.back.button"
          onClick={() => navigate({ to: "/portal/questionnaires" as any })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            color: "#7A7D90",
            fontSize: "14px",
            cursor: "pointer",
            padding: 0,
            marginBottom: "24px",
          }}
        >
          <ArrowLeft size={16} />
          Back to Questionnaires
        </button>

        {/* Tier name label */}
        {!isLoading && !loadError && tierCode && (
          <div
            data-ocid="questionnaires.tier.label"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(57,255,20,0.08)",
              border: "1px solid rgba(57,255,20,0.3)",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#39FF14",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              {tierCode} Brief
            </span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div
            style={{
              background: "rgba(17,19,34,0.7)",
              borderRadius: "8px",
              padding: "32px",
              border: "1px solid #1C1F33",
            }}
            data-ocid="questionnaires.form.loading_state"
          >
            <Skeleton
              style={{ height: "16px", width: "160px", marginBottom: "24px" }}
            />
            <Skeleton
              style={{ height: "24px", width: "300px", marginBottom: "12px" }}
            />
            <Skeleton style={{ height: "44px", width: "100%" }} />
          </div>
        )}

        {/* Error */}
        {loadError && (
          <div
            data-ocid="questionnaires.form.error_state"
            style={{
              background: "rgba(153,27,27,0.15)",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid rgba(153,27,27,0.4)",
              color: "#FCA5A5",
              fontSize: "14px",
            }}
          >
            Could not load questionnaire data. Please go back and try again.
          </div>
        )}

        {/* Form */}
        {!isLoading && !loadError && (
          <div
            style={{
              background: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              borderRadius: "12px",
              border: "1px solid #1C1F33",
              overflow: "hidden",
            }}
            data-ocid="questionnaires.form.panel"
          >
            {/* Header */}
            <div
              style={{
                padding: "24px 28px 20px",
                borderBottom: "1px solid #1C1F33",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#7A7D90",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Question {currentStep} of {totalStepsDisplay}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#39FF14",
                    fontWeight: 700,
                  }}
                >
                  {progress}% complete
                </span>
              </div>
              {/* Progress bar */}
              <div
                style={{
                  height: "6px",
                  width: "100%",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(currentStep / totalStepsDisplay) * 100}%`,
                    background: "#39FF14",
                    borderRadius: "999px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>

            {/* Question content */}
            <div style={{ padding: "28px" }}>
              {/* ── DYNAMIC QUESTIONS (when backend has questions configured) ── */}
              {useDynamic && dynamicQuestions![currentStep - 1] && (
                <DynamicField
                  question={dynamicQuestions![currentStep - 1]}
                  value={
                    dynamicAnswers[dynamicQuestions![currentStep - 1].id] ??
                    (dynamicQuestions![currentStep - 1].inputType === "checkbox"
                      ? []
                      : "")
                  }
                  onChange={handleDynamicChange}
                  fieldError={
                    fieldErrors[dynamicQuestions![currentStep - 1].id]
                  }
                  disabled={isSubmitting}
                />
              )}

              {/* ── HARDCODED FALLBACK (when backend returns empty for this tier) ── */}
              {!useDynamic && (
                <>
                  {/* Step 1 — Business Name */}
                  {currentStep === 1 && (
                    <div data-ocid="questionnaires.step1.panel">
                      <label
                        htmlFor="businessName"
                        style={{
                          display: "block",
                          fontSize: "17px",
                          fontWeight: 700,
                          color: "#EEF0F8",
                          marginBottom: "16px",
                        }}
                      >
                        Business Name
                      </label>
                      <input
                        id="businessName"
                        type="text"
                        className="form-input"
                        data-ocid="questionnaires.businessname.input"
                        value={answers.businessName}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            businessName: e.target.value,
                          }))
                        }
                        placeholder="Enter your business name"
                      />
                    </div>
                  )}

                  {/* Step 2 — Industry */}
                  {currentStep === 2 && (
                    <div data-ocid="questionnaires.step2.panel">
                      <label
                        htmlFor="industry"
                        style={{
                          display: "block",
                          fontSize: "17px",
                          fontWeight: 700,
                          color: "#EEF0F8",
                          marginBottom: "16px",
                        }}
                      >
                        Industry or Business Type
                      </label>
                      <input
                        id="industry"
                        type="text"
                        className="form-input"
                        data-ocid="questionnaires.industry.input"
                        value={answers.industry}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            industry: e.target.value,
                          }))
                        }
                        placeholder="e.g. Restaurant, Law Firm, E-commerce"
                      />
                    </div>
                  )}

                  {/* Step 3 — Primary Goal */}
                  {currentStep === 3 && (
                    <div data-ocid="questionnaires.step3.panel">
                      <label
                        htmlFor="primaryGoal"
                        style={{
                          display: "block",
                          fontSize: "17px",
                          fontWeight: 700,
                          color: "#EEF0F8",
                          marginBottom: "16px",
                        }}
                      >
                        Primary Goal for Your Website
                      </label>
                      <textarea
                        id="primaryGoal"
                        className="form-input"
                        data-ocid="questionnaires.primarygoal.textarea"
                        rows={4}
                        value={answers.primaryGoal}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            primaryGoal: e.target.value,
                          }))
                        }
                        placeholder="Describe the main purpose of your website — e.g. generate leads, sell products, showcase your portfolio"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          fontSize: "15px",
                          color: "#EEF0F8",
                          outline: "none",
                          fontFamily: "inherit",
                          boxSizing: "border-box",
                          background: "rgba(14,16,32,0.9)",
                          resize: "vertical",
                        }}
                      />
                    </div>
                  )}

                  {/* Step 4 — Pages You Need */}
                  {currentStep === 4 && (
                    <div data-ocid="questionnaires.step4.panel">
                      <p
                        style={{
                          fontSize: "17px",
                          fontWeight: 700,
                          color: "#EEF0F8",
                          margin: "0 0 16px",
                        }}
                      >
                        Pages You Need
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {PAGES_OPTIONS.map((page) => {
                          const checked = answers.pages.includes(page);
                          return (
                            <label
                              key={page}
                              className={`checkbox-label${checked ? " checked" : ""}`}
                              data-ocid={`questionnaires.pages.${page.toLowerCase()}.checkbox`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setAnswers((a) => ({
                                    ...a,
                                    pages: checked
                                      ? a.pages.filter((p) => p !== page)
                                      : [...a.pages, page],
                                  }));
                                }}
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  cursor: "pointer",
                                  accentColor: "#39FF14",
                                  flexShrink: 0,
                                }}
                              />
                              {page}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 5 — Launch Date */}
                  {currentStep === 5 && (
                    <div data-ocid="questionnaires.step5.panel">
                      <label
                        htmlFor="launchDate"
                        style={{
                          display: "block",
                          fontSize: "17px",
                          fontWeight: 700,
                          color: "#EEF0F8",
                          marginBottom: "16px",
                        }}
                      >
                        Preferred Launch Date
                      </label>
                      <input
                        id="launchDate"
                        type="date"
                        className="form-input"
                        data-ocid="questionnaires.launchdate.input"
                        value={answers.launchDate}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            launchDate: e.target.value,
                          }))
                        }
                        style={{ maxWidth: "280px" }}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Error */}
              {submitError && (
                <div
                  data-ocid="questionnaires.form.error_state"
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    background: "rgba(153,27,27,0.15)",
                    borderRadius: "8px",
                    color: "#FCA5A5",
                    fontSize: "14px",
                    border: "1px solid rgba(153,27,27,0.4)",
                  }}
                >
                  {submitError}
                </div>
              )}

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "28px",
                  alignItems: "center",
                }}
              >
                {currentStep > 1 && (
                  <button
                    type="button"
                    data-ocid="questionnaires.back-step.button"
                    onClick={() => setCurrentStep((s) => s - 1)}
                    disabled={isSubmitting}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(14,16,32,0.6)",
                      color: "#7A7D90",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>
                )}

                {currentStep < totalStepsDisplay ? (
                  <button
                    type="button"
                    data-ocid="questionnaires.save-continue.button"
                    onClick={handleNext}
                    style={{
                      padding: "10px 24px",
                      minHeight: "44px",
                      background: "#39FF14",
                      color: "#061209",
                      fontWeight: 700,
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    data-ocid="questionnaires.submit.button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      padding: "10px 24px",
                      minHeight: "44px",
                      background: isSubmitting
                        ? "rgba(57,255,20,0.4)"
                        : "#39FF14",
                      color: "#061209",
                      fontWeight: 700,
                      fontSize: "14px",
                      border: "none",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isSubmitting && (
                      <Loader2
                        size={15}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Questionnaire"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
