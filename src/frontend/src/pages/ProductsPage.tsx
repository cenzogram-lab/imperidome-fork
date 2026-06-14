import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createActor } from "../backend";
import type { Product, backendInterface } from "../backend.d.ts";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import PerformanceSnapshot from "../components/PerformanceSnapshot";
import TypewriterText from "../components/TypewriterText";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useCartStore } from "../store/useCartStore";

/** Maps product_type values to intake form service IDs */
const PRODUCT_TYPE_TO_SERVICE_ID: Record<string, string> = {
  "Custom Sites": "custom",
  "Speedy Sites": "speedy",
  "AI Receptionist": "ai-receptionist",
  "Cinematic Ads": "cinematic",
  "Product Ads": "product-ads",
  "SaaS Plans": "consultation",
  "Growth Hub": "audit",
};

/** Maps product_type values to showcase page routes */
const CATEGORY_SHOWCASE_ROUTES: Record<string, string> = {
  "Custom Sites": "/showcase/custom-sites",
  "Speedy Sites": "/showcase/speedy-sites",
  "SaaS Plans": "/showcase/saas-plans",
  "Cinematic Ads": "/showcase/cinematic-ads",
  "Product Ads": "/showcase/product-ads",
  "AI Receptionist": "/showcase/ai-receptionist",
  "Growth Hub": "/showcase/growth-hub",
};

function getServiceId(productType: string): string {
  return PRODUCT_TYPE_TO_SERVICE_ID[productType] ?? "consultation";
}

const cardStyle: React.CSSProperties = {
  background: "rgba(7,8,16,0.95)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(94,240,138,0.25)",
  borderRadius: "16px",
  padding: "28px",
  display: "flex",
  flexDirection: "column",
  gap: "0",
  boxShadow: "0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(94,240,138,0.08)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
};

const cardHoverEnter = (el: HTMLElement) => {
  el.style.transform = "translateY(-8px)";
  el.style.background = "rgba(7,8,16,0.98)";
  el.style.boxShadow =
    "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(94,240,138,0.4), 0 0 32px rgba(94,240,138,0.08)";
  el.style.borderColor = "rgba(94,240,138,0.6)";
};

const cardHoverLeave = (el: HTMLElement) => {
  el.style.transform = "translateY(0)";
  el.style.background = "rgba(7,8,16,0.95)";
  el.style.boxShadow =
    "0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(94,240,138,0.08)";
  el.style.borderColor = "rgba(94,240,138,0.25)";
};

function GetStartedButton({
  productName,
  displayPrice = "",
  textKey,
  featured = false,
  navigateTo,
}: {
  productName: string;
  displayPrice?: string;
  textKey?: string;
  featured?: boolean;
  navigateTo?: string;
}) {
  const { addItem, openDrawer } = useCartStore();
  const navigate = useNavigate();
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
        if (navigateTo) {
          navigate({ to: navigateTo });
        } else {
          addItem({ name: productName, price: displayPrice });
          openDrawer();
        }
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

export default function ProductsPage() {
  useSeoMeta("products", "Services — Imperidome");
  const [activeTab, setActiveTab] = useState<string>("");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Cinematic Ads seconds slider (Feature 4)
  const [adSeconds, setAdSeconds] = useState<number>(30);

  // Missed Leads Calculator state (Feature 6)
  const [missedCallsPerDay, setMissedCallsPerDay] = useState<number>(10);
  const [avgRevenuePerCall, setAvgRevenuePerCall] = useState<number>(150);
  const navigate = useNavigate();

  // Fetch ALL active products from the backend once on mount.
  // Used for (1) active/inactive visibility, (2) live price display.
  const { actor, isFetching } = useActor();

  useEffect(() => {
    const track = async () => {
      try {
        let sid = sessionStorage.getItem("_vis_sid");
        if (!sid) {
          sid = crypto.randomUUID();
          sessionStorage.setItem("_vis_sid", sid);
        }
        const countryCode: string | null = null;
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

  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const cinematicProduct = backendProducts.find(
    (p) => p.product_type === "Cinematic Ads",
  );
  const cinematicPrice = cinematicProduct?.price_onetime;
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  // Map from category name (tab label) → visible boolean. Absent = visible (fail open).
  const [categoryVisibility, setCategoryVisibility] = useState<
    Map<string, boolean>
  >(new Map());
  const groupedProducts = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of backendProducts) {
      const existing = map.get(p.product_type) ?? [];
      map.set(p.product_type, [...existing, p]);
    }
    return map;
  }, [backendProducts]);
  const dynamicTabs = useMemo(
    () =>
      Array.from(groupedProducts.keys()).filter(
        (t) => categoryVisibility.get(t) !== false,
      ),
    [groupedProducts, categoryVisibility],
  );

  useEffect(() => {
    if (!actor || isFetching) return;
    Promise.all([
      (actor as backendInterface).getProducts().catch(() => [] as Product[]),
      actor.getCategoryVisibility().catch(() => [] as [string, boolean][]),
    ])
      .then(([result, visibility]) => {
        setBackendProducts(result);
        setCategoryVisibility(new Map(visibility));
        setCatalogLoaded(true);
      })
      .catch(() => {
        setCatalogLoaded(true);
      });
  }, [actor, isFetching]);

  // Derive visible tabs from dynamic backend data
  const visibleTabs = dynamicTabs;

  useEffect(() => {
    if (!activeTab && dynamicTabs.length > 0) {
      setActiveTab(dynamicTabs[0]);
    }
  }, [dynamicTabs, activeTab]);

  // Scroll-to-top visibility tracker
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-highlight sticky filter bar on scroll via IntersectionObserver
  // Each rendered section has a ref stored in sectionRefs; when a section
  // becomes >= 40% visible the active tab updates to match it.
  useEffect(() => {
    const sections = sectionRefs.current;
    if (sections.size === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const tab = entry.target.getAttribute("data-section-tab");
            if (tab) setActiveTab(tab);
          }
        }
      },
      { threshold: 0.4, rootMargin: "-20% 0px -20% 0px" },
    );
    for (const el of sections.values()) observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

        {/* Tab pills — desktop (≥768px): full row; mobile (<768px): hamburger */}
        {/* Mobile hamburger button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          {/* Desktop tab row — hidden below 768px via inline media query workaround using a wrapper */}
          <style>{`
            @media (max-width: 767px) {
              .products-tab-row { display: none !important; }
              .products-tab-hamburger { display: flex !important; }
            }
            @media (min-width: 768px) {
              .products-tab-row { display: flex !important; }
              .products-tab-hamburger { display: none !important; }
            }
          `}</style>

          <div
            className="products-tab-row"
            style={{
              gap: "8px",
              flexWrap: "nowrap",
              overflowX: "auto",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
              paddingBottom: "4px",
              width: "100%",
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
                    border: isActive ? "none" : "1px solid #E2E8F0",
                    background: isActive ? "#1E293B" : "transparent",
                    color: isActive
                      ? "#F8FAFC"
                      : isHovered
                        ? "#1E293B"
                        : "rgba(30,41,59,0.5)",
                    fontWeight: isActive ? "700" : "500",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition:
                      "color 0.15s, background 0.15s, border-color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <EditableText
                    textKey={`products.tab_${tab.toLowerCase().replace(/\s+/g, "_")}`}
                    defaultText={tab}
                  />
                </button>
              );
            })}
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="products-tab-hamburger"
            onClick={() => setTabMenuOpen(true)}
            aria-label="Open navigation menu"
            data-ocid="products.tab_hamburger"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid #1C1F33",
              borderRadius: "10px",
              padding: "10px 16px",
              cursor: "pointer",
              color: "#EEF0F8",
              fontSize: "0.9rem",
              fontWeight: "600",
              minHeight: "44px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="4"
                width="16"
                height="2"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="2"
                y="9"
                width="16"
                height="2"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="2"
                y="14"
                width="16"
                height="2"
                rx="1"
                fill="currentColor"
              />
            </svg>
            <span style={{ color: "#5EF08A" }}>{activeTab}</span>
          </button>
        </div>

        {/* Mobile fullscreen tab overlay */}
        {tabMenuOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 9999,
              background: "rgba(10,11,20,0.97)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
            data-ocid="products.tab_overlay"
          >
            {/* Overlay header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #1C1F33",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: "#EEF0F8",
                  fontSize: "1rem",
                  fontWeight: "700",
                  letterSpacing: "0.02em",
                }}
              >
                Services
              </span>
              <button
                type="button"
                onClick={() => setTabMenuOpen(false)}
                aria-label="Close navigation menu"
                data-ocid="products.tab_overlay_close"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid #1C1F33",
                  borderRadius: "8px",
                  color: "#EEF0F8",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Tab list */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "12px 0",
                flex: 1,
              }}
            >
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      setTabMenuOpen(false);
                    }}
                    data-ocid={`products.tab_overlay_item.${dynamicTabs.indexOf(tab) + 1}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: "52px",
                      padding: "14px 24px",
                      background: isActive
                        ? "rgba(94,240,138,0.08)"
                        : "transparent",
                      border: "none",
                      borderLeft: isActive
                        ? "3px solid #5EF08A"
                        : "3px solid transparent",
                      color: isActive ? "#5EF08A" : "#EEF0F8",
                      fontWeight: isActive ? "700" : "500",
                      fontSize: "1rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s, color 0.15s",
                      width: "100%",
                    }}
                  >
                    <EditableText
                      textKey={`products.tab_${tab.toLowerCase().replace(/\s+/g, "_")}`}
                      defaultText={tab}
                    />
                    {isActive && (
                      <span
                        style={{
                          color: "#5EF08A",
                          fontSize: "0.9rem",
                          flexShrink: 0,
                          marginLeft: "8px",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky category filter bar */}
        {visibleTabs.length > 0 && (
          <div
            className="sticky top-0 z-50 overflow-x-auto"
            style={{
              background: "rgba(10,11,20,0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(94,240,138,0.1)",
              marginBottom: "32px",
              marginLeft: "-24px",
              marginRight: "-24px",
              paddingLeft: "24px",
              paddingRight: "24px",
            }}
            data-ocid="products.sticky_filter_bar"
          >
            <div
              className="flex flex-nowrap gap-0"
              style={{ scrollbarWidth: "none" }}
            >
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={`sticky-${tab}`}
                    type="button"
                    aria-label={`Jump to ${tab} category`}
                    data-ocid={`products.sticky_tab.${dynamicTabs.indexOf(tab) + 1}`}
                    onClick={() => {
                      setActiveTab(tab);
                      const sectionEl = sectionRefs.current.get(tab);
                      if (sectionEl) {
                        sectionEl.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      } else if (gridRef.current) {
                        gridRef.current.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }}
                    style={{
                      padding: "14px 18px",
                      minHeight: "48px",
                      background: "transparent",
                      border: "none",
                      borderBottom: isActive
                        ? "2px solid #5EF08A"
                        : "2px solid transparent",
                      color: isActive ? "#5EF08A" : "rgba(156,163,175,0.55)",
                      fontWeight: isActive ? "700" : "500",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition:
                        "color 0.15s, border-color 0.15s, font-weight 0.15s",
                      letterSpacing: isActive ? "0.01em" : "normal",
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab content with crossfade */}
        {!catalogLoaded || !activeTab ? (
          <div
            style={{
              color: "#7A7D90",
              textAlign: "center",
              padding: "40px",
              width: "100%",
            }}
          >
            Loading services…
          </div>
        ) : (
          <div>
            {visibleTabs.map((tab) => {
              const tabProducts = groupedProducts.get(tab) ?? [];
              return (
                <div
                  key={tab}
                  ref={(el) => {
                    if (el) sectionRefs.current.set(tab, el);
                    else sectionRefs.current.delete(tab);
                  }}
                  data-section-tab={tab}
                  style={{
                    display: activeTab === tab ? "block" : "none",
                    scrollMarginTop: "80px",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {activeTab === tab && (
                      <motion.div
                        key={tab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {tabProducts.length === 0 ? (
                          <div
                            style={{
                              color: "#7A7D90",
                              textAlign: "center",
                              padding: "40px",
                              width: "100%",
                            }}
                          >
                            No products available in this category.
                          </div>
                        ) : (
                          <>
                            {tab === "AI Receptionist" && (
                              <>
                                {/* AI Receptionist: Feature Grid + Protocol Block */}
                                <div className="mb-10">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                                    <div className="rounded-2xl border border-[rgba(94,240,138,0.2)] bg-black/50 p-6 flex flex-col items-center text-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center">
                                        <svg
                                          width="24"
                                          height="24"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                                            fill="#5EF08A"
                                          />
                                        </svg>
                                      </div>
                                      <div className="text-lg font-bold text-white">
                                        Revenue Saved
                                      </div>
                                      <p className="text-sm text-gray-400 leading-relaxed">
                                        Recover lost leads from every unanswered
                                        call and convert them into paying
                                        customers automatically.
                                      </p>
                                    </div>
                                    <div className="rounded-2xl border border-[rgba(94,240,138,0.2)] bg-black/50 p-6 flex flex-col items-center text-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center">
                                        <svg
                                          width="24"
                                          height="24"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"
                                            fill="#5EF08A"
                                          />
                                        </svg>
                                      </div>
                                      <div className="text-lg font-bold text-white">
                                        Call Transcripts
                                      </div>
                                      <p className="text-sm text-gray-400 leading-relaxed">
                                        Every call is transcribed, tagged, and
                                        searchable so you never lose context
                                        from a customer interaction.
                                      </p>
                                    </div>
                                    <div className="rounded-2xl border border-[rgba(94,240,138,0.2)] bg-black/50 p-6 flex flex-col items-center text-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center">
                                        <svg
                                          width="24"
                                          height="24"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M12 2a9 9 0 1 0 0 18A9 9 0 0 0 12 2zm1 13h-2v-5h2v5zm0-7h-2V6h2v2z"
                                            fill="#5EF08A"
                                          />
                                        </svg>
                                      </div>
                                      <div className="text-lg font-bold text-white">
                                        Knowledge Base
                                      </div>
                                      <p className="text-sm text-gray-400 leading-relaxed">
                                        Train the AI on your business, services,
                                        and FAQs so it answers questions with
                                        precision and confidence.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="rounded-2xl border border-[rgba(94,240,138,0.3)] bg-gradient-to-br from-black/80 to-green-950/20 p-8 flex flex-col md:flex-row gap-6 items-start">
                                    <div className="w-16 h-16 rounded-full bg-green-400/15 border border-green-400/40 flex items-center justify-center flex-shrink-0">
                                      <svg
                                        width="32"
                                        height="32"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                                          fill="#5EF08A"
                                        />
                                      </svg>
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-white mb-2">
                                        Revenue-First Focus
                                      </h3>
                                      <p className="text-gray-300 leading-relaxed">
                                        Our AI Receptionist doesn&apos;t just
                                        answer calls — it qualifies leads, books
                                        appointments, and collects information
                                        so your team walks into every
                                        conversation ready to close. Every
                                        interaction is designed around one
                                        outcome: converting callers into
                                        clients.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                            {tab === "AI Receptionist" && (
                              <div className="w-full max-w-3xl mx-auto mb-12 rounded-2xl border border-[rgba(94,240,138,0.25)] bg-black/60 backdrop-blur-sm p-8">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                  How Much Are Missed Calls Costing You?
                                </h2>
                                <p className="text-gray-400 mb-6">
                                  Every unanswered call is lost revenue. See
                                  what you&apos;re missing.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                                  <div className="flex-1">
                                    <label
                                      htmlFor="missed-calls-input"
                                      className="block text-sm text-gray-300 mb-1"
                                    >
                                      Missed calls per day:{" "}
                                      <span className="text-[#5ef08a] font-bold">
                                        {missedCallsPerDay}
                                      </span>
                                    </label>
                                    <input
                                      id="missed-calls-input"
                                      type="range"
                                      min={1}
                                      max={50}
                                      step={1}
                                      value={missedCallsPerDay}
                                      onChange={(e) =>
                                        setMissedCallsPerDay(
                                          Number(e.target.value),
                                        )
                                      }
                                      className="w-full accent-[#5ef08a]"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                      <span>1</span>
                                      <span>50</span>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <label
                                      htmlFor="avg-revenue-input"
                                      className="block text-sm text-gray-300 mb-1"
                                    >
                                      Average revenue per call ($)
                                    </label>
                                    <input
                                      id="avg-revenue-input"
                                      type="number"
                                      min={1}
                                      max={10000}
                                      value={avgRevenuePerCall}
                                      onChange={(e) =>
                                        setAvgRevenuePerCall(
                                          Math.max(1, Number(e.target.value)),
                                        )
                                      }
                                      className="w-full bg-black/40 border border-[rgba(94,240,138,0.2)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5ef08a]"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="rounded-xl bg-black/40 border border-[rgba(94,240,138,0.15)] p-4 text-center">
                                    <div className="text-3xl font-bold text-[#5ef08a]">
                                      $
                                      {(
                                        missedCallsPerDay *
                                        30 *
                                        avgRevenuePerCall
                                      ).toLocaleString("en-US")}
                                      <span className="text-lg font-normal text-gray-400">
                                        /mo
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      monthly missed revenue
                                    </div>
                                  </div>
                                  <div className="rounded-xl bg-black/40 border border-[rgba(94,240,138,0.15)] p-4 text-center">
                                    <div className="text-3xl font-bold text-[#5ef08a]">
                                      $
                                      {(
                                        missedCallsPerDay *
                                        365 *
                                        avgRevenuePerCall
                                      ).toLocaleString("en-US")}
                                      <span className="text-lg font-normal text-gray-400">
                                        /yr
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      annual missed revenue
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-center text-gray-300">
                                  The AI Receptionist Safety Net is{" "}
                                  <span className="text-[#5ef08a] font-semibold">
                                    $199/mo
                                  </span>{" "}
                                  — a fraction of what you&apos;re losing.
                                </p>
                              </div>
                            )}
                            {tab === "Speedy Sites" && (
                              <div className="mb-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                  <div className="rounded-xl p-6 bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30">
                                    <h3 className="text-lg font-bold text-white mb-4">
                                      Who Speedy Is For
                                    </h3>
                                    <ul className="space-y-3">
                                      {[
                                        "Need to launch immediately",
                                        "Validating a business idea",
                                        "Need instant credibility",
                                        "Stuck using DIY tools",
                                      ].map((item) => (
                                        <li
                                          key={item}
                                          className="flex items-center gap-3 text-slate-300"
                                        >
                                          <span className="text-green-400 font-bold">
                                            ✓
                                          </span>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="rounded-xl p-6 bg-slate-800/60 border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-4">
                                      When to Upgrade (Custom)
                                    </h3>
                                    <ul className="space-y-3">
                                      {[
                                        "Need SEO to capture organic traffic",
                                        "Need CRM and workflow automation",
                                        "Outgrow platform caps",
                                        "Want full, uncompromised customization",
                                      ].map((item) => (
                                        <li
                                          key={item}
                                          className="flex items-center gap-3 text-slate-300"
                                        >
                                          <span className="text-orange-400">
                                            →
                                          </span>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                    <p className="mt-4 text-sm text-slate-400 italic">
                                      Start with Custom if this is you.
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="rounded-xl p-6 bg-slate-800/60 border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-4">
                                      Why Not Just Build It Yourself?
                                    </h3>
                                    <ul className="space-y-2">
                                      {[
                                        "No design system = inconsistent look",
                                        "Months lost to trial and error",
                                        "Zero conversion optimization",
                                        "You pay with time, not money",
                                      ].map((item) => (
                                        <li
                                          key={item}
                                          className="flex items-start gap-3 text-slate-300 text-sm"
                                        >
                                          <span className="text-red-400 mt-0.5">
                                            ✕
                                          </span>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                    <p className="mt-4 text-xs text-slate-500 italic">
                                      &ldquo;I spent 6 months and still had a
                                      site that looked like 2008.&rdquo;
                                    </p>
                                  </div>
                                  <div className="rounded-xl p-6 bg-slate-800/60 border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-4">
                                      Why Not Just Pay $29/mo?
                                    </h3>
                                    <ul className="space-y-2">
                                      {[
                                        "Template limitations kill your brand",
                                        "Monthly fees compound forever",
                                        "Support is a chatbot, not a team",
                                        "Zero custom functionality",
                                      ].map((item) => (
                                        <li
                                          key={item}
                                          className="flex items-start gap-3 text-slate-300 text-sm"
                                        >
                                          <span className="text-red-400 mt-0.5">
                                            ✕
                                          </span>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                    <p className="mt-4 text-xs text-slate-500 italic">
                                      &ldquo;Paying $29/mo became $600/yr for a
                                      site I still hated.&rdquo;
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {tab === "Growth Hub" &&
                              (() => {
                                const allGHProducts =
                                  groupedProducts.get("Growth Hub") ?? [];
                                const trafficProducts = allGHProducts.filter(
                                  (p) =>
                                    [
                                      "seo",
                                      "ads",
                                      "social",
                                      "google",
                                      "traffic",
                                      "search",
                                    ].some((k) =>
                                      p.name.toLowerCase().includes(k),
                                    ),
                                );
                                const conversionProducts = allGHProducts.filter(
                                  (p) =>
                                    [
                                      "lead",
                                      "review",
                                      "audit",
                                      "conversion",
                                      "capture",
                                    ].some((k) =>
                                      p.name.toLowerCase().includes(k),
                                    ),
                                );
                                const operationsProducts = allGHProducts.filter(
                                  (p) =>
                                    [
                                      "menu",
                                      "idx",
                                      "mls",
                                      "bulk",
                                      "custom page",
                                      "restaurant",
                                      "operations",
                                      "pwa",
                                      "annual site",
                                      "upgrade",
                                    ].some((k) =>
                                      p.name.toLowerCase().includes(k),
                                    ),
                                );
                                const usedGHIds = new Set(
                                  [
                                    ...trafficProducts,
                                    ...conversionProducts,
                                    ...operationsProducts,
                                  ].map((p) => String(p.id)),
                                );
                                const ghRemainder = allGHProducts.filter(
                                  (p) => !usedGHIds.has(String(p.id)),
                                );
                                const ghCategories = [
                                  {
                                    pill: "TRAFFIC",
                                    headline: "Capture Attention Online",
                                    products: trafficProducts,
                                  },
                                  {
                                    pill: "CONVERSION",
                                    headline: "Turn Visitors Into Clients",
                                    products: conversionProducts,
                                  },
                                  {
                                    pill: "OPERATIONS",
                                    headline: "Systemize Your Business",
                                    products: operationsProducts,
                                  },
                                  ...(ghRemainder.length > 0
                                    ? [
                                        {
                                          pill: "MORE",
                                          headline: "Additional Services",
                                          products: ghRemainder,
                                        },
                                      ]
                                    : []),
                                ].filter((c) => c.products.length > 0);
                                if (ghCategories.length === 0) return null;
                                return (
                                  <div className="space-y-12 mb-8">
                                    {ghCategories.map((cat) => (
                                      <div key={cat.pill}>
                                        <div className="flex items-center gap-4 mb-6">
                                          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest bg-slate-800 text-green-400 border border-green-500/30">
                                            {cat.pill}
                                          </span>
                                          <h3 className="text-xl font-bold text-white">
                                            {cat.headline}
                                          </h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {cat.products.map((product, idx) => {
                                            const pt = product.payment_type as
                                              | string
                                              | null
                                              | undefined;
                                            const ghBasePrice =
                                              pt === "one_time" ||
                                              pt === "deposit_50"
                                                ? (product.price_onetime ??
                                                  product.price_monthly ??
                                                  0)
                                                : pt === "annual"
                                                  ? (product.price_annual ??
                                                    product.price_monthly ??
                                                    0)
                                                  : (product.price_monthly ??
                                                    product.price_onetime ??
                                                    0);
                                            const ghPaymentType =
                                              product.payment_type ??
                                              "one_time";
                                            const ghPrice =
                                              ghBasePrice == null
                                                ? "—"
                                                : ghPaymentType === "monthly"
                                                  ? `${ghBasePrice.toLocaleString()}/mo`
                                                  : ghPaymentType ===
                                                      "quarterly"
                                                    ? `${ghBasePrice.toLocaleString()}/quarter`
                                                    : ghBasePrice.toLocaleString();
                                            const ghQuestionnaireRoute:
                                              | string
                                              | undefined =
                                              product.product_type ===
                                              "Cinematic Ads"
                                                ? `/ads-builder?price=${String(product.price_onetime ?? "")}`
                                                : product.product_type ===
                                                    "Product Ads"
                                                  ? "/product-lab-brief"
                                                  : product.product_type ===
                                                      "AI Receptionist"
                                                    ? "/ai-receptionist-setup"
                                                    : undefined;
                                            return (
                                              <motion.div
                                                key={String(product.id)}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{
                                                  opacity: 1,
                                                  y: 0,
                                                }}
                                                viewport={{ once: true }}
                                                transition={{
                                                  duration: 0.4,
                                                  delay: idx * 0.08,
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    ...cardStyle,
                                                    height: "100%",
                                                  }}
                                                  className="group rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-white/20 hover:ring-1 hover:ring-green-400/30"
                                                  onMouseEnter={(e) =>
                                                    cardHoverEnter(
                                                      e.currentTarget,
                                                    )
                                                  }
                                                  onMouseLeave={(e) =>
                                                    cardHoverLeave(
                                                      e.currentTarget,
                                                    )
                                                  }
                                                >
                                                  {product.imageUrl && (
                                                    <div
                                                      className="relative overflow-hidden"
                                                      style={{
                                                        borderRadius: "8px",
                                                        marginBottom: "12px",
                                                      }}
                                                    >
                                                      <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-full rounded-xl object-cover border border-green-400/20 aspect-video"
                                                      />
                                                      <div
                                                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                                                        aria-hidden="true"
                                                      />
                                                    </div>
                                                  )}
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-1 h-3 bg-green-400/60 rounded-full flex-shrink-0" />
                                                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400/70 font-mono">
                                                      {cat.pill}
                                                    </span>
                                                  </div>
                                                  <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-white leading-tight mb-1">
                                                    <TypewriterText
                                                      text={product.name}
                                                      speed={45}
                                                    />
                                                  </h2>
                                                  <div className="flex items-baseline gap-2 my-2">
                                                    <span
                                                      style={{
                                                        fontSize:
                                                          "clamp(2rem, 5vw, 2.75rem)",
                                                        fontWeight: 900,
                                                        color: "#5EF08A",
                                                        fontFamily:
                                                          "JetBrains Mono, monospace",
                                                        lineHeight: 1,
                                                      }}
                                                    >
                                                      {"$"}
                                                      {ghBasePrice != null
                                                        ? ghBasePrice.toLocaleString()
                                                        : "—"}
                                                    </span>
                                                    <span className="text-sm text-gray-400 font-normal">
                                                      {ghPaymentType ===
                                                      "monthly"
                                                        ? "/mo"
                                                        : ghPaymentType ===
                                                            "quarterly"
                                                          ? "/quarter"
                                                          : ghPaymentType ===
                                                              "deposit_50"
                                                            ? "50% deposit today"
                                                            : "one-time"}
                                                    </span>
                                                  </div>
                                                  {product.tagline && (
                                                    <blockquote className="border-l-2 border-green-400/40 pl-3 my-2">
                                                      <p className="text-sm italic text-gray-400 leading-relaxed">
                                                        {product.tagline}
                                                      </p>
                                                    </blockquote>
                                                  )}
                                                  {product.description && (
                                                    <p
                                                      className="text-sm md:text-base leading-relaxed text-gray-300 line-clamp-3 group-hover:line-clamp-none transition-all duration-300"
                                                      style={{
                                                        marginBottom: "12px",
                                                      }}
                                                    >
                                                      {product.description}
                                                    </p>
                                                  )}
                                                  {product.featureBullets &&
                                                    product.featureBullets
                                                      .length > 0 && (
                                                      <ul
                                                        className="flex flex-col gap-2"
                                                        style={{
                                                          marginBottom: "12px",
                                                        }}
                                                      >
                                                        {product.featureBullets.map(
                                                          (
                                                            bullet: string,
                                                            i: number,
                                                          ) => (
                                                            <li
                                                              key={`b${String(i)}`}
                                                              className="flex items-start gap-2"
                                                            >
                                                              <span className="w-4 h-4 rounded-full border border-green-400/50 bg-green-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <span className="text-green-400 text-[9px] font-bold leading-none">
                                                                  ✓
                                                                </span>
                                                              </span>
                                                              <span className="text-sm text-gray-300 leading-snug">
                                                                {bullet}
                                                              </span>
                                                            </li>
                                                          ),
                                                        )}
                                                      </ul>
                                                    )}
                                                  {product.bestFor && (
                                                    <>
                                                      <hr className="border-t border-white/10 my-1" />
                                                      <div
                                                        className="flex flex-wrap items-start gap-1 text-xs"
                                                        style={{
                                                          marginBottom: "8px",
                                                        }}
                                                      >
                                                        <span className="font-bold uppercase tracking-widest text-green-400/80 font-mono">
                                                          Best For:
                                                        </span>
                                                        <span className="text-gray-400">
                                                          {product.bestFor}
                                                        </span>
                                                      </div>
                                                    </>
                                                  )}
                                                  <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-white/10">
                                                    <div
                                                      aria-label={`Get started with ${product.name}`}
                                                    >
                                                      <GetStartedButton
                                                        productName={
                                                          product.name
                                                        }
                                                        displayPrice={ghPrice}
                                                        navigateTo={
                                                          ghQuestionnaireRoute
                                                        }
                                                      />
                                                    </div>
                                                    <Link
                                                      to="/services/product/$productId"
                                                      params={{
                                                        productId: String(
                                                          product.id,
                                                        ),
                                                      }}
                                                      className="relative inline-flex items-center justify-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-400 after:transition-all after:duration-300 hover:after:w-full"
                                                      style={{
                                                        textDecoration: "none",
                                                      }}
                                                      aria-label={`Learn more about ${product.name}`}
                                                      data-ocid={`products.view_details.${String(product.id)}`}
                                                    >
                                                      View Details
                                                      <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1">
                                                        →
                                                      </span>
                                                    </Link>
                                                    {CATEGORY_SHOWCASE_ROUTES[
                                                      product.product_type
                                                    ] && (
                                                      <Link
                                                        to={
                                                          CATEGORY_SHOWCASE_ROUTES[
                                                            product.product_type
                                                          ]
                                                        }
                                                        className="relative inline-flex items-center justify-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-400 after:transition-all after:duration-300 hover:after:w-full"
                                                        style={{
                                                          textDecoration:
                                                            "none",
                                                        }}
                                                        aria-label={`View our work for ${product.product_type}`}
                                                        data-ocid={`products.view_our_work.${String(product.id)}`}
                                                      >
                                                        View Our Work
                                                        <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1">
                                                          →
                                                        </span>
                                                      </Link>
                                                    )}
                                                    <Link
                                                      to="/intake"
                                                      search={{
                                                        service: getServiceId(
                                                          product.product_type,
                                                        ),
                                                      }}
                                                      className="relative inline-flex items-center justify-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-400 after:transition-all after:duration-300 hover:after:w-full"
                                                      style={{
                                                        textDecoration: "none",
                                                      }}
                                                      aria-label={`Inquire about ${product.name}`}
                                                      data-ocid={`products.inquire.${String(product.id)}`}
                                                    >
                                                      Inquire
                                                      <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1">
                                                        →
                                                      </span>
                                                    </Link>
                                                  </div>
                                                </div>
                                              </motion.div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            {tab === "SaaS Plans" &&
                              (() => {
                                const allSaasProducts =
                                  groupedProducts.get("SaaS Plans") ?? [];
                                const speedyPlans = allSaasProducts.filter(
                                  (p) =>
                                    [
                                      "basic",
                                      "booking",
                                      "commerce",
                                      "storefront",
                                    ].some((k) =>
                                      p.name.toLowerCase().includes(k),
                                    ),
                                );
                                const managementPlans = allSaasProducts.filter(
                                  (p) =>
                                    [
                                      "keep",
                                      "stay",
                                      "full",
                                      "enterprise",
                                      "switch",
                                      "partner",
                                    ].some((k) =>
                                      p.name.toLowerCase().includes(k),
                                    ),
                                );
                                if (
                                  speedyPlans.length === 0 &&
                                  managementPlans.length === 0
                                )
                                  return null;
                                const renderSaasCard = (
                                  product: Product,
                                  idx: number,
                                ) => {
                                  const pt = product.payment_type as
                                    | string
                                    | null
                                    | undefined;
                                  const saasBasePrice =
                                    pt === "one_time" || pt === "deposit_50"
                                      ? (product.price_onetime ??
                                        product.price_monthly ??
                                        0)
                                      : pt === "annual"
                                        ? (product.price_annual ??
                                          product.price_monthly ??
                                          0)
                                        : (product.price_monthly ??
                                          product.price_onetime ??
                                          0);
                                  const saasPaymentType =
                                    product.payment_type ?? "one_time";
                                  const saasPrice =
                                    saasBasePrice == null
                                      ? "\u2014"
                                      : saasPaymentType === "monthly"
                                        ? `${saasBasePrice.toLocaleString()}/mo`
                                        : saasPaymentType === "quarterly"
                                          ? `${saasBasePrice.toLocaleString()}/quarter`
                                          : saasPaymentType === "annual"
                                            ? `${saasBasePrice.toLocaleString()}/year`
                                            : saasPaymentType === "deposit_50"
                                              ? `${saasBasePrice.toLocaleString()} (50% deposit)`
                                              : saasBasePrice.toLocaleString();
                                  return (
                                    <motion.div
                                      key={String(product.id)}
                                      initial={{ opacity: 0, y: 20 }}
                                      whileInView={{ opacity: 1, y: 0 }}
                                      viewport={{ once: true }}
                                      transition={{
                                        duration: 0.4,
                                        delay: idx * 0.08,
                                      }}
                                    >
                                      <div
                                        style={{ ...cardStyle, height: "100%" }}
                                        className="group rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-white/20 hover:ring-1 hover:ring-green-400/30"
                                        onMouseEnter={(e) =>
                                          cardHoverEnter(e.currentTarget)
                                        }
                                        onMouseLeave={(e) =>
                                          cardHoverLeave(e.currentTarget)
                                        }
                                      >
                                        {product.imageUrl && (
                                          <div
                                            className="relative overflow-hidden"
                                            style={{
                                              borderRadius: "8px",
                                              marginBottom: "12px",
                                            }}
                                          >
                                            <img
                                              src={product.imageUrl}
                                              alt={product.name}
                                              className="w-full rounded-xl object-cover border border-green-400/20 aspect-video"
                                            />
                                            <div
                                              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                                              aria-hidden="true"
                                            />
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="w-1 h-3 bg-green-400/60 rounded-full flex-shrink-0" />
                                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400/70 font-mono">
                                            SaaS Plans
                                          </span>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-white leading-tight mb-1">
                                          <TypewriterText
                                            text={product.name}
                                            speed={45}
                                          />
                                        </h2>
                                        <div className="flex items-baseline gap-2 my-2">
                                          <span
                                            style={{
                                              fontSize:
                                                "clamp(2rem, 5vw, 2.75rem)",
                                              fontWeight: 900,
                                              color: "#5EF08A",
                                              fontFamily:
                                                "JetBrains Mono, monospace",
                                              lineHeight: 1,
                                            }}
                                          >
                                            {"$"}
                                            {saasBasePrice != null
                                              ? saasBasePrice.toLocaleString()
                                              : "\u2014"}
                                          </span>
                                          <span className="text-sm text-gray-400 font-normal">
                                            {saasPaymentType === "monthly"
                                              ? "/mo"
                                              : saasPaymentType === "quarterly"
                                                ? "/quarter"
                                                : saasPaymentType === "annual"
                                                  ? "/year"
                                                  : saasPaymentType ===
                                                      "deposit_50"
                                                    ? "50% deposit today"
                                                    : "one-time payment"}
                                          </span>
                                        </div>
                                        {product.tagline && (
                                          <blockquote className="border-l-2 border-green-400/40 pl-3 my-2">
                                            <p className="text-sm italic text-gray-400 leading-relaxed">
                                              {product.tagline}
                                            </p>
                                          </blockquote>
                                        )}
                                        {product.description && (
                                          <p
                                            className="text-sm md:text-base leading-relaxed text-gray-300 line-clamp-3 group-hover:line-clamp-none transition-all duration-300"
                                            style={{ marginBottom: "12px" }}
                                          >
                                            {product.description}
                                          </p>
                                        )}
                                        {product.featureBullets &&
                                          product.featureBullets.length > 0 && (
                                            <ul
                                              className="flex flex-col gap-2"
                                              style={{ marginBottom: "12px" }}
                                            >
                                              {product.featureBullets.map(
                                                (bullet: string, i: number) => (
                                                  <li
                                                    key={`b${String(i)}`}
                                                    className="flex items-start gap-2"
                                                  >
                                                    <span className="w-4 h-4 rounded-full border border-green-400/50 bg-green-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                      <span className="text-green-400 text-[9px] font-bold leading-none">
                                                        &#10003;
                                                      </span>
                                                    </span>
                                                    <span className="text-sm text-gray-300 leading-snug">
                                                      {bullet}
                                                    </span>
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          )}
                                        {product.bestFor && (
                                          <>
                                            <hr className="border-t border-white/10 my-1" />
                                            <div
                                              className="flex flex-wrap items-start gap-1 text-xs"
                                              style={{ marginBottom: "8px" }}
                                            >
                                              <span className="font-bold uppercase tracking-widest text-green-400/80 font-mono">
                                                Best For:
                                              </span>
                                              <span className="text-gray-400">
                                                {product.bestFor}
                                              </span>
                                            </div>
                                          </>
                                        )}
                                        <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-white/10">
                                          <div
                                            aria-label={`Get started with ${product.name}`}
                                          >
                                            <GetStartedButton
                                              productName={product.name}
                                              displayPrice={saasPrice}
                                            />
                                          </div>
                                          <Link
                                            to="/services/product/$productId"
                                            params={{
                                              productId: String(product.id),
                                            }}
                                            className="relative inline-flex items-center justify-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-400 after:transition-all after:duration-300 hover:after:w-full"
                                            style={{ textDecoration: "none" }}
                                            aria-label={`Learn more about ${product.name}`}
                                            data-ocid={`products.view_details.${String(product.id)}`}
                                          >
                                            View Details
                                            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1">
                                              &#8594;
                                            </span>
                                          </Link>
                                          {CATEGORY_SHOWCASE_ROUTES[
                                            product.product_type
                                          ] && (
                                            <Link
                                              to={
                                                CATEGORY_SHOWCASE_ROUTES[
                                                  product.product_type
                                                ]
                                              }
                                              className="relative inline-flex items-center justify-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-400 after:transition-all after:duration-300 hover:after:w-full"
                                              style={{ textDecoration: "none" }}
                                              aria-label={`View our work for ${product.product_type}`}
                                              data-ocid={`products.view_our_work.${String(product.id)}`}
                                            >
                                              View Our Work
                                              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1">
                                                &#8594;
                                              </span>
                                            </Link>
                                          )}
                                          <Link
                                            to="/intake"
                                            search={{
                                              service: getServiceId(
                                                product.product_type,
                                              ),
                                            }}
                                            className="relative inline-flex items-center justify-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-400 after:transition-all after:duration-300 hover:after:w-full"
                                            style={{ textDecoration: "none" }}
                                            aria-label={`Inquire about ${product.name}`}
                                            data-ocid={`products.inquire.${String(product.id)}`}
                                          >
                                            Inquire
                                            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1">
                                              &#8594;
                                            </span>
                                          </Link>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                };
                                return (
                                  <div className="space-y-10 mb-8">
                                    {speedyPlans.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-4 mb-6">
                                          <div className="h-px flex-1 bg-white/10" />
                                          <h3 className="text-lg font-bold text-white px-4 whitespace-nowrap">
                                            Speedy Site SaaS Plans
                                          </h3>
                                          <div className="h-px flex-1 bg-white/10" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {speedyPlans.map((p, i) =>
                                            renderSaasCard(p, i),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {managementPlans.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-4 mb-6">
                                          <div className="h-px flex-1 bg-white/10" />
                                          <h3 className="text-lg font-bold text-white px-4 whitespace-nowrap">
                                            Custom Management Plans
                                          </h3>
                                          <div className="h-px flex-1 bg-white/10" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {managementPlans.map((p, i) =>
                                            renderSaasCard(p, i),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            <div
                              ref={gridRef}
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch w-full"
                              style={{
                                padding: "24px 0",
                                display:
                                  tab === "Growth Hub" || tab === "SaaS Plans"
                                    ? "none"
                                    : undefined,
                              }}
                            >
                              {(groupedProducts.get(activeTab) ?? []).map(
                                (product, index) => {
                                  // Derive base price from whichever price field is set
                                  const basePrice =
                                    product.price_onetime != null
                                      ? product.price_onetime
                                      : product.price_monthly != null
                                        ? product.price_monthly
                                        : product.price_annual != null
                                          ? product.price_annual
                                          : null;
                                  const paymentType =
                                    product.payment_type ?? "one_time";
                                  const price =
                                    basePrice == null
                                      ? "—"
                                      : paymentType === "monthly"
                                        ? `${basePrice.toLocaleString()}/mo`
                                        : paymentType === "quarterly"
                                          ? `${basePrice.toLocaleString()}/quarter`
                                          : paymentType === "deposit_50"
                                            ? `${basePrice.toLocaleString()}`
                                            : `${basePrice.toLocaleString()}`;
                                  const _depositLabel =
                                    paymentType === "deposit_50" &&
                                    basePrice != null
                                      ? `${basePrice.toLocaleString()} — 50% deposit today`
                                      : null;

                                  // Questionnaire-first routing for Cinematic Ads, Product Ads, AI Receptionist
                                  const questionnaireRoute: string | undefined =
                                    product.product_type === "Cinematic Ads"
                                      ? `/ads-builder?price=${product.price_onetime ?? ""}`
                                      : product.product_type === "Product Ads"
                                        ? "/product-lab-brief"
                                        : product.product_type ===
                                            "AI Receptionist"
                                          ? "/ai-receptionist-setup"
                                          : undefined;

                                  // Feature 5: Product Ads Flash tier navigation
                                  const isProductAdsFlash =
                                    product.product_type === "Product Ads" &&
                                    product.name
                                      .toLowerCase()
                                      .includes("flash");
                                  return (
                                    <motion.div
                                      key={String(product.id)}
                                      className="w-full"
                                      initial={{ opacity: 0, y: 24 }}
                                      whileInView={{ opacity: 1, y: 0 }}
                                      viewport={{ once: true }}
                                      transition={{
                                        duration: 0.5,
                                        delay: index * 0.1,
                                      }}
                                    >
                                      <div
                                        style={{ ...cardStyle, height: "100%" }}
                                        className="group rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-white/20 hover:ring-1 hover:ring-green-400/30"
                                        onMouseEnter={(e) =>
                                          cardHoverEnter(e.currentTarget)
                                        }
                                        onMouseLeave={(e) =>
                                          cardHoverLeave(e.currentTarget)
                                        }
                                      >
                                        {product.imageUrl && (
                                          <div
                                            className="relative overflow-hidden"
                                            style={{
                                              borderRadius: "8px",
                                              marginBottom: "12px",
                                            }}
                                          >
                                            <img
                                              src={product.imageUrl}
                                              alt={product.name}
                                              className="w-full rounded-xl object-cover border border-green-400/20 aspect-video"
                                            />
                                            <div
                                              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                                              aria-hidden="true"
                                            />
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="w-1 h-3 bg-green-400/60 rounded-full flex-shrink-0" />
                                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400/70 font-mono">
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400/70 font-mono">
                                              {product.product_type}
                                            </span>
                                          </span>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-white leading-tight mb-1">
                                          <TypewriterText
                                            text={product.name}
                                            speed={45}
                                          />
                                        </h2>
                                        <div className="flex items-baseline gap-2 my-2">
                                          <span
                                            style={{
                                              fontSize:
                                                "clamp(2rem, 5vw, 2.75rem)",
                                              fontWeight: 900,
                                              color: "#5EF08A",
                                              fontFamily:
                                                "JetBrains Mono, monospace",
                                              lineHeight: 1,
                                            }}
                                          >
                                            $
                                            {basePrice != null
                                              ? basePrice.toLocaleString()
                                              : "—"}
                                          </span>
                                          <span className="text-sm text-gray-400 font-normal">
                                            {paymentType === "monthly"
                                              ? "/mo"
                                              : paymentType === "quarterly"
                                                ? "/quarter"
                                                : paymentType === "deposit_50"
                                                  ? "50% deposit today"
                                                  : "one-time"}
                                          </span>
                                        </div>
                                        {product.tagline && (
                                          <blockquote className="border-l-2 border-green-400/40 pl-3 my-2">
                                            <p className="text-sm italic text-gray-400 leading-relaxed">
                                              {product.tagline}
                                            </p>
                                          </blockquote>
                                        )}
                                        {product.description && (
                                          <p
                                            className="text-sm md:text-base leading-relaxed text-gray-300 line-clamp-3 group-hover:line-clamp-none transition-all duration-300"
                                            style={{ marginBottom: "12px" }}
                                          >
                                            {product.description}
                                          </p>
                                        )}
                                        {product.featureBullets &&
                                          product.featureBullets.length > 0 && (
                                            <ul
                                              className="flex flex-col gap-2"
                                              style={{ marginBottom: "12px" }}
                                            >
                                              {product.featureBullets.map(
                                                (bullet: string, i: number) => (
                                                  <li
                                                    key={`b${String(i)}`}
                                                    className="flex items-start gap-2"
                                                  >
                                                    <span className="w-4 h-4 rounded-full border border-green-400/50 bg-green-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                      <span className="text-green-400 text-[9px] font-bold leading-none">
                                                        ✓
                                                      </span>
                                                    </span>
                                                    <span className="text-sm text-gray-300 leading-snug">
                                                      {bullet}
                                                    </span>
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          )}
                                        {product.bestFor && (
                                          <>
                                            <hr className="border-t border-white/10 my-1" />
                                            <div
                                              className="flex flex-wrap items-start gap-1 text-xs"
                                              style={{ marginBottom: "8px" }}
                                            >
                                              <span className="font-bold uppercase tracking-widest text-green-400/80 font-mono">
                                                Best For:
                                              </span>
                                              <span className="text-gray-400">
                                                {product.bestFor}
                                              </span>
                                            </div>
                                          </>
                                        )}

                                        <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-white/10">
                                          <div
                                            aria-label={`Get started with ${product.name}`}
                                          >
                                            <GetStartedButton
                                              productName={product.name}
                                              displayPrice={price}
                                              navigateTo={
                                                isProductAdsFlash
                                                  ? "/product-lab-brief?tier=flash"
                                                  : questionnaireRoute
                                              }
                                            />
                                          </div>
                                          <Link
                                            to="/services/product/$productId"
                                            params={{
                                              productId: String(product.id),
                                            }}
                                            className="relative inline-flex items-center justify-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-400 after:transition-all after:duration-300 hover:after:w-full"
                                            style={{
                                              textDecoration: "none",
                                            }}
                                            aria-label={`Learn more about ${product.name}`}
                                            data-ocid={`products.view_details.${String(product.id)}`}
                                          >
                                            View Details
                                            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1">
                                              →
                                            </span>
                                          </Link>
                                          {CATEGORY_SHOWCASE_ROUTES[
                                            product.product_type
                                          ] && (
                                            <Link
                                              to={
                                                CATEGORY_SHOWCASE_ROUTES[
                                                  product.product_type
                                                ]
                                              }
                                              className="relative inline-flex items-center justify-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-400 after:transition-all after:duration-300 hover:after:w-full"
                                              style={{
                                                textDecoration: "none",
                                              }}
                                              aria-label={`View our work for ${product.product_type}`}
                                              data-ocid={`products.view_our_work.${String(product.id)}`}
                                            >
                                              View Our Work
                                              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1">
                                                →
                                              </span>
                                            </Link>
                                          )}
                                          <Link
                                            to="/intake"
                                            search={{
                                              service: getServiceId(
                                                product.product_type,
                                              ),
                                            }}
                                            className="relative inline-flex items-center justify-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-400 after:transition-all after:duration-300 hover:after:w-full"
                                            style={{
                                              textDecoration: "none",
                                            }}
                                            aria-label={`Inquire about ${product.name}`}
                                            data-ocid={`products.inquire.${String(product.id)}`}
                                          >
                                            Inquire
                                            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1">
                                              →
                                            </span>
                                          </Link>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                },
                              )}
                            </div>
                            {tab === "Cinematic Ads" && (
                              <div className="mb-10">
                                <div className="text-center mb-8">
                                  <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                                    What Makes Imperidome Different
                                  </h2>
                                  <p className="text-gray-400">
                                    Five pillars that separate our work from
                                    every other production house.
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                  <div className="rounded-2xl border border-[rgba(94,240,138,0.2)] bg-black/50 p-6">
                                    <div className="text-5xl font-black text-green-400/20 leading-none mb-2">
                                      01
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                      Attention First
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                      Every frame is engineered to stop the
                                      scroll. We craft the first three seconds
                                      with the precision of a hook, not an
                                      afterthought.
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-[rgba(94,240,138,0.2)] bg-black/50 p-6">
                                    <div className="text-5xl font-black text-green-400/20 leading-none mb-2">
                                      02
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                      Product Consistency
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                      Your product looks identical across every
                                      ad, every platform, every format. Brand
                                      integrity is non-negotiable in our
                                      production process.
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-[rgba(94,240,138,0.2)] bg-black/50 p-6">
                                    <div className="text-5xl font-black text-green-400/20 leading-none mb-2">
                                      03
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                      Convert, Not Just Look
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                      Beautiful ads that don&apos;t convert are
                                      expensive decoration. We balance
                                      aesthetics with psychology — every visual
                                      decision serves the CTA.
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-[rgba(94,240,138,0.2)] bg-black/50 p-6">
                                    <div className="text-5xl font-black text-green-400/20 leading-none mb-2">
                                      04
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                      Studio Quality
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                      4K capture, professional color grading,
                                      and frame-by-frame editing — without the
                                      studio overhead. Enterprise production at
                                      a fraction of the cost.
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-[rgba(94,240,138,0.2)] bg-black/50 p-6 sm:col-span-2">
                                    <div className="text-5xl font-black text-green-400/20 leading-none mb-2">
                                      05
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                      Sound Design
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                      85% of video content is watched without
                                      sound — and we design for both. Our sound
                                      design layer elevates the visual story
                                      while our silent-optimized captions ensure
                                      full impact either way.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {tab === "Cinematic Ads" && (
                              <div className="w-full max-w-2xl mx-auto mt-8 rounded-2xl border border-[rgba(94,240,138,0.3)] bg-black/60 backdrop-blur-sm p-8">
                                <h2 className="text-2xl font-bold text-white mb-1">
                                  Build Your Cinematic Ad
                                </h2>
                                <p className="text-gray-400 mb-6">
                                  Select your ad length and get started
                                  instantly
                                </p>
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                                    <span>15s</span>
                                    <span className="text-[#5ef08a] font-bold">
                                      {adSeconds} seconds
                                    </span>
                                    <span>60s</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={15}
                                    max={60}
                                    step={5}
                                    value={adSeconds}
                                    onChange={(e) =>
                                      setAdSeconds(Number(e.target.value))
                                    }
                                    className="w-full accent-[#5ef08a]"
                                  />
                                </div>
                                <div className="text-center mb-6">
                                  <span className="text-4xl font-bold text-[#5ef08a]">
                                    ${cinematicPrice ?? "—"}
                                  </span>
                                  <span className="text-gray-400 ml-2">
                                    one-time
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (cinematicPrice == null) return;
                                    navigate({
                                      to: `/ads-builder?seconds=${adSeconds}&price=${cinematicPrice}`,
                                    });
                                  }}
                                  className="w-full py-4 rounded-xl bg-[#5ef08a] hover:bg-[#4dd47a] text-black font-bold text-lg transition-colors"
                                >
                                  {`Get Started — ${cinematicPrice ?? "—"}`}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      {/* Scroll-to-top floating button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            aria-label="Scroll to top"
            data-ocid="products.scroll_to_top_button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              position: "fixed",
              bottom: "32px",
              right: "32px",
              zIndex: 50,
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
              background: "rgba(15,17,32,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transition: "background 0.2s, box-shadow 0.2s, border-color 0.2s",
            }}
            whileHover={{
              background: "rgba(99,102,241,0.85)",
              boxShadow: "0 6px 28px rgba(99,102,241,0.4)",
              borderColor: "rgba(99,102,241,0.6)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 4L4 10M10 4L16 10M10 4V16"
                stroke="#EEF0F8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
