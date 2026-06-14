import { ArrowDownToLine, FileDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { backendInterface } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

interface ClientFileMetadata {
  id: string;
  clientEmail: string;
  fileName: string;
  fileLabel: string;
  uploaderEmail: string;
  uploadedAt: bigint;
  objectKey: string;
}

function formatTimestamp(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

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
            ? "rgba(5,46,22,0.97)"
            : "rgba(69,10,10,0.97)",
        border: `1px solid ${toast.type === "success" ? "rgba(94,240,138,0.4)" : "rgba(239,68,68,0.4)"}`,
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

function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 0",
        borderBottom: "1px solid rgba(94,240,138,0.1)",
      }}
    >
      <div
        style={{
          flex: 1,
          height: "14px",
          borderRadius: "4px",
          background: "rgba(94,240,138,0.06)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "100px",
          height: "14px",
          borderRadius: "4px",
          background: "rgba(94,240,138,0.06)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "80px",
          height: "14px",
          borderRadius: "4px",
          background: "rgba(94,240,138,0.06)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

interface FileRowProps {
  file: ClientFileMetadata;
  index: number;
  onDownload: (file: ClientFileMetadata) => Promise<void>;
  downloading: string | null;
}

function FileRow({ file, index, onDownload, downloading }: FileRowProps) {
  const isDownloading = downloading === file.id;
  return (
    <tr
      key={file.id}
      data-ocid={`files.item.${index + 1}`}
      style={{ animation: "typewriter-fade-in 0.4s ease forwards" }}
    >
      <td
        style={{
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
          color: "#7A7D90",
          fontSize: "14px",
          whiteSpace: "nowrap",
          fontFamily: "monospace",
        }}
      >
        {formatTimestamp(file.uploadedAt)}
      </td>
      <td>
        <button
          type="button"
          data-ocid={`files.download_button.${index + 1}`}
          onClick={() => onDownload(file)}
          disabled={isDownloading}
          className={isDownloading ? "matrix-btn-outline" : "matrix-btn"}
          style={{
            padding: "10px 14px",
            minHeight: "44px",
            fontSize: "13px",
            cursor: isDownloading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
            opacity: isDownloading ? 0.6 : 1,
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

function FileCard({ file, index, onDownload, downloading }: FileRowProps) {
  const isDownloading = downloading === file.id;
  return (
    <div
      data-ocid={`files.card.${index + 1}`}
      className="matrix-card"
      style={{
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        animation: "typewriter-fade-in 0.4s ease forwards",
      }}
    >
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "#7A7D90",
            fontFamily: "monospace",
          }}
        >
          {formatTimestamp(file.uploadedAt)}
        </span>
        <button
          type="button"
          data-ocid={`files.card.download_button.${index + 1}`}
          onClick={() => onDownload(file)}
          disabled={isDownloading}
          className={isDownloading ? "matrix-btn-outline" : "matrix-btn"}
          style={{
            padding: "10px 14px",
            minHeight: "44px",
            fontSize: "13px",
            cursor: isDownloading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            opacity: isDownloading ? 0.6 : 1,
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

export default function PortalFilesPage() {
  const { session } = useSession();
  const clientEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();
  const [files, setFiles] = useState<ClientFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is an intentional refresh trigger
  useEffect(() => {
    if (!actor || isFetching || !clientEmail) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await (actor as backendInterface).getFilesForClient(
          clientEmail,
          clientEmail,
        );
        if (!cancelled) setFiles(Array.isArray(result) ? result : []);
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
  }, [actor, isFetching, clientEmail, refreshKey]);

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

  const sectionCard: CSSProperties = {
    background: "rgba(10,11,20,0.9)",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid rgba(94,240,138,0.15)",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <PortalLayout pageTitle="Files">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes typewriter-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
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
        <div
          data-ocid="files.page-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 4px" }}>
              <TypewriterText
                text="Your Files"
                className="matrix-heading"
                style={{ fontSize: "22px", fontWeight: 700 }}
                speed={45}
              />
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#7A7D90" }}>
              Files and assets delivered to you by the Imperidome team.
            </p>
          </div>
          <button
            type="button"
            data-ocid="files.refresh_button"
            onClick={() => {
              setLoading(true);
              setLoadError(false);
              setRefreshKey((prev) => prev + 1);
            }}
            className="matrix-btn-outline"
            style={{
              padding: "9px 16px",
              minHeight: "40px",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 4v6h6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 20v-6h-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Refresh
          </button>
        </div>

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
              <span style={{ fontFamily: "monospace" }}>
                Loading your files…
              </span>
            </div>
            {[1, 2, 3].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

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
                border: "1px solid rgba(94,240,138,0.2)",
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
                fontFamily: "monospace",
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

        {!loading && !loadError && files.length > 0 && (
          <>
            <div
              data-ocid="files.table"
              className="hidden sm:block"
              style={sectionCard}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  className="matrix-table"
                  style={{ width: "100%", minWidth: "560px" }}
                >
                  <thead>
                    <tr>
                      {["File Name", "Label / Description", "Uploaded", ""].map(
                        (h) => (
                          <th key={h}>
                            {h ? (
                              <TypewriterText text={h} as="span" speed={40} />
                            ) : (
                              ""
                            )}
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

      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </PortalLayout>
  );
}
