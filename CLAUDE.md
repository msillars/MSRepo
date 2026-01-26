# Management System

Personal task/idea management dashboard with Windows 3.1 retro aesthetic. Browser-based, uses SQL.js with GitHub storage backend.

## Quick Start
```bash
cd ~/Desktop/Claude/Projects/ManagementSystem
python3 -m http.server 8081
# Open http://localhost:8081/dashboard/index.html
```

## Philosophy
**Everything is an item.** Topics, projects, tasks are the same unit at different scopes.
- Topics: ongoing, never done, MUST have purpose
- Projects: finite, have children, have end state
- Tasks: atomic, completable, no children

**Priorities are entities.** Named things (e.g., "Get healthy") that items link to via many-to-many relationship.

See `ROADMAP.md` for full philosophy and development plan.

## Key Files
- `dashboard/index.html` - Main dashboard
- `dashboard/sql-database.js` - SQLite data layer + schema
- `dashboard/github-storage.js` - GitHub API for persistence
- `dashboard/ideas-data.js` - Data API (Items API + Priorities API)
- `data/database.sqlite` - Seed database (committed to repo)
- `ROADMAP.md` - Development roadmap and philosophy
- `BACKLOG.md` - Detailed task backlog

## Database Schema (Jan 26, 2026)
```sql
-- Unified items table
items (id, text, parent_id, topic_id, item_type, status, purpose, icon, color, difficulty, order, created_at, completed_at)

-- Priorities system
priorities (id, name, rank, created_at)
priority_tiers (id, min_rank, max_rank, label, description)
item_priorities (item_id, priority_id)  -- many-to-many junction
```

## Architecture
- **Primary Storage:** GitHub repo (`data/database.sqlite`)
- **Fallback:** localStorage
- **Database:** SQL.js (SQLite compiled to WebAssembly)
- **Styling:** Windows 3.1 CSS theme

## Current Status (Jan 26, 2026)
- GitHub read: ✅ Working (public repo)
- GitHub write: ⚠️ Needs token (`setGitHubToken()` in console)
- Unified items table: ✅ Schema complete
- UI migration to Items API: ✅ Complete
- Priorities system: ✅ Schema and API complete

## Next Steps
1. Configure GitHub token for write access
2. Add "purpose" field to topics
3. Build Priorities UI (create/edit priorities, link to items)
4. See `ROADMAP.md` for full plan

## Don't Touch
- `dashboard/_old_tests/` - Archived files
- `Icons/` - Static assets

## GitHub
- Repo: https://github.com/msillars/MSRepo
- Live: https://msillars.github.io/MSRepo/dashboard/index.html
- Auth: SSH key (`~/.ssh/id_ed25519_github`)

## Working Together (Claude + Matthew)

**This project is about authenticity, not creativity.** The Win 3.1 styling follows original Microsoft specifications - we research and implement, not invent.

### Process that works well:
1. **Research first** - Find original specs (MS Guidelines, system metrics like SM_CYCAPTION)
2. **Document decisions** - Update docs before/during implementation, not after
3. **Test in isolation** - Use demo pages (e.g., `title-bar-demo.html`) before rolling out
4. **Identify constraints** - e.g., "buttons must always be square" - document these clearly
5. **Structured approach** - When debugging, find root cause (CSS specificity, multiple selectors) not just symptoms

### Key principle:
When Matthew provides research or identifies an issue, play it back to confirm understanding before implementing. This prevents wasted iterations.

### Documentation:
- `docs/WIN3X_WINDOW.md` - Component specs with design philosophy
- `docs/WIN3X_TITLE_BAR.md` - Title bar standard
- Demo pages in `dashboard/` for isolated testing
