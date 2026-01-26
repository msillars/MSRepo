# Management System Roadmap

**Last Updated:** January 26, 2026

---

## Vision & Philosophy

### Core Principle
**Everything is an item.** Topics, projects, tasks, ideas, reminders are all the same fundamental unit at different scopes.

### The Hierarchy
```
Universe
  └── Topics (ongoing, never "done" - e.g., "Photography", "Health")
        └── Projects (finite, have an end state - e.g., "Build portfolio site")
              └── Tasks (atomic, completable - e.g., "Choose domain name")
```

### Key Insights
- **Type is fluid:** A task becomes a project when children are added; a project becomes a task when simplified
- **Topics anchor everything:** Every item traces back to a root topic
- **Purpose required for topics:** Since topics have no deadline, they need a "why"
- **Hierarchy determines scope:** Same data model, different behavior based on nesting
- **Priorities are entities:** Priorities are named things (e.g., "Get healthy") that items link to, not just numeric values

---

## Current State (January 2026)

### ✅ Working
- Dashboard with Windows 3.1 theme
- 7 topic pages with consistent styling
- SQL.js database (SQLite in browser)
- GitHub storage backend (reads from repo)
- Drag-and-drop reordering
- Ideas → Backlog → Done status flow
- Unified `items` table schema (new architecture)
- **Title bar component** - 22px height, 20x20 square buttons, flush to edges (Jan 20)
- **Window/Title Bar hierarchy documented** - Window is parent, Title Bar is child (Jan 22)
- **UI uses Items API** - Dashboard and topic pages read from unified items table (Jan 22)
- **Window manager module** - Reusable `window-manager.js` for drag, resize, minimize, maximize (Jan 26)
- **Window component in base CSS** - `.window` now includes flex layout (Jan 26)
- **Priorities system** - Entity-based priorities with many-to-many linking (Jan 26)
- **Nested WindowManager** - Windows inside windows each have their own manager (Jan 26)
- **Dashboard demo converted** - All windows (priorities, topic cards) are now real interactive Windows (Jan 26)

### ⚠️ Partially Working
- GitHub write (needs token configuration - SSH works for git push)
- **Window Frame** - basic implementation exists, border style needs verification
- Legacy tables still exist (can remove once purpose field is added)
- **Dashboard layout** - Windows converted but lost organized grid arrangement

### ❌ Not Yet Built
- Purpose field for topics
- Projects layer (finite groups of tasks)
- Subtasks / nested items
- Add item/priority UI components

---

## Roadmap

### Phase 1: Foundation ✅
**Goal:** Solid data persistence and core philosophy implemented

- [x] Design unified `items` table schema
- [x] Create GitHub storage backend
- [x] Seed database with sample data
- [x] SSH configured for git operations
- [ ] Configure GitHub token for browser-based writes (optional)

### Phase 1.5: Window Component ✅
**Goal:** Authentic Win3.1 window behavior

- [x] **Minimize** - collapse to icon within parent container
- [x] **Maximize** - fill parent container (not full screen)
- [x] **Resize** - drag window borders
- [x] **Move** - drag title bar
- [x] Icon tray area for minimized windows
- [x] Window state management (JS) - `window-manager.js`
- [x] Nested window managers (windows inside windows)

*Note: May diverge from strict Win3.1 for usability in later phases.*

### Phase 2: Data Model Completion ✅ (Partial)
**Goal:** UI fully uses new Items API, legacy tables deprecated

- [x] Transition dashboard to use Items API
- [x] Transition topic pages to use Items API
- [x] Add Items API bridge functions (adapters, counts, priorities)
- [ ] Add "purpose" field to topic creation UI
- [ ] Add topic-level "purpose" display
- [ ] Remove dependency on legacy `topics` and `ideas` tables

### Phase 3: Projects Layer
**Goal:** Implement finite groupings of tasks under topics

- [ ] Design project creation UI
- [ ] Projects view (tasks grouped under projects within a topic)
- [ ] Project progress indicators
- [ ] Project completion state

### Phase 4: Subtasks & Nesting
**Goal:** Tasks can contain other tasks

- [ ] UI for adding subtasks
- [ ] Indented display of nested items
- [ ] Auto-promote task → project when children added
- [ ] Collapse/expand nested items

### Phase 5: Quality of Life
**Goal:** Make daily use smoother

- [ ] Due dates on tasks/projects
- [ ] Search and filter
- [ ] Keyboard shortcuts (j/k navigation)
- [ ] Bulk select and update
- [ ] Undo/redo

### Phase 6: Future / Nice to Have
- [ ] Time tracking
- [ ] Progress charts / analytics
- [ ] Calendar integration
- [ ] Mobile-optimized UI
- [ ] Dark mode
- [ ] Export to CSV/Markdown
- [ ] Supabase migration (if GitHub becomes limiting)

---

## Technical Architecture

### Data Layer
```
github-storage.js     → Fetch/save SQLite to GitHub
sql-database.js       → SQL.js initialization, queries, schema
ideas-data.js         → Data API (legacy + new Items API)
```

### Storage Priority
1. **GitHub** (primary, if token configured)
2. **localStorage** (fallback/cache)

### Database Tables
```sql
-- Unified items table
items (id, text, parent_id, topic_id, item_type, status, purpose, icon, color, ...)

-- Priorities system (Jan 26)
priorities (id, name, rank, created_at)
priority_tiers (id, min_rank, max_rank, label, description)
item_priorities (item_id, priority_id)  -- many-to-many junction
```

### Priorities System

**Priorities are entities**, not just numeric values. A Priority has:
- `name` - e.g., "Get healthy", "Find new job", "Sort out finances"
- `rank` - 1-10 numeric value

Items link to Priorities via `item_priorities` junction table (many-to-many).

**Tier Descriptors** (stored in `priority_tiers`):
| Rank | Label | Meaning |
|------|-------|---------|
| 1-2 | Not immediate | Can wait |
| 3-4 | Attention soon | On the radar |
| 5-6 | Current | Actively working on |
| 7-8 | High | Distracting until sorted |
| 9-10 | Urgent | Something isn't right |

**Replaces:** `weight` column on items, `ranking` column, legacy `PRIORITY_LEVELS` object.

### Items API (new)
```javascript
createItem(item)           // Create any item type
getItem(id)                // Get single item
updateItem(id, updates)    // Update item
deleteItem(id)             // Delete item
getItemsByType(type)       // Get all of type
getChildItems(parentId)    // Get children
getItemsByTopicId(topicId) // Get all under topic
```

---

## Quick Reference

### Start Development
```bash
cd ~/Desktop/Claude/Projects/ManagementSystem
python3 -m http.server 8081
# Open http://localhost:8081/dashboard/index.html
```

### Enable GitHub Write
```javascript
// In browser console:
setGitHubToken('ghp_your_token_here')
// Then refresh page
```

### Key Files
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Quick context for Claude |
| `ROADMAP.md` | This file - overall plan |
| `BACKLOG.md` | Detailed task backlog |
| `dashboard/ideas-data.js` | Data layer & APIs (includes Priorities API) |
| `dashboard/sql-database.js` | Database operations |
| `dashboard/github-storage.js` | GitHub sync |
| `dashboard/window-manager.js` | WindowManager class for interactive windows |
| `dashboard/dashboard-demo.html` | Full interactive demo with nested windows |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Jan 26, 2026 | Nested WindowManagers | Each container (Universe, My Life) gets its own WindowManager instance. Windows inside windows work independently. |
| Jan 26, 2026 | All windows are real windows | Topic cards, priorities panel - everything that looks like a window IS a window with full move/resize/min/max. No fake window styling. |
| Jan 26, 2026 | Priorities as entities | Priorities are named things items link to, not just numeric weight values. Many-to-many relationship. Replaces weight/ranking columns. |
| Jan 26, 2026 | Window manager extracted | Reusable `window-manager.js` module for interactive window behavior |
| Jan 26, 2026 | Base `.window` includes flex | Window component in CSS now has `display: flex; flex-direction: column` |
| Jan 22, 2026 | Window functionality: full implementation | Minimize to parent, maximize to parent, resize, move - all within container |
| Jan 22, 2026 | Items API migration complete | UI now reads from unified items table |
| Jan 22, 2026 | Window is parent, Title Bar is child | Component containment hierarchy - Title Bar only exists within Window |
| Jan 22, 2026 | Skip emulator for now | Use only if we hit a specific visual question we can't answer from docs |
| Jan 20, 2026 | Title bar: 22px fixed, 20x20 buttons | Win 3.1 SM_CYCAPTION = fixed height; buttons must always be square |
| Jan 20, 2026 | Design philosophy: authenticity | Follow original MS specs, not create new designs |
| Jan 15, 2026 | Unified `items` table | Philosophy: everything is an item |
| Jan 15, 2026 | GitHub as database | Free, version history, no new services |
| Jan 15, 2026 | Keep legacy tables temporarily | UI still depends on them |
| Oct 2025 | localStorage first | Simplest MVP |
| Oct 2025 | No frameworks | Keep it simple, maintainable |

---

## Notes for Future Sessions

1. **Token is compromised** - Create new GitHub token before enabling writes
2. **Old finished items lost** - Were only in localStorage, no backup
3. **Sample data is placeholder** - 17 tasks created for testing
4. **Philosophy matters** - Schema reflects "everything is an item" principle
5. **Dashboard demo feedback needed** - Windows converted but layout needs refinement; header/navigation removed
6. **Priorities API complete** - Full CRUD + linking functions in `ideas-data.js`, but no UI yet

---

**GitHub:** https://github.com/msillars/MSRepo
**Live:** https://msillars.github.io/MSRepo/dashboard/index.html
