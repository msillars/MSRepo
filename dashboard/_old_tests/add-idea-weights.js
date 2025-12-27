/**
 * Add Weight Column to Ideas Table
 * 
 * This migration adds a 'weight' column (1-10 scale) to the ideas table.
 * This supplements the existing 'ranking' field (1-5) to provide more granular priority control.
 * 
 * Default migration strategy:
 * - Maps ranking 1 → weight 2
 * - Maps ranking 2 → weight 4
 * - Maps ranking 3 → weight 5
 * - Maps ranking 4 → weight 7
 * - Maps ranking 5 → weight 9
 */

async function addIdeaWeightColumn() {
    console.log('[MIGRATION] Starting: Add weight column to ideas');
    
    try {
        // Check if column already exists
        const columns = queryAsObjects("PRAGMA table_info(ideas)");
        const hasWeight = columns.some(col => col.name === 'weight');
        
        if (hasWeight) {
            console.log('[MIGRATION] ⚠️  Weight column already exists - skipping migration');
            return { success: true, alreadyExists: true };
        }
        
        // Create backup before migration
        console.log('[MIGRATION] Creating backup...');
        const backupKey = createBackup('pre-idea-weight-migration');
        console.log(`[MIGRATION] ✓ Backup created: ${backupKey}`);
        
        // Add weight column with default value of 5
        console.log('[MIGRATION] Adding weight column...');
        executeWrite('ALTER TABLE ideas ADD COLUMN weight INTEGER DEFAULT 5');
        
        // Get all ideas to update their weights based on ranking
        const ideas = queryAsObjects('SELECT id, ranking FROM ideas');
        console.log(`[MIGRATION] Updating ${ideas.length} ideas with calculated weights...`);
        
        // Mapping: ranking 1-5 → weight 2,4,5,7,9
        const rankingToWeight = {
            1: 2,
            2: 4,
            3: 5,
            4: 7,
            5: 9
        };
        
        ideas.forEach(idea => {
            const weight = rankingToWeight[idea.ranking] || 5;
            executeWrite('UPDATE ideas SET weight = ? WHERE id = ?', [weight, idea.id]);
        });
        
        console.log('[MIGRATION] ✅ Migration complete!');
        
        // Dispatch update event
        window.dispatchEvent(new Event('ideasUpdated'));
        
        return {
            success: true,
            alreadyExists: false,
            ideasUpdated: ideas.length,
            backupKey: backupKey
        };
        
    } catch (error) {
        console.error('[MIGRATION] ❌ Migration failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Verify the migration
 */
function verifyIdeaWeightMigration() {
    console.log('[VERIFY] Checking idea weight column...');
    
    try {
        // Check if column exists
        const columns = queryAsObjects("PRAGMA table_info(ideas)");
        const weightColumn = columns.find(col => col.name === 'weight');
        
        if (!weightColumn) {
            console.log('[VERIFY] ❌ Weight column not found');
            return { success: false, error: 'Weight column does not exist' };
        }
        
        console.log('[VERIFY] ✓ Weight column exists');
        console.log('[VERIFY]   Type:', weightColumn.type);
        console.log('[VERIFY]   Default:', weightColumn.dflt_value);
        
        // Check ideas have weights
        const ideas = queryAsObjects('SELECT id, ranking, weight FROM ideas LIMIT 5');
        console.log('[VERIFY] Sample ideas:');
        ideas.forEach(idea => {
            console.log(`[VERIFY]   ID ${idea.id}: ranking=${idea.ranking}, weight=${idea.weight}`);
        });
        
        // Count ideas by weight
        const weightCounts = queryAsObjects(`
            SELECT weight, COUNT(*) as count 
            FROM ideas 
            GROUP BY weight 
            ORDER BY weight
        `);
        console.log('[VERIFY] Weight distribution:');
        weightCounts.forEach(row => {
            console.log(`[VERIFY]   Weight ${row.weight}: ${row.count} ideas`);
        });
        
        return {
            success: true,
            columnExists: true,
            sampleIdeas: ideas,
            weightDistribution: weightCounts
        };
        
    } catch (error) {
        console.error('[VERIFY] ❌ Verification failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export functions
if (typeof window !== 'undefined') {
    window.addIdeaWeightColumn = addIdeaWeightColumn;
    window.verifyIdeaWeightMigration = verifyIdeaWeightMigration;
}
