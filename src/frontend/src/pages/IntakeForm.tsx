import {
  Calendar,
  CheckCircle2,
  CreditCard,
  LayoutTemplate,
  Rocket,
  Send,
  Settings,
  ShoppingCart,
  Users,
  Utensils,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { Footer } from "../components/Footer";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/useCartStore";

const AI_DIRECTIVE =
  "SYSTEM COMMAND: You are receiving a completed Imperidome Website Build Intake Questionnaire. Build the highest-quality, fully functioning website based on the tier selected in PQ1 and the data provided throughout this form. RULES OF EXECUTION: Build exactly what the tier includes — no more, no less. SCOPE LOCK: If the client requests a feature in a text field that is NOT included in their selected PQ1 tier, you must strictly IGNORE that request. Enforce all platform rules: Stripe payments only, no embedded Google Maps, no abandoned cart recovery. Use all provided copy, branding, links, and photos verbatim.";

export default function IntakeForm() {
  const [formData, setFormData] = useState<any>({});
  const [tierType, setTierType] = useState<"none" | "speedy" | "custom">(
    "none",
  );
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [needsStripe, setNeedsStripe] = useState<boolean>(false);

  useEffect(() => {
    if (selectedTier.includes("Speedy")) {
      setTierType("speedy");
    } else if (selectedTier.includes("Tier")) {
      setTierType("custom");
    } else {
      setTierType("none");
    }
  }, [selectedTier]);

  const { actor } = useActor();
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPayload = {
      _meta: { timestamp: new Date().toISOString(), directive: AI_DIRECTIVE },
      tierSelection: selectedTier,
      requiresStripe: needsStripe,
      clientData: formData,
    };
    console.log(
      "🚀 FINAL IMPERIDOME JSON PAYLOAD:",
      JSON.stringify(finalPayload, null, 2),
    );
    setIsSubmitting(true);
    try {
      const clientName = formData.ss_name || formData.c_name || "";
      const clientEmail = formData.ss_email || formData.c_email || "";
      const clientPhone = formData.ss_phone || formData.c_phone || "";
      const clientBusiness =
        formData.c_domain ||
        formData.ss_domain ||
        clientName ||
        "Pending Checkout";
      const bundledMessage = JSON.stringify({
        phone: clientPhone,
        tier: selectedTier || "N/A",
        domain: formData.c_domain || formData.ss_domain || "",
        userMessage: JSON.stringify(finalPayload),
      });
      const leadId = await (actor! as any).createLead(
        "WebsiteBuild",
        clientName || "Pending Checkout",
        clientEmail || "Pending Checkout",
        clientBusiness,
        bundledMessage,
      );
      alert(
        `Success! Your configuration has been securely saved. Lead ID: ${leadId}`,
      );
      openDrawer();
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputField = ({
    label,
    id,
    required = false,
    type = "text",
    placeholder = "",
  }: any) => (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
      >
        {label} {required && <span className="text-[#5EF08A]">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          id={id}
          required={required}
          onChange={(e) => handleChange(id, e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-3 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A] transition-colors resize-none"
        />
      ) : (
        <input
          type={type}
          id={id}
          required={required}
          onChange={(e) => handleChange(id, e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-3 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A] transition-colors"
        />
      )}
    </div>
  );

  const SectionWrapper = ({ title, icon: Icon, children }: any) => (
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

  return (
    <>
      <div className="min-h-screen bg-[#0A0B14] text-[#EEF0F8] font-sans pb-32 pt-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
              Project Intake <span className="text-[#5EF08A]">Portal</span>
            </h1>
            <p className="text-[#9CA3AF] text-lg">
              Complete every required field. Better than a freelancer. Faster
              than an agency. Priced for the real world.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* PRE-QUALIFICATION */}
            <SectionWrapper
              title="Pre-Qualification (Required)"
              icon={CheckCircle2}
            >
              <div className="mb-6">
                <label
                  htmlFor="pq1-select"
                  className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                >
                  PQ1. Which build are you purchasing?{" "}
                  <span className="text-[#5EF08A]">*</span>
                </label>
                <select
                  id="pq1-select"
                  required
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A] transition-colors appearance-none"
                >
                  <option value="">Select your build...</option>
                  <optgroup label="Speedy Sites (High-performance templates)">
                    <option value="Speedy Basic">
                      Speedy Basic ($149 build + $19/mo) — 1 Page
                    </option>
                    <option value="Speedy Booking">
                      Speedy Booking ($249 build + $39/mo) — 2 Pages
                    </option>
                    <option value="Speedy Product Storefront">
                      Speedy Product Storefront ($349 build + $49/mo) — Max 3
                      Pages
                    </option>
                    <option value="Speedy Recurring Storefront">
                      Speedy Recurring Storefront ($349 build + $49/mo) — Max 3
                      Pages
                    </option>
                    <option value="Speedy Menu Storefront">
                      Speedy Menu Storefront ($349 build + $49/mo) — Max 3 Pages
                    </option>
                  </optgroup>
                  <optgroup label="Custom Tiers (Fully custom agency builds)">
                    <option value="Tier 1">
                      Tier 1 — Digital Presence ($749–$949)
                    </option>
                    <option value="Tier 2">
                      Tier 2 — Authority Site ($1,800–$2,200)
                    </option>
                    <option value="Tier 3A">
                      Tier 3A — Booking Pro ($3,900–$4,600)
                    </option>
                    <option value="Tier 3B">
                      Tier 3B — Restaurant Pro ($4,100–$4,900)
                    </option>
                    <option value="Tier 4A">
                      Tier 4A — Digital Storefront ($6,500–$7,200)
                    </option>
                    <option value="Tier 4B">
                      Tier 4B — Restaurant Empire ($8,500–$10,000)
                    </option>
                    <option value="Tier 4C">
                      Tier 4C — Membership Engine ($7,400+)
                    </option>
                    <option value="Tier 5">
                      Tier 5 — Enterprise Scale ($14,000+)
                    </option>
                  </optgroup>
                </select>
              </div>

              <AnimatePresence>
                {tierType === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <label
                      htmlFor="pq2-select"
                      className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                    >
                      PQ2. Which monthly plan are you selecting?{" "}
                      <span className="text-[#5EF08A]">*</span>
                    </label>
                    <select
                      id="pq2-select"
                      required
                      onChange={(e) => handleChange("plan", e.target.value)}
                      className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                    >
                      <option value="">
                        Select a monthly management plan...
                      </option>
                      <option value="Plan 1">
                        Plan 1 — Hosting Only ($29/mo)
                      </option>
                      <option value="Plan 2">
                        Plan 2 — Stay Sharp ($89/mo)
                      </option>
                      <option value="Plan 3">
                        Plan 3 — Stay Ahead ($249/mo)
                      </option>
                      <option value="Plan 4">
                        Plan 4 — Full Partner ($549/mo)
                      </option>
                      {selectedTier === "Tier 5" && (
                        <option value="Plan 4+">
                          Plan 4+ — Enterprise Partner ($799/mo)
                        </option>
                      )}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                label="PQ3. Primary Point of Contact (Name / Email / Phone)"
                id="pq3"
                required
              />
              <InputField
                label="PQ4. Preferred Launch Date"
                id="pq4"
                type="date"
                required
              />

              <div className="mb-6">
                <label
                  htmlFor="pq5-select"
                  className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                >
                  PQ5. Content Generation{" "}
                  <span className="text-[#5EF08A]">*</span>
                </label>
                <select
                  id="pq5-select"
                  required
                  onChange={(e) => handleChange("content_type", e.target.value)}
                  className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                >
                  <option value="">Select option...</option>
                  <option value="client_provided">
                    I will provide all content (copy, photos, descriptions)
                  </option>
                  <option value="agency_written">
                    I need content written for me — I will provide direction
                  </option>
                  <option value="mix">
                    Mix — I have some content, need help with the rest
                  </option>
                </select>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="pq7-select"
                  className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                >
                  PQ7. Brand Voice <span className="text-[#5EF08A]">*</span>
                </label>
                <select
                  id="pq7-select"
                  required
                  onChange={(e) => handleChange("brand_voice", e.target.value)}
                  className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                >
                  <option value="">Select brand voice...</option>
                  <option value="Professional & Trustworthy">
                    Professional &amp; Trustworthy (Law, Medical, Corporate)
                  </option>
                  <option value="Friendly & Approachable">
                    Friendly &amp; Approachable (Pets, Family, Local Service)
                  </option>
                  <option value="Bold & High-Energy">
                    Bold &amp; High-Energy (Gyms, Nightclubs, Disruptive)
                  </option>
                  <option value="Luxury & Elite">
                    Luxury &amp; Elite (Med spas, Fine dining, Boutique)
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-3 mt-8 p-4 bg-[#5EF08A]/5 border border-[#5EF08A]/20 rounded-xl">
                <input
                  type="checkbox"
                  id="pq6"
                  required
                  className="w-5 h-5 accent-[#5EF08A] rounded"
                />
                <label htmlFor="pq6" className="text-sm text-[#9CA3AF]">
                  PQ6. I confirm I understand the build is based entirely on
                  what I submit in this form. My tier's allotted revision rounds
                  cover specific design tweaks, not structural rebuilds.{" "}
                  <span className="text-[#5EF08A]">*</span>
                </label>
              </div>

              <div className="flex items-center gap-3 mt-4 p-4 bg-[#1C1F33] rounded-xl">
                <input
                  type="checkbox"
                  id="needs_stripe"
                  onChange={(e) => setNeedsStripe(e.target.checked)}
                  className="w-5 h-5 accent-[#5EF08A] rounded"
                />
                <label
                  htmlFor="needs_stripe"
                  className="text-sm font-bold text-white uppercase tracking-wider"
                >
                  My site will process payments, bookings, or sell products
                  (Requires Stripe Setup).
                </label>
              </div>
            </SectionWrapper>

            {/* STRIPE SETUP (CONDITIONAL) */}
            <AnimatePresence>
              {needsStripe && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <SectionWrapper
                    title="Stripe Setup & Compliance"
                    icon={CreditCard}
                  >
                    <p className="text-[#9CA3AF] mb-6 text-sm">
                      Find your API keys in your Stripe Dashboard under
                      Developers &gt; API Keys.
                    </p>
                    <InputField
                      label="ST1. Stripe Secret Key (sk_live_...)"
                      id="stripe_secret"
                      required
                    />
                    <InputField
                      label="ST2. Stripe Public Key (pk_live_...)"
                      id="stripe_public"
                      required
                    />
                    <InputField
                      label="ST3. Stripe Webhook Secret (whsec_...)"
                      id="stripe_webhook"
                      required
                    />
                    <InputField
                      label="ST4. Statement Descriptor (Max 22 chars)"
                      id="stripe_descriptor"
                      required
                    />
                    <InputField
                      label="ST5. Billing Support Contact (Phone/Email)"
                      id="stripe_support"
                      required
                    />

                    <div className="mb-6 mt-8">
                      {/* biome-ignore lint/a11y/noLabelWithoutControl: group label */}
                      <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
                        ST6. Legal Compliance Pages Needed{" "}
                        <span className="text-[#5EF08A]">*</span>
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 text-sm text-[#EEF0F8]">
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              handleChange("tos_needed", e.target.checked)
                            }
                            className="accent-[#5EF08A] w-4 h-4"
                          />{" "}
                          I need a Terms of Service page generated.
                        </label>
                        <label className="flex items-center gap-3 text-sm text-[#EEF0F8]">
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              handleChange("privacy_needed", e.target.checked)
                            }
                            className="accent-[#5EF08A] w-4 h-4"
                          />{" "}
                          I need a Privacy Policy page generated.
                        </label>
                        <label className="flex items-center gap-3 text-sm text-[#EEF0F8]">
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              handleChange("refund_needed", e.target.checked)
                            }
                            className="accent-[#5EF08A] w-4 h-4"
                          />{" "}
                          I need a Refund Policy page generated.
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 p-4 bg-[#5EF08A]/5 border border-[#5EF08A]/20 rounded-xl">
                      <input
                        type="checkbox"
                        required
                        className="w-5 h-5 accent-[#5EF08A] rounded"
                      />
                      {/* biome-ignore lint/a11y/noLabelWithoutControl: adjacent checkbox */}
                      <label className="text-sm text-[#9CA3AF]">
                        ST7. I confirm I have enabled the "Stripe Customer
                        Portal" so my users can self-manage subscriptions.{" "}
                        <span className="text-[#5EF08A]">*</span>
                      </label>
                    </div>
                  </SectionWrapper>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SPEEDY SITES PATH */}
            <AnimatePresence>
              {tierType === "speedy" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <SectionWrapper
                    title="Speedy Site Configuration"
                    icon={Rocket}
                  >
                    <div className="mb-8 border-b border-[#1C1F33] pb-8">
                      <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                        Business Identity &amp; Contact
                      </h3>
                      <InputField
                        label="SS1. Business name"
                        id="ss_name"
                        required
                      />
                      <InputField
                        label="SS2. Business type (e.g., roofer, salon)"
                        id="ss_type"
                        required
                      />
                      <InputField
                        label="SS3. What does your business do? (1-2 sentences)"
                        id="ss_desc"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="SS4. City / State / Region served"
                        id="ss_region"
                        required
                      />
                      <InputField
                        label="SS5. Primary service or product to feature"
                        id="ss_primary"
                        required
                      />
                      <InputField
                        label="SS6. Domain name you will use"
                        id="ss_domain"
                        required
                      />
                      <InputField
                        label="SS13. Phone number to display"
                        id="ss_phone"
                        required
                      />
                      <InputField
                        label="SS14. Email address for contact form"
                        id="ss_email"
                        required
                      />
                      <InputField
                        label="SS15. Physical address (or 'Fully Online')"
                        id="ss_address"
                        required
                      />
                      <InputField
                        label="SS16. Business hours to display"
                        id="ss_hours"
                        required
                      />
                      <InputField
                        label="SS17. Brand colors (Hex codes)"
                        id="ss_colors"
                        required
                      />
                      <InputField
                        label="SS18. Logo (URL or 'will email PNG')"
                        id="ss_logo"
                        required
                      />
                    </div>

                    <div className="mb-8 border-b border-[#1C1F33] pb-8">
                      <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                        Page Content
                      </h3>
                      <InputField
                        label="SS7. Hero headline"
                        id="ss_hero_head"
                        required
                      />
                      <InputField
                        label="SS8. Primary CTA button text and action"
                        id="ss_cta"
                        required
                      />
                      <InputField
                        label="SS9. Tagline or trust badge"
                        id="ss_tagline"
                        required
                      />
                      <InputField
                        label="SS10. About Us (2-3 sentences)"
                        id="ss_about"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="SS11. Up to 3 services (Name + 1 sentence desc)"
                        id="ss_services"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="SS12. Testimonials (1-3 short quotes and names)"
                        id="ss_testimonials"
                        type="textarea"
                        required
                      />
                    </div>

                    {selectedTier === "Speedy Booking" && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                          Booking Logic (Speedy Upgrade)
                        </h3>
                        <InputField
                          label="SSB1. Bookable services (Name — Duration — Price)"
                          id="ss_booking_list"
                          type="textarea"
                          required
                        />
                        <InputField
                          label="SSB2. Payment capture (None / Deposit / Full)"
                          id="ss_booking_pay"
                          required
                        />
                      </div>
                    )}

                    {selectedTier === "Speedy Product Storefront" && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                          Storefront Logic (Speedy Upgrade)
                        </h3>
                        <InputField
                          label="SSP1. First 10 products (Name — Price — Image URL — Desc)"
                          id="ss_prod_list"
                          type="textarea"
                          required
                        />
                      </div>
                    )}

                    {selectedTier === "Speedy Recurring Storefront" && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                          Subscription Logic (Speedy Upgrade)
                        </h3>
                        <InputField
                          label="SSR1. First 3 subscription tiers (Name — Cycle — Price — Included)"
                          id="ss_sub_list"
                          type="textarea"
                          required
                        />
                      </div>
                    )}

                    {selectedTier === "Speedy Menu Storefront" && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                          Menu Logic (Speedy Upgrade)
                        </h3>
                        <InputField
                          label="SSM1. First 10 menu items (Category — Name — Price — Desc)"
                          id="ss_menu_list"
                          type="textarea"
                          required
                        />
                        <InputField
                          label="SSM2. Order types (Pickup, Delivery, Both)"
                          id="ss_menu_types"
                          required
                        />
                      </div>
                    )}

                    <div className="p-4 bg-[#1C1F33] border border-[#5EF08A]/20 rounded-xl text-center">
                      <p className="text-[#5EF08A] font-bold">
                        Speedy Configuration Complete.
                      </p>
                      <p className="text-sm text-gray-400">
                        You may scroll down to submit your project.
                      </p>
                    </div>
                  </SectionWrapper>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 🏢 CUSTOM TIERS PATH */}
            <AnimatePresence>
              {tierType === "custom" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* STEP 1: CORE FOUNDATION (All Tiers 1-5) */}
                  <SectionWrapper
                    title="Step 1: Core Foundation"
                    icon={LayoutTemplate}
                  >
                    <div className="mb-8 border-b border-[#1C1F33] pb-8">
                      <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                        Business Basics
                      </h3>
                      <InputField
                        label="1.1. Business name"
                        id="c_name"
                        required
                      />
                      <InputField
                        label="1.2. What does your business do? (1-2 sentences)"
                        id="c_desc"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="1.3. City / State / Region served"
                        id="c_region"
                        required
                      />
                      <InputField
                        label="1.4. Who is your ideal customer?"
                        id="c_avatar"
                        required
                      />
                      <InputField
                        label="1.5. What makes you different? (Edge)"
                        id="c_edge"
                        required
                      />
                      <InputField
                        label="1.6. Most impressive numbers or stats (e.g. 500+ clients)"
                        id="c_stats"
                      />
                    </div>

                    <div className="mb-8 border-b border-[#1C1F33] pb-8">
                      <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                        Hero Section
                      </h3>
                      <InputField
                        label="1.7. Hero headline"
                        id="c_hero"
                        required
                      />
                      <InputField
                        label="1.8. Hero sub-headline (1-2 supporting sentences)"
                        id="c_hero_sub"
                        required
                      />
                      <InputField
                        label="1.9. Primary CTA button text"
                        id="c_cta"
                        required
                      />
                      <InputField
                        label="1.10. Primary CTA destination (Scrolls to form, calls, link)"
                        id="c_cta_dest"
                        required
                      />
                      <InputField
                        label="1.11. Tagline or trust badge"
                        id="c_tagline"
                        required
                      />
                      <InputField
                        label="1.12. Hero background preference (Photo URL, hex, scene)"
                        id="c_hero_bg"
                      />
                    </div>

                    <div className="mb-8 border-b border-[#1C1F33] pb-8">
                      <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                        About &amp; Services
                      </h3>
                      <InputField
                        label="1.13. Full About / Brand Story (3-6 sentences)"
                        id="c_about"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="1.14. Your full name and title to display"
                        id="c_owner_name"
                        required
                      />
                      <InputField
                        label="1.15. List every service (NAME — Description)"
                        id="c_services"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="1.16. Show pricing? (Yes / No)"
                        id="c_show_pricing"
                      />
                    </div>

                    <div className="mb-8 border-b border-[#1C1F33] pb-8">
                      <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                        Trust &amp; Contact
                      </h3>
                      <InputField
                        label="1.17. Paste 3-5 customer testimonials"
                        id="c_testis"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="1.18. Email address for all contact forms"
                        id="c_email"
                        required
                      />
                      <InputField
                        label="1.19. Phone number to display"
                        id="c_phone"
                        required
                      />
                      <InputField
                        label="1.20. Physical address to display"
                        id="c_address"
                        required
                      />
                      <InputField
                        label="1.21. Business hours to display"
                        id="c_hours"
                        required
                      />
                    </div>

                    <div className="mb-8 border-b border-[#1C1F33] pb-8">
                      <h3 className="text-lg font-bold text-[#5EF08A] mb-4 uppercase tracking-widest">
                        SEO &amp; Design
                      </h3>
                      <InputField
                        label="1.22. Domain name you will use"
                        id="c_domain"
                        required
                      />
                      <InputField
                        label="1.23. Browser tab title (60 chars max)"
                        id="c_tab_title"
                        required
                      />
                      <InputField
                        label="1.24. Primary keywords you want to rank for (List 3-5)"
                        id="c_keywords"
                        required
                      />
                      <InputField
                        label="1.25. Brand colors (Hex codes)"
                        id="c_colors"
                        required
                      />
                      <InputField
                        label="1.26. Logo (URL or 'will email')"
                        id="c_logo"
                        required
                      />
                      <div className="mb-6">
                        {/* biome-ignore lint/a11y/noLabelWithoutControl: adjacent select */}
                        <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                          1.27. Style Keywords{" "}
                          <span className="text-[#5EF08A]">*</span>
                        </label>
                        <select
                          required
                          onChange={(e) =>
                            handleChange("c_style_keys", e.target.value)
                          }
                          className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                        >
                          <option value="">Select style vibe...</option>
                          <option value="Minimalist">Minimalist</option>
                          <option value="High-Energy">High-Energy</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Elegant">Elegant</option>
                          <option value="Industrial">Industrial</option>
                        </select>
                      </div>
                    </div>
                  </SectionWrapper>

                  {/* STEP 2: MULTI-PAGE EXPANSION (Tiers 2-5) */}
                  {[
                    "Tier 2",
                    "Tier 3A",
                    "Tier 3B",
                    "Tier 4A",
                    "Tier 4B",
                    "Tier 4C",
                    "Tier 5",
                  ].includes(selectedTier) && (
                    <SectionWrapper
                      title="Step 2: Multi-Page Expansion"
                      icon={Users}
                    >
                      <InputField
                        label="2.1. List every page your site needs"
                        id="c_pages"
                        required
                      />
                      <InputField
                        label="2.2. Navigation menu structure (Exact order)"
                        id="c_nav_menu"
                        required
                      />
                      <InputField
                        label="2.3. Services that need dedicated pages"
                        id="c_service_pages"
                        required
                      />
                      <InputField
                        label="2.4. & 2.5. Dedicated Service Page Content (Name/SEO Title/Copy)"
                        id="c_service_content"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="2.6. Primary city + surrounding areas for SEO"
                        id="c_local_seo"
                        required
                      />
                      <InputField
                        label="2.7. Your top 3 competitor URLs"
                        id="c_competitors"
                        required
                      />
                      <InputField
                        label="2.8. Primary CTA for the entire site"
                        id="c_global_cta"
                        required
                      />
                      <InputField
                        label="2.9. Write 8-12 FAQ questions and answers"
                        id="c_faqs"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="2.10. Meet the Team (Name — Title — Bio — Photo)"
                        id="c_team"
                        type="textarea"
                        required
                      />
                    </SectionWrapper>
                  )}

                  {/* STEP 3A: BOOKING ENGINE (Tier 3A & 4C) */}
                  {["Tier 3A", "Tier 4C", "Tier 5"].includes(selectedTier) && (
                    <SectionWrapper
                      title="Step 3A: Booking Engine Logic"
                      icon={Calendar}
                    >
                      <InputField
                        label="3A.1. Every bookable service (Name — Duration — Price)"
                        id="c_booking_services"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="3A.2. Staff/providers who take bookings"
                        id="c_booking_staff"
                        required
                      />
                      <InputField
                        label="3A.3. Payment rule (None / Deposit / Full)"
                        id="c_booking_payment"
                        required
                      />
                      <InputField
                        label="3A.4. Cancellation / no-show policy"
                        id="c_booking_cancel"
                        required
                      />
                      <InputField
                        label="3A.5. Booking confirmation email copy"
                        id="c_booking_email"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="3A.6. 24-hour reminder email copy"
                        id="c_booking_reminder"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="3A.7. Your lead pipeline stages (For CRM)"
                        id="c_pipeline"
                        required
                      />
                    </SectionWrapper>
                  )}

                  {/* STEP 3B: RESTAURANT ENGINE (Tier 3B & 4B) */}
                  {["Tier 3B", "Tier 4B", "Tier 5"].includes(selectedTier) && (
                    <SectionWrapper
                      title="Step 3B: Restaurant Engine Logic"
                      icon={Utensils}
                    >
                      <InputField
                        label="3B.1. Order types (Pickup, Delivery, Both)"
                        id="c_rest_types"
                        required
                      />
                      <InputField
                        label="3B.2. Kitchen order notification email"
                        id="c_rest_email"
                        required
                      />
                      <InputField
                        label="3B.3. Estimated preparation/wait time"
                        id="c_prep_time"
                        required
                      />
                      <InputField
                        label="3B.4. Menu categories in display order"
                        id="c_menu_cats"
                        required
                      />
                      <InputField
                        label="3B.5. Complete menu items (Category — Name — Desc — Price)"
                        id="c_rest_menu"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="3B.6. Modifiers & customizations (e.g. Add Bacon +$2)"
                        id="c_rest_mods"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="3B.7. Order confirmation email copy"
                        id="c_order_conf"
                        type="textarea"
                        required
                      />
                    </SectionWrapper>
                  )}

                  {/* STEP 4A: E-COMMERCE (Tier 4A) */}
                  {["Tier 4A", "Tier 5"].includes(selectedTier) && (
                    <SectionWrapper
                      title="Step 4A: E-Commerce Storefront"
                      icon={ShoppingCart}
                    >
                      <InputField
                        label="4A.1. Product categories"
                        id="c_ecom_cats"
                        required
                      />
                      <InputField
                        label="4A.2. COMPLETE CATALOG (Name/Price/SKU/Variants/Desc - Max 50)"
                        id="c_ecom_catalog"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="4A.3. Physical Origin Address (For tax/shipping nexus)"
                        id="c_origin_address"
                        required
                      />
                      <InputField
                        label="4A.4. US states where you collect sales tax"
                        id="c_ecom_tax"
                        required
                      />
                      <InputField
                        label="4A.5. Default Tax Code (e.g., txcd_99999999)"
                        id="c_tax_code"
                        required
                      />
                      <div className="mb-6">
                        {/* biome-ignore lint/a11y/noLabelWithoutControl: adjacent select */}
                        <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                          4A.6. Shipping Logic Preference{" "}
                          <span className="text-[#5EF08A]">*</span>
                        </label>
                        <select
                          required
                          onChange={(e) =>
                            handleChange("c_ship_logic", e.target.value)
                          }
                          className="w-full bg-[#0A0B14] border border-[#1C1F33] rounded-xl px-4 py-4 text-[#EEF0F8] focus:outline-none focus:border-[#5EF08A]"
                        >
                          <option value="">Select logic...</option>
                          <option value="Flat Rate">Flat Rate Shipping</option>
                          <option value="Weight-Based">
                            Weight-Based Shipping
                          </option>
                          <option value="Real-Time Carrier">
                            Real-Time Carrier Rates
                          </option>
                        </select>
                      </div>
                      <InputField
                        label="4A.7. Flat/Weight Shipping Rules"
                        id="c_ecom_shipping"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="4A.8. Order confirmation email copy"
                        id="c_ecom_conf"
                        type="textarea"
                        required
                      />
                    </SectionWrapper>
                  )}

                  {/* STEP 4C: MEMBERSHIP (Tier 4C) */}
                  {["Tier 4C", "Tier 5"].includes(selectedTier) && (
                    <SectionWrapper
                      title="Step 4C: Membership Engine"
                      icon={Settings}
                    >
                      <InputField
                        label="4C.1. Every membership level (Name — Cycle — Price — Included)"
                        id="c_mem_levels"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="4C.2. Class pack options to sell"
                        id="c_class_packs"
                        required
                      />
                      <InputField
                        label="4C.3. Class schedule (Name — Day — Time — Instructor — Cap)"
                        id="c_mem_classes"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="4C.4. Subscription reminder email copy"
                        id="c_mem_reminder"
                        type="textarea"
                        required
                      />
                      <InputField
                        label="4C.5. Failed payment recovery email copy"
                        id="c_failed_pay"
                        type="textarea"
                        required
                      />
                    </SectionWrapper>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* SUBMIT BUTTON */}
            <motion.button
              type="submit"
              disabled={tierType === "none" || isSubmitting}
              whileHover={{
                scale: tierType !== "none" && !isSubmitting ? 1.02 : 1,
              }}
              whileTap={{
                scale: tierType !== "none" && !isSubmitting ? 0.98 : 1,
              }}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                tierType !== "none" && !isSubmitting
                  ? "bg-[#5EF08A] text-[#0A0B14] hover:bg-[#4ade80] shadow-[0_0_30px_rgba(94,240,138,0.3)]"
                  : "bg-[#1C1F33] text-gray-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />{" "}
              {isSubmitting ? "Processing..." : "Submit Build Questionnaire"}
            </motion.button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
