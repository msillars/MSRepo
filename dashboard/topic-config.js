/**
 * Topic Configuration Module
 * 
 * Centralized topic configuration that reads from actual topic data.
 * This ensures all pages automatically support any topic you create.
 * 
 * Usage:
 * - getTopicConfig(topicId) - Get config for a specific topic
 * - getAllTopicConfigs() - Get all topic configs
 */

/**
 * Get configuration for a specific topic
 * Reads from actual topic data in localStorage
 * 
 * @param {string} topicId - The topic ID (e.g., 'photography', 'work')
 * @returns {Object} Topic configuration {id, name, color, priority}
 */
function getTopicConfig(topicId) {
    // Get all topics from data layer
    const topics = getTopics();
    
    // Find the requested topic
    const topic = topics.find(t => t.id === topicId);
    
    if (topic) {
        return {
            id: topic.id,
            name: topic.name,
            color: topic.color,
            priority: topic.priority
        };
    }
    
    // Fallback if topic not found
    console.warn(`Topic '${topicId}' not found in data. Using fallback config.`);
    return {
        id: topicId,
        name: topicId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        color: '#999999',
        priority: 'always-on'
    };
}

/**
 * Get all topic configurations
 * 
 * @returns {Array} Array of topic configs
 */
function getAllTopicConfigs() {
    const topics = getTopics();
    return topics.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
        priority: t.priority
    }));
}

/**
 * Get topic configuration as a map (for quick lookup)
 * 
 * @returns {Object} Map of topicId -> config
 */
function getTopicConfigMap() {
    const topics = getTopics();
    const map = {};
    topics.forEach(t => {
        map[t.id] = {
            id: t.id,
            name: t.name,
            color: t.color,
            priority: t.priority
        };
    });
    return map;
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getTopicConfig,
        getAllTopicConfigs,
        getTopicConfigMap
    };
}
