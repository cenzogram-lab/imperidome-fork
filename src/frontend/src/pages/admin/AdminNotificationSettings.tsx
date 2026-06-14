import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Key,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { PushSubscription } from "../../backend.d";
import InstructionModal from "../../components/InstructionModal";
import type { InstructionStep } from "../../components/InstructionModal";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

interface SaveStatus {
  type: "idle" | "saving" | "success" | "error";
  message?: string;
}

export default function AdminNotificationSettings() {
  const { actor, isFetching } = useActor();

  // Current public key from backend
  const [currentPublicKey, setCurrentPublicKey] = useState<string>("");
  const [keyLoading, setKeyLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // VAPID key update form
  const [newPublicKey, setNewPublicKey] = useState("");
  const [newPrivateKey, setNewPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: "idle" });
  const [showPushHelp, setShowPushHelp] = useState(false);

  const PUSH_STEPS: InstructionStep[] = [
    {
      text: 'Click "Generate VAPID Keys" to create a new key pair. This generates the cryptographic keys required to send push notifications to browsers.',
    },
    {
      text: "The Public VAPID Key is shown in the panel. Copy it if you need it for a custom service worker configuration.",
    },
    {
      text: 'Click "Save Keys" to store both keys in the backend. They will persist across all future upgrades.',
    },
    {
      text: 'Open the admin panel in Chrome or Edge. When prompted, click "Allow" to grant notification permission.',
    },
    {
      text: "Push notifications will now be delivered in real time for new leads, new client messages, new orders, and other activity.",
    },
    {
      text: "You can view all sent notifications and clear the log in the Notification Log tab in the sidebar.",
    },
  ];

  // Current push subscription status
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [subLoading, setSubLoading] = useState(true);
  const [removingSubscription, setRemovingSubscription] = useState(false);
  const [removeSubError, setRemoveSubError] = useState<string | null>(null);
  const [subscriptionLoadError, setSubscriptionLoadError] = useState(false);

  // Reminder lead days setting
  const [reminderLeadDays, setReminderLeadDays] = useState<number>(5);
  const [reminderLeadDaysInput, setReminderLeadDaysInput] =
    useState<string>("5");
  const [reminderLeadDaysSaving, setReminderLeadDaysSaving] = useState(false);
  const [reminderLeadDaysSaveMsg, setReminderLeadDaysSaveMsg] = useState<
    string | null
  >(null);

  // Send reminders state (BUG-013)
  const [sendingReminders, setSendingReminders] = useState(false);
  const [remindersSentMsg, setRemindersSentMsg] = useState<string | null>(null);
  const [remindersSentSuccess, setRemindersSentSuccess] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;

    // Fetch VAPID public key
    setKeyLoading(true);
    actor
      .getVapidPublicKey()
      .then((k) => setCurrentPublicKey(k))
      .catch(() => setCurrentPublicKey(""))
      .finally(() => setKeyLoading(false));

    // Fetch subscription status
    setSubLoading(true);
    actor
      .getPushSubscription()
      .then((result) => {
        if ("ok" in result) {
          setSubscription(result.ok ?? null);
          setSubscriptionLoadError(false);
        }
      })
      .catch(() => {
        setSubscription(null);
        setSubscriptionLoadError(true);
      })
      .finally(() => setSubLoading(false));

    // Fetch reminder lead days
    try {
      actor
        .getReminderLeadDays()
        .then((days) => {
          const daysNum = Number(days);
          setReminderLeadDays(daysNum);
          setReminderLeadDaysInput(String(daysNum));
        })
        .catch(() => {
          /* leave default */
        });
    } catch {
      // leave default
    }
  }, [actor, isFetching]);

  async function handleCopyKey() {
    if (!currentPublicKey) return;
    await navigator.clipboard.writeText(currentPublicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveVapidKeys(e: FormEvent) {
    e.preventDefault();
    if (!actor) return;
    if (!newPublicKey.trim() || !newPrivateKey.trim()) {
      setSaveStatus({
        type: "error",
        message: "Both public and private keys are required.",
      });
      return;
    }
    setSaveStatus({ type: "saving" });
    try {
      const result = await actor.setVapidKeys(
        newPrivateKey.trim(),
        newPublicKey.trim(),
      );
      if ("ok" in result || "okAlreadyAdvanced" in result) {
        setSaveStatus({
          type: "success",
          message: "VAPID keys updated successfully.",
        });
        setCurrentPublicKey(newPublicKey.trim());
        setNewPublicKey("");
        setNewPrivateKey("");
      } else {
        setSaveStatus({
          type: "error",
          message:
            "err" in result ? String(result.err) : "Failed to update keys.",
        });
      }
      setTimeout(() => setSaveStatus({ type: "idle" }), 4000);
    } catch (err) {
      setSaveStatus({
        type: "error",
        message: `Failed to update VAPID keys: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      setTimeout(() => setSaveStatus({ type: "idle" }), 4000);
    }
  }

  async function handleSaveReminderLeadDays() {
    if (!actor) return;
    const days = Number.parseInt(reminderLeadDaysInput, 10);
    if (Number.isNaN(days) || days < 1 || days > 30) {
      setReminderLeadDaysSaveMsg("Please enter a number between 1 and 30.");
      return;
    }
    setReminderLeadDaysSaving(true);
    setReminderLeadDaysSaveMsg(null);
    try {
      const result = await actor.setReminderLeadDays(BigInt(days));
      if ("ok" in result) {
        setReminderLeadDays(days);
        setReminderLeadDaysSaveMsg("Saved.");
      } else if ("err" in result) {
        setReminderLeadDaysSaveMsg(result.err);
      }
    } catch {
      setReminderLeadDaysSaveMsg("Failed to save.");
    } finally {
      setReminderLeadDaysSaving(false);
    }
  }

  async function handleSendReminders() {
    if (!actor) return;
    setSendingReminders(true);
    setRemindersSentMsg(null);
    setRemindersSentSuccess(false);
    try {
      const result = await actor.sendUpcomingBillingReminders();
      if ("ok" in result) {
        setRemindersSentSuccess(true);
        setRemindersSentMsg("Reminders sent successfully.");
      } else if ("err" in result) {
        setRemindersSentSuccess(false);
        setRemindersSentMsg((result as { err: string }).err);
      }
    } catch (e) {
      setRemindersSentSuccess(false);
      setRemindersSentMsg(
        e instanceof Error ? e.message : "Failed to send reminders.",
      );
    } finally {
      setSendingReminders(false);
    }
  }

  async function handleRemoveSubscription() {
    if (!actor) return;
    setRemovingSubscription(true);
    setRemoveSubError(null);
    try {
      const result = await actor.removePushSubscription();
      if ("ok" in result || "okAlreadyAdvanced" in result) {
        setSubscription(null);
      } else {
        setRemoveSubError(
          "err" in result
            ? String(result.err)
            : "Failed to remove subscription.",
        );
      }
    } catch (err) {
      setRemoveSubError(
        err instanceof Error ? err.message : "Failed to remove subscription.",
      );
    } finally {
      setRemovingSubscription(false);
    }
  }

  return (
    <AdminLayout pageTitle="Notification Settings">
      <div className="max-w-2xl space-y-8">
        {/* ── Page header ────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(10,11,20,0.85)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "12px",
          }}
          className="flex items-center gap-4 p-5"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-500/15">
            <Bell size={20} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Push Notification Settings
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              Configure VAPID keys for push notifications to your admin PWA.
            </p>
          </div>
        </div>

        {/* ── Current VAPID Public Key ────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(10,11,20,0.85)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "12px",
          }}
          className="overflow-hidden"
        >
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Key size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              <TypewriterText
                className="matrix-heading"
                text="Current VAPID Public Key"
              />
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {keyLoading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : currentPublicKey ? (
              <>
                <div
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/3 border border-white/8"
                  data-ocid="admin.notifications.public_key.display"
                >
                  <span className="flex-1 font-mono text-xs text-white/70 break-all">
                    {currentPublicKey}
                  </span>
                  <button
                    type="button"
                    data-ocid="admin.notifications.copy_key.button"
                    onClick={handleCopyKey}
                    aria-label="Copy public key"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 text-xs font-medium hover:bg-white/5 transition-colors"
                  >
                    <Copy size={12} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-gray-500 text-xs">
                  This key is used by the browser to generate push
                  subscriptions. It must match your private key.
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <p className="text-amber-300 text-xs">
                  No VAPID public key configured. Enter your keys below.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Update VAPID Keys ────────────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(10,11,20,0.85)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "12px",
          }}
          className="overflow-hidden"
        >
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Key size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              <TypewriterText
                className="matrix-heading"
                text="Update VAPID Keys"
              />
            </h2>
            <button
              type="button"
              aria-label="Push notification setup instructions"
              onClick={() => setShowPushHelp(true)}
              className="ml-auto flex items-center justify-center w-6 h-6 rounded-full border border-white/10 bg-transparent text-gray-400 text-xs font-bold cursor-pointer hover:text-amber-400 transition-colors"
            >
              ?
            </button>
          </div>
          <form onSubmit={handleSaveVapidKeys} className="p-5 space-y-5">
            <div>
              <label
                htmlFor="vapid-public"
                style={{
                  color: "#5EF08A",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                VAPID Public Key
              </label>
              <input
                id="vapid-public"
                type="text"
                value={newPublicKey}
                onChange={(e) => setNewPublicKey(e.target.value)}
                placeholder="Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                autoComplete="off"
                data-ocid="admin.notifications.public_key.input"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(94,240,138,0.3)",
                  color: "#EEF0F8",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  width: "100%",
                  fontFamily: "'Courier New', monospace",
                  outline: "none",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
              <p className="text-gray-500 text-xs mt-1.5">
                The URL-safe base64 encoded public key from your VAPID key pair.
              </p>
            </div>

            <div>
              <label
                htmlFor="vapid-private"
                style={{
                  color: "#5EF08A",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                VAPID Private Key
              </label>
              <div className="relative">
                <input
                  id="vapid-private"
                  type={showPrivateKey ? "text" : "password"}
                  value={newPrivateKey}
                  onChange={(e) => setNewPrivateKey(e.target.value)}
                  placeholder="Your VAPID private key"
                  autoComplete="off"
                  data-ocid="admin.notifications.private_key.input"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(94,240,138,0.3)",
                    color: "#EEF0F8",
                    borderRadius: "8px",
                    padding: "10px 48px 10px 14px",
                    width: "100%",
                    fontFamily: "'Courier New', monospace",
                    outline: "none",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  aria-label={
                    showPrivateKey ? "Hide private key" : "Show private key"
                  }
                  onClick={() => setShowPrivateKey((v) => !v)}
                  data-ocid="admin.notifications.private_key.toggle"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1.5">
                Stored securely in the backend canister. Never logged or
                exposed.
              </p>
            </div>

            {/* Save status */}
            {saveStatus.type === "success" && (
              <div
                data-ocid="admin.notifications.save.success_state"
                className="flex items-center gap-2 p-3 rounded-lg bg-[#5EF08A]/10 border border-[#5EF08A]/20"
              >
                <CheckCircle2 size={14} className="text-[#5EF08A] shrink-0" />
                <p className="text-[#5EF08A] text-xs font-medium">
                  {saveStatus.message}
                </p>
              </div>
            )}
            {saveStatus.type === "error" && (
              <div
                data-ocid="admin.notifications.save.error_state"
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">{saveStatus.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                saveStatus.type === "saving" ||
                !newPublicKey.trim() ||
                !newPrivateKey.trim()
              }
              data-ocid="admin.notifications.save.button"
              style={{
                background:
                  saveStatus.type === "saving" ||
                  !newPublicKey.trim() ||
                  !newPrivateKey.trim()
                    ? "rgba(94,240,138,0.15)"
                    : "#5EF08A",
                color:
                  saveStatus.type === "saving" ||
                  !newPublicKey.trim() ||
                  !newPrivateKey.trim()
                    ? "#3A3D50"
                    : "#0A0B14",
                fontWeight: 700,
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                cursor:
                  saveStatus.type === "saving" ||
                  !newPublicKey.trim() ||
                  !newPrivateKey.trim()
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Zap size={14} />
              {saveStatus.type === "saving" ? "Saving…" : "Save VAPID Keys"}
            </button>
          </form>
        </div>

        {/* ── Billing Reminder Lead Days ────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(10,11,20,0.85)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "12px",
          }}
          className="overflow-hidden"
        >
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Bell size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              <TypewriterText
                className="matrix-heading"
                text="Billing Reminder Schedule"
              />
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-gray-400 text-xs">
              Set how many days before a client's next billing date the
              automated reminder email is sent.
            </p>
            <div>
              <label
                htmlFor="reminder-lead-days"
                style={{
                  color: "#5EF08A",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Days before billing to send reminder
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="reminder-lead-days"
                  type="number"
                  min={1}
                  max={30}
                  value={reminderLeadDaysInput}
                  onChange={(e) => setReminderLeadDaysInput(e.target.value)}
                  data-ocid="admin.notifications.reminder_lead_days.input"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(94,240,138,0.3)",
                    color: "#EEF0F8",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    width: "96px",
                    fontFamily: "'Courier New', monospace",
                    outline: "none",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  disabled={reminderLeadDaysSaving}
                  onClick={handleSaveReminderLeadDays}
                  data-ocid="admin.notifications.reminder_lead_days.save_button"
                  style={{
                    background: reminderLeadDaysSaving
                      ? "rgba(94,240,138,0.15)"
                      : "#5EF08A",
                    color: reminderLeadDaysSaving ? "#3A3D50" : "#0A0B14",
                    fontWeight: 700,
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    cursor: reminderLeadDaysSaving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Zap size={14} />
                  {reminderLeadDaysSaving ? "Saving…" : "Save"}
                </button>
              </div>
              {reminderLeadDaysSaveMsg && (
                <p
                  data-ocid={
                    reminderLeadDaysSaveMsg === "Saved."
                      ? "admin.notifications.reminder_lead_days.success_state"
                      : "admin.notifications.reminder_lead_days.error_state"
                  }
                  style={{
                    marginTop: "8px",
                    fontSize: "0.75rem",
                    color:
                      reminderLeadDaysSaveMsg === "Saved."
                        ? "#5EF08A"
                        : "#f87171",
                  }}
                >
                  {reminderLeadDaysSaveMsg}
                </p>
              )}
            </div>
            <p className="text-gray-500 text-xs">
              Current setting:{" "}
              <span className="text-white font-semibold">
                {reminderLeadDays} day{reminderLeadDays !== 1 ? "s" : ""}
              </span>
              . Valid range is 1–30 days.
            </p>

            {/* ── Send Reminders Now ──────────────────────────────────── */}
            <div className="pt-4 border-t border-white/8 space-y-3">
              <div>
                <p
                  style={{
                    color: "#5EF08A",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "8px",
                  }}
                >
                  Manual Trigger
                </p>
                <p className="text-gray-400 text-xs mb-3">
                  Send billing reminder emails immediately to all clients whose
                  next billing date falls within the lead window above.
                </p>
                <button
                  type="button"
                  disabled={sendingReminders}
                  onClick={handleSendReminders}
                  data-ocid="admin.notifications.send_reminders.button"
                  style={{
                    background: sendingReminders
                      ? "rgba(94,240,138,0.15)"
                      : "#5EF08A",
                    color: sendingReminders ? "#3A3D50" : "#0A0B14",
                    fontWeight: 700,
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    cursor: sendingReminders ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Zap size={14} />
                  {sendingReminders ? "Sending…" : "Send Reminders Now"}
                </button>
              </div>
              {remindersSentMsg && (
                <div
                  data-ocid={
                    remindersSentSuccess
                      ? "admin.notifications.send_reminders.success_state"
                      : "admin.notifications.send_reminders.error_state"
                  }
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    remindersSentSuccess
                      ? "bg-[#5EF08A]/10 border border-[#5EF08A]/20"
                      : "bg-red-500/10 border border-red-500/20"
                  }`}
                >
                  {remindersSentSuccess ? (
                    <CheckCircle2
                      size={14}
                      className="text-[#5EF08A] shrink-0"
                    />
                  ) : (
                    <AlertTriangle
                      size={14}
                      className="text-red-400 shrink-0"
                    />
                  )}
                  <p
                    className={`text-xs font-medium ${
                      remindersSentSuccess ? "text-[#5EF08A]" : "text-red-400"
                    }`}
                  >
                    {remindersSentMsg}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Subscription Status ─────────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(10,11,20,0.85)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "12px",
          }}
          className="overflow-hidden"
        >
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Bell size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              <TypewriterText
                className="matrix-heading"
                text="Subscription Status"
              />
            </h2>
          </div>
          <div className="p-5">
            {subLoading ? (
              <p className="text-gray-500 text-sm">Checking subscription…</p>
            ) : subscription ? (
              <div
                data-ocid="admin.notifications.subscription.panel"
                className="space-y-3"
              >
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#5EF08A]/8 border border-[#5EF08A]/20">
                  <CheckCircle2 size={14} className="text-[#5EF08A] shrink-0" />
                  <p className="text-[#5EF08A] text-xs font-medium flex-1">
                    Active push subscription found
                  </p>
                  <button
                    type="button"
                    data-ocid="admin.notifications.subscription.delete_button"
                    onClick={handleRemoveSubscription}
                    disabled={removingSubscription}
                    aria-label="Remove push subscription"
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/8 text-red-400 text-xs font-semibold hover:bg-red-500/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={11} />
                    {removingSubscription ? "Removing…" : "Remove"}
                  </button>
                </div>
                {removeSubError && (
                  <div
                    data-ocid="admin.notifications.subscription.error_state"
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                    <AlertTriangle
                      size={14}
                      className="text-red-400 shrink-0"
                    />
                    <p className="text-red-400 text-xs">{removeSubError}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-white/3 border border-white/8">
                  <p className="text-gray-500 text-xs mb-1 font-bold uppercase tracking-wider">
                    Endpoint
                  </p>
                  <p className="text-white/60 text-xs font-mono break-all">
                    {subscription.endpoint.slice(0, 80)}
                    {subscription.endpoint.length > 80 ? "…" : ""}
                  </p>
                </div>
              </div>
            ) : subscriptionLoadError ? (
              <div
                data-ocid="admin.notifications.subscription.error_state"
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">
                  Failed to load subscription status
                </p>
              </div>
            ) : (
              <div
                data-ocid="admin.notifications.subscription.empty_state"
                className="flex items-center gap-2 p-3 rounded-lg bg-white/3 border border-white/8"
              >
                <Bell size={14} className="text-gray-500 shrink-0" />
                <p className="text-gray-500 text-xs">
                  No subscription stored. Enable push notifications from the
                  dashboard or your profile page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPushHelp && (
        <InstructionModal
          isOpen={showPushHelp}
          onClose={() => setShowPushHelp(false)}
          title="How to Set Up Push Notifications"
          steps={PUSH_STEPS}
        />
      )}
    </AdminLayout>
  );
}
