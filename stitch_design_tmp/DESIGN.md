---
name: Executive Command Dark
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bacac5'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#859490'
  outline-variant: '#3c4a46'
  surface-tint: '#3cddc7'
  primary: '#57f1db'
  on-primary: '#003731'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#006b5f'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#39485a'
  on-secondary-container: '#a7b6cc'
  tertiary: '#cfdaf2'
  on-tertiary: '#263143'
  tertiary-container: '#b3bed5'
  on-tertiary-container: '#424d61'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#d4e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0d1c2d'
  on-secondary-fixed-variant: '#39485a'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for high-stakes decision-making and mission-critical data visualization. The personality is disciplined, authoritative, and sophisticated, catering to executives and operators who require clarity under pressure. 

The aesthetic blends **Modern Corporate** precision with a **High-Contrast** functional edge. It avoids the visual noise of neon or "gamer" aesthetics, instead opting for a sober, technical atmosphere that feels like a modern command center. The UI prioritizes information density without sacrificing legibility, using structural layering and subtle tonal shifts to guide the user's focus.

## Colors
The palette is rooted in a deep navy foundation (`#0f172a`) to reduce eye strain and provide a premium, grounded feel. Surface depth is managed through a hierarchy of blue-gray and slate tones rather than shadows.

- **Primary:** A refined teal/cyan, adjusted to provide a "glow" effect against dark backgrounds without being overly vibrant.
- **Secondary:** A cool, muted slate used for iconography and supporting elements.
- **Neutrals:** Range from deep charcoal to soft whites, ensuring text contrast remains AAA compliant.
- **Semantics:** Success, warning, and danger colors are desaturated slightly to prevent "vibrating" against the dark background while maintaining clear signaling intent.

## Typography
Typography is split into three distinct functional roles:
1.  **Headlines (Manrope):** Modern, balanced, and authoritative. Used for titles and high-level navigation.
2.  **Body (Hanken Grotesk):** Sharp and contemporary, optimized for long-form reading and interface labels.
3.  **Data (JetBrains Mono):** A monospaced font specifically for numeric values, status codes, and technical metrics to ensure perfect tabular alignment and a "command center" feel.

Primary text uses a soft off-white to prevent the harsh contrast of pure white on dark backgrounds, while secondary text utilizes cool gray to create clear information hierarchy.

## Layout & Spacing
This design system utilizes a rigid 4px baseline grid to maintain a disciplined, mathematical layout. 

- **Grid:** A 12-column fluid grid for desktop, transitioning to a 4-column grid for mobile. 
- **Margins:** Desktop containers utilize a 24px internal margin to allow content to breathe against the dark background.
- **Density:** Elements are packed with technical precision—tighter vertical spacing for data rows and generous spacing for dashboard sections.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines**. In this dark environment, light does not behave naturally; instead, "elevation" is signaled by surfaces becoming lighter as they move closer to the user.

- **Level 0 (Background):** `#0f172a` (Base canvas)
- **Level 1 (Panels):** `#1e293b` (Primary containers)
- **Level 2 (Modals/Popovers):** `#334155` (Highest elevation)
- **Borders:** Instead of heavy shadows, use a 1px solid border of `#334155` for cards and components to define edges clearly against the dark background.

## Shapes
The design system employs a **Soft** (Level 1) roundedness. 
- **Standard elements (Buttons, Inputs):** 4px (0.25rem) radius for a disciplined, sharp look.
- **Large containers (Cards, Modals):** 8px (0.5rem) radius to soften the technical edge slightly.
- **Interactive States:** Active states are indicated by sharp, high-contrast borders rather than large changes in shape or heavy roundedness.

## Components
- **Buttons:** Primary buttons use a solid Teal fill with black text for maximum punch. Secondary buttons are "Ghost" style with a `#334155` border and Slate text.
- **Inputs:** Darker than the panel color with a 1px Slate border. On focus, the border transitions to Teal with a subtle glow (0px 0px 8px).
- **Cards:** Use Level 1 Tonal Layering with no shadows. A subtle top-border (2px) of Teal can be used to denote "active" or "featured" modules.
- **Data Tables:** Zebra-striping is achieved with subtle opacity shifts (`rgba(255, 255, 255, 0.02)`). Headers use the `label-sm` typography role in Slate.
- **Chips/Badges:** Small, rectangular with a 2px radius. Semantic colors are applied as 10% opacity backgrounds with 100% opacity text for a "tinted" indicator effect.
- **Progress Bars:** Thin, 4px height lines. The track is `#1e293b` and the fill is Teal or a semantic color.