import { EditableText } from "./EditableText";

export function HeroSection() {
  return (
    <section
      data-ocid="hero.section"
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#0A0B14" }}
    >
      {/* Green radial glow behind text */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          style={{
            width: "800px",
            height: "600px",
            background:
              "radial-gradient(ellipse, rgba(94,240,138,0.08), transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 sm:px-8 py-24 text-center">
        {/* H1 */}
        <h1
          className="font-bold leading-[1.1] tracking-tight text-white text-5xl md:text-7xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          <EditableText
            textKey="hero.heading"
            defaultText="The Last Agency You'll Ever Need"
            as="span"
            className="font-bold leading-[1.1] tracking-tight text-white text-5xl md:text-7xl"
            style={{ letterSpacing: "-0.02em" }}
          />
        </h1>

        {/* Subheading */}
        <p
          className="mt-6 text-xl mx-auto max-w-[640px]"
          style={{ color: "#7A7D90", lineHeight: "1.65" }}
        >
          <EditableText
            textKey="hero.subheading"
            defaultText="We build custom websites, AI receptionists, and cinematic ad campaigns — all under one roof."
            as="span"
            className="text-xl"
            style={{ color: "#7A7D90", lineHeight: "1.65" }}
          />
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/get-started"
            data-ocid="hero.getstarted.primary_button"
            className="w-full sm:w-auto inline-flex items-center justify-center font-bold text-base rounded-lg px-8 py-4 transition-opacity duration-150 hover:opacity-90"
            style={{ backgroundColor: "#5EF08A", color: "#061209" }}
          >
            <EditableText
              textKey="hero.cta-primary"
              defaultText="Get Started"
              as="span"
              className="font-bold text-base"
            />
          </a>
          <a
            href="/our-builds"
            data-ocid="hero.ourbuilds.secondary_button"
            className="w-full sm:w-auto inline-flex items-center justify-center text-white text-base rounded-lg px-8 py-4 transition-colors duration-150 hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <EditableText
              textKey="hero.cta-secondary"
              defaultText="View Our Work"
              as="span"
              className="text-base"
            />
          </a>
          <a
            href="/blog"
            data-ocid="hero.readblog.tertiary_button"
            className="w-full sm:w-auto inline-flex items-center justify-center font-bold text-base rounded-lg px-8 py-4 transition-all duration-150"
            style={{
              color: "#39FF14",
              border: "1.5px solid #39FF14",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(57,255,20,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "transparent";
            }}
          >
            <EditableText
              textKey="hero.cta-tertiary"
              defaultText="Read Blog"
              as="span"
              className="font-bold text-base"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
