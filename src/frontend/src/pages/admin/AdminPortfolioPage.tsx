import { ExternalLink, Globe, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { backendInterface } from "../../backend";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

interface Build {
  id: string;
  clientName: string;
  siteUrl: string;
  addedAt: bigint;
  description: string;
  category: string;
  thumbnailUrl: string;
}

export default function AdminPortfolioPage() {
  const { actor, isFetching } = useActor();

  const [items, setItems] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError(null);
    try {
      const result = await (actor as backendInterface).getPublicBuilds();
      setItems(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load portfolio items",
      );
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    void loadItems();
  }, [actor, isFetching, loadItems]);

  return (
    <AdminLayout pageTitle="Portfolio">
      <style>{`
        @keyframes port-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Page header */}
      <div
        style={{
          background: "rgba(17,19,34,0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid #1C1F33",
          borderRadius: "12px",
          padding: "24px 28px",
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2
            style={{
              color: "#EEF0F8",
              fontSize: "20px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Portfolio Builds
          </h2>
          <p style={{ color: "#7A7D90", fontSize: "14px", margin: "4px 0 0" }}>
            Live builds from the Builds tab — same data as the homepage and
            /our-builds page. Manage entries in the Builds tab.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            color: "#f87171",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "rgba(17,19,34,0.7)",
          border: "1px solid #1C1F33",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            data-ocid="admin_portfolio.loading_state"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "80px 0",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "3px solid #1C1F33",
                borderTopColor: "#39FF14",
                animation: "port-spin 0.8s linear infinite",
              }}
            />
          </div>
        ) : items.length === 0 ? (
          <div
            data-ocid="admin_portfolio.empty_state"
            style={{
              textAlign: "center",
              padding: "60px 32px",
              color: "#7A7D90",
            }}
          >
            <Globe size={40} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <p
              style={{
                fontSize: "16px",
                marginBottom: "8px",
                fontWeight: 500,
              }}
            >
              No builds yet.
            </p>
            <p style={{ fontSize: "14px" }}>
              Add entries in the{" "}
              <strong style={{ color: "#39FF14" }}>Builds</strong> tab to
              populate the portfolio.
            </p>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              WebkitOverflowScrolling:
                "touch" as React.CSSProperties["WebkitOverflowScrolling"],
            }}
          >
            <table
              data-ocid="admin_portfolio.table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 560,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                  {[
                    "Client Name",
                    "Category",
                    "URL",
                    "Description",
                    "Thumbnail",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontWeight: 700,
                        color: "#7A7D90",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "12px 16px",
                        textAlign: "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    data-ocid={`admin_portfolio.row.${idx + 1}`}
                    style={{ borderBottom: "1px solid #1C1F33" }}
                  >
                    {/* Client Name */}
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        color: "#EEF0F8",
                        fontSize: "14px",
                      }}
                    >
                      {item.clientName}
                    </td>

                    {/* Category */}
                    <td style={{ padding: "14px 16px" }}>
                      {item.category ? (
                        <span
                          style={{
                            background: "rgba(57,255,20,0.12)",
                            color: "#5EF08A",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {item.category}
                        </span>
                      ) : (
                        <span style={{ color: "#7A7D90", fontSize: "13px" }}>
                          —
                        </span>
                      )}
                    </td>

                    {/* URL */}
                    <td style={{ padding: "14px 16px" }}>
                      {item.siteUrl ? (
                        <a
                          href={item.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#5EF08A",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <ExternalLink size={12} style={{ flexShrink: 0 }} />
                          {item.siteUrl.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span style={{ color: "#7A7D90", fontSize: "13px" }}>
                          —
                        </span>
                      )}
                    </td>

                    {/* Description */}
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "#9CA3AF",
                        fontSize: "13px",
                        maxWidth: "260px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.description || (
                        <span style={{ color: "#7A7D90" }}>—</span>
                      )}
                    </td>

                    {/* Thumbnail */}
                    <td style={{ padding: "14px 16px" }}>
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.clientName}
                          style={{
                            width: 48,
                            height: 36,
                            objectFit: "cover",
                            borderRadius: 4,
                            border: "1px solid #1C1F33",
                          }}
                        />
                      ) : (
                        <Globe
                          size={20}
                          style={{ color: "#374151", opacity: 0.5 }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informational note */}
      {!loading && items.length > 0 && (
        <p
          style={{
            color: "#7A7D90",
            fontSize: "12px",
            marginTop: "12px",
            textAlign: "right",
          }}
        >
          {items.length} build{items.length !== 1 ? "s" : ""} — edit in the{" "}
          <strong style={{ color: "#9CA3AF" }}>Builds</strong> tab
        </p>
      )}
    </AdminLayout>
  );
}
