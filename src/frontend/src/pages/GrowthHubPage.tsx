import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Lock,
  Settings,
  Target,
  TrendingUp,
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
const growthCategories = [
  {
    id: "traffic",
    title: "TRAFFIC",
    icon: <TrendingUp className="w-5 h-5" />,
    subtitle:
      "Get more people to your website. If no one sees your site, nothing else matters.",
    color: "from-blue-500/20 to-transparent border-blue-500/30",
    badgeColor: "#60a5fa",
    items: [
      {
        backendName: "Local SEO Booster",
        fallback: "$199/mo",
        desc: "Google Maps ranking, local citations, and monthly rank reports.",
        locked: true,
      },
      {
        backendName: "Blog / Content SEO",
        fallback: "$299/mo",
        desc: "2 optimized posts/mo targeting specific high-intent keywords.",
        locked: true,
      },
      {
        backendName: "Google Ads Management",
        fallback: "$399+/mo",
        desc: "Local search ad campaigns managed and optimized monthly.",
        locked: true,
      },
      {
        backendName: "Social Media Sync",
        fallback: "$99/mo",
        desc: "Monthly posts synced with website updates and promotions.",
        locked: true,
      },
    ],
  },
  {
    id: "conversion",
    title: "CONVERSION",
    icon: <Target className="w-5 h-5" />,
    subtitle:
      "Turn visitors into actual customers. Capture more leads without more traffic.",
    color: "from-[#5EF08A]/20 to-transparent border-[#5EF08A]/30",
    badgeColor: "#5EF08A",
    items: [
      {
        backendName: "Lead Capture Upgrade",
        fallback: "$99/mo",
        desc: "Exit-intent pop-ups, lead magnets, and 5-email drip sequences.",
        locked: true,
      },
      {
        backendName: "Review Generation",
        fallback: "$99/mo",
        desc: "Automated post-service review requests via email and SMS.",
        locked: true,
      },
      {
        backendName: "Site Audit",
        fallback: "$99 one-time",
        desc: "Full technical/UX audit with actionable report. 48hr turnaround.",
        locked: true,
      },
    ],
  },
  {
    id: "operations",
    title: "OPERATIONS",
    icon: <Settings className="w-5 h-5" />,
    subtitle:
      "Save time and automate. Run your business without doing more manual work.",
    color: "from-purple-500/20 to-transparent border-purple-500/30",
    badgeColor: "#c084fc",
    items: [
      {
        backendName: "Restaurant Menu Refresh",
        fallback: "$149/mo",
        desc: "Weekly menu updates, seasonal specials, and PDF exports.",
        locked: true,
      },
      {
        backendName: "IDX/MLS Integration",
        fallback: "$299+",
        desc: "Live property listings embedded directly in your real estate site.",
        locked: true,
      },
      {
        backendName: "Bulk Data Extraction",
        fallback: "$499 one-time",
        desc: "Extract and port massive historical catalogs exceeding standard caps.",
        locked: true,
      },
      {
        backendName: "Custom Page Expansion",
        fallback: "$149/pg",
        desc: "Add new pages to your existing site — designed and launched.",
        locked: true,
      },
    ],
  },
  {
    id: "monetization",
    title: "MONETIZATION",
    icon: <DollarSign className="w-5 h-5" />,
    subtitle:
      "Increase revenue per customer. Make more money from every single interaction.",
    color: "from-amber-500/20 to-transparent border-amber-500/30",
    badgeColor: "#fbbf24",
    items: [
      {
        backendName: "PWA Upgrade",
        fallback: "$299 one-time",
        desc: "Turn your site into an installable Progressive Web App (App Icon).",
        locked: true,
      },
      {
        backendName: "Annual Site Refresh",
        fallback: "$499/yr",
        desc: "Full redesign of your homepage and top 3 pages once a year.",
        locked: true,
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

export default function GrowthHubPage() {
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

  // Live backend products for Growth Hub category
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    (
      actor as unknown as {
        getProductsByType: (t: string) => Promise<Product[]>;
      }
    )
      .getProductsByType("Growth Hub")
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

  /**
   * Return live price string for a Growth Hub item.
   * Monthly → "$X/mo", onetime → "$X one-time", annual → "$X/yr"
   * Falls back to static string while loading or if not found.
   */
  const getDisplayPrice = (backendName: string, fallback: string): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(backendName);
    if (!p) return fallback; // keep fallback for complex prices like "$299+" or "$149/pg"
    const val = getProductPrice(p);
    if (p.price_monthly != null) return `$${val.toLocaleString()}/mo`;
    if (p.price_annual != null) return `$${val.toLocaleString()}/yr`;
    return `$${val.toLocaleString()} one-time`;
  };

  // Lead Engine Package price — pulled by name from backend
  const leadEnginePrice = (() => {
    if (!catalogLoaded) return "...";
    const p = findProduct("The Lead Engine Package");
    if (!p) return "$397/mo";
    const val = getProductPrice(p);
    return `$${val.toLocaleString()}/mo`;
  })();

  const handleAddToCart = (name: string, price: string) => {
    addItem({ name, price });
    openDrawer();
  };

  return (
    <>
      <div className="min-h-screen bg-[#0A0B14] text-white font-sans pb-24 selection:bg-[#5EF08A]/30">
        {/* STICKY BANNER */}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-50 w-full bg-[#0A0B14]/90 backdrop-blur-md border-b border-[#5EF08A]/20 py-3"
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-[#5EF08A]" />
            <p className="text-sm font-medium">
              <span className="text-[#5EF08A] font-bold mr-2">
                <EditableText
                  textKey="growth-hub.banner.label"
                  defaultText="GROWTH HUB:"
                  as="span"
                />
              </span>
              <EditableText
                textKey="growth-hub.banner.tagline"
                defaultText="Your business is live. Now it's time to scale it."
                as="span"
              />
            </p>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 pt-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#5EF08A] mb-12 group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <EditableText
              textKey="growth-hub.back-link"
              defaultText="Back to Services Dashboard"
              as="span"
            />
          </Link>

          {/* HERO & THE SALES PITCH */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                <EditableText
                  textKey="growth-hub.hero.heading-line1"
                  defaultText="Turn your site"
                  as="span"
                />{" "}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                  <EditableText
                    textKey="growth-hub.hero.heading-line2"
                    defaultText="into a revenue engine."
                    as="span"
                  />
                </span>
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed mb-8">
                <EditableText
                  textKey="growth-hub.hero.subheading"
                  defaultText="Your website is live. Now it's time to pour gasoline on the fire. Activate targeted upgrades to drive traffic, capture leads, and automate your operations without hiring more staff."
                  as="span"
                />
              </p>
              <div className="flex flex-col gap-4 border-l-2 border-[#5EF08A] pl-6 mb-8">
                <p className="text-lg text-gray-300">
                  👉{" "}
                  <strong className="text-white">
                    <EditableText
                      textKey="growth-hub.hero.point-1-label"
                      defaultText="Traffic"
                      as="span"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="growth-hub.hero.point-1-text"
                    defaultText="gets them to your door."
                    as="span"
                  />
                </p>
                <p className="text-lg text-gray-300">
                  👉{" "}
                  <strong className="text-white">
                    <EditableText
                      textKey="growth-hub.hero.point-2-label"
                      defaultText="Conversion"
                      as="span"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="growth-hub.hero.point-2-text"
                    defaultText="gets them to buy."
                    as="span"
                  />
                </p>
                <p className="text-lg text-gray-300">
                  👉{" "}
                  <strong className="text-white">
                    <EditableText
                      textKey="growth-hub.hero.point-3-label"
                      defaultText="Automation"
                      as="span"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="growth-hub.hero.point-3-text"
                    defaultText="gives you your time back."
                    as="span"
                  />
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#5EF08A]/10 rounded-full blur-[80px]" />
              <h3 className="text-2xl font-bold text-white mb-8 relative z-10">
                <EditableText
                  textKey="growth-hub.multiplier.heading"
                  defaultText="The Growth Multiplier Effect"
                  as="span"
                />
              </h3>

              <div className="space-y-8 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="bg-[#5EF08A]/10 p-3 rounded-xl border border-[#5EF08A]/20 shrink-0">
                    <TrendingUp className="w-6 h-6 text-[#5EF08A]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-1">
                      <EditableText
                        textKey="growth-hub.multiplier.step-1.title"
                        defaultText="1. Dominate Local Traffic"
                        as="span"
                      />
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      <EditableText
                        textKey="growth-hub.multiplier.step-1.desc"
                        defaultText="A beautiful site is useless if no one sees it. SEO and Ads ensure you show up exactly when customers are looking to buy, stealing clicks from competitors."
                        as="span"
                      />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#5EF08A]/10 p-3 rounded-xl border border-[#5EF08A]/20 shrink-0">
                    <Target className="w-6 h-6 text-[#5EF08A]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-1">
                      <EditableText
                        textKey="growth-hub.multiplier.step-2.title"
                        defaultText="2. Plug the Leaky Bucket"
                        as="span"
                      />
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      <EditableText
                        textKey="growth-hub.multiplier.step-2.desc"
                        defaultText="Traffic means nothing if it doesn't convert. Lead capture pop-ups and automated review generation turn passive visitors into booked revenue."
                        as="span"
                      />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#5EF08A]/10 p-3 rounded-xl border border-[#5EF08A]/20 shrink-0">
                    <Settings className="w-6 h-6 text-[#5EF08A]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-1">
                      <EditableText
                        textKey="growth-hub.multiplier.step-3.title"
                        defaultText="3. Scale Without Headcount"
                        as="span"
                      />
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      <EditableText
                        textKey="growth-hub.multiplier.step-3.desc"
                        defaultText="Stop doing manual data entry. Let our software handle the booking integrations, menu updates, and follow-ups so you can focus on fulfillment."
                        as="span"
                      />
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* SMART RECOMMENDATION BAR (THE BUNDLE) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-24 bg-gradient-to-r from-[#0A0B14] to-[#5EF08A]/10 border border-[#5EF08A]/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_0_40px_rgba(94,240,138,0.1)]"
          >
            <div>
              <div className="flex items-center gap-2 text-[#5EF08A] font-bold uppercase tracking-widest text-xs mb-2">
                <Zap className="w-4 h-4 fill-[#5EF08A]" />
                <EditableText
                  textKey="growth-hub.bundle.eyebrow"
                  defaultText="Recommended For You"
                  as="span"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                <EditableText
                  textKey="growth-hub.bundle.name"
                  defaultText="The Lead Engine Package"
                  as="span"
                />
              </h3>
              <p className="text-gray-300 mb-4 max-w-xl">
                <EditableText
                  textKey="growth-hub.bundle.desc"
                  defaultText="Stop losing leads to competitors. We combine Local SEO, Lead Capture, and Automated Reviews to generate a projected +15–25 leads per month."
                  as="span"
                />
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#0A0B14] rounded-md text-xs font-medium border border-white/10">
                  <EditableText
                    textKey="growth-hub.bundle.tag-1"
                    defaultText="Local SEO"
                    as="span"
                  />
                </span>
                <span className="px-3 py-1 bg-[#0A0B14] rounded-md text-xs font-medium border border-white/10">
                  <EditableText
                    textKey="growth-hub.bundle.tag-2"
                    defaultText="Lead Capture Pop-ups"
                    as="span"
                  />
                </span>
                <span className="px-3 py-1 bg-[#0A0B14] rounded-md text-xs font-medium border border-white/10">
                  <EditableText
                    textKey="growth-hub.bundle.tag-3"
                    defaultText="Review Gen SMS"
                    as="span"
                  />
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center min-w-[200px]">
              <div className="text-3xl font-extrabold text-white mb-4">
                {leadEnginePrice.replace("/mo", "")}
                <span className="text-sm text-gray-400 font-normal">/mo</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleAddToCart("The Lead Engine Package", leadEnginePrice)
                }
                className="w-full bg-[#5EF08A] text-[#0A0B14] font-bold py-3 px-6 rounded-xl hover:bg-[#4ade80] transition-colors shadow-[0_0_15px_rgba(94,240,138,0.4)]"
              >
                <EditableText
                  textKey="growth-hub.bundle.cta"
                  defaultText="Activate Bundle"
                  as="span"
                />
              </button>
            </div>
          </motion.div>

          {/* GROWTH CATEGORIES */}
          <div className="space-y-24">
            {growthCategories.map((category) => (
              <motion.section
                key={category.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
              >
                <div className="mb-10 flex flex-col items-start">
                  <div
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase mb-4"
                    style={{ color: category.badgeColor }}
                  >
                    {category.icon}
                    <EditableText
                      textKey={`growth-hub.${category.id}.title`}
                      defaultText={category.title}
                      as="span"
                    />
                  </div>
                  <h3 className="text-3xl font-bold mb-3">
                    <EditableText
                      textKey={`growth-hub.${category.id}.subtitle-main`}
                      defaultText={`${category.subtitle.split(".")[0]}.`}
                      as="span"
                    />
                  </h3>
                  <p className="text-gray-400 text-lg">
                    <EditableText
                      textKey={`growth-hub.${category.id}.subtitle-sub`}
                      defaultText={category.subtitle.split(".")[1]}
                      as="span"
                    />
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {category.items.map((item) => {
                    const livePrice = getDisplayPrice(
                      item.backendName,
                      item.fallback,
                    );
                    const itemSlug = item.backendName
                      .toLowerCase()
                      .replace(/[\s/]+/g, "-");
                    return (
                      <motion.div
                        key={item.backendName}
                        variants={itemVariants}
                        className={`bg-gradient-to-b ${category.color} bg-white/5 backdrop-blur-xl border rounded-2xl p-6 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-[#0A0B14] rounded-lg border border-white/10">
                            {item.locked ? (
                              <Lock className="w-4 h-4 text-gray-500" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-[#5EF08A]" />
                            )}
                          </div>
                          <span className="text-[#5EF08A] font-bold text-sm bg-[#5EF08A]/10 px-2 py-1 rounded-md">
                            {livePrice}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">
                          <EditableText
                            textKey={`growth-hub.${category.id}.${itemSlug}.name`}
                            defaultText={item.backendName}
                            as="span"
                          />
                        </h4>
                        <p className="text-sm text-gray-400 mb-6 flex-grow leading-relaxed">
                          <EditableText
                            textKey={`growth-hub.${category.id}.${itemSlug}.desc`}
                            defaultText={item.desc}
                            as="span"
                          />
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart(item.backendName, livePrice)
                          }
                          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 group"
                        >
                          <EditableText
                            textKey={`growth-hub.${category.id}.${itemSlug}.cta`}
                            defaultText="Activate"
                            as="span"
                          />{" "}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
