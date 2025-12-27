# Quick Update Guide for Remaining Topic Pages

This guide shows exactly what to copy and paste to update the 4 remaining topic pages:
- life-admin.html
- relationships.html
- living.html
- creating-this-dashboard.html

## STEP 1: Add CSS Link

**Location:** In the `<head>` section  
**After this line:**
```html
<link rel="icon" type="image/x-icon" href="../Icons/FavIco.ICO">
```

**Add this line:**
```html
<link rel="stylesheet" href="edit-modal.css">
```

---

## STEP 2: Add CSS Style

**Location:** In the `<style>` section  
**After this line:**
```css
.idea-difficulty { padding: 4px 8px; border: 1px solid #000; font-weight: 600; color: white; }
```

**Add this line:**
```css
.idea-project { padding: 4px 8px; border: 1px solid; font-weight: 600; font-size: 10px; }
```

---

## STEP 3: Add Modal Script

**Location:** Before `</body>`  
**After this line:**
```html
<script src="shared-topic-page.js"></script>
```

**Add this line:**
```html
<script src="edit-idea-modal.js"></script>
```

---

## STEP 4: Add Modal HTML

**Location:** Before `</body>`, after all `</script>` tags

**Copy and paste this entire block:**

```html
    
    <!-- Edit Idea Modal -->
    <div id="edit-idea-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <span>Edit Idea</span>
                <div class="modal-close" onclick="closeEditIdeaModal()">×</div>
            </div>
            
            <div class="modal-body">
                <div class="modal-form-group">
                    <label for="modal-edit-text">Idea Text</label>
                    <textarea id="modal-edit-text" placeholder="What's the idea?"></textarea>
                </div>
                
                <div class="modal-form-group">
                    <label for="modal-edit-topic">Topic</label>
                    <select id="modal-edit-topic">
                        <option value="">Untagged</option>
                        <!-- Populated dynamically -->
                    </select>
                </div>
                
                <div class="modal-form-group">
                    <label for="modal-edit-difficulty">Difficulty</label>
                    <select id="modal-edit-difficulty">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
                
                <div class="modal-form-group">
                    <label>Weight (1-10)</label>
                    <div class="weight-picker-section">
                        <div class="weight-slider-container">
                            <input 
                                type="range" 
                                id="modal-edit-weight" 
                                min="1" 
                                max="10" 
                                value="5"
                                oninput="handleWeightInput()"
                            />
                            <div class="weight-scale">
                                <span>1 - Low</span>
                                <span>5 - Medium</span>
                                <span>10 - High</span>
                            </div>
                        </div>
                        <div class="weight-preview-container">
                            <div class="weight-preview-label">Preview</div>
                            <div id="weight-preview" class="weight-badge">5</div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-shortcut-hint">
                    Press Esc to cancel • ⌘+Enter to save
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="modal-btn" onclick="closeEditIdeaModal()">Cancel</button>
                <button class="modal-btn modal-btn-primary" onclick="saveEditIdeaModal()">Save Changes</button>
            </div>
        </div>
    </div>
```

---

## That's It!

Repeat these 4 steps for each of the 4 remaining pages:
- [ ] life-admin.html
- [ ] relationships.html
- [ ] living.html
- [ ] creating-this-dashboard.html

Total time: ~2 minutes per page = ~8 minutes total

---

## Quick Test

After updating a page:
1. Open it in your browser
2. Click the "Edit" button on any idea card
3. Verify the modal opens with the weight slider
4. Move the slider and watch the preview badge change color
5. Press Esc to close

Done! ✅
