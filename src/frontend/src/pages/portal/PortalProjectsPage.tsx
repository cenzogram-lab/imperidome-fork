import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Order, backendInterface } from "../../backend.d";
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

const STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string; progress: number }
> = {
  questionnairePending: {
    label: "QUESTIONNAIRE PENDING",
    color: "#EAB308",
    bg: "rgba(234,179,8,0.15)",
    progress: 10,
  },
  questionnaireComplete: {
    label: "QUESTIONNAIRE COMPLETE",
    color: "#5EF08A",
    bg: "rgba(94,240,138,0.12)",
    progress: 20,
  },
  depositSent: {
    label: "DEPOSIT SENT",
    color: "#FB923C",
    bg: "rgba(251,146,60,0.15)",
    progress: 25,
  },
  depositReceived: {
    label: "DEPOSIT RECEIVED",
    color: "#5EF08A",
    bg: "rgba(94,240,138,0.12)",
    progress: 30,
  },
  buildInProgress: {
    label: "BUILD IN PROGRESS",
    color: "#5EF08A",
    bg: "rgba(94,240,138,0.12)",
    progress: 50,
  },
  draftReady: {
    label: "DRAFT READY",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.12)",
    progress: 70,
  },
  revisionsInProgress: {
    label: "REVISIONS IN PROGRESS",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    progress: 80,
  },
  launching: {
    label: "LAUNCHING",
    color: "#5EF08A",
    bg: "rgba(94,240,138,0.12)",
    progress: 90,
  },
  live: {
    label: "LIVE",
    color: "#5EF08A",
    bg: "rgba(94,240,138,0.12)",
    progress: 100,
  },
  paused: {
    label: "PAUSED",
    color: "#7A7D90",
    bg: "rgba(122,125,144,0.12)",
    progress: 50,
  },
  cancelled: {
    label: "CANCELLED",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    progress: 100,
  },
};

function getStatusCfg(status: string) {
  return (
    STATUS_CFG[status] ?? {
      label: status.toUpperCase(),
      color: "#7A7D90",
      bg: "rgba(122,125,144,0.12)",
      progress: 0,
    }
  );
}

function formatDateTime(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}, ${d.getFullYear()} ${hours}:${minutes} ${ampm}`;
}

function formatDate(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}, ${d.getFullYear()}`;
}

const PAST_STATUSES = new Set<string>(["live", "cancelled"]);

function Skeleton({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(94,240,138,0.06)",
        borderRadius: "6px",
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusCfg(status);
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
        border: `1px solid ${cfg.color}40`,
      }}
    >
      {cfg.label}
    </span>
  );
}

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
        style={{
          maxWidth: "440px",
          borderRadius: "12px",
          padding: "32px",
          background: "rgba(10,11,20,0.98)",
          border: "1px solid rgba(94,240,138,0.3)",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="matrix-heading"
            style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}
          >
            <TypewriterText text={order.tier_code} speed={40} />
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
              className="matrix-label"
              style={{ margin: "0 0 6px", fontSize: "12px" }}
            >
              STATUS
            </p>
            <StatusBadge
              status={
                Object.keys(
                  order.status as unknown as Record<string, unknown>,
                )[0]
              }
            />
          </div>
          <div>
            <p
              className="matrix-label"
              style={{ margin: "0 0 6px", fontSize: "12px" }}
            >
              LAUNCH DATE
            </p>
            <p
              className="matrix-text"
              style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}
            >
              {formatDate(order.updated_at)}
            </p>
          </div>
          <div>
            <p
              className="matrix-label"
              style={{ margin: "0 0 6px", fontSize: "12px" }}
            >
              DELIVERY WINDOW
            </p>
            <p
              className="matrix-text"
              style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}
            >
              {order.delivery_window || "—"}
            </p>
          </div>
          <Link
            to="/portal/invoices"
            data-ocid="projects.past.modal.invoices.button"
            className="matrix-btn"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 0",
              borderRadius: "8px",
              textDecoration: "none",
              textAlign: "center",
              marginTop: "8px",
            }}
          >
            View Invoices
          </Link>
          <DialogClose asChild>
            <button
              type="button"
              data-ocid="projects.past.modal.close_button"
              className="matrix-btn-outline"
              style={{ width: "100%", padding: "9px 0", cursor: "pointer" }}
            >
              Close
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PortalProjectsPage() {
  const { actor, isFetching } = useActor();
  const { session } = useSession();
  const [orders, setOrders] = useState<Order[] | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    const sessionEmail = session?.email ?? "";
    if (!sessionEmail) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await (actor as backendInterface).getMyOrders();
        if (!cancelled) setOrders(result);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, session]);

  const isLoading = isFetching || (orders === undefined && !loadError);
  let activeOrder: Order | null = null;
  let pastOrders: Order[] = [];
  if (orders) {
    const active: Order[] = [];
    const past: Order[] = [];
    for (const o of orders) {
      if (
        PAST_STATUSES.has(
          Object.keys(o.status as unknown as Record<string, unknown>)[0],
        )
      )
        past.push(o);
      else active.push(o);
    }
    if (active.length > 0) {
      activeOrder = active[0];
      for (let i = 1; i < active.length; i++) past.push(active[i]);
    }
    past.sort((a, b) =>
      b.updated_at > a.updated_at ? 1 : b.updated_at < a.updated_at ? -1 : 0,
    );
    pastOrders = past;
  }

  return (
    <PortalLayout pageTitle="My Projects">
      <style>
        {"@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }"}
      </style>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {isLoading && (
          <div data-ocid="projects.loading_state" className="matrix-card">
            <Skeleton
              style={{ height: "22px", width: "200px", marginBottom: "20px" }}
            />
            <div
              className="grid grid-cols-2"
              style={{ gap: "24px", marginBottom: "24px" }}
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
        {!isLoading && loadError && (
          <div
            data-ocid="projects.error_state"
            className="matrix-card"
            style={{ color: "#EF4444", fontSize: "14px" }}
          >
            <TypewriterText
              text="Could not load projects. Please refresh."
              speed={30}
            />
          </div>
        )}
        {!isLoading && !loadError && (
          <>
            {activeOrder ? (
              <div data-ocid="projects.active.card" className="matrix-card">
                <h3
                  className="matrix-heading"
                  style={{
                    margin: "0 0 20px",
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  <TypewriterText text={activeOrder.tier_code} speed={40} />
                </h3>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2"
                  style={{ gap: "24px", marginBottom: "24px" }}
                >
                  <div data-ocid="projects.active.tier.panel">
                    <p
                      className="matrix-label"
                      style={{ margin: "0 0 4px", fontSize: "12px" }}
                    >
                      TIER
                    </p>
                    <p
                      className="matrix-text"
                      style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}
                    >
                      {activeOrder.tier_code}
                    </p>
                  </div>
                  <div data-ocid="projects.active.status.panel">
                    <p
                      className="matrix-label"
                      style={{ margin: "0 0 4px", fontSize: "12px" }}
                    >
                      STATUS
                    </p>
                    <StatusBadge
                      status={
                        Object.keys(
                          activeOrder.status as unknown as Record<
                            string,
                            unknown
                          >,
                        )[0]
                      }
                    />
                  </div>
                  <div data-ocid="projects.active.delivery.panel">
                    <p
                      className="matrix-label"
                      style={{ margin: "0 0 4px", fontSize: "12px" }}
                    >
                      DELIVERY WINDOW
                    </p>
                    <p
                      className="matrix-text"
                      style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}
                    >
                      {activeOrder.delivery_window || "—"}
                    </p>
                  </div>
                  <div data-ocid="projects.active.launch.panel">
                    <p
                      className="matrix-label"
                      style={{ margin: "0 0 4px", fontSize: "12px" }}
                    >
                      LAUNCH TARGET
                    </p>
                    <p
                      className="matrix-text"
                      style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}
                    >
                      {activeOrder.launch_target || "—"}
                    </p>
                  </div>
                </div>
                {(() => {
                  const cfg = getStatusCfg(
                    Object.keys(
                      activeOrder.status as unknown as Record<string, unknown>,
                    )[0],
                  );
                  return (
                    <div data-ocid="projects.active.progress.panel">
                      <div
                        style={{
                          height: "8px",
                          width: "100%",
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: "999px",
                          overflow: "hidden",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${cfg.progress}%`,
                            background: cfg.color,
                            borderRadius: "999px",
                            transition: "width 0.5s ease",
                            boxShadow: `0 0 8px ${cfg.color}80`,
                          }}
                        />
                      </div>
                      <p
                        className="matrix-muted"
                        style={{ margin: 0, fontSize: "12px" }}
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
                className="matrix-card"
                style={{ textAlign: "center", padding: "48px 24px" }}
              >
                <p
                  className="matrix-muted"
                  style={{ margin: "0 0 16px", fontSize: "15px" }}
                >
                  <TypewriterText
                    text="No active project yet. Ready to get started?"
                    speed={30}
                  />
                </p>
                <Link
                  to="/get-started"
                  data-ocid="projects.get-started.button"
                  className="matrix-btn"
                  style={{
                    display: "inline-block",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}

            <div data-ocid="projects.past.panel" className="matrix-card">
              <h3
                className="matrix-heading"
                style={{
                  margin: "0 0 20px",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                <TypewriterText text="Past Projects" speed={40} />
              </h3>
              {pastOrders.length === 0 ? (
                <p
                  data-ocid="projects.past.empty_state"
                  className="matrix-muted"
                  style={{ margin: 0, fontSize: "14px" }}
                >
                  <TypewriterText text="No past projects yet." speed={30} />
                </p>
              ) : (
                <>
                  <div
                    className="hidden md:block"
                    data-ocid="projects.past.table"
                  >
                    <div style={{ overflowX: "auto" }}>
                      <table className="matrix-table" style={{ width: "100%" }}>
                        <thead>
                          <tr>
                            {["Tier", "Launch Date", "Status", "View"].map(
                              (h) => (
                                <th
                                  key={h}
                                  style={{
                                    padding: "10px 12px",
                                    textAlign: "left",
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
                            >
                              <td style={{ padding: "12px" }}>{o.tier_code}</td>
                              <td style={{ padding: "12px" }}>
                                {formatDate(o.updated_at)}
                              </td>
                              <td style={{ padding: "12px" }}>
                                <StatusBadge
                                  status={
                                    Object.keys(
                                      o.status as unknown as Record<
                                        string,
                                        unknown
                                      >,
                                    )[0]
                                  }
                                />
                              </td>
                              <td style={{ padding: "12px" }}>
                                <button
                                  type="button"
                                  data-ocid={`projects.past.view.button.${idx + 1}`}
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
                                  View
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
                      gap: "16px",
                    }}
                  >
                    {pastOrders.map((o, idx) => (
                      <div
                        key={String(o.id)}
                        data-ocid={`projects.past.row.${idx + 1}`}
                        style={{
                          background: "rgba(14,16,32,0.9)",
                          borderRadius: "8px",
                          padding: "16px",
                          border: "1px solid rgba(94,240,138,0.15)",
                        }}
                      >
                        <div
                          className="grid grid-cols-2"
                          style={{ gap: "12px", marginBottom: "12px" }}
                        >
                          <div>
                            <p
                              className="matrix-label"
                              style={{ margin: "0 0 2px", fontSize: "11px" }}
                            >
                              TIER
                            </p>
                            <p
                              className="matrix-text"
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: 600,
                              }}
                            >
                              {o.tier_code}
                            </p>
                          </div>
                          <div>
                            <p
                              className="matrix-label"
                              style={{ margin: "0 0 2px", fontSize: "11px" }}
                            >
                              LAUNCH DATE
                            </p>
                            <p
                              className="matrix-muted"
                              style={{ margin: 0, fontSize: "14px" }}
                            >
                              {formatDate(o.updated_at)}
                            </p>
                          </div>
                          <div>
                            <p
                              className="matrix-label"
                              style={{ margin: "0 0 2px", fontSize: "11px" }}
                            >
                              STATUS
                            </p>
                            <StatusBadge
                              status={
                                Object.keys(
                                  o.status as unknown as Record<
                                    string,
                                    unknown
                                  >,
                                )[0]
                              }
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          data-ocid={`projects.past.view.button.${idx + 1}`}
                          onClick={() => setModalOrder(o)}
                          className="matrix-btn-outline"
                          style={{
                            width: "100%",
                            padding: "12px 0",
                            minHeight: "44px",
                            cursor: "pointer",
                          }}
                        >
                          View Details
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
