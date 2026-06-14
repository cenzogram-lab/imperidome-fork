import { ExternalLink, Globe, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { backendInterface } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
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
  const { session } = useSession();
  const adminEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();

  const [items, setItems] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuild, setEditingBuild] = useState<Build | null>(null);
  const [formData, setFormData] = useState({
    clientName: "",
    siteUrl: "",
    description: "",
    category: "",
    thumbnailUrl: "",
  });

  const loadItems = useCallback(async () => {
    if (!actor || !adminEmail) return;
    setLoading(true);
    setError(null);
    try {
      const result = await (actor as backendInterface).getBuilds();
      setItems(result);
      setCurrentPage(1);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load portfolio items",
      );
    } finally {
      setLoading(false);
    }
  }, [actor, adminEmail]);

  useEffect(() => {
    if (!actor || isFetching) return;
    void loadItems();
  }, [actor, isFetching, loadItems]);

  const handleAdd = async () => {
    if (!actor) return;
    try {
      await (actor as backendInterface).addBuild(
        formData.clientName,
        formData.siteUrl,
        formData.description,
        formData.category,
        formData.thumbnailUrl,
      );
      setIsModalOpen(false);
      setFormData({
        clientName: "",
        siteUrl: "",
        description: "",
        category: "",
        thumbnailUrl: "",
      });
      void loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = async () => {
    if (!actor || !editingBuild) return;
    try {
      await (actor as backendInterface).editBuild(
        editingBuild.id,
        formData.clientName,
        formData.siteUrl,
        formData.description,
        formData.category,
        formData.thumbnailUrl,
      );
      setIsModalOpen(false);
      setEditingBuild(null);
      setFormData({
        clientName: "",
        siteUrl: "",
        description: "",
        category: "",
        thumbnailUrl: "",
      });
      void loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    if (!window.confirm("Delete this portfolio item?")) return;
    try {
      await (actor as backendInterface).deleteBuild(id);
      void loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout pageTitle="Portfolio">
      <style>{`
        @keyframes port-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Page header */}
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6"
        style={{
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
            className="text-white font-semibold text-xl"
            style={{ fontSize: "20px", margin: 0 }}
          >
            <span className="font-medium">Portfolio Builds</span>
          </h2>
          <p
            className="text-slate-400 text-sm"
            style={{ fontSize: "14px", margin: "4px 0 0" }}
          >
            Live builds from the Builds tab — same data as the homepage and
            /our-builds page. Manage entries here.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            data-ocid="admin_portfolio.add_button"
            onClick={() => {
              setEditingBuild(null);
              setFormData({
                clientName: "",
                siteUrl: "",
                description: "",
                category: "",
                thumbnailUrl: "",
              });
              setIsModalOpen(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.35)",
              borderRadius: "8px",
              color: "#22C55E",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 14px",
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            + Add Portfolio Item
          </button>
          <button
            type="button"
            data-ocid="admin_portfolio.refresh_button"
            onClick={() => void loadItems()}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(71,85,105,0.3)",
              borderRadius: "8px",
              color: "#22C55E",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 14px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <RefreshCw
              size={14}
              style={
                loading
                  ? { animation: "port-spin 0.8s linear infinite" }
                  : undefined
              }
            />
            Refresh
          </button>
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
        className="bg-slate-800 border border-slate-700 rounded-xl p-6"
        style={{ overflow: "hidden" }}
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
                borderTopColor: "#22C55E",
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
              Add entries here or in the{" "}
              <strong style={{ color: "#22C55E" }}>Builds</strong> tab to
              populate the portfolio.
            </p>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              WebkitOverflowScrolling:
                "touch" as CSSProperties["WebkitOverflowScrolling"],
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
                    "Actions",
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
                {items
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map((item, idx) => (
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
                              background: "rgba(34,197,94,0.12)",
                              color: "#22C55E",
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
                              color: "#22C55E",
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

                      {/* Actions */}
                      <td
                        style={{ padding: "14px 16px", whiteSpace: "nowrap" }}
                      >
                        <button
                          type="button"
                          data-ocid={`admin_portfolio.edit_button.${idx + 1}`}
                          onClick={() => {
                            setEditingBuild(item);
                            setFormData({
                              clientName: item.clientName,
                              siteUrl: item.siteUrl,
                              description: item.description,
                              category: item.category,
                              thumbnailUrl: item.thumbnailUrl,
                            });
                            setIsModalOpen(true);
                          }}
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            padding: "4px 10px",
                            border: "1px solid #475569",
                            borderRadius: "6px",
                            background: "transparent",
                            cursor: "pointer",
                            marginRight: "6px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          data-ocid={`admin_portfolio.delete_button.${idx + 1}`}
                          onClick={() => handleDelete(item.id)}
                          style={{
                            color: "#f87171",
                            fontSize: "12px",
                            padding: "4px 10px",
                            border: "1px solid #7f1d1d",
                            borderRadius: "6px",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {!loading && items.length > PAGE_SIZE && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <button
            type="button"
            data-ocid="admin_portfolio.pagination_prev"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(71,85,105,0.3)",
              borderRadius: "8px",
              color: currentPage === 1 ? "#7A7D90" : "#22C55E",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 14px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.5 : 1,
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            Previous
          </button>
          <span style={{ color: "#7A7D90", fontSize: "13px", fontWeight: 500 }}>
            Page {currentPage} of {Math.ceil(items.length / PAGE_SIZE)}
          </span>
          <button
            type="button"
            data-ocid="admin_portfolio.pagination_next"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage * PAGE_SIZE >= items.length}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(71,85,105,0.3)",
              borderRadius: "8px",
              color:
                currentPage * PAGE_SIZE >= items.length ? "#7A7D90" : "#22C55E",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 14px",
              cursor:
                currentPage * PAGE_SIZE >= items.length
                  ? "not-allowed"
                  : "pointer",
              opacity: currentPage * PAGE_SIZE >= items.length ? 0.5 : 1,
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Informational note */}
      {!loading && items.length > 0 && (
        <p
          style={{
            color: "#7A7D90",
            fontSize: "12px",
            marginTop: "8px",
            textAlign: "right",
          }}
        >
          {items.length} build{items.length !== 1 ? "s" : ""} — manage directly
          above
        </p>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-white font-semibold text-lg">
              {editingBuild ? "Edit Portfolio Item" : "Add Portfolio Item"}
            </h2>
            <input
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-md px-3 py-2"
              placeholder="Client Name"
              value={formData.clientName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, clientName: e.target.value }))
              }
            />
            <input
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-md px-3 py-2"
              placeholder="Site URL"
              value={formData.siteUrl}
              onChange={(e) =>
                setFormData((p) => ({ ...p, siteUrl: e.target.value }))
              }
            />
            <textarea
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-md px-3 py-2"
              placeholder="Description"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
            />
            <input
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-md px-3 py-2"
              placeholder="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData((p) => ({ ...p, category: e.target.value }))
              }
            />
            <input
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-md px-3 py-2"
              placeholder="Thumbnail URL"
              value={formData.thumbnailUrl}
              onChange={(e) =>
                setFormData((p) => ({ ...p, thumbnailUrl: e.target.value }))
              }
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white px-4 py-2 border border-slate-600 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={editingBuild ? handleEdit : handleAdd}
                className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-md"
              >
                {editingBuild ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
