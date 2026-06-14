import { Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { ADMIN_TABS } from "../../adminTabs";
import type { SubAdmin, backendInterface } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { ADMIN_EMAIL_KEY } from "../../constants";
import { useActor } from "../../hooks/useActor";
import { getSession, useSession } from "../../hooks/useSession";
import { hashPassword } from "../../lib/hashPassword";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem(ADMIN_EMAIL_KEY) ?? "";
}

// ─── VAPID Helper ─────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
          className="matrix-input"
          style={{
            width: "100%",
            padding: "10px 40px 10px 12px",
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

export default function AdminProfilePage() {
  const { session } = useSession();
  const { actor, isFetching } = useActor();

  // ─── Active tab ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "notifications" | "adminUsers"
  >("profile");

  // ─── Load error ───────────────────────────────────────────────────────────
  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── Password change ──────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Profile fields ────────────────────────────────────────────────────────
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileBusinessName, setProfileBusinessName] = useState("");
  const [profileBusinessType, setProfileBusinessType] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");
  const profileFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load profile on mount
  useEffect(() => {
    if (!actor || isFetching || !session?.email) return;
    actor
      .getMyProfile(session.email)
      .then((profile) => {
        if (profile) {
          setProfileFirstName(profile.firstName);
          setProfileLastName(profile.lastName);
          setProfilePhone(profile.phone);
          setProfileBusinessName(profile.businessName);
          setProfileBusinessType(profile.businessType);
        }
      })
      .catch(() => {
        setLoadError("Failed to load profile. Please try again.");
      });
  }, [actor, isFetching, session?.email]);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!actor || !session?.email) return;
    setProfileError("");
    setProfileSuccess(false);
    setProfileSaving(true);
    try {
      const result = await actor.updateProfile({
        email: session.email,
        firstName: profileFirstName,
        lastName: profileLastName,
        phone: profilePhone,
        businessName: profileBusinessName,
        businessType: profileBusinessType,
      });
      if ("ok" in result || "okAlreadyAdvanced" in result) {
        setProfileSuccess(true);
        if (profileFadeRef.current) clearTimeout(profileFadeRef.current);
        profileFadeRef.current = setTimeout(
          () => setProfileSuccess(false),
          4000,
        );
      } else {
        setProfileError(
          "err" in result ? result.err : "Failed to save profile.",
        );
      }
    } catch {
      setProfileError("Failed to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  // ─── Push notifications ──────────────────────────────────────────────────
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushToast, setPushToast] = useState<string | null>(null);
  const [pushToastIsError, setPushToastIsError] = useState(false);
  const [pushWorking, setPushWorking] = useState(false);
  const pushToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPushToast = useCallback((msg: string, isError = false) => {
    setPushToast(msg);
    setPushToastIsError(isError);
    if (pushToastTimer.current) clearTimeout(pushToastTimer.current);
    pushToastTimer.current = setTimeout(() => setPushToast(null), 5000);
  }, []);

  // Determine current push status
  useEffect(() => {
    const granted = localStorage.getItem("push_permission_granted");
    const browserGranted =
      "Notification" in window && Notification.permission === "granted";
    setPushEnabled(!!granted && browserGranted);
  }, []);

  // Fetch VAPID key on mount so it's ready for turn-on flow
  const [vapidKey, setVapidKey] = useState("");
  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getVapidPublicKey()
      .then((k) => setVapidKey(k))
      .catch(() => {});
  }, [actor, isFetching]);

  // ─── Sub-admins ──────────────────────────────────────────────────────────
  const AVAILABLE_TABS = ADMIN_TABS;

  const [subAdmins, setSubAdmins] = useState<Array<[string, SubAdmin]>>([]);
  const [subAdminsLoading, setSubAdminsLoading] = useState(false);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState("");
  const [removeAdminLoadingEmail, setRemoveAdminLoadingEmail] = useState("");

  async function loadSubAdmins() {
    if (!actor) return;
    setSubAdminsLoading(true);
    try {
      const result = await (actor as backendInterface).getSubAdmins();
      if ("ok" in result) {
        setSubAdmins(result.ok);
      }
    } catch {
      // silently fail — list stays empty
    } finally {
      setSubAdminsLoading(false);
    }
  }

  function handleToggleTab(tab: string) {
    setSelectedTabs((prev) =>
      prev.includes(tab) ? prev.filter((t) => t !== tab) : [...prev, tab],
    );
  }

  function handleSelectAll() {
    setSelectedTabs([...AVAILABLE_TABS]);
  }

  function handleDeselectAll() {
    setSelectedTabs([]);
  }

  async function handleAddSubAdmin() {
    if (!actor) return;
    if (!newAdminEmail.trim()) {
      setAddAdminError("Email is required.");
      return;
    }
    setAddAdminError("");
    setAddAdminLoading(true);
    try {
      const result = await (actor as backendInterface).addSubAdmin(
        newAdminEmail.trim(),
        selectedTabs,
      );
      if ("ok" in result) {
        setShowAddAdminForm(false);
        setNewAdminEmail("");
        setSelectedTabs([]);
        showPushToast("Admin user added successfully.");
        await loadSubAdmins();
      } else {
        setAddAdminError("err" in result ? result.err : "Failed to add admin.");
      }
    } catch {
      setAddAdminError("Failed to add admin. Please try again.");
    } finally {
      setAddAdminLoading(false);
    }
  }

  async function handleRemoveSubAdmin(email: string) {
    if (!actor) return;
    setRemoveAdminLoadingEmail(email);
    try {
      const result = await (actor as backendInterface).removeSubAdmin(email);
      if ("ok" in result) {
        showPushToast("Admin user removed.");
        await loadSubAdmins();
      } else {
        showPushToast(
          "err" in result ? result.err : "Failed to remove admin.",
          true,
        );
      }
    } catch {
      showPushToast("Failed to remove admin. Please try again.", true);
    } finally {
      setRemoveAdminLoadingEmail("");
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadSubAdmins is stable
  useEffect(() => {
    if (activeTab === "adminUsers" && actor && !isFetching) {
      loadSubAdmins();
    }
  }, [activeTab, actor, isFetching]);

  async function handleTurnOff() {
    const _adminEmail = getAdminEmail();
    if (!_adminEmail) {
      showPushToast("Session not ready. Please refresh.", true);
      return;
    }
    setPushWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      if (actor) {
        await actor.removePushSubscription();
      }
      localStorage.removeItem("push_permission_granted");
      setPushEnabled(false);
      showPushToast("Push notifications disabled.", false);
    } catch (err) {
      showPushToast(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        true,
      );
    } finally {
      setPushWorking(false);
    }
  }

  async function handleTurnOn() {
    if (!actor) return;
    const _adminEmail = getAdminEmail();
    if (!_adminEmail) {
      showPushToast("Session not ready. Please refresh.", true);
      return;
    }
    setPushWorking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const key =
          vapidKey || (await actor.getVapidPublicKey().catch(() => ""));
        if (!key) {
          showPushToast(
            "VAPID key not configured — set it in Notification Settings.",
            true,
          );
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key)
            .buffer as ArrayBuffer,
        });
        const json = sub.toJSON();
        const endpoint = sub.endpoint;
        const p256dh = json.keys?.p256dh ?? "";
        const auth = json.keys?.auth ?? "";
        await actor.savePushSubscription(endpoint, p256dh, auth);
        localStorage.setItem("push_permission_granted", "true");
        setPushEnabled(true);
        showPushToast("Push notifications enabled!", false);
      } else if (permission === "denied") {
        showPushToast(
          "Permission denied — please enable notifications in your browser settings.",
          true,
        );
      }
    } catch (err) {
      showPushToast(
        `Failed to enable: ${err instanceof Error ? err.message : "Unknown error"}`,
        true,
      );
    } finally {
      setPushWorking(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    const pwRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!pwRegex.test(newPassword)) {
      setError(
        "Password must be at least 8 characters with one uppercase letter and one number.",
      );
      return;
    }

    setSaving(true);
    try {
      const currentPasswordHash = await hashPassword(currentPassword);
      const newPasswordHash = await hashPassword(newPassword);
      const result = await (actor as backendInterface).changePassword({
        email: getAdminEmail(),
        currentPasswordHash,
        newPasswordHash,
      });
      // Use "err" in result pattern for Motoko variant checks — never __kind__-based narrowing
      if ("err" in result) {
        setError("Current password is incorrect. Please try again.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      if (fadeRef.current) clearTimeout(fadeRef.current);
      fadeRef.current = setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Current password is incorrect. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const cardStyle: CSSProperties = {
    background: "rgba(10,11,20,0.85)",
    borderRadius: "8px",
    padding: "28px",
    border: "1px solid rgba(94,240,138,0.2)",
    boxShadow: "0 0 20px rgba(94,240,138,0.05)",
    maxWidth: "640px",
    width: "100%",
  };

  const TABS: Array<{
    id: "profile" | "password" | "notifications" | "adminUsers";
    label: string;
  }> = [
    { id: "profile", label: "Profile" },
    { id: "password", label: "Password" },
    { id: "notifications", label: "Notifications" },
    { id: "adminUsers", label: "Admin Users" },
  ];

  return (
    <AdminLayout pageTitle="Profile">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {loadError && (
          <div
            data-ocid="admin.profile.load.error_state"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "8px",
              padding: "14px 16px",
              color: "#f87171",
              fontSize: "14px",
              fontWeight: 500,
              maxWidth: "640px",
            }}
          >
            {loadError}
          </div>
        )}

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            borderBottom: "1px solid rgba(94,240,138,0.15)",
            maxWidth: "640px",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-ocid={`admin.profile.tab.${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 18px",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid #5EF08A"
                    : "2px solid transparent",
                color: activeTab === tab.id ? "#5EF08A" : "#7A7D90",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
                marginBottom: "-1px",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <>
            {/* Account info card */}
            <div style={cardStyle}>
              <h3
                className="matrix-heading"
                style={{
                  margin: "0 0 20px",
                  fontSize: "17px",
                  fontWeight: 700,
                }}
              >
                <TypewriterText text="Account" speed={40} />
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "12px",
                      color: "#7A7D90",
                      fontWeight: 500,
                    }}
                  >
                    Email
                  </p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#EEF0F8" }}>
                    {session?.email ?? "—"}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "12px",
                      color: "#7A7D90",
                      fontWeight: 500,
                    }}
                  >
                    Role
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      background: "rgba(94,240,138,0.15)",
                      color: "#5EF08A",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 10px",
                      borderRadius: "12px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {session?.role
                      ? session.role.charAt(0).toUpperCase() +
                        session.role.slice(1)
                      : "Admin"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Information card */}
            <div data-ocid="admin.profile.info.card" style={cardStyle}>
              <h3
                className="matrix-heading"
                style={{
                  margin: "0 0 20px",
                  fontSize: "17px",
                  fontWeight: 700,
                }}
              >
                <TypewriterText text="Profile Information" speed={40} />
              </h3>
              <form
                onSubmit={handleSaveProfile}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <label
                      htmlFor="admin-profileFirstName"
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#EEF0F8",
                      }}
                    >
                      First Name
                    </label>
                    <input
                      id="admin-profileFirstName"
                      data-ocid="admin.profile.first_name.input"
                      type="text"
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      className="matrix-input"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <label
                      htmlFor="admin-profileLastName"
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#EEF0F8",
                      }}
                    >
                      Last Name
                    </label>
                    <input
                      id="admin-profileLastName"
                      data-ocid="admin.profile.last_name.input"
                      type="text"
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      className="matrix-input"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <label
                    htmlFor="admin-profilePhone"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#EEF0F8",
                    }}
                  >
                    Phone
                  </label>
                  <input
                    id="admin-profilePhone"
                    data-ocid="admin.profile.phone.input"
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="matrix-input"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <label
                    htmlFor="admin-profileBusinessName"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#EEF0F8",
                    }}
                  >
                    Business Name
                  </label>
                  <input
                    id="admin-profileBusinessName"
                    data-ocid="admin.profile.business_name.input"
                    type="text"
                    value={profileBusinessName}
                    onChange={(e) => setProfileBusinessName(e.target.value)}
                    className="matrix-input"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <label
                    htmlFor="admin-profileBusinessType"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#EEF0F8",
                    }}
                  >
                    Business Type
                  </label>
                  <input
                    id="admin-profileBusinessType"
                    data-ocid="admin.profile.business_type.input"
                    type="text"
                    value={profileBusinessType}
                    onChange={(e) => setProfileBusinessType(e.target.value)}
                    className="matrix-input"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginTop: "4px",
                  }}
                >
                  <button
                    type="submit"
                    data-ocid="admin.profile.info.save_button"
                    disabled={profileSaving}
                    style={{
                      background: "#5EF08A",
                      color: "#061209",
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px 24px",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: profileSaving ? "not-allowed" : "pointer",
                      opacity: profileSaving ? 0.7 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {profileSaving ? "Saving..." : "Save Profile"}
                  </button>
                  {profileSuccess && (
                    <span
                      data-ocid="admin.profile.info.success_state"
                      style={{
                        color: "#5EF08A",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      ✓ Profile saved successfully.
                    </span>
                  )}
                  {profileError && (
                    <span
                      data-ocid="admin.profile.info.error_state"
                      style={{
                        color: "#EF4444",
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
          </>
        )}

        {/* ── Password tab ── */}
        {activeTab === "password" && (
          <div data-ocid="admin.profile.password.card" style={cardStyle}>
            <h3
              className="matrix-heading"
              style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: 700 }}
            >
              <TypewriterText text="Change Password" speed={40} />
            </h3>
            <form
              onSubmit={handleChangePassword}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <PasswordField
                id="admin-currentPassword"
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                ocid="admin.profile.current_password.input"
              />
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <PasswordField
                  id="admin-newPassword"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  ocid="admin.profile.new_password.input"
                />
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "12px",
                    color: "#7A7D90",
                  }}
                >
                  Minimum 8 characters, one uppercase letter, one number.
                </p>
              </div>
              <PasswordField
                id="admin-confirmPassword"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                ocid="admin.profile.confirm_password.input"
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginTop: "4px",
                }}
              >
                <button
                  type="submit"
                  data-ocid="admin.profile.password.save_button"
                  disabled={saving}
                  style={{
                    background: "#5EF08A",
                    color: "#061209",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 24px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
                {success && (
                  <span
                    data-ocid="admin.profile.password.success_state"
                    style={{
                      color: "#5EF08A",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    ✓ Password updated successfully.
                  </span>
                )}
                {error && (
                  <span
                    data-ocid="admin.profile.password.error_state"
                    style={{
                      color: "#EF4444",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {error}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ── Notifications tab ── */}
        {activeTab === "notifications" && (
          <div
            data-ocid="admin.profile.push_notifications.card"
            style={cardStyle}
          >
            <h3
              className="matrix-heading"
              style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: 700 }}
            >
              <TypewriterText text="Push Notifications" speed={40} />
            </h3>

            {/* Status badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 13, color: "#7A7D90" }}>Status:</span>
              {pushEnabled ? (
                <span
                  data-ocid="admin.profile.push_notifications.enabled_badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(94,240,138,0.12)",
                    color: "#5EF08A",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "12px",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#5EF08A",
                      display: "inline-block",
                    }}
                  />
                  Notifications enabled
                </span>
              ) : (
                <span
                  data-ocid="admin.profile.push_notifications.disabled_badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(122,125,144,0.15)",
                    color: "#7A7D90",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "12px",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#7A7D90",
                      display: "inline-block",
                    }}
                  />
                  Notifications disabled
                </span>
              )}
            </div>

            {/* Toggle button */}
            {pushEnabled ? (
              <button
                type="button"
                data-ocid="admin.profile.push_notifications.turn_off_button"
                disabled={pushWorking}
                onClick={handleTurnOff}
                style={{
                  background: "transparent",
                  color: "#7A7D90",
                  border: "1px solid #1C1F33",
                  borderRadius: "6px",
                  padding: "9px 20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: pushWorking ? "not-allowed" : "pointer",
                  opacity: pushWorking ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {pushWorking ? "Disabling…" : "Turn Off Notifications"}
              </button>
            ) : (
              <button
                type="button"
                data-ocid="admin.profile.push_notifications.turn_on_button"
                disabled={pushWorking}
                onClick={handleTurnOn}
                style={{
                  background: "#d4a017",
                  color: "#0A0B14",
                  border: "none",
                  borderRadius: "6px",
                  padding: "9px 20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: pushWorking ? "not-allowed" : "pointer",
                  opacity: pushWorking ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {pushWorking ? "Enabling…" : "Turn On Notifications"}
              </button>
            )}

            {/* Toast feedback */}
            {pushToast && (
              <p
                data-ocid="admin.profile.push_notifications.toast"
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: pushToastIsError ? "#ef4444" : "#5EF08A",
                  fontWeight: 500,
                }}
              >
                {pushToast}
              </p>
            )}
          </div>
        )}

        {/* ── Admin Users tab ── */}
        {activeTab === "adminUsers" && (
          <div style={{ ...cardStyle, maxWidth: "700px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h3
                className="matrix-heading"
                style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}
              >
                Authorized Admins
              </h3>
              {!showAddAdminForm && (
                <button
                  type="button"
                  data-ocid="admin.profile.adminUsers.add_button"
                  onClick={() => {
                    setShowAddAdminForm(true);
                    setAddAdminError("");
                  }}
                  style={{
                    padding: "7px 16px",
                    background: "rgba(94,240,138,0.1)",
                    border: "1px solid rgba(94,240,138,0.3)",
                    color: "#5EF08A",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    transition: "background 0.15s",
                  }}
                >
                  + Add Admin
                </button>
              )}
            </div>

            {/* Add Admin Form */}
            {showAddAdminForm && (
              <div
                data-ocid="admin.profile.adminUsers.add_form"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                    letterSpacing: "0.04em",
                  }}
                >
                  New Admin User
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <label
                    htmlFor="new-admin-email"
                    style={{ fontSize: "12px", color: "#7A7D90" }}
                  >
                    Email Address
                  </label>
                  <input
                    id="new-admin-email"
                    type="email"
                    data-ocid="admin.profile.adminUsers.email.input"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="matrix-input"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#7A7D90" }}>
                      Tab Access Permissions
                    </span>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <button
                        type="button"
                        data-ocid="admin.profile.adminUsers.select_all.button"
                        onClick={handleSelectAll}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: "#5EF08A",
                          padding: 0,
                        }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        data-ocid="admin.profile.adminUsers.deselect_all.button"
                        onClick={handleDeselectAll}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: "#7A7D90",
                          padding: 0,
                        }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: "8px",
                    }}
                  >
                    {AVAILABLE_TABS.map((tab) => (
                      <label
                        key={tab}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          padding: "4px 0",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTabs.includes(tab)}
                          onChange={() => handleToggleTab(tab)}
                          style={{
                            accentColor: "#5EF08A",
                            width: "14px",
                            height: "14px",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: "12px", color: "#BFC3D4" }}>
                          {tab}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {addAdminError && (
                  <p
                    data-ocid="admin.profile.adminUsers.add.error_state"
                    style={{ margin: 0, fontSize: "12px", color: "#f87171" }}
                  >
                    {addAdminError}
                  </p>
                )}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    data-ocid="admin.profile.adminUsers.save_button"
                    onClick={handleAddSubAdmin}
                    disabled={addAdminLoading}
                    style={{
                      padding: "9px 20px",
                      background: "rgba(94,240,138,0.15)",
                      border: "1px solid rgba(94,240,138,0.4)",
                      color: "#5EF08A",
                      borderRadius: "8px",
                      cursor: addAdminLoading ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: 600,
                      opacity: addAdminLoading ? 0.6 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {addAdminLoading ? "Saving..." : "Save Admin"}
                  </button>
                  <button
                    type="button"
                    data-ocid="admin.profile.adminUsers.cancel_button"
                    onClick={() => {
                      setShowAddAdminForm(false);
                      setNewAdminEmail("");
                      setSelectedTabs([]);
                      setAddAdminError("");
                    }}
                    style={{
                      padding: "9px 20px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#7A7D90",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                      transition: "background 0.15s",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Sub-admins list */}
            {subAdminsLoading ? (
              <p
                data-ocid="admin.profile.adminUsers.loading_state"
                style={{ fontSize: "13px", color: "#7A7D90", margin: 0 }}
              >
                Loading...
              </p>
            ) : subAdmins.length === 0 ? (
              <p
                data-ocid="admin.profile.adminUsers.empty_state"
                style={{ fontSize: "13px", color: "#7A7D90", margin: 0 }}
              >
                No authorized admins yet.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {subAdmins.map(([email, admin], idx) => (
                  <div
                    key={email}
                    data-ocid={`admin.profile.adminUsers.item.${idx + 1}`}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#EEF0F8",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {email}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        {admin.allowedTabs.length === 0 ? (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#5EF08A",
                              fontWeight: 600,
                            }}
                          >
                            Full access (no restrictions)
                          </span>
                        ) : (
                          admin.allowedTabs.map((tab) => (
                            <span
                              key={tab}
                              style={{
                                padding: "2px 8px",
                                background: "rgba(94,240,138,0.08)",
                                border: "1px solid rgba(94,240,138,0.18)",
                                color: "#5EF08A",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 500,
                              }}
                            >
                              {tab}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-ocid={`admin.profile.adminUsers.delete_button.${idx + 1}`}
                      onClick={() => handleRemoveSubAdmin(email)}
                      disabled={removeAdminLoadingEmail === email}
                      style={{
                        flexShrink: 0,
                        padding: "6px 14px",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#f87171",
                        borderRadius: "8px",
                        cursor:
                          removeAdminLoadingEmail === email
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "12px",
                        opacity: removeAdminLoadingEmail === email ? 0.5 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {removeAdminLoadingEmail === email
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
