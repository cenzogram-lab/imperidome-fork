import { useEffect, useState } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import TypewriterText from "../components/TypewriterText";
import { createActorWithConfig } from "../config";
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
          "/results",
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid,
          countryCode,
        );
      } catch {
        /* silent */
      }
    };
    track();
  }, []);

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
        <section className="pt-16 pb-10 text-center px-6 bg-[#0A0B14]">
          <h1
            className="font-extrabold text-[40px] leading-tight text-white"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <TypewriterText text="Our Builds" speed={60} />
          </h1>
          <p className="mt-3 text-[18px] max-w-xl mx-auto text-[#7A7D90]">
            <TypewriterText
              text="Real sites built by Imperidome for real businesses."
              speed={35}
            />
          </p>
        </section>

        <div className="max-w-[1200px] mx-auto px-6">
          <hr className="border-[#1C1F33] mb-12" />
        </div>

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
            className="max-w-[600px] mx-auto px-6 py-6 rounded-xl text-center matrix-card"
            data-ocid="results.error_state"
          >
            <p className="font-semibold text-[15px] text-[#F87171]">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div
            className="text-center py-24 px-6"
            data-ocid="results.empty_state"
          >
            <p className="text-[17px] italic text-[#7A7D90]">
              <TypewriterText
                text="Portfolio coming soon — check back shortly."
                speed={40}
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
                className="matrix-card rounded-[12px] overflow-hidden flex flex-col"
              >
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
                <div className="p-5 flex flex-col flex-1">
                  <span
                    className="font-bold text-[16px] truncate text-[#EEF0F8]"
                    style={{ fontFamily: "'Courier New', monospace" }}
                  >
                    <TypewriterText text={item.client_name} speed={50} />
                  </span>
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
