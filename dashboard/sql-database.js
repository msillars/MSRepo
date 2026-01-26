/**
 * SQL Database Layer - SQLite in Browser via sql.js
 *
 * This module initializes a SQLite database in the browser using sql.js.
 * Provides the foundation for TaskManager and ProjectManager classes.
 *
 * Architecture:
 * - Uses sql.js (SQLite compiled to WebAssembly)
 * - Primary storage: GitHub (via github-storage.js)
 * - Backup storage: localStorage
 * - Provides SQL query interface
 * - Schema matches existing data structure
 */

// Global database instance
let db = null;
let SQL = null;

// GitHub storage enabled flag
let useGitHubStorage = false;

/**
 * Initialize the SQL database
 * Creates tables with schema matching current data structure
 * Tries GitHub first, falls back to localStorage
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

        // Try to load from GitHub first (if configured)
        let dbData = null;
        if (typeof fetchDatabaseFromGitHub === 'function' && isGitHubConfigured()) {
            console.log('[SQL-DB] Attempting to load from GitHub...');
            dbData = await fetchDatabaseFromGitHub();
            if (dbData) {
                useGitHubStorage = true;
                console.log('[SQL-DB] GitHub storage enabled');
            }
        }

        if (dbData) {
            // Load from GitHub
            db = new SQL.Database(dbData);
            console.log('[SQL-DB] Loaded database from GitHub');
        } else {
            // Fall back to localStorage
            const savedDb = localStorage.getItem('management_system_sql_db');

            if (savedDb) {
                // Load existing database from localStorage
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

            -- Context
            purpose TEXT,                   -- REQUIRED for topics, optional otherwise
            due_date TEXT,

            -- Display (mainly for topics)
            icon TEXT,
            color TEXT,

            -- Legacy field (kept for compatibility during transition)
            difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),

            -- Bookkeeping
            "order" INTEGER NOT NULL DEFAULT 0,
            created_at TEXT,
            completed_at TEXT,

            FOREIGN KEY (parent_id) REFERENCES items(id),
            FOREIGN KEY (topic_id) REFERENCES items(id)
        )
    `);

    // ===========================================
    // PRIORITIES SYSTEM (Jan 26, 2026)
    // ===========================================
    // Priorities are entities that items link to (many-to-many)
    // e.g., "Get healthy", "Find new job", "Sort out finances"

    db.run(`
        CREATE TABLE IF NOT EXISTS priorities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rank INTEGER NOT NULL DEFAULT 5 CHECK(rank >= 1 AND rank <= 10),
            created_at TEXT
        )
    `);

    // Priority tier descriptors (configurable labels for rank ranges)
    db.run(`
        CREATE TABLE IF NOT EXISTS priority_tiers (
            id INTEGER PRIMARY KEY,
            min_rank INTEGER NOT NULL,
            max_rank INTEGER NOT NULL,
            label TEXT NOT NULL,
            description TEXT
        )
    `);

    // Junction table for item-priority relationships (many-to-many)
    db.run(`
        CREATE TABLE IF NOT EXISTS item_priorities (
            item_id INTEGER NOT NULL,
            priority_id INTEGER NOT NULL,
            PRIMARY KEY (item_id, priority_id),
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
            FOREIGN KEY (priority_id) REFERENCES priorities(id) ON DELETE CASCADE
        )
    `);

    // Seed default priority tiers
    db.run(`
        INSERT OR IGNORE INTO priority_tiers (id, min_rank, max_rank, label, description) VALUES
        (1, 1, 2, 'Not immediate', 'Can wait'),
        (2, 3, 4, 'Attention soon', 'On the radar'),
        (3, 5, 6, 'Current', 'Actively working on'),
        (4, 7, 8, 'High', 'Distracting until sorted'),
        (5, 9, 10, 'Urgent', 'Something isn''t right')
    `);

    // Indexes for items table
    db.run('CREATE INDEX IF NOT EXISTS idx_items_parent ON items(parent_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_topic ON items(topic_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_topic_status ON items(topic_id, status)');

    // Indexes for priorities system
    db.run('CREATE INDEX IF NOT EXISTS idx_item_priorities_item ON item_priorities(item_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_item_priorities_priority ON item_priorities(priority_id)');

    // ===========================================
    // LEGACY TABLES - REMOVED (Jan 22, 2026)
    // All data now uses unified 'items' table
    // ===========================================

    console.log('[SQL-DB] ✅ Schema created successfully');

    // Save to localStorage
    saveDatabase();
}

/**
 * Save database to localStorage and GitHub (if configured)
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

        // Always save to localStorage (fast, synchronous)
        localStorage.setItem('management_system_sql_db', JSON.stringify(buffer));
        console.log('[SQL-DB] Database saved to localStorage');

        // Also save to GitHub if configured (async, debounced)
        if (useGitHubStorage && typeof saveDatabaseToGitHub === 'function') {
            // Debounce GitHub saves to avoid rate limits and excessive commits
            clearTimeout(window._githubSaveTimeout);
            window._githubSaveTimeout = setTimeout(async () => {
                try {
                    await saveDatabaseToGitHub(data);
                } catch (error) {
                    console.error('[SQL-DB] GitHub save failed:', error);
                }
            }, 3000);  // Wait 3 seconds after last change before pushing
        }
    } catch (error) {
        console.error('[SQL-DB] Failed to save database:', error);
    }
}

/**
 * Force immediate save to GitHub (bypass debounce)
 * Use before page unload or when user explicitly saves
 */
async function saveToGitHubNow() {
    if (!db || !useGitHubStorage) return false;

    clearTimeout(window._githubSaveTimeout);
    const data = db.export();
    return await saveDatabaseToGitHub(data);
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

    db.run('DELETE FROM items');

    // Reset auto-increment counters
    db.run('DELETE FROM sqlite_sequence');

    saveDatabase();

    console.log('[SQL-DB] Database cleared');
}

/**
 * Migration function - DEPRECATED
 * Legacy tables have been removed (Jan 22, 2026)
 * All data now uses unified items table exclusively
 */
function migrateToUnifiedItems() {
    console.log('[SQL-DB] Migration not needed - legacy tables removed');
    return { migrated: false, reason: 'legacy_tables_removed' };
}

/**
 * Check if database needs migration - DEPRECATED
 * Always returns false since legacy tables are removed
 */
function needsMigration() {
    return false;
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
                purpose TEXT,
                due_date TEXT,
                icon TEXT,
                color TEXT,
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

/**
 * Ensure priorities tables exist (for existing databases)
 */
function ensurePrioritiesTables() {
    const tables = queryAsObjects("SELECT name FROM sqlite_master WHERE type='table' AND name='priorities'");
    if (tables.length === 0) {
        console.log('[SQL-DB] Creating priorities tables...');

        db.run(`
            CREATE TABLE IF NOT EXISTS priorities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                rank INTEGER NOT NULL DEFAULT 5 CHECK(rank >= 1 AND rank <= 10),
                created_at TEXT
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS priority_tiers (
                id INTEGER PRIMARY KEY,
                min_rank INTEGER NOT NULL,
                max_rank INTEGER NOT NULL,
                label TEXT NOT NULL,
                description TEXT
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS item_priorities (
                item_id INTEGER NOT NULL,
                priority_id INTEGER NOT NULL,
                PRIMARY KEY (item_id, priority_id),
                FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
                FOREIGN KEY (priority_id) REFERENCES priorities(id) ON DELETE CASCADE
            )
        `);

        // Seed default priority tiers
        db.run(`
            INSERT OR IGNORE INTO priority_tiers (id, min_rank, max_rank, label, description) VALUES
            (1, 1, 2, 'Not immediate', 'Can wait'),
            (2, 3, 4, 'Attention soon', 'On the radar'),
            (3, 5, 6, 'Current', 'Actively working on'),
            (4, 7, 8, 'High', 'Distracting until sorted'),
            (5, 9, 10, 'Urgent', 'Something is not right')
        `);

        db.run('CREATE INDEX IF NOT EXISTS idx_item_priorities_item ON item_priorities(item_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_item_priorities_priority ON item_priorities(priority_id)');

        saveDatabase();
        console.log('[SQL-DB] ✅ Priorities tables created');
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
        ensureItemsTable,
        ensurePrioritiesTables
    };
}
