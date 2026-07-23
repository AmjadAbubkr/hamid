---
name: Diplomatic Excellence
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#44474d'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#4f5f7b'
  primary: '#04162e'
  on-primary: '#ffffff'
  primary-container: '#1a2b44'
  on-primary-container: '#8292b0'
  inverse-primary: '#b6c7e7'
  secondary: '#7b5800'
  on-secondary: '#ffffff'
  secondary-container: '#fdc34d'
  on-secondary-container: '#715000'
  tertiary: '#13171a'
  on-tertiary: '#ffffff'
  tertiary-container: '#282b2e'
  on-tertiary-container: '#8f9296'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#b6c7e7'
  on-primary-fixed: '#091c34'
  on-primary-fixed-variant: '#374762'
  secondary-fixed: '#ffdea6'
  secondary-fixed-dim: '#f7bd48'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#e0e2e6'
  tertiary-fixed-dim: '#c4c7ca'
  on-tertiary-fixed: '#191c1f'
  on-tertiary-fixed-variant: '#44474a'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 2rem
  margin-desktop: 4rem
  margin-mobile: 1.5rem
  stack-lg: 4rem
  stack-md: 2rem
  stack-sm: 1rem
---

## Brand & Style
The design system is engineered for high-level political and diplomatic communication. It projects an aura of **stature, heritage, and modern statesmanship**. The visual narrative balances the gravitas of tradition with the efficiency of modern governance.

The style is a synthesis of **Minimalism** and **Classical Editorial**. It utilizes expansive whitespace to denote transparency and calm, while employing high-contrast accents to signify authority. The system is built from the ground up for **bi-directional fluidity**, ensuring that the prestige of the visual language remains intact whether rendered in LTR (French) or RTL (Arabic).

## Colors
The palette is rooted in the "Grand Tradition" of diplomatic service. 

- **Primary (Deep Navy):** Used for primary navigation, headers, and heavy structural elements. It conveys stability and intellectual depth.
- **Secondary (Rich Gold):** Reserved for interactive accents, subtle borders on high-priority items, and prestigious iconography. It should be used sparingly to maintain its impact.
- **Surface & Backgrounds:** The system relies on a spectrum of soft grays and pure whites to provide a "canvas" for information, preventing the dark navy from feeling oppressive.
- **Semantic Colors:** Success, warning, and error states should be muted and integrated with navy tones (e.g., a deep forest green or a burnt crimson) to maintain the sophisticated atmosphere.

## Typography
The typography strategy employs a "West-meets-East" editorial approach. 

- **Headlines:** **Libre Caslon Text** is used for its timeless, authoritative serif structure. For Arabic counterparts, utilize a high-contrast Naskh-style calligraphic face that matches the x-height and visual weight of Caslon.
- **Body & Interface:** **Source Sans 3** provides a neutral, highly legible contrast to the decorative headings. It ensures that complex diplomatic communiqués remain accessible.
- **Language Toggles:** Always render language names in their native script (e.g., "Français" / "العربية") using the `label-caps` style for clarity.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to maintain a formal, structured appearance, transitioning to a fluid model on mobile devices.

- **Rhythm:** Use a strict 8px base grid. Generous vertical spacing (`stack-lg`) is encouraged between major sections to evoke a sense of "unhurried authority."
- **Bi-Directional Logic:** Layouts must mirror perfectly. Elements positioned on the right in French (e.g., a profile image in a hero section) must shift to the left in Arabic. 
- **Alignment:** Headlines are generally flush-left (LTR) or flush-right (RTL). Long-form body text should never be justified; use "ragged right" for French and "ragged left" for Arabic to ensure optimal readability.

## Elevation & Depth
In this design system, depth is used to indicate "officialdom" and priority.

- **Surface Tiers:** Use **Tonal Layers** rather than heavy shadows. A secondary surface might be a subtle light gray (`#F3F4F6`) against a white background.
- **Shadows:** When necessary for cards or modals, use **Ambient Shadows**. These are ultra-diffused (30px - 40px blur), low-opacity (5-8%), and slightly tinted with the Primary Navy to avoid a "dirty" gray look.
- **Dividers:** Use hairline strokes (1px) in `tertiary_color_hex` to separate content without creating visual noise.

## Shapes
The shape language is **Soft (0.25rem)**. 

While the aesthetic is rooted in traditionalism, sharp corners (0px) are avoided to ensure the politician appears "accessible." However, high roundedness (Pill-shaped) is also avoided to prevent the UI from appearing too casual or "app-like." A subtle radius provides a modern, sophisticated finish to containers, buttons, and input fields.

## Components
- **Formal Cards:** White background, 1px border in soft gray, and a 2px top-accent border in Gold (`secondary_color_hex`). Used for policy statements and official news.
- **Diplomatic Buttons:**
    - *Primary:* Solid Navy background with white text. No icons unless they are directional (arrows).
    - *Secondary:* Ghost style with Navy text and a Gold 1px border.
- **Timelines:** A vertical 2px Navy line with Gold nodes. In RTL, the line and text labels must flip positions horizontally.
- **Language Toggle:** A prominent, high-contrast switch located in the top-right (LTR) or top-left (RTL) of the global navigation.
- **Input Fields:** Minimalist design with only a bottom border that thickens and changes to Gold on focus.
- **Quotes/Statements:** Large-scale serif text with a Gold-colored vertical bar (5px) on the leading edge (Left for French, Right for Arabic).