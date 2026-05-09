import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { Product, backendInterface } from "../backend.d.ts";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/useCartStore";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    num: "01",
    title: "Built for Attention First",
    desc: "Every Imperidome ad is designed around one goal: stopping the scroll. We create hyper-detailed macro visuals, dynamic material interactions (liquid, glass, metal, fabric), and cinematic lighting and motion. These aren't random effects — they're strategically designed to trigger curiosity in the first 1–3 seconds.",
  },
  {
    num: "02",
    title: "Perfect Product Consistency at Any Scale",
    desc: "Scaling content usually breaks quality. Not here. Our proprietary Product Identity Lock ensures: Exact product accuracy in every frame, consistent branding, colors, and proportions, and seamless variations across multiple ads. Whether you run 1 creative or 100, your product always looks exactly right.",
  },
  {
    num: "03",
    title: "Designed to Convert — Not Just Look Good",
    desc: "Most 'cool' ads don't make money. Imperidome ads are structured for performance: Fast hooks (0–3 seconds), pattern interrupts that hold attention, loopable endings that increase watch time, and platform-native pacing for TikTok & Reels. Every creative is built to drive results, not just impressions.",
  },
  {
    num: "04",
    title: "Studio-Level Quality Without the Studio Bottlenecks",
    desc: "Traditional production is slow, expensive, and hard to scale. Imperidome gives you: Premium, cinematic visuals, rapid turnaround (24–48 hours), and the ability to test and iterate continuously. No long timelines. No production delays. No creative limits.",
  },
  {
    num: "05",
    title: "Sound That Makes the Visuals Hit Harder",
    desc: "Great visuals alone aren't enough. Every Imperidome ad includes precision-timed sound design, impact-driven audio cues, and platform-optimized mixing. Because the difference between a good ad and a great one is how it feels.",
  },
];

// Static tier metadata — prices are fetched live from backend
const TIER_META = [
  {
    id: "flash",
    backendName: "Flash",
    emoji: "⚡",
    title: 'One-Time "Flash"',
    tag: "One-Time",
    desc: "Perfect for testing or launching a new product.",
    features: [
      "1x 15-second Ultra-HD product ad",
      "Delivered in 48 hours",
      "1 revision round",
    ],
    cta: "Secure Your Retainer",
    featured: false,
    isMonthly: false,
  },
  {
    id: "starter",
    backendName: "Starter",
    emoji: "🚀",
    title: '"Starter"',
    tag: "Monthly",
    desc: "For brands ready to test and optimize.",
    features: [
      "3x 15-second high-performance ads",
      "24-hour turnaround",
      "2 revision rounds",
    ],
    cta: "Secure Your Retainer",
    featured: false,
    isMonthly: true,
  },
  {
    id: "scale",
    backendName: "Scale",
    emoji: "📈",
    title: '"Scale"',
    tag: "Most Popular",
    desc: "Built for aggressive growth.",
    features: [
      "5x 15-second ads",
      "12–24 hour delivery",
      "Unlimited revisions",
      "Permanent Asset Vault — assets stored and ready for instant future variations.",
    ],
    cta: "Secure Your Retainer",
    featured: true,
    isMonthly: true,
  },
  {
    id: "custom",
    backendName: "Custom Projects",
    emoji: "🎬",
    title: "Custom Projects",
    tag: "Custom",
    desc: "For larger campaigns and storytelling.",
    features: [
      "30–60+ second ads",
      "Batch production",
      "Fully customized creative direction",
    ],
    cta: "Contact Us",
    featured: false,
    isMonthly: false,
  },
];

// ─── Inline styles ─────────────────────────────────────────────────────────────

const glass: React.CSSProperties = {
  background: "rgba(17,19,34,0.72)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
};

const mintBtn: React.CSSProperties = {
  background: "#5EF08A",
  color: "#0A0B14",
  fontWeight: "700",
  fontSize: "1rem",
  padding: "14px 36px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  transition: "opacity 0.15s, box-shadow 0.2s",
  display: "inline-block",
};

const outlineBtn: React.CSSProperties = {
  background: "transparent",
  color: "#5EF08A",
  fontWeight: "700",
  fontSize: "0.95rem",
  padding: "12px 28px",
  borderRadius: "10px",
  border: "1px solid rgba(94,240,138,0.5)",
  cursor: "pointer",
  transition: "opacity 0.15s, box-shadow 0.2s",
  width: "100%",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getProductPrice(p: Product): number {
  if (p.price_monthly != null) return p.price_monthly;
  if (p.price_onetime != null) return p.price_onetime;
  if (p.price_annual != null) return p.price_annual;
  return 0;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ProductAdsPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const { addItem, openDrawer } = useCartStore();

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
          window.location.pathname,
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid!,
          countryCode,
        );
      } catch {
        // silent
      }
    };
    track();
  }, []);

  // Live backend products for this category
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    (
      actor as unknown as {
        getProductsByType: (t: string) => Promise<Product[]>;
      }
    )
      .getProductsByType("Product Ads")
      .then((result: Product[]) => {
        // Only keep Product Ads category so name matches are unambiguous
        setBackendProducts(result);
        setCatalogLoaded(true);
      })
      .catch(() => {
        setCatalogLoaded(true);
      });
  }, [actor, isFetching]);

  /** Find a backend product by name (case-insensitive) */
  const findProduct = (backendName: string): Product | undefined =>
    backendProducts.find(
      (p) => p.name.toLowerCase() === backendName.toLowerCase(),
    );

  /** Return formatted price string for a tier; "..." while loading */
  const getDisplayPrice = (tier: (typeof TIER_META)[0]): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(tier.backendName);
    if (!p) return "—";
    const val = getProductPrice(p);
    if (tier.id === "custom") return `From $${val.toLocaleString()}`;
    if (tier.isMonthly) return `$${val.toLocaleString()}`;
    return `$${val.toLocaleString()}`;
  };

  const getPriceNote = (tier: (typeof TIER_META)[0]): string => {
    if (tier.id === "custom") return "";
    if (tier.isMonthly) return "/month";
    return "one-time";
  };

  /** Determine if a tier is active (admin toggle respected) */
  const isTierActive = (backendName: string): boolean => {
    if (!catalogLoaded || backendProducts.length === 0) return true; // fail open
    return backendProducts.some(
      (p) => p.name.toLowerCase() === backendName.toLowerCase(),
    );
  };

  const visibleTiers = TIER_META.filter((t) => isTierActive(t.backendName));

  // Redirect to homepage when the entire Product Ads category is toggled off
  useEffect(() => {
    if (
      catalogLoaded &&
      backendProducts.length === 0 &&
      visibleTiers.length === 0
    ) {
      navigate({ to: "/" });
    }
  }, [catalogLoaded, backendProducts.length, visibleTiers.length, navigate]);

  const goStart = (tierId?: string) => {
    if (!tierId || tierId === "custom") {
      navigate({
        to: "/get-started",
        search: { service: "product-lab" },
      });
      return;
    }
    // Wire Stripe checkout via the cart
    const tier = TIER_META.find((t) => t.id === tierId);
    if (!tier) return;
    const p = findProduct(tier.backendName);
    const priceStr = p
      ? `$${getProductPrice(p).toLocaleString()}${tier.isMonthly ? "/mo" : " one-time"}`
      : "—";
    addItem({ name: tier.backendName, price: priceStr });
    openDrawer();
  };

  return (
    <div style={{ background: "#0A0B14", minHeight: "100vh" }}>
      {/* Keyframe animations */}
      <style>{`
        @keyframes gradientShift {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50%  { transform: translate(-50%, -50%) scale(1.18); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
        }
        @keyframes gradientShift2 {
          0%   { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
          50%  { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
        }
        .feature-card:hover {
          border-color: rgba(94,240,138,0.22) !important;
          box-shadow: 0 0 28px rgba(94,240,138,0.06);
          transform: translateY(-3px);
        }
        .feature-card {
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
      `}</style>

      <Navbar />
      <div style={{ height: "68px" }} aria-hidden="true" />

      {/* Back button */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[#5EF08A] transition-colors duration-300 mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <EditableText
            textKey="product-ads.back-link"
            defaultText="Back to Services Dashboard"
          />
        </Link>
      </div>

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
          padding: "100px 24px 90px",
        }}
      >
        {/* Animated glow blobs */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "800px",
            height: "500px",
            background:
              "radial-gradient(ellipse, rgba(94,240,138,0.07) 0%, transparent 65%)",
            animation: "gradientShift 7s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "30%",
            left: "35%",
            width: "600px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(147,51,234,0.06) 0%, transparent 65%)",
            animation: "gradientShift2 9s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "820px",
            margin: "0 auto",
          }}
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span
              style={{
                display: "inline-block",
                background: "rgba(94,240,138,0.1)",
                border: "1px solid rgba(94,240,138,0.3)",
                color: "#5EF08A",
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "5px 16px",
                borderRadius: "9999px",
                marginBottom: "28px",
              }}
            >
              <EditableText
                textKey="product-ads.hero.eyebrow"
                defaultText="Cinematic Product Advertising"
              />
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            style={{
              color: "#EEF0F8",
              fontSize: "clamp(2.6rem, 6vw, 4.2rem)",
              fontWeight: "900",
              letterSpacing: "-0.03em",
              lineHeight: "1.08",
              marginBottom: "20px",
            }}
          >
            <EditableText
              textKey="product-ads.hero.heading"
              defaultText="Imperidome Product Ads"
            />
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            style={{
              color: "#5EF08A",
              fontSize: "clamp(1.25rem, 3vw, 1.9rem)",
              fontWeight: "700",
              letterSpacing: "-0.01em",
              lineHeight: "1.25",
              marginBottom: "28px",
            }}
          >
            <EditableText
              textKey="product-ads.hero.subheading"
              defaultText="Turn Your Product Into Scroll-Stopping Content"
            />
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26 }}
            style={{
              color: "#9DA0B3",
              fontSize: "1.1rem",
              lineHeight: "1.75",
              maxWidth: "640px",
              margin: "0 auto 36px",
            }}
          >
            <EditableText
              textKey="product-ads.hero.description"
              defaultText="Most ads fail in the first 2 seconds. Imperidome makes sure yours don't. We create cinematic, high-performance product ads engineered to capture attention instantly and convert across TikTok, Instagram, and paid media."
            />
          </motion.p>

          {/* Hook text */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            style={{
              ...glass,
              display: "inline-block",
              maxWidth: "600px",
              padding: "24px 32px",
              marginBottom: "44px",
              textAlign: "left",
            }}
          >
            <p
              style={{
                color: "#7A7D90",
                fontSize: "1rem",
                fontStyle: "italic",
                lineHeight: "1.8",
                marginBottom: "12px",
              }}
            >
              <EditableText
                textKey="product-ads.hero.hook-text"
                defaultText="Think liquid metal wrapping around your product. Light bending through glass. Textures so detailed your audience can feel them through the screen."
              />
            </p>
            <p
              style={{
                color: "#5EF08A",
                fontSize: "0.95rem",
                fontWeight: "600",
                letterSpacing: "0.02em",
              }}
            >
              <EditableText
                textKey="product-ads.hero.hook-tagline"
                defaultText="This isn't content creation. This is attention engineering."
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        style={{
          background: "rgba(11,12,21,0.95)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "96px 24px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                color: "#EEF0F8",
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                fontWeight: "800",
                letterSpacing: "-0.02em",
                marginBottom: "14px",
              }}
            >
              <EditableText
                textKey="product-ads.features.heading"
                defaultText="What Makes Imperidome Different"
              />
            </motion.h2>
            <p
              style={{
                color: "#7A7D90",
                fontSize: "1.05rem",
                maxWidth: "480px",
                margin: "0 auto",
              }}
            >
              <EditableText
                textKey="product-ads.features.subheading"
                defaultText="Every decision engineered for performance. Every frame built to convert."
              />
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.num}
                className="feature-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                style={{
                  ...glass,
                  padding: "32px 28px",
                }}
                data-ocid={`product-ads.feature_${f.num}`}
              >
                <div
                  style={{
                    color: "#5EF08A",
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    letterSpacing: "0.12em",
                    marginBottom: "14px",
                    fontFamily: "monospace",
                  }}
                >
                  {f.num}
                </div>
                <h3
                  style={{
                    color: "#EEF0F8",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    marginBottom: "12px",
                    lineHeight: "1.3",
                  }}
                >
                  <EditableText
                    textKey={`product-ads.features.card${f.num}.title`}
                    defaultText={f.title}
                  />
                </h3>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "0.9rem",
                    lineHeight: "1.7",
                  }}
                >
                  <EditableText
                    textKey={`product-ads.features.card${f.num}.description`}
                    defaultText={f.desc}
                  />
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: "96px 24px", background: "#0A0B14" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                color: "#EEF0F8",
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                fontWeight: "800",
                letterSpacing: "-0.02em",
                marginBottom: "14px",
              }}
            >
              <EditableText
                textKey="product-ads.pricing.heading"
                defaultText="Choose Your Plan"
              />
            </motion.h2>
            <p
              style={{
                color: "#7A7D90",
                fontSize: "1.05rem",
                maxWidth: "480px",
                margin: "0 auto",
              }}
            >
              <EditableText
                textKey="product-ads.pricing.subheading"
                defaultText="One ad or a hundred — pick the tier that matches your growth."
              />
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
              gap: "24px",
              alignItems: "start",
            }}
          >
            {visibleTiers.map((plan, i) => {
              const displayPrice = getDisplayPrice(plan);
              const priceNote = getPriceNote(plan);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  style={{
                    ...glass,
                    position: "relative",
                    padding: "32px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    border: plan.featured
                      ? "1px solid rgba(94,240,138,0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: plan.featured
                      ? "0 0 40px rgba(94,240,138,0.12)"
                      : "none",
                    transform: plan.featured ? "scale(1.025)" : "scale(1)",
                  }}
                  data-ocid={`product-ads.pricing_${plan.id}`}
                >
                  {/* Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem" }}>{plan.emoji}</span>
                    <span
                      style={{
                        background: plan.featured
                          ? "rgba(94,240,138,0.15)"
                          : "rgba(255,255,255,0.05)",
                        color: plan.featured ? "#5EF08A" : "#7A7D90",
                        fontSize: "0.68rem",
                        fontWeight: "700",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        border: plan.featured
                          ? "1px solid rgba(94,240,138,0.35)"
                          : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <EditableText
                        textKey={`product-ads.tier-${plan.id}.tag`}
                        defaultText={plan.tag}
                        as="span"
                      />
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3
                      style={{
                        color: "#EEF0F8",
                        fontSize: "1.2rem",
                        fontWeight: "800",
                        marginBottom: "4px",
                      }}
                    >
                      <EditableText
                        textKey={`product-ads.tier-${plan.id}.title`}
                        defaultText={plan.title}
                      />
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "#5EF08A",
                          fontSize: "2rem",
                          fontWeight: "800",
                          lineHeight: "1",
                        }}
                      >
                        {displayPrice}
                      </span>
                      {priceNote && (
                        <span style={{ color: "#7A7D90", fontSize: "0.88rem" }}>
                          <EditableText
                            textKey={`product-ads.tier-${plan.id}.price-note`}
                            defaultText={priceNote}
                            as="span"
                          />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      color: "#9DA0B3",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                    }}
                  >
                    <EditableText
                      textKey={`product-ads.tier-${plan.id}.description`}
                      defaultText={plan.desc}
                    />
                  </p>

                  {/* Features */}
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
                    {plan.features.map((feat, fi) => (
                      <li
                        key={feat}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          color: feat.startsWith("Permanent")
                            ? "#5EF08A"
                            : "#7A7D90",
                          fontSize: "0.875rem",
                          lineHeight: "1.5",
                          fontWeight: feat.startsWith("Permanent")
                            ? "600"
                            : "400",
                        }}
                      >
                        <span
                          style={{
                            color: "#5EF08A",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          ✓
                        </span>
                        <EditableText
                          textKey={`product-ads.tier-${plan.id}.feature-${fi + 1}`}
                          defaultText={feat}
                          as="span"
                        />
                      </li>
                    ))}
                  </ul>

                  <div style={{ flex: 1 }} />

                  {/* CTA */}
                  <motion.button
                    type="button"
                    onClick={() => goStart(plan.id)}
                    whileHover={{
                      boxShadow: plan.featured
                        ? "0 0 24px rgba(94,240,138,0.45)"
                        : "0 0 14px rgba(94,240,138,0.2)",
                    }}
                    style={
                      plan.featured
                        ? { ...mintBtn, width: "100%", padding: "13px 24px" }
                        : { ...outlineBtn }
                    }
                    data-ocid={`product-ads.cta_${plan.id}`}
                  >
                    <EditableText
                      textKey={`product-ads.tier-${plan.id}.cta`}
                      defaultText={plan.cta}
                      as="span"
                    />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section
        style={{
          background: "rgba(11,12,21,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "96px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Divider dot */}
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#5EF08A",
                margin: "0 auto 32px",
                boxShadow: "0 0 16px rgba(94,240,138,0.7)",
              }}
            />
            <h2
              style={{
                color: "#EEF0F8",
                fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                fontWeight: "800",
                letterSpacing: "-0.02em",
                lineHeight: "1.2",
                marginBottom: "16px",
              }}
            >
              <EditableText
                textKey="product-ads.cta.heading"
                defaultText="Ready to stop the scroll?"
              />
            </h2>
            <p
              style={{
                color: "#7A7D90",
                fontSize: "1.05rem",
                marginBottom: "36px",
                lineHeight: "1.6",
              }}
            >
              <EditableText
                textKey="product-ads.cta.description"
                defaultText="Launch your first cinematic product ad and see what attention engineering can do for your brand."
              />
            </p>
            <motion.button
              type="button"
              onClick={() => goStart()}
              whileHover={{
                opacity: 0.88,
                boxShadow: "0 0 32px rgba(94,240,138,0.5)",
              }}
              style={mintBtn}
              data-ocid="product-ads.bottom_cta"
            >
              <EditableText
                textKey="product-ads.cta.button"
                defaultText="Start Your First Ad"
                as="span"
              />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
