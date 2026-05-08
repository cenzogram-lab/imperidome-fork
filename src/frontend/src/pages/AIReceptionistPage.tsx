import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Bot,
  CalendarCheck,
  Headphones,
  MessageSquare,
  Mic,
  PhoneMissed,
  ShieldCheck,
  TrendingUp,
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

// Static metadata for each AI tier — backend names match exactly what's seeded
const AI_TIER_META = [
  {
    backendName: "THE SAFETY NET",
    displayName: "THE SAFETY NET",
    setup: "No Setup Fee",
    tagline: "Never let a missed call go cold.",
    features: [
      "Instant Missed-Call Text-Back",
      "Automated SMS Lead Routing",
      "Custom Web-Chat Widget",
      "Lead Capture Dashboard",
    ],
    popular: false,
  },
  {
    backendName: "THE RECEPTIONIST",
    displayName: "THE RECEPTIONIST",
    setup: "+ $249 One-Time Setup",
    tagline: "A conversational AI voice agent that answers your calls 24/7.",
    features: [
      "Hyper-Realistic AI Voice Agent",
      "Answers Inbound Calls Instantly",
      "Handles Business FAQs (Hours, Services)",
      "Sends Booking Links via SMS automatically",
      "Call Transcripts & Recordings Feed",
    ],
    popular: true,
  },
  {
    backendName: "THE CLOSER",
    displayName: "THE CLOSER",
    setup: "+ $499 One-Time Setup",
    tagline:
      "Advanced AI that checks your live calendar and verbally books appointments.",
    features: [
      "Everything in The Receptionist",
      "Direct Live Calendar Integration",
      "Verbal Appointment Booking on the call",
      "Custom Qualifying Questions",
      "Instant CRM Integration",
      "Advanced Objection Handling",
    ],
    popular: false,
  },
];

function getProductPrice(p: Product): number {
  if (p.price_monthly != null) return p.price_monthly;
  if (p.price_onetime != null) return p.price_onetime;
  if (p.price_annual != null) return p.price_annual;
  return 0;
}

export default function AIReceptionistPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const { addItem, openDrawer } = useCartStore();

  // Live backend products for AI Receptionist category
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    (
      actor as unknown as {
        getProductsByType: (t: string) => Promise<Product[]>;
      }
    )
      .getProductsByType("AI Receptionist")
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

  /** Return formatted price string; "..." while loading */
  const getDisplayPrice = (backendName: string): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(backendName);
    if (!p) return "—";
    return `$${getProductPrice(p).toLocaleString()}/mo`;
  };

  /** Is this tier active per admin toggle? */
  const isTierActive = (backendName: string): boolean => {
    if (!catalogLoaded || backendProducts.length === 0) return true;
    return backendProducts.some(
      (p) => p.name.toLowerCase() === backendName.toLowerCase(),
    );
  };

  const visibleTiers = AI_TIER_META.filter((t) => isTierActive(t.backendName));

  // Redirect to homepage when the entire AI Receptionist category is toggled off
  useEffect(() => {
    if (
      catalogLoaded &&
      backendProducts.length === 0 &&
      visibleTiers.length === 0
    ) {
      navigate({ to: "/" });
    }
  }, [catalogLoaded, backendProducts.length, visibleTiers.length, navigate]);

  return (
    <>
      <div className="min-h-screen bg-[#0A0B14] text-white font-sans pb-24 selection:bg-[#5EF08A]/30">
        {/* STICKY URGENCY BANNER */}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-50 w-full bg-[#0A0B14]/90 backdrop-blur-md border-b border-[#5EF08A]/20 py-3"
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
            <PhoneMissed className="w-5 h-5 text-[#5EF08A]" />
            <p className="text-sm font-medium">
              <span className="text-[#5EF08A] font-bold mr-2">
                <EditableText
                  textKey="ai-receptionist.banner.label"
                  defaultText="THE LEAKY BUCKET:"
                  as="span"
                />
              </span>
              <EditableText
                textKey="ai-receptionist.banner.tagline"
                defaultText="Small businesses lose thousands monthly by failing to answer the phone instantly. Fix it today."
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
              textKey="ai-receptionist.back-link"
              defaultText="Back to Services Dashboard"
              as="span"
            />
          </Link>

          {/* HERO */}
          <div className="mb-20 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5EF08A]/10 border border-[#5EF08A]/20 text-[#5EF08A] text-sm font-bold uppercase tracking-wide mb-6">
              <Bot className="w-4 h-4" />
              <EditableText
                textKey="ai-receptionist.hero.eyebrow"
                defaultText="24/7 Intelligent Lead Capture"
                as="span"
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              <EditableText
                textKey="ai-receptionist.hero.heading-line1"
                defaultText="You pay for ads to ring the phone."
                as="span"
              />{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                <EditableText
                  textKey="ai-receptionist.hero.heading-line2"
                  defaultText="We make sure someone answers."
                  as="span"
                />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed mb-8">
              <EditableText
                textKey="ai-receptionist.hero.subheading"
                defaultText="Deploy a hyper-realistic AI voice agent that answers on the first ring, handles objections, and books appointments directly onto your calendar while you sleep."
                as="span"
              />
            </p>

            <div className="flex flex-col md:flex-row gap-4 md:gap-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm text-[#5EF08A] font-bold uppercase tracking-wide">
                <Mic className="w-4 h-4 fill-[#5EF08A]" />
                <EditableText
                  textKey="ai-receptionist.hero.feature-1"
                  defaultText="Indistinguishable from humans"
                  as="span"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5EF08A] font-bold uppercase tracking-wide">
                <CalendarCheck className="w-4 h-4" />
                <EditableText
                  textKey="ai-receptionist.hero.feature-2"
                  defaultText="Books appointments live"
                  as="span"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5EF08A] font-bold uppercase tracking-wide">
                <MessageSquare className="w-4 h-4" />
                <EditableText
                  textKey="ai-receptionist.hero.feature-3"
                  defaultText="Instant SMS Text-Back"
                  as="span"
                />
              </div>
            </div>
          </div>

          {/* THE TIERS */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="mb-24"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">
              <EditableText
                textKey="ai-receptionist.tiers.heading"
                defaultText="Select Your AI Agent"
                as="span"
              />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {visibleTiers.map((tier) => {
                const displayPrice = getDisplayPrice(tier.backendName);
                const tierSlug = tier.backendName
                  .toLowerCase()
                  .replace(/\s+/g, "-");
                return (
                  <motion.div
                    key={tier.backendName}
                    variants={itemVariants}
                    className={`flex flex-col rounded-3xl p-8 relative transition-all duration-300 ${
                      tier.popular
                        ? "bg-gradient-to-b from-[#0A0B14] to-[#5EF08A]/5 border-2 border-[#5EF08A] shadow-[0_0_30px_rgba(94,240,138,0.1)]"
                        : "bg-white/5 backdrop-blur-xl border border-white/10"
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5EF08A] text-[#0A0B14] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_0_20px_rgba(94,240,138,0.4)]">
                        <EditableText
                          textKey="ai-receptionist.popular-badge"
                          defaultText="Most Popular"
                          as="span"
                        />
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        <EditableText
                          textKey={`ai-receptionist.${tierSlug}.name`}
                          defaultText={tier.displayName}
                          as="span"
                        />
                      </h3>
                      <div className="text-4xl font-extrabold text-[#5EF08A] mb-1">
                        {displayPrice}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">
                        <EditableText
                          textKey={`ai-receptionist.${tierSlug}.setup`}
                          defaultText={tier.setup}
                          as="span"
                        />
                      </div>
                    </div>

                    <p
                      className={`italic text-sm mb-8 pb-6 border-b border-white/10 ${tier.popular ? "text-[#5EF08A]" : "text-gray-400"}`}
                    >
                      "
                      <EditableText
                        textKey={`ai-receptionist.${tierSlug}.tagline`}
                        defaultText={tier.tagline}
                        as="span"
                      />
                      "
                    </p>

                    <div className="flex-grow space-y-4 mb-8">
                      <ul className="space-y-3">
                        {tier.features.map((feature, fi) => (
                          <li
                            key={feature}
                            className="flex items-start gap-3 text-sm text-gray-300 leading-tight"
                          >
                            <ShieldCheck
                              className={`w-5 h-5 shrink-0 mt-0.5 ${tier.popular ? "text-[#5EF08A]" : "text-gray-500"}`}
                            />
                            <EditableText
                              textKey={`ai-receptionist.${tierSlug}.feature-${fi + 1}`}
                              defaultText={feature}
                              as="span"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/10">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const p = backendProducts.find(
                            (bp) =>
                              bp.name.toLowerCase() ===
                              tier.backendName.toLowerCase(),
                          );
                          const priceStr = p
                            ? `$${getProductPrice(p).toLocaleString()}/mo`
                            : getDisplayPrice(tier.backendName);
                          addItem({ name: tier.backendName, price: priceStr });
                          openDrawer();
                        }}
                        data-ocid="ai_receptionist.primary_button"
                        className={`w-full font-bold py-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 ${
                          tier.popular
                            ? "bg-[#5EF08A] text-[#0A0B14] hover:bg-[#4ade80] shadow-[0_0_20px_rgba(94,240,138,0.3)]"
                            : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        <EditableText
                          textKey={`ai-receptionist.${tierSlug}.cta`}
                          defaultText="Deploy This System"
                          as="span"
                        />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* THE CLIENT DASHBOARD EXPERIENCE */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-24"
          >
            <div className="bg-gradient-to-br from-white/5 to-[#5EF08A]/5 border border-white/10 rounded-3xl p-8 md:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  <EditableText
                    textKey="ai-receptionist.dashboard.heading"
                    defaultText="See Your ROI in Real-Time"
                    as="span"
                  />
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  <EditableText
                    textKey="ai-receptionist.dashboard.subheading"
                    defaultText="Your Sovereign Dashboard gives you full transparency into every conversation, every saved lead, and every dollar salvaged by the AI."
                    as="span"
                  />
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-[#0A0B14] p-6 rounded-2xl border border-white/5">
                  <TrendingUp className="w-8 h-8 text-[#5EF08A] mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-white">
                    <EditableText
                      textKey="ai-receptionist.dashboard.card-1.title"
                      defaultText='"Revenue Saved" Metric'
                      as="span"
                    />
                  </h3>
                  <p className="text-sm text-gray-400">
                    <EditableText
                      textKey="ai-receptionist.dashboard.card-1.desc"
                      defaultText="Instantly see exactly how many missed calls were salvaged and how much potential revenue the AI secured for you this month."
                      as="span"
                    />
                  </p>
                </div>
                <div className="bg-[#0A0B14] p-6 rounded-2xl border border-white/5">
                  <Activity className="w-8 h-8 text-[#5EF08A] mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-white">
                    <EditableText
                      textKey="ai-receptionist.dashboard.card-2.title"
                      defaultText="Call Transcripts & Audio"
                      as="span"
                    />
                  </h3>
                  <p className="text-sm text-gray-400">
                    <EditableText
                      textKey="ai-receptionist.dashboard.card-2.desc"
                      defaultText="Read full text transcripts or listen to the raw audio recordings of the AI interacting perfectly with your prospects."
                      as="span"
                    />
                  </p>
                </div>
                <div className="bg-[#0A0B14] p-6 rounded-2xl border border-white/5">
                  <Zap className="w-8 h-8 text-[#5EF08A] mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-white">
                    <EditableText
                      textKey="ai-receptionist.dashboard.card-3.title"
                      defaultText="Instant Knowledge Base"
                      as="span"
                    />
                  </h3>
                  <p className="text-sm text-gray-400">
                    <EditableText
                      textKey="ai-receptionist.dashboard.card-3.desc"
                      defaultText='Update business rules on the fly. Type "We are closed this Friday" into your portal, and the AI instantly learns the new protocol.'
                      as="span"
                    />
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* REVENUE-FIRST FOCUS */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="bg-[#0A0B14] border border-[#5EF08A]/20 rounded-2xl p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
              <Headphones className="w-64 h-64" />
            </div>
            <h2 className="text-2xl font-bold mb-4 relative z-10 text-white">
              <EditableText
                textKey="ai-receptionist.revenue-focus.heading"
                defaultText="Revenue-First Focus"
                as="span"
              />
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed max-w-3xl relative z-10 mb-6">
              <EditableText
                textKey="ai-receptionist.revenue-focus.intro"
                defaultText="Our AI agents are strictly built for"
                as="span"
              />{" "}
              <strong className="text-white">
                <EditableText
                  textKey="ai-receptionist.revenue-focus.bold"
                  defaultText="Lead Capture and Appointment Booking"
                  as="span"
                />
              </strong>
              .
            </p>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 relative z-10 max-w-3xl">
              <p className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-widest text-[#5EF08A]">
                <EditableText
                  textKey="ai-receptionist.revenue-focus.protocol-label"
                  defaultText="The Protocol"
                  as="span"
                />
              </p>
              <p className="text-gray-300 italic">
                "
                <EditableText
                  textKey="ai-receptionist.revenue-focus.protocol-quote"
                  defaultText="We don't build agents to argue over billing disputes or technical support. If a caller asks a complex support question, the AI is programmed to politely capture their details and instantly route the ticket to your human experts, keeping the AI laser-focused on generating new revenue."
                  as="span"
                />
                "
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
}
