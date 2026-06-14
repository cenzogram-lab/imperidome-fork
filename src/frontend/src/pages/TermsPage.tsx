import { ChevronRight, FileText, Printer, Shield } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import TypewriterText from "../components/TypewriterText";

const SECTIONS = [
  { id: "sec-1", title: "1. Definitions" },
  { id: "sec-2", title: "2. Scope of Work" },
  { id: "sec-3", title: "3. Fees and Payment" },
  { id: "sec-4", title: "4. Delivery & Revisions" },
  { id: "sec-5", title: "5. Monthly Plan" },
  { id: "sec-6", title: "6. Intellectual Property" },
  { id: "sec-7", title: "7. Non-Payment" },
  { id: "sec-8", title: "8. Cancellation Policy" },
  { id: "sec-10", title: "10. Data & Asset Export" },
  { id: "sec-11", title: "11. Warranties" },
  { id: "sec-12", title: "12. Liability" },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("sec-1");

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = SECTIONS.map((s) =>
        document.getElementById(s.id),
      );
      const currentScroll = window.scrollY + 200;
      for (const el of sectionElements) {
        if (el && el.offsetTop <= currentScroll) {
          setActiveSection(el.id);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const FadeSection = ({
    id,
    title,
    children,
  }: { id: string; title: string; children: React.ReactNode }) => (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="matrix-card rounded-3xl p-8 mb-8 shadow-xl"
    >
      <h2
        className="text-2xl font-bold text-white mb-6 flex items-center gap-3"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        <span className="text-[#5EF08A]">
          <TypewriterText text={`${title.split(".")[0]}.`} speed={40} />
        </span>{" "}
        <TypewriterText text={title.split(".").slice(1).join(".")} speed={40} />
      </h2>
      <div className="space-y-6 text-[#9DA0B3] leading-relaxed text-sm md:text-base">
        {children}
      </div>
    </motion.section>
  );

  return (
    <>
      <div className="min-h-screen bg-[#0A0B14] text-[#EEF0F8] font-sans pb-32 pt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-12">
          {/* STICKY SIDEBAR */}
          <div className="lg:w-1/4 hidden lg:block">
            <div className="sticky top-24 matrix-card rounded-3xl p-6">
              <h3
                className="text-[#5EF08A] font-bold mb-4 uppercase tracking-widest text-sm flex items-center gap-2"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                <FileText className="w-4 h-4 text-[#5EF08A]" />
                <TypewriterText text="Directory" speed={60} />
              </h3>
              <nav className="space-y-2">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    data-ocid={`terms.${sec.id}.link`}
                    className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-all flex items-center justify-between ${
                      activeSection === sec.id
                        ? "bg-[#5EF08A]/10 text-[#5EF08A] font-bold"
                        : "text-[#7A7D90] hover:text-white hover:bg-[#1C1F33]"
                    }`}
                  >
                    {sec.title}
                    {activeSection === sec.id && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:w-3/4">
            {/* HEADER */}
            <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#1C1F33] pb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5EF08A]/10 border border-[#5EF08A]/30 text-[#5EF08A] text-xs font-bold tracking-widest uppercase mb-4">
                  <Shield className="w-4 h-4" />
                  <TypewriterText text="Legal Documentation" speed={50} />
                </div>
                <h1
                  className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-white"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  <TypewriterText
                    text="Website Design & Management Agreement"
                    speed={30}
                  />
                </h1>
                <p className="text-[#7A7D90] text-lg">
                  <TypewriterText
                    text="Complete Terms and Conditions — All Tiers"
                    speed={40}
                  />
                </p>
                <p
                  className="text-xs text-[#7A7D90] mt-2 font-bold uppercase tracking-widest"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  <TypewriterText
                    text="Version 1.0 · Effective Date: January 1, 2025"
                    speed={50}
                  />
                </p>
              </div>
              <button
                type="button"
                data-ocid="terms.print.button"
                onClick={handlePrint}
                className="matrix-btn-outline px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <TypewriterText text="Print to PDF" speed={60} />
              </button>
            </div>

            {/* AGREEMENT DETAILS BLOCK */}
            <div className="bg-[#1C1F33] rounded-2xl p-6 mb-12 flex flex-wrap gap-x-12 gap-y-4 text-sm">
              {[
                {
                  lk: "terms.meta.provider_label",
                  ld: "Provider",
                  vk: "terms.meta.provider_value",
                  vd: "Imperidome",
                },
                {
                  lk: "terms.meta.client_label",
                  ld: "Client Name",
                  vk: "terms.meta.client_value",
                  vd: "Auto-filled at checkout",
                },
                {
                  lk: "terms.meta.tier_label",
                  ld: "Project Tier",
                  vk: "terms.meta.tier_value",
                  vd: "Selected in Intake Form",
                },
                {
                  lk: "terms.meta.date_label",
                  ld: "Agreement Date",
                  vk: "terms.meta.date_value",
                  vd: "Time of checkout",
                },
              ].map((m) => (
                <div key={m.lk}>
                  <span
                    className="text-[#7A7D90] block uppercase font-bold text-xs mb-1"
                    style={{ fontFamily: "'Courier New', monospace" }}
                  >
                    <TypewriterText text={m.ld} speed={60} />
                  </span>
                  <span className="text-white font-medium">
                    <TypewriterText text={m.vd} speed={50} />
                  </span>
                </div>
              ))}
            </div>

            {/* SECTIONS */}
            <FadeSection id="sec-1" title="1. Definitions">
              <ul className="space-y-3">
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="terms.sec1.item_1.label"
                      defaultText="Provider / Imperidome:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec1.item_1.body"
                    defaultText="The agency providing website design, development, and management services."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="terms.sec1.item_2.label"
                      defaultText="Client:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec1.item_2.body"
                    defaultText="The individual or entity purchasing services under this Agreement."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="terms.sec1.item_3.label"
                      defaultText="Build Fee:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec1.item_3.body"
                    defaultText="The one-time flat-rate payment for completion of the Build."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="terms.sec1.item_4.label"
                      defaultText="Monthly Plan:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec1.item_4.body"
                    defaultText="The recurring monthly service that keeps the Client's website live, secure, and managed."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="terms.sec1.item_5.label"
                      defaultText="Scope Creep:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec1.item_5.body"
                    defaultText="Any request for features, pages, or functionality not included in the selected Tier."
                  />
                </li>
                <li>
                  <strong className="text-white">
                    <EditableText
                      textKey="terms.sec1.item_6.label"
                      defaultText="Code Handoff:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec1.item_6.body"
                    defaultText="The optional service of exporting website files so the Client can redeploy elsewhere."
                  />
                </li>
              </ul>
            </FadeSection>

            <FadeSection id="sec-2" title="2. Scope of Work">
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec2.p1.label"
                    defaultText="2.1 Scope Defined by Intake Form:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec2.p1.body"
                  defaultText="The scope of the Build is defined exclusively by the Client's selected Tier and completed Intake Questionnaire."
                />
              </p>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec2.p2.label"
                    defaultText="2.4 Scope Changes:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec2.p2.body"
                  defaultText="Feature requests falling outside the selected Tier constitute Scope Creep and will be quoted separately."
                />
              </p>
              <div className="bg-[#0A0B14] p-6 rounded-xl border border-[#5EF08A]/20 my-6">
                <strong
                  className="text-[#5EF08A] block mb-4"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  <EditableText
                    textKey="terms.sec2.limitations.heading"
                    defaultText="2.5 Platform Limitations:"
                  />
                </strong>
                <div className="flex flex-wrap gap-3">
                  {[
                    { k: "terms.sec2.limit_1", d: "Stripe payments only" },
                    {
                      k: "terms.sec2.limit_2",
                      d: "Google Maps link only (no embed)",
                    },
                    {
                      k: "terms.sec2.limit_3",
                      d: "No abandoned cart recovery",
                    },
                    { k: "terms.sec2.limit_4", d: "No native mobile apps" },
                    { k: "terms.sec2.limit_5", d: "USD Currency Only" },
                  ].map((lim) => (
                    <span
                      key={lim.k}
                      className="matrix-badge px-3 py-1 rounded-full text-xs font-bold"
                    >
                      <EditableText textKey={lim.k} defaultText={lim.d} />
                    </span>
                  ))}
                </div>
              </div>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec2.p3.label"
                    defaultText="2.6 Content Responsibility:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec2.p3.body"
                  defaultText="The Client is solely responsible for providing all written content and images."
                />
              </p>
            </FadeSection>

            <FadeSection id="sec-3" title="3. Fees and Payment">
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec3.p1.label"
                    defaultText="3.1 Build Fee:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec3.p1.body"
                  defaultText="Payable in two installments: 50% Deposit at signing, 50% Final Payment on the day of Go-Live."
                />
              </p>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec3.p2.label"
                    defaultText="3.2 Monthly Plan Fee:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec3.p2.body"
                  defaultText="A recurring subscription charge beginning on Go-Live."
                />
              </p>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec3.p3.label"
                    defaultText="3.8 Disputed Charges:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec3.p3.body"
                  defaultText="Initiating a credit card chargeback without contacting the Provider constitutes a breach of Agreement."
                />
              </p>
            </FadeSection>

            <FadeSection id="sec-4" title="4. Delivery Timeline & Revisions">
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec4.p1.label"
                    defaultText="4.3 Revision Rounds:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec4.p1.body"
                  defaultText="Speedy Site (1), Tier 1 (2), Tier 2-4A (3), Tier 4B-5 (5). Additional rounds billed at $75/hr."
                />
              </p>
              <p className="mb-4">
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec4.p2.label"
                    defaultText="4.4 What Constitutes a Revision:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec4.p2.body"
                  defaultText="Specific, contained changes to existing design or content. Not structural rebuilds."
                />
              </p>
              <div className="overflow-x-auto rounded-xl border border-[#1C1F33]">
                <table className="matrix-table w-full text-left border-collapse bg-[#0A0B14]">
                  <thead>
                    <tr className="bg-[#1C1F33] text-[#5EF08A] text-sm">
                      <th className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.col_1"
                          defaultText="Tier Selection"
                        />
                      </th>
                      <th className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.col_2"
                          defaultText="Delivery Target"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-[#9DA0B3]">
                    {[
                      {
                        tk: "terms.sec4.table.row_1.tier",
                        tmk: "terms.sec4.table.row_1.time",
                        td: "Speedy Sites",
                        tt: "48 hours",
                      },
                      {
                        tk: "terms.sec4.table.row_2.tier",
                        tmk: "terms.sec4.table.row_2.time",
                        td: "Tier 1 — Digital Presence",
                        tt: "5 business days",
                      },
                      {
                        tk: "terms.sec4.table.row_3.tier",
                        tmk: "terms.sec4.table.row_3.time",
                        td: "Tier 2 — Authority Site",
                        tt: "7–10 business days",
                      },
                      {
                        tk: "terms.sec4.table.row_4.tier",
                        tmk: "terms.sec4.table.row_4.time",
                        td: "Tier 3A & 3B",
                        tt: "10–14 business days",
                      },
                      {
                        tk: "terms.sec4.table.row_5.tier",
                        tmk: "terms.sec4.table.row_5.time",
                        td: "Tier 4A, 4B, 4C",
                        tt: "14–21 business days",
                      },
                    ].map((row, i) => (
                      <tr
                        key={row.tk}
                        className={`border-b border-[#1C1F33] ${i % 2 === 1 ? "bg-[#111322]" : ""}`}
                      >
                        <td className="p-4">
                          <EditableText textKey={row.tk} defaultText={row.td} />
                        </td>
                        <td className="p-4">
                          <EditableText
                            textKey={row.tmk}
                            defaultText={row.tt}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeSection>

            <FadeSection id="sec-5" title="5. Monthly Plan & Managed Services">
              <div className="overflow-x-auto rounded-xl border border-[#1C1F33] mb-6">
                <table className="matrix-table w-full text-left border-collapse bg-[#0A0B14]">
                  <thead>
                    <tr className="bg-[#1C1F33] text-[#5EF08A] text-sm">
                      <th className="p-4">
                        <EditableText
                          textKey="terms.sec5.table.col_1"
                          defaultText="Plan"
                        />
                      </th>
                      <th className="p-4">
                        <EditableText
                          textKey="terms.sec5.table.col_2"
                          defaultText="Monthly Fee"
                        />
                      </th>
                      <th className="p-4">
                        <EditableText
                          textKey="terms.sec5.table.col_3"
                          defaultText="Included Services"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-[#9DA0B3]">
                    {[
                      {
                        pk: "terms.sec5.row_1.plan",
                        prk: "terms.sec5.row_1.price",
                        sk: "terms.sec5.row_1.services",
                        pd: "Hosting Only",
                        pp: "$29",
                        ps: "Self-managed. No agency edits included.",
                      },
                      {
                        pk: "terms.sec5.row_2.plan",
                        prk: "terms.sec5.row_2.price",
                        sk: "terms.sec5.row_2.services",
                        pd: "Stay Sharp",
                        pp: "$89",
                        ps: "3 edits/month, standard support.",
                      },
                      {
                        pk: "terms.sec5.row_3.plan",
                        prk: "terms.sec5.row_3.price",
                        sk: "terms.sec5.row_3.services",
                        pd: "Stay Ahead",
                        pp: "$249",
                        ps: "Unlimited standard edits, priority support.",
                      },
                      {
                        pk: "terms.sec5.row_4.plan",
                        prk: "terms.sec5.row_4.price",
                        sk: "terms.sec5.row_4.services",
                        pd: "Full Partner",
                        pp: "$549",
                        ps: "E-com management, SEO, monthly reports.",
                      },
                    ].map((row, i) => (
                      <tr
                        key={row.pk}
                        className={`border-b border-[#1C1F33] ${i % 2 === 1 ? "bg-[#111322]" : ""}`}
                      >
                        <td className="p-4 font-bold text-white">
                          <EditableText textKey={row.pk} defaultText={row.pd} />
                        </td>
                        <td className="p-4 text-[#5EF08A]">
                          <EditableText
                            textKey={row.prk}
                            defaultText={row.pp}
                          />
                        </td>
                        <td className="p-4">
                          <EditableText textKey={row.sk} defaultText={row.ps} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeSection>

            <FadeSection id="sec-6" title="6. Intellectual Property">
              <p>
                <EditableText
                  textKey="terms.sec6.body"
                  defaultText="Upon receipt of full Build Fee, the Client owns the website design, layout, and custom-written content. Provider retains the right to use the completed website as a portfolio example unless confidentiality is requested in writing."
                />
              </p>
            </FadeSection>

            <FadeSection id="sec-7" title="7. Non-Payment & Suspension">
              <p className="mb-4">
                <EditableText
                  textKey="terms.sec7.intro"
                  defaultText="The Build Fee covers creating the website. The Monthly Plan covers keeping it live on our managed infrastructure."
                />
              </p>
              <ul className="space-y-2 pl-4 border-l-2 border-[#5EF08A]/30">
                {[
                  {
                    dk: "terms.sec7.item_1.day",
                    bk: "terms.sec7.item_1.body",
                    dd: "Day 1:",
                    db: "Automatic Stripe retry. Client notified.",
                    cls: "text-amber-500",
                  },
                  {
                    dk: "terms.sec7.item_2.day",
                    bk: "terms.sec7.item_2.body",
                    dd: "Day 7:",
                    db: "Formal non-payment notice. 48 hours to resolve.",
                    cls: "text-amber-500",
                  },
                  {
                    dk: "terms.sec7.item_3.day",
                    bk: "terms.sec7.item_3.body",
                    dd: "Day 9:",
                    db: "Website is unpublished and suspended.",
                    cls: "text-red-500",
                  },
                  {
                    dk: "terms.sec7.item_4.day",
                    bk: "terms.sec7.item_4.body",
                    dd: "Day 30:",
                    db: "Website archived.",
                    cls: "text-red-500",
                  },
                ].map((item) => (
                  <li key={item.dk}>
                    <strong className={item.cls}>
                      <EditableText textKey={item.dk} defaultText={item.dd} />
                    </strong>{" "}
                    <EditableText textKey={item.bk} defaultText={item.db} />
                  </li>
                ))}
              </ul>
            </FadeSection>

            <FadeSection id="sec-8" title="8. Cancellation & Refunds">
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec8.p1.label"
                    defaultText="8.1 Monthly Plan:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec8.p1.body"
                  defaultText="Cancel anytime with 30 days written notice. Site remains live through the final paid period."
                />
              </p>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec8.p2.label"
                    defaultText="8.3 Mid-Build Cancellation:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec8.p2.body"
                  defaultText="If canceled before Go-Live, the deposit is forfeited. If 75%+ complete, the full Build Fee is owed."
                />
              </p>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec8.p3.label"
                    defaultText="8.4 Client Abandonment:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec8.p3.body"
                  defaultText="If the Client fails to respond for 60 consecutive days, the project is considered abandoned and closed with no refund."
                />
              </p>
            </FadeSection>

            <FadeSection
              id="sec-10"
              title="10. Data & Asset Export (No-Hostage Policy)"
            >
              <p>
                <EditableText
                  textKey="terms.sec10.p1"
                  defaultText="Imperidome believes in fair agency relationships. If a Client wishes to leave and take their website elsewhere, the Code Handoff process ensures a clean exit."
                />
              </p>
              <p>
                <strong className="text-[#5EF08A]">
                  <EditableText
                    textKey="terms.sec10.p2.label"
                    defaultText="Code Handoff Service ($300-$500):"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec10.p2.body"
                  defaultText="Includes a CSV export of all database records, a ZIP file of all media, and the release of the custom domain name. The Provider's proprietary platform code and backend systems remain the property of Imperidome and are not exported."
                />
              </p>
            </FadeSection>

            <FadeSection id="sec-11" title="11. Warranties">
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec11.p1.label"
                    defaultText="11.1 Provider Warranty:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec11.p1.body"
                  defaultText="Provider warrants that all work will be completed in a professional manner consistent with industry standards."
                />
              </p>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec11.p2.label"
                    defaultText="11.2 No Guarantee of Results:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec11.p2.body"
                  defaultText="Provider makes no guarantees regarding specific traffic, conversion rates, or revenue outcomes from the completed website."
                />
              </p>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec11.p3.label"
                    defaultText="11.3 Third-Party Services:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec11.p3.body"
                  defaultText="Provider makes no warranties regarding third-party services (Stripe, Google, etc.) integrated into the website."
                />
              </p>
            </FadeSection>

            <FadeSection id="sec-12" title="12. Limitation of Liability">
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec12.p1.label"
                    defaultText="12.1 Cap on Liability:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec12.p1.body"
                  defaultText="Provider's total liability under this Agreement shall not exceed the total fees paid by the Client in the 12 months preceding the claim."
                />
              </p>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec12.p2.label"
                    defaultText="12.2 Excluded Damages:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec12.p2.body"
                  defaultText="Neither party shall be liable for indirect, incidental, special, or consequential damages, including lost profits or business interruption."
                />
              </p>
              <p>
                <strong className="text-white">
                  <EditableText
                    textKey="terms.sec12.p3.label"
                    defaultText="12.3 Force Majeure:"
                  />
                </strong>{" "}
                <EditableText
                  textKey="terms.sec12.p3.body"
                  defaultText="Provider shall not be liable for delays or failures caused by circumstances beyond its reasonable control."
                />
              </p>
            </FadeSection>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
