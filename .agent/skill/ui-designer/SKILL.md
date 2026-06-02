---
name: ui-designer
description: Design and critique UI/UX interfaces, wireframes, design systems, and user flows. Use this skill whenever the user wants to design, review, or improve a UI — including app screens, dashboards, forms, navigation systems, component libraries, or any interface element. Also trigger when the user asks about UX patterns, accessibility, interaction design, design tokens, spacing systems, or says things like "make this look better", "improve the layout", "design a screen for", "what should the UI look like", "review my design", or "create a wireframe". This skill handles the full design thinking process from user research to visual specification.
---

# UI Designer

A skill for designing, critiquing, and specifying high-quality user interfaces with strong UX thinking.

The user may provide a brief (what to design), an existing design to critique, a screenshot, a description of a problem, or a feature request. The output is a well-reasoned UI design or design critique with specifications.

---

## Design Thinking Process

Before designing anything, work through these questions:

1. **Who is the user?** — Role, technical level, context of use (mobile/desktop, casual/power user)
2. **What is the primary job-to-be-done?** — The ONE thing the user needs to accomplish
3. **What are the failure modes?** — Errors, edge cases, empty states, loading states
4. **What is the visual hierarchy?** — What should the user see first, second, third?
5. **What interactions exist?** — Hover, tap, drag, keyboard shortcuts

Always state your design decisions explicitly. Don't just produce a layout — explain *why*.

---

## UI Design Principles

### Layout & Structure
- **Visual hierarchy first**: Size, weight, color, and position must guide the eye
- **Grid discipline**: Use 4px or 8px grid. Consistent spacing creates rhythm
- **Density**: Match information density to user expertise. Power users tolerate density; casual users need breathing room
- **Above the fold**: Critical actions and information must be immediately visible
- **Progressive disclosure**: Show only what's needed now; reveal complexity on demand

### Typography
- **Scale**: Use a type scale (e.g., 12/14/16/20/24/32/40px). Never arbitrary sizes
- **Weight contrast**: Pair a bold weight for headings with regular for body. Never use more than 2–3 weights
- **Line length**: 60–75 characters per line for body text. Shorter for UI labels
- **Hierarchy**: Title → Subtitle → Body → Caption. Each level must be clearly distinct

### Color
- **60–30–10 rule**: 60% neutral/background, 30% secondary, 10% accent/CTA
- **Semantic color**: Use color to mean something (red=error, green=success, yellow=warning). Be consistent
- **Contrast ratios**: Text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- **Dark/light parity**: If designing one, note how the other would adapt

### Components
Design with these states for every interactive element:
- **Default** → **Hover** → **Active/Pressed** → **Focused** → **Disabled** → **Loading** → **Error**

### Accessibility (non-negotiable)
- All interactive elements must have visible focus states
- Icons alone are insufficient — pair with labels or tooltips
- Touch targets minimum 44×44px on mobile
- Never rely solely on color to convey meaning

---

## Output Formats

Depending on what the user needs, output one or more of:

### 1. Visual Wireframe or Mockup
Use the `show_widget` tool to render an SVG or HTML mockup. Include:
- Layout structure with realistic content (no "Lorem ipsum" — use real-sounding placeholder data)
- Spacing indicators or notes
- State annotations (default, hover, error, empty)

### 2. Design Specification
A written spec covering:
```
Component: [Name]
Purpose: [What it does]
Variants: [List of states/variants]
Spacing: [Internal padding, margins]
Typography: [Font size, weight, line height for each text element]
Colors: [Hex values + semantic names]
Interaction: [What happens on hover/click/focus]
Accessibility: [ARIA roles, keyboard nav, contrast ratio]
```

### 3. Design Critique
When reviewing an existing design, structure feedback as:
- ✅ **What works** — Specific things done well (be precise)
- ⚠️ **What to improve** — Issues with clear reasoning (not just "looks bad")
- 🔴 **Critical issues** — Accessibility violations, UX anti-patterns, or broken affordances
- 💡 **Recommendations** — Concrete next steps, prioritized by impact

### 4. User Flow Diagram
Use the `show_widget` tool with a diagram to map:
- Entry points → screens → decision points → exits
- Label transitions with the user action that triggers them
- Highlight the happy path vs. error paths

---

## UX Patterns Reference

### Navigation
- **Top nav**: For sites with 5–7 sections. Logo left, links center or right, CTA rightmost
- **Side nav**: For apps with deep hierarchy. Collapsible for space. Icons + labels
- **Tab bar** (mobile): Max 5 items. Active state must be unmistakable
- **Breadcrumbs**: For deep hierarchies. Show current location. Last item non-clickable

### Forms
- **One column** for most forms. Two columns only when fields are strongly related (First / Last name)
- **Label above field** — never placeholder-only (inaccessible when typing)
- **Inline validation** — validate on blur, not on submit
- **Smart defaults** — pre-fill what you know. Reduce cognitive load
- **Primary CTA once** per form. Destructive actions (Delete, Cancel) must be visually de-emphasized

### Data Tables
- **Sortable columns**: Click header to sort. Show sort direction
- **Fixed header**: Freeze column headers on scroll for long tables
- **Row actions**: On hover, reveal actions. Destructive actions need confirmation
- **Empty state**: Explain why it's empty and what to do next
- **Pagination vs. infinite scroll**: Pagination for user-controlled tasks; infinite scroll for browsing feeds

### Feedback & Notifications
- **Toast**: Ephemeral feedback (3–5s). Position top-right or bottom-center
- **Banner**: Persistent contextual info. Above content it relates to
- **Modal**: Use sparingly. Only for critical decisions requiring full attention. Always escapable (Esc key)
- **Inline error**: Under the specific field. Never just red color alone

---

## Mobile-First Considerations

When designing for mobile:
- **Thumb zone**: Primary actions in bottom 2/3 of screen. Danger zone = top corners
- **Tap targets**: Minimum 44×44px with 8px clearance between targets
- **Gestures**: Swipe for common actions (delete row, navigate), but always provide a visible alternative
- **Keyboard behavior**: Specify which keyboard type each input triggers (email, numeric, text)
- **Safe areas**: Account for notch/home indicator on iOS, navigation bar on Android

---

## Design Handoff Notes

Always include:
- Exact pixel/rem values (not "about 16px")
- Color values in hex or HSL, plus semantic token name
- Responsive breakpoints if applicable (mobile: <768px, tablet: 768–1024px, desktop: >1024px)
- Animation timing if any (duration in ms, easing curve)
- Asset list (icons, images, fonts needed)
