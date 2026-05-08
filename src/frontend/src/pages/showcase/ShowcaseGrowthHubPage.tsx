import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createActor } from "../../backend";
import { EditableText } from "../../components/EditableText";
import { Footer } from "../../components/Footer";
import { Navbar } from "../../components/Navbar";
import { VideoCard } from "../../components/VideoCard";
import { createActorWithConfig } from "../../config";
import { useSiteTextStore } from "../../store/useSiteTextStore";

const PLACEHOLDER_CARDS = [
  {
    title: "Local SEO Campaign",
    description: "Client ranking #1 in local Google searches within 60 days.",
    videoKey: "showcase_growth_hub_video_1",
  },
  {
    title: "Google Ads Management",
    description: "Managed campaign delivering 4.2x ROAS for a restaurant.",
    videoKey: "showcase_growth_hub_video_2",
  },
  {
    title: "Lead Capture Upgrade",
    description: "Exit-intent popups tripling lead form submissions.",
    videoKey: "showcase_growth_hub_video_3",
  },
  {
    title: "Review Generation System",
    description: "Automated review requests growing Google rating to 4.9.",
    videoKey: "showcase_growth_hub_video_4",
  },
  {
    title: "PWA Upgrade in Action",
    description: "Site converted to an installable Progressive Web App.",
    videoKey: "showcase_growth_hub_video_5",
  },
  {
    title: "Annual Site Refresh",
    description: "Full homepage and top-3 pages redesign delivered.",
    videoKey: "showcase_growth_hub_video_6",
  },
];

export default function ShowcaseGrowthHubPage() {
  const navigate = useNavigate();
  const { fetchAllSiteText, getText } = useSiteTextStore();
  const [siteTextLoaded, setSiteTextLoaded] = useState(false);

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
          data-ocid="showcase.growth_hub.back_button"
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
              textKey="showcase.growth_hub.eyebrow"
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
              textKey="showcase.growth_hub.hero_title"
              defaultText="Growth Hub"
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
              textKey="showcase.growth_hub.hero_tagline"
              defaultText="See our Growth Hub in action"
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
            textKey="showcase.growth_hub.section_heading"
            defaultText="See It In Action"
          />
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
          data-ocid="showcase.growth_hub.list"
        >
          {PLACEHOLDER_CARDS.map((card, i) => {
            const videoUrl = siteTextLoaded ? getText(card.videoKey, "") : "";
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                data-ocid={`showcase.growth_hub.item.${i + 1}`}
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
