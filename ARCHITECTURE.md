# Architecture & Modularity Guide

**Last Updated:** November 3, 2025  
**Status:** Phase 1 Complete - Shared Project Page Controller

---

## What We've Done: Phase 1 - Modular Controllers

### Problem Solved
Each of the 5 project pages (photography.html, work.html, etc.) contained ~120 lines of **identical JavaScript code**. This meant:
- Changes had to be made 5 times
- Bugs could exist in one file but not others
- Adding features meant updating 5 files

### Solution: `shared-project-page.js`
Created a unified controller that handles all project page logic.

**Before:**
```javascript
// 120 lines of inline code in each file
const PROJECT_ID = 'photography';
const PROJECT_CONFIG = { ... };
function initializePage() { ... }
function loadAllLists() { ... }
function startEditIdea() { ... }
// ... 10 more functions
```

**After:**
```javascript
// Just 3 lines in each file
initializeProjectPage('photography');
```

### Impact
- **Reduced duplication:** 5 files × 120 lines = 600 lines → 1 shared file + 5×3 lines = ~180 total lines
- **Maintainability:** Change logic once, affects all pages
- **Consistency:** All pages guaranteed to behave identically
- **Extensibility:** Add new features to one file

---

## Current Architecture (After Phase 1)

```
┌─────────────────────────────────────────────────────────┐
│                    Project Pages                         │
│  photography.html, work.html, life-admin.html, etc.     │
│  (Just HTML + 1 line of JS to initialize)               │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              shared-project-page.js                      │
│          (UI Controller / Page Logic Layer)              │
│  - ProjectPageController class                           │
│  - Event handlers (edit, move, delete)                   │
│  - Page initialization                                   │
│  - Cross-tab sync                                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────┬──────────────────┬──────────────────┐
│ shared-          │ shared-          │  ideas-data.js   │
│ rendering.js     │ drag-drop.js     │  (Data Layer)    │
│ (View)           │ (Interaction)    │                  │
└──────────────────┴──────────────────┴──────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  localStorage                            │
│            (Browser Data Persistence)                    │
└─────────────────────────────────────────────────────────┘
```

---

## Future Architecture: Data-Type-Driven Design

### Vision
Organize code around **domain entities** (Projects, Tasks, Status) rather than technical layers. This makes the system more intuitive and easier to extend.

### Proposed Data Types

#### 1. **Task** (currently called "Idea")
The primary entity representing work to be done.

```javascript
Task {
    id: number | string
    text: string
    project: string (project ID)
    status: 'new' | 'backlog' | 'done'
    ranking: 1-5 (priority)
    difficulty: 'easy' | 'medium' | 'hard'
    timestamp: ISO date
    order: number (position in list)
    statusChangedAt: ISO date
}
```

**Why rename "Idea" to "Task"?**
- More accurate: these are actionable items, not just thoughts
- Clearer domain language
- Distinguishes between "capturing an idea" and "a thing to do"

#### 2. **Project**
A life domain or focus area.

```javascript
Project {
    id: string
    name: string
    priority: 'always-on' | 'do-prep' | 'getting-important' | 'priority' | 'urgent'
    color: string (hex code)
    icon?: string (path to icon)
}
```

#### 3. **Status**
The lifecycle stage of a task.

```javascript
Status {
    key: 'new' | 'backlog' | 'done'
    label: string
    icon: string
    color: string
}
```

**Future expansion:**
- Add more statuses (e.g., 'in-progress', 'blocked', 'reviewed')
- Custom statuses per project
- Status workflows (e.g., new → reviewed → backlog → in-progress → done)

---

## Proposed Future Structure

### Phase 2: Extract CSS
**File:** `shared-styles.css`
- All common styles in one file
- Reduces duplication from ~1000 lines × 5 files to 1 file
- Easier to maintain visual consistency

### Phase 3: Domain-Driven Data Layer

Create specialized managers for each data type:

```
dashboard/
├── core/
│   ├── task-manager.js          # Task CRUD, queries, operations
│   ├── project-manager.js       # Project CRUD, configuration
│   ├── status-manager.js        # Status transitions, workflows
│   └── storage-manager.js       # localStorage abstraction
├── ui/
│   ├── shared-project-page.js   # (existing) Page controllers
│   ├── shared-rendering.js      # (existing) View components
│   └── shared-drag-drop.js      # (existing) Interactions
├── config/
│   ├── project-config.js        # Project definitions
│   └── status-config.js         # Status definitions
└── pages/
    ├── photography.html
    ├── work.html
    └── ...
```

#### Example: `task-manager.js`
```javascript
class TaskManager {
    constructor(storageManager) {
        this.storage = storageManager;
    }
    
    // Core CRUD
    create(text, projectId, options = {}) { }
    read(taskId) { }
    update(taskId, changes) { }
    delete(taskId) { }
    
    // Queries
    getByProject(projectId) { }
    getByStatus(status, projectId = null) { }
    getTopPriorities(limit = 5) { }
    
    // Operations
    moveToStatus(taskId, newStatus) { }
    reorder(taskIds, status, projectId = null) { }
    
    // Validation
    validate(task) { }
}
```

#### Example: `project-manager.js`
```javascript
class ProjectManager {
    constructor(storageManager) {
        this.storage = storageManager;
    }
    
    // Core CRUD
    create(name, priority, color) { }
    read(projectId) { }
    update(projectId, changes) { }
    delete(projectId) { }
    
    // Queries
    getAll() { }
    getByPriority(priority) { }
    
    // Operations
    updatePriority(projectId, newPriority) { }
    getTaskCount(projectId) { }
}
```

---

## Benefits of Data-Type-Driven Architecture

### 1. **Clear Ownership**
Each manager owns its data type:
- TaskManager owns Tasks
- ProjectManager owns Projects
- No confusion about where to add functionality

### 2. **Easy Testing**
Each manager can be tested independently:
```javascript
const taskManager = new TaskManager(mockStorage);
const task = taskManager.create('Test task', 'work');
assert(task.status === 'new');
```

### 3. **Predictable Growth**
Adding new features is straightforward:
- New task fields → Update Task type, add to TaskManager
- New project properties → Update Project type, add to ProjectManager
- New queries → Add to relevant manager

### 4. **Better Documentation**
Code is self-documenting:
```javascript
// Clear what this does
taskManager.moveToStatus(taskId, 'backlog');

// vs unclear current approach
moveToBacklog(ideaId);  // Is this moving an idea? A task? What's the difference?
```

### 5. **Refactoring Safety**
Changes are localized:
- Change how tasks are stored → Only modify TaskManager
- Change localStorage to IndexedDB → Only modify StorageManager
- UI remains unchanged

---

## Migration Path

### ✅ Phase 1: Shared Project Page (COMPLETE)
- Created `shared-project-page.js`
- Refactored `photography.html` as example
- Next: Update remaining project pages (work.html, life-admin.html, etc.)

### Phase 2: Extract Shared Styles (Quick Win)
1. Create `shared-styles.css`
2. Move all common CSS from HTML files
3. Link in each page: `<link rel="stylesheet" href="shared-styles.css">`
4. Remove duplicate `<style>` blocks

**Effort:** ~1 hour  
**Impact:** High (maintains visual consistency)

### Phase 3: Centralize Configuration (Simple)
1. Create `config/project-config.js`
2. Export project definitions
3. Update `shared-project-page.js` to import from config
4. Remove duplicate `PROJECT_CONFIG` objects

**Effort:** ~30 minutes  
**Impact:** Medium (single source of truth)

### Phase 4: Data Layer Refactor (Complex)
1. Create `core/storage-manager.js`
2. Create `core/task-manager.js`
3. Create `core/project-manager.js`
4. Migrate functions from `ideas-data.js`
5. Update all dependencies
6. Comprehensive testing

**Effort:** ~4-8 hours  
**Impact:** Very High (foundation for future growth)

### Phase 5: Rename "Idea" to "Task" (Breaking Change)
1. Update all function names
2. Update all variable names
3. Update localStorage keys (with migration)
4. Update UI labels
5. Update documentation

**Effort:** ~2-3 hours  
**Impact:** High (clarity, but requires careful migration)

---

## Current File Organization

```
dashboard/
├── ideas-data.js              # Monolithic data layer (to be refactored)
├── shared-rendering.js        # View components ✓
├── shared-drag-drop.js        # Drag & drop system ✓
├── shared-project-page.js     # Page controller ✓ NEW
├── photography.html           # Example: updated to use controller ✓
├── work.html                  # To update: needs controller
├── life-admin.html            # To update: needs controller
├── relationships.html         # To update: needs controller
├── living.html                # To update: needs controller
├── ideas.html                 # Main ideas page
├── finished.html              # Completed items page
└── index.html                 # Dashboard
```

---

## Next Immediate Steps

### 1. Update Remaining Project Pages (Today)
Apply the same refactor to:
- work.html
- life-admin.html  
- relationships.html
- living.html

Each takes ~5 minutes: replace inline JS with `initializeProjectPage('project-id')`.

### 2. Extract Shared CSS (This Week)
Create `shared-styles.css` and remove duplication from all HTML files.

### 3. Plan Data Layer Refactor (When Ready)
Discuss:
- Timeline for Phase 4
- Whether to rename Idea → Task now or later
- New features that would benefit from better architecture

---

## Design Principles

### 1. **Domain-Driven Design**
Code organized around business entities (Tasks, Projects) not technical concerns (storage, UI).

### 2. **Single Responsibility**
Each module has one clear job:
- TaskManager manages tasks
- ProjectManager manages projects
- StorageManager handles persistence

### 3. **Dependency Injection**
Managers receive their dependencies:
```javascript
const storage = new StorageManager();
const taskManager = new TaskManager(storage);
const projectManager = new ProjectManager(storage);
```

### 4. **Progressive Enhancement**
Each phase adds value without breaking existing functionality.

### 5. **Test-Friendly**
Modules can be tested independently with mock dependencies.

---

## Questions to Consider

### 1. **When to refactor data layer?**
- Now: If planning major new features
- Later: If current system meets needs

### 2. **Rename Idea → Task?**
- Pro: Clearer domain language
- Con: Breaking change, requires data migration
- Decision: Defer until data layer refactor

### 3. **How far to modularize?**
- Minimum: Keep current structure, just reduce duplication (✓ done)
- Medium: Extract CSS, centralize config (Phases 2-3)
- Maximum: Full domain-driven rewrite (Phase 4)

### 4. **Should we support new features first?**
Sometimes better to build features with current structure, then refactor when pain points are clear.

---

## Success Metrics

### Maintainability
- Time to add new feature: Should decrease
- Lines of duplicated code: Should approach zero
- Bug fixing: Change in one place affects everywhere

### Understandability  
- New contributors: Can understand structure quickly
- Data types: Clear what each entity represents
- Function names: Obvious what they do

### Extensibility
- Adding new project: Trivial
- Adding new task field: Localized change
- Adding new status: Defined process

---

## Conclusion

**Phase 1 is complete!** We've created a solid foundation with `shared-project-page.js`.

**Next steps:**
1. Roll out controller to remaining pages (quick win)
2. Extract shared CSS (maintainability)
3. Consider data layer refactor when ready (future growth)

The system is already more maintainable. Each future phase builds on this foundation without breaking existing functionality.

---

**Questions?** Refer to this document when planning next changes.
