import { useEffect } from "react";

export interface InstructionStep {
  heading?: string;
  text: string;
}

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  steps: InstructionStep[];
}

export default function InstructionModal({
  isOpen,
  onClose,
  title,
  steps,
}: InstructionModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      open
      aria-label={title}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
        border: "none",
        maxWidth: "100vw",
        maxHeight: "100vh",
        width: "100%",
        height: "100%",
        margin: 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: 512,
          width: "100%",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1.3,
            }}
          >
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              fontSize: 20,
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: 6,
              marginLeft: 12,
              flexShrink: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9ca3af";
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "20px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {steps.map((step, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: steps are static
              key={`step-${i}`}
              style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
            >
              {/* Number badge */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(94,240,138,0.15)",
                  color: "#5EF08A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              {/* Text */}
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#d1d5db",
                  lineHeight: 1.6,
                }}
              >
                {step.heading && (
                  <strong
                    style={{
                      color: "#ffffff",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: 2,
                    }}
                  >
                    {step.heading}
                  </strong>
                )}
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
}
