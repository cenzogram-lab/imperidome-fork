import { createActor } from "@/backend";
import type { CrmClient } from "@/backend";
import { CheckCircle2, Globe, XCircle } from "lucide-react";
import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface RowState {
  fee: number;
  saveStatus: SaveStatus;
  errorMessage: string;
}

interface StripeRowState {
  inputValue: string;
  selectedStatus: string;
  saveStatus: SaveStatus;
  errorMessage: string;
}

interface WebhookRowState {
  value: string;
  revealed: boolean;
  saveStatus: SaveStatus;
  errorMessage: string;
  copied: boolean;
}

const STATUS_OPTIONS = ["pending", "connected", "disconnected"] as const;

function StripeIdControl({
  clientId,
  row,
  onChange,
  onSave,
}: {
  clientId: string;
  row: StripeRowState;
  onChange: (
    id: string,
    field: "inputValue" | "selectedStatus",
    value: string,
  ) => void;
  onSave: (id: string) => void;
}) {
  const { inputValue, selectedStatus, saveStatus, errorMessage } = row;
  const isSaving = saveStatus === "saving";

  const [focused, setFocused] = React.useState(false);
  const [statusFocused, setStatusFocused] = React.useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 260,
      }}
    >
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {/* Stripe Account ID input */}
        <input
          data-ocid={`platform.stripe_id.input.${clientId}`}
          type="text"
          value={inputValue}
          disabled={isSaving}
          placeholder="acct_..."
          onChange={(e) => onChange(clientId, "inputValue", e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: "rgba(0,20,0,0.75)",
            border: `1px solid ${focused ? "rgba(0,255,70,0.7)" : "rgba(0,255,70,0.25)"}`,
            borderRadius: 6,
            color: "rgba(0,255,70,0.9)",
            padding: "4px 10px",
            fontSize: 12,
            fontFamily: "monospace",
            outline: "none",
            opacity: isSaving ? 0.5 : 1,
            cursor: isSaving ? "not-allowed" : "text",
            transition: "border-color 0.15s",
            minWidth: 0,
          }}
        />

        {/* Status dropdown */}
        <select
          data-ocid={`platform.stripe_status.select.${clientId}`}
          value={selectedStatus}
          disabled={isSaving}
          onChange={(e) => onChange(clientId, "selectedStatus", e.target.value)}
          onFocus={() => setStatusFocused(true)}
          onBlur={() => setStatusFocused(false)}
          style={{
            background: "rgba(0,20,0,0.75)",
            border: `1px solid ${statusFocused ? "rgba(0,255,70,0.7)" : "rgba(0,255,70,0.25)"}`,
            borderRadius: 6,
            color: "rgba(0,255,70,0.85)",
            padding: "4px 8px",
            fontSize: 12,
            fontFamily: "monospace",
            outline: "none",
            cursor: isSaving ? "not-allowed" : "pointer",
            opacity: isSaving ? 0.5 : 1,
            transition: "border-color 0.15s",
            minWidth: 110,
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt} style={{ background: "#051005" }}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>

        {/* Save / Saving button */}
        {isSaving ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              color: "rgba(0,255,70,0.55)",
              fontSize: 12,
              minWidth: 64,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                border: "2px solid rgba(0,255,70,0.15)",
                borderTopColor: "rgba(0,255,70,0.8)",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
            Saving…
          </span>
        ) : (
          <button
            type="button"
            data-ocid={`platform.stripe_id.save_button.${clientId}`}
            onClick={() => onSave(clientId)}
            style={{
              background: "rgba(0,255,70,0.12)",
              border: "1px solid rgba(0,255,70,0.45)",
              borderRadius: 6,
              color: "rgba(0,255,70,0.9)",
              padding: "4px 12px",
              fontSize: 12,
              fontFamily: "monospace",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,255,70,0.22)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(0,255,70,0.7)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,255,70,0.12)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(0,255,70,0.45)";
            }}
          >
            Save
          </button>
        )}
      </div>

      {/* Feedback row */}
      <div style={{ height: 16 }}>
        {saveStatus === "saved" && (
          <span
            data-ocid={`platform.stripe_id.success_state.${clientId}`}
            style={{
              fontSize: 11,
              color: "rgba(0,255,70,0.9)",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <CheckCircle2 size={11} />
            Saved!
          </span>
        )}
        {saveStatus === "error" && (
          <span
            data-ocid={`platform.stripe_id.error_state.${clientId}`}
            style={{
              fontSize: 11,
              color: "rgba(255,80,80,0.9)",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <XCircle size={11} />
            {errorMessage || "Save failed"}
          </span>
        )}
      </div>
    </div>
  );
}

function FeeControl({
  clientId,
  row,
  onFeeChange,
  onSave,
}: {
  clientId: string;
  row: RowState;
  onFeeChange: (id: string, value: number) => void;
  onSave: (id: string) => void;
}) {
  const { fee, saveStatus, errorMessage } = row;
  const isDisabled = saveStatus === "saving";

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(100, Math.max(0, Number.parseFloat(e.target.value)));
    onFeeChange(clientId, Number.isNaN(v) ? 0 : v);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(100, Math.max(0, Number.parseFloat(e.target.value)));
    onFeeChange(clientId, Number.isNaN(v) ? 0 : v);
  };

  const handleSliderUp = () => onSave(clientId);
  const handleNumberBlur = () => onSave(clientId);

  return (
    <div className="flex flex-col gap-1" style={{ minWidth: 200 }}>
      <div className="flex items-center gap-3">
        <input
          data-ocid="platform.fee.slider"
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={fee}
          disabled={isDisabled}
          onChange={handleSliderChange}
          onMouseUp={handleSliderUp}
          onTouchEnd={handleSliderUp}
          style={{
            flex: 1,
            accentColor: "rgba(0,255,70,0.85)",
            cursor: isDisabled ? "not-allowed" : "pointer",
            opacity: isDisabled ? 0.5 : 1,
          }}
        />
        <div className="flex items-center gap-1">
          <input
            data-ocid="platform.fee.input"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={fee}
            disabled={isDisabled}
            onChange={handleNumberChange}
            onBlur={handleNumberBlur}
            style={{
              width: 64,
              background: "rgba(0,20,0,0.7)",
              border: "1px solid rgba(0,255,70,0.25)",
              borderRadius: 6,
              color: "rgba(0,255,70,0.9)",
              padding: "3px 8px",
              fontSize: 13,
              fontFamily: "monospace",
              outline: "none",
              opacity: isDisabled ? 0.5 : 1,
              cursor: isDisabled ? "not-allowed" : "text",
            }}
          />
          <span style={{ color: "rgba(0,255,70,0.6)", fontSize: 13 }}>%</span>
        </div>
      </div>
      {fee === 0 && (
        <div
          className="flex items-center gap-1 mt-1"
          style={{ color: "#f59e0b", fontSize: 12 }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.645-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          No commission will be collected for this client
        </div>
      )}
      <div style={{ height: 18 }}>
        {saveStatus === "saving" && (
          <span style={{ fontSize: 11, color: "rgba(0,255,70,0.5)" }}>
            Saving…
          </span>
        )}
        {saveStatus === "saved" && (
          <span
            data-ocid="platform.fee.success_state"
            style={{
              fontSize: 11,
              color: "rgba(0,255,70,0.9)",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <CheckCircle2 size={11} />
            Saved
          </span>
        )}
        {saveStatus === "error" && (
          <span
            data-ocid="platform.fee.error_state"
            style={{
              fontSize: 11,
              color: "rgba(255,80,80,0.9)",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <XCircle size={11} />
            {errorMessage || "Save failed"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminPlatformDashboard() {
  const { actor, isFetching } = useActor();

  // Read session from localStorage (same pattern as rest of admin)
  const sessionRaw =
    typeof window !== "undefined" ? localStorage.getItem("adminSession") : null;
  const session = sessionRaw
    ? (JSON.parse(sessionRaw) as { email?: string; role?: string })
    : null;
  const isSuperAdmin = session?.role === "admin";

  const [clients, setClients] = useState<CrmClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [stripeRowStates, setStripeRowStates] = useState<
    Record<string, StripeRowState>
  >({});
  const [volumeMap, setVolumeMap] = useState<Record<string, number>>({});
  const [platformTotalVolume, setPlatformTotalVolume] = useState<number>(0);
  const [webhookStates, setWebhookStates] = useState<
    Record<string, WebhookRowState>
  >({});
  const [sortField, setSortField] = useState<
    "lastActivity" | "connectedAt" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // savedTimers holds setTimeout IDs for clearing "Saved" after 2.5s
  const savedTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const stripeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const webhookTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const copiedTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const fetchClients = useCallback(async () => {
    if (!actor || !session?.email) return;
    setLoading(true);
    setFetchError("");
    try {
      const [data, vols] = await Promise.all([
        actor.getConnectedClients(),
        actor.getClientOrderVolumes(),
      ]);
      setClients(data);

      // Build volume map keyed by principal text and compute platform total
      const volMap: Record<string, number> = {};
      let total = 0;
      for (const [principalText, amount] of vols) {
        volMap[principalText] = amount;
        total += amount;
      }
      setVolumeMap(volMap);
      setPlatformTotalVolume(total);

      const initial: Record<string, RowState> = {};
      const initialStripe: Record<string, StripeRowState> = {};
      const initialWebhook: Record<string, WebhookRowState> = {};
      for (const c of data) {
        initial[c.id] = {
          fee: c.platformFeePercentage,
          saveStatus: "idle",
          errorMessage: "",
        };
        initialStripe[c.id] = {
          inputValue: c.stripeConnectAccountId ?? "",
          selectedStatus: (STATUS_OPTIONS as readonly string[]).includes(
            c.stripeConnectStatus,
          )
            ? c.stripeConnectStatus
            : "pending",
          saveStatus: "idle",
          errorMessage: "",
        };
        initialWebhook[c.id] = {
          value: c.webhookSecret ?? "",
          revealed: false,
          saveStatus: "idle",
          errorMessage: "",
          copied: false,
        };
      }
      setRowStates(initial);
      setStripeRowStates(initialStripe);
      setWebhookStates(initialWebhook);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [actor, session?.email]);

  useEffect(() => {
    if (!isFetching && actor && isSuperAdmin) {
      fetchClients();
    } else if (!isFetching) {
      setLoading(false);
    }
  }, [actor, isFetching, isSuperAdmin, fetchClients]);

  // Clean up timers on unmount
  useEffect(() => {
    const timers = savedTimers.current;
    const sTimers = stripeTimers.current ?? {};
    const wTimers = webhookTimers.current ?? {};
    const cTimers = copiedTimers.current ?? {};
    return () => {
      for (const id of Object.values(timers)) clearTimeout(id);
      for (const id of Object.values(sTimers)) clearTimeout(id);
      for (const id of Object.values(wTimers)) clearTimeout(id);
      for (const id of Object.values(cTimers)) clearTimeout(id);
    };
  }, []);

  const handleStripeChange = (
    clientId: string,
    field: "inputValue" | "selectedStatus",
    value: string,
  ) => {
    setStripeRowStates((prev) => ({
      ...prev,
      [clientId]: { ...prev[clientId], [field]: value },
    }));
  };

  const handleStripeSave = useCallback(
    async (clientId: string) => {
      if (!actor || !session?.email) return;
      const row = stripeRowStates[clientId];
      if (!row) return;

      if (stripeTimers.current?.[clientId])
        clearTimeout(stripeTimers.current[clientId]);

      setStripeRowStates((prev) => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          saveStatus: "saving",
          errorMessage: "",
        },
      }));

      try {
        const result = await (
          actor as unknown as Record<
            string,
            (
              a: string,
              b: string,
              c: string,
            ) => Promise<{ __kind__: "ok" } | { __kind__: "err"; err: string }>
          >
        ).updateClientStripeAccountId(
          clientId,
          row.inputValue,
          row.selectedStatus,
        );
        if (result.__kind__ === "ok") {
          // Update local clients list in place
          setClients((prev) =>
            prev.map((c) =>
              c.id === clientId
                ? {
                    ...c,
                    stripeConnectAccountId: row.inputValue || undefined,
                    stripeConnectStatus: row.selectedStatus,
                  }
                : c,
            ),
          );
          setStripeRowStates((prev) => ({
            ...prev,
            [clientId]: {
              ...prev[clientId],
              saveStatus: "saved",
              errorMessage: "",
            },
          }));
          if (!stripeTimers.current) stripeTimers.current = {};
          stripeTimers.current[clientId] = setTimeout(() => {
            setStripeRowStates((prev) => ({
              ...prev,
              [clientId]: { ...prev[clientId], saveStatus: "idle" },
            }));
          }, 1500);
        } else {
          setStripeRowStates((prev) => ({
            ...prev,
            [clientId]: {
              ...prev[clientId],
              saveStatus: "error",
              errorMessage:
                result.__kind__ === "err" ? result.err : "Unknown error",
            },
          }));
        }
      } catch (e) {
        setStripeRowStates((prev) => ({
          ...prev,
          [clientId]: {
            ...prev[clientId],
            saveStatus: "error",
            errorMessage: e instanceof Error ? e.message : "Save failed",
          },
        }));
      }
    },
    [actor, session?.email, stripeRowStates],
  );

  // --- Webhook secret handlers ---
  const handleWebhookReveal = (clientId: string) => {
    setWebhookStates((prev) => ({
      ...prev,
      [clientId]: { ...prev[clientId], revealed: !prev[clientId].revealed },
    }));
  };

  const handleWebhookValueChange = (clientId: string, value: string) => {
    setWebhookStates((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        value,
        saveStatus: "idle",
        errorMessage: "",
      },
    }));
  };

  const handleWebhookCopy = (clientId: string) => {
    const val = webhookStates[clientId]?.value;
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      setWebhookStates((prev) => ({
        ...prev,
        [clientId]: { ...prev[clientId], copied: true },
      }));
      if (copiedTimers.current[clientId])
        clearTimeout(copiedTimers.current[clientId]);
      copiedTimers.current[clientId] = setTimeout(() => {
        setWebhookStates((prev) => ({
          ...prev,
          [clientId]: { ...prev[clientId], copied: false },
        }));
      }, 1800);
    });
  };

  const handleWebhookSave = useCallback(
    async (clientId: string) => {
      if (!actor || !session?.email) return;
      const ws = webhookStates[clientId];
      if (!ws) return;
      if (webhookTimers.current[clientId])
        clearTimeout(webhookTimers.current[clientId]);

      setWebhookStates((prev) => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          saveStatus: "saving",
          errorMessage: "",
        },
      }));

      try {
        const result = await (
          actor as unknown as Record<
            string,
            (
              a: string,
              b: string,
            ) => Promise<{ __kind__: "ok" } | { __kind__: "err"; err: string }>
          >
        ).setClientWebhookSecret(clientId, ws.value);

        if (result.__kind__ === "ok") {
          setWebhookStates((prev) => ({
            ...prev,
            [clientId]: {
              ...prev[clientId],
              saveStatus: "saved",
              errorMessage: "",
            },
          }));
          webhookTimers.current[clientId] = setTimeout(() => {
            setWebhookStates((prev) => ({
              ...prev,
              [clientId]: { ...prev[clientId], saveStatus: "idle" },
            }));
          }, 2500);
        } else {
          setWebhookStates((prev) => ({
            ...prev,
            [clientId]: {
              ...prev[clientId],
              saveStatus: "error",
              errorMessage:
                result.__kind__ === "err" ? result.err : "Unknown error",
            },
          }));
        }
      } catch (e) {
        setWebhookStates((prev) => ({
          ...prev,
          [clientId]: {
            ...prev[clientId],
            saveStatus: "error",
            errorMessage: e instanceof Error ? e.message : "Save failed",
          },
        }));
      }
    },
    [actor, session?.email, webhookStates],
  );

  // --- Sort helpers ---
  const handleSortClick = (field: "lastActivity" | "connectedAt") => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const nsToDateStr = (ns: bigint): string => {
    const ms = Number(ns / 1_000_000n);
    return new Date(ms).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const sortedClients = useMemo(() => {
    if (!sortField) return clients;
    return [...clients].sort((a, b) => {
      let aVal: bigint;
      let bVal: bigint;
      if (sortField === "lastActivity") {
        aVal = a.lastActivityAt ?? 0n;
        bVal = b.lastActivityAt ?? 0n;
      } else {
        aVal = a.connectedAt ?? 0n;
        bVal = b.connectedAt ?? 0n;
      }
      // desc = newest first: b > a -> positive (b before a)
      if (sortDir === "desc") {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      }
      // asc = oldest first: b > a -> negative (a before b)
      return bVal > aVal ? -1 : bVal < aVal ? 1 : 0;
    });
  }, [clients, sortField, sortDir]);

  const handleFeeChange = (clientId: string, value: number) => {
    setRowStates((prev) => ({
      ...prev,
      [clientId]: { ...prev[clientId], fee: value },
    }));
  };

  const handleSave = useCallback(
    async (clientId: string) => {
      if (!actor || !session?.email) return;
      const row = rowStates[clientId];
      if (!row) return;

      // Clear any pending "saved" timer
      if (savedTimers.current[clientId])
        clearTimeout(savedTimers.current[clientId]);

      setRowStates((prev) => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          saveStatus: "saving",
          errorMessage: "",
        },
      }));

      try {
        const result = await actor.updateClientPlatformFee(clientId, row.fee);
        if (result.__kind__ === "ok") {
          setRowStates((prev) => ({
            ...prev,
            [clientId]: {
              ...prev[clientId],
              saveStatus: "saved",
              errorMessage: "",
            },
          }));
          savedTimers.current[clientId] = setTimeout(() => {
            setRowStates((prev) => ({
              ...prev,
              [clientId]: { ...prev[clientId], saveStatus: "idle" },
            }));
          }, 2500);
        } else {
          setRowStates((prev) => ({
            ...prev,
            [clientId]: {
              ...prev[clientId],
              saveStatus: "error",
              errorMessage:
                result.__kind__ === "err" ? result.err : "Unknown error",
            },
          }));
        }
      } catch (e) {
        setRowStates((prev) => ({
          ...prev,
          [clientId]: {
            ...prev[clientId],
            saveStatus: "error",
            errorMessage: e instanceof Error ? e.message : "Save failed",
          },
        }));
      }
    },
    [actor, session?.email, rowStates],
  );

  return (
    <AdminLayout>
      <div
        className="min-h-screen"
        style={{ background: "#050f05", padding: "32px 24px" }}
      >
        {/* Page header */}
        <div className="mb-8 flex items-start gap-4">
          <div
            style={{
              background: "rgba(0,255,70,0.1)",
              border: "1px solid rgba(0,255,70,0.3)",
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Globe size={24} style={{ color: "rgba(0,255,70,0.9)" }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "rgba(0,255,70,0.95)", letterSpacing: "-0.02em" }}
            >
              Platform Overview
            </h1>
            <p
              style={{
                color: "rgba(0,255,70,0.5)",
                fontSize: 13,
                marginTop: 2,
              }}
            >
              God Mode — Manage connected client accounts and platform fees.
            </p>
          </div>
        </div>

        {/* Access denied */}
        {!isSuperAdmin && (
          <div
            data-ocid="platform.error_state"
            style={{
              background: "rgba(0,255,70,0.06)",
              border: "1px solid rgba(0,255,70,0.25)",
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "rgba(0,255,70,0.7)",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Super Admin Only
            </p>
            <p
              style={{
                color: "rgba(0,255,70,0.4)",
                marginTop: 8,
                fontSize: 14,
              }}
            >
              This section is restricted. Only the platform owner can access the
              God Mode dashboard.
            </p>
          </div>
        )}

        {/* Loading */}
        {isSuperAdmin && loading && (
          <div
            data-ocid="platform.loading_state"
            style={{ textAlign: "center", padding: 60 }}
          >
            <div
              style={{
                display: "inline-block",
                width: 32,
                height: 32,
                border: "3px solid rgba(0,255,70,0.15)",
                borderTopColor: "rgba(0,255,70,0.8)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p
              style={{
                color: "rgba(0,255,70,0.5)",
                marginTop: 12,
                fontSize: 13,
              }}
            >
              Loading connected clients…
            </p>
            <style>
              {"@keyframes spin { to { transform: rotate(360deg); } }"}
            </style>
          </div>
        )}

        {/* Fetch error */}
        {isSuperAdmin && !loading && fetchError && (
          <div
            data-ocid="platform.error_state"
            style={{
              background: "rgba(255,50,50,0.08)",
              border: "1px solid rgba(255,80,80,0.3)",
              borderRadius: 10,
              padding: 24,
              color: "rgba(255,100,100,0.9)",
              fontSize: 14,
            }}
          >
            {fetchError}
          </div>
        )}

        {/* Empty state */}
        {isSuperAdmin && !loading && !fetchError && clients.length === 0 && (
          <div
            data-ocid="platform.empty_state"
            style={{
              background: "rgba(0,255,70,0.04)",
              border: "1px dashed rgba(0,255,70,0.2)",
              borderRadius: 12,
              padding: 48,
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "rgba(0,255,70,0.55)",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              No clients yet.
            </p>
            <p
              style={{
                color: "rgba(0,255,70,0.3)",
                fontSize: 13,
                marginTop: 6,
              }}
            >
              Add clients via the CRM to manage their platform fees.
            </p>
          </div>
        )}

        {/* Platform Total Volume summary card */}
        {isSuperAdmin && !loading && !fetchError && clients.length > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(0,20,0,0.75)",
              border: "1px solid rgba(0,255,70,0.25)",
              borderRadius: 10,
              padding: "12px 20px",
              marginBottom: 24,
              backdropFilter: "blur(6px)",
            }}
          >
            <span
              style={{
                color: "rgba(0,255,70,0.5)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Total Platform Volume
            </span>
            <span
              data-ocid="platform.total_volume"
              style={{
                color: "rgba(0,255,70,0.95)",
                fontSize: 20,
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {platformTotalVolume.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </span>
          </div>
        )}

        {/* Data table */}
        {isSuperAdmin && !loading && !fetchError && clients.length > 0 && (
          <div
            data-ocid="platform.table"
            style={{
              background: "rgba(0,20,0,0.7)",
              border: "1px solid rgba(0,255,70,0.15)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "rgba(0,255,70,0.07)",
                      borderBottom: "1px solid rgba(0,255,70,0.15)",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "rgba(0,255,70,0.6)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      Client / Business Name
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "rgba(0,255,70,0.6)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      Stripe Account ID
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "rgba(0,255,70,0.6)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      Connection Status
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "rgba(0,255,70,0.6)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      Platform Fee %
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "rgba(0,255,70,0.6)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      Total Volume
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "rgba(0,255,70,0.6)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      Webhook Secret
                    </th>
                    <th
                      onClick={() => handleSortClick("lastActivity")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleSortClick("lastActivity");
                      }}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color:
                          sortField === "lastActivity"
                            ? "rgba(0,255,70,1)"
                            : "rgba(0,255,70,0.6)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                        cursor: "pointer",
                        userSelect: "none" as const,
                      }}
                    >
                      Last Activity{" "}
                      {sortField === "lastActivity"
                        ? sortDir === "desc"
                          ? "▼"
                          : "▲"
                        : "⇅"}
                    </th>
                    <th
                      onClick={() => handleSortClick("connectedAt")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleSortClick("connectedAt");
                      }}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color:
                          sortField === "connectedAt"
                            ? "rgba(0,255,70,1)"
                            : "rgba(0,255,70,0.6)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                        cursor: "pointer",
                        userSelect: "none" as const,
                      }}
                    >
                      Connected Date{" "}
                      {sortField === "connectedAt"
                        ? sortDir === "desc"
                          ? "▼"
                          : "▲"
                        : "⇅"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients.map((client, idx) => {
                    const rowState = rowStates[client.id] ?? {
                      fee: client.platformFeePercentage,
                      saveStatus: "idle" as SaveStatus,
                      errorMessage: "",
                    };
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={client.id}
                        data-ocid={`platform.item.${idx + 1}`}
                        style={{
                          background: isEven
                            ? "rgba(0,15,0,0.5)"
                            : "rgba(0,25,0,0.4)",
                          borderBottom: "1px solid rgba(0,255,70,0.07)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.background = "rgba(0,255,70,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.background = isEven
                            ? "rgba(0,15,0,0.5)"
                            : "rgba(0,25,0,0.4)";
                        }}
                      >
                        {/* Name */}
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "rgba(220,255,220,0.9)",
                            fontSize: 14,
                            fontWeight: 500,
                            maxWidth: 200,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {client.name}
                        </td>

                        {/* Stripe Account ID + Status — inline editable, spans 2 columns */}
                        <td style={{ padding: "14px 16px" }} colSpan={2}>
                          <StripeIdControl
                            clientId={client.id}
                            row={
                              stripeRowStates[client.id] ?? {
                                inputValue: client.stripeConnectAccountId ?? "",
                                selectedStatus: (
                                  STATUS_OPTIONS as readonly string[]
                                ).includes(client.stripeConnectStatus)
                                  ? client.stripeConnectStatus
                                  : "pending",
                                saveStatus: "idle",
                                errorMessage: "",
                              }
                            }
                            onChange={handleStripeChange}
                            onSave={handleStripeSave}
                          />
                        </td>

                        {/* Platform fee control */}
                        <td style={{ padding: "14px 16px" }}>
                          <FeeControl
                            clientId={client.id}
                            row={rowState}
                            onFeeChange={handleFeeChange}
                            onSave={handleSave}
                          />
                        </td>

                        {/* Total Volume — from order records */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              color: "rgba(0,255,70,0.7)",
                              fontSize: 14,
                              fontFamily: "monospace",
                            }}
                          >
                            {volumeMap[client.id] !== undefined
                              ? volumeMap[client.id].toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                })
                              : "—"}
                          </span>
                        </td>

                        {/* Webhook Secret */}
                        <td style={{ padding: "14px 16px", minWidth: 220 }}>
                          {webhookStates[client.id] && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "monospace",
                                    fontSize: 12,
                                    color: "rgba(0,255,70,0.85)",
                                  }}
                                >
                                  {webhookStates[client.id].revealed
                                    ? webhookStates[client.id].value ||
                                      "(none set)"
                                    : "whsec_••••••••"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleWebhookReveal(client.id)}
                                  style={{
                                    fontSize: 11,
                                    padding: "2px 7px",
                                    background: "rgba(0,255,70,0.08)",
                                    border: "1px solid rgba(0,255,70,0.3)",
                                    borderRadius: 4,
                                    color: "rgba(0,255,70,0.8)",
                                    cursor: "pointer",
                                  }}
                                >
                                  {webhookStates[client.id].revealed
                                    ? "Hide"
                                    : "Show"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWebhookCopy(client.id)}
                                  style={{
                                    fontSize: 11,
                                    padding: "2px 7px",
                                    background: "rgba(0,255,70,0.08)",
                                    border: "1px solid rgba(0,255,70,0.3)",
                                    borderRadius: 4,
                                    color: webhookStates[client.id].copied
                                      ? "rgba(0,255,70,1)"
                                      : "rgba(0,255,70,0.8)",
                                    cursor: "pointer",
                                  }}
                                >
                                  {webhookStates[client.id].copied
                                    ? "Copied!"
                                    : "Copy"}
                                </button>
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <input
                                  value={webhookStates[client.id].value}
                                  onChange={(e) =>
                                    handleWebhookValueChange(
                                      client.id,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter whsec_..."
                                  style={{
                                    fontSize: 11,
                                    padding: "3px 7px",
                                    background: "rgba(0,20,0,0.6)",
                                    border: "1px solid rgba(0,255,70,0.25)",
                                    borderRadius: 4,
                                    color: "rgba(0,255,70,0.9)",
                                    flex: 1,
                                    minWidth: 0,
                                    fontFamily: "monospace",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleWebhookSave(client.id)}
                                  disabled={
                                    webhookStates[client.id].saveStatus ===
                                    "saving"
                                  }
                                  style={{
                                    fontSize: 11,
                                    padding: "3px 10px",
                                    background:
                                      webhookStates[client.id].saveStatus ===
                                      "saved"
                                        ? "rgba(0,255,70,0.25)"
                                        : "rgba(0,255,70,0.12)",
                                    border: "1px solid rgba(0,255,70,0.4)",
                                    borderRadius: 4,
                                    color: "rgba(0,255,70,0.9)",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap" as const,
                                  }}
                                >
                                  {webhookStates[client.id].saveStatus ===
                                  "saving"
                                    ? "Saving..."
                                    : webhookStates[client.id].saveStatus ===
                                        "saved"
                                      ? "Saved!"
                                      : "Save"}
                                </button>
                              </div>
                              {webhookStates[client.id].errorMessage && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "rgba(255,80,80,0.9)",
                                  }}
                                >
                                  {webhookStates[client.id].errorMessage}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Last Activity */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              color: "rgba(200,200,200,0.7)",
                              fontSize: 13,
                            }}
                          >
                            {client.lastActivityAt != null
                              ? nsToDateStr(client.lastActivityAt)
                              : "—"}
                          </span>
                        </td>

                        {/* Connected Date */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              color: "rgba(200,200,200,0.7)",
                              fontSize: 13,
                            }}
                          >
                            {client.connectedAt != null
                              ? nsToDateStr(client.connectedAt)
                              : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
