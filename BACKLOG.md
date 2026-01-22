# Management System Backlog

## Current State (January 22, 2026)

**Working:**
- Dashboard with Win3x theme
- All 7 topic pages with Win3x styling
- SQL.js database with localStorage persistence
- GitHub storage backend (read works, write needs token)
- Weight system (1-10) for topics and ideas
- Drag-and-drop reordering
- Ideas / Backlog / Done status flow
- **Unified items table** - schema complete, UI migrated
- **Title bar component** - 22px height, 20x20 buttons, system menu

**Data Model:** ✅ Resolved
- Unified `items` table - everything is an item
- `item_type` field distinguishes: topic, project, task, idea, reminder
- `parent_id` enables hierarchy (tasks under projects under topics)
- `topic_id` denormalized for fast filtering

---

## Priority 1: Window Component (Current)

Implement authentic Win3.1 window behavior:

- [ ] **Minimize** - collapse to icon within parent container
- [ ] **Maximize** - fill parent container
- [ ] **Resize** - drag window borders
- [ ] **Move** - drag title bar
- [ ] Icon tray area for minimized windows
- [ ] Window state management (JavaScript)

**Constraint:** Windows minimize/maximize within their parent container, not the full browser.

---

## Priority 2: Purpose Field & Legacy Cleanup

**Purpose UI:** (do alongside new functionality, may diverge from Win3.1)
- [ ] Add "purpose" field to topic creation/edit UI
- [ ] Display purpose on topic cards and pages

**Legacy Cleanup:** ✅ Complete (Jan 22)
- [x] Update write operations: `addIdea()`, `updateIdea()`, `deleteIdea()`, `addTopic()`, `updateTopic()`, `deleteTopic()`
- [x] Remove legacy `topics` and `ideas` tables from schema
- [x] Remove dual-write code from ideas-data.js

---

## Priority 3: Projects Layer

- [ ] Projects layer - group tasks under finite goals
- [ ] Project creation UI
- [ ] Project progress indicators
- [ ] Project completion state

---

## Priority 4: Subtasks & Nesting

- [ ] Subtasks - tasks within tasks
- [ ] Indented display of nested items
- [ ] Auto-promote task → project when children added
- [ ] Collapse/expand nested items

---

## Priority 5: Quality of Life

- [ ] Due dates on tasks/projects
- [ ] Search and filter
- [ ] Keyboard shortcuts (j/k navigation)
- [ ] Better mobile UI
- [ ] Undo/redo functionality
- [ ] Bulk select and update
- [ ] Export to CSV/Markdown

---

## Priority 6: Future / Nice to Have

- [ ] Time tracking
- [ ] Progress charts / analytics
- [ ] Calendar integration
- [ ] Multi-device sync (requires backend)
- [ ] Mobile app
- [ ] Dark mode / custom themes

---

## Archived

One-time migration scripts, test files, and old documentation have been moved to `dashboard/_old_tests/`.

---

## Resolved Questions

| Question | Answer | Date |
|----------|--------|------|
| Should projects be a separate table? | No - unified `items` table with `item_type` field | Jan 15 |
| How to handle nested tasks? | `parent_id` field creates hierarchy | Jan 15 |
| What defines "doneness"? | `status` field (new/backlog/done) + `completed_at` timestamp | Jan 15 |

---

**Last Updated:** January 22, 2026
