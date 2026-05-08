import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  LifeBuoy,
  ShieldCheck,
  Star,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import type { Product } from "../backend.d.ts";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
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

// Backend names exactly as seeded in main.mo
const saasPlans = [
  {
    backendName: "Keep It Live",
    displayName: "KEEP IT LIVE",
    displayNameKey: "saas-plans.keep-it-live.name",
    badge: "Self-Managed",
    badgeKey: "saas-plans.keep-it-live.badge",
    tagline:
      "For clients who want full control and handle everything themselves.",
    taglineKey: "saas-plans.keep-it-live.tagline",
    bestFor: "Fully self-managed clients who handle all their own content.",
    bestForKey: "saas-plans.keep-it-live.best-for",
    bullets: [
      {
        text: "Web hosting and uptime monitoring",
        key: "saas-plans.keep-it-live.bullet-1",
      },
      {
        text: "SSL certificate renewal",
        key: "saas-plans.keep-it-live.bullet-2",
      },
      { text: "Security monitoring", key: "saas-plans.keep-it-live.bullet-3" },
      {
        text: "99.9% uptime guarantee",
        key: "saas-plans.keep-it-live.bullet-4",
      },
    ],
    supportNote:
      "No support included — self-service only. (Note: Ad-hoc support or emergency fixes are billed at $125/hour).",
    supportNoteKey: "saas-plans.keep-it-live.support-note",
    dashboardAccess:
      "Limited content editor. You manage all your own content (text, photos, basic updates). Structural changes are not permitted.",
    dashboardAccessKey: "saas-plans.keep-it-live.dashboard-access",
    warning:
      "Most businesses outgrow this quickly once they need updates or support.",
    warningKey: "saas-plans.keep-it-live.warning",
    popular: false,
    cta: "Secure This Plan",
    ctaKey: "saas-plans.keep-it-live.cta",
  },
  {
    backendName: "Stay Sharp",
    displayName: "STAY SHARP",
    displayNameKey: "saas-plans.stay-sharp.name",
    badge: "Light Support",
    badgeKey: "saas-plans.stay-sharp.badge",
    tagline:
      "Keep your site updated, secure, and running smoothly — without thinking about it.",
    taglineKey: "saas-plans.stay-sharp.tagline",
    bestFor: "Service businesses and portfolios with stable content.",
    bestForKey: "saas-plans.stay-sharp.best-for",
    bullets: [
      {
        text: "Everything in Keep It Live",
        key: "saas-plans.stay-sharp.bullet-1",
      },
      {
        text: "3 quick-fix edits per month (text, photos, hours, pricing)",
        key: "saas-plans.stay-sharp.bullet-2",
      },
      {
        text: "Standard support (24–48hr response time)",
        key: "saas-plans.stay-sharp.bullet-3",
      },
      {
        text: "Monthly security scans and software updates",
        key: "saas-plans.stay-sharp.bullet-4",
      },
      {
        text: "Google Analytics access",
        key: "saas-plans.stay-sharp.bullet-5",
      },
      {
        text: "Quarterly check-in email: 4-line summary covering site health, traffic numbers, 1 observation, 1 recommendation",
        key: "saas-plans.stay-sharp.bullet-6",
      },
      {
        text: "Annual performance review call",
        key: "saas-plans.stay-sharp.bullet-7",
      },
    ],
    supportNote: undefined,
    supportNoteKey: undefined,
    dashboardAccess:
      "Limited content editor. Make your own updates OR submit up to 3 edits per month in writing to our agency for convenience.",
    dashboardAccessKey: "saas-plans.stay-sharp.dashboard-access",
    warning: undefined,
    warningKey: undefined,
    popular: false,
    cta: "Secure This Plan",
    ctaKey: "saas-plans.stay-sharp.cta",
  },
  {
    backendName: "Stay Ahead",
    displayName: "STAY AHEAD",
    displayNameKey: "saas-plans.stay-ahead.name",
    badge: "Growth Engine",
    badgeKey: "saas-plans.stay-ahead.badge",
    popular: true,
    tagline:
      "Turn your website into an actively managed growth asset. Instead of reacting, your site evolves.",
    taglineKey: "saas-plans.stay-ahead.tagline",
    bestFor:
      "Active businesses — salons, restaurants, gyms, medical, and subscription services.",
    bestForKey: "saas-plans.stay-ahead.best-for",
    bullets: [
      {
        text: "Everything in Stay Sharp",
        key: "saas-plans.stay-ahead.bullet-1",
      },
      {
        text: "Unlimited standard content edits per month (Subject to fair use: up to 3 hours of agency time per month)",
        key: "saas-plans.stay-ahead.bullet-2",
      },
      {
        text: "Priority support (same-day or next business day)",
        key: "saas-plans.stay-ahead.bullet-3",
      },
      {
        text: "Menu, service, and pricing updates handled same-day",
        key: "saas-plans.stay-ahead.bullet-4",
      },
      {
        text: "Seasonal promotions and event pages (up to 2 per month)",
        key: "saas-plans.stay-ahead.bullet-5",
      },
      {
        text: "Quarterly SEO audit and keyword report",
        key: "saas-plans.stay-ahead.bullet-6",
      },
      {
        text: "Booking system management",
        key: "saas-plans.stay-ahead.bullet-7",
      },
      {
        text: "Monthly uptime and performance report",
        key: "saas-plans.stay-ahead.bullet-8",
      },
    ],
    supportNote: undefined,
    supportNoteKey: undefined,
    dashboardAccess:
      "Full limited content editor (text, photos, blog posts, menu items). Submit unlimited standard edits in writing to the agency for same-day handling.",
    dashboardAccessKey: "saas-plans.stay-ahead.dashboard-access",
    warning: undefined,
    warningKey: undefined,
    cta: "Secure This Plan",
    ctaKey: "saas-plans.stay-ahead.cta",
  },
  {
    backendName: "Full Partner",
    displayName: "FULL PARTNER",
    displayNameKey: "saas-plans.full-partner.name",
    badge: "Revenue System",
    badgeKey: "saas-plans.full-partner.badge",
    tagline:
      "We operate your website like an extension of your business. Designed for sites driving direct revenue.",
    taglineKey: "saas-plans.full-partner.tagline",
    bestFor: "E-commerce, multi-location restaurants, and membership clients.",
    bestForKey: "saas-plans.full-partner.best-for",
    bullets: [
      {
        text: "Everything in Stay Ahead",
        key: "saas-plans.full-partner.bullet-1",
      },
      {
        text: "Full e-commerce or ordering system management",
        key: "saas-plans.full-partner.bullet-2",
      },
      {
        text: "Product and inventory additions/updates",
        key: "saas-plans.full-partner.bullet-3",
      },
      {
        text: "Order and subscription management support",
        key: "saas-plans.full-partner.bullet-4",
      },
      {
        text: "Monthly SEO work (on-page optimization + local citations)",
        key: "saas-plans.full-partner.bullet-5",
      },
      {
        text: "Monthly performance report (traffic, orders, revenue, rankings)",
        key: "saas-plans.full-partner.bullet-6",
      },
      {
        text: "Priority phone and email support",
        key: "saas-plans.full-partner.bullet-7",
      },
      {
        text: "Proactive site recommendations monthly",
        key: "saas-plans.full-partner.bullet-8",
      },
    ],
    supportNote: undefined,
    supportNoteKey: undefined,
    dashboardAccess:
      "Advanced limited content editor (text, photos, blog posts, menu items, product listings, and inventory). Unlimited edits submitted in writing are handled with priority.",
    dashboardAccessKey: "saas-plans.full-partner.dashboard-access",
    warning: undefined,
    warningKey: undefined,
    popular: false,
    cta: "Secure This Plan",
    ctaKey: "saas-plans.full-partner.cta",
  },
  {
    backendName: "Enterprise Partner",
    displayName: "ENTERPRISE PARTNER",
    displayNameKey: "saas-plans.enterprise-partner.name",
    badge: "Full Infrastructure",
    badgeKey: "saas-plans.enterprise-partner.badge",
    tagline:
      "Full digital infrastructure management with strategic oversight. You have a team managing it for you.",
    taglineKey: "saas-plans.enterprise-partner.tagline",
    bestFor: "Enterprise and complex multi-location clients.",
    bestForKey: "saas-plans.enterprise-partner.best-for",
    bullets: [
      {
        text: "Everything in Full Partner",
        key: "saas-plans.enterprise-partner.bullet-1",
      },
      {
        text: "Dedicated account manager (named direct contact)",
        key: "saas-plans.enterprise-partner.bullet-2",
      },
      {
        text: "Monthly 30-minute strategy call",
        key: "saas-plans.enterprise-partner.bullet-3",
      },
      {
        text: "Multi-location management",
        key: "saas-plans.enterprise-partner.bullet-4",
      },
      {
        text: "Advanced SEO and content strategy",
        key: "saas-plans.enterprise-partner.bullet-5",
      },
      {
        text: "API and integration monitoring",
        key: "saas-plans.enterprise-partner.bullet-6",
      },
      {
        text: "Quarterly growth review with recommendations",
        key: "saas-plans.enterprise-partner.bullet-7",
      },
      {
        text: "First priority on all support requests",
        key: "saas-plans.enterprise-partner.bullet-8",
      },
    ],
    supportNote: undefined,
    supportNoteKey: undefined,
    dashboardAccess:
      "Full advanced content editor (text, photos, blog posts, menu items, products, inventory, and multi-location content). Your dedicated account manager handles all edit requests with first-priority response.",
    dashboardAccessKey: "saas-plans.enterprise-partner.dashboard-access",
    warning: undefined,
    warningKey: undefined,
    popular: false,
    cta: "Secure This Plan",
    ctaKey: "saas-plans.enterprise-partner.cta",
  },
];

function getProductPrice(p: Product): number {
  if (p.price_monthly != null) return p.price_monthly;
  if (p.price_onetime != null) return p.price_onetime;
  if (p.price_annual != null) return p.price_annual;
  return 0;
}

export default function SaaSPlansPage() {
  const { addItem, openDrawer } = useCartStore();
  const { actor, isFetching } = useActor();

  // Live backend products for SaaS Plans category
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    (
      actor as unknown as {
        getProductsByType: (t: string) => Promise<Product[]>;
      }
    )
      .getProductsByType("SaaS Plans")
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

  /** Return "$<price>/mo" from backend; "..." while loading */
  const getDisplayPrice = (backendName: string): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(backendName);
    if (!p) return "—";
    return `$${getProductPrice(p).toLocaleString()}/mo`;
  };

  /** Is this plan active per admin toggle? */
  const isPlanActive = (backendName: string): boolean => {
    if (!catalogLoaded || backendProducts.length === 0) return true;
    return backendProducts.some(
      (p) => p.name.toLowerCase() === backendName.toLowerCase(),
    );
  };

  const visiblePlans = saasPlans.filter((p) => isPlanActive(p.backendName));

  return (
    <>
      <div className="min-h-screen bg-[#0A0B14] text-white font-sans pb-24 selection:bg-[#5EF08A]/30">
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-50 w-full bg-[#0A0B14]/90 backdrop-blur-md border-b border-[#5EF08A]/20 py-3"
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#5EF08A]" />
            <p className="text-sm md:text-base font-medium text-white/90 text-center">
              <span className="text-[#5EF08A] font-bold mr-2">
                <EditableText
                  textKey="saas-plans.banner.label"
                  defaultText="SECURE YOUR INFRASTRUCTURE:"
                  as="span"
                />
              </span>
              <EditableText
                textKey="saas-plans.banner.tagline"
                defaultText="Most clients choose a Growth Plan to keep their site updated and performing."
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
              textKey="saas-plans.back-link"
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
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
            >
              <EditableText
                textKey="saas-plans.hero.heading-line1"
                defaultText="Website Operating System:"
                as="span"
              />{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                <EditableText
                  textKey="saas-plans.hero.heading-line2"
                  defaultText="Growth &amp; Performance"
                  as="span"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-2xl text-gray-400 mb-8 max-w-2xl leading-relaxed"
            >
              <EditableText
                textKey="saas-plans.hero.subheading"
                defaultText="Your website isn't a one-time build — it's a system that needs to be managed, optimized, and improved to generate results."
                as="span"
              />
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="bg-[#5EF08A]/10 border border-[#5EF08A]/20 rounded-xl p-6 mb-8 max-w-3xl"
            >
              <p className="text-lg text-white font-medium">
                <EditableText
                  textKey="saas-plans.hero.callout"
                  defaultText="👉 A website that isn't updated, optimized, and managed will slowly lose performance over time — these plans ensure it keeps working for your business."
                  as="span"
                />
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col md:flex-row gap-4 md:gap-8 pt-6 border-t border-white/10"
            >
              <div className="flex items-center gap-2 text-sm text-[#5EF08A] font-bold uppercase tracking-wide">
                <Zap className="w-4 h-4 fill-[#5EF08A]" />
                <EditableText
                  textKey="saas-plans.hero.feature-1"
                  defaultText="Send it. We handle it."
                  as="span"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5EF08A] font-bold uppercase tracking-wide">
                <Clock className="w-4 h-4" />
                <EditableText
                  textKey="saas-plans.hero.feature-2"
                  defaultText="No logins, no stress"
                  as="span"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5EF08A] font-bold uppercase tracking-wide">
                <TrendingUp className="w-4 h-4" />
                <EditableText
                  textKey="saas-plans.hero.feature-3"
                  defaultText="Prevents digital decay"
                  as="span"
                />
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-24"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-4">
                    <EditableText
                      textKey="saas-plans.value-prop.heading"
                      defaultText="Stop Paying Hourly for Digital Duct Tape"
                      as="span"
                    />
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed mb-6">
                    <EditableText
                      textKey="saas-plans.value-prop.body"
                      defaultText="Hiring out individual tasks drains your budget and slows down execution. Our Growth Plans replace the need for an expensive piecemeal team."
                      as="span"
                    />
                  </p>
                </div>
                <div className="bg-[#0A0B14] border border-white/10 rounded-2xl p-8">
                  <h4 className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-6">
                    <EditableText
                      textKey="saas-plans.value-prop.savings-heading"
                      defaultText="What You Save Monthly"
                      as="span"
                    />
                  </h4>
                  <ul className="space-y-4 mb-8 text-lg">
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-400">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <EditableText
                          textKey="saas-plans.value-prop.saving-1-label"
                          defaultText="Freelance Developer"
                          as="span"
                        />
                      </span>{" "}
                      <span className="text-white/50 line-through">
                        <EditableText
                          textKey="saas-plans.value-prop.saving-1-cost"
                          defaultText="$100+/hr"
                          as="span"
                        />
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-400">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <EditableText
                          textKey="saas-plans.value-prop.saving-2-label"
                          defaultText="Virtual Assistant"
                          as="span"
                        />
                      </span>{" "}
                      <span className="text-white/50 line-through">
                        <EditableText
                          textKey="saas-plans.value-prop.saving-2-cost"
                          defaultText="$300–$800/mo"
                          as="span"
                        />
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-400">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <EditableText
                          textKey="saas-plans.value-prop.saving-3-label"
                          defaultText="Premium SEO Tools"
                          as="span"
                        />
                      </span>{" "}
                      <span className="text-white/50 line-through">
                        <EditableText
                          textKey="saas-plans.value-prop.saving-3-cost"
                          defaultText="$50–$200/mo"
                          as="span"
                        />
                      </span>
                    </li>
                  </ul>
                  <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-white font-bold text-xl">
                      <EditableText
                        textKey="saas-plans.value-prop.footer-label"
                        defaultText="The"
                        as="span"
                      />{" "}
                      <span className="text-[#5EF08A]">
                        <EditableText
                          textKey="saas-plans.value-prop.footer-plan"
                          defaultText="Stay Ahead"
                          as="span"
                        />
                      </span>{" "}
                      <EditableText
                        textKey="saas-plans.value-prop.footer-suffix"
                        defaultText="Plan"
                        as="span"
                      />
                    </div>
                    <div className="bg-[#5EF08A]/20 text-[#5EF08A] px-4 py-2 rounded-lg font-bold border border-[#5EF08A]/30">
                      <EditableText
                        textKey="saas-plans.value-prop.footer-replaces"
                        defaultText="Replaces all for"
                        as="span"
                      />{" "}
                      {getDisplayPrice("Stay Ahead")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="mb-24"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visiblePlans.map((plan) => {
                const livePrice = getDisplayPrice(plan.backendName);
                return (
                  <motion.div
                    key={plan.backendName}
                    variants={itemVariants}
                    whileHover={{
                      y: -8,
                      boxShadow: plan.popular
                        ? "0 20px 40px -10px rgba(94, 240, 138, 0.25)"
                        : "0 10px 40px -10px rgba(255, 255, 255, 0.05)",
                    }}
                    className={`flex flex-col rounded-3xl p-8 relative transition-all duration-300 ${
                      plan.popular
                        ? "bg-gradient-to-b from-[#0A0B14] to-[#5EF08A]/5 border-2 border-[#5EF08A]"
                        : "bg-white/5 backdrop-blur-xl border border-white/10"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5EF08A] text-[#0A0B14] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_0_20px_rgba(94,240,138,0.4)]">
                        <Star className="w-3 h-3 fill-[#0A0B14]" />
                        <EditableText
                          textKey="saas-plans.popular-badge"
                          defaultText="Most Popular"
                          as="span"
                        />
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="text-[#5EF08A] text-xs font-bold uppercase tracking-widest mb-2">
                        <EditableText
                          textKey={plan.badgeKey}
                          defaultText={plan.badge}
                          as="span"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        <EditableText
                          textKey={plan.displayNameKey}
                          defaultText={plan.displayName}
                          as="span"
                        />
                      </h3>
                      <div className="text-4xl font-extrabold text-white">
                        {livePrice}
                      </div>
                    </div>

                    <p
                      className={`italic text-sm mb-6 ${plan.popular ? "text-[#5EF08A]" : "text-gray-400"}`}
                    >
                      "
                      <EditableText
                        textKey={plan.taglineKey}
                        defaultText={plan.tagline}
                        as="span"
                      />
                      "
                    </p>

                    <div className="mb-6 text-sm pb-6 border-b border-white/10">
                      <span className="text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                        <EditableText
                          textKey="saas-plans.best-for-label"
                          defaultText="Best For:"
                          as="span"
                        />
                      </span>
                      <span className="text-gray-300">
                        <EditableText
                          textKey={plan.bestForKey}
                          defaultText={plan.bestFor}
                          as="span"
                        />
                      </span>
                    </div>

                    <div className="flex-grow space-y-4 mb-8">
                      <ul className="space-y-3">
                        {plan.bullets.map((item) => (
                          <li
                            key={item.key}
                            className="flex items-start gap-3 text-sm text-gray-300 leading-tight"
                          >
                            <CheckCircle2
                              className={`w-5 h-5 shrink-0 mt-0.5 ${plan.popular ? "text-[#5EF08A]" : "text-gray-500"}`}
                            />
                            <span>
                              <EditableText
                                textKey={item.key}
                                defaultText={item.text}
                                as="span"
                              />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 mb-8 bg-[#0A0B14] p-4 rounded-xl border border-white/5">
                      {plan.supportNote && plan.supportNoteKey && (
                        <div className="flex items-start gap-2 text-xs text-gray-400">
                          <LifeBuoy className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">
                            <strong className="text-white">
                              <EditableText
                                textKey="saas-plans.support-label"
                                defaultText="Support:"
                                as="span"
                              />
                            </strong>{" "}
                            <EditableText
                              textKey={plan.supportNoteKey}
                              defaultText={plan.supportNote}
                              as="span"
                            />
                          </span>
                        </div>
                      )}
                      {plan.dashboardAccess && plan.dashboardAccessKey && (
                        <div className="flex items-start gap-2 text-xs text-gray-400">
                          <LayoutDashboard className="w-4 h-4 text-[#5EF08A] shrink-0 mt-0.5" />
                          <span className="leading-relaxed">
                            <strong className="text-white">
                              <EditableText
                                textKey="saas-plans.dashboard-label"
                                defaultText="Dashboard Access:"
                                as="span"
                              />
                            </strong>{" "}
                            <EditableText
                              textKey={plan.dashboardAccessKey}
                              defaultText={plan.dashboardAccess}
                              as="span"
                            />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto space-y-4 pt-6 border-t border-white/10">
                      {plan.warning && plan.warningKey && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs leading-relaxed">
                          <AlertTriangle className="w-4 h-4 inline mr-1 mb-0.5" />
                          <EditableText
                            textKey={plan.warningKey}
                            defaultText={plan.warning}
                            as="span"
                          />
                        </div>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          addItem({ name: plan.backendName, price: livePrice });
                          openDrawer();
                        }}
                        className={`w-full font-bold py-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 ${
                          plan.popular
                            ? "bg-[#5EF08A] text-[#0A0B14] hover:bg-[#4ade80] shadow-[0_0_20px_rgba(94,240,138,0.3)]"
                            : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                        }`}
                        data-ocid={`saas-plans.cta_${plan.backendName.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <EditableText
                          textKey={plan.ctaKey}
                          defaultText={plan.cta}
                          as="span"
                        />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
}
