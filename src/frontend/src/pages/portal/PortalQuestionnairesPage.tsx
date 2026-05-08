import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, ClipboardList, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import type { Order, Questionnaire } from "../../backend";
import { Status } from "../../backend";
import { EditableText } from "../../components/EditableText";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { useActor } from "../../hooks/useActor";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const LOCKED_STATUSES = new Set<string>([
  Status.questionnairePending,
  Status.depositSent,
]);

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(40,45,70,0.8)",
        borderRadius: "6px",
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Read-Only Answers Modal
// ---------------------------------------------------------------------------
function AnswersModal({
  questionnaire,
  open,
  onClose,
}: {
  questionnaire: Questionnaire;
  open: boolean;
  onClose: () => void;
}) {
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
        style={{ maxWidth: "520px", borderRadius: "12px", padding: "32px" }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#EEF0F8",
              marginBottom: "4px",
            }}
          >
            <EditableText
              textKey="portal.questionnaires.answers-modal.heading"
              defaultText="Questionnaire Answers"
              as="span"
            />
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
                  color: "#7A7D90",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  fontWeight: 600,
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
                    <span
                      key={v}
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: "rgba(14,16,32,1)",
                        color: "#EEF0F8",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
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
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: "8px",
                border: "1px solid #1C1F33",
                background: "rgba(17,19,34,0.7)",
                color: "#EEF0F8",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                marginTop: "4px",
              }}
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

// ---------------------------------------------------------------------------
// Questionnaire Status Card
// ---------------------------------------------------------------------------
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
        style={{
          background: "#0A0B14",
          borderRadius: "8px",
          padding: "32px 24px",
          border: "1px solid #1C1F33",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "12px",
        }}
      >
        <Lock size={32} color="#94A3B8" />
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
        style={{
          background: "#F0FDF4",
          borderRadius: "8px",
          padding: "28px 24px",
          border: "1px solid #BBF7D0",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <CheckCircle
            size={32}
            color="#166534"
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "17px",
                fontWeight: 700,
                color: "#EEF0F8",
              }}
            >
              <EditableText
                textKey="portal.questionnaires.status.submitted-heading"
                defaultText="Questionnaire Submitted."
                as="span"
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
                  color: "#7A7D90",
                }}
              >
                Submitted on {formatDate(questionnaire.submitted_at)}
              </p>
            )}
            <button
              type="button"
              data-ocid="questionnaires.view-answers.button"
              onClick={onViewAnswers}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: "1px solid #1C1F33",
                background: "rgba(17,19,34,0.7)",
                color: "#EEF0F8",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
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

  // IN PROGRESS
  if (qState === "inProgress" && order && questionnaire) {
    const progress = Number(questionnaire.progress);
    const answeredCount = Math.round((progress / 100) * 5);
    return (
      <div
        data-ocid="questionnaires.status.card"
        style={{
          background: "rgba(14,16,32,1)",
          borderRadius: "8px",
          padding: "28px 24px",
          border: "1px solid #BFDBFE",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <ClipboardList
            size={32}
            color="#5EF08A"
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div style={{ flex: 1 }}>
            {/* Tier name label */}
            {questionnaire.tier_code && (
              <div
                data-ocid="questionnaires.tier.label"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  marginBottom: "10px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  background: "rgba(57,255,20,0.08)",
                  border: "1px solid rgba(57,255,20,0.3)",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#39FF14",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  {questionnaire.tier_code} Brief
                </span>
              </div>
            )}
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "17px",
                fontWeight: 700,
                color: "#EEF0F8",
              }}
            >
              <EditableText
                textKey="portal.questionnaires.status.in-progress-heading"
                defaultText="Your Questionnaire Is Ready."
                as="span"
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

            {/* Progress indicator */}
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
                  {answeredCount} of 5 questions answered
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#5EF08A",
                    fontWeight: 700,
                  }}
                >
                  {progress}%
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  width: "100%",
                  background: "#BFDBFE",
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
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              data-ocid="questionnaires.continue.button"
              onClick={() =>
                navigate({
                  to: `/portal/questionnaires/${String(order.id)}` as any,
                })
              }
              style={{
                padding: "11px 28px",
                minHeight: "44px",
                borderRadius: "8px",
                background: "#5EF08A",
                color: "#061209",
                fontWeight: 700,
                fontSize: "15px",
                border: "none",
                cursor: "pointer",
                display: "block",
                width: "100%",
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

  // IN PROGRESS but no questionnaire yet — show unlock state with start button
  if (qState === "inProgress" && order && !questionnaire) {
    return (
      <div
        data-ocid="questionnaires.status.card"
        style={{
          background: "rgba(14,16,32,1)",
          borderRadius: "8px",
          padding: "28px 24px",
          border: "1px solid #BFDBFE",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <ClipboardList
            size={32}
            color="#5EF08A"
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div style={{ flex: 1 }}>
            {/* Tier name label from order */}
            {order.tier_code && (
              <div
                data-ocid="questionnaires.tier.label"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  marginBottom: "10px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  background: "rgba(57,255,20,0.08)",
                  border: "1px solid rgba(57,255,20,0.3)",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#39FF14",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  {order.tier_code} Brief
                </span>
              </div>
            )}
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "17px",
                fontWeight: 700,
                color: "#EEF0F8",
              }}
            >
              <EditableText
                textKey="portal.questionnaires.status.ready-heading"
                defaultText="Your Questionnaire Is Ready."
                as="span"
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
                  to: `/portal/questionnaires/${String(order.id)}` as any,
                })
              }
              style={{
                padding: "11px 28px",
                minHeight: "44px",
                borderRadius: "8px",
                background: "#5EF08A",
                color: "#061209",
                fontWeight: 700,
                fontSize: "15px",
                border: "none",
                cursor: "pointer",
                display: "block",
                width: "100%",
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PortalQuestionnairesPage() {
  const { actor, isFetching } = useActor();
  const [orders, setOrders] = useState<Order[] | undefined>(undefined);
  const [questionnaires, setQuestionnaires] = useState<
    Questionnaire[] | undefined
  >(undefined);
  const [loadError, setLoadError] = useState(false);
  const [modalQuestionnaire, setModalQuestionnaire] =
    useState<Questionnaire | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    async function load() {
      try {
        const [ords, qs] = await Promise.all([
          actor!.getMyOrders(),
          actor!.getMyQuestionnaires(),
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
  }, [actor, isFetching]);

  const isLoading =
    isFetching ||
    (orders === undefined && questionnaires === undefined && !loadError);

  // Determine active order (same logic as projects page)
  let activeOrder: Order | null = null;
  if (orders) {
    const PAST_STATUSES = new Set<string>([Status.live, Status.cancelled]);
    const active = orders.filter((o) => !PAST_STATUSES.has(o.status));
    if (active.length > 0) {
      active.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
      activeOrder = active[0];
    }
  }

  // Find questionnaire for active order
  const activeQuestionnaire =
    questionnaires?.find((q) => activeOrder && q.order_id === activeOrder.id) ??
    null;

  // Determine state
  let qState: QState = "locked";
  if (activeQuestionnaire?.submitted) {
    qState = "submitted";
  } else if (activeOrder && !LOCKED_STATUSES.has(activeOrder.status)) {
    qState = "inProgress";
  }

  // Past questionnaires = all submitted ones (including those for current order)
  const pastQuestionnaires = (questionnaires ?? []).filter((q) => q.submitted);

  const cardStyle: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid #1C1F33",
    width: "100%",
  };

  return (
    <PortalLayout pageTitle="Questionnaires">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .view-link:hover { text-decoration: underline; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Loading */}
        {isLoading && (
          <div data-ocid="questionnaires.loading_state" style={cardStyle}>
            <Skeleton
              style={{ height: "22px", width: "240px", marginBottom: "16px" }}
            />
            <Skeleton
              style={{ height: "16px", width: "360px", marginBottom: "10px" }}
            />
            <Skeleton style={{ height: "16px", width: "280px" }} />
          </div>
        )}

        {/* Error */}
        {!isLoading && loadError && (
          <div
            data-ocid="questionnaires.error_state"
            style={{ ...cardStyle, color: "#991B1B", fontSize: "14px" }}
          >
            <EditableText
              textKey="portal.questionnaires.error-state"
              defaultText="Could not load questionnaire data. Please refresh."
              as="span"
            />
          </div>
        )}

        {/* Status card */}
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

        {/* Past Questionnaires */}
        {!isLoading && !loadError && (
          <div data-ocid="questionnaires.past.panel" style={cardStyle}>
            <h3
              style={{
                margin: "0 0 20px",
                fontSize: "16px",
                fontWeight: 700,
                color: "#EEF0F8",
              }}
            >
              <EditableText
                textKey="portal.questionnaires.past.heading"
                defaultText="Past Questionnaires"
                as="span"
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
                {/* Desktop table */}
                <div
                  className="hidden md:block"
                  data-ocid="questionnaires.past.table"
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                        {["Project", "Submitted Date", "View"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "8px 12px",
                              fontSize: "12px",
                              color: "#7A7D90",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              fontWeight: 600,
                            }}
                          >
                            {h}
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
                            background:
                              idx % 2 === 0
                                ? "rgba(17,19,34,0.7)"
                                : "rgba(14,16,32,0.9)",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#EEF0F8",
                            }}
                          >
                            {q.tier_code}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              fontSize: "14px",
                              color: "#7A7D90",
                            }}
                          >
                            {q.submitted_at ? formatDate(q.submitted_at) : "—"}
                          </td>
                          <td style={{ padding: "12px" }}>
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

                {/* Mobile stacked */}
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
                      style={{
                        background: "#0A0B14",
                        borderRadius: "8px",
                        padding: "16px",
                        border: "1px solid #1C1F33",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: "12px",
                          color: "#7A7D90",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        <EditableText
                          textKey="portal.questionnaires.past.mobile.project-label"
                          defaultText="Project"
                          as="span"
                        />
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
                          color: "#7A7D90",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        <EditableText
                          textKey="portal.questionnaires.past.mobile.submitted-label"
                          defaultText="Submitted"
                          as="span"
                        />
                      </p>
                      <p
                        style={{
                          margin: "0 0 12px",
                          fontSize: "14px",
                          color: "#7A7D90",
                        }}
                      >
                        {q.submitted_at ? formatDate(q.submitted_at) : "—"}
                      </p>
                      <button
                        type="button"
                        data-ocid={`questionnaires.past.view.button.${idx + 1}`}
                        onClick={() => setModalQuestionnaire(q)}
                        style={{
                          width: "100%",
                          padding: "8px 0",
                          borderRadius: "6px",
                          border: "1px solid #5EF08A",
                          background: "rgba(17,19,34,0.7)",
                          color: "#5EF08A",
                          fontWeight: 600,
                          fontSize: "14px",
                          cursor: "pointer",
                        }}
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

      {/* Answers Modal */}
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
