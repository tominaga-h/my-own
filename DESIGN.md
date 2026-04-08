# Design System Document: The Digital Curator

## 1. Overview & Creative North Star

This design system is built upon the "Digital Curator" philosophy. In an age of information density, this system treats every note, tag, and metadata point as a curated artifact in a high-end digital gallery. We move beyond the "template" look by prioritizing **Soft Minimalism** and **Tonal Architecture**.

The goal is to provide a user experience that feels silent, focused, and premium. We achieve this through intentional asymmetry in layout, generous white space, and a refusal to use rigid structural lines. Instead of a flat grid, the UI is treated as a series of physical layers—like stacked sheets of fine paper or frosted glass—where depth is communicated through light and tone rather than lines and shadows.

---

## 2. Colors & Surface Philosophy

The palette is a sophisticated blend of cool slates and vibrant indigos, designed to feel both professional and inviting.

### The "No-Line" Rule

To maintain an editorial, high-end aesthetic, designers are **prohibited from using 1px solid borders** for sectioning or containment. Boundaries must be defined solely through:

- **Background Color Shifts:** Placing a `surface-container-lowest` card against a `surface-container-low` background.
- **Tonal Transitions:** Using subtle shifts in the neutral scale to indicate where one functional area ends and another begins.

### Surface Hierarchy & Nesting

Depth is achieved by "stacking" surface tiers. This creates a tactile, nested feeling:

- **Base Layer:** `surface` (#f7f9fb) for the main application background.
- **Sectioning:** `surface-container-low` (#f2f4f6) to define the "Library" or "List" columns.
- **Active/Card Layer:** `surface-container-lowest` (#ffffff) for individual note cards or the active editor canvas.
- **Emphasis Layer:** `surface-container-high` (#e6e8ea) for hover states or secondary utility bars.

### The "Glass & Gradient" Rule

Flat colors can feel clinical. To add "soul" to the interface:

- **Glassmorphism:** Use for floating menus or modals. Apply a semi-transparent `surface-container-lowest` with a `backdrop-blur` of 20px.
- **Signature Textures:** Use a subtle linear gradient (45°) transitioning from `primary` (#3525cd) to `primary-container` (#4f46e5) for high-impact elements like the "All Notes" active state or primary CTAs.

---

## 3. Typography

We utilize **Inter** across the entire system, relying on weight and scale rather than font variety to establish an authoritative editorial hierarchy.

- **Display & Headline:** Used for page titles (e.g., "My Notes"). High-contrast sizing (headline-lg) creates an immediate focal point, allowing the rest of the UI to remain quiet.
- **Titles:** `title-md` and `title-sm` are for note titles. They should feel bold and accessible.
- **Body:** `body-md` is the workhorse. It must have a generous line-height (1.6) to ensure long-form notes remain readable and uncrowded.
- **Labels:** `label-md` and `label-sm` are reserved for metadata (dates, tags). Use `on-surface-variant` (#464555) to ensure they are legible but clearly secondary to the content.

---

## 4. Elevation & Depth

This system rejects traditional "drop shadows" in favor of **Tonal Layering**.

- **The Layering Principle:** A card does not need a shadow to be "above" a surface; it only needs to be a different tone. A `surface-container-lowest` (#FFFFFF) card naturally lifts off a `surface-container-low` (#f2f4f6) background.
- **Ambient Shadows:** If a floating element (like a FAB or Popover) requires a shadow, it must be extra-diffused.
  - _Shadow Specs:_ Blur: 32px, Spread: -4px, Opacity: 6% of the `on-surface` color. This mimics natural, ambient light.
- **The "Ghost Border":** If a border is required for accessibility, use a "Ghost Border"—the `outline-variant` token at 15% opacity. Never use 100% opaque borders.
- **Integrated Glass:** When using glass containers, ensure the background color bleeds through. This softens the edges and makes the layout feel like an integrated ecosystem rather than separate boxes.

---

## 5. Components

### Buttons

- **Primary:** Pill-shaped (`rounded-full`). Uses the Signature Gradient (Primary to Primary-Container) with `on-primary` text.
- **Secondary:** `surface-container-high` background with `primary` text. No border.
- **Tertiary:** Ghost style. No background; only `primary` text.

### Chips (Metadata Tags)

- **Style:** Small, `rounded-md` (0.75rem).
- **Color:** `secondary-container` (#dbe2fa) background with `on-secondary-container` (#5d6478) text. These should feel like subtle labels, not heavy buttons.

### Lists & Note Entries

- **Separation:** Strictly forbid divider lines. Use `1.5rem` of vertical white space or a subtle `surface-container-low` background on hover to separate items.
- **Metadata:** Use `label-sm` for timestamps. Place them with intentional asymmetry—perhaps right-aligned or tucked under the title with a lower opacity.

### Input Fields & Editor

- **The Canvas:** The note editor should be a `surface-container-lowest` area.
- **States:** The "Active" state of an input is indicated by a subtle glow—a 2px "Ghost Border" using the `primary` color at 20% opacity.

### The "Library" Sidebar

- **Layout:** Use a distinct background color (`surface-container-low`).
- **Active State:** The selected folder (e.g., "All Notes") uses the Signature Gradient to provide a singular, "hero" moment in the sidebar.

---

## 6. Do's and Don'ts

### Do

- **Do** use whitespace as a structural element. If a section feels crowded, increase the padding rather than adding a line.
- **Do** use `on-surface-variant` for non-essential text to create a clear "read-first" path for the user.
- **Do** use `rounded-lg` (1rem) for major containers to maintain the soft, organic feel of the system.

### Don't

- **Don't** use pure black (#000000). Use `on-surface` (#191c1e) for maximum readability without harsh contrast.
- **Don't** use standard 1px borders. If you feel the need for a line, try a 4px gap of background color instead.
- **Don't** use sharp corners. Every element should follow the Roundedness Scale, favoring `lg` and `xl` for top-level containers.
- **Don't** crowd the metadata. Tags and dates should have enough "breathing room" to be scanned individually.
