# Design Direction: Galaxy Control Plane

## Status

Proposed direction for owner review. No product UI has been changed.

## Context

Galaxy's repository describes Arsy as a self-hostable BaaS with tenant-scoped workspaces/projects, user-defined models, records, and declarative add-ons. The current web app still identifies itself as Vuexy, uses the template's violet `#7367F0`, defaults to detached/floating surfaces, and exposes multiple template color choices. Those are useful scaffolding but do not express the real product.

## Chosen direction

**Quiet Mission Control** — a focused control plane for builders. It feels deliberate, legible, and capable. Its personality comes from showing how work is scoped and connected, not from a space-themed background.

### Palette

- **Ink:** deep green-charcoal for navigation, headings, and dark surfaces.
- **Fog:** warm, pale mineral for the light canvas and quiet panels.
- **Signal:** a sharp but controlled green for the primary action, current scope, and live/ready states.
- Keep error, warning, and informational colors semantic. Do not repurpose them as brand colors.
- Keep most surfaces flat. Reserve the signal color for a small number of high-value actions/states; use no full-page gradient or repeated glow.

Hex values should be finalized in implementation after contrast checks across both themes; this brief intentionally sets color character before exact tokens.

### Shape and layout

- Replace detached floating dashboard panels with a grounded application frame: stable navigation, clear page title/breadcrumb, and one main content canvas.
- Make scope visible: workspace → project → model. Use a restrained connector/relationship motif in navigation or breadcrumbs only when it clarifies hierarchy.
- Prefer compact, aligned data views and purposeful whitespace over a grid of equal decorative cards.
- Use a small radius scale: crisp controls, modest panel corners, and no universal pill treatment.
- Keep the customizer and template-only chrome out of the primary product path where possible.

### Typography and motion

- Use a clear, compact hierarchy suitable for product names, model keys, timestamps, and data tables.
- Make identifiers and numeric values easy to scan; use tabular numerals for metrics and timestamps.
- Motion stays functional: short transitions for menu, dialog, and state changes, with reduced-motion support.

### Language

Use concise, direct builder language: “Choose a workspace”, “Create a model”, “No records yet”. Avoid template greetings and broad claims about making work “easy and fun”.

## Liveliness dials

- ENERGY 2: product confidence without a loud hero or neon spectacle.
- RHYTHM 2: a steady shell, with different compositions for overview, builder, and onboarding tasks.
- MOTION 1: interaction feedback only.

## Pilot and boundaries

Start with the shared authenticated shell, the login/register experience, and one genuine Arsy workspace/project workflow. Do not spend the first pass restyling the unrelated academy, ecommerce, calendar, or other Vuexy sample pages. Do not create a new illustration or logo asset until the owner approves the direction.

Likely implementation touchpoints include `apps/web/src/configs/themeConfig.ts`, `apps/web/src/configs/primaryColorConfig.ts`, `apps/web/src/@core/theme/colorSchemes.ts`, `apps/web/src/components/layout/shared/Logo.tsx`, and `apps/web/src/@layouts/VerticalLayout.tsx`.

## Trade-offs and open choices

- A warm light canvas makes operational data approachable; a deep ink navigation area provides a recognizable frame. The dark theme should invert the same roles, not become a separate visual brand.
- Green is proposed because Arsy's earlier console used it and it contrasts with Vuexy violet, but the owner may prefer another signal color.
- The workspace/project navigation model is real; additional “orbit” graphics should only appear if they improve orientation.
