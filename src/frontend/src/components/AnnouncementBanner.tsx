import { useCallback, useEffect, useRef, useState } from "react";
import { ANNOUNCEMENT_DISMISSED_KEY } from "../constants";
import { useSiteTextStore } from "../store/useSiteTextStore";

const DISMISS_KEY = ANNOUNCEMENT_DISMISSED_KEY;

/** Subtle matrix rain canvas confined to the banner height */
function BannerMatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const CHARS =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコ0123456789@#!?";
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const COL_W = 14;
    const cols = Math.ceil(W / COL_W);
    const drops = Array.from({ length: cols }, () => Math.random() * -H);
    const speeds = Array.from(
      { length: cols },
      () => 0.4 + Math.random() * 0.8,
    );

    let raf: number;
    let last = 0;

    const draw = (now: number) => {
      if (now - last < 50) {
        raf = requestAnimationFrame(draw);
        return;
      }
      last = now;

      ctx.clearRect(0, 0, W, H);
      ctx.font = `10px 'Courier New', monospace`;

      for (let i = 0; i < cols; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * COL_W;
        const y = drops[i];
        ctx.fillStyle = `rgba(57,255,20,${0.25 + Math.random() * 0.25})`;
        ctx.fillText(char, x, y);
        drops[i] += speeds[i];
        if (drops[i] > H) drops[i] = -COL_W;
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const onResize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.18,
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * AnnouncementBanner — full-width, fixed at z-[60] above the Navbar (z-50).
 * Matrix-styled dismissible strip with scrolling marquee text and subtle
 * canvas rain background. Dismissed state is remembered in localStorage.
 */
interface AnnouncementBannerProps {
  /** When true, renders as a relative block element for embedding inside a fixed parent */
  embedded?: boolean;
}

export function AnnouncementBanner({
  embedded = false,
}: AnnouncementBannerProps = {}) {
  const { getText } = useSiteTextStore();
  const bannerText = getText("announcement_banner", "");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }, []);

  if (!bannerText || !visible) return null;

  return (
    <div
      data-ocid="announcement.banner"
      role="banner"
      style={{
        position: embedded ? "relative" : "fixed",
        ...(embedded ? {} : { top: 0, left: 0, right: 0, zIndex: 60 }),
        height: "38px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "rgba(5,10,5,0.96)",
        borderBottom: "1px solid #5EF08A",
        boxShadow:
          "0 0 12px rgba(94,240,138,0.3), 0 0 30px rgba(94,240,138,0.1), inset 0 -1px 0 rgba(94,240,138,0.15)",
      }}
    >
      {/* Canvas rain background */}
      <BannerMatrixCanvas />

      {/* Scanline overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Scrolling marquee text */}
      <div
        aria-label={bannerText}
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          height: "100%",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
        }}
      >
        <style>{`
          @keyframes banner-marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .banner-marquee-track {
            display: flex;
            gap: 0;
            white-space: nowrap;
            animation: banner-marquee 22s linear infinite;
            will-change: transform;
          }
          .banner-marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="banner-marquee-track">
          {/* duplicate 4× so the loop is seamless regardless of viewport width */}
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                color: "#5EF08A",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                textShadow:
                  "0 0 8px rgba(94,240,138,0.7), 0 0 20px rgba(94,240,138,0.35)",
                paddingRight: "80px",
              }}
            >
              <span style={{ color: "#39FF14", marginRight: "8px" }}>[!]</span>
              {bannerText}
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#5EF08A",
                  boxShadow: "0 0 6px rgba(94,240,138,0.8)",
                  margin: "0 40px",
                  verticalAlign: "middle",
                }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        data-ocid="announcement.close_button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        style={{
          position: "relative",
          zIndex: 3,
          flexShrink: 0,
          width: "38px",
          height: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#5EF08A",
          fontSize: "16px",
          fontWeight: 700,
          lineHeight: 1,
          transition: "color 0.15s, text-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#39FF14";
          e.currentTarget.style.textShadow = "0 0 8px rgba(57,255,20,0.9)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#5EF08A";
          e.currentTarget.style.textShadow = "none";
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default AnnouncementBanner;
