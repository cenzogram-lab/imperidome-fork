import { ArrowDownToLine, FileDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { backendInterface } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ClientFileMetadata {
  id: string;
  clientEmail: string;
  fileName: string;
  fileLabel: string;
  uploaderEmail: string;
  uploadedAt: bigint;
  objectKey: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
interface ToastState {
  message: string;
  type: "success" | "error";
}

function Toast({
  toast,
  onDismiss,
}: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      data-ocid="files.toast"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        padding: "14px 20px",
        borderRadius: "10px",
        background:
          toast.type === "success"
            ? "rgba(5,46,22,0.95)"
            : "rgba(69,10,10,0.95)",
        border: `1px solid ${
          toast.type === "success"
            ? "rgba(94,240,138,0.4)"
            : "rgba(239,68,68,0.4)"
        }`,
        color: toast.type === "success" ? "#86EFAC" : "#FCA5A5",
        fontSize: "14px",
        fontWeight: 600,
        maxWidth: "380px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: 0,
          opacity: 0.6,
          fontSize: "16px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 0",
        borderBottom: "1px solid #1C1F33",
      }}
    >
      <div
        style={{
          flex: 1,
          height: "14px",
          borderRadius: "4px",
          background: "rgba(40,45,70,0.8)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "100px",
          height: "14px",
          borderRadius: "4px",
          background: "rgba(40,45,70,0.8)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "80px",
          height: "14px",
          borderRadius: "4px",
          background: "rgba(40,45,70,0.8)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// File row — desktop table row
// ---------------------------------------------------------------------------
interface FileRowProps {
  file: ClientFileMetadata;
  index: number;
  onDownload: (file: ClientFileMetadata) => Promise<void>;
  downloading: string | null;
}

function FileRow({ file, index, onDownload, downloading }: FileRowProps) {
  const isDownloading = downloading === file.id;
  const rowBg = index % 2 === 0 ? "rgba(17,19,34,0.7)" : "rgba(14,16,32,0.9)";

  return (
    <tr
      key={file.id}
      data-ocid={`files.item.${index + 1}`}
      style={{ borderBottom: "1px solid #1C1F33", background: rowBg }}
    >
      <td
        style={{
          padding: "14px 12px",
          color: "#EEF0F8",
          fontWeight: 600,
          fontSize: "14px",
          wordBreak: "break-word",
          maxWidth: "220px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileDown
            size={15}
            style={{ flexShrink: 0, color: "#5EF08A", opacity: 0.8 }}
          />
          {file.fileName}
        </div>
      </td>
      <td
        style={{
          padding: "14px 12px",
          color: "#7A7D90",
          fontSize: "14px",
          wordBreak: "break-word",
          maxWidth: "240px",
        }}
      >
        {file.fileLabel || <span style={{ opacity: 0.4 }}>—</span>}
      </td>
      <td
        style={{
          padding: "14px 12px",
          color: "#7A7D90",
          fontSize: "14px",
          whiteSpace: "nowrap",
        }}
      >
        {formatTimestamp(file.uploadedAt)}
      </td>
      <td style={{ padding: "14px 12px" }}>
        <button
          type="button"
          data-ocid={`files.download_button.${index + 1}`}
          onClick={() => onDownload(file)}
          disabled={isDownloading}
          style={{
            background: isDownloading ? "rgba(94,240,138,0.15)" : "#5EF08A",
            color: isDownloading ? "rgba(94,240,138,0.5)" : "#061209",
            border: "none",
            borderRadius: "6px",
            padding: "10px 14px",
            minHeight: "44px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: isDownloading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {isDownloading ? (
            <>
              <Loader2
                size={13}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              Downloading…
            </>
          ) : (
            <>
              <ArrowDownToLine size={13} />
              Download
            </>
          )}
        </button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// File card — mobile stacked layout
// ---------------------------------------------------------------------------
function FileCard({ file, index, onDownload, downloading }: FileRowProps) {
  const isDownloading = downloading === file.id;

  return (
    <div
      data-ocid={`files.card.${index + 1}`}
      style={{
        borderRadius: "10px",
        border: "1px solid #1C1F33",
        background: "rgba(17,19,34,0.7)",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* File name */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FileDown size={15} style={{ flexShrink: 0, color: "#5EF08A" }} />
        <span
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#EEF0F8",
            wordBreak: "break-word",
            minWidth: 0,
          }}
        >
          {file.fileName}
        </span>
      </div>

      {/* Label */}
      {file.fileLabel && (
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#7A7D90",
            lineHeight: "1.5",
          }}
        >
          {file.fileLabel}
        </p>
      )}

      {/* Date row + download button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "12px", color: "#7A7D90" }}>
          {formatTimestamp(file.uploadedAt)}
        </span>
        <button
          type="button"
          data-ocid={`files.card.download_button.${index + 1}`}
          onClick={() => onDownload(file)}
          disabled={isDownloading}
          style={{
            background: isDownloading ? "rgba(94,240,138,0.15)" : "#5EF08A",
            color: isDownloading ? "rgba(94,240,138,0.5)" : "#061209",
            border: "none",
            borderRadius: "6px",
            padding: "10px 14px",
            minHeight: "44px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: isDownloading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {isDownloading ? (
            <>
              <Loader2
                size={13}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              Downloading…
            </>
          ) : (
            <>
              <ArrowDownToLine size={13} />
              Download
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PortalFilesPage() {
  const { session } = useSession();
  const clientEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();

  const [files, setFiles] = useState<ClientFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!actor || isFetching || !clientEmail) return;
    let cancelled = false;

    async function load() {
      try {
        const result = await (actor as backendInterface).getFilesForClient(
          clientEmail,
          clientEmail,
        );
        if (!cancelled) {
          setFiles(Array.isArray(result) ? result : []);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, clientEmail]);

  async function handleDownload(file: ClientFileMetadata) {
    if (!actor || !clientEmail) return;
    setDownloading(file.id);
    try {
      const result = await (actor as backendInterface).getClientFileUrl(
        clientEmail,
        file.id,
      );

      if (result && typeof result === "object" && "ok" in result) {
        window.open(result.ok as string, "_blank", "noopener,noreferrer");
      } else if (result && typeof result === "object" && "err" in result) {
        setToast({
          message:
            typeof result.err === "string"
              ? result.err
              : "Could not retrieve the download URL. Please try again.",
          type: "error",
        });
      } else {
        setToast({
          message: "Could not retrieve the download URL. Please try again.",
          type: "error",
        });
      }
    } catch {
      setToast({
        message: "Download failed. Please try again.",
        type: "error",
      });
    } finally {
      setDownloading(null);
    }
  }

  const sectionCard: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid #1C1F33",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <PortalLayout pageTitle="Files">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div
        data-ocid="files.page"
        style={{
          maxWidth: "900px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Page header */}
        <div data-ocid="files.page-header">
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            Your Files
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#7A7D90" }}>
            Files and assets delivered to you by the Imperidome team.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div data-ocid="files.loading_state" style={sectionCard}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#7A7D90",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              <Loader2
                size={16}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              Loading your files…
            </div>
            {[1, 2, 3].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && loadError && (
          <div
            data-ocid="files.error_state"
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(69,10,10,0.3)",
              padding: "20px 24px",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", color: "#FCA5A5" }}>
              Unable to load your files. Please refresh the page and try again.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !loadError && files.length === 0 && (
          <div
            data-ocid="files.empty_state"
            style={{
              ...sectionCard,
              textAlign: "center",
              padding: "48px 24px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(94,240,138,0.08)",
                border: "1px solid rgba(94,240,138,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <FileDown size={24} style={{ color: "rgba(94,240,138,0.5)" }} />
            </div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#EEF0F8",
              }}
            >
              No files yet
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#7A7D90",
                maxWidth: "360px",
                marginInline: "auto",
                lineHeight: "1.6",
              }}
            >
              When your team shares files with you, they'll appear here.
            </p>
          </div>
        )}

        {/* File list — desktop table */}
        {!loading && !loadError && files.length > 0 && (
          <>
            {/* Desktop table */}
            <div
              data-ocid="files.table"
              className="hidden sm:block"
              style={sectionCard}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "560px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #1C1F33" }}>
                      {["File Name", "Label / Description", "Uploaded", ""].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "10px 12px",
                              color: "#7A7D90",
                              fontWeight: 600,
                              fontSize: "12px",
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, idx) => (
                      <FileRow
                        key={file.id}
                        file={file}
                        index={idx}
                        onDownload={handleDownload}
                        downloading={downloading}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card list */}
            <div
              data-ocid="files.card_list"
              className="sm:hidden"
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {files.map((file, idx) => (
                <FileCard
                  key={file.id}
                  file={file}
                  index={idx}
                  onDownload={handleDownload}
                  downloading={downloading}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </PortalLayout>
  );
}
