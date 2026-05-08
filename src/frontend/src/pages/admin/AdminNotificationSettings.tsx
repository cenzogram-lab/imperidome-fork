import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Key,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { PushSubscription } from "../../backend.d";
import InstructionModal from "../../components/InstructionModal";
import type { InstructionStep } from "../../components/InstructionModal";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

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

  useEffect(() => {
    if (!actor || isFetching) return;
    const adminEmail = getAdminEmail();

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
      .getPushSubscription(adminEmail)
      .then((result) => {
        if ("ok" in result) {
          setSubscription(result.ok ?? null);
        }
      })
      .catch(() => setSubscription(null))
      .finally(() => setSubLoading(false));
  }, [actor, isFetching]);

  async function handleCopyKey() {
    if (!currentPublicKey) return;
    await navigator.clipboard.writeText(currentPublicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveVapidKeys(e: React.FormEvent) {
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
        getAdminEmail(),
        newPrivateKey.trim(),
        newPublicKey.trim(),
      );
      if ("ok" in result) {
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
    } catch (err) {
      setSaveStatus({
        type: "error",
        message: `Failed to update VAPID keys: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  }

  return (
    <AdminLayout pageTitle="Notification Settings">
      <div className="max-w-2xl space-y-8">
        {/* ── Page header ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 p-5 rounded-xl border bg-white/3 border-white/10">
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
        <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Key size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              Current VAPID Public Key
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
        <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Key size={16} className="text-amber-400 shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              Update VAPID Keys
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
                className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors font-mono placeholder:font-sans placeholder:text-gray-600"
              />
              <p className="text-gray-500 text-xs mt-1.5">
                The URL-safe base64 encoded public key from your VAPID key pair.
              </p>
            </div>

            <div>
              <label
                htmlFor="vapid-private"
                className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors font-mono placeholder:font-sans placeholder:text-gray-600"
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
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                saveStatus.type === "saving" ||
                !newPublicKey.trim() ||
                !newPrivateKey.trim()
                  ? "bg-white/10 text-gray-500 cursor-not-allowed"
                  : "bg-[#d4a017] text-[#0A0B14] hover:bg-amber-400 hover:shadow-[0_0_16px_rgba(212,160,23,0.3)]"
              }`}
            >
              <Zap size={14} />
              {saveStatus.type === "saving" ? "Saving…" : "Save VAPID Keys"}
            </button>
          </form>
        </div>

        {/* ── Subscription Status ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Bell size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              Subscription Status
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
                  <p className="text-[#5EF08A] text-xs font-medium">
                    Active push subscription found
                  </p>
                </div>
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
