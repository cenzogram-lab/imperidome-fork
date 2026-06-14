import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useCartStore } from "../store/useCartStore";
import { useSiteTextStore } from "../store/useSiteTextStore";
import EditableText from "./EditableText";
import { Footer } from "./Footer";
import HeroPipeline from "./HeroPipeline";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const BG = "#0A0B14";
const CARD_BG = "rgba(17,19,34,0.7)";
const BORDER = "1px solid #1C1F33";
const GREEN = "#5EF08A";
const HEADING = "#FFFFFF";
const MUTED = "rgba(156,163,175,0.9)";

const gradientWarm: React.CSSProperties = {
  color: "#FFFFFF",
};

const glassCard: React.CSSProperties = {
  background: CARD_BG,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: BORDER,
  borderRadius: "12px",
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
function HeroNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items, openDrawer } = useCartStore();
  const navLinks = ["Services", "Process", "Results", "Blog", "Login"];
  const navHrefs: Record<string, string> = {
    Services: "/services",
    Process: "/process",
    Results: "/our-builds",
    Blog: "/blog",
    Login: "/login",
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(10,11,20,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: BORDER,
      }}
      data-ocid="hero_navbar"
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
          data-ocid="hero_navbar.link"
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: GREEN,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "#5EF08A",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            <EditableText textKey="navbar.logo" defaultText="IMPERIDOME" />
          </span>
        </a>

        {/* Desktop Nav */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "32px" }}
          className="hidden md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link}
              href={navHrefs[link]}
              style={{
                color: MUTED,
                textDecoration: "none",
                fontSize: "14px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = HEADING;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = MUTED as string;
              }}
              data-ocid="hero_navbar.link"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Cart icon */}
        <button
          type="button"
          onClick={openDrawer}
          className="relative hidden md:inline-flex p-2 rounded-lg hover:bg-white/10 transition-colors"
          style={{
            color: "#EEF0F8",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Open cart"
          data-ocid="hero_navbar.cart.button"
        >
          <ShoppingBag className="w-5 h-5" />
          {items.length > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: "#5EF08A" }}
            />
          )}
        </button>

        {/* Client Portal */}
        <a
          href="/login"
          className="hidden md:inline-flex"
          style={{
            background: "#5EF08A",
            color: "#0A0B14",
            fontWeight: 600,
            borderRadius: "12px",
            padding: "8px 16px",
            fontSize: "12px",
            textDecoration: "none",
          }}
          data-ocid="hero_navbar.client_portal_button"
        >
          <EditableText
            textKey="navbar.client-portal"
            defaultText="Client Portal"
          />
        </a>

        {/* Book a Call */}
        <a
          href="/intake"
          className="hidden md:inline-flex"
          style={{
            border: `1px solid ${GREEN}`,
            color: GREEN,
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = GREEN;
            e.currentTarget.style.color = "#061209";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = GREEN;
          }}
          data-ocid="hero_navbar.primary_button"
        >
          <EditableText
            textKey="navbar.book-a-call"
            defaultText="Book a Call"
          />
        </a>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: "none",
            border: "none",
            color: HEADING,
            cursor: "pointer",
            fontSize: "22px",
            padding: "4px",
          }}
          data-ocid="hero_navbar.toggle"
          aria-label="Toggle menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: BG, borderBottom: BORDER, overflow: "hidden" }}
          >
            <div
              style={{
                padding: "16px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* View Cart */}
              <button
                type="button"
                onClick={() => {
                  openDrawer();
                  setMobileOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  color: "#EEF0F8",
                  fontSize: "1rem",
                  fontWeight: 600,
                  padding: "12px 0",
                  cursor: "pointer",
                }}
                data-ocid="hero_navbar.cart.button"
              >
                <ShoppingBag style={{ width: "18px", height: "18px" }} />
                <EditableText
                  textKey="navbar.view-cart"
                  defaultText="View Cart"
                  as="span"
                />
                {items.length > 0 && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#5EF08A",
                      marginLeft: "4px",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={navHrefs[link]}
                  style={{
                    color: MUTED,
                    textDecoration: "none",
                    fontSize: "15px",
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link}
                </a>
              ))}
              <a
                href="/intake"
                style={{
                  border: `1px solid ${GREEN}`,
                  color: GREEN,
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                }}
                onClick={() => setMobileOpen(false)}
              >
                <EditableText
                  textKey="navbar.book-a-call"
                  defaultText="Book a Call"
                />
              </a>
              <a
                href="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block",
                  background: "#5EF08A",
                  color: "#0A0B14",
                  fontWeight: 600,
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  textDecoration: "none",
                  textAlign: "center",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                data-ocid="hero_navbar.client_portal_button"
              >
                <EditableText
                  textKey="navbar.client-portal"
                  defaultText="Client Portal"
                />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "80px",
        position: "relative",
        overflow: "hidden",
      }}
      data-ocid="hero.section"
    >
      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(28,31,51,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(28,31,51,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          animation: "grid-move 10s linear infinite",
          pointerEvents: "none",
        }}
      />
      {/* Green glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(94,240,138,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        {...fadeUp}
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 24px",
          maxWidth: "900px",
          gap: "24px",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid rgba(94,240,138,0.3)",
            background: "rgba(94,240,138,0.08)",
            borderRadius: "999px",
            padding: "6px 16px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: GREEN,
              flexShrink: 0,
              animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          />
          <span style={{ color: GREEN, fontSize: "13px", fontWeight: 500 }}>
            <EditableText
              textKey="hero.badge"
              defaultText="Managed Web Infrastructure"
            />
          </span>
        </div>

        {/* H1 */}
        <h1
          style={{
            ...gradientWarm,
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          <EditableText
            textKey="hero.heading"
            defaultText="The Infrastructure for Sovereign Business"
          />
        </h1>

        {/* Subtext */}
        <p
          style={{
            color: MUTED,
            fontSize: "1.2rem",
            maxWidth: "640px",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          <EditableText
            textKey="hero.subheading"
            defaultText="We architect revenue-generating digital assets for business owners who refuse to rent their future."
          />
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <a
            href="/get-started?intent=consultation"
            style={{
              background: GREEN,
              color: "#061209",
              fontWeight: 700,
              padding: "16px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "15px",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            data-ocid="hero.primary_button"
          >
            <EditableText
              textKey="hero.cta-primary"
              defaultText="Get Started"
            />
          </a>
          <a
            href="/services"
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              color: HEADING,
              padding: "16px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "15px",
              background: "transparent",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
            data-ocid="hero.secondary_button"
          >
            <EditableText
              textKey="hero.cta-secondary"
              defaultText="View Services"
            />
          </a>
          <a
            href="/blog"
            style={{
              border: `1px solid ${GREEN}`,
              color: GREEN,
              padding: "16px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "15px",
              background: "transparent",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(57,255,20,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            data-ocid="hero.blog_button"
          >
            <EditableText textKey="hero.cta-blog" defaultText="Read Blog" />
          </a>
        </div>

        {/* Social Proof Glass Card */}
        <motion.div
          whileHover={{
            scale: 1.03,
            boxShadow:
              "0 0 0 1px rgba(57,255,20,0.35), 0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
          transition={{ duration: 0.22 }}
          style={{
            ...glassCard,
            padding: "24px 28px",
            maxWidth: "480px",
            width: "100%",
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
          data-ocid="hero.social_proof_card"
        >
          {/* Card header chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#39FF14",
                boxShadow:
                  "0 0 4px rgba(57,255,20,0.8), 0 0 12px rgba(57,255,20,0.4)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: "#39FF14",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textShadow:
                  "0 0 8px rgba(57,255,20,0.6), 0 0 20px rgba(57,255,20,0.3)",
              }}
            >
              <EditableText
                textKey="hero.social-proof-label"
                defaultText="Social Proof"
              />
            </span>
          </div>
          {/* Stats grid: 2x2 on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
            {[
              {
                number: "250+",
                label: "Sites Launched",
                numKey: "hero.stat-1-number",
                labelKey: "hero.stat-1-label",
              },
              {
                number: "99.9%",
                label: "Uptime SLA",
                numKey: "hero.stat-2-number",
                labelKey: "hero.stat-2-label",
              },
              {
                number: "$2.4M",
                label: "Client Revenue",
                numKey: "hero.stat-3-number",
                labelKey: "hero.stat-3-label",
              },
              {
                number: "4.9★",
                label: "Average Rating",
                numKey: "hero.stat-4-number",
                labelKey: "hero.stat-4-label",
              },
            ].map((stat) => (
              <div key={stat.labelKey} style={{ textAlign: "center" }}>
                <div
                  style={{
                    color: "#FFFFFF",
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <EditableText
                    textKey={stat.numKey}
                    defaultText={stat.number}
                  />
                </div>
                <div
                  style={{
                    color: "rgba(200,205,220,0.85)",
                    fontSize: "11px",
                    fontWeight: 500,
                    marginTop: "5px",
                    letterSpacing: "0.02em",
                    lineHeight: 1.3,
                  }}
                >
                  <EditableText
                    textKey={stat.labelKey}
                    defaultText={stat.label}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust bar */}
        <p
          style={{
            color: "rgba(156,163,175,0.6)",
            fontSize: "13px",
            margin: 0,
            letterSpacing: "0.03em",
          }}
        >
          <EditableText
            textKey="hero.trust-bar"
            defaultText="100% Client Ownership · 0% Commissions · Sovereign Infrastructure"
          />
        </p>
      </motion.div>
    </section>
  );
}

// ─── Referral CTA ─────────────────────────────────────────────────────────────
function ReferralCTA() {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      style={{
        background: "rgba(14,16,32,1)",
        borderTop: BORDER,
        borderBottom: BORDER,
        padding: "48px 24px",
      }}
      data-ocid="referral_cta.section"
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Referral Button */}
        <a
          href="/referral"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            width: "100%",
            maxWidth: "800px",
            padding: "28px 64px",
            borderRadius: "14px",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "0.06em",
            textDecoration: "none",
            cursor: "pointer",
            background:
              "conic-gradient(from 135deg, #1a1a2e, #16213e, #0f3460, #16213e, #1a1a2e)",
            border: "1px solid rgba(57,255,20,0.45)",
            color: "#39FF14",
            textShadow:
              "0 0 8px rgba(57,255,20,0.6), 0 0 20px rgba(57,255,20,0.3)",
            boxShadow: hovered
              ? "0 0 4px rgba(57,255,20,1), 0 0 20px rgba(57,255,20,0.7), 0 0 60px rgba(57,255,20,0.35), 0 12px 40px rgba(0,0,0,0.5)"
              : "0 0 4px rgba(57,255,20,0.5), 0 0 16px rgba(57,255,20,0.25), 0 4px 24px rgba(0,0,0,0.4)",
            transform: hovered ? "scale(1.02)" : "scale(1)",
            transition:
              "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
          }}
          data-ocid="referral_cta.button"
        >
          {/* Light sweep overlay on hover */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: hovered
                ? "linear-gradient(45deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)"
                : "transparent",
              backgroundSize: "200% 200%",
              transition: "background 0.3s ease",
              pointerEvents: "none",
              borderRadius: "inherit",
            }}
          />
          <EditableText
            textKey="referral.button-label"
            defaultText="Referral Program"
          />
        </a>

        {/* Subtext */}
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 500,
            color: "#FFFFFF",
            textAlign: "center",
            lineHeight: 1.5,
          }}
          data-ocid="referral_cta.subtext"
        >
          <EditableText
            textKey="referral.subtext-prefix"
            defaultText="Refer a friend, Host your site for"
          />{" "}
          <span
            style={{
              color: "#39FF14",
              fontWeight: 800,
              textShadow:
                "0 0 8px rgba(57,255,20,0.8), 0 0 20px rgba(57,255,20,0.4)",
            }}
          >
            <EditableText
              textKey="referral.subtext-highlight"
              defaultText="FREE!"
            />
          </span>
        </p>
      </div>
    </motion.section>
  );
}

// ─── What We Build ────────────────────────────────────────────────────────────
const DOME_CARD_CSS = `
@keyframes neonPulse {
  0%, 100% { border-color: rgba(57,255,20,0.15); box-shadow: 0 0 8px rgba(57,255,20,0.1); }
  50% { border-color: rgba(57,255,20,0.45); box-shadow: 0 0 24px rgba(57,255,20,0.25); }
}
.dome-card { animation: neonPulse 2.5s ease-in-out infinite; }
`;

function useDomeCardStyles() {
  useEffect(() => {
    const id = "dome-card-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = DOME_CARD_CSS;
    document.head.appendChild(el);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);
}

function WhatWeBuild() {
  useDomeCardStyles();

  const items = [
    {
      titleKey: "what-we-build.item-1.title",
      descKey: "what-we-build.item-1.desc",
      title: "Custom Sites",
      desc: "Fully custom-coded websites engineered to convert",
    },
    {
      titleKey: "what-we-build.item-2.title",
      descKey: "what-we-build.item-2.desc",
      title: "Speedy Sites",
      desc: "Launch in 48 hours, not 48 days",
    },
    {
      titleKey: "what-we-build.item-3.title",
      descKey: "what-we-build.item-3.desc",
      title: "AI Receptionists",
      desc: "Never miss a lead — AI answers your calls 24/7",
    },
    {
      titleKey: "what-we-build.item-4.title",
      descKey: "what-we-build.item-4.desc",
      title: "Ads",
      desc: "Scroll-stopping video ads that drive real ROI",
    },
  ];

  return (
    <motion.section
      {...fadeUp}
      style={{ background: BG, padding: "96px 24px" }}
      data-ocid="what_we_build.section"
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2
          style={{
            ...gradientWarm,
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "12px",
            textShadow:
              "0 0 30px rgba(57,255,20,0.25), 1px 2px 0 rgba(0,0,0,0.9), 2px 3px 0 rgba(0,0,0,0.6)",
          }}
        >
          <EditableText
            textKey="what-we-build.heading"
            defaultText="What We Build"
          />
        </h2>
        <p
          style={{
            color: MUTED,
            textAlign: "center",
            marginBottom: "48px",
            fontSize: "16px",
          }}
        >
          <EditableText
            textKey="what-we-build.subheading"
            defaultText="Four services. One mission — give you assets that work while you sleep."
          />
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "28px",
          }}
        >
          {items.map((item, i) => (
            <motion.div
              key={item.titleKey}
              className="dome-card"
              whileHover={{
                borderColor: "rgba(57,255,20,0.8)",
                boxShadow:
                  "0 0 20px rgba(57,255,20,0.3), 0 0 60px rgba(57,255,20,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
                scale: 1.02,
              }}
              style={{
                background: "rgba(5,8,16,0.85)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(57,255,20,0.15)",
                borderRadius: "16px",
                padding: "36px",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
                transition: "box-shadow 0.3s, border-color 0.3s",
              }}
              data-ocid={`what_we_build.item.${i + 1}`}
            >
              {/* Neon sheen overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(160deg, rgba(57,255,20,0.03) 0%, transparent 40%)",
                  pointerEvents: "none",
                  borderRadius: "16px",
                }}
              />
              <h3
                style={{
                  color: "#FFFFFF",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                  textShadow:
                    "0 0 20px rgba(57,255,20,0.4), 1px 1px 0 rgba(0,0,0,0.8)",
                }}
              >
                <EditableText
                  textKey={item.titleKey}
                  defaultText={item.title}
                />
              </h3>
              {/* Neon underline accent */}
              <div
                style={{
                  width: "24px",
                  height: "2px",
                  background: "#39FF14",
                  marginBottom: "16px",
                  boxShadow: "0 0 8px rgba(57,255,20,0.6)",
                }}
              />
              <p
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                  letterSpacing: "0.02em",
                  margin: 0,
                  marginTop: "16px",
                }}
              >
                <EditableText textKey={item.descKey} defaultText={item.desc} />
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
export function HowItWorksSection() {
  return (
    <section
      style={{
        background: "rgba(14,16,32,1)",
        padding: "96px 24px",
        borderTop: BORDER,
        borderBottom: BORDER,
      }}
      data-ocid="how_it_works.section"
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2
          style={{
            ...gradientWarm,
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "32px",
          }}
        >
          <EditableText textKey="how-it-works.heading" defaultText="Process" />
        </h2>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link
            to="/process"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: "720px",
              padding: "24px 64px",
              border: `1px solid ${GREEN}`,
              color: GREEN,
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "rgba(94,240,138,0.04)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              transition: "background 0.2s, box-shadow 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "rgba(94,240,138,0.1)";
              el.style.boxShadow = "0 0 24px rgba(57,255,20,0.35)";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "rgba(94,240,138,0.04)";
              el.style.boxShadow = "none";
              el.style.transform = "translateY(0)";
            }}
            data-ocid="how_it_works.process_button"
          >
            <EditableText
              textKey="how-it-works.button-label"
              defaultText="View Our Process"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Sovereign Testimonials ───────────────────────────────────────────────────
const GRAY_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23333'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-size='28' font-family='sans-serif'%3E%3F%3C/text%3E%3C/svg%3E";

const SOVEREIGN_CARDS = [
  {
    photoKey: "testimonial_1_photo",
    quoteKey: "testimonial_1_quote",
    nameKey: "testimonial_1_name",
    titleKey: "testimonial_1_title",
    ocid: "sovereign_review.item.1",
  },
  {
    photoKey: "testimonial_2_photo",
    quoteKey: "testimonial_2_quote",
    nameKey: "testimonial_2_name",
    titleKey: "testimonial_2_title",
    ocid: "sovereign_review.item.2",
  },
  {
    photoKey: "testimonial_3_photo",
    quoteKey: "testimonial_3_quote",
    nameKey: "testimonial_3_name",
    titleKey: "testimonial_3_title",
    ocid: "sovereign_review.item.3",
  },
];

function SocialProof() {
  const { editMode, getText } = useSiteTextStore();

  return (
    <motion.section
      {...fadeUp}
      style={{ background: BG, padding: "96px 24px" }}
      data-ocid="social_proof.section"
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2
          style={{
            ...gradientWarm,
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "48px",
          }}
        >
          <EditableText textKey="social-proof.heading" defaultText="Reviews" />
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {SOVEREIGN_CARDS.map((card) => {
            const photoSrc = getText(card.photoKey, GRAY_PLACEHOLDER);

            return (
              <div
                key={card.ocid}
                style={{
                  ...glassCard,
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "16px",
                  boxShadow:
                    "0 0 0 1px rgba(57,255,20,0.18), 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                data-ocid={card.ocid}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "scale(1.02)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 0 0 1px rgba(57,255,20,0.45), 0 16px 56px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 0 0 1px rgba(57,255,20,0.18), 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)";
                }}
              >
                {/* Profile photo */}
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={photoSrc}
                    alt="Client profile"
                    width={80}
                    height={80}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #39FF14",
                      boxShadow: "0 0 12px rgba(57,255,20,0.4)",
                      display: "block",
                    }}
                  />
                </div>

                {/* Photo edit label — admin-only, visible only in edit mode */}
                {editMode && (
                  <EditableText
                    textKey={card.photoKey}
                    defaultText={GRAY_PLACEHOLDER}
                    as="button"
                    style={{
                      background: "rgba(57,255,20,0.1)",
                      border: "1px dashed #39FF14",
                      borderRadius: "6px",
                      color: "#39FF14",
                      fontSize: "11px",
                      padding: "3px 10px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      marginTop: "-8px",
                    }}
                  />
                )}

                {/* 5-star rating */}
                <div
                  style={{
                    color: "#39FF14",
                    fontSize: "18px",
                    letterSpacing: "2px",
                    textShadow:
                      "0 0 8px rgba(57,255,20,0.6), 0 0 20px rgba(57,255,20,0.3)",
                  }}
                >
                  ★★★★★
                </div>

                {/* Quote */}
                <p
                  style={{
                    color: HEADING,
                    fontSize: "15px",
                    lineHeight: 1.7,
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  <EditableText
                    textKey={card.quoteKey}
                    defaultText="Click to add your testimonial quote here."
                  />
                </p>

                {/* Name + Title */}
                <div style={{ marginTop: "4px" }}>
                  <div
                    style={{
                      color: HEADING,
                      fontWeight: 700,
                      fontSize: "15px",
                      marginBottom: "4px",
                    }}
                  >
                    <EditableText
                      textKey={card.nameKey}
                      defaultText="Client Name"
                    />
                  </div>
                  <div style={{ color: MUTED, fontSize: "13px" }}>
                    <EditableText
                      textKey={card.titleKey}
                      defaultText="Title / Company"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

// ─── Already Have a Website ───────────────────────────────────────────────────
// ─── Audit Highlight ─────────────────────────────────────────────────────────
function AuditConsultBox() {
  return (
    <motion.section
      {...fadeUp}
      style={{
        background: "rgba(14,16,32,1)",
        padding: "80px 24px",
        borderTop: BORDER,
        borderBottom: BORDER,
      }}
      data-ocid="audit_consult_box.section"
    >
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "16px",
            padding: "48px 40px",
            background: "rgba(20,22,40,0.85)",
            textAlign: "center",
          }}
          data-ocid="audit_consult_box.card"
        >
          <span
            style={{
              display: "inline-block",
              color: "#39FF14",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              marginBottom: "20px",
              textTransform: "uppercase",
              textShadow:
                "0 0 8px rgba(57,255,20,0.7), 0 0 20px rgba(57,255,20,0.4)",
            }}
          >
            <EditableText
              textKey="audit-box.eyebrow"
              defaultText="Already have a website?"
            />
          </span>
          <h2
            style={{
              ...gradientWarm,
              fontSize: "2.2rem",
              fontWeight: 800,
              marginBottom: "14px",
              lineHeight: 1.2,
            }}
          >
            <EditableText
              textKey="audit-box.heading"
              defaultText="Stop flying blind."
            />
          </h2>
          <p
            style={{
              color: MUTED,
              fontSize: "16px",
              marginBottom: "36px",
              maxWidth: "520px",
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            <EditableText
              textKey="audit-box.body"
              defaultText="Get a professional performance, SEO, and conversion breakdown of your current site — or schedule a free strategy session."
            />
          </p>
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/get-started?intent=audit&pay=true"
              style={{
                background: GREEN,
                color: "#061209",
                fontWeight: 700,
                padding: "16px 32px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "15px",
                minWidth: "200px",
                display: "inline-block",
                textAlign: "center",
              }}
              data-ocid="audit_consult_box.audit_button"
            >
              <EditableText
                textKey="audit-box.audit-button"
                defaultText="$99 Site Audit"
              />
            </a>
            <a
              href="/get-started?intent=consultation"
              style={{
                border: "1px solid rgba(255,255,255,0.25)",
                color: HEADING,
                padding: "16px 32px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "15px",
                background: "transparent",
                minWidth: "200px",
                display: "inline-block",
                textAlign: "center",
              }}
              data-ocid="audit_consult_box.consultation_button"
            >
              <EditableText
                textKey="audit-box.consult-button"
                defaultText="Free Consultation"
              />
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <motion.section
      {...fadeUp}
      style={{
        background: BG,
        padding: "120px 24px",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
      data-ocid="final_cta.section"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(94,240,138,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            ...gradientWarm,
            fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
            fontWeight: 800,
            marginBottom: "16px",
          }}
        >
          <EditableText
            textKey="final-cta.heading"
            defaultText="Ready to own your digital future?"
          />
        </h2>
        <p style={{ color: MUTED, fontSize: "16px", marginBottom: "36px" }}>
          <EditableText
            textKey="final-cta.subheading"
            defaultText="Join 250+ business owners who chose sovereignty over dependency."
          />
        </p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/services"
            style={{
              background: GREEN,
              color: "#061209",
              fontWeight: 700,
              padding: "16px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "15px",
            }}
            data-ocid="final_cta.primary_button"
          >
            <EditableText
              textKey="final-cta.button"
              defaultText="View Services"
            />
          </a>
        </div>
      </div>
    </motion.section>
  );
}

// ─── Scrolling Ticker ─────────────────────────────────────────────────────────
function ScrollingTicker() {
  const industries = [
    "Restaurants",
    "Med Spas",
    "Contractors",
    "Law Firms",
    "Dental Offices",
    "Real Estate",
    "E-Commerce",
    "Fitness Studios",
    "Salons",
    "Consulting Firms",
  ];

  const items = industries.map((n, i) => ({ n, id: i }));
  const doubled = [
    ...items.map((x) => ({ ...x, id: x.id })),
    ...items.map((x) => ({ ...x, id: x.id + 100 })),
  ];

  return (
    <div
      style={{
        background: "rgba(14,16,32,1)",
        borderTop: BORDER,
        borderBottom: BORDER,
        padding: "16px 0",
        overflow: "hidden",
      }}
      data-ocid="ticker.section"
    >
      <div className="imperidome-ticker-inner">
        {doubled.map((item) => (
          <span
            key={item.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
            }}
          >
            {item.n}
            <span style={{ color: GREEN, fontSize: "8px" }}>●</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = [
  {
    qKey: "faq.item-1.question",
    aKey: "faq.item-1.answer",
    q: "Do I own my website?",
    a: "Yes. 100%. Every line of code, every image, every domain — it's yours. We hand over full ownership on delivery.",
  },
  {
    qKey: "faq.item-2.question",
    aKey: "faq.item-2.answer",
    q: "How fast can I get a site?",
    a: "Speedy Sites launch within 48 hours. Custom builds typically take 7–21 days depending on complexity.",
  },
  {
    qKey: "faq.item-3.question",
    aKey: "faq.item-3.answer",
    q: "What if I need changes after launch?",
    a: "We offer maintenance plans starting at $29/mo, or you can request one-off edits at any time.",
  },
  {
    qKey: "faq.item-4.question",
    aKey: "faq.item-4.answer",
    q: "Do you take a percentage of my revenue?",
    a: "Never. 0% commissions. What you earn is yours.",
  },
];

function FAQItem({
  qKey,
  aKey,
  q,
  a,
}: { qKey: string; aKey: string; q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: BORDER }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: HEADING,
          fontSize: "16px",
          fontWeight: 500,
          textAlign: "left",
          gap: "16px",
        }}
        aria-expanded={open}
        data-ocid="faq.toggle"
      >
        <span>
          <EditableText textKey={qKey} defaultText={q} as="span" />
        </span>
        <span
          style={{
            color: GREEN,
            fontSize: "20px",
            flexShrink: 0,
            lineHeight: 1,
            transition: "transform 0.2s",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: "14px",
                lineHeight: 1.7,
                paddingBottom: "20px",
                margin: 0,
              }}
            >
              <EditableText textKey={aKey} defaultText={a} />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection() {
  return (
    <motion.section
      {...fadeUp}
      style={{ background: BG, padding: "96px 24px" }}
      data-ocid="faq.section"
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h2
          style={{
            ...gradientWarm,
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "48px",
          }}
        >
          <EditableText
            textKey="faq.heading"
            defaultText="Frequently Asked Questions"
          />
        </h2>
        {faqs.map((faq) => (
          <FAQItem
            key={faq.qKey}
            qKey={faq.qKey}
            aKey={faq.aKey}
            q={faq.q}
            a={faq.a}
          />
        ))}
      </div>
    </motion.section>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ImperidomeHero() {
  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
      }}
    >
      <HeroNavbar />
      <HeroSection />
      <ReferralCTA />
      <WhatWeBuild />
      <HeroPipeline />
      <SocialProof />
      <AuditConsultBox />
      <FinalCTA />
      <ScrollingTicker />
      <FAQSection />
      <Footer />
    </div>
  );
}
