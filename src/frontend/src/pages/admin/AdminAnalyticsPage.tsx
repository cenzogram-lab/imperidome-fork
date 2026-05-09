import { Activity } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { backendInterface } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

// ─── Styles ────────────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "rgba(17,19,34,0.7)",
  border: "1px solid #1C1F33",
  borderRadius: 10,
  padding: "20px 24px",
};

const TABLE_TH: React.CSSProperties = {
  textAlign: "left",
  padding: "11px 14px",
  fontSize: 11,
  fontWeight: 700,
  color: "#7A7D90",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "1px solid #1C1F33",
  background: "rgba(14,16,32,0.9)",
  position: "sticky",
  top: 0,
  whiteSpace: "nowrap",
};

const TABLE_TD: React.CSSProperties = {
  padding: "11px 14px",
  fontSize: 13,
  color: "#EEF0F8",
  borderBottom: "1px solid rgba(28,31,51,0.6)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface VisitorStats {
  todayUnique: number;
  todaySessions: number;
  weekUnique: number;
  weekSessions: number;
  monthUnique: number;
  monthSessions: number;
  allTimeUnique: number;
  allTimeSessions: number;
}

interface ChartPoint {
  date: string;
  visitors: number;
}

// ─── Format helpers ────────────────────────────────────────────────────────────
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtPct(pct: number): string {
  return `${(pct * 100).toFixed(1)}%`;
}

// ─── Live Pulse Dot ───────────────────────────────────────────────────────────
function PulseDot() {
  return (
    <>
      <style>{`
        @keyframes liveRingPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
      `}</style>
      <span
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#5EF08A",
            opacity: 0.25,
            animation: "liveRingPulse 1.8s ease-out infinite",
          }}
        />
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#5EF08A",
            position: "relative",
          }}
        />
      </span>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const { actor, isFetching } = useActor();
  const adminEmail = getSession()?.email ?? "";

  // Live visitor state
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  // Stats state
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Chart state
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  // Top pages state
  const [topPages, setTopPages] = useState<Array<[string, number, number]>>([]);
  const [pagesLoading, setPagesLoading] = useState(true);

  // Countries state
  const [countries, setCountries] = useState<Array<[string, number, number]>>(
    [],
  );
  const [countriesLoading, setCountriesLoading] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch live count
  async function fetchLiveCount() {
    if (!actor) return;
    try {
      const result = await (actor as backendInterface).getLiveVisitorCount(
        adminEmail,
      );
      setLiveCount(Number(result));
      setLastUpdated(new Date());
    } catch {
      // fail silently — keep old value
    } finally {
      setLiveLoading(false);
    }
  }

  // Fetch all static data on mount
  async function fetchStats() {
    if (!actor) return;
    try {
      const raw = await (actor as backendInterface).getVisitorStats(adminEmail);
      setStats({
        todayUnique: Number(raw.todayUnique),
        todaySessions: Number(raw.todaySessions),
        weekUnique: Number(raw.weekUnique),
        weekSessions: Number(raw.weekSessions),
        monthUnique: Number(raw.monthUnique),
        monthSessions: Number(raw.monthSessions),
        allTimeUnique: Number(raw.allTimeUnique),
        allTimeSessions: Number(raw.allTimeSessions),
      });
    } catch {
      // fail silently
    } finally {
      setStatsLoading(false);
    }
  }

  async function fetchChart() {
    if (!actor) return;
    try {
      const raw = await (actor as backendInterface).getDailyVisitorChart(
        adminEmail,
      );
      const points: ChartPoint[] = raw.map(([dateStr, count]) => ({
        date: dateStr,
        visitors: Number(count),
      }));
      setChartData(points);
    } catch {
      // fail silently
    } finally {
      setChartLoading(false);
    }
  }

  async function fetchTopPages() {
    if (!actor) return;
    try {
      const raw = await (actor as backendInterface).getTopPages(adminEmail);
      setTopPages(raw.map(([path, count, pct]) => [path, Number(count), pct]));
    } catch {
      // fail silently
    } finally {
      setPagesLoading(false);
    }
  }

  async function fetchCountries() {
    if (!actor) return;
    try {
      const raw = await (actor as backendInterface).getCountryBreakdown(
        adminEmail,
      );
      setCountries(
        raw.map(([country, count, pct]) => [country, Number(count), pct]),
      );
    } catch {
      // fail silently
    } finally {
      setCountriesLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch functions are stable references defined outside the effect
  useEffect(() => {
    if (!actor || isFetching) return;

    fetchLiveCount();
    fetchStats();
    fetchChart();
    fetchTopPages();
    fetchCountries();

    // Poll live count every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchLiveCount();
    }, 30_000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, isFetching]);

  return (
    <AdminLayout pageTitle="Analytics">
      <div
        data-ocid="analytics.page"
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* ── Page Header ── */}
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#EEF0F8",
            }}
          >
            Analytics
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#7A7D90",
            }}
          >
            Site traffic insights — anonymous sessions only, no personal data
          </p>
        </div>

        {/* ── Live Visitor Card ── */}
        <div
          data-ocid="analytics.live_visitors.card"
          style={{
            ...CARD,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            borderColor: "rgba(94,240,138,0.25)",
            background: "rgba(17,19,34,0.85)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "rgba(94,240,138,0.12)",
                border: "1px solid rgba(94,240,138,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Activity size={22} color="#5EF08A" />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <PulseDot />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#5EF08A",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Live Right Now
                </span>
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 900,
                  color: "#EEF0F8",
                  lineHeight: 1,
                }}
              >
                {liveLoading ? (
                  <span style={{ fontSize: 28, color: "#7A7D90" }}>…</span>
                ) : (
                  (liveCount ?? "—")
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#7A7D90",
                  marginTop: 4,
                }}
              >
                unique visitors in the last 5 minutes
              </div>
            </div>
          </div>
          <div
            data-ocid="analytics.live_visitors.last_updated"
            style={{
              fontSize: 12,
              color: "#3A3D50",
              textAlign: "right",
            }}
          >
            {lastUpdated ? (
              <>
                Last updated at{" "}
                <span style={{ color: "#7A7D90", fontWeight: 600 }}>
                  {fmtTime(lastUpdated)}
                </span>
              </>
            ) : (
              "Polling every 30 seconds"
            )}
          </div>
        </div>

        {/* ── Time-Grouped Stats Grid ── */}
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#EEF0F8",
              marginBottom: 14,
            }}
          >
            Visitor Totals
          </div>
          <div
            data-ocid="analytics.stats.grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
            }}
          >
            {(
              [
                {
                  label: "Today",
                  unique: stats?.todayUnique,
                  sessions: stats?.todaySessions,
                  color: "#5EF08A",
                  ocid: "analytics.stats.today.card",
                },
                {
                  label: "This Week",
                  unique: stats?.weekUnique,
                  sessions: stats?.weekSessions,
                  color: "#60a5fa",
                  ocid: "analytics.stats.week.card",
                },
                {
                  label: "This Month",
                  unique: stats?.monthUnique,
                  sessions: stats?.monthSessions,
                  color: "#fbbf24",
                  ocid: "analytics.stats.month.card",
                },
                {
                  label: "All Time",
                  unique: stats?.allTimeUnique,
                  sessions: stats?.allTimeSessions,
                  color: "#a78bfa",
                  ocid: "analytics.stats.alltime.card",
                },
              ] as const
            ).map((c) => (
              <div
                key={c.label}
                data-ocid={c.ocid}
                style={{
                  background: "rgba(17,19,34,0.7)",
                  border: "1px solid #1C1F33",
                  borderRadius: 10,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  {c.label}
                </div>
                {statsLoading ? (
                  <div style={{ fontSize: 13, color: "#3A3D50" }}>Loading…</div>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 800,
                        color: c.color,
                        lineHeight: 1,
                      }}
                    >
                      {c.unique?.toLocaleString() ?? "—"}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#7A7D90", marginTop: 6 }}
                    >
                      Unique Visitors
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#3A3D50",
                        marginTop: 2,
                      }}
                    >
                      {c.sessions?.toLocaleString() ?? "—"} sessions
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── 30-Day Trend Chart ── */}
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#EEF0F8",
              marginBottom: 14,
            }}
          >
            Visitor Trend — Last 30 Days
          </div>
          <div
            data-ocid="analytics.chart.section"
            style={{
              ...CARD,
              padding: "20px 16px",
              overflowX: "auto",
            }}
          >
            {chartLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#7A7D90",
                  fontSize: 14,
                }}
              >
                Loading chart…
              </div>
            ) : chartData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#7A7D90",
                  fontSize: 14,
                }}
              >
                No visitor data yet. Start receiving traffic to see trends.
              </div>
            ) : (
              <div style={{ minWidth: 560 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 55 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C1F33" />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fill: "#9ca3af",
                        fontSize: 10,
                      }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      formatter={(v: number | string) => [
                        `${Number(v).toLocaleString()} visitors`,
                        "Visitors",
                      ]}
                      contentStyle={{
                        background: "#0E1020",
                        border: "1px solid #1C1F33",
                        borderRadius: 8,
                        color: "#EEF0F8",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="visitors"
                      fill="#5EF08A"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ── Top Pages Table ── */}
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#EEF0F8",
              marginBottom: 14,
            }}
          >
            Top Pages
          </div>
          <div
            data-ocid="analytics.top_pages.section"
            style={{
              ...CARD,
              padding: 0,
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 480,
              }}
            >
              <thead>
                <tr>
                  {["#", "Page", "Visits", "% Traffic"].map((h) => (
                    <th key={h} scope="col" style={TABLE_TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagesLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        ...TABLE_TD,
                        textAlign: "center",
                        color: "#7A7D90",
                        padding: "32px 14px",
                      }}
                    >
                      Loading…
                    </td>
                  </tr>
                ) : topPages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      data-ocid="analytics.top_pages.empty_state"
                      style={{
                        ...TABLE_TD,
                        textAlign: "center",
                        color: "#7A7D90",
                        padding: "32px 14px",
                      }}
                    >
                      No page data yet
                    </td>
                  </tr>
                ) : (
                  topPages.map(([path, count, pct], idx) => (
                    <tr
                      key={path}
                      data-ocid={`analytics.top_pages.item.${idx + 1}`}
                      style={{
                        transition: "background 0.1s",
                      }}
                    >
                      <td
                        style={{
                          ...TABLE_TD,
                          width: 40,
                          color: "#3A3D50",
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td
                        style={{
                          ...TABLE_TD,
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#9DA0B3",
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {path}
                      </td>
                      <td
                        style={{
                          ...TABLE_TD,
                          fontWeight: 700,
                          color: "#EEF0F8",
                          textAlign: "right",
                        }}
                      >
                        {count.toLocaleString()}
                      </td>
                      <td
                        style={{
                          ...TABLE_TD,
                          textAlign: "right",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            minWidth: 80,
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              height: 5,
                              background: "#1C1F33",
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                height: "100%",
                                width: `${Math.min(pct * 100, 100)}%`,
                                background: "#5EF08A",
                                borderRadius: 3,
                              }}
                            />
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "#7A7D90",
                              whiteSpace: "nowrap",
                              minWidth: 42,
                              textAlign: "right",
                            }}
                          >
                            {fmtPct(pct)}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Countries Table ── */}
        <div style={{ paddingBottom: 32 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#EEF0F8",
              marginBottom: 14,
            }}
          >
            Visitor Geography
          </div>
          <div
            data-ocid="analytics.countries.section"
            style={{
              ...CARD,
              padding: 0,
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 400,
              }}
            >
              <thead>
                <tr>
                  {["Country", "Visitors", "% of Total"].map((h) => (
                    <th key={h} scope="col" style={TABLE_TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {countriesLoading ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        ...TABLE_TD,
                        textAlign: "center",
                        color: "#7A7D90",
                        padding: "32px 14px",
                      }}
                    >
                      Loading…
                    </td>
                  </tr>
                ) : countries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      data-ocid="analytics.countries.empty_state"
                      style={{
                        ...TABLE_TD,
                        textAlign: "center",
                        color: "#7A7D90",
                        padding: "32px 14px",
                      }}
                    >
                      No geography data yet
                    </td>
                  </tr>
                ) : (
                  countries.map(([country, count, pct], idx) => (
                    <tr
                      key={country}
                      data-ocid={`analytics.countries.item.${idx + 1}`}
                    >
                      <td
                        style={{
                          ...TABLE_TD,
                          fontWeight: 600,
                        }}
                      >
                        {country || "Unknown"}
                      </td>
                      <td
                        style={{
                          ...TABLE_TD,
                          fontWeight: 700,
                          textAlign: "right",
                        }}
                      >
                        {count.toLocaleString()}
                      </td>
                      <td
                        style={{
                          ...TABLE_TD,
                          textAlign: "right",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            minWidth: 80,
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              height: 5,
                              background: "#1C1F33",
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                height: "100%",
                                width: `${Math.min(pct * 100, 100)}%`,
                                background: "#60a5fa",
                                borderRadius: 3,
                              }}
                            />
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "#7A7D90",
                              whiteSpace: "nowrap",
                              minWidth: 42,
                              textAlign: "right",
                            }}
                          >
                            {fmtPct(pct)}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
