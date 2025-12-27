// Icon List Generator for Management System
// Run this with Node.js to regenerate the icon list

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'Icons');
const outputFile = path.join(__dirname, 'icons-list.js');

// Read all files from Icons directory
const files = fs.readdirSync(iconsDir);

// Filter for .ICO files only (case insensitive)
const iconFiles = files.filter(file => 
    file.toLowerCase().endsWith('.ico') && 
    file !== 'FavIco.ICO' // Exclude favicon
).sort();

// Generate JavaScript array
const iconsList = iconFiles.map(file => {
    const nameWithoutExt = file.replace(/\.ICO$/i, '');
    // Generate a display name (remove numbers, make readable)
    let displayName = nameWithoutExt
        .replace(/(\d{3,})/g, ' ') // Remove long numbers
        .replace(/([A-Z])/g, ' $1') // Add space before capitals
        .trim();
    
    // If display name is too generic, just use filename
    if (displayName.length < 2) {
        displayName = nameWithoutExt;
    }
    
    return `    { file: '${file}', name: '${displayName}' }`;
});

const output = `// Auto-generated list of all available icons
// Generated: ${new Date().toISOString()}
// Total icons: ${iconFiles.length}

const ALL_AVAILABLE_ICONS = [
${iconsList.join(',\n')}
];

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ALL_AVAILABLE_ICONS;
}
`;

fs.writeFileSync(outputFile, output);
console.log(`✅ Generated icons-list.js with ${iconFiles.length} icons`);
