# Management System Roadmap

**Last Updated:** January 15, 2026

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

---

## Current State (January 2026)

### ✅ Working
- Dashboard with Windows 3.1 theme
- 7 topic pages with consistent styling
- SQL.js database (SQLite in browser)
- GitHub storage backend (reads from repo)
- Weight system (1-10) for priority
- Drag-and-drop reordering
- Ideas → Backlog → Done status flow
- Unified `items` table schema (new architecture)

### ⚠️ Partially Working
- GitHub write (needs token configuration)
- Migration from legacy tables to unified items

### ❌ Not Yet Built
- Projects layer (finite groups of tasks)
- Subtasks / nested items
- Purpose field for topics
- UI using new Items API

---

## Roadmap

### Phase 1: Foundation (Current)
**Goal:** Solid data persistence and core philosophy implemented

- [x] Design unified `items` table schema
- [x] Create GitHub storage backend
- [x] Seed database with sample data
- [ ] Configure GitHub token for write access
- [ ] Test full read/write cycle to GitHub

### Phase 2: Data Model Completion
**Goal:** UI fully uses new Items API, legacy tables deprecated

- [ ] Add "purpose" field to topic creation UI
- [ ] Transition dashboard to use Items API
- [ ] Transition topic pages to use Items API
- [ ] Remove dependency on legacy `topics` and `ideas` tables
- [ ] Add topic-level "purpose" display

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
-- New unified table (use this)
items (id, text, parent_id, topic_id, item_type, status, weight, purpose, ...)

-- Legacy tables (deprecate after Phase 2)
topics (id, name, priority, color, icon, weight)
ideas (id, text, topic, ranking, difficulty, status, ...)
```

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
| `dashboard/ideas-data.js` | Data layer & APIs |
| `dashboard/sql-database.js` | Database operations |
| `dashboard/github-storage.js` | GitHub sync |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
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

---

**GitHub:** https://github.com/msillars/MSRepo
**Live:** https://msillars.github.io/MSRepo/dashboard/index.html
