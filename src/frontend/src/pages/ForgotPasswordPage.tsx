import { useEffect, useRef, useState } from "react";
import type { backendInterface } from "../backend";
import TypewriterText from "../components/TypewriterText";
import { useActor } from "../hooks/useActor";

const DARK = {
  pageBg: "#0A0B14",
  cardBg: "rgba(17,19,34,0.7)",
  cardBorder: "1px solid #1C1F33",
  heading: "#EEF0F8",
  body: "#7A7D90",
  inputBg: "rgba(19,21,36,1)",
  inputBorder: "1px solid #1C1F33",
  inputText: "#EEF0F8",
  accent: "#5EF08A",
  accentText: "#061209",
  divider: "#1C1F33",
} as const;

const NEON = "#39FF14";
const RESEND_COOLDOWN = 60; // seconds

export default function ForgotPasswordPage() {
  const { actor, isFetching: actorLoading } = useActor();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFlash, setResendFlash] = useState(false); // "Link resent" flash
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const [resendHovered, setResendHovered] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    countdownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (!actor || resendLoading || cooldown > 0) return;

    setResendLoading(true);
    try {
      await (actor as backendInterface).requestPasswordReset(email);
      // Show "Link resent" flash for 3 seconds
      setResendFlash(true);
      flashTimeoutRef.current = setTimeout(() => {
        setResendFlash(false);
      }, 3000);
      // Start 60-second cooldown
      startCooldown();
    } catch (err) {
      console.error("[ForgotPassword] Resend exception:", err);
    } finally {
      setResendLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: DARK.inputBorder,
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "15px",
    outline: "none",
    color: DARK.inputText,
    backgroundColor: DARK.inputBg,
    boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!actor) {
      setError("Connection initializing. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    try {
      await (actor as backendInterface).requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      console.error("[ForgotPassword] Exception:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const isButtonDisabled = isLoading || actorLoading || !actor;

  // Resend button label
  function resendLabel() {
    if (resendLoading) return "Sending…";
    if (cooldown > 0) return `Resend in ${cooldown}s`;
    return "Resend Email";
  }

  const isResendDisabled = resendLoading || cooldown > 0 || !actor;

  return (
    <div
      style={{ backgroundColor: DARK.pageBg, minHeight: "100vh" }}
      className="flex items-center justify-center px-4 py-12"
    >
      <div
        style={{
          background: DARK.cardBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "8px",
          padding: "40px",
          width: "100%",
          maxWidth: "440px",
          border: DARK.cardBorder,
        }}
      >
        {/* Wordmark */}
        <div className="text-center mb-6">
          <span
            style={{
              color: DARK.accent,
              fontWeight: 700,
              fontSize: "28px",
              letterSpacing: "0.12em",
            }}
          >
            IMPERIDOME
          </span>
        </div>

        {submitted ? (
          /* Success state */
          <div data-ocid="forgot_password.success_state">
            <h2
              className="text-center mb-4"
              style={{ color: DARK.heading, fontSize: "22px", fontWeight: 700 }}
            >
              Check Your Email
            </h2>
            <p
              style={{
                color: DARK.body,
                fontSize: "15px",
                lineHeight: "1.6",
                textAlign: "center",
                marginBottom: "28px",
              }}
            >
              If an account exists for that address, a reset link will arrive in
              a few minutes. Check your spam folder if you don't see it.
            </p>

            {/* Resend section */}
            <div className="text-center" style={{ marginBottom: "24px" }}>
              {resendFlash ? (
                <span
                  data-ocid="forgot_password.resend_success_state"
                  style={{
                    display: "inline-block",
                    color: NEON,
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: "10px 20px",
                    letterSpacing: "0.03em",
                  }}
                >
                  ✓ Link resent
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isResendDisabled}
                  data-ocid="forgot_password.resend_button"
                  onClick={handleResend}
                  onMouseEnter={() => setResendHovered(true)}
                  onMouseLeave={() => setResendHovered(false)}
                  style={{
                    display: "inline-block",
                    backgroundColor: "rgba(57,255,20,0.06)",
                    border:
                      resendHovered && !isResendDisabled
                        ? `1px solid ${NEON}`
                        : "1px solid rgba(57,255,20,0.25)",
                    borderRadius: "6px",
                    padding: "10px 24px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: isResendDisabled
                      ? "rgba(57,255,20,0.4)"
                      : (NEON as string),
                    cursor: isResendDisabled ? "not-allowed" : "pointer",
                    transition:
                      "border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                    boxShadow:
                      resendHovered && !isResendDisabled
                        ? "0 0 10px rgba(57,255,20,0.25)"
                        : "none",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  {resendLabel()}
                </button>
              )}
            </div>

            <div className="text-center">
              <a
                href="/login"
                data-ocid="forgot_password.back_to_login_link"
                style={{
                  color: DARK.accent,
                  fontSize: "14px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                ← Back to sign in
              </a>
            </div>
          </div>
        ) : (
          /* Form state */
          <>
            <h2
              className="text-center mb-3"
              style={{ color: DARK.heading, fontSize: "22px", fontWeight: 700 }}
            >
              Reset Password
            </h2>
            <p
              style={{
                color: DARK.body,
                fontSize: "14px",
                lineHeight: "1.6",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            {/* Actor loading notice */}
            {actorLoading && (
              <div
                style={{
                  color: DARK.body,
                  backgroundColor: "rgba(19,21,36,1)",
                  border: DARK.cardBorder,
                  borderRadius: "6px",
                  padding: "10px 14px",
                  fontSize: "14px",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                Connecting to server…
              </div>
            )}

            {/* Error message */}
            {error && (
              <div
                data-ocid="forgot_password.error_state"
                style={{
                  color: "#F87171",
                  backgroundColor: "rgba(127,29,29,0.3)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  fontSize: "14px",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-6">
                <label
                  htmlFor="fp-email"
                  style={{
                    display: "block",
                    color: DARK.heading,
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  Email Address
                </label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-ocid="forgot_password.email_input"
                  style={inputStyle}
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isButtonDisabled}
                data-ocid="forgot_password.submit_button"
                style={{
                  width: "100%",
                  backgroundColor: isButtonDisabled
                    ? "rgba(94,240,138,0.4)"
                    : DARK.accent,
                  color: DARK.accentText,
                  fontWeight: 700,
                  fontSize: "16px",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px",
                  cursor: isButtonDisabled ? "not-allowed" : "pointer",
                  transition: "background-color 0.15s",
                }}
              >
                <TypewriterText
                  text={isLoading ? "Sending…" : "Send Reset Link"}
                  speed={30}
                  key={isLoading ? "sending" : "idle"}
                />
              </button>
            </form>

            <div className="text-center mt-6">
              <a
                href="/login"
                data-ocid="forgot_password.back_to_login_link"
                style={{
                  color: DARK.accent,
                  fontSize: "14px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                ← Back to sign in
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
