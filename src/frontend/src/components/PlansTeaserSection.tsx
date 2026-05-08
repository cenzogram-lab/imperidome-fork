import EditableText from "./EditableText";

const plans = [
  {
    nameKey: "plans-teaser.plan-1.name",
    priceKey: "plans-teaser.plan-1.price",
    name: "Hosting Only",
    price: "$29",
    features: [
      {
        key: "plans-teaser.plan-1.feature-1",
        text: "Hosting + SSL + security",
      },
      { key: "plans-teaser.plan-1.feature-2", text: "99.9% uptime guarantee" },
      {
        key: "plans-teaser.plan-1.feature-3",
        text: "Self-managed — no edits included",
      },
    ],
  },
  {
    nameKey: "plans-teaser.plan-2.name",
    priceKey: "plans-teaser.plan-2.price",
    name: "Stay Sharp",
    price: "$89",
    features: [
      { key: "plans-teaser.plan-2.feature-1", text: "3 edits per month" },
      {
        key: "plans-teaser.plan-2.feature-2",
        text: "24–48hr support response",
      },
      {
        key: "plans-teaser.plan-2.feature-3",
        text: "Quarterly check-in email",
      },
    ],
  },
  {
    nameKey: "plans-teaser.plan-3.name",
    priceKey: "plans-teaser.plan-3.price",
    name: "Stay Ahead",
    price: "$249",
    features: [
      { key: "plans-teaser.plan-3.feature-1", text: "Unlimited edits" },
      {
        key: "plans-teaser.plan-3.feature-2",
        text: "Priority same-day support",
      },
      { key: "plans-teaser.plan-3.feature-3", text: "Quarterly SEO audit" },
    ],
  },
  {
    nameKey: "plans-teaser.plan-4.name",
    priceKey: "plans-teaser.plan-4.price",
    name: "Full Partner",
    price: "$549",
    features: [
      {
        key: "plans-teaser.plan-4.feature-1",
        text: "Full e-commerce management",
      },
      {
        key: "plans-teaser.plan-4.feature-2",
        text: "Monthly SEO + performance report",
      },
      {
        key: "plans-teaser.plan-4.feature-3",
        text: "Priority phone + email support",
      },
    ],
  },
];

export function PlansTeaserSection() {
  return (
    <section
      data-ocid="plans_teaser.section"
      style={{ backgroundColor: "rgba(14,16,32,1)" }}
      className="w-full py-20 px-6"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#EEF0F8" }}>
            <EditableText
              textKey="plans-teaser.heading"
              defaultText="Your Site Stays Sharp — Month After Month."
            />
          </h2>
          <p style={{ color: "#7A7D90" }} className="text-lg">
            <EditableText
              textKey="plans-teaser.subheading"
              defaultText="Every site comes with a maintenance plan."
            />
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan, i) => (
            <div
              key={plan.nameKey}
              data-ocid={`plans_teaser.card.${i + 1}`}
              className="rounded-xl p-6 flex flex-col"
              style={{
                backgroundColor: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid #1C1F33",
              }}
            >
              <div className="mb-4">
                <p
                  className="text-sm font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "#7A7D90" }}
                >
                  <EditableText
                    textKey={plan.nameKey}
                    defaultText={plan.name}
                  />
                </p>
                <p className="text-4xl font-bold" style={{ color: "#EEF0F8" }}>
                  <EditableText
                    textKey={plan.priceKey}
                    defaultText={plan.price}
                  />
                  <span
                    className="text-base font-medium"
                    style={{ color: "#7A7D90" }}
                  >
                    <EditableText
                      textKey="plans-teaser.per-month"
                      defaultText="/mo"
                      as="span"
                    />
                  </span>
                </p>
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature.key}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "#7A7D90" }}
                  >
                    <span
                      className="mt-0.5 font-bold flex-shrink-0"
                      style={{ color: "#5EF08A" }}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <EditableText
                      textKey={feature.key}
                      defaultText={feature.text}
                      as="span"
                    />
                  </li>
                ))}
              </ul>

              <a
                href="/pricing#plans"
                data-ocid={`plans_teaser.card.link.${i + 1}`}
                className="text-sm font-semibold mt-auto transition-opacity hover:opacity-75"
                style={{ color: "#5EF08A" }}
              >
                <EditableText
                  textKey="plans-teaser.learn-more"
                  defaultText="Learn More →"
                />
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm" style={{ color: "#7A7D90" }}>
          <EditableText
            textKey="plans-teaser.annual-note"
            defaultText="Pay annually and get 1 month free on any plan."
          />
        </p>
      </div>
    </section>
  );
}
