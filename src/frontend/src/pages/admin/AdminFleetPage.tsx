import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

interface FleetCanister {
  id: string;
  name: string;
  created_at: bigint;
}

interface CycleData {
  balance: bigint | null;
  loading: boolean;
  error: boolean;
  errorMessage: string | null;
}

type FleetTab = "sites" | "software";

// Thresholds in cycles
const CRITICAL_THRESHOLD = 500_000_000_000n; // 0.5T
const LOW_THRESHOLD = 1_000_000_000_000n; // 1T

function formatCycles(balance: bigint | null): string {
  if (balance === null) return "--";
  const t = Number(balance) / 1_000_000_000_000;
  if (t >= 0.01) return `${t.toFixed(2)}T cycles`;
  const b = Number(balance) / 1_000_000_000;
  if (b >= 1) return `${b.toFixed(1)}B cycles`;
  return `${Number(balance).toLocaleString()} cycles`;
}

type CycleStatus = "healthy" | "low" | "critical" | "unknown";

function getCycleStatus(balance: bigint | null): CycleStatus {
  if (balance === null) return "unknown";
  if (balance < CRITICAL_THRESHOLD) return "critical";
  if (balance < LOW_THRESHOLD) return "low";
  return "healthy";
}

function cycleColor(balance: bigint | null): string {
  const s = getCycleStatus(balance);
  if (s === "healthy") return "#EEF0F8";
  if (s === "low") return "#F59E0B";
  if (s === "critical") return "#EF4444";
  return "#7A7D90";
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timed out after ${ms / 1000}s (${label})`)),
        ms,
      ),
    ),
  ]);
}

interface FleetPanelProps {
  actor: Record<string, (...args: unknown[]) => Promise<unknown>> | null;
  getFleet: (adminEmail: string) => Promise<FleetCanister[]>;
  addCanister: (
    adminEmail: string,
    name: string,
    canisterId: string,
  ) => Promise<unknown>;
  removeCanister: (adminEmail: string, canisterId: string) => Promise<unknown>;
  ocidPrefix: string;
}

function FleetPanel({
  actor,
  getFleet,
  addCanister,
  removeCanister,
  ocidPrefix,
}: FleetPanelProps) {
  const [canisters, setCanisters] = useState<FleetCanister[]>([]);
  const [cycles, setCycles] = useState<Record<string, CycleData>>({});
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addId, setAddId] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCycles = useCallback(
    async (canisterList: FleetCanister[]) => {
      if (!actor || canisterList.length === 0) return;
      const results = await Promise.all(
        canisterList.map(async (c) => {
          try {
            const raw = await withTimeout(
              (actor as unknown as backendInterface).getCanisterCycles(
                c.id,
              ) as Promise<unknown>,
              10_000,
              c.id,
            );
            if (raw == null) {
              return {
                id: c.id,
                balance: null,
                error: true,
                errorMessage: "No response from backend",
              };
            }
            const result = raw as Record<string, unknown>;
            if ("ok" in result) {
              const bal = result.ok;
              const balance: bigint =
                typeof bal === "bigint"
                  ? bal
                  : typeof bal === "number"
                    ? BigInt(bal)
                    : (null as unknown as bigint);
              return { id: c.id, balance, error: false, errorMessage: null };
            }
            if ("err" in result) {
              const errMsg =
                typeof result.err === "string"
                  ? result.err
                  : String(result.err);
              console.error(
                `[Fleet] getCanisterCycles #err for ${c.id}:`,
                errMsg,
              );
              return {
                id: c.id,
                balance: null,
                error: true,
                errorMessage: errMsg,
              };
            }
            const shape = JSON.stringify(raw);
            console.error(
              `[Fleet] Unexpected response shape for ${c.id}:`,
              shape,
            );
            return {
              id: c.id,
              balance: null,
              error: true,
              errorMessage: `Unexpected response: ${shape}`,
            };
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[Fleet] getCanisterCycles threw for ${c.id}:`, msg);
            return { id: c.id, balance: null, error: true, errorMessage: msg };
          }
        }),
      );
      setCycles((prev) => {
        const next = { ...prev };
        for (const r of results) {
          next[r.id] = {
            balance: r.balance,
            loading: false,
            error: r.error,
            errorMessage: r.errorMessage,
          };
        }
        return next;
      });
    },
    [actor],
  );

  const loadFleet = useCallback(async () => {
    if (!actor) return;
    setListLoading(true);
    setListError(null);
    try {
      const list = await getFleet(getAdminEmail());
      setCanisters(list);
      const loadingMap: Record<string, CycleData> = {};
      for (const c of list) {
        loadingMap[c.id] = {
          balance: null,
          loading: true,
          error: false,
          errorMessage: null,
        };
      }
      setCycles(loadingMap);
      setListLoading(false);
      await fetchCycles(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setListError(`Failed to load fleet: ${msg}`);
      setListLoading(false);
    }
  }, [actor, getFleet, fetchCycles]);

  useEffect(() => {
    if (!actor) return;
    loadFleet();
  }, [actor, loadFleet]);

  useEffect(() => {
    if (!actor) return;
    intervalRef.current = setInterval(() => {
      if (canisters.length > 0) fetchCycles(canisters);
    }, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [actor, canisters, fetchCycles]);

  async function handleRemove(canisterId: string) {
    if (!actor) return;
    const canister = canisters.find((c) => c.id === canisterId);
    const label = canister?.name ?? canisterId;
    const confirmed = window.confirm(`Remove ${label} from the fleet?`);
    if (!confirmed) return;
    try {
      await removeCanister(getAdminEmail(), canisterId);
      await loadFleet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setListError(`Failed to remove canister: ${msg}`);
    }
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!addName.trim()) {
      setAddError("Name / Label is required.");
      return;
    }
    if (!addId.trim()) {
      setAddError("Canister ID is required.");
      return;
    }
    const canisterIdRegex =
      /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/;
    if (!canisterIdRegex.test(addId.trim())) {
      setAddError(
        "Please enter a valid canister ID (e.g. jqylk-byaaa-aaaal-qbymq-cai)",
      );
      return;
    }
    const isDuplicate = canisters.some((c) => c.id === addId.trim());
    if (isDuplicate) {
      setAddError("This canister ID is already in the fleet.");
      return;
    }
    if (!actor) return;
    setAddLoading(true);
    try {
      const result = await addCanister(
        getAdminEmail(),
        addName.trim(),
        addId.trim(),
      );
      if (result && typeof result === "object" && "err" in (result as object)) {
        const r = result as Record<string, unknown>;
        setAddError(typeof r.err === "string" ? r.err : String(r.err));
        return;
      }
      setAddName("");
      setAddId("");
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 5000);
      await loadFleet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAddError(`Failed to add canister: ${msg}`);
    } finally {
      setAddLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: "12px",
    border: "1px solid #1C1F33",
    overflow: "hidden",
  };

  return (
    <>
      {/* Loading state */}
      {listLoading && (
        <div
          data-ocid={`${ocidPrefix}.loading_state`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            color: "#7A7D90",
            fontSize: "15px",
            gap: "10px",
          }}
        >
          <span
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid #1C1F33",
              borderTop: "2px solid #5EF08A",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Loading fleet data...
        </div>
      )}

      {/* Error state */}
      {listError && (
        <div
          data-ocid={`${ocidPrefix}.error_state`}
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px",
            padding: "16px 20px",
            color: "#f87171",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          {listError}
        </div>
      )}

      {/* Canister table */}
      {!listLoading && (
        <div
          data-ocid={`${ocidPrefix}.table`}
          style={{ ...cardStyle, marginBottom: "32px", overflowX: "auto" }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                {[
                  "Client Name",
                  "Canister ID",
                  "Status",
                  "Cycles",
                  "Actions",
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#7A7D90",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {canisters.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    data-ocid={`${ocidPrefix}.empty_state`}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#7A7D90",
                      fontSize: "14px",
                      fontStyle: "italic",
                    }}
                  >
                    No canisters in fleet. Add one below.
                  </td>
                </tr>
              ) : (
                canisters.map((canister, i) => {
                  const cycleInfo = cycles[canister.id];
                  const isLoading = cycleInfo?.loading ?? true;
                  const balance = cycleInfo?.balance ?? null;
                  const hasError = cycleInfo?.error ?? false;
                  const errorMessage = cycleInfo?.errorMessage ?? null;
                  const status = isLoading
                    ? "loading"
                    : hasError
                      ? "unknown"
                      : getCycleStatus(balance);
                  const rowNum = i + 1;

                  return (
                    <tr
                      key={canister.id}
                      data-ocid={`${ocidPrefix}.item.${rowNum}`}
                      style={{
                        borderBottom:
                          i < canisters.length - 1
                            ? "1px solid #1C1F33"
                            : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#EEF0F8",
                        }}
                      >
                        {canister.name}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: "13px",
                          color: "#7A7D90",
                          fontFamily: "monospace",
                        }}
                      >
                        {canister.id}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        {status === "loading" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "rgba(122,125,144,0.15)",
                              color: "#7A7D90",
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ⏳ Checking
                          </span>
                        ) : status === "unknown" ? (
                          <span
                            title={
                              errorMessage ?? "Could not fetch cycle balance"
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "rgba(122,125,144,0.15)",
                              color: "#7A7D90",
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              whiteSpace: "nowrap",
                              cursor: "help",
                            }}
                          >
                            ❓ Unknown
                          </span>
                        ) : status === "critical" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "rgba(239,68,68,0.15)",
                              color: "#EF4444",
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            🔴 Critical
                          </span>
                        ) : status === "low" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "rgba(245,158,11,0.15)",
                              color: "#F59E0B",
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ⚠️ Low
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "rgba(94,240,138,0.15)",
                              color: "#5EF08A",
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            🟢 Healthy
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: hasError ? "12px" : "14px",
                          fontWeight: 600,
                          color: isLoading
                            ? "#7A7D90"
                            : hasError
                              ? "#7A7D90"
                              : cycleColor(balance),
                          fontFamily: hasError ? "sans-serif" : "monospace",
                          maxWidth: "220px",
                        }}
                      >
                        {isLoading
                          ? "…"
                          : hasError
                            ? (errorMessage ?? "Fetch failed")
                            : formatCycles(balance)}
                        {(status === "low" || status === "critical") &&
                          !isLoading && (
                            <span
                              style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: 500,
                                color:
                                  status === "critical" ? "#EF4444" : "#F59E0B",
                                marginTop: "2px",
                                fontFamily: "sans-serif",
                              }}
                            >
                              {status === "critical"
                                ? "Critical — top up immediately"
                                : "Low — top up soon"}
                            </span>
                          )}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <button
                          type="button"
                          data-ocid={`${ocidPrefix}.delete_button.${rowNum}`}
                          onClick={() => handleRemove(canister.id)}
                          style={{
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "white",
                            background: "transparent",
                            borderRadius: "6px",
                            padding: "7px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Canister form */}
      <div
        data-ocid={`${ocidPrefix}.panel`}
        style={{ ...cardStyle, padding: "24px" }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#EEF0F8",
            margin: 0,
            marginBottom: "6px",
          }}
        >
          Add Canister to Fleet
        </h2>
        <p
          style={{
            color: "#7A7D90",
            fontSize: "13px",
            margin: 0,
            marginBottom: "20px",
          }}
        >
          Enter a friendly name and the canister ID to start monitoring its
          cycle balance.
        </p>

        <form onSubmit={handleAddSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                htmlFor={`${ocidPrefix}-add-name`}
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#7A7D90",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Name / Label
              </label>
              <input
                id={`${ocidPrefix}-add-name`}
                type="text"
                data-ocid={`${ocidPrefix}.input`}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Acme Corp Website"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid #1C1F33",
                  color: "#EEF0F8",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label
                htmlFor={`${ocidPrefix}-add-id`}
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#7A7D90",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Canister ID
              </label>
              <input
                id={`${ocidPrefix}-add-id`}
                type="text"
                data-ocid={`${ocidPrefix}.search_input`}
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                placeholder="e.g. xxxxx-xxxxx-aaaaa-bbbbb-cai"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid #1C1F33",
                  color: "#EEF0F8",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {addError && (
            <div
              data-ocid={`${ocidPrefix}.field_error`}
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "6px",
                padding: "10px 14px",
                color: "#f87171",
                fontSize: "13px",
                marginBottom: "14px",
              }}
            >
              {addError}
            </div>
          )}

          {addSuccess && (
            <div
              data-ocid={`${ocidPrefix}.success_state`}
              style={{
                background: "rgba(94,240,138,0.1)",
                border: "1px solid rgba(94,240,138,0.3)",
                borderRadius: "6px",
                padding: "10px 14px",
                color: "#5EF08A",
                fontSize: "13px",
                marginBottom: "14px",
              }}
            >
              ✓ Canister added to fleet successfully!
            </div>
          )}

          <button
            type="submit"
            data-ocid={`${ocidPrefix}.submit_button`}
            disabled={addLoading}
            style={{
              background: addLoading ? "rgba(94,240,138,0.5)" : "#5EF08A",
              color: "#061209",
              fontWeight: 700,
              border: "none",
              borderRadius: "6px",
              padding: "10px 24px",
              fontSize: "14px",
              cursor: addLoading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {addLoading ? (
              <>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(6,18,9,0.3)",
                    borderTop: "2px solid #061209",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Adding...
              </>
            ) : (
              "Add to Fleet"
            )}
          </button>
        </form>
      </div>
    </>
  );
}

export default function AdminFleetPage() {
  const { actor, isFetching } = useActor();
  const [activeTab, setActiveTab] = useState<FleetTab>("sites");

  // Stable function references for Sites tab
  const getFleetSites = useCallback(
    (_adminEmail: string) =>
      (actor as backendInterface).getFleetSites() as Promise<FleetCanister[]>,
    [actor],
  );
  const addFleetSite = useCallback(
    (adminEmail: string, name: string, canisterId: string) =>
      (actor as backendInterface).addFleetSite(
        adminEmail,
        name,
        canisterId,
      ) as Promise<unknown>,
    [actor],
  );
  const removeFleetSite = useCallback(
    (adminEmail: string, canisterId: string) =>
      (actor as backendInterface).removeFleetSite(
        adminEmail,
        canisterId,
      ) as Promise<unknown>,
    [actor],
  );

  // Stable function references for Software tab
  const getFleetSoftware = useCallback(
    (_adminEmail: string) =>
      (actor as backendInterface).getFleetSoftware() as Promise<
        FleetCanister[]
      >,
    [actor],
  );
  const addFleetSoftware = useCallback(
    (adminEmail: string, name: string, canisterId: string) =>
      (actor as backendInterface).addFleetSoftware(
        adminEmail,
        name,
        canisterId,
      ) as Promise<unknown>,
    [actor],
  );
  const removeFleetSoftware = useCallback(
    (adminEmail: string, canisterId: string) =>
      (actor as backendInterface).removeFleetSoftware(
        adminEmail,
        canisterId,
      ) as Promise<unknown>,
    [actor],
  );

  const tabActor =
    !actor || isFetching
      ? null
      : (actor as unknown as Record<
          string,
          (...args: unknown[]) => Promise<unknown>
        >);

  const tabs: { id: FleetTab; label: string }[] = [
    { id: "sites", label: "Sites" },
    { id: "software", label: "Software" },
  ];

  return (
    <AdminLayout pageTitle="Fleet Dashboard">
      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#EEF0F8",
            margin: 0,
            marginBottom: "6px",
          }}
        >
          Infrastructure
        </h1>
        <p style={{ color: "#7A7D90", fontSize: "14px", margin: 0 }}>
          Monitor and manage all client canisters — auto-refreshes every 30s
        </p>
      </div>

      {/* Sub-tab bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          borderBottom: "1px solid #1C1F33",
          marginBottom: "28px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-ocid={`fleet.${tab.id}.tab`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? "rgba(94,240,138,0.1)" : "transparent",
                border: "none",
                borderBottom: isActive
                  ? "2px solid #5EF08A"
                  : "2px solid transparent",
                borderRadius: "6px 6px 0 0",
                color: isActive ? "#5EF08A" : "#7A7D90",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: isActive ? 700 : 500,
                padding: "10px 20px",
                transition: "color 0.15s, background 0.15s",
                whiteSpace: "nowrap",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sites panel */}
      {activeTab === "sites" && (
        <FleetPanel
          key="sites"
          actor={tabActor}
          getFleet={getFleetSites}
          addCanister={addFleetSite}
          removeCanister={removeFleetSite}
          ocidPrefix="fleet.sites"
        />
      )}

      {/* Software panel */}
      {activeTab === "software" && (
        <FleetPanel
          key="software"
          actor={tabActor}
          getFleet={getFleetSoftware}
          addCanister={addFleetSoftware}
          removeCanister={removeFleetSoftware}
          ocidPrefix="fleet.software"
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #4A4D60; }
      `}</style>
    </AdminLayout>
  );
}
