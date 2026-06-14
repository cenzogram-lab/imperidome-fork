import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  FlaskConical,
  Globe,
  Shield,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  Product,
  StripeConfiguration,
  backendInterface,
} from "../../backend.d";
import {
  getStripeTestMode,
  setStripeTestMode,
} from "../../components/CheckoutDrawer";
import InstructionModal from "../../components/InstructionModal";
import type { InstructionStep } from "../../components/InstructionModal";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const [loadedSecretKey, setLoadedSecretKey] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [allowedCountries, setAllowedCountries] = useState("US");
  const [originalAllowedCountries, setOriginalAllowedCountries] =
    useState("US");
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: "idle" });

  // Webhook shared secret state
  const [webhookSharedSecret, setWebhookSharedSecret] = useState<string>("");
  const [webhookSharedSecretVisible, setWebhookSharedSecretVisible] =
    useState<boolean>(false);
  const [webhookSharedSecretStatus, setWebhookSharedSecretStatus] =
    useState<SaveStatus>({ type: "idle" });

  // Test mode state (localStorage-persisted, frontend-only)
  const [showStripeHelp, setShowStripeHelp] = useState(false);

  // Catalog products for dynamic tier label display
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  useEffect(() => {
    if (isFetching || !actor) return;
    actor
      .getProducts()
      .then((prods) => {
        setCatalogProducts(prods);
      })
      .catch(() => {});
  }, [isFetching, actor]);

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
    // Load allowedCountries from backend
    actor
      .getStripeConfiguration()
      .then((stripeConfig: StripeConfiguration | null) => {
        if (
          stripeConfig?.allowedCountries &&
          stripeConfig.allowedCountries.length > 0
        ) {
          const loaded = stripeConfig.allowedCountries.join(", ");
          setAllowedCountries(loaded);
          setOriginalAllowedCountries(loaded);
        }
        if (stripeConfig?.secretKey) {
          setLoadedSecretKey(stripeConfig.secretKey);
        }
      })
      .catch(() => {
        setLoadError(
          "Failed to load Stripe settings — your existing configuration has not been changed.",
        );
      });
  }, [actor, isFetching]);

  function handleTestModeToggle(enabled: boolean) {
    setStripeTestMode(enabled);
    setTestModeEnabled(enabled);
    // Also persist to backend so test/live mode is consistent across browsers/devices
    if (actor) {
      (actor as backendInterface).setStripeTestMode(enabled).catch(() => {
        /* non-critical — localStorage already updated */
      });
    }
  }

  async function handleSaveWebhookSharedSecret() {
    if (!webhookSharedSecret.trim()) return;
    if (!actor) return;
    setWebhookSharedSecretStatus({ type: "saving" });
    try {
      const result = await (actor as backendInterface).setWebhookSharedSecret(
        webhookSharedSecret.trim(),
      );
      if ("err" in result) {
        setWebhookSharedSecretStatus({ type: "error", message: result.err });
      } else {
        setWebhookSharedSecretStatus({
          type: "success",
          message: "Webhook shared secret saved.",
        });
        setTimeout(() => setWebhookSharedSecretStatus({ type: "idle" }), 4000);
      }
    } catch (e) {
      setWebhookSharedSecretStatus({
        type: "error",
        message:
          e instanceof Error
            ? e.message
            : "Failed to save webhook shared secret.",
      });
    }
  }

  async function handleSaveConfig(e: import("react").FormEvent) {
    e.preventDefault();
    if (!actor) return;

    // Determine which secret key to use: newly entered or previously loaded
    const effectiveSecretKey = secretKey.trim() || loadedSecretKey;

    // Require a secret key (either new or previously loaded) to save configuration
    if (!effectiveSecretKey && !publishableKey.trim()) {
      setSaveStatus({
        type: "error",
        message: "Please enter your Stripe secret key to save configuration.",
      });
      return;
    }

    setSaveStatus({ type: "saving" });

    try {
      // Save configuration — allowedCountries is always persisted regardless of whether
      // the secret key is being re-entered. Only gate secretKey-specific operations.
      const parsedCountries = allowedCountries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      if (effectiveSecretKey) {
        const config: StripeConfiguration = {
          secretKey: effectiveSecretKey,
          allowedCountries: parsedCountries,
        };
        await (actor as backendInterface).setStripeConfiguration(config);
        if (webhookSecret.trim()) {
          await (actor as backendInterface).setStripeWebhookSecret(
            webhookSecret.trim(),
          );
        }
        setIsConfigured(true);
        setSecretKey("");
        setWebhookSecret("");
        // Update loadedSecretKey since we just saved
        setLoadedSecretKey(effectiveSecretKey);
      } else {
        // No secret key change — still save allowedCountries via a configuration
        // update using the previously loaded key so the country list is always persisted.
        if (loadedSecretKey) {
          const config: StripeConfiguration = {
            secretKey: loadedSecretKey,
            allowedCountries: parsedCountries,
          };
          await (actor as backendInterface).setStripeConfiguration(config);
        }
      }

      // Save publishable key independently if provided
      if (publishableKey.trim()) {
        await (actor as backendInterface).setStripePublishableKey(
          publishableKey.trim(),
        );
      }

      setSaveStatus({
        type: "success",
        message: "Stripe configuration saved.",
      });
      setTimeout(() => setSaveStatus({ type: "idle" }), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSaveStatus({ type: "error", message: `Failed to save: ${msg}` });
      setTimeout(() => setSaveStatus({ type: "idle" }), 4000);
    }
  }

  return (
    <AdminLayout pageTitle="Stripe Settings">
      <style>{`
        .stripe-matrix-input {
          background: rgba(5,8,16,0.95) !important;
          border: 1px solid rgba(94,240,138,0.25) !important;
          color: #5EF08A !important;
          font-family: 'JetBrains Mono', monospace !important;
        }
        .stripe-matrix-input:focus {
          border-color: rgba(94,240,138,0.6) !important;
          box-shadow: 0 0 0 2px rgba(94,240,138,0.12) !important;
        }
        .stripe-matrix-input::placeholder { color: rgba(94,240,138,0.25) !important; font-family: sans-serif !important; }
      `}</style>
      {loadError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            marginBottom: 16,
          }}
        >
          <AlertTriangle
            size={14}
            style={{ color: "#f87171", flexShrink: 0 }}
          />
          <p
            style={{
              color: "#f87171",
              fontSize: 12,
              fontFamily: "monospace",
              margin: 0,
            }}
          >
            {loadError}
          </p>
        </div>
      )}
      <div className="max-w-2xl space-y-8">
        {/* ── Status Header ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 20px",
            borderRadius: 10,
            border: "1px solid rgba(94,240,138,0.2)",
            background: "rgba(5,8,16,0.9)",
            boxShadow: "0 0 18px rgba(94,240,138,0.05)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: isConfigured
                ? "rgba(94,240,138,0.12)"
                : "rgba(251,191,36,0.12)",
              border: `1px solid ${isConfigured ? "rgba(94,240,138,0.3)" : "rgba(251,191,36,0.3)"}`,
            }}
          >
            <CreditCard
              size={20}
              style={{ color: isConfigured ? "#5EF08A" : "#fbbf24" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TypewriterText
              text="STRIPE INTEGRATION STATUS"
              as="p"
              speed={40}
              style={{
                color: "#5EF08A",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                margin: 0,
                letterSpacing: "0.06em",
              }}
            />
            {isConfigured === null ? (
              <p
                style={{
                  color: "rgba(94,240,138,0.4)",
                  fontSize: 11,
                  marginTop: 2,
                  fontFamily: "monospace",
                }}
              >
                CHECKING...
              </p>
            ) : isConfigured ? (
              <p
                style={{
                  color: "#5EF08A",
                  fontSize: 11,
                  marginTop: 2,
                  fontFamily: "monospace",
                }}
              >
                ✓ Secret key is configured and active
              </p>
            ) : (
              <p
                style={{
                  color: "#fbbf24",
                  fontSize: 11,
                  marginTop: 2,
                  fontFamily: "monospace",
                }}
              >
                ⚠ No secret key set — payments are disabled
              </p>
            )}
          </div>
          <div
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.08em",
              background: isConfigured
                ? "rgba(94,240,138,0.12)"
                : "rgba(251,191,36,0.12)",
              color: isConfigured ? "#5EF08A" : "#fbbf24",
              border: `1px solid ${isConfigured ? "rgba(94,240,138,0.3)" : "rgba(251,191,36,0.3)"}`,
            }}
          >
            {isConfigured ? "LIVE" : "NOT SET"}
          </div>
        </div>

        {/* ── Test Mode Toggle ───────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(94,240,138,0.18)",
            background: "rgba(5,8,16,0.85)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(94,240,138,0.12)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FlaskConical
              size={16}
              style={{ color: "#fbbf24", flexShrink: 0 }}
            />
            <TypewriterText
              text="TEST MODE"
              as="h2"
              speed={50}
              style={{
                color: "#5EF08A",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                margin: 0,
              }}
            />
          </div>

          <div style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderRadius: 10,
                border: `1px solid ${testModeEnabled ? "rgba(251,191,36,0.4)" : "rgba(94,240,138,0.2)"}`,
                background: testModeEnabled
                  ? "rgba(251,191,36,0.08)"
                  : "rgba(94,240,138,0.04)",
                transition: "all 0.2s",
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.06em",
                    color: testModeEnabled ? "#fbbf24" : "#5EF08A",
                    margin: 0,
                  }}
                >
                  {testModeEnabled ? "⚠ TEST MODE ACTIVE" : "LIVE MODE"}
                </p>
                <p
                  style={{
                    color: "rgba(94,240,138,0.5)",
                    fontSize: 11,
                    marginTop: 4,
                    lineHeight: 1.5,
                    fontFamily: "monospace",
                  }}
                >
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
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(251,191,36,0.06)",
                  border: "1px solid rgba(251,191,36,0.2)",
                }}
              >
                <AlertTriangle
                  size={14}
                  style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }}
                />
                <p
                  style={{
                    color: "rgba(251,191,36,0.8)",
                    fontSize: 11,
                    lineHeight: 1.5,
                    fontFamily: "monospace",
                    margin: 0,
                  }}
                >
                  While test mode is ON, the checkout drawer will display a
                  prominent yellow warning banner so you can verify the flow
                  with a Stripe test card (e.g., 4242 4242 4242 4242) before
                  going live with real charges.
                </p>
              </div>
            )}

            {!testModeEnabled && isConfigured && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(94,240,138,0.06)",
                  border: "1px solid rgba(94,240,138,0.2)",
                }}
              >
                <CheckCircle2
                  size={14}
                  style={{ color: "#5EF08A", flexShrink: 0, marginTop: 1 }}
                />
                <p
                  style={{
                    color: "rgba(94,240,138,0.7)",
                    fontSize: 11,
                    lineHeight: 1.5,
                    fontFamily: "monospace",
                    margin: 0,
                  }}
                >
                  Live mode is active. Real charges will be processed on
                  checkout.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Publishable Key Configuration ──────────────────────────────────── */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(94,240,138,0.18)",
            background: "rgba(5,8,16,0.85)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(94,240,138,0.12)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Globe size={16} style={{ color: "#5EF08A", flexShrink: 0 }} />
            <TypewriterText
              text="LIVE PUBLISHABLE KEY"
              as="h2"
              speed={45}
              style={{
                color: "#5EF08A",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                margin: 0,
              }}
            />
          </div>
          <div style={{ padding: 20 }}>
            <label
              htmlFor="stripe-publishable"
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(94,240,138,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
                fontFamily: "'JetBrains Mono', monospace",
              }}
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
              className="stripe-matrix-input"
              style={{
                width: "100%",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box" as const,
              }}
              data-ocid="admin.stripe.publishable-key.input"
            />
            <p
              style={{
                color: "rgba(94,240,138,0.3)",
                fontSize: 11,
                marginTop: 6,
                fontFamily: "monospace",
              }}
            >
              Stored in backend stable storage. Saved alongside your secret key.
            </p>
          </div>
        </div>

        {/* ── Secret Key Configuration ───────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(94,240,138,0.18)",
            background: "rgba(5,8,16,0.85)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(94,240,138,0.12)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Shield size={16} style={{ color: "#5EF08A", flexShrink: 0 }} />
            <TypewriterText
              text="BACKEND CONFIGURATION"
              as="h2"
              speed={45}
              style={{
                color: "#5EF08A",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                margin: 0,
              }}
            />
            <button
              type="button"
              aria-label="Stripe setup instructions"
              onClick={() => setShowStripeHelp(true)}
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "1px solid rgba(94,240,138,0.25)",
                background: "transparent",
                color: "rgba(94,240,138,0.5)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "color 0.15s",
              }}
            >
              ?
            </button>
          </div>

          <form
            onSubmit={handleSaveConfig}
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <label
                htmlFor="stripe-secret"
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(94,240,138,0.6)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
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
                className="stripe-matrix-input"
                style={{
                  width: "100%",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box" as const,
                }}
                data-ocid="admin.stripe.secret-key.input"
              />
              <p
                style={{
                  color: "rgba(94,240,138,0.3)",
                  fontSize: 11,
                  marginTop: 6,
                  fontFamily: "monospace",
                }}
              >
                Stored securely in the backend canister. Never logged or
                exposed.
              </p>
            </div>

            <div>
              <label
                htmlFor="stripe-webhook"
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(94,240,138,0.6)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
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
                className="stripe-matrix-input"
                style={{
                  width: "100%",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box" as const,
                }}
                data-ocid="admin.stripe.webhook-secret.input"
              />
              <p
                style={{
                  color: "rgba(94,240,138,0.3)",
                  fontSize: 11,
                  marginTop: 6,
                  fontFamily: "monospace",
                }}
              >
                Used to verify incoming Stripe event signatures.
              </p>
            </div>

            <div>
              <label
                htmlFor="stripe-countries"
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(94,240,138,0.6)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Allowed Countries
              </label>
              <input
                id="stripe-countries"
                type="text"
                value={allowedCountries}
                onChange={(e) => setAllowedCountries(e.target.value)}
                placeholder="US, CA, GB"
                className="stripe-matrix-input"
                style={{
                  width: "100%",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box" as const,
                }}
                data-ocid="admin.stripe.countries.input"
              />
              <p
                style={{
                  color: "rgba(94,240,138,0.3)",
                  fontSize: 11,
                  marginTop: 6,
                  fontFamily: "monospace",
                }}
              >
                Comma-separated ISO country codes for billing address
                collection.
              </p>
            </div>

            {saveStatus.type === "success" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(94,240,138,0.08)",
                  border: "1px solid rgba(94,240,138,0.25)",
                }}
              >
                <CheckCircle2
                  size={14}
                  style={{ color: "#5EF08A", flexShrink: 0 }}
                />
                <p
                  style={{
                    color: "#5EF08A",
                    fontSize: 12,
                    fontFamily: "monospace",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  {saveStatus.message}
                </p>
              </div>
            )}
            {saveStatus.type === "error" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                <AlertTriangle
                  size={14}
                  style={{ color: "#f87171", flexShrink: 0 }}
                />
                <p
                  style={{
                    color: "#f87171",
                    fontSize: 12,
                    fontFamily: "monospace",
                    margin: 0,
                  }}
                >
                  {saveStatus.message}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                saveStatus.type === "saving" ||
                (!secretKey.trim() &&
                  !publishableKey.trim() &&
                  allowedCountries.trim() === originalAllowedCountries.trim())
              }
              data-ocid="admin.stripe.save.button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.06em",
                cursor:
                  saveStatus.type === "saving" ||
                  (!secretKey.trim() &&
                    !publishableKey.trim() &&
                    allowedCountries.trim() === originalAllowedCountries.trim())
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
                background:
                  saveStatus.type === "saving" ||
                  (!secretKey.trim() &&
                    !publishableKey.trim() &&
                    allowedCountries.trim() === originalAllowedCountries.trim())
                    ? "rgba(94,240,138,0.08)"
                    : "rgba(94,240,138,0.15)",
                color:
                  saveStatus.type === "saving" ||
                  (!secretKey.trim() &&
                    !publishableKey.trim() &&
                    allowedCountries.trim() === originalAllowedCountries.trim())
                    ? "rgba(94,240,138,0.3)"
                    : "#5EF08A",
                border: "1px solid rgba(94,240,138,0.3)",
                boxShadow:
                  saveStatus.type === "saving" ||
                  (!secretKey.trim() &&
                    !publishableKey.trim() &&
                    allowedCountries.trim() === originalAllowedCountries.trim())
                    ? "none"
                    : "0 0 16px rgba(94,240,138,0.15)",
              }}
            >
              <Zap size={14} />
              {saveStatus.type === "saving"
                ? "SAVING..."
                : "SAVE STRIPE CONFIGURATION"}
            </button>
          </form>
        </div>

        {/* ── Webhook Shared Secret ─────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(94,240,138,0.18)",
            background: "rgba(5,8,16,0.85)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(94,240,138,0.12)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Shield size={16} style={{ color: "#5EF08A", flexShrink: 0 }} />
            <TypewriterText
              text="WEBHOOK SHARED SECRET"
              as="h2"
              speed={45}
              style={{
                color: "#5EF08A",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                margin: 0,
              }}
            />
          </div>
          <div
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <label
                htmlFor="stripe-webhook-shared-secret"
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(94,240,138,0.6)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Webhook Shared Secret
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="stripe-webhook-shared-secret"
                  type={webhookSharedSecretVisible ? "text" : "password"}
                  value={webhookSharedSecret}
                  onChange={(e) => setWebhookSharedSecret(e.target.value)}
                  placeholder="Enter shared secret token"
                  autoComplete="off"
                  className="stripe-matrix-input"
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    padding: "12px 44px 12px 16px",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box" as const,
                  }}
                  data-ocid="admin.stripe.webhook-shared-secret.input"
                />
                <button
                  type="button"
                  aria-label={
                    webhookSharedSecretVisible ? "Hide secret" : "Show secret"
                  }
                  onClick={() => setWebhookSharedSecretVisible((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(94,240,138,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  data-ocid="admin.stripe.webhook-shared-secret.toggle"
                >
                  {webhookSharedSecretVisible ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              <p
                style={{
                  color: "rgba(94,240,138,0.3)",
                  fontSize: 11,
                  marginTop: 6,
                  fontFamily: "monospace",
                }}
              >
                Secondary authentication layer for incoming webhook calls.
                Configure this token in your webhook URL as a query parameter.
              </p>
            </div>

            {webhookSharedSecretStatus.type === "success" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(94,240,138,0.08)",
                  border: "1px solid rgba(94,240,138,0.25)",
                }}
              >
                <CheckCircle2
                  size={14}
                  style={{ color: "#5EF08A", flexShrink: 0 }}
                />
                <p
                  style={{
                    color: "#5EF08A",
                    fontSize: 12,
                    fontFamily: "monospace",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  {webhookSharedSecretStatus.message}
                </p>
              </div>
            )}
            {webhookSharedSecretStatus.type === "error" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                <AlertTriangle
                  size={14}
                  style={{ color: "#f87171", flexShrink: 0 }}
                />
                <p
                  style={{
                    color: "#f87171",
                    fontSize: 12,
                    fontFamily: "monospace",
                    margin: 0,
                  }}
                >
                  {webhookSharedSecretStatus.message}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveWebhookSharedSecret}
              disabled={
                webhookSharedSecretStatus.type === "saving" ||
                !webhookSharedSecret.trim()
              }
              data-ocid="admin.stripe.webhook-shared-secret.save_button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.06em",
                cursor:
                  webhookSharedSecretStatus.type === "saving" ||
                  !webhookSharedSecret.trim()
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
                background:
                  webhookSharedSecretStatus.type === "saving" ||
                  !webhookSharedSecret.trim()
                    ? "rgba(94,240,138,0.08)"
                    : "rgba(94,240,138,0.15)",
                color:
                  webhookSharedSecretStatus.type === "saving" ||
                  !webhookSharedSecret.trim()
                    ? "rgba(94,240,138,0.3)"
                    : "#5EF08A",
                border: "1px solid rgba(94,240,138,0.3)",
                boxShadow:
                  webhookSharedSecretStatus.type === "saving" ||
                  !webhookSharedSecret.trim()
                    ? "none"
                    : "0 0 16px rgba(94,240,138,0.15)",
              }}
            >
              <Zap size={14} />
              {webhookSharedSecretStatus.type === "saving"
                ? "SAVING..."
                : "SAVE SECRET"}
            </button>
          </div>
        </div>

        {/* ── Quick Reference ────────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(94,240,138,0.18)",
            background: "rgba(5,8,16,0.85)",
            padding: 20,
          }}
        >
          <TypewriterText
            text="PAYMENT MODE REFERENCE"
            as="h3"
            speed={40}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(94,240,138,0.6)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.1em",
              marginBottom: 16,
              fontFamily: "'JetBrains Mono', monospace",
              display: "block",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {(catalogProducts.length > 0
              ? catalogProducts
                  .filter((p) => p.active)
                  .reduce<
                    Array<{ label: string; value: string; color: string }>
                  >((acc, p) => {
                    const pt = p.product_type?.toLowerCase() ?? "";
                    let value = "";
                    let color = "#5EF08A";
                    if (pt === "subscription" || pt === "saas" || pt === "ai") {
                      value = "Monthly subscription";
                      color = "#60a5fa";
                    } else if (pt === "custom_site" || pt === "deposit") {
                      value = "50% deposit";
                    } else {
                      value = "One-time payment";
                    }
                    if (!acc.find((r) => r.label === p.name)) {
                      acc.push({ label: p.name, value, color });
                    }
                    return acc;
                  }, [])
              : [
                  {
                    label: "Speedy Basic, Booking, Storefronts",
                    value: "One-time payment",
                    color: "#5EF08A",
                  },
                  {
                    label: "Basic Plan, Booking Plan, Storefront Plan",
                    value: "Monthly subscription",
                    color: "#60a5fa",
                  },
                  {
                    label: "Custom Sites (all tiers)",
                    value: "50% deposit",
                    color: "#5EF08A",
                  },
                  {
                    label: "SaaS Plans, AI Receptionist",
                    value: "Monthly subscription",
                    color: "#60a5fa",
                  },
                ]
            ).map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(94,240,138,0.06)",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "rgba(94,240,138,0.5)" }}>{label}</span>
                <span style={{ color, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
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
