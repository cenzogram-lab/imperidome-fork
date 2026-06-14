import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type {
  Order,
  QuestionDefinition,
  Questionnaire,
  backendInterface,
} from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

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

function Skeleton({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(94,240,138,0.05)",
        borderRadius: "6px",
        animation: "pulse 1.5s ease-in-out infinite",
        border: "1px solid rgba(94,240,138,0.1)",
        ...style,
      }}
    />
  );
}

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
        marginBottom: "16px",
      }}
    >
      <TypewriterText
        text={questionLabel}
        className="matrix-heading"
        speed={35}
      />
      {required && (
        <span
          style={{ color: "#EF4444", marginLeft: "4px" }}
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
      style={{ marginTop: "6px", fontSize: "13px", color: "#EF4444" }}
    >
      {fieldError}
    </div>
  ) : null;

  if (inputType === "text")
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        {labelEl}
        <input
          id={`dyn-${id}`}
          type="text"
          className="matrix-input"
          data-ocid={`questionnaires.dyn-${id}.input`}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(id, e.target.value)}
        />
        {errorEl}
      </div>
    );

  if (inputType === "textarea")
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        {labelEl}
        <textarea
          id={`dyn-${id}`}
          className="matrix-input"
          data-ocid={`questionnaires.dyn-${id}.textarea`}
          rows={4}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 14px",
            fontFamily: "inherit",
            boxSizing: "border-box",
            resize: "vertical",
          }}
          onChange={(e) => onChange(id, e.target.value)}
        />
        {errorEl}
      </div>
    );

  if (inputType === "date")
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        {labelEl}
        <input
          id={`dyn-${id}`}
          type="date"
          className="matrix-input"
          data-ocid={`questionnaires.dyn-${id}.input`}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          style={{ maxWidth: "280px" }}
          onChange={(e) => onChange(id, e.target.value)}
        />
        {errorEl}
      </div>
    );

  if (inputType === "select")
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        {labelEl}
        <select
          id={`dyn-${id}`}
          className="matrix-input"
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

  if (inputType === "checkbox") {
    const selected: string[] = Array.isArray(value) ? value : [];
    return (
      <div data-ocid={`questionnaires.dyn-${id}.panel`}>
        <p style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 16px" }}>
          <TypewriterText
            text={questionLabel}
            className="matrix-heading"
            speed={35}
          />
          {required && (
            <span
              style={{ color: "#EF4444", marginLeft: "4px" }}
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
                className={`matrix-checkbox-label${checked ? " checked" : ""}`}
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
                    accentColor: "#5EF08A",
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

  return (
    <div data-ocid={`questionnaires.dyn-${id}.panel`}>
      {labelEl}
      <input
        id={`dyn-${id}`}
        type="text"
        className="matrix-input"
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

export default function PortalQuestionnaireFormPage() {
  const params = useParams({ strict: false }) as { orderId?: string };
  const orderId = params.orderId ?? "";
  const navigate = useNavigate();
  const { session } = useSession();
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();

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
  const [dynamicQuestions, setDynamicQuestions] = useState<
    QuestionDefinition[] | null
  >(null);
  const [dynamicAnswers, setDynamicAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  useEffect(() => {
    if (!actor || !userEmail || isFetching || !orderId) return;
    let cancelled = false;
    async function load() {
      try {
        const [qs, ords] = await Promise.all([
          (actor as backendInterface).getMyQuestionnaires(),
          (actor as backendInterface).getMyOrders(),
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
            setSubmitError(
              "Your saved progress could not be loaded. You may need to re-enter your answers.",
            );
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
  }, [actor, isFetching, orderId, userEmail]);

  useEffect(() => {
    if (!actor || !userEmail || isFetching || !tierCode) return;
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
        setDynamicQuestions(sorted);
        if (sorted.length > 0) {
          const init: Record<string, string | string[]> = {};
          for (const q of sorted) {
            init[q.id] = q.inputType === "checkbox" ? [] : "";
          }
          setDynamicAnswers(init);
        }
      } catch {
        if (!cancelled) setDynamicQuestions([]);
      } finally {
        if (!cancelled) setIsLoadingQuestions(false);
      }
    }
    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, tierCode, userEmail]);

  const isLoading =
    isFetching ||
    isLoadingQuestions ||
    (questionnaire === undefined && !loadError && !!orderId);
  const hasUnconfiguredTier =
    dynamicQuestions !== null &&
    dynamicQuestions.length === 0 &&
    !isLoading &&
    !loadError;
  const useDynamic = dynamicQuestions !== null && dynamicQuestions.length > 0;
  const totalStepsDisplay = useDynamic ? dynamicQuestions!.length : TOTAL_STEPS;

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

  function handleNext() {
    if (currentStep < totalStepsDisplay) setCurrentStep((s) => s + 1);
  }

  async function handleDynamicSubmit() {
    if (!actor || !userEmail || !dynamicQuestions) return;
    const errors: Record<string, string> = {};
    for (const q of dynamicQuestions) {
      if (!q.required) continue;
      const val = dynamicAnswers[q.id];
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
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const serialized: Record<string, string> = {};
      for (const [key, val] of Object.entries(dynamicAnswers)) {
        serialized[key] = Array.isArray(val) ? val.join(", ") : val;
      }
      const result = await (actor as backendInterface).submitQuestionnaire(
        tierCode,
        JSON.stringify(serialized),
      );
      if (result === 0n) {
        setSubmitError("Submission failed. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError(
        "Something went wrong during submission. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleHardcodedSubmit() {
    if (!actor || !userEmail) return;
    if (!tierCode || tierCode.trim() === "") {
      setSubmitError(
        "Unable to determine your service tier. Please contact support.",
      );
      return;
    }
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
      if (result === 0n) {
        setSubmitError("Submission failed. Please try again.");
        return;
      }
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

  if (submitted) {
    return (
      <PortalLayout pageTitle="Questionnaire">
        <div
          data-ocid="questionnaires.success_state"
          className="matrix-card"
          style={{
            padding: "48px 24px",
            border: "1px solid rgba(94,240,138,0.5)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 0 24px rgba(94,240,138,0.1)",
          }}
        >
          <CheckCircle size={48} color="#5EF08A" />
          <h2 style={{ margin: 0 }}>
            <TypewriterText
              text="Questionnaire Submitted!"
              className="matrix-heading"
              style={{ fontSize: "22px", fontWeight: 700 }}
              speed={40}
            />
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
            onClick={() => navigate({ to: "/portal/questionnaires" })}
            className="matrix-btn"
            style={{ marginTop: "8px", padding: "10px 24px" }}
          >
            Back to Questionnaires
          </button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout pageTitle="Questionnaire">
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .matrix-input { width: 100%; padding: 10px 14px; min-height: 44px; border: 1px solid rgba(94,240,138,0.2); border-radius: 6px; font-size: 15px; color: #EEF0F8; outline: none; font-family: inherit; box-sizing: border-box; background: rgba(7,8,16,0.8); transition: border-color 0.2s, box-shadow 0.2s; }
        .matrix-input:focus { border-color: #5EF08A; box-shadow: 0 0 0 3px rgba(94,240,138,0.12); }
        .matrix-checkbox-label { display: flex; align-items: center; gap: 10px; padding: 10px 14px; min-height: 44px; border: 1px solid rgba(94,240,138,0.15); border-radius: 6px; cursor: pointer; font-size: 15px; color: #EEF0F8; font-weight: 500; transition: background 0.15s, border-color 0.15s; user-select: none; background: rgba(7,8,16,0.6); }
        .matrix-checkbox-label:hover { background: rgba(94,240,138,0.06); border-color: rgba(94,240,138,0.4); }
        .matrix-checkbox-label.checked { background: rgba(94,240,138,0.08); border-color: #5EF08A; }
      `}</style>

      <div style={{ maxWidth: "640px" }}>
        <button
          type="button"
          data-ocid="questionnaires.back.button"
          onClick={() => navigate({ to: "/portal/questionnaires" })}
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

        {!isLoading && !loadError && tierCode && (
          <div
            data-ocid="questionnaires.tier.label"
            className="matrix-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {tierCode} Brief
          </div>
        )}

        {isLoading && (
          <div
            className="matrix-card"
            style={{ padding: "32px" }}
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

        {loadError && (
          <div
            data-ocid="questionnaires.form.error_state"
            className="matrix-card"
            style={{
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#FCA5A5",
              fontSize: "14px",
              padding: "20px",
            }}
          >
            Could not load questionnaire data. Please go back and try again.
          </div>
        )}

        {!isLoading && !loadError && hasUnconfiguredTier && (
          <div
            data-ocid="questionnaires.form.unconfigured_state"
            className="matrix-card"
            style={{
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#FCA5A5",
              fontSize: "14px",
              padding: "20px",
            }}
          >
            This questionnaire is not yet available. Please contact us for
            assistance.
          </div>
        )}

        {!isLoading && !loadError && !hasUnconfiguredTier && (
          <div
            className="matrix-card"
            style={{ overflow: "hidden" }}
            data-ocid="questionnaires.form.panel"
          >
            <div
              style={{
                padding: "24px 28px 20px",
                borderBottom: "1px solid rgba(94,240,138,0.15)",
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
                    fontFamily: "monospace",
                  }}
                >
                  Question {currentStep} of {totalStepsDisplay}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#5EF08A",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  {progress}% complete
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  width: "100%",
                  background: "rgba(94,240,138,0.1)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(currentStep / totalStepsDisplay) * 100}%`,
                    background: "#5EF08A",
                    borderRadius: "999px",
                    transition: "width 0.4s ease",
                    boxShadow: "0 0 8px rgba(94,240,138,0.5)",
                  }}
                />
              </div>
            </div>

            <div style={{ padding: "28px" }}>
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

              {!useDynamic && (
                <>
                  {currentStep === 1 && (
                    <div data-ocid="questionnaires.step1.panel">
                      <label
                        htmlFor="businessName"
                        aria-label="Business Name"
                        style={{ display: "block", marginBottom: "16px" }}
                      >
                        <TypewriterText
                          text="Business Name"
                          className="matrix-heading"
                          style={{ fontSize: "17px", fontWeight: 700 }}
                          speed={40}
                        />
                      </label>
                      <input
                        id="businessName"
                        type="text"
                        className="matrix-input"
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
                  {currentStep === 2 && (
                    <div data-ocid="questionnaires.step2.panel">
                      <label
                        htmlFor="industry"
                        aria-label="Industry or Business Type"
                        style={{ display: "block", marginBottom: "16px" }}
                      >
                        <TypewriterText
                          text="Industry or Business Type"
                          className="matrix-heading"
                          style={{ fontSize: "17px", fontWeight: 700 }}
                          speed={35}
                        />
                      </label>
                      <input
                        id="industry"
                        type="text"
                        className="matrix-input"
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
                  {currentStep === 3 && (
                    <div data-ocid="questionnaires.step3.panel">
                      <label
                        htmlFor="primaryGoal"
                        aria-label="Primary Goal for Your Website"
                        style={{ display: "block", marginBottom: "16px" }}
                      >
                        <TypewriterText
                          text="Primary Goal for Your Website"
                          className="matrix-heading"
                          style={{ fontSize: "17px", fontWeight: 700 }}
                          speed={35}
                        />
                      </label>
                      <textarea
                        id="primaryGoal"
                        className="matrix-input"
                        data-ocid="questionnaires.primarygoal.textarea"
                        rows={4}
                        value={answers.primaryGoal}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            primaryGoal: e.target.value,
                          }))
                        }
                        placeholder="Describe the main purpose of your website"
                        style={{ resize: "vertical", fontFamily: "inherit" }}
                      />
                    </div>
                  )}
                  {currentStep === 4 && (
                    <div data-ocid="questionnaires.step4.panel">
                      <p style={{ margin: "0 0 16px" }}>
                        <TypewriterText
                          text="Pages You Need"
                          className="matrix-heading"
                          style={{ fontSize: "17px", fontWeight: 700 }}
                          speed={40}
                        />
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
                              className={`matrix-checkbox-label${checked ? " checked" : ""}`}
                              data-ocid={`questionnaires.pages.${page.toLowerCase()}.checkbox`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setAnswers((a) => ({
                                    ...a,
                                    pages: checked
                                      ? a.pages.filter((p) => p !== page)
                                      : [...a.pages, page],
                                  }))
                                }
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  cursor: "pointer",
                                  accentColor: "#5EF08A",
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
                  {currentStep === 5 && (
                    <div data-ocid="questionnaires.step5.panel">
                      <label
                        htmlFor="launchDate"
                        aria-label="Preferred Launch Date"
                        style={{ display: "block", marginBottom: "16px" }}
                      >
                        <TypewriterText
                          text="Preferred Launch Date"
                          className="matrix-heading"
                          style={{ fontSize: "17px", fontWeight: 700 }}
                          speed={38}
                        />
                      </label>
                      <input
                        id="launchDate"
                        type="date"
                        className="matrix-input"
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

              {submitError && (
                <div
                  data-ocid="questionnaires.form.error_state"
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    background: "rgba(239,68,68,0.1)",
                    borderRadius: "8px",
                    color: "#FCA5A5",
                    fontSize: "14px",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                >
                  {submitError}
                </div>
              )}

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
                    className="matrix-btn-outline"
                    style={{
                      padding: "10px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                )}
                {currentStep < totalStepsDisplay ? (
                  <button
                    type="button"
                    data-ocid="questionnaires.save-continue.button"
                    onClick={handleNext}
                    className="matrix-btn"
                    style={{
                      padding: "10px 24px",
                      minHeight: "44px",
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
                    className="matrix-btn"
                    style={{
                      padding: "10px 24px",
                      minHeight: "44px",
                      opacity: isSubmitting ? 0.6 : 1,
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
