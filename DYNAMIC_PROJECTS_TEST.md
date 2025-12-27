# Dynamic Project System - Testing Guide

**Created:** November 3, 2025  
**Status:** Ready for Testing

---

## What Was Built

### ✅ Dynamic Project Page
- **File:** `project.html`
- **Purpose:** Universal page that works for ALL projects via URL parameters
- **Usage:** `project.html?id=project-name`

### ✅ Icon Picker
- Added to Add Project modal
- 10 icons available to choose from
- Icons stored in project data structure

### ✅ Smart Routing
- Existing projects (photography, work, etc.) → Use dedicated HTML files
- New projects → Automatically use dynamic `project.html?id=x`

---

## How to Test

### Test 1: Create a New Project
1. Open `index.html` in your browser
2. Click the **"+ Add Project"** card
3. Fill in the form:
   - **Name:** "Test Project"
   - **Priority:** "Always on"
   - **Icon:** Choose any icon (e.g., "Paint Brush")
4. Click **Create**

**Expected Result:**
- ✅ New project card appears on dashboard
- ✅ Shows correct icon
- ✅ Click card → Opens `project.html?id=test-project`
- ✅ Project page shows Ideas and Backlog columns
- ✅ Can add ideas to the new project

### Test 2: Verify Existing Projects Still Work
1. Click on **Photography** card
2. Should open `photography.html` (dedicated file)
3. Click on **Health** card
4. Should open `health.html` (dedicated file)

### Test 3: Add Ideas to Dynamic Project
1. From your new Test Project page
2. Click **"+ Add Idea"**
3. Create an idea for "Test Project"
4. Go back to dashboard
5. Check that Test Project card shows idea count

### Test 4: Icon Display
1. Verify icons show correctly on:
   - ✅ Dashboard project cards
   - ✅ Top Priorities section
   - ✅ Project page header

---

## Current Architecture

### Static Projects (have dedicated HTML files):
- photography.html
- work.html
- life-admin.html
- relationships.html
- living.html
- health.html
- creating-this-dashboard.html

### Dynamic Projects (use project.html):
- Any newly created projects
- Automatically routed via `openProject()` function

---

## Data Structure

### Project Object (Updated):
```javascript
{
    id: 'test-project',           // Generated from name
    name: 'Test Project',          // Display name
    priority: 'always-on',         // Priority level
    color: '#FF6B35',              // Color code
    icon: 'PaintBrush.ICO'         // NEW: Icon filename
}
```

### Icon Field:
- **Optional:** If not provided, defaults to 'Door.ICO'
- **Storage:** Saved in localStorage with project data
- **Usage:** Automatically displayed on cards and pages

---

## What's Next: Data Structure Refactor

After testing confirms this works, we'll proceed with Phase 4 from ARCHITECTURE.md:

### Goals:
1. Create `ProjectManager` class
2. Create `TaskManager` class (rename Idea → Task)
3. Create `StorageManager` class
4. Organize into domain-driven structure

### Benefits:
- ✅ Clear separation of concerns
- ✅ Easier testing
- ✅ Predictable growth pattern
- ✅ Better maintainability

---

## Files Modified

1. **ideas-data.js**
   - Updated `addProject()` to accept icon parameter
   - Added icon field to DEFAULT_PROJECTS

2. **index.html**
   - Added icon picker dropdown to Add Project modal
   - Updated `createNewProject()` to pass icon
   - Updated `openProject()` to route smartly
   - Updated icon loading logic to use project.icon

3. **project.html** (NEW)
   - Universal project page with URL parameter support
   - Error handling for missing/invalid projects
   - Same functionality as static pages

---

## Known Issues
None currently - ready for testing!

---

## Success Criteria

✅ Can create new projects with custom icons  
✅ New projects open and work correctly  
✅ Existing projects still work  
✅ Icons display everywhere  
✅ Data persists in localStorage  
✅ Ready for data structure refactor  
