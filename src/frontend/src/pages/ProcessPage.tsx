import { type Variants, motion } from "motion/react";
import { useEffect } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { createActorWithConfig } from "../config";
import { useSeoMeta } from "../hooks/useSeoMeta";

const steps = [
  {
    number: "01",
    label: "Discovery",
    headline: "Scope, Strategy & Architecture",
    description:
      "We start every project by mapping exactly what you need. We define your goals, research your market, and architect a technical solution tailored to your business — before a single line of code is written.",
    details: [
      "Business goals & KPI alignment",
      "Competitor & market research",
      "Technical architecture planning",
      "Project scope & timeline locked in writing",
    ],
    accent: "#39FF14",
  },
  {
    number: "02",
    label: "Build",
    headline: "Engineering, AI & Design",
    description:
      "Our team builds your project using modern web technology, custom AI integrations, and a design language that makes you the obvious choice in your market. No templates. No shortcuts.",
    details: [
      "Custom design — zero templates",
      "Full-stack engineering",
      "AI receptionist & automation setup",
      "Responsive on every device",
    ],
    accent: "#39FF14",
  },
  {
    number: "03",
    label: "Launch",
    headline: "Deployment, QA & Handoff",
    description:
      "We run a complete quality pass before anything goes live. Then we connect your domain, deliver your admin credentials, and your maintenance plan activates on launch day. You own everything.",
    details: [
      "Multi-device QA & performance audit",
      "Domain connection & DNS setup",
      "Admin access & training handoff",
      "Maintenance plan activates on day one",
    ],
    accent: "#39FF14",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.15, ease: "easeOut" as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

export default function ProcessPage() {
  useSeoMeta("process", "Our Process — Imperidome");

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
          window.location.pathname,
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
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0B14",
        display: "flex",
        flexDirection: "column",
      }}
      data-ocid="process.page"
    >
      <Navbar />
      <div style={{ height: "68px" }} aria-hidden="true" />

      <main style={{ flex: 1 }}>
        {/* ── HERO HEADER ── */}
        <section
          data-ocid="process.hero.section"
          style={{
            background: "linear-gradient(180deg, #0D0F1E 0%, #0A0B14 100%)",
            padding: "72px 24px 64px",
            textAlign: "center",
          }}
        >
          <motion.div
            className="max-w-3xl mx-auto"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <span
              style={{
                display: "inline-block",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#39FF14",
                marginBottom: "16px",
                padding: "4px 14px",
                border: "1px solid rgba(57,255,20,0.3)",
                borderRadius: "20px",
                background: "rgba(57,255,20,0.06)",
              }}
            >
              <EditableText
                textKey="process.hero.badge"
                defaultText="Our Process"
              />
            </span>
            <h1
              style={{
                fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
                fontWeight: 800,
                color: "#EEF0F8",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: "0 0 20px",
              }}
            >
              <EditableText
                textKey="process.hero.heading"
                defaultText="How We Build — Every Time."
              />
            </h1>
            <p
              style={{
                fontSize: "17px",
                color: "#7A7D90",
                lineHeight: 1.7,
                maxWidth: "560px",
                margin: "0 auto 32px",
              }}
            >
              <EditableText
                textKey="process.hero.subtext"
                defaultText="Three phases. Every project. No exceptions. This is the Imperidome build system — the same process whether you're getting a Speedy Site or an Enterprise build."
              />
            </p>
            <a
              href="/get-started"
              data-ocid="process.hero.cta_button"
              style={{
                display: "inline-block",
                background: "#39FF14",
                color: "#061209",
                fontWeight: 700,
                fontSize: "15px",
                padding: "13px 32px",
                borderRadius: "8px",
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
            >
              <EditableText
                textKey="process.hero.cta_button_text"
                defaultText="Start Your Project"
              />
            </a>
          </motion.div>
        </section>

        {/* ── VERTICAL TIMELINE ── */}
        <section
          data-ocid="process.timeline.section"
          style={{ padding: "80px 24px 100px", background: "#0A0B14" }}
        >
          <div style={{ maxWidth: "820px", margin: "0 auto" }}>
            {/* Section label */}
            <motion.p
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              style={{
                textAlign: "center",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#7A7D90",
                marginBottom: "64px",
              }}
            >
              <EditableText
                textKey="process.timeline.section_label"
                defaultText="The Three Phases"
              />
            </motion.p>

            <div style={{ position: "relative" }}>
              {/* Vertical spine */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "39px",
                  top: "40px",
                  bottom: "40px",
                  width: "2px",
                  background:
                    "linear-gradient(180deg, #39FF14 0%, rgba(57,255,20,0.3) 50%, transparent 100%)",
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "48px",
                }}
              >
                {steps.map((step, i) => (
                  <motion.div
                    key={step.number}
                    data-ocid={`process.step.${i + 1}`}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.25 }}
                    style={{
                      display: "flex",
                      gap: "28px",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Timeline node */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: "80px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          border: "2px solid #39FF14",
                          background: "rgba(57,255,20,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 0 20px rgba(57,255,20,0.2)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "22px",
                            fontWeight: 800,
                            color: "#39FF14",
                            lineHeight: 1,
                          }}
                        >
                          {step.number}
                        </span>
                      </div>
                    </div>

                    {/* Step card */}
                    <div
                      style={{
                        flex: 1,
                        background: "rgba(17,19,34,0.75)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid #1C1F33",
                        borderRadius: "14px",
                        padding: "28px 28px 24px",
                      }}
                    >
                      {/* Phase label */}
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "#39FF14",
                          marginBottom: "8px",
                        }}
                      >
                        <EditableText
                          textKey={`process.step${i + 1}.phase_label`}
                          defaultText={`Phase ${step.number} · ${step.label}`}
                        />
                      </span>

                      <h3
                        style={{
                          fontSize: "22px",
                          fontWeight: 700,
                          color: "#EEF0F8",
                          margin: "0 0 12px",
                          lineHeight: 1.25,
                        }}
                      >
                        <EditableText
                          textKey={`process.step${i + 1}.headline`}
                          defaultText={step.headline}
                        />
                      </h3>

                      <p
                        style={{
                          fontSize: "15px",
                          color: "#7A7D90",
                          lineHeight: 1.7,
                          margin: "0 0 20px",
                        }}
                      >
                        <EditableText
                          textKey={`process.step${i + 1}.description`}
                          defaultText={step.description}
                        />
                      </p>

                      {/* Detail list */}
                      <ul
                        style={{
                          margin: 0,
                          padding: 0,
                          listStyle: "none",
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(220px, 1fr))",
                          gap: "8px 16px",
                        }}
                      >
                        {step.details.map((detail, di) => (
                          <li
                            key={detail}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              fontSize: "13px",
                              color: "#9CA3AF",
                              lineHeight: 1.5,
                            }}
                          >
                            <span
                              style={{
                                color: "#39FF14",
                                fontWeight: 700,
                                flexShrink: 0,
                                marginTop: "1px",
                              }}
                            >
                              ✓
                            </span>
                            <EditableText
                              textKey={`process.step${i + 1}.detail_${di + 1}`}
                              defaultText={detail}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section
          data-ocid="process.cta.section"
          style={{
            background: "#0D0F1E",
            padding: "72px 24px",
            textAlign: "center",
            borderTop: "1px solid #1C1F33",
          }}
        >
          <motion.div
            className="max-w-2xl mx-auto"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.6rem)",
                fontWeight: 800,
                color: "#EEF0F8",
                margin: "0 0 14px",
                lineHeight: 1.2,
              }}
            >
              <EditableText
                textKey="process.cta.heading"
                defaultText="Ready to start your project?"
              />
            </h2>
            <p
              style={{
                color: "#7A7D90",
                fontSize: "16px",
                lineHeight: 1.65,
                marginBottom: "32px",
              }}
            >
              <EditableText
                textKey="process.cta.subtext"
                defaultText="Every build follows this exact process. No surprises, no scope creep, no missed launches."
              />
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                justifyContent: "center",
              }}
            >
              <a
                href="/get-started"
                data-ocid="process.cta.primary_button"
                style={{
                  display: "inline-block",
                  background: "#39FF14",
                  color: "#061209",
                  fontWeight: 700,
                  fontSize: "15px",
                  padding: "13px 32px",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                <EditableText
                  textKey="process.cta.primary_button_text"
                  defaultText="Get Started"
                />
              </a>
              <a
                href="/services"
                data-ocid="process.cta.secondary_button"
                style={{
                  display: "inline-block",
                  color: "#EEF0F8",
                  fontWeight: 600,
                  fontSize: "15px",
                  padding: "13px 32px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <EditableText
                  textKey="process.cta.secondary_button_text"
                  defaultText="View Services"
                />
              </a>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
