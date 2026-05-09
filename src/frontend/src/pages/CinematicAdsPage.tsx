import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Film,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { Product, backendInterface } from "../backend.d.ts";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/useCartStore";

// ─── Tier static metadata ─────────────────────────────────────────────────────
// backendName must match exactly what's seeded in main.mo

const CINEMATIC_TIERS = [
  {
    backendName: "Growth Protocol",
    displayName: "GROWTH PROTOCOL",
    badge: "One-Time",
    badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    tagline: "Launch your brand with a single cinematic asset.",
    isOneTime: true,
    priceNote: "one-time",
    popular: false,
    bullets: [
      "1 premium cinematic ad (15–60 seconds)",
      "Full motion graphics package",
      "2 revision rounds included",
      "Delivered within 5 business days",
      "Raw file + platform-ready exports",
    ],
    cta: "Get Started",
  },
  {
    backendName: "The Pilot",
    displayName: "THE PILOT",
    badge: "Quarterly",
    badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    tagline: "Perfect entry point into continuous cinematic production.",
    isOneTime: false,
    priceNote: "/quarter",
    popular: false,
    bullets: [
      "2 cinematic ads per quarter",
      "Motion graphics + sound design",
      "3 revision rounds per ad",
      "10-day delivery per creative",
      "Platform-ready exports (TikTok, IG, YouTube)",
    ],
    cta: "Start Quarterly Plan",
  },
  {
    backendName: "The Pro",
    displayName: "THE PRO",
    badge: "Most Popular",
    badgeColor: "text-[#5EF08A] bg-[#5EF08A]/10 border-[#5EF08A]/30",
    tagline: "For brands scaling content and testing creatives consistently.",
    isOneTime: false,
    priceNote: "/quarter",
    popular: true,
    bullets: [
      "4 cinematic ads per quarter",
      "Advanced color grading & VFX",
      "Unlimited revisions",
      "7-day delivery per creative",
      "Permanent Asset Vault — store and reuse assets",
      "Monthly strategy call",
    ],
    cta: "Start Quarterly Plan",
  },
  {
    backendName: "The Elite",
    displayName: "THE ELITE",
    badge: "Full Production",
    badgeColor: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    tagline: "Maximum output. Maximum performance. No creative limits.",
    isOneTime: false,
    priceNote: "/quarter",
    popular: false,
    bullets: [
      "6 cinematic ads per quarter",
      "Full cinematic VFX + 3D elements",
      "Unlimited revisions",
      "5-day delivery per creative",
      "Dedicated creative director",
      "Quarterly performance audit",
      "Priority support & direct Slack access",
    ],
    cta: "Start Quarterly Plan",
  },
];

function getProductPrice(p: Product): number {
  if (p.price_onetime != null && p.price_monthly == null)
    return p.price_onetime;
  if (p.price_monthly != null) return p.price_monthly;
  if (p.price_onetime != null) return p.price_onetime;
  if (p.price_annual != null) return p.price_annual;
  return 0;
}

export default function CinematicAdsPage() {
  const { addItem, openDrawer } = useCartStore();
  const { actor, isFetching } = useActor();

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

  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    (
      actor as unknown as {
        getProductsByType: (t: string) => Promise<Product[]>;
      }
    )
      .getProductsByType("Cinematic Ads")
      .then((result: Product[]) => {
        setBackendProducts(result);
        setCatalogLoaded(true);
      })
      .catch(() => {
        setCatalogLoaded(true);
      });
  }, [actor, isFetching]);

  const findProduct = (name: string): Product | undefined =>
    backendProducts.find((p) => p.name.toLowerCase() === name.toLowerCase());

  const getDisplayPrice = (backendName: string): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(backendName);
    if (!p) return "—";
    const val = getProductPrice(p);
    return `$${val.toLocaleString()}`;
  };

  const isTierActive = (backendName: string): boolean => {
    if (!catalogLoaded || backendProducts.length === 0) return true;
    return backendProducts.some(
      (p) => p.name.toLowerCase() === backendName.toLowerCase(),
    );
  };

  const visibleTiers = CINEMATIC_TIERS.filter((t) =>
    isTierActive(t.backendName),
  );

  const handleCheckout = (backendName: string, isOneTime: boolean) => {
    const p = findProduct(backendName);
    const priceStr = p
      ? `$${getProductPrice(p).toLocaleString()}${isOneTime ? "" : "/quarter"}`
      : "—";
    addItem({ name: backendName, price: priceStr });
    openDrawer();
  };

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white font-sans pb-24 selection:bg-[#5EF08A]/30">
      {/* STICKY BANNER */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 w-full bg-[#0A0B14]/90 backdrop-blur-md border-b border-[#5EF08A]/20 py-3"
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
          <Film className="w-5 h-5 text-[#5EF08A]" />
          <p className="text-sm md:text-base font-medium text-white/90 text-center">
            <span className="text-[#5EF08A] font-bold mr-2">
              <EditableText
                textKey="cinematic-ads.banner.label"
                defaultText="CINEMATIC ADS:"
                as="span"
              />
            </span>
            <EditableText
              textKey="cinematic-ads.banner.tagline"
              defaultText="Stop the scroll. Engineer attention. Convert at scale."
              as="span"
            />
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[#5EF08A] transition-colors duration-300 mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <EditableText
            textKey="cinematic-ads.back-link"
            defaultText="Back to Services Dashboard"
            as="span"
          />
        </Link>

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5EF08A]/10 border border-[#5EF08A]/20 text-[#5EF08A] text-sm font-bold uppercase tracking-wide mb-6">
            <Sparkles className="w-4 h-4" />
            <EditableText
              textKey="cinematic-ads.hero.eyebrow"
              defaultText="Cinematic Production"
              as="span"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            <EditableText
              textKey="cinematic-ads.hero.heading-line1"
              defaultText="Ads That Don't Just Look Good."
              as="span"
            />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5EF08A] to-white">
              <EditableText
                textKey="cinematic-ads.hero.heading-accent"
                defaultText="Ads That Convert."
                as="span"
              />
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed mb-8">
            <EditableText
              textKey="cinematic-ads.hero.subheading"
              defaultText="Every Imperidome cinematic ad is engineered to stop the scroll in the first 1–3 seconds. Hyper-detailed visuals, precision-timed sound, and platform-native pacing for TikTok, Instagram, and paid media."
              as="span"
            />
          </p>

          <div className="flex flex-col md:flex-row gap-4 md:gap-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Zap className="w-4 h-4 text-[#5EF08A]" />
              <EditableText
                textKey="cinematic-ads.hero.feature-1"
                defaultText="Cinematic quality, rapid delivery"
                as="span"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <TrendingUp className="w-4 h-4 text-[#5EF08A]" />
              <EditableText
                textKey="cinematic-ads.hero.feature-2"
                defaultText="Built to drive conversions"
                as="span"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Film className="w-4 h-4 text-[#5EF08A]" />
              <EditableText
                textKey="cinematic-ads.hero.feature-3"
                defaultText="Platform-native pacing"
                as="span"
              />
            </div>
          </div>
        </motion.div>

        {/* TIER GRID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-24"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {visibleTiers.map((tier, i) => {
              const displayPrice = getDisplayPrice(tier.backendName);
              return (
                <motion.div
                  key={tier.backendName}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  whileHover={{
                    y: -4,
                    boxShadow: tier.popular
                      ? "0 20px 40px -10px rgba(94,240,138,0.2)"
                      : "0 10px 30px -10px rgba(255,255,255,0.05)",
                  }}
                  className={`flex flex-col rounded-3xl p-8 relative transition-all duration-300 ${
                    tier.popular
                      ? "bg-gradient-to-b from-[#0A0B14] to-[#5EF08A]/5 border-2 border-[#5EF08A] shadow-[0_0_30px_rgba(94,240,138,0.08)]"
                      : "bg-white/5 backdrop-blur-xl border border-white/10"
                  }`}
                  data-ocid={`cinematic-ads.tier_${tier.backendName.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5EF08A] text-[#0A0B14] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(94,240,138,0.4)]">
                      <EditableText
                        textKey="cinematic-ads.popular-badge"
                        defaultText="Most Popular"
                        as="span"
                      />
                    </div>
                  )}

                  {/* BADGE */}
                  <span
                    className={`self-start text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-4 ${tier.badgeColor}`}
                  >
                    <EditableText
                      textKey={`cinematic-ads.${tier.backendName.toLowerCase().replace(/\s+/g, "-")}.badge`}
                      defaultText={tier.badge}
                      as="span"
                    />
                  </span>

                  {/* PRICE */}
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-white mb-3">
                      <EditableText
                        textKey={`cinematic-ads.${tier.backendName.toLowerCase().replace(/\s+/g, "-")}.name`}
                        defaultText={tier.displayName}
                        as="span"
                      />
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-[#5EF08A]">
                        {displayPrice}
                      </span>
                      <span className="text-gray-400 text-sm font-normal">
                        <EditableText
                          textKey={`cinematic-ads.${tier.backendName.toLowerCase().replace(/\s+/g, "-")}.price-note`}
                          defaultText={tier.priceNote}
                          as="span"
                        />
                      </span>
                    </div>
                  </div>

                  <p
                    className={`italic text-sm mb-6 pb-6 border-b border-white/10 ${tier.popular ? "text-[#5EF08A]" : "text-gray-400"}`}
                  >
                    "
                    <EditableText
                      textKey={`cinematic-ads.${tier.backendName.toLowerCase().replace(/\s+/g, "-")}.tagline`}
                      defaultText={tier.tagline}
                      as="span"
                    />
                    "
                  </p>

                  <ul className="flex-grow space-y-3 mb-8">
                    {tier.bullets.map((bullet, bi) => (
                      <li
                        key={bullet.slice(0, 24)}
                        className="flex items-start gap-3 text-sm text-gray-300 leading-tight"
                      >
                        <CheckCircle2
                          className={`w-5 h-5 shrink-0 mt-0.5 ${tier.popular ? "text-[#5EF08A]" : "text-gray-500"}`}
                        />
                        <EditableText
                          textKey={`cinematic-ads.${tier.backendName.toLowerCase().replace(/\s+/g, "-")}.bullet-${bi + 1}`}
                          defaultText={bullet}
                          as="span"
                        />
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    type="button"
                    onClick={() =>
                      handleCheckout(tier.backendName, tier.isOneTime)
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full font-bold py-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 ${
                      tier.popular
                        ? "bg-[#5EF08A] text-[#0A0B14] hover:bg-[#4ade80] shadow-[0_0_20px_rgba(94,240,138,0.3)]"
                        : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    }`}
                    data-ocid={`cinematic-ads.cta_${tier.backendName.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <EditableText
                      textKey={`cinematic-ads.${tier.backendName.toLowerCase().replace(/\s+/g, "-")}.cta`}
                      defaultText={tier.cta}
                      as="span"
                    />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* NOTE ON BILLING CADENCE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 bg-white/5 border border-white/10 rounded-2xl p-8 text-center max-w-3xl mx-auto"
        >
          <p className="text-gray-400 text-sm leading-relaxed">
            <span className="text-white font-semibold">
              <EditableText
                textKey="cinematic-ads.billing-note.quarterly-label"
                defaultText="Quarterly plans"
                as="span"
              />
            </span>{" "}
            <EditableText
              textKey="cinematic-ads.billing-note.quarterly-desc"
              defaultText="are billed every 4 months. You receive your ad deliverables throughout the quarter with the cadence outlined in your tier."
              as="span"
            />{" "}
            <span className="text-[#5EF08A] font-semibold">
              <EditableText
                textKey="cinematic-ads.billing-note.onetime-label"
                defaultText="Growth Protocol"
                as="span"
              />
            </span>{" "}
            <EditableText
              textKey="cinematic-ads.billing-note.onetime-desc"
              defaultText="is a one-time charge — no recurring commitment."
              as="span"
            />
          </p>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
