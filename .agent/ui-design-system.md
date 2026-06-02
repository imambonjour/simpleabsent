# UI Designer — Design System
*Warm & Friendly · Earth Tone · Flat UI*

---

## Color Palette

### Primary — Warm Neutral
| Token | Name | HEX | RGB | Usage |
|-------|------|-----|-----|-------|
| `--warm-50` | Cream | `#FAF7F2` | 250, 247, 242 | Background utama, surface |
| `--warm-100` | Sand Light | `#F0E9DE` | 240, 233, 222 | Search bar, input bg, hover surface |
| `--warm-200` | Sand | `#DDD0BF` | 221, 208, 191 | Avatar bg, divider, placeholder |
| `--warm-400` | Warm Stone | `#B89B7A` | 184, 155, 122 | Label muted, icon inactive, caption |
| `--warm-600` | Walnut | `#8B6E52` | 139, 110, 82 | Body text secondary, nav item inactive |
| `--warm-800` | Dark Walnut | `#5C4535` | 92, 69, 53 | Heading, card title, strong text |
| `--warm-900` | Espresso | `#3A2A1F` | 58, 42, 31 | Primary heading, logo text |

### Accent — Terracotta
| Token | Name | HEX | RGB | Usage |
|-------|------|-----|-----|-------|
| `--accent` | Terracotta | `#C17F5A` | 193, 127, 90 | CTA button, active nav, brand color |
| `--accent-light` | Terracotta Tint | `#F5EAE0` | 245, 234, 224 | Active sidebar item bg, icon bg primary |

### Supporting — Semantic Icon Colors
| Name | HEX | Usage |
|------|-----|-------|
| Sage Green bg | `#EAF3DE` | Icon bg — layout/grid category |
| Sage Green icon | `#3B6D11` | Icon color — layout/grid category |
| Sky Blue bg | `#E6F1FB` | Icon bg — accessibility/info category |
| Sky Blue icon | `#185FA5` | Icon color — accessibility/info category |
| Amber bg | `#FAEEDA` | Icon bg — warning/disclosure category |
| Amber icon | `#854F0B` | Icon color — warning/disclosure category |

---

## Typography

| Role | Size | Weight | Color Token | Usage |
|------|------|--------|------------|-------|
| Page heading | 16px | 500 | `--warm-900` | Section titles |
| Card title | 13px | 500 | `--warm-800` | Card headers |
| Body | 12–13px | 400 | `--warm-600` | Description text |
| Label/meta | 11–12px | 400 | `--warm-600` | Sub-info, timestamps |
| Category label | 11px | 400 | `--warm-400` | Uppercase section headers, letter-spacing 0.07em |
| Button | 12px | 400 | `#ffffff` | CTA button text |

Font family: system sans-serif (`var(--font-sans)`)

---

## Spacing & Grid

```
Base unit: 8px
Micro:  4px  — gap between icon and text
Small:  8px  — internal card padding gap
Medium: 10–12px — card gap, sidebar item gap
Base:   16px — section padding
Large:  20–24px — page padding, section gap
```

---

## Components

### Card
```css
background: var(--color-background-primary); /* white */
border: 0.5px solid var(--color-border-tertiary);
border-radius: 8px; /* border-radius-md */
padding: 14px;
```

### Icon Badge (category icon bg)
```css
width: 28px; height: 28px;   /* desktop */
width: 34px; height: 34px;   /* mobile */
border-radius: 6–7px;
background: [category color bg];
display: flex; align-items: center; justify-content: center;
```

### CTA Button
```css
background: #C17F5A;
color: #ffffff;
border: none;
border-radius: 6px;
padding: 6px 12px;
font-size: 12px;
```

### Sidebar Nav Item — Active
```css
background: #F5EAE0;
border-radius: 6px;
padding: 7px 10px;
color: #C17F5A;
font-weight: 500;
```

### Sidebar Nav Item — Inactive
```css
background: transparent;
border-radius: 6px;
padding: 7px 10px;
color: #8B6E52;
```

### Search Bar (mobile)
```css
background: #F0E9DE; /* --warm-100 */
border-radius: 8px;
padding: 7px 10px;
color: #B89B7A; /* placeholder */
```

### Bottom Nav Item — Active
```css
color: #C17F5A;
font-size: 10px;
font-weight: 500;
```

### Bottom Nav Item — Inactive
```css
color: #B89B7A;
font-size: 10px;
```

---

## Layout Structure

### Desktop
```
[Topbar: logo | nav links | avatar]
[Sidebar 200px] [Main content: header + 2-col card grid]
```

### Mobile
```
[Header: logo + bell icon]
[Search bar]
[Section label]
[Card list — full width, icon + title + meta + chevron]
[Bottom nav: 4 items]
```

---

## Design Principles

- **No glass effects** — flat surfaces only, no `backdrop-filter`, no frosted blur
- **No gradients** — solid fills only
- **No drop shadows** — border `0.5px` for separation, no `box-shadow` on cards
- **Borders** — always `0.5px solid var(--color-border-tertiary)`
- **Warm neutrals** — background is never pure white (`#fff`), always `#FAF7F2`
- **Accent sparingly** — terracotta only for active state, CTA, brand element
- **Supporting colors** — sage/sky/amber only for icon category badges, not as text or bg
- **Dark mode** — use CSS variables for text/border; hardcode only warm palette bg and accent

---

## AI Prompt Reference

Gunakan blok ini saat meminta AI membuat UI baru dalam design system ini:

```
Design system: Warm & Friendly Flat UI
Background: #FAF7F2 (cream), never pure white
Primary text: #3A2A1F (espresso) and #5C4535 (dark walnut)
Secondary text: #8B6E52 (walnut), muted: #B89B7A (warm stone)
Accent: #C17F5A (terracotta) — use only for CTAs and active states
Accent tint: #F5EAE0 — use for active item backgrounds
Cards: white bg, 0.5px border, 8px radius, no shadow
No gradients. No glass. No blur. No drop shadows.
Icons: category badges with colored bg (sage, sky, amber, terracotta)
Font: system sans-serif, weights 400 and 500 only
Spacing: 8px base grid
```
