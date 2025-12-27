#!/usr/bin/env node

/**
 * Batch update all topic pages to use the grid-based weight picker modal
 */

const fs = require('fs');
const path = require('path');

const dashboardDir = '/Users/matthew/Desktop/Claude/Management System/management-system/dashboard';

// List of topic page files to update
const topicPages = [
    'work.html',
    'life-admin.html',
    'relationships.html',
    'living.html',
    'health.html',
    'creating-this-dashboard.html'
];

// The old modal HTML to find and replace
const oldModalHtml = `    <!-- Edit Idea Modal -->
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
    </div>`;

// The new simplified modal HTML
const newModalHtml = `    <!-- Edit Idea Modal (populated dynamically) -->
    <div id="edit-idea-modal" class="modal-overlay"></div>`;

console.log('Updating topic pages with grid-based weight picker modal...\n');

let updatedCount = 0;
let skippedCount = 0;

topicPages.forEach(fileName => {
    const filePath = path.join(dashboardDir, fileName);
    
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  ${fileName}: File not found`);
            skippedCount++;
            return;
        }
        
        // Read file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if old modal exists
        if (!content.includes(oldModalHtml)) {
            console.log(`⏭️  ${fileName}: Already up to date or no old modal found`);
            skippedCount++;
            return;
        }
        
        // Replace
        content = content.replace(oldModalHtml, newModalHtml);
        
        // Write back
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${fileName}: Updated successfully`);
        updatedCount++;
        
    } catch (error) {
        console.error(`❌ ${fileName}: Error - ${error.message}`);
        skippedCount++;
    }
});

console.log(`\nComplete! ${updatedCount} updated, ${skippedCount} skipped.`);
