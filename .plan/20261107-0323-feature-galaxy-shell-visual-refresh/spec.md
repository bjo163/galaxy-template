# Specification

## Requirements

- REQ-001: The default app identity is Galaxy rather than Vuexy.
- REQ-002: The default visual system uses an ink/mineral canvas with a signal-green primary; Theme Visualizer continues to apply selected colors live.
- REQ-003: The authenticated shell and dashboard use tighter, grounded spacing without changing available layout options.
- REQ-004: The brand mark is a custom inline SVG expressing connected orbital systems; a dashboard artwork adds restrained depth without claiming real data.
- REQ-005: Light, dark, system, custom primary colors, and current customizer layout controls remain functional.
- REQ-006: The artwork is decorative (`aria-hidden`) and motion is disabled for `prefers-reduced-motion`.
- REQ-007: Existing user WIP in the CRM page and private layout remains intact.

## Acceptance criteria

- Galaxy wordmark and mark appear in expanded shell; mark remains legible in collapsed shell.
- Dashboard spacing and card padding are visibly denser; SVG artwork provides a distinctive product signature.
- Theme Visualizer still changes the active primary color, switches light/dark/system, changes layout, and resets settings.
- Desktop and mobile layouts remain usable, with visible focus and no content clipped at 200% zoom.
- Web typecheck passes; visual click-through is reported element by element.
