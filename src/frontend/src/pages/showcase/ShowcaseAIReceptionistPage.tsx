import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createActor } from "../../backend";
import type { backendInterface } from "../../backend";
import { EditableText } from "../../components/EditableText";
import { Footer } from "../../components/Footer";
import { Navbar } from "../../components/Navbar";
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
        let countryCode: string | null = null;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 2000);
          const res = await fetch("https://ipapi.co/country/", {
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          const text = (await res.text()).trim();
          if (/^[A-Z]{2}$/.test(text)) countryCode = text;
        } catch {
          // geolocation failed — use null
        }
        const publicActor = await createActorWithConfig(createActor);
        await (publicActor as backendInterface).recordVisit(
          "/showcase/ai-receptionist",
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
    <div style={{ background: "#0A0B14", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ height: "68px" }} aria-hidden="true" />

      {/* Hero */}
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
          whileHover={{ boxShadow: "0 0 16px rgba(94,240,138,0.35)" }}
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
          <p
            style={{
              color: "#5EF08A",
              fontSize: "0.85rem",
              fontWeight: "700",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            <EditableText
              textKey="showcase.ai_receptionist.eyebrow"
              defaultText="Imperidome in Action"
            />
          </p>
          <h1
            style={{
              color: "#EEF0F8",
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: "800",
              letterSpacing: "-0.02em",
              lineHeight: "1.1",
              marginBottom: "16px",
            }}
          >
            <EditableText
              textKey="showcase.ai_receptionist.hero_title"
              defaultText="AI Receptionist"
            />
          </h1>
          <p
            style={{
              color: "#7A7D90",
              fontSize: "1.125rem",
              maxWidth: "520px",
              lineHeight: "1.6",
            }}
          >
            <EditableText
              textKey="showcase.ai_receptionist.hero_tagline"
              defaultText="See our AI Receptionist in action"
            />
          </p>
        </div>
      </section>

      {/* Video grid section */}
      <section
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px 80px" }}
      >
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(to right, transparent, #1C1F33 30%, #1C1F33 70%, transparent)",
            marginBottom: "48px",
          }}
        />
        <h2
          style={{
            color: "#EEF0F8",
            fontSize: "1.5rem",
            fontWeight: "700",
            marginBottom: "32px",
            letterSpacing: "-0.01em",
          }}
        >
          <EditableText
            textKey="showcase.ai_receptionist.section_heading"
            defaultText="See It In Action"
          />
        </h2>
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
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                data-ocid={`showcase.ai_receptionist.item.${i + 1}`}
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
  );
}
