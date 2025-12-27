/**
 * Migration Script: Add Weight Column to Topics
 * 
 * Adds a numeric weight field (1-10) to topics table.
 * Maps existing categorical priorities to default weights:
 * - always-on: 10 (highest)
 * - priority: 8
 * - getting-important: 6
 * - do-prep: 4
 * - urgent: 10 (special case)
 */

async function addWeightColumnToTopics() {
    console.log('[MIGRATION] Starting weight column migration...');
    
    try {
        // Check if weight column already exists
        const tableInfo = queryAsObjects("PRAGMA table_info(topics)");
        const hasWeight = tableInfo.some(col => col.name === 'weight');
        
        if (hasWeight) {
            console.log('[MIGRATION] ✅ Weight column already exists');
            return { success: true, alreadyExists: true };
        }
        
        console.log('[MIGRATION] Adding weight column...');
        
        // Add weight column with default value of 5 (middle of 1-10 range)
        executeWrite('ALTER TABLE topics ADD COLUMN weight INTEGER NOT NULL DEFAULT 5 CHECK(weight >= 1 AND weight <= 10)');
        
        console.log('[MIGRATION] ✅ Weight column added');
        
        // Now set weights based on existing categorical priorities
        const priorityToWeight = {
            'always-on': 10,
            'priority': 8,
            'getting-important': 6,
            'do-prep': 4,
            'urgent': 10
        };
        
        const topics = getTopics();
        console.log(`[MIGRATION] Setting weights for ${topics.length} topics...`);
        
        topics.forEach(topic => {
            const weight = priorityToWeight[topic.priority] || 5;
            executeWrite('UPDATE topics SET weight = ? WHERE id = ?', [weight, topic.id]);
            console.log(`[MIGRATION] ${topic.name}: priority="${topic.priority}" → weight=${weight}`);
        });
        
        console.log('[MIGRATION] ✅ All topic weights set');
        console.log('[MIGRATION] ✅ Migration complete!');
        
        return { 
            success: true, 
            alreadyExists: false,
            topicsUpdated: topics.length 
        };
        
    } catch (error) {
        console.error('[MIGRATION] ❌ Migration failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Verify the migration worked correctly
 */
function verifyWeightMigration() {
    console.log('[MIGRATION] Verifying migration...');
    
    try {
        const topics = getTopics();
        
        console.log('[MIGRATION] Current topics with weights:');
        console.table(topics.map(t => ({
            name: t.name,
            priority: t.priority,
            weight: t.weight
        })));
        
        // Check all weights are in valid range
        const invalidWeights = topics.filter(t => !t.weight || t.weight < 1 || t.weight > 10);
        
        if (invalidWeights.length > 0) {
            console.error('[MIGRATION] ❌ Found topics with invalid weights:', invalidWeights);
            return false;
        }
        
        console.log('[MIGRATION] ✅ All weights are valid (1-10)');
        return true;
        
    } catch (error) {
        console.error('[MIGRATION] ❌ Verification failed:', error);
        return false;
    }
}

// Export for use in test page
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addWeightColumnToTopics,
        verifyWeightMigration
    };
}
