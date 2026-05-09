import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Layers,
  ShieldCheck,
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

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

// Backend names exactly as seeded in main.mo (uppercase)
const productCategories = [
  {
    title: "BUILD TRUST & GENERATE LEADS",
    titleKey: "custom-sites.cat-1.title",
    description:
      "Establish credibility and start capturing inbound customers immediately.",
    descKey: "custom-sites.cat-1.desc",
    products: [
      {
        backendName: "DIGITAL PRESENCE",
        displayName: "DIGITAL PRESENCE",
        displayNameKey: "custom-sites.digital-presence.name",
        tagline:
          "A real business website in 5 days. No templates that scream cheap.",
        taglineKey: "custom-sites.digital-presence.tagline",
        bestFor: "Barbershops, solo contractors, food trucks, solo trades.",
        bestForKey: "custom-sites.digital-presence.best-for",
        bullets: [
          {
            text: "1-page mobile-first design",
            key: "custom-sites.digital-presence.bullet-1",
          },
          {
            text: "Click-to-call and click-to-text buttons",
            key: "custom-sites.digital-presence.bullet-2",
          },
          {
            text: "Google Business Profile integration",
            key: "custom-sites.digital-presence.bullet-3",
          },
          {
            text: "Services or menu section with photos",
            key: "custom-sites.digital-presence.bullet-4",
          },
          {
            text: "Contact form with email delivery",
            key: "custom-sites.digital-presence.bullet-5",
          },
          {
            text: "Social media links",
            key: "custom-sites.digital-presence.bullet-6",
          },
          {
            text: "Basic on-page SEO (title, meta, schema)",
            key: "custom-sites.digital-presence.bullet-7",
          },
          {
            text: "Google Analytics setup",
            key: "custom-sites.digital-presence.bullet-8",
          },
          {
            text: "SSL and fast hosting ready",
            key: "custom-sites.digital-presence.bullet-9",
          },
          {
            text: "2 rounds of revisions",
            key: "custom-sites.digital-presence.bullet-10",
          },
          {
            text: "5-day delivery target",
            key: "custom-sites.digital-presence.bullet-11",
          },
        ],
        upgradePath:
          "👉 Upgrade to Authority Site to unlock multi-page SEO, rank on Google, and dominate your local service area.",
        upgradePathKey: "custom-sites.digital-presence.upgrade-path",
        recommendedPlan: "Stay Sharp ($89/mo)",
        recommendedPlanKey: "custom-sites.digital-presence.recommended-plan",
      },
      {
        backendName: "AUTHORITY SITE",
        displayName: "AUTHORITY SITE",
        displayNameKey: "custom-sites.authority-site.name",
        tagline:
          "Multi-page SEO site built to rank, convert, and make you the obvious choice.",
        taglineKey: "custom-sites.authority-site.tagline",
        bestFor:
          "Roofing, landscaping, HVAC, plumbing, electrical, pest control, law firms, financial advisors, real estate agents, contractors.",
        bestForKey: "custom-sites.authority-site.best-for",
        bullets: [
          {
            text: "5–8 custom pages",
            key: "custom-sites.authority-site.bullet-1",
          },
          {
            text: "Full per-page SEO (unique meta, H-tags, schema markup)",
            key: "custom-sites.authority-site.bullet-2",
          },
          {
            text: "Local SEO optimization (city + service keyword targeting)",
            key: "custom-sites.authority-site.bullet-3",
          },
          {
            text: "Team page with bios and photos",
            key: "custom-sites.authority-site.bullet-4",
          },
          {
            text: "Testimonials and Google Reviews widget",
            key: "custom-sites.authority-site.bullet-5",
          },
          {
            text: "Before/after gallery or project portfolio",
            key: "custom-sites.authority-site.bullet-6",
          },
          {
            text: "Service area map (clickable link)",
            key: "custom-sites.authority-site.bullet-7",
          },
          {
            text: "Lead capture forms on every page",
            key: "custom-sites.authority-site.bullet-8",
          },
          {
            text: "Click-to-call banner (sticky mobile)",
            key: "custom-sites.authority-site.bullet-9",
          },
          {
            text: "Google Analytics and Search Console setup",
            key: "custom-sites.authority-site.bullet-10",
          },
          {
            text: "3 rounds of revisions",
            key: "custom-sites.authority-site.bullet-11",
          },
          {
            text: "7–10 day delivery target",
            key: "custom-sites.authority-site.bullet-12",
          },
        ],
        upgradePath:
          "👉 Upgrade to Booking Pro to automate scheduling, capture more leads, and eliminate manual follow-ups.",
        upgradePathKey: "custom-sites.authority-site.upgrade-path",
        recommendedPlan: "Stay Sharp ($89/mo)",
        recommendedPlanKey: "custom-sites.authority-site.recommended-plan",
      },
    ],
  },
  {
    title: "AUTOMATE APPOINTMENTS & SERVICES",
    titleKey: "custom-sites.cat-2.title",
    description:
      "Turn your website into a 24/7 automated booking and client management system.",
    descKey: "custom-sites.cat-2.desc",
    products: [
      {
        backendName: "BOOKING PRO",
        displayName: "BOOKING PRO",
        displayNameKey: "custom-sites.booking-pro.name",
        tagline:
          "Your entire appointment business on autopilot — site, booking, CRM, and emails all in one.",
        taglineKey: "custom-sites.booking-pro.tagline",
        bestFor: undefined,
        bestForKey: undefined,
        bullets: [
          {
            text: "Everything in Authority Site",
            key: "custom-sites.booking-pro.bullet-1",
          },
          {
            text: "Online booking system (up to 20 services / 10 staff)",
            key: "custom-sites.booking-pro.bullet-2",
          },
          {
            text: "Automated confirmation and reminder emails",
            key: "custom-sites.booking-pro.bullet-3",
          },
          {
            text: "Automated follow-up email sequence (3 emails post-visit)",
            key: "custom-sites.booking-pro.bullet-4",
          },
          {
            text: "Built-in CRM for client contact management",
            key: "custom-sites.booking-pro.bullet-5",
          },
          {
            text: "Client self-service portal (view, reschedule, cancel)",
            key: "custom-sites.booking-pro.bullet-6",
          },
          {
            text: "Staff schedule management",
            key: "custom-sites.booking-pro.bullet-7",
          },
          {
            text: "Service menu with photos and pricing",
            key: "custom-sites.booking-pro.bullet-8",
          },
          {
            text: "Online deposit and payment capture",
            key: "custom-sites.booking-pro.bullet-9",
          },
          {
            text: "Review request automation (post-appointment)",
            key: "custom-sites.booking-pro.bullet-10",
          },
          {
            text: "No-show protection (deposit hold option)",
            key: "custom-sites.booking-pro.bullet-11",
          },
          {
            text: "3 rounds of revisions",
            key: "custom-sites.booking-pro.bullet-12",
          },
          {
            text: "10–14 day delivery target",
            key: "custom-sites.booking-pro.bullet-13",
          },
        ],
        upgradePath:
          "👉 Upgrade to Membership Engine to unlock recurring subscription billing and predictable monthly revenue.",
        upgradePathKey: "custom-sites.booking-pro.upgrade-path",
        recommendedPlan: "Stay Ahead ($249/mo)",
        recommendedPlanKey: "custom-sites.booking-pro.recommended-plan",
      },
    ],
  },
  {
    title: "SELL FOOD & BEVERAGE",
    titleKey: "custom-sites.cat-3.title",
    description:
      "Own your ordering system, eliminate commissions, and maximize profit per order.",
    descKey: "custom-sites.cat-3.desc",
    products: [
      {
        backendName: "RESTAURANT PRO",
        displayName: "RESTAURANT PRO",
        displayNameKey: "custom-sites.restaurant-pro.name",
        tagline:
          "Zero-commission online ordering. Your own menu. Your brand. You keep 100% of every order.",
        taglineKey: "custom-sites.restaurant-pro.tagline",
        bestFor: undefined,
        bestForKey: undefined,
        bullets: [
          {
            text: "Everything in Authority Site",
            key: "custom-sites.restaurant-pro.bullet-1",
          },
          {
            text: "Commission-free online ordering system",
            key: "custom-sites.restaurant-pro.bullet-2",
          },
          {
            text: "Full digital menu (categories, photos, modifiers, pricing)",
            key: "custom-sites.restaurant-pro.bullet-3",
          },
          {
            text: "Table reservation system (optional)",
            key: "custom-sites.restaurant-pro.bullet-4",
          },
          {
            text: "Pickup and delivery toggle per order",
            key: "custom-sites.restaurant-pro.bullet-5",
          },
          {
            text: "Stripe checkout (Apple Pay / Google Pay supported)",
            key: "custom-sites.restaurant-pro.bullet-6",
          },
          {
            text: "Order notification to kitchen via email",
            key: "custom-sites.restaurant-pro.bullet-7",
          },
          {
            text: "Catering inquiry form with quote builder",
            key: "custom-sites.restaurant-pro.bullet-8",
          },
          {
            text: "Events and specials page",
            key: "custom-sites.restaurant-pro.bullet-9",
          },
          {
            text: "ZERO monthly commission on every order — forever",
            key: "custom-sites.restaurant-pro.bullet-10",
          },
          {
            text: "3 rounds of revisions",
            key: "custom-sites.restaurant-pro.bullet-11",
          },
          {
            text: "10–14 day delivery target",
            key: "custom-sites.restaurant-pro.bullet-12",
          },
        ],
        upgradePath:
          "👉 Upgrade to Restaurant Empire to scale across multiple locations and centralize operations.",
        upgradePathKey: "custom-sites.restaurant-pro.upgrade-path",
        recommendedPlan: "Stay Ahead ($249/mo)",
        recommendedPlanKey: "custom-sites.restaurant-pro.recommended-plan",
      },
      {
        backendName: "RESTAURANT EMPIRE",
        displayName: "RESTAURANT EMPIRE",
        displayNameKey: "custom-sites.restaurant-empire.name",
        tagline:
          "Scale your restaurant brand. Multi-location ordering. Full menu control. 0% commission.",
        taglineKey: "custom-sites.restaurant-empire.tagline",
        bestFor: undefined,
        bestForKey: undefined,
        bullets: [
          {
            text: "Everything in Restaurant Pro",
            key: "custom-sites.restaurant-empire.bullet-1",
          },
          {
            text: "Multi-location support (up to 3 locations)",
            key: "custom-sites.restaurant-empire.bullet-2",
          },
          {
            text: "Advanced menu management system",
            key: "custom-sites.restaurant-empire.bullet-3",
          },
          {
            text: "Reservation and waitlist management",
            key: "custom-sites.restaurant-empire.bullet-4",
          },
          {
            text: "Event booking system (private dining, buyouts)",
            key: "custom-sites.restaurant-empire.bullet-5",
          },
          {
            text: "Catering portal with custom quote builder",
            key: "custom-sites.restaurant-empire.bullet-6",
          },
          {
            text: "Gift card sales integration",
            key: "custom-sites.restaurant-empire.bullet-7",
          },
          {
            text: "Loyalty program landing page and email capture",
            key: "custom-sites.restaurant-empire.bullet-8",
          },
          {
            text: "Email marketing integration",
            key: "custom-sites.restaurant-empire.bullet-9",
          },
          {
            text: "Full branded ordering experience",
            key: "custom-sites.restaurant-empire.bullet-10",
          },
          {
            text: "Performance dashboard (orders, revenue, top items)",
            key: "custom-sites.restaurant-empire.bullet-11",
          },
          {
            text: "5 rounds of revisions",
            key: "custom-sites.restaurant-empire.bullet-12",
          },
          {
            text: "14–21 day delivery target",
            key: "custom-sites.restaurant-empire.bullet-13",
          },
        ],
        upgradePath: undefined,
        upgradePathKey: undefined,
        recommendedPlan: "Full Partner ($549/mo)",
        recommendedPlanKey: "custom-sites.restaurant-empire.recommended-plan",
      },
    ],
  },
  {
    title: "SELL PRODUCTS & MEMBERSHIPS",
    titleKey: "custom-sites.cat-4.title",
    description:
      "Launch, monetize, and scale products or recurring revenue with full ownership.",
    descKey: "custom-sites.cat-4.desc",
    products: [
      {
        backendName: "DIGITAL STOREFRONT",
        displayName: "DIGITAL STOREFRONT",
        displayNameKey: "custom-sites.digital-storefront.name",
        tagline:
          "A fully custom e-commerce store that looks like you paid $25,000 — built for half the price.",
        taglineKey: "custom-sites.digital-storefront.tagline",
        bestFor: undefined,
        bestForKey: undefined,
        bullets: [
          {
            text: "Everything in Authority Site",
            key: "custom-sites.digital-storefront.bullet-1",
          },
          {
            text: "Up to 50 products with variants (size, color, etc.)",
            key: "custom-sites.digital-storefront.bullet-2",
          },
          {
            text: "Advanced product filters and search",
            key: "custom-sites.digital-storefront.bullet-3",
          },
          {
            text: "Inventory tracking per variant",
            key: "custom-sites.digital-storefront.bullet-4",
          },
          {
            text: "Order confirmation and shipping update automations",
            key: "custom-sites.digital-storefront.bullet-5",
          },
          {
            text: "Customer accounts and order history",
            key: "custom-sites.digital-storefront.bullet-6",
          },
          {
            text: "Promo codes and discount engine",
            key: "custom-sites.digital-storefront.bullet-7",
          },
          {
            text: "Featured collections and homepage merchandising",
            key: "custom-sites.digital-storefront.bullet-8",
          },
          {
            text: "Product reviews widget",
            key: "custom-sites.digital-storefront.bullet-9",
          },
          {
            text: "Returns and refunds policy pages",
            key: "custom-sites.digital-storefront.bullet-10",
          },
          {
            text: "Sales analytics dashboard",
            key: "custom-sites.digital-storefront.bullet-11",
          },
          {
            text: "3 rounds of revisions",
            key: "custom-sites.digital-storefront.bullet-12",
          },
          {
            text: "14-day delivery target",
            key: "custom-sites.digital-storefront.bullet-13",
          },
        ],
        upgradePath:
          "👉 Upgrade to Enterprise Scale to unlock B2B portals, wholesale functionality, and advanced integrations.",
        upgradePathKey: "custom-sites.digital-storefront.upgrade-path",
        recommendedPlan: "Full Partner ($549/mo)",
        recommendedPlanKey: "custom-sites.digital-storefront.recommended-plan",
      },
      {
        backendName: "MEMBERSHIP ENGINE",
        displayName: "MEMBERSHIP ENGINE",
        displayNameKey: "custom-sites.membership-engine.name",
        tagline:
          "Recurring revenue on autopilot. Memberships. Class packs. Subscription billing. All your brand.",
        taglineKey: "custom-sites.membership-engine.tagline",
        bestFor: undefined,
        bestForKey: undefined,
        bullets: [
          {
            text: "Everything in Booking Pro",
            key: "custom-sites.membership-engine.bullet-1",
          },
          {
            text: "Subscription and membership billing (monthly, quarterly, annual)",
            key: "custom-sites.membership-engine.bullet-2",
          },
          {
            text: "Tiered membership levels (up to 5 tiers)",
            key: "custom-sites.membership-engine.bullet-3",
          },
          {
            text: "Member self-service portal (pause, cancel, upgrade, downgrade)",
            key: "custom-sites.membership-engine.bullet-4",
          },
          {
            text: "Class schedule with capacity limits",
            key: "custom-sites.membership-engine.bullet-5",
          },
          {
            text: "Class pack purchasing (5-class, 10-class, unlimited)",
            key: "custom-sites.membership-engine.bullet-6",
          },
          {
            text: "Automated billing and failed payment recovery emails",
            key: "custom-sites.membership-engine.bullet-7",
          },
          {
            text: "Member check-in tracking",
            key: "custom-sites.membership-engine.bullet-8",
          },
          {
            text: "Waitlist management for full classes",
            key: "custom-sites.membership-engine.bullet-9",
          },
          {
            text: "Referral program landing page",
            key: "custom-sites.membership-engine.bullet-10",
          },
          {
            text: "Revenue dashboard (MRR, churn, active members)",
            key: "custom-sites.membership-engine.bullet-11",
          },
          {
            text: "PWA upgrade available ($299 one-time)",
            key: "custom-sites.membership-engine.bullet-12",
          },
          {
            text: "5 rounds of revisions",
            key: "custom-sites.membership-engine.bullet-13",
          },
          {
            text: "14–21 day delivery target",
            key: "custom-sites.membership-engine.bullet-14",
          },
        ],
        upgradePath: undefined,
        upgradePathKey: undefined,
        recommendedPlan: "Full Partner ($549/mo)",
        recommendedPlanKey: "custom-sites.membership-engine.recommended-plan",
      },
    ],
  },
  {
    title: "CUSTOM BUILT SOLUTIONS",
    titleKey: "custom-sites.cat-5.title",
    description:
      "For businesses that need complete control, scalability, and custom infrastructure.",
    descKey: "custom-sites.cat-5.desc",
    products: [
      {
        backendName: "ENTERPRISE SCALE",
        displayName: "ENTERPRISE SCALE",
        displayNameKey: "custom-sites.enterprise-scale.name",
        tagline:
          "Own your entire digital ecosystem. No platform fees. No limitations. Built to your spec.",
        taglineKey: "custom-sites.enterprise-scale.tagline",
        bestFor: undefined,
        bestForKey: undefined,
        bullets: [
          {
            text: "Everything available in lower tiers combined as needed",
            key: "custom-sites.enterprise-scale.bullet-1",
          },
          {
            text: "Custom development scope",
            key: "custom-sites.enterprise-scale.bullet-2",
          },
          {
            text: "Up to 10 locations or departments",
            key: "custom-sites.enterprise-scale.bullet-3",
          },
          {
            text: "Advanced CRM with pipeline management",
            key: "custom-sites.enterprise-scale.bullet-4",
          },
          {
            text: "Full email marketing platform",
            key: "custom-sites.enterprise-scale.bullet-5",
          },
          {
            text: "B2B wholesale portal",
            key: "custom-sites.enterprise-scale.bullet-6",
          },
          {
            text: "Staff/team admin accounts with permission levels",
            key: "custom-sites.enterprise-scale.bullet-7",
          },
          {
            text: "Custom reporting and analytics dashboard",
            key: "custom-sites.enterprise-scale.bullet-8",
          },
          {
            text: "Advanced SEO strategy and content plan",
            key: "custom-sites.enterprise-scale.bullet-9",
          },
          {
            text: "API integrations (based on scope)",
            key: "custom-sites.enterprise-scale.bullet-10",
          },
          {
            text: "IDX/MLS integration for real estate clients",
            key: "custom-sites.enterprise-scale.bullet-11",
          },
          {
            text: "Dedicated project manager",
            key: "custom-sites.enterprise-scale.bullet-12",
          },
          {
            text: "Weekly status calls during build",
            key: "custom-sites.enterprise-scale.bullet-13",
          },
          {
            text: "5 rounds of revisions",
            key: "custom-sites.enterprise-scale.bullet-14",
          },
          {
            text: "21–45 day delivery target",
            key: "custom-sites.enterprise-scale.bullet-15",
          },
        ],
        upgradePath: undefined,
        upgradePathKey: undefined,
        recommendedPlan: "Enterprise Partner ($799/mo)",
        recommendedPlanKey: "custom-sites.enterprise-scale.recommended-plan",
      },
    ],
  },
];

function getProductPrice(p: Product): number {
  if (p.price_monthly != null) return p.price_monthly;
  if (p.price_onetime != null) return p.price_onetime;
  if (p.price_annual != null) return p.price_annual;
  return 0;
}

export default function CustomSitesPage() {
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

  // Live backend products for Custom Sites category
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    (
      actor as unknown as {
        getProductsByType: (t: string) => Promise<Product[]>;
      }
    )
      .getProductsByType("Custom Sites")
      .then((result: Product[]) => {
        setBackendProducts(result);
        setCatalogLoaded(true);
      })
      .catch(() => {
        setCatalogLoaded(true);
      });
  }, [actor, isFetching]);

  /** Find backend product by exact name (case-insensitive) */
  const findProduct = (name: string): Product | undefined =>
    backendProducts.find((p) => p.name.toLowerCase() === name.toLowerCase());

  /** Return "From $<price>" from live backend; fallback "..." while loading */
  const getDisplayPrice = (backendName: string): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(backendName);
    if (!p) return "—";
    return `From $${getProductPrice(p).toLocaleString()}`;
  };

  /** Is this product active per admin toggle? */
  const isProductActive = (backendName: string): boolean => {
    if (!catalogLoaded || backendProducts.length === 0) return true;
    return backendProducts.some(
      (p) => p.name.toLowerCase() === backendName.toLowerCase(),
    );
  };

  const handleGetStarted = (backendName: string) => {
    // Price will be resolved live in CheckoutDrawer via resolveItemPrice() name match
    addItem({ name: backendName, price: getDisplayPrice(backendName) });
    openDrawer();
  };

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white font-sans pb-24 selection:bg-[#5EF08A]/30">
      {/* URGENCY BANNER (STICKY) */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 w-full bg-[#0A0B14]/80 backdrop-blur-md border-b border-[#5EF08A]/20 py-3"
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <AlertTriangle className="w-5 h-5 text-[#5EF08A]" />
          </motion.div>
          <p className="text-sm md:text-base font-medium text-white/90">
            <span className="text-[#5EF08A] font-bold mr-2">
              <EditableText
                textKey="custom-sites.banner.label"
                defaultText="🔥 URGENCY PROTOCOL:"
                as="span"
              />
            </span>
            <EditableText
              textKey="custom-sites.banner.tagline"
              defaultText="48-Hour Emergency Deployment available for an additional $800."
              as="span"
            />
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* HEADER */}
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[#5EF08A] transition-colors duration-300 mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <EditableText
            textKey="custom-sites.back-link"
            defaultText="Back to Services Dashboard"
            as="span"
          />
        </Link>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-20 max-w-4xl"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            <EditableText
              textKey="custom-sites.hero.heading-line1"
              defaultText="Choose Your Outcome:"
              as="span"
            />{" "}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
              <EditableText
                textKey="custom-sites.hero.heading-line2"
                defaultText="Engineering Digital Sovereignty"
                as="span"
              />
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl leading-relaxed"
          >
            <EditableText
              textKey="custom-sites.hero.subheading"
              defaultText="Select the infrastructure that matches your business goals. Every build is an owned asset — not a rented template."
              as="span"
            />
          </motion.p>

          {/* TRUST + POSITIONING STRIP */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row gap-4 md:gap-8 pt-6 border-t border-white/10"
          >
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Zap className="w-4 h-4 text-[#5EF08A]" />
              <EditableText
                textKey="custom-sites.hero.feature-1"
                defaultText="Built for conversion, not just design"
                as="span"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Layers className="w-4 h-4 text-[#5EF08A]" />
              <EditableText
                textKey="custom-sites.hero.feature-2"
                defaultText="Structured for growth & scalability"
                as="span"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <ShieldCheck className="w-4 h-4 text-[#5EF08A]" />
              <EditableText
                textKey="custom-sites.hero.feature-3"
                defaultText="Designed to replace multiple tools"
                as="span"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* OUTCOME SECTIONS */}
        <div className="space-y-24">
          {productCategories.map((category, catIndex) => (
            <motion.section
              key={category.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="relative"
            >
              <div className="mb-10">
                <motion.h2
                  variants={itemVariants}
                  className="text-sm font-bold tracking-widest text-[#5EF08A] uppercase mb-2"
                >
                  <EditableText
                    textKey={`custom-sites.cat-${catIndex + 1}.label`}
                    defaultText={`CATEGORY ${catIndex + 1}`}
                    as="span"
                  />
                </motion.h2>
                <motion.h3
                  variants={itemVariants}
                  className="text-3xl font-bold mb-3"
                >
                  <EditableText
                    textKey={category.titleKey}
                    defaultText={category.title}
                    as="span"
                  />
                </motion.h3>
                <motion.p
                  variants={itemVariants}
                  className="text-gray-400 text-lg"
                >
                  <EditableText
                    textKey={category.descKey}
                    defaultText={category.description}
                    as="span"
                  />
                </motion.p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {category.products
                  .filter((product) => isProductActive(product.backendName))
                  .map((product) => {
                    const displayPrice = getDisplayPrice(product.backendName);
                    return (
                      <motion.div
                        key={product.backendName}
                        variants={itemVariants}
                        whileHover={{
                          scale: 1.01,
                          boxShadow: "0 0 40px rgba(94, 240, 138, 0.08)",
                        }}
                        className="flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 transition-all duration-300"
                      >
                        <div className="mb-6 flex-grow">
                          <div className="flex justify-between items-start mb-4 gap-4 flex-wrap">
                            <h4 className="text-2xl font-bold">
                              <EditableText
                                textKey={product.displayNameKey}
                                defaultText={product.displayName}
                                as="span"
                              />
                            </h4>
                            <span className="px-3 py-1 bg-[#5EF08A]/10 text-[#5EF08A] rounded-full text-sm font-semibold border border-[#5EF08A]/20">
                              {displayPrice}
                            </span>
                          </div>

                          <p className="text-gray-300 italic mb-6 border-l-2 border-[#5EF08A] pl-4">
                            "
                            <EditableText
                              textKey={product.taglineKey}
                              defaultText={product.tagline}
                              as="span"
                            />
                            "
                          </p>

                          {product.bestFor && product.bestForKey && (
                            <div className="mb-6 text-sm">
                              <span className="text-gray-500 font-semibold uppercase tracking-wider">
                                <EditableText
                                  textKey={`${product.displayNameKey}.best-for-label`}
                                  defaultText="Best For:"
                                  as="span"
                                />
                              </span>{" "}
                              <span className="text-gray-300">
                                <EditableText
                                  textKey={product.bestForKey}
                                  defaultText={product.bestFor}
                                  as="span"
                                />
                              </span>
                            </div>
                          )}

                          <ul className="space-y-3 mb-8">
                            {product.bullets.map((bullet) => (
                              <li
                                key={bullet.key}
                                className="flex items-start gap-3 text-gray-300 text-sm"
                              >
                                <CheckCircle2 className="w-5 h-5 text-[#5EF08A] shrink-0 mt-0.5" />
                                <span className="leading-tight">
                                  <EditableText
                                    textKey={bullet.key}
                                    defaultText={bullet.text}
                                    as="span"
                                  />
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-auto space-y-6 pt-6 border-t border-white/10">
                          {product.upgradePath && product.upgradePathKey && (
                            <div className="bg-[#5EF08A]/5 border border-[#5EF08A]/10 rounded-lg p-4 text-sm text-gray-300">
                              <EditableText
                                textKey={product.upgradePathKey}
                                defaultText={product.upgradePath}
                                as="span"
                              />
                            </div>
                          )}

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">
                              <EditableText
                                textKey="custom-sites.recommended-engine-label"
                                defaultText="Recommended Engine:"
                                as="span"
                              />
                            </span>
                            <span className="font-semibold text-white">
                              <EditableText
                                textKey={product.recommendedPlanKey}
                                defaultText={product.recommendedPlan}
                                as="span"
                              />
                            </span>
                          </div>

                          {/* CTA */}
                          <div className="pt-2">
                            <motion.button
                              whileHover={{
                                scale: 1.02,
                                boxShadow: "0 0 20px rgba(94, 240, 138, 0.4)",
                              }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                handleGetStarted(product.backendName)
                              }
                              className="w-full bg-[#5EF08A] text-[#0A0B14] font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-[#4ade80]"
                              data-ocid={`custom-sites.cta_${product.backendName.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              <EditableText
                                textKey={`custom-sites.${product.backendName.toLowerCase().replace(/\s+/g, "-")}.cta`}
                                defaultText="Secure This Build Slot"
                                as="span"
                              />
                            </motion.button>
                            <p className="text-center text-xs text-gray-500 mt-3 font-medium">
                              <EditableText
                                textKey="custom-sites.cta-note"
                                defaultText="Limited build slots available each month"
                                as="span"
                              />
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
