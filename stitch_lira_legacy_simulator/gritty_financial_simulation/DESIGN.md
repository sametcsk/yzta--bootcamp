---
name: Gritty Financial Simulation
colors:
  surface: '#16130b'
  surface-dim: '#16130b'
  surface-bright: '#3d392f'
  surface-container-lowest: '#110e06'
  surface-container-low: '#1f1b12'
  surface-container: '#231f16'
  surface-container-high: '#2e2a20'
  surface-container-highest: '#39342a'
  on-surface: '#eae1d3'
  on-surface-variant: '#d1c5ae'
  inverse-surface: '#eae1d3'
  inverse-on-surface: '#343026'
  outline: '#9a907b'
  outline-variant: '#4e4634'
  surface-tint: '#eec13c'
  primary: '#ffe7af'
  on-primary: '#3d2e00'
  primary-container: '#f5c842'
  on-primary-container: '#6c5400'
  inverse-primary: '#755b00'
  secondary: '#c6c6ca'
  on-secondary: '#2f3034'
  secondary-container: '#4a4b4f'
  on-secondary-container: '#bbbbc0'
  tertiary: '#e8e9f0'
  on-tertiary: '#2e3136'
  tertiary-container: '#cbcdd3'
  on-tertiary-container: '#54575c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe08f'
  primary-fixed-dim: '#eec13c'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#e2e2e6'
  secondary-fixed-dim: '#c6c6ca'
  on-secondary-fixed: '#1a1c1f'
  on-secondary-fixed-variant: '#45474a'
  tertiary-fixed: '#e1e2e9'
  tertiary-fixed-dim: '#c4c6cd'
  on-tertiary-fixed: '#191c20'
  on-tertiary-fixed-variant: '#44474c'
  background: '#16130b'
  on-background: '#eae1d3'
  surface-variant: '#39342a'
typography:
  display-age:
    fontFamily: Archivo Narrow
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Archivo Narrow
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Archivo Narrow
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Archivo Narrow
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Archivo Narrow
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1'
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is built on a narrative-driven, high-stakes financial simulation aesthetic tailored for the volatile Turkish economic landscape. The personality is gritty, urgent, and clinical, moving away from the "friendly" nature of modern fintech toward a "terminal-operator" vibe.

The design style is a hybrid of **Digital Brutalism** and **Modern Noir**. It utilizes heavy blacks, high-contrast accents, and sharp edges to evoke the feeling of a high-pressure trading floor or a private ledger. Visual interest is generated through subtle grain textures and dramatic shadows rather than gradients or transparency. The interface should feel like a serious tool where every decision has an immediate, visceral impact on the user's digital life.

## Colors
This design system operates on a deep dark-mode foundation to maintain a moody, focused atmosphere.

- **Primary (#f5c842):** Used exclusively for interactive elements, key CTAs, and critical financial indicators. It represents opportunity and wealth.
- **Background (#0d0f12):** A deep charcoal that provides the "canvas." It should be applied to the body and large layout containers.
- **Surface (#2a2d32):** Used for cards and secondary UI elements to create subtle depth against the background.
- **Status Colors:** Functional green and red are used sparingly for profit/loss tickers, ensuring they pop against the monochromatic base.

## Typography
The typography strategy creates a stark contrast between narrative content and financial data. 

**Archivo Narrow** provides a condensed, authoritative feel for headings and narrative text, allowing for more content in tight spaces. **JetBrains Mono** is used for all "machine-read" data, including currency values, exchange rates, and timestamps, reinforcing the simulation/terminal theme.

All headlines should favor a tight letter-spacing. Data labels should use monospace fonts to ensure that changing numerical values do not cause visual layout shifts (tabular figures).

## Layout & Spacing
The layout follows a strict, structured grid system. It utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

Spacing is based on a **4px baseline shift**, ensuring all elements align to a rigid rhythmic structure. Components should feel "packed" but organized, utilizing generous vertical margins between distinct narrative blocks (Events) to allow the eye to rest. Border-boxing is preferred over large padding to keep the "Brutalist" feel intact.

## Elevation & Depth
Depth is not achieved through light and airy shadows, but through **dramatic, high-opacity offsets** and **tonal layering**.

- **Level 1 (Surface):** The base background (#0d0f12).
- **Level 2 (Containers):** Cards use a slightly lighter fill (#2a2d32) with a 1px solid border (#3f434a).
- **Shadows:** Use "Hard Shadows"—no blur, 4px offset in X and Y, colored black or a darker tint of the background.
- **Texture:** A subtle noise overlay (3-5% opacity) should be applied to the entire viewport to give the UI a tactile, cinematic grain.

## Shapes
The shape language is disciplined and geometric. While the system leans toward Brutalism, a minor **4px to 8px radius** is applied to primary cards and buttons to ensure the UI remains legible and touch-friendly on mobile devices. 

Interactive elements like input fields and utility buttons should stay at the 4px range, while larger narrative "Event Cards" can utilize the 8px radius. Decorative elements and indicators (like status pips) remain strictly sharp (0px).

## Components

- **Action Buttons:** Background is #f5c842, text is #0d0f12 (bold, uppercase). Use a hard black shadow (4px offset). On press, the button shifts 2px down and right to simulate physical movement.
- **Event Cards:** Narratives are housed in cards with a #2a2d32 background and a thin 1px border. The header of the card should use the `headline-md` style.
- **Financial Tickers:** A horizontal bar at the top or bottom of the screen. Labels use `data-sm` with a secondary color; values use `data-lg` with the primary yellow or status colors.
- **Age Indicator:** A large, persistent display-style number (e.g., "Age: 24"). This is the anchor of the UI, positioned usually in the top-left or centered.
- **Input Fields:** Dark background (#0d0f12), 1px solid border (#f5c842 when focused). Use `jetbrainsMono` for user entry to maintain the data-entry feel.
- **Lists:** Clean rows with 1px bottom borders. No chevrons; use bold text or color shifts to indicate interactivity.