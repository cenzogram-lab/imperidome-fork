import { useEffect, useState } from "react";
import type { backendInterface } from "../backend";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useActor } from "../hooks/useActor";

interface PortfolioItem {
  id: string;
  client_name: string;
  site_url: string;
  thumbnail_url: string;
  tier_code: string;
  description: string;
  is_featured: boolean;
  created_at: bigint;
}

export default function ResultsPage() {
  const { actor, isFetching } = useActor();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);
    (actor as backendInterface)
      .getPublishedPortfolio()
      .then((data: PortfolioItem[]) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to load portfolio.",
        );
        setLoading(false);
      });
  }, [actor, isFetching]);

  return (
    <div className="min-h-screen bg-[#0A0B14]" data-ocid="results.page">
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

        {/* States */}
        {loading && (
          <div
            className="flex justify-center items-center py-24"
            data-ocid="results.loading_state"
          >
            <div
              className="w-10 h-10 rounded-full border-4 border-[#1C1F33] animate-spin"
              style={{ borderTopColor: "#5EF08A" }}
            />
          </div>
        )}

        {!loading && error && (
          <div
            className="max-w-[600px] mx-auto px-6 py-6 rounded-xl text-center"
            style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}
            data-ocid="results.error_state"
          >
            <p className="font-semibold text-[15px]">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div
            className="text-center py-24 px-6"
            data-ocid="results.empty_state"
          >
            <p className="text-[17px] italic" style={{ color: "#7A7D90" }}>
              <EditableText
                textKey="our-builds.empty.text"
                defaultText="Portfolio coming soon — check back shortly."
              />
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div
            className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-ocid="results.grid"
          >
            {items.map((item, index) => (
              <article
                key={item.id}
                data-ocid={`results.card.${index + 1}`}
                className="rounded-[12px] overflow-hidden flex flex-col"
                style={{
                  background: "rgba(17,19,34,0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid #1C1F33",
                }}
              >
                {/* Thumbnail */}
                <div className="relative w-full" style={{ height: "200px" }}>
                  <img
                    src={item.thumbnail_url}
                    alt={`${item.client_name} website thumbnail`}
                    className="w-full h-full object-cover"
                  />
                  {item.is_featured && (
                    <span
                      className="absolute top-0 left-0 text-[12px] font-bold px-2 py-1 rounded-br-lg"
                      style={{
                        backgroundColor: "#F59E0B",
                        color: "#fff",
                        letterSpacing: "0.03em",
                      }}
                    >
                      ★ Featured
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Client name */}
                  <span
                    className="font-bold text-[16px] truncate"
                    style={{ color: "#EEF0F8" }}
                  >
                    {item.client_name}
                  </span>

                  {/* Category badge — only rendered when present */}
                  {item.tier_code && (
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
                      {item.tier_code}
                    </span>
                  )}

                  {/* Description — only rendered when present */}
                  {item.description && (
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
                      {item.description}
                    </p>
                  )}

                  {/* View Site link */}
                  <div className="mt-auto pt-4">
                    <a
                      href={item.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid={`results.view_site.link.${index + 1}`}
                      className="text-[14px] font-semibold hover:underline"
                      style={{ color: "#5EF08A" }}
                    >
                      <EditableText
                        textKey="our-builds.card.view_site_link"
                        defaultText="View Site →"
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
