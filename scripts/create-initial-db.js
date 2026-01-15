#!/usr/bin/env node
/**
 * Create initial SQLite database with schema and default topics
 * Run with: node scripts/create-initial-db.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DEFAULT_TOPICS = [
    { id: 'photography', name: 'Photography', priority: 'always-on', color: '#FF6B35', icon: 'Photography.ICO', weight: 5 },
    { id: 'work', name: 'Work', priority: 'priority', color: '#004E89', icon: 'Work.ICO', weight: 7 },
    { id: 'life-admin', name: 'Life Admin', priority: 'do-prep', color: '#F77F00', icon: 'LifeAdmin.ICO', weight: 5 },
    { id: 'relationships', name: 'Relationships', priority: 'always-on', color: '#06A77D', icon: 'Relationships.ICO', weight: 6 },
    { id: 'living', name: 'Living', priority: 'getting-important', color: '#9D4EDD', icon: 'Living.ICO', weight: 4 },
    { id: 'health', name: 'Health', priority: 'always-on', color: '#E63946', icon: 'hearts.ICO', weight: 7 },
    { id: 'creating-this-dashboard', name: 'Creating This Dashboard', priority: 'do-prep', color: '#06A77D', icon: 'Ideas.ICO', weight: 3 }
];

const SAMPLE_IDEAS = [
    { text: 'Research new camera lenses', topic: 'photography', ranking: 4 },
    { text: 'Edit photos from weekend trip', topic: 'photography', ranking: 3 },
    { text: 'Update portfolio website', topic: 'photography', ranking: 5 },
    { text: 'Schedule annual checkup', topic: 'health', ranking: 4 },
    { text: 'Start morning stretching routine', topic: 'health', ranking: 3 },
    { text: 'Meal prep for the week', topic: 'health', ranking: 2 },
    { text: 'Review quarterly goals', topic: 'work', ranking: 5 },
    { text: 'Clean up email inbox', topic: 'work', ranking: 2 },
    { text: 'Prepare presentation slides', topic: 'work', ranking: 4 },
    { text: 'Pay utility bills', topic: 'life-admin', ranking: 4 },
    { text: 'Renew car registration', topic: 'life-admin', ranking: 3 },
    { text: 'Call mom this weekend', topic: 'relationships', ranking: 4 },
    { text: 'Plan dinner with friends', topic: 'relationships', ranking: 3 },
    { text: 'Declutter bedroom closet', topic: 'living', ranking: 2 },
    { text: 'Fix the leaky faucet', topic: 'living', ranking: 3 },
    { text: 'Add drag-drop to items table', topic: 'creating-this-dashboard', ranking: 4 },
    { text: 'Design the project view UI', topic: 'creating-this-dashboard', ranking: 5 }
];

async function createDatabase() {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Create unified items table
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

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_items_parent ON items(parent_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_topic ON items(topic_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type)');
    db.run('CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)');

    // Create legacy tables (for compatibility)
    db.run(`
        CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            topic TEXT NOT NULL DEFAULT 'untagged',
            ranking INTEGER NOT NULL DEFAULT 3,
            difficulty TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'new',
            "order" INTEGER NOT NULL DEFAULT 0,
            timestamp TEXT NOT NULL,
            status_changed_at TEXT,
            weight INTEGER DEFAULT 5
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS topics (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            priority TEXT NOT NULL DEFAULT 'always-on',
            color TEXT NOT NULL,
            icon TEXT,
            weight INTEGER DEFAULT 5
        )
    `);

    const now = new Date().toISOString();
    const topicIdMap = {};

    // Insert default topics into legacy table
    console.log('Inserting topics...');
    for (const topic of DEFAULT_TOPICS) {
        db.run(
            'INSERT INTO topics (id, name, priority, color, icon, weight) VALUES (?, ?, ?, ?, ?, ?)',
            [topic.id, topic.name, topic.priority, topic.color, topic.icon, topic.weight]
        );

        // Also insert into items table
        db.run(
            `INSERT INTO items (text, parent_id, topic_id, item_type, status, weight, icon, color, "order", created_at)
             VALUES (?, NULL, NULL, 'topic', 'new', ?, ?, ?, 0, ?)`,
            [topic.name, topic.weight, topic.icon, topic.color, now]
        );

        // Get the new item ID
        const result = db.exec('SELECT last_insert_rowid() as id');
        topicIdMap[topic.id] = result[0].values[0][0];
        console.log(`  Topic: ${topic.name} -> item #${topicIdMap[topic.id]}`);
    }

    // Insert sample ideas
    console.log('Inserting sample ideas...');
    const rankingToWeight = { 1: 2, 2: 4, 3: 5, 4: 7, 5: 9 };

    for (let i = 0; i < SAMPLE_IDEAS.length; i++) {
        const idea = SAMPLE_IDEAS[i];
        const weight = rankingToWeight[idea.ranking] || 5;
        const topicItemId = topicIdMap[idea.topic];

        // Legacy table
        db.run(
            `INSERT INTO ideas (text, topic, ranking, difficulty, status, "order", timestamp, weight)
             VALUES (?, ?, ?, 'medium', 'new', ?, ?, ?)`,
            [idea.text, idea.topic, idea.ranking, i, now, weight]
        );

        // Items table
        db.run(
            `INSERT INTO items (text, parent_id, topic_id, item_type, status, weight, ranking, difficulty, "order", created_at)
             VALUES (?, ?, ?, 'task', 'new', ?, ?, 'medium', ?, ?)`,
            [idea.text, topicItemId, topicItemId, weight, idea.ranking, i, now]
        );

        console.log(`  Task: ${idea.text}`);
    }

    // Export database
    const data = db.export();
    const buffer = Buffer.from(data);

    // Save to file
    const outputPath = path.join(__dirname, '..', 'data', 'database.sqlite');
    fs.writeFileSync(outputPath, buffer);

    console.log(`\n✅ Database created: ${outputPath}`);
    console.log(`   Size: ${buffer.length} bytes`);
    console.log(`   Topics: ${DEFAULT_TOPICS.length}`);
    console.log(`   Ideas: ${SAMPLE_IDEAS.length}`);

    db.close();
}

createDatabase().catch(console.error);
