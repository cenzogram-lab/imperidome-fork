import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import type { MarqueeLogo, Review, backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { ANNOUNCEMENT_DISMISSED_KEY } from "../constants";
import { useActor } from "../hooks/useActor";
import { getSession } from "../hooks/useSession";
import { useCartStore } from "../store/useCartStore";
import { useSiteTextStore } from "../store/useSiteTextStore";
import AnnouncementBanner from "./AnnouncementBanner";
import AutomationShowcase from "./AutomationShowcase";
import EditableText from "./EditableText";
import { Footer } from "./Footer";
import HomepageCalendarBooking from "./HomepageCalendarBooking";
import LogoMarquee from "./LogoMarquee";
import TypewriterText from "./TypewriterText";
import { VideoCard } from "./VideoCard";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const BG = "#0a0a0a";
const CARD_BG = "rgba(10,10,10,0.85)";
const BORDER = "1px solid rgba(57,255,20,0.3)";
const GREEN = "#39FF14";
const HEADING = "#ffffff";
const MUTED = "#888888";

// Typing speed constant — ms per character (matches AutomationShowcase.tsx)
const TYPE_MS = 35;

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
  const [_bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = () => {
      try {
        setBannerDismissed(
          localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY) === "true",
        );
      } catch {}
    };
    window.addEventListener("storage", handler);
    const interval = setInterval(handler, 300);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);
  const { items, openDrawer } = useCartStore();
  const navLinks = ["Services", "Results", "Blog", "Follow Us"];
  const navHrefs: Record<string, string> = {
    Services: "/services",
    Results: "/our-builds",
    Blog: "/blog",
    "Follow Us": "/social",
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
      {/* Single fixed container: banner stacked above nav row, no gap possible */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "#252830",
        }}
      >
        <AnnouncementBanner embedded={true} />
        <nav
          style={{
            background: "rgba(37,40,48,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: BORDER,
            overflow: "hidden",
          }}
          data-ocid="hero_navbar"
        >
          <div
            style={{
              position: "relative",
              zIndex: 1,
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
                  color: "#a0aec0",
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                <EditableText textKey="navbar.logo" defaultText="IMPERIDOME" />
              </span>
            </a>

            {/* Desktop Nav — hidden on mobile, flex on md+ */}
            <div
              className="hidden md:flex"
              style={{ alignItems: "center", gap: "32px" }}
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
                  style={{ background: "#a0aec0" }}
                />
              )}
            </button>

            {/* Client Portal */}
            <a
              href="/login"
              className="hidden md:inline-flex"
              style={{
                background: "#a0aec0",
                color: "#252830",
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
              href="/book"
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
      </div>

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
            backgroundColor: "#252830",
            backdropFilter: "blur(40px) saturate(1.8)",
            WebkitBackdropFilter: "blur(40px) saturate(1.8)",
            backgroundImage:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(90,95,115,0.04) 0%, transparent 60%)",
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
                color: "#a0aec0",
                textDecoration: "none",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "0.08em",
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
              borderTop: "1px solid rgba(90,95,115,0.15)",
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
                    background: "#a0aec0",
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
                  borderBottom: "1px solid rgba(90,95,115,0.1)",
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
                borderBottom: "1px solid rgba(90,95,115,0.1)",
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
                color: "#a0aec0",
                textDecoration: "none",
                borderBottom: "1px solid rgba(90,95,115,0.1)",
                textShadow: "none",
                transition: "opacity 0.15s",
              }}
              data-ocid="hero_navbar.mobile_clientportal.link"
            >
              <EditableText
                textKey="navbar.client-portal"
                defaultText="Client Portal"
              />
            </a>

            {/* Book a Call — plain text link, matches other nav items */}
            <a
              href="/book"
              data-ocid="hero_navbar.mobile_getstarted.button"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: 600,
                padding: "16px 0",
                minHeight: "44px",
                color: "rgba(156,163,175,0.9)",
                textDecoration: "none",
                borderBottom: "1px solid rgba(90,95,115,0.1)",
                background: "none",
                boxShadow: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(156,163,175,0.9)";
              }}
            >
              <EditableText
                textKey="navbar.book-a-call"
                defaultText="Book a Call"
              />
            </a>
          </nav>
        </div>
      )}
    </>
  );
}

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
  const isAdmin = session?.role === "admin";

  // ─── Matrix hero typing animation ────────────────────────────────────────
  // phase 0: idle, 1: typing headline, 2: typing sub-headline,
  // 3: typing body text, 4: buttons reveal, 5: stats animate, 6: complete
  type HeroPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const [heroPhase, setHeroPhase] = useState<HeroPhase>(0);
  const [headlineTyped, setHeadlineTyped] = useState("");
  const [subheadTyped, setSubheadTyped] = useState("");
  const [bodyTyped, setBodyTyped] = useState("");
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [statsTyped, setStatsTyped] = useState<string[]>(["", "", "", ""]);
  const [statLabelsTyped, setStatLabelsTyped] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const heroAnimRunRef = useRef(false);

  const HEADLINE = "The Infrastructure for Sovereign Business";
  const SUBHEAD = "Managed Web Infrastructure";
  const BODY =
    "We architect revenue-generating digital assets for business owners who refuse to rent their future.";
  const STAT_NUMBERS = ["250+", "99.9%", "$2.4M", "4.9\u2605"];
  const STAT_LABELS = [
    "Sites Launched",
    "Uptime SLA",
    "Client Revenue",
    "Average Rating",
  ];

  useEffect(() => {
    if (heroAnimRunRef.current) return;
    heroAnimRunRef.current = true;

    let alive = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (alive) fn();
      }, ms);
      timeouts.push(t);
      return t;
    };

    // Phase 1 — type sub-headline badge text ("Managed Web Infrastructure")
    schedule(() => {
      setHeroPhase(1);
      SUBHEAD.split("").forEach((_, ci) => {
        schedule(() => {
          setSubheadTyped(SUBHEAD.slice(0, ci + 1));
        }, ci * TYPE_MS);
      });
    }, 150);

    const subheadDuration = 150 + SUBHEAD.length * TYPE_MS + 200;

    // Phase 2 — type main headline
    schedule(() => {
      setHeroPhase(2);
      HEADLINE.split("").forEach((_, ci) => {
        schedule(() => {
          setHeadlineTyped(HEADLINE.slice(0, ci + 1));
        }, ci * TYPE_MS);
      });
    }, subheadDuration);

    const headlineDuration = subheadDuration + HEADLINE.length * TYPE_MS + 250;

    // Phase 3 — type body paragraph
    schedule(() => {
      setHeroPhase(3);
      BODY.split("").forEach((_, ci) => {
        schedule(
          () => {
            setBodyTyped(BODY.slice(0, ci + 1));
          },
          ci * (TYPE_MS * 0.4),
        );
      });
    }, headlineDuration);

    const bodyDuration = headlineDuration + BODY.length * (TYPE_MS * 0.4) + 250;

    // Phase 4 — reveal buttons
    schedule(() => {
      setHeroPhase(4);
      setButtonsVisible(true);
    }, bodyDuration);

    const buttonsDuration = bodyDuration + 400;

    // Phase 5 — type stat numbers + labels
    schedule(() => {
      setHeroPhase(5);
      setStatsVisible(true);
      STAT_NUMBERS.forEach((num, si) => {
        const statOffset = si * 150;
        num.split("").forEach((_, ci) => {
          schedule(
            () => {
              setStatsTyped((prev) => {
                const next = [...prev];
                next[si] = num.slice(0, ci + 1);
                return next;
              });
            },
            statOffset + ci * TYPE_MS,
          );
        });
        const numDone = statOffset + num.length * TYPE_MS + 100;
        STAT_LABELS[si].split("").forEach((_, ci) => {
          schedule(
            () => {
              setStatLabelsTyped((prev) => {
                const next = [...prev];
                next[si] = STAT_LABELS[si].slice(0, ci + 1);
                return next;
              });
            },
            numDone + ci * (TYPE_MS * 0.5),
          );
        });
      });
    }, buttonsDuration);

    const statsDuration =
      buttonsDuration +
      (STAT_NUMBERS.length - 1) * 150 +
      Math.max(...STAT_NUMBERS.map((n) => n.length)) * TYPE_MS +
      Math.max(...STAT_LABELS.map((l) => l.length)) * (TYPE_MS * 0.5) +
      200;

    // Phase 6 — complete (cursors hidden)
    schedule(() => {
      setHeroPhase(6);
    }, statsDuration);

    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
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
          .catch(() => {});

        publicActor
          .getPublicBuilds()
          .then((builds) => {
            if (!cancelled) {
              setPublicBuilds(builds);
            }
          })
          .catch(() => {});

        publicActor
          .getApprovedReviews()
          .then((reviews) => {
            if (!cancelled && reviews.length > 0) {
              const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
              const avg = (sum / reviews.length).toFixed(1);
              setLiveAvgRating(`${avg}\u2605`);
            }
          })
          .catch(() => {});

        if (!cancelled) {
          (publicActor as backendInterface)
            .getMarqueeLogos()
            .then((logos) => {
              if (!cancelled) setMarqueeLogos(logos);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

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
      await (actor as backendInterface).deleteMarqueeLogo(id);
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
      await (actor as backendInterface).reorderMarqueeLogos(orderedIds);
    } finally {
      setMarqueeLoading(false);
    }
  };

  // Resolve live stat values for the final display
  const liveStatNumbers = [
    liveSitesLaunched ?? "250+",
    "99.9%",
    "$2.4M",
    liveAvgRating ?? "4.9\u2605",
  ];

  const CURSOR = (
    <span
      style={{
        color: GREEN,
        fontFamily: "'Courier New', Courier, monospace",
        animation: "blink 0.8s step-end infinite",
        marginLeft: "1px",
      }}
    >
      |
    </span>
  );

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
          paddingTop: "106px",
          paddingBottom: "40px",
          position: "relative",
          overflow: "hidden",
        }}
        data-ocid="hero.section"
      >
        {/* Green glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(90,95,115,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <motion.div
          {...fadeUp}
          style={{
            position: "relative",
            zIndex: 2,
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
          {/* Badge — "Managed Web Infrastructure" */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              border: "1px solid rgba(90,95,115,0.3)",
              background: "rgba(90,95,115,0.08)",
              borderRadius: "999px",
              padding: "6px 16px",
              minWidth: "240px",
              textAlign: "center",
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
            <span
              style={{
                color: GREEN,
                fontSize: "13px",
                fontWeight: 500,
                fontFamily: "'Courier New', Courier, monospace",
                minHeight: "1.4em",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                textAlign: "center" as const,
                width: "100%",
              }}
            >
              {heroPhase >= 1 ? (
                <>
                  {subheadTyped}
                  {heroPhase === 1 ? CURSOR : null}
                </>
              ) : (
                <span style={{ opacity: 0 }}>{SUBHEAD}</span>
              )}
            </span>
          </div>

          {/* H1 + Body paragraph — backdrop box */}
          <div
            style={{
              background: CARD_BG,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderRadius: "14px",
              padding: "24px 32px",
              marginBottom: "8px",
              textAlign: "center" as const,
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
            }}
          >
            {/* H1 — "The Infrastructure for Sovereign Business" */}
            <h1
              style={{
                ...gradientWarm,
                fontSize: "clamp(2.8rem, 6vw, 6rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: "-0.02em",
                fontFamily:
                  '"General Sans", "Plus Jakarta Sans", Arial, sans-serif',
                minHeight: "1.1em",
              }}
            >
              {heroPhase >= 2 ? (
                <>
                  {headlineTyped}
                  {heroPhase === 2 ? CURSOR : null}
                </>
              ) : (
                <span style={{ opacity: 0 }}>&#8203;</span>
              )}
            </h1>

            {/* Body paragraph */}
            <p
              style={{
                color: MUTED,
                fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
                maxWidth: "640px",
                lineHeight: 1.6,
                margin: "0 auto",
                fontFamily: "'Courier New', Courier, monospace",
                minHeight: "3.2em",
                textAlign: "center" as const,
                textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                width: "100%",
              }}
            >
              {heroPhase >= 3 ? (
                <>
                  {bodyTyped}
                  {heroPhase === 3 ? CURSOR : null}
                </>
              ) : (
                <span style={{ opacity: 0 }}>&#8203;</span>
              )}
            </p>
          </div>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
              width: "100%",
              opacity: buttonsVisible ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          >
            <a
              href="/intake"
              style={{
                background: "transparent",
                color: GREEN,
                fontWeight: 700,
                padding: "14px 24px",
                minHeight: "44px",
                borderRadius: "8px",
                border: `1px solid ${GREEN}`,
                textDecoration: "none",
                fontSize: "15px",
                transition: "background 0.2s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Courier New', Courier, monospace",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(94,240,138,0.10)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
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
                border: `1px solid ${GREEN}`,
                color: GREEN,
                padding: "14px 24px",
                minHeight: "44px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "15px",
                background: "transparent",
                transition: "background 0.2s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(94,240,138,0.10)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
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
                padding: "14px 24px",
                minHeight: "44px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "15px",
                background: "transparent",
                transition: "background 0.2s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(94,240,138,0.10)";
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
                "0 0 0 1px rgba(57,255,20,0.3), 0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
            transition={{ duration: 0.22 }}
            style={{
              ...glassCard,
              padding: "20px 16px",
              maxWidth: "760px",
              width: "100%",
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
              opacity: statsVisible ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
            data-ocid="hero.social_proof_card"
          >
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
                  background: "#a0aec0",
                  boxShadow:
                    "0 0 4px rgba(90,95,115,0.8), 0 0 12px rgba(90,95,115,0.4)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "#a0aec0",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textShadow:
                    "0 0 8px rgba(90,95,115,0.6), 0 0 20px rgba(90,95,115,0.3)",
                  fontFamily: "'Courier New', Courier, monospace",
                }}
              >
                <EditableText
                  textKey="hero.social-proof-label"
                  defaultText="Social Proof"
                />
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
              {[
                {
                  number: "250+",
                  label: "Sites Launched",
                  numKey: "hero.stat-1-number",
                  labelKey: "hero.stat-1-label",
                  statIdx: 0,
                },
                {
                  number: "99.9%",
                  label: "Uptime SLA",
                  numKey: "hero.stat-2-number",
                  labelKey: "hero.stat-2-label",
                  statIdx: 1,
                },
                {
                  number: "$2.4M",
                  label: "Client Revenue",
                  numKey: "hero.stat-3-number",
                  labelKey: "hero.stat-3-label",
                  statIdx: 2,
                },
                {
                  number: "4.9\u2605",
                  label: "Average Rating",
                  numKey: "hero.stat-4-number",
                  labelKey: "hero.stat-4-label",
                  statIdx: 3,
                },
              ].map((stat) => (
                <div key={stat.labelKey} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      color: GREEN,
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: "-0.01em",
                      fontFamily: "'Courier New', Courier, monospace",
                      textShadow: "0 0 12px rgba(90,95,115,0.5)",
                      minHeight: "1.75rem",
                    }}
                  >
                    {heroPhase >= 5 ? (
                      <>
                        {statsTyped[stat.statIdx] ||
                          (heroPhase >= 6 ? liveStatNumbers[stat.statIdx] : "")}
                        {heroPhase === 5 &&
                        statsTyped[stat.statIdx].length > 0 &&
                        statsTyped[stat.statIdx] !== STAT_NUMBERS[stat.statIdx]
                          ? CURSOR
                          : null}
                      </>
                    ) : (
                      <span style={{ opacity: 0 }}>-</span>
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
                      fontFamily: "'Courier New', Courier, monospace",
                      minHeight: "1.3em",
                      textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                    }}
                  >
                    {heroPhase >= 5 ? (
                      <>
                        {statLabelsTyped[stat.statIdx]}
                        {heroPhase === 5 &&
                        statLabelsTyped[stat.statIdx].length > 0 &&
                        statLabelsTyped[stat.statIdx] !==
                          STAT_LABELS[stat.statIdx]
                          ? CURSOR
                          : null}
                      </>
                    ) : (
                      <span style={{ opacity: 0 }}>-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Portfolio Grid — Our Work */}
          {publicBuilds.length > 0 && (
            <div
              style={{ width: "100%", maxWidth: "1100px", marginTop: "8px" }}
              data-ocid="hero.portfolio_grid"
            >
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
                    boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
                  }}
                />
                <span
                  style={{
                    background: "rgba(37,40,48,0.55)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    borderRadius: "999px",
                    padding: "4px 16px",
                    display: "inline-block",
                  }}
                >
                  <span
                    style={{
                      color: GREEN,
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      textShadow:
                        "0 0 8px rgba(90,95,115,0.5), 0 0 20px rgba(90,95,115,0.25)",
                      fontFamily: "'Courier New', Courier, monospace",
                    }}
                  >
                    Our Work
                  </span>
                </span>
                <div
                  style={{
                    width: "28px",
                    height: "2px",
                    background: GREEN,
                    boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {publicBuilds.map((build, idx) => {
                  let hostname = build.siteUrl;
                  try {
                    hostname = new URL(build.siteUrl).hostname;
                  } catch {}
                  return (
                    <div
                      key={build.id}
                      style={{
                        background: "rgba(40,44,56,0.85)",
                        border: "1px solid rgba(90,95,115,0.18)",
                        borderRadius: "12px",
                        padding: "24px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                        textAlign: "center",
                        boxShadow:
                          "0 0 0 1px rgba(90,95,115,0.06), 0 4px 20px rgba(0,0,0,0.45)",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(90,95,115,0.45)";
                        e.currentTarget.style.boxShadow =
                          "0 0 20px rgba(90,95,115,0.2), 0 4px 24px rgba(0,0,0,0.55)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(90,95,115,0.18)";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 1px rgba(90,95,115,0.06), 0 4px 20px rgba(0,0,0,0.45)";
                      }}
                      data-ocid={`hero.portfolio_grid.item.${idx + 1}`}
                    >
                      {build.thumbnailUrl ? (
                        <div
                          style={{
                            width: "100%",
                            height: "160px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            flexShrink: 0,
                            border: "1px solid rgba(90,95,115,0.18)",
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
                                  "width:52px;height:52px;border-radius:50%;background:rgba(90,95,115,0.08);border:1px solid rgba(90,95,115,0.28);box-shadow:0 0 12px rgba(90,95,115,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;";
                                globe.setAttribute("aria-hidden", "true");
                                globe.textContent = "\uD83C\uDF10";
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
                            background: "rgba(90,95,115,0.08)",
                            border: "1px solid rgba(90,95,115,0.28)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        >
                          \uD83C\uDF10
                        </div>
                      )}
                      <div
                        style={{
                          color: HEADING,
                          fontWeight: 700,
                          fontSize: "14px",
                          lineHeight: 1.3,
                          fontFamily: "'Courier New', Courier, monospace",
                        }}
                      >
                        {build.clientName}
                      </div>
                      {build.category && (
                        <span
                          style={{
                            display: "inline-block",
                            background: "rgba(90,95,115,0.12)",
                            border: "1px solid rgba(90,95,115,0.3)",
                            color: "#a0aec0",
                            fontSize: "10px",
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            textTransform: "uppercase",
                            fontFamily: "'Courier New', Courier, monospace",
                          }}
                        >
                          {build.category}
                        </span>
                      )}
                      <div
                        style={{
                          color: "rgba(156,163,175,0.75)",
                          fontSize: "12px",
                          letterSpacing: "0.02em",
                          wordBreak: "break-all",
                          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                        }}
                      >
                        {hostname}
                      </div>
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
                            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                          }}
                        >
                          {build.description}
                        </p>
                      )}
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
                          border: "1px solid rgba(90,95,115,0.3)",
                          borderRadius: "6px",
                          padding: "5px 12px",
                          transition: "background 0.2s, border-color 0.2s",
                          fontFamily: "'Courier New', Courier, monospace",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(90,95,115,0.1)";
                          e.currentTarget.style.borderColor =
                            "rgba(90,95,115,0.6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor =
                            "rgba(90,95,115,0.3)";
                        }}
                        data-ocid={`hero.portfolio_grid.visit_link.${idx + 1}`}
                      >
                        Visit Site \u2192
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Logo Marquee */}
      <LogoMarquee
        logos={marqueeLogos}
        isEditMode={editMode}
        isAdmin={isAdmin}
        onAddLogo={handleAddLogo}
        onDeleteLogo={handleDeleteLogo}
        onReorderLogos={handleReorderLogos}
        isLoading={marqueeLoading}
      />

      {/* About / Trust Section */}
      <section
        style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.04em",
              marginBottom: 16,
            }}
          >
            ABOUT IMPERIDOME
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#a0aec0",
              maxWidth: 680,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Imperidome is sovereign digital infrastructure for businesses that
            refuse to be owned. Built on the Internet Computer Protocol —
            immutable, unstoppable, and censorship-resistant by design. We build
            sites, automate workflows, and operate systems that no single entity
            can take down.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: "rgba(10,10,10,0.85)",
              border: "1px solid rgba(57,255,20,0.3)",
              borderRadius: 12,
              padding: "24px 36px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <img
              src="/assets/stripe-logo.png"
              alt="Stripe"
              style={{ width: 96, height: "auto", objectFit: "contain" }}
            />
            <span
              style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.05rem" }}
            >
              Powered by Stripe.
            </span>
          </div>
          <div
            style={{
              background: "rgba(10,10,10,0.85)",
              border: "1px solid rgba(57,255,20,0.3)",
              borderRadius: 12,
              padding: "24px 36px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>🌐</span>
            <span
              style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.05rem" }}
            >
              Hosted on the Internet Computer Protocol.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Referral CTA ─────────────────────────────────────────────────────────────
function ReferralCTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      style={{ padding: "32px 16px", background: BG }}
      data-ocid="referral_cta.section"
    >
      <div
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.01)";
          e.currentTarget.style.borderColor = "rgba(90,95,115,0.6)";
          e.currentTarget.style.boxShadow =
            "0 0 30px rgba(90,95,115,0.18), 0 0 60px rgba(90,95,115,0.06), inset 0 0 40px rgba(90,95,115,0.02)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.borderColor = "rgba(57,255,20,0.3)";
          e.currentTarget.style.boxShadow =
            "0 0 20px rgba(90,95,115,0.08), inset 0 0 40px rgba(90,95,115,0.02)";
        }}
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: CARD_BG,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: BORDER,
          borderRadius: "12px",
          padding: "28px 20px",
          boxShadow:
            "0 0 20px rgba(90,95,115,0.08), inset 0 0 40px rgba(90,95,115,0.02)",
          transform: "scale(1)",
          transition:
            "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          position: "relative",
          overflow: "hidden",
          animation: "showcase-card-glow 4s ease-in-out infinite",
        }}
      >
        {/* Scanline overlay — matches PanelCard */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(transparent 50%, rgba(0,0,0,0.03) 50%)",
            backgroundSize: "100% 4px",
            pointerEvents: "none",
            zIndex: 0,
            borderRadius: "12px",
          }}
          aria-hidden="true"
        />

        {/* Panel title bar */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span
            style={{
              background: "rgba(90,95,115,0.1)",
              border: "1px solid rgba(90,95,115,0.25)",
              borderRadius: "999px",
              padding: "4px 14px",
              display: "inline-block",
            }}
          >
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "0.7rem",
                letterSpacing: "0.18em",
                color: "#a0aec0",
                textTransform: "uppercase",
                alignSelf: "flex-start",
              }}
            >
              ▶ REFERRAL PROGRAM
            </div>
          </span>
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(90,95,115,0.15)",
            }}
          />

          <a
            href="/referral"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(94,240,138,0.10)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "transparent";
            }}
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
              borderRadius: "8px",
              fontSize: "clamp(16px, 4vw, 22px)",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textDecoration: "none",
              cursor: "pointer",
              background: "transparent",
              border: `1px solid ${GREEN}`,
              color: GREEN,
              transition: "background 0.22s ease",
              fontFamily: "'Courier New', monospace",
            }}
            data-ocid="referral_cta.button"
          >
            <EditableText
              textKey="referral.button-label"
              defaultText="Referral Program"
            />
          </a>

          <div
            style={{
              background: "rgba(37,40,48,0.5)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              borderRadius: "10px",
              padding: "12px 20px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 500,
                color: "rgba(200,200,200,0.9)",
                textAlign: "center",
                lineHeight: 1.5,
                fontFamily: "'Courier New', monospace",
              }}
              data-ocid="referral_cta.subtext"
            >
              <EditableText
                textKey="referral.subtext-prefix"
                defaultText="Refer a friend, Host your site for"
              />{" "}
              <span
                style={{
                  color: "#a0aec0",
                  fontWeight: 800,
                  textShadow:
                    "0 0 8px rgba(90,95,115,0.8), 0 0 20px rgba(90,95,115,0.4)",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                <EditableText
                  textKey="referral.subtext-highlight"
                  defaultText="FREE!"
                />
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ─── What We Build ────────────────────────────────────────────────────────────
const DOME_CARD_CSS = `
@keyframes neonPulse {
  0%, 100% { border-color: rgba(90,95,115,0.15); box-shadow: 0 0 8px rgba(90,95,115,0.1); }
  50% { border-color: rgba(90,95,115,0.45); box-shadow: 0 0 24px rgba(90,95,115,0.25); }
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
      style={{
        background: BG,
        padding: "60px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      data-ocid="what_we_build.section"
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            background: CARD_BG,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "12px",
            padding: "20px 28px",
            textAlign: "center" as const,
            display: "inline-block",
            marginBottom: "8px",
          }}
        >
          <TypewriterText
            as="h2"
            text="What We Build"
            className="hero-heading"
            speed={60}
            style={{
              textAlign: "center",
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: "12px",
              textShadow:
                "0 0 30px rgba(90,95,115,0.25), 1px 2px 0 rgba(0,0,0,0.9)",
            }}
          />
          <TypewriterText
            as="p"
            text="Four services. One mission — give you assets that work while you sleep."
            className="hero-text"
            speed={30}
            style={{
              textAlign: "center",
              marginBottom: "48px",
              fontSize: "16px",
            }}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "28px",
            justifyItems: "center",
          }}
        >
          {items.map((item, i) => (
            <motion.div
              key={item.titleKey}
              className="dome-card"
              whileHover={{
                borderColor: "rgba(90,95,115,0.8)",
                boxShadow:
                  "0 0 20px rgba(90,95,115,0.3), 0 0 60px rgba(90,95,115,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
                scale: 1.02,
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                background: CARD_BG,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: BORDER,
                borderRadius: "16px",
                padding: "36px",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
                transition: "box-shadow 0.3s, border-color 0.3s",
              }}
              data-ocid={`what_we_build.item.${i + 1}`}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(160deg, rgba(90,95,115,0.03) 0%, transparent 40%)",
                  pointerEvents: "none",
                  borderRadius: "16px",
                }}
              />
              <TypewriterText
                as="h3"
                text={item.title}
                speed={80}
                className="hero-heading"
                style={{
                  fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                  textShadow: "none",
                }}
              />
              <div
                style={{
                  width: "24px",
                  height: "2px",
                  background: "#a0aec0",
                  marginBottom: "16px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
                }}
              />
              <TypewriterText
                as="p"
                text={item.desc}
                speed={25}
                className="hero-text"
                style={{
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                  letterSpacing: "0.02em",
                  margin: 0,
                  marginTop: "16px",
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── Stay Connected (Social Feed) ────────────────────────────────────────────
interface SocialMediaConfig {
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
}

const SOCIAL_PLATFORMS = [
  { key: "facebookUrl", name: "Facebook", color: "#1877F2" },
  { key: "instagramUrl", name: "Instagram", color: "#E1306C" },
  { key: "tiktokUrl", name: "TikTok", color: "#ffffff" },
  { key: "linkedinUrl", name: "LinkedIn", color: "#0A66C2" },
  { key: "youtubeUrl", name: "YouTube", color: "#FF0000" },
] as const;

function SocialFacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="#1877F2"
      aria-hidden="true"
    >
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.885v2.255h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function SocialInstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="#E1306C"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function SocialTikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="#ffffff"
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function SocialLinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="#0A66C2"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function SocialYouTubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="#FF0000"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function getSocialIcon(key: string) {
  switch (key) {
    case "facebookUrl":
      return <SocialFacebookIcon />;
    case "instagramUrl":
      return <SocialInstagramIcon />;
    case "tiktokUrl":
      return <SocialTikTokIcon />;
    case "linkedinUrl":
      return <SocialLinkedInIcon />;
    case "youtubeUrl":
      return <SocialYouTubeIcon />;
    default:
      return null;
  }
}

function SocialFbEmbed({ url }: { url: string }) {
  const encodedUrl = encodeURIComponent(url);
  const src = `https://www.facebook.com/plugins/page.php?href=${encodedUrl}&tabs=timeline&width=340&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`;
  return (
    <iframe
      src={src}
      width="340"
      height="500"
      style={{
        border: "none",
        overflow: "hidden",
        borderRadius: "8px",
        display: "block",
        maxWidth: "100%",
      }}
      scrolling="no"
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      title="Facebook Page"
      loading="lazy"
    />
  );
}

function SocialIgEmbed({ url }: { url: string }) {
  useEffect(() => {
    const w = window as Window & {
      instgrm?: { Embeds?: { process: () => void } };
    };
    if (w.instgrm?.Embeds) {
      w.instgrm.Embeds.process();
      return;
    }
    if (
      !document.querySelector(
        'script[src="https://www.instagram.com/embed.js"]',
      )
    ) {
      const s = document.createElement("script");
      s.src = "https://www.instagram.com/embed.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);
  return (
    <div style={{ maxWidth: "340px", width: "100%" }}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: "#111",
          border: BORDER,
          borderRadius: "8px",
          margin: "0",
          maxWidth: "340px",
          minWidth: "240px",
          padding: "0",
          width: "100%",
        }}
      />
    </div>
  );
}

function SocialTtEmbed({ url }: { url: string }) {
  const videoIdMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  useEffect(() => {
    if (
      !document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
    ) {
      const s = document.createElement("script");
      s.src = "https://www.tiktok.com/embed.js";
      s.async = true;
      document.body.appendChild(s);
    } else {
      const w = window as Window & { tiktokEmbed?: { reload: () => void } };
      if (w.tiktokEmbed) w.tiktokEmbed.reload();
    }
  }, []);
  if (!videoId)
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: GREEN, fontSize: "14px" }}
      >
        View on TikTok ↗
      </a>
    );
  return (
    <div style={{ maxWidth: "340px", width: "100%" }}>
      <blockquote
        className="tiktok-embed"
        // @ts-ignore — TikTok embed custom attribute
        cite={url}
        data-video-id={videoId}
        style={{
          maxWidth: "340px",
          minWidth: "240px",
          background: "#1a1a1a",
          borderRadius: "8px",
          border: BORDER,
          margin: 0,
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted TikTok oEmbed
        dangerouslySetInnerHTML={{
          __html: `<section><a target="_blank" href="${url}">TikTok video ${videoId}</a></section>`,
        }}
      />
    </div>
  );
}

function SocialLiEmbed({ url }: { url: string }) {
  return (
    <div style={{ maxWidth: "340px", width: "100%" }}>
      <div
        style={{
          background: "#0A66C2",
          borderRadius: "8px",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          textAlign: "center",
        }}
      >
        <SocialLinkedInIcon />
        <p
          style={{
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Follow us on LinkedIn for company updates, industry insights, and
          professional news.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "#ffffff",
            color: "#0A66C2",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Visit our LinkedIn Page ↗
        </a>
      </div>
    </div>
  );
}

function SocialYtEmbed({ url }: { url: string }) {
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  let embedSrc: string;
  if (channelMatch) {
    embedSrc = `https://www.youtube-nocookie.com/embed?listType=user_uploads&list=${channelMatch[1]}`;
  } else if (handleMatch) {
    embedSrc = `https://www.youtube-nocookie.com/embed?listType=user_uploads&list=${handleMatch[1]}`;
  } else {
    embedSrc = url
      .replace("youtube.com", "youtube-nocookie.com")
      .replace("watch?v=", "embed/");
  }
  return (
    <div
      style={{
        position: "relative",
        paddingBottom: "56.25%",
        height: 0,
        width: "100%",
        maxWidth: "340px",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <iframe
        src={embedSrc}
        title="YouTube Channel"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

function SocialEmbedRouter({ urlKey, url }: { urlKey: string; url: string }) {
  switch (urlKey) {
    case "facebookUrl":
      return <SocialFbEmbed url={url} />;
    case "instagramUrl":
      return <SocialIgEmbed url={url} />;
    case "tiktokUrl":
      return <SocialTtEmbed url={url} />;
    case "linkedinUrl":
      return <SocialLiEmbed url={url} />;
    case "youtubeUrl":
      return <SocialYtEmbed url={url} />;
    default:
      return null;
  }
}

function SocialSkeletonCard() {
  return (
    <div
      style={{
        background: "#111",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.06)",
        borderTop: "3px solid rgba(90,95,115,0.25)",
        padding: "20px",
        minHeight: "420px",
        animation: "skPulse 1.6s ease-in-out infinite",
      }}
    />
  );
}

function SocialPlatformCard({
  urlKey,
  name,
  color,
  url,
}: {
  urlKey: string;
  name: string;
  color: string;
  url: string;
}) {
  return (
    <div
      data-ocid={`homepage_social.${urlKey.replace("Url", "")}.card`}
      style={{
        background: CARD_BG,
        borderRadius: "12px",
        border: "1px solid rgba(90,95,115,0.18)",
        borderTop: `3px solid ${color}`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "16px",
        boxShadow: "0 0 12px rgba(90,95,115,0.06), 0 4px 20px rgba(0,0,0,0.45)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(90,95,115,0.4)";
        e.currentTarget.style.boxShadow =
          "0 0 20px rgba(90,95,115,0.15), 0 4px 24px rgba(0,0,0,0.55)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(90,95,115,0.18)";
        e.currentTarget.style.boxShadow =
          "0 0 12px rgba(90,95,115,0.06), 0 4px 20px rgba(0,0,0,0.45)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {getSocialIcon(urlKey)}
        <span
          style={{
            color: color,
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "0.01em",
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          {name}
        </span>
      </div>
      <div style={{ width: "100%" }}>
        <SocialEmbedRouter urlKey={urlKey} url={url} />
      </div>
    </div>
  );
}

function StayConnectedSection() {
  const [socialConfig, setSocialConfig] = useState<SocialMediaConfig | null>(
    null,
  );
  const [socialLoading, setSocialLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    createActorWithConfig(createActor)
      .then((publicActor) => {
        if (cancelled) return;
        return (publicActor as backendInterface).getPublicSocialMediaConfig();
      })
      .then((cfg) => {
        if (!cancelled && cfg) setSocialConfig(cfg);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSocialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activePlatforms = socialConfig
    ? SOCIAL_PLATFORMS.filter((p) => {
        const val = socialConfig[p.key as keyof SocialMediaConfig];
        return typeof val === "string" && val.trim().length > 0;
      })
    : [];

  if (!socialLoading && activePlatforms.length === 0) return null;

  return (
    <section
      style={{
        background: BG,
        padding: "60px 16px",
        borderTop: "1px solid rgba(90,95,115,0.12)",
        borderBottom: "1px solid rgba(90,95,115,0.12)",
      }}
      data-ocid="homepage_social.section"
    >
      <style>{`
        @keyframes skPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .homepage-social-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 899px) { .homepage-social-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 599px) { .homepage-social-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "36px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "2px",
              background: GREEN,
              boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
            }}
          />
          <TypewriterText
            as="span"
            text="Stay Connected"
            speed={60}
            className="hero-label"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              textShadow:
                "0 0 8px rgba(90,95,115,0.5), 0 0 20px rgba(90,95,115,0.25)",
            }}
          />
          <div
            style={{
              width: "28px",
              height: "2px",
              background: GREEN,
              boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        {socialLoading && (
          <div
            data-ocid="homepage_social.loading_state"
            className="homepage-social-grid"
          >
            {[1, 2, 3].map((i) => (
              <SocialSkeletonCard key={i} />
            ))}
          </div>
        )}

        {!socialLoading && activePlatforms.length > 0 && (
          <div className="homepage-social-grid">
            {activePlatforms.map((p) => (
              <SocialPlatformCard
                key={p.key}
                urlKey={p.key}
                name={p.name}
                color={p.color}
                url={
                  (socialConfig as SocialMediaConfig)[
                    p.key as keyof SocialMediaConfig
                  ] as string
                }
              />
            ))}
          </div>
        )}
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
        color: "#a0aec0",
        fontSize: "18px",
        letterSpacing: "2px",
        textShadow: "none",
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
      "0 0 0 1px rgba(90,95,115,0.18), 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)",
    transition: "transform 0.2s, box-shadow 0.2s",
  };

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "scale(1.02)";
    e.currentTarget.style.boxShadow =
      "0 0 0 1px rgba(90,95,115,0.45), 0 16px 56px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1)";
  };
  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "";
    e.currentTarget.style.boxShadow =
      "0 0 0 1px rgba(90,95,115,0.18), 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)";
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
                  background: CARD_BG,
                  marginBottom: "8px",
                }}
              />
              <div
                style={{
                  width: "60%",
                  height: "12px",
                  borderRadius: "6px",
                  background: CARD_BG,
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
            <div style={{ color: "#a0aec0", fontSize: "32px", opacity: 0.5 }}>
              {"★".repeat(5)}
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
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(90,95,115,0.1)",
                  border: "2px solid #a0aec0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#a0aec0",
                  flexShrink: 0,
                  fontFamily: "'Courier New', Courier, monospace",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <StarRating rating={review.rating} />
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
              <div style={{ marginTop: "4px" }}>
                <div
                  style={{
                    color: HEADING,
                    fontWeight: 700,
                    fontSize: "15px",
                    marginBottom: "4px",
                    fontFamily: "'Courier New', Courier, monospace",
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
        <div
          style={{
            background: CARD_BG,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "16px",
            padding: "24px 32px",
            border: BORDER,
            display: "inline-block",
            marginBottom: approvedReviews.length > 0 ? "20px" : "48px",
            textAlign: "center" as const,
            width: "100%",
            boxSizing: "border-box" as const,
          }}
        >
          <TypewriterText
            as="h2"
            text="Reviews"
            speed={60}
            className="hero-heading"
            style={{
              textAlign: "center",
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: 0,
            }}
          />
        </div>

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
                    background: "rgba(90,95,115,0.07)",
                    border: "1px solid rgba(90,95,115,0.28)",
                    borderRadius: "999px",
                    padding: "8px 20px",
                    boxShadow:
                      "0 0 12px rgba(90,95,115,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      color: "#a0aec0",
                      fontSize: "16px",
                      lineHeight: 1,
                      textShadow: "none",
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
                      fontFamily: "'Courier New', Courier, monospace",
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

  useEffect(() => {
    let cancelled = false;
    createActorWithConfig(createActor)
      .then((publicActor) => {
        if (!cancelled) fetchAllSiteText(publicActor);
      })
      .catch(() => {});
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
        background: BG,
        padding: "96px 24px",
        borderTop: "1px solid rgba(90,95,115,0.12)",
        borderBottom: "1px solid rgba(90,95,115,0.12)",
      }}
      data-ocid="homepage_video.section"
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            background: CARD_BG,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "16px",
            padding: "24px 32px",
            border: BORDER,
            display: "inline-block",
            marginBottom: "40px",
            textAlign: "center" as const,
            width: "100%",
            boxSizing: "border-box" as const,
          }}
        >
          <TypewriterText
            as="h2"
            text="Watch Imperidome in action"
            speed={60}
            className="hero-heading"
            style={{
              textAlign: "center",
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: 0,
              textShadow: "none",
            }}
          />
        </div>
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
        background: BG,
        padding: "80px 24px",
        borderTop: "1px solid rgba(90,95,115,0.12)",
        borderBottom: "1px solid rgba(90,95,115,0.12)",
      }}
      data-ocid="audit_consult_box.section"
    >
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div
          style={{
            border: BORDER,
            borderRadius: "16px",
            padding: "48px 40px",
            background: CARD_BG,
            boxShadow:
              "0 0 20px rgba(90,95,115,0.08), 0 4px 32px rgba(0,0,0,0.5)",
            textAlign: "center",
          }}
          data-ocid="audit_consult_box.card"
        >
          <TypewriterText
            as="span"
            text="Already have a website?"
            speed={55}
            className="hero-label"
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              marginBottom: "20px",
              textTransform: "uppercase",
              textShadow:
                "0 0 8px rgba(90,95,115,0.7), 0 0 20px rgba(90,95,115,0.4)",
            }}
          />
          <div
            style={{
              background: "rgba(57,255,20,0.04)",
              borderRadius: "10px",
              padding: "16px 24px",
              border: BORDER,
              marginBottom: "16px",
            }}
          >
            <TypewriterText
              as="h2"
              text="Stop flying blind."
              speed={70}
              className="hero-heading"
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                marginBottom: "14px",
                lineHeight: 1.2,
              }}
            />
            <TypewriterText
              as="p"
              text="Get a professional performance, SEO, and conversion breakdown of your current site — or schedule a free strategy session."
              speed={20}
              className="hero-text"
              style={{
                fontSize: "16px",
                marginBottom: "0",
                maxWidth: "520px",
                margin: "0 auto",
                lineHeight: 1.65,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/intake?service=audit"
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
                fontFamily: "'Courier New', Courier, monospace",
              }}
              data-ocid="audit_consult_box.audit_button"
            >
              <EditableText
                textKey="audit-box.audit-button"
                defaultText="$99 Site Audit"
              />
            </a>
            <a
              href="/intake?service=consultation"
              style={{
                border: "1px solid rgba(90,95,115,0.3)",
                color: GREEN,
                padding: "16px 32px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "15px",
                background: "transparent",
                minWidth: "200px",
                display: "inline-block",
                textAlign: "center",
                transition: "background 0.2s",
                fontFamily: "'Courier New', Courier, monospace",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(90,95,115,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
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
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(90,95,115,0.06) 0%, transparent 70%)",
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
        <div
          style={{
            background: "rgba(37,40,48,0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "12px",
            padding: "24px 32px",
            textAlign: "center" as const,
            marginBottom: "16px",
          }}
        >
          <TypewriterText
            as="h2"
            text="Ready to own your digital future?"
            speed={55}
            className="hero-heading"
            style={{
              fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
              fontWeight: 800,
              marginBottom: "16px",
            }}
          />
          <TypewriterText
            as="p"
            text="Join 250+ business owners who chose sovereignty over dependency."
            speed={28}
            className="hero-text"
            style={{ fontSize: "16px", marginBottom: "0" }}
          />
        </div>
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
              background: "transparent",
              color: GREEN,
              fontWeight: 700,
              padding: "16px 32px",
              borderRadius: "8px",
              border: `1px solid ${GREEN}`,
              textDecoration: "none",
              fontSize: "15px",
              fontFamily: "'Courier New', Courier, monospace",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(94,240,138,0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
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
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: BORDER,
        borderRadius: "16px",
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
    <div
      style={{
        borderBottom: "1px solid rgba(90,95,115,0.12)",
        background: "rgba(17,19,34,0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: HEADING,
          fontSize: "16px",
          fontWeight: 500,
          textAlign: "left",
          gap: "16px",
          fontFamily: "'Courier New', Courier, monospace",
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
                background: "rgba(37,40,48,0.5)",
                padding: "12px 20px",
                borderRadius: "0 0 10px 10px",
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
        <div style={{ textAlign: "center" as const, marginBottom: "48px" }}>
          <div
            style={{
              background: CARD_BG,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderRadius: "12px",
              padding: "16px 32px",
              display: "inline-block",
              textAlign: "center" as const,
            }}
          >
            <TypewriterText
              as="h2"
              text="Frequently Asked Questions"
              speed={55}
              className="hero-heading"
              style={{
                textAlign: "center",
                fontSize: "2rem",
                fontWeight: 700,
                marginBottom: 0,
              }}
            />
          </div>
        </div>
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
  useEffect(() => {
    (async () => {
      try {
        let sid = sessionStorage.getItem("_vis_sid");
        if (!sid) {
          sid = crypto.randomUUID();
          sessionStorage.setItem("_vis_sid", sid);
        }
        const publicActor = await createActorWithConfig(createActor);
        await (publicActor as backendInterface).recordVisit(
          window.location.pathname,
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid,
          null,
        );
      } catch {
        // silent
      }
    })();
  }, []);

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
        position: "relative",
      }}
    >
      <HeroNavbar />
      <HeroSection />
      <HomepageCalendarBooking />
      <ReferralCTA />
      <StayConnectedSection />
      <WhatWeBuild />
      <AutomationShowcase />

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
