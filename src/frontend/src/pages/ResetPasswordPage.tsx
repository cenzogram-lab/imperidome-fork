import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import type { backendInterface } from "../backend";
import { useActor } from "../hooks/useActor";
import { hashPassword } from "../lib/hashPassword";

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
} as const;

type PageState = "form" | "success" | "token_error" | "other_error";

export default function ResetPasswordPage() {
  const { actor, isFetching: actorLoading } = useActor();

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>("form");
  const [validationError, setValidationError] = useState("");
  const [tokenErrorMessage, setTokenErrorMessage] = useState("");

  // Read token from URL on mount; redirect if missing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      window.location.href = "/forgot-password";
    } else {
      setToken(t);
    }
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: DARK.inputBorder,
    borderRadius: "6px",
    padding: "10px 42px 10px 12px",
    fontSize: "15px",
    outline: "none",
    color: DARK.inputText,
    backgroundColor: DARK.inputBg,
    boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }
    if (!actor || !token) {
      setValidationError(
        "Connection initializing. Please wait a moment and try again.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const newPasswordHash = await hashPassword(newPassword);
      const result: string = await (
        actor as backendInterface
      ).resetPasswordWithToken(token, newPasswordHash);

      if (result === "Password updated successfully.") {
        setPageState("success");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (
        result.includes("expired") ||
        result.includes("Invalid") ||
        result.includes("already been used")
      ) {
        setTokenErrorMessage(result);
        setPageState("token_error");
      } else {
        setPageState("other_error");
      }
    } catch (err) {
      console.error("[ResetPassword] Exception:", err);
      setPageState("other_error");
    } finally {
      setIsLoading(false);
    }
  }

  const isButtonDisabled = isLoading || actorLoading || !actor || !token;

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

        {/* Success state */}
        {pageState === "success" && (
          <div data-ocid="reset_password.success_state" className="text-center">
            <div
              style={{
                color: DARK.accent,
                fontSize: "40px",
                marginBottom: "16px",
              }}
            >
              ✓
            </div>
            <h2
              style={{
                color: DARK.heading,
                fontSize: "22px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Password Updated
            </h2>
            <p
              style={{ color: DARK.body, fontSize: "14px", lineHeight: "1.6" }}
            >
              Your password has been updated. You'll be redirected to sign in
              shortly.
            </p>
          </div>
        )}

        {/* Token invalid/expired error */}
        {pageState === "token_error" && (
          <div data-ocid="reset_password.token_error_state">
            <h2
              className="text-center mb-4"
              style={{ color: DARK.heading, fontSize: "22px", fontWeight: 700 }}
            >
              Link Expired
            </h2>
            <div
              style={{
                color: "#FCA5A5",
                backgroundColor: "rgba(127,29,29,0.3)",
                border: "1px solid rgba(248,113,113,0.4)",
                borderRadius: "6px",
                padding: "14px 16px",
                fontSize: "14px",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              {tokenErrorMessage}
            </div>
            <div className="text-center">
              <a
                href="/forgot-password"
                data-ocid="reset_password.request_new_link"
                style={{
                  color: DARK.accent,
                  fontSize: "14px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Request a new reset link →
              </a>
            </div>
          </div>
        )}

        {/* Network / other error */}
        {pageState === "other_error" && (
          <div data-ocid="reset_password.error_state">
            <h2
              className="text-center mb-4"
              style={{ color: DARK.heading, fontSize: "22px", fontWeight: 700 }}
            >
              Something Went Wrong
            </h2>
            <div
              style={{
                color: "#F87171",
                backgroundColor: "rgba(127,29,29,0.3)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: "6px",
                padding: "12px 14px",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              Something went wrong. Please try again.
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setPageState("form")}
                data-ocid="reset_password.retry_button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: DARK.accent,
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                ← Try again
              </button>
            </div>
          </div>
        )}

        {/* Form state */}
        {pageState === "form" && (
          <>
            <h2
              className="text-center mb-6"
              style={{ color: DARK.heading, fontSize: "22px", fontWeight: 700 }}
            >
              Set New Password
            </h2>

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

            {validationError && (
              <div
                data-ocid="reset_password.field_error"
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
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* New Password */}
              <div className="mb-4">
                <label
                  htmlFor="rp-new-password"
                  style={{
                    display: "block",
                    color: DARK.heading,
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="rp-new-password"
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-ocid="reset_password.new_password_input"
                    style={inputStyle}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: DARK.body,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label
                  htmlFor="rp-confirm-password"
                  style={{
                    display: "block",
                    color: DARK.heading,
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="rp-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-ocid="reset_password.confirm_password_input"
                    style={inputStyle}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: DARK.body,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isButtonDisabled}
                data-ocid="reset_password.submit_button"
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
                {isLoading ? "Updating…" : "Update Password"}
              </button>
            </form>

            <div className="text-center mt-6">
              <a
                href="/login"
                data-ocid="reset_password.back_to_login_link"
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
