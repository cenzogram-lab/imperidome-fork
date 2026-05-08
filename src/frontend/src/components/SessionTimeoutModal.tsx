import { useEffect, useState } from "react";

const DARK = {
  overlay: "rgba(0,0,0,0.75)",
  cardBg: "rgba(17,19,34,0.97)",
  cardBorder: "1px solid #1C1F33",
  heading: "#EEF0F8",
  body: "#7A7D90",
  accent: "#5EF08A",
  accentText: "#061209",
  warningOrange: "#F97316",
  warningBg: "rgba(249,115,22,0.1)",
  warningBorder: "1px solid rgba(249,115,22,0.25)",
} as const;

interface SessionTimeoutModalProps {
  isOpen: boolean;
  timeRemaining: number; // ms
  onStayLoggedIn: () => void;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SessionTimeoutModal({
  isOpen,
  timeRemaining,
  onStayLoggedIn,
}: SessionTimeoutModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow CSS transition
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [isOpen]);

  if (!isOpen) return null;

  function handleHoverEnter(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.opacity = "0.88";
  }

  function handleHoverLeave(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.opacity = "1";
  }

  return (
    <dialog
      data-ocid="session_timeout.dialog"
      open
      aria-labelledby="session-timeout-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: DARK.overlay,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
        border: "none",
        width: "100vw",
        height: "100vh",
        maxWidth: "none",
        maxHeight: "none",
      }}
    >
      <div
        style={{
          background: DARK.cardBg,
          border: DARK.cardBorder,
          borderRadius: "12px",
          padding: "24px",
          width: "100%",
          maxWidth: "400px",
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "transform 0.25s ease, opacity 0.2s ease",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: DARK.warningBg,
            border: DARK.warningBorder,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "22px" }}>⏱</span>
        </div>

        {/* Title */}
        <h2
          id="session-timeout-title"
          style={{
            color: DARK.heading,
            fontSize: "18px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Session Expiring Soon
        </h2>

        {/* Description */}
        <p
          style={{
            color: DARK.body,
            fontSize: "14px",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          You have been inactive and will be automatically logged out in:
        </p>

        {/* Countdown */}
        <div
          data-ocid="session_timeout.countdown"
          style={{
            textAlign: "center",
            marginBottom: "28px",
            padding: "16px",
            borderRadius: "8px",
            background: DARK.warningBg,
            border: DARK.warningBorder,
          }}
        >
          <span
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: DARK.warningOrange,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.04em",
            }}
          >
            {formatCountdown(timeRemaining)}
          </span>
        </div>

        {/* Action */}
        <button
          type="button"
          data-ocid="session_timeout.confirm_button"
          onClick={onStayLoggedIn}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          style={{
            width: "100%",
            backgroundColor: DARK.accent,
            color: DARK.accentText,
            fontWeight: 700,
            fontSize: "15px",
            border: "none",
            borderRadius: "8px",
            padding: "13px",
            minHeight: "44px",
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
        >
          Stay Logged In
        </button>
      </div>
    </dialog>
  );
}
