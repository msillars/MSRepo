# Windows 3.1 Window Component Specification

This document defines the Window component - the fundamental container for all UI in the Management System.

---

## Design Philosophy

**This project is not about creating new styles.** It's about faithfully implementing the Windows 3.1 interface to present the management system. When implementing UI components:

1. **Find the original specification** - Microsoft published detailed guidelines for Win 3.1
2. **Reference system metrics** - Win 3.1 used constants like SM_CYCAPTION for title bar height
3. **Don't guess** - If unsure, research or test against authentic screenshots
4. **Document decisions** - Record what we confirmed and why

The goal is authenticity, not creativity.

---

## Component Architecture

### Containment Hierarchy

The Window is the **parent component**. All other UI elements live inside it:

```
.window (THE CONTAINER)
│
├── .title-bar (CHILD - see WIN3X_TITLE_BAR.md for details)
│   ├── .title-bar-controls (left)
│   │   └── button.system-menu
│   ├── .title-bar-text
│   └── .title-bar-controls (right)
│       ├── button[data-minimize]
│       └── button[data-maximize]
│
├── .menu-bar (CHILD - future)
│
├── .window-body (CHILD - content area)
│
└── .status-bar (CHILD - future)
```

### Key Principle: Window First, Children Second

When styling, think from the outside in:
1. **Window Frame** defines the outer boundary (border, background, padding)
2. **Title Bar** sits inside the frame, flush to the top
3. **Window Body** sits below the title bar, contains application content

The Title Bar is NOT a standalone component - it only makes sense within a Window.

---

## Window Frame

### Current Implementation (from win3x-theme.css)

```css
.window {
  background: var(--window-frame);  /* #C0C0C0 - gray */
  border: 1px solid var(--border);  /* #000000 - black */
  padding: 2px;                     /* Creates gray frame between border and content */
}
```

### Specifications

| Property | Value | Status |
|----------|-------|--------|
| Background color | #C0C0C0 (gray) | **Confirmed** |
| Border | 1px solid black | **Needs verification** - should this be 3D beveled? |
| Padding | 2px | **Needs verification** |
| Active state | Same frame color | **Confirmed** |

### Open Questions (for next session)

1. **Outer border style**: Win 3.1 windows typically had a 3D beveled outer border, not just a flat 1px black line. Should we add:
   - `box-shadow: inset -1px -1px 0 var(--button-dark), inset 1px 1px 0 var(--button-light)`?
   - Or is the current flat border acceptable for our purposes?

2. **Resize handles**: Documented as "future" - not implementing yet.

3. **Exact measurements**: Need to verify 2px padding against Win 3.1 specs.

---

## Title Bar (Child Component)

The title bar is fully documented in **WIN3X_TITLE_BAR.md**.

Summary of confirmed specs:
- Height: 22px (fixed)
- Buttons: 20x20px (always square)
- Position: Flush to window frame edges (no padding between title bar and frame)

---

## Window Body

### Current Implementation

```css
.window-body {
  background: var(--window-bg);     /* #FFFFFF - white */
  color: var(--window-fg);          /* #000000 - black */
  border: 1px solid var(--border);
  border-top: 0;                    /* No double border with title bar */
}
```

### Specifications

| Property | Value | Status |
|----------|-------|--------|
| Background | #FFFFFF (white) | **Confirmed** |
| Border | 1px solid black, no top border | **Confirmed** |

---

## Active/Inactive States

Windows respond to focus:

```css
.window.active,
.window:focus-within {
  /* Title bar changes to blue, frame stays gray */
}
```

| State | Title Bar | Frame |
|-------|-----------|-------|
| Active | Blue (#0000C0) | Gray (#C0C0C0) |
| Inactive | White (#FFFFFF) | Gray (#C0C0C0) |

---

## HTML Structure

### Basic Window

```html
<div class="window active">
    <div class="title-bar">
        <div class="title-bar-controls">
            <button class="system-menu" aria-label="System menu"></button>
        </div>
        <div class="title-bar-text">Window Title</div>
        <div class="title-bar-controls">
            <button data-minimize aria-label="Minimize"></button>
            <button data-maximize aria-label="Maximize"></button>
        </div>
    </div>
    <div class="window-body">
        <!-- Application content here -->
    </div>
</div>
```

### Window with Menu Bar (future)

```html
<div class="window active">
    <div class="title-bar">...</div>
    <div class="menu-bar">
        <!-- Menu items -->
    </div>
    <div class="window-body">...</div>
</div>
```

---

## Demo Page

Test the window component in isolation: `dashboard/title-bar-demo.html`

(This page tests both the window frame and title bar together.)

---

## References

- Windows 3.1 system metrics (SM_CYCAPTION, SM_CXSIZE, etc.)
- Microsoft Windows 3.1 Interface Guidelines
- Guidebook Gallery screenshots: https://guidebookgallery.org/screenshots/win31

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Restructured: Window as parent, Title Bar as child. Added Window Frame section. |
| 2026-01-20 | Title bar rolled out to main dashboard (index.html) |
| 2026-01-20 | Added Design Philosophy section, confirmed all button dimensions |
| 2026-01-20 | Initial draft based on screenshot analysis |

---

## Session Summary (2026-01-22)

**Context for next session:**

This session focused on documentation review and restructuring to ensure we're building systematically.

**Key clarification made:**
- Window is the parent component; Title Bar is a child that lives inside it
- Documentation now reflects this containment hierarchy

**What's confirmed:**
- Title Bar: Fully specified and implemented (22px, 20x20 buttons, etc.)
- Window Frame: Basic implementation exists, but border style needs verification

**Next steps for Window component:**
1. Research whether Win 3.1 window frames had 3D beveled outer borders
2. Verify the 2px frame padding is authentic
3. Update CSS if needed
4. Then move to Phase 2 (Items API migration)

**Decision made:**
- Skip emulator for now - use only if we hit a specific visual question we can't answer from documentation
