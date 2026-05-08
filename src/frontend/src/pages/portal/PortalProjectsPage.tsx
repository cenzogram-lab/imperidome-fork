import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Order } from "../../backend";
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
// Status config
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    dot: string;
    progress: number;
    fill: string;
  }
> = {
  questionnairePending: {
    label: "QUESTIONNAIRE PENDING",
    color: "#92400e",
    bg: "#FEF9C3",
    dot: "#EAB308",
    progress: 10,
    fill: "#EAB308",
  },
  questionnaireComplete: {
    label: "QUESTIONNAIRE COMPLETE",
    color: "#1e40af",
    bg: "#DBEAFE",
    dot: "#3B82F6",
    progress: 20,
    fill: "#3B82F6",
  },
  depositSent: {
    label: "DEPOSIT SENT",
    color: "#9a3412",
    bg: "#FFEDD5",
    dot: "#F97316",
    progress: 25,
    fill: "#F97316",
  },
  depositReceived: {
    label: "DEPOSIT RECEIVED",
    color: "#166534",
    bg: "#DCFCE7",
    dot: "#86EFAC",
    progress: 30,
    fill: "#86EFAC",
  },
  buildInProgress: {
    label: "BUILD IN PROGRESS",
    color: "#1d4ed8",
    bg: "#DBEAFE",
    dot: "#5EF08A",
    progress: 50,
    fill: "#5EF08A",
  },
  draftReady: {
    label: "DRAFT READY",
    color: "#6b21a8",
    bg: "#F3E8FF",
    dot: "#A855F7",
    progress: 70,
    fill: "#A855F7",
  },
  revisionsInProgress: {
    label: "REVISIONS IN PROGRESS",
    color: "#92400e",
    bg: "#FEF3C7",
    dot: "#F59E0B",
    progress: 80,
    fill: "#F59E0B",
  },
  launching: {
    label: "LAUNCHING",
    color: "#0f766e",
    bg: "#CCFBF1",
    dot: "#0F766E",
    progress: 90,
    fill: "#0F766E",
  },
  live: {
    label: "LIVE",
    color: "#166534",
    bg: "#DCFCE7",
    dot: "#166534",
    progress: 100,
    fill: "#166534",
  },
  paused: {
    label: "PAUSED",
    color: "#7A7D90",
    bg: "#F3F4F6",
    dot: "#7A7D90",
    progress: 50,
    fill: "#7A7D90",
  },
  cancelled: {
    label: "CANCELLED",
    color: "#991b1b",
    bg: "#FEE2E2",
    dot: "#991B1B",
    progress: 100,
    fill: "#991B1B",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status.toUpperCase(),
      color: "#7A7D90",
      bg: "#F3F4F6",
      dot: "#7A7D90",
      progress: 0,
      fill: "#7A7D90",
    }
  );
}

function formatDateTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

const PAST_STATUSES = new Set<string>([Status.live, Status.cancelled]);

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
// StatusBadge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// DataPoint
// ---------------------------------------------------------------------------
function DataPoint({
  label,
  children,
  ocid,
}: { label: string; children: React.ReactNode; ocid?: string }) {
  return (
    <div data-ocid={ocid}>
      <p
        style={{
          margin: "0 0 4px",
          fontSize: "12px",
          color: "#7A7D90",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Past Projects Modal
// ---------------------------------------------------------------------------
function PastProjectModal({
  order,
  open,
  onClose,
}: { order: Order; open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        data-ocid="projects.past.modal"
        style={{ maxWidth: "440px", borderRadius: "12px", padding: "32px" }}
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
            {order.tier_code}
          </DialogTitle>
        </DialogHeader>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginTop: "8px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "12px",
                color: "#7A7D90",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <EditableText
                textKey="portal.projects.past-modal.status-label"
                defaultText="Status"
                as="span"
              />
            </p>
            <StatusBadge status={order.status} />
          </div>
          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "12px",
                color: "#7A7D90",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <EditableText
                textKey="portal.projects.past-modal.launch-date-label"
                defaultText="Launch Date"
                as="span"
              />
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 600,
                color: "#EEF0F8",
              }}
            >
              {formatDate(order.updated_at)}
            </p>
          </div>
          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "12px",
                color: "#7A7D90",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <EditableText
                textKey="portal.projects.past-modal.delivery-window-label"
                defaultText="Delivery Window"
                as="span"
              />
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 600,
                color: "#EEF0F8",
              }}
            >
              {order.delivery_window || "—"}
            </p>
          </div>

          <Link
            to="/portal/invoices"
            data-ocid="projects.past.modal.invoices.button"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 0",
              borderRadius: "8px",
              background: "#5EF08A",
              color: "#061209",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
              textAlign: "center",
              marginTop: "8px",
            }}
          >
            <EditableText
              textKey="portal.projects.past-modal.view-invoices-cta"
              defaultText="View Invoices"
              as="span"
            />
          </Link>

          <DialogClose asChild>
            <button
              type="button"
              data-ocid="projects.past.modal.close_button"
              style={{
                width: "100%",
                padding: "9px 0",
                borderRadius: "8px",
                border: "1px solid #1C1F33",
                background: "rgba(17,19,34,0.7)",
                color: "#7A7D90",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <EditableText
                textKey="portal.projects.past-modal.close-label"
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
// Main Component
// ---------------------------------------------------------------------------
export default function PortalProjectsPage() {
  const { actor, isFetching } = useActor();
  const [orders, setOrders] = useState<Order[] | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await actor!.getMyOrders();
        if (!cancelled) setOrders(result);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  const isLoading = isFetching || (orders === undefined && !loadError);

  // Split orders
  let activeOrder: Order | null = null;
  let pastOrders: Order[] = [];

  if (orders) {
    const active: Order[] = [];
    const past: Order[] = [];
    for (const o of orders) {
      if (PAST_STATUSES.has(o.status)) {
        past.push(o);
      } else {
        active.push(o);
      }
    }
    if (active.length > 0) {
      activeOrder = active[0];
      for (let i = 1; i < active.length; i++) {
        past.push(active[i]);
      }
    }
    past.sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1));
    pastOrders = past;
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid #1C1F33",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    margin: "0 0 4px",
    fontSize: "12px",
    color: "#7A7D90",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const valueStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#EEF0F8",
  };

  return (
    <PortalLayout pageTitle="My Projects">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .view-link:hover { text-decoration: underline; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ===== LOADING STATE ===== */}
        {isLoading && (
          <div data-ocid="projects.loading_state" style={cardStyle}>
            <Skeleton
              style={{ height: "22px", width: "200px", marginBottom: "20px" }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                marginBottom: "24px",
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton
                    style={{
                      height: "12px",
                      width: "60px",
                      marginBottom: "8px",
                    }}
                  />
                  <Skeleton style={{ height: "20px", width: "120px" }} />
                </div>
              ))}
            </div>
            <Skeleton style={{ height: "8px", width: "100%" }} />
          </div>
        )}

        {/* ===== ERROR STATE ===== */}
        {!isLoading && loadError && (
          <div
            data-ocid="projects.error_state"
            style={{ ...cardStyle, color: "#991B1B", fontSize: "14px" }}
          >
            <EditableText
              textKey="portal.projects.error-state"
              defaultText="Could not load projects. Please refresh."
              as="span"
            />
          </div>
        )}

        {/* ===== ACTIVE PROJECT CARD ===== */}
        {!isLoading && !loadError && (
          <>
            {activeOrder ? (
              <div data-ocid="projects.active.card" style={cardStyle}>
                <h3
                  style={{
                    margin: "0 0 20px",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  {activeOrder.tier_code}
                </h3>

                <div
                  className="grid grid-cols-1 sm:grid-cols-2"
                  style={{ gap: "24px", marginBottom: "24px" }}
                >
                  <DataPoint label="Tier" ocid="projects.active.tier.panel">
                    <p style={valueStyle}>{activeOrder.tier_code}</p>
                  </DataPoint>

                  <DataPoint label="Status" ocid="projects.active.status.panel">
                    <StatusBadge status={activeOrder.status} />
                  </DataPoint>

                  <DataPoint
                    label="Delivery Window"
                    ocid="projects.active.delivery.panel"
                  >
                    <p style={valueStyle}>
                      {activeOrder.delivery_window || "—"}
                    </p>
                  </DataPoint>

                  <DataPoint
                    label="Launch Target"
                    ocid="projects.active.launch.panel"
                  >
                    <p style={valueStyle}>{activeOrder.launch_target || "—"}</p>
                  </DataPoint>
                </div>

                {/* Progress bar */}
                {(() => {
                  const cfg = getStatusConfig(activeOrder.status);
                  return (
                    <div data-ocid="projects.active.progress.panel">
                      <div
                        style={{
                          height: "8px",
                          width: "100%",
                          background: "rgba(40,45,70,0.8)",
                          borderRadius: "999px",
                          overflow: "hidden",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${cfg.progress}%`,
                            background: cfg.fill,
                            borderRadius: "999px",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#7A7D90",
                        }}
                      >
                        Last updated: {formatDateTime(activeOrder.updated_at)}
                      </p>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div
                data-ocid="projects.active.empty_state"
                style={{
                  ...cardStyle,
                  textAlign: "center",
                  padding: "48px 24px",
                  background: "#0A0B14",
                }}
              >
                <p
                  style={{
                    margin: "0 0 16px",
                    fontSize: "15px",
                    color: "#7A7D90",
                  }}
                >
                  <EditableText
                    textKey="portal.projects.active.empty-state"
                    defaultText="No active project yet. Ready to get started?"
                    as="span"
                  />
                </p>
                <Link
                  to="/get-started"
                  data-ocid="projects.get-started.button"
                  style={{
                    display: "inline-block",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    background: "#5EF08A",
                    color: "#061209",
                    fontWeight: 700,
                    fontSize: "14px",
                    textDecoration: "none",
                  }}
                >
                  <EditableText
                    textKey="portal.projects.active.get-started-cta"
                    defaultText="Get Started"
                    as="span"
                  />
                </Link>
              </div>
            )}

            {/* ===== PAST PROJECTS ===== */}
            <div data-ocid="projects.past.panel" style={cardStyle}>
              <h3
                style={{
                  margin: "0 0 20px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#EEF0F8",
                }}
              >
                <EditableText
                  textKey="portal.projects.past.heading"
                  defaultText="Past Projects"
                  as="span"
                />
              </h3>

              {pastOrders.length === 0 ? (
                <p
                  data-ocid="projects.past.empty_state"
                  style={{ margin: 0, fontSize: "14px", color: "#7A7D90" }}
                >
                  <EditableText
                    textKey="portal.projects.past.empty-state"
                    defaultText="No past projects yet."
                    as="span"
                  />
                </p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div
                    className="hidden md:block"
                    data-ocid="projects.past.table"
                  >
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                          {["Tier", "Launch Date", "Status", "View"].map(
                            (h) => (
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
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {pastOrders.map((o, idx) => (
                          <tr
                            key={String(o.id)}
                            data-ocid={`projects.past.row.${idx + 1}`}
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
                              {o.tier_code}
                            </td>
                            <td
                              style={{
                                padding: "12px",
                                fontSize: "14px",
                                color: "#7A7D90",
                              }}
                            >
                              {formatDate(o.updated_at)}
                            </td>
                            <td style={{ padding: "12px" }}>
                              <StatusBadge status={o.status} />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <button
                                type="button"
                                data-ocid={`projects.past.view.button.${idx + 1}`}
                                className="view-link"
                                onClick={() => setModalOrder(o)}
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
                                  textKey="portal.projects.past.view-button-label"
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
                      gap: "16px",
                    }}
                  >
                    {pastOrders.map((o, idx) => (
                      <div
                        key={String(o.id)}
                        data-ocid={`projects.past.row.${idx + 1}`}
                        style={{
                          background: "#0A0B14",
                          borderRadius: "8px",
                          padding: "16px",
                          border: "1px solid #1C1F33",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <div>
                            <p style={labelStyle}>
                              <EditableText
                                textKey="portal.projects.past.mobile.tier-label"
                                defaultText="Tier"
                                as="span"
                              />
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#EEF0F8",
                              }}
                            >
                              {o.tier_code}
                            </p>
                          </div>
                          <div>
                            <p style={labelStyle}>
                              <EditableText
                                textKey="portal.projects.past.mobile.launch-date-label"
                                defaultText="Launch Date"
                                as="span"
                              />
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                color: "#7A7D90",
                              }}
                            >
                              {formatDate(o.updated_at)}
                            </p>
                          </div>
                          <div>
                            <p style={labelStyle}>
                              <EditableText
                                textKey="portal.projects.past.mobile.status-label"
                                defaultText="Status"
                                as="span"
                              />
                            </p>
                            <StatusBadge status={o.status} />
                          </div>
                        </div>
                        <button
                          type="button"
                          data-ocid={`projects.past.view.button.${idx + 1}`}
                          onClick={() => setModalOrder(o)}
                          style={{
                            width: "100%",
                            padding: "12px 0",
                            minHeight: "44px",
                            border: "1px solid #5EF08A",
                            background: "rgba(17,19,34,0.7)",
                            color: "#5EF08A",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: "pointer",
                          }}
                        >
                          <EditableText
                            textKey="portal.projects.past.mobile.view-details-label"
                            defaultText="View Details"
                            as="span"
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ===== MODAL ===== */}
      {modalOrder && (
        <PastProjectModal
          order={modalOrder}
          open={true}
          onClose={() => setModalOrder(null)}
        />
      )}
    </PortalLayout>
  );
}
