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

See `ROADMAP.md` for full philosophy and development plan.

## Key Files
- `dashboard/index.html` - Main dashboard
- `dashboard/sql-database.js` - SQLite data layer + GitHub integration
- `dashboard/github-storage.js` - GitHub API for persistence
- `dashboard/ideas-data.js` - Data API (legacy + new Items API)
- `data/database.sqlite` - Seed database (committed to repo)
- `ROADMAP.md` - Development roadmap and philosophy
- `BACKLOG.md` - Detailed task backlog

## Architecture
- **Primary Storage:** GitHub repo (`data/database.sqlite`)
- **Fallback:** localStorage
- **Database:** SQL.js (SQLite compiled to WebAssembly)
- **Styling:** Windows 3.1 CSS theme

## Current Status (Jan 2026)
- GitHub read: ✅ Working (public repo)
- GitHub write: ⚠️ Needs token (`setGitHubToken()` in console)
- Unified items table: ✅ Schema complete
- UI migration to Items API: ❌ Pending

## Next Steps
1. Configure GitHub token for write access
2. Transition UI from legacy functions to Items API
3. Add "purpose" field to topics
4. See `ROADMAP.md` for full plan

## Don't Touch
- `dashboard/_old_tests/` - Archived files
- `Icons/` - Static assets

## GitHub
- Repo: https://github.com/msillars/MSRepo
- Live: https://msillars.github.io/MSRepo/dashboard/index.html
- Auth: SSH key (`~/.ssh/id_ed25519_github`)
