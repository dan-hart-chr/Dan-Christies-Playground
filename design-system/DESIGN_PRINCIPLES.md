
# Christie's — Digital Design Principles & Style Framework

**Version:** 0.1 (draft framework)
**Owner:** Digital Design & Innovation
**Status:** Working document — sections marked `[CONFIRM]` need brand-team values inserted before use.

---

## 0. How to use this document

This is the single reference for anyone designing or building a Christie's digital product. Read §1–2 before you start designing. Use §3–6 as you work. Use §9 before you hand off.

Anything not covered here defaults to the master brand guidelines. If you deviate, note it in the project's decision log and say why.

---

## 1. Principles

Six principles, in priority order. When two conflict, the higher one wins.

### 1.1 The object leads
The artwork or lot is the subject; the interface is the frame. Chrome, colour and motion recede so the object doesn't compete with the UI. If a design element is fighting the image, remove the element.

### 1.2 Confidence, not volume
Authority is expressed through restraint, precision and generous space — not through emphasis, gradients or decoration. One accent, used sparingly, reads as more expensive than five.

### 1.3 Clarity at the moment of commitment
Bidding, registration and payment are high-stakes. In those moments prioritise legibility, unambiguous labelling, visible state and reversibility over elegance.

### 1.4 Expert and newcomer, same screen
A specialist and a first-time buyer use the same page. Lead with plain language; make depth (provenance, condition, terms) available but not obligatory.

### 1.5 Global by default
Multi-language, multi-currency, multi-timezone, right-to-left capable. Design for the longest string, not the English one. Never encode meaning in colour alone or in a Western-only metaphor.

### 1.6 Accessible is the floor, not the finish
WCAG 2.2 AA on web, EN 301 549 on native. Accessibility is a definition-of-done item, not a remediation phase. See §7.

---

## 2. Voice & tone

| Attribute | We are | We are not |
|---|---|---|
| Register | Assured, precise, plain | Salesy, breathless, jargon-heavy |
| Sentence case | Sentence case for UI labels and headings `[CONFIRM]` | Title Case Everywhere |
| Actions | Verb-first and literal: "Place bid", "Save lot" | "Submit", "Continue", "Learn more" |
| Errors | State what happened and the fix | Apologise, blame, or stay vague |
| Empty states | Invite the next action | Decorative illustration with no route out |

An action keeps the same name through the whole flow: the button says *Place bid* → the confirmation says *Bid placed*.

---

## 3. Design tokens

Tokens are the contract between design and engineering. Figma variable names and CSS custom property names must match one-to-one.


### 3.1 Colour

Source of truth: `tokens.json` → `tokens.colors`, exposed to Tailwind via `tailwind.preset.ts`.

Naming guidance:
- In Figma: name colour styles as `colors/<token-key>`, e.g. `colors/brand-grey`.
- In tokens.json: keys live under `colors`, e.g. `"brand-grey": "#6E6259"`.
- In Tailwind: the same key becomes a utility class, e.g. `text-brand-grey`, `bg-brand-grey`.

**Brand (examples)**

| Token key | Example use |
|---|---|
| `brand-primary` | Primary accent (Tailwind: `text-brand-primary`, `bg-brand-primary`) |
| `brand-ink` | Primary text / near-black (Tailwind: `text-brand-ink`) |
| `brand-paper` | Base background (Tailwind: `bg-brand-paper`) |

**Neutrals** — a 9-step ramp, `--c-neutral-50` through `--c-neutral-900`. Steps 50–200 for surfaces, 300–400 for borders, 600–900 for text. `[CONFIRM ramp]`

**Semantic**

| Token | Use | Contrast requirement |
|---|---|---|
| `--c-fg-default` | Body text | ≥ 4.5:1 on its surface |
| `--c-fg-muted` | Secondary text, metadata | ≥ 4.5:1 |
| `--c-fg-onAccent` | Text on accent fills | ≥ 4.5:1 |
| `--c-bg-default` / `--c-bg-subtle` / `--c-bg-raised` | Surfaces | — |
| `--c-border-default` / `--c-border-strong` | Dividers, inputs | ≥ 3:1 for input borders |
| `--c-status-success` / `-warning` / `-danger` / `-info` | Feedback | ≥ 3:1 non-text, ≥ 4.5:1 text |
| `--c-bid-live` / `--c-bid-winning` / `--c-bid-outbid` | Auction state | Always paired with text + icon |

**Rules**
- Colour never carries meaning alone. Outbid state = colour **and** label **and** icon.
- Maximum one accent colour per screen region.
- Imagery sits on `--c-bg-default` with no tint, overlay or duotone unless the campaign explicitly calls for it.
- Dark mode: define a full parallel surface/foreground set; do not simply invert. `[CONFIRM whether dark mode is in scope]`


### 3.2 Typography

Source of truth: `tokens.json` → `tokens.typography.fontSizes` and `fontFamily`. Tailwind exposes these as `text-<key>` utilities and `font-<family>` classes.

Naming guidance:
- In Figma: name text styles as `type/<token-key>`, e.g. `type/5xl`, `type/body`.
- In tokens.json: keys live under `typography.fontSizes`, e.g. `"5xl": "3rem"`.
- In Tailwind: use `text-5xl`, `text-body`, etc.

**Scale (examples)**

| Token key | Size / example Tailwind class | Use |
|---|---|---|
| `5xl` | `text-5xl` (3rem) | Hero, sale title |
| `4xl` | `text-4xl` (2.25rem) | Section title |
| `3xl` | `text-3xl` (1.75rem) | Lot title |
| `2xl-sans` | `text-2xl-sans` (1.5rem) | Large sans headings |
| `body` | `text-body` (1rem) | Default UI body |
| `body-2xl` | `text-body-2xl` (1.25rem) | Larger body / lead text |
| `body-s` | `text-body-s` (0.875rem) | Small body, captions |
| `label` | `text-label` (0.875rem) | Eyebrows, table headers |

**Rules**
- Prices and countdowns use tabular figures so digits don't jitter.
- Measure: 60–75 characters for body copy.
- Never set body copy below 15px on web, 16pt on native.
- Text must reflow at 320px width and survive 200% zoom without loss (WCAG 1.4.10 / 1.4.4).
- Italic reserved for artwork titles and publication names, per house style.

**Rules**
- Prices and countdowns use tabular figures so digits don't jitter.
- Measure: 60–75 characters for body copy.
- Never set body copy below 15px on web, 16pt on native.
- Text must reflow at 320px width and survive 200% zoom without loss (WCAG 1.4.10 / 1.4.4).
- Italic reserved for artwork titles and publication names, per house style.

### 3.3 Space

4px base unit. `--s-1` = 4 through `--s-12` = 96. Use tokens only — no arbitrary pixel values in layout.

Recommended rhythm: component internal padding `--s-3`/`--s-4`; component gaps `--s-4`; section gaps `--s-8`+.

### 3.4 Radius, border, elevation

| Token | Value | Notes |
|---|---|---|
| `--r-none` | 0 | Images, media, lot thumbnails — always square |
| `--r-sm` | 2px `[CONFIRM]` | Inputs, buttons |
| `--r-md` | 4px `[CONFIRM]` | Cards, modals |
| `--border-hairline` | 1px | Default rule weight |
| `--elev-1` / `--elev-2` | Soft, low-opacity | Menus, modals only — surfaces are flat by default |

### 3.5 Motion

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 120ms | Hover, focus, toggle |
| `--motion-base` | 200ms | Reveal, expand |
| `--motion-slow` | 320ms | Page/route transition, overlay |
| `--motion-ease` | `cubic-bezier(0.2, 0, 0, 1)` | Default |

Motion clarifies cause and effect. No looping ambient animation near lot imagery. `prefers-reduced-motion: reduce` must remove non-essential motion — this is a build requirement, not an enhancement.

### 3.6 Grid & breakpoints

| Breakpoint | Width | Columns | Gutter | Margin |
|---|---|---|---|---|
| `sm` | 320–599 | 4 | 16 | 16 |
| `md` | 600–1023 | 8 | 24 | 24 |
| `lg` | 1024–1439 | 12 | 24 | 32 |
| `xl` | 1440+ | 12 | 32 | 48, max content 1440 `[CONFIRM]` |

---

## 4. Starter stylesheet

```css
:root {
	/* Brand */
	--c-brand-primary: /* CONFIRM */;
	--c-brand-ink:     /* CONFIRM */;
	--c-brand-paper:   /* CONFIRM */;

	/* Semantic — map to neutrals */
	--c-fg-default:  var(--c-brand-ink);
	--c-fg-muted:    var(--c-neutral-600);
	--c-fg-onAccent: var(--c-brand-paper);
	--c-bg-default:  var(--c-brand-paper);
	--c-bg-subtle:   var(--c-neutral-50);
	--c-border-default: var(--c-neutral-300);
	--c-border-strong:  var(--c-neutral-500);
	--c-focus-ring:  /* CONFIRM — must hit 3:1 against both adjacent surfaces */;

	/* Type */
	--f-display: /* CONFIRM */, Georgia, serif;
	--f-body:    /* CONFIRM */, system-ui, sans-serif;
	--f-data:    /* CONFIRM */, ui-monospace, monospace;

	/* Space */
	--s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
	--s-5: 24px; --s-6: 32px; --s-8: 48px; --s-12: 96px;

	/* Radius & motion */
	--r-sm: 2px; --r-md: 4px;
	--motion-fast: 120ms;
	--motion-base: 200ms;
	--motion-ease: cubic-bezier(0.2, 0, 0, 1);
}

/* Focus is never removed, only restyled */
:focus-visible {
	outline: 2px solid var(--c-focus-ring);
	outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		animation-duration: 0.01ms !important;
		transition-duration: 0.01ms !important;
		scroll-behavior: auto !important;
	}
}
```

---

## 5. Components

### 5.1 Buttons

| Variant | Use | Fill | Text | Border |
|---|---|---|---|---|
| Primary | The one committing action per view (Place bid, Register) | `--c-brand-primary` | `--c-fg-onAccent` | none |
| Secondary | Supporting action (Save lot, Add to view) | transparent | `--c-fg-default` | 1px `--c-border-strong` |
| Tertiary / text | Low-emphasis, inline | none | `--c-fg-default`, underlined | none |
| Destructive | Withdraw, cancel, delete | `--c-status-danger` | `--c-fg-onAccent` | none |

**Sizes**

| Size | Height | Padding X | Type token |
|---|---|---|---|
| `sm` | 32px | `--s-3` | `--t-body-sm` |
| `md` (default) | 44px | `--s-4` | `--t-body-md` |
| `lg` | 52px | `--s-5` | `--t-body-md` |

**Rules**
- Minimum target 44×44px including spacing (WCAG 2.5.8 requires 24×24; 44 is our floor).
- One primary per view. Two primaries means the hierarchy isn't decided yet.
- Full-width primaries on `sm` breakpoint for transactional flows only.
- States required for every variant: default, hover, focus-visible, active, loading, disabled.
- Disabled buttons still need 3:1 border contrast and must be explained — pair with helper text saying what unlocks them.
- Loading state keeps the button width fixed and announces via `aria-live`.
- Labels are verbs. Never "Submit", "Click here", "Learn more".

### 5.2 Forms & inputs
- Label above the field, always visible. No placeholder-as-label.
- Error message sits below the field, references the field by name, and is linked via `aria-describedby`.
- Errors are announced, not just coloured; the summary at the top of the form links to each failed field.
- Required fields marked in text, not with an asterisk alone.
- Autocomplete attributes on all identity/payment fields (WCAG 1.3.5).
- Never rely on a timeout without warning and extension (WCAG 2.2.1) — relevant to bidding and checkout.

### 5.3 Lot card
Fixed anatomy: image (square container, object contained not cropped) → artist / maker → title (italic) → medium & date → estimate → current bid & status → time remaining.

- Image never cropped to fill; letterbox on `--c-bg-subtle`.
- Status chip carries icon + text.
- Whole card is one link; secondary actions (save) are separate buttons outside the link target.

### 5.4 Auction state & timers
- Live, upcoming, closed, sold, withdrawn — each has a distinct label, icon and colour.
- Countdowns announce politely (`aria-live="polite"`), not on every tick — update at meaningful thresholds.
- Never use a timer as the only indication of urgency for a screen-reader user.

### 5.5 Navigation
- Persistent primary nav; current location indicated by more than colour.
- Skip-to-content link as the first focusable element.
- Breadcrumbs on lot and department pages.
- Focus order follows visual order; focus is trapped in modals and returned on close.

### 5.6 Modals, drawers, toasts
- Modals for interruptive confirmation only. Title, body, max two actions.
- Toasts for confirmation of a completed action; never for errors requiring a decision.
- Everything dismissible by keyboard (Esc) and pointer.

### 5.7 Tables & data
- Tabular figures, right-aligned numerics, left-aligned text.
- Real `<th>` with scope; no layout tables.
- Horizontal scroll containers are keyboard-focusable and labelled.

---

## 6. Imagery & art direction

- Object photography on neutral ground; no borders, drop shadows or rounded corners on artwork.
- Never crop a work in a way that misrepresents it. Detail crops must be labelled as details.
- Alt text describes the work as a viewer would need it: artist, title, medium — plus a short visual description where the image is the content. Decorative imagery gets `alt=""`.
- Text is never baked into an image (WCAG 1.4.5).
- Aspect ratios: `[CONFIRM standard set]`.
- Video: captions required, transcripts for anything over 60 seconds, no autoplay with sound.

---

## 7. Accessibility requirements

**Standards:** WCAG 2.2 Level AA for web. EN 301 549 for procurement and for native mobile — note the mobile-specific clauses (chapter 11) that WCAG alone does not cover.

Definition of done for any component:

- [ ] Keyboard-operable end to end, no traps
- [ ] Visible focus indicator meeting 2.4.11 (Focus Appearance)
- [ ] Target size ≥ 24×24 minimum, 44×44 preferred (2.5.8)
- [ ] Contrast: 4.5:1 text, 3:1 non-text and UI boundaries
- [ ] Works at 200% zoom and 320px reflow
- [ ] Respects `prefers-reduced-motion` and `prefers-contrast`
- [ ] Correct role, name, value exposed to assistive tech
- [ ] Tested with VoiceOver (iOS/macOS) and one of NVDA/TalkBack
- [ ] No dependence on colour, shape or position alone
- [ ] Dragging actions have a single-pointer alternative (2.5.7)
- [ ] Help and previously entered data are consistent across the flow (3.2.6, 3.3.7)

Native-only additions: supports Dynamic Type / font scaling, respects device orientation lock settings, custom controls expose native accessibility traits.

---

## 8. Naming & file conventions

- Figma: `Component / Variant / State` — matches the code component name exactly.
- Tokens: `--c-` colour, `--t-` type, `--s-` space, `--r-` radius, `--motion-` motion.
- Pages in Figma: `00 Cover · 01 Research · 02 Explorations · 03 Design · 04 Handoff · 99 Archive`.
- Every handoff frame carries: breakpoint, states shown, tokens used, and a note on anything intentionally off-system.

---

## 9. Pre-handoff checklist

- [ ] Every value is a token; no hex, no arbitrary px
- [ ] All four breakpoints designed or explicitly deferred
- [ ] All interactive states shown (default, hover, focus, active, loading, disabled, error)
- [ ] Empty, loading, error and success states designed
- [ ] Longest realistic string tested (German/Chinese title, long artist name)
- [ ] Currency and date formats localised
- [ ] Contrast checked and recorded
- [ ] Accessibility annotations added (heading order, alt text, focus order, labels)
- [ ] Copy reviewed against §2
- [ ] Decision log updated with any deviation from this document

---

## 10. Open items

| Item | Owner | Status |
|---|---|---|
| Confirm brand hex values and neutral ramp | Brand | `[CONFIRM]` |
| Confirm licensed typefaces and web font loading strategy | Brand / Eng | `[CONFIRM]` |
| Dark mode in scope? | Product | `[CONFIRM]` |
| Standard image aspect ratios | Photography | `[CONFIRM]` |
| Sentence case vs title case for UI labels | Editorial | `[CONFIRM]` |
| Native mobile token parity | Mobile | `[CONFIRM]` |

