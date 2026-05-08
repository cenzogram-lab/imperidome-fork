import {
  Check,
  DollarSign,
  FileCheck,
  FlaskConical,
  Paintbrush,
  Rocket,
  Wrench,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ProjectTimelineProps {
  currentMilestone: number;
  milestoneUpdatedAt?: number | bigint | null;
}

interface MilestoneStep {
  num: number;
  label: string;
  sublabel: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

// ---------------------------------------------------------------------------
// Milestone definitions
// ---------------------------------------------------------------------------
const MILESTONES: MilestoneStep[] = [
  {
    num: 1,
    label: "Deposit Paid",
    sublabel: "Project secured",
    Icon: DollarSign,
  },
  {
    num: 2,
    label: "Brief Submitted",
    sublabel: "Requirements gathered",
    Icon: FileCheck,
  },
  {
    num: 3,
    label: "Design & Wireframing",
    sublabel: "Phase 1",
    Icon: Paintbrush,
  },
  {
    num: 4,
    label: "Core Development",
    sublabel: "Phase 2",
    Icon: Wrench,
  },
  {
    num: 5,
    label: "QA & Testing",
    sublabel: "Phase 3",
    Icon: FlaskConical,
  },
  {
    num: 6,
    label: "Ready for Launch",
    sublabel: "Going live",
    Icon: Rocket,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatMilestoneDate(
  ts: number | bigint | null | undefined,
): string | null {
  if (ts == null) return null;
  // Backend timestamps are nanoseconds (bigint) or milliseconds (number)
  const ms =
    typeof ts === "bigint"
      ? Number(ts) / 1_000_000
      : ts > 1e12
        ? ts / 1_000_000
        : ts;
  if (!ms || Number.isNaN(ms)) return null;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** The connector line between two step circles */
function Connector({ complete }: { complete: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        flex: 1,
        height: "3px",
        borderRadius: "2px",
        background: complete
          ? "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)"
          : "rgba(107,114,128,0.28)",
        transition: "background 0.4s ease",
        minWidth: "8px",
      }}
    />
  );
}

/** Vertical connector for mobile */
function VerticalConnector({ complete }: { complete: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "3px",
        height: "32px",
        borderRadius: "2px",
        marginLeft: "21px",
        background: complete
          ? "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)"
          : "rgba(107,114,128,0.28)",
        transition: "background 0.4s ease",
      }}
    />
  );
}

interface StepCircleProps {
  step: MilestoneStep;
  state: "completed" | "active" | "future";
  showDate?: string | null;
}

function StepCircle({ step, state, showDate }: StepCircleProps) {
  const isCompleted = state === "completed";
  const isActive = state === "active";

  const circleSize = 44;

  const circleStyle: React.CSSProperties = isCompleted
    ? {
        width: circleSize,
        height: circleSize,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow:
          "0 0 0 4px rgba(34,197,94,0.15), 0 2px 8px rgba(34,197,94,0.3)",
        transition: "all 0.3s ease",
      }
    : isActive
      ? {
          width: circleSize,
          height: circleSize,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow:
            "0 0 0 4px rgba(99,102,241,0.2), 0 0 16px rgba(99,102,241,0.4), 0 2px 8px rgba(99,102,241,0.3)",
          animation: "timeline-pulse 2.4s ease-in-out infinite",
          transition: "all 0.3s ease",
        }
      : {
          width: circleSize,
          height: circleSize,
          borderRadius: "50%",
          background: "rgba(55,60,85,0.6)",
          border: "2px solid rgba(107,114,128,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.3s ease",
        };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
      }}
    >
      <div
        style={circleStyle}
        aria-label={`Step ${step.num}: ${step.label} — ${state}`}
      >
        {isCompleted ? (
          <Check size={20} strokeWidth={3} color="#fff" aria-hidden="true" />
        ) : isActive ? (
          <span
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
            aria-hidden="true"
          >
            {step.num}
          </span>
        ) : (
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "rgba(107,114,128,0.7)",
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            {step.num}
          </span>
        )}
      </div>
      {showDate && (
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: isCompleted ? "#4ade80" : "#818cf8",
            letterSpacing: "0.02em",
            marginTop: "2px",
          }}
        >
          {showDate}
        </span>
      )}
    </div>
  );
}

interface StepLabelProps {
  step: MilestoneStep;
  state: "completed" | "active" | "future";
}

function StepLabel({ step, state }: StepLabelProps) {
  const isCompleted = state === "completed";
  const isActive = state === "active";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: isActive ? 800 : isCompleted ? 700 : 500,
          color: isActive
            ? "#a5b4fc"
            : isCompleted
              ? "#86efac"
              : "rgba(107,114,128,0.6)",
          textAlign: "center",
          lineHeight: "1.3",
          letterSpacing: isActive ? "0.02em" : "0.01em",
          transition: "color 0.3s ease",
          maxWidth: "80px",
          wordBreak: "break-word",
        }}
      >
        {step.label}
      </span>
      <span
        style={{
          fontSize: "10px",
          fontWeight: 400,
          color: isActive
            ? "rgba(165,180,252,0.7)"
            : isCompleted
              ? "rgba(134,239,172,0.6)"
              : "rgba(107,114,128,0.4)",
          textAlign: "center",
          lineHeight: "1.2",
          transition: "color 0.3s ease",
        }}
      >
        {step.sublabel}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal layout (md+)
// ---------------------------------------------------------------------------
function HorizontalTimeline({
  currentMilestone,
  dateLabel,
}: {
  currentMilestone: number;
  dateLabel: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 0,
        overflowX: "auto",
        paddingBottom: "4px",
      }}
    >
      {MILESTONES.map((step, idx) => {
        const state: "completed" | "active" | "future" =
          step.num < currentMilestone
            ? "completed"
            : step.num === currentMilestone
              ? "active"
              : "future";

        const showDate = state === "active" ? dateLabel : null;

        const connectorComplete =
          idx < MILESTONES.length - 1 &&
          step.num < currentMilestone &&
          MILESTONES[idx + 1].num <= currentMilestone;

        return (
          <div
            key={step.num}
            style={{
              display: "flex",
              alignItems: "flex-start",
              flex: idx < MILESTONES.length - 1 ? 1 : "unset",
            }}
          >
            {/* Step column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                minWidth: "72px",
              }}
            >
              <StepCircle step={step} state={state} showDate={showDate} />
              <StepLabel step={step} state={state} />
            </div>

            {/* Connector */}
            {idx < MILESTONES.length - 1 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  height: "44px",
                  padding: "0 4px",
                  minWidth: "12px",
                }}
              >
                <Connector complete={connectorComplete} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vertical layout (mobile)
// ---------------------------------------------------------------------------
function VerticalTimeline({
  currentMilestone,
  dateLabel,
}: {
  currentMilestone: number;
  dateLabel: string | null;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {MILESTONES.map((step, idx) => {
        const state: "completed" | "active" | "future" =
          step.num < currentMilestone
            ? "completed"
            : step.num === currentMilestone
              ? "active"
              : "future";

        const showDate = state === "active" ? dateLabel : null;
        const connectorComplete = step.num < currentMilestone;

        return (
          <div key={step.num}>
            {/* Step row */}
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}
            >
              <StepCircle step={step} state={state} showDate={showDate} />

              {/* Label */}
              <div style={{ paddingTop: "8px", flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontSize: "13px",
                    fontWeight:
                      state === "active"
                        ? 800
                        : state === "completed"
                          ? 700
                          : 500,
                    color:
                      state === "active"
                        ? "#a5b4fc"
                        : state === "completed"
                          ? "#86efac"
                          : "rgba(107,114,128,0.6)",
                    lineHeight: "1.3",
                    transition: "color 0.3s ease",
                  }}
                >
                  {step.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color:
                      state === "active"
                        ? "rgba(165,180,252,0.7)"
                        : state === "completed"
                          ? "rgba(134,239,172,0.55)"
                          : "rgba(107,114,128,0.4)",
                    transition: "color 0.3s ease",
                  }}
                >
                  {step.sublabel}
                  {showDate && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontWeight: 600,
                        color: "#818cf8",
                      }}
                    >
                      · {showDate}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Vertical connector */}
            {idx < MILESTONES.length - 1 && (
              <VerticalConnector complete={connectorComplete} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function ProjectTimeline({
  currentMilestone,
  milestoneUpdatedAt,
}: ProjectTimelineProps) {
  const safe = Math.max(0, Math.min(6, currentMilestone));
  const dateLabel = formatMilestoneDate(milestoneUpdatedAt);

  // Progress percentage for the subtitle
  const completedCount = Math.max(0, safe - 1);
  const progressPct = safe === 0 ? 0 : Math.round((safe / 6) * 100);

  const activeStep = safe > 0 ? MILESTONES[safe - 1] : null;
  const statusLabel =
    safe === 0
      ? "Not started"
      : safe === 6
        ? "Ready for Launch 🚀"
        : `Step ${safe} of 6 — ${activeStep?.label}`;

  return (
    <div
      data-ocid="dashboard.project-timeline.panel"
      style={{
        background:
          "linear-gradient(145deg, rgba(17,20,42,0.95) 0%, rgba(14,16,36,0.98) 100%)",
        borderRadius: "12px",
        border: "1px solid rgba(99,102,241,0.18)",
        padding: "24px 28px",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.25), 0 1px 0 rgba(99,102,241,0.08) inset",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle background glow behind active step indicator */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "240px",
          height: "240px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 4px",
              fontSize: "15px",
              fontWeight: 800,
              color: "#EEF0F8",
              letterSpacing: "-0.01em",
            }}
          >
            Live Project Timeline
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#7A7D90",
              lineHeight: "1.4",
            }}
          >
            {statusLabel}
          </p>
        </div>

        {/* Progress badge */}
        {safe > 0 && (
          <span
            data-ocid="dashboard.project-timeline.progress.badge"
            style={{
              flexShrink: 0,
              fontSize: "12px",
              fontWeight: 700,
              color: safe === 6 ? "#4ade80" : "#a5b4fc",
              background:
                safe === 6 ? "rgba(34,197,94,0.12)" : "rgba(99,102,241,0.14)",
              border: `1px solid ${safe === 6 ? "rgba(34,197,94,0.25)" : "rgba(99,102,241,0.25)"}`,
              borderRadius: "999px",
              padding: "4px 12px",
              letterSpacing: "0.03em",
            }}
          >
            {progressPct}% Complete
          </span>
        )}
      </div>

      {/* Desktop timeline (hidden on mobile via CSS class) */}
      <style>{`
        @keyframes timeline-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(99,102,241,0.2), 0 0 16px rgba(99,102,241,0.4), 0 2px 8px rgba(99,102,241,0.3); }
          50% { box-shadow: 0 0 0 7px rgba(99,102,241,0.12), 0 0 28px rgba(99,102,241,0.55), 0 2px 12px rgba(99,102,241,0.4); }
        }
        .timeline-desktop { display: flex; }
        .timeline-mobile { display: none; }
        @media (max-width: 640px) {
          .timeline-desktop { display: none; }
          .timeline-mobile { display: flex; }
        }
      `}</style>

      <div className="timeline-desktop">
        <div style={{ width: "100%" }}>
          <HorizontalTimeline currentMilestone={safe} dateLabel={dateLabel} />
        </div>
      </div>

      <div className="timeline-mobile" style={{ flexDirection: "column" }}>
        <VerticalTimeline currentMilestone={safe} dateLabel={dateLabel} />
      </div>

      {/* Footer note for 0 milestone */}
      {safe === 0 && (
        <p
          data-ocid="dashboard.project-timeline.empty_state"
          style={{
            margin: "16px 0 0",
            fontSize: "12px",
            color: "rgba(107,114,128,0.7)",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          Your timeline will activate once your deposit is confirmed.
        </p>
      )}

      {/* Completed count indicator (non-zero) */}
      {safe > 0 && safe < 6 && (
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(99,102,241,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "3px",
              background: "rgba(55,60,85,0.5)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                borderRadius: "3px",
                background: "linear-gradient(90deg, #6366f1 0%, #22c55e 100%)",
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
          <span
            style={{
              flexShrink: 0,
              fontSize: "11px",
              fontWeight: 600,
              color: "#7A7D90",
            }}
          >
            {completedCount} of 6 steps done
          </span>
        </div>
      )}

      {/* Launch celebration */}
      {safe === 6 && (
        <div
          data-ocid="dashboard.project-timeline.launch.banner"
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(34,197,94,0.2)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 700,
              color: "#4ade80",
            }}
          >
            🚀 Your project is ready for launch. Congratulations!
          </p>
        </div>
      )}
    </div>
  );
}
