// Quick fix script to renumber all ideas with proper order values
// Run this in the browser console on any page that loads ideas-data.js

function fixAllOrders() {
    console.log('🔧 Starting order fix...');
    
    const ideas = getIdeas();
    console.log(`Found ${ideas.length} total ideas`);
    
    // Group by status and project
    const groups = {};
    
    ideas.forEach(idea => {
        const key = `${idea.status}-${idea.project}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(idea);
    });
    
    console.log(`Found ${Object.keys(groups).length} groups`);
    
    // Renumber each group
    Object.keys(groups).forEach(key => {
        const [status, project] = key.split('-');
        console.log(`Renumbering ${key}: ${groups[key].length} ideas`);
        
        // Sort by current order (or id if no order), then assign sequential numbers
        groups[key].sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : a.id;
            const orderB = b.order !== undefined ? b.order : b.id;
            return orderA - orderB;
        });
        
        groups[key].forEach((idea, index) => {
            idea.order = index;
            console.log(`  ${idea.id}: order = ${index}`);
        });
    });
    
    // Save back
    const success = saveIdeas(ideas);
    
    if (success) {
        console.log('✅ Order fix complete! Refresh the page.');
        
        // Show summary
        const summary = {};
        ideas.forEach(idea => {
            const key = `${idea.status}-${idea.project}`;
            if (!summary[key]) {
                summary[key] = { count: 0, orders: [] };
            }
            summary[key].count++;
            summary[key].orders.push(idea.order);
        });
        
        console.log('Summary:', summary);
    } else {
        console.log('❌ Failed to save');
    }
    
    return success;
}

// Run it
fixAllOrders();
