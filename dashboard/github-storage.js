/**
 * GitHub Storage Layer
 *
 * Stores the SQLite database as a binary file in the GitHub repo.
 * Uses GitHub Contents API to read/write the database file.
 *
 * Setup:
 * 1. Create a GitHub Personal Access Token with 'repo' scope
 * 2. Set GITHUB_TOKEN in config below or localStorage
 *
 * Architecture:
 * - On page load: fetch database from GitHub → initialize SQL.js
 * - On save: export SQL.js → push to GitHub
 * - Falls back to localStorage if GitHub unavailable
 */

// Configuration - UPDATE THESE VALUES
const GITHUB_CONFIG = {
    owner: 'msillars',
    repo: 'MSRepo',
    branch: 'master',
    dbPath: 'data/database.sqlite',  // Path in repo where DB is stored
    // Token can be set here or in localStorage as 'github_token'
    token: null
};

// Get token from localStorage or config
function getGitHubToken() {
    return localStorage.getItem('github_token') || GITHUB_CONFIG.token;
}

// Set token in localStorage
function setGitHubToken(token) {
    localStorage.setItem('github_token', token);
    console.log('[GitHub] Token saved to localStorage');
}

/**
 * Check if GitHub storage is configured
 */
function isGitHubConfigured() {
    return !!getGitHubToken();
}

/**
 * Fetch the database file from GitHub
 * @returns {Uint8Array|null} - Database binary or null if not found
 */
async function fetchDatabaseFromGitHub() {
    const token = getGitHubToken();
    if (!token) {
        console.log('[GitHub] No token configured, skipping GitHub fetch');
        return null;
    }

    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dbPath}?ref=${GITHUB_CONFIG.branch}`;

    console.log('[GitHub] Fetching database from:', url);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            console.log('[GitHub] Database file not found in repo (will create on first save)');
            return null;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message}`);
        }

        const data = await response.json();

        // GitHub returns base64-encoded content
        const binaryString = atob(data.content.replace(/\n/g, ''));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Store the SHA for later updates
        localStorage.setItem('github_db_sha', data.sha);

        console.log(`[GitHub] ✅ Loaded database (${bytes.length} bytes, sha: ${data.sha.substring(0, 7)})`);
        return bytes;

    } catch (error) {
        console.error('[GitHub] ❌ Failed to fetch database:', error);
        return null;
    }
}

/**
 * Save the database file to GitHub
 * @param {Uint8Array} dbData - Database binary data
 * @returns {boolean} - Success status
 */
async function saveDatabaseToGitHub(dbData) {
    const token = getGitHubToken();
    if (!token) {
        console.log('[GitHub] No token configured, skipping GitHub save');
        return false;
    }

    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dbPath}`;

    // Convert binary to base64
    let binary = '';
    for (let i = 0; i < dbData.length; i++) {
        binary += String.fromCharCode(dbData[i]);
    }
    const base64Content = btoa(binary);

    // Get the current SHA (required for updates)
    const sha = localStorage.getItem('github_db_sha');

    const body = {
        message: `Update database - ${new Date().toISOString()}`,
        content: base64Content,
        branch: GITHUB_CONFIG.branch
    };

    // Include SHA if updating existing file
    if (sha) {
        body.sha = sha;
    }

    console.log('[GitHub] Saving database...', sha ? `(updating ${sha.substring(0, 7)})` : '(creating new)');

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message}`);
        }

        const data = await response.json();

        // Update stored SHA for next save
        localStorage.setItem('github_db_sha', data.content.sha);

        console.log(`[GitHub] ✅ Database saved (sha: ${data.content.sha.substring(0, 7)})`);
        return true;

    } catch (error) {
        console.error('[GitHub] ❌ Failed to save database:', error);
        return false;
    }
}

/**
 * Initialize database from GitHub (or localStorage fallback)
 * Call this instead of the regular initializeDatabase()
 */
async function initializeDatabaseFromGitHub() {
    console.log('[GitHub] Initializing database...');

    try {
        // Load sql.js library
        if (typeof window.initSqlJs === 'undefined') {
            throw new Error('sql.js library not loaded');
        }

        SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });

        console.log('[GitHub] sql.js loaded successfully');

        // Try to load from GitHub first
        let dbData = await fetchDatabaseFromGitHub();

        if (dbData) {
            // Load from GitHub
            db = new SQL.Database(dbData);
            console.log('[GitHub] ✅ Database loaded from GitHub');
        } else {
            // Fall back to localStorage
            const savedDb = localStorage.getItem('management_system_sql_db');

            if (savedDb) {
                const uint8Array = new Uint8Array(JSON.parse(savedDb));
                db = new SQL.Database(uint8Array);
                console.log('[GitHub] Loaded database from localStorage (GitHub not available)');
            } else {
                // Create new database
                db = new SQL.Database();
                console.log('[GitHub] Created new database');
                await createSchema();
            }
        }

        // Also save to localStorage as backup
        saveDatabase();

        return true;

    } catch (error) {
        console.error('[GitHub] ❌ Failed to initialize:', error);
        throw error;
    }
}

/**
 * Save database to both localStorage and GitHub
 * Replaces the standard saveDatabase() function
 */
async function saveDatabaseWithGitHub() {
    if (!db) {
        console.warn('[GitHub] Cannot save - database not initialized');
        return;
    }

    const data = db.export();

    // Always save to localStorage (fast, immediate backup)
    const buffer = Array.from(data);
    localStorage.setItem('management_system_sql_db', JSON.stringify(buffer));
    console.log('[GitHub] Saved to localStorage');

    // Also save to GitHub (async, can fail without breaking app)
    if (isGitHubConfigured()) {
        // Debounce GitHub saves to avoid rate limits
        clearTimeout(window._githubSaveTimeout);
        window._githubSaveTimeout = setTimeout(async () => {
            await saveDatabaseToGitHub(data);
        }, 2000);  // Wait 2 seconds after last change before pushing to GitHub
    }
}

/**
 * Force immediate save to GitHub (bypass debounce)
 */
async function forceSaveToGitHub() {
    if (!db) {
        console.warn('[GitHub] Cannot save - database not initialized');
        return false;
    }

    clearTimeout(window._githubSaveTimeout);
    const data = db.export();
    return await saveDatabaseToGitHub(data);
}

/**
 * Setup UI for GitHub token configuration
 * Adds a settings button to the page
 */
function setupGitHubUI() {
    // Check if already configured
    if (isGitHubConfigured()) {
        console.log('[GitHub] Token already configured');
        return;
    }

    // Create a simple prompt for token
    const promptForToken = () => {
        const token = prompt(
            'Enter your GitHub Personal Access Token to enable cloud sync.\n\n' +
            'Create one at: https://github.com/settings/tokens\n' +
            'Required scope: "repo"\n\n' +
            'Leave blank to use localStorage only.'
        );

        if (token && token.trim()) {
            setGitHubToken(token.trim());
            alert('Token saved! Refresh the page to sync with GitHub.');
        }
    };

    // Add to console for easy access
    window.setupGitHubSync = promptForToken;
    console.log('[GitHub] Run setupGitHubSync() to configure GitHub token');
}

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isGitHubConfigured,
        fetchDatabaseFromGitHub,
        saveDatabaseToGitHub,
        initializeDatabaseFromGitHub,
        saveDatabaseWithGitHub,
        forceSaveToGitHub,
        setGitHubToken,
        getGitHubToken,
        setupGitHubUI,
        GITHUB_CONFIG
    };
}
