import { useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import type { BlogPost, backendInterface } from "../backend";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import TypewriterText from "../components/TypewriterText";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";

const GREEN = "#22C55E";

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}
function extractTikTokId(url: string): string | null {
  const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return m ? m[1] : null;
}
function extractInstagramId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}
function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);
}
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

function parseBodyToBlocks(body: string): MediaBlock[] {
  const blocks: MediaBlock[] = [];
  const lines = body.split(/\n/);
  let htmlAccum = "";
  const flushHtml = () => {
    if (htmlAccum.trim()) blocks.push({ type: "html", html: htmlAccum });
    htmlAccum = "";
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
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
    htmlAccum += `${rawLine}\n`;
  }
  flushHtml();
  return blocks;
}

function TikTokEmbed({ url, videoId }: { url: string; videoId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
    ) {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
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
          background: "#0c0f1e",
          borderRadius: "12px",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      />
    </div>
  );
}

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
                outline: "1px solid rgba(34,197,94,0.25)",
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
              border: "1px solid rgba(34,197,94,0.15)",
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

function PostSkeleton() {
  return (
    <div style={{ maxWidth: "768px", margin: "64px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {[
          { h: "360px", w: "100%" },
          { h: "14px", w: "80px" },
          { h: "40px", w: "85%" },
          { h: "16px", w: "220px" },
        ].map((s, _i) => (
          <div
            key={`${s.h}-${s.w}`}
            style={{
              height: s.h,
              width: s.w,
              background: "rgba(34,197,94,0.05)",
              borderRadius: "8px",
              animation: "skPulse 1.6s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
        const countryCode: string | null = null;
        const publicActor = await createActorWithConfig(createActor);
        await (publicActor as backendInterface).recordVisit(
          window.location.pathname,
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid!,
          countryCode,
        );
      } catch {
        /* silent */
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
    <div className="bg-slate-900" style={{ minHeight: "100vh" }}>
      <style>{`
        @keyframes skPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        .blog-body { font-size: 17px; line-height: 1.85; color: rgba(200,210,200,0.85); font-family: 'Plus Jakarta Sans', monospace; }
        .blog-body p { margin: 0 0 1.3em; }
        .blog-body h2 { font-size: 24px; font-weight: 700; color: #22C55E; margin: 2em 0 0.75em; letter-spacing: -0.02em; line-height: 1.3; font-family: 'Plus Jakarta Sans', monospace; }
        .blog-body h3 { font-size: 19px; font-weight: 700; color: #22C55E; margin: 1.75em 0 0.6em; font-family: 'Plus Jakarta Sans', monospace; }
        .blog-body h4 { font-size: 16px; font-weight: 700; color: rgba(34,197,94,0.8); margin: 1.5em 0 0.5em; }
        .blog-body a { color: #22C55E; text-decoration: none; border-bottom: 1px solid rgba(34,197,94,0.3); transition: border-color 0.15s; }
        .blog-body a:hover { border-bottom-color: #22C55E; }
        .blog-body ul, .blog-body ol { padding-left: 1.5em; margin: 0 0 1.3em; color: rgba(200,210,200,0.8); }
        .blog-body li { margin-bottom: 0.45em; }
        .blog-body blockquote { border-left: 3px solid #22C55E; margin: 1.75em 0; padding: 0.6em 0 0.6em 1.25em; color: rgba(160,180,160,0.8); font-style: italic; background: rgba(34,197,94,0.03); border-radius: 0 8px 8px 0; }
        .blog-body code { background: rgba(34,197,94,0.07); border: 1px solid rgba(34,197,94,0.15); padding: 2px 6px; border-radius: 4px; font-size: 0.88em; color: #22C55E; }
        .blog-body pre { background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.12); border-radius: 10px; padding: 20px; overflow-x: auto; margin: 0 0 1.3em; }
        .blog-body pre code { background: none; border: none; padding: 0; font-size: 14px; color: rgba(200,210,200,0.9); }
        .blog-body hr { border: none; border-top: 1px solid rgba(34,197,94,0.15); margin: 2.5em 0; }
        .blog-body strong { color: #22C55E; font-weight: 700; }
        .blog-body img { width: 100%; border-radius: 12px; margin: 16px 0; border: 1px solid rgba(34,197,94,0.15); }
      `}</style>

      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      {isLoading && <PostSkeleton />}

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
            className="matrix-badge-red"
            style={{
              display: "inline-block",
              padding: "8px 18px",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <TypewriterText text="Could not load this post." speed={20} />
          </p>
          <br />
          <a
            href="/blog"
            style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}
          >
            ← Back to Blog
          </a>
        </div>
      )}

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
            className="matrix-heading"
            style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}
          >
            <TypewriterText text="Post not found." speed={30} />
          </p>
          <p className="matrix-muted" style={{ marginBottom: "28px" }}>
            <TypewriterText
              text="This post may have been moved or removed."
              speed={20}
            />
          </p>
          <a
            href="/blog"
            style={{ color: GREEN, fontWeight: 600, textDecoration: "none" }}
          >
            ← Back to Blog
          </a>
        </div>
      )}

      {!isLoading && !error && post && (
        <article
          data-ocid="blog_post.section"
          style={{ paddingBottom: "80px" }}
        >
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
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "200px",
                    background: "linear-gradient(transparent, #0A0B14)",
                    pointerEvents: "none",
                  }}
                />
              </div>
              {(post as typeof post & { featuredImageCaption?: string })
                .featuredImageCaption && (
                <p
                  data-ocid="blog_post.image_caption"
                  className="matrix-muted"
                  style={{
                    textAlign: "center",
                    fontStyle: "italic",
                    fontSize: "13px",
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

          <div
            style={{
              maxWidth: "768px",
              margin: "0 auto",
              padding: post.featured_image_url ? "40px 24px 0" : "56px 24px 0",
            }}
          >
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

            {post.category && (
              <div style={{ marginBottom: "16px" }}>
                <span className="matrix-badge">{post.category}</span>
              </div>
            )}

            <h1
              className="matrix-heading"
              style={{
                margin: "0 0 16px",
                fontSize: "clamp(26px, 4vw, 40px)",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
              }}
            >
              <TypewriterText text={post.title} speed={20} />
            </h1>

            <p
              className="matrix-muted"
              style={{
                margin: "0 0 28px",
                fontSize: "13px",
                letterSpacing: "0.01em",
              }}
            >
              <TypewriterText
                text={`By ${post.author}${post.published_at ? ` · ${formatDate(post.published_at)}` : ""}`}
                speed={15}
              />
            </p>

            <div className="matrix-divider" style={{ marginBottom: "40px" }} />

            <div data-ocid="blog_post.body">
              {parseBodyToBlocks(post.body).map((block, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static parsed blocks
                <BlockRenderer key={i} block={block} />
              ))}
            </div>

            <div
              style={{
                marginTop: "56px",
                paddingTop: "28px",
                borderTop: "1px solid rgba(34,197,94,0.12)",
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
