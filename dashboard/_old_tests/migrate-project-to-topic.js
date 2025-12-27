/**
 * Migration Script: Project → Topic Rename
 * 
 * This script migrates the database schema and data from "projects" to "topics"
 * Run this ONCE to update your system.
 * 
 * What it does:
 * 1. Renames "projects" table to "topics"
 * 2. Renames "project" column in ideas table to "topic"
 * 3. Migrates all existing data
 * 4. Updates localStorage keys
 * 5. Creates backup before migration
 */

async function migrateProjectsToTopics() {
    console.log('='.repeat(60));
    console.log('MIGRATION: Projects → Topics');
    console.log('='.repeat(60));
    
    try {
        // Step 1: Create backup before migration
        console.log('\n[1/6] Creating backup...');
        const backupKey = createBackup('pre-topic-migration');
        console.log('✅ Backup created:', backupKey);
        
        // Step 2: Check current state
        console.log('\n[2/6] Checking current database...');
        const currentProjects = queryAsObjects('SELECT * FROM projects');
        const currentIdeas = queryAsObjects('SELECT * FROM ideas');
        console.log(`Found ${currentProjects.length} projects and ${currentIdeas.length} ideas`);
        
        // Step 3: Create new topics table
        console.log('\n[3/6] Creating topics table...');
        executeWrite(`
            CREATE TABLE IF NOT EXISTS topics (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                priority TEXT NOT NULL DEFAULT 'always-on' 
                    CHECK(priority IN ('always-on', 'do-prep', 'getting-important', 'priority', 'urgent')),
                color TEXT NOT NULL,
                icon TEXT
            )
        `);
        console.log('✅ Topics table created');
        
        // Step 4: Migrate data from projects to topics
        console.log('\n[4/6] Migrating project data to topics...');
        currentProjects.forEach(project => {
            executeWrite(
                'INSERT INTO topics (id, name, priority, color, icon) VALUES (?, ?, ?, ?, ?)',
                [project.id, project.name, project.priority, project.color, project.icon]
            );
        });
        console.log(`✅ Migrated ${currentProjects.length} projects to topics`);
        
        // Step 5: Update ideas table - rename column
        console.log('\n[5/6] Updating ideas table (project → topic column)...');
        
        // SQLite doesn't support ALTER COLUMN RENAME directly, so we need to:
        // 1. Create a new ideas table with "topic" column
        // 2. Copy data from old table
        // 3. Drop old table
        // 4. Rename new table
        
        executeWrite(`
            CREATE TABLE ideas_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                topic TEXT NOT NULL DEFAULT 'untagged',
                ranking INTEGER NOT NULL DEFAULT 3 CHECK(ranking >= 1 AND ranking <= 5),
                difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
                status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'backlog', 'done')),
                "order" INTEGER NOT NULL DEFAULT 0,
                timestamp TEXT NOT NULL,
                status_changed_at TEXT
            )
        `);
        
        // Copy all data from old ideas table (project → topic)
        executeWrite(`
            INSERT INTO ideas_new (id, text, topic, ranking, difficulty, status, "order", timestamp, status_changed_at)
            SELECT id, text, project, ranking, difficulty, status, "order", timestamp, status_changed_at
            FROM ideas
        `);
        
        // Drop old tables
        executeWrite('DROP TABLE ideas');
        executeWrite('DROP TABLE projects');
        
        // Rename new table to ideas
        executeWrite('ALTER TABLE ideas_new RENAME TO ideas');
        
        // Recreate indexes for the new ideas table
        executeWrite('CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status)');
        executeWrite('CREATE INDEX IF NOT EXISTS idx_ideas_topic ON ideas(topic)');
        executeWrite('CREATE INDEX IF NOT EXISTS idx_ideas_status_order ON ideas(status, "order")');
        executeWrite('CREATE INDEX IF NOT EXISTS idx_ideas_ranking ON ideas(ranking)');
        
        console.log('✅ Ideas table updated with "topic" column');
        
        // Step 6: Update localStorage keys
        console.log('\n[6/6] Updating localStorage keys...');
        const oldProjectsKey = 'management_system_projects';
        const newTopicsKey = 'management_system_topics';
        
        if (localStorage.getItem(oldProjectsKey)) {
            const oldData = localStorage.getItem(oldProjectsKey);
            localStorage.setItem(newTopicsKey, oldData);
            localStorage.removeItem(oldProjectsKey);
            console.log('✅ localStorage keys updated');
        }
        
        // Final verification
        console.log('\n' + '='.repeat(60));
        console.log('VERIFICATION');
        console.log('='.repeat(60));
        const topics = queryAsObjects('SELECT * FROM topics');
        const ideas = queryAsObjects('SELECT * FROM ideas LIMIT 5');
        console.log(`✅ Topics table: ${topics.length} rows`);
        console.log(`✅ Ideas table: ${ideas.length} rows (showing first 5)`);
        console.log('\nSample idea with new "topic" column:');
        console.log(ideas[0]);
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ MIGRATION COMPLETE!');
        console.log('='.repeat(60));
        console.log('\nNext steps:');
        console.log('1. Refresh your browser');
        console.log('2. All project references are now "topics"');
        console.log('3. Backup saved as:', backupKey);
        console.log('='.repeat(60));
        
        return true;
        
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ MIGRATION FAILED!');
        console.error('='.repeat(60));
        console.error(error);
        console.error('\nYou can restore from backup using:');
        console.error('restoreFromBackup("<backup-key>")');
        return false;
    }
}

// Run migration automatically when this script is loaded
console.log('Migration script loaded. Run: migrateProjectsToTopics()');
