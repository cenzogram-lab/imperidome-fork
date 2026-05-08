import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Arial", "sans-serif"],
        display: ["Plus Jakarta Sans", "Arial", "sans-serif"],
      },
      colors: {
        navy: "oklch(var(--navy))",
        "accent-blue": "oklch(var(--accent-blue))",
        "success-green": "oklch(var(--success-green))",
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        nav: "0 1px 0 0 oklch(0.91 0 0), 0 2px 8px 0 rgba(27,45,79,0.08)",
        /* Neon glow shadow scale */
        "neon-sm":
          "0 0 2px #39FF14, 0 0 6px rgba(57,255,20,0.6), 0 0 15px rgba(57,255,20,0.3)",
        "neon-md":
          "0 0 2px #39FF14, 0 0 8px #39FF14, 0 0 25px rgba(57,255,20,0.7), 0 0 60px rgba(57,255,20,0.35), 0 0 100px rgba(57,255,20,0.15)",
        "neon-lg":
          "0 0 2px #39FF14, 0 0 6px #39FF14, 0 0 20px rgba(57,255,20,0.8), 0 0 50px rgba(57,255,20,0.5), 0 0 100px rgba(57,255,20,0.3)",
        "neon-xl":
          "0 0 2px #39FF14, 0 0 6px #39FF14, 0 0 20px rgba(57,255,20,0.8), 0 0 50px rgba(57,255,20,0.5), 0 0 100px rgba(57,255,20,0.3), 0 0 60px rgba(57,255,20,0.15)",
        /* Deep glass card shadow */
        glass:
          "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.4), 0 10px 30px rgba(0,0,0,0.6), 0 30px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(57,255,20,0.08)",
      },
      dropShadow: {
        "neon-sm": ["0 0 2px #39FF14", "0 0 6px rgba(57,255,20,0.6)"],
        "neon-md": ["0 0 4px #39FF14", "0 0 12px rgba(57,255,20,0.7)"],
        "neon-lg": ["0 0 6px #39FF14", "0 0 20px rgba(57,255,20,0.8)"],
        "neon-xl": [
          "0 0 6px #39FF14",
          "0 0 20px rgba(57,255,20,0.8)",
          "0 0 50px rgba(57,255,20,0.5)",
        ],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        /* New: neon glow oscillation */
        "neon-pulse": {
          "0%": {
            boxShadow:
              "0 0 2px #39FF14, 0 0 6px rgba(57,255,20,0.7), 0 0 18px rgba(57,255,20,0.45), 0 0 45px rgba(57,255,20,0.3), 0 0 90px rgba(57,255,20,0.15)",
          },
          "100%": {
            boxShadow:
              "0 0 2px #39FF14, 0 0 6px #39FF14, 0 0 20px rgba(57,255,20,0.8), 0 0 50px rgba(57,255,20,0.5), 0 0 100px rgba(57,255,20,0.3), 0 0 60px rgba(57,255,20,0.15)",
          },
        },
        /* New: diagonal shine sweep */
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        /* New: film grain texture shift */
        "grain-shift": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-2%, -3%)" },
          "20%": { transform: "translate(3%, 2%)" },
          "30%": { transform: "translate(-1%, 4%)" },
          "40%": { transform: "translate(2%, -2%)" },
          "50%": { transform: "translate(-3%, 1%)" },
          "60%": { transform: "translate(1%, -4%)" },
          "70%": { transform: "translate(-2%, 3%)" },
          "80%": { transform: "translate(3%, -1%)" },
          "90%": { transform: "translate(-1%, 2%)" },
        },
        /* New: chromatic aberration */
        chromatic: {
          "0%": {
            textShadow:
              "-1px 0 rgba(255,0,0,0.3), 1px 0 rgba(0,0,255,0.3)",
          },
          "50%": {
            textShadow:
              "1px 0 rgba(255,0,0,0.3), -1px 0 rgba(0,0,255,0.3)",
          },
          "100%": {
            textShadow:
              "-1px 0 rgba(255,0,0,0.3), 1px 0 rgba(0,0,255,0.3)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out forwards",
        "slide-out": "slide-out 0.3s ease-in forwards",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-up-delay-1": "fade-up 0.6s 0.15s ease-out both",
        "fade-up-delay-2": "fade-up 0.6s 0.3s ease-out both",
        "fade-up-delay-3": "fade-up 0.6s 0.45s ease-out both",
        /* New utilities */
        shimmer: "shimmer 3s ease-in-out infinite",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite alternate",
        "grain-shift": "grain-shift 0.5s steps(1) infinite",
        chromatic: "chromatic 0.3s ease-in-out",
      },
    },
  },
  plugins: [
    typography,
    containerQueries,
    animate,
    /* Enforce pure white as the global text color baseline for all public pages.
       Admin routes override this via their own scoped styles. */
    plugin(function ({ addBase }) {
      addBase({
        "*": { color: "#ffffff" },
        "body, p, span, li, td, th, label": { color: "#ffffff" },
        "h1, h2, h3, h4, h5, h6": {
          color: "#ffffff",
          "-webkit-text-fill-color": "#ffffff",
        },
        "a": { color: "inherit" },
        "button, input, textarea, select": {
          color: "#ffffff",
          fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
        },
      });
    }),
  ],
};
