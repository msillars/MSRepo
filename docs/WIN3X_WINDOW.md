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

## Demo Pages

| Page | Purpose |
|------|---------|
| `dashboard/title-bar-demo.html` | Static title bar and window frame examples |
| `dashboard/window-demo.html` | **Interactive window behavior** (move, resize, minimize, maximize) |

---

## Window Behavior (First Draft - Jan 2026)

Interactive window management implemented in `window-demo.html`:

### Implemented Features

| Feature | Behavior | Implementation |
|---------|----------|----------------|
| **Move** | Drag title bar | Mouse events on `.title-bar` |
| **Resize** | Drag edges/corners | 8 invisible resize handles around window |
| **Minimize** | Collapse to icon tray | Window hidden, icon appears in bottom tray |
| **Maximize** | Fill parent container | Window expands to desktop bounds (not browser) |
| **Restore** | Return to previous size | Saved in `data-restore-*` attributes |
| **Close** | Double-click system menu | Window removed from DOM |
| **Focus/Z-order** | Click to bring to front | `z-index` incremented on activation |

### Key Design Decisions

1. **Windows operate within desktop container** - not the full browser viewport
2. **Icon tray at bottom** - minimized windows become clickable icons (like Win 3.1 desktop icons)
3. **Title bar unchanged** - uses existing 22px height, 20x20 buttons exactly as documented
4. **State preservation** - window remembers size/position before maximize

### CSS Classes Added

```css
.window.draggable      /* Enables positioning */
.window.minimized      /* Hidden state */
.window.maximized      /* Full desktop size */
.resize-handle         /* Invisible drag targets */
.icon-tray             /* Bottom bar for minimized icons */
.minimized-icon        /* Clickable restore button */
```

### Open Questions for Future Sessions

1. **Scrollbars** - How did Win 3.1 scrollbars work? (needs research)
2. **Status bar** - Was there a bar at the bottom with info? (needs research)
3. **Menu bar** - Between title bar and content (documented as future)
4. **Resize cursor feedback** - Should we show resize cursors on window frame itself?

---

## References

- Windows 3.1 system metrics (SM_CYCAPTION, SM_CXSIZE, etc.)
- Microsoft Windows 3.1 Interface Guidelines
- Guidebook Gallery screenshots: https://guidebookgallery.org/screenshots/win31

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Added window-demo.html with interactive behavior (move, resize, min/max) |
| 2026-01-22 | Restructured: Window as parent, Title Bar as child. Added Window Frame section. |
| 2026-01-20 | Title bar rolled out to main dashboard (index.html) |
| 2026-01-20 | Added Design Philosophy section, confirmed all button dimensions |
| 2026-01-20 | Initial draft based on screenshot analysis |

---

## Session Summary

### 2026-01-22 (Session 2) - Window Behavior Demo

**What we built:**
- Created `window-demo.html` with full interactive window management
- Move, resize, minimize, maximize, restore, close, focus/z-order all working
- Icon tray at bottom for minimized windows
- Windows constrained to desktop container (not browser)

**Status:**
- First draft complete and functional
- Title bar component unchanged (as intended)
- Ready for visual review and refinement

**Next steps:**
1. Research scrollbars and status bar for Win 3.1 authenticity
2. Review demo, identify any behavior issues
3. Consider extracting JS to reusable module

---

### 2026-01-22 (Session 1) - Documentation Restructure

**Key clarification made:**
- Window is the parent component; Title Bar is a child that lives inside it
- Documentation now reflects this containment hierarchy

**What's confirmed:**
- Title Bar: Fully specified and implemented (22px, 20x20 buttons, etc.)
- Window Frame: Basic implementation exists, but border style needs verification

**Open questions:**
1. Should window frame have 3D beveled outer border?
2. Verify 2px frame padding is authentic
