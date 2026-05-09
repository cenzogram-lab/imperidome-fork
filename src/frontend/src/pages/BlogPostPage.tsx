import { useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import type { BlogPost, backendInterface } from "../backend";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";

const GREEN = "#39FF14";

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Link Unfurling helpers ────────────────────────────────────────────────────

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Extract TikTok video ID */
function extractTikTokId(url: string): string | null {
  const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return m ? m[1] : null;
}

/** Extract Instagram post/reel ID */
function extractInstagramId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

/** True if URL is a standalone image link */
function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);
}

/** Strip script tags from HTML (basic XSS reduction) */
function stripScripts(html: string): string {
  return html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
}

interface MediaBlock {
  type: "youtube" | "tiktok" | "instagram" | "image" | "html";
  videoId?: string;
  url?: string;
  html?: string;
}

/**
 * Parse body text into an array of blocks.
 * Standalone URLs on their own line are converted to embeds.
 * Everything else is HTML passthrough.
 */
function parseBodyToBlocks(body: string): MediaBlock[] {
  const blocks: MediaBlock[] = [];
  const lines = body.split(/\n/);
  let htmlAccum = "";

  const flushHtml = () => {
    if (htmlAccum.trim()) {
      blocks.push({ type: "html", html: htmlAccum });
    }
    htmlAccum = "";
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Check if the line is a standalone URL
    const isUrl = /^https?:\/\/\S+$/.test(line);

    if (isUrl) {
      const ytId = extractYouTubeId(line);
      if (ytId) {
        flushHtml();
        blocks.push({ type: "youtube", videoId: ytId, url: line });
        continue;
      }

      const ttId = extractTikTokId(line);
      if (ttId) {
        flushHtml();
        blocks.push({ type: "tiktok", videoId: ttId, url: line });
        continue;
      }

      const igId = extractInstagramId(line);
      if (igId) {
        flushHtml();
        blocks.push({ type: "instagram", videoId: igId, url: line });
        continue;
      }

      if (isImageUrl(line)) {
        flushHtml();
        blocks.push({ type: "image", url: line });
        continue;
      }
    }

    // Also detect <img src="..."> tags for standalone image URLs in HTML
    // and standalone YouTube/Instagram links embedded inside href or src
    htmlAccum += `${rawLine}\n`;
  }

  flushHtml();
  return blocks;
}

// ─── TikTok embed — loads embed.js once ───────────────────────────────────────
function TikTokEmbed({ url, videoId }: { url: string; videoId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load tiktok embed.js if not already present
    if (
      !document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
    ) {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If already loaded, trigger re-render
      const w = window as Window & { tiktokEmbed?: { reload: () => void } };
      if (w.tiktokEmbed) w.tiktokEmbed.reload();
    }
  }, []);

  return (
    <div
      ref={ref}
      style={{ maxWidth: "605px", minWidth: "325px", margin: "24px auto" }}
    >
      <blockquote
        className="tiktok-embed"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted embed
        dangerouslySetInnerHTML={{
          __html: `<section><a target="_blank" href="${url}">TikTok video ${videoId}</a></section>`,
        }}
        // @ts-ignore — custom data attribute
        cite={url}
        data-video-id={videoId}
        style={{
          maxWidth: "605px",
          minWidth: "325px",
          background: "#1a1a1a",
          borderRadius: "12px",
          border: "1px solid rgba(57,255,20,0.2)",
        }}
      />
    </div>
  );
}

// ─── Block renderer ───────────────────────────────────────────────────────────
function BlockRenderer({ block }: { block: MediaBlock }) {
  switch (block.type) {
    case "youtube":
      return (
        <div
          style={{ margin: "28px 0", borderRadius: "12px", overflow: "hidden" }}
        >
          <div
            style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${block.videoId}`}
              title="YouTube video"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "12px",
                outline: "1px solid rgba(57,255,20,0.25)",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );

    case "instagram":
      return (
        <div
          style={{
            margin: "28px auto",
            textAlign: "center",
            maxWidth: "480px",
          }}
        >
          <iframe
            src={`https://www.instagram.com/p/${block.videoId}/embed`}
            width="400"
            height="480"
            style={{
              border: "none",
              borderRadius: "12px",
              display: "block",
              margin: "0 auto",
              maxWidth: "100%",
            }}
            title="Instagram embed"
            loading="lazy"
          />
        </div>
      );

    case "tiktok":
      return <TikTokEmbed url={block.url!} videoId={block.videoId!} />;

    case "image":
      return (
        <div style={{ margin: "24px 0" }}>
          <img
            src={block.url}
            alt="Embedded media"
            style={{
              width: "100%",
              borderRadius: "12px",
              display: "block",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            loading="lazy"
          />
        </div>
      );

    case "html":
      return (
        <div
          className="blog-body"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted CMS content, scripts stripped
          dangerouslySetInnerHTML={{ __html: stripScripts(block.html ?? "") }}
        />
      );

    default:
      return null;
  }
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div style={{ maxWidth: "768px", margin: "64px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            height: "360px",
            background: "#111",
            borderRadius: "16px",
            animation: "skPulse 1.6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: "14px",
            width: "80px",
            background: "#111",
            borderRadius: "999px",
            animation: "skPulse 1.6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: "40px",
            width: "85%",
            background: "#111",
            borderRadius: "8px",
            animation: "skPulse 1.6s ease-in-out infinite 0.1s",
          }}
        />
        <div
          style={{
            height: "16px",
            width: "220px",
            background: "#111",
            borderRadius: "4px",
            animation: "skPulse 1.6s ease-in-out infinite 0.2s",
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const { actor, isFetching } = useActor();

  useEffect(() => {
    const track = async () => {
      try {
        let sid = sessionStorage.getItem("_vis_sid");
        if (!sid) {
          sid = crypto.randomUUID();
          sessionStorage.setItem("_vis_sid", sid);
        }
        let countryCode: string | null = null;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 2000);
          const res = await fetch("https://ipapi.co/country/", {
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          const text = (await res.text()).trim();
          if (/^[A-Z]{2}$/.test(text)) countryCode = text;
        } catch {
          // geolocation failed — use null
        }
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

  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isFetching || !actor || !slug) return;
    let cancelled = false;
    actor
      .getBlogPostBySlug(slug)
      .then((data) => {
        if (!cancelled) setPost(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, slug]);

  const isLoading = isFetching || post === undefined;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <style>{`
        @keyframes skPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .blog-body {
          font-size: 17px;
          line-height: 1.85;
          color: rgba(209,213,219,0.9);
        }
        .blog-body p {
          margin: 0 0 1.3em;
        }
        .blog-body h2 {
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
          margin: 2em 0 0.75em;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        .blog-body h3 {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin: 1.75em 0 0.6em;
          line-height: 1.35;
        }
        .blog-body h4 {
          font-size: 17px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          margin: 1.5em 0 0.5em;
        }
        .blog-body a {
          color: ${GREEN};
          text-decoration: none;
          border-bottom: 1px solid rgba(57,255,20,0.3);
          transition: border-color 0.15s;
        }
        .blog-body a:hover {
          border-bottom-color: ${GREEN};
        }
        .blog-body ul, .blog-body ol {
          padding-left: 1.5em;
          margin: 0 0 1.3em;
          color: rgba(209,213,219,0.85);
        }
        .blog-body li {
          margin-bottom: 0.45em;
        }
        .blog-body blockquote {
          border-left: 4px solid ${GREEN};
          margin: 1.75em 0;
          padding: 0.6em 0 0.6em 1.25em;
          color: rgba(156,163,175,0.85);
          font-style: italic;
          background: rgba(57,255,20,0.03);
          border-radius: 0 8px 8px 0;
        }
        .blog-body code {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.88em;
          color: rgba(255,255,255,0.85);
        }
        .blog-body pre {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 20px;
          overflow-x: auto;
          margin: 0 0 1.3em;
        }
        .blog-body pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 14px;
          color: rgba(209,213,219,0.9);
        }
        .blog-body hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin: 2.5em 0;
        }
        .blog-body strong {
          color: #ffffff;
          font-weight: 700;
        }
        .blog-body img {
          width: 100%;
          border-radius: 12px;
          margin: 16px 0;
          border: 1px solid rgba(255,255,255,0.08);
        }
      `}</style>

      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      {/* Loading */}
      {isLoading && <PostSkeleton />}

      {/* Error */}
      {error && (
        <div
          data-ocid="blog_post.error_state"
          style={{
            maxWidth: "720px",
            margin: "64px auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{ color: "#f87171", fontSize: "15px", marginBottom: "16px" }}
          >
            Could not load this post.
          </p>
          <a
            href="/blog"
            style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}
          >
            ← Back to Blog
          </a>
        </div>
      )}

      {/* Not found */}
      {!isLoading && !error && post === null && (
        <div
          style={{
            maxWidth: "720px",
            margin: "64px auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: "10px",
            }}
          >
            Post not found.
          </p>
          <p style={{ color: "rgba(156,163,175,0.7)", marginBottom: "28px" }}>
            This post may have been moved or removed.
          </p>
          <a
            href="/blog"
            style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}
          >
            ← Back to Blog
          </a>
        </div>
      )}

      {/* Article */}
      {!isLoading && !error && post && (
        <article
          data-ocid="blog_post.section"
          style={{ paddingBottom: "80px" }}
        >
          {/* Featured image — full bleed */}
          {post.featured_image_url && (
            <div>
              <div
                style={{
                  width: "100%",
                  maxHeight: "500px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  style={{
                    width: "100%",
                    height: "500px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {/* Dark gradient overlay bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "200px",
                    background: "linear-gradient(transparent, #0a0a0a)",
                    pointerEvents: "none",
                  }}
                />
              </div>
              {/* Featured image caption */}
              {(post as typeof post & { featuredImageCaption?: string })
                .featuredImageCaption && (
                <p
                  data-ocid="blog_post.image_caption"
                  style={{
                    textAlign: "center",
                    fontStyle: "italic",
                    fontSize: "13px",
                    color: "#7A7D90",
                    margin: "10px auto 0",
                    maxWidth: "768px",
                    padding: "0 24px",
                  }}
                >
                  {
                    (post as typeof post & { featuredImageCaption?: string })
                      .featuredImageCaption
                  }
                </p>
              )}
            </div>
          )}

          {/* Content container */}
          <div
            style={{
              maxWidth: "768px",
              margin: "0 auto",
              padding: post.featured_image_url ? "40px 24px 0" : "56px 24px 0",
            }}
          >
            {/* Back link */}
            <a
              href="/blog"
              data-ocid="blog_post.back_link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: GREEN,
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                marginBottom: "28px",
                opacity: 0.9,
              }}
            >
              ← Back to Blog
            </a>

            {/* Category badge */}
            {post.category && (
              <div style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(57,255,20,0.08)",
                    color: GREEN,
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: "1px solid rgba(57,255,20,0.18)",
                  }}
                >
                  {post.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1
              style={{
                margin: "0 0 16px",
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
              }}
            >
              {post.title}
            </h1>

            {/* Author + date */}
            <p
              style={{
                margin: "0 0 28px",
                fontSize: "13px",
                color: "rgba(156,163,175,0.6)",
                letterSpacing: "0.01em",
              }}
            >
              By {post.author}
              {post.published_at ? ` · ${formatDate(post.published_at)}` : ""}
            </p>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, rgba(57,255,20,0.35) 0%, rgba(255,255,255,0.06) 60%, transparent 100%)",
                marginBottom: "40px",
              }}
            />

            {/* Body — parsed with Link Unfurling engine */}
            <div data-ocid="blog_post.body">
              {parseBodyToBlocks(post.body).map((block, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static parsed blocks
                <BlockRenderer key={i} block={block} />
              ))}
            </div>

            {/* Bottom back link */}
            <div
              style={{
                marginTop: "56px",
                paddingTop: "28px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <a
                href="/blog"
                style={{
                  color: GREEN,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                ← Back to Blog
              </a>
            </div>
          </div>
        </article>
      )}

      <Footer />
    </div>
  );
}
