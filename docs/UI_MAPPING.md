# UI Mapping

**Last Updated:** January 16, 2026
**Status:** Draft v0.1

---

## Overview

This document maps data structures to UI components, defining how each entity type is displayed and what interactions are available. It serves as a reference for implementing new views and maintaining consistency.

---

## Page Inventory

### Current Pages

| Page | URL | Purpose | Data Source |
|------|-----|---------|-------------|
| Dashboard | `index.html` | Overview, topic navigation | Legacy API |
| Ideas | `ideas.html` | All ideas across topics | Legacy API |
| Topic (dynamic) | `topic.html?id=X` | Single topic view | Legacy API |
| Topic (static) | `[name].html` | Static topic pages (7) | Legacy API |

### Planned Pages

| Page | URL | Purpose | Data Source |
|------|-----|---------|-------------|
| Inbox | `inbox.html` | Unpromoted ideas | Items API |
| Project | `project.html?id=X` | Single project view | Items API |

---

## Component Mapping

### Dashboard (`index.html`)

```
┌─────────────────────────────────────────────────────────────┐
│ [Header Window]                                             │
│  Title: "Management System"                                 │
│  Action: Ideas button → ideas.html                          │
│  Data: Total ideas count (status != 'done')                 │
├────────────────────┬────────────────────────────────────────┤
│ [Priorities Panel] │ [Topics Grid]                          │
│                    │                                        │
│  Top 5 items by    │  Topic cards sorted by weight          │
│  weight across all │  Each card shows:                      │
│  topics            │   - Icon, name, weight badge           │
│                    │   - Ideas count                        │
│  Data:             │   - Edit / View buttons                │
│   items WHERE      │                                        │
│   status='backlog' │  Data:                                 │
│   ORDER BY weight  │   topics table (legacy)                │
│   LIMIT 5          │   OR items WHERE type='topic'          │
│                    │                                        │
│                    │  [+ Add Topic card]                    │
└────────────────────┴────────────────────────────────────────┘
```

#### Data → UI Mapping

| UI Element | Data Field | Notes |
|------------|------------|-------|
| Topic card title | `topics.name` | Title bar text |
| Weight badge | `topics.weight` | Color from `getWeightColor()` |
| Icon | `topics.icon` | Falls back to hardcoded map |
| Ideas count | COUNT of `ideas` WHERE `topic = X` | Excludes done |
| Priority item | `ideas.text` | In priorities panel |

---

### Topic Page (`topic.html` / `[name].html`)

```
┌─────────────────────────────────────────────────────────────┐
│ [Header Window]                                             │
│  Title: Topic name                                          │
│  Back button → index.html                                   │
├─────────────────────────────────────────────────────────────┤
│ [Add Idea Form]                                             │
│  Text input + weight picker + Add button                    │
├────────────────────┬────────────────────────────────────────┤
│ [Ideas Column]     │ [Backlog Column]    │ [Done Column]    │
│ status = 'new'     │ status = 'backlog'  │ status = 'done'  │
│                    │                     │                  │
│  Draggable items   │  Draggable items    │  Completed items │
│  Sorted by order   │  Sorted by order    │  Sorted by date  │
└────────────────────┴─────────────────────┴──────────────────┘
```

#### Data → UI Mapping

| UI Element | Data Field | Notes |
|------------|------------|-------|
| Page title | `topics.name` | Header + browser title |
| Idea card | `ideas.text` | Card content |
| Weight badge | `ideas.weight` | (Currently uses ranking) |
| Status column | `ideas.status` | Determines which column |
| Sort order | `ideas.order` | Within column |

---

### Ideas Page (`ideas.html`)

```
┌─────────────────────────────────────────────────────────────┐
│ [Header Window]                                             │
│  Title: "All Ideas"                                         │
│  Filter/search controls                                     │
├─────────────────────────────────────────────────────────────┤
│ [Ideas List]                                                │
│  All ideas across all topics                                │
│  Grouped or filterable by topic                             │
│  Sortable by weight, date, topic                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Item Type → UI Behavior

### Topic Display

| Context | Display |
|---------|---------|
| Dashboard grid | Card with icon, name, weight, count |
| Navigation | Sidebar or breadcrumb |
| Editing | Modal with name, weight, icon picker |

### Project Display (Planned)

| Context | Display |
|---------|---------|
| Under topic | Card showing progress (X/Y tasks done) |
| Own page | Header + task list with subtasks |
| Dashboard | May appear in priorities if high weight |

### Task Display

| Context | Display |
|---------|---------|
| Column view | Draggable card with text, weight badge |
| Under project | Checkbox list with indent for subtasks |
| Priorities | Card with topic/project breadcrumb |

### Idea Display

| Context | Display |
|---------|---------|
| Inbox | Simple card, promote button |
| Ideas page | Card with topic badge |

### Reminder Display (Planned)

| Context | Display |
|---------|---------|
| Dashboard | Alert style with due date |
| Topic page | Highlighted if due soon |

---

## Shared Components

### Weight Badge

**File:** `weight-utils.js`, `shared-weight-picker.js`

```html
<div class="weight-badge" style="background: ${getWeightColor(weight)}">
  ${weight}
</div>
```

| Weight | Color |
|--------|-------|
| 1-2 | Blue (#4a90d9) |
| 3-4 | Green (#5cb85c) |
| 5-6 | Yellow (#f0ad4e) |
| 7-8 | Orange (#fd7e14) |
| 9-10 | Red (#d9534f) |

### Weight Picker

**Usage:**
```javascript
renderWeightPicker({
  currentWeight: 5,
  id: 'item-weight',
  label: 'Priority (1-10)',
  showHelp: true
})
```

### Win3x Window

**File:** `win3x-components.js` (JS) + `win3x-theme.css` (CSS)
**Spec:** `docs/WIN3X_TITLE_BAR.md`

**Current Structure (Phase 1):**
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
    <!-- Content -->
  </div>
</div>
```

**Note:** No close button (X) - authentic Win 3.1 style. Double-click system menu to close.

**JavaScript API:**
```javascript
// Generate window HTML
const html = Win3x.renderWindow({
    title: 'My Window',
    content: '<p>Content</p>',
    active: true,
    onClose: 'closeWindow()',
    onMinimize: 'minimizeWindow()',
    onMaximize: 'maximizeWindow()'
});
```

**Future (Phase 2+):** Will migrate to Web Components:
```html
<win3x-window title="Window Title" active>
  <!-- Content -->
</win3x-window>
```

See ADR-008 in `ARCHITECTURE.md` for the component strategy decision.

### Priority Item Card

**File:** `shared-top-priorities.js`

```html
<div class="priority-item">
  <div class="priority-rank">${rank}</div>
  <div class="priority-content">
    <div class="priority-text">${text}</div>
    <div class="priority-meta">
      <span class="priority-project">${topic}</span>
      <span class="badge">${status}</span>
    </div>
  </div>
</div>
```

---

## State Management

### Current Approach

- No centralized state
- Each page loads data on init
- Updates trigger `window.dispatchEvent(new Event('ideasUpdated'))`
- Listeners reload relevant sections

### Proposed Improvements

1. **Event-driven updates:** More granular events (`itemCreated`, `itemUpdated`, etc.)
2. **Optimistic UI:** Update DOM immediately, rollback on error
3. **Dirty tracking:** Know if unsaved changes exist

---

## Interaction Patterns

### Drag and Drop

**Current:** Reorders items within status column
**Implementation:** Native HTML5 drag/drop
**Data update:** `updateIdea(id, { order: newOrder })`

### Status Transitions

| From | To | Trigger |
|------|-----|---------|
| new | backlog | Drag to backlog column |
| backlog | done | Drag to done column / checkbox |
| done | backlog | Drag back (reopen) |

### CRUD Operations

| Action | UI Trigger | Data Function |
|--------|------------|---------------|
| Create topic | Modal form submit | `addTopic()` |
| Create idea | Inline form submit | `addIdea()` |
| Update item | Edit modal / inline edit | `updateIdea()` |
| Delete item | Delete button + confirm | `deleteIdea()` |

---

## Migration Checklist

### Phase 2: UI Migration to Items API

For each page, update these:

- [ ] **Dashboard**
  - [ ] `loadProjectCards()` → use `getItemsByType('topic')`
  - [ ] Priorities → use Items API query
  - [ ] Total count → Items API

- [ ] **Topic pages**
  - [ ] `loadIdeas()` → use `getItemsByTopicId()`
  - [ ] `addIdea()` → use `createItem()`
  - [ ] `updateIdea()` → use `updateItem()`

- [ ] **Ideas page**
  - [ ] All queries → Items API

---

## Wireframes Reference

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Management System                              [Ideas (42)]  │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────┐  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│ │ Top 5 Priorities│  │ Photo  │ │ Work   │ │ Health │ │ Living ││
│ │                 │  │   📷   │ │   💼   │ │   ❤️   │ │   🏠   ││
│ │ 1. Task A       │  │ 12     │ │ 8      │ │ 5      │ │ 3      ││
│ │ 2. Task B       │  │ ideas  │ │ ideas  │ │ ideas  │ │ ideas  ││
│ │ 3. Task C       │  └────────┘ └────────┘ └────────┘ └────────┘│
│ │ 4. Task D       │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│ │ 5. Task E       │  │ Admin  │ │ Social │ │ Code   │ │   +    ││
│ │                 │  │   📋   │ │   👥   │ │   💻   │ │  ADD   ││
│ └─────────────────┘  │ 7      │ │ 4      │ │ 11     │ │ TOPIC  ││
│                      │ ideas  │ │ ideas  │ │ ideas  │ │        ││
│                      └────────┘ └────────┘ └────────┘ └────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Topic Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ← Back    Photography                                        │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ [New idea text...                        ] [5] [Add]         │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│ │ IDEAS            │ │ BACKLOG          │ │ DONE             │  │
│ │                  │ │                  │ │                  │  │
│ │ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │  │
│ │ │ Item 1    [5]│ │ │ │ Item 3    [8]│ │ │ │ Item 5    ✓ │ │  │
│ │ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │  │
│ │ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │  │
│ │ │ Item 2    [3]│ │ │ │ Item 4    [7]│ │ │ │ Item 6    ✓ │ │  │
│ │ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │  │
│ │                  │ │                  │ │                  │  │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-19 | Updated Win3x Window section with correct structure and migration plan |
| 2026-01-16 | Initial draft |
