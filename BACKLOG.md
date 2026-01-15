# Management System Backlog

## Current State (January 2026)

**Working:**
- Dashboard with Win3x theme
- All 7 topic pages with Win3x styling
- SQL.js database with localStorage persistence
- Weight system (1-10) for topics and ideas
- Drag-and-drop reordering
- Ideas / Backlog / Done status flow

**Data Model:**
- Topics (ongoing containers, never "done")
- Ideas/Tasks (atomic, completable)
- Missing: Projects layer (finite groups of tasks toward a goal)

---

## Priority 1: Data Model Design

Before adding features, design the database schema to reflect the philosophy:

**The hierarchy:**
```
Universe
  └── Topics (ongoing, never done - e.g., "Photography", "Health")
        └── Projects (finite, have an end state - e.g., "Build portfolio site")
              └── Tasks (atomic, completable - e.g., "Choose domain name")
```

**Key insight:** A project IS a task made of tasks. Everything is fundamentally the same "thing" with different scope.

**Questions to resolve:**
- [ ] Should projects be a separate table, or a flag on items?
- [ ] How to handle nested tasks (subtasks)?
- [ ] What fields define "doneness" for projects vs topics?

---

## Priority 2: Core Features (once schema is designed)

- [ ] Projects layer - group tasks under finite goals
- [ ] Subtasks - tasks within tasks
- [ ] Due dates on tasks/projects
- [ ] Search and filter

---

## Priority 3: Quality of Life

- [ ] Keyboard shortcuts (j/k navigation)
- [ ] Better mobile UI
- [ ] Undo/redo functionality
- [ ] Bulk select and update
- [ ] Export to CSV/Markdown

---

## Priority 4: Future / Nice to Have

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

**Last Updated:** January 15, 2026
