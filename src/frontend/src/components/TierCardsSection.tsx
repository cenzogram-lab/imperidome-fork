import { CheckCircle2, Clock } from "lucide-react";
import { EditableText } from "./EditableText";

interface TierCard {
  id: number;
  badge: string;
  name: string;
  pitch: string;
  price: string;
  delivery: string;
  features: string[];
  recommended: string;
  mostPopular: boolean;
  tierCode: string;
}

const TIERS: TierCard[] = [
  {
    id: 1,
    badge: "TIER 1",
    name: "Digital Presence",
    pitch: "A real custom website in 5 days",
    price: "$749–$1,499",
    delivery: "5 business days",
    features: [
      "1-page mobile-first design",
      "Click-to-call + click-to-text",
      "Basic SEO + Google Analytics",
    ],
    recommended: "Plan 2 — $89/mo",
    mostPopular: false,
    tierCode: "TIER1",
  },
  {
    id: 2,
    badge: "TIER 2",
    name: "Authority Site",
    pitch: "Multi-page SEO site built to rank and convert",
    price: "$1,800–$3,200",
    delivery: "7–10 business days",
    features: [
      "5–8 custom pages",
      "Full per-page SEO",
      "Lead capture forms on every page",
    ],
    recommended: "Plan 2 — $89/mo",
    mostPopular: false,
    tierCode: "TIER2",
  },
  {
    id: 3,
    badge: "TIER 3A",
    name: "Booking Pro",
    pitch: "Your entire appointment business on autopilot",
    price: "$3,500–$5,500",
    delivery: "10–14 business days",
    features: [
      "Online booking up to 20 services",
      "Built-in CRM",
      "Automated confirmation + reminder emails",
    ],
    recommended: "Plan 3 — $249/mo",
    mostPopular: true,
    tierCode: "TIER3A",
  },
  {
    id: 4,
    badge: "TIER 3B",
    name: "Restaurant Pro",
    pitch: "Zero-commission online ordering. You keep 100%",
    price: "$3,800–$6,000",
    delivery: "10–14 business days",
    features: [
      "Commission-free online ordering",
      "Full digital menu with modifiers",
      "Pickup + delivery toggle",
    ],
    recommended: "Plan 3 — $249/mo",
    mostPopular: true,
    tierCode: "TIER3B",
  },
  {
    id: 5,
    badge: "TIER 4A",
    name: "Digital Storefront",
    pitch: "A fully custom e-commerce store — no Shopify fees",
    price: "$5,500–$8,500",
    delivery: "14 business days",
    features: [
      "Up to 50 products with variants",
      "Apple Pay + Google Pay via Stripe",
      "Inventory tracking per variant",
    ],
    recommended: "Plan 4 — $549/mo",
    mostPopular: false,
    tierCode: "TIER4A",
  },
  {
    id: 6,
    badge: "TIER 4B",
    name: "Restaurant Empire",
    pitch: "Multi-location ordering and reservations — 0% commission",
    price: "$7,000–$10,500",
    delivery: "14–21 business days",
    features: [
      "Multi-location support up to 3 locations",
      "Reservation + waitlist management",
      "Gift card sales via Stripe",
    ],
    recommended: "Plan 4 — $549/mo",
    mostPopular: false,
    tierCode: "TIER4B",
  },
  {
    id: 7,
    badge: "TIER 4C",
    name: "Membership Engine",
    pitch: "Recurring revenue on autopilot",
    price: "$7,500–$11,000",
    delivery: "14–21 business days",
    features: [
      "Subscription billing via Stripe",
      "Up to 5 membership tiers",
      "Member self-service portal",
    ],
    recommended: "Plan 4 — $549/mo",
    mostPopular: false,
    tierCode: "TIER4C",
  },
  {
    id: 8,
    badge: "TIER 5",
    name: "Enterprise Scale",
    pitch: "Own your entire digital ecosystem — no platform fees",
    price: "$14,000–$28,000",
    delivery: "21–45 business days",
    features: [
      "Custom development scope",
      "Up to 10 locations or departments",
      "Dedicated project manager",
    ],
    recommended: "Plan 4+ — $799/mo",
    mostPopular: false,
    tierCode: "TIER5",
  },
];

// Map tier id → slug for deterministic textKey generation
const TIER_SLUGS: Record<number, string> = {
  1: "digital-presence",
  2: "authority-site",
  3: "booking-pro",
  4: "restaurant-pro",
  5: "digital-storefront",
  6: "restaurant-empire",
  7: "membership-engine",
  8: "enterprise-scale",
};

export function TierCardsSection() {
  function handleGetStarted(tierCode: string) {
    sessionStorage.setItem("tier_code", tierCode);
    const isAuthenticated = false;
    window.location.href = isAuthenticated ? "/questionnaire" : "/login";
  }

  return (
    <section
      data-ocid="tiers.section"
      style={{ backgroundColor: "rgba(14,16,32,1)" }}
      className="py-20 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold text-center"
          style={{ color: "#EEF0F8" }}
        >
          <EditableText
            textKey="tiers.section.heading"
            defaultText="Every Business. Every Budget. One Agency."
            as="span"
            className="text-3xl md:text-4xl font-bold"
          />
        </h2>
        <p
          className="text-center mt-3 mb-14 text-lg"
          style={{ color: "#7A7D90" }}
        >
          <EditableText
            textKey="tiers.section.subheading"
            defaultText="Pick your tier. Submit your info. We build it."
            as="span"
            className="text-lg"
          />
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const slug = TIER_SLUGS[tier.id] ?? `tier-${tier.id}`;
            return (
              <div
                key={tier.id}
                data-ocid={`tiers.card.${tier.id}`}
                className="rounded-xl overflow-hidden flex flex-col"
                style={{
                  backgroundColor: "rgba(17,19,34,0.7)",
                  backdropFilter: "blur(12px)",
                  border: tier.mostPopular
                    ? "1px solid #5EF08A"
                    : "1px solid #1C1F33",
                }}
              >
                {/* Card top badges + content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Badge row */}
                  <div className="relative flex items-start justify-between">
                    <span
                      className="text-xs font-bold rounded px-2 py-0.5"
                      style={{ backgroundColor: "#1C1F33", color: "#EEF0F8" }}
                    >
                      <EditableText
                        textKey={`tier-cards.${slug}.badge`}
                        defaultText={tier.badge}
                        as="span"
                        className="text-xs font-bold"
                      />
                    </span>
                    {tier.mostPopular && (
                      <span
                        className="text-xs font-bold rounded px-2 py-0.5"
                        style={{ backgroundColor: "#5EF08A", color: "#061209" }}
                      >
                        <EditableText
                          textKey={`tier-cards.${slug}.most-popular-label`}
                          defaultText="Most Popular"
                          as="span"
                          className="text-xs font-bold"
                        />
                      </span>
                    )}
                  </div>

                  {/* Tier name */}
                  <h3
                    className="text-xl font-bold mt-4"
                    style={{ color: "#EEF0F8" }}
                  >
                    <EditableText
                      textKey={`tier-cards.${slug}.name`}
                      defaultText={tier.name}
                      as="span"
                      className="text-xl font-bold"
                    />
                  </h3>

                  {/* Pitch */}
                  <p
                    className="text-sm italic mt-1"
                    style={{ color: "#7A7D90" }}
                  >
                    <EditableText
                      textKey={`tier-cards.${slug}.pitch`}
                      defaultText={tier.pitch}
                      as="span"
                      className="text-sm italic"
                    />
                  </p>

                  {/* Price */}
                  <p
                    className="text-3xl font-extrabold mt-4"
                    style={{ color: "#EEF0F8" }}
                  >
                    <EditableText
                      textKey={`tier-cards.${slug}.price`}
                      defaultText={tier.price}
                      as="span"
                      className="text-3xl font-extrabold"
                    />
                  </p>

                  {/* Delivery */}
                  <p
                    className="flex items-center gap-1 text-xs mt-1"
                    style={{ color: "#7A7D90" }}
                  >
                    <Clock size={12} />
                    <EditableText
                      textKey={`tier-cards.${slug}.delivery`}
                      defaultText={tier.delivery}
                      as="span"
                      className="text-xs"
                    />
                  </p>

                  {/* Divider */}
                  <hr
                    className="mt-4 mb-4"
                    style={{ borderColor: "#1C1F33" }}
                  />

                  {/* Features */}
                  <ul className="flex flex-col gap-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                        style={{ color: "#7A7D90" }}
                      >
                        <CheckCircle2
                          size={16}
                          color="#5EF08A"
                          className="mt-0.5 shrink-0"
                        />
                        <EditableText
                          textKey={`tier-cards.${slug}.feature-${featureIndex + 1}`}
                          defaultText={feature}
                          as="span"
                          className="text-sm"
                        />
                      </li>
                    ))}
                  </ul>

                  {/* Spacer */}
                  <div className="flex-grow" />

                  {/* Recommended badge */}
                  <div
                    className="mt-6 mb-4 inline-block text-xs font-medium rounded-full px-3 py-1"
                    style={{ backgroundColor: "#1C1F33", color: "#5EF08A" }}
                  >
                    <EditableText
                      textKey={`tier-cards.${slug}.recommended-label`}
                      defaultText="Recommended:"
                      as="span"
                      className="text-xs font-medium"
                    />{" "}
                    <EditableText
                      textKey={`tier-cards.${slug}.recommended`}
                      defaultText={tier.recommended}
                      as="span"
                      className="text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Get Started button */}
                <div className="px-5 pb-5">
                  <button
                    data-ocid={`tiers.getstarted.button.${tier.id}`}
                    className="w-full font-bold rounded-lg py-3 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#5EF08A", color: "#061209" }}
                    type="button"
                    onClick={() => handleGetStarted(tier.tierCode)}
                  >
                    <EditableText
                      textKey={`tier-cards.${slug}.cta`}
                      defaultText="Get Started"
                      as="span"
                      className="font-bold"
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
