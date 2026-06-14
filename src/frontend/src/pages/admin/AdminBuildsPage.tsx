import { ExternalLink, Globe, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { backendInterface } from "../../backend.d";
import type { Build as BuildBase } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

// Extend the base Build type to include new optional fields
type Build = BuildBase & {
  description?: string;
  category?: string;
  thumbnailUrl?: string;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const DARK_CARD: CSSProperties = {
  background: "rgba(17,19,34,0.85)",
  backdropFilter: "blur(12px)",
  border: "1px solid #1C1F33",
  borderRadius: "10px",
};

const INPUT_STYLE: CSSProperties = {
  border: "1px solid #1C1F33",
  borderRadius: 6,
  padding: "10px 14px",
  fontSize: 14,
  color: "#EEF0F8",
  background: "rgba(19,21,36,1)",
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};

const LABEL_STYLE: CSSProperties = {
  display: "block",
  color: "#7A7D90",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const NEON = "#00FFA3";
const MUTED = "#7A7D90";
const TEXT = "#EEF0F8";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 340,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:
              t.type === "success"
                ? "rgba(17,34,20,0.97)"
                : "rgba(34,17,17,0.97)",
            border: `1px solid ${
              t.type === "success"
                ? "rgba(94,240,138,0.4)"
                : "rgba(239,68,68,0.4)"
            }`,
            borderRadius: 8,
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <span
            style={{
              color: t.type === "success" ? "#5EF08A" : "#f87171",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t.type === "success" ? "✓" : "✕"} {t.message}
          </span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: MUTED,
              padding: 2,
              display: "flex",
            }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  buildName,
  onConfirm,
  onCancel,
  deleting,
}: {
  buildName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      data-ocid="builds.delete_confirm.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "rgba(14,16,32,0.98)",
          border: "1px solid #1C1F33",
          borderRadius: 12,
          width: "100%",
          maxWidth: 420,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Trash2 size={16} color="#f87171" />
          </div>
          <div>
            <p
              style={{ color: TEXT, fontWeight: 700, fontSize: 15, margin: 0 }}
            >
              Remove Build
            </p>
            <p style={{ color: MUTED, fontSize: 12, margin: "4px 0 0" }}>
              {buildName}
            </p>
          </div>
        </div>
        <p
          style={{
            color: MUTED,
            fontSize: 13,
            margin: "0 0 20px",
            lineHeight: 1.55,
          }}
        >
          This will permanently remove this build entry from the list.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            data-ocid="builds.delete_confirm.cancel_button"
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1,
              border: "1px solid #1C1F33",
              background: "transparent",
              color: MUTED,
              borderRadius: 6,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="builds.delete_confirm.confirm_button"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 2,
              border: "none",
              background: deleting
                ? "rgba(239,68,68,0.3)"
                : "rgba(239,68,68,0.85)",
              color: deleting ? "#7a3030" : "#fff",
              borderRadius: 6,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 700,
              cursor: deleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            <Trash2 size={13} />
            {deleting ? "Removing…" : "Remove Build"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Build Modal ─────────────────────────────────────────────────────────

function EditBuildModal({
  build,
  onSave,
  onCancel,
  saving,
  categorySuggestions,
}: {
  build: Build;
  onSave: (
    id: string,
    clientName: string,
    siteUrl: string,
    description: string,
    category: string,
    thumbnailUrl: string,
  ) => void;
  onCancel: () => void;
  saving: boolean;
  categorySuggestions: string[];
}) {
  const [editName, setEditName] = useState(build.clientName);
  const [editUrl, setEditUrl] = useState(build.siteUrl);
  const [editDesc, setEditDesc] = useState(build.description ?? "");
  const [editCat, setEditCat] = useState(build.category ?? "");
  const [editThumb, setEditThumb] = useState(build.thumbnailUrl ?? "");
  const [urlErr, setUrlErr] = useState<string | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  function validateUrl(url: string): string | null {
    if (!url.trim()) return "Site URL is required.";
    if (!url.startsWith("https://"))
      return "URL must start with https://  (e.g. https://example.com)";
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateUrl(editUrl);
    setUrlErr(err);
    if (err || !editName.trim()) return;
    onSave(
      build.id,
      editName.trim(),
      editUrl.trim(),
      editDesc.trim(),
      editCat.trim(),
      editThumb.trim(),
    );
  }

  return (
    <div
      data-ocid="builds.edit.dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "rgba(14,16,32,0.99)",
          border: "1px solid #1C1F33",
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,0.65)",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(0,255,163,0.1)",
                border: "1px solid rgba(0,255,163,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Pencil size={15} color={NEON} />
            </div>
            <div>
              <p
                style={{
                  color: TEXT,
                  fontWeight: 700,
                  fontSize: 15,
                  margin: 0,
                }}
              >
                Edit Build
              </p>
              <p style={{ color: MUTED, fontSize: 12, margin: "2px 0 0" }}>
                {build.clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-ocid="builds.edit.close_button"
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: MUTED,
              padding: 4,
              display: "flex",
            }}
            aria-label="Close edit modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Client Name */}
            <div>
              <label htmlFor="edit-client-name" style={LABEL_STYLE}>
                Client Name
              </label>
              <input
                id="edit-client-name"
                data-ocid="builds.edit.client_name.input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Acme Corp"
                required
                style={INPUT_STYLE}
              />
            </div>

            {/* Site URL */}
            <div>
              <label htmlFor="edit-site-url" style={LABEL_STYLE}>
                Site URL
              </label>
              <input
                id="edit-site-url"
                data-ocid="builds.edit.site_url.input"
                type="text"
                value={editUrl}
                onChange={(e) => {
                  setEditUrl(e.target.value);
                  if (urlErr) setUrlErr(null);
                }}
                onBlur={() => setUrlErr(validateUrl(editUrl))}
                placeholder="https://client-website.com"
                required
                style={{
                  ...INPUT_STYLE,
                  borderColor: urlErr ? "rgba(239,68,68,0.5)" : "#1C1F33",
                }}
              />
              {urlErr && (
                <p
                  data-ocid="builds.edit.site_url.field_error"
                  style={{
                    color: "#f87171",
                    fontSize: 11,
                    margin: "4px 0 0",
                  }}
                >
                  {urlErr}
                </p>
              )}
            </div>

            {/* Short Description */}
            <div>
              <label htmlFor="edit-description" style={LABEL_STYLE}>
                Short Description{" "}
                <span
                  style={{
                    color: MUTED,
                    fontWeight: 400,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (optional)
                </span>
              </label>
              <input
                id="edit-description"
                data-ocid="builds.edit.description.input"
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="1-2 sentence project blurb (optional)"
                style={INPUT_STYLE}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="edit-category" style={LABEL_STYLE}>
                Category{" "}
                <span
                  style={{
                    color: MUTED,
                    fontWeight: 400,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (optional)
                </span>
              </label>
              <input
                id="edit-category"
                data-ocid="builds.edit.category.input"
                type="text"
                list="edit-category-suggestions"
                value={editCat}
                onChange={(e) => setEditCat(e.target.value)}
                placeholder="e.g. E-commerce, SaaS, Landing Page, Branding, Portfolio"
                style={INPUT_STYLE}
              />
              <datalist id="edit-category-suggestions">
                {categorySuggestions.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Thumbnail Image URL */}
            <div>
              <label htmlFor="edit-thumbnail-url" style={LABEL_STYLE}>
                Thumbnail Image URL{" "}
                <span
                  style={{
                    color: MUTED,
                    fontWeight: 400,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (optional)
                </span>
              </label>
              <input
                id="edit-thumbnail-url"
                data-ocid="builds.edit.thumbnail_url.input"
                type="text"
                value={editThumb}
                onChange={(e) => setEditThumb(e.target.value)}
                placeholder="Paste a direct image link (optional)"
                style={INPUT_STYLE}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button
              type="button"
              data-ocid="builds.edit.cancel_button"
              onClick={onCancel}
              disabled={saving}
              style={{
                flex: 1,
                border: "1px solid #1C1F33",
                background: "transparent",
                color: MUTED,
                borderRadius: 6,
                padding: "10px 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-ocid="builds.edit.save_button"
              disabled={saving || !editName.trim() || !editUrl.trim()}
              style={{
                flex: 2,
                border: "none",
                background:
                  saving || !editName.trim() || !editUrl.trim()
                    ? "rgba(0,255,163,0.2)"
                    : "rgba(0,255,163,0.9)",
                color:
                  saving || !editName.trim() || !editUrl.trim()
                    ? "rgba(0,80,50,0.8)"
                    : "#061209",
                borderRadius: 6,
                padding: "10px 0",
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  saving || !editName.trim() || !editUrl.trim()
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                transition: "background 0.15s",
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBuildsPage() {
  const { actor, isFetching } = useActor();
  const [builds, setBuilds] = useState<Build[]>([]);
  const categorySuggestions = useMemo(
    () =>
      [
        ...new Set(builds.map((b) => b.category).filter(Boolean)),
      ].sort() as string[],
    [builds],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editingBuild, setEditingBuild] = useState<Build | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastCounter = useRef(0);

  function showToast(message: string, type: "success" | "error") {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function fetchBuilds() {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);
    actor
      .getBuilds()
      .then((data) => setBuilds(data as Build[]))
      .catch(() => setError("Failed to load builds. Please refresh."))
      .finally(() => setLoading(false));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchBuilds captures actor+isFetching internally; only actor/isFetching changes should re-trigger this mount effect
  useEffect(() => {
    fetchBuilds();
  }, [actor, isFetching]);

  function validateUrl(url: string): string | null {
    if (!url.trim()) return "Site URL is required.";
    if (!url.startsWith("https://"))
      return "URL must start with https://  (e.g. https://example.com)";
    return null;
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const urlErr = validateUrl(siteUrl);
    setUrlError(urlErr);
    if (urlErr) return;
    if (!clientName.trim()) return;
    if (!actor) return;

    setAdding(true);
    try {
      const descArg = newDescription.trim() ? newDescription.trim() : null;
      const catArg = newCategory.trim() ? newCategory.trim() : null;
      const thumbArg = newThumbnailUrl.trim() ? newThumbnailUrl.trim() : null;
      const result = await (actor as backendInterface).addBuild(
        clientName.trim(),
        siteUrl.trim(),
        descArg,
        catArg,
        thumbArg,
      );
      if ("ok" in result || "okAlreadyAdvanced" in result) {
        if ("ok" in result && result.ok != null) {
          setBuilds((prev) => [result.ok as Build, ...prev]);
        } else if ("okAlreadyAdvanced" in result) {
          fetchBuilds();
        }
        setClientName("");
        setSiteUrl("");
        setNewDescription("");
        setNewCategory("");
        setNewThumbnailUrl("");
        setUrlError(null);
        showToast("Build added successfully.", "success");
      } else {
        showToast(`Failed to add build: ${result.err}`, "error");
      }
    } catch {
      showToast("Failed to add build. Please try again.", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(
    id: string,
    updatedName: string,
    updatedUrl: string,
    updatedDesc: string,
    updatedCat: string,
    updatedThumb: string,
  ) {
    if (!actor) return;
    setSaving(true);
    try {
      const descArg = updatedDesc.trim() ? updatedDesc.trim() : null;
      const catArg = updatedCat.trim() ? updatedCat.trim() : null;
      const thumbArg = updatedThumb.trim() ? updatedThumb.trim() : null;
      const result = await (actor as backendInterface).editBuild(
        id,
        updatedName,
        updatedUrl,
        descArg,
        catArg,
        thumbArg,
      );
      if ("ok" in result || "okAlreadyAdvanced" in result) {
        if ("ok" in result && result.ok != null) {
          setBuilds((prev) =>
            prev.map((b) => (b.id === id ? (result.ok as Build) : b)),
          );
        }
        setEditingBuild(null);
        showToast("Build updated successfully.", "success");
      } else {
        showToast(`Failed to update build: ${result.err}`, "error");
      }
    } catch {
      showToast("Failed to update build. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!actor || !deleteId) return;
    setDeleting(true);
    try {
      const result = await actor.deleteBuild(deleteId);
      if ("ok" in result || "okAlreadyAdvanced" in result) {
        setBuilds((prev) => prev.filter((b) => b.id !== deleteId));
        showToast("Build removed.", "success");
      } else {
        showToast(`Failed to remove build: ${result.err}`, "error");
      }
    } catch {
      showToast("Failed to remove build. Please try again.", "error");
    } finally {
      setDeleting(false);
      setDeleteId(null);
      setDeleteName("");
    }
  }

  return (
    <AdminLayout pageTitle="Builds">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <h2
              className="matrix-heading"
              style={{ fontWeight: 800, fontSize: 22, margin: 0 }}
            >
              <TypewriterText text="Client Builds" speed={40} />
            </h2>
            <p
              className="matrix-muted"
              style={{ fontSize: 12, margin: "4px 0 0" }}
            >
              Manage your clients' live site URLs. These entries power the Total
              Websites count on the dashboard.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {!loading && (
              <span
                style={{
                  background: "rgba(94,240,138,0.08)",
                  border: "1px solid rgba(94,240,138,0.2)",
                  color: NEON,
                  borderRadius: 6,
                  padding: "4px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {builds.length} {builds.length === 1 ? "build" : "builds"}
              </span>
            )}
            <button
              type="button"
              data-ocid="builds.refresh_button"
              onClick={fetchBuilds}
              style={{
                background: "rgba(94,240,138,0.08)",
                border: "1px solid rgba(94,240,138,0.2)",
                color: NEON,
                borderRadius: 6,
                padding: "4px 14px",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Courier New', monospace",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Add Build Form */}
        <div data-ocid="builds.add_form" style={{ ...DARK_CARD, padding: 20 }}>
          <h3
            className="matrix-heading"
            style={{
              fontWeight: 700,
              fontSize: 15,
              margin: "0 0 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={15} color="#5EF08A" />
            <TypewriterText text="Add New Build" speed={40} />
          </h3>
          <form onSubmit={handleAdd}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label htmlFor="build-client-name" style={LABEL_STYLE}>
                  Client Name
                </label>
                <input
                  id="build-client-name"
                  data-ocid="builds.client_name.input"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Acme Corp"
                  required
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label htmlFor="build-site-url" style={LABEL_STYLE}>
                  Site URL
                </label>
                <input
                  id="build-site-url"
                  data-ocid="builds.site_url.input"
                  type="text"
                  value={siteUrl}
                  onChange={(e) => {
                    setSiteUrl(e.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  onBlur={() => setUrlError(validateUrl(siteUrl))}
                  placeholder="https://client-website.com"
                  required
                  style={{
                    ...INPUT_STYLE,
                    borderColor: urlError
                      ? "rgba(239,68,68,0.5)"
                      : "rgba(94,240,138,0.25)",
                  }}
                />
                {urlError && (
                  <p
                    data-ocid="builds.site_url.field_error"
                    style={{
                      color: "#f87171",
                      fontSize: 11,
                      margin: "4px 0 0",
                    }}
                  >
                    {urlError}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="build-description" style={LABEL_STYLE}>
                  Short Description{" "}
                  <span
                    style={{
                      color: MUTED,
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  id="build-description"
                  data-ocid="builds.description.input"
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="1-2 sentence project blurb (optional)"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label htmlFor="build-category" style={LABEL_STYLE}>
                  Category{" "}
                  <span
                    style={{
                      color: MUTED,
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  id="build-category"
                  data-ocid="builds.category.input"
                  type="text"
                  list="add-category-suggestions"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. E-commerce, SaaS, Landing Page"
                  style={INPUT_STYLE}
                />
                <datalist id="add-category-suggestions">
                  {categorySuggestions.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="build-thumbnail-url" style={LABEL_STYLE}>
                  Thumbnail Image URL{" "}
                  <span
                    style={{
                      color: MUTED,
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  id="build-thumbnail-url"
                  data-ocid="builds.thumbnail_url.input"
                  type="text"
                  value={newThumbnailUrl}
                  onChange={(e) => setNewThumbnailUrl(e.target.value)}
                  placeholder="Paste a direct image link (optional)"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <button
              type="submit"
              data-ocid="builds.add.submit_button"
              disabled={adding || !clientName.trim() || !siteUrl.trim()}
              className="matrix-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  adding || !clientName.trim() || !siteUrl.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  adding || !clientName.trim() || !siteUrl.trim() ? 0.5 : 1,
              }}
            >
              <Plus size={14} />
              {adding ? "Adding…" : "Add Build"}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div
            data-ocid="builds.error_state"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#f87171",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Builds Table */}
        <div
          data-ocid="builds.table"
          style={{ ...DARK_CARD, padding: 0, overflowX: "auto" }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}
          >
            <thead>
              <tr>
                {[
                  "Client Name",
                  "Category",
                  "Site URL",
                  "Date Added",
                  "Actions",
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(94,240,138,0.7)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid rgba(94,240,138,0.15)",
                      whiteSpace: "nowrap",
                      background: "rgba(0,0,0,0.3)",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                ["a", "b", "c"].map((k) => (
                  <tr
                    key={k}
                    style={{ borderBottom: "1px solid rgba(94,240,138,0.08)" }}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <td key={i} style={{ padding: "14px 16px" }}>
                        <div
                          style={{
                            height: 13,
                            width: i === 5 ? 60 : "70%",
                            background: "rgba(94,240,138,0.05)",
                            borderRadius: 4,
                            animation: "pulse 1.5s ease-in-out infinite",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : builds.length === 0 ? (
                <tr>
                  <td
                    data-ocid="builds.empty_state"
                    colSpan={5}
                    style={{ padding: "60px 20px", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "rgba(94,240,138,0.07)",
                          border: "1px solid rgba(94,240,138,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Globe size={22} color={NEON} />
                      </div>
                      <p
                        style={{
                          color: "#5EF08A",
                          fontWeight: 600,
                          fontSize: 15,
                          margin: 0,
                          fontFamily: "'Courier New', monospace",
                        }}
                      >
                        No builds yet
                      </p>
                      <p
                        className="matrix-muted"
                        style={{ fontSize: 13, margin: 0, maxWidth: 300 }}
                      >
                        Add your first client build above by entering a client
                        name and their live site URL.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                builds.map((build, idx) => (
                  <tr
                    key={build.id}
                    data-ocid={`builds.item.${idx + 1}`}
                    style={{
                      borderBottom: "1px solid rgba(94,240,138,0.08)",
                      transition: "background 0.12s",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        color: TEXT,
                        fontSize: 14,
                        fontWeight: 600,
                        maxWidth: 220,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: "rgba(94,240,138,0.1)",
                            border: "1px solid rgba(94,240,138,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 13,
                            color: NEON,
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          {(build.clientName || "?")[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {build.clientName}
                          </span>
                          {build.description && (
                            <span
                              className="matrix-muted"
                              style={{
                                display: "block",
                                fontSize: 11,
                                fontWeight: 400,
                                marginTop: 2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 180,
                              }}
                            >
                              {build.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      {build.category ? (
                        <span className="matrix-badge">{build.category}</span>
                      ) : (
                        <span className="matrix-muted" style={{ fontSize: 12 }}>
                          —
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <a
                        href={build.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-ocid={`builds.site_url.link.${idx + 1}`}
                        style={{
                          color: NEON,
                          fontSize: 13,
                          fontWeight: 500,
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          maxWidth: 280,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <ExternalLink size={12} style={{ flexShrink: 0 }} />
                        {build.siteUrl}
                      </a>
                    </td>
                    <td
                      className="matrix-muted"
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(build.addedAt)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          data-ocid={`builds.edit_button.${idx + 1}`}
                          onClick={() => setEditingBuild(build)}
                          className="matrix-btn"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Pencil size={11} />
                          Edit
                        </button>
                        <button
                          type="button"
                          data-ocid={`builds.delete_button.${idx + 1}`}
                          onClick={() => {
                            setDeleteId(build.id);
                            setDeleteName(build.clientName);
                          }}
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            borderRadius: 6,
                            color: "#f87171",
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            transition: "background 0.15s",
                          }}
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingBuild && (
        <EditBuildModal
          build={editingBuild}
          onSave={handleSaveEdit}
          onCancel={() => setEditingBuild(null)}
          saving={saving}
          categorySuggestions={categorySuggestions}
        />
      )}

      {deleteId && (
        <DeleteConfirmModal
          buildName={deleteName}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteId(null);
            setDeleteName("");
          }}
          deleting={deleting}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminLayout>
  );
}
