import { Link } from "@tanstack/react-router";

export default function HeroPipeline() {
  return (
    <section
      style={{
        background: "rgba(14,16,32,1)",
        padding: "64px 24px",
        borderTop: "1px solid #1C1F33",
        borderBottom: "1px solid #1C1F33",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontSize: "2rem",
          fontWeight: 700,
          margin: 0,
          color: "#FFFFFF",
        }}
      >
        <Link
          to="/process"
          style={{
            color: "inherit",
            textDecoration: "none",
            cursor: "pointer",
            transition: "text-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.textShadow =
              "0 0 18px rgba(57,255,20,0.7), 0 0 40px rgba(57,255,20,0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.textShadow = "";
          }}
        >
          Process
        </Link>
      </h2>
    </section>
  );
}
