import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { backendInterface } from "../../backend.d";
import { EditableText } from "../../components/EditableText";
import { PROFILE_KEY } from "../../constants";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import { hashPassword } from "../../lib/hashPassword";
import PortalLayout from "./PortalLayout";

interface StoredProfile {
  lastName?: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
}

function getStoredProfile(): StoredProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return {};
  }
}

function saveStoredProfile(data: StoredProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

// ───────────────────────── Sub-component: PasswordField ─────────────────────
function PasswordField({
  id,
  label,
  value,
  onChange,
  ocid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  ocid: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        htmlFor={id}
        style={{ fontSize: "14px", fontWeight: 500, color: "#EEF0F8" }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          data-ocid={ocid}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 40px 10px 12px",
            border: "1px solid #1C1F33",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#EEF0F8",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: "#7A7D90",
            display: "flex",
            alignItems: "center",
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ───────────────────────── Main component ────────────────────────────────────
export default function PortalProfilePage() {
  const { session, setSession } = useSession();
  const { actor } = useActor();

  // ── Personal information state ──
  const [firstName, setFirstName] = useState(session?.firstName ?? "");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessTypeOptions, setBusinessTypeOptions] = useState<string[]>([
    "Not sure yet",
  ]);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    (actor as unknown as backendInterface)
      .getProducts()
      .then((products) => {
        setBusinessTypeOptions([
          "Not sure yet",
          ...products.map((p) => p.name),
        ]);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [actor]);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const profileFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Password state ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const passwordFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Danger zone state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionSubmitted, setDeletionSubmitted] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (profileFadeRef.current) clearTimeout(profileFadeRef.current);
      if (passwordFadeRef.current) clearTimeout(passwordFadeRef.current);
    };
  }, []);

  // Fetch backend profile on mount and use it as source of truth for the four
  // fields that are not included in the session object. Fall back to localStorage
  // only when the backend returns null or the call fails.
  useEffect(() => {
    if (!actor || !session?.email) return;
    (actor as backendInterface)
      .getMyProfile(session.email)
      .then((profile) => {
        if (profile) {
          // Backend is source of truth — use its values
          setLastName(profile.lastName ?? "");
          setPhone(profile.phone ?? "");
          setBusinessName(profile.businessName ?? "");
          setBusinessType(profile.businessType ?? "");
        }
      })
      .catch(() => {
        // Backend unavailable — fall back to localStorage as last resort
        const fallback = getStoredProfile();
        setLastName(fallback.lastName ?? "");
        setPhone(fallback.phone ?? "");
        setBusinessName(fallback.businessName ?? "");
        setBusinessType(fallback.businessType ?? "");
      });
  }, [actor, session?.email]);

  // Purge cached profile fields from localStorage when the session ends (logout).
  // Prevents stale profile data from persisting on shared devices.
  useEffect(() => {
    if (!session) {
      localStorage.removeItem(PROFILE_KEY);
    }
  }, [session]);

  // ── Handlers ──
  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    const email = session?.email ?? "";
    if (!email) return;
    setProfileSaving(true);
    setProfileError(null);
    const profileData: StoredProfile = {
      lastName,
      phone,
      businessName,
      businessType,
    };
    try {
      const result = await (actor as backendInterface).updateProfile({
        email,
        firstName,
        lastName,
        phone,
        businessName,
        businessType,
      });
      if ("err" in result) {
        setProfileError(
          typeof result.err === "string"
            ? result.err
            : "Failed to save profile. Please try again.",
        );
      } else {
        // 'ok' in result || 'okAlreadyAdvanced' in result
        saveStoredProfile(profileData);
        if (session) {
          setSession({ ...session, firstName });
        }
        setProfileSuccess(true);
        if (profileFadeRef.current) clearTimeout(profileFadeRef.current);
        profileFadeRef.current = setTimeout(
          () => setProfileSuccess(false),
          3000,
        );
      }
    } catch {
      setProfileError("Failed to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!session?.email) return;
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    const pwRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!pwRegex.test(newPassword)) {
      setPasswordError(
        "Password must be at least 8 characters with one uppercase letter and one number.",
      );
      return;
    }

    setPasswordSaving(true);
    try {
      const currentPasswordHash = await hashPassword(currentPassword);
      const newPasswordHash = await hashPassword(newPassword);
      const result = await (actor as backendInterface).changePassword({
        email: session?.email ?? "",
        currentPasswordHash,
        newPasswordHash,
      });
      if ("err" in result) {
        setPasswordError(
          typeof result.err === "string"
            ? result.err
            : "Current password is incorrect.",
        );
      } else {
        // 'ok' in result || 'okAlreadyAdvanced' in result
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSuccess(true);
        if (passwordFadeRef.current) clearTimeout(passwordFadeRef.current);
        passwordFadeRef.current = setTimeout(
          () => setPasswordSuccess(false),
          3000,
        );
      }
    } catch {
      setPasswordError("Current password is incorrect.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSubmitDeletion() {
    setDeletionLoading(true);
    try {
      await (actor as backendInterface).requestAccountDeletion();
      setDeletionSubmitted(true);
      setShowDeleteModal(false);
    } catch {
      // Keep modal open and surface the error so the user can retry
      setProfileError("Failed to submit deletion request. Please try again.");
    } finally {
      setDeletionLoading(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #1C1F33",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#EEF0F8",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#EEF0F8",
  };

  const cardStyle: CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid #1C1F33",
    width: "100%",
  };

  if (profileLoading) {
    return (
      <PortalLayout pageTitle="Profile">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "800px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "rgba(94,240,138,0.05)",
                borderRadius: "8px",
                padding: "24px",
                border: "1px solid rgba(94,240,138,0.1)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  height: "18px",
                  width: "160px",
                  borderRadius: "6px",
                  background: "rgba(94,240,138,0.08)",
                  marginBottom: "20px",
                }}
              />
              {[1, 2].map((j) => (
                <div
                  key={j}
                  style={{
                    height: "40px",
                    borderRadius: "6px",
                    background: "rgba(94,240,138,0.05)",
                    marginBottom: "12px",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <style>
          {
            "@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }"
          }
        </style>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout pageTitle="Profile">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          maxWidth: "800px",
        }}
      >
        {/* ═══════════════ Card 1: Personal Information ═══════════════ */}
        <div data-ocid="profile.personal_info.card" style={cardStyle}>
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "17px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            <EditableText
              textKey="portal.profile.personal-info.heading"
              defaultText="Personal Information"
              as="span"
            />
          </h3>
          <form
            onSubmit={handleSaveProfile}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Row 1: First + Last name */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2"
              style={{ gap: "16px" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label htmlFor="firstName" style={labelStyle}>
                  <EditableText
                    textKey="portal.profile.first-name.label"
                    defaultText="First Name"
                    as="span"
                  />
                </label>
                <input
                  id="firstName"
                  data-ocid="profile.first_name.input"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label htmlFor="lastName" style={labelStyle}>
                  <EditableText
                    textKey="portal.profile.last-name.label"
                    defaultText="Last Name"
                    as="span"
                  />
                </label>
                <input
                  id="lastName"
                  data-ocid="profile.last_name.input"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 2: Email (read-only) */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label htmlFor="email" style={labelStyle}>
                <EditableText
                  textKey="portal.profile.email.label"
                  defaultText="Email Address"
                  as="span"
                />
              </label>
              <input
                id="email"
                data-ocid="profile.email.input"
                type="email"
                value={session?.email ?? ""}
                readOnly
                disabled
                style={{
                  ...inputStyle,
                  background: "#0A0B14",
                  color: "#7A7D90",
                  cursor: "not-allowed",
                }}
              />
              <p style={{ margin: 0, fontSize: "12px", color: "#7A7D90" }}>
                <EditableText
                  textKey="portal.profile.email.helper-text"
                  defaultText={`To change your email address contact us at ${import.meta.env.VITE_ADMIN_EMAIL || "your account manager"}.`}
                  as="span"
                />
              </p>
            </div>

            {/* Row 3: Phone */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label htmlFor="phone" style={labelStyle}>
                <EditableText
                  textKey="portal.profile.phone.label"
                  defaultText="Phone Number"
                  as="span"
                />
              </label>
              <input
                id="phone"
                data-ocid="profile.phone.input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Row 4: Business Name */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label htmlFor="businessName" style={labelStyle}>
                <EditableText
                  textKey="portal.profile.business-name.label"
                  defaultText="Business Name"
                  as="span"
                />
              </label>
              <input
                id="businessName"
                data-ocid="profile.business_name.input"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Row 5: Business Type dropdown */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label htmlFor="businessType" style={labelStyle}>
                <EditableText
                  textKey="portal.profile.business-type.label"
                  defaultText="Business Type"
                  as="span"
                />
              </label>
              <select
                id="businessType"
                data-ocid="profile.business_type.select"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                style={{
                  ...inputStyle,
                  background: "rgba(17,19,34,0.7)",
                  cursor: "pointer",
                }}
              >
                <option value="">Select a type...</option>
                {businessTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Save row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                data-ocid="profile.personal_info.save_button"
                disabled={profileSaving}
                style={{
                  background: "#5EF08A",
                  color: "#061209",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  minHeight: "44px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: profileSaving ? "not-allowed" : "pointer",
                  opacity: profileSaving ? 0.7 : 1,
                }}
              >
                <EditableText
                  textKey="portal.profile.personal-info.save-btn"
                  defaultText={profileSaving ? "Saving..." : "Save Changes"}
                  as="span"
                />
              </button>
              {profileSuccess && (
                <span
                  data-ocid="profile.personal_info.success_state"
                  style={{
                    color: "#4ADE80",
                    fontSize: "14px",
                    fontWeight: 500,
                    animation: "fadeInOut 3s ease forwards",
                  }}
                >
                  <EditableText
                    textKey="portal.profile.personal-info.success-message"
                    defaultText="Profile updated successfully."
                    as="span"
                  />
                </span>
              )}
              {profileError && !showDeleteModal && (
                <span
                  data-ocid="profile.personal_info.error_state"
                  style={{
                    color: "#F87171",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {profileError}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* ═══════════════ Card 2: Change Password ═══════════════ */}
        <div data-ocid="profile.password.card" style={cardStyle}>
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "17px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            <EditableText
              textKey="portal.profile.change-password.heading"
              defaultText="Change Password"
              as="span"
            />
          </h3>
          <form
            onSubmit={handleChangePassword}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <PasswordField
              id="currentPassword"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              ocid="profile.current_password.input"
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <PasswordField
                id="newPassword"
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                ocid="profile.new_password.input"
              />
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: "#7A7D90",
                }}
              >
                <EditableText
                  textKey="portal.profile.password.requirements-hint"
                  defaultText="Minimum 8 characters, one uppercase letter, one number."
                  as="span"
                />
              </p>
            </div>
            <PasswordField
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              ocid="profile.confirm_password.input"
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                data-ocid="profile.password.save_button"
                disabled={passwordSaving}
                style={{
                  background: "#5EF08A",
                  color: "#061209",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  minHeight: "44px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: passwordSaving ? "not-allowed" : "pointer",
                  opacity: passwordSaving ? 0.7 : 1,
                }}
              >
                <EditableText
                  textKey="portal.profile.change-password.submit-btn"
                  defaultText={
                    passwordSaving ? "Updating..." : "Update Password"
                  }
                  as="span"
                />
              </button>
              {passwordSuccess && (
                <span
                  data-ocid="profile.password.success_state"
                  style={{
                    color: "#4ADE80",
                    fontSize: "14px",
                    fontWeight: 500,
                    animation: "fadeInOut 3s ease forwards",
                  }}
                >
                  <EditableText
                    textKey="portal.profile.change-password.success-message"
                    defaultText="Password updated successfully."
                    as="span"
                  />
                </span>
              )}
              {passwordError && (
                <span
                  data-ocid="profile.password.error_state"
                  style={{
                    color: "#F87171",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {passwordError}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* ═══════════════ Card 3: Danger Zone ═══════════════ */}
        <div
          data-ocid="profile.danger_zone.card"
          style={{ ...cardStyle, border: "1px solid #F87171" }}
        >
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "17px",
              fontWeight: 700,
              color: "#F87171",
            }}
          >
            <EditableText
              textKey="portal.profile.danger-zone.heading"
              defaultText="Danger Zone"
              as="span"
            />
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#7A7D90" }}>
            <EditableText
              textKey="portal.profile.danger-zone.description"
              defaultText="Permanently remove your account and all associated data."
              as="span"
            />
          </p>
          {profileError && (
            <p
              data-ocid="profile.danger_zone.error_state"
              style={{
                margin: "0 0 12px",
                fontSize: "14px",
                color: "#F87171",
                fontWeight: 500,
              }}
            >
              {profileError}
            </p>
          )}
          {deletionSubmitted ? (
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#5EF08A",
                fontFamily: "'Courier New', monospace",
                fontWeight: 500,
              }}
            >
              <EditableText
                textKey="portal.profile.danger-zone.deletion-submitted"
                defaultText="Deletion request submitted. Our team will be in touch."
                as="span"
              />
            </p>
          ) : (
            <button
              type="button"
              data-ocid="profile.delete.open_modal_button"
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: "rgba(17,19,34,0.7)",
                color: "#F87171",
                border: "1px solid #F87171",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <EditableText
                textKey="portal.profile.danger-zone.delete-btn"
                defaultText="Request Account Deletion"
                as="span"
              />
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════ Deletion Confirmation Modal ═══════════════ */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowDeleteModal(false);
          }}
        >
          <dialog
            data-ocid="profile.delete.modal"
            open={showDeleteModal}
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            style={{
              background: "rgba(17,19,34,0.7)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              id="delete-modal-title"
              style={{
                margin: "0 0 12px",
                fontSize: "18px",
                fontWeight: 700,
                color: "#EEF0F8",
              }}
            >
              <EditableText
                textKey="portal.profile.delete-modal.heading"
                defaultText="Are you sure?"
                as="span"
              />
            </h3>
            <p
              style={{
                margin: "0 0 24px",
                fontSize: "14px",
                color: "#7A7D90",
                lineHeight: 1.6,
              }}
            >
              <EditableText
                textKey="portal.profile.delete-modal.body"
                defaultText="Requesting account deletion will notify our team. Active subscriptions must be cancelled before deletion can be completed. This cannot be undone."
                as="span"
              />
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                data-ocid="profile.delete.cancel_button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: "#5EF08A",
                  color: "#061209",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <EditableText
                  textKey="portal.profile.delete-modal.cancel-btn"
                  defaultText="Cancel"
                  as="span"
                />
              </button>
              <button
                type="button"
                data-ocid="profile.delete.confirm_button"
                onClick={handleSubmitDeletion}
                disabled={deletionLoading}
                style={{
                  background: "#F87171",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: deletionLoading ? "not-allowed" : "pointer",
                  opacity: deletionLoading ? 0.7 : 1,
                }}
              >
                {deletionLoading ? (
                  "Submitting\u2026"
                ) : (
                  <EditableText
                    textKey="portal.profile.delete-modal.confirm-btn"
                    defaultText="Submit Deletion Request"
                    as="span"
                  />
                )}
              </button>
            </div>
          </dialog>
        </div>
      )}

      {/* Keyframe for fade-out animation */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-4px); }
          15% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </PortalLayout>
  );
}
