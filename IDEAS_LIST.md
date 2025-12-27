# Ideas List Feature

## What's New

The management system now has an integrated **Ideas List** for capturing and organizing thoughts across all your projects.

## Features

### Quick Capture
- **Big text box** - Just start typing
- **Tag to project** - Assign to Photography, Work, Life Admin, Relationships, or Living
- **Auto-timestamp** - Automatically records when you captured the idea
- **Keyboard shortcut** - Ctrl/Cmd + Enter to capture quickly

### Chronological Stream
- **Newest first** - See your most recent ideas at the top
- **Visual tags** - Color-coded project tags for quick scanning
- **Relative timestamps** - "2h ago", "3d ago", or formatted dates
- **At-a-glance** - See all ideas across all projects in one view

### Integration with Dashboard
- **💡 Ideas button** - Quick access from main dashboard
- **Idea counts** - Each domain card shows how many ideas are tagged to it
- **Total count** - See total ideas in the header button

### Idea Management
- **Promote to Backlog** - Convert ideas into actionable tasks (coming soon - full integration)
- **Delete** - Remove ideas you no longer need
- **Persistent storage** - Uses localStorage, so your ideas persist across sessions

## How to Use

### Capturing Ideas

1. **From Dashboard:**
   - Click "💡 Ideas (0)" button in header
   
2. **On Ideas Page:**
   - Type your idea in the text box
   - Select which project it relates to
   - Click "Add Idea" or press Ctrl/Cmd + Enter

### Reviewing Ideas

- **All ideas** are shown in chronological order (newest first)
- **Filter by project** by looking at the colored tags
- **See idea counts** on each domain card on the dashboard

### Promoting Ideas to Backlog

Currently shows an alert (placeholder). Future integration will:
- Move idea to project backlog
- Add ability to add subtasks, dependencies, due dates
- Track status: reviewed → backlog → done

## Data Storage

- **Local storage** - All ideas saved in your browser's localStorage
- **No server needed** - Works entirely offline
- **Export/Import** - Can backup/restore via browser console if needed

### To Export Ideas (for backup):
```javascript
console.log(IdeasData.exportData());
// Copy the output and save it
```

### To Import Ideas (restore):
```javascript
IdeasData.importData(/* paste exported JSON here */);
```

## File Structure

```
dashboard/
├── index.html          ← Main dashboard (updated with ideas integration)
├── ideas.html          ← New ideas list page
└── ideas-data.js       ← New shared data manager
```

## Future Enhancements

Planned features:
- [ ] Full backlog integration with each project
- [ ] Status tracking (idea → reviewed → backlog → done)
- [ ] Subtasks and dependencies
- [ ] Due dates and priorities
- [ ] Search and filter
- [ ] Export to other formats (CSV, Markdown)
- [ ] Mobile app synchronization

## Quick Tips

1. **Capture everything** - Don't filter while capturing, just write it down
2. **Tag correctly** - Proper tagging helps when reviewing in project context
3. **Review regularly** - Check project idea counts and promote relevant ones
4. **Don't over-organize** - Keep the capture friction-free, organize later

## Technical Notes

- Uses vanilla JavaScript (no frameworks)
- LocalStorage for persistence
- Responsive design (works on mobile browsers)
- No external dependencies
- All data stored client-side

---

**Built:** October 2024  
**Integration:** Management System v2
