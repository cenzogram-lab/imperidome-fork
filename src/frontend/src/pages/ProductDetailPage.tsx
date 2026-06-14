import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "../backend.d.ts";
import { EditableText } from "../components/EditableText";
import PlanSelectionWidget from "../components/PlanSelectionWidget";
import { VideoCard } from "../components/VideoCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/useCartStore";
import AdsBuilderPage from "./AdsBuilderPage";
import AiReceptionistForm from "./AiReceptionistForm";
import ProductLabBriefPage from "./ProductLabBriefPage";
import seoMap from "./servicesSEOContent";
import type { SEOBlock } from "./servicesSEOContent";

const Route = getRouteApi("/services/product/$productId");

/** Maps product_type to intake service IDs (mirrors ProductsPage pattern) */
const PRODUCT_TYPE_TO_SERVICE_ID: Record<string, string> = {
  "Custom Sites": "custom",
  "Speedy Sites": "speedy",
  "AI Receptionist": "ai-receptionist",
  "Cinematic Ads": "cinematic",
  "Product Ads": "product-ads",
  "SaaS Plans": "consultation",
  "Growth Hub": "audit",
};

function getServiceId(productType: string): string {
  return PRODUCT_TYPE_TO_SERVICE_ID[productType] ?? "consultation";
}

function getBillingLabel(paymentType: string): string {
  switch (paymentType) {
    case "monthly":
      return "/mo";
    case "quarterly":
      return "/quarter";
    case "deposit_50":
      return " — 50% deposit today";
    default:
      return "";
  }
}

function getDisplayPrice(product: Product): string {
  const price =
    product.price_onetime ??
    product.price_monthly ??
    product.price_annual ??
    null;
  if (price == null) return "Contact us";
  return `$${price.toLocaleString()}${getBillingLabel(product.payment_type)}`;
}

function GetStartedButton({
  product,
}: {
  product: Product;
}) {
  const { addItem, openDrawer } = useCartStore();
  const navigate = useNavigate();
  const displayPrice = getDisplayPrice(product);

  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetMode, setWidgetMode] = useState<
    "custom-sites" | "speedy-sites" | null
  >(null);
  const [widgetFilter, setWidgetFilter] = useState<
    "basic" | "booking" | "storefront" | null
  >(null);

  const goToQuestionnaire = !product.show_questionnaire;

  // Detect SaaS management plans (non-hosting)
  const planSection = (product as Product & { plan_section?: string })
    .plan_section;
  const isSaasPlan =
    product.product_type === "SaaS Plans" && planSection !== "hosting";

  // Detect Speedy hosting plans
  const rawSpeedyFilter = (product as Product & { speedy_filter?: string })
    .speedy_filter;
  const speedyPlanFilter: "basic" | "booking" | "storefront" | null =
    rawSpeedyFilter === "basic" ||
    rawSpeedyFilter === "booking" ||
    rawSpeedyFilter === "storefront"
      ? rawSpeedyFilter
      : null;
  const isSpeedyPlan = speedyPlanFilter !== null;

  function openWidget(
    mode: "custom-sites" | "speedy-sites",
    filter: "basic" | "booking" | "storefront" | null,
  ) {
    setWidgetMode(mode);
    setWidgetFilter(filter);
    setWidgetOpen(true);
  }

  function handleClick() {
    // SaaS management plans → open Custom Sites widget
    if (isSaasPlan) {
      openWidget("custom-sites", null);
      return;
    }
    // Speedy hosting plans → open Speedy Sites widget filtered by tier
    if (isSpeedyPlan) {
      openWidget("speedy-sites", speedyPlanFilter);
      return;
    }

    if (goToQuestionnaire) {
      if (product.product_type?.toLowerCase().includes("receptionist")) {
        navigate({ to: "/ai-receptionist-setup" });
        return;
      }
      if (product.product_type?.toLowerCase().includes("cinematic")) {
        navigate({ to: "/ads-builder" });
        return;
      }
      if (
        product.product_type?.toLowerCase().includes("product") ||
        product.product_type?.toLowerCase().includes("lab")
      ) {
        navigate({ to: "/product-lab-brief" });
        return;
      }
    }
    // show_questionnaire=true (form already embedded inline) or non-questionnaire product:
    // always go straight to cart/checkout
    addItem({ name: product.name, price: displayPrice });
    openDrawer();
  }

  return (
    <>
      <motion.button
        type="button"
        data-ocid="product-detail.primary_button"
        onClick={handleClick}
        whileHover={{
          boxShadow: "0 0 20px rgba(94,240,138,0.45)",
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: "#39FF14",
          color: "#000",
          fontWeight: "700",
          fontSize: "1.1rem",
          padding: "18px 40px",
          borderRadius: "9999px",
          border: "none",
          cursor: "pointer",
          transition: "opacity 0.2s",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        }}
      >
        <EditableText
          textKey="products.btn_get_started"
          defaultText="Get Started"
        />
      </motion.button>
      <PlanSelectionWidget
        open={widgetOpen}
        onClose={() => {
          setWidgetOpen(false);
          setWidgetMode(null);
          setWidgetFilter(null);
        }}
        mode={(widgetMode ?? "custom-sites") as "custom-sites" | "speedy-sites"}
        speedyFilter={widgetFilter ?? undefined}
      />
    </>
  );
}

export default function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { actor, isFetching } = useActor();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getProducts()
      .then((result) => {
        setProducts(result as Product[]);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [actor, isFetching]);

  const product = products.find((p) => String(p.id) === productId);
  const _seoContent: SEOBlock | null = product
    ? (seoMap[product.name.toLowerCase().trim()] ?? null)
    : null;

  // ─── THREE-LEVEL PRIORITY RESOLUTION FOR RICH CONTENT FIELDS ───────────────
  type BodySection = { heading: string; body: string };
  type FaqItem = { question: string; answer: string };

  const seoEntry = useMemo(
    () =>
      product
        ? (seoMap[product.name?.toLowerCase()] ?? seoMap[product.name] ?? null)
        : null,
    [product],
  );

  const resolvedSeoMetaTitle = product
    ? product.seoMetaTitle?.trim()
      ? product.seoMetaTitle
      : (seoEntry?.metaTitle ?? `${product.name} | Imperidome`)
    : "Imperidome";

  const resolvedSeoMetaDescription = product
    ? product.seoMetaDescription?.trim()
      ? product.seoMetaDescription
      : (seoEntry?.metaDescription ?? product.description ?? "")
    : "";

  const resolvedHeroHeadline = product
    ? product.heroHeadline?.trim()
      ? product.heroHeadline
      : (seoEntry?.heroHeadline ?? product.name ?? "")
    : "";

  const resolvedHeroSubheadline = product
    ? product.heroSubheadline?.trim()
      ? product.heroSubheadline
      : (seoEntry?.heroSubheadline ?? product.description ?? "")
    : "";

  let resolvedBodySections: BodySection[] = [];
  if (product?.bodySections?.trim()) {
    try {
      resolvedBodySections = JSON.parse(product.bodySections) as BodySection[];
    } catch {
      resolvedBodySections = seoEntry?.bodySections ?? [];
    }
  } else {
    resolvedBodySections = seoEntry?.bodySections ?? [];
  }

  let resolvedProofPoints: string[] = [];
  if (product?.proofPoints?.trim()) {
    try {
      resolvedProofPoints = JSON.parse(product.proofPoints) as string[];
    } catch {
      resolvedProofPoints = seoEntry?.proofPoints ?? [];
    }
  } else {
    resolvedProofPoints = seoEntry?.proofPoints ?? [];
  }

  const resolvedFaqItems = useMemo<FaqItem[]>(() => {
    if (product?.faqItems?.trim()) {
      try {
        return JSON.parse(product.faqItems) as FaqItem[];
      } catch {
        return seoEntry?.faqItems ?? [];
      }
    }
    return seoEntry?.faqItems ?? [];
  }, [product?.faqItems, seoEntry]);

  const resolvedClosingCTA = product
    ? product.closingCTA?.trim()
      ? product.closingCTA
      : (seoEntry?.closingCTA ?? "")
    : "";

  // detailDescription fallback: use detailDescription if present, else description
  const displayDescription = product
    ? product.detailDescription && product.detailDescription.trim() !== ""
      ? product.detailDescription
      : product.description
    : "";
  // ────────────────────────────────────────────────────────────────────────────

  // Set document title and meta description
  useEffect(() => {
    if (!product) return;
    document.title = resolvedSeoMetaTitle;
    let metaDesc = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", resolvedSeoMetaDescription);
    return () => {
      document.title = "Imperidome";
    };
  }, [resolvedSeoMetaTitle, resolvedSeoMetaDescription, product]);

  // JSON-LD Service schema — injected on product load, removed on route change
  const jsonLdRef = useRef<HTMLScriptElement | null>(null);
  const jsonLdFaqRef = useRef<HTMLScriptElement | null>(null);
  useEffect(() => {
    if (!product) return;
    const existing = document.getElementById("jsonld-service-schema");
    if (existing) existing.remove();

    const numericPrice =
      product.price_onetime ??
      product.price_monthly ??
      product.price_annual ??
      0;
    const description = resolvedSeoMetaDescription || product.description;

    type PriceSpec = {
      "@type": string;
      price: number;
      priceCurrency: string;
      referenceQuantity: { "@type": string; value: number; unitCode: string };
    };

    const offerBase: {
      "@type": string;
      price: number;
      priceCurrency: string;
      availability: string;
      priceSpecification?: PriceSpec;
    } = {
      "@type": "Offer",
      price: numericPrice,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    };

    if (
      product.payment_type === "monthly" ||
      product.payment_type === "quarterly"
    ) {
      offerBase.priceSpecification = {
        "@type": "UnitPriceSpecification",
        price: numericPrice,
        priceCurrency: "USD",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: product.payment_type === "monthly" ? "MON" : "QTR",
        },
      };
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: product.name,
      description,
      offers: offerBase,
      provider: { "@type": "Organization", name: "Imperidome" },
    };

    const script = document.createElement("script");
    script.id = "jsonld-service-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    jsonLdRef.current = script;

    return () => {
      const el = document.getElementById("jsonld-service-schema");
      if (el) el.remove();
      jsonLdRef.current = null;
    };
  }, [product, resolvedSeoMetaDescription]);

  // JSON-LD FAQPage schema — injected when resolved FAQ items exist, removed on route change
  useEffect(() => {
    if (!resolvedFaqItems || resolvedFaqItems.length === 0) return;

    const existing = document.getElementById("jsonld-faq-schema");
    if (existing) existing.remove();

    type FAQQuestion = {
      "@type": "Question";
      name: string;
      acceptedAnswer: {
        "@type": "Answer";
        text: string;
      };
    };

    const schema: {
      "@context": string;
      "@type": "FAQPage";
      mainEntity: FAQQuestion[];
    } = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: resolvedFaqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    const script = document.createElement("script");
    script.id = "jsonld-faq-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    jsonLdFaqRef.current = script;

    return () => {
      const el = document.getElementById("jsonld-faq-schema");
      if (el) el.remove();
      jsonLdFaqRef.current = null;
    };
  }, [resolvedFaqItems]);

  const outerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0A0B14",
    color: "#EEF0F8",
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "48px 24px 80px",
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.25em",
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    color: "#5EF08A",
    marginBottom: "28px",
    display: "inline-block",
    padding: "6px 16px",
    border: "1px solid rgba(94,240,138,0.25)",
    borderRadius: "9999px",
    background: "rgba(94,240,138,0.06)",
  };

  const sectionDividerStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(255,255,255,0.05)",
    margin: "40px 0",
    borderLeft: "none",
    borderRight: "none",
    borderBottom: "none",
  };

  const PROOF_EMOJIS = ["🎯", "⚡", "🔒", "📈", "💡", "🚀", "✅", "🌐"];

  if (loading || isFetching) {
    return (
      <div
        data-ocid="product-detail.loading_state"
        style={{
          ...outerStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(94,240,138,0.2)",
            borderTopColor: "#5EF08A",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        data-ocid="product-detail.error_state"
        style={{
          ...outerStyle,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.25rem", color: "#7A7D90" }}>
          Product not found
        </p>
        <Link
          to="/services"
          data-ocid="product-detail.link"
          style={{
            color: "#5EF08A",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          ← Back to Services
        </Link>
      </div>
    );
  }

  const displayPrice = getDisplayPrice(product);
  const hasVideos = Boolean(product.video_url_1 || product.video_url_2);
  const typeLC = (product.product_type ?? "").toLowerCase();
  const isCinematic = typeLC.includes("cinematic");
  const isProductLab = typeLC.includes("product") || typeLC.includes("lab");
  const isReceptionist = typeLC.includes("receptionist");

  // Split price from billing interval for separate display
  const rawPrice =
    product.price_onetime ??
    product.price_monthly ??
    product.price_annual ??
    null;
  const billingInterval = getBillingLabel(product.payment_type);

  return (
    <div style={outerStyle}>
      <div style={containerStyle}>
        {/* Back link */}
        <Link
          to="/services"
          data-ocid="product-detail.link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8rem",
            color: "#7A7D90",
            textDecoration: "none",
            marginBottom: "40px",
            transition: "color 0.2s",
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            letterSpacing: "0.05em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "#EEF0F8";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "#7A7D90";
          }}
        >
          <ArrowLeft size={14} />
          Back to Services
        </Link>

        {/* ─── HERO SECTION ─────────────────────────────────────────── */}
        <motion.section
          data-ocid="product-detail.section"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{ marginBottom: "0" }}
        >
          {/* Category breadcrumb */}
          {product.product_type && (
            <span
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                color: "rgba(94,240,138,0.7)",
                display: "inline-block",
                marginBottom: "16px",
                padding: "4px 16px",
                border: "1px solid rgba(94,240,138,0.2)",
                borderRadius: "9999px",
                background: "rgba(94,240,138,0.05)",
              }}
            >
              {product.product_type}
            </span>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: product.imageUrl ? "1fr 260px" : "1fr",
              gap: "40px",
              alignItems: "start",
            }}
          >
            <div>
              {/* H1 — large all-caps service name */}
              <h1
                style={{
                  fontSize: "clamp(2.25rem, 6vw, 4rem)",
                  fontWeight: 900,
                  color: "#EEF0F8",
                  lineHeight: 1.05,
                  marginBottom: "20px",
                  letterSpacing: "-0.01em",
                  textTransform: "uppercase",
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                }}
              >
                {resolvedHeroHeadline}
              </h1>

              {/* Tagline / heroSubheadline — blockquote style */}
              {resolvedHeroSubheadline && (
                <blockquote
                  style={{
                    borderLeft: "3px solid rgba(94,240,138,0.5)",
                    paddingLeft: "20px",
                    margin: "0 0 24px 0",
                    fontStyle: "italic",
                    fontSize: "1.1rem",
                    color: "#7A7D90",
                    lineHeight: 1.7,
                  }}
                >
                  {resolvedHeroSubheadline}
                </blockquote>
              )}

              {/* Description — uses detailDescription if set, else falls back to description */}
              <p
                style={{
                  fontSize: "1.05rem",
                  color: "#A0A3B5",
                  lineHeight: 1.8,
                  marginBottom: "32px",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {displayDescription}
              </p>

              {/* Price block */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: "6px",
                }}
              >
                {rawPrice != null ? (
                  <>
                    <span
                      style={{
                        fontSize: "clamp(2.25rem, 5vw, 3rem)",
                        fontWeight: 900,
                        color: "#5EF08A",
                        lineHeight: 1,
                        fontFamily:
                          "'JetBrains Mono', 'Courier New', monospace",
                      }}
                    >
                      ${rawPrice.toLocaleString()}
                    </span>
                    {billingInterval && (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "#7A7D90",
                          fontFamily:
                            "'JetBrains Mono', 'Courier New', monospace",
                        }}
                      >
                        {billingInterval}
                      </span>
                    )}
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 900,
                      color: "#5EF08A",
                      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    }}
                  >
                    Contact us
                  </span>
                )}
              </div>
            </div>

            {/* Product image */}
            {product.imageUrl && (
              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(94,240,138,0.2)",
                  flexShrink: 0,
                }}
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{
                    width: "100%",
                    display: "block",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </div>

          {/* Glowing divider below hero */}
          <div
            style={{
              borderTop: "1px solid rgba(94,240,138,0.2)",
              marginTop: "32px",
              marginBottom: "40px",
              boxShadow: "0 1px 8px rgba(94,240,138,0.06)",
            }}
          />
        </motion.section>

        {/* ─── VIDEO SECTION ────────────────────────────────────────── */}
        {hasVideos && (
          <motion.section
            data-ocid="product-detail.panel"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ marginBottom: "0" }}
          >
            <span style={sectionLabelStyle}>See It In Action</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  product.video_url_1 && product.video_url_2
                    ? "1fr 1fr"
                    : "1fr",
                gap: "24px",
              }}
            >
              {product.video_url_1 && (
                <VideoCard
                  videoUrl={product.video_url_1}
                  title={product.name}
                />
              )}
              {product.video_url_2 && (
                <VideoCard
                  videoUrl={product.video_url_2}
                  title={product.name}
                />
              )}
            </div>
            <hr style={sectionDividerStyle} />
          </motion.section>
        )}

        {/* ─── WHAT'S INCLUDED — NUMBERED CARDS ────────────────────── */}
        {(product.featureBullets.length > 0 ||
          product.bestFor ||
          product.upgradePath ||
          product.recommendedPlan) && (
          <motion.section
            data-ocid="product-detail.card"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ marginBottom: "0" }}
          >
            <span style={sectionLabelStyle}>What&apos;s Included</span>

            {product.featureBullets.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    product.featureBullets.length >= 6
                      ? "repeat(auto-fill, minmax(280px, 1fr))"
                      : "1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                {product.featureBullets.map((bullet, idx) => {
                  const colonIdx = bullet.indexOf(":");
                  const hasColon = colonIdx > -1;
                  const title = hasColon
                    ? bullet.slice(0, colonIdx).trim()
                    : bullet;
                  const body = hasColon
                    ? bullet.slice(colonIdx + 1).trim()
                    : null;
                  const num = String(idx + 1).padStart(2, "0");

                  return (
                    <motion.div
                      key={bullet}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.55,
                        ease: "easeOut",
                        delay: idx * 0.1,
                      }}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        display: "flex",
                        gap: "20px",
                        padding: "24px 32px",
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.02)",
                        overflow: "hidden",
                        cursor: "default",
                      }}
                    >
                      {/* Number box */}
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "14px",
                          background: "#070810",
                          border: "1px solid rgba(94,240,138,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            color: "#5EF08A",
                            fontFamily:
                              "'JetBrains Mono', 'Courier New', monospace",
                            fontWeight: 700,
                            fontSize: "1.05rem",
                            lineHeight: 1,
                          }}
                        >
                          {num}
                        </span>
                      </div>
                      {/* Text */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: "#EEF0F8",
                            lineHeight: 1.4,
                            fontFamily: "system-ui, sans-serif",
                          }}
                        >
                          {title}
                        </span>
                        {body && (
                          <span
                            style={{
                              fontSize: "0.95rem",
                              color: "#7A7D90",
                              marginTop: "6px",
                              lineHeight: 1.7,
                              fontFamily: "system-ui, sans-serif",
                            }}
                          >
                            {body}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Best For / Upgrade Path / Recommended Plan info card */}
            {(product.bestFor ||
              product.upgradePath ||
              product.recommendedPlan) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                whileHover={{ scale: 1.01 }}
                style={{
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.02)",
                  padding: "28px 32px",
                  marginTop: "16px",
                  overflow: "hidden",
                }}
              >
                {product.bestFor && (
                  <div
                    style={{
                      marginBottom:
                        product.upgradePath || product.recommendedPlan
                          ? "20px"
                          : 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        fontFamily:
                          "'JetBrains Mono', 'Courier New', monospace",
                        color: "rgba(94,240,138,0.8)",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Best For
                    </span>
                    <p
                      style={{
                        color: "#A0A3B5",
                        fontSize: "1rem",
                        margin: 0,
                        lineHeight: 1.75,
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      {product.bestFor}
                    </p>
                  </div>
                )}
                {product.upgradePath && (
                  <div
                    style={{
                      borderTop: product.bestFor
                        ? "1px solid rgba(255,255,255,0.07)"
                        : "none",
                      paddingTop: product.bestFor ? "20px" : "0",
                      marginBottom: product.recommendedPlan ? "20px" : 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        fontFamily:
                          "'JetBrains Mono', 'Courier New', monospace",
                        color: "rgba(94,240,138,0.8)",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Upgrade Path
                    </span>
                    <p
                      style={{
                        color: "#A0A3B5",
                        fontSize: "1rem",
                        margin: 0,
                        lineHeight: 1.75,
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      {product.upgradePath}
                    </p>
                  </div>
                )}
                {product.recommendedPlan && (
                  <div
                    style={{
                      borderTop:
                        product.bestFor || product.upgradePath
                          ? "1px solid rgba(255,255,255,0.07)"
                          : "none",
                      paddingTop:
                        product.bestFor || product.upgradePath ? "20px" : "0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        fontFamily:
                          "'JetBrains Mono', 'Courier New', monospace",
                        color: "rgba(94,240,138,0.8)",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Recommended Plan
                    </span>
                    <p
                      style={{
                        color: "#A0A3B5",
                        fontSize: "1rem",
                        margin: 0,
                        lineHeight: 1.75,
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      {product.recommendedPlan}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            <hr style={sectionDividerStyle} />
          </motion.section>
        )}

        {/* ─── ABOUT THIS SERVICE — SEO BODY SECTIONS ──────────────── */}
        {resolvedBodySections.length > 0 && (
          <motion.section
            data-ocid="product-detail.panel"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ marginBottom: "0" }}
          >
            <span style={sectionLabelStyle}>About This Service</span>
            {resolvedBodySections.map((section, idx) => (
              <motion.div
                key={section.heading}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.55,
                  ease: "easeOut",
                  delay: idx * 0.1,
                }}
                whileHover={{ scale: 1.02 }}
                style={{
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.02)",
                  padding: "28px 32px",
                  marginBottom: "14px",
                  overflow: "hidden",
                }}
              >
                {section.heading && (
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "#EEF0F8",
                      marginBottom: "10px",
                      margin: "0 0 10px 0",
                      fontFamily: "system-ui, sans-serif",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {section.heading}
                  </h3>
                )}
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "1rem",
                    lineHeight: 1.8,
                    margin: 0,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {section.body}
                </p>
              </motion.div>
            ))}
            <hr style={sectionDividerStyle} />
          </motion.section>
        )}

        {/* ─── WHY IMPERIDOME — PROOF POINTS AS NUMBERED EMOJI CARDS ── */}
        {resolvedProofPoints.length > 0 && (
          <motion.section
            data-ocid="product-detail.panel"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ marginBottom: "0" }}
          >
            <span style={sectionLabelStyle}>Why Imperidome</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  resolvedProofPoints.length >= 4
                    ? "repeat(auto-fill, minmax(280px, 1fr))"
                    : "1fr",
                gap: "14px",
              }}
            >
              {resolvedProofPoints.map((point, idx) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.55,
                    ease: "easeOut",
                    delay: idx * 0.1,
                  }}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    display: "flex",
                    gap: "20px",
                    padding: "24px 32px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                    alignItems: "flex-start",
                    overflow: "hidden",
                  }}
                >
                  {/* Emoji icon box */}
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      background: "#070810",
                      border: "1px solid rgba(94,240,138,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "1.5rem",
                    }}
                  >
                    {PROOF_EMOJIS[idx % PROOF_EMOJIS.length]}
                  </div>
                  {/* Text */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "#EEF0F8",
                        lineHeight: 1.65,
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      {point}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <hr style={sectionDividerStyle} />
          </motion.section>
        )}

        {/* ─── FAQ SECTION ──────────────────────────────────────────── */}
        {resolvedFaqItems.length > 0 && (
          <motion.section
            data-ocid="product-detail.panel"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ marginBottom: "0" }}
          >
            <span style={sectionLabelStyle}>Frequently Asked Questions</span>
            <Accordion type="single" collapsible>
              {resolvedFaqItems.map((faq, idx) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${idx}`}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <AccordionTrigger
                    style={{
                      color: "#EEF0F8",
                      fontSize: "1rem",
                      fontWeight: 600,
                      textAlign: "left",
                      padding: "20px 0",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent
                    style={{
                      color: "#7A7D90",
                      fontSize: "1rem",
                      lineHeight: 1.8,
                      paddingBottom: "20px",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <hr style={sectionDividerStyle} />
          </motion.section>
        )}

        {/* ─── INQUIRE CTA ──────────────────────────────────────────── */}
        <section style={{ marginBottom: "32px", textAlign: "center" }}>
          <Link
            to="/intake"
            search={
              { service: getServiceId(product.product_type) } as Record<
                string,
                string
              >
            }
            data-ocid="product-detail.inquire.button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              color: "rgba(94,240,138,0.6)",
              fontSize: "0.8rem",
              fontWeight: 500,
              textDecoration: "none",
              border: "1px solid rgba(94,240,138,0.35)",
              borderRadius: "8px",
              padding: "10px 24px",
              transition: "color 0.15s, border-color 0.15s",
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "rgba(94,240,138,0.9)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(94,240,138,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "rgba(94,240,138,0.6)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(94,240,138,0.35)";
            }}
          >
            Inquire
          </Link>
        </section>

        {/* ─── QUESTIONNAIRE SECTION ────────────────────────────────── */}
        {product.show_questionnaire && (
          <section
            data-ocid="product-detail.panel"
            style={{ marginBottom: "64px" }}
          >
            <span style={sectionLabelStyle}>Tell Us About Your Project</span>
            {isCinematic && <AdsBuilderPage />}
            {isProductLab && !isCinematic && !isReceptionist && (
              <ProductLabBriefPage />
            )}
            {isReceptionist && <AiReceptionistForm />}
          </section>
        )}

        {/* ─── CHECKOUT CTA ─────────────────────────────────────────── */}
        <motion.section
          data-ocid="product-detail.section"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            padding: "64px 48px",
            background: "rgba(7,8,16,0.9)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "20px",
            textAlign: "center",
            boxShadow: "0 0 60px rgba(94,240,138,0.06)",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              color: "rgba(94,240,138,0.6)",
              padding: "6px 20px",
              border: "1px solid rgba(94,240,138,0.2)",
              borderRadius: "9999px",
              background: "rgba(94,240,138,0.05)",
            }}
          >
            Ready to Launch
          </span>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
              fontWeight: 900,
              color: "#EEF0F8",
              margin: 0,
              letterSpacing: "-0.02em",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {resolvedClosingCTA || "Ready to Get Started?"}
          </h2>
          {!resolvedClosingCTA && (
            <p
              style={{
                color: "#7A7D90",
                fontSize: "1rem",
                margin: 0,
                maxWidth: "440px",
                lineHeight: 1.75,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {displayPrice && `${displayPrice} — `}No contracts. Cancel
              anytime.
            </p>
          )}
          <GetStartedButton product={product} />
        </motion.section>
      </div>
    </div>
  );
}
