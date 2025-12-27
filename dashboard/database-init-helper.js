/**
 * Database Initialization Helper for Pages
 * 
 * This script provides a simple way for pages to wait for the SQL database
 * to be ready before loading data.
 * 
 * Usage in any page:
 *   waitForDatabaseThen(() => {
 *       // Your page initialization code here
 *       loadYourData();
 *   });
 */

/**
 * Wait for database to be ready, then execute callback
 * @param {Function} callback - Function to execute when database is ready
 * @param {number} timeout - Timeout in ms (default 3000)
 */
function waitForDatabaseThen(callback, timeout = 3000) {
    console.log('[PAGE] Waiting for database...');
    
    // Check if already ready
    if (window.isDatabaseReady && isDatabaseReady()) {
        console.log('[PAGE] Database already ready');
        callback();
        return;
    }
    
    // Set up event listener
    const onReady = () => {
        console.log('[PAGE] Database ready event received');
        clearTimeout(timeoutId);
        callback();
    };
    
    window.addEventListener('databaseReady', onReady, { once: true });
    
    // Timeout fallback
    const timeoutId = setTimeout(() => {
        console.warn('[PAGE] Database initialization timeout - attempting to load anyway');
        window.removeEventListener('databaseReady', onReady);
        callback();
    }, timeout);
}

/**
 * Promise-based version for async/await usage
 * @param {number} timeout - Timeout in ms (default 3000)
 * @returns {Promise<boolean>} - Resolves when database is ready
 */
async function waitForDatabase(timeout = 3000) {
    return new Promise((resolve) => {
        waitForDatabaseThen(() => resolve(true), timeout);
    });
}
