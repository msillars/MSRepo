# Desktop UI Design

**Last Updated:** January 16, 2026
**Status:** Draft v0.1

---

## Overview

The **Desktop** is the root view of the Management System, representing the "Universe" - the totality of everything being managed. Following Windows 3.1 conventions, it presents Topics as program icons that open into windows.

---

## Conceptual Model

```
┌─────────────────────────────────────────────────────────────────┐
│ Universe (Desktop)                                              │
│                                                                 │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│   │ 📸   │  │ 💼   │  │ 🏠   │  │ 💡   │  │ ❤️   │            │
│   │Photo │  │Work  │  │Life  │  │Ideas │  │Rels  │            │
│   └──────┘  └──────┘  └──────┘  └──────┘  └──────┘            │
│                                                                 │
│   ┌──────┐                                                     │
│   │ ✅   │                                                     │
│   │Done  │                                                     │
│   └──────┘                                                     │
│                                                                 │
│                                           ┌─────────────────┐  │
│                                           │ Top Priorities  │  │
│                                           │ ─────────────── │  │
│                                           │ □ Task 1 (wt:9) │  │
│                                           │ □ Task 2 (wt:8) │  │
│                                           │ □ Task 3 (wt:7) │  │
│                                           └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Win3x Desktop Components

### 1. Desktop Background

The workspace area where icons sit. Currently implemented as `.topics-grid`.

```css
.desktop {
    background: #008080;  /* Classic teal, or could be configurable */
    min-height: 100vh;
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, 80px);
    grid-auto-rows: 80px;
    gap: 16px;
    align-content: start;
}
```

### 2. Desktop Icons (Topics)

Each Topic appears as a desktop icon - an image with a label below.

```
┌────────────────┐
│   ┌────────┐   │
│   │  .ICO  │   │  ← 32x32 or 48x48 icon
│   └────────┘   │
│   Topic Name   │  ← Label (truncated if long)
│      (5)       │  ← Optional: item count
└────────────────┘
```

**States:**
- Default: Normal appearance
- Selected: Highlighted background (single click)
- Active: Opens window (double click)

```css
.desktop-icon {
    width: 72px;
    text-align: center;
    cursor: pointer;
    padding: 4px;
}

.desktop-icon:hover {
    background: rgba(255, 255, 255, 0.2);
}

.desktop-icon.selected {
    background: #000080;
    color: white;
}

.desktop-icon img {
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
}

.desktop-icon-label {
    font-size: 11px;
    margin-top: 4px;
    word-wrap: break-word;
}
```

### 3. Windows

When a topic icon is double-clicked, it opens a **window**. Windows are the primary container for viewing and editing items.

Already implemented via `.win3x-window`. Key elements:

```
┌─────────────────────────────────────────────────┐
│ ■ Window Title                          [_][□][X] │  ← Title bar with controls
├─────────────────────────────────────────────────┤
│ Menu bar (optional)                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  Content area                                   │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ Status bar (optional)                           │
└─────────────────────────────────────────────────┘
```

**Window States:**
- Normal: Standard size and position
- Minimized: Collapsed to taskbar/icon
- Maximized: Fills desktop area
- Modal: Blocks interaction with other windows

### 4. Taskbar (Future)

A bar at bottom of screen showing:
- Open windows (for quick switching)
- Clock
- Quick actions

```
┌──────────────────────────────────────────────────────────────┐
│ [Photography] [Work] [Ideas]                      12:34 PM │
└──────────────────────────────────────────────────────────────┘
```

---

## Desktop Hierarchy

The desktop represents the **Universe** level:

| Level | UI Representation | Action |
|-------|-------------------|--------|
| Universe | Desktop background | Shows all Topics as icons |
| Topic | Desktop icon | Double-click opens Topic window |
| Project | List item in Topic window | Click expands to show tasks |
| Task | List item | Click to edit, checkbox to complete |
| Subtask | Indented list item | Same as task |

---

## Special Desktop Items

### Ideas Inbox

A special icon that opens the Ideas capture window. Always visible on desktop.

```
┌──────┐
│  💡  │
│Ideas │
│ (12) │  ← Count of unprocessed ideas
└──────┘
```

### Finished/Archive

A special icon showing completed items.

```
┌──────┐
│  ✅  │
│Done  │
└──────┘
```

### Top Priorities Widget

A persistent widget (not a full window) showing highest-weight items across all topics.

Could be:
- A pinned mini-window
- A sidebar panel
- A desktop gadget

```css
.desktop-widget {
    position: fixed;
    right: 20px;
    bottom: 60px;  /* Above taskbar */
    width: 250px;
    /* Win3x window styling */
}
```

---

## Navigation Patterns

### Current State (January 2026)

| Action | Result |
|--------|--------|
| Click topic card | Navigate to topic page (full page) |
| Click Ideas | Navigate to ideas.html |
| Click Finished | Navigate to finished.html |

### Target State

| Action | Result |
|--------|--------|
| Single-click icon | Select icon (highlight) |
| Double-click icon | Open topic in window (stays on desktop) |
| Right-click icon | Context menu (rename, delete, properties) |
| Drag icon | Reposition on desktop |
| Double-click Ideas | Open Ideas inbox window |
| Double-click Finished | Open Finished window |

---

## Implementation Phases

### Phase 1: Visual Conversion (Current Sprint)
- Convert topic cards to desktop icons
- Keep navigation behavior (click = go to page)
- Add icon selection state
- Position icons in grid

### Phase 2: Windowing System
- Open topics in windows instead of navigating
- Implement window controls (minimize, maximize, close)
- Multiple windows can be open simultaneously
- Window z-ordering (bring to front on click)

### Phase 3: Desktop Features
- Icon repositioning (drag and drop)
- Save icon positions to localStorage
- Right-click context menus
- Taskbar for open windows

### Phase 4: Widgets
- Top Priorities widget
- Quick capture widget
- Clock/date widget

---

## CSS Class Naming

Following the established pattern:

```css
/* Desktop container */
.desktop { }
.desktop-icons { }

/* Desktop icons */
.desktop-icon { }
.desktop-icon-image { }
.desktop-icon-label { }
.desktop-icon-badge { }  /* For item counts */
.desktop-icon.selected { }
.desktop-icon.active { }

/* Desktop widgets */
.desktop-widget { }
.desktop-widget-header { }
.desktop-widget-body { }

/* Taskbar (future) */
.taskbar { }
.taskbar-button { }
.taskbar-button.active { }
.taskbar-clock { }
```

---

## Relationship to Existing Code

| Current | Becomes |
|---------|---------|
| `.topics-section` | `.desktop` |
| `.topics-grid` | `.desktop-icons` |
| `.topic-card` | `.desktop-icon` |
| `.topic-icon` | `.desktop-icon-image` |
| `.topic-name` | `.desktop-icon-label` |
| `.topic-ideas-count` | `.desktop-icon-badge` |

The existing Win3x window components (`.win3x-window`, etc.) remain unchanged.

---

## Open Questions

1. **Icon arrangement**: Free-form or grid-locked?
2. **Save icon positions**: localStorage or database?
3. **Multiple desktops**: Should we support virtual desktops?
4. **Window tiling**: Cascade, tile, or free positioning?
5. **Touch support**: How does this work on mobile/tablet?

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-16 | Initial draft - desktop concept |
