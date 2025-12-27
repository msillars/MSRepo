# Testing Guide - Management System v2.0

## Quick Verification Checklist

Test these features to ensure everything is working correctly.

---

## ✅ Test 1: Basic Idea Creation

1. Open `ideas.html`
2. Type "Test idea 1" in the input box
3. Select a project (e.g., "Work")
4. Choose difficulty: Medium
5. Select ranking: 3
6. Click **Add** button

**Expected Result:** 
- Card appears in "Ideas" column (left side)
- Counter shows "1 item"
- Card displays correct project color, difficulty, and ranking

---

## ✅ Test 2: Drag & Drop Within List

1. Add 3 more test ideas (so you have 4 total)
2. Drag the bottom card to the top
3. Release to drop

**Expected Result:**
- Card moves to top position
- Other cards shift down
- Order is preserved after page refresh

---

## ✅ Test 3: Move Between Lists (Drag)

1. Drag a card from "Ideas" column
2. Drop it in "Backlog" column

**Expected Result:**
- Card moves to Backlog
- Ideas counter decreases by 1
- Backlog counter increases by 1
- Card retains all its properties

---

## ✅ Test 4: Move Between Lists (Button)

1. Click **→ To Backlog** on an idea card
2. Verify card moves to backlog
3. Click **← To Ideas** on the moved card
4. Verify it returns to ideas

**Expected Result:**
- Cards move correctly both directions
- Counters update properly
- No data loss

---

## ✅ Test 5: Mark as Done

1. Click **✓ Done** on any card
2. Verify card disappears from current list

**Expected Result:**
- Card is removed from view
- Counter decreases
- Data is preserved (check console: `getIdeasByStatus('done')`)

---

## ✅ Test 6: Edit Card

1. Click **Edit** on any card
2. Change the text
3. Change difficulty to "Hard"
4. Change ranking to "5"
5. Click **Save**

**Expected Result:**
- Text updates in card
- Difficulty color changes to red
- Ranking badge updates to 5
- Border color changes (higher ranking)

---

## ✅ Test 7: Finished Items Page

1. Click **✓ Finished Items** button (green, top right)
2. Verify you see completed items

**Expected Result:**
- Page shows all items with status "done"
- Correct project colors displayed
- "COMPLETED" badge shown on each card

---

## ✅ Test 8: Restore from Finished

1. On finished.html page
2. Click **↺ Restore to Backlog** on any item
3. Go back to ideas.html
4. Check backlog column

**Expected Result:**
- Item appears in backlog
- All properties preserved
- No longer in finished list

---

## ✅ Test 9: Project Page Navigation

1. Go to Dashboard (index.html)
2. Click on "Work" project
3. Verify you see 3 columns: Ideas, Backlog, Done
4. Verify only "Work" project items shown

**Expected Result:**
- Only Work items displayed
- All three columns visible
- Can drag & drop between columns
- Can mark items as done

---

## ✅ Test 10: Data Persistence

1. Add several test items
2. Move some to backlog
3. Mark some as done
4. Close browser completely
5. Reopen and navigate back to site

**Expected Result:**
- All data is still there
- Items in correct lists
- Counters accurate
- Order preserved

---

## ✅ Test 11: Backup System

1. Open browser console (F12)
2. Type: `listBackups()`
3. Verify you see backup entries

**Expected Result:**
- Array of backups displayed
- Recent timestamps
- Different labels (auto, ideas-save, etc.)

---

## ✅ Test 12: Data Export

1. Open console
2. Type: `exportAllData()`
3. Copy the JSON output
4. Type: `createBackup('before-test')`
5. Delete an idea
6. Type: `listBackups()`
7. Find your 'before-test' backup
8. Type: `restoreFromBackup('management_system_backup_before-test_...')`

**Expected Result:**
- Export produces valid JSON
- Manual backup created
- Restore brings back deleted item
- No errors in console

---

## ✅ Test 13: Validation

1. Open console
2. Type: `getIdeas()[0]`
3. Note the structure
4. Try: `validateIdea(getIdeas()[0])`

**Expected Result:**
- Returns: `{ valid: true, errors: [] }`
- No console errors
- Data structure is correct

---

## ✅ Test 14: Cross-List Drag

1. Create item in Ideas
2. Drag from Ideas column
3. Drop into Backlog column (between two existing items)

**Expected Result:**
- Item changes status AND position
- Inserted at correct position
- Both old and new lists reorder properly

---

## ✅ Test 15: Debug Logging

1. Open console
2. Add a new idea
3. Look for `[DATA]` prefixed messages

**Expected Result:**
- See backup creation log
- See ideas saved log
- Logs show operation details
- No red errors

---

## 🐛 Common Issues & Solutions

### Issue: Cards not saving
**Solution:** 
- Check console for validation errors
- Ensure all fields have values
- Try: `validateIdea(getIdeas()[0])`

### Issue: Drag & drop not working
**Solution:**
- Ensure browser is modern (Chrome, Firefox, Safari, Edge)
- Check if JavaScript is enabled
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Data disappeared
**Solution:**
- Check: `getIdeas()` in console
- If empty, restore from backup: `listBackups()`
- If backups empty, check if localStorage was cleared

### Issue: Counters wrong
**Solution:**
- Hard refresh page (Ctrl+Shift+R)
- Check actual count: `getIdeasByStatus('new').length`
- If mismatch persists, restore from backup

### Issue: Can't see finished items
**Solution:**
- Check: `getIdeasByStatus('done')`
- If items exist but page empty, check browser console for errors
- Try different browser

---

## 🎯 Stress Test

For thorough testing:

1. **Create 20 ideas** across different projects
2. **Move 10 to backlog** using both drag and buttons
3. **Mark 5 as done**
4. **Reorder items** in each list
5. **Edit several items**
6. **Close and reopen** browser
7. **Check all data** persisted correctly

**Expected Result:** Everything works smoothly with no data loss.

---

## 📊 Performance Benchmarks

Normal performance expectations:

- **Page load:** < 500ms
- **Add idea:** Instant
- **Drag & drop:** Smooth 60fps
- **Status change:** Instant
- **Edit save:** Instant
- **List refresh:** < 100ms

If slower, check:
- How many ideas in system (1000+ may slow things)
- Browser extensions interfering
- Console errors

---

## ✨ Advanced Testing

For power users:

### Test Concurrent Edits
1. Open same page in two tabs
2. Edit different items in each
3. Refresh both

**Expected:** Last save wins (localStorage limitation)

### Test Backup Rotation
1. Create 15+ backups by making changes
2. Type: `listBackups()`
3. Verify only ~10 most recent kept

**Expected:** Oldest backups auto-deleted

### Test Large Dataset
1. Create backup: `createBackup('before-stress')`
2. Add 100 ideas programmatically:
```javascript
for(let i = 0; i < 100; i++) {
  addIdea(`Test idea ${i}`, 'work', 3, 'medium', 'new');
}
```
3. Test drag & drop performance
4. Restore if needed: `restoreFromBackup('...')`

**Expected:** Still performs well up to ~500 items

---

## 🔍 Debugging Checklist

If something seems broken:

1. ✅ Check browser console for errors
2. ✅ Verify DEBUG_MODE is true in ideas-data.js
3. ✅ Clear browser cache and try again
4. ✅ Test in private/incognito window
5. ✅ Try different browser
6. ✅ Check localStorage isn't full
7. ✅ Verify no browser extensions interfering
8. ✅ Look for `[DATA]` logs in console
9. ✅ Try restoring from backup
10. ✅ Export data before making major changes

---

## 📝 Test Results Template

Copy this to track your testing:

```
MANAGEMENT SYSTEM v2.0 - TEST RESULTS
Date: __________
Browser: __________

☐ Test 1: Basic Idea Creation - PASS / FAIL
☐ Test 2: Drag & Drop Within List - PASS / FAIL
☐ Test 3: Move Between Lists (Drag) - PASS / FAIL
☐ Test 4: Move Between Lists (Button) - PASS / FAIL
☐ Test 5: Mark as Done - PASS / FAIL
☐ Test 6: Edit Card - PASS / FAIL
☐ Test 7: Finished Items Page - PASS / FAIL
☐ Test 8: Restore from Finished - PASS / FAIL
☐ Test 9: Project Page Navigation - PASS / FAIL
☐ Test 10: Data Persistence - PASS / FAIL
☐ Test 11: Backup System - PASS / FAIL
☐ Test 12: Data Export - PASS / FAIL
☐ Test 13: Validation - PASS / FAIL
☐ Test 14: Cross-List Drag - PASS / FAIL
☐ Test 15: Debug Logging - PASS / FAIL

Notes:
________________
________________
________________

Overall Status: PASS / FAIL
```

---

## 🎉 If All Tests Pass

Congratulations! Your Management System v2.0 is working perfectly. You can now:

1. Start using it for real work
2. Export your data for safekeeping
3. Explore advanced features
4. Customize as needed

---

## 🆘 If Tests Fail

1. Note which specific test failed
2. Check console for error messages
3. Review the UPDATE_NOTES.md
4. Check DATA_RECOVERY.md for recovery options
5. Try restoring from a backup
6. Export data before attempting fixes

---

**Testing completed on:** ___________
**Results:** ___________
**Notes:** ___________

