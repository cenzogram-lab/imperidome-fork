import { motion } from "motion/react";
import { useRef } from "react";
import { EditableText } from "../components/EditableText";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import TypewriterText from "../components/TypewriterText";

export default function NotFoundPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0A0B14" }}
    >
      {/* Scanline overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(94,240,138,0.015) 2px, rgba(94,240,138,0.015) 4px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <Navbar />
        <div className="h-[68px]" aria-hidden="true" />
        <main
          className="flex-1 flex items-center justify-center"
          data-ocid="not_found.section"
        >
          <div ref={containerRef} className="text-center px-6 py-20">
            {/* Ambient glow */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "500px",
                height: "300px",
                background:
                  "radial-gradient(ellipse, rgba(94,240,138,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Terminal prefix label */}
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                color: "#5EF08A",
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "16px",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              ERROR_CODE: 404
            </motion.p>

            {/* Giant 404 */}
            <TypewriterText
              text="404"
              as="p"
              speed={120}
              className="matrix-glow-text"
              style={{
                fontSize: "clamp(96px, 16vw, 160px)",
                fontWeight: "900",
                color: "#5EF08A",
                fontFamily: "'Courier New', Courier, monospace",
                lineHeight: "1",
                marginBottom: "24px",
                textShadow:
                  "0 0 40px rgba(94,240,138,0.5), 0 0 80px rgba(94,240,138,0.2)",
              }}
            />

            <TypewriterText
              text="This Page Does Not Exist."
              as="h2"
              speed={45}
              style={{
                color: "#EEF0F8",
                fontWeight: "800",
                marginBottom: "16px",
                fontSize: "clamp(22px, 4vw, 32px)",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            />

            <TypewriterText
              text="The page you are looking for has moved, been deleted, or never existed."
              as="p"
              speed={20}
              style={{
                color: "#7A7D90",
                marginBottom: "40px",
                maxWidth: "480px",
                margin: "0 auto 40px",
                fontSize: "17px",
                lineHeight: "1.6",
                fontFamily: "'Courier New', Courier, monospace",
              }}
            />

            <motion.a
              href="/"
              data-ocid="not_found.primary_button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              whileHover={{
                boxShadow: "0 0 24px rgba(94,240,138,0.4)",
                scale: 1.03,
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "transparent",
                border: "1.5px solid #5EF08A",
                color: "#5EF08A",
                borderRadius: "10px",
                padding: "12px 32px",
                fontSize: "15px",
                fontWeight: "700",
                textDecoration: "none",
                fontFamily: "'Courier New', Courier, monospace",
                letterSpacing: "0.06em",
                transition: "all 0.2s",
              }}
            >
              <EditableText
                textKey="not-found.cta_button_text"
                defaultText="Back to Home"
              />
            </motion.a>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
