import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, ClipboardList, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Order, Questionnaire, backendInterface } from "../../backend.d";
import { EditableText } from "../../components/EditableText";
import TypewriterText from "../../components/TypewriterText";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

interface ParsedAnswers {
  businessName: string;
  industry: string;
  primaryGoal: string;
  pages: string[];
  launchDate: string;
}

function parseAnswers(json: string): ParsedAnswers {
  try {
    return JSON.parse(json) as ParsedAnswers;
  } catch {
    return {
      businessName: "",
      industry: "",
      primaryGoal: "",
      pages: [],
      launchDate: "",
    };
  }
}

const LOCKED_STATUSES = new Set<string>([
  "questionnairePending",
  "depositSent",
]);

const PAST_STATUSES = new Set<string>(["live", "cancelled"]);

function formatDate(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

function AnswersModal({
  questionnaire,
  open,
  onClose,
}: { questionnaire: Questionnaire; open: boolean; onClose: () => void }) {
  const answers = parseAnswers(questionnaire.answers);
  const fields: { label: string; value: string | string[] }[] = [
    { label: "Business Name", value: answers.businessName || "—" },
    { label: "Industry or Business Type", value: answers.industry || "—" },
    {
      label: "Primary Goal for Your Website",
      value: answers.primaryGoal || "—",
    },
    {
      label: "Pages You Need",
      value: answers.pages.length > 0 ? answers.pages : ["—"],
    },
    { label: "Preferred Launch Date", value: answers.launchDate || "—" },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        data-ocid="questionnaires.answers.modal"
        style={{
          maxWidth: "520px",
          borderRadius: "12px",
          padding: "32px",
          background: "#0A0B14",
          border: "1px solid rgba(94,240,138,0.3)",
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#5EF08A",
              marginBottom: "4px",
              fontFamily: "monospace",
            }}
          >
            <TypewriterText text="Questionnaire Answers" as="span" speed={40} />
          </DialogTitle>
        </DialogHeader>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "12px",
          }}
        >
          {fields.map((field) => (
            <div key={field.label}>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "11px",
                  color: "#5EF08A",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  fontWeight: 600,
                  fontFamily: "monospace",
                }}
              >
                {field.label}
              </p>
              {Array.isArray(field.value) ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginTop: "2px",
                  }}
                >
                  {field.value.map((v) => (
                    <span key={v} className="matrix-badge">
                      {v}
                    </span>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#EEF0F8",
                    lineHeight: "1.5",
                  }}
                >
                  {field.value as string}
                </p>
              )}
            </div>
          ))}
          <DialogClose asChild>
            <button
              type="button"
              data-ocid="questionnaires.answers.modal.close_button"
              className="matrix-btn-outline"
              style={{ width: "100%", padding: "10px 0", marginTop: "4px" }}
            >
              <EditableText
                textKey="portal.questionnaires.answers-modal.close-btn"
                defaultText="Close"
                as="span"
              />
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type QState = "locked" | "inProgress" | "submitted";

function QuestionnaireStatusCard({
  qState,
  order,
  questionnaire,
  onViewAnswers,
}: {
  qState: QState;
  order: Order | null;
  questionnaire: Questionnaire | null;
  onViewAnswers: () => void;
}) {
  const navigate = useNavigate();

  if (qState === "locked") {
    return (
      <div
        data-ocid="questionnaires.status.card"
        className="matrix-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "12px",
          padding: "32px 24px",
        }}
      >
        <Lock size={32} color="#5EF08A" style={{ opacity: 0.6 }} />
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            color: "#7A7D90",
            maxWidth: "480px",
            lineHeight: "1.6",
          }}
        >
          <EditableText
            textKey="portal.questionnaires.status.locked-message"
            defaultText="Your questionnaire will be unlocked after your deposit is confirmed. You will receive an email with a direct link when it is ready."
            as="span"
          />
        </p>
      </div>
    );
  }

  if (qState === "submitted" && questionnaire) {
    return (
      <div
        data-ocid="questionnaires.status.card"
        className="matrix-card"
        style={{
          border: "1px solid rgba(94,240,138,0.4)",
          padding: "28px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <CheckCircle
            size={32}
            color="#5EF08A"
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div style={{ flex: 1 }}>
            <h3
              style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}
            >
              <TypewriterText
                text="Questionnaire Submitted."
                className="matrix-heading"
                speed={40}
              />
            </h3>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "14px",
                color: "#7A7D90",
                lineHeight: "1.6",
              }}
            >
              <EditableText
                textKey="portal.questionnaires.status.submitted-body"
                defaultText="We received your intake form. Your build is now in queue. Expect your first draft within your delivery window."
                as="span"
              />
            </p>
            {questionnaire.submitted_at && (
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "12px",
                  color: "#5EF08A",
                  fontFamily: "monospace",
                }}
              >
                Submitted on {formatDate(questionnaire.submitted_at)}
              </p>
            )}
            <button
              type="button"
              data-ocid="questionnaires.view-answers.button"
              onClick={onViewAnswers}
              className="matrix-btn-outline"
              style={{ padding: "9px 20px" }}
            >
              <EditableText
                textKey="portal.questionnaires.view-answers.btn"
                defaultText="View Your Answers"
                as="span"
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (qState === "inProgress" && order && questionnaire) {
    const progress = Number(questionnaire.progress);
    let totalQuestions = 5;
    try {
      const parsed: unknown = JSON.parse(questionnaire.answers);
      if (Array.isArray(parsed)) {
        totalQuestions = parsed.length || 5;
      } else if (parsed !== null && typeof parsed === "object") {
        const keyCount = Object.keys(parsed as Record<string, unknown>).length;
        if (keyCount > 0) totalQuestions = keyCount;
      }
    } catch {
      /* use default */
    }
    const answeredCount = Math.round((progress / 100) * totalQuestions);
    return (
      <div
        data-ocid="questionnaires.status.card"
        className="matrix-card"
        style={{
          border: "1px solid rgba(94,240,138,0.3)",
          padding: "28px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <ClipboardList
            size={32}
            color="#5EF08A"
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div style={{ flex: 1 }}>
            {questionnaire.tier_code && (
              <div
                data-ocid="questionnaires.tier.label"
                className="matrix-badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                {questionnaire.tier_code} Brief
              </div>
            )}
            <h3
              style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}
            >
              <TypewriterText
                text="Your Questionnaire Is Ready."
                className="matrix-heading"
                speed={40}
              />
            </h3>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "14px",
                color: "#7A7D90",
                lineHeight: "1.6",
              }}
            >
              <EditableText
                textKey="portal.questionnaires.status.in-progress-body"
                defaultText="Complete your intake form to start your build. The more detail you provide, the better your site."
                as="span"
              />
            </p>
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#7A7D90",
                    fontWeight: 600,
                  }}
                >
                  {answeredCount} of {totalQuestions} questions answered
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#5EF08A",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  {progress}%
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  width: "100%",
                  background: "#1C1F33",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "#5EF08A",
                    borderRadius: "999px",
                    transition: "width 0.5s ease",
                    boxShadow: "0 0 8px rgba(94,240,138,0.5)",
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              data-ocid="questionnaires.continue.button"
              onClick={() =>
                navigate({
                  to: `/portal/questionnaires/${String(order.id)}`,
                })
              }
              className="matrix-btn"
              style={{
                display: "block",
                width: "100%",
                padding: "11px 28px",
                minHeight: "44px",
              }}
            >
              <EditableText
                textKey="portal.questionnaires.continue-btn"
                defaultText="Continue Questionnaire"
                as="span"
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (qState === "inProgress" && order && !questionnaire) {
    return (
      <div
        data-ocid="questionnaires.status.card"
        className="matrix-card"
        style={{
          border: "1px solid rgba(94,240,138,0.3)",
          padding: "28px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <ClipboardList
            size={32}
            color="#5EF08A"
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div style={{ flex: 1 }}>
            {order.tier_code && (
              <div
                data-ocid="questionnaires.tier.label"
                className="matrix-badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                {order.tier_code} Brief
              </div>
            )}
            <h3
              style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}
            >
              <TypewriterText
                text="Your Questionnaire Is Ready."
                className="matrix-heading"
                speed={40}
              />
            </h3>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: "14px",
                color: "#7A7D90",
                lineHeight: "1.6",
              }}
            >
              <EditableText
                textKey="portal.questionnaires.status.ready-body"
                defaultText="Complete your intake form to start your build. The more detail you provide, the better your site."
                as="span"
              />
            </p>
            <button
              type="button"
              data-ocid="questionnaires.start.button"
              onClick={() =>
                navigate({
                  to: `/portal/questionnaires/${String(order.id)}`,
                })
              }
              className="matrix-btn"
              style={{
                display: "block",
                width: "100%",
                padding: "11px 28px",
                minHeight: "44px",
              }}
            >
              <EditableText
                textKey="portal.questionnaires.start-btn"
                defaultText="Start Questionnaire"
                as="span"
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function PortalQuestionnairesPage() {
  const { session } = useSession();
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();
  const [orders, setOrders] = useState<Order[] | undefined>(undefined);
  const [questionnaires, setQuestionnaires] = useState<
    Questionnaire[] | undefined
  >(undefined);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalQuestionnaire, setModalQuestionnaire] =
    useState<Questionnaire | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is an intentional re-trigger token
  useEffect(() => {
    if (!actor || !userEmail || isFetching) return;
    let cancelled = false;
    async function load() {
      try {
        const [ords, qs] = await Promise.all([
          (actor as backendInterface).getMyOrders(),
          (actor as backendInterface).getMyQuestionnaires(),
        ]);
        if (!cancelled) {
          setOrders(ords);
          setQuestionnaires(qs);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, userEmail, refreshKey]);

  const isLoading =
    isFetching ||
    (orders === undefined && questionnaires === undefined && !loadError);

  let activeOrder: Order | null = null;
  if (orders) {
    const active = orders.filter((o) => {
      const statusKey =
        typeof o.status === "object" && o.status !== null
          ? (Object.keys(o.status as Record<string, unknown>)[0] ??
            String(o.status))
          : String(o.status);
      return !PAST_STATUSES.has(statusKey);
    });
    if (active.length > 0) {
      active.sort(
        (a, b) =>
          b.created_at > a.created_at
            ? 1
            : b.created_at < a.created_at
              ? -1
              : 0, // AGENTS.md: newest-first, b > a ? 1
      );
      activeOrder = active[0];
    }
  }

  const activeQuestionnaire =
    questionnaires?.find((q) => activeOrder && q.order_id === activeOrder.id) ??
    null;

  let qState: QState = "locked";
  if (activeQuestionnaire?.submitted) {
    qState = "submitted";
  } else if (
    activeOrder &&
    !LOCKED_STATUSES.has(
      typeof activeOrder.status === "object" && activeOrder.status !== null
        ? (Object.keys(activeOrder.status as Record<string, unknown>)[0] ??
            String(activeOrder.status))
        : String(activeOrder.status),
    )
  ) {
    qState = "inProgress";
  }

  // Use !!q.submitted to handle both boolean true and 0/1 serialization from backend
  const pastQuestionnaires = (questionnaires ?? []).filter(
    (q) => !!q.submitted,
  );

  return (
    <PortalLayout pageTitle="Questionnaires">
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes typewriter-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .view-link:hover { color: #39FF14 !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {isLoading && (
          <div
            data-ocid="questionnaires.loading_state"
            className="matrix-card"
            style={{ padding: "24px" }}
          >
            <Skeleton
              style={{ height: "22px", width: "240px", marginBottom: "16px" }}
            />
            <Skeleton
              style={{ height: "16px", width: "360px", marginBottom: "10px" }}
            />
            <Skeleton style={{ height: "16px", width: "280px" }} />
          </div>
        )}

        {!isLoading && loadError && (
          <div
            data-ocid="questionnaires.error_state"
            className="matrix-card"
            style={{
              color: "#EF4444",
              fontSize: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <EditableText
              textKey="portal.questionnaires.error-state"
              defaultText="Could not load questionnaire data. Please refresh."
              as="span"
            />
            <button
              type="button"
              data-ocid="questionnaires.error_state.retry_button"
              onClick={() => {
                setLoadError(false);
                setOrders(undefined);
                setQuestionnaires(undefined);
                setRefreshKey((k) => k + 1);
              }}
              className="matrix-btn-outline"
              style={{
                padding: "8px 20px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !loadError && (
          <QuestionnaireStatusCard
            qState={qState}
            order={activeOrder}
            questionnaire={activeQuestionnaire}
            onViewAnswers={() =>
              activeQuestionnaire && setModalQuestionnaire(activeQuestionnaire)
            }
          />
        )}

        {!isLoading && !loadError && (
          <div
            data-ocid="questionnaires.past.panel"
            className="matrix-card"
            style={{ padding: "24px" }}
          >
            <h3 style={{ margin: "0 0 20px" }}>
              <TypewriterText
                text="Past Questionnaires"
                className="matrix-heading"
                style={{ fontSize: "16px", fontWeight: 700 }}
                speed={45}
              />
            </h3>

            {pastQuestionnaires.length === 0 ? (
              <p
                data-ocid="questionnaires.past.empty_state"
                style={{ margin: 0, fontSize: "14px", color: "#7A7D90" }}
              >
                <EditableText
                  textKey="portal.questionnaires.past.empty-state"
                  defaultText="No past questionnaires yet."
                  as="span"
                />
              </p>
            ) : (
              <>
                <div
                  className="hidden md:block"
                  data-ocid="questionnaires.past.table"
                >
                  <div style={{ overflowX: "auto" }}>
                    <table className="matrix-table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          {["Project", "Submitted Date", "View"].map((h) => (
                            <th key={h}>
                              <TypewriterText text={h} as="span" speed={40} />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pastQuestionnaires.map((q, idx) => (
                          <tr
                            key={String(q.id)}
                            data-ocid={`questionnaires.past.row.${idx + 1}`}
                            style={{
                              animation:
                                "typewriter-fade-in 0.4s ease forwards",
                            }}
                          >
                            <td style={{ fontWeight: 600, color: "#EEF0F8" }}>
                              {q.tier_code}
                            </td>
                            <td
                              style={{
                                color: "#7A7D90",
                                fontFamily: "monospace",
                              }}
                            >
                              {q.submitted_at
                                ? formatDate(q.submitted_at)
                                : "—"}
                            </td>
                            <td>
                              <button
                                type="button"
                                data-ocid={`questionnaires.past.view.button.${idx + 1}`}
                                className="view-link"
                                onClick={() => setModalQuestionnaire(q)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#5EF08A",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                <EditableText
                                  textKey="portal.questionnaires.past.view-btn-label"
                                  defaultText="View"
                                  as="span"
                                />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div
                  className="md:hidden"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {pastQuestionnaires.map((q, idx) => (
                    <div
                      key={String(q.id)}
                      data-ocid={`questionnaires.past.row.${idx + 1}`}
                      className="matrix-card"
                      style={{
                        padding: "16px",
                        animation: "typewriter-fade-in 0.4s ease forwards",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: "12px",
                          color: "#5EF08A",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          fontFamily: "monospace",
                        }}
                      >
                        Project
                      </p>
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#EEF0F8",
                        }}
                      >
                        {q.tier_code}
                      </p>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: "12px",
                          color: "#5EF08A",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          fontFamily: "monospace",
                        }}
                      >
                        Submitted
                      </p>
                      <p
                        style={{
                          margin: "0 0 12px",
                          fontSize: "14px",
                          color: "#7A7D90",
                          fontFamily: "monospace",
                        }}
                      >
                        {q.submitted_at ? formatDate(q.submitted_at) : "—"}
                      </p>
                      <button
                        type="button"
                        data-ocid={`questionnaires.past.view.button.${idx + 1}`}
                        onClick={() => setModalQuestionnaire(q)}
                        className="matrix-btn-outline"
                        style={{ width: "100%", padding: "8px 0" }}
                      >
                        <EditableText
                          textKey="portal.questionnaires.past.mobile.view-answers-btn"
                          defaultText="View Answers"
                          as="span"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {modalQuestionnaire && (
        <AnswersModal
          questionnaire={modalQuestionnaire}
          open={true}
          onClose={() => setModalQuestionnaire(null)}
        />
      )}
    </PortalLayout>
  );
}
