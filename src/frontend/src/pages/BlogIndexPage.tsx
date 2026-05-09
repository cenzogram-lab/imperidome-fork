import { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { BlogPost, backendInterface } from "../backend";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useSeoMeta } from "../hooks/useSeoMeta";

const GREEN = "#39FF14";
const CARD_BG = "#111111";
const BORDER = "rgba(255,255,255,0.08)";

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: "16px",
        border: `1px solid ${BORDER}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          paddingBottom: "56.25%",
          position: "relative",
          background: "#1a1a1a",
          animation: "skeletonPulse 1.6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            height: "14px",
            width: "72px",
            background: "#1a1a1a",
            borderRadius: "999px",
            animation: "skeletonPulse 1.6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: "22px",
            width: "90%",
            background: "#1a1a1a",
            borderRadius: "6px",
            animation: "skeletonPulse 1.6s ease-in-out infinite 0.1s",
          }}
        />
        <div
          style={{
            height: "22px",
            width: "70%",
            background: "#1a1a1a",
            borderRadius: "6px",
            animation: "skeletonPulse 1.6s ease-in-out infinite 0.15s",
          }}
        />
        <div
          style={{
            height: "14px",
            width: "100%",
            background: "#1a1a1a",
            borderRadius: "4px",
            animation: "skeletonPulse 1.6s ease-in-out infinite 0.2s",
          }}
        />
        <div
          style={{
            height: "14px",
            width: "80%",
            background: "#1a1a1a",
            borderRadius: "4px",
            animation: "skeletonPulse 1.6s ease-in-out infinite 0.25s",
          }}
        />
        <div
          style={{
            height: "14px",
            width: "55%",
            background: "#1a1a1a",
            borderRadius: "4px",
            animation: "skeletonPulse 1.6s ease-in-out infinite 0.3s",
          }}
        />
      </div>
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const [hovered, setHovered] = useState(false);
  const pubDate = post.published_at ? formatDate(post.published_at) : "";

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: CARD_BG,
        borderRadius: "16px",
        border: `1px solid ${hovered ? "rgba(57,255,20,0.25)" : BORDER}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition:
          "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        transform: hovered ? "scale(1.02)" : "scale(1)",
        boxShadow: hovered
          ? "0 0 20px rgba(57,255,20,0.15), 0 8px 32px rgba(0,0,0,0.4)"
          : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* 16:9 featured image */}
      <div
        style={{
          paddingBottom: "56.25%",
          position: "relative",
          overflow: "hidden",
          background: "#0d0d0d",
        }}
      >
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt={post.title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, #111 0%, #1a1a1a 50%, #222 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "64px",
                fontWeight: 900,
                color: "rgba(57,255,20,0.08)",
                letterSpacing: "-0.04em",
                userSelect: "none",
              }}
            >
              I
            </span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          flex: 1,
        }}
      >
        {/* Category badge */}
        {post.category && (
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
              alignSelf: "flex-start",
              border: "1px solid rgba(57,255,20,0.18)",
            }}
          >
            {post.category}
          </span>
        )}

        {/* Title */}
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "rgba(156,163,175,0.8)",
              lineHeight: 1.65,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}
          >
            {post.excerpt}
          </p>
        )}

        {/* Author + date */}
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: "rgba(156,163,175,0.55)",
            letterSpacing: "0.01em",
          }}
        >
          {post.author}
          {pubDate ? ` · ${pubDate}` : ""}
        </p>

        {/* Read More button */}
        <a
          href={`/blog/${post.slug}`}
          style={{
            display: "block",
            textAlign: "center",
            padding: "10px 20px",
            borderRadius: "8px",
            border: `1px solid ${GREEN}`,
            color: GREEN,
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.2s, color 0.2s",
            marginTop: "4px",
            background: hovered ? "rgba(57,255,20,0.08)" : "transparent",
          }}
          data-ocid="blog.card.read_more"
        >
          <EditableText
            textKey="blog.card.read_more_text"
            defaultText="Read More →"
          />
        </a>
      </div>
    </article>
  );
}

export default function BlogIndexPage() {
  useSeoMeta("blog", "Blog — Imperidome");
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

  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isFetching || !actor) return;
    let cancelled = false;
    actor
      .getPublishedBlogPosts()
      .then((data) => {
        if (!cancelled) {
          const sorted = [...data].sort((a, b) => {
            const ta = a.published_at ? Number(a.published_at) : 0;
            const tb = b.published_at ? Number(b.published_at) : 0;
            return tb - ta;
          });
          setPosts(sorted);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  const isLoading = isFetching || posts === null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        @media (max-width: 1024px) {
          .blog-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .blog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      {/* Page header */}
      <section
        style={{
          background: "#0a0a0a",
          padding: "72px 32px 56px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(57,255,20,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <EditableText
            textKey="blog.hero.heading"
            defaultText="The Imperidome Blog"
            as="h1"
            style={{
              margin: "0 0 8px",
              fontSize: "clamp(34px, 5vw, 52px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          />
          {/* Neon underline accent */}
          <div
            style={{
              width: "64px",
              height: "3px",
              background: GREEN,
              borderRadius: "2px",
              margin: "12px auto 20px",
              boxShadow: `0 0 10px ${GREEN}`,
            }}
          />
          <EditableText
            textKey="blog.hero.subtext"
            defaultText="Insights, case studies, and agency news"
            as="p"
            style={{
              margin: 0,
              fontSize: "17px",
              color: "rgba(156,163,175,0.75)",
              maxWidth: "520px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.65,
            }}
          />
        </div>
      </section>

      {/* Posts grid */}
      <section
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 96px" }}
        data-ocid="blog.posts.section"
      >
        {error && (
          <div
            data-ocid="blog.posts.error_state"
            style={{ textAlign: "center", padding: "64px 0" }}
          >
            <p
              style={{
                color: "#f87171",
                fontSize: "15px",
                marginBottom: "12px",
              }}
            >
              Could not load posts. Please try refreshing.
            </p>
          </div>
        )}

        {isLoading && !error && (
          <div className="blog-grid" data-ocid="blog.posts.loading_state">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!isLoading && !error && posts !== null && posts.length === 0 && (
          <div
            data-ocid="blog.posts.empty_state"
            style={{ textAlign: "center", padding: "96px 0" }}
          >
            <div
              style={{
                width: "48px",
                height: "2px",
                background: GREEN,
                margin: "0 auto 24px",
                boxShadow: `0 0 8px ${GREEN}`,
              }}
            />
            <p
              style={{
                fontSize: "18px",
                color: "rgba(255,255,255,0.6)",
                margin: 0,
              }}
            >
              <EditableText
                textKey="blog.empty.text"
                defaultText="No posts yet. Check back soon."
              />
            </p>
          </div>
        )}

        {!isLoading && !error && posts !== null && posts.length > 0 && (
          <div className="blog-grid">
            {posts.map((post, idx) => (
              <div
                key={String(post.id)}
                data-ocid={`blog.posts.item.${idx + 1}`}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
