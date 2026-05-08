import { useNavigate } from "@tanstack/react-router";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

const limitations = [
  {
    limitation: "Payments",
    details: "Stripe only — no PayPal",
    handling: "Accepts all major cards, Apple Pay, and Google Pay.",
  },
  {
    limitation: "Maps",
    details: "OpenStreetMap embedded",
    handling: "Fully interactive — tapping opens Google Maps.",
  },
  {
    limitation: "Abandoned Cart",
    details: "Not available",
    handling: "Add the Lead Capture Upgrade.",
  },
  {
    limitation: "CRM",
    details: "Built-in only",
    handling: "Handles 95% of small business needs.",
  },
  {
    limitation: "Multi-Currency",
    details: "USD only",
    handling: "International buyers are converted automatically.",
  },
  {
    limitation: "Native Apps",
    details: "Web only",
    handling: "PWA upgrade available for $299.",
  },
];

export default function PlatformLimitationsPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-white"
      data-ocid="platform_limitations.page"
    >
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      {/* Page Header */}
      <section style={{ backgroundColor: "#1B2D4F" }} className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: "Arial, Inter, sans-serif" }}
          >
            Platform Limitations — What You Should Know Before You Build.
          </h1>
          <p
            className="mt-4 text-lg"
            style={{
              color: "rgba(255,255,255,0.8)",
              fontFamily: "Arial, Inter, sans-serif",
            }}
          >
            Every platform has tradeoffs. Here's ours — and how we've handled
            each one.
          </p>
        </div>
      </section>

      {/* Intro Paragraph */}
      <section className="pt-12 pb-2 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{
              color: "#374151",
              fontFamily: "Arial, Inter, sans-serif",
              maxWidth: "760px",
              margin: "0 auto",
            }}
          >
            We believe in radical transparency. To maintain our 48-hour launch
            speeds and zero-maintenance promise, we intentionally restrict
            certain complex features. Here is exactly what we do not
            do&#8212;and how we solve for it.
          </p>
        </div>
      </section>

      {/* Table Section */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ minWidth: "600px" }}
              data-ocid="platform_limitations.table"
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #e5e7eb",
                  }}
                >
                  {["Limitation", "Details", "How We Handle It"].map(
                    (header) => (
                      <th
                        key={header}
                        className="text-left pb-3 pr-6 text-xs font-semibold uppercase tracking-wider"
                        style={{
                          color: "#1B2D4F",
                          fontFamily: "Arial, Inter, sans-serif",
                        }}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {limitations.map((row, i) => (
                  <tr
                    key={row.limitation}
                    style={{
                      backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <td
                      className="py-4 pr-6 font-bold text-sm"
                      style={{
                        color: "#1B2D4F",
                        fontFamily: "Arial, Inter, sans-serif",
                      }}
                    >
                      {row.limitation}
                    </td>
                    <td
                      className="py-4 pr-6 text-sm"
                      style={{
                        color: "#6b7280",
                        fontFamily: "Arial, Inter, sans-serif",
                      }}
                    >
                      {row.details}
                    </td>
                    <td
                      className="py-4 text-sm"
                      style={{
                        color: "#374151",
                        fontFamily: "Arial, Inter, sans-serif",
                      }}
                    >
                      {row.handling}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Block */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-6"
            style={{
              color: "#1B2D4F",
              fontFamily: "Arial, Inter, sans-serif",
            }}
          >
            Ready to build within the guardrails?
          </h2>
          <button
            type="button"
            onClick={() => navigate({ to: "/register" as any })}
            data-ocid="platform_limitations.cta.primary_button"
            className="inline-block px-8 py-3 rounded font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#3B82C4",
              fontFamily: "Arial, Inter, sans-serif",
              fontSize: "16px",
            }}
          >
            Get Started
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
