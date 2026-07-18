---
name: Kinetic Grid
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e0e3e5'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e0e3e5'
  inverse-on-surface: '#2d3133'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#c6c6ca'
  on-secondary: '#2f3034'
  secondary-container: '#4a4b4f'
  on-secondary-container: '#bbbbbf'
  tertiary: '#ffffff'
  on-tertiary: '#003731'
  tertiary-container: '#62fae3'
  on-tertiary-container: '#007165'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#e2e2e6'
  secondary-fixed-dim: '#c6c6ca'
  on-secondary-fixed: '#1a1c1f'
  on-secondary-fixed-variant: '#45474a'
  tertiary-fixed: '#62fae3'
  tertiary-fixed-dim: '#3cddc7'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005047'
  background: '#101415'
  on-background: '#e0e3e5'
  surface-variant: '#323537'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 48px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for high-performance fitness environments, blending the urgency of competitive athletics with the connectivity of social platforms. The aesthetic is **Modern-Energetic**, characterized by high-contrast interfaces that prioritize speed of information and motivational triggers. 

The visual narrative draws from **Glassmorphism** for data overlays and **Minimalism** for content density management. The interface should feel like a high-end digital cockpit—precise, responsive, and empowering. By utilizing deep backgrounds punctuated by vibrant action colors, the design system ensures that critical performance metrics and community interactions remain the focal point of the user experience.

## Colors

This design system utilizes a dark-mode first approach to reduce eye strain during high-intensity workouts and to make the "Electric Lime" primary color vibrate against the interface.

- **Primary (Electric Lime):** Used exclusively for high-priority calls to action, active states, and progress indicators. It represents energy and movement.
- **Secondary (Charcoal/Slate):** The foundational surface color. Use varying shades of slate (#1E293B for cards, #121417 for backgrounds) to create depth.
- **Tertiary (Soft Teal):** Reserved for health metrics (heart rate, pace, recovery) and data visualization to provide a calming contrast to the primary energy.
- **Neutral:** Pure whites and light grays are used for primary legibility and secondary labels.

## Typography

The typography strategy focuses on "Scale and Impact." Headlines use **Montserrat** in extra-bold weights to convey a "sport-performance" editorial feel. Letter spacing is tightened on large headlines to create a more aggressive, compact look.

**Inter** handles all functional data and body text. Its neutral, systematic nature ensures that complex fitness stats remain legible at a glance during physical activity. Labels should utilize uppercase styling with increased tracking to differentiate functional UI metadata from narrative content.

## Layout & Spacing

The design system follows an **8px grid system** to maintain mathematical harmony. The layout is a **fluid grid** that adapts to the fast-paced nature of mobile usage.

- **Mobile:** 4-column layout with 20px side margins. Cards usually span the full width to maximize hit areas for sweaty fingers.
- **Desktop/Tablet:** 12-column layout. Content is often organized into a multi-pane dashboard where the map/activity view takes 8 columns and the community/stats feed takes 4 columns.
- **Rhythm:** Use generous vertical spacing (`lg` or `xl`) between distinct sections to prevent the UI from feeling cluttered, while using tight spacing (`xs` or `sm`) within data groups to show relationships.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Glassmorphism**. 

1. **Base Layer:** Deepest slate (#121417) for the main application background.
2. **Content Layer:** Slightly lighter slate (#1E293B) for primary cards and list items.
3. **Overlay Layer (Glass):** For floating maps, active session controls, and navigation bars. Use a background blur of 12px-20px and a 10% white opacity fill to create a frosted lens effect.
4. **Shadows:** Use large, ultra-soft shadows (e.g., `0px 20px 40px rgba(0,0,0,0.4)`) for floating elements to give the impression of airiness and speed.

## Shapes

The shape language is dominated by **large, friendly radii**. This softens the high-contrast color palette and makes the app feel approachable rather than intimidating.

- **Standard Buttons & Inputs:** 0.5rem (8px) for a modern, balanced look.
- **Cards & Dashboard Tiles:** 1rem (16px) for the `rounded-lg` token.
- **Floating Action Buttons (FABs) & Tags:** 1.5rem (24px) or full pill-shape to distinguish them from structural content.
- **Map Markers:** Utilize a "teardrop" pill shape with high-radius corners to maintain the language.

## Components

- **Broadcast Buttons:** These are the primary CTAs (e.g., "Start Workout"). Use the Primary Electric Lime color with a slight outer glow (2px blur) to simulate energy. Text should be Montserrat Bold, Uppercase.
- **Route Feed Cards:** Use a 16px corner radius. Background should be #1E293B. Include a subtle 1px border (#FFFFFF 5% opacity) to define the edge against the dark background. Data points (miles, time, elevation) should be grouped in the bottom footer of the card using the Soft Teal color.
- **Interactive Toggles:** Large, tactile switches. When "on," the track should be Electric Lime; when "off," it should blend into the dark background with a clear outline.
- **Map Markers:** High-contrast Teal or Lime icons on a circular glass background. Use an "active ripple" animation (pulsing ring) for live location or ongoing events.
- **Progress Bars:** Thin, sleek lines. The background track should be a dark neutral, and the progress fill should be a gradient from Soft Teal to Electric Lime to indicate "gaining intensity."