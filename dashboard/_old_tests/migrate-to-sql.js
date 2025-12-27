/**
 * Data Migration Script - localStorage to SQL
 * 
 * Safely migrates existing data from localStorage to SQL database.
 * Creates backups and provides rollback capability.
 * 
 * Usage:
 * 1. Include sql-database.js first
 * 2. Call: await migrateToSQL()
 * 3. Check results in console
 */

/**
 * Create a timestamped backup of current localStorage data
 * @returns {string} - Backup key
 */
function createPreMigrationBackup() {
    console.log('[MIGRATION] Creating pre-migration backup...');
    
    const timestamp = new Date().toISOString();
    const ideas = localStorage.getItem('management_system_ideas');
    const projects = localStorage.getItem('management_system_projects');
    
    const backupData = {
        ideas: ideas,
        projects: projects,
        timestamp: timestamp,
        type: 'pre-migration'
    };
    
    const backupKey = `management_system_backup_pre_migration_${timestamp}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    
    console.log('[MIGRATION] ✅ Backup created:', backupKey);
    return backupKey;
}

/**
 * Migrate projects from localStorage to SQL
 * @returns {number} - Number of projects migrated
 */
async function migrateProjects() {
    console.log('[MIGRATION] Migrating projects...');
    
    const projectsJSON = localStorage.getItem('management_system_projects');
    
    if (!projectsJSON) {
        console.log('[MIGRATION] No projects found in localStorage');
        return 0;
    }
    
    const projects = JSON.parse(projectsJSON);
    console.log(`[MIGRATION] Found ${projects.length} projects to migrate`);
    
    let migratedCount = 0;
    
    for (const project of projects) {
        try {
            // Check if project already exists
            const existing = queryAsObjects(
                'SELECT id FROM projects WHERE id = ?',
                [project.id]
            );
            
            if (existing.length > 0) {
                console.log(`[MIGRATION] Project "${project.name}" already exists, skipping`);
                continue;
            }
            
            // Insert project
            executeWrite(
                `INSERT INTO projects (id, name, priority, color, icon) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    project.id,
                    project.name,
                    project.priority || 'always-on',
                    project.color,
                    project.icon || null
                ]
            );
            
            migratedCount++;
            console.log(`[MIGRATION] ✓ Migrated project: ${project.name}`);
            
        } catch (error) {
            console.error(`[MIGRATION] ✗ Failed to migrate project "${project.name}":`, error);
        }
    }
    
    console.log(`[MIGRATION] ✅ Migrated ${migratedCount} projects`);
    return migratedCount;
}

/**
 * Migrate ideas from localStorage to SQL
 * @returns {number} - Number of ideas migrated
 */
async function migrateIdeas() {
    console.log('[MIGRATION] Migrating ideas...');
    
    const ideasJSON = localStorage.getItem('management_system_ideas');
    
    if (!ideasJSON) {
        console.log('[MIGRATION] No ideas found in localStorage');
        return 0;
    }
    
    const ideas = JSON.parse(ideasJSON);
    console.log(`[MIGRATION] Found ${ideas.length} ideas to migrate`);
    
    let migratedCount = 0;
    
    for (const idea of ideas) {
        try {
            // Check if idea already exists (by matching text and timestamp)
            const existing = queryAsObjects(
                'SELECT id FROM ideas WHERE text = ? AND timestamp = ?',
                [idea.text, idea.timestamp]
            );
            
            if (existing.length > 0) {
                console.log(`[MIGRATION] Idea already exists (id: ${idea.id}), skipping`);
                continue;
            }
            
            // Insert idea (let database auto-generate new ID)
            executeWrite(
                `INSERT INTO ideas (text, project, ranking, difficulty, status, "order", timestamp, status_changed_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    idea.text,
                    idea.project || 'untagged',
                    idea.ranking || 3,
                    idea.difficulty || 'medium',
                    idea.status || 'new',
                    idea.order !== undefined ? idea.order : 0,
                    idea.timestamp,
                    idea.statusChangedAt || idea.status_changed_at || null
                ]
            );
            
            migratedCount++;
            
            if (migratedCount % 10 === 0) {
                console.log(`[MIGRATION] Progress: ${migratedCount} ideas migrated...`);
            }
            
        } catch (error) {
            console.error(`[MIGRATION] ✗ Failed to migrate idea (id: ${idea.id}):`, error);
            console.error('[MIGRATION] Idea data:', idea);
        }
    }
    
    console.log(`[MIGRATION] ✅ Migrated ${migratedCount} ideas`);
    return migratedCount;
}

/**
 * Verify migration results
 * @returns {object} - Verification results
 */
function verifyMigration() {
    console.log('[MIGRATION] Verifying migration...');
    
    // Count in localStorage
    const localIdeasJSON = localStorage.getItem('management_system_ideas');
    const localProjectsJSON = localStorage.getItem('management_system_projects');
    
    const localIdeasCount = localIdeasJSON ? JSON.parse(localIdeasJSON).length : 0;
    const localProjectsCount = localProjectsJSON ? JSON.parse(localProjectsJSON).length : 0;
    
    // Count in SQL
    const sqlStats = getDatabaseStats();
    
    const verification = {
        localStorage: {
            ideas: localIdeasCount,
            projects: localProjectsCount
        },
        sql: {
            ideas: sqlStats.ideas,
            projects: sqlStats.projects
        },
        match: {
            ideas: localIdeasCount === sqlStats.ideas,
            projects: localProjectsCount === sqlStats.projects
        }
    };
    
    console.log('[MIGRATION] Verification results:');
    console.table(verification);
    
    if (verification.match.ideas && verification.match.projects) {
        console.log('[MIGRATION] ✅ Counts match! Migration successful.');
    } else {
        console.warn('[MIGRATION] ⚠️ Count mismatch detected!');
        console.warn('[MIGRATION] localStorage ideas:', localIdeasCount, '/ SQL ideas:', sqlStats.ideas);
        console.warn('[MIGRATION] localStorage projects:', localProjectsCount, '/ SQL projects:', sqlStats.projects);
    }
    
    return verification;
}

/**
 * Main migration function
 * Orchestrates the complete migration process
 * @returns {object} - Migration results
 */
async function migrateToSQL() {
    console.log('='.repeat(60));
    console.log('STARTING DATA MIGRATION: localStorage → SQL');
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    
    try {
        // Step 1: Create backup
        const backupKey = createPreMigrationBackup();
        
        // Step 2: Ensure database is initialized
        if (!db) {
            console.log('[MIGRATION] Initializing database...');
            await initializeDatabase();
        }
        
        // Step 3: Migrate projects first (ideas reference projects)
        const projectsCount = await migrateProjects();
        
        // Step 4: Migrate ideas
        const ideasCount = await migrateIdeas();
        
        // Step 5: Verify migration
        const verification = verifyMigration();
        
        // Step 6: Calculate duration
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Step 7: Summary
        console.log('='.repeat(60));
        console.log('MIGRATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`✅ Duration: ${duration} seconds`);
        console.log(`✅ Projects migrated: ${projectsCount}`);
        console.log(`✅ Ideas migrated: ${ideasCount}`);
        console.log(`✅ Backup created: ${backupKey}`);
        console.log('='.repeat(60));
        
        const result = {
            success: true,
            duration: duration,
            migrated: {
                projects: projectsCount,
                ideas: ideasCount
            },
            backup: backupKey,
            verification: verification
        };
        
        return result;
        
    } catch (error) {
        console.error('='.repeat(60));
        console.error('MIGRATION FAILED');
        console.error('='.repeat(60));
        console.error('[MIGRATION] Error:', error);
        console.error('[MIGRATION] Your data in localStorage is safe!');
        console.error('='.repeat(60));
        
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
}

/**
 * Rollback migration - restore from backup
 * @param {string} backupKey - The backup key to restore from
 */
function rollbackMigration(backupKey) {
    console.log('[ROLLBACK] Starting rollback...');
    
    try {
        // Get backup data
        const backupJSON = localStorage.getItem(backupKey);
        
        if (!backupJSON) {
            throw new Error(`Backup not found: ${backupKey}`);
        }
        
        const backup = JSON.parse(backupJSON);
        
        // Restore localStorage
        if (backup.ideas) {
            localStorage.setItem('management_system_ideas', backup.ideas);
        }
        if (backup.projects) {
            localStorage.setItem('management_system_projects', backup.projects);
        }
        
        console.log('[ROLLBACK] ✅ localStorage restored from backup');
        console.log('[ROLLBACK] Note: SQL data not cleared. Run clearDatabase() if needed.');
        
        return true;
        
    } catch (error) {
        console.error('[ROLLBACK] ❌ Rollback failed:', error);
        return false;
    }
}

/**
 * List all available backups
 * @returns {array} - List of backup keys with metadata
 */
function listBackups() {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys.filter(key => 
        key.startsWith('management_system_backup_')
    );
    
    const backups = backupKeys.map(key => {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            return {
                key: key,
                timestamp: data.timestamp,
                type: data.type || 'unknown',
                date: new Date(data.timestamp).toLocaleString()
            };
        } catch {
            return null;
        }
    }).filter(b => b !== null);
    
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    console.log('Available backups:');
    console.table(backups);
    
    return backups;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        migrateToSQL,
        rollbackMigration,
        listBackups,
        createPreMigrationBackup
    };
}
