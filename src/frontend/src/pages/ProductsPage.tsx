import { useNavigate } from "@tanstack/react-router";
import {
  Database,
  FilePlus,
  FileText,
  Home,
  RefreshCw,
  Search,
  Share2,
  Smartphone,
  Star,
  Target,
  TrendingUp,
  UserPlus,
  UtensilsCrossed,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Product } from "../backend.d.ts";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import PerformanceSnapshot from "../components/PerformanceSnapshot";
import { useActor } from "../hooks/useActor";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useCartStore } from "../store/useCartStore";

const TABS = [
  "Custom Sites",
  "Speedy Sites",
  "SaaS Plans",
  "Cinematic Ads",
  "Product Ads",
  "AI Receptionist",
  "Growth Hub",
] as const;

type Tab = (typeof TABS)[number];

// Backend names match exactly what's seeded in main.mo (UPPERCASE for Custom Sites)
const CUSTOM_SITES_TIERS = [
  {
    backendName: "DIGITAL PRESENCE",
    displayName: "Digital Presence",
    features: [
      "Up to 5 pages",
      "Mobile responsive design",
      "Contact form + SSL",
    ],
  },
  {
    backendName: "AUTHORITY SITE",
    displayName: "Authority Site",
    features: [
      "Up to 10 pages",
      "Blog + content system",
      "SEO foundation built-in",
    ],
  },
  {
    backendName: "BOOKING PRO",
    displayName: "Booking Pro",
    features: [
      "Online booking portal",
      "Confirmation + reminder emails",
      "Calendar sync integration",
    ],
  },
  {
    backendName: "RESTAURANT PRO",
    displayName: "Restaurant Pro",
    features: [
      "Digital menu system",
      "Online ordering + reservations",
      "Zero-commission ordering",
    ],
  },
  {
    backendName: "DIGITAL STOREFRONT",
    displayName: "Digital Storefront",
    features: [
      "Full e-commerce build",
      "Stripe checkout + inventory",
      "Up to 500 products",
    ],
  },
  {
    backendName: "RESTAURANT EMPIRE",
    displayName: "Restaurant Empire",
    features: [
      "Multi-location support",
      "Loyalty + rewards system",
      "Full POS integration",
    ],
  },
  {
    backendName: "MEMBERSHIP ENGINE",
    displayName: "Membership Engine",
    features: [
      "Gated content system",
      "Subscription billing tiers",
      "Member dashboard + portal",
    ],
  },
  {
    backendName: "ENTERPRISE SCALE",
    displayName: "Enterprise Scale",
    features: [
      "Custom architecture",
      "Advanced integrations + API",
      "Dedicated build team",
    ],
  },
];

const RUSH_STEPS = [
  {
    label: "Standard",
    days: "5 Business Days",
    fee: "+$0",
    feeNote: "Included",
    isEmergency: false,
  },
  {
    label: "Priority",
    days: "4 Business Days",
    fee: "+$149",
    feeNote: "",
    isEmergency: false,
  },
  {
    label: "Express",
    days: "3 Business Days",
    fee: "+$299",
    feeNote: "",
    isEmergency: false,
  },
  {
    label: "Rush",
    days: "2 Business Days",
    fee: "+$599",
    feeNote: "",
    isEmergency: false,
  },
  {
    label: "Emergency ⚡",
    days: "1 Business Day",
    fee: "+$1,199",
    feeNote: "",
    isEmergency: true,
  },
];

// Backend names for Speedy Sites — UPPERCASE as seeded in main.mo
const SPEEDY_SITES = [
  {
    backendName: "SPEEDY BASIC",
    displayName: "Speedy Basic",
    features: [
      "1 page, 48hr delivery",
      "Contact form + SSL",
      "Fully Managed Infrastructure",
    ],
  },
  {
    backendName: "SPEEDY BOOKING",
    displayName: "Speedy Booking",
    features: [
      "2 pages + booking portal",
      "Confirmation emails",
      "Fully Managed Infrastructure",
    ],
  },
  {
    backendName: "SPEEDY PRODUCT STOREFRONT",
    displayName: "Speedy Product Storefront",
    features: [
      "3 pages + Stripe checkout",
      "Up to 30 products",
      "Fully Managed Infrastructure",
    ],
  },
  {
    backendName: "SPEEDY MENU STOREFRONT",
    displayName: "Speedy Menu Storefront",
    features: [
      "3 pages + digital menu",
      "Zero-commission ordering",
      "Fully Managed Infrastructure",
    ],
  },
  {
    backendName: "SPEEDY RECURRING STOREFRONT",
    displayName: "Speedy Recurring Storefront",
    features: [
      "3 pages + subscription billing",
      "Up to 7 billing tiers",
      "Fully Managed Infrastructure",
    ],
  },
];

// Speedy hosting plans — backend names as seeded (title case)
const SPEEDY_PLANS = [
  {
    backendName: "Basic Plan",
    displayName: "Speedy Basic Plan",
    powers: "Speedy Basic site",
    features: [
      "Hosting & SSL",
      "Contact form routing",
      "Basic traffic analytics",
      "Self-managed dashboard",
    ],
  },
  {
    backendName: "Booking Plan",
    displayName: "Speedy Booking Plan",
    powers: "Speedy Booking site",
    features: [
      "Everything in Basic",
      "Booking engine",
      "Calendar syncing",
      "Confirmation emails",
      "Appointment analytics",
    ],
  },
  {
    backendName: "Storefront Plan",
    displayName: "Speedy Storefront Plan",
    powers: "Speedy Product, Menu, or Recurring sites",
    features: [
      "Everything in Basic",
      "Stripe checkout routing",
      "Inventory/menu dashboard",
      "Order notifications",
      "Sales analytics",
    ],
  },
];

// SaaS/Maintenance plans — backend names as seeded (title case)
const MAINTENANCE_PLANS = [
  { backendName: "Keep It Live" },
  { backendName: "Stay Sharp" },
  { backendName: "Stay Ahead" },
  { backendName: "Full Partner" },
  { backendName: "Enterprise Partner" },
];

// Cinematic per-second pricing (static — these are build-tool prices not in product catalog)
const AD_PRICES: Record<number, number> = {
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

// Cinematic Ads retainers — backend names as seeded (UPPERCASE)
const AD_RETAINERS = [
  { backendName: "THE PILOT", displayName: "Pilot", qty: "3 ads/quarter" },
  { backendName: "THE PRO", displayName: "Pro", qty: "6 ads/quarter" },
  { backendName: "THE ELITE", displayName: "Elite", qty: "9 ads/quarter" },
];

// AI Receptionist tiers — backend names as seeded (UPPERCASE)
const AI_TIERS = [
  {
    backendName: "THE SAFETY NET",
    displayName: "Safety Net",
    setup: null as string | null,
    features: [
      "Missed-call text-back",
      "Web chat widget",
      "Basic lead capture",
    ],
  },
  {
    backendName: "THE RECEPTIONIST",
    displayName: "AI Receptionist",
    setup: "+ $249 setup" as string | null,
    features: [
      "AI voice answers calls",
      "Handles FAQs automatically",
      "Sends booking links",
    ],
  },
  {
    backendName: "THE CLOSER",
    displayName: "The Closer",
    setup: "+ $499 setup" as string | null,
    features: [
      "Books appointments live on call",
      "CRM integration",
      "Full calendar access",
    ],
  },
];

// Growth Hub items with backend names for live price lookup
const GROWTH_HUB_CATEGORIES = [
  {
    label: "📈 TRAFFIC",
    categoryKey: "traffic",
    items: [
      {
        name: "Local SEO Booster",
        backendName: "Local SEO Booster",
        fallbackPrice: "$199/mo",
        icon: TrendingUp,
        desc: "Rank in local Google searches for your city and niche",
      },
      {
        name: "Blog / Content SEO",
        backendName: "Blog / Content SEO",
        fallbackPrice: "$299/mo",
        icon: FileText,
        desc: "Monthly optimized blog content that builds domain authority",
      },
      {
        name: "Google Ads Management",
        backendName: "Google Ads Management",
        fallbackPrice: "$399+/mo",
        icon: Target,
        desc: "Managed ad campaigns with monthly reporting",
      },
      {
        name: "Social Media Sync",
        backendName: "Social Media Sync",
        fallbackPrice: "$99/mo",
        icon: Share2,
        desc: "Auto-publish content to your social channels",
      },
    ],
  },
  {
    label: "🎯 CONVERSION",
    categoryKey: "conversion",
    items: [
      {
        name: "Lead Capture Upgrade",
        backendName: "Lead Capture Upgrade",
        fallbackPrice: "$99/mo",
        icon: UserPlus,
        desc: "Pop-up forms, exit intent, and A/B tested CTAs",
      },
      {
        name: "Review Generation",
        backendName: "Review Generation",
        fallbackPrice: "$99/mo",
        icon: Star,
        desc: "Automated review requests via SMS and email",
      },
      {
        name: "Site Audit",
        backendName: "Site Audit",
        fallbackPrice: "$99 one-time",
        icon: Search,
        desc: "Full technical and UX audit with actionable report. 48hr turnaround.",
      },
    ],
  },
  {
    label: "⚙️ OPERATIONS",
    categoryKey: "operations",
    items: [
      {
        name: "Restaurant Menu Refresh",
        backendName: "Restaurant Menu Refresh",
        fallbackPrice: "$149/mo",
        icon: UtensilsCrossed,
        desc: "Monthly menu updates, seasonal specials, and PDF exports",
      },
      {
        name: "IDX/MLS Integration",
        backendName: "IDX/MLS Integration",
        fallbackPrice: "$299+",
        icon: Home,
        desc: "Live property listings embedded directly in your site",
      },
      {
        name: "Bulk Data Extraction",
        backendName: "Bulk Data Extraction",
        fallbackPrice: "$499",
        icon: Database,
        desc: "One-time bulk import of products, listings, or records",
      },
      {
        name: "Custom Page Expansion",
        backendName: "Custom Page Expansion",
        fallbackPrice: "$149/pg",
        icon: FilePlus,
        desc: "Add new pages to your existing site — designed and launched",
      },
    ],
  },
  {
    label: "💰 MONETIZATION",
    categoryKey: "monetization",
    items: [
      {
        name: "PWA Upgrade",
        backendName: "PWA Upgrade",
        fallbackPrice: "$299",
        icon: Smartphone,
        desc: "Turn your site into an installable Progressive Web App",
      },
      {
        name: "Annual Site Refresh",
        backendName: "Annual Site Refresh",
        fallbackPrice: "$499/yr",
        icon: RefreshCw,
        desc: "Full redesign of your homepage and top 3 pages once a year",
      },
    ],
  },
];

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};

const cardHoverEnter = (el: HTMLElement) => {
  el.style.transform = "translateY(-6px)";
  el.style.background = "rgba(57,255,20,0.04)";
  el.style.boxShadow =
    "0 8px 32px rgba(57,255,20,0.15), inset 0 1px 0 rgba(255,255,255,0.07)";
  el.style.borderColor = "rgba(57,255,20,0.3)";
};

const cardHoverLeave = (el: HTMLElement) => {
  el.style.transform = "translateY(0)";
  el.style.background = "rgba(255,255,255,0.03)";
  el.style.boxShadow =
    "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)";
  el.style.borderColor = "rgba(255,255,255,0.08)";
};

function GetStartedButton({
  productName,
  displayPrice = "",
  textKey,
  featured = false,
}: {
  productName: string;
  displayPrice?: string;
  textKey?: string;
  featured?: boolean;
}) {
  const { addItem, openDrawer } = useCartStore();
  const btnBg = featured ? "#39FF14" : "transparent";
  const btnColor = featured ? "#000" : "#39FF14";
  const btnBorder = featured ? "none" : "1px solid #39FF14";
  const btnGlow = featured
    ? "0 0 20px rgba(94,240,138,0.45)"
    : "0 0 12px rgba(94,240,138,0.2)";
  return (
    <motion.button
      type="button"
      onClick={() => {
        addItem({ name: productName, price: displayPrice });
        openDrawer();
      }}
      whileHover={{ boxShadow: btnGlow }}
      style={{
        display: "block",
        width: "100%",
        background: btnBg,
        color: btnColor,
        fontWeight: "700",
        fontSize: "0.95rem",
        textAlign: "center",
        padding: "12px 24px",
        borderRadius: "8px",
        border: btnBorder,
        cursor: "pointer",
        marginTop: "auto",
        transition: "opacity 0.2s",
      }}
    >
      <EditableText
        textKey={textKey ?? "products.btn_get_started"}
        defaultText="Get Started"
      />
    </motion.button>
  );
}

function ActivateButton({
  productName = "Growth Hub Add-On",
  displayPrice = "$99",
  textKey,
}: { productName?: string; displayPrice?: string; textKey?: string }) {
  const { addItem, openDrawer } = useCartStore();
  return (
    <motion.button
      type="button"
      onClick={() => {
        addItem({ name: productName, price: displayPrice });
        openDrawer();
      }}
      whileHover={{ boxShadow: "0 0 12px rgba(94,240,138,0.2)" }}
      style={{
        display: "block",
        width: "100%",
        background: "transparent",
        color: "#39FF14",
        fontWeight: "700",
        fontSize: "0.95rem",
        textAlign: "center",
        padding: "12px 24px",
        borderRadius: "8px",
        border: "1px solid #39FF14",
        cursor: "pointer",
        marginTop: "auto",
        transition: "opacity 0.2s",
      }}
    >
      <EditableText
        textKey={textKey ?? "products.btn_activate"}
        defaultText="Activate"
      />
    </motion.button>
  );
}

const TAB_ROUTES: Record<Tab, string> = {
  "Custom Sites": "/services/custom-sites",
  "Speedy Sites": "/services/speedy-sites",
  "SaaS Plans": "/services/saas-plans",
  "Cinematic Ads": "/services/cinematic-ads",
  "Product Ads": "/services/product-ads",
  "AI Receptionist": "/services/ai-receptionist",
  "Growth Hub": "/services/growth-hub",
};

const TAB_SHOWCASE_ROUTES: Record<Tab, string> = {
  "Custom Sites": "/showcase/custom-sites",
  "Speedy Sites": "/showcase/speedy-sites",
  "SaaS Plans": "/showcase/saas-plans",
  "Cinematic Ads": "/showcase/cinematic-ads",
  "Product Ads": "/showcase/product-ads",
  "AI Receptionist": "/showcase/ai-receptionist",
  "Growth Hub": "/showcase/growth-hub",
};

// Map tab names to stable CMS keys
const TAB_TEXT_KEYS: Record<Tab, string> = {
  "Custom Sites": "products.tab_custom_sites",
  "Speedy Sites": "products.tab_speedy_sites",
  "SaaS Plans": "products.tab_saas_plans",
  "Cinematic Ads": "products.tab_cinematic_ads",
  "Product Ads": "products.tab_product_ads",
  "AI Receptionist": "products.tab_ai_receptionist",
  "Growth Hub": "products.tab_growth_hub",
};

// Product Lab tiers — backend names as seeded (title case)
const PRODUCT_LAB_TIERS = [
  {
    id: "flash",
    backendName: "Flash",
    badge: "One-Time",
    priceNote: "one-time",
    delivery: "1x 15s Ultra-HD Video",
    turnaround: "48hr Turnaround",
    vault: false,
    featured: false,
    buttonLabel: "Get Started",
    buttonLabelKey: "products.product_ads_cta_flash",
  },
  {
    id: "starter",
    backendName: "Starter",
    badge: "Monthly",
    priceNote: "/mo",
    delivery: "3x 15s Hooks",
    turnaround: "24hr Turnaround",
    vault: false,
    featured: false,
    buttonLabel: "Get Started",
    buttonLabelKey: "products.product_ads_cta_starter",
  },
  {
    id: "scale",
    backendName: "Scale",
    badge: "Most Popular",
    priceNote: "/mo",
    delivery: "5x 15s Hooks",
    turnaround: "12-24hr Turnaround",
    vault: true,
    featured: true,
    buttonLabel: "Get Started",
    buttonLabelKey: "products.product_ads_cta_scale",
  },
];

function LearnMoreButton({ tab }: { tab: Tab }) {
  const navigate = useNavigate();
  return (
    <div style={{ marginBottom: "24px" }}>
      <motion.button
        type="button"
        onClick={() => navigate({ to: TAB_ROUTES[tab] })}
        whileHover={{ boxShadow: "0 0 16px rgba(94,240,138,0.35)" }}
        style={{
          background: "transparent",
          border: "1px solid #5EF08A",
          color: "#5EF08A",
          padding: "10px 24px",
          borderRadius: "10px",
          fontSize: "0.9rem",
          fontWeight: "600",
          cursor: "pointer",
          transition: "opacity 0.15s",
        }}
        data-ocid="products.learn_more_button"
      >
        <EditableText
          textKey={`products.learn_more_${TAB_TEXT_KEYS[tab].split(".")[1]}`}
          defaultText={`Learn More about ${tab}`}
        />
      </motion.button>
    </div>
  );
}

function ShowcaseButton({ tab }: { tab: Tab }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        marginBottom: "32px",
        paddingBottom: "32px",
        borderBottom: "1px solid #1C1F33",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <motion.button
        type="button"
        onClick={() => navigate({ to: TAB_SHOWCASE_ROUTES[tab] })}
        whileHover={{ boxShadow: "0 0 20px rgba(94,240,138,0.4)" }}
        style={{
          background: "transparent",
          border: "1px solid #5EF08A",
          color: "#5EF08A",
          padding: "12px 32px",
          borderRadius: "10px",
          fontSize: "0.95rem",
          fontWeight: "600",
          cursor: "pointer",
          transition: "opacity 0.15s",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
        data-ocid={`products.showcase_button.${TAB_TEXT_KEYS[tab].split(".")[1]}`}
      >
        <EditableText
          textKey={`products.showcase_btn_${TAB_TEXT_KEYS[tab].split(".")[1]}`}
          defaultText="View Imperidome in action"
        />
      </motion.button>
    </div>
  );
}

export default function ProductsPage() {
  useSeoMeta("products", "Services — Imperidome");
  const [activeTab, setActiveTab] = useState<Tab>("Custom Sites");
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);
  const [adSeconds, setAdSeconds] = useState(15);
  const [speedyBilling, setSpeedyBilling] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [rushStep, setRushStep] = useState(0);
  const navigate = useNavigate();

  const { addItem, openDrawer } = useCartStore();

  // Fetch ALL active products from the backend once on mount.
  // Used for (1) active/inactive visibility, (2) live price display.
  const { actor, isFetching } = useActor();
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [activeCategoryNames, setActiveCategoryNames] = useState<Set<string>>(
    new Set(),
  );
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  // Map from category name (tab label) → visible boolean. Absent = visible (fail open).
  const [categoryVisibility, setCategoryVisibility] = useState<
    Map<string, boolean>
  >(new Map());

  useEffect(() => {
    if (!actor || isFetching) return;
    Promise.all([
      (actor as unknown as { getProducts: () => Promise<Product[]> })
        .getProducts()
        .catch(() => [] as Product[]),
      actor.getCategoryVisibility().catch(() => [] as [string, boolean][]),
    ])
      .then(([result, visibility]) => {
        setBackendProducts(result);
        setActiveCategoryNames(
          new Set(result.map((p: Product) => p.product_type)),
        );
        setCategoryVisibility(new Map(visibility));
        setCatalogLoaded(true);
      })
      .catch(() => {
        setCatalogLoaded(true);
      });
  }, [actor, isFetching]);

  /** Find a product by exact backend name (case-insensitive) */
  const findProduct = (name: string): Product | undefined =>
    backendProducts.find((p) => p.name.toLowerCase() === name.toLowerCase());

  /** Extract numeric price from a Product record */
  const getProductNumericPrice = (p: Product): number => {
    if (p.price_monthly != null) return p.price_monthly;
    if (p.price_onetime != null) return p.price_onetime;
    if (p.price_annual != null) return p.price_annual;
    return 0;
  };

  /**
   * Returns formatted price for display.
   * Custom Sites & Speedy Sites → "From $<n>"
   * SaaS/AI Receptionist → "$<n>/mo"
   * Everything else → "$<n>"
   * While loading → "..."
   */
  const getDisplayPrice = (
    backendName: string,
    type: "from" | "monthly" | "onetime" | "auto" = "auto",
  ): string => {
    if (!catalogLoaded) return "...";
    const p = findProduct(backendName);
    if (!p) return "—";
    const val = getProductNumericPrice(p);
    if (type === "from") return `From $${val.toLocaleString()}`;
    if (type === "monthly") return `$${val.toLocaleString()}/mo`;
    if (type === "onetime") return `$${val.toLocaleString()} one-time`;
    // auto: use the product's own price field type
    if (p.price_monthly != null) return `$${val.toLocaleString()}/mo`;
    return `$${val.toLocaleString()}`;
  };

  // Returns true if a product name is active (or catalog hasn't loaded — fail open)
  const isProductActive = (name: string) =>
    !catalogLoaded ||
    backendProducts.length === 0 ||
    backendProducts.some((p) => p.name.toLowerCase() === name.toLowerCase());

  // Returns true if a tab/category should be shown (fail open until catalog loads)
  // Also checks admin-controlled visibility flag: if explicitly set to false, hide.
  const isTabVisible = (tab: Tab) => {
    // Check admin visibility flag first — if explicitly false, hide regardless
    if (categoryVisibility.has(tab) && categoryVisibility.get(tab) === false) {
      return false;
    }
    return (
      !catalogLoaded ||
      activeCategoryNames.size === 0 ||
      activeCategoryNames.has(tab)
    );
  };

  // Derive visible tabs; ensure activeTab is always set to a visible one
  const visibleTabs = TABS.filter(isTabVisible);

  useEffect(() => {
    if (
      catalogLoaded &&
      visibleTabs.length > 0 &&
      !visibleTabs.includes(activeTab)
    ) {
      setActiveTab(visibleTabs[0]);
    }
  }, [catalogLoaded, visibleTabs, activeTab]);

  const selectedRush = RUSH_STEPS[rushStep];
  // Active fill % for the slider track
  const rushFillPct = (rushStep / (RUSH_STEPS.length - 1)) * 100;

  return (
    <div style={{ background: "#0A0B14", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ height: "68px" }} aria-hidden="true" />
      <main
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 24px" }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              color: "#EEF0F8",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "800",
              letterSpacing: "-0.02em",
              lineHeight: "1.15",
              marginBottom: "12px",
            }}
          >
            <EditableText
              textKey="products.hero_heading"
              defaultText="Services &amp; Pricing"
            />
          </h1>
          <p
            style={{
              color: "#7A7D90",
              fontSize: "1.125rem",
              maxWidth: "560px",
            }}
          >
            <EditableText
              textKey="products.hero_subheading"
              defaultText="Everything your business needs to grow online — from websites to AI-powered tools, under one roof."
            />
          </p>
        </div>

        {/* Tab pills */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "nowrap",
            overflowX: "auto",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            marginBottom: "40px",
            paddingBottom: "4px",
          }}
          data-ocid="products.tab"
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab;
            const isHovered = hoveredTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                onMouseEnter={() => setHoveredTab(tab)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  padding: "10px 20px",
                  minHeight: "44px",
                  borderRadius: "9999px",
                  border: isActive ? "none" : "1px solid #1C1F33",
                  background: isActive ? "#5EF08A" : "transparent",
                  color: isActive
                    ? "#0A0B14"
                    : isHovered
                      ? "#EEF0F8"
                      : "rgba(156,163,175,0.4)",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition:
                    "color 0.15s, background 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                <EditableText textKey={TAB_TEXT_KEYS[tab]} defaultText={tab} />
              </button>
            );
          })}
        </div>

        {/* Tab content with crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── CUSTOM SITES ── */}
            {activeTab === "Custom Sites" && (
              <div>
                {/* Thumb styles injected once per render */}
                <style>{`
                  input[type=range].rush-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 6px;
                    border-radius: 9999px;
                    outline: none;
                    cursor: pointer;
                  }
                  input[type=range].rush-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #5EF08A;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(94,240,138,0.7), 0 0 0 3px rgba(94,240,138,0.15);
                    transition: box-shadow 0.15s;
                  }
                  input[type=range].rush-slider::-webkit-slider-thumb:hover {
                    box-shadow: 0 0 18px rgba(94,240,138,0.9), 0 0 0 5px rgba(94,240,138,0.2);
                  }
                  input[type=range].rush-slider::-moz-range-thumb {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #5EF08A;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 0 10px rgba(94,240,138,0.7);
                  }
                `}</style>

                <ShowcaseButton tab={activeTab} />
                <LearnMoreButton tab={activeTab} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {CUSTOM_SITES_TIERS.filter((tier) =>
                    isProductActive(tier.backendName),
                  ).map((tier) => {
                    const tierSlug = tier.backendName
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    return (
                      <div
                        key={tier.backendName}
                        style={cardStyle}
                        onMouseEnter={(e) => cardHoverEnter(e.currentTarget)}
                        onMouseLeave={(e) => cardHoverLeave(e.currentTarget)}
                      >
                        {" "}
                        <div>
                          <h3
                            style={{
                              color: "#EEF0F8",
                              fontSize: "1.2rem",
                              fontWeight: "700",
                              marginBottom: "8px",
                            }}
                          >
                            <EditableText
                              textKey={`products.custom_sites_name_${tierSlug}`}
                              defaultText={tier.displayName}
                            />
                          </h3>
                          <p
                            style={{
                              color: "#5EF08A",
                              fontSize: "1.35rem",
                              fontWeight: "700",
                              marginBottom: "16px",
                            }}
                          >
                            <EditableText
                              textKey={`products.custom_sites_price_${tierSlug}`}
                              defaultText={getDisplayPrice(
                                tier.backendName,
                                "from",
                              )}
                            />
                          </p>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {tier.features.map((f, fi) => (
                              <li
                                key={f}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  color: "#7A7D90",
                                  fontSize: "0.875rem",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#5EF08A",
                                    marginTop: "1px",
                                    flexShrink: 0,
                                  }}
                                >
                                  ✓
                                </span>
                                <EditableText
                                  textKey={`products.custom_sites_feature_${tierSlug}_${fi}`}
                                  defaultText={f}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ flex: 1 }} />
                        <GetStartedButton
                          productName={tier.backendName}
                          displayPrice={getDisplayPrice(
                            tier.backendName,
                            "from",
                          )}
                          textKey={`products.custom_sites_cta_${tier.backendName.toLowerCase().replace(/\s+/g, "_")}`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* ── RUSH DELIVERY SECTION ── */}
                <div style={{ marginTop: "64px" }}>
                  {/* Divider */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      marginBottom: "40px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background:
                          "linear-gradient(to right, transparent, #1C1F33)",
                      }}
                    />
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#5EF08A",
                        flexShrink: 0,
                        boxShadow: "0 0 12px rgba(94,240,138,0.6)",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background:
                          "linear-gradient(to left, transparent, #1C1F33)",
                      }}
                    />
                  </div>

                  {/* Heading */}
                  <div style={{ textAlign: "center", marginBottom: "48px" }}>
                    <h2
                      style={{
                        color: "#EEF0F8",
                        fontSize: "clamp(1.5rem, 3vw, 1.9rem)",
                        fontWeight: "800",
                        letterSpacing: "-0.01em",
                        marginBottom: "12px",
                      }}
                    >
                      <EditableText
                        textKey="products.rush_heading"
                        defaultText="Need It Faster?"
                      />
                    </h2>
                    <p
                      style={{
                        color: "#7A7D90",
                        fontSize: "1rem",
                        maxWidth: "480px",
                        margin: "0 auto",
                        lineHeight: "1.6",
                      }}
                    >
                      <EditableText
                        textKey="products.rush_subheading"
                        defaultText="Accelerate your Custom Tier build. Rush fee added to your build fee at checkout."
                      />
                    </p>
                  </div>

                  {/* Slider */}
                  <div
                    style={{
                      maxWidth: "600px",
                      margin: "0 auto 40px",
                    }}
                    data-ocid="rush_delivery.panel"
                  >
                    <input
                      type="range"
                      className="rush-slider"
                      min={0}
                      max={4}
                      step={1}
                      value={rushStep}
                      onChange={(e) => setRushStep(Number(e.target.value))}
                      data-ocid="rush_delivery.input"
                      style={{
                        background: `linear-gradient(to right, #5EF08A ${rushFillPct}%, #1C1F33 ${rushFillPct}%)`,
                      }}
                    />
                    {/* Step labels */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "12px",
                      }}
                    >
                      {RUSH_STEPS.map((s, i) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setRushStep(i)}
                          style={{
                            color: rushStep === i ? "#5EF08A" : "#7A7D90",
                            fontSize: "0.72rem",
                            fontWeight: rushStep === i ? "700" : "400",
                            textAlign: "center",
                            flex: 1,
                            transition: "color 0.15s",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            padding: 0,
                          }}
                        >
                          <EditableText
                            textKey={`products.rush_step_${i}_label`}
                            defaultText={s.label}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic display card */}
                  <div
                    style={{
                      maxWidth: "480px",
                      margin: "0 auto 16px",
                    }}
                  >
                    <div
                      style={{
                        ...cardStyle,
                        textAlign: "center",
                        gap: "10px",
                        border: selectedRush.isEmergency
                          ? "1px solid rgba(251,191,36,0.35)"
                          : "1px solid rgba(255,255,255,0.08)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      data-ocid="rush_delivery.card"
                    >
                      <p
                        style={{
                          color: "#EEF0F8",
                          fontSize: "1.3rem",
                          fontWeight: "700",
                          marginBottom: "2px",
                        }}
                      >
                        <EditableText
                          textKey={`products.rush_step_${rushStep}_label`}
                          defaultText={selectedRush.label}
                        />
                      </p>
                      <p
                        style={{
                          color: "#7A7D90",
                          fontSize: "0.95rem",
                        }}
                      >
                        <EditableText
                          textKey={`products.rush_step_${rushStep}_days`}
                          defaultText={selectedRush.days}
                        />
                      </p>
                      <p
                        style={{
                          color: "#5EF08A",
                          fontSize: "2rem",
                          fontWeight: "800",
                          lineHeight: "1.1",
                          marginTop: "4px",
                        }}
                      >
                        <EditableText
                          textKey={`products.rush_step_${rushStep}_fee`}
                          defaultText={selectedRush.fee}
                        />
                        {selectedRush.feeNote && (
                          <span
                            style={{
                              fontSize: "0.9rem",
                              fontWeight: "500",
                              color: "#7A7D90",
                              marginLeft: "8px",
                            }}
                          >
                            ({selectedRush.feeNote})
                          </span>
                        )}
                      </p>

                      {/* Emergency warning */}
                      {selectedRush.isEmergency && (
                        <div
                          style={{
                            background: "rgba(251,191,36,0.1)",
                            border: "1px solid rgba(251,191,36,0.3)",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            marginTop: "8px",
                            color: "#FBB224",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                          }}
                          data-ocid="rush_delivery.error_state"
                        >
                          <EditableText
                            textKey="products.rush_emergency_note"
                            defaultText="⚡ Requires signed work order by 9:00 AM EST"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer note */}
                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: "0.8rem",
                      textAlign: "center",
                      maxWidth: "480px",
                      margin: "0 auto",
                      lineHeight: "1.5",
                    }}
                  >
                    <EditableText
                      textKey="products.rush_footer_note"
                      defaultText="Rush fees are in addition to your Build Fee. Standard Terms &amp; Conditions apply."
                    />
                  </p>
                </div>
                {/* ── END RUSH DELIVERY ── */}
              </div>
            )}

            {/* ── SPEEDY SITES ── */}
            {activeTab === "Speedy Sites" && (
              <div>
                <ShowcaseButton tab={activeTab} />
                <LearnMoreButton tab={activeTab} />
                {/* Speedy Sites Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {SPEEDY_SITES.filter((item) =>
                    isProductActive(item.backendName),
                  ).map((item) => {
                    const itemSlug = item.backendName
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    return (
                      <div
                        key={item.backendName}
                        style={cardStyle}
                        onMouseEnter={(e) => cardHoverEnter(e.currentTarget)}
                        onMouseLeave={(e) => cardHoverLeave(e.currentTarget)}
                      >
                        <div>
                          <h3
                            style={{
                              color: "#EEF0F8",
                              fontSize: "1.2rem",
                              fontWeight: "700",
                              marginBottom: "8px",
                            }}
                          >
                            <EditableText
                              textKey={`products.speedy_sites_name_${itemSlug}`}
                              defaultText={item.displayName}
                            />
                          </h3>
                          <p
                            style={{
                              color: "#5EF08A",
                              fontSize: "1.35rem",
                              fontWeight: "700",
                              marginBottom: "16px",
                            }}
                          >
                            <EditableText
                              textKey={`products.speedy_sites_price_${itemSlug}`}
                              defaultText={getDisplayPrice(
                                item.backendName,
                                "from",
                              )}
                            />
                          </p>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {item.features.map((f, fi) => (
                              <li
                                key={f}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  color:
                                    f === "Fully Managed Infrastructure"
                                      ? "#5EF08A"
                                      : "#7A7D90",
                                  fontSize: "0.875rem",
                                  fontWeight:
                                    f === "Fully Managed Infrastructure"
                                      ? "600"
                                      : "400",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#5EF08A",
                                    marginTop: "1px",
                                    flexShrink: 0,
                                  }}
                                >
                                  ✓
                                </span>
                                <EditableText
                                  textKey={`products.speedy_sites_feature_${itemSlug}_${fi}`}
                                  defaultText={f}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ flex: 1 }} />
                        <GetStartedButton
                          productName={item.backendName}
                          displayPrice={getDisplayPrice(
                            item.backendName,
                            "from",
                          )}
                          textKey={`products.speedy_sites_cta_${item.backendName.toLowerCase().replace(/\s+/g, "_")}`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* ── SPEEDY HOSTING PLANS DIVIDER ── */}
                <div style={{ marginTop: "64px", marginBottom: "48px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background:
                          "linear-gradient(to right, transparent, #1C1F33)",
                      }}
                    />
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#5EF08A",
                        flexShrink: 0,
                        boxShadow: "0 0 12px rgba(94,240,138,0.6)",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background:
                          "linear-gradient(to left, transparent, #1C1F33)",
                      }}
                    />
                  </div>
                  <h2
                    style={{
                      color: "#EEF0F8",
                      fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
                      fontWeight: "800",
                      letterSpacing: "-0.01em",
                      textAlign: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <EditableText
                      textKey="products.speedy_plans_heading"
                      defaultText="Speedy Hosting Plans — Keep Your Site Live"
                    />
                  </h2>
                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: "1rem",
                      textAlign: "center",
                      maxWidth: "480px",
                      margin: "0 auto",
                    }}
                  >
                    <EditableText
                      textKey="products.speedy_plans_subheading"
                      defaultText="Every Speedy Site requires a monthly hosting plan. Cancel anytime."
                    />
                  </p>
                </div>

                {/* Billing Toggle */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "36px",
                  }}
                  data-ocid="speedy_plans.toggle"
                >
                  <div
                    style={{
                      display: "inline-flex",
                      background: "rgba(17,19,34,0.7)",
                      border: "1px solid #1C1F33",
                      borderRadius: "9999px",
                      padding: "4px",
                      gap: "4px",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                    }}
                  >
                    {(["monthly", "annual"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSpeedyBilling(option)}
                        style={{
                          padding: "8px 24px",
                          borderRadius: "9999px",
                          border: "none",
                          background:
                            speedyBilling === option
                              ? "#5EF08A"
                              : "transparent",
                          color:
                            speedyBilling === option ? "#0A0B14" : "#7A7D90",
                          fontWeight: speedyBilling === option ? "700" : "500",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <EditableText
                          textKey={
                            option === "monthly"
                              ? "products.speedy_billing_monthly"
                              : "products.speedy_billing_annual"
                          }
                          defaultText={
                            option === "monthly" ? "Monthly" : "Annual"
                          }
                        />
                        {option === "annual" && (
                          <span
                            style={{
                              background:
                                speedyBilling === "annual"
                                  ? "rgba(10,11,20,0.2)"
                                  : "rgba(94,240,138,0.12)",
                              color:
                                speedyBilling === "annual"
                                  ? "#0A0B14"
                                  : "#5EF08A",
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              padding: "2px 7px",
                              borderRadius: "9999px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <EditableText
                              textKey="products.speedy_billing_annual_badge"
                              defaultText="2 Months Free"
                            />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plan Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {SPEEDY_PLANS.filter((plan) =>
                    isProductActive(plan.backendName),
                  ).map((plan) => {
                    // Use live backend price; annual gets an approximate discount display
                    const monthlyPrice = getDisplayPrice(
                      plan.backendName,
                      "monthly",
                    );
                    const numVal = (() => {
                      const p = findProduct(plan.backendName);
                      return p ? getProductNumericPrice(p) : 0;
                    })();
                    const annualVal = Math.round(numVal * 10);
                    const price =
                      speedyBilling === "monthly"
                        ? monthlyPrice
                        : `$${annualVal.toLocaleString()}/yr`;
                    const planSlug = plan.backendName
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    return (
                      <div
                        key={plan.backendName}
                        style={cardStyle}
                        onMouseEnter={(e) => cardHoverEnter(e.currentTarget)}
                        onMouseLeave={(e) => cardHoverLeave(e.currentTarget)}
                        data-ocid={`speedy_plans.${plan.backendName.toLowerCase().replace(/\s+/g, "_")}.card`}
                      >
                        <div>
                          <h3
                            style={{
                              color: "#EEF0F8",
                              fontSize: "1.2rem",
                              fontWeight: "700",
                              marginBottom: "4px",
                            }}
                          >
                            <EditableText
                              textKey={`products.speedy_plan_name_${planSlug}`}
                              defaultText={plan.displayName}
                            />
                          </h3>
                          <p
                            style={{
                              color: "#5EF08A",
                              fontSize: "1.5rem",
                              fontWeight: "800",
                              marginBottom: "4px",
                              lineHeight: "1.2",
                            }}
                          >
                            <EditableText
                              textKey={`products.speedy_plan_price_${planSlug}`}
                              defaultText={price}
                            />
                          </p>
                          <p
                            style={{
                              color: "#7A7D90",
                              fontSize: "0.78rem",
                              marginBottom: "16px",
                            }}
                          >
                            <EditableText
                              textKey={`products.speedy_plan_powers_${plan.backendName.toLowerCase().replace(/\s+/g, "_")}`}
                              defaultText={`Powers: ${plan.powers}`}
                            />
                          </p>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {plan.features.map((f, fi) => (
                              <li
                                key={f}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  color: "#7A7D90",
                                  fontSize: "0.875rem",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#5EF08A",
                                    marginTop: "1px",
                                    flexShrink: 0,
                                  }}
                                >
                                  ✓
                                </span>
                                <EditableText
                                  textKey={`products.speedy_plan_feature_${planSlug}_${fi}`}
                                  defaultText={f}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ flex: 1 }} />
                        <motion.button
                          type="button"
                          onClick={() => {
                            addItem({
                              name: plan.backendName,
                              price: monthlyPrice,
                            });
                            openDrawer();
                          }}
                          whileHover={{
                            boxShadow: "0 0 12px rgba(94,240,138,0.2)",
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            background: "transparent",
                            color: "#39FF14",
                            fontWeight: "700",
                            fontSize: "0.95rem",
                            textAlign: "center",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            border: "1px solid #39FF14",
                            cursor: "pointer",
                            marginTop: "auto",
                            transition: "opacity 0.2s",
                          }}
                          data-ocid="speedy_plans.subscribe_button"
                        >
                          <EditableText
                            textKey={`products.speedy_plan_subscribe_${plan.backendName.toLowerCase().replace(/\s+/g, "_")}`}
                            defaultText="Subscribe"
                          />
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SAAS PLANS ── */}
            {activeTab === "SaaS Plans" && (
              <div>
                <ShowcaseButton tab={activeTab} />
                <LearnMoreButton tab={activeTab} />
                <h2
                  style={{
                    color: "#EEF0F8",
                    fontSize: "1.3rem",
                    fontWeight: "700",
                    marginBottom: "16px",
                  }}
                >
                  <EditableText
                    textKey="products.saas_section_heading"
                    defaultText="Maintenance Plans"
                  />
                </h2>
                <div
                  style={{
                    ...cardStyle,
                    padding: "0",
                    overflow: "hidden",
                    marginBottom: "40px",
                    overflowX: "auto",
                    transition: "none",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "480px",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "rgba(94,240,138,0.06)" }}>
                        {[
                          { label: "Plan", key: "products.saas_col_plan" },
                          { label: "Price", key: "products.saas_col_price" },
                          {
                            label: "Billing",
                            key: "products.saas_col_billing",
                          },
                          { label: "", key: "" },
                        ].map(({ label, key }) => (
                          <th
                            key={label}
                            style={{
                              color: "#7A7D90",
                              textTransform: "uppercase",
                              fontSize: "0.72rem",
                              fontWeight: "600",
                              letterSpacing: "0.08em",
                              padding: "14px 20px",
                              textAlign: "left",
                            }}
                          >
                            {key ? (
                              <EditableText textKey={key} defaultText={label} />
                            ) : (
                              label
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MAINTENANCE_PLANS.filter((plan) =>
                        isProductActive(plan.backendName),
                      ).map((plan) => {
                        const livePrice = getDisplayPrice(
                          plan.backendName,
                          "monthly",
                        );
                        return (
                          <tr
                            key={plan.backendName}
                            style={{ borderBottom: "1px solid #1C1F33" }}
                          >
                            <td
                              style={{
                                color: "#EEF0F8",
                                padding: "16px 20px",
                                fontWeight: "600",
                              }}
                            >
                              {plan.backendName}
                            </td>
                            <td
                              style={{
                                color: "#5EF08A",
                                padding: "16px 20px",
                                fontWeight: "700",
                                fontSize: "1.05rem",
                              }}
                            >
                              {livePrice}
                            </td>
                            <td
                              style={{ color: "#7A7D90", padding: "16px 20px" }}
                            >
                              <EditableText
                                textKey="products.saas_billing_cycle"
                                defaultText="Monthly"
                              />
                            </td>
                            <td style={{ padding: "16px 20px" }}>
                              <motion.button
                                type="button"
                                onClick={() => {
                                  addItem({
                                    name: plan.backendName,
                                    price: livePrice,
                                  });
                                  openDrawer();
                                }}
                                whileHover={{
                                  boxShadow: "0 0 12px rgba(94,240,138,0.2)",
                                }}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  background: "transparent",
                                  color: "#39FF14",
                                  fontWeight: "700",
                                  fontSize: "0.95rem",
                                  textAlign: "center",
                                  padding: "12px 24px",
                                  borderRadius: "8px",
                                  border: "1px solid #39FF14",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  transition: "opacity 0.2s",
                                }}
                              >
                                <EditableText
                                  textKey={`products.saas_cta_${plan.backendName.toLowerCase().replace(/\s+/g, "_")}`}
                                  defaultText="Get Started"
                                />
                              </motion.button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── CINEMATIC ADS ── */}
            {activeTab === "Cinematic Ads" && (
              <div>
                <ShowcaseButton tab={activeTab} />
                <LearnMoreButton tab={activeTab} />
                <div
                  style={{
                    ...cardStyle,
                    marginBottom: "32px",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => cardHoverEnter(e.currentTarget)}
                  onMouseLeave={(e) => cardHoverLeave(e.currentTarget)}
                >
                  <h2
                    style={{
                      color: "#EEF0F8",
                      fontSize: "1.75rem",
                      fontWeight: "700",
                      marginBottom: "8px",
                    }}
                  >
                    <EditableText
                      textKey="products.cinematic_ads_heading"
                      defaultText="Cinematic Ad Pricing"
                    />
                  </h2>
                  <p style={{ color: "#7A7D90", marginBottom: "32px" }}>
                    <EditableText
                      textKey="products.cinematic_ads_subheading"
                      defaultText="Pay only for the seconds you need."
                    />
                  </p>

                  <div style={{ marginBottom: "24px" }}>
                    <p
                      style={{
                        color: "#EEF0F8",
                        fontSize: "2rem",
                        fontWeight: "700",
                        marginBottom: "4px",
                      }}
                    >
                      {adSeconds}
                      <EditableText
                        textKey="products.cinematic_ads_unit_suffix"
                        defaultText="s ad"
                      />
                    </p>
                    <p
                      style={{
                        color: "#5EF08A",
                        fontSize: "3rem",
                        fontWeight: "800",
                        lineHeight: "1",
                      }}
                    >
                      ${AD_PRICES[adSeconds]}
                    </p>
                  </div>

                  <div style={{ maxWidth: "480px", margin: "0 auto 16px" }}>
                    <input
                      type="range"
                      min={15}
                      max={60}
                      step={5}
                      value={adSeconds}
                      onChange={(e) => setAdSeconds(Number(e.target.value))}
                      style={{
                        width: "100%",
                        accentColor: "#5EF08A",
                        cursor: "pointer",
                        height: "6px",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#7A7D90",
                        fontSize: "0.8rem",
                        marginTop: "6px",
                      }}
                    >
                      <span>
                        <EditableText
                          textKey="products.cinematic_ads_range_min"
                          defaultText="15s"
                        />
                      </span>
                      <span>
                        <EditableText
                          textKey="products.cinematic_ads_range_max"
                          defaultText="60s"
                        />
                      </span>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => {
                      window.location.href = "/services/cinematic-ads";
                    }}
                    whileHover={{ boxShadow: "0 0 12px rgba(94,240,138,0.2)" }}
                    style={{
                      display: "block",
                      width: "100%",
                      background: "transparent",
                      color: "#39FF14",
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      textAlign: "center",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      border: "1px solid #39FF14",
                      cursor: "pointer",
                      marginTop: "auto",
                      transition: "opacity 0.2s",
                    }}
                  >
                    <EditableText
                      textKey="products.cinematic_ads_cta"
                      defaultText="Get Started"
                    />
                  </motion.button>
                </div>

                <h2
                  style={{
                    color: "#EEF0F8",
                    fontSize: "1.3rem",
                    fontWeight: "700",
                    marginBottom: "16px",
                  }}
                >
                  <EditableText
                    textKey="products.cinematic_retainers_heading"
                    defaultText="Quarterly Retainers"
                  />
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {AD_RETAINERS.filter((r) =>
                    isProductActive(r.backendName),
                  ).map((r) => {
                    const rSlug = r.backendName
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    return (
                      <div
                        key={r.backendName}
                        style={cardStyle}
                        onMouseEnter={(e) => cardHoverEnter(e.currentTarget)}
                        onMouseLeave={(e) => cardHoverLeave(e.currentTarget)}
                      >
                        <div>
                          <h3
                            style={{
                              color: "#EEF0F8",
                              fontSize: "1.2rem",
                              fontWeight: "700",
                              marginBottom: "4px",
                            }}
                          >
                            <EditableText
                              textKey={`products.cinematic_retainer_name_${rSlug}`}
                              defaultText={r.displayName}
                            />
                          </h3>
                          <p
                            style={{
                              color: "#7A7D90",
                              fontSize: "0.9rem",
                              marginBottom: "8px",
                            }}
                          >
                            <EditableText
                              textKey={`products.cinematic_retainer_qty_${rSlug}`}
                              defaultText={r.qty}
                            />
                          </p>
                          <p
                            style={{
                              color: "#5EF08A",
                              fontSize: "1.5rem",
                              fontWeight: "800",
                            }}
                          >
                            <EditableText
                              textKey={`products.cinematic_retainer_price_${rSlug}`}
                              defaultText={getDisplayPrice(
                                r.backendName,
                                "onetime",
                              )}
                            />
                          </p>
                          <p
                            style={{
                              color: "#7A7D90",
                              fontSize: "0.8rem",
                              marginTop: "2px",
                            }}
                          >
                            <EditableText
                              textKey={`products.cinematic_retainer_period_${r.backendName.toLowerCase().replace(/\s+/g, "_")}`}
                              defaultText="per quarter"
                            />
                          </p>
                        </div>
                        <div style={{ flex: 1 }} />
                        <motion.button
                          type="button"
                          onClick={() => {
                            window.location.href = "/services/cinematic-ads";
                          }}
                          whileHover={{
                            boxShadow: "0 0 12px rgba(94,240,138,0.2)",
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            background: "transparent",
                            color: "#39FF14",
                            fontWeight: "700",
                            fontSize: "0.95rem",
                            textAlign: "center",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            border: "1px solid #39FF14",
                            cursor: "pointer",
                            marginTop: "auto",
                            transition: "opacity 0.2s",
                          }}
                        >
                          <EditableText
                            textKey={`products.cinematic_retainer_cta_${r.backendName.toLowerCase().replace(/\s+/g, "_")}`}
                            defaultText="Get Started"
                          />
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PRODUCT ADS (PRODUCT LAB) ── */}
            {activeTab === "Product Ads" && (
              <div>
                <ShowcaseButton tab={activeTab} />
                <LearnMoreButton tab={activeTab} />
                {/* Hero Section */}
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "20px",
                    border: "1px solid rgba(94,240,138,0.2)",
                    background: "rgba(17,19,34,0.85)",
                    padding: "56px 40px 48px",
                    marginBottom: "48px",
                    textAlign: "center",
                  }}
                >
                  {/* Neon glow background blob */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: "-80px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "600px",
                      height: "300px",
                      background:
                        "radial-gradient(ellipse, rgba(94,240,138,0.12) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Tech badges */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      marginBottom: "28px",
                    }}
                  >
                    {[
                      {
                        text: "Seedance 2.0 Physics Engine",
                        key: "products.product_ads_badge_1",
                      },
                      {
                        text: "Proprietary Product Identity Lock",
                        key: "products.product_ads_badge_2",
                      },
                    ].map(({ text, key }) => (
                      <span
                        key={key}
                        style={{
                          background: "rgba(94,240,138,0.1)",
                          border: "1px solid rgba(94,240,138,0.3)",
                          color: "#5EF08A",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          padding: "5px 14px",
                          borderRadius: "9999px",
                        }}
                      >
                        <EditableText textKey={key} defaultText={text} />
                      </span>
                    ))}
                  </div>

                  <h2
                    style={{
                      color: "#EEF0F8",
                      fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                      fontWeight: "800",
                      letterSpacing: "-0.02em",
                      lineHeight: "1.15",
                      marginBottom: "20px",
                      maxWidth: "700px",
                      margin: "0 auto 20px",
                    }}
                  >
                    <EditableText
                      textKey="products.product_ads_hero_heading"
                      defaultText="Sensory Hooks."
                    />{" "}
                    <span style={{ color: "#5EF08A" }}>
                      <EditableText
                        textKey="products.product_ads_hero_accent"
                        defaultText="Surreal Physics."
                      />
                    </span>{" "}
                    <EditableText
                      textKey="products.product_ads_hero_suffix"
                      defaultText="90% Less Cost."
                    />
                  </h2>

                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: "1.05rem",
                      lineHeight: "1.7",
                      maxWidth: "580px",
                      margin: "0 auto 36px",
                    }}
                  >
                    <EditableText
                      textKey="products.product_ads_hero_description"
                      defaultText="AI-engineered product videos that stop the scroll. We lock in your product identity and simulate real-world physics — at a fraction of traditional production cost."
                    />
                  </p>

                  <motion.button
                    type="button"
                    onClick={() => navigate({ to: "/product-ads" })}
                    whileHover={{ boxShadow: "0 0 12px rgba(94,240,138,0.2)" }}
                    style={{
                      background: "transparent",
                      color: "#39FF14",
                      fontWeight: "700",
                      fontSize: "1rem",
                      padding: "12px 36px",
                      borderRadius: "8px",
                      border: "1px solid #39FF14",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                    data-ocid="product_lab.hero_cta"
                  >
                    <EditableText
                      textKey="products.product_ads_hero_cta"
                      defaultText="Get Started"
                    />
                  </motion.button>
                </div>

                {/* Pricing Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {PRODUCT_LAB_TIERS.filter((tier) =>
                    isProductActive(tier.backendName),
                  ).map((tier) => {
                    const livePrice = getDisplayPrice(tier.backendName, "auto");
                    return (
                      <div
                        key={tier.id}
                        style={{
                          ...cardStyle,
                          position: "relative",
                          border: tier.featured
                            ? "1px solid rgba(57,255,20,0.4)"
                            : "1px solid rgba(255,255,255,0.08)",
                          boxShadow: tier.featured
                            ? "0 4px 24px rgba(0,0,0,0.4), 0 0 30px rgba(57,255,20,0.12), inset 0 1px 0 rgba(255,255,255,0.05)"
                            : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                        }}
                        onMouseEnter={(e) => cardHoverEnter(e.currentTarget)}
                        onMouseLeave={(e) => cardHoverLeave(e.currentTarget)}
                        data-ocid={`product_lab.tier_${tier.id}`}
                      >
                        {/* Badge */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              background: tier.featured
                                ? "rgba(94,240,138,0.15)"
                                : "rgba(255,255,255,0.05)",
                              color: tier.featured ? "#5EF08A" : "#7A7D90",
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              border: tier.featured
                                ? "1px solid rgba(94,240,138,0.3)"
                                : "1px solid #1C1F33",
                            }}
                          >
                            <EditableText
                              textKey={`products.product_ads_badge_tier_${tier.id}`}
                              defaultText={tier.badge}
                            />
                          </span>
                        </div>

                        {/* Plan name + price */}
                        <div>
                          <h3
                            style={{
                              color: "#EEF0F8",
                              fontSize: "1.35rem",
                              fontWeight: "800",
                              marginBottom: "6px",
                            }}
                          >
                            <EditableText
                              textKey={`products.product_ads_tier_name_${tier.id}`}
                              defaultText={tier.backendName}
                            />
                          </h3>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: "4px",
                              marginBottom: "20px",
                            }}
                          >
                            <span
                              style={{
                                color: "#5EF08A",
                                fontSize: "2rem",
                                fontWeight: "800",
                                lineHeight: "1",
                              }}
                            >
                              <EditableText
                                textKey={`products.product_ads_tier_price_${tier.id}`}
                                defaultText={livePrice}
                              />
                            </span>
                          </div>

                          {/* Deliverables */}
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                            }}
                          >
                            <li
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                                color: "#EEF0F8",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                              }}
                            >
                              <span style={{ color: "#5EF08A", flexShrink: 0 }}>
                                ✓
                              </span>
                              <EditableText
                                textKey={`products.product_ads_delivery_${tier.id}`}
                                defaultText={tier.delivery}
                              />
                            </li>
                            <li
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                                color: "#7A7D90",
                                fontSize: "0.875rem",
                              }}
                            >
                              <span style={{ color: "#5EF08A", flexShrink: 0 }}>
                                ✓
                              </span>
                              <EditableText
                                textKey={`products.product_ads_turnaround_${tier.id}`}
                                defaultText={tier.turnaround}
                              />
                            </li>
                            {tier.vault && (
                              <li
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  color: "#5EF08A",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}
                              >
                                <span style={{ flexShrink: 0 }}>🔒</span>
                                <EditableText
                                  textKey="products.product_ads_vault_label"
                                  defaultText="Permanent Vault storage"
                                />
                              </li>
                            )}
                          </ul>
                        </div>

                        <div style={{ flex: 1 }} />

                        {/* CTA Button */}
                        <motion.button
                          type="button"
                          onClick={() => navigate({ to: "/product-ads" })}
                          whileHover={{
                            boxShadow: tier.featured
                              ? "0 0 20px rgba(94,240,138,0.45)"
                              : "0 0 12px rgba(94,240,138,0.2)",
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            background: tier.featured
                              ? "#39FF14"
                              : "transparent",
                            color: tier.featured ? "#000" : "#39FF14",
                            fontWeight: "700",
                            fontSize: "0.95rem",
                            textAlign: "center",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            border: tier.featured
                              ? "none"
                              : "1px solid #39FF14",
                            cursor: "pointer",
                            marginTop: "auto",
                            transition: "opacity 0.2s",
                          }}
                          data-ocid={`product_lab.cta_${tier.id}`}
                        >
                          <EditableText
                            textKey={tier.buttonLabelKey}
                            defaultText={tier.buttonLabel}
                          />
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── AI RECEPTIONIST ── */}
            {activeTab === "AI Receptionist" && (
              <div>
                <ShowcaseButton tab={activeTab} />
                <LearnMoreButton tab={activeTab} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {AI_TIERS.filter((tier) =>
                    isProductActive(tier.backendName),
                  ).map((tier) => {
                    const livePrice = getDisplayPrice(
                      tier.backendName,
                      "monthly",
                    );
                    const aiSlug = tier.backendName
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    return (
                      <div
                        key={tier.backendName}
                        style={cardStyle}
                        onMouseEnter={(e) => cardHoverEnter(e.currentTarget)}
                        onMouseLeave={(e) => cardHoverLeave(e.currentTarget)}
                      >
                        <div>
                          <h3
                            style={{
                              color: "#EEF0F8",
                              fontSize: "1.2rem",
                              fontWeight: "700",
                              marginBottom: "8px",
                            }}
                          >
                            <EditableText
                              textKey={`products.ai_receptionist_name_${aiSlug}`}
                              defaultText={tier.displayName}
                            />
                          </h3>
                          <p
                            style={{
                              color: "#5EF08A",
                              fontSize: "1.5rem",
                              fontWeight: "800",
                              marginBottom: tier.setup ? "4px" : "12px",
                            }}
                          >
                            <EditableText
                              textKey={`products.ai_receptionist_price_${aiSlug}`}
                              defaultText={livePrice}
                            />
                          </p>
                          {tier.setup && (
                            <p
                              style={{
                                color: "#7A7D90",
                                fontSize: "0.85rem",
                                marginBottom: "12px",
                              }}
                            >
                              <EditableText
                                textKey={`products.ai_receptionist_setup_${aiSlug}`}
                                defaultText={tier.setup}
                              />
                            </p>
                          )}
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {tier.features.map((f, fi) => (
                              <li
                                key={f}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  color: "#7A7D90",
                                  fontSize: "0.875rem",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#5EF08A",
                                    marginTop: "1px",
                                    flexShrink: 0,
                                  }}
                                >
                                  ✓
                                </span>
                                <EditableText
                                  textKey={`products.ai_receptionist_feature_${aiSlug}_${fi}`}
                                  defaultText={f}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ flex: 1 }} />
                        <motion.button
                          type="button"
                          onClick={() =>
                            navigate({ to: "/services/ai-receptionist" })
                          }
                          whileHover={{
                            boxShadow: "0 0 12px rgba(94,240,138,0.2)",
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            background: "transparent",
                            color: "#39FF14",
                            fontWeight: "700",
                            fontSize: "0.95rem",
                            textAlign: "center",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            border: "1px solid #39FF14",
                            cursor: "pointer",
                            marginTop: "auto",
                            transition: "opacity 0.2s",
                          }}
                        >
                          <EditableText
                            textKey={`products.ai_receptionist_cta_${tier.backendName.toLowerCase().replace(/\s+/g, "_")}`}
                            defaultText="Get Started"
                          />
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── GROWTH HUB ── */}
            {activeTab === "Growth Hub" && (
              <div>
                <ShowcaseButton tab={activeTab} />
                <LearnMoreButton tab={activeTab} />

                {/* Performance Snapshot */}
                <PerformanceSnapshot />

                {/* Categories */}
                {GROWTH_HUB_CATEGORIES.map((category) => (
                  <div
                    key={category.categoryKey}
                    style={{ marginBottom: "48px" }}
                  >
                    <h2
                      style={{
                        color: "#EEF0F8",
                        fontSize: "1.15rem",
                        fontWeight: "700",
                        marginBottom: "20px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      <EditableText
                        textKey={`products.growth_hub_category_${category.categoryKey}`}
                        defaultText={category.label}
                      />
                    </h2>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: "20px",
                      }}
                    >
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        // Resolve live price from backend; fall back to static while loading
                        const liveItemPrice =
                          getDisplayPrice(item.backendName, "auto") === "—"
                            ? item.fallbackPrice
                            : getDisplayPrice(item.backendName, "auto");
                        const resolvedDisplay = !catalogLoaded
                          ? "..."
                          : liveItemPrice;
                        const itemSlug = item.backendName
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "_");
                        return (
                          <div
                            key={item.name}
                            style={{
                              ...cardStyle,
                              gap: "12px",
                            }}
                            onMouseEnter={(e) =>
                              cardHoverEnter(e.currentTarget)
                            }
                            onMouseLeave={(e) =>
                              cardHoverLeave(e.currentTarget)
                            }
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "rgba(94,240,138,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Icon size={20} color="#5EF08A" />
                            </div>
                            <div>
                              <h3
                                style={{
                                  color: "#EEF0F8",
                                  fontSize: "1rem",
                                  fontWeight: "700",
                                  marginBottom: "4px",
                                }}
                              >
                                <EditableText
                                  textKey={`products.growth_hub_item_name_${itemSlug}`}
                                  defaultText={item.name}
                                />
                              </h3>
                              <p
                                style={{
                                  color: "#5EF08A",
                                  fontSize: "1.1rem",
                                  fontWeight: "700",
                                  marginBottom: "8px",
                                }}
                              >
                                {resolvedDisplay}
                              </p>
                              <p
                                style={{
                                  color: "#7A7D90",
                                  fontSize: "0.85rem",
                                  lineHeight: "1.5",
                                }}
                              >
                                <EditableText
                                  textKey={`products.growth_hub_item_desc_${itemSlug}`}
                                  defaultText={item.desc}
                                />
                              </p>
                            </div>
                            <div style={{ flex: 1 }} />
                            <ActivateButton
                              productName={item.backendName}
                              displayPrice={resolvedDisplay}
                              textKey={`products.growth_hub_item_cta_${itemSlug}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
