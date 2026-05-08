import { Clock, DollarSign, Unlink } from "lucide-react";
import EditableText from "./EditableText";

const columns = [
  {
    icon: Unlink,
    headlineKey: "problem.item-1.headline",
    bodyKey: "problem.item-1.body",
    headline: "Your Current Site Is Costing You Leads",
    body: "A slow, outdated, or non-existent website sends potential customers straight to your competitor.",
    ocid: "problem.item.1",
  },
  {
    icon: DollarSign,
    headlineKey: "problem.item-2.headline",
    bodyKey: "problem.item-2.body",
    headline: "You're Paying Too Much for Too Little",
    body: "Freelancers ghost you. Agencies overcharge you. DIY platforms make you look amateur.",
    ocid: "problem.item.2",
  },
  {
    icon: Clock,
    headlineKey: "problem.item-3.headline",
    bodyKey: "problem.item-3.body",
    headline: "Waiting Months Is Not an Option",
    body: "Your business needs a professional site now — not in 6 weeks after 14 rounds of revision.",
    ocid: "problem.item.3",
  },
];

export function ProblemSection() {
  return (
    <section
      data-ocid="problem.section"
      style={{ backgroundColor: "#0A0B14" }}
      className="py-20 px-6"
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-center text-3xl md:text-4xl font-bold mb-14 leading-tight"
          style={{ color: "#EEF0F8", fontFamily: "Arial, Inter, sans-serif" }}
        >
          <EditableText
            textKey="problem.heading"
            defaultText="Your Competitors Are Taking Your Customers Right Now."
          />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {columns.map(
            ({ icon: Icon, headlineKey, bodyKey, headline, body, ocid }) => (
              <div
                key={ocid}
                data-ocid={ocid}
                className="flex flex-col items-center text-center"
              >
                <Icon
                  size={44}
                  strokeWidth={1.75}
                  style={{ color: "#5EF08A" }}
                  className="mb-5"
                />
                <h3
                  className="text-lg font-bold mb-3"
                  style={{
                    color: "#EEF0F8",
                    fontFamily: "Arial, Inter, sans-serif",
                  }}
                >
                  <EditableText textKey={headlineKey} defaultText={headline} />
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{
                    color: "#7A7D90",
                    fontFamily: "Arial, Inter, sans-serif",
                  }}
                >
                  <EditableText textKey={bodyKey} defaultText={body} />
                </p>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
