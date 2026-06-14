# Design Brief

## Overview
Imperidome is a dual-aesthetic platform: a clean professional web agency wrapper (neutral entry point) that transitions to a dark matrix/neon-green immersive experience (core platform). This brief documents both layers.

## Wrapper Layer — Neutral Web Agency Aesthetic
Tone: Professional, trustworthy, approachable. First impression optimized for enterprise decision-makers.
Differentiation: Clean white/gray palette signals legitimacy before the reveal moment ("Enter the Matrix").
Colors: Pure white background (#ffffff), near-black text (#1a1a1a), neutral grays (#666666 secondary, #e0e0e0 borders), dark gray CTA (#333333).
Typography: General Sans (display, bold headlines); Plus Jakarta Sans (body, clean copy).
Elevation: Subtle gray shadows on floating widgets; no neon glow.
Spacing: Generous whitespace; card-based layout for clarity.

## Core Platform Layer — Dark Matrix Aesthetic
Tone: High-tech, immersive, cutting-edge. Neon glow, circuit board patterns, digital energy.
Differentiation: Hyper-realistic 3D visuals, neon glow animations, glitch effects, film grain, chromatic aberration.
Colors: Near-black background (#0a0a0a), neon green accents (#39ff14 / #5ef08a), white text (#ffffff).
Typography: Plus Jakarta Sans (enforced globally); Courier New for matrix elements (monospace terminal feel).
Elevation: Multi-layer box-shadows with neon glow; glass-morphism cards with inset bevels; 3D card-lift on hover.
Shape Language: 12px–24px rounded corners; 40px backdrop blur on cards; sharp 90-degree geometry in hero 3D dome.
Animations: Neon pulse (2s), film grain (0.5s steps), shine sweep (4s), card-lift spring (300ms cubic-bezier).
Signature Detail: Rotating 3D dome with matrix plant sprout inside (green leaves + circuit traces + binary rain).

## Palette
| Layer | Element | OKLCH Value | Hex |
|-------|---------|-------------|-----|
| Wrapper | Background | 0.99 0 0 | #ffffff |
| Wrapper | Primary Text | 0.21 0 0 | #1a1a1a |
| Wrapper | Secondary Text | 0.4 0 0 | #666666 |
| Wrapper | Border/Divider | 0.92 0 0 | #e0e0e0 |
| Wrapper | CTA Button | 0.25 0 0 | #333333 |
| Core | Background | — | #0a0a0a |
| Core | Primary Text | 0.99 0 0 | #ffffff |
| Core | Neon Green | 0.83 0.14 142 | #39ff14 |

## Structural Zones
| Zone | Wrapper | Core Platform |
|------|---------|---------------|
| Header | None (focused landing) | Sticky nav with neon glow border |
| Hero | White bg, centered headline "Infrastructure for Sovereign Business" | 3D rotating dome with neon glow, typewriter text |
| Cards | White bg, gray borders, subtle shadows | Dark translucent (rgba 10,10,10,0.75) + blur, neon glow |
| Footer | None (single-page wrapper) | Sticky footer, dark bg, neon divider |
| Widgets | White bg cards, bottom-left (floating) | Persists across both layers |

## Typography Scale
Display: General Sans Bold 48px (wrapper), 36px (core hero)
Heading 1: 32px bold white (core)
Heading 2: 24px semibold
Body: 16px Plus Jakarta Sans (all pages)
Label: 12px uppercase monospace (matrix)
Mono: Courier New 13px (terminal)

## Motion
Wrapper: Fade-in on load, subtle hover color shift.
Core: Neon pulse (2s), film grain (0.5s steps), shine sweep (4s), card-lift (300ms spring).
Transition: Full-page glitch effect white→neon; chromatic shift; 600ms duration.

## Constraints
- No hardcoded colors; all use CSS custom properties (wrapper + core tokens separate).
- Wrapper does not override existing dark tokens (CSS variable namespacing).
- Matrix plant sprout maintains 3D perspective and rotation sync.
- Floating widgets persist across wrapper and core transition.
- Motoko crypto library gap: HMAC-SHA256 TODO; mitigated by 300s timestamp + shared secret.
- Fonts: General Sans + Plus Jakarta Sans only.

## Signature Detail
Wrapper: Horizontal divider (#e0e0e0) separating hero from CTA.
Core: 3D rotating dome with matrix plant sprout (neon leaves, circuit traces, binary rain).
