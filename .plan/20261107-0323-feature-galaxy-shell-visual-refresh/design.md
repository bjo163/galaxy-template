# Design

## Approved direction

Apply **Quiet Mission Control**: a builder-focused Galaxy identity with a grounded app frame, compact data surfaces, and a signal accent. Preserve user choice through Theme Visualizer.

## Decisions

- Default primary: deep signal green chosen to remain legible with light and dark surfaces. Offer additional Galaxy-tuned preset colors and preserve the arbitrary color picker.
- Backgrounds: mineral-tinted light canvas, ink-tinted dark canvas, white/dark paper surfaces, and clearer dividers.
- Shell: attached header, compact sidebar spacing, smaller page padding, subtle card borders, and minimal elevation.
- Artwork: inline orbit/network SVG around a clear central node. Use low contrast, a single restrained accent glow, and only a slow hover-free drift where motion is allowed.
- Dashboard: compact title strip with decorative artwork above the existing CRM widgets; no invented metrics or data.
- Theme Visualizer: rename to Galaxy wording and keep palette, color picker, theme mode, layout, skin, reset, and direction controls.

## Trade-offs

Global compact card padding affects many template screens, but gives consistent density. The customizer's old cookie key stays unchanged so stored user choices survive the rebrand. Existing user changes to CRM activity data and layout imports must be preserved.
