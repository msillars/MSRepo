# Phase 3 Quick Reference: SQL-Backed Data Layer

## What You Need To Know

Your `ideas-data.js` now uses SQL instead of localStorage. **Everything works the same from the outside** - all function calls are identical, but the data now lives in a proper database.

## Common Operations

### Reading Data
```javascript
// Get all ideas (from SQL)
const ideas = getIdeas();

// Get all projects (from SQL)
const projects = getProjects();

// Get ideas by status (SQL: WHERE status = ?)
const newIdeas = getIdeasByStatus('new');
const backlogIdeas = getIdeasByStatus('backlog', 'work'); // Filter by project too

// Get ideas by project (SQL: WHERE project = ?)
const workIdeas = getIdeasByProject('work');

// Get top priorities (calculated from SQL data)
const priorities = getTopPriorities(5);
```

### Adding Data
```javascript
// Add new idea (SQL: INSERT INTO ideas)
const newIdea = addIdea('Task text', 'work', 5, 'hard', 'new');

// Add new project (SQL: INSERT INTO projects)
const projectId = addProject('My Project', 'priority', 'icon.ICO');
```

### Updating Data
```javascript
// Update idea (SQL: UPDATE ideas WHERE id = ?)
updateIdea(ideaId, {
    text: 'Updated text',
    ranking: 4,
    difficulty: 'medium'
});

// Update project (SQL: UPDATE projects WHERE id = ?)
updateProject('work', {
    priority: 'urgent',
    color: '#FF0000'
});
```

### Moving Between Statuses
```javascript
// Move to different status (SQL: UPDATE ideas SET status = ?, order = ?)
moveToNew(ideaId);
moveToBacklog(ideaId);
moveToDone(ideaId);
```

### Reordering
```javascript
// Reorder ideas in a list (SQL: UPDATE ideas SET order = ? WHERE id = ?)
const orderedIds = [id1, id2, id3, id4];
reorderIdeas(orderedIds, 'new', 'work');
```

### Deleting Data
```javascript
// Delete idea (SQL: DELETE FROM ideas WHERE id = ?)
deleteIdea(ideaId);
```

## Debugging

### Check Database State
```javascript
// Get statistics
const stats = getDatabaseStats();
console.log(stats);
// Output: { initialized: true, ideas: 41, projects: 9, byStatus: {...} }
```

### Export Database
```javascript
// Export as JSON for inspection
const jsonData = exportDatabaseAsJSON();
console.log(jsonData);
```

### View Console Logs
When `DEBUG_MODE = true`, all operations log to console:
```
[DATA] IDEAS_LOADED: { count: 41 }
[DATA] IDEA_UPDATED: { ideaId: 123, updates: {...} }
[DATA] BACKUP_CREATED: { key: 'management_system_backup_...', label: 'auto' }
```

## Data Structure

### Idea Object
```javascript
{
    id: 1730728800000,          // Unique ID (timestamp)
    text: "Task description",    // Task text
    project: "work",             // Project ID
    ranking: 5,                  // Priority 1-5
    difficulty: "hard",          // easy, medium, hard
    status: "new",               // new, backlog, done
    order: 0,                    // Position in list
    timestamp: "2024-11-04T...", // Created timestamp
    status_changed_at: "..."     // When status last changed
}
```

### Project Object
```javascript
{
    id: "work",                 // Unique project ID
    name: "Work",               // Display name
    priority: "urgent",         // Priority level
    color: "#004E89",           // Color code
    icon: "Work.ICO"            // Icon filename
}
```

## Backup & Recovery

### Automatic Backups
Every write operation creates an automatic backup:
```javascript
createBackup('manual-backup'); // Manual backup
```

### List Backups
```javascript
const backups = listBackups();
// Returns: [{ key, label, timestamp, date }, ...]
```

### Restore From Backup
```javascript
const backupKey = 'management_system_backup_auto_2024-11-04T...';
restoreFromBackup(backupKey);
```

### Export/Import
```javascript
// Export everything as JSON string
const jsonString = exportAllData();

// Import from JSON string
importData(jsonString);
```

## Events

### Listen for Changes
All write operations dispatch an event for cross-tab sync:
```javascript
window.addEventListener('ideasUpdated', () => {
    console.log('Data changed! Reload UI...');
    refreshDisplay();
});
```

## Performance Tips

### 1. Use Specific Queries
```javascript
// ❌ Slow - loads everything then filters in JavaScript
const ideas = getIdeas().filter(i => i.status === 'new');

// ✅ Fast - filters in SQL
const ideas = getIdeasByStatus('new');
```

### 2. Batch Updates
```javascript
// ❌ Slow - multiple database writes
ideas.forEach(idea => updateIdea(idea.id, {...}));

// ✅ Fast - single database write
const updated = ideas.map(i => ({...i, ...changes}));
saveIdeas(updated);
```

### 3. Use Counts Wisely
```javascript
// Get counts without loading all data
const counts = getIdeaCounts();
console.log(counts.byStatus.new); // Just the count
```

## Validation

All data is validated before being saved:
- Text must be non-empty string
- ID must be number or string
- Status must be: new, backlog, or done
- Ranking must be 1-5
- Difficulty must be: easy, medium, or hard

Invalid data will not be saved and will log an error.

## Migration Status

✅ **Phase 3 Complete:** ideas-data.js now uses SQL
📍 **Current State:** Dual-storage (localStorage backup + SQL active)
🎯 **Next Phase:** Update controllers to optimize SQL usage

## Questions?

- All functions work the same as before
- Data is in SQL but localStorage remains as backup
- No breaking changes to existing code
- All validation rules still apply
- Cross-tab sync still works
- Automatic backups still happen

---

**Last Updated:** November 4, 2025
**Version:** Phase 3 - SQL Backend
