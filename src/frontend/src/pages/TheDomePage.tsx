import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import { Footer } from "../components/Footer";
import { createActorWithConfig } from "../config";

const BG = "#0A0B14";
const GREEN = "#39FF14";
const CARD_BG = "rgba(17,19,34,0.75)";
const BORDER = "1px solid rgba(57,255,20,0.25)";

// ─── Dome Canvas Animation ────────────────────────────────────────────────────
interface Attacker {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "hacker" | "cloud";
  bouncing: boolean;
  bounceTimer: number;
  opacity: number;
}

interface Spark {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  particles: { dx: number; dy: number; speed: number }[];
}

function SovereignShieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const DOME_R = Math.min(W, H) * 0.33;

    // Spawn attackers
    const attackers: Attacker[] = [];
    const sparks: Spark[] = [];
    let frameCount = 0;

    function spawnAttacker() {
      const edge = Math.floor(Math.random() * 4);
      let x: number;
      let y: number;
      if (edge === 0) {
        x = Math.random() * W;
        y = -20;
      } else if (edge === 1) {
        x = W + 20;
        y = Math.random() * H;
      } else if (edge === 2) {
        x = Math.random() * W;
        y = H + 20;
      } else {
        x = -20;
        y = Math.random() * H;
      }

      const dx = cx - x;
      const dy = cy - y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const speed = 0.6 + Math.random() * 0.5;

      attackers.push({
        x,
        y,
        vx: (dx / len) * speed,
        vy: (dy / len) * speed,
        type: Math.random() > 0.5 ? "hacker" : "cloud",
        bouncing: false,
        bounceTimer: 0,
        opacity: 0.35 + Math.random() * 0.25,
      });
    }

    function drawDome() {
      // Outer glow rings
      for (let i = 3; i >= 1; i--) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, DOME_R + i * 6, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(57,255,20,${0.04 * i})`;
        ctx!.lineWidth = 4;
        ctx!.stroke();
      }

      // Main dome circle
      ctx!.beginPath();
      ctx!.arc(cx, cy, DOME_R, 0, Math.PI * 2);
      const pulse = 0.6 + 0.4 * Math.sin(frameCount * 0.03);
      ctx!.strokeStyle = `rgba(57,255,20,${pulse})`;
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Inner fill gradient
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, DOME_R);
      grad.addColorStop(0, "rgba(57,255,20,0.04)");
      grad.addColorStop(1, "rgba(57,255,20,0)");
      ctx!.beginPath();
      ctx!.arc(cx, cy, DOME_R, 0, Math.PI * 2);
      ctx!.fillStyle = grad;
      ctx!.fill();

      // Wireframe grid lines inside dome
      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(cx, cy, DOME_R, 0, Math.PI * 2);
      ctx!.clip();
      ctx!.strokeStyle = "rgba(57,255,20,0.08)";
      ctx!.lineWidth = 0.5;
      for (let i = -DOME_R; i <= DOME_R; i += DOME_R / 4) {
        ctx!.beginPath();
        ctx!.moveTo(cx + i, cy - DOME_R);
        ctx!.lineTo(cx + i, cy + DOME_R);
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.moveTo(cx - DOME_R, cy + i);
        ctx!.lineTo(cx + DOME_R, cy + i);
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawHackerIcon(x: number, y: number, opacity: number) {
      ctx!.save();
      ctx!.globalAlpha = opacity;
      ctx!.font = "36px serif";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillStyle = "#ff4444";
      ctx!.fillText("☠", x, y);
      ctx!.restore();
    }

    function drawCloudIcon(x: number, y: number, opacity: number) {
      ctx!.save();
      ctx!.globalAlpha = opacity;
      ctx!.fillStyle = "rgba(120,140,180,0.9)";
      // Simple cloud shape
      const r = 16;
      ctx!.beginPath();
      ctx!.arc(x - r, y, r, Math.PI * 0.5, Math.PI * 1.5);
      ctx!.arc(x, y - r * 0.8, r * 0.9, Math.PI, 0);
      ctx!.arc(x + r, y, r, Math.PI * 1.5, Math.PI * 0.5);
      ctx!.lineTo(x - r, y + r);
      ctx!.closePath();
      ctx!.fill();
      // X mark to indicate "legacy"
      ctx!.strokeStyle = "rgba(255,80,80,0.8)";
      ctx!.lineWidth = 3;
      ctx!.beginPath();
      ctx!.moveTo(x - 5, y - 5);
      ctx!.lineTo(x + 5, y + 5);
      ctx!.moveTo(x + 5, y - 5);
      ctx!.lineTo(x - 5, y + 5);
      ctx!.stroke();
      ctx!.restore();
    }

    function drawSparks() {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const progress = s.life / s.maxLife;
        s.life--;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        for (const p of s.particles) {
          const px = s.x + p.dx * (1 - progress) * p.speed * 15;
          const py = s.y + p.dy * (1 - progress) * p.speed * 15;
          ctx!.beginPath();
          ctx!.arc(px, py, 2 * progress, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(57,255,20,${progress})`;
          ctx!.fill();
        }
        // Ripple
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, (1 - progress) * 30, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(57,255,20,${progress * 0.5})`;
        ctx!.lineWidth = 2;
        ctx!.stroke();
      }
    }

    function spawnSpark(x: number, y: number) {
      const particles = Array.from({ length: 12 }, () => {
        const angle = Math.random() * Math.PI * 2;
        return {
          dx: Math.cos(angle),
          dy: Math.sin(angle),
          speed: 0.5 + Math.random(),
        };
      });
      sparks.push({ x, y, life: 30, maxLife: 30, particles });
    }

    function tick() {
      ctx!.clearRect(0, 0, W, H);
      frameCount++;

      // Spawn every ~90 frames
      if (frameCount % 90 === 0 && attackers.length < 8) {
        spawnAttacker();
      }

      drawDome();

      // Update and draw attackers
      for (let i = attackers.length - 1; i >= 0; i--) {
        const a = attackers[i];
        if (a.bouncing) {
          a.bounceTimer--;
          a.x += a.vx * 3;
          a.y += a.vy * 3;
          a.opacity = Math.max(0, a.opacity - 0.04);
          if (a.bounceTimer <= 0 || a.opacity <= 0) {
            attackers.splice(i, 1);
            continue;
          }
        } else {
          a.x += a.vx;
          a.y += a.vy;
          // Check collision with dome
          const dist = Math.sqrt((a.x - cx) ** 2 + (a.y - cy) ** 2);
          if (dist <= DOME_R + 12) {
            // Bounce: reflect velocity away from center
            const nx = (a.x - cx) / dist;
            const ny = (a.y - cy) / dist;
            const dot = a.vx * nx + a.vy * ny;
            a.vx = a.vx - 2 * dot * nx;
            a.vy = a.vy - 2 * dot * ny;
            a.bouncing = true;
            a.bounceTimer = 25;
            spawnSpark(a.x, a.y);
          }
        }

        if (a.type === "hacker") {
          drawHackerIcon(a.x, a.y, a.opacity);
        } else {
          drawCloudIcon(a.x, a.y, a.opacity);
        }
      }

      drawSparks();
      animId = requestAnimationFrame(tick);
    }

    // Seed initial attackers
    for (let i = 0; i < 4; i++) spawnAttacker();
    tick();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={500}
      style={{
        display: "block",
        margin: "0 auto",
        maxWidth: "100%",
      }}
      aria-label="Sovereign Shield live security visualization — attackers deflect off the neon dome"
    />
  );
}

// ─── Spec Cards ───────────────────────────────────────────────────────────────
const specs = [
  {
    icon: "🌐",
    title: "Sovereign Cloud",
    body: "We don't run on AWS, Google Cloud, or Azure. Your site lives on a decentralized network of independent data centers across the globe — no single company can take it down, throttle it, or hold it hostage.",
  },
  {
    icon: "🔒",
    title: "Tamper-Proof Security",
    body: "Sites hosted in Canisters on the Internet Computer are mathematically impossible to hack or forcibly taken offline. The consensus mechanism of the network guarantees it — not a promise, a protocol.",
  },
  {
    icon: "⚡",
    title: "Infinite Scalability",
    body: "The Dome has no servers — it runs on cycles. Compute expands automatically to absorb any traffic load with zero configuration. Your site never slows down, no matter how many visitors arrive at once.",
  },
  {
    icon: "⛓",
    title: "100% On-Chain",
    body: "Every image, script, stylesheet, and byte of content is stored directly on the blockchain. There is no CDN to fail, no S3 bucket to expire, and no third-party dependency that can break your site.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TheDomePage() {
  useEffect(() => {
    const track = async () => {
      try {
        let sid = sessionStorage.getItem("_vis_sid");
        if (!sid) {
          sid = crypto.randomUUID();
          sessionStorage.setItem("_vis_sid", sid);
        }
        let countryCode: string | null = null;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 2000);
          const res = await fetch("https://ipapi.co/country/", {
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          const text = (await res.text()).trim();
          if (/^[A-Z]{2}$/.test(text)) countryCode = text;
        } catch {
          // geolocation failed — use null
        }
        const publicActor = await createActorWithConfig(createActor);
        await (publicActor as backendInterface).recordVisit(
          "/the-dome",
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid,
          countryCode,
        );
      } catch {
        // silent
      }
    };
    track();
  }, []);

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
        color: "#FFFFFF",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @keyframes domePulseText {
          0%, 100% { text-shadow: 0 0 10px #39FF14, 0 0 30px rgba(57,255,20,0.4), 0 0 60px rgba(57,255,20,0.15); }
          50% { text-shadow: 0 0 20px #39FF14, 0 0 60px rgba(57,255,20,0.6), 0 0 100px rgba(57,255,20,0.25); }
        }
        @keyframes nodeMapPulse {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.12; }
        }
        .dome-spec-card:hover {
          transform: scale(1.02) translateY(-4px);
          border-color: rgba(57,255,20,0.5) !important;
        }
        .dome-spec-card {
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
      `}</style>

      {/* Node Map background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          animation: "nodeMapPulse 4s ease-in-out infinite",
        }}
      >
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Node map background pattern</title>
          <defs>
            <pattern
              id="nodeGrid"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="40" cy="40" r="1.5" fill="#39FF14" />
              <line
                x1="40"
                y1="40"
                x2="80"
                y2="40"
                stroke="#39FF14"
                strokeWidth="0.3"
              />
              <line
                x1="40"
                y1="40"
                x2="40"
                y2="80"
                stroke="#39FF14"
                strokeWidth="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nodeGrid)" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Back nav */}
        <div style={{ padding: "24px 32px" }}>
          <a
            href="/"
            style={{
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              fontSize: "0.875rem",
              letterSpacing: "0.05em",
            }}
            data-ocid="dome-back-link"
          >
            ← Back to Imperidome
          </a>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: "center", padding: "60px 24px 20px" }}
        >
          <p
            style={{
              color: "rgba(57,255,20,0.7)",
              letterSpacing: "0.25em",
              fontSize: "0.875rem",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Our hosting infrastructure.
          </p>
          <h1
            style={{
              fontSize: "clamp(3.5rem, 10vw, 8rem)",
              fontWeight: 900,
              letterSpacing: "0.1em",
              color: GREEN,
              textTransform: "uppercase",
              lineHeight: 1,
              margin: "0 0 16px",
              animation: "domePulseText 3s ease-in-out infinite",
            }}
          >
            THE DOME
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "1rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Sovereign Infrastructure for Unstoppable Business
          </p>
        </motion.div>

        {/* Dome Canvas Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          style={{ padding: "20px 24px" }}
        >
          <SovereignShieldCanvas />
        </motion.div>

        {/* Caption below animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{ textAlign: "center", padding: "0 24px 80px" }}
        >
          <p
            style={{
              fontSize: "clamp(1rem, 3vw, 1.5rem)",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#FFFFFF",
            }}
          >
            LEGACY CLOUD IS VULNERABLE.{" "}
            <span style={{ color: GREEN }}>THE DOME IS IMMUTABLE.</span>
          </p>
        </motion.div>

        {/* Spec Cards */}
        <section
          style={{
            padding: "0 24px 100px",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {specs.map((spec, i) => (
              <motion.div
                key={spec.title}
                className="dome-spec-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  background: CARD_BG,
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: BORDER,
                  borderRadius: "16px",
                  padding: "32px 28px",
                  boxShadow:
                    "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "16px" }}>
                  {spec.icon}
                </div>
                <h3
                  style={{
                    color: GREEN,
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    marginBottom: "12px",
                  }}
                >
                  {spec.title}
                </h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: "0.9375rem",
                    lineHeight: 1.7,
                  }}
                >
                  {spec.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", padding: "0 24px 120px" }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.875rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            Ready to escape legacy infrastructure?
          </p>
          <a
            href="/services"
            style={{
              display: "inline-block",
              padding: "16px 48px",
              background: GREEN,
              color: "#000000",
              fontWeight: 800,
              fontSize: "0.9375rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              borderRadius: "8px",
              textDecoration: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            data-ocid="dome-cta-products"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "scale(1.04)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                `0 0 20px ${GREEN}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "scale(1)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
            }}
          >
            Build on the Dome →
          </a>
        </motion.div>

        <Footer />
      </div>
    </div>
  );
}
