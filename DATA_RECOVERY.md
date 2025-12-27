# Data Recovery Quick Reference

## Emergency Commands (Browser Console)

Open browser console: **F12** or **Cmd/Option + I**

---

## View Available Backups

```javascript
listBackups()
```

Returns an array of all backups with timestamps. Example output:
```javascript
[
  {
    key: "management_system_backup_auto_2025-10-30T10:30:00.000Z",
    label: "auto",
    timestamp: "2025-10-30T10:30:00.000Z",
    date: Date object
  },
  ...
]
```

---

## Restore from Backup

```javascript
restoreFromBackup('management_system_backup_auto_2025-10-30T10:30:00.000Z')
```

⚠️ **This will replace current data with backup data!**
✅ A backup of current state is created before restoring.

---

## Export All Data

```javascript
const backup = exportAllData();
console.log(backup);
```

Then:
1. Right-click the output in console
2. Copy the JSON
3. Save to a `.json` file

---

## Import Data

```javascript
const jsonData = '...'; // Paste your exported JSON here
importData(jsonData);
```

⚠️ **This will replace current data!**
✅ A backup is created before importing.

---

## Manual Backup

```javascript
createBackup('my-manual-backup')
```

Creates a backup with a custom label for easy identification.

---

## View Current Data

### All Ideas
```javascript
getIdeas()
```

### Ideas by Status
```javascript
getIdeasByStatus('new')      // All new ideas
getIdeasByStatus('backlog')  // All backlog items
getIdeasByStatus('done')     // All finished items
```

### Ideas by Project
```javascript
getIdeasByProject('work')         // Work project
getIdeasByProject('photography')  // Photography project
```

### Ideas by Status AND Project
```javascript
getIdeasByStatus('backlog', 'work')  // Work backlog items
```

---

## Statistics

```javascript
getIdeaCounts()
```

Returns:
```javascript
{
  byProject: {
    'work': 15,
    'photography': 8,
    ...
  },
  byStatus: {
    'new': 42,
    'backlog': 5,
    'done': 128
  }
}
```

---

## Clear All Data (DANGER!)

```javascript
// Create backup first!
createBackup('before-clear');

// Then clear
localStorage.clear();
```

⚠️ **WARNING**: This deletes EVERYTHING. Make sure you have an export first!

---

## Verify Data Integrity

```javascript
const ideas = getIdeas();
ideas.forEach((idea, index) => {
  const validation = validateIdea(idea);
  if (!validation.valid) {
    console.error(`Idea ${index} is invalid:`, validation.errors, idea);
  }
});
```

---

## Find Specific Idea

```javascript
const ideas = getIdeas();
const myIdea = ideas.find(i => i.text.includes('search term'));
console.log(myIdea);
```

---

## Bulk Status Change

```javascript
// Move all 'new' ideas to 'backlog'
const newIdeas = getIdeasByStatus('new');
newIdeas.forEach(idea => {
  moveToBacklog(idea.id);
});
```

---

## Debug Mode Toggle

In `ideas-data.js`, line 8:
```javascript
const DEBUG_MODE = true;  // Set to false to disable debug logging
```

---

## Common Recovery Scenarios

### Scenario 1: Accidentally Deleted Important Item
```javascript
// 1. List recent backups
listBackups()

// 2. Find backup from before deletion
// 3. Restore it
restoreFromBackup('backup_key_here')
```

### Scenario 2: Data Looks Corrupted
```javascript
// 1. Export current state (just in case)
const backup = exportAllData();
console.log(backup);
// Copy this somewhere safe

// 2. List backups
listBackups()

// 3. Try most recent good backup
restoreFromBackup('backup_key_here')
```

### Scenario 3: Moving to New Browser/Computer
```javascript
// OLD BROWSER:
const backup = exportAllData();
console.log(backup);
// Copy the output

// NEW BROWSER:
// 1. Paste the JSON data
const jsonData = '...'; 
// 2. Import
importData(jsonData);
```

### Scenario 4: Want Fresh Start (Keep Backup)
```javascript
// 1. Export everything
const backup = exportAllData();
console.log(backup);
// SAVE THIS SOMEWHERE!

// 2. Create manual backup
createBackup('before-reset');

// 3. Clear localStorage
localStorage.clear();

// 4. Refresh page
location.reload();
```

---

## Keyboard Shortcuts in Console

- `↑` / `↓` - Navigate command history
- `Tab` - Autocomplete
- `Ctrl + L` - Clear console
- `Ctrl + F` - Find in console output

---

## Backup File Locations

All backups stored in:
```
localStorage → management_system_backup_*
```

To see all keys:
```javascript
Object.keys(localStorage).filter(k => k.startsWith('management_system'))
```

---

## Pro Tips

1. **Regular Exports**: Weekly export for peace of mind
2. **Named Backups**: Before major changes, create named backup
3. **Test Restore**: Occasionally verify backups work
4. **Console Bookmark**: Keep this page bookmarked for quick access
5. **Multiple Exports**: Keep 2-3 dated export files

---

## Support Functions

All these functions are available in the browser console:

**Data Access:**
- `getIdeas()` - All ideas
- `getProjects()` - All projects
- `getIdeasByStatus(status, projectId?)` - Filtered ideas
- `getIdeasByProject(projectId)` - Project ideas
- `getIdeaCounts()` - Statistics

**Data Modification:**
- `addIdea(text, project, ranking, difficulty, status)` - Add new
- `updateIdea(ideaId, updates)` - Update existing
- `deleteIdea(ideaId)` - Remove idea
- `moveToBacklog(ideaId)` - Change status
- `moveToDone(ideaId)` - Mark complete
- `moveToNew(ideaId)` - Reset to new

**Backup & Recovery:**
- `createBackup(label)` - Manual backup
- `listBackups()` - View all backups
- `restoreFromBackup(key)` - Restore backup
- `exportAllData()` - Export to JSON
- `importData(json)` - Import from JSON

**Validation:**
- `validateIdea(idea)` - Check single idea
- `validateIdeasArray(ideas)` - Check multiple

---

**Keep this document handy for emergencies!**

Last Updated: October 30, 2025
