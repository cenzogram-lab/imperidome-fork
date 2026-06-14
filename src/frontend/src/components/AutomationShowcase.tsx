import { useEffect, useRef, useState } from "react";
import EditableText from "./EditableText";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TranscriptLine {
  id: number;
  text: string;
  isAI: boolean;
  visible: boolean;
  rendered: string;
}

interface EmailLine {
  id: number;
  text: string;
  type: "header" | "divider" | "body" | "cta";
  visible: boolean;
  rendered: string;
}

// Typing speed constant — ms per character
const TYPE_MS = 85;

// ─── Matrix Rain Canvas ───────────────────────────────────────────────────────
function MatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const CHARS =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アイウエオカキクケコサシスセソタチツテト";
    const COL_W = 20;

    let rafId: number;
    let cols: number;
    let drops: number[];
    let speeds: number[];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.floor(canvas.width / COL_W);
      drops = Array.from({ length: cols }, () => -Math.random() * 80);
      speeds = Array.from({ length: cols }, () => 0.3 + Math.random() * 0.7);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let lastTime = 0;
    const draw = (ts: number) => {
      rafId = requestAnimationFrame(draw);
      if (ts - lastTime < 50) return;
      lastTime = ts;

      ctx.fillStyle = "rgba(10,11,20,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#5EF08A";
      ctx.font = "12px 'Courier New', monospace";

      for (let i = 0; i < cols; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * COL_W, drops[i] * COL_W);
        if (drops[i] * COL_W > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speeds[i];
      }
      ctx.globalAlpha = 1;
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        display: "block",
      }}
    />
  );
}

// ─── Panel 1 — AI Receptionist ────────────────────────────────────────────────
function AIReceptionistPanel() {
  type Phase = 1 | 2 | 3 | 4;
  const [phase, setPhase] = useState<Phase>(1);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const TRANSCRIPT: Array<{ text: string; isAI: boolean }> = [
    { text: "Caller: Hi, I'd like to book an appointment...", isAI: false },
    { text: "AI: Absolutely! I can help with that.", isAI: true },
    { text: "Caller: What times are available this week?", isAI: false },
    { text: "AI: I have openings Thursday 2PM or Friday 10AM.", isAI: true },
    { text: "Caller: Friday at 10AM works great.", isAI: false },
    { text: "AI: Perfect! Booking confirmed for Friday 10AM.", isAI: true },
  ];

  useEffect(() => {
    let alive = true;
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const totalTranscriptMs = TRANSCRIPT.reduce(
      (acc, e) => acc + e.text.length * TYPE_MS + 900,
      0,
    );
    const loopDuration = 3000 + totalTranscriptMs + 2000;

    const run = () => {
      if (!alive) return;
      setPhase(1);
      setLines([]);

      const t1 = setTimeout(() => {
        if (!alive) return;
        setPhase(2);
      }, 1500);

      const t2 = setTimeout(() => {
        if (!alive) return;
        setPhase(3);

        let lineDelay = 0;
        TRANSCRIPT.forEach((entry, idx) => {
          const lineStart = setTimeout(() => {
            if (!alive) return;
            setLines((prev) => [
              ...prev,
              {
                id: idx,
                text: entry.text,
                isAI: entry.isAI,
                visible: true,
                rendered: "",
              },
            ]);
            entry.text.split("").forEach((_, ci) => {
              const tw = setTimeout(() => {
                if (!alive) return;
                setLines((prev) =>
                  prev.map((l, li) =>
                    li === idx
                      ? { ...l, rendered: entry.text.slice(0, ci + 1) }
                      : l,
                  ),
                );
              }, ci * TYPE_MS);
              timeouts.push(tw);
            });
          }, lineDelay);
          lineDelay += entry.text.length * TYPE_MS + 900;
          timeouts.push(lineStart);
        });
      }, 3000);

      const t3 = setTimeout(() => {
        if (!alive) return;
        setPhase(4);
      }, loopDuration - 2000);

      const t4 = setTimeout(() => {
        if (!alive) return;
        run();
      }, loopDuration);

      timeouts.push(t1, t2, t3, t4);
    };

    run();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom side-effect
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          minHeight: "64px",
        }}
      >
        <span
          style={{
            fontSize: "2rem",
            animation:
              phase === 1 ? "float 1s ease-in-out infinite" : undefined,
          }}
        >
          📞
        </span>
        {phase === 1 && (
          <span
            style={{
              color: "#5EF08A",
              fontFamily: "'Courier New', monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              animation: "blink 0.8s step-end infinite",
            }}
          >
            INCOMING CALL...
          </span>
        )}
        {(phase === 2 || phase === 3 || phase === 4) && (
          <span
            style={{
              color: "#5EF08A",
              fontFamily: "'Courier New', monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              animation: "glow-pulse 2s ease-in-out infinite",
            }}
          >
            ✓ CALL ANSWERED BY AI
          </span>
        )}
      </div>
      {phase >= 3 && (
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            paddingRight: "4px",
            maxHeight: "220px",
            scrollbarWidth: "none",
          }}
        >
          {lines.map((line) => (
            <div
              key={line.id}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "0.75rem",
                lineHeight: 1.5,
                color: line.isAI ? "#5EF08A" : "rgba(200,200,200,0.9)",
                textShadow: line.isAI
                  ? "0 0 8px rgba(94,240,138,0.6)"
                  : undefined,
                animation: line.isAI
                  ? "glow-pulse 2.5s ease-in-out infinite"
                  : undefined,
                wordBreak: "break-word",
                minHeight: "1.2em",
              }}
            >
              {line.rendered || "▌"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panel 2 — SMS Notification ───────────────────────────────────────────────
function SMSPanel() {
  type Phase = 1 | 2 | 3 | 4 | 5;
  const [phase, setPhase] = useState<Phase>(1);
  const [smsText, setSmsText] = useState("");
  const [showDelivered, setShowDelivered] = useState(false);

  const SMS_FULL =
    "Hi! Your appointment is confirmed for Friday at 10AM. Reply STOP to opt out.";

  useEffect(() => {
    let alive = true;
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    const typeDuration = SMS_FULL.length * TYPE_MS + 1200;
    const loopDuration = 2500 + typeDuration + 3000;

    const run = () => {
      if (!alive) return;
      setPhase(1);
      setSmsText("");
      setShowDelivered(false);

      const t1 = setTimeout(() => {
        if (!alive) return;
        setPhase(2);
      }, 1500);

      const t2 = setTimeout(() => {
        if (!alive) return;
        setPhase(3);
        SMS_FULL.split("").forEach((_, ci) => {
          const tw = setTimeout(() => {
            if (!alive) return;
            setSmsText(SMS_FULL.slice(0, ci + 1));
          }, ci * TYPE_MS);
          timeouts.push(tw);
        });
        const td = setTimeout(
          () => {
            if (!alive) return;
            setShowDelivered(true);
            setPhase(4);
          },
          SMS_FULL.length * TYPE_MS + 1200,
        );
        timeouts.push(td);
      }, 2500);

      const t3 = setTimeout(() => {
        if (!alive) return;
        setPhase(5);
      }, loopDuration - 2000);

      const t4 = setTimeout(() => {
        if (!alive) return;
        run();
      }, loopDuration);

      timeouts.push(t1, t2, t3, t4);
    };

    run();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    if (phase !== 2) return;
    const iv = setInterval(() => setDotCount((d) => (d % 3) + 1), 400);
    return () => clearInterval(iv);
  }, [phase]);

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}
    >
      {phase === 1 && (
        <div
          style={{
            background: "rgba(94,240,138,0.06)",
            border: "1px solid rgba(94,240,138,0.2)",
            borderRadius: "8px",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#5EF08A",
                flexShrink: 0,
                animation: "pulse-dot 1.2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.14em",
                color: "#5EF08A",
                textTransform: "uppercase",
              }}
            >
              EVENT DETECTED
            </span>
          </div>
          <span
            style={{
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            New Booking Confirmed
          </span>
        </div>
      )}
      {phase === 2 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "'Courier New', monospace",
            fontSize: "0.75rem",
            color: "#5EF08A",
            letterSpacing: "0.1em",
          }}
        >
          DISPATCHING SMS
          <span style={{ letterSpacing: "0.05em" }}>
            {(["dot-1", "dot-2", "dot-3"] as const).map((key, i) => (
              <span
                key={key}
                style={{
                  opacity: i < dotCount ? 1 : 0.2,
                  transition: "opacity 0.2s",
                }}
              >
                .
              </span>
            ))}
          </span>
        </div>
      )}
      {(phase === 3 || phase === 4) && (
        <div
          style={{
            borderRadius: "20px",
            border: "2px solid rgba(94,240,138,0.3)",
            background: "rgba(0,0,0,0.5)",
            padding: "12px",
            maxWidth: "260px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: "0.65rem",
              color: "rgba(156,163,175,0.7)",
              fontFamily: "'Courier New', monospace",
              marginBottom: "10px",
              letterSpacing: "0.06em",
            }}
          >
            Messages
          </div>
          <div
            style={{
              background: "rgba(94,240,138,0.15)",
              border: "1px solid rgba(94,240,138,0.3)",
              borderRadius: "12px 12px 12px 4px",
              padding: "10px 14px",
              fontSize: "0.82rem",
              color: "#e2e8f0",
              fontFamily: "'Courier New', monospace",
              lineHeight: 1.55,
              minHeight: "48px",
            }}
          >
            {smsText || "▌"}
          </div>
          {showDelivered && (
            <div
              style={{
                textAlign: "right",
                fontSize: "0.72rem",
                color: "#5EF08A",
                fontFamily: "'Courier New', monospace",
                marginTop: "6px",
                opacity: 1,
              }}
            >
              ✓ Delivered
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Panel 3 — Email Campaign ─────────────────────────────────────────────────
function EmailPanel() {
  type Phase = 1 | 2 | 3 | 4;
  const [phase, setPhase] = useState<Phase>(1);
  const [emailLines, setEmailLines] = useState<EmailLine[]>([]);
  const [envelopeFlying, setEnvelopeFlying] = useState(false);
  const [templateIndex, setTemplateIndex] = useState(0);

  const EMAIL_TEMPLATES: Array<
    Array<{ text: string; type: EmailLine["type"] }>
  > = [
    [
      { text: "To: clients@yoursalon.com", type: "header" },
      { text: "From: hello@yoursalon.com", type: "header" },
      {
        text: "Subject: ✂️ 20% Off All Haircuts This Week Only!",
        type: "header",
      },
      { text: "---", type: "divider" },
      { text: "Hi [First Name],", type: "body" },
      { text: "Treat yourself — 20% off any haircut", type: "body" },
      { text: "this week at our salon. Book now", type: "body" },
      { text: "before spots run out!", type: "body" },
      { text: "[ BOOK MY APPOINTMENT → ]", type: "cta" },
    ],
    [
      { text: "To: shoppers@boutique.com", type: "header" },
      { text: "From: hello@boutique.com", type: "header" },
      { text: "Subject: 👗 50% Off ALL Dresses — Today Only!", type: "header" },
      { text: "---", type: "divider" },
      { text: "Hi [First Name],", type: "body" },
      { text: "Our biggest dress sale of the year is", type: "body" },
      { text: "here. 50% off every dress in store", type: "body" },
      { text: "and online. Shop before it ends!", type: "body" },
      { text: "[ SHOP THE SALE → ]", type: "cta" },
    ],
    [
      { text: "To: guests@restaurant.com", type: "header" },
      { text: "From: hello@restaurant.com", type: "header" },
      {
        text: "Subject: 🍽️ Holiday Catering Specials Available Now",
        type: "header",
      },
      { text: "---", type: "divider" },
      { text: "Hi [First Name],", type: "body" },
      { text: "Make your holiday gathering unforgettable.", type: "body" },
      { text: "Our catering packages are now available", type: "body" },
      { text: "for the holiday season. Reserve your date!", type: "body" },
      { text: "[ VIEW CATERING MENU → ]", type: "cta" },
    ],
  ];

  const templateIndexRef = useRef(0);

  useEffect(() => {
    let alive = true;
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      if (!alive) return;
      const currentIndex = templateIndexRef.current;
      const EMAIL_LINES = EMAIL_TEMPLATES[currentIndex];

      setPhase(1);
      setEmailLines([]);
      setEnvelopeFlying(false);
      setTemplateIndex(currentIndex);

      const typewiterLines = EMAIL_LINES.filter(
        (e) => e.type === "body" || e.type === "cta",
      );
      const staticLines = EMAIL_LINES.filter(
        (e) => e.type !== "body" && e.type !== "cta",
      );
      const typeMs = typewiterLines.reduce(
        (acc, e) => acc + e.text.length * TYPE_MS + 800,
        0,
      );
      const staticMs = staticLines.length * 700;
      const loopDuration = 1500 + typeMs + staticMs + 3000;

      const t1 = setTimeout(() => {
        if (!alive) return;
        setPhase(2);

        let delay = 0;
        EMAIL_LINES.forEach((entry, idx) => {
          const isTypewriter = entry.type === "body" || entry.type === "cta";
          const lineStart = setTimeout(() => {
            if (!alive) return;
            setEmailLines((prev) => [
              ...prev,
              {
                id: idx,
                ...entry,
                visible: true,
                rendered: isTypewriter ? "" : entry.text,
              },
            ]);
            if (isTypewriter) {
              entry.text.split("").forEach((_, ci) => {
                const tw = setTimeout(() => {
                  if (!alive) return;
                  setEmailLines((prev) =>
                    prev.map((l, li) =>
                      li === idx
                        ? { ...l, rendered: entry.text.slice(0, ci + 1) }
                        : l,
                    ),
                  );
                }, ci * TYPE_MS);
                timeouts.push(tw);
              });
            }
          }, delay);
          delay += isTypewriter ? entry.text.length * TYPE_MS + 800 : 700;
          timeouts.push(lineStart);
        });
      }, 1500);

      const t2 = setTimeout(() => {
        if (!alive) return;
        setPhase(3);
        setEnvelopeFlying(true);
      }, loopDuration - 2000);

      const t3 = setTimeout(() => {
        if (!alive) return;
        setPhase(4);
      }, loopDuration - 1000);

      const t4 = setTimeout(() => {
        if (!alive) return;
        templateIndexRef.current = (currentIndex + 1) % EMAIL_TEMPLATES.length;
        run();
      }, loopDuration);

      timeouts.push(t1, t2, t3, t4);
    };

    run();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const lineColor = (type: EmailLine["type"]): string => {
    if (type === "header") return "rgba(156,163,175,0.85)";
    if (type === "divider") return "rgba(94,240,138,0.3)";
    if (type === "cta") return "#5EF08A";
    return "rgba(200,200,200,0.9)";
  };

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}
    >
      {(phase === 1 || phase === 2 || phase === 3) && (
        <div
          style={{
            fontSize: phase === 1 ? "2.5rem" : "1.4rem",
            textAlign: phase === 1 ? "center" : "left",
            transition: "font-size 0.4s, text-align 0.4s",
            animation:
              phase === 1
                ? "float 1.5s ease-in-out infinite"
                : envelopeFlying
                  ? "fly-away 0.8s ease-in forwards"
                  : undefined,
            display: "block",
            marginBottom: phase === 1 ? "6px" : "0",
          }}
        >
          ✉
        </div>
      )}
      {phase === 1 && (
        <div
          style={{
            textAlign: "center",
            fontFamily: "'Courier New', monospace",
            fontSize: "0.68rem",
            color: "#5EF08A",
            letterSpacing: "0.14em",
            animation: "blink 0.8s step-end infinite",
          }}
        >
          COMPOSING CAMPAIGN...
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: "4px",
          justifyContent: "center",
          marginBottom: "2px",
        }}
      >
        {(["dot-1", "dot-2", "dot-3"] as const).map((key, i) => (
          <span
            key={key}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background:
                i === templateIndex ? "#5EF08A" : "rgba(94,240,138,0.25)",
              transition: "background 0.4s",
              display: "inline-block",
            }}
          />
        ))}
      </div>
      {phase >= 2 && emailLines.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {emailLines.map((line) => (
            <div
              key={line.id}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize:
                  line.type === "header"
                    ? "0.8rem"
                    : line.type === "cta"
                      ? "0.75rem"
                      : "0.8rem",
                color: lineColor(line.type),
                fontWeight: line.text.startsWith("Subject:") ? 700 : 400,
                textAlign: line.type === "cta" ? "center" : "left",
                borderTop:
                  line.type === "divider"
                    ? "1px solid rgba(94,240,138,0.3)"
                    : undefined,
                marginTop: line.type === "divider" ? "4px" : undefined,
                paddingTop: line.type === "divider" ? "4px" : undefined,
                ...(line.type === "cta"
                  ? {
                      background: "rgba(94,240,138,0.15)",
                      border: "1px solid #5EF08A",
                      borderRadius: "6px",
                      padding: "4px 12px",
                      marginTop: "6px",
                      display: "inline-block",
                      alignSelf: "center",
                      letterSpacing: "0.06em",
                    }
                  : {}),
                minHeight: "1.1em",
              }}
            >
              {line.type === "divider"
                ? ""
                : line.rendered ||
                  (line.type === "body" || line.type === "cta" ? "▌" : "")}
            </div>
          ))}
        </div>
      )}
      {(phase === 3 || phase === 4) && (
        <div
          style={{
            marginTop: "auto",
            fontFamily: "'Courier New', monospace",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#5EF08A",
            textAlign: "center",
            animation: "glow-pulse 1.5s ease-in-out infinite",
            letterSpacing: "0.1em",
            paddingTop: "8px",
          }}
        >
          ✓ CAMPAIGN SENT
        </div>
      )}
    </div>
  );
}

// ─── Panel 4 — CRM Booking Intake ─────────────────────────────────────────────
interface CRMLogLine {
  id: number;
  text: string;
  kind: "booking" | "status" | "reminder";
  visible: boolean;
}

function CRMBookingPanel() {
  const [logLines, setLogLines] = useState<CRMLogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const LOG_ENTRIES: Array<{ text: string; kind: CRMLogLine["kind"] }> = [
    {
      text: "[09:14:02] NEW BOOKING — John M. | Web Design Consult | Jun 3, 2PM",
      kind: "booking",
    },
    {
      text: "[09:14:08] NEW BOOKING — Sarah K. | Logo Package | Jun 4, 11AM",
      kind: "booking",
    },
    {
      text: "[09:14:15] NEW BOOKING — Marcus D. | SEO Audit | Jun 5, 3PM",
      kind: "booking",
    },
    {
      text: "[09:14:20] STATUS UPDATE — John M. → Confirmed ✓",
      kind: "status",
    },
    {
      text: "[09:14:25] REMINDER SENT — Sarah K. | 24hr pre-appointment",
      kind: "reminder",
    },
    {
      text: "[09:14:31] NEW BOOKING — Alicia V. | CRM Setup | Jun 6, 1PM",
      kind: "booking",
    },
    {
      text: "[09:14:38] STATUS UPDATE — Marcus D. → Confirmed ✓",
      kind: "status",
    },
  ];

  useEffect(() => {
    let alive = true;
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      if (!alive) return;
      setLogLines([]);

      LOG_ENTRIES.forEach((entry, idx) => {
        const t = setTimeout(
          () => {
            if (!alive) return;
            setLogLines((prev) => [
              ...prev,
              { id: idx, text: entry.text, kind: entry.kind, visible: true },
            ]);
          },
          800 + idx * 1400,
        );
        timeouts.push(t);
      });

      const reset = setTimeout(
        () => {
          if (!alive) return;
          run();
        },
        800 + LOG_ENTRIES.length * 1400 + 2500,
      );
      timeouts.push(reset);
    };

    run();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom side-effect
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logLines]);

  const lineColor = (kind: CRMLogLine["kind"]) => {
    if (kind === "booking") return "#5EF08A";
    if (kind === "status") return "rgba(94,240,138,0.65)";
    return "rgba(156,163,175,0.75)";
  };

  const lineGlow = (kind: CRMLogLine["kind"]) => {
    if (kind === "booking") return "0 0 10px rgba(94,240,138,0.5)";
    return undefined;
  };

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#5EF08A",
            animation: "pulse-dot 1.2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.14em",
            color: "#5EF08A",
          }}
        >
          LIVE LOG STREAM
        </span>
      </div>

      {/* Log lines */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxHeight: "260px",
          scrollbarWidth: "none",
        }}
      >
        {logLines.map((line) => (
          <div
            key={line.id}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.72rem",
              lineHeight: 1.45,
              color: lineColor(line.kind),
              textShadow: lineGlow(line.kind),
              background:
                line.kind === "booking"
                  ? "rgba(94,240,138,0.04)"
                  : "transparent",
              borderLeft:
                line.kind === "booking"
                  ? "2px solid rgba(94,240,138,0.4)"
                  : "2px solid transparent",
              paddingLeft: "8px",
              borderRadius: "2px",
              animation: "log-fade-in 0.4s ease forwards",
              wordBreak: "break-all",
            }}
          >
            {line.text}
          </div>
        ))}
        {logLines.length === 0 && (
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.72rem",
              color: "rgba(94,240,138,0.35)",
              animation: "blink 1s step-end infinite",
            }}
          >
            AWAITING BOOKINGS▌
          </div>
        )}
      </div>

      {/* Footer counter */}
      <div
        style={{
          borderTop: "1px solid rgba(94,240,138,0.15)",
          paddingTop: "8px",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.65rem",
          color: "rgba(94,240,138,0.6)",
          letterSpacing: "0.08em",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          TOTAL BOOKINGS: {logLines.filter((l) => l.kind === "booking").length}
        </span>
        <span>
          CONFIRMED: {logLines.filter((l) => l.kind === "status").length}
        </span>
      </div>
    </div>
  );
}

// ─── Panel 5 — Lead Capture Stream ────────────────────────────────────────────
type LeadStatus = "pending" | "qualified" | "reviewing" | "filtered";

interface LeadItem {
  id: number;
  name: string;
  source: string;
  status: LeadStatus;
}

function LeadCapturePanel() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [qualified, setQualified] = useState<string[]>([]);
  const [counts, setCounts] = useState({
    captured: 0,
    qualified: 0,
    filtered: 0,
  });

  const LEAD_DATA: Array<{
    name: string;
    source: string;
    verdict: LeadStatus;
  }> = [
    { name: "Alex T.", source: "INSTAGRAM", verdict: "qualified" },
    { name: "Dev R.", source: "GOOGLE ADS", verdict: "qualified" },
    { name: "Priya S.", source: "REFERRAL", verdict: "qualified" },
    { name: "Bot_4421", source: "UNKNOWN", verdict: "filtered" },
    { name: "Lena M.", source: "FACEBOOK", verdict: "qualified" },
  ];

  useEffect(() => {
    let alive = true;
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      if (!alive) return;
      setLeads([]);
      setQualified([]);
      setCounts({ captured: 0, qualified: 0, filtered: 0 });

      LEAD_DATA.forEach((lead, idx) => {
        // Lead appears
        const tAppear = setTimeout(
          () => {
            if (!alive) return;
            setLeads((prev) => [
              ...prev,
              {
                id: idx,
                name: lead.name,
                source: lead.source,
                status: "pending",
              },
            ]);
            setCounts((c) => ({ ...c, captured: c.captured + 1 }));
          },
          600 + idx * 1600,
        );

        // Status assigned
        const tStatus = setTimeout(
          () => {
            if (!alive) return;
            setLeads((prev) =>
              prev.map((l) =>
                l.id === idx ? { ...l, status: lead.verdict } : l,
              ),
            );
            if (lead.verdict === "qualified") {
              setQualified((prev) => [...prev, lead.name]);
              setCounts((c) => ({ ...c, qualified: c.qualified + 1 }));
            } else if (lead.verdict === "filtered") {
              setCounts((c) => ({ ...c, filtered: c.filtered + 1 }));
            }
          },
          600 + idx * 1600 + 900,
        );

        timeouts.push(tAppear, tStatus);
      });

      const reset = setTimeout(
        () => {
          if (!alive) return;
          run();
        },
        600 + LEAD_DATA.length * 1600 + 2500,
      );
      timeouts.push(reset);
    };

    run();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const statusLabel = (s: LeadStatus) => {
    if (s === "pending")
      return { text: "[SCANNING]", color: "rgba(156,163,175,0.6)" };
    if (s === "qualified") return { text: "[QUALIFIED]", color: "#5EF08A" };
    if (s === "reviewing") return { text: "[REVIEWING]", color: "#fbbf24" };
    return { text: "[FILTERED OUT]", color: "#f87171" };
  };

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          flex: 1,
        }}
      >
        {/* Left — incoming */}
        <div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.6rem",
              color: "rgba(94,240,138,0.55)",
              letterSpacing: "0.14em",
              marginBottom: "8px",
            }}
          >
            INCOMING
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {leads.map((lead) => {
              const s = statusLabel(lead.status);
              return (
                <div
                  key={lead.id}
                  style={{ animation: "log-fade-in 0.3s ease forwards" }}
                >
                  <div
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.68rem",
                      color: "rgba(220,220,220,0.9)",
                      lineHeight: 1.3,
                    }}
                  >
                    {lead.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.58rem",
                      color: "rgba(94,240,138,0.5)",
                      marginBottom: "2px",
                    }}
                  >
                    [{lead.source}]
                  </div>
                  <div
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.6rem",
                      color: s.color,
                      textShadow:
                        lead.status === "qualified"
                          ? "0 0 6px rgba(94,240,138,0.5)"
                          : undefined,
                    }}
                  >
                    {s.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — qualified */}
        <div
          style={{
            borderLeft: "1px solid rgba(94,240,138,0.15)",
            paddingLeft: "8px",
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.6rem",
              color: "rgba(94,240,138,0.55)",
              letterSpacing: "0.14em",
              marginBottom: "8px",
            }}
          >
            QUALIFIED ✓
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {qualified.map((name) => (
              <div
                key={name}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.68rem",
                  color: "#5EF08A",
                  textShadow: "0 0 8px rgba(94,240,138,0.5)",
                  animation: "log-fade-in 0.4s ease forwards",
                }}
              >
                {name} ✓
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Counter */}
      <div
        style={{
          borderTop: "1px solid rgba(94,240,138,0.15)",
          paddingTop: "8px",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.6rem",
          color: "rgba(94,240,138,0.6)",
          letterSpacing: "0.06em",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "4px",
        }}
      >
        <span>
          CAPTURED: <span style={{ color: "#5EF08A" }}>{counts.captured}</span>
        </span>
        <span>
          QUALIFIED:{" "}
          <span style={{ color: "#5EF08A" }}>{counts.qualified}</span>
        </span>
        <span>
          FILTERED: <span style={{ color: "#f87171" }}>{counts.filtered}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Panel 6 — Admin Client Management ────────────────────────────────────────
type ClientStatus = "ACTIVE" | "IN REVIEW" | "COMPLETED" | "PENDING";

interface ClientRow {
  id: number;
  client: string;
  project: string;
  status: ClientStatus;
  lastActive: string;
  highlight: boolean;
  badge: string | null;
  visible: boolean;
}

function ClientManagementPanel() {
  const [rows, setRows] = useState<ClientRow[]>([]);

  const INITIAL_CLIENTS: Array<
    Omit<ClientRow, "visible" | "highlight" | "badge">
  > = [
    {
      id: 0,
      client: "Nexus Corp",
      project: "Web Redesign",
      status: "ACTIVE",
      lastActive: "2 min ago",
    },
    {
      id: 1,
      client: "BloomBoutique",
      project: "SEO Package",
      status: "IN REVIEW",
      lastActive: "15 min ago",
    },
    {
      id: 2,
      client: "TechStart Inc",
      project: "Logo Design",
      status: "COMPLETED",
      lastActive: "1 hr ago",
    },
    {
      id: 3,
      client: "Rivera LLC",
      project: "Social Media",
      status: "PENDING",
      lastActive: "3 hr ago",
    },
    {
      id: 4,
      client: "Apex Digital",
      project: "CRM Setup",
      status: "ACTIVE",
      lastActive: "just now",
    },
  ];

  useEffect(() => {
    let alive = true;
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      if (!alive) return;
      setRows([]);

      // Rows appear one by one
      INITIAL_CLIENTS.forEach((c, idx) => {
        const t = setTimeout(
          () => {
            if (!alive) return;
            setRows((prev) => [
              ...prev,
              { ...c, visible: true, highlight: false, badge: null },
            ]);
          },
          400 + idx * 900,
        );
        timeouts.push(t);
      });

      // Rivera LLC: PENDING → ACTIVE flash
      const tFlip = setTimeout(
        () => {
          if (!alive) return;
          setRows((prev) =>
            prev.map((r) =>
              r.id === 3 ? { ...r, status: "ACTIVE", highlight: true } : r,
            ),
          );
          const tUnhigh = setTimeout(() => {
            if (!alive) return;
            setRows((prev) =>
              prev.map((r) => (r.id === 3 ? { ...r, highlight: false } : r)),
            );
          }, 1200);
          timeouts.push(tUnhigh);
        },
        400 + INITIAL_CLIENTS.length * 900 + 1000,
      );

      // Nexus Corp: badge [MSG 3]
      const tBadge = setTimeout(
        () => {
          if (!alive) return;
          setRows((prev) =>
            prev.map((r) => (r.id === 0 ? { ...r, badge: "MSG 3" } : r)),
          );
        },
        400 + INITIAL_CLIENTS.length * 900 + 2400,
      );

      const tReset = setTimeout(
        () => {
          if (!alive) return;
          run();
        },
        400 + INITIAL_CLIENTS.length * 900 + 5000,
      );

      timeouts.push(tFlip, tBadge, tReset);
    };

    run();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const statusStyle = (
    status: ClientStatus,
  ): { color: string; bg: string; glow?: string } => {
    if (status === "ACTIVE")
      return {
        color: "#5EF08A",
        bg: "rgba(94,240,138,0.12)",
        glow: "0 0 8px rgba(94,240,138,0.45)",
      };
    if (status === "IN REVIEW")
      return { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" };
    if (status === "COMPLETED")
      return { color: "rgba(156,163,175,0.8)", bg: "rgba(156,163,175,0.08)" };
    return { color: "rgba(156,163,175,0.55)", bg: "rgba(156,163,175,0.06)" };
  };

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}
    >
      {/* Column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto",
          gap: "4px",
          paddingBottom: "6px",
          borderBottom: "1px solid rgba(94,240,138,0.15)",
          marginBottom: "4px",
        }}
      >
        {["CLIENT", "PROJECT", "STATUS"].map((h) => (
          <div
            key={h}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.58rem",
              letterSpacing: "0.14em",
              color: "rgba(94,240,138,0.45)",
              textTransform: "uppercase",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {rows.map((row) => {
          const ss = statusStyle(row.status);
          return (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: "4px",
                alignItems: "center",
                padding: "6px 8px",
                borderRadius: "6px",
                background: row.highlight
                  ? "rgba(94,240,138,0.1)"
                  : "rgba(255,255,255,0.02)",
                border: row.highlight
                  ? "1px solid rgba(94,240,138,0.4)"
                  : "1px solid transparent",
                transition: "background 0.4s, border 0.4s",
                animation: "log-fade-in 0.4s ease forwards",
              }}
            >
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.68rem",
                  color: "rgba(220,220,220,0.9)",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.client}
                </span>
                {row.badge && (
                  <span
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.55rem",
                      background: "rgba(94,240,138,0.2)",
                      color: "#5EF08A",
                      border: "1px solid rgba(94,240,138,0.5)",
                      borderRadius: "4px",
                      padding: "1px 4px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      animation: "blink 1.2s step-end infinite",
                    }}
                  >
                    {row.badge}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.65rem",
                  color: "rgba(156,163,175,0.7)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.project}
              </div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.6rem",
                  color: ss.color,
                  background: ss.bg,
                  boxShadow: ss.glow,
                  borderRadius: "4px",
                  padding: "2px 6px",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  transition: "color 0.5s, background 0.5s",
                }}
              >
                {row.status}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(94,240,138,0.15)",
          paddingTop: "8px",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.6rem",
          color: "rgba(94,240,138,0.5)",
          letterSpacing: "0.08em",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>CLIENTS: {rows.length}</span>
        <span style={{ color: "#5EF08A" }}>
          ACTIVE: {rows.filter((r) => r.status === "ACTIVE").length}
        </span>
      </div>
    </div>
  );
}

// ─── Panel 7 — Booking Calendar (constants at module level) ──────────────────
const CAL_MONTH_LABEL = "MAY 2026";
const CAL_DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
// 5-week grid for May 2026 — starts on Friday (index 4). 0 = empty cell.
const CAL_DATE_GRID: number[] = [
  0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
];
// Each booking: { dateNum, label } — dateNum matches CAL_DATE_GRID values
const CAL_BOOKINGS = [
  { dateNum: 6, label: "9:00 Kowalski" },
  { dateNum: 8, label: "10:30 Martinez" },
  { dateNum: 13, label: "2:00 Chen" },
  { dateNum: 19, label: "11:00 Rivera" },
  { dateNum: 22, label: "3:30 Patel" },
];
// Total phases = 1 (grid shown) + CAL_BOOKINGS.length
const CAL_BOOKING_INTERVAL = 1400; // ms between each booking start

// ─── Panel 7 — Booking Calendar ────────────────────────────────────────────────
function BookingCalendarPanel() {
  // phase 0 = calendar grid visible, no bookings yet
  // phase 1..5 = booking N-1 is typing in
  // phase 6 = all done, pause before loop
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState("");
  // filledBookings[i] = fully typed label for booking i, or "" if not yet
  const [filledBookings, setFilledBookings] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const TOTAL_BOOKINGS = CAL_BOOKINGS.length;
    // time for all bookings to type + pause
    const totalTypingMs =
      TOTAL_BOOKINGS * CAL_BOOKING_INTERVAL +
      CAL_BOOKINGS.reduce((acc, b) => acc + b.label.length * TYPE_MS, 0);
    const loopDuration = 800 + totalTypingMs + 2000;

    const run = () => {
      if (!alive) return;
      setPhase(0);
      setTyped("");
      setFilledBookings([]);

      // Start typing bookings one by one
      let delay = 800;
      CAL_BOOKINGS.forEach((booking, bIdx) => {
        const tStart = setTimeout(() => {
          if (!alive) return;
          setPhase(bIdx + 1);
          setTyped("");
          // Type this booking character by character
          booking.label.split("").forEach((_, ci) => {
            const tw = setTimeout(() => {
              if (!alive) return;
              setTyped(booking.label.slice(0, ci + 1));
              // When fully typed, commit to filledBookings
              if (ci === booking.label.length - 1) {
                setFilledBookings((prev) => {
                  const next = [...prev];
                  next[bIdx] = booking.label;
                  return next;
                });
              }
            }, ci * TYPE_MS);
            timeouts.push(tw);
          });
        }, delay);
        delay += CAL_BOOKING_INTERVAL + booking.label.length * TYPE_MS;
        timeouts.push(tStart);
      });

      // After all done, set final phase then loop
      const tDone = setTimeout(() => {
        if (!alive) return;
        setPhase(TOTAL_BOOKINGS + 1);
      }, delay);
      const tReset = setTimeout(() => {
        if (!alive) return;
        run();
      }, loopDuration);
      timeouts.push(tDone, tReset);
    };

    run();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}
    >
      {/* Month header */}
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "0.68rem",
          letterSpacing: "0.18em",
          color: "#5EF08A",
          textAlign: "center",
          textShadow: "0 0 8px rgba(94,240,138,0.5)",
          marginBottom: "2px",
        }}
      >
        {CAL_MONTH_LABEL}
      </div>

      {/* Day-of-week headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          borderBottom: "1px solid rgba(94,240,138,0.2)",
          paddingBottom: "4px",
          marginBottom: "2px",
        }}
      >
        {CAL_DAY_HEADERS.map((d) => (
          <div
            key={d}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.52rem",
              letterSpacing: "0.06em",
              color: "rgba(94,240,138,0.45)",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar date grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          flex: 1,
        }}
      >
        {CAL_DATE_GRID.map((dateNum, cellIdx) => {
          // Find if this cell has a booking
          const bookingIdx = CAL_BOOKINGS.findIndex(
            (b) => b.dateNum === dateNum,
          );
          const isActiveBooking = bookingIdx !== -1 && phase === bookingIdx + 1;
          const isFilledBooking =
            bookingIdx !== -1 &&
            filledBookings[bookingIdx] !== undefined &&
            filledBookings[bookingIdx] !== "";

          return (
            <div
              key={`cell-${cellIdx}-${dateNum}`}
              style={{
                minHeight: "46px",
                borderRadius: "4px",
                padding: "2px 3px",
                background:
                  dateNum === 0
                    ? "transparent"
                    : isActiveBooking
                      ? "rgba(94,240,138,0.12)"
                      : isFilledBooking
                        ? "rgba(94,240,138,0.06)"
                        : "rgba(255,255,255,0.02)",
                border:
                  dateNum === 0
                    ? "none"
                    : isActiveBooking
                      ? "1px solid rgba(94,240,138,0.5)"
                      : isFilledBooking
                        ? "1px solid rgba(94,240,138,0.25)"
                        : "1px solid rgba(255,255,255,0.04)",
                boxShadow: isActiveBooking
                  ? "0 0 8px rgba(94,240,138,0.2)"
                  : undefined,
                transition: "background 0.3s, border 0.3s",
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                overflow: "hidden",
              }}
            >
              {dateNum > 0 && (
                <span
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "0.52rem",
                    color: isActiveBooking ? "#5EF08A" : "rgba(94,240,138,0.4)",
                    lineHeight: 1,
                    textShadow: isActiveBooking
                      ? "0 0 6px rgba(94,240,138,0.6)"
                      : undefined,
                  }}
                >
                  {dateNum}
                </span>
              )}
              {isActiveBooking && (
                <span
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "0.46rem",
                    color: "#5EF08A",
                    textShadow: "0 0 6px rgba(94,240,138,0.7)",
                    lineHeight: 1.2,
                    wordBreak: "break-all",
                    display: "block",
                  }}
                >
                  {typed}▌
                </span>
              )}
              {isFilledBooking && !isActiveBooking && (
                <span
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "0.46rem",
                    color: "rgba(94,240,138,0.85)",
                    lineHeight: 1.2,
                    wordBreak: "break-all",
                    display: "block",
                  }}
                >
                  {filledBookings[bookingIdx]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(94,240,138,0.15)",
          paddingTop: "6px",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.6rem",
          color: "rgba(94,240,138,0.55)",
          letterSpacing: "0.08em",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          BOOKED:{" "}
          <span style={{ color: "#5EF08A" }}>
            {filledBookings.filter(Boolean).length}
          </span>
          /{CAL_BOOKINGS.length}
        </span>
        <span
          style={{
            color:
              phase > CAL_BOOKINGS.length ? "#5EF08A" : "rgba(94,240,138,0.35)",
            animation:
              phase > CAL_BOOKINGS.length
                ? "glow-pulse 2s ease-in-out infinite"
                : undefined,
          }}
        >
          AUTO-SCHEDULED ✓
        </span>
      </div>
    </div>
  );
}

// ─── Panel 8 — Spreadsheet Excel Export ──────────────────────────────────────
function SpreadsheetExportPanel() {
  type Phase = 1 | 2 | 3 | 4 | 5;
  const [phase, setPhase] = useState<Phase>(1);
  const [rows, setRows] = useState<string[][]>([]);
  const [exportText, setExportText] = useState("");
  const [progress, setProgress] = useState(0);
  const [doneText, setDoneText] = useState("");

  const HEADERS = ["DATE", "CLIENT", "SERVICE", "AMOUNT", "STATUS"];
  const DATA_ROWS = [
    ["Jun 03", "Sarah M.", "Web Design", "$850", "PAID"],
    ["Jun 04", "James K.", "SEO Audit", "$320", "PAID"],
    ["Jun 05", "Priya S.", "Logo Pack", "$450", "PENDING"],
    ["Jun 06", "Dev R.", "CRM Setup", "$1,200", "PAID"],
    ["Jun 07", "Alicia V.", "Email Mktg", "$280", "INVOICED"],
  ];
  const EXPORT_STR = "EXPORTING TO EXCEL...";
  const DONE_STR = "✓ EXPORT COMPLETE — bookings.xlsx";

  useEffect(() => {
    let alive = true;
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    const rowDuration = DATA_ROWS.length * 1300;
    const exportTextDuration = EXPORT_STR.length * TYPE_MS;
    const doneDuration = DONE_STR.length * TYPE_MS;
    const loopDuration =
      1500 +
      rowDuration +
      800 +
      exportTextDuration +
      1200 +
      doneDuration +
      2000;

    const run = () => {
      if (!alive) return;
      setPhase(1);
      setRows([]);
      setExportText("");
      setProgress(0);
      setDoneText("");
      if (progressInterval) clearInterval(progressInterval);

      // Phase 2 — header + rows appear
      const t1 = setTimeout(() => {
        if (!alive) return;
        setPhase(2);
        DATA_ROWS.forEach((row, idx) => {
          const ts = setTimeout(() => {
            if (!alive) return;
            setRows((prev) => [...prev, row]);
          }, idx * 1300);
          timeouts.push(ts);
        });
      }, 1500);

      // Phase 3 — type EXPORTING TO EXCEL...
      const t2 = setTimeout(
        () => {
          if (!alive) return;
          setPhase(3);
          EXPORT_STR.split("").forEach((_, ci) => {
            const tw = setTimeout(() => {
              if (!alive) return;
              setExportText(EXPORT_STR.slice(0, ci + 1));
            }, ci * TYPE_MS);
            timeouts.push(tw);
          });
        },
        1500 + rowDuration + 800,
      );

      // Phase 4 — progress bar fills
      const t3 = setTimeout(
        () => {
          if (!alive) return;
          setPhase(4);
          setProgress(0);
          let pct = 0;
          progressInterval = setInterval(() => {
            if (!alive) {
              if (progressInterval) clearInterval(progressInterval);
              return;
            }
            pct += 4;
            setProgress(Math.min(pct, 100));
            if (pct >= 100 && progressInterval) {
              clearInterval(progressInterval);
              progressInterval = null;
            }
          }, 40);
        },
        1500 + rowDuration + 800 + exportTextDuration + 300,
      );

      // Phase 5 — type completion message
      const t4 = setTimeout(
        () => {
          if (!alive) return;
          setPhase(5);
          DONE_STR.split("").forEach((_, ci) => {
            const tw = setTimeout(() => {
              if (!alive) return;
              setDoneText(DONE_STR.slice(0, ci + 1));
            }, ci * TYPE_MS);
            timeouts.push(tw);
          });
        },
        1500 + rowDuration + 800 + exportTextDuration + 1200,
      );

      // Loop
      const tReset = setTimeout(() => {
        if (!alive) return;
        run();
      }, loopDuration);

      timeouts.push(t1, t2, t3, t4, tReset);
    };

    run();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, []);

  const statusColor = (s: string) => {
    if (s === "PAID") return "#5EF08A";
    if (s === "INVOICED") return "#fbbf24";
    return "rgba(156,163,175,0.75)";
  };

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}
    >
      {/* Column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 3fr 4fr 3fr 3fr",
          gap: "2px",
          paddingBottom: "6px",
          borderBottom: "1px solid rgba(94,240,138,0.25)",
          marginBottom: "2px",
        }}
      >
        {HEADERS.map((h) => (
          <div
            key={h}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.12em",
              color: "rgba(94,240,138,0.55)",
              textTransform: "uppercase",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Data rows */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {phase === 1 && (
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.68rem",
              color: "rgba(94,240,138,0.35)",
              animation: "blink 1s step-end infinite",
            }}
          >
            LOADING DATA▌
          </div>
        )}
        {rows.map((row, idx) => (
          <div
            key={row[0] + row[1]}
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 3fr 4fr 3fr 3fr",
              gap: "2px",
              padding: "4px 6px",
              background:
                idx % 2 === 0 ? "rgba(94,240,138,0.03)" : "transparent",
              borderRadius: "3px",
              animation: "log-fade-in 0.4s ease forwards",
            }}
          >
            {row.map((cell, ci) => (
              <div
                key={cell + String(ci)}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.6rem",
                  color:
                    ci === 4
                      ? statusColor(cell)
                      : ci === 3
                        ? "#5EF08A"
                        : "rgba(200,200,200,0.85)",
                  textShadow:
                    ci === 3 ? "0 0 6px rgba(94,240,138,0.4)" : undefined,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Export section */}
      {phase >= 3 && (
        <div
          style={{
            borderTop: "1px solid rgba(94,240,138,0.2)",
            paddingTop: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.68rem",
              color: "#5EF08A",
              letterSpacing: "0.08em",
              minHeight: "1.2em",
            }}
          >
            {exportText}
            {phase === 3 ? "▌" : ""}
          </div>
          {phase >= 4 && (
            <div
              style={{
                height: "6px",
                background: "rgba(94,240,138,0.12)",
                borderRadius: "3px",
                overflow: "hidden",
                border: "1px solid rgba(94,240,138,0.25)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "#5EF08A",
                  boxShadow: "0 0 8px rgba(94,240,138,0.7)",
                  borderRadius: "3px",
                  transition: "width 0.04s linear",
                }}
              />
            </div>
          )}
          {phase >= 5 && (
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "0.68rem",
                color: "#5EF08A",
                textShadow: "0 0 10px rgba(94,240,138,0.6)",
                animation: "glow-pulse 2s ease-in-out infinite",
                minHeight: "1.2em",
              }}
            >
              {doneText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Panel 9 — PWA Install & Launch ──────────────────────────────────────────
function PWAInstallPanel() {
  type Stage = 1 | 2 | 3;
  const [stage, setStage] = useState<Stage>(1);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [line3, setLine3] = useState("");
  const [line4, setLine4] = useState("");
  const [_showCursor, setShowCursor] = useState(true);

  const S1_L1 = "[ ADMIN PANEL v2.0 ]";
  const S1_L2 = "► Install available  [+]";
  const S2_L1 = "INSTALLING...";
  const S2_L2 = "► Download to device  ✓";
  const S3_L1 = "[ HOME SCREEN ]";
  const S3_L2 = "  ┌─────────┐";
  const S3_L3 = "  │  ⚡ PWA │  imperidome";
  const S3_L4 = "► Tap to launch...";

  const typeText = (
    text: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    startDelay: number,
    timeouts: ReturnType<typeof setTimeout>[],
    alive: { v: boolean },
  ) => {
    text.split("").forEach((_, ci) => {
      const tw = setTimeout(
        () => {
          if (!alive.v) return;
          setter(text.slice(0, ci + 1));
        },
        startDelay + ci * TYPE_MS,
      );
      timeouts.push(tw);
    });
    return startDelay + text.length * TYPE_MS;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: typeText is a stable inner util
  useEffect(() => {
    let alive = { v: true };
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const s1Duration = (S1_L1.length + S1_L2.length) * TYPE_MS + 600;
    const s2Duration = (S2_L1.length + S2_L2.length) * TYPE_MS + 600;
    const s3Duration =
      (S3_L1.length + S3_L2.length + S3_L3.length + S3_L4.length) * TYPE_MS +
      600;
    const loopDuration =
      1000 + s1Duration + 1800 + s2Duration + 1800 + s3Duration + 2000;

    const run = () => {
      if (!alive.v) return;
      setStage(1);
      setLine1("");
      setLine2("");
      setLine3("");
      setLine4("");
      setShowCursor(true);

      // Stage 1 — admin panel screen
      let t = setTimeout(() => {
        if (!alive.v) return;
        setStage(1);
        let offset = 0;
        offset = typeText(S1_L1, setLine1, offset, timeouts, alive);
        offset = typeText(S1_L2, setLine2, offset + 400, timeouts, alive);
      }, 1000);
      timeouts.push(t);

      // Stage 2 — installing
      const stage2Start = 1000 + s1Duration + 1800;
      t = setTimeout(() => {
        if (!alive.v) return;
        setStage(2);
        setLine1("");
        setLine2("");
        setLine3("");
        setLine4("");
        let offset = 0;
        offset = typeText(S2_L1, setLine1, offset, timeouts, alive);
        offset = typeText(S2_L2, setLine2, offset + 400, timeouts, alive);
      }, stage2Start);
      timeouts.push(t);

      // Stage 3 — home screen
      const stage3Start = stage2Start + s2Duration + 1800;
      t = setTimeout(() => {
        if (!alive.v) return;
        setStage(3);
        setLine1("");
        setLine2("");
        setLine3("");
        setLine4("");
        let offset = 0;
        offset = typeText(S3_L1, setLine1, offset, timeouts, alive);
        offset = typeText(S3_L2, setLine2, offset + 200, timeouts, alive);
        offset = typeText(S3_L3, setLine3, offset + 100, timeouts, alive);
        typeText(S3_L4, setLine4, offset + 300, timeouts, alive);
      }, stage3Start);
      timeouts.push(t);

      // Loop
      const tReset = setTimeout(() => {
        if (!alive.v) return;
        run();
      }, loopDuration);
      timeouts.push(tReset);
    };

    run();
    return () => {
      alive.v = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const stageLabel = (s: Stage) => {
    if (s === 1) return "STAGE 1 — BROWSER";
    if (s === 2) return "STAGE 2 — INSTALL";
    return "STAGE 3 — DEVICE";
  };

  const activeLine = () => {
    if (!line2 && line1) return "line1";
    if (!line3 && line2) return "line2";
    if (!line4 && line3) return "line3";
    if (line4 && line4.length < (stage === 3 ? S3_L4.length : S2_L2.length))
      return "line4";
    return null;
  };
  const al = activeLine();

  const lineStyle = (highlight?: boolean): React.CSSProperties => ({
    fontFamily: "'Courier New', monospace",
    fontSize: "0.75rem",
    lineHeight: 1.7,
    color: highlight ? "#5EF08A" : "rgba(200,200,200,0.9)",
    textShadow: highlight ? "0 0 8px rgba(94,240,138,0.55)" : undefined,
    minHeight: "1.4em",
  });

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}
    >
      {/* Stage indicator */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        {([1, 2, 3] as Stage[]).map((s) => (
          <div
            key={s}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.1em",
              color: stage === s ? "#5EF08A" : "rgba(94,240,138,0.25)",
              borderBottom:
                stage === s ? "1px solid #5EF08A" : "1px solid transparent",
              paddingBottom: "2px",
              transition: "color 0.3s",
              textShadow:
                stage === s ? "0 0 8px rgba(94,240,138,0.5)" : undefined,
            }}
          >
            {`S${s}`}
          </div>
        ))}
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "0.55rem",
            letterSpacing: "0.12em",
            color: "rgba(94,240,138,0.45)",
            marginLeft: "4px",
          }}
        >
          {stageLabel(stage)}
        </div>
      </div>

      {/* Terminal window */}
      <div
        style={{
          flex: 1,
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(94,240,138,0.3)",
          borderRadius: "8px",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Fake traffic lights */}
        <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
          {[
            "rgba(255,95,87,0.6)",
            "rgba(255,189,46,0.6)",
            "rgba(94,240,138,0.6)",
          ].map((c) => (
            <div
              key={c}
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: c,
              }}
            />
          ))}
        </div>

        {line1 && (
          <div style={lineStyle(stage === 1)}>
            {line1}
            {al === "line1" ? "▌" : ""}
          </div>
        )}
        {line2 && (
          <div
            style={lineStyle(
              (stage === 1 && line2.includes("[+]")) ||
                (stage === 2 && line2.includes("✓")),
            )}
          >
            {line2}
            {al === "line2" ? "▌" : ""}
          </div>
        )}
        {line3 && (
          <div style={lineStyle(stage === 3 && line3.includes("PWA"))}>
            {line3}
            {al === "line3" ? "▌" : ""}
          </div>
        )}
        {line4 && (
          <div style={lineStyle(true)}>
            {line4}
            {al === "line4" ? "▌" : ""}
          </div>
        )}
        {!line1 && (
          <div
            style={{
              ...lineStyle(),
              animation: "blink 0.8s step-end infinite",
              color: "rgba(94,240,138,0.4)",
            }}
          >
            ▌
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(94,240,138,0.15)",
          paddingTop: "6px",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.6rem",
          color: "rgba(94,240,138,0.5)",
          letterSpacing: "0.08em",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          PWA STATUS:{" "}
          <span
            style={{ color: stage >= 2 ? "#5EF08A" : "rgba(94,240,138,0.35)" }}
          >
            {stage >= 3
              ? "INSTALLED"
              : stage === 2
                ? "INSTALLING"
                : "AVAILABLE"}
          </span>
        </span>
        <span
          style={{
            animation:
              stage === 3 ? "glow-pulse 2s ease-in-out infinite" : undefined,
            color: stage === 3 ? "#5EF08A" : "rgba(94,240,138,0.35)",
          }}
        >
          OFFLINE READY
        </span>
      </div>
    </div>
  );
}

// ─── Card Wrapper ──────────────────────────────────────────────────────────────
interface PanelCardProps {
  title: string;
  children: React.ReactNode;
}

function PanelCard({ title, children }: PanelCardProps) {
  return (
    <div
      style={{
        background: "rgba(10,12,22,0.9)",
        border: "1px solid rgba(94,240,138,0.35)",
        borderRadius: "12px",
        padding: "24px",
        boxShadow:
          "0 0 20px rgba(94,240,138,0.08), inset 0 0 40px rgba(94,240,138,0.02)",
        minHeight: "380px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        animation: "showcase-card-glow 4s ease-in-out infinite",
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(transparent 50%, rgba(0,0,0,0.03) 50%)",
          backgroundSize: "100% 4px",
          pointerEvents: "none",
          zIndex: 2,
          borderRadius: "12px",
        }}
      />

      {/* Panel content (above scanline z-index 3) */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "0.7rem",
            letterSpacing: "0.18em",
            color: "#5EF08A",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            height: "1px",
            background: "rgba(94,240,138,0.15)",
            marginBottom: "16px",
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── AutomationShowcase ────────────────────────────────────────────────────────
export default function AutomationShowcase() {
  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 4px rgba(94,240,138,0.4); }
          50% { text-shadow: 0 0 16px rgba(94,240,138,0.9), 0 0 30px rgba(94,240,138,0.5); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes fly-away {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(80px, -40px); opacity: 0; }
        }
        @keyframes showcase-card-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(94,240,138,0.08), inset 0 0 40px rgba(94,240,138,0.02); }
          50% { box-shadow: 0 0 30px rgba(94,240,138,0.18), 0 0 60px rgba(94,240,138,0.06), inset 0 0 40px rgba(94,240,138,0.02); }
        }
        @keyframes log-fade-in {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .automation-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 900px) {
          .automation-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .automation-grid * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          background: "#0A0B14",
          padding: "80px 16px",
          overflow: "hidden",
        }}
        data-ocid="automation-showcase.section"
      >
        {/* Matrix rain */}
        <MatrixCanvas />

        {/* Content container */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.2em",
                color: "#5EF08A",
                marginBottom: "12px",
                textTransform: "uppercase",
              }}
            >
              [ SYSTEM ACTIVE ]
            </div>
            <h2
              style={{
                color: "#FFFFFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                margin: 0,
                display: "inline",
              }}
            >
              <EditableText
                textKey="automation-showcase.heading"
                defaultText="INTELLIGENCE IN ACTION"
              />
            </h2>
            <span
              style={{
                color: "#5EF08A",
                fontWeight: 800,
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                marginLeft: "4px",
                animation: "blink 0.8s step-end infinite",
                display: "inline",
                lineHeight: 1,
              }}
            >
              |
            </span>
            <p
              style={{
                color: "rgba(156,163,175,0.9)",
                fontSize: "0.95rem",
                marginTop: "8px",
                marginBottom: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Automated. Intelligent. Always On.
            </p>
          </div>

          {/* Nine panels — 3 columns × 3 rows */}
          <div className="automation-grid">
            <PanelCard title="▶ AI RECEPTIONIST">
              <AIReceptionistPanel />
            </PanelCard>

            <PanelCard title="▶ SMS NOTIFICATIONS">
              <SMSPanel />
            </PanelCard>

            <PanelCard title="▶ EMAIL CAMPAIGN">
              <EmailPanel />
            </PanelCard>

            <PanelCard title="▶ CRM BOOKING INTAKE">
              <CRMBookingPanel />
            </PanelCard>

            <PanelCard title="▶ LEAD CAPTURE STREAM">
              <LeadCapturePanel />
            </PanelCard>

            <PanelCard title="▶ CLIENT MANAGEMENT PANEL">
              <ClientManagementPanel />
            </PanelCard>

            <PanelCard title="▶ BOOKING CALENDAR">
              <BookingCalendarPanel />
            </PanelCard>

            <PanelCard title="▶ SPREADSHEET EXPORT">
              <SpreadsheetExportPanel />
            </PanelCard>

            <PanelCard title="▶ PWA INSTALL & LAUNCH">
              <PWAInstallPanel />
            </PanelCard>
          </div>
        </div>
      </section>
    </>
  );
}
