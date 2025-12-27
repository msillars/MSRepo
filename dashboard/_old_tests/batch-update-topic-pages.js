/**
 * Batch Update Script for Topic Pages
 * 
 * This script updates all topic pages (work.html, health.html, etc.) to include:
 * 1. Edit modal CSS link
 * 2. Edit modal JavaScript
 * 3. Edit modal HTML
 * 
 * Run this in Node.js with: node batch-update-topic-pages.js
 */

const fs = require('fs');
const path = require('path');

// Topic pages to update (photography.html already done)
const topicPages = [
    'work.html',
    'life-admin.html',
    'relationships.html',
    'living.html',
    'health.html',
    'creating-this-dashboard.html'
];

// CSS link to add in <head>
const cssLink = '    <link rel="stylesheet" href="edit-modal.css">';

// Script tag to add before </body>
const scriptTag = '    <script src="edit-idea-modal.js"></script>';

// Modal HTML to add before </body>
const modalHTML = `    <!-- Edit Idea Modal -->
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
`;

// Update each topic page
topicPages.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️  Skipping ${filename} - file not found`);
        return;
    }
    
    console.log(`\n📝 Processing ${filename}...`);
    
    let content = fs.readFileSync(filepath, 'utf-8');
    let modified = false;
    
    // 1. Add CSS link if not present
    if (!content.includes('edit-modal.css')) {
        // Find the </head> tag and insert before it
        content = content.replace('</head>', `${cssLink}\n</head>`);
        console.log('   ✓ Added CSS link');
        modified = true;
    } else {
        console.log('   ✓ CSS link already present');
    }
    
    // 2. Add .idea-project style if not present (for topic badges)
    if (!content.includes('.idea-project {')) {
        const projectStyle = '        .idea-project { padding: 4px 8px; border: 1px solid; font-weight: 600; font-size: 10px; }\n';
        // Add after .idea-difficulty style
        content = content.replace(
            /(.idea-difficulty \{[^}]+\})/,
            `$1\n${projectStyle}`
        );
        console.log('   ✓ Added .idea-project style');
        modified = true;
    }
    
    // 3. Add script tag if not present
    if (!content.includes('edit-idea-modal.js')) {
        // Find shared-topic-page.js and add after it
        content = content.replace(
            /<script src="shared-topic-page.js"><\/script>/,
            `<script src="shared-topic-page.js"></script>\n${scriptTag}`
        );
        console.log('   ✓ Added modal script');
        modified = true;
    } else {
        console.log('   ✓ Modal script already present');
    }
    
    // 4. Add modal HTML if not present
    if (!content.includes('edit-idea-modal')) {
        // Find the last </script> before </body> and add modal HTML after it
        const bodyCloseIndex = content.lastIndexOf('</body>');
        const lastScriptIndex = content.lastIndexOf('</script>', bodyCloseIndex);
        
        if (lastScriptIndex > 0) {
            const insertPosition = content.indexOf('\n', lastScriptIndex) + 1;
            content = content.slice(0, insertPosition) + '\n' + modalHTML + '\n' + content.slice(insertPosition);
            console.log('   ✓ Added modal HTML');
            modified = true;
        }
    } else {
        console.log('   ✓ Modal HTML already present');
    }
    
    // Write back if modified
    if (modified) {
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log(`   ✅ ${filename} updated successfully`);
    } else {
        console.log(`   ℹ️  ${filename} already up-to-date`);
    }
});

console.log('\n✨ Batch update complete!\n');
