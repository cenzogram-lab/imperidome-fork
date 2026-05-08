import { Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession, useSession } from "../../hooks/useSession";
import { hashPassword } from "../../lib/hashPassword";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
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
          style={{
            width: "100%",
            padding: "10px 40px 10px 12px",
            border: "1px solid #1C1F33",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#EEF0F8",
            background: "rgba(17,19,34,0.7)",
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

export default function AdminProfilePage() {
  const { session } = useSession();
  const { actor, isFetching } = useActor();

  // ─── Password change ──────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Push notifications ──────────────────────────────────────────────────
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushToast, setPushToast] = useState<string | null>(null);
  const [pushWorking, setPushWorking] = useState(false);
  const pushToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPushToast = useCallback((msg: string) => {
    setPushToast(msg);
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

  async function handleTurnOff() {
    setPushWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      if (actor) {
        await actor.removePushSubscription(getAdminEmail());
      }
      localStorage.removeItem("push_permission_granted");
      setPushEnabled(false);
      showPushToast("Push notifications disabled.");
    } catch (err) {
      showPushToast(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setPushWorking(false);
    }
  }

  async function handleTurnOn() {
    if (!actor) return;
    setPushWorking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const key =
          vapidKey || (await actor.getVapidPublicKey().catch(() => ""));
        if (!key) {
          showPushToast(
            "VAPID key not configured — set it in Notification Settings.",
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
        await actor.savePushSubscription(
          getAdminEmail(),
          endpoint,
          p256dh,
          auth,
        );
        localStorage.setItem("push_permission_granted", "true");
        setPushEnabled(true);
        showPushToast("Push notifications enabled!");
      } else if (permission === "denied") {
        showPushToast(
          "Permission denied — please enable notifications in your browser settings.",
        );
      }
    } catch (err) {
      showPushToast(
        `Failed to enable: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setPushWorking(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
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
      await (actor as backendInterface).changePassword({
        email: getAdminEmail(),
        currentPasswordHash,
        newPasswordHash,
      });
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

  const cardStyle: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    borderRadius: "8px",
    padding: "28px",
    border: "1px solid #1C1F33",
    maxWidth: "520px",
    width: "100%",
  };

  return (
    <AdminLayout pageTitle="Profile">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Account info card */}
        <div style={cardStyle}>
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "17px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            Account
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
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
                Super Admin
              </span>
            </div>
          </div>
        </div>

        {/* Change password card */}
        <div data-ocid="admin.profile.password.card" style={cardStyle}>
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "17px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            Change Password
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

        {/* Push Notifications card */}
        <div
          data-ocid="admin.profile.push_notifications.card"
          style={cardStyle}
        >
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "17px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            Push Notifications
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
                color: "#5EF08A",
                fontWeight: 500,
              }}
            >
              {pushToast}
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
