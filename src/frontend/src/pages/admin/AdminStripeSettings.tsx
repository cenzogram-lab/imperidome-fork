import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  Globe,
  Shield,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { backendInterface } from "../../backend.d";
import type { StripeConfiguration } from "../../backend.d.ts";
import {
  getStripeTestMode,
  setStripeTestMode,
} from "../../components/CheckoutDrawer";
import InstructionModal from "../../components/InstructionModal";
import type { InstructionStep } from "../../components/InstructionModal";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaveStatus {
  type: "idle" | "saving" | "success" | "error";
  message?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminStripeSettings() {
  const { actor, isFetching } = useActor();

  // Stripe config state
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [allowedCountries, setAllowedCountries] = useState("US");
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: "idle" });

  // Test mode state (localStorage-persisted, frontend-only)
  const [showStripeHelp, setShowStripeHelp] = useState(false);

  const STRIPE_STEPS: InstructionStep[] = [
    { text: "Go to dashboard.stripe.com and log in to your Stripe account." },
    { text: "Click Developers \u2192 API keys in the left sidebar." },
    {
      text: "Copy your Publishable key (starts with pk_) and Secret key (starts with sk_). Use Test keys while testing, Live keys for real payments.",
    },
    {
      text: "Paste both keys into the corresponding fields in this panel and set the mode to Test or Live.",
    },
    {
      text: 'To set up the webhook: in Stripe Dashboard \u2192 Developers \u2192 Webhooks \u2192 click "Add endpoint".',
    },
    {
      text: "Set the endpoint URL to your Imperidome site URL + /stripe-webhook (e.g. https://yourdomain.com/stripe-webhook).",
    },
    {
      text: 'Under "Select events", choose: payment_intent.succeeded, checkout.session.completed, and invoice.paid.',
    },
    {
      text: "Click Add endpoint, then copy the Webhook Signing Secret that appears.",
    },
    {
      text: "Paste the Webhook Signing Secret into the Webhook Secret field in this panel.",
    },
    {
      text: "Click Save. Stripe is now connected. Editing any service price in the admin panel takes effect immediately for all future checkouts.",
    },
  ];

  // Test mode state (localStorage-persisted, frontend-only)
  const [testModeEnabled, setTestModeEnabled] =
    useState<boolean>(getStripeTestMode);

  // Load current Stripe configuration status
  // MED-002: On mount, clear any sensitive Stripe keys from sessionStorage
  // (secret key and webhook secret must not persist across browser sessions)
  useEffect(() => {
    // Remove any keys that may have previously persisted sensitive Stripe data
    sessionStorage.removeItem("stripe_secret_key");
    sessionStorage.removeItem("stripe_webhook_secret");
    sessionStorage.removeItem("stripeSecretKey");
    sessionStorage.removeItem("stripeWebhookSecret");
    sessionStorage.removeItem("imperidome_stripe_secret");
    sessionStorage.removeItem("imperidome_stripe_webhook");
    // Also clear any legacy localStorage versions
    localStorage.removeItem("stripe_secret_key");
    localStorage.removeItem("stripe_webhook_secret");
    localStorage.removeItem("stripeSecretKey");
    localStorage.removeItem("stripeWebhookSecret");
    localStorage.removeItem("imperidome_stripe_secret");
    localStorage.removeItem("imperidome_stripe_webhook");
  }, []);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .isStripeConfigured()
      .then((configured) => setIsConfigured(configured))
      .catch(() => setIsConfigured(false));
    (actor as backendInterface)
      .getStripePublishableKey()
      .then((key: string) => {
        if (key) setPublishableKey(key);
      })
      .catch(() => {
        /* publishableKey stays empty */
      });
  }, [actor, isFetching]);

  function handleTestModeToggle(enabled: boolean) {
    setStripeTestMode(enabled);
    setTestModeEnabled(enabled);
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;

    // Require at least one field to save
    if (!secretKey.trim() && !publishableKey.trim()) {
      setSaveStatus({ type: "error", message: "Please enter a key to save." });
      return;
    }

    setSaveStatus({ type: "saving" });

    try {
      // Only update secret key + webhook if secret key is provided
      if (secretKey.trim()) {
        const config: StripeConfiguration = {
          secretKey: secretKey.trim(),
          allowedCountries: allowedCountries
            .split(",")
            .map((c) => c.trim().toUpperCase())
            .filter(Boolean),
        };
        await (actor as backendInterface).setStripeConfiguration(
          config,
          getAdminEmail(),
        );
        if (webhookSecret.trim()) {
          await (actor as backendInterface).setStripeWebhookSecret(
            webhookSecret.trim(),
            getAdminEmail(),
          );
        }
        setIsConfigured(true);
        setSecretKey("");
        setWebhookSecret("");
      }

      // Save publishable key independently if provided
      if (publishableKey.trim()) {
        await (actor as backendInterface).setStripePublishableKey(
          publishableKey.trim(),
          getAdminEmail(),
        );
      }

      setSaveStatus({
        type: "success",
        message: "Stripe configuration saved.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSaveStatus({ type: "error", message: `Failed to save: ${msg}` });
    }
  }

  return (
    <AdminLayout pageTitle="Stripe Settings">
      <div className="max-w-2xl space-y-8">
        {/* ── Status Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 p-5 rounded-xl border bg-white/3 border-white/10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isConfigured ? "bg-[#5EF08A]/15" : "bg-amber-500/15"
            }`}
          >
            <CreditCard
              size={20}
              className={isConfigured ? "text-[#5EF08A]" : "text-amber-400"}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Stripe Integration Status
            </p>
            {isConfigured === null ? (
              <p className="text-gray-500 text-xs mt-0.5">Checking…</p>
            ) : isConfigured ? (
              <p className="text-[#5EF08A] text-xs mt-0.5 font-medium">
                ✓ Secret key is configured and active
              </p>
            ) : (
              <p className="text-amber-400 text-xs mt-0.5 font-medium">
                ⚠ No secret key set — payments are disabled
              </p>
            )}
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isConfigured
                ? "bg-[#5EF08A]/15 text-[#5EF08A]"
                : "bg-amber-500/15 text-amber-400"
            }`}
          >
            {isConfigured ? "LIVE" : "NOT SET"}
          </div>
        </div>

        {/* ── Test Mode Toggle ───────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <FlaskConical size={16} className="text-amber-400 shrink-0" />
            <h2 className="text-white font-semibold text-sm">Test Mode</h2>
          </div>

          <div className="p-5">
            <div
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                testModeEnabled
                  ? "bg-amber-500/10 border-amber-500/40"
                  : "bg-white/3 border-white/10"
              }`}
            >
              <div className="flex-1 min-w-0 pr-4">
                <p
                  className={`font-semibold text-sm ${
                    testModeEnabled ? "text-amber-300" : "text-white"
                  }`}
                >
                  {testModeEnabled ? "⚠ TEST MODE ACTIVE" : "Live Mode"}
                </p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {testModeEnabled
                    ? "Checkout drawer will show a yellow banner. No real charges will be made when enabled."
                    : "Customers are charged real money on checkout. Disable test mode only when your keys are live."}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={testModeEnabled}
                onClick={() => handleTestModeToggle(!testModeEnabled)}
                data-ocid="admin.stripe.test-mode.toggle"
                className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-full"
              >
                <span
                  style={{
                    display: "inline-flex",
                    width: "44px",
                    height: "24px",
                    borderRadius: "999px",
                    background: testModeEnabled ? "#F59E0B" : "#374151",
                    position: "relative",
                    transition: "background 0.2s",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: testModeEnabled ? "23px" : "3px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: testModeEnabled ? "#1C1400" : "#6B7280",
                      transition: "left 0.2s, background 0.2s",
                    }}
                  />
                </span>
              </button>
            </div>

            {testModeEnabled && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
                <AlertTriangle
                  size={14}
                  className="text-amber-400 shrink-0 mt-0.5"
                />
                <p className="text-amber-300 text-xs leading-relaxed">
                  While test mode is ON, the checkout drawer will display a
                  prominent yellow warning banner so you can verify the flow
                  with a Stripe test card (e.g., 4242 4242 4242 4242) before
                  going live with real charges.
                </p>
              </div>
            )}

            {!testModeEnabled && isConfigured && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-[#5EF08A]/8 border border-[#5EF08A]/20">
                <CheckCircle2
                  size={14}
                  className="text-[#5EF08A] shrink-0 mt-0.5"
                />
                <p className="text-[#5EF08A]/80 text-xs leading-relaxed">
                  Live mode is active. Real charges will be processed on
                  checkout.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Publishable Key Configuration ──────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Globe size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              Live Publishable Key
            </h2>
          </div>
          <div className="p-5">
            <label
              htmlFor="stripe-publishable"
              className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
            >
              Live Publishable Key
            </label>
            <input
              id="stripe-publishable"
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="pk_live_…"
              autoComplete="off"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors font-mono placeholder:font-sans placeholder:text-gray-600"
              data-ocid="admin.stripe.publishable-key.input"
            />
            <p className="text-gray-500 text-xs mt-1.5">
              Stored in backend stable storage. Saved alongside your secret key.
            </p>
          </div>
        </div>

        {/* ── Secret Key Configuration ───────────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Shield size={16} className="text-[#5EF08A] shrink-0" />
            <h2 className="text-white font-semibold text-sm">
              Backend Configuration
            </h2>
            <button
              type="button"
              aria-label="Stripe setup instructions"
              onClick={() => setShowStripeHelp(true)}
              className="ml-auto flex items-center justify-center w-6 h-6 rounded-full border border-white/10 bg-transparent text-gray-400 text-xs font-bold cursor-pointer hover:text-[#5EF08A] transition-colors"
            >
              ?
            </button>
          </div>

          <form onSubmit={handleSaveConfig} className="p-5 space-y-5">
            <div>
              <label
                htmlFor="stripe-secret"
                className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
              >
                Stripe Secret Key
              </label>
              <input
                id="stripe-secret"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_… or sk_test_…"
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors font-mono placeholder:font-sans placeholder:text-gray-600"
                data-ocid="admin.stripe.secret-key.input"
              />
              <p className="text-gray-500 text-xs mt-1.5">
                Stored securely in the backend canister. Never logged or
                exposed.
              </p>
            </div>

            <div>
              <label
                htmlFor="stripe-webhook"
                className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
              >
                Webhook Secret
              </label>
              <input
                id="stripe-webhook"
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_…"
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors font-mono placeholder:font-sans placeholder:text-gray-600"
                data-ocid="admin.stripe.webhook-secret.input"
              />
              <p className="text-gray-500 text-xs mt-1.5">
                Used to verify incoming Stripe event signatures.
              </p>
            </div>

            <div>
              <label
                htmlFor="stripe-countries"
                className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
              >
                Allowed Countries
              </label>
              <input
                id="stripe-countries"
                type="text"
                value={allowedCountries}
                onChange={(e) => setAllowedCountries(e.target.value)}
                placeholder="US, CA, GB"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#5EF08A] transition-colors"
                data-ocid="admin.stripe.countries.input"
              />
              <p className="text-gray-500 text-xs mt-1.5">
                Comma-separated ISO country codes for billing address
                collection.
              </p>
            </div>

            {/* Save Status */}
            {saveStatus.type === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#5EF08A]/10 border border-[#5EF08A]/20">
                <CheckCircle2 size={14} className="text-[#5EF08A] shrink-0" />
                <p className="text-[#5EF08A] text-xs font-medium">
                  {saveStatus.message}
                </p>
              </div>
            )}
            {saveStatus.type === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">{saveStatus.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                saveStatus.type === "saving" ||
                (!secretKey.trim() && !publishableKey.trim())
              }
              data-ocid="admin.stripe.save.button"
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                saveStatus.type === "saving" ||
                (!secretKey.trim() && !publishableKey.trim())
                  ? "bg-white/10 text-gray-500 cursor-not-allowed"
                  : "bg-[#5EF08A] text-[#0A0B14] hover:bg-[#4ade80] hover:shadow-[0_0_16px_rgba(94,240,138,0.3)]"
              }`}
            >
              <Zap size={14} />
              {saveStatus.type === "saving"
                ? "Saving…"
                : "Save Stripe Configuration"}
            </button>
          </form>
        </div>

        {/* ── Quick Reference ────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            Payment Mode Reference
          </h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span>Speedy Basic, Booking, Storefronts</span>
              <span className="text-white font-medium">One-time payment</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span>Basic Plan, Booking Plan, Storefront Plan</span>
              <span className="text-blue-300 font-medium">
                Monthly subscription
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span>Custom Sites (all tiers)</span>
              <span className="text-[#5EF08A] font-medium">50% deposit</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>SaaS Plans, AI Receptionist</span>
              <span className="text-blue-300 font-medium">
                Monthly subscription
              </span>
            </div>
          </div>
        </div>
      </div>
      {showStripeHelp && (
        <InstructionModal
          isOpen={showStripeHelp}
          onClose={() => setShowStripeHelp(false)}
          title="How to Set Up Stripe"
          steps={STRIPE_STEPS}
        />
      )}
    </AdminLayout>
  );
}
