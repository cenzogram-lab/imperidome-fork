import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import TypewriterText from "@/components/TypewriterText";
import { useLocation } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "../store/useCartStore";

const navLinks = [
  {
    key: "navbar.link_products",
    label: "Services",
    href: "/services",
    ocid: "nav.products.link",
  },
  {
    key: "navbar.link_results",
    label: "Results",
    href: "/results",
    ocid: "nav.results.link",
  },
  {
    key: "navbar.link_blog",
    label: "Blog",
    href: "/blog",
    ocid: "nav.blog.link",
  },
  {
    key: "navbar.link_social",
    label: "Follow Us",
    href: "/social",
    ocid: "nav.social.link",
  },
];

const SERVICE_DROPDOWN_ITEMS = [{ label: "All Services", href: "/services" }];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHomepage = location.pathname === "/";
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const [bannerVisible, setBannerVisible] = useState(() => {
    try {
      const val = localStorage.getItem("imperidome_announcement_dismissed_v1");
      return val !== "true" && val !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handler = () => {
      try {
        const val = localStorage.getItem(
          "imperidome_announcement_dismissed_v1",
        );
        setBannerVisible(val !== "true" && val !== "1");
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        servicesRef.current &&
        !servicesRef.current.contains(e.target as Node)
      ) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      {/* Single unified fixed container — banner + nav in one block, flush to top */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "#0F172A",
        }}
      >
        {/* Announcement banner rendered INSIDE the fixed container */}
        <AnnouncementBanner embedded />

        {/* Nav header row */}
        <header
          className={[
            "transition-all duration-300",
            scrolled ? "shadow-nav" : "",
          ].join(" ")}
          style={{
            background: "#0F172A",
            borderBottom: "1px solid rgba(51, 65, 85, 0.5)",
            boxShadow:
              "0 4px 30px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.05), inset 0 -1px 0 rgba(34,197,94,0.08)",
            backgroundImage:
              "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(34,197,94,0.03) 0%, transparent 70%)",
            overflow: "hidden",
          }}
        >
          <div
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
            style={{ position: "relative", zIndex: 1 }}
          >
            <div className="flex h-[56px] sm:h-[68px] items-center justify-between gap-3 sm:gap-6">
              {/* Logo */}
              <a
                href="/"
                data-ocid="nav.logo.link"
                className="shrink-0 select-none"
                style={{
                  letterSpacing: "-0.01em",
                  color: "#22C55E",
                  textShadow:
                    "0 0 4px #22C55E, 0 0 16px rgba(57,255,20,0.6), 0 0 40px rgba(57,255,20,0.3)",
                  fontSize: "clamp(16px, 2.5vw, 22px)",
                  fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                }}
              >
                <TypewriterText text="IMPERIDOME" as="span" speed={80} />
              </a>

              {/* Desktop nav links — hidden below md (768px), shown md and above */}
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) =>
                  link.label === "Services" && isHomepage ? (
                    <div
                      key={link.ocid}
                      ref={servicesRef}
                      style={{ position: "relative", display: "inline-block" }}
                      onMouseEnter={() => setServicesOpen(true)}
                      onMouseLeave={() => setServicesOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => setServicesOpen((o) => !o)}
                        data-ocid="nav.services.dropdown_button"
                        className="text-[15px] font-medium transition-all duration-200 hover:text-[#22C55E] whitespace-nowrap"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#EEF0F8",
                          fontFamily:
                            "'Plus Jakarta Sans', 'Fira Code', monospace",
                          letterSpacing: "0.04em",
                          padding: "8px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.textShadow =
                            "0 0 6px #22C55E, 0 0 20px rgba(57,255,20,0.5)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#22C55E";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.textShadow = "none";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#EEF0F8";
                        }}
                      >
                        <TypewriterText text="Services" as="span" speed={60} />
                        <span
                          style={{
                            fontSize: "0.7rem",
                            transition: "transform 0.2s",
                            transform: servicesOpen
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            display: "inline-block",
                            marginLeft: 4,
                          }}
                        >
                          ▼
                        </span>
                      </button>
                      {servicesOpen && (
                        <div
                          data-ocid="nav.services.dropdown"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            minWidth: 220,
                            background: "rgba(10,12,22,0.97)",
                            border: "1px solid rgba(57,255,20,0.3)",
                            borderRadius: 8,
                            padding: "8px 0",
                            zIndex: 1000,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                          }}
                        >
                          {SERVICE_DROPDOWN_ITEMS.map((item) => (
                            <a
                              key={item.label}
                              href={item.href}
                              data-ocid={`nav.services.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
                              style={{
                                display: "block",
                                padding: "10px 20px",
                                color: "#c8d8c8",
                                fontSize: "0.9rem",
                                textDecoration: "none",
                                transition: "color 0.15s, background 0.15s",
                                fontFamily:
                                  "'Plus Jakarta Sans', 'Fira Code', monospace",
                              }}
                              onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.color =
                                  "#22C55E";
                                (e.target as HTMLElement).style.background =
                                  "rgba(57,255,20,0.06)";
                              }}
                              onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.color =
                                  "#c8d8c8";
                                (e.target as HTMLElement).style.background =
                                  "transparent";
                              }}
                            >
                              {item.label}
                            </a>
                          ))}
                          <div
                            style={{
                              borderTop: "1px solid rgba(57,255,20,0.15)",
                              margin: "8px 0 4px",
                            }}
                          />
                          <a
                            href="/services"
                            data-ocid="nav.services.view_all.link"
                            style={{
                              display: "block",
                              padding: "10px 20px",
                              color: "#22C55E",
                              fontSize: "0.9rem",
                              fontWeight: 600,
                              textDecoration: "none",
                              fontFamily:
                                "'Plus Jakarta Sans', 'Fira Code', monospace",
                            }}
                          >
                            View All Services →
                          </a>
                        </div>
                      )}
                    </div>
                  ) : link.label === "Services" ? (
                    <a
                      key={link.ocid}
                      href={link.href}
                      data-ocid={link.ocid}
                      className="text-[15px] font-medium transition-all duration-200 hover:text-[#22C55E] whitespace-nowrap"
                      style={{
                        color: "#EEF0F8",
                        fontFamily:
                          "'Plus Jakarta Sans', 'Fira Code', monospace",
                        letterSpacing: "0.04em",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLAnchorElement
                        ).style.textShadow =
                          "0 0 6px #22C55E, 0 0 20px rgba(57,255,20,0.5)";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "#22C55E";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLAnchorElement
                        ).style.textShadow = "none";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "rgba(238,240,248,0.85)";
                      }}
                    >
                      <TypewriterText text={link.label} as="span" speed={60} />
                    </a>
                  ) : (
                    <a
                      key={link.ocid}
                      href={link.href}
                      data-ocid={link.ocid}
                      className="text-[15px] font-medium transition-all duration-200 hover:text-[#22C55E] whitespace-nowrap"
                      style={{
                        color: "#EEF0F8",
                        fontFamily:
                          "'Plus Jakarta Sans', 'Fira Code', monospace",
                        letterSpacing: "0.04em",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLAnchorElement
                        ).style.textShadow =
                          "0 0 6px #22C55E, 0 0 20px rgba(57,255,20,0.5)";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "#22C55E";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLAnchorElement
                        ).style.textShadow = "none";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "rgba(238,240,248,0.85)";
                      }}
                    >
                      <TypewriterText text={link.label} as="span" speed={60} />
                    </a>
                  ),
                )}
              </nav>

              {/* Desktop right-side actions — hidden below md */}
              <div className="hidden md:flex items-center gap-3 shrink-0">
                {/* Cart */}
                <button
                  type="button"
                  onClick={openDrawer}
                  className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: "#EEF0F8" }}
                  aria-label="Open cart"
                  data-ocid="nav.cart.button"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {items.length > 0 && (
                    <span
                      className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{
                        background: "#22C55E",
                        boxShadow:
                          "0 0 4px #22C55E, 0 0 10px rgba(57,255,20,0.7)",
                      }}
                    />
                  )}
                </button>

                {/* Login */}
                <a
                  href="/login"
                  data-ocid="nav.login.link"
                  className="text-sm font-medium whitespace-nowrap transition-all duration-150 hover:text-[#22C55E]"
                  style={{
                    color: "#A0A3B1",
                    fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                    letterSpacing: "0.04em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "0 0 6px #22C55E, 0 0 18px rgba(57,255,20,0.4)";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "#22C55E";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "none";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "#A0A3B1";
                  }}
                >
                  <TypewriterText text="Login" as="span" speed={60} />
                </a>

                {/* Client Portal — outline button */}
                <a
                  href="/portal"
                  data-ocid="nav.clientportal.button"
                  className="inline-block text-sm font-semibold px-4 py-1.5 rounded whitespace-nowrap transition-all duration-200 hover:opacity-90"
                  style={{
                    border: "1px solid rgba(57, 255, 20, 0.6)",
                    color: "#22C55E",
                    background: "rgba(57, 255, 20, 0.04)",
                    boxShadow:
                      "0 0 6px rgba(57,255,20,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
                    fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                    letterSpacing: "0.06em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "0 0 4px #22C55E, 0 0 14px rgba(57,255,20,0.4), 0 0 30px rgba(57,255,20,0.2), inset 0 1px 0 rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "#22C55E";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "0 0 6px rgba(57,255,20,0.15), inset 0 1px 0 rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "rgba(57, 255, 20, 0.6)";
                  }}
                >
                  <TypewriterText text="Client Portal" as="span" speed={60} />
                </a>

                {/* Inquire — secondary ghost CTA */}
                <a
                  href="/intake"
                  data-ocid="nav.inquire.button"
                  className="inline-block text-sm font-semibold px-4 py-1.5 rounded whitespace-nowrap transition-all duration-200"
                  style={{
                    background: "transparent",
                    border: "1px solid #22C55E",
                    color: "#22C55E",
                    fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                    letterSpacing: "0.06em",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = "rgba(94,240,138,0.10)";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = "transparent";
                  }}
                >
                  <TypewriterText text="Inquire" as="span" speed={60} />
                </a>

                {/* Book a Call — bold white outline, same shape as other CTAs */}
                <a
                  href="/book"
                  data-ocid="nav.getstarted.button"
                  className="inline-block text-sm font-semibold px-4 py-1.5 rounded whitespace-nowrap transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    color: "#FFFFFF",
                    border: "2px solid #FFFFFF",
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                    letterSpacing: "0.06em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(255,255,255,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(255,255,255,0.12)";
                  }}
                >
                  <TypewriterText text="Book a Call" as="span" speed={60} />
                </a>
              </div>

              {/* Mobile hamburger — ONLY visible below md (768px) */}
              <button
                type="button"
                data-ocid="nav.hamburger.button"
                onClick={() => setMobileOpen(true)}
                className="md:hidden flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-md transition-colors hover:bg-white/10"
                style={{ color: "#EEF0F8" }}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-overlay"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Spacer pushes page content below the fixed navbar height */}
      <div
        aria-hidden="true"
        style={{ height: bannerVisible ? "calc(38px + 56px)" : "56px" }}
        className="sm:hidden"
      />
      <div
        aria-hidden="true"
        style={{ height: bannerVisible ? "calc(38px + 68px)" : "68px" }}
        className="hidden sm:block"
      />

      {/* Mobile menu overlay — full screen, z-index above navbar */}
      {mobileOpen && (
        <dialog
          id="mobile-nav-overlay"
          open
          aria-label="Navigation menu"
          className="fixed inset-0 md:hidden flex flex-col overflow-y-auto"
          style={{
            zIndex: 100000,
            backgroundColor: "#0F172A",
            backdropFilter: "blur(40px) saturate(1.8)",
            WebkitBackdropFilter: "blur(40px) saturate(1.8)",
            backgroundImage:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(57,255,20,0.04) 0%, transparent 60%)",
          }}
          data-ocid="nav.mobile_menu.panel"
        >
          {/* Header row: logo + close button */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <a
              href="/"
              onClick={() => setMobileOpen(false)}
              className="select-none"
              style={{
                color: "#22C55E",

                fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              <TypewriterText text="IMPERIDOME" as="span" speed={80} />
            </a>
            <button
              type="button"
              data-ocid="nav.mobile_close.button"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-md hover:bg-white/10 transition-colors"
              style={{ color: "#EEF0F8" }}
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: "1px solid rgba(57,255,20,0.15)",
              margin: "0 20px",
            }}
          />

          {/* Mobile links */}
          <nav
            className="flex flex-col items-center pt-6 px-6 pb-10 flex-1"
            style={{ gap: "4px" }}
          >
            {/* Cart */}
            <button
              type="button"
              onClick={() => {
                openDrawer();
                setMobileOpen(false);
              }}
              className="relative w-full flex items-center justify-center gap-2 py-4 transition-all duration-200 bg-transparent border-none outline-none"
              style={{
                color: "#EEF0F8",
                fontSize: "1.2rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                letterSpacing: "0.06em",
                background: "none",
                border: "none",
                boxShadow: "none",
                borderBottom: "1px solid rgba(57,255,20,0.1)",
                minHeight: "44px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#22C55E";
                (e.currentTarget as HTMLButtonElement).style.textShadow =
                  "0 0 8px rgba(94,240,138,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#EEF0F8";
                (e.currentTarget as HTMLButtonElement).style.textShadow =
                  "none";
              }}
              data-ocid="nav.mobile_cart.button"
            >
              <TypewriterText text="View Cart" as="span" speed={60} />
              {items.length > 0 && (
                <span
                  className="w-2 h-2 rounded-full ml-1 inline-block"
                  style={{
                    background: "#22C55E",
                    boxShadow: "0 0 4px #22C55E, 0 0 10px rgba(57,255,20,0.7)",
                  }}
                />
              )}
            </button>

            {/* 4 main nav links */}
            {navLinks.map((link) =>
              link.label === "Services" && isHomepage ? (
                <div key={link.ocid} style={{ width: "100%" }}>
                  <button
                    type="button"
                    data-ocid="nav.mobile_services.toggle"
                    onClick={() => setMobileServicesOpen((o) => !o)}
                    className="block w-full text-center py-4 transition-all duration-200 bg-transparent"
                    style={{
                      color: "#EEF0F8",
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      boxShadow: "none",
                      fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                      letterSpacing: "0.06em",
                      textDecoration: "none",
                      borderBottom: mobileServicesOpen
                        ? "none"
                        : "1px solid rgba(57,255,20,0.1)",
                      minHeight: "44px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <TypewriterText text="Services" as="span" speed={60} />
                    <span
                      style={{
                        fontSize: "0.7rem",
                        transition: "transform 0.2s",
                        transform: mobileServicesOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        display: "inline-block",
                      }}
                    >
                      ▼
                    </span>
                  </button>
                  {mobileServicesOpen && (
                    <div
                      style={{
                        background: "rgba(57,255,20,0.04)",
                        borderBottom: "1px solid rgba(57,255,20,0.1)",
                      }}
                    >
                      {SERVICE_DROPDOWN_ITEMS.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          data-ocid={`nav.mobile_services.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
                          onClick={() => setMobileOpen(false)}
                          style={{
                            display: "block",
                            textAlign: "center",
                            padding: "12px 20px",
                            color: "#c8d8c8",
                            fontSize: "1rem",
                            textDecoration: "none",
                            fontFamily:
                              "'Plus Jakarta Sans', 'Fira Code', monospace",
                            letterSpacing: "0.04em",
                            borderBottom: "1px solid rgba(57,255,20,0.06)",
                          }}
                        >
                          {item.label}
                        </a>
                      ))}
                      <a
                        href="/services"
                        data-ocid="nav.mobile_services.view_all.link"
                        onClick={() => setMobileOpen(false)}
                        style={{
                          display: "block",
                          textAlign: "center",
                          padding: "12px 20px",
                          color: "#22C55E",
                          fontSize: "1rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          fontFamily:
                            "'Plus Jakarta Sans', 'Fira Code', monospace",
                          letterSpacing: "0.04em",
                        }}
                      >
                        View All Services →
                      </a>
                    </div>
                  )}
                </div>
              ) : link.label === "Services" ? (
                <a
                  key={link.ocid}
                  href={link.href}
                  data-ocid={link.ocid}
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-4 transition-all duration-200"
                  style={{
                    color: "#EEF0F8",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    boxShadow: "none",
                    fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                    letterSpacing: "0.06em",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(57,255,20,0.1)",
                    minHeight: "44px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "#22C55E";
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "0 0 8px rgba(94,240,138,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "#EEF0F8";
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "none";
                  }}
                >
                  <TypewriterText text={link.label} as="span" speed={60} />
                </a>
              ) : (
                <a
                  key={link.ocid}
                  href={link.href}
                  data-ocid={link.ocid}
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-4 transition-all duration-200"
                  style={{
                    color: "#EEF0F8",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    boxShadow: "none",
                    fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                    letterSpacing: "0.06em",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(57,255,20,0.1)",
                    minHeight: "44px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "#22C55E";
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "0 0 8px rgba(94,240,138,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "#EEF0F8";
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "none";
                  }}
                >
                  <TypewriterText text={link.label} as="span" speed={60} />
                </a>
              ),
            )}

            {/* Login */}
            <a
              href="/login"
              data-ocid="nav.mobile_login.link"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-4 transition-all duration-200"
              style={{
                color: "#EEF0F8",
                fontSize: "1.2rem",
                fontWeight: 600,
                background: "none",
                border: "none",
                boxShadow: "none",
                fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                letterSpacing: "0.06em",
                textDecoration: "none",
                borderBottom: "1px solid rgba(57,255,20,0.1)",
                minHeight: "44px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#22C55E";
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "0 0 8px rgba(94,240,138,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#EEF0F8";
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "none";
              }}
            >
              <TypewriterText text="Login" as="span" speed={60} />
            </a>

            {/* Client Portal */}
            <a
              href="/portal"
              data-ocid="nav.mobile_clientportal.link"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-4 transition-all duration-200"
              style={{
                color: "#EEF0F8",
                fontSize: "1.2rem",
                fontWeight: 600,
                background: "none",
                border: "none",
                boxShadow: "none",
                fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                letterSpacing: "0.06em",
                textDecoration: "none",
                borderBottom: "1px solid rgba(57,255,20,0.1)",
                minHeight: "44px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#22C55E";
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "0 0 8px rgba(94,240,138,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#EEF0F8";
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "none";
              }}
            >
              <TypewriterText text="Client Portal" as="span" speed={60} />
            </a>

            {/* Inquire */}
            <a
              href="/intake"
              data-ocid="nav.mobile_inquire.button"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-4 transition-all duration-200"
              style={{
                color: "#EEF0F8",
                fontSize: "1.2rem",
                fontWeight: 600,
                background: "none",
                border: "none",
                boxShadow: "none",
                fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                letterSpacing: "0.06em",
                textDecoration: "none",
                borderBottom: "1px solid rgba(57,255,20,0.1)",
                minHeight: "44px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#22C55E";
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "0 0 8px rgba(94,240,138,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#EEF0F8";
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "none";
              }}
            >
              <TypewriterText text="Inquire" as="span" speed={60} />
            </a>

            {/* Book a Call — plain text, same style as all other items */}
            <a
              href="/book"
              data-ocid="nav.mobile_getstarted.button"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-4 transition-all duration-200"
              style={{
                color: "#EEF0F8",
                fontSize: "1.2rem",
                fontWeight: 600,
                background: "none",
                border: "none",
                boxShadow: "none",
                fontFamily: "'Plus Jakarta Sans', 'Fira Code', monospace",
                letterSpacing: "0.06em",
                textDecoration: "none",
                borderBottom: "1px solid rgba(57,255,20,0.1)",
                minHeight: "44px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#22C55E";
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "0 0 8px rgba(94,240,138,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#EEF0F8";
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "none";
              }}
            >
              <TypewriterText text="Book a Call" as="span" speed={60} />
            </a>
          </nav>
        </dialog>
      )}
    </>
  );
}
