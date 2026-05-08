import { ChevronRight, FileText, Printer, Shield } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";

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
      className="bg-[#111322]/70 backdrop-blur-md border border-[#1C1F33] rounded-3xl p-8 mb-8 shadow-xl"
    >
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-[#5EF08A]">{title.split(".")[0]}.</span>{" "}
        {title.split(".").slice(1).join(".")}
      </h2>
      <div className="space-y-6 text-gray-300 leading-relaxed text-sm md:text-base">
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
            <div className="sticky top-24 bg-[#111322]/40 border border-[#1C1F33] rounded-3xl p-6">
              <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#5EF08A]" />
                <EditableText
                  textKey="terms.sidebar.heading"
                  defaultText="Directory"
                />
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
                        : "text-gray-400 hover:text-white hover:bg-[#1C1F33]"
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
                  <EditableText
                    textKey="terms.header.badge"
                    defaultText="Legal Documentation"
                  />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-white">
                  <EditableText
                    textKey="terms.hero.heading"
                    defaultText="Website Design & Management Agreement"
                  />
                </h1>
                <p className="text-[#9CA3AF] text-lg">
                  <EditableText
                    textKey="terms.hero.subtext"
                    defaultText="Complete Terms and Conditions — All Tiers"
                  />
                </p>
                <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">
                  <EditableText
                    textKey="terms.hero.version"
                    defaultText="Version 1.0 · Effective Date: January 1, 2025"
                  />
                </p>
              </div>
              <button
                type="button"
                data-ocid="terms.print.button"
                onClick={handlePrint}
                className="px-6 py-3 rounded-xl border-2 border-[#5EF08A] text-[#5EF08A] font-bold hover:bg-[#5EF08A] hover:text-[#0A0B14] transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <EditableText
                  textKey="terms.print_button_text"
                  defaultText="Print to PDF"
                />
              </button>
            </div>

            {/* AGREEMENT DETAILS BLOCK */}
            <div className="bg-[#1C1F33] rounded-2xl p-6 mb-12 flex flex-wrap gap-x-12 gap-y-4 text-sm">
              <div>
                <span className="text-gray-500 block uppercase font-bold text-xs mb-1">
                  <EditableText
                    textKey="terms.meta.provider_label"
                    defaultText="Provider"
                  />
                </span>
                <span className="text-white font-medium">
                  <EditableText
                    textKey="terms.meta.provider_value"
                    defaultText="Imperidome"
                  />
                </span>
              </div>
              <div>
                <span className="text-gray-500 block uppercase font-bold text-xs mb-1">
                  <EditableText
                    textKey="terms.meta.client_label"
                    defaultText="Client Name"
                  />
                </span>
                <span className="text-white font-medium">
                  <EditableText
                    textKey="terms.meta.client_value"
                    defaultText="Auto-filled at checkout"
                  />
                </span>
              </div>
              <div>
                <span className="text-gray-500 block uppercase font-bold text-xs mb-1">
                  <EditableText
                    textKey="terms.meta.tier_label"
                    defaultText="Project Tier"
                  />
                </span>
                <span className="text-white font-medium">
                  <EditableText
                    textKey="terms.meta.tier_value"
                    defaultText="Selected in Intake Form"
                  />
                </span>
              </div>
              <div>
                <span className="text-gray-500 block uppercase font-bold text-xs mb-1">
                  <EditableText
                    textKey="terms.meta.date_label"
                    defaultText="Agreement Date"
                  />
                </span>
                <span className="text-white font-medium">
                  <EditableText
                    textKey="terms.meta.date_value"
                    defaultText="Time of checkout"
                  />
                </span>
              </div>
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
              <div className="bg-[#0A0B14] p-6 rounded-xl border border-[#1C1F33] my-6">
                <strong className="text-white block mb-4">
                  <EditableText
                    textKey="terms.sec2.limitations.heading"
                    defaultText="2.5 Platform Limitations:"
                  />
                </strong>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-[#5EF08A]/10 text-[#5EF08A] border border-[#5EF08A]/30 rounded-full text-xs font-bold">
                    <EditableText
                      textKey="terms.sec2.limit_1"
                      defaultText="Stripe payments only"
                    />
                  </span>
                  <span className="px-3 py-1 bg-[#5EF08A]/10 text-[#5EF08A] border border-[#5EF08A]/30 rounded-full text-xs font-bold">
                    <EditableText
                      textKey="terms.sec2.limit_2"
                      defaultText="Google Maps link only (no embed)"
                    />
                  </span>
                  <span className="px-3 py-1 bg-[#5EF08A]/10 text-[#5EF08A] border border-[#5EF08A]/30 rounded-full text-xs font-bold">
                    <EditableText
                      textKey="terms.sec2.limit_3"
                      defaultText="No abandoned cart recovery"
                    />
                  </span>
                  <span className="px-3 py-1 bg-[#5EF08A]/10 text-[#5EF08A] border border-[#5EF08A]/30 rounded-full text-xs font-bold">
                    <EditableText
                      textKey="terms.sec2.limit_4"
                      defaultText="No native mobile apps"
                    />
                  </span>
                  <span className="px-3 py-1 bg-[#5EF08A]/10 text-[#5EF08A] border border-[#5EF08A]/30 rounded-full text-xs font-bold">
                    <EditableText
                      textKey="terms.sec2.limit_5"
                      defaultText="USD Currency Only"
                    />
                  </span>
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
                <table className="w-full text-left border-collapse bg-[#0A0B14]">
                  <thead>
                    <tr className="bg-[#1C1F33] text-white text-sm">
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
                  <tbody className="text-sm text-gray-300">
                    <tr className="border-b border-[#1C1F33]">
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_1.tier"
                          defaultText="Speedy Sites"
                        />
                      </td>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_1.time"
                          defaultText="48 hours"
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-[#1C1F33] bg-[#111322]">
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_2.tier"
                          defaultText="Tier 1 — Digital Presence"
                        />
                      </td>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_2.time"
                          defaultText="5 business days"
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-[#1C1F33]">
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_3.tier"
                          defaultText="Tier 2 — Authority Site"
                        />
                      </td>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_3.time"
                          defaultText="7–10 business days"
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-[#1C1F33] bg-[#111322]">
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_4.tier"
                          defaultText="Tier 3A & 3B"
                        />
                      </td>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_4.time"
                          defaultText="10–14 business days"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_5.tier"
                          defaultText="Tier 4A, 4B, 4C"
                        />
                      </td>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec4.table.row_5.time"
                          defaultText="14–21 business days"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </FadeSection>

            <FadeSection id="sec-5" title="5. Monthly Plan & Managed Services">
              <div className="overflow-x-auto rounded-xl border border-[#1C1F33] mb-6">
                <table className="w-full text-left border-collapse bg-[#0A0B14]">
                  <thead>
                    <tr className="bg-[#1C1F33] text-white text-sm">
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
                  <tbody className="text-sm text-gray-300">
                    <tr className="border-b border-[#1C1F33]">
                      <td className="p-4 font-bold text-white">
                        <EditableText
                          textKey="terms.sec5.row_1.plan"
                          defaultText="Hosting Only"
                        />
                      </td>
                      <td className="p-4 text-[#5EF08A]">
                        <EditableText
                          textKey="terms.sec5.row_1.price"
                          defaultText="$29"
                        />
                      </td>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec5.row_1.services"
                          defaultText="Self-managed. No agency edits included."
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-[#1C1F33] bg-[#111322]">
                      <td className="p-4 font-bold text-white">
                        <EditableText
                          textKey="terms.sec5.row_2.plan"
                          defaultText="Stay Sharp"
                        />
                      </td>
                      <td className="p-4 text-[#5EF08A]">
                        <EditableText
                          textKey="terms.sec5.row_2.price"
                          defaultText="$89"
                        />
                      </td>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec5.row_2.services"
                          defaultText="3 edits/month, standard support."
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-[#1C1F33]">
                      <td className="p-4 font-bold text-white">
                        <EditableText
                          textKey="terms.sec5.row_3.plan"
                          defaultText="Stay Ahead"
                        />
                      </td>
                      <td className="p-4 text-[#5EF08A]">
                        <EditableText
                          textKey="terms.sec5.row_3.price"
                          defaultText="$249"
                        />
                      </td>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec5.row_3.services"
                          defaultText="Unlimited standard edits, priority support."
                        />
                      </td>
                    </tr>
                    <tr className="bg-[#111322]">
                      <td className="p-4 font-bold text-white">
                        <EditableText
                          textKey="terms.sec5.row_4.plan"
                          defaultText="Full Partner"
                        />
                      </td>
                      <td className="p-4 text-[#5EF08A]">
                        <EditableText
                          textKey="terms.sec5.row_4.price"
                          defaultText="$549"
                        />
                      </td>
                      <td className="p-4">
                        <EditableText
                          textKey="terms.sec5.row_4.services"
                          defaultText="E-com management, SEO, monthly reports."
                        />
                      </td>
                    </tr>
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
              <ul className="space-y-2 pl-4 border-l-2 border-[#1C1F33]">
                <li>
                  <strong className="text-amber-500">
                    <EditableText
                      textKey="terms.sec7.item_1.day"
                      defaultText="Day 1:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec7.item_1.body"
                    defaultText="Automatic Stripe retry. Client notified."
                  />
                </li>
                <li>
                  <strong className="text-amber-500">
                    <EditableText
                      textKey="terms.sec7.item_2.day"
                      defaultText="Day 7:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec7.item_2.body"
                    defaultText="Formal non-payment notice. 48 hours to resolve."
                  />
                </li>
                <li>
                  <strong className="text-red-500">
                    <EditableText
                      textKey="terms.sec7.item_3.day"
                      defaultText="Day 9:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec7.item_3.body"
                    defaultText="Website is unpublished and suspended."
                  />
                </li>
                <li>
                  <strong className="text-red-500">
                    <EditableText
                      textKey="terms.sec7.item_4.day"
                      defaultText="Day 30:"
                    />
                  </strong>{" "}
                  <EditableText
                    textKey="terms.sec7.item_4.body"
                    defaultText="Website archived."
                  />
                </li>
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
