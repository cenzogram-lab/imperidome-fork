import { GripVertical, Loader2, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MarqueeLogo } from "../backend";

interface LogoMarqueeProps {
  logos: MarqueeLogo[];
  isEditMode: boolean;
  isAdmin: boolean;
  onAddLogo: (logoUrl: string, logoLabel: string) => Promise<void>;
  onDeleteLogo: (id: string) => Promise<void>;
  onReorderLogos: (orderedIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

const MARQUEE_CSS = `
@keyframes marquee-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee-scroll 35s linear infinite;
}
.marquee-track.paused,
.marquee-wrapper:hover .marquee-track {
  animation-play-state: paused;
}
`;

function useMarqueeStyles() {
  useEffect(() => {
    const id = "marquee-keyframes";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = MARQUEE_CSS;
    document.head.appendChild(el);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);
}

// ─── Logo Item ────────────────────────────────────────────────────────────────
function LogoItem({ logo }: { logo: MarqueeLogo }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 48px",
        flexShrink: 0,
      }}
      title={logo.logoLabel}
      aria-label={logo.logoLabel}
    >
      <img
        src={logo.logoUrl}
        alt={logo.logoLabel}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: "48px",
          width: "auto",
          objectFit: "contain",
          display: "block",
          filter: hovered
            ? "grayscale(0%) brightness(1.1)"
            : "grayscale(100%) brightness(0.85)",
          transition: "filter 0.3s ease",
          maxWidth: "160px",
        }}
      />
    </div>
  );
}

// ─── Edit Row ─────────────────────────────────────────────────────────────────
function EditLogoRow({
  logo,
  index,
  total,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  logo: MarqueeLogo;
  index: number;
  total: number;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      data-ocid={`marquee.logo_row.${index + 1}`}
    >
      {/* Drag handle indicator */}
      <GripVertical
        style={{
          color: "rgba(255,255,255,0.25)",
          flexShrink: 0,
          width: 14,
          height: 14,
        }}
      />

      {/* Thumbnail */}
      <div
        style={{
          width: "32px",
          height: "32px",
          flexShrink: 0,
          borderRadius: "4px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={logo.logoUrl}
          alt={logo.logoLabel}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Label */}
      <span
        style={{
          flex: 1,
          color: "rgba(255,255,255,0.85)",
          fontSize: "13px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {logo.logoLabel || logo.logoUrl}
      </span>

      {/* Up / Down */}
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "4px",
            color:
              index === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
            cursor: index === 0 ? "default" : "pointer",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            transition: "color 0.15s",
          }}
          aria-label="Move up"
          data-ocid={`marquee.logo_row.${index + 1}.move_up`}
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "4px",
            color:
              index === total - 1
                ? "rgba(255,255,255,0.2)"
                : "rgba(255,255,255,0.6)",
            cursor: index === total - 1 ? "default" : "pointer",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            transition: "color 0.15s",
          }}
          aria-label="Move down"
          data-ocid={`marquee.logo_row.${index + 1}.move_down`}
        >
          ▼
        </button>
      </div>

      {/* Delete */}
      {confirmDelete ? (
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onDelete(logo.id)}
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.5)",
              color: "#f87171",
              borderRadius: "4px",
              padding: "3px 8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
            }}
            data-ocid={`marquee.logo_row.${index + 1}.confirm_button`}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.5)",
              borderRadius: "4px",
              padding: "3px 8px",
              fontSize: "11px",
              cursor: "pointer",
              flexShrink: 0,
            }}
            data-ocid={`marquee.logo_row.${index + 1}.cancel_button`}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          style={{
            background: "none",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "rgba(239,68,68,0.7)",
            borderRadius: "4px",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "border-color 0.15s, color 0.15s",
          }}
          aria-label={`Delete ${logo.logoLabel}`}
          data-ocid={`marquee.logo_row.${index + 1}.delete_button`}
        >
          <X style={{ width: 13, height: 13 }} />
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LogoMarquee({
  logos,
  isEditMode,
  isAdmin,
  onAddLogo,
  onDeleteLogo,
  onReorderLogos,
  isLoading = false,
}: LogoMarqueeProps) {
  useMarqueeStyles();

  const [orderedLogos, setOrderedLogos] = useState<MarqueeLogo[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const prevLogosRef = useRef<string>("");

  // Sync ordered list when logos prop changes (avoid overwriting mid-reorder)
  useEffect(() => {
    const key = logos.map((l) => l.id + l.order).join(",");
    if (key !== prevLogosRef.current) {
      prevLogosRef.current = key;
      setOrderedLogos(
        [...logos].sort((a, b) => Number(a.order) - Number(b.order)),
      );
    }
  }, [logos]);

  const showStrip = orderedLogos.length > 0 || (isEditMode && isAdmin);
  if (!showStrip) return null;

  // Duplicate the logo set to fill the strip seamlessly
  const displayLogos = orderedLogos.length > 0 ? orderedLogos : [];
  const doubled = [...displayLogos, ...displayLogos];

  // ── Reorder helpers ──────────────────────────────────────────────────────────
  function moveItem(fromIndex: number, toIndex: number) {
    const updated = [...orderedLogos];
    const [item] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, item);
    setOrderedLogos(updated);
    onReorderLogos(updated.map((l) => l.id)).catch(() => {
      // Revert on failure
      setOrderedLogos(
        [...logos].sort((a, b) => Number(a.order) - Number(b.order)),
      );
    });
  }

  async function handleAdd() {
    const url = urlInput.trim();
    const logoLabel = labelInput.trim();
    if (!url) {
      setAddError("Logo URL is required.");
      return;
    }
    setAddError("");
    setAdding(true);
    try {
      await onAddLogo(url, logoLabel);
      setUrlInput("");
      setLabelInput("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add logo.");
    } finally {
      setAdding(false);
    }
  }

  const showEditPanel = isEditMode && isAdmin;

  return (
    <section
      style={{
        background: "#0A0B14",
        width: "100%",
        paddingTop: "32px",
        paddingBottom: "32px",
        borderTop: "1px solid rgba(28,31,51,0.8)",
        borderBottom: "1px solid rgba(28,31,51,0.8)",
      }}
      data-ocid="marquee.section"
    >
      {/* ── Scrolling Strip ── */}
      <div
        className="marquee-wrapper"
        style={{
          overflow: "hidden",
          width: "100%",
          position: "relative",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          paddingTop: "8px",
          paddingBottom: "8px",
        }}
      >
        {displayLogos.length === 0 && showEditPanel ? (
          <div
            style={{
              textAlign: "center",
              color: "rgba(156,163,175,0.5)",
              fontSize: "13px",
              padding: "16px 0",
              fontStyle: "italic",
              letterSpacing: "0.02em",
            }}
          >
            No logos yet — add your first below
          </div>
        ) : (
          <div className="marquee-track" aria-hidden="true">
            {doubled.map((logo, idx) => (
              <LogoItem key={`${logo.id}-${idx}`} logo={logo} />
            ))}
          </div>
        )}
      </div>

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "8px",
          }}
        >
          <Loader2
            style={{
              width: 16,
              height: 16,
              color: "rgba(57,255,20,0.5)",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}

      {/* ── Edit Panel ── */}
      {showEditPanel && (
        <div
          style={{
            marginTop: "20px",
            marginLeft: "auto",
            marginRight: "auto",
            maxWidth: "900px",
            padding: "0 24px",
          }}
          data-ocid="marquee.edit_panel"
        >
          <div
            style={{
              background: "rgba(17,19,34,0.9)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(28,31,51,1)",
              borderTop: "1px solid rgba(57,255,20,0.3)",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            {/* Section: Logo List */}
            {orderedLogos.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h4
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    margin: "0 0 10px",
                  }}
                >
                  Logo List
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                  data-ocid="marquee.logo_list"
                >
                  {orderedLogos.map((logo, idx) => (
                    <EditLogoRow
                      key={logo.id}
                      logo={logo}
                      index={idx}
                      total={orderedLogos.length}
                      onDelete={(id) => onDeleteLogo(id).catch(() => {})}
                      onMoveUp={(i) => i > 0 && moveItem(i, i - 1)}
                      onMoveDown={(i) =>
                        i < orderedLogos.length - 1 && moveItem(i, i + 1)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {orderedLogos.length > 0 && (
              <div
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.06)",
                  margin: "0 0 20px",
                }}
              />
            )}

            {/* Section: Add Logo */}
            <div>
              <h4
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  margin: "0 0 12px",
                }}
              >
                Add Logo
              </h4>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexDirection: "column",
                  alignItems: "stretch",
                }}
              >
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  style={{
                    flex: "unset",
                    width: "100%",
                    minWidth: 0,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                    padding: "8px 12px",
                    outline: "none",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  data-ocid="marquee.logo_url_input"
                />
                <input
                  type="text"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="Company name"
                  style={{
                    flex: "unset",
                    width: "100%",
                    minWidth: 0,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                    padding: "8px 12px",
                    outline: "none",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  data-ocid="marquee.logo_label_input"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "rgba(57,255,20,0.12)",
                    border: "1px solid rgba(57,255,20,0.4)",
                    color: "#39FF14",
                    borderRadius: "6px",
                    padding: "11px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: adding ? "wait" : "pointer",
                    opacity: adding ? 0.7 : 1,
                    transition: "opacity 0.15s",
                    width: "100%",
                    minHeight: "44px",
                    whiteSpace: "nowrap",
                  }}
                  data-ocid="marquee.add_logo_button"
                >
                  {adding ? (
                    <Loader2
                      style={{
                        width: 13,
                        height: 13,
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  ) : (
                    <Plus style={{ width: 13, height: 13 }} />
                  )}
                  {adding ? "Adding…" : "Add Logo"}
                </button>
              </div>
              {addError && (
                <p
                  style={{
                    color: "#f87171",
                    fontSize: "12px",
                    marginTop: "8px",
                    margin: "6px 0 0",
                  }}
                  data-ocid="marquee.add_error_state"
                >
                  {addError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
