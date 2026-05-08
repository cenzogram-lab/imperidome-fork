import { Lock } from "lucide-react";
import React from "react";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";

export default function PrivacyPage() {
  return (
    <>
      <div className="min-h-screen bg-[#0A0B14] text-gray-300 font-sans pb-32 pt-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* HEADER */}
          <div className="mb-16 text-center border-b border-[#1C1F33] pb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5EF08A]/10 border border-[#5EF08A]/30 text-[#5EF08A] text-xs font-bold tracking-widest uppercase mb-6">
              <Lock className="w-4 h-4" />
              <EditableText
                textKey="privacy.header.badge"
                defaultText="Data Protection"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-white">
              <EditableText
                textKey="privacy.hero.heading_prefix"
                defaultText="Imperidome"
              />{" "}
              <span className="text-[#5EF08A]">
                <EditableText
                  textKey="privacy.hero.heading_accent"
                  defaultText="Privacy Policy"
                />
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              <EditableText
                textKey="privacy.hero.subtext"
                defaultText="How we collect, use, and protect your data."
              />
            </p>
            <p className="text-xs text-gray-500 mt-4 font-bold uppercase tracking-widest">
              <EditableText
                textKey="privacy.hero.effective_date"
                defaultText="Effective Date: January 1, 2025"
              />
            </p>
          </div>

          {/* CONTENT STYLED AS PROSE */}
          <div className="space-y-10 text-sm md:text-base leading-relaxed text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-[#5EF08A]">01.</span>
                <EditableText
                  textKey="privacy.section_1.heading"
                  defaultText="Information We Collect"
                />
              </h2>
              <p>
                <EditableText
                  textKey="privacy.section_1.intro"
                  defaultText="We collect information you provide directly to us when you use our platform, including:"
                />
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="privacy.section_1.item_1.label"
                      defaultText="Account Data:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="privacy.section_1.item_1.body"
                    defaultText="Name, email address, phone number, and business details provided during onboarding."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="privacy.section_1.item_2.label"
                      defaultText="Payment Information:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="privacy.section_1.item_2.body"
                    defaultText="Processed securely via Stripe. Imperidome does not store full credit card numbers on our servers."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="privacy.section_1.item_3.label"
                      defaultText="AI Training Data:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="privacy.section_1.item_3.body"
                    defaultText="Voice samples (if opting for voice cloning), FAQs, and business scripts provided to train your AI Receptionist."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="privacy.section_1.item_4.label"
                      defaultText="Media Assets:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="privacy.section_1.item_4.body"
                    defaultText="Logos, brand images, and video files uploaded for Cinematic Ad production."
                  />
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-[#5EF08A]">02.</span>
                <EditableText
                  textKey="privacy.section_2.heading"
                  defaultText="How We Use Your Data"
                />
              </h2>
              <p>
                <EditableText
                  textKey="privacy.section_2.intro"
                  defaultText="We use the data we collect solely to provide, maintain, and improve our services to you:"
                />
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <EditableText
                    textKey="privacy.section_2.item_1"
                    defaultText="To build and deploy your Imperidome website infrastructure."
                  />
                </li>
                <li>
                  <EditableText
                    textKey="privacy.section_2.item_2"
                    defaultText="To configure and train your Vapi-powered AI Receptionist using your provided business logic."
                  />
                </li>
                <li>
                  <EditableText
                    textKey="privacy.section_2.item_3"
                    defaultText="To generate your Seedance cinematic video ads."
                  />
                </li>
                <li>
                  <EditableText
                    textKey="privacy.section_2.item_4"
                    defaultText="To process transactions, send invoices, and handle recurring subscriptions."
                  />
                </li>
                <li>
                  <EditableText
                    textKey="privacy.section_2.item_5"
                    defaultText="To communicate strictly regarding account updates, system maintenance, and performance reporting."
                  />
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-[#5EF08A]">03.</span>
                <EditableText
                  textKey="privacy.section_3.heading"
                  defaultText="Third-Party Service Providers"
                />
              </h2>
              <p>
                <EditableText
                  textKey="privacy.section_3.intro"
                  defaultText="We do not sell your personal data. We only share data with essential third-party infrastructure partners necessary to deliver our services:"
                />
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="privacy.section_3.item_1.label"
                      defaultText="Stripe:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="privacy.section_3.item_1.body"
                    defaultText="For secure payment processing and subscription billing."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="privacy.section_3.item_2.label"
                      defaultText="Vapi & Twilio:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="privacy.section_3.item_2.body"
                    defaultText="For telecom routing and AI voice synthesis. Your AI training data is securely transmitted to these APIs for real-time call handling."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="privacy.section_3.item_3.label"
                      defaultText="Internet Computer (ICP):"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="privacy.section_3.item_3.body"
                    defaultText="Our Motoko backend infrastructure where your encrypted lead data is stored."
                  />
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-[#5EF08A]">04.</span>
                <EditableText
                  textKey="privacy.section_4.heading"
                  defaultText="Data Security & Retention"
                />
              </h2>
              <p>
                <EditableText
                  textKey="privacy.section_4.body"
                  defaultText="We implement enterprise-grade security measures to protect your data. Your lead capture data, call logs, and transcripts are stored securely in our stable backend arrays. We retain your data only for as long as your account is active. If your account is suspended or terminated (as outlined in our Terms of Service), your data will be archived for 60 days before permanent deletion."
                />
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-[#5EF08A]">05.</span>
                <EditableText
                  textKey="privacy.section_5.heading"
                  defaultText="Your Privacy Rights"
                />
              </h2>
              <p>
                <EditableText
                  textKey="privacy.section_5.body"
                  defaultText="Depending on your jurisdiction (e.g., CCPA, GDPR), you may have the right to request access to, correction of, or deletion of your personal data. To initiate a data export or deletion request, please submit a written request to our support team. Note that exercising a deletion right will immediately terminate your active website and AI services."
                />
              </p>
            </section>

            <section className="mt-16 pt-12 border-t border-[#1C1F33]">
              <p className="text-xs text-gray-500 text-center">
                <EditableText
                  textKey="privacy.footer.note"
                  defaultText="This Privacy Policy was prepared by Imperidome. If you have any questions about this policy, please contact your account manager."
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
