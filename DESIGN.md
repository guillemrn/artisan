# Design

<!-- impeccable:design-schema 1 -->

## Direction — Grofit · Editorial Tech

Grofit should feel like a calm operating table for a local business: warm enough for non-technical owners, precise enough for money, stock, orders, pending payments, and daily closing. Editorial Tech means black ink on white paper, rules instead of cards, and one orange action per screen. Avoid generic SaaS hype, fake social proof, decorative emoji, gradients, glassmorphism and dramatic motion.

## Tokens (src/styles.css) — never hardcode colors

- Neutrals: `background`/`surface` #FFFFFF, `surface-2` #F5F6F8, `text-primary` #111111, `text-secondary` #3B4048, `text-muted` #646B76, `border` #D9DDE3, `border-soft` #EDEFF2.
- `cta` #FF4F00 with `cta-foreground` #111111: fill only, ONE main action per screen (sell, save sale). `accent-text` #B83A00 for links.
- `primary` #111111: confirm actions and active states.
- Semantic, always with text (never color alone):
  - `success` (cobrado) · `warning` (por cobrar) · `danger` (vencido, errores) · `info` (en curso sin acción: consignación, sugerencias). Each has a `*-bg` pair.
- `rail*`: dark navigation rail and mobile bar.
- Radii: `rounded-sm` 4 (badges) · `rounded-md` 6 (controls) · `rounded-lg` 8 (panels). No shadows except floating menus.

## Type

- One family: Satoshi (self-hosted, public/fonts). Black 900 for hero numbers and page titles, Bold 700 for sections, Regular/Medium for data.
- Tabular numbers (`tabular-nums`) on every amount. Two decimals in tables, none in headlines.

## Icons

- Phosphor (`@phosphor-icons/react`, `*Icon` names). Regular by default, Bold for the active navigation item and inside small buttons, Fill only for the active item on the dark rail.

## Components (src/components/ui) — use before writing new markup

- `Button` / `buttonClass()` (cta, primary, secondary, ghost, danger), `IconButton` (44 px), `Badge` (success, warning, danger, info, neutral), `Metric`, `LedgerRow`, `SectionHeader`, `Logo`.
- `SalesTable` (src/components/sales): any list of sales. Desktop table / mobile rows, `columns`, `layout="list"` for modals, `onCobrar`. States come from `saleStatus()` in `src/lib/sale-display.ts` (Cobrada, Por cobrar, En consignación, Cortesía, Solo cambio).
- If a pattern repeats twice, it becomes a component here.

## Guardrail

- ESLint `no-restricted-syntax` warns on hex colors, `bg-white` and `rounded-xl/2xl/3xl` inside `className`. New code must not add warnings; the remaining count is design debt to pay down screen by screen (and a prerequisite for dark mode).

## Motion and delight

- Microinteractions under 300 ms, CSS first, always respect `prefers-reduced-motion`.
- Press feedback on buttons (scale .97), active nav icon pops (`animate-nav-pop`), numbers count up (`useCountUp`).
- "Aha" moments are about value, not decoration: first sale shows its gross profit, collecting a payment lowers "Por cobrar", a shared ticket gets a PAGADO stamp. No confetti or particles; the motif is the orange square.

## Money rules

- Name things honestly: ingresos cobrados, costo de venta, ganancia bruta, margen bruto. Merma is shown separately. Utilidad neta only when expenses exist.
- Never compare periods of different length. Packages and pieces are never summed.

## UX Rules

- Spanish copy should stay practical, direct, and owner-friendly.
- Do not invent testimonials, customer names, benchmarks, pricing, or production proof.
- Preserve the current product truth: direct/public customers, point-of-sale customers, stock, cost, public/distributor pricing, tickets, payment state, delivery state, changes, pending payments, consignation, courtesy, and customer orders.
- Future service-business support can be mentioned as direction, but not presented as fully shipped product functionality.
