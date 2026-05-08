import EditableText from "./EditableText";

export function GuaranteeBand() {
  return (
    <section
      data-ocid="guarantee.section"
      style={{ backgroundColor: "rgba(14,16,32,1)" }}
      className="w-full py-20 px-6"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6" style={{ color: "#EEF0F8" }}>
          <EditableText
            textKey="guarantee.heading"
            defaultText="The Imperidome On-Time Launch Guarantee."
          />
        </h2>
        <p
          className="mb-8 leading-relaxed"
          style={{ fontSize: "17px", color: "#7A7D90" }}
        >
          <EditableText
            textKey="guarantee.body"
            defaultText="We commit to delivering your first live draft within the delivery window stated in your contract. If we miss that window for any reason within our control, your first month of maintenance is free. No questions asked. We have never missed a delivery window on a client who completed their intake form on time."
          />
        </p>
        <a
          href="/get-started"
          data-ocid="guarantee.primary_button"
          className="inline-block px-8 py-3 font-semibold rounded-lg transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "#5EF08A",
            color: "#061209",
          }}
        >
          <EditableText
            textKey="guarantee.button"
            defaultText="Start Your Project"
          />
        </a>
      </div>
    </section>
  );
}
