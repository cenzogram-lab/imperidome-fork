import { Paperclip } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import type { EditRequest, backendInterface } from "../../backend.d";
import { EditableText } from "../../components/EditableText";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

function formatDate(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Skeleton({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(94,240,138,0.05)",
        borderRadius: "6px",
        animation: "pulse 1.5s ease-in-out infinite",
        border: "1px solid rgba(94,240,138,0.1)",
        ...style,
      }}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === "COMPLETED")
    return (
      <span className="matrix-badge" style={{ fontSize: "11px" }}>
        COMPLETED
      </span>
    );
  if (s === "DECLINED")
    return (
      <span className="matrix-badge-red" style={{ fontSize: "11px" }}>
        DECLINED
      </span>
    );
  if (s === "IN PROGRESS")
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 12px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          background: "rgba(94,240,138,0.15)",
          color: "#5EF08A",
          border: "1px solid rgba(94,240,138,0.4)",
        }}
      >
        IN PROGRESS
      </span>
    );
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: "rgba(234,179,8,0.1)",
        color: "#EAB308",
        border: "1px solid rgba(234,179,8,0.3)",
      }}
    >
      SUBMITTED
    </span>
  );
}

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
}: { requests: EditRequest[]; emptyText: string; ocidPrefix: string }) {
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
        @media (max-width: 640px) { .er-table-desktop { display: none !important; } .er-blocks-mobile { display: flex !important; } }
        @media (min-width: 641px) { .er-table-desktop { display: table !important; } .er-blocks-mobile { display: none !important; } }
        @keyframes typewriter-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ overflowX: "auto" }}>
        <table
          data-ocid={`${ocidPrefix}.table`}
          className="er-table-desktop matrix-table"
          style={{ width: "100%", minWidth: "640px" }}
        >
          <thead>
            <tr>
              {TABLE_HEADERS.map((h) => (
                <th key={h}>
                  <TypewriterText text={h} as="span" speed={40} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((req, idx) => (
              <tr
                key={String(req.id)}
                data-ocid={`${ocidPrefix}.row.${idx + 1}`}
                style={{ animation: "typewriter-fade-in 0.4s ease forwards" }}
              >
                <td
                  style={{
                    fontWeight: 600,
                    color: "#EEF0F8",
                    whiteSpace: "nowrap",
                    fontFamily: "monospace",
                  }}
                >
                  {req.request_number}
                </td>
                <td style={{ color: "#7A7D90", whiteSpace: "nowrap" }}>
                  {req.request_type}
                </td>
                <td style={{ color: "#EEF0F8", maxWidth: "240px" }}>
                  <DescriptionCell text={req.description} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <AttachmentCell url={req.attachment_url} />
                </td>
                <td
                  style={{
                    color: "#7A7D90",
                    whiteSpace: "nowrap",
                    fontFamily: "monospace",
                  }}
                >
                  {formatDate(req.created_at)}
                </td>
                <td>
                  <StatusBadge status={req.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="er-blocks-mobile"
        style={{ flexDirection: "column", gap: "12px" }}
      >
        {requests.map((req, idx) => (
          <div
            key={String(req.id)}
            data-ocid={`${ocidPrefix}.row.${idx + 1}`}
            className="matrix-card"
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              animation: "typewriter-fade-in 0.4s ease forwards",
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
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#EEF0F8",
                  fontFamily: "monospace",
                }}
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
                  color: "#5EF08A",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontFamily: "monospace",
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
                  color: "#5EF08A",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontFamily: "monospace",
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
                    color: "#5EF08A",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontFamily: "monospace",
                  }}
                >
                  Submitted
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#7A7D90",
                    fontFamily: "monospace",
                  }}
                >
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

export default function PortalEditRequestsPage() {
  const { session } = useSession();
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();
  const [requests, setRequests] = useState<EditRequest[] | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState(false);
  const [requestType, setRequestType] = useState("Text Change");
  const [pageSection, setPageSection] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [pageSectionError, setPageSectionError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!actor || !userEmail || isFetching) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await (actor as backendInterface).getMyEditRequests();
        if (!cancelled) setRequests(data);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, userEmail]);

  const isLoading = isFetching || (requests === undefined && !loadError);
  const activeRequests = (requests ?? []).filter(
    (r) =>
      r.status.toUpperCase() === "SUBMITTED" ||
      r.status.toUpperCase() === "IN PROGRESS",
  );
  const completedRequests = (requests ?? []).filter(
    (r) =>
      r.status.toUpperCase() === "COMPLETED" ||
      r.status.toUpperCase() === "DECLINED",
  );

  function resetForm() {
    setRequestType("Text Change");
    setPageSection("");
    setDescription("");
    setSelectedFile(null);
    setUploadProgress(0);
    setDescriptionError("");
    setPageSectionError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!actor || !userEmail) return;
    // Client-side validation
    let valid = true;
    if (!description.trim()) {
      setDescriptionError("Description is required.");
      valid = false;
    }
    if (!pageSection.trim()) {
      setPageSectionError("Page or section is required.");
      valid = false;
    }
    if (!valid) return;
    setSubmitting(true);
    setSubmitError("");
    setUploadProgress(0);
    let attachmentUrl: string | null = null;
    try {
      if (selectedFile) {
        const { createBlobFromBytes } = await import("../../lib/blobStorage");
        const bytes = new Uint8Array(await selectedFile.arrayBuffer());
        const blob = createBlobFromBytes(bytes).withUploadProgress(
          (pct: number) => setUploadProgress(Math.round(pct * 100)),
        );
        // getDirectURL handles upload and returns the resolved storage URL
        attachmentUrl = await blob.getDirectURL();
      }
      const result = await (actor as backendInterface).createEditRequest(
        requestType,
        pageSection,
        description,
        attachmentUrl ?? "",
      );
      if ("ok" in result || "okAlreadyAdvanced" in result) {
        const updated = await (actor as backendInterface).getMyEditRequests();
        setRequests(updated);
        setSubmitSuccess(true);
        resetForm();
      } else {
        if (attachmentUrl) {
          if (import.meta.env.DEV) {
            console.warn(
              "Orphaned blob after edit request failure:",
              attachmentUrl,
            );
          }
        }
        setSubmitError("Could not submit request. Please try again.");
      }
    } catch {
      if (attachmentUrl) {
        if (import.meta.env.DEV) {
          console.warn(
            "Orphaned blob after edit request failure:",
            attachmentUrl,
          );
        }
      }
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      setSubmitError("File must be 10MB or smaller.");
      e.target.value = "";
      return;
    }
    setSubmitError("");
    setSelectedFile(file);
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    minHeight: "44px",
    border: "1px solid rgba(94,240,138,0.2)",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#EEF0F8",
    background: "rgba(7,8,16,0.8)",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#5EF08A",
    marginBottom: "6px",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <PortalLayout pageTitle="Edit Requests">
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .er-form-input:focus { border-color: #5EF08A !important; box-shadow: 0 0 0 3px rgba(94,240,138,0.1) !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          data-ocid="edit_requests.submit.card"
          className="matrix-card"
          style={{ padding: "24px" }}
        >
          <h3 style={{ margin: "0 0 4px" }}>
            <TypewriterText
              text="Submit an Edit Request."
              className="matrix-heading"
              style={{ fontSize: "16px", fontWeight: 700 }}
              speed={40}
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
                background: "rgba(94,240,138,0.08)",
                border: "1px solid rgba(94,240,138,0.3)",
                borderRadius: "8px",
                padding: "20px",
                color: "#5EF08A",
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
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="rgba(94,240,138,0.1)"
                  stroke="#5EF08A"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 13l3 3 7-7"
                  stroke="#5EF08A"
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
                  color: "#5EF08A",
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
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "6px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                    color: "#EF4444",
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
                <div>
                  <label
                    htmlFor="er-type"
                    aria-label="Request Type"
                    style={labelStyle}
                  >
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
                <div>
                  <label
                    htmlFor="er-page"
                    aria-label="Page or Section"
                    style={labelStyle}
                  >
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
                    onChange={(e) => {
                      setPageSection(e.target.value);
                      if (e.target.value.trim()) setPageSectionError("");
                    }}
                    placeholder="e.g. Homepage hero, About page, Services menu."
                    required
                    className="er-form-input"
                    style={{
                      ...inputStyle,
                      borderColor: pageSectionError
                        ? "rgba(239,68,68,0.6)"
                        : undefined,
                    }}
                  />
                  {pageSectionError && (
                    <p
                      data-ocid="edit_requests.page_section.field_error"
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#EF4444",
                      }}
                    >
                      {pageSectionError}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="er-desc"
                    aria-label="Description"
                    style={labelStyle}
                  >
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
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (e.target.value.trim()) setDescriptionError("");
                    }}
                    rows={4}
                    placeholder="Describe the change you need in as much detail as possible."
                    required
                    className="er-form-input"
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      fontFamily: "inherit",
                      borderColor: descriptionError
                        ? "rgba(239,68,68,0.6)"
                        : undefined,
                    }}
                  />
                  {descriptionError && (
                    <p
                      data-ocid="edit_requests.description.field_error"
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#EF4444",
                      }}
                    >
                      {descriptionError}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="er-file" style={labelStyle}>
                    <EditableText
                      textKey="portal.edit-requests.file.label"
                      defaultText="File Attachment"
                      as="span"
                    />{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        color: "#7A7D90",
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      <EditableText
                        textKey="portal.edit-requests.file.hint"
                        defaultText="(optional — images or PDF, max 10MB)"
                        as="span"
                      />
                    </span>
                  </label>
                  <div
                    style={{
                      border: "1px dashed rgba(94,240,138,0.25)",
                      borderRadius: "6px",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "rgba(7,8,16,0.8)",
                      cursor: "pointer",
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) =>
                      e.key === "Enter" && fileInputRef.current?.click()
                    }
                  >
                    <Paperclip size={16} color="#5EF08A" />
                    <span
                      style={{
                        fontSize: "13px",
                        color: selectedFile ? "#EEF0F8" : "#7A7D90",
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
                          color: "#EF4444",
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
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#5EF08A",
                            fontFamily: "monospace",
                          }}
                        >
                          Uploading...
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#5EF08A",
                            fontFamily: "monospace",
                          }}
                        >
                          {uploadProgress}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "4px",
                          background: "rgba(94,240,138,0.1)",
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
                            boxShadow: "0 0 6px rgba(94,240,138,0.5)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  data-ocid="edit_requests.submit_button"
                  disabled={submitting}
                  className="matrix-btn"
                  style={{
                    width: "100%",
                    padding: "12px",
                    minHeight: "44px",
                    opacity: submitting ? 0.6 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
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
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth="3"
                        />
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          stroke="#061209"
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

        <div
          data-ocid="edit_requests.active.card"
          className="matrix-card"
          style={{ padding: "24px" }}
        >
          <h3 style={{ margin: "0 0 20px" }}>
            <TypewriterText
              text="Active Requests."
              className="matrix-heading"
              style={{ fontSize: "16px", fontWeight: 700 }}
              speed={40}
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
              style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}
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

        <div
          data-ocid="edit_requests.completed.card"
          className="matrix-card"
          style={{ padding: "24px" }}
        >
          <h3 style={{ margin: "0 0 20px" }}>
            <TypewriterText
              text="Completed Requests."
              className="matrix-heading"
              style={{ fontSize: "16px", fontWeight: 700 }}
              speed={40}
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
              style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}
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
