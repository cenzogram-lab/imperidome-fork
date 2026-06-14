import { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { BlogPost, backendInterface } from "../backend";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import TypewriterText from "../components/TypewriterText";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useSeoMeta } from "../hooks/useSeoMeta";

const GREEN = "#5EF08A";
const CARD_BG = "rgba(11,13,26,0.85)";
const BORDER_DIM = "rgba(94,240,138,0.12)";
const BORDER_HOV = "rgba(94,240,138,0.45)";

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
    <div className="matrix-card" style={{ overflow: "hidden" }}>
      <div
        style={{
          paddingBottom: "56.25%",
          position: "relative",
          background: "#0a0d1a",
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
        {["72px", "90%", "70%", "100%", "80%", "55%"].map((w, i) => (
          <div
            key={w}
            style={{
              height: i < 2 ? "18px" : "13px",
              width: w,
              background: "rgba(94,240,138,0.06)",
              borderRadius: "4px",
              animation: `skeletonPulse 1.6s ease-in-out infinite ${i * 0.05}s`,
            }}
          />
        ))}
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
        borderRadius: "12px",
        border: `1px solid ${hovered ? BORDER_HOV : BORDER_DIM}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition:
          "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        transform: hovered ? "scale(1.02)" : "scale(1)",
        boxShadow: hovered
          ? "0 0 20px rgba(94,240,138,0.18), 0 8px 32px rgba(0,0,0,0.5)"
          : "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      {/* 16:9 featured image */}
      <div
        style={{
          paddingBottom: "56.25%",
          position: "relative",
          overflow: "hidden",
          background: "#070910",
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
                "linear-gradient(135deg, #060810 0%, #0c0f1e 50%, #111628 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "64px",
                fontWeight: 900,
                color: "rgba(94,240,138,0.06)",
                letterSpacing: "-0.04em",
                userSelect: "none",
                fontFamily: "monospace",
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
        {post.category && <span className="matrix-badge">{post.category}</span>}

        <h3
          className="matrix-heading"
          style={{
            fontSize: "17px",
            fontWeight: 700,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          <TypewriterText text={post.title} speed={25} />
        </h3>

        {post.excerpt && (
          <p
            className="matrix-text"
            style={{
              fontSize: "13px",
              lineHeight: 1.65,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}
          >
            <TypewriterText text={post.excerpt} speed={12} />
          </p>
        )}

        <p
          className="matrix-muted"
          style={{ fontSize: "11px", letterSpacing: "0.01em" }}
        >
          <TypewriterText
            text={`${post.author}${pubDate ? ` · ${pubDate}` : ""}`}
            speed={15}
          />
        </p>

        <a
          href={`/blog/${post.slug}`}
          className="matrix-btn-outline"
          style={{
            display: "block",
            textAlign: "center",
            padding: "9px 18px",
            marginTop: "4px",
            textDecoration: "none",
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
    <div className="matrix-bg" style={{ minHeight: "100vh" }}>
      <style>{`
        @keyframes skeletonPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        @media (max-width: 1024px) { .blog-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .blog-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      {/* Page header */}
      <section
        style={{
          background: "#0A0B14",
          padding: "72px 32px 56px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(94,240,138,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            className="matrix-heading"
            style={{
              margin: "0 0 8px",
              fontSize: "clamp(34px, 5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            <TypewriterText text="THE IMPERIDOME BLOG" speed={35} />
            <span className="blink-cursor" />
          </h1>
          <div
            style={{
              width: "64px",
              height: "2px",
              background: GREEN,
              borderRadius: "2px",
              margin: "14px auto 20px",
              boxShadow: `0 0 10px ${GREEN}`,
            }}
          />
          <p
            className="matrix-muted"
            style={{
              margin: "0 auto",
              fontSize: "16px",
              maxWidth: "500px",
              lineHeight: 1.65,
            }}
          >
            <TypewriterText
              text="Insights, case studies, and agency intel"
              speed={20}
            />
          </p>
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
              className="matrix-badge-red"
              style={{
                display: "inline-block",
                padding: "8px 18px",
                borderRadius: "8px",
              }}
            >
              <TypewriterText
                text="Could not load posts. Please try refreshing."
                speed={20}
              />
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
                height: "1px",
                background: GREEN,
                margin: "0 auto 24px",
                boxShadow: `0 0 8px ${GREEN}`,
              }}
            />
            <p className="matrix-text" style={{ fontSize: "18px", margin: 0 }}>
              <TypewriterText
                text="No posts yet. Check back soon."
                speed={30}
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
