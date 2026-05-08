import { useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useState } from "react";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useActor } from "../hooks/useActor";

// Tier → product name mapping for backend catalog lookup
const TIER_PRODUCT_NAMES: Record<string, string> = {
  flash: "Flash",
  starter: "Starter",
  scale: "Scale",
};

// ─── Option data ──────────────────────────────────────────────────────────────

const MATERIAL_OPTIONS = [
  {
    id: "glass",
    label: "Refractive Glass / Crystal",
    sub: "Perfume, Spirits, Skincare",
    icon: "💎",
  },
  {
    id: "metal",
    label: "Brushed / Polished Metal",
    sub: "Tech, Watches, Jewelry",
    icon: "⚙️",
  },
  {
    id: "plastic",
    label: "Matte / Soft-Touch Plastic",
    sub: "Electronics, CPG",
    icon: "📱",
  },
  {
    id: "organic",
    label: "Organic / Liquid",
    sub: "Supplements, Beverages, Oils",
    icon: "🌿",
  },
];

const WORLD_ANCHOR_OPTIONS = [
  {
    id: "liquid",
    label: "Liquid / Splash",
    sub: "Clean water, ink clouds, or thick silk-like fluids",
    icon: "💧",
  },
  {
    id: "void",
    label: "The Void",
    sub: "Infinite black/dark space with dramatic rim lighting",
    icon: "🌑",
  },
  {
    id: "natural",
    label: "Natural Macro",
    sub: "Moss-covered stone, volcanic sand, or morning dew",
    icon: "🌿",
  },
  {
    id: "cyber",
    label: "Digital / Cyber",
    sub: "Neon light trails, glitch artifacts, and laser arrays",
    icon: "⚡",
  },
];

const LIGHTING_OPTIONS = [
  {
    id: "noir",
    label: "Luxury Noir",
    sub: "High contrast, deep shadows, gold rim-lighting",
    icon: "🕯️",
  },
  {
    id: "highkey",
    label: "High-Key Studio",
    sub: "Bright, clean, minimal shadows, 'Apple' style",
    icon: "☀️",
  },
  {
    id: "prismatic",
    label: "Cinematic Prismatic",
    sub: "Rainbow light refractions and lens flares",
    icon: "🌈",
  },
];

const MOVEMENT_OPTIONS = [
  {
    id: "emergence",
    label: "The Emergence",
    sub: "Product rises slowly out of liquid or smoke",
    icon: "🌫️",
  },
  {
    id: "kinetic",
    label: "The Kinetic Burst",
    sub: "Product 'assembles' or particles explode around it in slow motion",
    icon: "💥",
  },
  {
    id: "drift",
    label: "The Macro Drift",
    sub: "Extreme close-up pan across textures ending on the logo",
    icon: "🔬",
  },
  {
    id: "orbital",
    label: "The Orbital",
    sub: "A smooth 360-degree rotation in a zero-gravity environment",
    icon: "🪐",
  },
];

const AURAL_OPTIONS = [
  "Dark Phonk / Industrial (Aggressive, heavy bass, high-energy)",
  "Premium Minimalist (Atmospheric pads, 'expensive' silence, subtle clicks)",
  "Nature Ambient (Water splashes, wind, organic textures)",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          width: "4px",
          height: "28px",
          background: "#5EF08A",
          borderRadius: "2px",
          flexShrink: 0,
        }}
      />
      <h2
        style={{
          color: "#EEF0F8",
          fontSize: "0.8rem",
          fontWeight: "800",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {label}
      </h2>
    </div>
  );
}

function FieldLabel({
  label,
  required,
  htmlFor,
}: { label: string; required?: boolean; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        color: "#9DA0B3",
        fontSize: "0.72rem",
        fontWeight: "700",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      {label}
      {required && (
        <span style={{ color: "#5EF08A", marginLeft: "4px" }}>*</span>
      )}
    </label>
  );
}

function TextInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "24px" }}>
      <FieldLabel label={label} required={required} htmlFor={id} />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "#0A0B14",
          border: focused ? "1px solid #5EF08A" : "1px solid #1C1F33",
          borderRadius: "12px",
          padding: "14px 16px",
          color: "#EEF0F8",
          fontSize: "0.95rem",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        data-ocid={`product-lab.input_${id}`}
      />
    </div>
  );
}

function SelectionCards({
  id,
  label,
  options,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  options: { id: string; label: string; sub: string; icon: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div
        style={{
          color: "#9DA0B3",
          fontSize: "0.72rem",
          fontWeight: "700",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          marginBottom: "10px",
        }}
        id={`label-${id}`}
      >
        {label}
        <span style={{ color: "#5EF08A", marginLeft: "4px" }}>*</span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`label-${id}`}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              style={{
                background: isSelected
                  ? "rgba(94,240,138,0.08)"
                  : "rgba(17,19,34,0.7)",
                border: isSelected
                  ? "1.5px solid #5EF08A"
                  : "1.5px solid #1C1F33",
                borderRadius: "14px",
                padding: "18px 16px",
                cursor: "pointer",
                textAlign: "left",
                transition:
                  "border-color 0.18s, background 0.18s, box-shadow 0.18s",
                boxShadow: isSelected
                  ? "0 0 18px rgba(94,240,138,0.12)"
                  : "none",
              }}
              data-ocid={`product-lab.card_${id}_${opt.id}`}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: "8px" }}>
                {opt.icon}
              </div>
              <div
                style={{
                  color: isSelected ? "#5EF08A" : "#EEF0F8",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  marginBottom: "4px",
                  transition: "color 0.18s",
                }}
              >
                {opt.label}
              </div>
              <div
                style={{
                  color: "#7A7D90",
                  fontSize: "0.78rem",
                  lineHeight: "1.4",
                }}
              >
                {opt.sub}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0",
        marginBottom: "40px",
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: done
                  ? "#5EF08A"
                  : active
                    ? "rgba(94,240,138,0.15)"
                    : "rgba(255,255,255,0.04)",
                border: active
                  ? "2px solid #5EF08A"
                  : done
                    ? "2px solid #5EF08A"
                    : "2px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: done ? "#0A0B14" : active ? "#5EF08A" : "#4A4D60",
                fontSize: "0.8rem",
                fontWeight: "800",
                flexShrink: 0,
                transition: "all 0.25s",
              }}
            >
              {done ? "✓" : step}
            </div>
            {i < total - 1 && (
              <div
                style={{
                  width: "48px",
                  height: "2px",
                  background: done ? "#5EF08A" : "rgba(255,255,255,0.07)",
                  transition: "background 0.25s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoBox({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "14px 16px",
        marginBottom: "24px",
      }}
    >
      <AlertCircle
        style={{ color: "#9DA0B3", flexShrink: 0, marginTop: "2px" }}
        size={16}
      />
      <p
        style={{
          color: "#9DA0B3",
          fontSize: "0.85rem",
          lineHeight: "1.55",
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const STEP_TITLES = [
  "PRODUCT IDENTITY LOCK (ASSETS)",
  "ENVIRONMENTAL 'HERO' ELEMENT",
  "THE 'HOOK' ACTION (PHYSICS TRIGGER)",
  "SOUND & FINAL OUTPUT",
];

export default function ProductLabBriefPage() {
  const search = useSearch({ from: "/product-lab-brief" }) as {
    tier?: string;
  };
  const tier = (search.tier ?? "flash") as "flash" | "starter" | "scale";

  const { actor } = useActor();

  // Step state
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [photoUrls, setPhotoUrls] = useState("");
  const [materialDefinition, setMaterialDefinition] = useState("");

  // Step 2 fields
  const [worldAnchor, setWorldAnchor] = useState("");
  const [lightingVibe, setLightingVibe] = useState("");

  // Step 3 fields
  const [movementStyle, setMovementStyle] = useState("");

  // Step 4 fields
  const [auralIdentity, setAuralIdentity] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Validation per step ───────────────────────────────────────────────────
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);

  const canNext: Record<number, boolean> = {
    1: photoUrls.trim().length > 0 && materialDefinition !== "",
    2: worldAnchor !== "" && lightingVibe !== "",
    3: movementStyle !== "",
    4:
      auralIdentity !== "" &&
      logoUrl.trim().length > 0 &&
      contactName.trim().length > 0 &&
      isEmailValid,
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!actor) {
      setSubmitError("Backend not ready. Please try again in a moment.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");

    const tierLabel =
      tier === "flash"
        ? "Flash ($399)"
        : tier === "starter"
          ? "Starter ($899/mo)"
          : "Scale ($1,249/mo)";

    const productName = TIER_PRODUCT_NAMES[tier] ?? "Flash";

    try {
      // Step 1: Save questionnaire to backend — await before any redirect
      const qaAnswers = JSON.stringify([
        { label: "Contact Name", value: contactName },
        { label: "Contact Email", value: contactEmail },
        { label: "Tier", value: tierLabel },
        { label: "Photo URLs", value: photoUrls },
        { label: "Material Definition", value: materialDefinition },
        { label: "World Anchor", value: worldAnchor },
        { label: "Lighting Vibe", value: lightingVibe },
        { label: "Movement Style", value: movementStyle },
        { label: "Aural Identity", value: auralIdentity },
        { label: "Logo URL", value: logoUrl },
      ]);

      await actor.submitQuestionnaire("ProductAds", qaAnswers);

      // Step 2: Register client record with the selected Product Ads service
      await actor.addClient(
        contactName,
        contactEmail,
        "",
        "Brief",
        [productName],
        null,
      );

      // Step 3: After successful backend save, redirect to the unified checkout
      window.location.href = "/checkout";
    } catch (err) {
      setSubmitError(
        `Submission failed: ${(err as Error).message ?? "Unknown error"}. Please try again.`,
      );
      setIsSubmitting(false);
    }
  };

  // ── Tier badge display ────────────────────────────────────────────────────
  const tierDisplay =
    tier === "flash"
      ? { label: "⚡ Flash", price: "$399 one-time" }
      : tier === "starter"
        ? { label: "🚀 Starter", price: "$899/month" }
        : { label: "📈 Scale", price: "$1,249/month" };

  // ── Inline styles ─────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    background: "rgba(17,19,34,0.72)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "48px 40px",
  };

  return (
    <div style={{ background: "#0A0B14", minHeight: "100vh" }}>
      <style>{`
        @keyframes gradientPulse {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50%  { transform: translate(-50%, -50%) scale(1.15); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
        }
      `}</style>

      <Navbar />
      <div style={{ height: "68px" }} aria-hidden="true" />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          width: "700px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(94,240,138,0.05) 0%, transparent 65%)",
          animation: "gradientPulse 8s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "860px",
          margin: "0 auto",
          padding: "60px 24px 100px",
        }}
      >
        {/* Page header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span
              style={{
                display: "inline-block",
                background: "rgba(94,240,138,0.1)",
                border: "1px solid rgba(94,240,138,0.3)",
                color: "#5EF08A",
                fontSize: "0.72rem",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "5px 16px",
                borderRadius: "9999px",
                marginBottom: "20px",
              }}
            >
              Product Lab — Director's Brief
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            style={{
              color: "#EEF0F8",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "900",
              letterSpacing: "-0.03em",
              lineHeight: "1.1",
              marginBottom: "12px",
            }}
          >
            Configure Your <span style={{ color: "#5EF08A" }}>Product Ad</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            style={{
              color: "#7A7D90",
              fontSize: "1rem",
              marginBottom: "20px",
            }}
          >
            Complete 4 steps and we'll handle the rest.
          </motion.p>

          {/* Tier badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(94,240,138,0.07)",
              border: "1px solid rgba(94,240,138,0.25)",
              borderRadius: "9999px",
              padding: "6px 18px",
            }}
          >
            <span
              style={{
                color: "#5EF08A",
                fontWeight: "700",
                fontSize: "0.88rem",
              }}
            >
              {tierDisplay.label}
            </span>
            <span
              style={{
                width: "1px",
                height: "14px",
                background: "rgba(94,240,138,0.25)",
              }}
            />
            <span style={{ color: "#9DA0B3", fontSize: "0.82rem" }}>
              {tierDisplay.price}
            </span>
          </motion.div>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} total={4} />

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── Step 1 ── */}
            {step === 1 && (
              <div style={panelStyle}>
                <SectionHeader label={STEP_TITLES[0]} />

                <InfoBox text="Please upload 3-5 high-resolution photos of your product. Ensure one is a direct front-facing 'Beauty Shot' on a plain background." />

                <TextInput
                  id="photo_urls"
                  label="Photo URLs (@IMAGE1)"
                  placeholder="Paste comma-separated image URLs (Google Drive, Dropbox, etc.)"
                  value={photoUrls}
                  onChange={setPhotoUrls}
                  required
                />

                <SelectionCards
                  id="material"
                  label="Material Definition"
                  options={MATERIAL_OPTIONS}
                  selected={materialDefinition}
                  onSelect={setMaterialDefinition}
                />
              </div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <div style={panelStyle}>
                <SectionHeader label={STEP_TITLES[1]} />

                <SelectionCards
                  id="world_anchor"
                  label="The World Anchor (@IMAGE2)"
                  options={WORLD_ANCHOR_OPTIONS}
                  selected={worldAnchor}
                  onSelect={setWorldAnchor}
                />

                <SelectionCards
                  id="lighting"
                  label="Lighting Vibe"
                  options={LIGHTING_OPTIONS}
                  selected={lightingVibe}
                  onSelect={setLightingVibe}
                />
              </div>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <div style={panelStyle}>
                <SectionHeader label={STEP_TITLES[2]} />

                <InfoBox text="Movement Style (15-second duration)" />

                <SelectionCards
                  id="movement"
                  label="Movement Style"
                  options={MOVEMENT_OPTIONS}
                  selected={movementStyle}
                  onSelect={setMovementStyle}
                />
              </div>
            )}

            {/* ── Step 4 ── */}
            {step === 4 && (
              <div style={panelStyle}>
                <SectionHeader label={STEP_TITLES[3]} />

                {/* Contact capture */}
                <div
                  style={{
                    background: "rgba(94,240,138,0.04)",
                    border: "1px solid rgba(94,240,138,0.12)",
                    borderRadius: "16px",
                    padding: "24px",
                    marginBottom: "32px",
                  }}
                >
                  <p
                    style={{
                      color: "#5EF08A",
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: "20px",
                    }}
                  >
                    Your Contact Details
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <TextInput
                      id="contact_name"
                      label="Full Name"
                      placeholder="Jane Smith"
                      value={contactName}
                      onChange={setContactName}
                      required
                    />
                    <TextInput
                      id="contact_email"
                      label="Email Address"
                      placeholder="jane@brand.com"
                      value={contactEmail}
                      onChange={setContactEmail}
                      required
                    />
                  </div>
                </div>

                {/* Aural identity */}
                <div style={{ marginBottom: "28px" }}>
                  <FieldLabel label="Aural Identity" required />
                  <div style={{ position: "relative" }}>
                    <select
                      value={auralIdentity}
                      onChange={(e) => setAuralIdentity(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#0A0B14",
                        border: "1px solid #1C1F33",
                        borderRadius: "12px",
                        padding: "14px 16px",
                        color: auralIdentity ? "#EEF0F8" : "#4A4D60",
                        fontSize: "0.95rem",
                        outline: "none",
                        appearance: "none",
                        cursor: "pointer",
                      }}
                      data-ocid="product-lab.select_aural"
                    >
                      <option value="">Select your sound direction...</option>
                      {AURAL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Logo URL */}
                <InfoBox text="Upload your high-res logo file (PNG/SVG). We will generate a 2-second branded end-card." />

                <TextInput
                  id="logo_url"
                  label="High-Res Logo URL"
                  placeholder="Paste your logo URL (Google Drive, Dropbox, etc.)"
                  value={logoUrl}
                  onChange={setLogoUrl}
                  required
                />

                {/* Error message */}
                {submitError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      marginTop: "8px",
                    }}
                  >
                    <AlertCircle
                      size={16}
                      style={{ color: "#F87171", flexShrink: 0 }}
                    />
                    <p
                      style={{
                        color: "#F87171",
                        fontSize: "0.85rem",
                        margin: 0,
                      }}
                    >
                      {submitError}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Nav buttons ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "28px",
            gap: "16px",
          }}
        >
          {/* Back */}
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "12px 24px",
              color: step === 1 ? "#2A2D40" : "#9DA0B3",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: step === 1 ? "not-allowed" : "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
            data-ocid="product-lab.nav_back"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {/* Step counter */}
          <span
            style={{
              color: "#4A4D60",
              fontSize: "0.8rem",
              fontWeight: "600",
              letterSpacing: "0.06em",
            }}
          >
            STEP {step} / 4
          </span>

          {/* Next / Submit */}
          {step < 4 ? (
            <motion.button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canNext[step]}
              whileHover={canNext[step] ? { scale: 1.02 } : {}}
              whileTap={canNext[step] ? { scale: 0.98 } : {}}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: canNext[step] ? "#5EF08A" : "rgba(94,240,138,0.1)",
                border: "none",
                borderRadius: "12px",
                padding: "12px 28px",
                color: canNext[step] ? "#0A0B14" : "#2A4D35",
                fontSize: "0.9rem",
                fontWeight: "700",
                cursor: canNext[step] ? "pointer" : "not-allowed",
                transition: "background 0.18s, color 0.18s",
                boxShadow: canNext[step]
                  ? "0 0 20px rgba(94,240,138,0.25)"
                  : "none",
              }}
              data-ocid="product-lab.nav_next"
            >
              Next
              <ChevronRight size={16} />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!canNext[4] || isSubmitting}
              whileHover={canNext[4] && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={canNext[4] && !isSubmitting ? { scale: 0.98 } : {}}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background:
                  canNext[4] && !isSubmitting
                    ? "#5EF08A"
                    : "rgba(94,240,138,0.1)",
                border: "none",
                borderRadius: "12px",
                padding: "13px 32px",
                color: canNext[4] && !isSubmitting ? "#0A0B14" : "#2A4D35",
                fontSize: "0.95rem",
                fontWeight: "700",
                cursor: canNext[4] && !isSubmitting ? "pointer" : "not-allowed",
                transition: "background 0.18s, color 0.18s",
                boxShadow:
                  canNext[4] && !isSubmitting
                    ? "0 0 28px rgba(94,240,138,0.35)"
                    : "none",
              }}
              data-ocid="product-lab.submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Director's Brief
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Required fields hint */}
        {!canNext[step] && (
          <p
            style={{
              textAlign: "center",
              color: "#4A4D60",
              fontSize: "0.78rem",
              marginTop: "12px",
            }}
          >
            Complete all required fields to continue
          </p>
        )}
      </main>

      <Footer />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
