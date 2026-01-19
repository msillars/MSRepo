# Terminology & Naming Conventions

**Last Updated:** January 16, 2026
**Status:** Draft v0.1

---

## Overview

This document defines the official terminology for the Management System and documents the historical naming issues that need resolution.

---

## Official Terminology

### Entity Types

| Term | Definition | Database `item_type` |
|------|------------|---------------------|
| **Topic** | An ongoing area of focus that is never "done". The top-level container. | `topic` |
| **Project** | A finite endeavor with a clear end state. Lives under a Topic. | `project` |
| **Task** | An atomic, completable unit of work. Lives under a Topic or Project. | `task` |
| **Idea** | A quick capture requiring minimal information. Entry point for all items. | `idea` |
| **Reminder** | A time-sensitive prompt with a due date. | `reminder` |

### Hierarchy

```
Topic (ongoing container)
  └── Project (finite goal)
        └── Task (atomic action)
              └── Subtask (nested task)
```

### Key Distinctions

| Concept | Topic | Project |
|---------|-------|---------|
| Duration | Ongoing, never "done" | Finite, has end state |
| Purpose | Required (why does this exist?) | Implied by goal |
| Children | Projects, Tasks, Ideas | Tasks only |
| Examples | "Photography", "Health", "Career" | "Build portfolio site", "Plan holiday" |

---

## Historical Naming Issues

The codebase has inconsistent use of "project" and "topic" due to evolution over time.

### Current State (January 2026)

| Location | Uses "project" to mean | Should be |
|----------|------------------------|-----------|
| `ideas` table column | Topic (the container) | `topic` (correct in schema) |
| CSS classes in `index.html` | Topic cards | Rename to `.topic-*` |
| `shared-rendering.js` | Topic | Rename parameters |
| `shared-topic-page.js` | Topic | Rename parameters |
| `shared-drag-drop.js` | Topic | Rename parameters |
| `ideas.html` dropdown | Topic | Rename to `topic-select` |
| `finished.html` filter | Topic | Rename to `topic-filter` |
| Variable names | Mixed | Standardize |

### Database Schema Status

**Legacy `ideas` table:**
```sql
-- Column is correctly named 'topic'
topic TEXT NOT NULL DEFAULT 'untagged'
```

**Unified `items` table:**
```sql
-- Correct: uses topic_id and item_type='project' is distinct
topic_id INTEGER  -- FK to root topic
item_type TEXT    -- 'project' is a separate type from 'topic'
```

The database is correct. The issue is in UI/JS code.

---

## Migration Plan: Naming Cleanup

### Phase 1: CSS Class Renames (Low Risk)

In `index.html`, rename:
- `.projects-section` → `.topics-section`
- `.projects-grid` → `.topics-grid`
- `.project-card` → `.topic-card`
- `.project-card-body` → `.topic-card-body`
- `.project-weight` → `.topic-weight`
- `.project-header` → `.topic-header`
- `.project-icon` → `.topic-icon`
- `.project-name` → `.topic-name`
- `.project-ideas-count` → `.topic-ideas-count`
- `.project-actions` → `.topic-actions`
- `.project-btn` → `.topic-btn`
- `.add-project-card` → `.add-topic-card`
- `.add-project-content` → `.add-topic-content`
- `.add-project-icon` → `.add-topic-icon`

### Phase 2: JavaScript Variable/Parameter Renames (Medium Risk)

| File | Change |
|------|--------|
| `shared-rendering.js` | `showProject` → `showTopic`, `projectName` → `topicName`, `projects` → `topics` |
| `shared-topic-page.js` | `projectId` → `topicId` in render options |
| `shared-drag-drop.js` | `projectId` → `topicId` |
| `ideas.html` | `project-select` → `topic-select`, `loadProjectOptions` → `loadTopicOptions` |
| `finished.html` | `project-filter` → `topic-filter`, `loadProjectFilter` → `loadTopicFilter` |
| `index.html` | `loadProjectCards` → `loadTopicCards`, `PROJECT_ICON_FILES` → `TOPIC_ICON_FILES` |

### Phase 3: Introduce Real "Project" Entity

Once naming is clean, "project" will exclusively mean:
- `item_type = 'project'` in the database
- A finite container under a Topic
- Distinct from Topic in UI

---

## Reserved Terms

These terms have specific meanings. Do not use them interchangeably:

| Term | Meaning | Do NOT use for |
|------|---------|----------------|
| Topic | Ongoing container | Finite projects |
| Project | Finite goal | Topics/categories |
| Task | Atomic action | Projects or ideas |
| Idea | Raw capture | Processed tasks |
| Item | Generic entity | Specific types |
| Parent | Direct container | Root topic |
| Weight | 1-10 priority | Status or ranking |
| Status | new/backlog/done | Type or priority |

---

## Code Style Guide

### Naming Conventions

```javascript
// Variables referring to topics
const topicId = 'photography';
const currentTopic = getItem(topicId);
const allTopics = getItemsByType('topic');

// Variables referring to projects (finite goals)
const projectId = 123;
const currentProject = getItem(projectId);
const topicProjects = getChildItems(topicId).filter(i => i.item_type === 'project');

// Variables referring to tasks
const taskId = 456;
const projectTasks = getChildItems(projectId);

// Generic item references
const itemId = someId;
const item = getItem(itemId);
```

### Function Naming

```javascript
// Good: specific to entity type
loadTopicCards()
renderTaskList()
createProject()

// Bad: ambiguous
loadCards()        // What kind?
renderList()       // Of what?
create()           // Create what?
```

### CSS Class Naming

```css
/* Good: entity-specific */
.topic-card { }
.project-header { }
.task-item { }

/* Bad: generic or wrong entity */
.card { }          /* What kind? */
.project-card { }  /* If it's actually a topic */
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-16 | Initial draft documenting naming issues |
| 2026-01-16 | Completed Phase 1 & 2: CSS classes and JS renamed in index.html, ideas.html, finished.html, shared-*.js |
