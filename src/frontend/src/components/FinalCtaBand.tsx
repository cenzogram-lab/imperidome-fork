import EditableText from "./EditableText";

export function FinalCtaBand() {
  return (
    <section
      style={{ backgroundColor: "#0A0B14" }}
      className="w-full py-20 px-6"
      data-ocid="final-cta.section"
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: "#EEF0F8" }}
        >
          <EditableText
            textKey="final-cta-band.heading"
            defaultText="Ready to Build Something That Actually Works?"
          />
        </h2>
        <p className="mb-10" style={{ fontSize: "17px", color: "#7A7D90" }}>
          <EditableText
            textKey="final-cta-band.subheading"
            defaultText="Starting at $749. Delivered in 5 days. Built for your business."
          />
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/get-started"
            data-ocid="final-cta.primary_button"
            className="inline-block px-8 py-3 rounded font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#5EF08A", color: "#061209" }}
          >
            <EditableText
              textKey="final-cta-band.primary-button"
              defaultText="Get Started Today"
            />
          </a>
          <a
            href="[PLACEHOLDER: CALENDLY LINK]"
            data-ocid="final-cta.secondary_button"
            className="inline-block px-8 py-3 rounded font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "transparent",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <EditableText
              textKey="final-cta-band.secondary-button"
              defaultText="Book a Free Strategy Call"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
