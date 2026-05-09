import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Hammer,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { Product, backendInterface } from "../backend.d.ts";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/useCartStore";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

// Backend names match exactly what's seeded in main.mo
const speedyTiers = [
  {
    name: "SPEEDY BASIC",
    nameKey: "speedy-sites.tier-speedy-basic.name",
    backendName: "Speedy Basic",
    structure: "1 Page (Long-scroll)",
    structureKey: "speedy-sites.tier-speedy-basic.structure",
    tagline: "The fastest way to look legitimate online.",
    taglineKey: "speedy-sites.tier-speedy-basic.tagline",
    bestFor: "Solo contractors, new businesses, portfolios",
    bestForKey: "speedy-sites.tier-speedy-basic.best-for",
    includes: [
      { text: "Hero/Header", key: "speedy-sites.tier-speedy-basic.include-1" },
      { text: "About", key: "speedy-sites.tier-speedy-basic.include-2" },
      { text: "Services", key: "speedy-sites.tier-speedy-basic.include-3" },
      { text: "Testimonials", key: "speedy-sites.tier-speedy-basic.include-4" },
      { text: "Contact Form", key: "speedy-sites.tier-speedy-basic.include-5" },
    ],
    upgradeTrigger:
      "👉 Upgrade to a Custom Authority Site to rank on Google and capture more leads.",
    upgradeTriggerKey: "speedy-sites.tier-speedy-basic.upgrade-trigger",
    requires: "Speedy Basic Plan",
    requiresKey: "speedy-sites.tier-speedy-basic.requires",
    cta: "Launch This Site in 48 Hours",
    ctaKey: "speedy-sites.tier-speedy-basic.cta",
  },
  {
    name: "SPEEDY BOOKING",
    nameKey: "speedy-sites.tier-speedy-booking.name",
    backendName: "Speedy Booking",
    structure: "2 Pages (Landing + Booking)",
    structureKey: "speedy-sites.tier-speedy-booking.structure",
    tagline: "Get booked without back-and-forth messaging.",
    taglineKey: "speedy-sites.tier-speedy-booking.tagline",
    bestFor: undefined,
    bestForKey: undefined,
    includes: [
      {
        text: "Everything in Basic",
        key: "speedy-sites.tier-speedy-booking.include-1",
      },
      {
        text: "Booking page",
        key: "speedy-sites.tier-speedy-booking.include-2",
      },
      {
        text: "Calendar logic",
        key: "speedy-sites.tier-speedy-booking.include-3",
      },
    ],
    upgradeTrigger:
      "👉 Upgrade to Booking Pro for CRM, automation, and client tracking.",
    upgradeTriggerKey: "speedy-sites.tier-speedy-booking.upgrade-trigger",
    requires: "Speedy Booking Plan",
    requiresKey: "speedy-sites.tier-speedy-booking.requires",
    cta: "Launch This Site in 48 Hours",
    ctaKey: "speedy-sites.tier-speedy-booking.cta",
  },
  {
    name: "SPEEDY PRODUCT STOREFRONT",
    nameKey: "speedy-sites.tier-speedy-product-storefront.name",
    backendName: "Speedy Product Storefront",
    structure: "3 Pages (Landing + Grid + Checkout)",
    structureKey: "speedy-sites.tier-speedy-product-storefront.structure",
    tagline: "Sell products without the Shopify tax.",
    taglineKey: "speedy-sites.tier-speedy-product-storefront.tagline",
    bestFor: undefined,
    bestForKey: undefined,
    includes: [
      {
        text: "Everything in Basic",
        key: "speedy-sites.tier-speedy-product-storefront.include-1",
      },
      {
        text: "Stripe checkout",
        key: "speedy-sites.tier-speedy-product-storefront.include-2",
      },
      {
        text: "First 10 products built (Max 30)",
        key: "speedy-sites.tier-speedy-product-storefront.include-3",
      },
    ],
    upgradeTrigger:
      "👉 Unlock search, filters, and scale with Digital Storefront.",
    upgradeTriggerKey:
      "speedy-sites.tier-speedy-product-storefront.upgrade-trigger",
    requires: "Storefront Plan",
    requiresKey: "speedy-sites.tier-speedy-product-storefront.requires",
    cta: "Launch This Site in 48 Hours",
    ctaKey: "speedy-sites.tier-speedy-product-storefront.cta",
  },
  {
    name: "SPEEDY MENU STOREFRONT",
    nameKey: "speedy-sites.tier-speedy-menu-storefront.name",
    backendName: "Speedy Menu Storefront",
    structure: "3 Pages (Menu + Checkout)",
    structureKey: "speedy-sites.tier-speedy-menu-storefront.structure",
    tagline: "Commission-free online ordering. Your menu. Your money.",
    taglineKey: "speedy-sites.tier-speedy-menu-storefront.tagline",
    bestFor: undefined,
    bestForKey: undefined,
    includes: [
      {
        text: "Everything in Basic",
        key: "speedy-sites.tier-speedy-menu-storefront.include-1",
      },
      {
        text: "Online ordering",
        key: "speedy-sites.tier-speedy-menu-storefront.include-2",
      },
      {
        text: "First 10 menu items built (Max 50)",
        key: "speedy-sites.tier-speedy-menu-storefront.include-3",
      },
    ],
    upgradeTrigger: "👉 Upgrade to Restaurant Pro for advanced menu systems.",
    upgradeTriggerKey:
      "speedy-sites.tier-speedy-menu-storefront.upgrade-trigger",
    requires: "Storefront Plan",
    requiresKey: "speedy-sites.tier-speedy-menu-storefront.requires",
    cta: "Launch This Site in 48 Hours",
    ctaKey: "speedy-sites.tier-speedy-menu-storefront.cta",
  },
  {
    name: "SPEEDY RECURRING STOREFRONT",
    nameKey: "speedy-sites.tier-speedy-recurring-storefront.name",
    backendName: "Speedy Recurring Storefront",
    structure: "3 Pages (Pricing + Checkout)",
    structureKey: "speedy-sites.tier-speedy-recurring-storefront.structure",
    tagline: "Turn one-time buyers into monthly revenue.",
    taglineKey: "speedy-sites.tier-speedy-recurring-storefront.tagline",
    bestFor: undefined,
    bestForKey: undefined,
    includes: [
      {
        text: "Subscription billing",
        key: "speedy-sites.tier-speedy-recurring-storefront.include-1",
      },
      {
        text: "3 tiers built",
        key: "speedy-sites.tier-speedy-recurring-storefront.include-2",
      },
      {
        text: "Max 7 tiers",
        key: "speedy-sites.tier-speedy-recurring-storefront.include-3",
      },
    ],
    upgradeTrigger: "👉 Upgrade to Membership Engine for full automation.",
    upgradeTriggerKey:
      "speedy-sites.tier-speedy-recurring-storefront.upgrade-trigger",
    requires: "Storefront Plan",
    requiresKey: "speedy-sites.tier-speedy-recurring-storefront.requires",
    cta: "Launch This Site in 48 Hours",
    ctaKey: "speedy-sites.tier-speedy-recurring-storefront.cta",
  },
];

// Hosting plan backend names as seeded
const hostingPlans = [
  {
    backendName: "Basic Plan",
    displayName: "Basic Plan",
    displayNameKey: "speedy-sites.plan-basic.name",
    features: [
      { text: "Hosting", key: "speedy-sites.plan-basic.feature-1" },
      { text: "SSL", key: "speedy-sites.plan-basic.feature-2" },
      { text: "Forms", key: "speedy-sites.plan-basic.feature-3" },
      { text: "Analytics", key: "speedy-sites.plan-basic.feature-4" },
    ],
  },
  {
    backendName: "Booking Plan",
    displayName: "Booking Plan",
    displayNameKey: "speedy-sites.plan-booking.name",
    features: [
      { text: "Booking engine", key: "speedy-sites.plan-booking.feature-1" },
      { text: "Calendar", key: "speedy-sites.plan-booking.feature-2" },
      { text: "Notifications", key: "speedy-sites.plan-booking.feature-3" },
    ],
  },
  {
    backendName: "Storefront Plan",
    displayName: "Storefront Plan",
    displayNameKey: "speedy-sites.plan-storefront.name",
    features: [
      { text: "Stripe", key: "speedy-sites.plan-storefront.feature-1" },
      { text: "Dashboard", key: "speedy-sites.plan-storefront.feature-2" },
      { text: "Orders", key: "speedy-sites.plan-storefront.feature-3" },
      { text: "Analytics", key: "speedy-sites.plan-storefront.feature-4" },
    ],
  },
];

function getProductPrice(p: Product): number {
  if (p.price_monthly != null) return p.price_monthly;
  if (p.price_onetime != null) return p.price_onetime;
  if (p.price_annual != null) return p.price_annual;
  return 0;
}

export default function SpeedySitesDetail() {
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

  // Live backend products for this category
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    // Fetch Speedy Sites + SaaS Plans (hosting plans live in SaaS)
    Promise.all([
      (
        actor as unknown as {
          getProductsByType: (t: string) => Promise<Product[]>;
        }
      ).getProductsByType("Speedy Sites"),
      (
        actor as unknown as {
          getProductsByType: (t: string) => Promise<Product[]>;
        }
      ).getProductsByType("SaaS Plans"),
    ])
      .then(([speedy, saas]) => {
        setBackendProducts([...speedy, ...saas]);
        setCatalogLoaded(true);
      })
      .catch(() => {
        setCatalogLoaded(true);
      });
  }, [actor, isFetching]);

  /** Find a backend product by exact name (case-insensitive) */
  const findProduct = (name: string): Product | undefined =>
    backendProducts.find((p) => p.name.toLowerCase() === name.toLowerCase());

  /** Return "From $<price>" for Speedy one-time products; "..." while loading */
  const getTierDisplayPrice = (backendName: string): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(backendName);
    if (!p) return "—";
    return `From $${getProductPrice(p).toLocaleString()}`;
  };

  /** Return "$<price>/mo" for hosting plans; "..." while loading */
  const getPlanDisplayPrice = (backendName: string): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(backendName);
    if (!p) return "—";
    return `$${getProductPrice(p).toLocaleString()}/mo`;
  };

  // Returns true if the product is active (fail open until catalog loads)
  const isTierActive = (backendName: string) =>
    !catalogLoaded ||
    backendProducts.length === 0 ||
    backendProducts.some(
      (p) => p.name.toLowerCase() === backendName.toLowerCase(),
    );

  const visibleTiers = speedyTiers.filter((tier) =>
    isTierActive(tier.backendName),
  );

  return (
    <>
      <div className="min-h-screen bg-[#0A0B14] text-white font-sans pb-24 selection:bg-[#5EF08A]/30">
        {/* URGENCY BANNER */}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-50 w-full bg-[#0A0B14]/90 backdrop-blur-md border-b border-[#5EF08A]/20 py-3"
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#5EF08A]" />
            <p className="text-sm md:text-base font-medium text-white/90 text-center">
              <span className="text-[#5EF08A] font-bold mr-2">
                <EditableText
                  textKey="speedy-sites.banner.label"
                  defaultText="🔥 48-Hour Deployment Pipeline:"
                  as="span"
                />
              </span>
              <EditableText
                textKey="speedy-sites.banner.tagline"
                defaultText="Only 5–10 build slots available per week."
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
              textKey="speedy-sites.back-link"
              defaultText="Back to Services Dashboard"
              as="span"
            />
          </Link>

          {/* ABOVE THE FOLD */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-20 max-w-4xl"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
            >
              <EditableText
                textKey="speedy-sites.hero.heading-line1"
                defaultText="Launch Fast:"
                as="span"
              />{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                <EditableText
                  textKey="speedy-sites.hero.heading-line2"
                  defaultText="High-Performance Sites in 48 Hours"
                  as="span"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl leading-relaxed"
            >
              <EditableText
                textKey="speedy-sites.hero.subheading"
                defaultText="Pre-built, conversion-optimized systems deployed in days — not weeks."
                as="span"
              />
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 mb-8"
            >
              <div className="text-xl font-semibold text-white">
                <EditableText
                  textKey="speedy-sites.hero.point-1"
                  defaultText="👉 We don't sell websites. We build revenue systems."
                  as="span"
                />
              </div>
              <div className="text-xl font-semibold text-white">
                <EditableText
                  textKey="speedy-sites.hero.point-2"
                  defaultText="👉 Speedy Sites are built to launch. Custom Sites are built to scale."
                  as="span"
                />
              </div>
              <div className="text-xl font-semibold text-white">
                <EditableText
                  textKey="speedy-sites.hero.point-3"
                  defaultText="👉 Launch now. Upgrade later. Never rebuild from scratch."
                  as="span"
                />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col md:flex-row gap-4 md:gap-8 pt-6 border-t border-white/10"
            >
              <div className="flex items-center gap-2 text-sm text-[#5EF08A] font-bold tracking-wide uppercase">
                <Zap className="w-4 h-4 fill-[#5EF08A]" />
                <EditableText
                  textKey="speedy-sites.hero.feature-1"
                  defaultText="Live in 48 hours"
                  as="span"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5EF08A] font-bold tracking-wide uppercase">
                <Zap className="w-4 h-4 fill-[#5EF08A]" />
                <EditableText
                  textKey="speedy-sites.hero.feature-2"
                  defaultText="Conversion-focused layouts"
                  as="span"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5EF08A] font-bold tracking-wide uppercase">
                <Zap className="w-4 h-4 fill-[#5EF08A]" />
                <EditableText
                  textKey="speedy-sites.hero.feature-3"
                  defaultText="Built to upgrade as you grow"
                  as="span"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* OBJECTIONS & ANALOGIES */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24"
          >
            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold mb-4">
                <EditableText
                  textKey="speedy-sites.objection-1.heading"
                  defaultText="Why Not Just Build It Yourself?"
                  as="span"
                />
              </h3>
              <p className="text-[#5EF08A] font-semibold mb-6">
                <EditableText
                  textKey="speedy-sites.objection-1.hook"
                  defaultText="👉 Wix and Shopify give you the tools. We give you the finished result."
                  as="span"
                />
              </p>
              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">
                    <EditableText
                      textKey="speedy-sites.comparison.header-left"
                      defaultText="DIY Platforms"
                      as="span"
                    />
                  </span>
                  <span className="font-semibold text-white text-right">
                    <EditableText
                      textKey="speedy-sites.comparison.header-right"
                      defaultText="Speedy Sites"
                      as="span"
                    />
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">
                    <EditableText
                      textKey="speedy-sites.comparison.row-1-left"
                      defaultText="You build it yourself"
                      as="span"
                    />
                  </span>
                  <span className="text-white text-right">
                    <EditableText
                      textKey="speedy-sites.comparison.row-1-right"
                      defaultText="We build it for you"
                      as="span"
                    />
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">
                    <EditableText
                      textKey="speedy-sites.comparison.row-2-left"
                      defaultText="Takes days/weeks to learn"
                      as="span"
                    />
                  </span>
                  <span className="text-white text-right">
                    <EditableText
                      textKey="speedy-sites.comparison.row-2-right"
                      defaultText="Live in 48 hours"
                      as="span"
                    />
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">
                    <EditableText
                      textKey="speedy-sites.comparison.row-3-left"
                      defaultText="Generic templates"
                      as="span"
                    />
                  </span>
                  <span className="text-white text-right">
                    <EditableText
                      textKey="speedy-sites.comparison.row-3-right"
                      defaultText="Structured for conversion"
                      as="span"
                    />
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-gray-400">
                    <EditableText
                      textKey="speedy-sites.comparison.row-4-left"
                      defaultText="You troubleshoot issues"
                      as="span"
                    />
                  </span>
                  <span className="text-white text-right">
                    <EditableText
                      textKey="speedy-sites.comparison.row-4-right"
                      defaultText="Done-for-you setup"
                      as="span"
                    />
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-gray-300 italic border-l-2 border-white/20 pl-4 text-sm">
                <p>
                  <EditableText
                    textKey="speedy-sites.objection-1.quote-1"
                    defaultText='"Most DIY sites never get finished."'
                    as="span"
                  />
                </p>
                <p>
                  <EditableText
                    textKey="speedy-sites.objection-1.quote-2"
                    defaultText='"Tools don&#39;t build businesses. Execution does."'
                    as="span"
                  />
                </p>
                <p className="text-white font-medium not-italic mt-4">
                  <EditableText
                    textKey="speedy-sites.objection-1.closing"
                    defaultText="👉 Most businesses don't fail because of tools — they fail because nothing gets launched."
                    as="span"
                  />
                </p>
              </div>
            </motion.div>

            <div className="space-y-8">
              <motion.div
                variants={itemVariants}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <h3 className="text-2xl font-bold mb-4">
                  <EditableText
                    textKey="speedy-sites.objection-2.heading"
                    defaultText="Why Not Just Pay $29/month?"
                    as="span"
                  />
                </h3>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  <EditableText
                    textKey="speedy-sites.objection-2.body"
                    defaultText="Most people spend days if not weeks building their own site — and still end up with something average or NOTHING AT ALL!"
                    as="span"
                  />
                </p>
                <p className="text-white font-medium bg-[#5EF08A]/10 p-4 rounded-lg border border-[#5EF08A]/20">
                  <EditableText
                    textKey="speedy-sites.objection-2.highlight"
                    defaultText="We compress that into 48 hours and deliver something ready to use immediately."
                    as="span"
                  />
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="bg-[#0A0B14] border border-white/10 rounded-2xl p-8 relative overflow-hidden"
              >
                <Hammer className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
                <p className="text-gray-300 text-lg mb-4">
                  <EditableText
                    textKey="speedy-sites.analogy.line-1"
                    defaultText='"Using Wix or Shopify is like buying tools to build a house yourself."'
                    as="span"
                  />
                </p>
                <p className="text-xl font-bold text-white">
                  <EditableText
                    textKey="speedy-sites.analogy.line-2-prefix"
                    defaultText='"Speedy Sites are like hiring a builder who gets it done in'
                    as="span"
                  />{" "}
                  <span className="text-[#5EF08A]">
                    <EditableText
                      textKey="speedy-sites.analogy.line-2-accent"
                      defaultText="48 hours"
                      as="span"
                    />
                  </span>
                  <EditableText
                    textKey="speedy-sites.analogy.line-2-suffix"
                    defaultText='."'
                    as="span"
                  />
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* SPEEDY VS CUSTOM */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-24"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">
                <EditableText
                  textKey="speedy-sites.path.heading"
                  defaultText="Choose Your Path"
                  as="span"
                />
              </h2>
              <p className="text-gray-400">
                <EditableText
                  textKey="speedy-sites.path.subheading"
                  defaultText="Understand exactly where your business fits in our ecosystem."
                  as="span"
                />
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-2 bg-white/5 p-6 border-b border-white/10">
                <div className="font-bold text-xl text-white">
                  <EditableText
                    textKey="speedy-sites.path.col-speedy"
                    defaultText="Speedy Sites"
                    as="span"
                  />
                </div>
                <div className="font-bold text-xl text-[#5EF08A]">
                  <EditableText
                    textKey="speedy-sites.path.col-custom"
                    defaultText="Custom Sites"
                    as="span"
                  />
                </div>
              </div>
              <div className="p-6 space-y-4 text-sm md:text-base">
                <div className="grid grid-cols-2 border-b border-white/10 pb-4">
                  <span className="text-gray-300">
                    <EditableText
                      textKey="speedy-sites.path.row-1-speedy"
                      defaultText="Launch in 48 hours"
                      as="span"
                    />
                  </span>
                  <span className="text-white">
                    <EditableText
                      textKey="speedy-sites.path.row-1-custom"
                      defaultText="Fully custom build"
                      as="span"
                    />
                  </span>
                </div>
                <div className="grid grid-cols-2 border-b border-white/10 pb-4">
                  <span className="text-gray-300">
                    <EditableText
                      textKey="speedy-sites.path.row-2-speedy"
                      defaultText="1–3 pages max"
                      as="span"
                    />
                  </span>
                  <span className="text-white">
                    <EditableText
                      textKey="speedy-sites.path.row-2-custom"
                      defaultText="Multi-page architecture"
                      as="span"
                    />
                  </span>
                </div>
                <div className="grid grid-cols-2 border-b border-white/10 pb-4">
                  <span className="text-gray-300">
                    <EditableText
                      textKey="speedy-sites.path.row-3-speedy"
                      defaultText="Platform caps"
                      as="span"
                    />
                  </span>
                  <span className="text-white">
                    <EditableText
                      textKey="speedy-sites.path.row-3-custom"
                      defaultText="Unlimited scalability"
                      as="span"
                    />
                  </span>
                </div>
                <div className="grid grid-cols-2 border-b border-white/10 pb-4">
                  <span className="text-gray-300">
                    <EditableText
                      textKey="speedy-sites.path.row-4-speedy"
                      defaultText="No advanced SEO"
                      as="span"
                    />
                  </span>
                  <span className="text-white">
                    <EditableText
                      textKey="speedy-sites.path.row-4-custom"
                      defaultText="Built to rank on Google"
                      as="span"
                    />
                  </span>
                </div>
                <div className="grid grid-cols-2 border-b border-white/10 pb-4">
                  <span className="text-gray-300">
                    <EditableText
                      textKey="speedy-sites.path.row-5-speedy"
                      defaultText="Limited automation"
                      as="span"
                    />
                  </span>
                  <span className="text-white">
                    <EditableText
                      textKey="speedy-sites.path.row-5-custom"
                      defaultText="Full CRM + automation"
                      as="span"
                    />
                  </span>
                </div>
                <div className="grid grid-cols-2 pt-2">
                  <span className="text-gray-300 font-bold">
                    <EditableText
                      textKey="speedy-sites.path.row-6-speedy"
                      defaultText="Best for starting"
                      as="span"
                    />
                  </span>
                  <span className="text-white font-bold">
                    <EditableText
                      textKey="speedy-sites.path.row-6-custom"
                      defaultText="Built for scaling &amp; dominance"
                      as="span"
                    />
                  </span>
                </div>
              </div>
            </div>
            <p className="text-center mt-6 text-lg font-medium text-white">
              <EditableText
                textKey="speedy-sites.path.closing-prefix"
                defaultText="👉 If you're serious about growth, Speedy is your"
                as="span"
              />{" "}
              <span className="text-[#5EF08A] underline decoration-[#5EF08A]/30 underline-offset-4">
                <EditableText
                  textKey="speedy-sites.path.closing-accent"
                  defaultText="starting point"
                  as="span"
                />
              </span>{" "}
              <EditableText
                textKey="speedy-sites.path.closing-suffix"
                defaultText="— not your final system."
                as="span"
              />
            </p>
          </motion.div>

          {/* POSITIONING BLOCK */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24"
          >
            <div className="bg-[#5EF08A]/5 border border-[#5EF08A]/20 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#5EF08A]" />
                <EditableText
                  textKey="speedy-sites.who-for.heading"
                  defaultText="Who Speedy Is For"
                  as="span"
                />
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#5EF08A] shrink-0" />
                  <EditableText
                    textKey="speedy-sites.who-for.item-1"
                    defaultText="Need to launch immediately"
                    as="span"
                  />
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#5EF08A] shrink-0" />
                  <EditableText
                    textKey="speedy-sites.who-for.item-2"
                    defaultText="Validating a business idea"
                    as="span"
                  />
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#5EF08A] shrink-0" />
                  <EditableText
                    textKey="speedy-sites.who-for.item-3"
                    defaultText="Need instant credibility"
                    as="span"
                  />
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#5EF08A] shrink-0" />
                  <EditableText
                    textKey="speedy-sites.who-for.item-4"
                    defaultText="Stuck using DIY tools"
                    as="span"
                  />
                </li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white" />
                <EditableText
                  textKey="speedy-sites.when-upgrade.heading"
                  defaultText="When to Upgrade (Custom)"
                  as="span"
                />
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-5 h-5 text-gray-500 shrink-0" />
                  <EditableText
                    textKey="speedy-sites.when-upgrade.item-1"
                    defaultText="Need SEO to capture organic traffic"
                    as="span"
                  />
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-5 h-5 text-gray-500 shrink-0" />
                  <EditableText
                    textKey="speedy-sites.when-upgrade.item-2"
                    defaultText="Need CRM and workflow automation"
                    as="span"
                  />
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-5 h-5 text-gray-500 shrink-0" />
                  <EditableText
                    textKey="speedy-sites.when-upgrade.item-3"
                    defaultText="Outgrow platform caps"
                    as="span"
                  />
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-5 h-5 text-gray-500 shrink-0" />
                  <EditableText
                    textKey="speedy-sites.when-upgrade.item-4"
                    defaultText="Want full, uncompromised customization"
                    as="span"
                  />
                </li>
              </ul>
              <p className="mt-6 text-sm text-[#5EF08A] font-bold">
                <EditableText
                  textKey="speedy-sites.when-upgrade.cta"
                  defaultText="👉 Start with Custom if this is you."
                  as="span"
                />
              </p>
            </div>
          </motion.div>

          {/* SPEEDY BUILD TIERS */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="mb-24"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">
              <EditableText
                textKey="speedy-sites.tiers.heading"
                defaultText="Select Your Deployment Package"
                as="span"
              />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleTiers.map((tier) => {
                // Live price from backend — "From $149" format
                const displayPrice = getTierDisplayPrice(tier.backendName);
                return (
                  <motion.div
                    key={tier.name}
                    variants={itemVariants}
                    whileHover={{
                      y: -5,
                      boxShadow: "0 10px 40px -10px rgba(94, 240, 138, 0.15)",
                    }}
                    className="flex flex-col bg-[#0A0B14] border border-white/10 rounded-2xl p-6 relative group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#5EF08A]/30 to-transparent group-hover:via-[#5EF08A] transition-all" />
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">
                        <EditableText
                          textKey={tier.nameKey}
                          defaultText={tier.name}
                          as="span"
                        />
                      </h3>
                      <div className="text-2xl font-extrabold text-[#5EF08A]">
                        {displayPrice}{" "}
                        <span className="text-sm text-gray-500 font-normal">
                          <EditableText
                            textKey="speedy-sites.tiers.price-note"
                            defaultText="one-time"
                            as="span"
                          />
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-white font-medium bg-white/5 inline-block px-3 py-1 rounded-md mb-4 border border-white/10">
                      <EditableText
                        textKey={tier.structureKey}
                        defaultText={tier.structure}
                        as="span"
                      />
                    </div>
                    <p className="text-gray-300 italic text-sm mb-6">
                      "
                      <EditableText
                        textKey={tier.taglineKey}
                        defaultText={tier.tagline}
                        as="span"
                      />
                      "
                    </p>
                    {tier.bestFor && tier.bestForKey && (
                      <div className="mb-6 text-xs">
                        <span className="text-gray-500 font-semibold uppercase">
                          <EditableText
                            textKey="speedy-sites.tiers.best-for-label"
                            defaultText="Best For:"
                            as="span"
                          />
                        </span>{" "}
                        <span className="text-gray-300">
                          <EditableText
                            textKey={tier.bestForKey}
                            defaultText={tier.bestFor}
                            as="span"
                          />
                        </span>
                      </div>
                    )}
                    <div className="flex-grow space-y-4">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <EditableText
                          textKey="speedy-sites.tiers.includes-label"
                          defaultText="Includes:"
                          as="span"
                        />
                      </span>
                      <ul className="space-y-2">
                        {tier.includes.map((item) => (
                          <li
                            key={item.key}
                            className="flex items-start gap-2 text-sm text-gray-300"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#5EF08A] shrink-0 mt-0.5" />
                            <EditableText
                              textKey={item.key}
                              defaultText={item.text}
                              as="span"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                      <div className="bg-[#5EF08A]/5 p-3 rounded-lg border border-[#5EF08A]/10 text-xs text-gray-300 leading-relaxed">
                        <EditableText
                          textKey={tier.upgradeTriggerKey}
                          defaultText={tier.upgradeTrigger}
                          as="span"
                        />
                      </div>
                      <div className="text-xs text-center text-gray-400 font-medium">
                        <EditableText
                          textKey="speedy-sites.tiers.requires-label"
                          defaultText="Requires:"
                          as="span"
                        />{" "}
                        <span className="text-white">
                          <EditableText
                            textKey={tier.requiresKey}
                            defaultText={tier.requires}
                            as="span"
                          />
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          addItem({
                            name: tier.backendName,
                            price: displayPrice,
                          });
                          openDrawer();
                        }}
                        className="w-full bg-[#5EF08A] text-[#0A0B14] font-bold py-3 rounded-xl hover:bg-[#4ade80] transition-colors shadow-[0_0_15px_rgba(94,240,138,0.3)] hover:shadow-[0_0_25px_rgba(94,240,138,0.5)]"
                        data-ocid={`speedy-sites.cta_${tier.backendName.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <EditableText
                          textKey={tier.ctaKey}
                          defaultText={tier.cta}
                          as="span"
                        />
                      </motion.button>
                      <p className="text-center text-[10px] text-gray-500 uppercase tracking-wide font-bold">
                        <EditableText
                          textKey="speedy-sites.tiers.slots-note"
                          defaultText="Limited slots available"
                          as="span"
                        />
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* SPEEDY PLANS & PLATFORM CAPS */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24"
          >
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold mb-6">
                <EditableText
                  textKey="speedy-sites.infrastructure.heading"
                  defaultText="Required Monthly Infrastructure"
                  as="span"
                />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {hostingPlans.map((plan) => {
                  const planPrice = getPlanDisplayPrice(plan.backendName);
                  return (
                    <div
                      key={plan.backendName}
                      className="bg-white/5 border border-white/10 rounded-xl p-5"
                    >
                      <h4 className="font-bold text-white">
                        <EditableText
                          textKey={plan.displayNameKey}
                          defaultText={plan.displayName}
                          as="span"
                        />
                      </h4>
                      <div className="text-[#5EF08A] font-bold mb-4">
                        {planPrice}
                      </div>
                      <ul className="space-y-2 text-sm text-gray-400">
                        {plan.features.map((f) => (
                          <li key={f.key}>
                            •{" "}
                            <EditableText
                              textKey={f.key}
                              defaultText={f.text}
                              as="span"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <EditableText
                  textKey="speedy-sites.caps.heading"
                  defaultText="Platform Caps"
                  as="span"
                />
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                <EditableText
                  textKey="speedy-sites.caps.desc"
                  defaultText="Speedy Sites are built for velocity. To maintain speed, they have hard technical caps:"
                  as="span"
                />
              </p>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="speedy-sites.caps.cap-1-label"
                      defaultText="30 services"
                      as="span"
                    />
                  </strong>{" "}
                  →{" "}
                  <EditableText
                    textKey="speedy-sites.caps.cap-1-desc"
                    defaultText="Need filters? Upgrade."
                    as="span"
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="speedy-sites.caps.cap-2-label"
                      defaultText="50 menu items"
                      as="span"
                    />
                  </strong>{" "}
                  →{" "}
                  <EditableText
                    textKey="speedy-sites.caps.cap-2-desc"
                    defaultText="Need structure? Upgrade."
                    as="span"
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="speedy-sites.caps.cap-3-label"
                      defaultText="7 subscriptions"
                      as="span"
                    />
                  </strong>{" "}
                  →{" "}
                  <EditableText
                    textKey="speedy-sites.caps.cap-3-desc"
                    defaultText="Need automation? Upgrade."
                    as="span"
                  />
                </li>
              </ul>
            </div>
          </motion.div>

          {/* RISK REVERSAL & DISQUALIFIER */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
          >
            <div className="bg-gradient-to-br from-[#0A0B14] to-[#5EF08A]/10 border border-[#5EF08A]/30 rounded-2xl p-8 flex flex-col justify-center">
              <ShieldCheck className="w-10 h-10 text-[#5EF08A] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                <EditableText
                  textKey="speedy-sites.risk-reversal.heading"
                  defaultText="Zero Migration Risk"
                  as="span"
                />
              </h3>
              <p className="text-lg text-gray-300">
                👉{" "}
                <strong className="text-white">
                  <EditableText
                    textKey="speedy-sites.risk-reversal.bold"
                    defaultText="100% of your Speedy build cost"
                    as="span"
                  />
                </strong>{" "}
                <EditableText
                  textKey="speedy-sites.risk-reversal.body"
                  defaultText="is credited toward any Custom upgrade in the future. You never lose the money you invested to launch."
                  as="span"
                />
              </p>
            </div>
            <div className="bg-[#0A0B14] border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">
                <EditableText
                  textKey="speedy-sites.disqualifier.heading"
                  defaultText="Speedy is NOT for you if:"
                  as="span"
                />
              </h3>
              <ul className="space-y-3 text-gray-400 mb-6">
                <li className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-gray-600" />
                  <EditableText
                    textKey="speedy-sites.disqualifier.item-1"
                    defaultText="You want SEO"
                    as="span"
                  />
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-gray-600" />
                  <EditableText
                    textKey="speedy-sites.disqualifier.item-2"
                    defaultText="You need deep automation"
                    as="span"
                  />
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-gray-600" />
                  <EditableText
                    textKey="speedy-sites.disqualifier.item-3"
                    defaultText="You want to scale fast"
                    as="span"
                  />
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-gray-600" />
                  <EditableText
                    textKey="speedy-sites.disqualifier.item-4"
                    defaultText="You want custom branding"
                    as="span"
                  />
                </li>
              </ul>
              <p className="text-[#5EF08A] font-bold">
                <EditableText
                  textKey="speedy-sites.disqualifier.cta"
                  defaultText="👉 Start with Custom instead."
                  as="span"
                />
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
}
