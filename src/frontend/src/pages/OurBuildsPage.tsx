import { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import TypewriterText from "../components/TypewriterText";
import { createActorWithConfig } from "../config";

interface Build {
  id: string;
  clientName: string;
  siteUrl: string;
  addedAt: bigint;
  description: string;
  category: string;
  thumbnailUrl?: string;
}

export default function OurBuildsPage() {
  const [items, setItems] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          sid,
          countryCode,
        );
      } catch {
        // silent
      }
    };
    track();
  }, []);

  useEffect(() => {
    let cancelled = false;
    createActorWithConfig(createActor)
      .then((publicActor) => {
        if (cancelled) return;
        return (publicActor as backendInterface)
          .getPublicBuilds()
          .then((data) => {
            if (!cancelled) {
              setItems(data);
              setLoading(false);
            }
          });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load builds.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background" data-ocid="our-builds.page">
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      <main className="pb-24">
        {/* Page header */}
        <section className="py-16 pt-16 pb-10 text-center px-6 hidden">
          <h1 className="font-extrabold text-[40px] leading-tight">
            <TypewriterText
              as="span"
              text="Our Builds"
              className="text-white font-bold text-xl text-[#22C55E]"
              speed={60}
            />
          </h1>
          <p className="mt-3 text-[18px] max-w-xl mx-auto">
            <TypewriterText
              as="span"
              text="Real sites built by Imperidome for real businesses."
              className="text-slate-200"
              speed={30}
            />
          </p>
        </section>

        {/* Divider */}
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="border-t border-slate-700 my-8 mb-12" />
        </div>

        {/* Loading */}
        {loading && (
          <div
            className="flex justify-center items-center py-24 matrix-bg"
            data-ocid="our-builds.loading_state"
          >
            <div
              className="w-10 h-10 rounded-full border-4 border-[#1C1F33] animate-spin"
              style={{ borderTopColor: "#22C55E" }}
            />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className="max-w-[600px] mx-auto px-6 py-6 rounded-xl text-center bg-slate-800 border border-slate-700 rounded-xl p-6 border border-red-500/30"
            data-ocid="our-builds.error_state"
          >
            <TypewriterText
              as="p"
              text={error ?? ""}
              className="font-semibold text-[15px] text-red-400"
              speed={20}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div
            className="text-center py-24 px-6"
            data-ocid="our-builds.empty_state"
          >
            <TypewriterText
              as="p"
              text="Portfolio coming soon — check back shortly."
              className="text-[17px] italic text-slate-400"
              speed={30}
            />
          </div>
        )}

        {/* Grid */}
        {!loading && !error && items.length > 0 && (
          <div
            className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4"
            data-ocid="our-builds.grid"
          >
            {items.map((build, index) => (
              <article
                key={build.id}
                data-ocid={`our-builds.card.${index + 1}`}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 rounded-[12px] overflow-hidden flex flex-col"
              >
                {/* Thumbnail or globe icon placeholder — matches homepage card style */}
                {build.thumbnailUrl ? (
                  <div
                    style={{
                      height: "160px",
                      overflow: "hidden",
                      borderBottom: "1px solid rgba(34,197,94,0.1)",
                      flexShrink: 0,
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
                        const img = e.currentTarget;
                        const wrapper = img.parentElement;
                        if (wrapper) {
                          wrapper.style.display = "flex";
                          wrapper.style.alignItems = "center";
                          wrapper.style.justifyContent = "center";
                          wrapper.style.background = "rgba(34,197,94,0.04)";
                          img.style.display = "none";
                          const globe = document.createElement("div");
                          globe.style.cssText =
                            "width:56px;height:56px;border-radius:50%;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.28);box-shadow:0 0 12px rgba(34,197,94,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;";
                          globe.setAttribute("aria-hidden", "true");
                          globe.textContent = "🌐";
                          wrapper.appendChild(globe);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "160px",
                      background: "rgba(34,197,94,0.04)",
                      borderBottom: "1px solid rgba(34,197,94,0.1)",
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "rgba(34,197,94,0.08)",
                        border: "1px solid rgba(34,197,94,0.28)",
                        boxShadow: "0 0 12px rgba(34,197,94,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                      }}
                      aria-hidden="true"
                    >
                      🌐
                    </div>
                  </div>
                )}

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Client name */}
                  <TypewriterText
                    as="span"
                    text={build.clientName}
                    className="font-bold text-[16px] truncate text-white font-bold text-xl"
                    speed={40}
                  />

                  {/* Category badge — only rendered when present */}
                  {build.category && (
                    <TypewriterText
                      as="span"
                      text={build.category}
                      className="mt-1.5 self-start bg-green-900 text-green-400 text-xs px-2 py-1 rounded inline-block uppercase text-[10px] font-semibold tracking-widest"
                      speed={40}
                    />
                  )}

                  {/* Description — only rendered when present */}
                  {build.description && (
                    <TypewriterText
                      as="p"
                      text={build.description}
                      className="mt-2 text-slate-400 text-[12px] leading-relaxed line-clamp-2"
                      speed={20}
                    />
                  )}

                  {/* Visit Site link */}
                  <div className="mt-auto pt-4">
                    <a
                      href={build.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid={`our-builds.view_site.link.${index + 1}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#22C55E",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        minHeight: "44px",
                        transition: "background 0.2s, border-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(34,197,94,0.1)";
                        e.currentTarget.style.borderColor =
                          "rgba(34,197,94,0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor =
                          "rgba(34,197,94,0.3)";
                      }}
                    >
                      <TypewriterText
                        as="span"
                        text="Visit Site →"
                        className="text-xs text-slate-400 uppercase tracking-wide"
                        speed={40}
                      />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
