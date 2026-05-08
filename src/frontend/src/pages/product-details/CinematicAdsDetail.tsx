import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clapperboard,
  Film,
  ImageIcon,
  MonitorPlay,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { EditableText } from "../../components/EditableText";
import { Footer } from "../../components/Footer";

const pricingMap: Record<number, number> = {
  15: 299,
  20: 349,
  25: 394,
  30: 434,
  35: 469,
  40: 499,
  45: 524,
  50: 544,
  55: 559,
  60: 569,
};

const retainers = [
  {
    name: "THE PILOT",
    ads: "3 Ads / Qtr",
    price: "$1,049",
    turnaround: "48h",
    savings: "Save $658",
  },
  {
    name: "THE PRO",
    ads: "6 Ads / Qtr",
    price: "$1,899",
    turnaround: "24h",
    savings: "Save $1,515",
    popular: true,
  },
  {
    name: "THE ELITE",
    ads: "9 Ads / Qtr",
    price: "$2,499",
    turnaround: "Instant",
    savings: "Save $2,622",
  },
];

export default function CinematicAdsDetail() {
  const [duration, setDuration] = useState<number>(15);
  const currentPrice = pricingMap[duration];
  const navigate = useNavigate();

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
            <MonitorPlay className="w-5 h-5 text-[#5EF08A]" />
            <p className="text-sm font-medium">
              <span className="text-[#5EF08A] font-bold mr-2">
                GROWTH PROTOCOL:
              </span>
              Combine Cinematic Ads with your build to increase conversion rates
              by up to 40%.
            </p>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 pt-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#5EF08A] mb-12 group transition-colors"
            data-ocid="cinematic.link"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Services Dashboard
          </Link>

          {/* HERO */}
          <div className="mb-20 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5EF08A]/10 border border-[#5EF08A]/20 text-[#5EF08A] text-sm font-bold uppercase tracking-wide mb-6">
              <Sparkles className="w-4 h-4" /> Broadcast Quality AI Generation
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              <EditableText
                textKey="cinematic-ads.hero.heading"
                defaultText="Stop Buying Tools. Start Buying Outcomes."
              />
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
              <EditableText
                textKey="cinematic-ads.hero.subheading"
                defaultText="We deliver multi-shot, 4K commercial video content with native audio sync and lip-sync dialogue. No film crews. No massive invoices. Just high-converting assets."
              />
            </p>
          </div>

          {/* THE CALCULATOR */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-24 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  <EditableText
                    textKey="cinematic-ads.calculator.heading"
                    defaultText="Pay only for the seconds you need."
                  />
                </h2>
                <p className="text-gray-400 mb-8">
                  <EditableText
                    textKey="cinematic-ads.calculator.subtext"
                    defaultText="Slide to select your duration. Our volume-discounted scale ensures maximum ROI for social deployment."
                  />
                </p>
                <div className="mb-8">
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#5EF08A]"
                    data-ocid="cinematic.input"
                  />
                  <div className="mt-4 flex justify-between items-center text-xl font-bold">
                    <span>{duration} Seconds</span>
                    <AnimatePresence mode="wait">
                      {duration === 30 && (
                        <motion.span
                          key="sweet-spot"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-[#5EF08A] text-xs uppercase tracking-widest border border-[#5EF08A]/30 px-2 py-1 rounded"
                        >
                          Social Sweet Spot
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="p-4 bg-[#0A0B14] rounded-xl border border-white/5 text-xs text-gray-500 italic">
                  *Videos over 60s are treated as Custom Cinematic Projects
                  ($1,500+).
                </div>
              </div>

              <div className="bg-[#0A0B14] border border-[#5EF08A]/30 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(94,240,138,0.05)]">
                <div className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4">
                  Production Cost
                </div>
                <motion.div
                  layout="position"
                  key={currentPrice}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-7xl font-extrabold mb-8"
                >
                  ${currentPrice}
                </motion.div>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/ads-builder" })}
                  className="w-full bg-[#5EF08A] text-[#0A0B14] font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(94,240,138,0.4)] transition-all"
                  data-ocid="cinematic.primary_button"
                >
                  Produce This Ad Now
                </button>
              </div>
            </div>
          </div>

          {/* THE DIRECTOR'S BRIEF */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
              <ImageIcon className="w-8 h-8 text-[#5EF08A] mb-4" />
              <h3 className="text-xl font-bold mb-2">
                <EditableText
                  textKey="cinematic-ads.brief.step1.title"
                  defaultText="1. Identity Lock"
                />
              </h3>
              <p className="text-sm text-gray-400">
                <EditableText
                  textKey="cinematic-ads.brief.step1.description"
                  defaultText="Upload Front, 45°, and Profile photos. We lock your face and wardrobe consistency across every frame."
                />
              </p>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
              <Film className="w-8 h-8 text-[#5EF08A] mb-4" />
              <h3 className="text-xl font-bold mb-2">
                <EditableText
                  textKey="cinematic-ads.brief.step2.title"
                  defaultText="2. Visual Environment"
                />
              </h3>
              <p className="text-sm text-gray-400">
                <EditableText
                  textKey="cinematic-ads.brief.step2.description"
                  defaultText="Select Luxury, Fast-Paced, or Corporate vibes. We sync your storefront or listing into the narrative background."
                />
              </p>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
              <Clapperboard className="w-8 h-8 text-[#5EF08A] mb-4" />
              <h3 className="text-xl font-bold mb-2">
                <EditableText
                  textKey="cinematic-ads.brief.step3.title"
                  defaultText="3. Narrative Sync"
                />
              </h3>
              <p className="text-sm text-gray-400">
                <EditableText
                  textKey="cinematic-ads.brief.step3.description"
                  defaultText="Define your Hook (0-3s) and CTA. We generate the 4K render with native lip-sync and broadcast-grade SFX."
                />
              </p>
            </div>
          </div>

          {/* RETAINERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {retainers.map((plan, i) => (
              <div
                key={plan.name}
                className={`p-8 rounded-3xl border transition-all ${
                  plan.popular
                    ? "border-[#5EF08A] bg-[#5EF08A]/5 shadow-[0_0_30px_rgba(94,240,138,0.1)]"
                    : "border-white/10 bg-white/5"
                }`}
                data-ocid={`cinematic.item.${i + 1}`}
              >
                {plan.popular && (
                  <div className="text-[#5EF08A] text-xs font-bold uppercase tracking-widest mb-4">
                    Most Popular
                  </div>
                )}
                <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                <div className="text-[#5EF08A] font-bold mb-6">{plan.ads}</div>
                <div className="text-4xl font-extrabold mb-4">
                  {plan.price}{" "}
                  <span className="text-sm text-gray-500">/qtr</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-gray-400">
                  <li className="flex justify-between">
                    <span>Turnaround</span>{" "}
                    <span className="text-white">{plan.turnaround}</span>
                  </li>
                  <li className="flex justify-between text-[#5EF08A] font-bold italic">
                    <span>{plan.savings}</span>
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/ads-builder" })}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    plan.popular
                      ? "bg-[#5EF08A] text-[#0A0B14] hover:shadow-[0_0_20px_rgba(94,240,138,0.4)]"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  data-ocid={`cinematic.button.${i + 1}`}
                >
                  Secure Retainer
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
