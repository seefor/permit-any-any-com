# Design System Strategy: The Technical Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Precision Curator."** 

In the realm of network automation, clarity is paramount, but sophistication is what builds authority. This system moves away from the "standard tech blog" template by treating information as a high-end editorial experience. We eschew rigid lines and crowded grids in favor of **intentional asymmetry** and **tonal depth**. By utilizing generous whitespace and overlapping technical elements, we create a sense of organized complexity—mimicking the layers of a well-architected network.

## 2. Colors
Our palette balances the clinical nature of slate grays with deep, authoritative blues and high-energy accents.

### The "No-Line" Rule
To achieve a premium feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries between content areas must be defined solely through background shifts. For example, a content sidebar should be distinguished from the main feed by transitioning from `surface` to `surface-container-low`, rather than using a divider line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent layers. Use the `surface-container` tiers to define "elevation" through color rather than shadow:
*   **Base Layer:** `surface` (#f7f9fb)
*   **Secondary Content Areas:** `surface-container-low` (#f2f4f6)
*   **Interactive Cards/Modules:** `surface-container-lowest` (#ffffff) to provide a "pop" against the background.

### The "Glass & Gradient" Rule
For "floating" technical elements (like code snippet overlays or status badges), use **Glassmorphism**. Apply `surface_variant` at 60% opacity with a `20px` backdrop-blur. 
*   **Signature Textures:** Main CTAs or Hero sections should utilize a subtle linear gradient from `primary_container` (#001d31) to `primary` (#000000) at a 135-degree angle to provide depth and a "lithic" professional polish.

## 3. Typography
The typography system is a dialogue between the human-centric and the machine-precise.

*   **Display & Headlines (Space Grotesk):** This font brings a "technical-bold" aesthetic. Its geometric terminals suggest engineering precision. Use `display-lg` for hero titles to command immediate attention.
*   **Body (Manrope):** Chosen for its extreme readability and modern, open apertures. It softens the technical edge of the headlines, making long-form automation tutorials feel approachable.
*   **Labels (Inter):** Used for micro-copy and metadata. Inter’s neutrality ensures that "system" information doesn't compete with "editorial" content.

**Hierarchy Note:** Always maintain a high contrast ratio between `headline-lg` and `body-md` to ensure a clear entry point for the eye.

## 4. Elevation & Depth
In this system, depth is felt, not seen.

*   **The Layering Principle:** Avoid traditional shadows. Create a sense of lift by placing a `surface-container-lowest` element on top of a `surface-container-high` background.
*   **Ambient Shadows:** If a floating element (like a modal) requires a shadow, use a large blur (`40px`) with the shadow color set to `on-surface` (#191c1e) at 6% opacity. This mimics natural light diffusion.
*   **The "Ghost Border" Fallback:** For input fields or cards where definition is critical for accessibility, use the `outline-variant` (#c6c6cd) at **15% opacity**. This creates a "suggestion" of a boundary without cluttering the visual field.

## 5. Components

### Cards & Feed Items
*   **Structure:** Cards must never have visible borders. Use `surface-container-lowest` as the card background against a `surface-container-low` page background.
*   **Spacing:** Use `spacing-6` (2rem) for internal padding to give technical imagery room to breathe.
*   **Prohibition:** No divider lines between list items. Use `spacing-10` (3.5rem) vertical margins to separate articles.

### Buttons
*   **Primary:** High-contrast `primary` (#000000) background with `on_primary` (#ffffff) text. Use `rounded-md` (0.375rem) for a sharp, professional corner.
*   **Secondary:** Use `secondary_container` (#d5e3fc) with `on_secondary_container` (#57657a) for a softer, slate-gray appearance.
*   **Technical Accents:** Use `tertiary_fixed` (#6ffbbe) for "Live" indicators or "Success" states in automation logs.

### Input Fields & Search
*   **Visuals:** Use `surface_container_highest` for the field background. Labels should use `label-md` in `on_surface_variant`.
*   **States:** On focus, transition the background to `surface_container_lowest` and apply a 1px "Ghost Border" using `surface_tint`.

### Technical Chips
*   **Style:** Small, pill-shaped (`rounded-full`) using `primary_fixed` backgrounds. These are essential for tagging network protocols (e.g., BGP, OSPF) without adding visual weight.

## 6. Do’s and Don’ts

### Do
*   **Do use asymmetrical margins.** Allow your main content column to be slightly off-center to create an editorial, "magazine" feel.
*   **Do use "Primary Fixed" colors for data visualization.** These provide high legibility for technical charts against both light and dark surfaces.
*   **Do prioritize white space.** If a layout feels "busy," increase the vertical spacing from `spacing-8` to `spacing-12`.

### Don't
*   **Don't use pure black text on pure white backgrounds.** Use `on_surface` (#191c1e) on `surface` (#f7f9fb) to reduce eye strain during long technical reads.
*   **Don't use "Drop Shadows" on cards.** Stick to tonal layering and background shifts.
*   **Don't use standard icons.** Use thin-stroke, geometric icons that match the `outline` token weight to maintain the sophisticated technical aesthetic.