# Weight System

**Last Updated:** January 16, 2026
**Status:** Draft v0.1

---

## Overview

This document defines the unified priority/weight system used across all item types.

---

## Unified Weight Scale: 1-10

All items use a single **1-10 weight scale** for priority.

| Weight | Label | Color | Use Case |
|--------|-------|-------|----------|
| 1-2 | Low | Blue (#4a90d9) | Someday/maybe, nice to have |
| 3-4 | Normal | Green (#5cb85c) | Standard priority |
| 5-6 | Important | Yellow (#f0ad4e) | Should do soon |
| 7-8 | High | Orange (#fd7e14) | Do this week |
| 9-10 | Critical | Red (#d9534f) | Do today, urgent |

### Default Weights by Item Type

| Item Type | Default Weight | Rationale |
|-----------|----------------|-----------|
| Topic | 5 | Ongoing areas, neutral priority |
| Project | 5 | Inherits context from topic |
| Task | 5 | Neutral until prioritized |
| Idea | 3 | Low until promoted/evaluated |
| Reminder | 7 | Time-sensitive, needs attention |

---

## Legacy Mapping

### Ranking (1-5) → Weight (1-10)

The legacy `ranking` field (1-5) maps to weight as follows:

| Ranking | Weight | Calculation |
|---------|--------|-------------|
| 1 | 2 | Low priority |
| 2 | 4 | Below normal |
| 3 | 5 | Normal (default) |
| 4 | 7 | High priority |
| 5 | 9 | Critical |

**Formula:** `weight = (ranking - 1) * 2 + 1` (approximately)

### Migration

During the transition period:
- Legacy `ideas` table keeps `ranking` for backward compatibility
- Unified `items` table uses `weight`
- UI displays weight where available, falls back to converted ranking

---

## UI Display

### Weight Badge

```html
<div class="weight-badge" style="background: ${getWeightColor(weight)}">
    ${weight}
</div>
```

### Weight Picker Component

A horizontal slider or button group allowing selection of 1-10:

```
Priority: [1][2][3][4][5][6][7][8][9][10]
           ▲ Low        Normal        Critical ▲
```

Or simplified 5-level picker that maps to weight:

```
Priority: [Low][Normal][Important][High][Critical]
              2     5        6       8      10
```

---

## Weight Inheritance

**Weights do NOT inherit.** Each item has its own independent weight.

However, views can aggregate weights for display:
- A topic's "effective priority" could be the max weight of its active tasks
- A project's progress bar could show weighted completion

---

## Sorting by Weight

Default sort order: **Higher weight first** (descending)

```sql
ORDER BY weight DESC, created_at DESC
```

This surfaces urgent items at the top.

---

## Related Functions

### In `weight-utils.js`:

```javascript
// Get color for weight value
function getWeightColor(weight) { ... }

// Convert legacy ranking to weight
function rankingToWeight(ranking) {
    const map = { 1: 2, 2: 4, 3: 5, 4: 7, 5: 9 };
    return map[ranking] || 5;
}

// Convert weight to legacy ranking (for backward compat)
function weightToRanking(weight) {
    if (weight <= 2) return 1;
    if (weight <= 4) return 2;
    if (weight <= 6) return 3;
    if (weight <= 8) return 4;
    return 5;
}
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-16 | Initial draft - unified 1-10 scale |
