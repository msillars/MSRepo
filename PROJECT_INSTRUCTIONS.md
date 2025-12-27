# Project Instructions for Future Claude Conversations

When starting a new conversation about this Management System, include these key points:

## Project Context

**Project:** Personal Management System with drag-and-drop task organization
**Location:** `/Users/matthew/Desktop/Claude/Management System/management-system/dashboard/`

## Architecture Overview

This is a browser-based task management system using:
- **Data Layer:** `ideas-data.js` - LocalStorage-based data management with backup/recovery
- **Rendering:** `shared-rendering.js` - Unified card rendering with editing support
- **Drag-Drop:** `shared-drag-drop.js` - Drag-and-drop functionality that persists order
- **Pages:** `ideas.html`, `finished.html`, `index.html` (dashboard), and project pages

## Key Design Principles

1. **Template-Based:** All project pages use shared modules (no code duplication)
2. **Data-First:** Always read from data layer (localStorage), never rely on DOM state
3. **Order Persistence:** Cards must stay where you drop them after page refresh
4. **Consistent Editing:** All list pages should have the same editing functionality

## Project Pages Structure

All project pages (work, photography, life-admin, living, relationships) follow this pattern:
- Load 3 shared scripts: `ideas-data.js`, `shared-rendering.js`, `shared-drag-drop.js`
- Define `PROJECT_ID` constant
- Initialize drag-drop with `setupDragAndDrop()`
- Use `loadListWithRender()` for rendering lists
- Include edit handlers: `startEditIdea()`, `saveIdeaEdit()`, `cancelEdit()`
- Include move handlers: `moveToBacklogHandler()`, `moveToNewHandler()`, `markAsDone()`, `deleteIdeaConfirm()`

## Common Issues & Solutions

### Drag-drop not persisting
- Check that order values are being saved to localStorage
- Verify `reorderIdeas()` is being called with correct parameters
- Use browser console to check for drag-drop logs

### Editing not working
- Ensure page loads `shared-rendering.js`
- Check that `editingIdeaId` state is being managed
- Verify edit handlers are defined

### Code duplication
- Don't copy/paste JavaScript between pages
- Use shared modules instead
- Only page-specific code should be in individual page files

## Status Management

Ideas flow through three statuses:
1. **new** (Ideas) - Initial capture
2. **backlog** - Ready to work on
3. **done** (Finished) - Completed items

Each idea has an `order` field that determines position within its status.

## Files to Read First

When continuing work:
1. `/dashboard/ideas-data.js` - Understand data structure and functions
2. `/dashboard/shared-drag-drop.js` - See how drag-drop works
3. `/dashboard/shared-rendering.js` - See how cards are rendered
4. Any project page (e.g., `/dashboard/work.html`) - See the template pattern

## Recent Changes

Latest fix (Oct 30, 2025): Fixed drag-and-drop persistence and added editing to all project pages
- See `DRAG_DROP_FIX.md` for details

## Testing Protocol

When making changes:
1. Test drag within same list
2. Test drag between lists (drop on card)
3. Test drag between lists (drop on empty area)
4. Refresh page after each test
5. Check browser console for errors
6. Test editing functionality
7. Verify data persists in localStorage

## User Preferences

- Build for maintainability (templates over duplication)
- Prioritize data integrity
- Keep code readable and well-commented
- Fix bugs thoroughly, don't create workarounds

---

**Quick Start Command:** 
```
cd "/Users/matthew/Desktop/Claude/Management System/management-system"
```

Then open `dashboard/index.html` in a browser to test.
