import { Check, Copy, ExternalLink, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import TypewriterText from "../components/TypewriterText";
import { useActor } from "../hooks/useActor";
import { getSession } from "../hooks/useSession";

const PROGRAM_DETAILS = [
  {
    text: "Referrals must remain an active, paying subscriber for at least 60 days for the reward to vest.",
    key: "referral.program_detail_1",
  },
  {
    text: "Rewards are applied as account credits toward future billing; no cash payouts.",
    key: "referral.program_detail_2",
  },
  {
    text: "Referral must be a new client; self-referrals for additional sites are not eligible.",
    key: "referral.program_detail_3",
  },
  {
    text: "\u201cTier 3+\u201d refers to the DIY Storefront or custom enterprise plans.",
    key: "referral.program_detail_4",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    text: "Tell a business owner about Imperidome.",
    stepKey: "referral.how_step_1_number",
    textKey: "referral.how_step_1_text",
  },
  {
    step: "2",
    text: "They sign and launch their site.",
    stepKey: "referral.how_step_2_number",
    textKey: "referral.how_step_2_text",
  },
  {
    step: "3",
    text: "Your reward is applied to your next billing cycle.",
    stepKey: "referral.how_step_3_number",
    textKey: "referral.how_step_3_text",
  },
];

function PersonalReferralSection() {
  const { actor, isFetching } = useActor();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const session = getSession();
  const userEmail = session?.email ?? "";
  const referralLink = referralCode
    ? `${window.location.origin}/register?ref=${encodeURIComponent(referralCode)}`
    : null;

  useEffect(() => {
    if (!actor || isFetching || !userEmail) return;
    async function fetchCode() {
      if (!actor || !userEmail) return;
      setLoading(true);
      setError(null);
      try {
        const result = await actor.getMyReferralCode(userEmail);
        if (Array.isArray(result) && result.length > 0)
          setReferralCode(result[0]);
        else setReferralCode(null);
      } catch {
        setError("Unable to load your referral code. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchCode();
  }, [actor, isFetching, userEmail]);

  async function copyToClipboard(text: string, type: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "code") {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } else {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        if (type === "code") {
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 2000);
        } else {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        }
      } catch {
        /* silent */
      }
      document.body.removeChild(textarea);
    }
  }

  return (
    <section
      className="py-16 px-6"
      style={{ backgroundColor: "#0D0F1E" }}
      data-ocid="referral.personal_code.section"
    >
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-xl p-8 matrix-card"
          style={{ border: "2px solid #5EF08A" }}
        >
          <h2
            className="text-xl font-bold mb-2 text-white"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <TypewriterText text="Your Personal Referral Code" speed={50} />
          </h2>
          <p className="text-sm mb-6 text-[#7A7D90]">
            <TypewriterText
              text="Share your code or link with anyone — when they sign up, you both benefit."
              speed={35}
            />
          </p>

          {loading && (
            <div
              data-ocid="referral.personal_code.loading_state"
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "52px",
                    background: "rgba(40,45,70,0.8)",
                    borderRadius: "8px",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div
              data-ocid="referral.personal_code.error_state"
              style={{
                background: "rgba(153,27,27,0.15)",
                border: "1px solid #991B1B",
                borderRadius: "8px",
                padding: "14px 16px",
                color: "#FCA5A5",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && !referralCode && (
            <div
              data-ocid="referral.personal_code.empty_state"
              style={{
                background: "rgba(40,45,70,0.5)",
                border: "1px solid #1C1F33",
                borderRadius: "8px",
                padding: "20px 16px",
                color: "#7A7D90",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              No referral code found for your account. Contact support if you
              believe this is an error.
            </div>
          )}

          {!loading && !error && referralCode && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <p
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#7A7D90",
                    marginBottom: "8px",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  Your Referral Code
                </p>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(10,11,20,0.9)",
                      border: "1px solid #1C1F33",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      fontFamily: "monospace",
                      fontSize: "18px",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      color: "#5EF08A",
                      userSelect: "all",
                    }}
                    data-ocid="referral.code.display"
                  >
                    {referralCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(referralCode, "code")}
                    data-ocid="referral.copy_code.button"
                    style={{
                      background: codeCopied
                        ? "rgba(94,240,138,0.2)"
                        : "rgba(94,240,138,0.1)",
                      border: "1px solid #5EF08A",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      color: "#5EF08A",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      transition: "background 0.2s",
                    }}
                  >
                    {codeCopied ? (
                      <>
                        <Check size={14} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
              {referralLink && (
                <div>
                  <p
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#7A7D90",
                      marginBottom: "8px",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    Your Shareable Link
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        background: "rgba(10,11,20,0.9)",
                        border: "1px solid #1C1F33",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "#7A7D90",
                        userSelect: "all",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      data-ocid="referral.link.display"
                    >
                      {referralLink}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(referralLink, "link")}
                      data-ocid="referral.copy_link.button"
                      style={{
                        background: linkCopied
                          ? "rgba(94,240,138,0.2)"
                          : "rgba(94,240,138,0.1)",
                        border: "1px solid #5EF08A",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        color: "#5EF08A",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        transition: "background 0.2s",
                      }}
                    >
                      {linkCopied ? (
                        <>
                          <Check size={14} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy Link
                        </>
                      )}
                    </button>
                    <a
                      href={referralLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid="referral.open_link.button"
                      title="Preview referral link"
                      style={{
                        background: "transparent",
                        border: "1px solid #1C1F33",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        color: "#7A7D90",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>
        {"@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }"}
      </style>
    </section>
  );
}

function LoginPromptSection() {
  return (
    <section
      className="py-16 px-6"
      style={{ backgroundColor: "#0D0F1E" }}
      data-ocid="referral.login_prompt.section"
    >
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl p-8 text-center matrix-card">
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "rgba(94,240,138,0.1)",
              border: "1px solid rgba(94,240,138,0.3)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <LogIn size={20} color="#5EF08A" />
          </div>
          <h3
            className="text-lg font-bold mb-2 text-white"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <TypewriterText
              text="Sign in to see your referral code"
              speed={45}
            />
          </h3>
          <p className="text-sm mb-6 text-[#7A7D90]">
            <TypewriterText
              text="Log in to your Imperidome account to access your personal referral code and shareable link."
              speed={30}
            />
          </p>
          <a
            href="/login"
            data-ocid="referral.login.button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#5EF08A",
              color: "#061209",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <LogIn size={16} />
            Sign In to Portal
          </a>
        </div>
      </div>
    </section>
  );
}

export default function ReferralPage() {
  const session = getSession();
  const isLoggedIn = !!session?.email;

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      {/* Header */}
      <section
        className="py-20 px-6 text-center"
        style={{ backgroundColor: "#0D0F1E" }}
        data-ocid="referral.header.section"
      >
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <TypewriterText text="The Imperidome Referral Program" speed={35} />
          </h1>
          <p className="text-xl text-[#9DA0B3]">
            <TypewriterText
              text="Get Rewarded for Spreading the Word."
              speed={45}
            />
          </p>
        </div>
      </section>

      {/* Reward Cards */}
      <section
        className="py-16 px-6 bg-[#0A0B14]"
        data-ocid="referral.cards.section"
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              className="rounded-lg p-8 matrix-card"
              style={{ border: "2px solid #5EF08A" }}
              data-ocid="referral.card.1"
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-4 text-[#5EF08A]"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                <TypewriterText text="Tier 3+ Referral" speed={55} />
              </div>
              <h2
                className="text-2xl font-bold mb-4 text-white"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                <TypewriterText text="1 Free Month" speed={55} />
              </h2>
              <p className="text-base text-[#EEF0F8]">
                <TypewriterText
                  text="Reward: 1 free month of your current plan."
                  speed={35}
                />
              </p>
            </div>
            <div
              className="rounded-lg p-8 matrix-card"
              style={{ border: "2px solid #5EF08A" }}
              data-ocid="referral.card.2"
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-4 text-[#5EF08A]"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                <TypewriterText text="Tier 1-2 Referral" speed={55} />
              </div>
              <h2
                className="text-2xl font-bold mb-4 text-white"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                <TypewriterText text="$50 Account Credit" speed={55} />
              </h2>
              <p className="text-base text-[#EEF0F8]">
                <TypewriterText text="Reward: $50 account credit." speed={45} />
              </p>
            </div>
          </div>
        </div>
      </section>

      {isLoggedIn ? <PersonalReferralSection /> : <LoginPromptSection />}

      {/* Program Details */}
      <section
        className="py-10 px-6"
        style={{ backgroundColor: "rgba(14,16,32,1)" }}
        data-ocid="referral.program_details.section"
      >
        <div className="max-w-2xl mx-auto text-center">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-4 text-[#7A7D90]"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <TypewriterText text="Program Details" speed={50} />
          </p>
          <ul
            className="flex flex-col gap-2"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            {PROGRAM_DETAILS.map(({ text, key }) => (
              <li key={key} className="text-sm text-[#7A7D90]">
                <EditableText textKey={key} defaultText={text} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How It Works */}
      <section
        className="py-16 px-6 bg-[#0A0B14]"
        data-ocid="referral.how_it_works.section"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl font-bold mb-12 text-white"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <TypewriterText text="How It Works" speed={50} />
          </h2>
          <div className="flex flex-col gap-8">
            {HOW_IT_WORKS.map(({ step, text, stepKey, textKey: _textKey }) => (
              <div key={stepKey} className="flex items-start gap-5 text-left">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ backgroundColor: "#5EF08A", color: "#061209" }}
                >
                  <EditableText textKey={stepKey} defaultText={step} />
                </div>
                <p className="text-lg pt-1 text-[#EEF0F8]">
                  <TypewriterText text={text} speed={35} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 px-6 text-center"
        style={{ backgroundColor: "rgba(14,16,32,1)" }}
        data-ocid="referral.cta.section"
      >
        <a
          href="/register"
          className="inline-block px-10 py-4 rounded-lg font-semibold text-lg transition-opacity hover:opacity-90 matrix-btn"
          data-ocid="referral.start_referring.button"
        >
          <TypewriterText text="Start Referring" speed={55} />
        </a>
      </section>

      <Footer />
    </div>
  );
}
