import { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import TypewriterText from "../components/TypewriterText";
import { createActorWithConfig } from "../config";

const GREEN = "#39FF14";

interface SocialMediaConfig {
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
}

// ─── Platform brand colors ─────────────────────────────────────────────────────
const PLATFORMS = [
  { key: "facebookUrl", name: "Facebook", color: "#1877F2", textColor: "#fff" },
  {
    key: "instagramUrl",
    name: "Instagram",
    color: "#E1306C",
    textColor: "#fff",
  },
  { key: "tiktokUrl", name: "TikTok", color: "#000000", textColor: "#ffffff" },
  { key: "linkedinUrl", name: "LinkedIn", color: "#0A66C2", textColor: "#fff" },
  { key: "youtubeUrl", name: "YouTube", color: "#FF0000", textColor: "#fff" },
] as const;

// ─── Platform SVG icons ───────────────────────────────────────────────────────
function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="#1877F2"
      aria-hidden="true"
    >
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.885v2.255h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="#E1306C"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="#ffffff"
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="#0A66C2"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="#FF0000"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function getPlatformIcon(key: string) {
  switch (key) {
    case "facebookUrl":
      return <FacebookIcon />;
    case "instagramUrl":
      return <InstagramIcon />;
    case "tiktokUrl":
      return <TikTokIcon />;
    case "linkedinUrl":
      return <LinkedInIcon />;
    case "youtubeUrl":
      return <YouTubeIcon />;
    default:
      return null;
  }
}

// ─── Embed components ─────────────────────────────────────────────────────────
function FacebookEmbed({ url }: { url: string }) {
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

function InstagramEmbed({ url }: { url: string }) {
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
          border: "1px solid rgba(57,255,20,0.15)",
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

function TikTokEmbed({ url }: { url: string }) {
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

  if (!videoId) {
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
  }

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
          border: "1px solid rgba(57,255,20,0.15)",
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

function LinkedInEmbed({ url }: { url: string }) {
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
        <LinkedInIcon />
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

function YouTubeEmbed({ url }: { url: string }) {
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

function PlatformEmbed({ urlKey, url }: { urlKey: string; url: string }) {
  switch (urlKey) {
    case "facebookUrl":
      return <FacebookEmbed url={url} />;
    case "instagramUrl":
      return <InstagramEmbed url={url} />;
    case "tiktokUrl":
      return <TikTokEmbed url={url} />;
    case "linkedinUrl":
      return <LinkedInEmbed url={url} />;
    case "youtubeUrl":
      return <YouTubeEmbed url={url} />;
    default:
      return null;
  }
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "#111",
        borderRadius: "12px",
        border: "1px solid rgba(94,240,138,0.15)",
        borderTop: "3px solid rgba(94,240,138,0.25)",
        padding: "20px",
        minHeight: "420px",
        animation: "skPulse 1.6s ease-in-out infinite",
      }}
    />
  );
}

// ─── Platform card ────────────────────────────────────────────────────────────
function PlatformCard({
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
      data-ocid={`social_feed.${urlKey.replace("Url", "")}.card`}
      className="matrix-card"
      style={{
        borderRadius: "12px",
        borderTop: `3px solid ${color}`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "16px",
      }}
    >
      {/* Platform header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {getPlatformIcon(urlKey)}
        <TypewriterText
          as="span"
          text={name}
          className="matrix-label font-bold text-[15px] tracking-wide"
          style={{ color }}
          speed={50}
        />
      </div>

      {/* Embed */}
      <div style={{ width: "100%" }}>
        <PlatformEmbed urlKey={urlKey} url={url} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SocialFeedPage() {
  const [config, setConfig] = useState<SocialMediaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Visit tracking
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
          "/social",
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid,
          countryCode,
        );
      } catch {
        // silent
      }
    };
    track();
  }, []);

  // Fetch social media config using the public (no-auth) endpoint
  useEffect(() => {
    const load = async () => {
      try {
        const publicActor = await createActorWithConfig(createActor);
        const cfg = await (
          publicActor as backendInterface
        ).getPublicSocialMediaConfig();
        setConfig(cfg);
      } catch {
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activePlatforms = config
    ? PLATFORMS.filter((p) => {
        const val = config[p.key as keyof SocialMediaConfig];
        return typeof val === "string" && val.trim().length > 0;
      })
    : [];

  return (
    <div
      data-ocid="social_feed.page"
      style={{ minHeight: "100vh", background: "#0A0B14" }}
    >
      <style>{`
        @keyframes skPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .social-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 899px) {
          .social-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 599px) {
          .social-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      <div
        data-ocid="social_feed.header"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "56px 24px 40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(94,240,138,0.08)",
            border: "1px solid rgba(94,240,138,0.18)",
            borderRadius: "999px",
            padding: "4px 16px",
            marginBottom: "20px",
          }}
        >
          <TypewriterText
            as="span"
            text="Stay Connected"
            className="matrix-label text-[11px] font-bold tracking-[0.1em] uppercase"
            speed={50}
          />
        </div>

        <TypewriterText
          as="h1"
          text="Follow Imperidome"
          className="matrix-heading text-[clamp(32px,5vw,52px)] font-extrabold leading-tight tracking-tight mb-4"
          speed={60}
        />

        <TypewriterText
          as="p"
          text="Follow us on social media for the latest updates, launches, and behind-the-scenes content."
          className="matrix-text max-w-[520px] mx-auto text-base leading-relaxed"
          speed={25}
        />

        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(94,240,138,0.3) 40%, rgba(94,240,138,0.3) 60%, transparent)",
            marginTop: "40px",
          }}
        />
      </div>

      {/* Grid */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        {/* Loading state */}
        {loading && (
          <div data-ocid="social_feed.loading_state" className="social-grid">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state — no platforms configured */}
        {!loading && activePlatforms.length === 0 && (
          <div
            data-ocid="social_feed.empty_state"
            style={{
              textAlign: "center",
              padding: "80px 24px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(57,255,20,0.08)",
                border: "1px solid rgba(57,255,20,0.15)",
                marginBottom: "24px",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#39FF14"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </div>
            <TypewriterText
              as="p"
              text="Social media links haven't been configured yet."
              className="matrix-text text-[18px] font-semibold mb-2"
              speed={30}
            />
            <TypewriterText
              as="p"
              text="Check back soon!"
              className="matrix-muted text-[14px]"
              speed={40}
            />
          </div>
        )}

        {/* Platform cards */}
        {!loading && activePlatforms.length > 0 && (
          <div className="social-grid">
            {activePlatforms.map((p) => (
              <PlatformCard
                key={p.key}
                urlKey={p.key}
                name={p.name}
                color={p.color}
                url={
                  (config as SocialMediaConfig)[
                    p.key as keyof SocialMediaConfig
                  ] as string
                }
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
