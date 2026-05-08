import { Link } from "@tanstack/react-router";
import EditableText from "./EditableText";

export function HowItWorksSection() {
  return (
    <section style={{ backgroundColor: "#0A0B14" }} className="py-16 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2
          className="text-3xl md:text-4xl font-bold"
          style={{ color: "#EEF0F8", margin: 0 }}
        >
          <Link
            to="/process"
            style={{
              color: "inherit",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#39FF14";
              (e.currentTarget as HTMLAnchorElement).style.textShadow =
                "0 0 18px rgba(57,255,20,0.7), 0 0 40px rgba(57,255,20,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#EEF0F8";
              (e.currentTarget as HTMLAnchorElement).style.textShadow = "none";
            }}
          >
            <EditableText
              textKey="how-it-works-section.heading"
              defaultText="Process"
            />
          </Link>
        </h2>
      </div>
    </section>
  );
}
