import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, RefreshCw, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { backendInterface } from "../backend.d";
import { ImperidomeBackground } from "../components/ImperidomeBackground";
import TypewriterText from "../components/TypewriterText";
import { useActor } from "../hooks/useActor";
import { saveSession } from "../hooks/useSession";
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
  divider: "#1C1F33",
  errorBg: "rgba(127,29,29,0.3)",
  errorBorder: "1px solid rgba(248,113,113,0.3)",
  errorText: "#F87171",
  infoBg: "rgba(94,240,138,0.08)",
  infoBorder: "1px solid rgba(94,240,138,0.2)",
} as const;

const OTP_RESEND_COOLDOWN = 60; // seconds

interface PendingAdminSession {
  email: string;
  firstName: string;
  role: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { actor, isFetching: actorLoading } = useActor();

  // ─── Login step state ──────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ─── 2FA step state ────────────────────────────────────────────────────────
  const [otpStep, setOtpStep] = useState(false);
  const [pendingSession, setPendingSession] =
    useState<PendingAdminSession | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startResendCooldown() {
    setResendCooldown(OTP_RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!actor) {
      setError("Connection initializing. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    try {
      if (import.meta.env.DEV) {
        console.log("[Login] Attempting login for:", email);
      }

      const passwordHash = await hashPassword(password);
      const result = await (actor as backendInterface).login({
        email,
        passwordHash,
      });

      if (import.meta.env.DEV) {
        console.log("[Login] Backend response:", JSON.stringify(result));
      }

      if (result && "ok" in result) {
        const role: string = result.ok?.role ?? "client";
        const firstName =
          (result.ok?.firstName as string) ||
          email.split("@")[0].replace(/[^a-zA-Z]/g, "") ||
          "User";

        if (import.meta.env.DEV) {
          console.log("[Login] Success — role:", role, "firstName:", firstName);
        }

        if (role === "admin") {
          // ── 2FA flow: request OTP before granting admin session ──────────
          setPendingSession({ email, firstName, role });
          try {
            const otpResult = await (
              actor as backendInterface
            ).generateAdminOTP(email);
            if ("err" in otpResult) {
              setError(
                otpResult.err ||
                  "Failed to send verification code. Please try again.",
              );
              return;
            }
            if (import.meta.env.DEV) {
              console.log("[Login] OTP sent to admin email");
            }
          } catch (otpErr) {
            if (import.meta.env.DEV) {
              console.error("[Login] generateAdminOTP failed:", otpErr);
            }
            setError("Failed to send verification code. Please try again.");
            return;
          } finally {
            setIsLoading(false);
          }
          setOtpStep(true);
          startResendCooldown();
          return;
        }

        // Non-admin: skip 2FA, proceed directly
        saveSession({ email, firstName, role });
        navigate({ to: "/portal" });
        return;
      }

      if (import.meta.env.DEV) {
        console.warn("[Login] Backend returned error:", result);
      }
      setError("Email or password is incorrect. Please try again.");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Login] Exception during login:", err);
      }
      setError("Email or password is incorrect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setOtpError("");

    if (!actor || !pendingSession) return;
    if (otp.trim().length < 4) {
      setOtpError("Please enter the verification code.");
      return;
    }

    setOtpLoading(true);
    try {
      const result = await (actor as backendInterface).verifyAdminOTP(
        pendingSession.email,
        otp.trim(),
      );
      if (import.meta.env.DEV) {
        console.log("[Login] verifyAdminOTP result:", result);
      }

      if ("ok" in result) {
        // Complete admin session setup
        saveSession(pendingSession);
        navigate({ to: "/admin" });
        return;
      }

      setOtpError(
        result.err || "Incorrect verification code. Please try again.",
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Login] verifyAdminOTP exception:", err);
      }
      setOtpError("Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!actor || !pendingSession || resendCooldown > 0) return;
    try {
      const resendResult = await (actor as backendInterface).generateAdminOTP(
        pendingSession.email,
      );
      if ("err" in resendResult) {
        setOtpError(
          resendResult.err || "Failed to resend code. Please try again.",
        );
        return;
      }
      startResendCooldown();
      setOtpError("");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Login] Resend OTP failed:", err);
      }
      setOtpError("Failed to resend code. Please try again.");
    }
  }

  function handleBackToLogin() {
    setOtpStep(false);
    setPendingSession(null);
    setOtp("");
    setOtpError("");
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(0);
  }

  const isButtonDisabled = isLoading || actorLoading || !actor;

  const inputStyle: CSSProperties = {
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

  const cardStyle: CSSProperties = {
    background: DARK.cardBg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "8px",
    padding: "40px",
    width: "100%",
    maxWidth: "440px",
    border: DARK.cardBorder,
    position: "relative",
    zIndex: 10,
  };

  // ─── 2FA Screen ────────────────────────────────────────────────────────────
  if (otpStep && pendingSession) {
    return (
      <div
        style={{ backgroundColor: DARK.pageBg, minHeight: "100vh" }}
        className="relative flex items-center justify-center px-4 py-12"
      >
        <ImperidomeBackground />
        <div style={cardStyle}>
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

          {/* 2FA icon + heading */}
          <div className="text-center mb-6">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(94,240,138,0.1)",
                border: "1px solid rgba(94,240,138,0.25)",
                marginBottom: "12px",
              }}
            >
              <Shield size={22} style={{ color: DARK.accent }} />
            </div>
            <h2
              style={{
                color: DARK.heading,
                fontSize: "20px",
                fontWeight: 700,
                margin: "0 0 8px",
              }}
            >
              Two-Factor Verification
            </h2>
            <p
              style={{
                color: DARK.body,
                fontSize: "14px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              A 6-digit verification code was sent to{" "}
              <span style={{ color: DARK.heading }}>
                {pendingSession.email}
              </span>
            </p>
          </div>

          {/* OTP error */}
          {otpError && (
            <div
              data-ocid="login.otp_error_state"
              style={{
                color: DARK.errorText,
                backgroundColor: DARK.errorBg,
                border: DARK.errorBorder,
                borderRadius: "6px",
                padding: "10px 14px",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {otpError}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} noValidate>
            {/* OTP input */}
            <div className="mb-6">
              <label
                htmlFor="otp"
                style={{
                  display: "block",
                  color: DARK.heading,
                  fontWeight: 600,
                  fontSize: "14px",
                  marginBottom: "6px",
                }}
              >
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                data-ocid="login.otp_input"
                style={{
                  ...inputStyle,
                  fontSize: "22px",
                  letterSpacing: "0.25em",
                  textAlign: "center",
                  fontWeight: 700,
                }}
                placeholder="000000"
              />
            </div>

            {/* Verify button */}
            <button
              type="submit"
              disabled={otpLoading || !otp.trim()}
              data-ocid="login.otp_verify_button"
              style={{
                width: "100%",
                backgroundColor:
                  otpLoading || !otp.trim()
                    ? "rgba(94,240,138,0.4)"
                    : DARK.accent,
                color: DARK.accentText,
                fontWeight: 700,
                fontSize: "16px",
                border: "none",
                borderRadius: "6px",
                padding: "12px",
                cursor: otpLoading || !otp.trim() ? "not-allowed" : "pointer",
                transition: "background-color 0.15s",
                marginBottom: "12px",
              }}
            >
              <TypewriterText
                text={otpLoading ? "Verifying…" : "Verify & Sign In"}
                speed={30}
                key={otpLoading ? "verifying" : "verify"}
              />
            </button>
          </form>

          {/* Resend + back */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              data-ocid="login.otp_resend_button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                color: resendCooldown > 0 ? DARK.body : DARK.accent,
                fontSize: "13px",
                fontWeight: 500,
                padding: 0,
                transition: "color 0.15s",
              }}
            >
              <RefreshCw size={13} />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              data-ocid="login.otp_back_button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: DARK.body,
                fontSize: "13px",
                padding: 0,
                transition: "color 0.15s",
              }}
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Password login screen ─────────────────────────────────────────────────
  return (
    <div
      style={{ backgroundColor: DARK.pageBg, minHeight: "100vh" }}
      className="relative flex items-center justify-center px-4 py-12"
    >
      <ImperidomeBackground />
      <div style={cardStyle}>
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

        {/* Heading */}
        <h2
          className="text-center mb-6"
          style={{ color: DARK.heading, fontSize: "22px", fontWeight: 700 }}
        >
          Welcome Back.
        </h2>

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
            data-ocid="login.error_state"
            style={{
              color: DARK.errorText,
              backgroundColor: DARK.errorBg,
              border: DARK.errorBorder,
              borderRadius: "6px",
              padding: "10px 14px",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate data-login-form="true">
          {/* Email field */}
          <div className="mb-4">
            <label
              htmlFor="email"
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
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-ocid="login.input"
              style={inputStyle}
              placeholder="you@example.com"
            />
          </div>

          {/* Password field */}
          <div className="mb-2">
            <label
              htmlFor="password"
              style={{
                display: "block",
                color: DARK.heading,
                fontWeight: 600,
                fontSize: "14px",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-ocid="login.password_input"
                style={{ ...inputStyle, padding: "10px 42px 10px 12px" }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="text-right mb-6">
            <a
              href="/forgot-password"
              data-ocid="login.forgot_password_link"
              style={{
                color: DARK.accent,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Forgot your password?
            </a>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isButtonDisabled}
            data-ocid="login.submit_button"
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
            {actorLoading
              ? "Connecting…"
              : isLoading
                ? "Logging in…"
                : "Log In"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "24px 0 16px",
          }}
        >
          <div
            style={{ flex: 1, height: "1px", backgroundColor: DARK.divider }}
          />
          <span
            style={{ color: DARK.body, fontSize: "13px", whiteSpace: "nowrap" }}
          >
            Don&apos;t have an account?
          </span>
          <div
            style={{ flex: 1, height: "1px", backgroundColor: DARK.divider }}
          />
        </div>

        {/* Register link */}
        <div className="text-center">
          <a
            href="/register"
            data-ocid="login.register_link"
            style={{
              color: DARK.accent,
              fontWeight: 600,
              fontSize: "15px",
              textDecoration: "none",
            }}
          >
            Create your account
          </a>
        </div>
      </div>
    </div>
  );
}
