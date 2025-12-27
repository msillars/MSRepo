// Batch update topic pages to include topic-page.css

const fs = require('fs');
const path = require('path');

const topicPages = [
    'health.html',
    'relationships.html',
    'life-admin.html',
    'living.html',
    'creating-this-dashboard.html'
];

topicPages.forEach(filename => {
    const filePath = path.join(__dirname, filename);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add topic-page.css after win3x-skin-3.1.css if not already present
        if (!content.includes('topic-page.css')) {
            content = content.replace(
                '<link rel="stylesheet" href="win3x-skin-3.1.css">',
                '<link rel="stylesheet" href="win3x-skin-3.1.css">\n    <link rel="stylesheet" href="topic-page.css">'
            );
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Updated ${filename}`);
        } else {
            console.log(`- ${filename} already has topic-page.css`);
        }
    } catch (err) {
        console.error(`✗ Error updating ${filename}:`, err.message);
    }
});

console.log('\nBatch update complete!');
