import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { backendInterface } from "../backend";
import TypewriterText from "../components/TypewriterText";
import { useActor } from "../hooks/useActor";
import { useSession } from "../hooks/useSession";
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
} as const;

export default function RegisterPage() {
  const { actor } = useActor();
  const { setSession } = useSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      let resolvedRole = "client";
      if (actor) {
        const passwordHash = await hashPassword(password);
        const result = await (actor as backendInterface).registerUser({
          firstName,
          lastName,
          email,
          passwordHash,
        });
        // Backend returns role='admin' for the admin email — read it from the response
        if (result && typeof result === "object" && "role" in result) {
          resolvedRole = result.role as string;
        } else if (
          result &&
          typeof result === "object" &&
          "ok" in result &&
          result.ok &&
          typeof result.ok === "object" &&
          "role" in result.ok
        ) {
          resolvedRole = (result.ok as { role?: string }).role ?? resolvedRole;
        }
      }
      setSession({ email, firstName, role: resolvedRole });
      // Fetch referral code in the background — fail silently (do not auto-create)
      if (actor) {
        (actor as backendInterface).getMyReferralCode(email).catch(() => {});
      }
      window.location.href =
        resolvedRole === "admin" ? "/admin/dashboard" : "/portal/dashboard";
    } catch {
      setSession({ email, firstName, role: "client" });
      // Fetch referral code in the background — fail silently (do not auto-create)
      if (actor) {
        (actor as backendInterface).getMyReferralCode(email).catch(() => {});
      }
      window.location.href = "/portal/dashboard";
    } finally {
      setIsLoading(false);
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: DARK.heading,
    fontWeight: 600,
    fontSize: "14px",
    marginBottom: "6px",
  };

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

        <>
          {/* Heading */}
          <h2
            className="text-center mb-6"
            style={{ color: DARK.heading, fontSize: "22px", fontWeight: 700 }}
          >
            Create Your Account.
          </h2>

          {/* Error message */}
          {error && (
            <div
              data-ocid="register.error_state"
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
            {/* First Name + Last Name */}
            <div
              className="mb-4"
              style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
            >
              <div style={{ flex: "1 1 calc(50% - 6px)", minWidth: "120px" }}>
                <label htmlFor="firstName" style={labelStyle}>
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  data-ocid="register.first_name_input"
                  style={inputStyle}
                  placeholder="Jane"
                />
              </div>
              <div style={{ flex: "1 1 calc(50% - 6px)", minWidth: "120px" }}>
                <label htmlFor="lastName" style={labelStyle}>
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  data-ocid="register.last_name_input"
                  style={inputStyle}
                  placeholder="Smith"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="mb-4">
              <label htmlFor="reg-email" style={labelStyle}>
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-ocid="register.email_input"
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>

            {/* Password field */}
            <div className="mb-1">
              <label htmlFor="reg-password" style={labelStyle}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-ocid="register.password_input"
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
            <p
              style={{
                fontSize: "12px",
                color: DARK.body,
                marginBottom: "16px",
                marginTop: "4px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: DARK.body,
                  marginBottom: "16px",
                  marginTop: "4px",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                <TypewriterText
                  text="Min. 8 characters, one uppercase letter, one number."
                  speed={20}
                />
              </p>
            </p>

            {/* Confirm Password field */}
            <div className="mb-6">
              <label htmlFor="reg-confirm-password" style={labelStyle}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-ocid="register.confirm_password_input"
                  style={{ ...inputStyle, padding: "10px 42px 10px 12px" }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
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
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              data-ocid="register.submit_button"
              style={{
                width: "100%",
                backgroundColor: isLoading
                  ? "rgba(94,240,138,0.4)"
                  : DARK.accent,
                color: DARK.accentText,
                fontWeight: 700,
                fontSize: "16px",
                border: "none",
                borderRadius: "6px",
                padding: "12px",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "background-color 0.15s",
              }}
            >
              {isLoading ? "Creating account…" : "Create Account"}
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
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: DARK.divider,
              }}
            />
            <span
              style={{
                color: DARK.body,
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              Already have an account?
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: DARK.divider,
              }}
            />
          </div>

          {/* Login link */}
          <div className="text-center">
            <a
              href="/login"
              data-ocid="register.login_link"
              style={{
                color: DARK.accent,
                fontWeight: 600,
                fontSize: "15px",
                textDecoration: "none",
              }}
            >
              Log in
            </a>
          </div>
        </>
      </div>
    </div>
  );
}
