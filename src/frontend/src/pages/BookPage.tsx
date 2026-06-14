import { Link } from "@tanstack/react-router";
import HomepageCalendarBooking from "../components/HomepageCalendarBooking";

export default function BookPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0B14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
      }}
    >
      <p
        style={{
          color: "#5EF08A",
          fontFamily: "monospace",
          fontSize: "0.85rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "24px",
          opacity: 0.8,
        }}
      >
        &gt; Book a Call
      </p>
      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <Link
          to="/services"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 18px",
            backgroundColor: "rgba(10,10,10,0.88)",
            border: "1.5px solid rgba(57,255,20,0.35)",
            borderRadius: "6px",
            color: "rgba(57,255,20,0.7)",
            fontFamily: "monospace",
            fontSize: "13px",
            letterSpacing: "0.08em",
            textDecoration: "none",
            cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "#39FF14";
            (e.currentTarget as HTMLAnchorElement).style.color = "#39FF14";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "rgba(57,255,20,0.35)";
            (e.currentTarget as HTMLAnchorElement).style.color =
              "rgba(57,255,20,0.7)";
          }}
        >
          View Services
        </Link>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 18px",
            backgroundColor: "rgba(10,10,10,0.88)",
            border: "1.5px solid rgba(57,255,20,0.35)",
            borderRadius: "6px",
            color: "rgba(57,255,20,0.7)",
            fontFamily: "monospace",
            fontSize: "13px",
            letterSpacing: "0.08em",
            textDecoration: "none",
            cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "#39FF14";
            (e.currentTarget as HTMLAnchorElement).style.color = "#39FF14";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "rgba(57,255,20,0.35)";
            (e.currentTarget as HTMLAnchorElement).style.color =
              "rgba(57,255,20,0.7)";
          }}
        >
          Back to Home
        </Link>
      </div>
      <HomepageCalendarBooking />
    </div>
  );
}
