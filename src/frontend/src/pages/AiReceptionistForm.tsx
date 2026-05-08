import {
  Bot,
  Calendar,
  Clock,
  MessageSquare,
  Send,
  ShieldAlert,
  Sparkles,
  Users,
  Volume2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { Footer } from "../components/Footer";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/useCartStore";

const VAPI_PROMPT_INSTRUCTIONS =
  "Role: Intelligent Lead Capture Receptionist. Task: Focus entirely on lead capture, answering FAQs, and appointment booking. Please do not handle complex customer support, billing disputes, or technical troubleshooting. If asked a question outside of these bounds, politely use the defined hand-off phrase to transfer the user to a human team member. Please use the provided FAQs and objection handling rules to guide the conversation.";

/**
 * Maps form tier keys to backend product names (exact match from seeded catalog).
 * Prices are fetched live from backend — no hardcoded amounts here.
 */
const TIERS = {
  tier1: {
    name: "Tier 1: Safety Net",
    backendName: "THE SAFETY NET",
    setup: 0,
    desc: "Missed-call text-back & Web-chat widget.",
  },
  tier2: {
    name: "Tier 2: Receptionist",
    backendName: "THE RECEPTIONIST",
    setup: 249,
    desc: "Inbound/Outbound AI Voice. Handles FAQs & sends booking links via SMS.",
  },
  tier3: {
    name: "Tier 3: The Closer",
    backendName: "THE CLOSER",
    setup: 499,
    desc: "Full Calendar Integration. AI books appointments verbally on the call.",
  },
};

interface FormData {
  ai_biz_name?: string;
  ai_industry?: string;
  ai_location?: string;
  ai_forward_number?: string;
  ai_contact_email?: string;
  ai_persona?: string;
  ai_name?: string;
  ai_tone?: string;
  ai_voice_clone?: boolean;
  ai_faq_1_q?: string;
  ai_faq_1_a?: string;
  ai_faq_2_q?: string;
  ai_faq_2_a?: string;
  ai_faq_3_q?: string;
  ai_faq_3_a?: string;
  ai_obj_1_q?: string;
  ai_obj_1_a?: string;
  ai_obj_2_q?: string;
  ai_obj_2_a?: string;
  ai_hours?: string;
  ai_after_hours?: string;
  ai_services?: string;
  ai_usp?: string;
  ai_avg_job_value?: string;
  ai_data_collect?: string;
  ai_lead_destination?: string;
  ai_calendar_link?: string;
  ai_appt_types?: string;
  ai_appt_duration?: string;
  ai_booking_rules?: string;
  ai_handoff_triggers?: string;
  ai_handoff_msg?: string;
  ai_primary_goal?: string;
  ai_special_notes?: string;
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

export default function AiReceptionistForm() {
  const [selectedTier, setSelectedTier] = useState<
    "tier1" | "tier2" | "tier3" | ""
  >("");
  const [formData, setFormData] = useState<FormData>({});
  const { actor } = useActor();
  const { addItem, openDrawer } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Live monthly prices from backend, keyed by backendName (lowercase)
  const [liveMonthly, setLiveMonthly] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!actor) return;
    (
      actor as unknown as {
        getProducts: () => Promise<
          Array<{
            name: string;
            product_type: string;
            price_monthly?: number | null;
            price_onetime?: number | null;
          }>
        >;
      }
    )
      .getProducts()
      .then((result) => {
        const map: Record<string, number> = {};
        for (const p of result) {
          if (p.product_type === "AI Receptionist") {
            const price = p.price_monthly ?? p.price_onetime ?? 0;
            map[p.name.toLowerCase()] = price;
          }
        }
        setLiveMonthly(map);
      })
      .catch(() => {
        // fail silently — fallback display handled below
      });
  }, [actor]);

  /** Get live monthly price for a tier key; 0 if not loaded yet */
  const getTierMonthly = (key: keyof typeof TIERS): number => {
    const bn = TIERS[key].backendName.toLowerCase();
    return liveMonthly[bn] ?? 0;
  };

  /** Format price display for tier selection cards */
  const getTierPriceDisplay = (key: keyof typeof TIERS): string => {
    const val = getTierMonthly(key);
    return val > 0 ? `$${val.toLocaleString()}` : "...";
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper to get string value for InputField (booleans coerced to "")
  const val = (field: keyof FormData): string => {
    const v = formData[field];
    return typeof v === "boolean" ? "" : (v ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return alert("Please select a tier first.");

    // Quality Control Validation
    if (selectedTier !== "tier1") {
      if (!formData.ai_services || formData.ai_services.length < 15) {
        return alert(
          "Please describe your services in more detail. The AI needs this context to answer caller questions accurately!",
        );
      }
    }

    if (!actor) {
      setSubmitError("Backend not ready. Please try again in a moment.");
      return;
    }

    const finalPayload = {
      _meta: {
        timestamp: new Date().toISOString(),
        instructions: VAPI_PROMPT_INSTRUCTIONS,
      },
      subscription: {
        tier: TIERS[selectedTier].name,
        monthlyRecurringRevenue: getTierMonthly(selectedTier),
        setupFee: TIERS[selectedTier].setup,
      },
      vapiTrainingData: {
        ...formData,
        faqs: [
          { question: formData.ai_faq_1_q, answer: formData.ai_faq_1_a },
          { question: formData.ai_faq_2_q, answer: formData.ai_faq_2_a },
        ].filter((f) => f.question),
        objections: [
          { customerSays: formData.ai_obj_1_q, aiReplies: formData.ai_obj_1_a },
        ].filter((o) => o.customerSays),
      },
    };

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const clientName = formData.ai_biz_name || "";
      const clientPhone = formData.ai_forward_number || "";
      const clientEmail = formData.ai_contact_email || "";
      const tierName = TIERS[selectedTier].name;

      // Step 1: Save to backend first — await before any redirect
      const qaAnswers = JSON.stringify([
        { label: "Business Name", value: clientName },
        { label: "Email", value: clientEmail },
        { label: "Phone / Forward Number", value: clientPhone },
        { label: "Tier", value: tierName },
        { label: "Industry", value: formData.ai_industry || "" },
        { label: "Location / Service Area", value: formData.ai_location || "" },
        { label: "Business Hours", value: formData.ai_hours || "" },
        { label: "After Hours Handling", value: formData.ai_after_hours || "" },
        { label: "Main Services", value: formData.ai_services || "" },
        { label: "USP", value: formData.ai_usp || "" },
        { label: "Average Job Value", value: formData.ai_avg_job_value || "" },
        { label: "Data to Collect", value: formData.ai_data_collect || "" },
        {
          label: "Lead Destination",
          value: formData.ai_lead_destination || "",
        },
        { label: "AI Personality", value: formData.ai_persona || "" },
        { label: "AI Agent Name", value: formData.ai_name || "" },
        { label: "Tone Preferences", value: formData.ai_tone || "" },
        { label: "Voice Clone", value: formData.ai_voice_clone ? "Yes" : "No" },
        { label: "FAQ 1 Q", value: formData.ai_faq_1_q || "" },
        { label: "FAQ 1 A", value: formData.ai_faq_1_a || "" },
        { label: "FAQ 2 Q", value: formData.ai_faq_2_q || "" },
        { label: "FAQ 2 A", value: formData.ai_faq_2_a || "" },
        { label: "Objection 1 Q", value: formData.ai_obj_1_q || "" },
        { label: "Objection 1 A", value: formData.ai_obj_1_a || "" },
        { label: "Calendar Link", value: formData.ai_calendar_link || "" },
        { label: "Appointment Types", value: formData.ai_appt_types || "" },
        {
          label: "Handoff Triggers",
          value: formData.ai_handoff_triggers || "",
        },
        { label: "Handoff Message", value: formData.ai_handoff_msg || "" },
        { label: "Primary Call Goal", value: formData.ai_primary_goal || "" },
        {
          label: "Special Instructions",
          value: formData.ai_special_notes || "",
        },
        { label: "Full Payload", value: JSON.stringify(finalPayload) },
      ]);

      await (
        actor as unknown as {
          submitQuestionnaire: (
            type: string,
            answers: string,
          ) => Promise<bigint>;
        }
      ).submitQuestionnaire("AIReceptionist", qaAnswers);

      // Step 2: Only after backend confirms success, trigger Stripe checkout via cart
      const backendName = TIERS[selectedTier].backendName;
      const monthly = getTierMonthly(selectedTier);
      const priceStr = monthly > 0 ? `$${monthly.toLocaleString()}/mo` : "—";
      addItem({ name: backendName, price: priceStr });
      openDrawer();
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5EF08A]/10 border border-[#5EF08A]/30 text-[#5EF08A] text-xs font-bold tracking-widest uppercase mb-4">
              <Sparkles className="w-4 h-4" /> 24/7 Lead Capture System
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
              AI <span className="text-[#5EF08A]">Receptionist</span> Setup
            </h1>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto">
              Every missed call is a lost customer. We make sure that never
              happens again. Train your AI agent below.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* TIER SELECTION */}
            <SectionWrapper
              title="1. Select Your Safety Net"
              icon={ShieldAlert}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(TIERS) as Array<keyof typeof TIERS>).map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelectedTier(key as "tier1" | "tier2" | "tier3")
                      }
                      className={`text-left p-6 rounded-2xl border transition-all ${
                        selectedTier === key
                          ? "bg-[#5EF08A]/10 border-[#5EF08A] shadow-[0_0_20px_rgba(94,240,138,0.1)]"
                          : "bg-[#0A0B14] border-[#1C1F33] hover:border-gray-500"
                      }`}
                    >
                      <h4 className="text-xl font-bold text-white mb-2">
                        {TIERS[key].name}
                      </h4>
                      <p className="text-sm text-gray-400 mb-6 h-16">
                        {TIERS[key].desc}
                      </p>
                      <div className="text-3xl font-extrabold text-[#5EF08A] mb-1">
                        {getTierPriceDisplay(key)}
                        <span className="text-sm text-gray-400 font-normal">
                          /mo
                        </span>
                      </div>
                      <div className="text-xs font-bold text-gray-500">
                        +
                        {TIERS[key].setup === 0 ? "No" : `$${TIERS[key].setup}`}{" "}
                        Setup Fee
                      </div>
                    </button>
                  ),
                )}
              </div>
            </SectionWrapper>

            <AnimatePresence>
              {selectedTier && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* SECTION 1: BUSINESS IDENTITY */}
                  <SectionWrapper
                    title="Section 1: Business Identity"
                    icon={Bot}
                  >
                    <InputField
                      label="1. Business Name (Exact name AI should use)"
                      id="ai_biz_name"
                      required
                      value={val("ai_biz_name")}
                      onChange={(v) => handleChange("ai_biz_name", v)}
                    />
                    <InputField
                      label="Contact Email"
                      id="ai_contact_email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={val("ai_contact_email")}
                      onChange={(v) => handleChange("ai_contact_email", v)}
                    />
                    <div className="mb-6">
                      <label
                        htmlFor="ai_industry"
                        className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                      >
                        2. Industry / Business Type{" "}
                        <span className="text-[#5EF08A]">*</span>
                      </label>
                      <select
                        id="ai_industry"
                        required
                        value={formData.ai_industry ?? ""}
                        onChange={(e) =>
                          handleChange("ai_industry", e.target.value)
                        }
                        className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                      >
                        <option value="">Select industry...</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="HVAC">HVAC</option>
                        <option value="Barbershop">Barbershop / Salon</option>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Medical">Medical / Med Spa</option>
                        <option value="Fitness">Fitness / Gym</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <InputField
                      label="3. Business Location(s) or Service Area"
                      id="ai_location"
                      required
                      value={val("ai_location")}
                      onChange={(v) => handleChange("ai_location", v)}
                    />
                    <InputField
                      label="4. Phone Number to Forward Calls From"
                      id="ai_forward_number"
                      placeholder="Or write 'Assign me a new number'"
                      required
                      value={val("ai_forward_number")}
                      onChange={(v) => handleChange("ai_forward_number", v)}
                    />
                  </SectionWrapper>

                  {/* ADVANCED AI SECTIONS (TIERS 2 & 3 ONLY) */}
                  {selectedTier !== "tier1" && (
                    <>
                      <SectionWrapper
                        title="Section 2: Voice & Personality"
                        icon={Volume2}
                      >
                        <div className="mb-6">
                          <label
                            htmlFor="ai_persona"
                            className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                          >
                            5. Choose AI Personality{" "}
                            <span className="text-[#5EF08A]">*</span>
                          </label>
                          <select
                            id="ai_persona"
                            required
                            value={formData.ai_persona ?? ""}
                            onChange={(e) =>
                              handleChange("ai_persona", e.target.value)
                            }
                            className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                          >
                            <option value="">Select personality...</option>
                            <option value="Professional">
                              Professional & Polished (Corporate, calm, formal)
                            </option>
                            <option value="Friendly">
                              Friendly & Conversational (Warm, natural)
                            </option>
                            <option value="Sales">
                              High-Energy & Sales-Oriented (Upbeat, persuasive)
                            </option>
                            <option value="Luxury">
                              Luxury & White-Glove (Premium, refined)
                            </option>
                          </select>
                        </div>
                        <InputField
                          label="6. AI Agent Name"
                          id="ai_name"
                          placeholder="e.g., Sarah, Emily, or your own name."
                          subtext="Should the AI introduce itself with a specific name?"
                          required
                          value={val("ai_name")}
                          onChange={(v) => handleChange("ai_name", v)}
                        />
                        <InputField
                          label="7. Tone Preferences"
                          id="ai_tone"
                          placeholder="e.g., Short & direct, talkative, confident..."
                          required
                          value={val("ai_tone")}
                          onChange={(v) => handleChange("ai_tone", v)}
                        />

                        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                          <label className="flex items-center gap-3 text-sm font-bold text-[#EEF0F8] uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={formData.ai_voice_clone ?? false}
                              onChange={(e) =>
                                handleChange("ai_voice_clone", e.target.checked)
                              }
                              className="accent-[#5EF08A] w-5 h-5"
                            />
                            Optional: I want to clone my own voice (Agency will
                            email for audio sample).
                          </label>
                        </div>
                      </SectionWrapper>

                      {/* STRUCTURED FAQS & OBJECTIONS */}
                      <SectionWrapper
                        title="Section 6 & 7: Knowledge Base Training"
                        icon={MessageSquare}
                      >
                        <p className="text-sm text-gray-400 mb-8">
                          This section is GOLD. Provide exact answers to your
                          most common questions so the AI never guesses.
                        </p>

                        <div className="space-y-8 border-l-2 border-[#1C1F33] pl-6 mb-8">
                          <div>
                            <h4 className="text-[#5EF08A] font-bold text-sm uppercase tracking-widest mb-4">
                              FAQ #1
                            </h4>
                            <InputField
                              label="Question"
                              id="ai_faq_1_q"
                              placeholder="e.g., How much does an estimate cost?"
                              required
                              value={val("ai_faq_1_q")}
                              onChange={(v) => handleChange("ai_faq_1_q", v)}
                            />
                            <InputField
                              label="Answer"
                              id="ai_faq_1_a"
                              placeholder="e.g., All of our estimates are completely free!"
                              required
                              value={val("ai_faq_1_a")}
                              onChange={(v) => handleChange("ai_faq_1_a", v)}
                            />
                          </div>
                          <div className="pt-4 border-t border-[#1C1F33]">
                            <h4 className="text-[#5EF08A] font-bold text-sm uppercase tracking-widest mb-4">
                              FAQ #2
                            </h4>
                            <InputField
                              label="Question"
                              id="ai_faq_2_q"
                              placeholder="e.g., How soon can you come out?"
                              required
                              value={val("ai_faq_2_q")}
                              onChange={(v) => handleChange("ai_faq_2_q", v)}
                            />
                            <InputField
                              label="Answer"
                              id="ai_faq_2_a"
                              placeholder="e.g., We usually have same-day or next-day availability."
                              required
                              value={val("ai_faq_2_a")}
                              onChange={(v) => handleChange("ai_faq_2_a", v)}
                            />
                          </div>
                          <div className="pt-4 border-t border-[#1C1F33]">
                            <h4 className="text-[#5EF08A] font-bold text-sm uppercase tracking-widest mb-4">
                              FAQ #3
                            </h4>
                            <InputField
                              label="Question"
                              id="ai_faq_3_q"
                              placeholder="e.g., Do you offer warranties?"
                              value={val("ai_faq_3_q")}
                              onChange={(v) => handleChange("ai_faq_3_q", v)}
                            />
                            <InputField
                              label="Answer"
                              id="ai_faq_3_a"
                              placeholder="e.g., Yes, all work is backed by our 1-year guarantee."
                              value={val("ai_faq_3_a")}
                              onChange={(v) => handleChange("ai_faq_3_a", v)}
                            />
                          </div>
                        </div>

                        <div className="space-y-8 border-l-2 border-amber-500/30 pl-6">
                          <div>
                            <h4 className="text-amber-500 font-bold text-sm uppercase tracking-widest mb-4">
                              Common Objection #1
                            </h4>
                            <InputField
                              label="Customer Says:"
                              id="ai_obj_1_q"
                              placeholder="e.g., That's too expensive."
                              required
                              value={val("ai_obj_1_q")}
                              onChange={(v) => handleChange("ai_obj_1_q", v)}
                            />
                            <InputField
                              label="AI Should Reply:"
                              id="ai_obj_1_a"
                              placeholder="e.g., We use premium materials and offer a lifetime warranty..."
                              required
                              value={val("ai_obj_1_a")}
                              onChange={(v) => handleChange("ai_obj_1_a", v)}
                            />
                          </div>
                          <div className="pt-4 border-t border-amber-500/10">
                            <h4 className="text-amber-500 font-bold text-sm uppercase tracking-widest mb-4">
                              Common Objection #2
                            </h4>
                            <InputField
                              label="Customer Says:"
                              id="ai_obj_2_q"
                              placeholder="e.g., I need to think about it."
                              value={val("ai_obj_2_q")}
                              onChange={(v) => handleChange("ai_obj_2_q", v)}
                            />
                            <InputField
                              label="AI Should Reply:"
                              id="ai_obj_2_a"
                              placeholder="e.g., Totally understand — our slots fill up fast, so I can hold one for 24 hours if you'd like."
                              value={val("ai_obj_2_a")}
                              onChange={(v) => handleChange("ai_obj_2_a", v)}
                            />
                          </div>
                        </div>
                      </SectionWrapper>
                    </>
                  )}

                  {/* OPERATIONS & LEAD ROUTING */}
                  <SectionWrapper
                    title="Operations & Lead Capture"
                    icon={Clock}
                  >
                    <InputField
                      label="8. Business Hours (Mon-Sun)"
                      id="ai_hours"
                      type="textarea"
                      required
                      value={val("ai_hours")}
                      onChange={(v) => handleChange("ai_hours", v)}
                    />
                    <InputField
                      label="9. What should happen AFTER hours?"
                      id="ai_after_hours"
                      placeholder="e.g., Still take bookings, collect info only, etc."
                      required
                      value={val("ai_after_hours")}
                      onChange={(v) => handleChange("ai_after_hours", v)}
                    />
                    <InputField
                      label="15. Main Services Offered"
                      id="ai_services"
                      type="textarea"
                      placeholder="List all core services clearly. The more detail, the better the AI performs."
                      required
                      value={val("ai_services")}
                      onChange={(v) => handleChange("ai_services", v)}
                    />
                    <InputField
                      label="17. What makes your business different? (USP)"
                      id="ai_usp"
                      placeholder="e.g., Fast response, family-owned, luxury service."
                      required
                      value={val("ai_usp")}
                      onChange={(v) => handleChange("ai_usp", v)}
                    />

                    <div className="p-4 bg-[#5EF08A]/10 border border-[#5EF08A]/20 rounded-xl mb-6">
                      <InputField
                        label="16. Average Job Value ($)"
                        id="ai_avg_job_value"
                        type="number"
                        placeholder="e.g., 500"
                        subtext="CRITICAL: This powers your live IMPERIDOME ROI Dashboard."
                        required
                        value={val("ai_avg_job_value")}
                        onChange={(v) => handleChange("ai_avg_job_value", v)}
                      />
                    </div>

                    <InputField
                      label="22. What info must the AI collect?"
                      id="ai_data_collect"
                      placeholder="e.g., Name, Phone, Email, Address."
                      required
                      value={val("ai_data_collect")}
                      onChange={(v) => handleChange("ai_data_collect", v)}
                    />
                    <InputField
                      label="23. Where should leads be sent?"
                      id="ai_lead_destination"
                      placeholder="Email, SMS number, or CRM URL"
                      required
                      value={val("ai_lead_destination")}
                      onChange={(v) => handleChange("ai_lead_destination", v)}
                    />
                  </SectionWrapper>

                  {/* SECTION 4: BOOKING (TIERS 2 & 3 ONLY) */}
                  {selectedTier !== "tier1" && (
                    <SectionWrapper
                      title="Section 4: Booking & Calendar"
                      icon={Calendar}
                    >
                      <InputField
                        label="11. Calendar Booking Link"
                        id="ai_calendar_link"
                        placeholder="Calendly, Google Calendar, etc."
                        required
                        value={val("ai_calendar_link")}
                        onChange={(v) => handleChange("ai_calendar_link", v)}
                      />
                      <InputField
                        label="12. Appointment Types (List up to 5)"
                        id="ai_appt_types"
                        type="textarea"
                        placeholder="e.g., Consultation, Estimate, Inspection."
                        required
                        value={val("ai_appt_types")}
                        onChange={(v) => handleChange("ai_appt_types", v)}
                      />
                      <InputField
                        label="13. Appointment Duration"
                        id="ai_appt_duration"
                        placeholder="e.g., 30 mins, 1 hour."
                        required
                        value={val("ai_appt_duration")}
                        onChange={(v) => handleChange("ai_appt_duration", v)}
                      />
                      <InputField
                        label="14. Booking Restrictions"
                        id="ai_booking_rules"
                        placeholder="e.g., No same-day bookings, weekdays only."
                        required
                        value={val("ai_booking_rules")}
                        onChange={(v) => handleChange("ai_booking_rules", v)}
                      />
                    </SectionWrapper>
                  )}

                  {/* ESCALATION & GOALS */}
                  <SectionWrapper title="Escalation & Goals" icon={Users}>
                    <InputField
                      label="24. When should the AI hand off to a human?"
                      id="ai_handoff_triggers"
                      placeholder="e.g., Angry customer, complex billing issue."
                      required
                      value={val("ai_handoff_triggers")}
                      onChange={(v) => handleChange("ai_handoff_triggers", v)}
                    />
                    <InputField
                      label="25. Handoff Message"
                      id="ai_handoff_msg"
                      placeholder="e.g., That's a great question. Let me have a human expert call you right back."
                      required
                      value={val("ai_handoff_msg")}
                      onChange={(v) => handleChange("ai_handoff_msg", v)}
                    />
                    <div className="mb-6">
                      <label
                        htmlFor="ai_primary_goal"
                        className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                      >
                        26. Primary Call Goal{" "}
                        <span className="text-[#5EF08A]">*</span>
                      </label>
                      <select
                        id="ai_primary_goal"
                        required
                        value={formData.ai_primary_goal ?? ""}
                        onChange={(e) =>
                          handleChange("ai_primary_goal", e.target.value)
                        }
                        className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                      >
                        <option value="">Select goal...</option>
                        <option value="book_appointment">
                          Book an Appointment
                        </option>
                        <option value="collect_lead">
                          Collect Lead Information
                        </option>
                        <option value="answer_faqs">
                          Answer FAQs & Qualify Leads
                        </option>
                        <option value="send_booking_link">
                          Send a Booking Link via SMS
                        </option>
                        <option value="close_sale">
                          Close a Sale on the Call
                        </option>
                      </select>
                    </div>
                    <InputField
                      label="27. Special Instructions for the AI"
                      id="ai_special_notes"
                      type="textarea"
                      placeholder="Any edge cases, promotions, seasonal notes, or custom behavior."
                      value={val("ai_special_notes")}
                      onChange={(v) => handleChange("ai_special_notes", v)}
                    />
                  </SectionWrapper>

                  {/* Error message */}
                  {submitError && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
                      <p className="text-sm text-red-400">{submitError}</p>
                    </div>
                  )}

                  {/* SUBMIT */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="w-full py-5 bg-[#5EF08A] text-[#0A0B14] rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#4ade80] shadow-[0_0_30px_rgba(94,240,138,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />{" "}
                    {isSubmitting
                      ? "Processing..."
                      : "Deploy My AI Receptionist"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
