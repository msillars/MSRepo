# Windows 3.1 Title Bar Standard

This document defines the standard title bar layout for all windows in the Management System, based on authentic Windows 3.1 conventions.

> **Design Philosophy:** This project faithfully implements Win 3.1 styling - we follow original specifications, not create new designs. See `WIN3X_WINDOW.md` for full philosophy.

> **Component Hierarchy:** The Title Bar is a **child component** of the Window. It only exists within a `.window` container. See `WIN3X_WINDOW.md` for the parent component specification.

---

## Confirmed Dimensions

| Property | Value | Notes |
|----------|-------|-------|
| Title bar height | 22px | Fixed, not dynamic |
| Button size | 20x20px | **Always square** |
| Icon size | 10x10px | Centered in button |
| Button position | Flush to edges | No padding on title-bar |

---

## Layout (Left to Right)

```
[System Menu] -------- Window Title -------- [Minimize] [Maximize]
```

### 1. System Menu Icon (Left)
- Small icon on the far left
- In Win 3.1, this was a small horizontal line (like a space bar or hyphen)
- Single-click opens the System Menu (Restore, Move, Size, Minimize, Maximize, Close)
- Double-click closes the window
- Keyboard shortcut: Alt+Space

### 2. Title Text (Center)
- Window/application title
- Centered in the title bar
- Bold text

### 3. Window Control Buttons (Right)
**Windows 3.1 only had two buttons:**
- **Minimize** (down arrow icon)
- **Maximize/Restore** (up arrow or overlapping squares)

**Note:** The close button (X) was added in Windows 95. For authentic Win 3.1 style, we omit it, but may include it for usability.

## HTML Structure

```html
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
```

## To Close a Window

Double-click the system menu icon (authentic Win 3.1 behavior).

## System Menu Items (Classic)

When the system menu icon is clicked, it shows:
1. Restore
2. Move
3. Size
4. Minimize
5. Maximize
6. ─────────── (separator)
7. Close (Alt+F4)

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.title-bar` | Container for the entire title bar |
| `.title-bar-controls` | Groups buttons (left or right side) |
| `.title-bar-text` | Window title, flex-grows to fill center |
| `.system-menu` | System menu button (left side) |
| `[data-minimize]` | Minimize button |
| `[data-maximize]` | Maximize/Restore button |
| `[data-close]` | Close button (Win95+ addition) |

## Active vs Inactive State

- **Active window**: Blue title bar (`--title-bar-active-bg`)
- **Inactive window**: White/grey title bar (`--title-bar-bg`)

The `.window.active` or `.window:focus-within` classes trigger the active state.

## JavaScript Components

The reusable components are in `dashboard/win3x-components.js`. Include this file and use:

```javascript
// Render just a title bar
const titleBar = Win3x.renderTitleBar({
    title: 'My Window',
    onClose: 'closeWindow()',      // Double-click system menu
    onMinimize: 'minimizeWindow()',
    onMaximize: 'maximizeWindow()'
});

// Render a complete window
const window = Win3x.renderWindow({
    title: 'My Window',
    content: '<p>Window content here</p>',
    id: 'my-window',
    className: 'my-custom-class',
    active: true,
    onClose: 'closeWindow()'
});

// Render a modal dialog
const modal = Win3x.renderModal({
    title: 'Dialog Title',
    content: '<p>Dialog content</p>',
    id: 'my-modal',
    onClose: 'closeModal()'
});
```

### Available Functions

| Function | Purpose |
|----------|---------|
| `Win3x.renderTitleBar(options)` | Render just the title bar |
| `Win3x.renderWindow(options)` | Render a complete window with title bar and body |
| `Win3x.renderModal(options)` | Render a modal dialog window |

## Current Architecture

The Win3x components use a **separation of concerns** approach:

| Layer | File | Responsibility |
|-------|------|----------------|
| HTML Structure | `win3x-components.js` | Generates HTML strings with class names |
| Visual Styles | `win3x-theme.css` | CSS rules for `.title-bar`, `.window`, etc. |
| Documentation | This file | Specification and usage examples |

**How it works:** The JS functions output HTML that references CSS classes defined in the stylesheet. Pages include both files and can either:
- Call `Win3x.renderWindow()` to generate HTML dynamically
- Write the HTML structure directly (must match the component pattern)

---

## Migration Roadmap: Web Components

**Decision (January 2026):** The current approach works but will eventually migrate to Web Components for better encapsulation.

### Why Web Components?

- **Encapsulation:** Shadow DOM isolates styles completely
- **Portability:** Single file contains structure + styles + behavior
- **Standards-based:** W3C standard, no framework required
- **Alignment:** Matches the project's "visual - data - database" philosophy where each layer owns its concerns

### Migration Phases

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | Current | CSS in stylesheet, JS generates HTML. Ensure consistency. |
| **Phase 2** | Future | Create `win3x-elements.js` with `<win3x-window>` custom element |
| **Phase 3** | Future | Migrate pages to use custom elements, remove old CSS |

### Future API (Phase 2+)

```html
<!-- Current (Phase 1) -->
<div class="window active">
    <div class="title-bar">
        <div class="title-bar-controls">
            <button class="system-menu"></button>
        </div>
        <div class="title-bar-text">My Window</div>
        <div class="title-bar-controls">
            <button data-minimize></button>
            <button data-maximize></button>
        </div>
    </div>
    <div class="window-body">Content here</div>
</div>

<!-- Future (Phase 2+) -->
<win3x-window title="My Window" active>
    Content here
</win3x-window>
```

### Preparation for Migration

To make Phase 2 easier, Phase 1 should:

1. **Group window styles** in `win3x-theme.css` with clear comment blocks
2. **Use CSS custom properties** for colors/sizes (already in place)
3. **Keep JS function APIs stable** - they map to future element attributes

---

## References

- [Microsoft Learn: Windows 3.1 Title Bar History](https://learn.microsoft.com/en-us/archive/blogs/jensenh/you-windows-3-1-lovers)
- The system menu keyboard shortcut Alt+Space originates from the icon resembling a space bar
- [MDN Web Components Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Added note clarifying Title Bar is a child of Window component |
| 2026-01-20 | Added Confirmed Dimensions table, design philosophy reference |
| 2026-01-19 | Added Current Architecture and Migration Roadmap sections |
| 2026-01-16 | Initial draft |
