# Architecture & Design Decisions

**Last Updated:** January 16, 2026
**Status:** Draft v0.1

---

## Overview

This document captures the architectural decisions and design philosophy for the Management System. It serves as a record of *why* decisions were made, not just *what* was built.

---

## Design Philosophy

### Core Principle: Everything is an Item

All entities (topics, projects, tasks, ideas, reminders) share a single underlying data structure. Differences in behavior emerge from:

1. **Type** - What the item represents
2. **Position** - Where it sits in the hierarchy
3. **Attributes** - Which fields are populated

**Rationale:** This simplifies the data layer, enables fluid promotion between types, and allows the UI to handle all items consistently.

### Ideas as Entry Point

Everything starts as an **Idea**—a quick capture with minimal required information. Ideas are then promoted to appropriate types.

**Rationale:**
- Reduces friction for capture (don't force categorization upfront)
- Separates "capture" from "organize" as distinct activities
- Prevents lost thoughts due to decision paralysis

### Hierarchy vs. Lifecycle

Two orthogonal concepts:

| Concept | What it describes | Example |
|---------|-------------------|---------|
| **Hierarchy** | Containment / nesting | "Task X belongs to Project Y" |
| **Lifecycle** | State transitions | "Idea → Task → Done" |

These are independent—an item can be promoted (lifecycle) without changing its parent (hierarchy), and vice versa.

---

## Architecture Decision Records (ADRs)

### ADR-001: Unified Items Table

**Date:** January 2026
**Status:** Accepted

**Context:**
The original design had separate tables for `topics` and `ideas`. Adding projects would require a third table, with increasing complexity for cross-cutting features (search, tagging, etc.).

**Decision:**
Use a single `items` table with an `item_type` discriminator column.

**Consequences:**
- (+) Single API for all CRUD operations
- (+) Easy to add new types without schema changes
- (+) Cross-type queries are simple
- (-) Some fields only apply to certain types (nullable columns)
- (-) Need discipline to validate type-specific rules

---

### ADR-002: Denormalized topic_id

**Date:** January 2026
**Status:** Accepted

**Context:**
Retrieving "all items for a topic" requires traversing the parent hierarchy, which is expensive for deeply nested items.

**Decision:**
Store `topic_id` on every item, pointing to the root topic ancestor.

**Consequences:**
- (+) O(1) lookup for "all items in topic"
- (+) Simple topic filtering in UI
- (-) Must maintain on insert/move operations
- (-) Slight data redundancy

---

### ADR-003: GitHub as Primary Storage

**Date:** October 2025
**Status:** Accepted

**Context:**
Need persistent storage without running a backend server. Options: localStorage only, cloud database, or file-based.

**Decision:**
Store SQLite database file in GitHub repo, fetch/push via GitHub API.

**Consequences:**
- (+) Free hosting with version history
- (+) Works offline with localStorage fallback
- (+) No server to maintain
- (-) Requires GitHub token for writes
- (-) Potential conflicts if edited from multiple devices
- (-) 100MB file size limit

---

### ADR-004: SQL.js for Browser Database

**Date:** October 2025
**Status:** Accepted

**Context:**
Need SQL capabilities in browser without a server.

**Decision:**
Use sql.js (SQLite compiled to WebAssembly).

**Consequences:**
- (+) Full SQL query support
- (+) Familiar SQLite semantics
- (+) Single-file database (easy to sync)
- (-) ~1MB WASM bundle
- (-) Initial load time for compilation

---

### ADR-005: No Framework

**Date:** October 2025
**Status:** Accepted

**Context:**
Modern web apps typically use React, Vue, etc. This is a personal project.

**Decision:**
Vanilla JavaScript with no build step.

**Consequences:**
- (+) Zero dependencies to maintain
- (+) Fast page loads
- (+) Easy to understand/modify
- (-) Manual DOM manipulation
- (-) No component reuse patterns (mitigated with shared-*.js files)

---

### ADR-006: Windows 3.1 Aesthetic

**Date:** October 2025
**Status:** Accepted

**Context:**
Dashboard needs a visual identity.

**Decision:**
Adopt Windows 3.1 visual style (title bars, buttons, borders).

**Consequences:**
- (+) Distinctive, memorable appearance
- (+) Clear visual hierarchy
- (+) Nostalgic/playful tone
- (-) May feel dated to some users
- (-) Limited to period-appropriate UI patterns

---

### ADR-007: Dual-Write Migration Strategy

**Date:** January 2026
**Status:** Active

**Context:**
The system has two data models:
- **Legacy:** `topics` and `ideas` tables with flat structure
- **New:** Unified `items` table with hierarchy support

Migrating all at once is risky. Need a gradual transition.

**Decision:**
Implement dual-write: legacy functions (`addIdea`, `updateIdea`, etc.) write to BOTH legacy tables AND the `items` table.

**Consequences:**
- (+) UI continues to work during migration
- (+) `items` table stays in sync automatically
- (+) Can migrate UI incrementally, one page at a time
- (+) Easy rollback if issues arise
- (-) Slight performance overhead (two writes)
- (-) Must maintain sync logic until migration complete

**Implementation:**
```javascript
// In addIdea(), after legacy write:
// DUAL-WRITE: Also insert into unified items table
executeWrite('INSERT INTO items ...', [...]);
```

**Migration Path:**
1. ✅ Add dual-write to legacy functions (January 2026)
2. Migrate UI to read from Items API
3. Remove legacy API reads
4. Remove legacy tables

---

### ADR-008: Win3x Component Strategy

**Date:** January 2026
**Status:** Accepted

**Context:**
The Windows 3.1 UI components (windows, title bars, modals) need a consistent implementation approach. Options considered:

1. **CSS in stylesheet, JS generates HTML** (current) - Separation of concerns, cacheable CSS
2. **CSS-in-JS** - Single file, but harder to customize
3. **CSS Custom Properties + JS** - Theme-able, but still two files
4. **Web Components** - True encapsulation via Shadow DOM, standards-based

**Decision:**
- **Phase 1 (current):** Keep CSS in `win3x-theme.css`, JS functions in `win3x-components.js`
- **Phase 2 (future):** Migrate to Web Components (`<win3x-window>`, `<win3x-titlebar>`)

**Rationale:**
- Phase 1 works and is already implemented
- Web Components align with the project's "visual - data - database" philosophy (each layer owns its concerns)
- Web Components are a W3C standard used by Google, Adobe, Microsoft
- Gradual migration reduces risk

**Consequences:**
- (+) Current code continues to work
- (+) Clear migration path to better encapsulation
- (+) No framework dependency
- (-) Two files to maintain during Phase 1
- (-) Migration effort required for Phase 2

**Preparation for Phase 2:**
- Group window-related CSS with clear comments
- Use CSS custom properties for theming (already done)
- Keep JS function APIs stable (they map to future element attributes)

See `docs/WIN3X_TITLE_BAR.md` for detailed specification.

---

## System Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     UI LAYER                            │
│  index.html │ topic.html │ ideas.html │ [future pages]  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   SHARED UI                             │
│  shared-rendering.js │ shared-weight-picker.js │ etc.   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   DATA API                              │
│                 ideas-data.js                           │
│         (Legacy API + New Items API)                    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                 DATABASE LAYER                          │
│                sql-database.js                          │
│            (SQL.js / SQLite in WASM)                    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  STORAGE LAYER                          │
│               github-storage.js                         │
│         (GitHub API + localStorage fallback)            │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action
    │
    ▼
UI Event Handler (e.g., onclick)
    │
    ▼
Data API Function (e.g., createItem())
    │
    ▼
SQL Query (executeWrite)
    │
    ├──► localStorage (immediate)
    │
    └──► GitHub (debounced 3s)
```

---

## File Structure

```
ManagementSystem/
├── dashboard/
│   ├── index.html              # Main dashboard
│   ├── ideas.html              # All ideas view
│   ├── topic.html              # Dynamic topic page
│   ├── [topic-name].html       # Static topic pages (7)
│   │
│   ├── ideas-data.js           # Data API layer
│   ├── sql-database.js         # SQLite operations
│   ├── github-storage.js       # GitHub sync
│   │
│   ├── shared-*.js             # Reusable UI components
│   ├── weight-utils.js         # Weight calculations
│   │
│   ├── layout.css              # Base layout
│   ├── win3x-theme.css         # Windows 3.1 theme
│   └── win3x-skin-3.1.css      # Theme details
│
├── data/
│   └── database.sqlite         # Seed database (GitHub)
│
├── Icons/                      # Win3x style icons
│
├── docs/                       # This documentation
│   ├── DATA_MODEL.md
│   ├── ARCHITECTURE.md
│   └── UI_MAPPING.md
│
├── CLAUDE.md                   # AI assistant context
├── ROADMAP.md                  # Development plan
└── BACKLOG.md                  # Task backlog
```

---

## API Design

### Legacy API (Current)

```javascript
// Topics
getTopics()
addTopic(name, priority, icon, weight)
updateTopic(id, updates)

// Ideas (tasks)
getIdeas()
addIdea(text, topic, ranking, difficulty, status)
updateIdea(id, updates)
deleteIdea(id)
```

### Items API (New)

```javascript
// CRUD
createItem(item)              // Returns new id
getItem(id)                   // Returns item or null
updateItem(id, updates)       // Partial update
deleteItem(id)                // Hard delete

// Queries
getItemsByType(type)          // All of type
getChildItems(parentId)       // Direct children
getItemsByTopicId(topicId)    // All under topic
getItemsByStatus(status)      // Filter by status
```

### Migration Path

1. **Phase 1:** Both APIs available, UI uses legacy
2. **Phase 2:** UI migrates to Items API page by page
3. **Phase 3:** Legacy API removed

---

## Security Considerations

- **GitHub Token:** Stored in localStorage, exposed in browser
  - Acceptable for personal use
  - Would need server-side proxy for multi-user

- **No Authentication:** Single-user system
  - GitHub repo can be private if needed

- **Data Validation:** Client-side only
  - SQL constraints provide some protection
  - No server-side validation

---

## Performance Considerations

- **Database Size:** SQLite file grows with data
  - Current: ~50KB
  - GitHub limit: 100MB
  - Consider archiving done items if growth becomes issue

- **Initial Load:**
  - sql.js WASM: ~1MB
  - Database fetch: variable
  - Target: <2s total load

- **Debounced Saves:** 3-second delay before GitHub push
  - Prevents rate limiting
  - May lose recent changes on crash

---

## Future Considerations

### Potential Migrations

| Trigger | Migration Path |
|---------|----------------|
| Multi-device sync needed | Supabase or similar |
| File size limit hit | Archive old data to separate file |
| Multi-user needed | Add authentication layer |
| Mobile app wanted | React Native with shared data layer |

### Extensibility Points

- **New Item Types:** Add to `item_type` enum, define behavior rules
- **New Statuses:** Add to `status` enum, update state machine
- **Custom Fields:** Consider JSON `metadata` column

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-19 | Added ADR-008: Win3x Component Strategy |
| 2026-01-16 | Initial draft |
