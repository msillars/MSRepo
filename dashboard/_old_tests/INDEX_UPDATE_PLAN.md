# Index.html Updates Summary

## Changes Being Made:

### 1. Database Layer ✅ COMPLETE
- `ideas-data.js` now supports weight for ideas
- Automatic migration adds weight column on first load
- Weight defaults to 5 if not specified
- Maps ranking→weight intelligently (1→2, 2→4, 3→5, 4→7, 5→9)

### 2. UI Updates (index.html) - IN PROGRESS

#### A. Color Updates (Greyscale whites)
Replace pure whites with softer greys:
- `#FFFFFF` → `#FAFAFA` (backgrounds)
- `background: white` → `background: #F0F0F0` (cards)
- Keep #000 blacks for borders (good contrast)

#### B. Script Includes
Add new weight picker:
```html
<script src="shared-weight-picker.js"></script>
```

#### C. Add Topic Modal
Replace simple slider with new weight picker:
- Remove: Basic range input + preview div
- Add: Full weight picker component with ◄ ► buttons

#### D. Edit Topic Modal (NEW)
Add complete modal for editing topics:
- Topic name input
- Weight picker (same as Add Topic)
- Icon selector (optional future)
- Save/Cancel buttons

#### E. JavaScript Functions
Update these functions:
- `openAddTopicModal()` - Render weight picker
- `createNewTopic()` - Get weight from picker
- `editTopic()` - Open modal instead of prompt
- `closeEditTopicModal()` - New function
- `saveTopicEdit()` - New function

### 3. Result
✅ Database: Both topics and ideas have weight in SQL
✅ UI: Consistent weight picker for topics
✅ Visual: Softer greyscale aesthetic
⏳ Future: Add weight picker to idea editing (separate task)

### 4. Testing Needed After Changes
1. Open index.html
2. Click "Add Topic" - should see new picker
3. Try slider, ◄ ► buttons
4. Create topic - should save to database
5. Click "Edit" on existing topic - should open modal
6. Change weight - should save to database
7. Refresh - weights should persist
