// Ideas Data Management System - SQL Backend Edition
// ============================================================
// This version uses SQL database as the PRIMARY data store.
// localStorage is ONLY used for backups - not for data operations.
// All function signatures remain the same for backward compatibility.
//
// Architecture:
// - Primary Storage: SQL database (via sql-database.js)
// - Backup Storage: localStorage (automatic backups before writes)
// - Event System: Dispatches 'ideasUpdated' event for cross-tab sync
// - All CRUD operations go directly to SQL
//
// Key Changes from localStorage version:
// - getIdeas() → SQL SELECT
// - saveIdeas() → SQL bulk INSERT
// - updateIdea() → SQL UPDATE
// - deleteIdea() → SQL DELETE
// - All queries use SQL WHERE clauses for filtering

// Storage Keys (for legacy backup system)
const IDEAS_STORAGE_KEY = 'management_system_ideas';
const TOPICS_STORAGE_KEY = 'management_system_topics';
const BACKUP_PREFIX = 'management_system_backup_';
const DEBUG_MODE = true; // Set to false in production

// Database initialization tracking
let dbInitialized = false;
let dbInitPromise = null;

// Debug Logger
function debugLog(operation, data) {
    if (DEBUG_MODE) {
        console.log(`[DATA] ${operation}:`, data);
    }
}

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

async function ensureDatabase() {
    if (!dbInitialized && !dbInitPromise) {
        dbInitPromise = initializeDatabase();
    }
    if (dbInitPromise) {
        await dbInitPromise;
        dbInitialized = true;
        dbInitPromise = null;
    }
}

// Synchronous check - returns true if database is ready
function isDatabaseReady() {
    return dbInitialized && typeof queryAsObjects !== 'undefined';
}

// Wait for database to be ready (for use in pages)
async function waitForDatabase() {
    if (!dbInitialized) {
        await ensureDatabase();
    }
    return true;
}

// ============================================================
// DATA BACKUP & RECOVERY SYSTEM
// ============================================================

// Create automatic backup before any write operation
function createBackup(label = 'auto') {
    try {
        // Export current SQL data as backup
        const sqlData = exportDatabaseAsJSON();
        const timestamp = new Date().toISOString();
        const backupKey = `${BACKUP_PREFIX}${label}_${timestamp}`;
        
        const backup = {
            sqlData: sqlData,
            timestamp: timestamp,
            label: label
        };
        
        localStorage.setItem(backupKey, JSON.stringify(backup));
        debugLog('BACKUP_CREATED', { key: backupKey, label });
        
        // Keep only last 10 backups
        cleanOldBackups();
        
        return backupKey;
    } catch (error) {
        console.error('Backup creation failed:', error);
        return null;
    }
}

// Clean old backups (keep last 10)
function cleanOldBackups() {
    try {
        const allKeys = Object.keys(localStorage);
        const backupKeys = allKeys
            .filter(key => key.startsWith(BACKUP_PREFIX))
            .sort()
            .reverse();
        
        // Remove backups beyond the 10 most recent
        backupKeys.slice(10).forEach(key => {
            localStorage.removeItem(key);
            debugLog('BACKUP_REMOVED', { key });
        });
    } catch (error) {
        console.error('Backup cleanup failed:', error);
    }
}

// List all available backups
function listBackups() {
    const allKeys = Object.keys(localStorage);
    const backups = allKeys
        .filter(key => key.startsWith(BACKUP_PREFIX))
        .map(key => {
            try {
                const backup = JSON.parse(localStorage.getItem(key));
                return {
                    key: key,
                    label: backup.label,
                    timestamp: backup.timestamp,
                    date: new Date(backup.timestamp)
                };
            } catch {
                return null;
            }
        })
        .filter(b => b !== null)
        .sort((a, b) => b.date - a.date);
    
    return backups;
}

// Restore from backup (uses items table)
function restoreFromBackup(backupKey) {
    try {
        debugLog('RESTORE_ATTEMPT', { backupKey });

        const backup = JSON.parse(localStorage.getItem(backupKey));
        if (!backup || !backup.sqlData) {
            throw new Error('Backup not found or invalid');
        }

        // Create a backup of current state before restoring
        createBackup('pre-restore');

        // Clear items table
        executeWrite('DELETE FROM items');

        // Restore topics to items table
        if (backup.sqlData.topics) {
            backup.sqlData.topics.forEach(topic => {
                createItem({
                    text: topic.name,
                    item_type: 'topic',
                    status: 'new',
                    icon: topic.icon,
                    color: topic.color
                });
            });
        }

        // Restore ideas to items table
        if (backup.sqlData.ideas) {
            backup.sqlData.ideas.forEach(idea => {
                createItem({
                    text: idea.text,
                    item_type: 'task',
                    status: idea.status || 'new',
                    difficulty: idea.difficulty || 'medium',
                    order: idea.order || 0
                });
            });
        }

        debugLog('RESTORE_SUCCESS', { backupKey });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Restore failed:', error);
        return false;
    }
}

// Export all data for external backup
function exportAllData() {
    const data = {
        ideas: getIdeas(),
        topics: getTopics(),
        backups: listBackups(),
        exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
}

// Import data from external backup (uses items table)
function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        // Validate data structure
        if (!data.ideas || !data.topics) {
            throw new Error('Invalid data format');
        }

        // Create backup before import
        createBackup('pre-import');

        // Clear items table
        executeWrite('DELETE FROM items');

        // Import topics to items table
        data.topics.forEach(topic => {
            createItem({
                text: topic.name,
                item_type: 'topic',
                status: 'new',
                icon: topic.icon,
                color: topic.color
            });
        });

        // Import ideas to items table
        data.ideas.forEach(idea => {
            createItem({
                text: idea.text,
                item_type: 'task',
                status: idea.status || 'new',
                difficulty: idea.difficulty || 'medium',
                order: idea.order || 0
            });
        });

        debugLog('IMPORT_SUCCESS', { itemCount: data.ideas.length, source: 'items' });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Import failed:', error);
        return false;
    }
}

// ============================================================
// DATA VALIDATION
// ============================================================

function validateIdea(idea) {
    const errors = [];
    
    if (!idea.text || typeof idea.text !== 'string' || idea.text.trim() === '') {
        errors.push('Text is required and must be a non-empty string');
    }
    
    if (!idea.id || (typeof idea.id !== 'number' && typeof idea.id !== 'string')) {
        errors.push('ID must be a number or string');
    }
    
    if (!['new', 'backlog', 'done'].includes(idea.status)) {
        errors.push('Status must be: new, backlog, or done');
    }

    if (!['easy', 'medium', 'hard'].includes(idea.difficulty)) {
        errors.push('Difficulty must be: easy, medium, or hard');
    }
    
    if (errors.length > 0) {
        debugLog('VALIDATION_FAILED', { idea, errors });
        return { valid: false, errors };
    }
    
    return { valid: true, errors: [] };
}

function validateIdeasArray(ideas) {
    if (!Array.isArray(ideas)) {
        return { valid: false, errors: ['Ideas must be an array'] };
    }
    
    const invalidIdeas = [];
    ideas.forEach((idea, index) => {
        const validation = validateIdea(idea);
        if (!validation.valid) {
            invalidIdeas.push({ index, errors: validation.errors });
        }
    });
    
    if (invalidIdeas.length > 0) {
        return { valid: false, errors: invalidIdeas };
    }
    
    return { valid: true, errors: [] };
}

// ============================================================
// TOPIC MANAGEMENT
// ============================================================

const DEFAULT_TOPICS = [
    { id: 'photography', name: 'Photography', color: '#FF6B35', icon: 'Photography.ICO' },
    { id: 'work', name: 'Work', color: '#004E89', icon: 'Work.ICO' },
    { id: 'life-admin', name: 'Life Admin', color: '#F77F00', icon: 'LifeAdmin.ICO' },
    { id: 'relationships', name: 'Relationships', color: '#06A77D', icon: 'Relationships.ICO' },
    { id: 'living', name: 'Living', color: '#9D4EDD', icon: 'Living.ICO' },
    { id: 'health', name: 'Health', color: '#E63946', icon: 'hearts.ICO' },
    { id: 'creating-this-dashboard', name: 'Creating This Dashboard', color: '#06A77D', icon: 'Ideas.ICO' }
];

// Priority levels now stored in priority_tiers table (see Priorities API below)

/**
 * Seed default topics if no topics exist in items table
 * Called during initialization to ensure a fresh database has topics
 */
function seedDefaultTopics() {
    try {
        const existingTopics = queryAsObjects('SELECT COUNT(*) as count FROM items WHERE item_type = "topic"');
        if (existingTopics[0].count > 0) {
            debugLog('TOPICS_EXIST', { count: existingTopics[0].count });
            return false; // Already has topics
        }

        console.log('[DATA] Seeding default topics to items table...');

        DEFAULT_TOPICS.forEach(topic => {
            createItem({
                text: topic.name,
                item_type: 'topic',
                status: 'new',
                icon: topic.icon,
                color: topic.color
            });
        });

        console.log(`[DATA] ✅ Seeded ${DEFAULT_TOPICS.length} default topics`);
        return true;
    } catch (error) {
        console.error('[DATA] ❌ Failed to seed default topics:', error);
        return false;
    }
}

function getTopics() {
    // MIGRATED: Now reads from items table
    try {
        const topicItems = getTopicsFromItems();
        const topics = topicItems.map(adaptItemToTopic);
        debugLog('TOPICS_LOADED', { count: topics.length, source: 'items' });
        return topics;
    } catch (error) {
        console.error('Error loading topics:', error);
        return DEFAULT_TOPICS;
    }
}

function saveTopics(topics) {
    // DEPRECATED: Use individual addTopic/updateTopic/deleteTopic instead
    // This bulk save is kept for compatibility but uses items table
    try {
        createBackup('topics-save');

        // Clear existing topics from items table
        executeWrite('DELETE FROM items WHERE item_type = "topic"');

        // Insert all topics to items table
        topics.forEach(topic => {
            createItem({
                text: topic.name,
                item_type: 'topic',
                status: 'new',
                icon: topic.icon,
                color: topic.color
            });
        });

        debugLog('TOPICS_SAVED', { count: topics.length, source: 'items' });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error saving topics:', error);
        return false;
    }
}

function updateTopic(topicId, updates) {
    // MIGRATED: Now writes to items table only
    try {
        const result = updateTopicInItems(topicId, updates);
        debugLog('TOPIC_UPDATED', { topicId, updates, source: 'items' });
        return result;
    } catch (error) {
        console.error('Error updating topic:', error);
        return false;
    }
}

function addTopic(name, priority = 'always-on', icon = null) {
    // MIGRATED: Now writes to items table only
    try {
        const result = addTopicToItems(name, priority, icon);
        if (result) {
            debugLog('TOPIC_ADDED', { name, icon, source: 'items' });
            return result.id;  // Return the new topic ID for compatibility
        }
        return null;
    } catch (error) {
        console.error('Error adding topic:', error);
        return null;
    }
}

function deleteTopic(topicId) {
    // MIGRATED: Now writes to items table only
    try {
        const result = deleteTopicFromItems(topicId);
        debugLog('TOPIC_DELETED', { topicId, source: 'items' });
        return result;
    } catch (error) {
        console.error('Error deleting topic:', error);
        return false;
    }
}

// ============================================================
// IDEAS MANAGEMENT - CORE FUNCTIONS
// ============================================================

function getIdeas() {
    // MIGRATED: Now reads from items table
    try {
        const items = queryAsObjects(`
            SELECT * FROM items
            WHERE item_type IN ('task', 'idea')
            ORDER BY id
        `);
        // Adapt to legacy format
        const ideas = items.map(item => ({
            id: item.id,
            text: item.text,
            topic: item.topic_id || 'untagged',
            difficulty: item.difficulty || 'medium',
            status: item.status || 'new',
            order: item.order || 0,
            timestamp: item.created_at,
            status_changed_at: item.completed_at,
            priorities: getItemPriorities(item.id)
        }));
        debugLog('IDEAS_LOADED', { count: ideas.length, source: 'items' });
        return ideas;
    } catch (error) {
        console.error('Error loading ideas:', error);
        return [];
    }
}

function saveIdeas(ideas) {
    // DEPRECATED: Use individual addIdea/updateIdea/deleteIdea instead
    // This bulk save is kept for compatibility but uses items table
    try {
        // Validate before saving
        const validation = validateIdeasArray(ideas);
        if (!validation.valid) {
            console.error('Cannot save invalid ideas:', validation.errors);
            return false;
        }

        createBackup('ideas-save');

        // Clear existing tasks/ideas from items table
        executeWrite('DELETE FROM items WHERE item_type IN ("task", "idea")');

        // Insert all ideas to items table
        ideas.forEach(idea => {
            // Resolve topic ID
            let topicId = null;
            if (idea.topic && idea.topic !== 'untagged') {
                const topics = getTopicsFromItems();
                const topic = topics.find(t => t.id === idea.topic || t.text.toLowerCase().replace(/\\s+/g, '-') === idea.topic);
                if (topic) topicId = topic.id;
            }

            createItem({
                text: idea.text,
                item_type: 'task',
                topic_id: topicId,
                parent_id: topicId,
                status: idea.status || 'new',
                difficulty: idea.difficulty || 'medium',
                order: idea.order || 0
            });
        });

        debugLog('IDEAS_SAVED', { count: ideas.length, source: 'items' });

        // Dispatch event for dashboard to update
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error saving ideas:', error);
        return false;
    }
}

function addIdea(text, topic = 'untagged', difficulty = 'medium', status = 'new') {
    // MIGRATED: Now writes to items table only
    try {
        const result = addIdeaToItems(text, topic, difficulty, status);
        if (result) {
            debugLog('IDEA_ADDED', { id: result.id, topic, status, source: 'items' });
        }
        return result;
    } catch (error) {
        console.error('Error adding idea:', error);
        return null;
    }
}

function updateIdea(ideaId, updates) {
    // MIGRATED: Now writes to items table only
    try {
        const result = updateIdeaInItems(ideaId, updates);
        debugLog('IDEA_UPDATED', { ideaId, updates, source: 'items' });
        return result;
    } catch (error) {
        console.error('Error updating idea:', error);
        return false;
    }
}

function deleteIdea(ideaId) {
    // MIGRATED: Now writes to items table only
    try {
        const result = deleteIdeaFromItems(ideaId);
        debugLog('IDEA_DELETED', { ideaId, source: 'items' });
        return result;
    } catch (error) {
        console.error('Error deleting idea:', error);
        return false;
    }
}

// ============================================================
// STATUS MANAGEMENT (NEW, BACKLOG, DONE)
// ============================================================

function moveIdeaToStatus(ideaId, newStatus) {
    if (!['new', 'backlog', 'done'].includes(newStatus)) {
        console.error('Invalid status:', newStatus);
        return false;
    }
    
    // Get the max order in the target status to place at end
    const ideasInTargetStatus = getIdeasByStatus(newStatus);
    const maxOrder = ideasInTargetStatus.length > 0 
        ? Math.max(...ideasInTargetStatus.map(i => i.order || 0))
        : -1;
    
    return updateIdea(ideaId, { 
        status: newStatus,
        status_changed_at: new Date().toISOString(),
        order: maxOrder + 1
    });
}

function moveToBacklog(ideaId) {
    debugLog('MOVE_TO_BACKLOG', { ideaId });
    return moveIdeaToStatus(ideaId, 'backlog');
}

function moveToDone(ideaId) {
    debugLog('MOVE_TO_DONE', { ideaId });
    return moveIdeaToStatus(ideaId, 'done');
}

function moveToNew(ideaId) {
    debugLog('MOVE_TO_NEW', { ideaId });
    return moveIdeaToStatus(ideaId, 'new');
}

// Get ideas filtered by status
function getIdeasByStatus(status, topicId = null) {
    // MIGRATED: Now reads from items table
    try {
        const items = getItemsByStatusGlobal(status, topicId);
        // Adapt to legacy format
        const ideas = items.map(item => ({
            id: item.id,
            text: item.text,
            topic: item.topic_id || 'untagged',
            difficulty: item.difficulty || 'medium',
            status: item.status || 'new',
            order: item.order || 0,
            timestamp: item.created_at,
            status_changed_at: item.completed_at,
            priorities: getItemPriorities(item.id)
        }));
        return ideas;
    } catch (error) {
        console.error('Error getting ideas by status:', error);
        return [];
    }
}

// ============================================================
// DRAG & DROP REORDERING
// ============================================================

function reorderIdeas(ideaIds, status = null, topicId = null) {
    // MIGRATED: Now writes to items table only
    try {
        const result = reorderItemsInItems(ideaIds, status, topicId);
        debugLog('IDEAS_REORDERED', {
            count: ideaIds.length,
            status,
            topicId,
            source: 'items'
        });
        return result;
    } catch (error) {
        console.error('Failed to reorder ideas:', error);
        return false;
    }
}

function moveIdeaInList(ideaId, fromIndex, toIndex, status = null, topicId = null) {
    try {
        const ideas = getIdeas();
        
        // Get the ordered list of IDs in the current view
        let viewIdeas = ideas;
        if (status) {
            viewIdeas = viewIdeas.filter(i => i.status === status);
        }
        if (topicId) {
            viewIdeas = viewIdeas.filter(i => i.topic === topicId);
        }
        
        // Sort by current order
        viewIdeas.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const ideaIds = viewIdeas.map(i => i.id);
        
        // Remove from old position and insert at new position
        const [movedId] = ideaIds.splice(fromIndex, 1);
        ideaIds.splice(toIndex, 0, movedId);
        
        return reorderIdeas(ideaIds, status, topicId);
    } catch (error) {
        console.error('Error moving idea in list:', error);
        return false;
    }
}

// ============================================================
// QUERY FUNCTIONS
// ============================================================

function getIdeasByTopic(topicId) {
    try {
        return queryAsObjects('SELECT * FROM ideas WHERE topic = ? ORDER BY "order", id', [topicId]);
    } catch (error) {
        console.error('Error getting ideas by topic:', error);
        return [];
    }
}

/**
 * Get a single idea by its ID
 * @param {Number|String} ideaId - The ID of the idea to retrieve
 * @returns {Object|null} The idea object or null if not found
 */
function getIdeaById(ideaId) {
    try {
        const results = queryAsObjects('SELECT * FROM ideas WHERE id = ?', [ideaId]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Error getting idea by ID:', error);
        return null;
    }
}

function getIdeaCounts() {
    try {
        const ideas = getIdeas();
        const counts = {
            byTopic: {},
            byStatus: { new: 0, backlog: 0, done: 0 }
        };
        
        ideas.forEach(idea => {
            counts.byTopic[idea.topic] = (counts.byTopic[idea.topic] || 0) + 1;
            counts.byStatus[idea.status] = (counts.byStatus[idea.status] || 0) + 1;
        });
        
        return counts;
    } catch (error) {
        console.error('Error getting idea counts:', error);
        return { byTopic: {}, byStatus: { new: 0, backlog: 0, done: 0 } };
    }
}

/**
 * Get top priority items - delegates to getTopPrioritiesFromItems
 * Kept for backwards compatibility
 */
function getTopPriorities(limit = 5) {
    return getTopPrioritiesFromItems(limit);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDifficultyColor(difficulty) {
    const colors = {
        'easy': '#4CAF50',
        'medium': '#FF9800',
        'hard': '#F44336'
    };
    return colors[difficulty] || colors.medium;
}

// DEPRECATED: Ranking replaced by Priorities system (Jan 26, 2026)
// Kept for backwards compatibility but will be removed
function getRankingColor(ranking) {
    const colors = ['#B0BEC5', '#90A4AE', '#FDD835', '#FF8A65', '#EF5350'];
    return colors[ranking - 1] || colors[2];
}

// ============================================================
// INITIALIZATION
// ============================================================

// ============================================================
// AUTOMATIC MIGRATIONS
// ============================================================

/**
 * Legacy migration functions - REMOVED (Jan 26, 2026)
 * Weight column has been replaced by Priorities entity system
 * See Priorities API section for the new approach
 */

// ============================================================
// UNIFIED ITEMS API (new architecture)
// ============================================================
// These functions work with the unified items table
// They will eventually replace the legacy topic/idea functions

const ITEM_TYPES = ['topic', 'idea', 'task', 'project', 'reminder'];

/**
 * Get all items of a specific type
 */
function getItemsByType(itemType) {
    try {
        return queryAsObjects(
            'SELECT * FROM items WHERE item_type = ? ORDER BY "order", id',
            [itemType]
        );
    } catch (error) {
        console.error(`Error getting ${itemType} items:`, error);
        return [];
    }
}

/**
 * Get all topics (from unified items table)
 */
function getTopicsFromItems() {
    return getItemsByType('topic');
}

/**
 * Get all items under a specific topic
 */
function getItemsByTopicId(topicId, includeTypes = null) {
    try {
        let sql = 'SELECT * FROM items WHERE topic_id = ?';
        const params = [topicId];

        if (includeTypes && includeTypes.length > 0) {
            sql += ` AND item_type IN (${includeTypes.map(() => '?').join(',')})`;
            params.push(...includeTypes);
        }

        sql += ' ORDER BY "order", id';
        return queryAsObjects(sql, params);
    } catch (error) {
        console.error('Error getting items by topic:', error);
        return [];
    }
}

/**
 * Get children of a specific item
 */
function getChildItems(parentId) {
    try {
        return queryAsObjects(
            'SELECT * FROM items WHERE parent_id = ? ORDER BY "order", id',
            [parentId]
        );
    } catch (error) {
        console.error('Error getting child items:', error);
        return [];
    }
}

/**
 * Get a single item by ID
 */
function getItem(itemId) {
    try {
        const items = queryAsObjects('SELECT * FROM items WHERE id = ?', [itemId]);
        return items.length > 0 ? items[0] : null;
    } catch (error) {
        console.error('Error getting item:', error);
        return null;
    }
}

/**
 * Create a new item
 * @param {object} item - Item data
 * @returns {object} - Created item with ID
 */
function createItem(item) {
    try {
        const now = new Date().toISOString();

        // Validate required fields
        if (!item.text || item.text.trim() === '') {
            throw new Error('Item text is required');
        }

        // Validate item type
        const itemType = item.item_type || 'task';
        if (!ITEM_TYPES.includes(itemType)) {
            throw new Error(`Invalid item_type: ${itemType}`);
        }

        // Topics must have purpose
        if (itemType === 'topic' && !item.purpose) {
            console.warn('Topic created without purpose - this should be added');
        }

        // Get max order for siblings
        let maxOrder = 0;
        if (item.parent_id) {
            const siblings = queryAsObjects(
                'SELECT MAX("order") as max_order FROM items WHERE parent_id = ?',
                [item.parent_id]
            );
            maxOrder = siblings[0]?.max_order || 0;
        } else if (itemType === 'topic') {
            const siblings = queryAsObjects(
                'SELECT MAX("order") as max_order FROM items WHERE item_type = "topic"'
            );
            maxOrder = siblings[0]?.max_order || 0;
        }

        executeWrite(`
            INSERT INTO items (text, parent_id, topic_id, item_type, status, purpose, due_date, icon, color, difficulty, "order", created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            item.text.trim(),
            item.parent_id || null,
            item.topic_id || item.parent_id || null,  // topic_id defaults to parent_id for direct children
            itemType,
            item.status || 'new',
            item.purpose || null,
            item.due_date || null,
            item.icon || null,
            item.color || null,
            item.difficulty || 'medium',
            maxOrder + 1,
            now
        ]);

        const newId = queryAsObjects('SELECT last_insert_rowid() as id')[0].id;
        debugLog('ITEM_CREATED', { id: newId, type: itemType, text: item.text });

        window.dispatchEvent(new Event('ideasUpdated'));
        return getItem(newId);

    } catch (error) {
        console.error('Error creating item:', error);
        return null;
    }
}

/**
 * Update an existing item
 */
function updateItem(itemId, updates) {
    try {
        const item = getItem(itemId);
        if (!item) {
            console.error('Item not found:', itemId);
            return false;
        }

        const fields = [];
        const params = [];

        // Build dynamic UPDATE statement
        const allowedFields = ['text', 'parent_id', 'topic_id', 'item_type', 'status', 'purpose', 'due_date', 'icon', 'color', 'difficulty', 'order'];

        allowedFields.forEach(field => {
            if (updates.hasOwnProperty(field)) {
                fields.push(`"${field}" = ?`);
                params.push(updates[field]);
            }
        });

        if (updates.status === 'done' && item.status !== 'done') {
            fields.push('completed_at = ?');
            params.push(new Date().toISOString());
        }

        if (fields.length === 0) {
            return true; // Nothing to update
        }

        params.push(itemId);
        executeWrite(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, params);

        debugLog('ITEM_UPDATED', { id: itemId, updates });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;

    } catch (error) {
        console.error('Error updating item:', error);
        return false;
    }
}

/**
 * Delete an item (and optionally its children)
 */
function deleteItem(itemId, deleteChildren = false) {
    try {
        if (deleteChildren) {
            // Recursively delete children first
            const children = getChildItems(itemId);
            children.forEach(child => deleteItem(child.id, true));
        } else {
            // Orphan children by setting parent_id to null
            executeWrite('UPDATE items SET parent_id = NULL WHERE parent_id = ?', [itemId]);
        }

        executeWrite('DELETE FROM items WHERE id = ?', [itemId]);
        debugLog('ITEM_DELETED', { id: itemId, childrenDeleted: deleteChildren });

        window.dispatchEvent(new Event('ideasUpdated'));
        return true;

    } catch (error) {
        console.error('Error deleting item:', error);
        return false;
    }
}

/**
 * Change item type (e.g., task → project when children added)
 */
function changeItemType(itemId, newType) {
    if (!ITEM_TYPES.includes(newType)) {
        console.error('Invalid item type:', newType);
        return false;
    }
    return updateItem(itemId, { item_type: newType });
}

/**
 * Move item to a new parent
 */
function moveItem(itemId, newParentId) {
    const item = getItem(itemId);
    if (!item) return false;

    // Determine new topic_id
    let newTopicId = null;
    if (newParentId) {
        const parent = getItem(newParentId);
        if (parent) {
            newTopicId = parent.item_type === 'topic' ? parent.id : parent.topic_id;
        }
    }

    return updateItem(itemId, {
        parent_id: newParentId,
        topic_id: newTopicId
    });
}

/**
 * Get items filtered by status within a topic
 */
function getItemsByStatus(topicId, status) {
    try {
        return queryAsObjects(
            'SELECT * FROM items WHERE topic_id = ? AND status = ? AND item_type != "topic" ORDER BY "order", id',
            [topicId, status]
        );
    } catch (error) {
        console.error('Error getting items by status:', error);
        return [];
    }
}

/**
 * Quick-add an idea (minimal friction capture)
 */
function quickAddIdea(text, topicId = null) {
    return createItem({
        text: text,
        item_type: 'idea',
        parent_id: topicId,
        topic_id: topicId,
        status: 'new'
    });
}

/**
 * Promote idea to task
 */
function promoteIdeaToTask(itemId) {
    return changeItemType(itemId, 'task');
}

/**
 * Check if item has children (making it effectively a project)
 */
function hasChildren(itemId) {
    const children = getChildItems(itemId);
    return children.length > 0;
}

/**
 * Auto-promote to project if children are added
 */
function autoPromoteIfNeeded(itemId) {
    const item = getItem(itemId);
    if (item && item.item_type === 'task' && hasChildren(itemId)) {
        changeItemType(itemId, 'project');
        debugLog('AUTO_PROMOTED', { id: itemId, from: 'task', to: 'project' });
    }
}

// ============================================================
// ITEMS API - UI BRIDGE FUNCTIONS
// ============================================================
// These functions bridge the Items API to the UI layer,
// providing the same interface as legacy functions

/**
 * Get items by status, optionally filtered by topic
 * Works globally (no topicId) or scoped to a topic
 */
function getItemsByStatusGlobal(status, topicId = null) {
    try {
        if (topicId) {
            return queryAsObjects(
                'SELECT * FROM items WHERE topic_id = ? AND status = ? AND item_type != "topic" ORDER BY "order", id',
                [topicId, status]
            );
        } else {
            return queryAsObjects(
                'SELECT * FROM items WHERE status = ? AND item_type != "topic" ORDER BY "order", id',
                [status]
            );
        }
    } catch (error) {
        console.error('Error getting items by status:', error);
        return [];
    }
}

/**
 * Get top priority items based on linked Priority entities
 * Items are scored by their highest linked priority rank
 */
function getTopPrioritiesFromItems(limit = 5) {
    try {
        // Get all non-done items with their highest priority rank
        const items = queryAsObjects(`
            SELECT i.*,
                   COALESCE(MAX(p.rank), 0) as max_priority_rank
            FROM items i
            LEFT JOIN item_priorities ip ON i.id = ip.item_id
            LEFT JOIN priorities p ON ip.priority_id = p.id
            WHERE i.item_type IN ('task', 'idea')
            AND i.status != 'done'
            GROUP BY i.id
            ORDER BY max_priority_rank DESC, i.created_at DESC
        `);

        // Get all topics for enrichment
        const topics = getTopicsFromItems();
        const topicMap = {};
        topics.forEach(t => {
            topicMap[t.id] = t;
        });

        // Enrich each item with topic info and priorities
        const enriched = items.map(item => {
            const topic = topicMap[item.topic_id];
            const itemPriorities = getItemPriorities(item.id);

            return {
                ...item,
                score: item.max_priority_rank,
                priorities: itemPriorities,
                topicName: topic ? topic.text : 'Untagged',
                topicColor: topic ? topic.color : '#999',
                topicIcon: topic ? topic.icon : null,
                // Map to legacy field names for compatibility
                topic: item.topic_id,
                timestamp: item.created_at
            };
        });

        return enriched.slice(0, limit);
    } catch (error) {
        console.error('Error getting top priorities from items:', error);
        return [];
    }
}

/**
 * Get item counts by topic and status from items table
 * Replicates legacy getIdeaCounts() behavior
 */
function getItemCountsFromItems() {
    try {
        const counts = {
            byTopic: {},
            byStatus: { new: 0, backlog: 0, done: 0 },
            total: 0
        };

        // Count non-topic items grouped by topic_id
        const topicCounts = queryAsObjects(`
            SELECT topic_id, COUNT(*) as count
            FROM items
            WHERE item_type != 'topic'
            GROUP BY topic_id
        `);

        topicCounts.forEach(row => {
            if (row.topic_id) {
                counts.byTopic[row.topic_id] = row.count;
            }
        });

        // Count by status
        const statusCounts = queryAsObjects(`
            SELECT status, COUNT(*) as count
            FROM items
            WHERE item_type != 'topic'
            GROUP BY status
        `);

        statusCounts.forEach(row => {
            counts.byStatus[row.status] = row.count;
            counts.total += row.count;
        });

        return counts;
    } catch (error) {
        console.error('Error getting item counts:', error);
        return { byTopic: {}, byStatus: { new: 0, backlog: 0, done: 0 }, total: 0 };
    }
}

/**
 * Adapt an item to legacy idea format for rendering compatibility
 */
function adaptItemToIdea(item) {
    return {
        id: item.id,
        text: item.text,
        topic: item.topic_id || 'untagged',
        difficulty: item.difficulty || 'medium',
        status: item.status || 'new',
        timestamp: item.created_at,
        order: item.order || 0,
        status_changed_at: item.completed_at || null,
        // Include linked priorities for display
        priorities: getItemPriorities(item.id)
    };
}

/**
 * Adapt an item to legacy topic format for rendering compatibility
 */
function adaptItemToTopic(item) {
    return {
        id: item.id,
        name: item.text,
        color: item.color || '#999',
        icon: item.icon || 'Door.ICO',
        // Include linked priorities for display
        priorities: getItemPriorities(item.id)
    };
}

/**
 * Get all active (non-done) items from items table
 */
function getActiveItemsFromItems() {
    try {
        return queryAsObjects(`
            SELECT * FROM items
            WHERE status != 'done'
            AND item_type IN ('task', 'idea')
            ORDER BY "order", id
        `);
    } catch (error) {
        console.error('Error getting active items:', error);
        return [];
    }
}

// ============================================================
// ITEMS API - WRITE WRAPPERS
// ============================================================
// These functions provide the same interface as legacy functions
// but write to the unified items table only (no dual-write)

/**
 * Add a new idea/task using Items API
 * Replaces legacy addIdea() - same signature for compatibility
 */
function addIdeaToItems(text, topicId = null, difficulty = 'medium', status = 'new') {
    // Find topic item to get proper topic_id
    let resolvedTopicId = null;
    if (topicId && topicId !== 'untagged') {
        // topicId might be a string like 'photography' - need to find the item
        const topics = getTopicsFromItems();
        const topic = topics.find(t => t.id === topicId || t.text.toLowerCase().replace(/\s+/g, '-') === topicId);
        if (topic) {
            resolvedTopicId = topic.id;
        }
    }

    const item = createItem({
        text: text,
        item_type: 'task',  // Default to task (can be idea if raw capture)
        topic_id: resolvedTopicId,
        parent_id: resolvedTopicId,  // Direct child of topic
        status: status,
        difficulty: difficulty
    });

    // Return in legacy format for compatibility
    if (item) {
        return adaptItemToIdea(item);
    }
    return null;
}

/**
 * Update an idea/task using Items API
 * Replaces legacy updateIdea() - same signature for compatibility
 */
function updateIdeaInItems(ideaId, updates) {
    // Map legacy field names to items table fields
    const itemUpdates = {};

    if (updates.text !== undefined) itemUpdates.text = updates.text;
    if (updates.status !== undefined) itemUpdates.status = updates.status;
    if (updates.difficulty !== undefined) itemUpdates.difficulty = updates.difficulty;
    if (updates.order !== undefined) itemUpdates.order = updates.order;

    // Handle topic change
    if (updates.topic !== undefined) {
        const topics = getTopicsFromItems();
        const topic = topics.find(t => t.id === updates.topic || t.text.toLowerCase().replace(/\s+/g, '-') === updates.topic);
        if (topic) {
            itemUpdates.topic_id = topic.id;
            itemUpdates.parent_id = topic.id;
        }
    }

    return updateItem(ideaId, itemUpdates);
}

/**
 * Delete an idea/task using Items API
 * Replaces legacy deleteIdea()
 */
function deleteIdeaFromItems(ideaId) {
    return deleteItem(ideaId, false);  // Don't delete children
}

/**
 * Add a new topic using Items API
 * Replaces legacy addTopic()
 */
function addTopicToItems(name, priority = 'always-on', icon = null) {
    const item = createItem({
        text: name,
        item_type: 'topic',
        status: 'new',  // Topics are ongoing
        icon: icon,
        color: getDefaultTopicColor(name)  // Generate a default color
    });

    if (item) {
        return adaptItemToTopic(item);
    }
    return null;
}

/**
 * Update a topic using Items API
 * Replaces legacy updateTopic()
 */
function updateTopicInItems(topicId, updates) {
    const itemUpdates = {};

    if (updates.name !== undefined) itemUpdates.text = updates.name;
    if (updates.icon !== undefined) itemUpdates.icon = updates.icon;
    if (updates.color !== undefined) itemUpdates.color = updates.color;

    return updateItem(topicId, itemUpdates);
}

/**
 * Delete a topic using Items API
 * Replaces legacy deleteTopic()
 */
function deleteTopicFromItems(topicId) {
    // Orphan children (don't delete them)
    return deleteItem(topicId, false);
}

/**
 * Get a default color for a topic based on its name
 */
function getDefaultTopicColor(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

/**
 * Move idea to a new status using Items API
 * Replaces legacy moveIdeaToStatus()
 */
function moveIdeaToStatusInItems(ideaId, newStatus) {
    return updateItem(ideaId, { status: newStatus });
}

/**
 * Reorder items within a status/topic
 * Replaces legacy reorderIdeas()
 */
function reorderItemsInItems(itemIds, status, topicId) {
    try {
        itemIds.forEach((id, index) => {
            executeWrite('UPDATE items SET "order" = ? WHERE id = ?', [index, id]);
        });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error reordering items:', error);
        return false;
    }
}

// ============================================================
// PRIORITIES API (Jan 26, 2026)
// ============================================================
// Priorities are named entities that items link to (many-to-many)
// e.g., "Get healthy", "Find new job", "Sort out finances"
// Each Priority has a rank (1-10) with tier descriptors

/**
 * Get all priorities
 */
function getPriorities() {
    try {
        return queryAsObjects('SELECT * FROM priorities ORDER BY rank DESC, name');
    } catch (error) {
        console.error('Error getting priorities:', error);
        return [];
    }
}

/**
 * Get a single priority by ID
 */
function getPriority(priorityId) {
    try {
        const results = queryAsObjects('SELECT * FROM priorities WHERE id = ?', [priorityId]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Error getting priority:', error);
        return null;
    }
}

/**
 * Create a new priority
 * @param {string} name - Priority name (e.g., "Get healthy")
 * @param {number} rank - Rank 1-10
 */
function createPriority(name, rank = 5) {
    try {
        if (!name || name.trim() === '') {
            throw new Error('Priority name is required');
        }
        if (rank < 1 || rank > 10) {
            throw new Error('Rank must be between 1 and 10');
        }

        const now = new Date().toISOString();
        executeWrite(
            'INSERT INTO priorities (name, rank, created_at) VALUES (?, ?, ?)',
            [name.trim(), rank, now]
        );

        const newId = queryAsObjects('SELECT last_insert_rowid() as id')[0].id;
        debugLog('PRIORITY_CREATED', { id: newId, name, rank });

        window.dispatchEvent(new Event('prioritiesUpdated'));
        return getPriority(newId);
    } catch (error) {
        console.error('Error creating priority:', error);
        return null;
    }
}

/**
 * Update a priority
 */
function updatePriority(priorityId, updates) {
    try {
        const fields = [];
        const params = [];

        if (updates.name !== undefined) {
            fields.push('name = ?');
            params.push(updates.name.trim());
        }
        if (updates.rank !== undefined) {
            if (updates.rank < 1 || updates.rank > 10) {
                throw new Error('Rank must be between 1 and 10');
            }
            fields.push('rank = ?');
            params.push(updates.rank);
        }

        if (fields.length === 0) return true;

        params.push(priorityId);
        executeWrite(`UPDATE priorities SET ${fields.join(', ')} WHERE id = ?`, params);

        debugLog('PRIORITY_UPDATED', { id: priorityId, updates });
        window.dispatchEvent(new Event('prioritiesUpdated'));
        return true;
    } catch (error) {
        console.error('Error updating priority:', error);
        return false;
    }
}

/**
 * Delete a priority (also removes all item links)
 */
function deletePriority(priorityId) {
    try {
        // Junction table has ON DELETE CASCADE, so links are auto-removed
        executeWrite('DELETE FROM priorities WHERE id = ?', [priorityId]);
        debugLog('PRIORITY_DELETED', { id: priorityId });
        window.dispatchEvent(new Event('prioritiesUpdated'));
        return true;
    } catch (error) {
        console.error('Error deleting priority:', error);
        return false;
    }
}

/**
 * Link an item to a priority
 */
function linkItemToPriority(itemId, priorityId) {
    try {
        executeWrite(
            'INSERT OR IGNORE INTO item_priorities (item_id, priority_id) VALUES (?, ?)',
            [itemId, priorityId]
        );
        debugLog('ITEM_PRIORITY_LINKED', { itemId, priorityId });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error linking item to priority:', error);
        return false;
    }
}

/**
 * Unlink an item from a priority
 */
function unlinkItemFromPriority(itemId, priorityId) {
    try {
        executeWrite(
            'DELETE FROM item_priorities WHERE item_id = ? AND priority_id = ?',
            [itemId, priorityId]
        );
        debugLog('ITEM_PRIORITY_UNLINKED', { itemId, priorityId });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error unlinking item from priority:', error);
        return false;
    }
}

/**
 * Get all priorities for an item
 */
function getItemPriorities(itemId) {
    try {
        return queryAsObjects(`
            SELECT p.* FROM priorities p
            JOIN item_priorities ip ON p.id = ip.priority_id
            WHERE ip.item_id = ?
            ORDER BY p.rank DESC, p.name
        `, [itemId]);
    } catch (error) {
        console.error('Error getting item priorities:', error);
        return [];
    }
}

/**
 * Get all items linked to a priority
 */
function getItemsByPriority(priorityId) {
    try {
        return queryAsObjects(`
            SELECT i.* FROM items i
            JOIN item_priorities ip ON i.id = ip.item_id
            WHERE ip.priority_id = ?
            ORDER BY i."order", i.id
        `, [priorityId]);
    } catch (error) {
        console.error('Error getting items by priority:', error);
        return [];
    }
}

/**
 * Get the highest priority rank for an item (for sorting/display)
 * Returns 0 if item has no priorities
 */
function getItemHighestPriorityRank(itemId) {
    try {
        const result = queryAsObjects(`
            SELECT MAX(p.rank) as max_rank FROM priorities p
            JOIN item_priorities ip ON p.id = ip.priority_id
            WHERE ip.item_id = ?
        `, [itemId]);
        return result[0]?.max_rank || 0;
    } catch (error) {
        console.error('Error getting item highest priority:', error);
        return 0;
    }
}

/**
 * Get priority tier info for a rank value
 */
function getPriorityTier(rank) {
    try {
        const tiers = queryAsObjects(`
            SELECT * FROM priority_tiers
            WHERE min_rank <= ? AND max_rank >= ?
        `, [rank, rank]);
        return tiers.length > 0 ? tiers[0] : null;
    } catch (error) {
        console.error('Error getting priority tier:', error);
        // Fallback to hardcoded tiers
        if (rank <= 2) return { label: 'Not immediate', description: 'Can wait' };
        if (rank <= 4) return { label: 'Attention soon', description: 'On the radar' };
        if (rank <= 6) return { label: 'Current', description: 'Actively working on' };
        if (rank <= 8) return { label: 'High', description: 'Distracting until sorted' };
        return { label: 'Urgent', description: 'Something is not right' };
    }
}

/**
 * Get all priority tiers
 */
function getPriorityTiers() {
    try {
        return queryAsObjects('SELECT * FROM priority_tiers ORDER BY min_rank');
    } catch (error) {
        console.error('Error getting priority tiers:', error);
        return [];
    }
}

/**
 * Set all priorities for an item (replaces existing links)
 * @param {number} itemId
 * @param {number[]} priorityIds - Array of priority IDs
 */
function setItemPriorities(itemId, priorityIds) {
    try {
        // Remove existing links
        executeWrite('DELETE FROM item_priorities WHERE item_id = ?', [itemId]);

        // Add new links
        priorityIds.forEach(priorityId => {
            executeWrite(
                'INSERT INTO item_priorities (item_id, priority_id) VALUES (?, ?)',
                [itemId, priorityId]
            );
        });

        debugLog('ITEM_PRIORITIES_SET', { itemId, priorityIds });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error setting item priorities:', error);
        return false;
    }
}

// Initialize database immediately when module loads
const DB_READY_EVENT = 'databaseReady';

(async function() {
    try {
        console.log('[DATA] Initializing SQL database...');
        await ensureDatabase();

        // Seed default topics if database is empty
        seedDefaultTopics();

        // Ensure unified items table exists
        ensureItemsTable();

        // Ensure priorities tables exist
        if (typeof ensurePrioritiesTables === 'function') {
            ensurePrioritiesTables();
        }

        if (DEBUG_MODE) {
            const stats = getDatabaseStats();
            debugLog('DATA_LAYER_LOADED', {
                sqlBacked: true,
                itemsCount: stats.items || 0,
                backupsCount: listBackups().length
            });
        }

        // Dispatch ready event so pages can wait for it
        window.dispatchEvent(new CustomEvent(DB_READY_EVENT));
        console.log('[DATA] ✅ Database ready - dispatched databaseReady event');

    } catch (error) {
        console.error('[DATA] ❌ Failed to initialize database on load:', error);
    }
})();

// ============================================================
// DIAGNOSTIC FUNCTIONS
// ============================================================

/**
 * Get database statistics
 * Run in browser console: getDbStats()
 */
function getDbStats() {
    const itemsTotal = queryAsObjects('SELECT COUNT(*) as count FROM items')[0].count;
    const itemsTopics = queryAsObjects('SELECT COUNT(*) as count FROM items WHERE item_type = "topic"')[0].count;
    const itemsTasks = queryAsObjects('SELECT COUNT(*) as count FROM items WHERE item_type = "task"')[0].count;
    const itemsByStatus = queryAsObjects(`
        SELECT status, COUNT(*) as count FROM items
        WHERE item_type = 'task'
        GROUP BY status
    `);

    console.log('=== DATABASE STATS ===');
    console.log(`Items table total: ${itemsTotal} rows`);
    console.log(`  - Topics: ${itemsTopics}`);
    console.log(`  - Tasks: ${itemsTasks}`);
    console.log('Tasks by status:');
    itemsByStatus.forEach(s => console.log(`  - ${s.status}: ${s.count}`));

    return {
        total: itemsTotal,
        topics: itemsTopics,
        tasks: itemsTasks,
        byStatus: itemsByStatus
    };
}
