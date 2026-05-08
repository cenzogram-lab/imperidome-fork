import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { MarqueeLogo, Review, backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { getSession } from "../hooks/useSession";
import { useCartStore } from "../store/useCartStore";
import { useSiteTextStore } from "../store/useSiteTextStore";
import EditableText from "./EditableText";
import { Footer } from "./Footer";
import HeroPipeline from "./HeroPipeline";
import HomepageCalendarBooking from "./HomepageCalendarBooking";
import LogoMarquee from "./LogoMarquee";
import { VideoCard } from "./VideoCard";

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
  const navLinks = ["Services", "Process", "Results", "Blog"];
  const navHrefs: Record<string, string> = {
    Services: "/services",
    Process: "/process",
    Results: "/our-builds",
    Blog: "/blog",
  };

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  return (
    <>
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

          {/* Mobile hamburger — visible below md (768px) */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: HEADING,
              cursor: "pointer",
              padding: "4px",
              minWidth: "44px",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            data-ocid="hero_navbar.toggle"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <title>Menu</title>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile overlay — fullscreen fixed, z-9999, covers entire viewport */}
      {mobileOpen && (
        <div
          id="hero-mobile-nav-overlay"
          aria-label="Navigation menu"
          data-ocid="hero_navbar.mobile_menu.panel"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            backgroundColor: "#0A0B14",
            backdropFilter: "blur(40px) saturate(1.8)",
            WebkitBackdropFilter: "blur(40px) saturate(1.8)",
            backgroundImage:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(57,255,20,0.04) 0%, transparent 60%)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Header row: logo + close button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 20px 8px",
              flexShrink: 0,
            }}
          >
            <a
              href="/"
              onClick={() => setMobileOpen(false)}
              style={{
                color: "#5EF08A",
                textDecoration: "none",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textShadow:
                  "0 0 4px #39FF14, 0 0 16px rgba(57,255,20,0.6), 0 0 40px rgba(57,255,20,0.3)",
              }}
            >
              IMPERIDOME
            </a>
            {/* X close button */}
            <button
              type="button"
              data-ocid="hero_navbar.mobile_close.button"
              onClick={() => setMobileOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#EEF0F8",
                cursor: "pointer",
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
              }}
              aria-label="Close navigation menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <title>Close</title>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: "1px solid rgba(57,255,20,0.15)",
              margin: "0 20px",
              flexShrink: 0,
            }}
          />

          {/* Nav links */}
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "24px 24px 40px",
              flex: 1,
            }}
          >
            {/* Cart */}
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
                minHeight: "44px",
              }}
              data-ocid="hero_navbar.mobile_cart.button"
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

            {/* Main nav links */}
            {navLinks.map((link) => (
              <a
                key={link}
                href={navHrefs[link]}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  padding: "16px 0",
                  minHeight: "44px",
                  color: MUTED,
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(57,255,20,0.1)",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = HEADING;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = MUTED as string;
                }}
              >
                {link}
              </a>
            ))}

            {/* Login */}
            <a
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: 500,
                padding: "14px 0",
                minHeight: "44px",
                color: "#A0A3B1",
                textDecoration: "none",
                borderBottom: "1px solid rgba(57,255,20,0.1)",
                transition: "color 0.15s",
              }}
              data-ocid="hero_navbar.mobile_login.link"
            >
              Login
            </a>

            {/* Client Portal */}
            <a
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: 600,
                padding: "14px 0",
                minHeight: "44px",
                color: "#39FF14",
                textDecoration: "none",
                borderBottom: "1px solid rgba(57,255,20,0.1)",
                textShadow: "0 0 4px rgba(57,255,20,0.4)",
                transition: "opacity 0.15s",
              }}
              data-ocid="hero_navbar.mobile_clientportal.link"
            >
              <EditableText
                textKey="navbar.client-portal"
                defaultText="Client Portal"
              />
            </a>

            {/* Book a Call — prominent filled green CTA */}
            <div style={{ width: "100%", paddingTop: "16px" }}>
              <a
                href="/intake"
                data-ocid="hero_navbar.mobile_getstarted.button"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  borderRadius: "8px",
                  padding: "16px 24px",
                  minHeight: "56px",
                  textDecoration: "none",
                  background:
                    "conic-gradient(from 135deg, #2dd400, #39FF14 30%, #4fff2a 45%, #39FF14 60%, #2dd400)",
                  color: "#000",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 4px #39FF14, 0 0 20px rgba(57,255,20,0.7), 0 0 50px rgba(57,255,20,0.35), 0 4px 15px rgba(0,0,0,0.5)",
                  transition: "opacity 0.15s",
                }}
              >
                <EditableText
                  textKey="navbar.book-a-call"
                  defaultText="Book a Call"
                />
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const [liveSitesLaunched, setLiveSitesLaunched] = useState<string | null>(
    null,
  );
  const [liveAvgRating, setLiveAvgRating] = useState<string | null>(null);
  const [publicBuilds, setPublicBuilds] = useState<
    {
      id: string;
      clientName: string;
      siteUrl: string;
      addedAt: bigint;
      description?: string;
      category?: string;
      thumbnailUrl?: string;
    }[]
  >([]);
  const [marqueeLogos, setMarqueeLogos] = useState<MarqueeLogo[]>([]);
  const [marqueeLoading, setMarqueeLoading] = useState(false);
  const { actor, isFetching } = useActor();

  const editMode = useSiteTextStore((s) => s.editMode);
  const session = getSession();
  const isAdmin = session?.email === "vincenzo@imperidome.com";

  useEffect(() => {
    // getPublicBuildsCount and getApprovedReviews are public query functions —
    // they don't require an authenticated identity. Use createActorWithConfig
    // to build an anonymous actor directly, so the fetch fires immediately on
    // mount without waiting for useActor's identity resolution (which stays
    // pending for anonymous homepage visitors, blocking the isFetching guard).
    let cancelled = false;

    createActorWithConfig(createActor)
      .then((publicActor) => {
        if (cancelled) return;

        publicActor
          .getPublicBuildsCount()
          .then((count) => {
            if (!cancelled) {
              setLiveSitesLaunched(`${Number(count)}+`);
            }
          })
          .catch(() => {
            // Fall back to CMS value silently
          });

        publicActor
          .getPublicBuilds()
          .then((builds) => {
            if (!cancelled) {
              setPublicBuilds(builds);
            }
          })
          .catch(() => {
            // Fall back silently — portfolio grid stays hidden
          });

        publicActor
          .getApprovedReviews()
          .then((reviews) => {
            if (!cancelled && reviews.length > 0) {
              const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
              const avg = (sum / reviews.length).toFixed(1);
              setLiveAvgRating(`${avg}★`);
            }
            // If no reviews yet, leave null so CMS fallback renders
          })
          .catch(() => {
            // Fall back to CMS value silently
          });

        // Fetch marquee logos (public read)
        if (!cancelled) {
          (publicActor as backendInterface)
            .getMarqueeLogos()
            .then((logos) => {
              if (!cancelled) setMarqueeLogos(logos);
            })
            .catch(() => {
              // Marquee logos unavailable — strip stays hidden
            });
        }
      })
      .catch(() => {
        // Actor creation failed — CMS fallbacks remain visible
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddLogo = async (logoUrl: string, logoLabel: string) => {
    if (!actor || isFetching || !isAdmin || !session) return;
    setMarqueeLoading(true);
    try {
      const res = await (actor as backendInterface).addMarqueeLogo(
        logoUrl,
        logoLabel,
        session.email,
      );
      if ("ok" in res) {
        await createActorWithConfig(createActor)
          .then((pa) =>
            (pa as backendInterface)
              .getMarqueeLogos()
              .then((logos) => setMarqueeLogos(logos))
              .catch(() => {}),
          )
          .catch(() => {});
      } else {
        throw new Error(res.err);
      }
    } finally {
      setMarqueeLoading(false);
    }
  };

  const handleDeleteLogo = async (id: string) => {
    if (!actor || isFetching || !isAdmin || !session) return;
    setMarqueeLoading(true);
    try {
      await (actor as backendInterface).deleteMarqueeLogo(id, session.email);
      await createActorWithConfig(createActor)
        .then((pa) =>
          (pa as backendInterface)
            .getMarqueeLogos()
            .then((logos) => setMarqueeLogos(logos))
            .catch(() => {}),
        )
        .catch(() => {});
    } finally {
      setMarqueeLoading(false);
    }
  };

  const handleReorderLogos = async (orderedIds: string[]) => {
    if (!actor || isFetching || !isAdmin || !session) return;
    setMarqueeLoading(true);
    try {
      await (actor as backendInterface).reorderMarqueeLogos(
        orderedIds,
        session.email,
      );
    } finally {
      setMarqueeLoading(false);
    }
  };

  return (
    <>
      <section
        style={{
          minHeight: "100vh",
          background: BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "68px",
          paddingBottom: "40px",
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
            animation: "grid-move 4s linear infinite",
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
            padding: "0 16px",
            maxWidth: "1200px",
            width: "100%",
            gap: "28px",
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
              fontSize: "clamp(2.8rem, 6vw, 6rem)",
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
              fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
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
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <a
              href="/intake"
              style={{
                background: GREEN,
                color: "#061209",
                fontWeight: 700,
                padding: "14px 24px",
                minHeight: "44px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "15px",
                transition: "opacity 0.2s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
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
                padding: "14px 24px",
                minHeight: "44px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "15px",
                background: "transparent",
                transition: "border-color 0.2s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
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
                defaultText="View the Matrix"
              />
            </a>
            <a
              href="/blog"
              style={{
                border: `1px solid ${GREEN}`,
                color: GREEN,
                padding: "14px 24px",
                minHeight: "44px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "15px",
                background: "transparent",
                transition: "background 0.2s, color 0.2s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
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
              padding: "20px 16px",
              maxWidth: "760px",
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
              {[
                {
                  number: "250+",
                  label: "Sites Launched",
                  numKey: "hero.stat-1-number",
                  labelKey: "hero.stat-1-label",
                  liveValue: liveSitesLaunched,
                },
                {
                  number: "99.9%",
                  label: "Uptime SLA",
                  numKey: "hero.stat-2-number",
                  labelKey: "hero.stat-2-label",
                  liveValue: null,
                },
                {
                  number: "$2.4M",
                  label: "Client Revenue",
                  numKey: "hero.stat-3-number",
                  labelKey: "hero.stat-3-label",
                  liveValue: null,
                },
                {
                  number: "4.9★",
                  label: "Average Rating",
                  numKey: "hero.stat-4-number",
                  labelKey: "hero.stat-4-label",
                  liveValue: liveAvgRating,
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
                    {stat.liveValue !== null ? (
                      stat.liveValue
                    ) : (
                      <EditableText
                        textKey={stat.numKey}
                        defaultText={stat.number}
                      />
                    )}
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

          {/* Portfolio Grid — Our Work */}
          {publicBuilds.length > 0 && (
            <div
              style={{
                width: "100%",
                maxWidth: "1100px",
                marginTop: "8px",
              }}
              data-ocid="hero.portfolio_grid"
            >
              {/* Section heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "24px",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "2px",
                    background: GREEN,
                    boxShadow: "0 0 8px rgba(94,240,138,0.6)",
                  }}
                />
                <span
                  style={{
                    color: GREEN,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    textShadow:
                      "0 0 8px rgba(94,240,138,0.5), 0 0 20px rgba(94,240,138,0.25)",
                  }}
                >
                  Our Work
                </span>
                <div
                  style={{
                    width: "28px",
                    height: "2px",
                    background: GREEN,
                    boxShadow: "0 0 8px rgba(94,240,138,0.6)",
                  }}
                />
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {publicBuilds.map((build, idx) => {
                  let hostname = build.siteUrl;
                  try {
                    hostname = new URL(build.siteUrl).hostname;
                  } catch {
                    // keep raw siteUrl as fallback
                  }
                  return (
                    <div
                      key={build.id}
                      style={{
                        background: "rgba(12,14,26,0.85)",
                        border: "1px solid rgba(94,240,138,0.18)",
                        borderRadius: "12px",
                        padding: "24px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                        textAlign: "center",
                        boxShadow:
                          "0 0 0 1px rgba(94,240,138,0.06), 0 4px 20px rgba(0,0,0,0.45)",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(94,240,138,0.45)";
                        e.currentTarget.style.boxShadow =
                          "0 0 20px rgba(94,240,138,0.2), 0 4px 24px rgba(0,0,0,0.55)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(94,240,138,0.18)";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 1px rgba(94,240,138,0.06), 0 4px 20px rgba(0,0,0,0.45)";
                      }}
                      data-ocid={`hero.portfolio_grid.item.${idx + 1}`}
                    >
                      {/* Thumbnail or globe icon placeholder */}
                      {build.thumbnailUrl ? (
                        <div
                          style={{
                            width: "100%",
                            height: "160px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            flexShrink: 0,
                            border: "1px solid rgba(94,240,138,0.18)",
                          }}
                        >
                          <img
                            src={build.thumbnailUrl}
                            alt={`${build.clientName} site preview`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                            onError={(e) => {
                              const wrapper = e.currentTarget.parentElement;
                              if (wrapper) {
                                wrapper.style.display = "none";
                                const globe = document.createElement("div");
                                globe.style.cssText =
                                  "width:52px;height:52px;border-radius:50%;background:rgba(94,240,138,0.08);border:1px solid rgba(94,240,138,0.28);box-shadow:0 0 12px rgba(94,240,138,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;";
                                globe.setAttribute("aria-hidden", "true");
                                globe.textContent = "🌐";
                                wrapper.insertAdjacentElement(
                                  "afterend",
                                  globe,
                                );
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "50%",
                            background: "rgba(94,240,138,0.08)",
                            border: "1px solid rgba(94,240,138,0.28)",
                            boxShadow: "0 0 12px rgba(94,240,138,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        >
                          🌐
                        </div>
                      )}

                      {/* Client name */}
                      <div
                        style={{
                          color: HEADING,
                          fontWeight: 700,
                          fontSize: "14px",
                          lineHeight: 1.3,
                          letterSpacing: "0.01em",
                        }}
                      >
                        {build.clientName}
                      </div>

                      {/* Category badge — only rendered when present */}
                      {build.category && (
                        <span
                          style={{
                            display: "inline-block",
                            background: "rgba(94,240,138,0.12)",
                            border: "1px solid rgba(94,240,138,0.3)",
                            color: "#5EF08A",
                            fontSize: "10px",
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            textTransform: "uppercase",
                          }}
                        >
                          {build.category}
                        </span>
                      )}

                      {/* Hostname */}
                      <div
                        style={{
                          color: "rgba(156,163,175,0.75)",
                          fontSize: "12px",
                          letterSpacing: "0.02em",
                          wordBreak: "break-all",
                        }}
                      >
                        {hostname}
                      </div>

                      {/* Description — only rendered when present */}
                      {build.description && (
                        <p
                          style={{
                            color: "rgba(156,163,175,0.85)",
                            fontSize: "12px",
                            lineHeight: 1.5,
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textAlign: "center",
                          }}
                        >
                          {build.description}
                        </p>
                      )}

                      {/* Visit Site link */}
                      <a
                        href={build.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginTop: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          color: GREEN,
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                          border: "1px solid rgba(94,240,138,0.3)",
                          borderRadius: "6px",
                          padding: "5px 12px",
                          transition: "background 0.2s, border-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(94,240,138,0.1)";
                          e.currentTarget.style.borderColor =
                            "rgba(94,240,138,0.6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor =
                            "rgba(94,240,138,0.3)";
                        }}
                        data-ocid={`hero.portfolio_grid.visit_link.${idx + 1}`}
                      >
                        Visit Site →
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Logo Marquee — replaces the old trust-bar text strip */}
      <LogoMarquee
        logos={marqueeLogos}
        isEditMode={editMode}
        isAdmin={isAdmin}
        onAddLogo={handleAddLogo}
        onDeleteLogo={handleDeleteLogo}
        onReorderLogos={handleReorderLogos}
        isLoading={marqueeLoading}
      />
    </>
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
        padding: "32px 16px",
        background: BG,
      }}
      data-ocid="referral_cta.section"
    >
      <div
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.01)";
          e.currentTarget.style.border = "1px solid rgba(57,255,20,0.45)";
          e.currentTarget.style.boxShadow =
            "0 0 0 1px rgba(57,255,20,0.45), 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.border = "1px solid rgba(57,255,20,0.25)";
          e.currentTarget.style.boxShadow =
            "0 0 0 1px rgba(57,255,20,0.18), 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)";
        }}
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "rgba(17,19,34,0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(57,255,20,0.25)",
          borderRadius: "16px",
          padding: "28px 20px",
          boxShadow:
            "0 0 0 1px rgba(57,255,20,0.18), 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)",
          transform: "scale(1)",
          transition:
            "transform 0.25s ease, box-shadow 0.25s ease, border 0.25s ease",
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
            padding: "22px 24px",
            minHeight: "44px",
            borderRadius: "14px",
            fontSize: "clamp(16px, 4vw, 22px)",
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
      style={{ background: BG, padding: "60px 16px" }}
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
        padding: "60px 16px",
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
              padding: "18px 24px",
              minHeight: "44px",
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

function StarRating({ rating }: { rating: bigint }) {
  const filled = Number(rating);
  const empty = 5 - filled;
  return (
    <div
      style={{
        color: "#39FF14",
        fontSize: "18px",
        letterSpacing: "2px",
        textShadow: "0 0 8px rgba(57,255,20,0.6), 0 0 20px rgba(57,255,20,0.3)",
      }}
    >
      {"★".repeat(Math.max(0, filled))}
      <span style={{ opacity: 0.35 }}>{"☆".repeat(Math.max(0, empty))}</span>
    </div>
  );
}

function SocialProof() {
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    // getApprovedReviews is a public query — use createActorWithConfig directly
    // so the fetch fires immediately on mount without waiting for useActor's
    // identity resolution, which stays pending for anonymous homepage visitors.
    let cancelled = false;
    createActorWithConfig(createActor)
      .then((publicActor) => {
        if (cancelled) return;
        return publicActor.getApprovedReviews();
      })
      .then((data) => {
        if (!cancelled && data) {
          setApprovedReviews(data);
          setReviewsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cardStyle: React.CSSProperties = {
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
  };

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "scale(1.02)";
    e.currentTarget.style.boxShadow =
      "0 0 0 1px rgba(57,255,20,0.45), 0 16px 56px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1)";
  };
  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "";
    e.currentTarget.style.boxShadow =
      "0 0 0 1px rgba(57,255,20,0.18), 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)";
  };

  const renderContent = () => {
    if (reviewsLoading) {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
          data-ocid="social_proof.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                ...cardStyle,
                gap: "0",
                animation: "pulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  marginBottom: "16px",
                }}
              />
              <div
                style={{
                  width: "100px",
                  height: "14px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.07)",
                  marginBottom: "12px",
                }}
              />
              <div
                style={{
                  width: "80%",
                  height: "12px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.05)",
                  marginBottom: "8px",
                }}
              />
              <div
                style={{
                  width: "60%",
                  height: "12px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.05)",
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    if (approvedReviews.length === 0) {
      return (
        <div
          style={{ display: "flex", justifyContent: "center" }}
          data-ocid="social_proof.empty_state"
        >
          <div
            style={{
              ...cardStyle,
              maxWidth: "480px",
              width: "100%",
              padding: "48px 32px",
            }}
          >
            <div
              style={{
                color: "#39FF14",
                fontSize: "32px",
                opacity: 0.5,
              }}
            >
              ★★★★★
            </div>
            <p
              style={{
                color: MUTED,
                fontSize: "15px",
                lineHeight: 1.7,
                margin: 0,
                fontStyle: "italic",
              }}
            >
              Client reviews coming soon. Check back after we complete a few
              more builds!
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {approvedReviews.map((review, idx) => {
          const displayName = review.clientName?.trim()
            ? review.clientName
            : review.clientEmail;

          return (
            <div
              key={review.id}
              style={cardStyle}
              data-ocid={`sovereign_review.item.${idx + 1}`}
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            >
              {/* Avatar initials circle */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(57,255,20,0.1)",
                  border: "2px solid #39FF14",
                  boxShadow: "0 0 12px rgba(57,255,20,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#39FF14",
                  flexShrink: 0,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>

              {/* Star rating */}
              <StarRating rating={review.rating} />

              {/* Review text */}
              <p
                style={{
                  color: HEADING,
                  fontSize: "15px",
                  lineHeight: 1.7,
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                {review.reviewText}
              </p>

              {/* Name + Job title */}
              <div style={{ marginTop: "4px" }}>
                <div
                  style={{
                    color: HEADING,
                    fontWeight: 700,
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}
                >
                  {displayName}
                </div>
                {review.jobTitle?.trim() && (
                  <div style={{ color: MUTED, fontSize: "13px" }}>
                    {review.jobTitle}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
            marginBottom: approvedReviews.length > 0 ? "20px" : "48px",
          }}
        >
          <EditableText
            textKey="social-proof.heading"
            defaultText="Sovereign Reviews"
          />
        </h2>

        {/* Review count badge — only shown when reviews exist */}
        {approvedReviews.length > 0 &&
          (() => {
            const avgRating = (
              approvedReviews.reduce((acc, r) => acc + Number(r.rating), 0) /
              approvedReviews.length
            ).toFixed(1);
            return (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "40px",
                }}
                data-ocid="social_proof.rating_badge"
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(57,255,20,0.07)",
                    border: "1px solid rgba(57,255,20,0.28)",
                    borderRadius: "999px",
                    padding: "8px 20px",
                    boxShadow:
                      "0 0 12px rgba(57,255,20,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      color: "#39FF14",
                      fontSize: "16px",
                      lineHeight: 1,
                      textShadow:
                        "0 0 8px rgba(57,255,20,0.6), 0 0 20px rgba(57,255,20,0.3)",
                    }}
                  >
                    ★
                  </span>
                  <span
                    style={{
                      color: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {avgRating}
                  </span>
                  <span
                    style={{
                      width: "1px",
                      height: "12px",
                      background: "rgba(255,255,255,0.2)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: "rgba(200,205,220,0.85)",
                      fontSize: "13px",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {approvedReviews.length}{" "}
                    {approvedReviews.length === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>
            );
          })()}

        {renderContent()}
      </div>
    </motion.section>
  );
}

// ─── Video Showcase ───────────────────────────────────────────────────────────
function VideoShowcaseSection() {
  const getText = useSiteTextStore((s) => s.getText);
  const fetchAllSiteText = useSiteTextStore((s) => s.fetchAllSiteText);

  // Hydrate the site text store for public homepage visitors — the store is
  // otherwise only populated by admin routes and the 7 showcase pages.
  // createActorWithConfig bypasses the useActor identity-resolution layer so
  // the fetch fires immediately without waiting for a logged-in identity.
  useEffect(() => {
    let cancelled = false;
    createActorWithConfig(createActor)
      .then((publicActor) => {
        if (!cancelled) fetchAllSiteText(publicActor);
      })
      .catch(() => {
        // Actor creation failed — getText will return default values silently
      });
    return () => {
      cancelled = true;
    };
  }, [fetchAllSiteText]);

  const rawUrl = getText("homepage_video_url", "");
  const videoUrl = rawUrl.trim() !== "" ? rawUrl.trim() : undefined;

  return (
    <motion.section
      {...fadeUp}
      style={{
        background: "rgba(14,16,32,1)",
        padding: "96px 24px",
        borderTop: BORDER,
        borderBottom: BORDER,
      }}
      data-ocid="homepage_video.section"
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Section label */}
        <h2
          style={{
            ...gradientWarm,
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "40px",
            textShadow:
              "0 0 30px rgba(57,255,20,0.25), 1px 2px 0 rgba(0,0,0,0.9), 2px 3px 0 rgba(0,0,0,0.6)",
          }}
        >
          <EditableText
            textKey="homepage_video_section_label"
            defaultText="Watch Imperidome in action"
          />
        </h2>

        {/* Video card */}
        <VideoCard
          videoUrl={videoUrl}
          title={videoUrl ? undefined : undefined}
        />
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
              href="/intake"
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
              href="/intake"
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

// ─── Enter The Dome CTA ───────────────────────────────────────────────────────
function EnterTheDomeCTA() {
  return (
    <section
      style={{
        background: BG,
        padding: "80px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <style>{`
        @keyframes domeGlow {
          0%, 100% {
            box-shadow: 0 0 8px #39FF14, 0 0 20px rgba(57,255,20,0.3), 0 0 40px rgba(57,255,20,0.1);
          }
          50% {
            box-shadow: 0 0 16px #39FF14, 0 0 40px rgba(57,255,20,0.5), 0 0 80px rgba(57,255,20,0.25);
          }
        }
        .dome-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 0 20px #39FF14, 0 0 50px rgba(57,255,20,0.6), 0 0 100px rgba(57,255,20,0.3) !important;
        }
        .dome-btn {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
      `}</style>

      {/* Separator line above */}
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          height: "1px",
          background: "rgba(57,255,20,0.3)",
          marginBottom: "80px",
        }}
      />

      <a
        href="/the-dome"
        className="dome-btn"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: "768px",
          padding: "48px 32px",
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid #39FF14",
          borderRadius: "16px",
          textDecoration: "none",
          cursor: "pointer",
          animation: "domeGlow 2.5s ease-in-out infinite",
          gap: "12px",
        }}
        data-ocid="enter-the-dome-btn"
      >
        <span
          style={{
            color: "#39FF14",
            fontSize: "clamp(2rem, 6vw, 3.75rem)",
            fontWeight: 900,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          <EditableText
            textKey="enter-dome.heading"
            defaultText="ENTER THE DOME"
          />
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "clamp(0.875rem, 2vw, 1rem)",
            letterSpacing: "0.1em",
            textAlign: "center",
            fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
          }}
        >
          <EditableText
            textKey="enter-dome.subtext"
            defaultText="View Our Sovereign Hosting Infrastructure"
          />
        </span>
      </a>
    </section>
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
      <HomepageCalendarBooking />
      <ReferralCTA />
      <EnterTheDomeCTA />
      <WhatWeBuild />
      <HeroPipeline />
      <SocialProof />
      <VideoShowcaseSection />
      <AuditConsultBox />
      <FinalCTA />
      <ScrollingTicker />
      <FAQSection />
      <Footer />
    </div>
  );
}
