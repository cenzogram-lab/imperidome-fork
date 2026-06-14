import { Lock } from "lucide-react";
import React from "react";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import TypewriterText from "../components/TypewriterText";

const _SECTIONS = [
  {
    num: "01.",
    textKey: "privacy.section_1.heading",
    defaultText: "Information We Collect",
    bodyKey: "privacy.section_1",
    items: [
      {
        label: "privacy.section_1.item_1.label",
        labelDefault: "Account Data:",
        body: "privacy.section_1.item_1.body",
        bodyDefault:
          "Name, email address, phone number, and business details provided during onboarding.",
      },
      {
        label: "privacy.section_1.item_2.label",
        labelDefault: "Payment Information:",
        body: "privacy.section_1.item_2.body",
        bodyDefault:
          "Processed securely via Stripe. Imperidome does not store full credit card numbers on our servers.",
      },
      {
        label: "privacy.section_1.item_3.label",
        labelDefault: "AI Training Data:",
        body: "privacy.section_1.item_3.body",
        bodyDefault:
          "Voice samples (if opting for voice cloning), FAQs, and business scripts provided to train your AI Receptionist.",
      },
      {
        label: "privacy.section_1.item_4.label",
        labelDefault: "Media Assets:",
        body: "privacy.section_1.item_4.body",
        bodyDefault:
          "Logos, brand images, and video files uploaded for Cinematic Ad production.",
      },
    ],
    intro: "privacy.section_1.intro",
    introDefault:
      "We collect information you provide directly to us when you use our platform, including:",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <div
        className="bg-background"
        style={{
          minHeight: "100vh",
          paddingBottom: "128px",
          paddingTop: "80px",
        }}
      >
        <Navbar />
        <div className="h-[68px]" aria-hidden="true" />
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
          {/* HEADER */}
          <div
            style={{
              marginBottom: "64px",
              textAlign: "center",
              borderBottom: "1px solid rgba(34,197,94,0.12)",
              paddingBottom: "48px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                color: "#22C55E",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "24px",
              }}
            >
              <Lock className="w-4 h-4" />
              <TypewriterText text="Data Protection" speed={30} />
            </div>
            <h1
              className="text-white font-bold"
              style={{
                fontSize: "clamp(32px,5vw,48px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "20px",
                lineHeight: 1.1,
              }}
            >
              <EditableText
                textKey="privacy.hero.heading_prefix"
                defaultText="Imperidome"
              />{" "}
              <span style={{ color: "#22C55E" }}>
                <TypewriterText text="Privacy Policy" speed={40} />
                <span className="blink-cursor" />
              </span>
            </h1>
            <p
              className="text-slate-200"
              style={{
                fontSize: "18px",
                maxWidth: "520px",
                margin: "0 auto 16px",
              }}
            >
              <TypewriterText
                text="How we collect, use, and protect your data."
                speed={20}
              />
            </p>
            <p
              className="text-slate-400"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              <TypewriterText
                text="Effective Date: January 1, 2025"
                speed={20}
              />
            </p>
          </div>

          {/* CONTENT */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "40px",
              fontSize: "15px",
              lineHeight: 1.75,
            }}
          >
            {/* Section 1 */}
            <section
              className="bg-slate-800 border border-slate-700 rounded-xl"
              style={{ padding: "32px" }}
            >
              <h2
                className="text-white font-bold"
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ color: "#22C55E" }}>01.</span>
                <TypewriterText text="Information We Collect" speed={30} />
              </h2>
              <p className="text-slate-200" style={{ marginBottom: "12px" }}>
                <TypewriterText
                  text="We collect information you provide directly to us when you use our platform, including:"
                  speed={15}
                />
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {[
                  {
                    lbl: "Account Data:",
                    body: "Name, email address, phone number, and business details provided during onboarding.",
                  },
                  {
                    lbl: "Payment Information:",
                    body: "Processed securely via Stripe. Imperidome does not store full credit card numbers on our servers.",
                  },
                  {
                    lbl: "AI Training Data:",
                    body: "Voice samples (if opting for voice cloning), FAQs, and business scripts provided to train your AI Receptionist.",
                  },
                  {
                    lbl: "Media Assets:",
                    body: "Logos, brand images, and video files uploaded for Cinematic Ad production.",
                  },
                ].map(({ lbl, body }) => (
                  <li
                    key={lbl}
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: "#22C55E", flexShrink: 0 }}>▸</span>
                    <span className="text-slate-200">
                      <strong style={{ color: "#22C55E" }}>{lbl}</strong>{" "}
                      <TypewriterText text={body} speed={12} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 2 */}
            <section
              className="bg-slate-800 border border-slate-700 rounded-xl"
              style={{ padding: "32px" }}
            >
              <h2
                className="text-white font-bold"
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ color: "#22C55E" }}>02.</span>
                <TypewriterText text="How We Use Your Data" speed={30} />
              </h2>
              <p className="text-slate-200" style={{ marginBottom: "12px" }}>
                <TypewriterText
                  text="We use the data we collect solely to provide, maintain, and improve our services to you:"
                  speed={15}
                />
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {[
                  "To build and deploy your Imperidome website infrastructure.",
                  "To configure and train your Vapi-powered AI Receptionist using your provided business logic.",
                  "To generate your Seedance cinematic video ads.",
                  "To process transactions, send invoices, and handle recurring subscriptions.",
                  "To communicate strictly regarding account updates, system maintenance, and performance reporting.",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: "#22C55E", flexShrink: 0 }}>▸</span>
                    <span className="text-slate-200">
                      <TypewriterText text={item} speed={12} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 3 */}
            <section
              className="bg-slate-800 border border-slate-700 rounded-xl"
              style={{ padding: "32px" }}
            >
              <h2
                className="text-white font-bold"
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ color: "#22C55E" }}>03.</span>
                <TypewriterText
                  text="Third-Party Service Providers"
                  speed={30}
                />
              </h2>
              <p className="text-slate-200" style={{ marginBottom: "12px" }}>
                <TypewriterText
                  text="We do not sell your personal data. We only share data with essential third-party infrastructure partners necessary to deliver our services:"
                  speed={15}
                />
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {[
                  {
                    lbl: "Stripe:",
                    body: "For secure payment processing and subscription billing.",
                  },
                  {
                    lbl: "Vapi & Twilio:",
                    body: "For telecom routing and AI voice synthesis. Your AI training data is securely transmitted to these APIs for real-time call handling.",
                  },
                  {
                    lbl: "Internet Computer (ICP):",
                    body: "Our Motoko backend infrastructure where your encrypted lead data is stored.",
                  },
                ].map(({ lbl, body }) => (
                  <li
                    key={lbl}
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: "#22C55E", flexShrink: 0 }}>▸</span>
                    <span className="text-slate-200">
                      <strong style={{ color: "#22C55E" }}>{lbl}</strong>{" "}
                      <TypewriterText text={body} speed={12} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 4 */}
            <section
              className="bg-slate-800 border border-slate-700 rounded-xl"
              style={{ padding: "32px" }}
            >
              <h2
                className="text-white font-bold"
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ color: "#22C55E" }}>04.</span>
                <TypewriterText text="Data Security & Retention" speed={30} />
              </h2>
              <p className="text-slate-200">
                <TypewriterText
                  text="We implement enterprise-grade security measures to protect your data. Your lead capture data, call logs, and transcripts are stored securely in our stable backend arrays. We retain your data only for as long as your account is active. If your account is suspended or terminated (as outlined in our Terms of Service), your data will be archived for 60 days before permanent deletion."
                  speed={12}
                />
              </p>
            </section>

            {/* Section 5 */}
            <section
              className="bg-slate-800 border border-slate-700 rounded-xl"
              style={{ padding: "32px" }}
            >
              <h2
                className="text-white font-bold"
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ color: "#22C55E" }}>05.</span>
                <TypewriterText text="Your Privacy Rights" speed={30} />
              </h2>
              <p className="text-slate-200">
                <TypewriterText
                  text="Depending on your jurisdiction (e.g., CCPA, GDPR), you may have the right to request access to, correction of, or deletion of your personal data. To initiate a data export or deletion request, please submit a written request to our support team. Note that exercising a deletion right will immediately terminate your active website and AI services."
                  speed={12}
                />
              </p>
            </section>

            {/* Footer note */}
            <section
              style={{
                paddingTop: "32px",
                borderTop: "1px solid rgba(34,197,94,0.12)",
              }}
            >
              <p
                className="text-slate-400"
                style={{ textAlign: "center", fontSize: "12px" }}
              >
                <TypewriterText
                  text="This Privacy Policy was prepared by Imperidome. If you have any questions about this policy, please contact your account manager."
                  speed={12}
                />
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
