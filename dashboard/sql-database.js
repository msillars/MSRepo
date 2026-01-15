/**
 * SQL Database Layer - SQLite in Browser via sql.js
 * 
 * This module initializes a SQLite database in the browser using sql.js.
 * Provides the foundation for TaskManager and ProjectManager classes.
 * 
 * Architecture:
 * - Uses sql.js (SQLite compiled to WebAssembly)
 * - Stores data in browser (localStorage for persistence)
 * - Provides SQL query interface
 * - Schema matches existing data structure
 */

// Global database instance
let db = null;
let SQL = null;

/**
 * Initialize the SQL database
 * Creates tables with schema matching current data structure
 */
async function initializeDatabase() {
    console.log('[SQL-DB] Initializing database...');
    
    try {
        // Load sql.js library from CDN
        if (typeof window.initSqlJs === 'undefined') {
            throw new Error('sql.js library not loaded. Make sure sql.js script is included in HTML.');
        }
        
        // Initialize SQL.js
        SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        console.log('[SQL-DB] sql.js loaded successfully');
        
        // Try to load existing database from localStorage
        const savedDb = localStorage.getItem('management_system_sql_db');
        
        if (savedDb) {
            // Load existing database
            const uint8Array = new Uint8Array(JSON.parse(savedDb));
            db = new SQL.Database(uint8Array);
            console.log('[SQL-DB] Loaded existing database from localStorage');
        } else {
            // Create new database
            db = new SQL.Database();
            console.log('[SQL-DB] Created new database');
            
            // Create schema
            await createSchema();
        }
        
        console.log('[SQL-DB] ✅ Database initialized successfully');
        return true;
        
    } catch (error) {
        console.error('[SQL-DB] ❌ Failed to initialize database:', error);
        throw error;
    }
}

/**
 * Create database schema
 * Tables match existing localStorage data structure
 */
async function createSchema() {
    console.log('[SQL-DB] Creating schema...');

    // ===========================================
    // UNIFIED ITEMS TABLE (new architecture)
    // ===========================================
    // Everything is an item: topics, projects, tasks, ideas, reminders
    // Hierarchy via parent_id, topic_id denormalized for fast filtering
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,

            -- Hierarchy
            parent_id INTEGER,              -- NULL = topic (root level)
            topic_id INTEGER,               -- denormalized: always points to root topic (NULL for topics)

            -- Type (intuited on create, can be changed manually)
            item_type TEXT NOT NULL DEFAULT 'task'
                CHECK(item_type IN ('topic', 'idea', 'task', 'project', 'reminder')),

            -- Completion (ignored for topics)
            status TEXT NOT NULL DEFAULT 'new'
                CHECK(status IN ('new', 'backlog', 'done')),

            -- Priority
            weight INTEGER DEFAULT 5 CHECK(weight >= 1 AND weight <= 10),

            -- Context
            purpose TEXT,                   -- REQUIRED for topics, optional otherwise
            due_date TEXT,

            -- Display (mainly for topics)
            icon TEXT,
            color TEXT,

            -- Legacy fields (for migration compatibility)
            ranking INTEGER DEFAULT 3 CHECK(ranking >= 1 AND ranking <= 5),
            difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),

            -- Bookkeeping
            "order" INTEGER NOT NULL DEFAULT 0,
            created_at TEXT,
            completed_at TEXT,

            FOREIGN KEY (parent_id) REFERENCES items(id),
            FOREIGN KEY (topic_id) REFERENCES items(id)
        )
    `);

    // Indexes for items table
    db.run('CREATE INDEX IF NOT EXISTS idx_items_parent ON items(parent_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_topic ON items(topic_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_topic_status ON items(topic_id, status)');

    // ===========================================
    // LEGACY TABLES (kept for migration)
    // ===========================================

    // Ideas table - stores all tasks/ideas (LEGACY)
    db.run(`
        CREATE TABLE IF NOT EXISTS ideas (
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

    // Topics table - stores topic definitions (LEGACY)
    db.run(`
        CREATE TABLE IF NOT EXISTS topics (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            priority TEXT NOT NULL DEFAULT 'always-on'
                CHECK(priority IN ('always-on', 'do-prep', 'getting-important', 'priority', 'urgent')),
            color TEXT NOT NULL,
            icon TEXT,
            weight INTEGER DEFAULT 5 CHECK(weight >= 1 AND weight <= 10)
        )
    `);

    // Legacy indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_ideas_topic ON ideas(topic)');
    db.run('CREATE INDEX IF NOT EXISTS idx_ideas_status_order ON ideas(status, "order")');
    db.run('CREATE INDEX IF NOT EXISTS idx_ideas_ranking ON ideas(ranking)');

    console.log('[SQL-DB] ✅ Schema created successfully');

    // Save to localStorage
    saveDatabase();
}

/**
 * Save database to localStorage for persistence
 * Called after any write operation
 */
function saveDatabase() {
    if (!db) {
        console.warn('[SQL-DB] Cannot save - database not initialized');
        return;
    }
    
    try {
        const data = db.export();
        const buffer = Array.from(data);
        localStorage.setItem('management_system_sql_db', JSON.stringify(buffer));
        console.log('[SQL-DB] Database saved to localStorage');
    } catch (error) {
        console.error('[SQL-DB] Failed to save database:', error);
    }
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query string
 * @param {array} params - Query parameters (optional)
 * @returns {array} - Query results
 */
function executeQuery(sql, params = []) {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    
    try {
        const results = db.exec(sql, params);
        return results;
    } catch (error) {
        console.error('[SQL-DB] Query error:', error);
        console.error('[SQL-DB] SQL:', sql);
        console.error('[SQL-DB] Params:', params);
        throw error;
    }
}

/**
 * Execute a SQL query and return as objects
 * Converts sql.js result format to array of objects
 * @param {string} sql - SQL query string  
 * @param {array} params - Query parameters (optional)
 * @returns {array} - Array of objects with column names as keys
 */
function queryAsObjects(sql, params = []) {
    const results = executeQuery(sql, params);
    
    if (results.length === 0) {
        return [];
    }
    
    const columns = results[0].columns;
    const values = results[0].values;
    
    return values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    });
}

/**
 * Execute a write query (INSERT, UPDATE, DELETE)
 * Automatically saves database after write
 * @param {string} sql - SQL query string
 * @param {array} params - Query parameters (optional)  
 * @returns {object} - { changes: number, lastInsertId: number }
 */
function executeWrite(sql, params = []) {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    
    try {
        db.run(sql, params);
        
        // Get changes info
        const changes = db.exec('SELECT changes() as changes')[0].values[0][0];
        const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
        
        // Save to localStorage
        saveDatabase();
        
        return { changes, lastInsertId: lastId };
        
    } catch (error) {
        console.error('[SQL-DB] Write error:', error);
        console.error('[SQL-DB] SQL:', sql);
        console.error('[SQL-DB] Params:', params);
        throw error;
    }
}

/**
 * Get database statistics
 * @returns {object} - Database stats
 */
function getDatabaseStats() {
    if (!db) {
        return { initialized: false };
    }

    // Check if items table exists and has data
    const tables = queryAsObjects("SELECT name FROM sqlite_master WHERE type='table'");
    const hasItemsTable = tables.some(t => t.name === 'items');

    // Legacy table counts
    const ideasCount = queryAsObjects('SELECT COUNT(*) as count FROM ideas')[0].count;
    const topicsCount = queryAsObjects('SELECT COUNT(*) as count FROM topics')[0].count;
    const statusCounts = queryAsObjects(`
        SELECT status, COUNT(*) as count
        FROM ideas
        GROUP BY status
    `);

    const stats = {
        initialized: true,
        ideas: ideasCount,
        topics: topicsCount,
        byStatus: statusCounts.reduce((acc, row) => {
            acc[row.status] = row.count;
            return acc;
        }, {}),
        migrated: false
    };

    // Add items table stats if it exists
    if (hasItemsTable) {
        const itemsCount = queryAsObjects('SELECT COUNT(*) as count FROM items')[0].count;
        const itemTypeCounts = queryAsObjects(`
            SELECT item_type, COUNT(*) as count
            FROM items
            GROUP BY item_type
        `);
        stats.items = itemsCount;
        stats.byItemType = itemTypeCounts.reduce((acc, row) => {
            acc[row.item_type] = row.count;
            return acc;
        }, {});
        stats.migrated = itemsCount > 0;
    }

    return stats;
}

/**
 * Export database as JSON (for backup/debugging)
 * @returns {object} - Complete database contents
 */
function exportDatabaseAsJSON() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    
    const ideas = queryAsObjects('SELECT * FROM ideas ORDER BY id');
    const topics = queryAsObjects('SELECT * FROM topics ORDER BY id');
    
    return {
        ideas,
        topics,
        exportDate: new Date().toISOString(),
        version: 1
    };
}

/**
 * Clear all data from database (for testing/reset)
 * WARNING: This deletes all data!
 */
function clearDatabase() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    
    console.warn('[SQL-DB] ⚠️ Clearing all data from database...');
    
    db.run('DELETE FROM ideas');
    db.run('DELETE FROM topics');
    
    // Reset auto-increment counters
    db.run('DELETE FROM sqlite_sequence');
    
    saveDatabase();
    
    console.log('[SQL-DB] Database cleared');
}

/**
 * Migrate data from legacy tables (topics, ideas) to unified items table
 * This is a one-time migration that preserves all data
 * @returns {object} - Migration results
 */
function migrateToUnifiedItems() {
    console.log('[SQL-DB] Starting migration to unified items table...');

    try {
        // Check if already migrated
        const itemsCount = queryAsObjects('SELECT COUNT(*) as count FROM items')[0].count;
        if (itemsCount > 0) {
            console.log('[SQL-DB] Items table already has data, skipping migration');
            return { migrated: false, reason: 'already_migrated' };
        }

        // Check if there's anything to migrate
        const topicsCount = queryAsObjects('SELECT COUNT(*) as count FROM topics')[0].count;
        const ideasCount = queryAsObjects('SELECT COUNT(*) as count FROM ideas')[0].count;

        if (topicsCount === 0 && ideasCount === 0) {
            console.log('[SQL-DB] No data to migrate');
            return { migrated: false, reason: 'no_data' };
        }

        // Create a mapping of old topic IDs to new item IDs
        const topicIdMap = {};

        // Step 1: Migrate topics as items with item_type='topic'
        const topics = queryAsObjects('SELECT * FROM topics ORDER BY id');
        console.log(`[SQL-DB] Migrating ${topics.length} topics...`);

        topics.forEach(topic => {
            db.run(`
                INSERT INTO items (text, parent_id, topic_id, item_type, status, weight, purpose, icon, color, "order", created_at)
                VALUES (?, NULL, NULL, 'topic', 'new', ?, ?, ?, ?, 0, ?)
            `, [
                topic.name,
                topic.weight || 5,
                null,  // purpose - will need to be added later
                topic.icon,
                topic.color,
                new Date().toISOString()
            ]);

            // Get the new ID and store mapping
            const newId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
            topicIdMap[topic.id] = newId;
            console.log(`[SQL-DB]   Topic "${topic.name}" (${topic.id}) → item #${newId}`);
        });

        // Step 2: Migrate ideas as items with item_type='task'
        const ideas = queryAsObjects('SELECT * FROM ideas ORDER BY id');
        console.log(`[SQL-DB] Migrating ${ideas.length} ideas/tasks...`);

        ideas.forEach(idea => {
            const topicItemId = topicIdMap[idea.topic] || null;

            db.run(`
                INSERT INTO items (text, parent_id, topic_id, item_type, status, weight, ranking, difficulty, "order", created_at, completed_at)
                VALUES (?, ?, ?, 'task', ?, ?, ?, ?, ?, ?, ?)
            `, [
                idea.text,
                topicItemId,           // parent_id = the topic
                topicItemId,           // topic_id = same as parent for direct children
                idea.status,
                idea.weight || 5,
                idea.ranking,
                idea.difficulty,
                idea.order || 0,
                idea.timestamp,
                idea.status_changed_at
            ]);
        });

        saveDatabase();

        const result = {
            migrated: true,
            topicsMigrated: topics.length,
            tasksMigrated: ideas.length,
            topicIdMap: topicIdMap
        };

        console.log('[SQL-DB] ✅ Migration complete:', result);
        return result;

    } catch (error) {
        console.error('[SQL-DB] ❌ Migration failed:', error);
        return { migrated: false, error: error.message };
    }
}

/**
 * Check if database needs migration
 * @returns {boolean} - True if migration is needed
 */
function needsMigration() {
    const itemsCount = queryAsObjects('SELECT COUNT(*) as count FROM items')[0].count;
    const topicsCount = queryAsObjects('SELECT COUNT(*) as count FROM topics')[0].count;
    return itemsCount === 0 && topicsCount > 0;
}

/**
 * Ensure items table exists (for existing databases)
 */
function ensureItemsTable() {
    const tables = queryAsObjects("SELECT name FROM sqlite_master WHERE type='table' AND name='items'");
    if (tables.length === 0) {
        console.log('[SQL-DB] Creating items table...');
        db.run(`
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                parent_id INTEGER,
                topic_id INTEGER,
                item_type TEXT NOT NULL DEFAULT 'task'
                    CHECK(item_type IN ('topic', 'idea', 'task', 'project', 'reminder')),
                status TEXT NOT NULL DEFAULT 'new'
                    CHECK(status IN ('new', 'backlog', 'done')),
                weight INTEGER DEFAULT 5 CHECK(weight >= 1 AND weight <= 10),
                purpose TEXT,
                due_date TEXT,
                icon TEXT,
                color TEXT,
                ranking INTEGER DEFAULT 3 CHECK(ranking >= 1 AND ranking <= 5),
                difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
                "order" INTEGER NOT NULL DEFAULT 0,
                created_at TEXT,
                completed_at TEXT,
                FOREIGN KEY (parent_id) REFERENCES items(id),
                FOREIGN KEY (topic_id) REFERENCES items(id)
            )
        `);
        db.run('CREATE INDEX IF NOT EXISTS idx_items_parent ON items(parent_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_items_topic ON items(topic_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type)');
        db.run('CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)');
        db.run('CREATE INDEX IF NOT EXISTS idx_items_topic_status ON items(topic_id, status)');
        saveDatabase();
        console.log('[SQL-DB] ✅ Items table created');
    }
}

// Export functions for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDatabase,
        executeQuery,
        queryAsObjects,
        executeWrite,
        saveDatabase,
        getDatabaseStats,
        exportDatabaseAsJSON,
        clearDatabase,
        migrateToUnifiedItems,
        needsMigration,
        ensureItemsTable
    };
}
