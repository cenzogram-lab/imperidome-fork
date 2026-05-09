import { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
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
    <div className="min-h-screen bg-[#0A0B14]" data-ocid="our-builds.page">
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      <main className="pb-24">
        {/* Page header */}
        <section
          className="pt-16 pb-10 text-center px-6"
          style={{ backgroundColor: "#0A0B14" }}
        >
          <h1
            className="font-extrabold text-[40px] leading-tight"
            style={{ color: "#EEF0F8" }}
          >
            <EditableText
              textKey="our-builds.hero.heading"
              defaultText="Our Builds"
            />
          </h1>
          <p
            className="mt-3 text-[18px] max-w-xl mx-auto"
            style={{ color: "#7A7D90" }}
          >
            <EditableText
              textKey="our-builds.hero.subtext"
              defaultText="Real sites built by Imperidome for real businesses."
            />
          </p>
        </section>

        {/* Divider */}
        <div className="max-w-[1200px] mx-auto px-6">
          <hr className="border-[#1C1F33] mb-12" />
        </div>

        {/* Loading */}
        {loading && (
          <div
            className="flex justify-center items-center py-24"
            data-ocid="our-builds.loading_state"
          >
            <div
              className="w-10 h-10 rounded-full border-4 border-[#1C1F33] animate-spin"
              style={{ borderTopColor: "#5EF08A" }}
            />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className="max-w-[600px] mx-auto px-6 py-6 rounded-xl text-center"
            style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}
            data-ocid="our-builds.error_state"
          >
            <p className="font-semibold text-[15px]">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div
            className="text-center py-24 px-6"
            data-ocid="our-builds.empty_state"
          >
            <p className="text-[17px] italic" style={{ color: "#7A7D90" }}>
              <EditableText
                textKey="our-builds.empty.text"
                defaultText="Portfolio coming soon — check back shortly."
              />
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && items.length > 0 && (
          <div
            className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-ocid="our-builds.grid"
          >
            {items.map((build, index) => (
              <article
                key={build.id}
                data-ocid={`our-builds.card.${index + 1}`}
                className="rounded-[12px] overflow-hidden flex flex-col"
                style={{
                  background: "rgba(12,14,26,0.85)",
                  border: "1px solid rgba(94,240,138,0.18)",
                  boxShadow:
                    "0 0 0 1px rgba(94,240,138,0.06), 0 4px 20px rgba(0,0,0,0.45)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(94,240,138,0.45)";
                  e.currentTarget.style.boxShadow =
                    "0 0 20px rgba(94,240,138,0.2), 0 4px 24px rgba(0,0,0,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(94,240,138,0.18)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 1px rgba(94,240,138,0.06), 0 4px 20px rgba(0,0,0,0.45)";
                }}
              >
                {/* Thumbnail or globe icon placeholder — matches homepage card style */}
                {build.thumbnailUrl ? (
                  <div
                    style={{
                      height: "160px",
                      overflow: "hidden",
                      borderBottom: "1px solid rgba(94,240,138,0.1)",
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
                          wrapper.style.background = "rgba(94,240,138,0.04)";
                          img.style.display = "none";
                          const globe = document.createElement("div");
                          globe.style.cssText =
                            "width:56px;height:56px;border-radius:50%;background:rgba(94,240,138,0.08);border:1px solid rgba(94,240,138,0.28);box-shadow:0 0 12px rgba(94,240,138,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;";
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
                      background: "rgba(94,240,138,0.04)",
                      borderBottom: "1px solid rgba(94,240,138,0.1)",
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "rgba(94,240,138,0.08)",
                        border: "1px solid rgba(94,240,138,0.28)",
                        boxShadow: "0 0 12px rgba(94,240,138,0.2)",
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
                  <span
                    className="font-bold text-[16px] truncate"
                    style={{ color: "#EEF0F8" }}
                  >
                    {build.clientName}
                  </span>

                  {/* Category badge — only rendered when present */}
                  {build.category && (
                    <span
                      className="mt-1.5 self-start"
                      style={{
                        display: "inline-block",
                        background: "rgba(94,240,138,0.12)",
                        border: "1px solid rgba(94,240,138,0.3)",
                        color: "#5EF08A",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        textTransform: "uppercase",
                      }}
                    >
                      {build.category}
                    </span>
                  )}

                  {/* Description — only rendered when present */}
                  {build.description && (
                    <p
                      className="mt-2"
                      style={{
                        color: "rgba(156,163,175,0.85)",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        margin: "8px 0 0",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {build.description}
                    </p>
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
                        color: "#5EF08A",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        border: "1px solid rgba(94,240,138,0.3)",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        minHeight: "44px",
                        transition: "background 0.2s, border-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(94,240,138,0.1)";
                        e.currentTarget.style.borderColor =
                          "rgba(94,240,138,0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor =
                          "rgba(94,240,138,0.3)";
                      }}
                    >
                      <EditableText
                        textKey="our-builds.card.view_site_link"
                        defaultText="Visit Site →"
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
