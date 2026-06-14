import { Link } from "@tanstack/react-router";
import { Clock, Gift, Handshake, Shield } from "lucide-react";
import { useEffect } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { createActorWithConfig } from "../config";

export default function AboutPage() {
  useEffect(() => {
    const track = async () => {
      try {
        let sid = sessionStorage.getItem("_vis_sid");
        if (!sid) {
          sid = crypto.randomUUID();
          sessionStorage.setItem("_vis_sid", sid);
        }
        const countryCode: string | null = null;
        const publicActor = await createActorWithConfig(createActor);
        await (publicActor as backendInterface).recordVisit(
          "/about",
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid,
          countryCode,
        );
      } catch {
        // silent
      }
    };
    track();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />
      <main>
        {/* PAGE HEADER */}
        <section
          style={{ backgroundColor: "#0A0B14" }}
          className="w-full py-20 px-6 text-center"
          data-ocid="about.header.section"
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight mb-6">
              <EditableText
                textKey="about.hero.heading"
                defaultText="We Build Websites for Business Owners Who Are Tired of Getting Burned."
              />
            </h1>
            <p
              className="text-white"
              style={{ fontSize: "17px", lineHeight: "1.7" }}
            >
              <EditableText
                textKey="about.hero.subtext"
                defaultText="No freelancers who disappear. No agencies that charge $15,000 for a brochure site. No DIY platforms that make you look amateur. Just a real site, built fast, priced fairly."
              />
            </p>
          </div>
        </section>

        {/* FOUNDER STORY SECTION */}
        <section
          className="w-full py-20 px-6"
          style={{ backgroundColor: "rgba(14,16,32,1)" }}
          data-ocid="about.founder.section"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Left column — placeholder image */}
              <div
                style={{
                  backgroundColor: "#0D0F1E",
                  height: "400px",
                  borderRadius: "8px",
                }}
                className="flex items-center justify-center"
              >
                <span style={{ color: "#7A7D90", fontSize: "15px" }}>
                  [PLACEHOLDER: FOUNDER PHOTO]
                </span>
              </div>

              {/* Right column — story copy */}
              <div>
                <h2
                  className="text-3xl font-bold mb-6"
                  style={{ color: "#EEF0F8" }}
                >
                  <EditableText
                    textKey="about.founder.heading"
                    defaultText="Why We Started Imperidome."
                  />
                </h2>
                <div
                  className="space-y-4"
                  style={{
                    color: "#7A7D90",
                    fontSize: "17px",
                    lineHeight: "1.8",
                  }}
                >
                  <p>
                    <EditableText
                      textKey="about.founder.story_1"
                      defaultText="We started Imperidome because we kept seeing the same story play out. A small business owner pays a freelancer $800 for a website. The freelancer disappears after delivery. Six months later the site is broken and nobody picks up the phone."
                    />
                  </p>
                  <p>
                    <EditableText
                      textKey="about.founder.story_2"
                      defaultText="Or they go to an agency and get quoted $12,000 for five pages and a contact form. Then they wait three months for the first draft."
                    />
                  </p>
                  <p>
                    <EditableText
                      textKey="about.founder.story_3"
                      defaultText="Or they try to build it themselves on Wix or Squarespace and end up with something that looks exactly like every other Wix site — because it is."
                    />
                  </p>
                  <p>
                    <EditableText
                      textKey="about.founder.story_4"
                      defaultText="We built Imperidome to be the fourth option. Agency-quality work. Freelancer-level speed. Prices that make sense for a real business with a real budget."
                    />
                  </p>
                  <p>
                    <EditableText
                      textKey="about.founder.story_5"
                      defaultText="Every site we build is custom. Every price is posted publicly. Every delivery window is in the contract. No surprises. No excuses. No disappearing acts."
                    />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THREE VALUE PILLARS SECTION */}
        <section
          style={{ backgroundColor: "rgba(14,16,32,1)" }}
          className="w-full py-20 px-6"
          data-ocid="about.pillars.section"
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl font-bold text-center mb-12"
              style={{ color: "#EEF0F8" }}
            >
              <EditableText
                textKey="about.pillars.heading"
                defaultText="What Imperidome Stands For."
              />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 — Radical Transparency */}
              <div
                style={{
                  backgroundColor: "rgba(17,19,34,0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid #1C1F33",
                  borderRadius: "8px",
                  padding: "32px",
                }}
                className="flex flex-col"
                data-ocid="about.pillars.card"
              >
                <div className="mb-6">
                  <Shield
                    size={48}
                    strokeWidth={1.5}
                    style={{ color: "#5EF08A" }}
                  />
                </div>
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#EEF0F8" }}
                >
                  <EditableText
                    textKey="about.pillars.card_1.title"
                    defaultText="Radical Transparency"
                  />
                </h3>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "16px",
                    lineHeight: "1.75",
                  }}
                >
                  <EditableText
                    textKey="about.pillars.card_1.body"
                    defaultText="Every price is posted publicly. Every feature is listed explicitly. Every limitation is disclosed before you sign. You will never discover a hidden fee or a missing feature after your deposit clears."
                  />
                </p>
              </div>

              {/* Card 2 — Speed Without Shortcuts */}
              <div
                style={{
                  backgroundColor: "rgba(17,19,34,0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid #1C1F33",
                  borderRadius: "8px",
                  padding: "32px",
                }}
                className="flex flex-col"
                data-ocid="about.pillars.card"
              >
                <div className="mb-6">
                  <Clock
                    size={48}
                    strokeWidth={1.5}
                    style={{ color: "#5EF08A" }}
                  />
                </div>
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#EEF0F8" }}
                >
                  <EditableText
                    textKey="about.pillars.card_2.title"
                    defaultText="Speed Without Shortcuts"
                  />
                </h3>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "16px",
                    lineHeight: "1.75",
                  }}
                >
                  <EditableText
                    textKey="about.pillars.card_2.body"
                    defaultText="We build fast because we have a proven process — not because we cut corners. Every site is custom-designed for your business. The only reason it takes days instead of months is because we have done this hundreds of times."
                  />
                </p>
              </div>

              {/* Card 3 — Long-Term Partnership */}
              <div
                style={{
                  backgroundColor: "rgba(17,19,34,0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid #1C1F33",
                  borderRadius: "8px",
                  padding: "32px",
                }}
                className="flex flex-col"
                data-ocid="about.pillars.card"
              >
                <div className="mb-6">
                  <Handshake
                    size={48}
                    strokeWidth={1.5}
                    style={{ color: "#5EF08A" }}
                  />
                </div>
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#EEF0F8" }}
                >
                  <EditableText
                    textKey="about.pillars.card_3.title"
                    defaultText="Long-Term Partnership"
                  />
                </h3>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "16px",
                    lineHeight: "1.75",
                  }}
                >
                  <EditableText
                    textKey="about.pillars.card_3.body"
                    defaultText="We are not a build-and-bail agency. Every client is on a maintenance plan. Every site gets ongoing support. Our business only grows if your site keeps working — so we make sure it does."
                  />
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REFERRAL PROGRAM SECTION */}
        <section
          className="w-full py-20 px-6"
          style={{ backgroundColor: "#0A0B14" }}
          data-ocid="about.referral.section"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              {/* Left column */}
              <div>
                <div className="mb-6">
                  <Gift
                    size={48}
                    strokeWidth={1.5}
                    style={{ color: "#0F766E" }}
                  />
                </div>
                <h2
                  className="text-3xl font-bold mb-6"
                  style={{ color: "#EEF0F8" }}
                >
                  <EditableText
                    textKey="about.referral.heading"
                    defaultText="Refer a Business. Get a Free Month."
                  />
                </h2>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "17px",
                    lineHeight: "1.8",
                  }}
                >
                  <EditableText
                    textKey="about.referral.body"
                    defaultText="If you refer a business owner who signs with us you get rewarded — no tracking codes, no referral forms, no complicated process. Just reply to any Imperidome email with the name and phone number of the business you are referring. We handle the rest. If they sign, your reward hits your account automatically."
                  />
                </p>
              </div>

              {/* Right column — rewards card */}
              <div
                style={{
                  backgroundColor: "#F0FDFA",
                  borderRadius: "8px",
                  border: "1px solid #1C1F33",
                  padding: "32px",
                }}
              >
                <p
                  className="mb-6"
                  style={{
                    color: "#7A7D90",
                    fontSize: "12px",
                    fontWeight: "600",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  <EditableText
                    textKey="about.referral.card.label"
                    defaultText="Referral Rewards"
                  />
                </p>

                {/* Item 1 */}
                <div className="mb-6">
                  <p
                    className="font-bold mb-1"
                    style={{ color: "#EEF0F8", fontSize: "16px" }}
                  >
                    <EditableText
                      textKey="about.referral.card.tier_high.title"
                      defaultText="Tier 3 or Above"
                    />
                  </p>
                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: "15px",
                      lineHeight: "1.7",
                    }}
                  >
                    <EditableText
                      textKey="about.referral.card.tier_high.body"
                      defaultText="Your next full month of maintenance is free. Applied automatically to your next billing cycle."
                    />
                  </p>
                </div>

                {/* Divider */}
                <div
                  style={{
                    borderTop: "1px solid #1C1F33",
                    marginBottom: "24px",
                  }}
                />

                {/* Item 2 */}
                <div>
                  <p
                    className="font-bold mb-1"
                    style={{ color: "#EEF0F8", fontSize: "16px" }}
                  >
                    <EditableText
                      textKey="about.referral.card.tier_low.title"
                      defaultText="Tier 1 or Tier 2"
                    />
                  </p>
                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: "15px",
                      lineHeight: "1.7",
                    }}
                  >
                    <EditableText
                      textKey="about.referral.card.tier_low.body"
                      defaultText="A $50 account credit applied to your next invoice or maintenance renewal."
                    />
                  </p>
                </div>
              </div>
            </div>

            {/* Centered note */}
            <p
              className="text-center mt-10"
              style={{ color: "#7A7D90", fontSize: "14px", lineHeight: "1.7" }}
            >
              <EditableText
                textKey="about.referral.footnote"
                defaultText="Referral rewards are applied after the referred client's deposit clears. No limit on referrals — refer ten clients, earn ten rewards."
              />
            </p>
          </div>
        </section>

        {/* BOTTOM CTA SECTION */}
        <section
          style={{ backgroundColor: "#0A0B14" }}
          className="w-full py-20 px-6 text-center"
          data-ocid="about.cta.section"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-white text-3xl md:text-4xl font-bold leading-tight mb-5">
              <EditableText
                textKey="about.cta.heading"
                defaultText="Ready to Work With an Agency That Does What It Says?"
              />
            </h2>
            <p
              className="text-white mb-10"
              style={{ fontSize: "17px", lineHeight: "1.7" }}
            >
              <EditableText
                textKey="about.cta.subtext"
                defaultText="No contracts. No surprises. No excuses. Just a great site delivered on time."
              />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/get-started"
                data-ocid="about.cta.primary_button"
                style={{
                  backgroundColor: "#5EF08A",
                  color: "#ffffff",
                  padding: "14px 32px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "16px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                <EditableText
                  textKey="about.cta.primary_button_text"
                  defaultText="Get Started Today"
                />
              </Link>
              <a
                href="[PLACEHOLDER: CALENDLY LINK]"
                data-ocid="about.cta.secondary_button"
                style={{
                  backgroundColor: "rgba(17,19,34,0.7)",
                  color: "#EEF0F8",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "14px 32px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "16px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                <EditableText
                  textKey="about.cta.secondary_button_text"
                  defaultText="Book a Free Call"
                />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
