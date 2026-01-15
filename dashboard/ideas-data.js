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

// Restore from backup
function restoreFromBackup(backupKey) {
    try {
        debugLog('RESTORE_ATTEMPT', { backupKey });
        
        const backup = JSON.parse(localStorage.getItem(backupKey));
        if (!backup || !backup.sqlData) {
            throw new Error('Backup not found or invalid');
        }
        
        // Create a backup of current state before restoring
        createBackup('pre-restore');
        
        // Clear current database
        clearDatabase();
        
        // Restore topics
        backup.sqlData.topics.forEach(topic => {
            executeWrite(
                'INSERT INTO topics (id, name, priority, color, icon) VALUES (?, ?, ?, ?, ?)',
                [topic.id, topic.name, topic.priority, topic.color, topic.icon || null]
            );
        });
        
        // Restore ideas
        backup.sqlData.ideas.forEach(idea => {
            executeWrite(
                'INSERT INTO ideas (id, text, topic, ranking, difficulty, status, "order", timestamp, status_changed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [idea.id, idea.text, idea.topic, idea.ranking, idea.difficulty, idea.status, idea.order, idea.timestamp, idea.status_changed_at || null]
            );
        });
        
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

// Import data from external backup
function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        
        // Validate data structure
        if (!data.ideas || !data.topics) {
            throw new Error('Invalid data format');
        }
        
        // Create backup before import
        createBackup('pre-import');
        
        // Clear and reimport
        clearDatabase();
        
        // Import topics
        data.topics.forEach(topic => {
            executeWrite(
                'INSERT INTO topics (id, name, priority, color, icon) VALUES (?, ?, ?, ?, ?)',
                [topic.id, topic.name, topic.priority, topic.color, topic.icon || null]
            );
        });
        
        // Import ideas
        data.ideas.forEach(idea => {
            executeWrite(
                'INSERT INTO ideas (id, text, topic, ranking, difficulty, status, "order", timestamp, status_changed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [idea.id || Date.now(), idea.text, idea.topic, idea.ranking, idea.difficulty, idea.status, idea.order || 0, idea.timestamp, idea.status_changed_at || null]
            );
        });
        
        debugLog('IMPORT_SUCCESS', { itemCount: data.ideas.length });
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
    
    if (!Number.isInteger(idea.ranking) || idea.ranking < 1 || idea.ranking > 5) {
        errors.push('Ranking must be an integer between 1 and 5');
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
    { id: 'photography', name: 'Photography', priority: 'always-on', color: '#FF6B35', icon: 'Photography.ICO', weight: 5 },
    { id: 'work', name: 'Work', priority: 'priority', color: '#004E89', icon: 'Work.ICO', weight: 7 },
    { id: 'life-admin', name: 'Life Admin', priority: 'do-prep', color: '#F77F00', icon: 'LifeAdmin.ICO', weight: 5 },
    { id: 'relationships', name: 'Relationships', priority: 'always-on', color: '#06A77D', icon: 'Relationships.ICO', weight: 6 },
    { id: 'living', name: 'Living', priority: 'getting-important', color: '#9D4EDD', icon: 'Living.ICO', weight: 4 },
    { id: 'health', name: 'Health', priority: 'always-on', color: '#E63946', icon: 'hearts.ICO', weight: 7 },
    { id: 'creating-this-dashboard', name: 'Creating This Dashboard', priority: 'do-prep', color: '#06A77D', icon: 'Ideas.ICO', weight: 3 }
];

const PRIORITY_LEVELS = {
    'always-on': { label: 'Always on', weight: 1, color: '#95B8D1' },
    'do-prep': { label: 'Do prep for', weight: 2, color: '#B8E0D2' },
    'getting-important': { label: 'Getting important', weight: 3, color: '#FDD835' },
    'priority': { label: 'Priority', weight: 4, color: '#FF8A65' },
    'urgent': { label: 'Urgent', weight: 5, color: '#EF5350' }
};

/**
 * Seed default topics if the topics table is empty
 * Called during initialization to ensure a fresh database has topics
 */
function seedDefaultTopics() {
    try {
        const existingTopics = queryAsObjects('SELECT COUNT(*) as count FROM topics');
        if (existingTopics[0].count > 0) {
            debugLog('TOPICS_EXIST', { count: existingTopics[0].count });
            return false; // Already has topics
        }

        console.log('[DATA] Seeding default topics...');

        DEFAULT_TOPICS.forEach(topic => {
            executeWrite(
                'INSERT INTO topics (id, name, priority, color, icon, weight) VALUES (?, ?, ?, ?, ?, ?)',
                [topic.id, topic.name, topic.priority, topic.color, topic.icon, topic.weight]
            );
        });

        console.log(`[DATA] ✅ Seeded ${DEFAULT_TOPICS.length} default topics`);
        return true;
    } catch (error) {
        console.error('[DATA] ❌ Failed to seed default topics:', error);
        return false;
    }
}

function getTopics() {
    try {
        const topics = queryAsObjects('SELECT * FROM topics ORDER BY id');
        debugLog('TOPICS_LOADED', { count: topics.length });
        return topics;
    } catch (error) {
        console.error('Error loading topics:', error);
        return DEFAULT_TOPICS;
    }
}

function saveTopics(topics) {
    try {
        createBackup('topics-save');
        
        // Clear existing topics
        executeWrite('DELETE FROM topics');
        
        // Insert all topics
        topics.forEach(topic => {
            executeWrite(
                'INSERT INTO topics (id, name, priority, color, icon) VALUES (?, ?, ?, ?, ?)',
                [topic.id, topic.name, topic.priority, topic.color, topic.icon || null]
            );
        });
        
        debugLog('TOPICS_SAVED', { count: topics.length });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error saving topics:', error);
        return false;
    }
}

function updateTopic(topicId, updates) {
    try {
        const topics = getTopics();
        const topic = topics.find(t => t.id === topicId);
        if (!topic) {
            console.error('Topic not found:', topicId);
            return false;
        }
        
        const updated = { ...topic, ...updates };
        
        // Check if weight column exists in database
        const hasWeight = queryAsObjects("PRAGMA table_info(topics)").some(col => col.name === 'weight');
        
        if (hasWeight) {
            executeWrite(
                'UPDATE topics SET name = ?, priority = ?, color = ?, icon = ?, weight = ? WHERE id = ?',
                [updated.name, updated.priority, updated.color, updated.icon || null, updated.weight || 5, topicId]
            );
        } else {
            executeWrite(
                'UPDATE topics SET name = ?, priority = ?, color = ?, icon = ? WHERE id = ?',
                [updated.name, updated.priority, updated.color, updated.icon || null, topicId]
            );
        }
        
        debugLog('TOPIC_UPDATED', { topicId, updates });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error updating topic:', error);
        return false;
    }
}

function addTopic(name, priority = 'always-on', icon = null, weight = 5) {
    try {
        const topics = getTopics();
        const id = name.toLowerCase().replace(/\s+/g, '-');
        const colors = ['#FF6B35', '#004E89', '#F77F00', '#06A77D', '#9D4EDD', '#D62828', '#2A9D8F'];
        const color = colors[topics.length % colors.length];
        
        // Check if weight column exists in database
        const hasWeight = queryAsObjects("PRAGMA table_info(topics)").some(col => col.name === 'weight');
        
        if (hasWeight) {
            executeWrite(
                'INSERT INTO topics (id, name, priority, color, icon, weight) VALUES (?, ?, ?, ?, ?, ?)',
                [id, name, priority, color, icon, weight]
            );
        } else {
            executeWrite(
                'INSERT INTO topics (id, name, priority, color, icon) VALUES (?, ?, ?, ?, ?)',
                [id, name, priority, color, icon]
            );
        }
        
        debugLog('TOPIC_ADDED', { id, name, icon, weight });
        window.dispatchEvent(new Event('ideasUpdated'));
        return id;
    } catch (error) {
        console.error('Error adding topic:', error);
        return null;
    }
}

function deleteTopic(topicId) {
    try {
        createBackup('topic-delete');
        
        // First, update all ideas with this topic to be untagged
        const ideasWithTopic = getIdeasByTopic(topicId);
        ideasWithTopic.forEach(idea => {
            executeWrite(
                'UPDATE ideas SET topic = ? WHERE id = ?',
                ['untagged', idea.id]
            );
        });
        
        debugLog('IDEAS_UNTAGGED', { topicId, count: ideasWithTopic.length });
        
        // Then delete the topic
        executeWrite('DELETE FROM topics WHERE id = ?', [topicId]);
        
        debugLog('TOPIC_DELETED', { topicId });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error deleting topic:', error);
        return false;
    }
}

// ============================================================
// IDEAS MANAGEMENT - CORE FUNCTIONS
// ============================================================

function getIdeas() {
    try {
        const ideas = queryAsObjects('SELECT * FROM ideas ORDER BY id');
        debugLog('IDEAS_LOADED', { count: ideas.length });
        return ideas;
    } catch (error) {
        console.error('Error loading ideas:', error);
        return [];
    }
}

function saveIdeas(ideas) {
    try {
        // Validate before saving
        const validation = validateIdeasArray(ideas);
        if (!validation.valid) {
            console.error('Cannot save invalid ideas:', validation.errors);
            return false;
        }
        
        createBackup('ideas-save');
        
        // Clear existing ideas
        executeWrite('DELETE FROM ideas');
        
        // Insert all ideas
        ideas.forEach(idea => {
            executeWrite(
                'INSERT INTO ideas (id, text, project, ranking, difficulty, status, "order", timestamp, status_changed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [idea.id, idea.text, idea.project, idea.ranking, idea.difficulty, idea.status, idea.order || 0, idea.timestamp, idea.status_changed_at || null]
            );
        });
        
        debugLog('IDEAS_SAVED', { count: ideas.length });
        
        // Dispatch event for dashboard to update
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error saving ideas:', error);
        return false;
    }
}

function addIdea(text, topic = 'untagged', ranking = 3, difficulty = 'medium', status = 'new', weight = null) {
    try {
        // Get max order for this status to place new idea at end
        const existingInStatus = getIdeasByStatus(status);
        const maxOrder = existingInStatus.length > 0 
            ? Math.max(...existingInStatus.map(i => i.order || 0))
            : -1;
        
        const newId = Date.now();
        const timestamp = new Date().toISOString();
        
        // If weight not provided, derive from ranking (1→2, 2→4, 3→5, 4→7, 5→9)
        if (weight === null) {
            const rankingToWeight = { 1: 2, 2: 4, 3: 5, 4: 7, 5: 9 };
            weight = rankingToWeight[ranking] || 5;
        }
        
        const newIdea = {
            id: newId,
            text: text.trim(),
            topic: topic,
            ranking: ranking,
            difficulty: difficulty,
            timestamp: timestamp,
            status: status,
            order: maxOrder + 1,
            weight: weight
        };
        
        // Validate before adding
        const validation = validateIdea(newIdea);
        if (!validation.valid) {
            console.error('Cannot add invalid idea:', validation.errors);
            return null;
        }
        
        // Check if weight column exists in database
        const hasWeight = queryAsObjects("PRAGMA table_info(ideas)").some(col => col.name === 'weight');
        
        if (hasWeight) {
            executeWrite(
                'INSERT INTO ideas (id, text, topic, ranking, difficulty, status, "order", timestamp, weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newId, newIdea.text, topic, ranking, difficulty, status, maxOrder + 1, timestamp, weight]
            );
        } else {
            executeWrite(
                'INSERT INTO ideas (id, text, topic, ranking, difficulty, status, "order", timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [newId, newIdea.text, topic, ranking, difficulty, status, maxOrder + 1, timestamp]
            );
        }
        
        debugLog('IDEA_ADDED', { id: newId, topic, status, weight });
        window.dispatchEvent(new Event('ideasUpdated'));
        return newIdea;
    } catch (error) {
        console.error('Error adding idea:', error);
        return null;
    }
}

function updateIdea(ideaId, updates) {
    try {
        const ideas = getIdeas();
        const idea = ideas.find(i => i.id == ideaId); // Use == to handle both string and number IDs
        
        if (!idea) {
            console.error('Idea not found:', ideaId);
            return false;
        }
        
        const updated = { ...idea, ...updates };
        
        // Check if weight column exists in database
        const hasWeight = queryAsObjects("PRAGMA table_info(ideas)").some(col => col.name === 'weight');
        
        if (hasWeight) {
            executeWrite(
                'UPDATE ideas SET text = ?, topic = ?, ranking = ?, difficulty = ?, status = ?, "order" = ?, status_changed_at = ?, weight = ? WHERE id = ?',
                [updated.text, updated.topic, updated.ranking, updated.difficulty, updated.status, updated.order, updated.status_changed_at || null, updated.weight || 5, ideaId]
            );
        } else {
            executeWrite(
                'UPDATE ideas SET text = ?, topic = ?, ranking = ?, difficulty = ?, status = ?, "order" = ?, status_changed_at = ? WHERE id = ?',
                [updated.text, updated.topic, updated.ranking, updated.difficulty, updated.status, updated.order, updated.status_changed_at || null, ideaId]
            );
        }
        
        debugLog('IDEA_UPDATED', { ideaId, updates });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
    } catch (error) {
        console.error('Error updating idea:', error);
        return false;
    }
}

function deleteIdea(ideaId) {
    try {
        executeWrite('DELETE FROM ideas WHERE id = ?', [ideaId]);
        debugLog('IDEA_DELETED', { ideaId });
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
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
    try {
        let sql = 'SELECT * FROM ideas WHERE status = ?';
        let params = [status];
        
        if (topicId) {
            sql += ' AND topic = ?';
            params.push(topicId);
        }
        
        sql += ' ORDER BY "order", id';
        
        const ideas = queryAsObjects(sql, params);
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
    try {
        const ideas = getIdeas();
        
        // For each ID in the new order, update its order value
        ideaIds.forEach((id, index) => {
            const idea = ideas.find(i => i.id == id); // Use == to handle both types
            if (idea) {
                executeWrite('UPDATE ideas SET "order" = ? WHERE id = ?', [index, id]);
                debugLog('ORDER_UPDATED', { id, newOrder: index, status, topicId });
            } else {
                console.error('Idea not found for reordering:', id);
            }
        });
        
        debugLog('IDEAS_REORDERED', { 
            count: ideaIds.length, 
            status, 
            topicId,
            orders: ideaIds.map((id, idx) => ({ id, order: idx }))
        });
        
        window.dispatchEvent(new Event('ideasUpdated'));
        return true;
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

function getTopPriorities(limit = 5) {
    try {
        const ideas = getIdeas().filter(i => i.status !== 'done');
        const topics = getTopics();
        
        const scored = ideas.map(idea => {
            const topic = topics.find(t => t.id === idea.topic);
            // Use numeric weight if available, otherwise fall back to categorical priority weight
            const topicWeight = topic && topic.weight ? topic.weight : (topic ? PRIORITY_LEVELS[topic.priority].weight : 1);
            const score = (idea.ranking * 2) + topicWeight;
            return { ...idea, score, topicName: topic ? topic.name : 'Unknown' };
        });
        
        scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        return scored.slice(0, limit);
    } catch (error) {
        console.error('Error getting top priorities:', error);
        return [];
    }
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
 * Automatically add weight column to ideas table if it doesn't exist
 */
function autoMigrateIdeaWeights() {
    try {
        const columns = queryAsObjects("PRAGMA table_info(ideas)");
        const hasWeight = columns.some(col => col.name === 'weight');

        if (!hasWeight) {
            console.log('[MIGRATION] Adding weight column to ideas table...');
            createBackup('auto-migration-idea-weight');

            // Add weight column with default value of 5
            executeWrite('ALTER TABLE ideas ADD COLUMN weight INTEGER DEFAULT 5');

            // Get all ideas and update their weights based on ranking
            const ideas = queryAsObjects('SELECT id, ranking FROM ideas');
            const rankingToWeight = { 1: 2, 2: 4, 3: 5, 4: 7, 5: 9 };

            ideas.forEach(idea => {
                const weight = rankingToWeight[idea.ranking] || 5;
                executeWrite('UPDATE ideas SET weight = ? WHERE id = ?', [weight, idea.id]);
            });

            console.log(`[MIGRATION] ✅ Added weight column and updated ${ideas.length} ideas`);
            return true;
        }

        return false; // Already has weight column
    } catch (error) {
        console.error('[MIGRATION] ❌ Failed to add weight column:', error);
        return false;
    }
}

/**
 * Automatically add weight column to topics table if it doesn't exist
 */
function autoMigrateTopicWeights() {
    try {
        const columns = queryAsObjects("PRAGMA table_info(topics)");
        const hasWeight = columns.some(col => col.name === 'weight');

        if (!hasWeight) {
            console.log('[MIGRATION] Adding weight column to topics table...');
            createBackup('auto-migration-topic-weight');

            // Add weight column with default value of 5
            executeWrite('ALTER TABLE topics ADD COLUMN weight INTEGER DEFAULT 5');

            console.log('[MIGRATION] ✅ Added weight column to topics table');
            return true;
        }

        return false; // Already has weight column
    } catch (error) {
        console.error('[MIGRATION] ❌ Failed to add weight column to topics:', error);
        return false;
    }
}

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
            INSERT INTO items (text, parent_id, topic_id, item_type, status, weight, purpose, due_date, icon, color, ranking, difficulty, "order", created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            item.text.trim(),
            item.parent_id || null,
            item.topic_id || item.parent_id || null,  // topic_id defaults to parent_id for direct children
            itemType,
            item.status || 'new',
            item.weight || 5,
            item.purpose || null,
            item.due_date || null,
            item.icon || null,
            item.color || null,
            item.ranking || 3,
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
        const allowedFields = ['text', 'parent_id', 'topic_id', 'item_type', 'status', 'weight', 'purpose', 'due_date', 'icon', 'color', 'ranking', 'difficulty', 'order'];

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
        status: 'new',
        weight: 3  // Ideas start low priority until promoted
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

// Initialize database immediately when module loads
const DB_READY_EVENT = 'databaseReady';

(async function() {
    try {
        console.log('[DATA] Initializing SQL database...');
        await ensureDatabase();

        // Run automatic migrations for legacy tables
        autoMigrateIdeaWeights();
        autoMigrateTopicWeights();

        // Seed default topics if database is empty
        seedDefaultTopics();

        // Ensure unified items table exists
        ensureItemsTable();

        // Migrate legacy data to items table if needed
        if (needsMigration()) {
            console.log('[DATA] Legacy data detected, running migration...');
            const migrationResult = migrateToUnifiedItems();
            debugLog('MIGRATION_RESULT', migrationResult);
        }

        if (DEBUG_MODE) {
            const stats = getDatabaseStats();
            debugLog('DATA_LAYER_LOADED', {
                sqlBacked: true,
                ideasCount: stats.ideas,
                topicsCount: stats.topics,
                itemsCount: stats.items || 0,
                migrated: stats.migrated,
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
