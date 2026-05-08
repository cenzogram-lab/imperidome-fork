import { Paperclip } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { EditRequest, backendInterface } from "../../backend";
import { EditableText } from "../../components/EditableText";
import { useActor } from "../../hooks/useActor";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
// Status badge
// ---------------------------------------------------------------------------
const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  SUBMITTED: { bg: "#FEF9C3", color: "#92400E" },
  "IN PROGRESS": { bg: "#5EF08A", color: "#ffffff" },
  COMPLETED: { bg: "#DCFCE7", color: "#166534" },
  DECLINED: { bg: "#FEE2E2", color: "#991B1B" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status.toUpperCase()] ?? {
    bg: "#F3F4F6",
    color: "#7A7D90",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Truncated description cell
// ---------------------------------------------------------------------------
function DescriptionCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const truncated = text.length > 50 ? `${text.slice(0, 50)}…` : text;
  const canExpand = text.length > 50;
  if (!canExpand) return <span>{text}</span>;
  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      title={expanded ? "Click to collapse" : "Click to expand"}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        textAlign: "left",
      }}
    >
      {expanded ? text : truncated}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Attachment cell
// ---------------------------------------------------------------------------
function AttachmentCell({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="View attachment"
      style={{ color: "#5EF08A", display: "inline-flex", alignItems: "center" }}
    >
      <Paperclip size={16} color="#5EF08A" />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Requests table
// ---------------------------------------------------------------------------
const TABLE_HEADERS = [
  "Request #",
  "Type",
  "Description",
  "Attachment",
  "Submitted",
  "Status",
];

function RequestsTable({
  requests,
  emptyText,
  ocidPrefix,
}: {
  requests: EditRequest[];
  emptyText: string;
  ocidPrefix: string;
}) {
  if (requests.length === 0) {
    return (
      <p
        data-ocid={`${ocidPrefix}.empty_state`}
        style={{ color: "#7A7D90", fontSize: "14px", margin: 0 }}
      >
        {emptyText}
      </p>
    );
  }

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .er-table-desktop { display: none !important; }
          .er-blocks-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .er-table-desktop { display: table !important; }
          .er-blocks-mobile { display: none !important; }
        }
      `}</style>

      {/* Desktop */}
      <div style={{ overflowX: "auto" }}>
        <table
          data-ocid={`${ocidPrefix}.table`}
          className="er-table-desktop"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "640px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#0A0B14",
                borderBottom: "1px solid #1C1F33",
              }}
            >
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((req, idx) => (
              <tr
                key={String(req.id)}
                data-ocid={`${ocidPrefix}.row.${idx + 1}`}
                style={{
                  background:
                    idx % 2 === 0 ? "rgba(17,19,34,0.7)" : "rgba(14,16,32,0.9)",
                  borderBottom: "1px solid #1C1F33",
                }}
              >
                <td
                  style={{
                    padding: "12px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#EEF0F8",
                    whiteSpace: "nowrap",
                  }}
                >
                  {req.request_number}
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "#7A7D90",
                    whiteSpace: "nowrap",
                  }}
                >
                  {req.request_type}
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "#EEF0F8",
                    maxWidth: "240px",
                  }}
                >
                  <DescriptionCell text={req.description} />
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <AttachmentCell url={req.attachment_url} />
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "#7A7D90",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDate(req.created_at)}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <StatusBadge status={req.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked */}
      <div
        className="er-blocks-mobile"
        style={{ flexDirection: "column", gap: "12px" }}
      >
        {requests.map((req, idx) => (
          <div
            key={String(req.id)}
            data-ocid={`${ocidPrefix}.row.${idx + 1}`}
            style={{
              background:
                idx % 2 === 0 ? "rgba(17,19,34,0.7)" : "rgba(14,16,32,0.9)",
              border: "1px solid #1C1F33",
              borderRadius: "8px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "13px", fontWeight: 700, color: "#EEF0F8" }}
              >
                {req.request_number}
              </span>
              <StatusBadge status={req.status} />
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 2px",
                  fontSize: "11px",
                  color: "#7A7D90",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Type
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#7A7D90" }}>
                {req.request_type}
              </p>
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 2px",
                  fontSize: "11px",
                  color: "#7A7D90",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Description
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#EEF0F8" }}>
                <DescriptionCell text={req.description} />
              </p>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontSize: "11px",
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Submitted
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#7A7D90" }}>
                  {formatDate(req.created_at)}
                </p>
              </div>
              {req.attachment_url && (
                <a
                  href={req.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View attachment"
                  style={{
                    color: "#5EF08A",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "13px",
                  }}
                >
                  <Paperclip size={14} color="#5EF08A" />
                  Attachment
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PortalEditRequestsPage() {
  const { actor, isFetching } = useActor();

  // Data
  const [requests, setRequests] = useState<EditRequest[] | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState(false);

  // Form
  const [requestType, setRequestType] = useState("Text Change");
  const [pageSection, setPageSection] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await actor!.getMyEditRequests();
        if (!cancelled) setRequests(data);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  const isLoading = isFetching || (requests === undefined && !loadError);

  const activeRequests = (requests ?? []).filter(
    (r) => r.status === "SUBMITTED" || r.status === "IN PROGRESS",
  );
  const completedRequests = (requests ?? []).filter(
    (r) => r.status === "COMPLETED" || r.status === "DECLINED",
  );

  function resetForm() {
    setRequestType("Text Change");
    setPageSection("");
    setDescription("");
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setSubmitting(true);
    setSubmitError("");
    setUploadProgress(0);

    try {
      let attachmentUrl: string | null = null;

      if (selectedFile) {
        const { createBlobFromBytes } = await import("../../lib/blobStorage");
        const bytes = new Uint8Array(await selectedFile.arrayBuffer());
        const blob = createBlobFromBytes(bytes).withUploadProgress(
          (pct: number) => setUploadProgress(Math.round(pct * 100)),
        );
        attachmentUrl = blob.getDirectURL();
      }

      const result = await (actor as backendInterface).createEditRequest(
        requestType,
        pageSection,
        description,
        attachmentUrl ?? "",
      );

      if ("ok" in result) {
        const updated = await actor!.getMyEditRequests();
        setRequests(updated);
        setSubmitSuccess(true);
        resetForm();
      } else {
        setSubmitError("Could not submit request. Please try again.");
      }
    } catch {
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      setSubmitError("File must be 10MB or smaller.");
      e.target.value = "";
      return;
    }
    setSubmitError("");
    setSelectedFile(file);
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid #1C1F33",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#7A7D90",
    marginBottom: "6px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    minHeight: "44px",
    border: "1.5px solid #CBD5E1",
    fontSize: "14px",
    color: "#EEF0F8",
    background: "rgba(17,19,34,0.7)",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <PortalLayout pageTitle="Edit Requests">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .er-form-input:focus {
          border-color: #5EF08A !important;
          box-shadow: 0 0 0 3px rgba(59,130,196,0.12);
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ===== SUBMIT REQUEST CARD ===== */}
        <div data-ocid="edit_requests.submit.card" style={cardStyle}>
          <h3
            style={{
              margin: "0 0 4px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            <EditableText
              textKey="portal.edit-requests.submit.heading"
              defaultText="Submit an Edit Request."
              as="span"
            />
          </h3>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#7A7D90" }}>
            <EditableText
              textKey="portal.edit-requests.submit.subheading"
              defaultText="Use this form to request changes to your live site. We respond within 24 hours on Plan 2 and above."
              as="span"
            />
          </p>

          {submitSuccess ? (
            <div
              data-ocid="edit_requests.submit.success_state"
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "8px",
                padding: "20px",
                color: "#166534",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" fill="#DCFCE7" />
                <path
                  d="M7 13l3 3 7-7"
                  stroke="#166534"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <EditableText
                textKey="portal.edit-requests.submit.success-message"
                defaultText="Edit request submitted. We will respond within 24 hours."
                as="span"
              />
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: "#166534",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                <EditableText
                  textKey="portal.edit-requests.submit.another-button"
                  defaultText="Submit another"
                  as="span"
                />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {submitError && (
                <div
                  data-ocid="edit_requests.submit.error_state"
                  style={{
                    background: "#FEE2E2",
                    border: "1px solid #1C1F33",
                    borderRadius: "6px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                    color: "#991B1B",
                    fontSize: "13px",
                  }}
                >
                  {submitError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Request Type */}
                <div>
                  <label htmlFor="er-type" style={labelStyle}>
                    <EditableText
                      textKey="portal.edit-requests.type.label"
                      defaultText="Request Type"
                      as="span"
                    />
                  </label>
                  <select
                    id="er-type"
                    data-ocid="edit_requests.type.select"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    required
                    className="er-form-input"
                    style={inputStyle}
                  >
                    <option>Text Change</option>
                    <option>Image Swap</option>
                    <option>Layout Adjustment</option>
                    <option>Add Content Block</option>
                    <option>Fix Error</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Page or Section */}
                <div>
                  <label htmlFor="er-page" style={labelStyle}>
                    <EditableText
                      textKey="portal.edit-requests.page-section.label"
                      defaultText="Page or Section"
                      as="span"
                    />
                  </label>
                  <input
                    id="er-page"
                    type="text"
                    data-ocid="edit_requests.page_section.input"
                    value={pageSection}
                    onChange={(e) => setPageSection(e.target.value)}
                    placeholder="e.g. Homepage hero, About page, Services menu."
                    required
                    className="er-form-input"
                    style={inputStyle}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="er-desc" style={labelStyle}>
                    <EditableText
                      textKey="portal.edit-requests.description.label"
                      defaultText="Description"
                      as="span"
                    />
                  </label>
                  <textarea
                    id="er-desc"
                    data-ocid="edit_requests.description.textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the change you need in as much detail as possible."
                    required
                    className="er-form-input"
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* File Attachment */}
                <div>
                  <label htmlFor="er-file" style={labelStyle}>
                    <EditableText
                      textKey="portal.edit-requests.file.label"
                      defaultText="File Attachment"
                      as="span"
                    />{" "}
                    <span style={{ fontWeight: 400, color: "#7A7D90" }}>
                      <EditableText
                        textKey="portal.edit-requests.file.hint"
                        defaultText="(optional — images or PDF, max 10MB)"
                        as="span"
                      />
                    </span>
                  </label>
                  <div
                    style={{
                      border: "1.5px dashed #CBD5E1",
                      borderRadius: "6px",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "#0A0B14",
                      cursor: "pointer",
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) =>
                      e.key === "Enter" && fileInputRef.current?.click()
                    }
                  >
                    <Paperclip size={16} color="#94A3B8" />
                    <span
                      style={{
                        fontSize: "13px",
                        color: selectedFile ? "#1B2D4F" : "#94A3B8",
                      }}
                    >
                      {selectedFile
                        ? selectedFile.name
                        : "Click to select a file"}
                    </span>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        style={{
                          marginLeft: "auto",
                          background: "none",
                          border: "none",
                          color: "#991B1B",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    id="er-file"
                    type="file"
                    data-ocid="edit_requests.file.upload_button"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  {/* Upload progress */}
                  {submitting && selectedFile && uploadProgress > 0 && (
                    <div
                      data-ocid="edit_requests.upload.loading_state"
                      style={{ marginTop: "8px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#7A7D90" }}>
                          Uploading...
                        </span>
                        <span style={{ fontSize: "12px", color: "#7A7D90" }}>
                          {uploadProgress}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "4px",
                          background: "rgba(40,45,70,0.8)",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${uploadProgress}%`,
                            background: "#5EF08A",
                            borderRadius: "2px",
                            transition: "width 0.2s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  data-ocid="edit_requests.submit_button"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "12px",
                    minHeight: "44px",
                    background: submitting ? "rgba(94,240,138,0.5)" : "#5EF08A",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "15px",
                    border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background 0.15s ease",
                  }}
                >
                  {submitting ? (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-label="Loading"
                        role="img"
                        style={{ animation: "spin 0.8s linear infinite" }}
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="3"
                        />
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          stroke="#ffffff"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <EditableText
                      textKey="portal.edit-requests.submit.button"
                      defaultText="Submit Edit Request"
                      as="span"
                    />
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ===== ACTIVE REQUESTS ===== */}
        <div data-ocid="edit_requests.active.card" style={cardStyle}>
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            <EditableText
              textKey="portal.edit-requests.active.heading"
              defaultText="Active Requests."
              as="span"
            />
          </h3>
          {isLoading ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[1, 2].map((i) => (
                <Skeleton key={i} style={{ height: "44px", width: "100%" }} />
              ))}
            </div>
          ) : loadError ? (
            <p
              data-ocid="edit_requests.active.error_state"
              style={{ color: "#991B1B", fontSize: "14px", margin: 0 }}
            >
              <EditableText
                textKey="portal.edit-requests.active.error-state"
                defaultText="Could not load requests. Please refresh."
                as="span"
              />
            </p>
          ) : (
            <RequestsTable
              requests={activeRequests}
              emptyText="No active edit requests."
              ocidPrefix="edit_requests.active"
            />
          )}
        </div>

        {/* ===== COMPLETED REQUESTS ===== */}
        <div data-ocid="edit_requests.completed.card" style={cardStyle}>
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            <EditableText
              textKey="portal.edit-requests.completed.heading"
              defaultText="Completed Requests."
              as="span"
            />
          </h3>
          {isLoading ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[1, 2].map((i) => (
                <Skeleton key={i} style={{ height: "44px", width: "100%" }} />
              ))}
            </div>
          ) : loadError ? (
            <p
              data-ocid="edit_requests.completed.error_state"
              style={{ color: "#991B1B", fontSize: "14px", margin: 0 }}
            >
              <EditableText
                textKey="portal.edit-requests.completed.error-state"
                defaultText="Could not load requests. Please refresh."
                as="span"
              />
            </p>
          ) : (
            <RequestsTable
              requests={completedRequests}
              emptyText="No completed requests yet."
              ocidPrefix="edit_requests.completed"
            />
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
