import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createActor } from "../../backend";
import type { backendInterface } from "../../backend";
import { EditableText } from "../../components/EditableText";
import { Footer } from "../../components/Footer";
import { Navbar } from "../../components/Navbar";
import TypewriterText from "../../components/TypewriterText";
import { VideoCard } from "../../components/VideoCard";
import { createActorWithConfig } from "../../config";
import { useSiteTextStore } from "../../store/useSiteTextStore";

const PLACEHOLDER_CARDS = [
  {
    title: "Safety Net in Action",
    description: "Missed-call text-back capturing leads after hours.",
    videoKey: "showcase_ai_receptionist_video_1",
  },
  {
    title: "AI Receptionist — Live Call",
    description: "AI voice handling FAQs and sending booking links.",
    videoKey: "showcase_ai_receptionist_video_2",
  },
  {
    title: "The Closer — Booking Demo",
    description: "AI books an appointment live on a call.",
    videoKey: "showcase_ai_receptionist_video_3",
  },
  {
    title: "CRM Integration Demo",
    description: "All call data fed directly into the client CRM.",
    videoKey: "showcase_ai_receptionist_video_4",
  },
  {
    title: "After-Hours Lead Capture",
    description: "Web chat widget converting late-night visitors.",
    videoKey: "showcase_ai_receptionist_video_5",
  },
  {
    title: "Full Setup Walkthrough",
    description: "End-to-end onboarding and receptionist configuration.",
    videoKey: "showcase_ai_receptionist_video_6",
  },
];

export default function ShowcaseAIReceptionistPage() {
  const navigate = useNavigate();
  const { fetchAllSiteText, getText } = useSiteTextStore();
  const [siteTextLoaded, setSiteTextLoaded] = useState(false);

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
          "/showcase/ai-receptionist",
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid,
          countryCode,
        );
      } catch {
        /* silent */
      }
    };
    track();
  }, []);

  useEffect(() => {
    let cancelled = false;
    createActorWithConfig(createActor)
      .then((publicActor) => {
        if (cancelled) return;
        fetchAllSiteText(publicActor).finally(() => {
          if (!cancelled) setSiteTextLoaded(true);
        });
      })
      .catch(() => {
        if (!cancelled) setSiteTextLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchAllSiteText]);

  return (
    <div
      style={{
        background: "#0A0B14",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(94,240,138,0.015) 2px, rgba(94,240,138,0.015) 4px)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <div style={{ height: "68px" }} aria-hidden="true" />

        <section
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "64px 24px 48px",
          }}
        >
          <motion.button
            type="button"
            onClick={() => navigate({ to: "/services" })}
            whileHover={{
              boxShadow: "0 0 20px rgba(94,240,138,0.45)",
              scale: 1.03,
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "transparent",
              border: "1px solid #5EF08A",
              color: "#5EF08A",
              padding: "8px 20px",
              borderRadius: "10px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "40px",
              transition: "opacity 0.15s",
              fontFamily: "'Courier New', Courier, monospace",
            }}
            data-ocid="showcase.ai_receptionist.back_button"
          >
            <ArrowLeft size={16} />
            <EditableText
              textKey="showcase.back_to_products"
              defaultText="Back to Services"
            />
          </motion.button>

          <div style={{ marginBottom: "16px" }}>
            <TypewriterText
              text="// IMPERIDOME IN ACTION"
              as="p"
              speed={40}
              style={{
                color: "#5EF08A",
                fontSize: "0.85rem",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "12px",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            />
            <TypewriterText
              text="AI Receptionist"
              as="h1"
              speed={60}
              className="matrix-glow-text"
              style={{
                color: "#EEF0F8",
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: "800",
                letterSpacing: "-0.02em",
                lineHeight: "1.1",
                marginBottom: "16px",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            />
            <TypewriterText
              text="See our AI Receptionist in action"
              as="p"
              speed={35}
              style={{
                color: "#7A7D90",
                fontSize: "1.125rem",
                maxWidth: "520px",
                lineHeight: "1.6",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            />
          </div>
        </section>

        <section
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 24px 80px",
          }}
        >
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(to right, transparent, #5EF08A30 30%, #5EF08A50 50%, #5EF08A30 70%, transparent)",
              marginBottom: "48px",
              boxShadow: "0 0 8px rgba(94,240,138,0.2)",
            }}
          />
          <TypewriterText
            text="> See It In Action_"
            as="h2"
            speed={45}
            className="matrix-heading"
            style={{
              color: "#5EF08A",
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "32px",
              letterSpacing: "0.04em",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
            }}
            data-ocid="showcase.ai_receptionist.list"
          >
            {PLACEHOLDER_CARDS.map((card, i) => {
              const videoUrl = siteTextLoaded ? getText(card.videoKey, "") : "";
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  data-ocid={`showcase.ai_receptionist.item.${i + 1}`}
                  style={{
                    border: "1px solid rgba(94,240,138,0.25)",
                    borderRadius: "12px",
                    boxShadow: "0 0 16px rgba(94,240,138,0.06)",
                    overflow: "hidden",
                    transition: "box-shadow 0.3s",
                  }}
                  whileHover={{ boxShadow: "0 0 28px rgba(94,240,138,0.18)" }}
                >
                  <VideoCard
                    title={card.title}
                    description={card.description}
                    videoUrl={videoUrl || undefined}
                  />
                </motion.div>
              );
            })}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
