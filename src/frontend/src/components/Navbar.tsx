import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "../store/useCartStore";
import { EditableText } from "./EditableText";

const navLinks = [
  {
    key: "navbar.link_products",
    label: "Services",
    href: "/services",
    ocid: "nav.products.link",
  },
  {
    key: "navbar.link_process",
    label: "Process",
    href: "/process",
    ocid: "nav.process.link",
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
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  return (
    <>
      <header
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "shadow-nav" : "",
        ].join(" ")}
        style={{
          background: "rgba(10,11,20,0.88)",
          backdropFilter: "blur(60px) saturate(2)",
          WebkitBackdropFilter: "blur(60px) saturate(2)",
          borderBottom: "1px solid rgba(57, 255, 20, 0.2)",
          boxShadow:
            "0 4px 30px rgba(0,0,0,0.5), 0 0 40px rgba(57,255,20,0.05), inset 0 -1px 0 rgba(57,255,20,0.08)",
          backgroundImage:
            "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(57,255,20,0.03) 0%, transparent 70%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[56px] sm:h-[68px] items-center justify-between gap-3 sm:gap-6">
            {/* Logo */}
            <a
              href="/"
              data-ocid="nav.logo.link"
              className="shrink-0 text-[18px] sm:text-[22px] font-bold tracking-tight select-none"
              style={{
                letterSpacing: "-0.01em",
                color: "#5EF08A",
                textShadow:
                  "0 0 4px #39FF14, 0 0 16px rgba(57,255,20,0.6), 0 0 40px rgba(57,255,20,0.3)",
              }}
            >
              <EditableText
                textKey="navbar.logo_text"
                defaultText="IMPERIDOME"
              />
            </a>

            {/* Desktop nav links — 4 items, centered */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.ocid}
                  href={link.href}
                  data-ocid={link.ocid}
                  className="text-[15px] font-medium transition-all duration-200 hover:text-[#39FF14] whitespace-nowrap"
                  style={{
                    color: "#EEF0F8",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "0 0 6px #39FF14, 0 0 20px rgba(57,255,20,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "none";
                  }}
                >
                  <EditableText textKey={link.key} defaultText={link.label} />
                </a>
              ))}
            </nav>

            {/* Desktop right-side actions */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
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
                      background: "#39FF14",
                      boxShadow:
                        "0 0 4px #39FF14, 0 0 10px rgba(57,255,20,0.7)",
                    }}
                  />
                )}
              </button>

              {/* Login — plain text link */}
              <a
                href="/login"
                data-ocid="nav.login.link"
                className="text-sm font-medium whitespace-nowrap transition-all duration-150 hover:text-[#39FF14]"
                style={{ color: "#A0A3B1" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.textShadow =
                    "0 0 6px #39FF14, 0 0 18px rgba(57,255,20,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.textShadow =
                    "none";
                }}
              >
                <EditableText textKey="navbar.btn_login" defaultText="Login" />
              </a>

              {/* Client Portal — outline button */}
              <a
                href="/portal"
                data-ocid="nav.clientportal.button"
                className="inline-block text-sm font-semibold px-4 py-1.5 rounded whitespace-nowrap transition-all duration-200 hover:opacity-90"
                style={{
                  border: "1px solid rgba(57, 255, 20, 0.6)",
                  color: "#39FF14",
                  background: "rgba(57, 255, 20, 0.04)",
                  boxShadow:
                    "0 0 6px rgba(57,255,20,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "0 0 4px #39FF14, 0 0 14px rgba(57,255,20,0.4), 0 0 30px rgba(57,255,20,0.2), inset 0 1px 0 rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor =
                    "#39FF14";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "0 0 6px rgba(57,255,20,0.15), inset 0 1px 0 rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor =
                    "rgba(57, 255, 20, 0.6)";
                }}
              >
                <EditableText
                  textKey="navbar.btn_client_portal"
                  defaultText="Client Portal"
                />
              </a>

              {/* Book a Call — solid neon green CTA */}
              <a
                href="/get-started"
                data-ocid="nav.getstarted.button"
                className="inline-block text-sm font-bold px-4 py-1.5 rounded whitespace-nowrap transition-all duration-200"
                style={{
                  background:
                    "conic-gradient(from 135deg, #2dd400, #39FF14 30%, #4fff2a 45%, #39FF14 60%, #2dd400)",
                  color: "#000",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 4px #39FF14, 0 0 15px rgba(57,255,20,0.6), 0 0 40px rgba(57,255,20,0.3), 0 4px 15px rgba(0,0,0,0.5)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.3), 0 0 6px #39FF14, 0 0 25px rgba(57,255,20,0.8), 0 0 60px rgba(57,255,20,0.5), 0 0 100px rgba(57,255,20,0.3), 0 6px 20px rgba(0,0,0,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 4px #39FF14, 0 0 15px rgba(57,255,20,0.6), 0 0 40px rgba(57,255,20,0.3), 0 4px 15px rgba(0,0,0,0.5)";
                }}
              >
                <EditableText
                  textKey="navbar.btn_book_a_call"
                  defaultText="Book a Call"
                />
              </a>
            </div>

            {/* Mobile hamburger — visible below md (768px) only */}
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

          {/* Tablet-only horizontal scrollable tab strip — hidden on mobile (<768px), shown on md–lg */}
          <div
            className="hidden md:block lg:hidden tabs-scroll-container"
            style={{
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              scrollbarWidth: "none",
              borderTop: "1px solid rgba(57,255,20,0.1)",
              width: "100%",
              minWidth: 0,
            }}
          >
            <nav
              className="flex items-center gap-1"
              style={{
                padding: "0 8px",
                whiteSpace: "nowrap",
                width: "max-content",
                minWidth: "100%",
              }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.ocid}
                  href={link.href}
                  data-ocid={`mobile-strip.${link.ocid}`}
                  className="inline-flex items-center text-[13px] font-medium py-2.5 px-3 transition-all duration-200 hover:text-[#39FF14] shrink-0"
                  style={{ color: "#EEF0F8" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "0 0 6px #39FF14, 0 0 20px rgba(57,255,20,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.textShadow =
                      "none";
                  }}
                >
                  <EditableText textKey={link.key} defaultText={link.label} />
                </a>
              ))}
              <a
                href="/login"
                data-ocid="mobile-strip.nav.login.link"
                className="inline-flex items-center text-[13px] font-medium py-2.5 px-3 transition-all duration-200 hover:text-[#39FF14] shrink-0"
                style={{ color: "#A0A3B1" }}
              >
                <EditableText textKey="navbar.btn_login" defaultText="Login" />
              </a>
              <a
                href="/portal"
                data-ocid="mobile-strip.nav.clientportal.link"
                className="inline-flex items-center text-[13px] font-semibold py-2.5 px-3 transition-all duration-200 shrink-0"
                style={{ color: "#39FF14" }}
              >
                <EditableText
                  textKey="navbar.btn_client_portal"
                  defaultText="Client Portal"
                />
              </a>
              <a
                href="/get-started"
                data-ocid="mobile-strip.nav.getstarted.link"
                className="inline-flex items-center text-[12px] font-bold py-1.5 px-3 rounded shrink-0 ml-1 my-1.5 transition-opacity duration-200 hover:opacity-90"
                style={{
                  background:
                    "conic-gradient(from 135deg, #2dd400, #39FF14 30%, #4fff2a 45%, #39FF14 60%, #2dd400)",
                  color: "#000",
                  boxShadow: "0 0 4px #39FF14, 0 0 12px rgba(57,255,20,0.5)",
                }}
              >
                <EditableText
                  textKey="navbar.btn_book_a_call"
                  defaultText="Book a Call"
                />
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay — full screen, below md breakpoint only */}
      {mobileOpen && (
        <dialog
          id="mobile-nav-overlay"
          open
          aria-label="Navigation menu"
          className="fixed inset-0 z-[100] md:hidden flex flex-col overflow-y-auto"
          style={{
            backgroundColor: "#0A0B14",
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
              className="text-[20px] font-bold tracking-tight select-none"
              style={{
                color: "#5EF08A",
                textShadow:
                  "0 0 4px #39FF14, 0 0 16px rgba(57,255,20,0.6), 0 0 40px rgba(57,255,20,0.3)",
              }}
            >
              IMPERIDOME
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
          <nav className="flex flex-col items-center gap-2 pt-6 px-6 pb-10 flex-1">
            {/* Cart */}
            <button
              type="button"
              onClick={() => {
                openDrawer();
                setMobileOpen(false);
              }}
              className="relative w-full flex items-center justify-center gap-2 py-4"
              style={{
                color: "#EEF0F8",
                fontSize: "1.1rem",
                fontWeight: 600,
                background: "none",
                border: "none",
                borderBottom: "1px solid rgba(57,255,20,0.12)",
                cursor: "pointer",
              }}
              data-ocid="nav.mobile_cart.button"
            >
              <ShoppingBag className="w-5 h-5" />
              <EditableText
                textKey="navbar.btn_view_cart"
                defaultText="View Cart"
              />
              {items.length > 0 && (
                <span
                  className="w-2 h-2 rounded-full ml-1"
                  style={{
                    background: "#39FF14",
                    boxShadow: "0 0 4px #39FF14, 0 0 10px rgba(57,255,20,0.7)",
                  }}
                />
              )}
            </button>

            {/* 4 main nav links */}
            {navLinks.map((link) => (
              <a
                key={link.ocid}
                href={link.href}
                data-ocid={link.ocid}
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center text-xl font-semibold py-4 hover:text-[#39FF14] transition-all duration-150"
                style={{
                  color: "#EEF0F8",
                  borderBottom: "1px solid rgba(57,255,20,0.1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.textShadow =
                    "0 0 8px #39FF14, 0 0 25px rgba(57,255,20,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.textShadow =
                    "none";
                }}
              >
                <EditableText textKey={link.key} defaultText={link.label} />
              </a>
            ))}

            {/* Separator */}
            <div
              className="w-full"
              style={{
                borderBottom: "1px solid rgba(57,255,20,0.12)",
                margin: "4px 0",
              }}
            />

            {/* Login */}
            <a
              href="/login"
              data-ocid="nav.mobile_login.link"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center text-lg font-medium py-3 hover:text-[#39FF14] transition-all duration-150"
              style={{ color: "#A0A3B1" }}
            >
              <EditableText textKey="navbar.btn_login" defaultText="Login" />
            </a>

            {/* Client Portal */}
            <a
              href="/portal"
              data-ocid="nav.mobile_clientportal.link"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center text-lg font-semibold py-3 hover:opacity-80 transition-opacity duration-150"
              style={{
                color: "#39FF14",
                textShadow: "0 0 4px rgba(57,255,20,0.4)",
              }}
            >
              <EditableText
                textKey="navbar.btn_client_portal"
                defaultText="Client Portal"
              />
            </a>

            {/* Book a Call — prominent CTA */}
            <div className="w-full px-0 pt-4">
              <a
                href="/get-started"
                data-ocid="nav.mobile_getstarted.button"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center font-bold text-xl rounded-[8px] px-7 py-4 hover:opacity-90 transition-opacity duration-150 min-h-[56px] flex items-center justify-center"
                style={{
                  background:
                    "conic-gradient(from 135deg, #2dd400, #39FF14 30%, #4fff2a 45%, #39FF14 60%, #2dd400)",
                  color: "#000",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 4px #39FF14, 0 0 20px rgba(57,255,20,0.7), 0 0 50px rgba(57,255,20,0.35), 0 4px 15px rgba(0,0,0,0.5)",
                }}
              >
                <EditableText
                  textKey="navbar.btn_book_a_call"
                  defaultText="Book a Call"
                />
              </a>
            </div>
          </nav>
        </dialog>
      )}
    </>
  );
}
