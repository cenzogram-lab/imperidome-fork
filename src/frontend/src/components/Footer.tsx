import { useEffect } from "react";
import { createActor } from "../backend";
import { createActorWithConfig } from "../config";
import { useSiteTextStore } from "../store/useSiteTextStore";
import { EditableText } from "./EditableText";

// ─── Social SVG Icons ─────────────────────────────────────────────────────────
function InstagramIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.28 8.28 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  );
}

export function Footer() {
  const getText = useSiteTextStore((s) => s.getText);
  const fetchAllSiteText = useSiteTextStore((s) => s.fetchAllSiteText);

  // Hydrate the site text store when Footer is rendered on public pages that
  // don't otherwise call fetchAllSiteText (e.g. the homepage). The call is
  // idempotent — if another component already hydrated the store this is a
  // no-op refresh. Uses createActorWithConfig to avoid waiting for useActor's
  // identity resolution, which stays pending for anonymous visitors.
  useEffect(() => {
    let cancelled = false;
    createActorWithConfig(createActor)
      .then((publicActor) => {
        if (!cancelled) fetchAllSiteText(publicActor);
      })
      .catch(() => {
        // Silently fall back to default "#" placeholder URLs
      });
    return () => {
      cancelled = true;
    };
  }, [fetchAllSiteText]);

  const instagramUrl = getText("social.instagram_url", "#");
  const twitterUrl = getText("social.twitter_url", "#");
  const linkedinUrl = getText("social.linkedin_url", "#");
  const tiktokUrl = getText("social.tiktok_url", "#");
  const youtubeUrl = getText("social.youtube_url", "#");

  const socialLinks = [
    {
      label: "Instagram",
      url: instagramUrl,
      Icon: InstagramIcon,
      ocid: "footer.social.instagram",
    },
    {
      label: "X (Twitter)",
      url: twitterUrl,
      Icon: XIcon,
      ocid: "footer.social.twitter",
    },
    {
      label: "LinkedIn",
      url: linkedinUrl,
      Icon: LinkedInIcon,
      ocid: "footer.social.linkedin",
    },
    {
      label: "TikTok",
      url: tiktokUrl,
      Icon: TikTokIcon,
      ocid: "footer.social.tiktok",
    },
    {
      label: "YouTube",
      url: youtubeUrl,
      Icon: YouTubeIcon,
      ocid: "footer.social.youtube",
    },
  ];

  const services = [
    {
      key: "footer.products_link_custom_sites",
      label: "Custom Sites",
      href: "/services/custom-sites",
    },
    {
      key: "footer.products_link_speedy_sites",
      label: "Speedy Sites",
      href: "/services/speedy-sites",
    },
    {
      key: "footer.products_link_saas_plans",
      label: "SaaS Plans",
      href: "/services/saas-plans",
    },
    {
      key: "footer.products_link_cinematic_ads",
      label: "Cinematic Ads",
      href: "/services/cinematic-ads",
    },
    {
      key: "footer.products_link_product_ads",
      label: "Product Ads",
      href: "/services/product-ads",
    },
    {
      key: "footer.products_link_ai_receptionist",
      label: "AI Receptionist",
      href: "/services/ai-receptionist",
    },
    {
      key: "footer.products_link_growth_hub",
      label: "Growth Hub",
      href: "/services/growth-hub",
    },
  ];

  const company = [
    { key: "footer.company_link_about", label: "About", href: "/about" },
    {
      key: "footer.company_link_how_it_works",
      label: "Process",
      href: "/process",
    },
    {
      key: "footer.company_link_get_started",
      label: "Get Started",
      href: "/get-started",
    },
    { key: "footer.company_link_blog", label: "Blog", href: "/blog" },
    {
      key: "footer.company_link_platform_limitations",
      label: "Platform Limitations",
      href: "/platform-limitations",
    },
    {
      key: "footer.company_link_referral",
      label: "Referral Program",
      href: "/referral",
    },
    { key: "footer.company_link_login", label: "Login", href: "/login" },
  ];

  const legal = [
    {
      key: "footer.legal_link_terms",
      label: "Terms of Service",
      href: "/terms",
    },
    {
      key: "footer.legal_link_refund",
      label: "Refund Policy",
      href: "/terms#sec-8",
    },
    {
      key: "footer.legal_link_privacy",
      label: "Privacy Policy",
      href: "/privacy",
    },
  ];

  const linkHoverStyle = {
    onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
      (e.currentTarget as HTMLAnchorElement).style.textShadow =
        "0 0 6px #39FF14, 0 0 18px rgba(57,255,20,0.4)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
      (e.currentTarget as HTMLAnchorElement).style.textShadow = "none";
    },
  };

  return (
    <footer
      style={{
        backgroundColor: "#060708",
        borderTop: "1px solid rgba(57, 255, 20, 0.3)",
        boxShadow:
          "0 -4px 40px rgba(57,255,20,0.06), 0 -1px 0 rgba(57,255,20,0.15), inset 0 1px 0 rgba(57,255,20,0.08)",
        backgroundImage:
          "radial-gradient(ellipse 80% 30% at 50% 0%, rgba(57,255,20,0.04) 0%, transparent 60%)",
      }}
    >
      {/* Main footer columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Column 1: Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <span
              className="font-bold text-2xl tracking-tight"
              style={{
                color: "#5EF08A",
                textShadow:
                  "0 0 4px #39FF14, 0 0 16px rgba(57,255,20,0.6), 0 0 40px rgba(57,255,20,0.3)",
              }}
            >
              <EditableText
                textKey="footer.brand_title"
                defaultText="IMPERIDOME"
              />
            </span>
            <p className="text-sm leading-relaxed" style={{ color: "#7A7D90" }}>
              <EditableText
                textKey="footer.brand_tagline"
                defaultText="Better than a freelancer. Faster than an agency. Priced for the real world."
              />
            </p>
            <p className="text-sm mt-auto" style={{ color: "#7A7D90" }}>
              <EditableText
                textKey="footer.copyright"
                defaultText="@ 2026 Imperidome"
              />
            </p>
          </div>

          {/* Column 2: Services */}
          <div className="flex flex-col gap-3">
            <h3
              className="font-semibold text-sm uppercase tracking-wider mb-1"
              style={{ color: "#EEF0F8" }}
            >
              <EditableText
                textKey="footer.products_heading"
                defaultText="Services"
              />
            </h3>
            {services.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm transition-all duration-150 hover:text-[#5EF08A]"
                style={{ color: "#7A7D90" }}
                data-ocid="footer.services.link"
                {...linkHoverStyle}
              >
                <EditableText textKey={item.key} defaultText={item.label} />
              </a>
            ))}
          </div>

          {/* Column 3: Company */}
          <div className="flex flex-col gap-3">
            <h3
              className="font-semibold text-sm uppercase tracking-wider mb-1"
              style={{ color: "#EEF0F8" }}
            >
              <EditableText
                textKey="footer.company_heading"
                defaultText="Company"
              />
            </h3>
            {company.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm transition-all duration-150 hover:text-[#5EF08A]"
                style={{ color: "#7A7D90" }}
                data-ocid="footer.company.link"
                {...linkHoverStyle}
              >
                <EditableText textKey={item.key} defaultText={item.label} />
              </a>
            ))}
          </div>

          {/* Column 4: Legal */}
          <div className="flex flex-col gap-3">
            <h3
              className="font-semibold text-sm uppercase tracking-wider mb-1"
              style={{ color: "#EEF0F8" }}
            >
              <EditableText
                textKey="footer.legal_heading"
                defaultText="Legal"
              />
            </h3>
            {legal.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm transition-all duration-150 hover:text-[#5EF08A]"
                style={{ color: "#7A7D90" }}
                data-ocid="footer.legal.link"
                {...linkHoverStyle}
              >
                <EditableText textKey={item.key} defaultText={item.label} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Social icons row */}
      <div
        style={{
          borderTop: "1px solid rgba(57, 255, 20, 0.12)",
          boxShadow: "inset 0 1px 0 rgba(57,255,20,0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-center flex-wrap gap-4 sm:gap-5">
          {socialLinks.map(({ label, url, Icon, ocid }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              data-ocid={ocid}
              style={{
                color: "#7A7D90",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "8px",
                border: "1px solid rgba(57,255,20,0.12)",
                background: "rgba(57,255,20,0.03)",
                transition:
                  "color 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color = "#5EF08A";
                el.style.borderColor = "rgba(57,255,20,0.5)";
                el.style.background = "rgba(57,255,20,0.08)";
                el.style.boxShadow = "0 0 10px rgba(57,255,20,0.2)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color = "#7A7D90";
                el.style.borderColor = "rgba(57,255,20,0.12)";
                el.style.background = "rgba(57,255,20,0.03)";
                el.style.boxShadow = "none";
              }}
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid rgba(57, 255, 20, 0.08)",
          boxShadow: "inset 0 1px 0 rgba(57,255,20,0.04)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
          <p
            className="text-sm text-center sm:text-left"
            style={{ color: "#7A7D90" }}
          >
            <EditableText
              textKey="footer.bottom_disclaimer"
              defaultText="Imperidome LLC."
            />
          </p>
          <a
            href="/terms"
            className="text-sm transition-all duration-150 hover:text-[#5EF08A]"
            style={{ color: "#7A7D90" }}
            data-ocid="footer.terms.link"
            {...linkHoverStyle}
          >
            <EditableText
              textKey="footer.terms_conditions_link"
              defaultText="Terms &amp; Conditions"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
