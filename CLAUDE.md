# Management System

Personal task/idea management dashboard with Windows 3.1 retro aesthetic. Browser-based, uses SQL.js for local storage.

## Quick Start
Open `dashboard/index.html` in a browser.

## Key Files
- `dashboard/index.html` - Main dashboard
- `dashboard/sql-database.js` - SQLite data layer
- `dashboard/ideas-data.js` - Data API
- `dashboard/shared-*.js` - Shared modules
- `BACKLOG.md` - Prioritized task list

## Architecture
- **Storage:** SQL.js (SQLite in browser) with localStorage backup
- **Sync:** `ideasUpdated` event for cross-tab sync
- **Styling:** Windows 3.1 CSS theme

## Current Status
- SQL backend: Complete
- Weight system (1-10): Complete
- Win3x styling: 7/12 pages done (5 topic pages pending)
- UI display issue: Needs debugging

## Priority Work
1. Debug UI display issue (check browser console)
2. Complete Win3x styling on remaining 5 topic pages
3. See `BACKLOG.md` for full list

## Don't Touch
- `dashboard/_old_tests/` - Archived test files and migrations
- `Icons/` - Static assets, rarely change

## GitHub
- Repo: https://github.com/msillars/MSRepo
- Auth: SSH key configured (`~/.ssh/id_ed25519_github`)

## Related Documentation
- `/Users/matthew/Desktop/Claude/Documentation/ManagementSystem/`
