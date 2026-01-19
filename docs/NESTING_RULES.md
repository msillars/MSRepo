# Subtask Nesting Rules

**Last Updated:** January 16, 2026
**Status:** Draft v0.1

---

## Overview

This document defines the rules for how items can contain other items (nesting/hierarchy).

---

## Core Rules

### 1. Nesting Depth

| Container | Can Contain | Max Depth |
|-----------|-------------|-----------|
| Topic | Projects, Tasks, Ideas | - |
| Project | Tasks (unlimited) | Tasks can have subtasks |
| Task | Subtasks (max 3) | **1 level only** |
| Subtask | Nothing | Leaf node |
| Idea | Nothing (until promoted) | - |
| Reminder | Nothing | Leaf node |

**Key constraint:** A Task can have at most **3 subtasks**, and subtasks cannot have their own children.

### 2. Hierarchy Diagram

```
Topic (ongoing)
  ├── Project (finite goal)
  │     ├── Task
  │     │     ├── Subtask (max 3)
  │     │     ├── Subtask
  │     │     └── Subtask
  │     ├── Task
  │     └── Task
  │
  ├── Task (standalone, under topic directly)
  │     ├── Subtask (max 3)
  │     └── Subtask
  │
  └── Idea (unpromoted)
```

### 3. Auto-Promotion Rules

| Trigger | Action |
|---------|--------|
| Task has 3 subtasks, user tries to add 4th | Prompt: "This task has reached its subtask limit. Convert to Project?" |
| User confirms | Task becomes Project, can now have unlimited Tasks as children |
| User declines | Action cancelled, subtask not added |

**Note:** Tasks do NOT auto-promote silently. The promotion only happens when the limit is hit and the user confirms.

### 4. Completion Rules

| Action | Result |
|--------|--------|
| Mark Task as done | All subtasks auto-marked as done |
| Mark Project as done | All child Tasks (and their subtasks) auto-marked as done |
| Mark Topic as done | **Not allowed** - Topics are ongoing |
| Reopen parent | Children remain done (user must reopen individually if needed) |

**Cascading completion:** When a parent is completed, completion cascades DOWN to all descendants.

---

## Implementation Details

### Database Representation

Subtasks are stored in the same `items` table with:
- `parent_id` pointing to the parent Task
- `item_type = 'task'` (subtasks are just tasks with a parent)
- `topic_id` pointing to the root Topic (denormalized for fast queries)

```sql
-- Example: Task with 2 subtasks
-- Parent task
INSERT INTO items (id, text, parent_id, topic_id, item_type)
VALUES (100, 'Write documentation', 50, 10, 'task');

-- Subtasks
INSERT INTO items (id, text, parent_id, topic_id, item_type)
VALUES (101, 'Write overview section', 100, 10, 'task');
INSERT INTO items (id, text, parent_id, topic_id, item_type)
VALUES (102, 'Add code examples', 100, 10, 'task');
```

### Validation Rules

```javascript
// Before adding a subtask
function canAddSubtask(parentId) {
    const parent = getItem(parentId);

    // Only tasks can have subtasks
    if (parent.item_type !== 'task') {
        return { allowed: false, reason: 'Only tasks can have subtasks' };
    }

    // Check if parent is already a subtask (no nesting beyond 1 level)
    if (parent.parent_id) {
        const grandparent = getItem(parent.parent_id);
        if (grandparent && grandparent.item_type === 'task') {
            return { allowed: false, reason: 'Subtasks cannot have their own subtasks' };
        }
    }

    // Check subtask count limit
    const existingSubtasks = getChildItems(parentId);
    if (existingSubtasks.length >= 3) {
        return {
            allowed: false,
            reason: 'limit_reached',
            prompt: 'This task has reached its subtask limit (3). Convert to Project?'
        };
    }

    return { allowed: true };
}
```

### Completion Cascade

```javascript
function completeItem(itemId) {
    const item = getItem(itemId);

    // Topics cannot be completed
    if (item.item_type === 'topic') {
        return { success: false, reason: 'Topics cannot be marked as done' };
    }

    // Mark this item as done
    updateItem(itemId, {
        status: 'done',
        completed_at: new Date().toISOString()
    });

    // Cascade to all children
    const children = getChildItems(itemId);
    children.forEach(child => {
        completeItem(child.id);  // Recursive cascade
    });

    return { success: true };
}
```

---

## UI Behavior

### Adding Subtasks

1. User clicks "Add subtask" on a Task
2. System checks `canAddSubtask(taskId)`
3. If allowed: Show inline input for subtask text
4. If limit reached: Show modal "Convert to Project?"
   - Yes → Convert task to project, then add as child task
   - No → Cancel, show message "Subtask limit reached"

### Visual Representation

```
┌─────────────────────────────────────────┐
│ ☐ Write documentation            [8]    │  ← Task
│   ├─ ☐ Write overview section           │  ← Subtask (indented)
│   ├─ ☐ Add code examples                │  ← Subtask
│   └─ ☑ Create diagrams                  │  ← Subtask (done)
│                            [+ Add] (0/3)│  ← Counter shows limit
└─────────────────────────────────────────┘
```

When at limit (3/3):
```
│                      [Convert to Project]│  ← Replaces Add button
```

### Completing a Task with Subtasks

1. User clicks checkbox on parent Task
2. Confirmation: "Complete this task and all 2 subtasks?"
3. Yes → Parent and all subtasks marked done
4. No → Cancel

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Delete task with subtasks | Prompt: "Delete task and X subtasks?" |
| Move task with subtasks to different topic | Subtasks move with it, topic_id updated |
| Promote task (with subtasks) to project | Subtasks become regular child tasks |
| Demote project to task | Only allowed if ≤3 child tasks, they become subtasks |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-16 | Initial draft with nesting rules |
