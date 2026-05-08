import {
  AlertCircle,
  Camera,
  Clapperboard,
  Music,
  PhoneCall,
  Send,
  Sparkles,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useState } from "react";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { useActor } from "../hooks/useActor";

const SEEDANCE_DIRECTIVE = `SYSTEM COMMAND: Seedance 2.0 API Payload. Generate a cinematic commercial based on the provided Director's Brief. Strictly adhere to the Global Wardrobe constraints for character consistency. Apply the requested atmospheric lighting (Luxury/Fast-Paced/Corporate). Lock @Image1 as primary character face, @Image2 as environment reference, and @Image3 as outro logo overlay.`;

const PRICING_SCALE: Record<number, number> = {
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

// Stripe checkout URLs — replace with live links when ready
const STRIPE_CHECKOUT_URLS: Record<string, string> = {
  single: "/checkout",
  pilot: "https://buy.stripe.com/cinematic-pilot",
  pro: "https://buy.stripe.com/cinematic-pro",
  elite: "https://buy.stripe.com/cinematic-elite",
};

interface FormData {
  name?: string;
  email?: string;
  business?: string;
  phone?: string;
  d_face_urls?: string;
  d_wardrobe?: string;
  d_location_url?: string;
  d_vibe?: string;
  d_hook?: string;
  d_value?: string;
  d_logo_url?: string;
  d_audio?: string;
  d_script?: string;
}

// ── Extracted sub-components (defined OUTSIDE the page component so React
//    does not treat them as new types on every render — fixes frozen inputs) ──

function InputField({
  label,
  id,
  required = false,
  type = "text",
  placeholder = "",
  subtext = "",
  value,
  onChange,
}: {
  label: string;
  id: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  subtext?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-1"
      >
        {label} {required && <span className="text-[#5EF08A]">*</span>}
      </label>
      {subtext && <p className="text-xs text-gray-500 mb-2">{subtext}</p>}
      {type === "textarea" ? (
        <textarea
          id={id}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-3 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A] transition-colors resize-none"
        />
      ) : (
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-3 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A] transition-colors"
        />
      )}
    </div>
  );
}

function SectionWrapper({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111322]/70 border border-[#1C1F33] rounded-3xl p-8 mb-8 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-center gap-3 mb-8 border-b border-[#1C1F33] pb-6">
        <div className="p-3 bg-[#5EF08A]/10 rounded-xl">
          <Icon className="w-6 h-6 text-[#5EF08A]" />
        </div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdsBuilderPage() {
  const [purchaseType, setPurchaseType] = useState<"single" | "subscription">(
    "single",
  );
  const [duration, setDuration] = useState<number>(15);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [addReceptionist, setAddReceptionist] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({});
  const { actor } = useActor();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const base =
      purchaseType === "single"
        ? PRICING_SCALE[duration]
        : selectedPlan === "The Pilot"
          ? 1049
          : selectedPlan === "The Pro"
            ? 1899
            : selectedPlan === "The Elite"
              ? 2499
              : 0;
    return { base, recurring: addReceptionist ? 199 : 0 };
  };

  const getStripeUrl = () => {
    if (purchaseType === "single") return STRIPE_CHECKOUT_URLS.single;
    if (selectedPlan === "The Pilot") return STRIPE_CHECKOUT_URLS.pilot;
    if (selectedPlan === "The Pro") return STRIPE_CHECKOUT_URLS.pro;
    if (selectedPlan === "The Elite") return STRIPE_CHECKOUT_URLS.elite;
    return STRIPE_CHECKOUT_URLS.single;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      setSubmitError("Backend not ready. Please try again in a moment.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const finalPayload = {
      _meta: {
        timestamp: new Date().toISOString(),
        directive: SEEDANCE_DIRECTIVE,
      },
      orderDetails: {
        type: purchaseType,
        duration: purchaseType === "single" ? duration : 60,
        plan: purchaseType === "subscription" ? selectedPlan : "N/A",
        totalPrice: calculateTotal().base,
        addons: addReceptionist ? ["AI Receptionist ($199/mo)"] : [],
      },
      directorsBrief: formData,
    };

    try {
      // Step 1: Save to backend — await before any redirect
      const qaAnswers = JSON.stringify([
        { label: "Name", value: formData.name || "" },
        { label: "Email", value: formData.email || "" },
        { label: "Business", value: formData.business || "" },
        { label: "Phone", value: formData.phone || "" },
        { label: "Purchase Type", value: purchaseType },
        {
          label: "Plan / Duration",
          value:
            purchaseType === "subscription"
              ? selectedPlan
              : `Single ${duration}s ($${PRICING_SCALE[duration]})`,
        },
        { label: "Face Photo URLs", value: formData.d_face_urls || "" },
        { label: "Wardrobe", value: formData.d_wardrobe || "" },
        { label: "Hero Location URL", value: formData.d_location_url || "" },
        { label: "Atmosphere / Vibe", value: formData.d_vibe || "" },
        { label: "The Hook (0-3s)", value: formData.d_hook || "" },
        { label: "The Value (3-12s)", value: formData.d_value || "" },
        { label: "High-Res Logo URL", value: formData.d_logo_url || "" },
        { label: "Audio Genre", value: formData.d_audio || "" },
        { label: "Voiceover Scripting", value: formData.d_script || "" },
        {
          label: "AI Receptionist Add-On",
          value: addReceptionist ? "Yes (+$199/mo)" : "No",
        },
        {
          label: "Full Payload",
          value: JSON.stringify(finalPayload),
        },
      ]);

      await (
        actor as unknown as {
          submitQuestionnaire: (
            type: string,
            answers: string,
          ) => Promise<bigint>;
        }
      ).submitQuestionnaire("CinematicAds", qaAnswers);

      // Step 2: Only after backend confirms success, redirect to Stripe
      window.location.href = getStripeUrl();
    } catch (error) {
      setSubmitError(
        `Submission failed: ${(error as Error).message ?? "Unknown error"}. Please try again.`,
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#0A0B14] text-[#EEF0F8] font-sans pb-32 pt-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
              Cinematic <span className="text-[#5EF08A]">Ad Builder</span>
            </h1>
            <p className="text-[#9CA3AF] text-lg">
              Broadcast-quality commercial video. Fractional cost. Powered by
              Seedance 2.0.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <SectionWrapper title="1. Campaign Scope" icon={Video}>
              <div className="flex gap-4 mb-8">
                <button
                  type="button"
                  onClick={() => setPurchaseType("single")}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${purchaseType === "single" ? "bg-[#5EF08A] text-[#0A0B14]" : "bg-[#1C1F33] text-gray-400 hover:text-white"}`}
                  data-ocid="ads.tab"
                >
                  Single Ad
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseType("subscription")}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${purchaseType === "subscription" ? "bg-[#5EF08A] text-[#0A0B14]" : "bg-[#1C1F33] text-gray-400 hover:text-white"}`}
                  data-ocid="ads.tab"
                >
                  Quarterly Plan (Save up to $2.6k)
                </button>
              </div>

              <AnimatePresence mode="wait">
                {purchaseType === "single" ? (
                  <motion.div
                    key="single"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 bg-[#0A0B14] rounded-2xl border border-[#1C1F33]"
                  >
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h3 className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-1">
                          Ad Duration
                        </h3>
                        <div className="text-4xl font-extrabold text-white">
                          {duration}{" "}
                          <span className="text-xl text-gray-500 font-medium">
                            Seconds
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <h3 className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-1">
                          Total Cost
                        </h3>
                        <div className="text-4xl font-extrabold text-[#5EF08A]">
                          ${PRICING_SCALE[duration]}
                        </div>
                      </div>
                    </div>
                    <input
                      id="duration-range"
                      type="range"
                      min="15"
                      max="60"
                      step="5"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full h-2 bg-[#1C1F33] rounded-lg appearance-none cursor-pointer accent-[#5EF08A]"
                      data-ocid="ads.input"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold">
                      <span className="text-[#5EF08A]">
                        <EditableText
                          textKey="ads_builder.duration_min"
                          defaultText="15s"
                          as="span"
                        />
                      </span>
                      <span>
                        <EditableText
                          textKey="ads_builder.duration_max"
                          defaultText="60s Max"
                          as="span"
                        />
                      </span>
                    </div>
                    <AnimatePresence>
                      {duration === 30 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-6 flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                        >
                          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-200/80 leading-relaxed">
                            <strong className="text-amber-500">Pro Tip:</strong>{" "}
                            30-second videos hit the exact sweet spot for
                            Instagram Reels and TikTok, seeing a 40% higher
                            conversion rate than shorter clips.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="sub"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {[
                      { name: "The Pilot", ads: 3, price: 1049, save: "$658" },
                      { name: "The Pro", ads: 6, price: 1899, save: "$1,515" },
                      {
                        name: "The Elite",
                        ads: 9,
                        price: 2499,
                        save: "$2,622",
                      },
                    ].map((plan, i) => (
                      <button
                        key={plan.name}
                        type="button"
                        onClick={() => setSelectedPlan(plan.name)}
                        className={`text-left p-6 rounded-2xl border transition-all ${selectedPlan === plan.name ? "bg-[#5EF08A]/10 border-[#5EF08A] shadow-[0_0_20px_rgba(94,240,138,0.1)]" : "bg-[#0A0B14] border-[#1C1F33] hover:border-gray-500"}`}
                        data-ocid={`ads.item.${i + 1}`}
                      >
                        <h4 className="text-xl font-bold text-white mb-1">
                          {plan.name}
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">
                          {plan.ads} Ads / Quarter
                        </p>
                        <div className="text-3xl font-extrabold text-[#5EF08A] mb-2">
                          ${plan.price}
                        </div>
                        <div className="text-xs font-bold text-amber-500 bg-amber-500/10 inline-block px-2 py-1 rounded">
                          Save {plan.save}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionWrapper>

            <SectionWrapper title="2. Contact Details" icon={Camera}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <InputField
                  label="Full Name"
                  id="name"
                  required
                  value={formData.name ?? ""}
                  onChange={(v) => handleChange("name", v)}
                />
                <InputField
                  label="Email Address"
                  id="email"
                  type="email"
                  required
                  value={formData.email ?? ""}
                  onChange={(v) => handleChange("email", v)}
                />
                <InputField
                  label="Business Name"
                  id="business"
                  required
                  value={formData.business ?? ""}
                  onChange={(v) => handleChange("business", v)}
                />
                <InputField
                  label="Phone Number"
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone ?? ""}
                  onChange={(v) => handleChange("phone", v)}
                />
              </div>
            </SectionWrapper>

            <SectionWrapper title="3. The Director's Brief" icon={Camera}>
              <div className="mb-8 border-b border-[#1C1F33] pb-8">
                <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                  Identity & Character (Face Lock)
                </h3>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-6 text-sm text-gray-300">
                  <AlertCircle className="w-4 h-4 inline mr-2 text-gray-400" />
                  Provide URLs to 3 clear photos of yourself (Front, 45-degree,
                  Profile). We use these to lock your face perfectly across
                  every AI shot.
                </div>
                <InputField
                  label="Photo URLs (@Image1)"
                  id="d_face_urls"
                  subtext="Paste Google Drive or Dropbox links."
                  required
                  value={formData.d_face_urls ?? ""}
                  onChange={(v) => handleChange("d_face_urls", v)}
                />
                <InputField
                  label="The Uniform (Global Wardrobe)"
                  id="d_wardrobe"
                  type="textarea"
                  placeholder="e.g., Navy Blue suit with a white shirt, no tie."
                  subtext="Consistency works better when we define exactly what you are wearing."
                  required
                  value={formData.d_wardrobe ?? ""}
                  onChange={(v) => handleChange("d_wardrobe", v)}
                />
              </div>
              <div className="mb-8 border-b border-[#1C1F33] pb-8">
                <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                  The Environment
                </h3>
                <InputField
                  label="Hero Location URL (@Image2)"
                  id="d_location_url"
                  subtext="Photo of your office, storefront, or listing."
                  required
                  value={formData.d_location_url ?? ""}
                  onChange={(v) => handleChange("d_location_url", v)}
                />
                <div className="mb-6">
                  <label
                    htmlFor="d_vibe"
                    className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                  >
                    Atmosphere / Vibe <span className="text-[#5EF08A]">*</span>
                  </label>
                  <select
                    id="d_vibe"
                    required
                    value={formData.d_vibe ?? ""}
                    onChange={(e) => handleChange("d_vibe", e.target.value)}
                    className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                    data-ocid="ads.select"
                  >
                    <option value="">Select your vibe...</option>
                    <option value="Luxury">
                      Luxury (Golden hour, high-contrast, cinematic)
                    </option>
                    <option value="Fast-Paced">
                      Fast-Paced (High-energy, handheld camera feel)
                    </option>
                    <option value="Corporate">
                      Corporate (Clean, bright, soft lighting, stable)
                    </option>
                    <option value="Documentary">
                      Documentary (Gritty, realistic, natural light)
                    </option>
                  </select>
                </div>
              </div>
              <div className="mb-8 border-b border-[#1C1F33] pb-8">
                <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Clapperboard className="w-5 h-5" /> The Narrative Logic
                </h3>
                <InputField
                  label="The Hook (0-3s)"
                  id="d_hook"
                  type="textarea"
                  placeholder="What is the first thing we see? e.g., Drone shot of the neighborhood."
                  required
                  value={formData.d_hook ?? ""}
                  onChange={(v) => handleChange("d_hook", v)}
                />
                <InputField
                  label="The Value (3-12s)"
                  id="d_value"
                  type="textarea"
                  placeholder="What are we showcasing? e.g., Me walking through the office talking to a client."
                  required
                  value={formData.d_value ?? ""}
                  onChange={(v) => handleChange("d_value", v)}
                />
                <InputField
                  label="High-Res Logo URL (@Image3)"
                  id="d_logo_url"
                  subtext="Used for the final Call-To-Action outro screen."
                  required
                  value={formData.d_logo_url ?? ""}
                  onChange={(v) => handleChange("d_logo_url", v)}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Music className="w-5 h-5" /> Sound & Scripting
                </h3>
                <div className="mb-6">
                  <label
                    htmlFor="d_audio"
                    className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                  >
                    Audio Genre <span className="text-[#5EF08A]">*</span>
                  </label>
                  <select
                    id="d_audio"
                    required
                    value={formData.d_audio ?? ""}
                    onChange={(e) => handleChange("d_audio", e.target.value)}
                    className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                    data-ocid="ads.select"
                  >
                    <option value="">Select background music style...</option>
                    <option value="Lo-fi">Lo-fi / Chill</option>
                    <option value="Orchestral">Epic Orchestral</option>
                    <option value="Corporate">Upbeat Corporate Tech</option>
                    <option value="Pop">High-Energy Pop</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="d_script"
                    className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                  >
                    Voiceover Scripting{" "}
                    <span className="text-[#5EF08A]">*</span>
                  </label>
                  <select
                    id="d_script"
                    required
                    value={formData.d_script ?? ""}
                    onChange={(e) => handleChange("d_script", e.target.value)}
                    className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                    data-ocid="ads.select"
                  >
                    <option value="">Select scripting option...</option>
                    <option value="ai_draft">
                      Let Imperidome AI draft the perfect script based on my
                      website.
                    </option>
                    <option value="custom">
                      I will provide my own custom script (Agency will email for
                      details).
                    </option>
                  </select>
                </div>
              </div>
            </SectionWrapper>

            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-r from-[#0A0B14] to-[#5EF08A]/10 border-2 border-[#5EF08A]/50 rounded-3xl p-8 mb-12 shadow-[0_0_40px_rgba(94,240,138,0.15)] flex flex-col md:flex-row items-center gap-8 cursor-pointer text-left w-full"
              onClick={() => setAddReceptionist(!addReceptionist)}
              aria-pressed={addReceptionist}
              data-ocid="ads.toggle"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[#5EF08A] font-bold uppercase tracking-widest text-xs mb-2">
                  <Sparkles className="w-4 h-4" /> Recommended Add-On
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <PhoneCall className="w-6 h-6 text-[#5EF08A]" /> AI
                  Missed-Call Receptionist
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  You are about to run a highly-converting video ad. Don&apos;t
                  waste that traffic. Our AI Receptionist answers every missed
                  call, books appointments, and captures lead data 24/7.
                </p>
              </div>
              <div className="flex flex-col items-center min-w-[180px]">
                <div className="text-3xl font-extrabold text-white mb-4">
                  +$199
                  <span className="text-sm text-gray-400 font-normal">/mo</span>
                </div>
                <div
                  className={`w-full py-3 rounded-xl font-bold text-center transition-colors border-2 ${addReceptionist ? "bg-[#5EF08A] border-[#5EF08A] text-[#0A0B14]" : "bg-transparent border-gray-600 text-gray-400"}`}
                >
                  {addReceptionist ? "Added to Order ✓" : "Add to Order"}
                </div>
              </div>
            </motion.button>

            {submitError && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{submitError}</p>
              </div>
            )}

            <div className="bg-[#111322] border border-[#1C1F33] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">
                  Total Due Today
                </p>
                <div className="text-4xl font-extrabold text-white">
                  ${calculateTotal().base}
                </div>
                {addReceptionist && (
                  <p className="text-[#5EF08A] text-sm font-bold mt-2">
                    + $199/mo subscription
                  </p>
                )}
              </div>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="w-full md:w-auto px-12 py-5 bg-[#5EF08A] text-[#0A0B14] rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#4ade80] shadow-[0_0_30px_rgba(94,240,138,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                data-ocid="ads.submit_button"
              >
                <Send className="w-5 h-5" />{" "}
                {isSubmitting ? "Processing..." : "Proceed to Secure Checkout"}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
