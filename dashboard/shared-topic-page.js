/**
 * Shared Topic Page Controller
 * 
 * This module provides unified page logic for all topic pages.
 * Eliminates duplication across work.html, photography.html, etc.
 * 
 * Architecture Design:
 * - This is a UI Controller layer
 * - Depends on: ideas-data.js (data layer), shared-rendering.js (view layer), 
 *   shared-drag-drop.js (interaction layer), topic-config.js (configuration)
 * - Handles: page initialization, user actions, state management
 * 
 * Future Growth:
 * - When refactoring data layer, this will depend on TaskManager, TopicManager
 * - Can be extended for new topic page features without modifying each page
 */

/**
 * TopicPageController Class
 * Manages the state and behavior of a topic page
 */
class TopicPageController {
    constructor(topicId, customConfig) {
        this.topicId = topicId;
        
        // Use custom config if provided, otherwise get from centralized config
        if (customConfig) {
            this.config = customConfig;
        } else {
            // Get config from topic-config.js (which reads from actual data)
            this.config = getTopicConfig(topicId);
        }
        
        this.dragDropManager = null;
        this.editingIdeaId = null;
        
        console.log(`[TOPIC-PAGE] Using config for ${topicId}:`, this.config);
    }
    
    /**
     * Initialize the page
     * Sets up UI, loads data, configures drag & drop
     */
    initialize() {
        // Update page metadata
        document.title = this.config.name + ' - Management System';
        document.getElementById('topic-name').textContent = this.config.name;
        
        // Style the topic icon
        const iconEl = document.getElementById('topic-icon');
        if (iconEl) {
            iconEl.style.background = this.config.color + '20';
            iconEl.style.borderColor = this.config.color;
        }
        
        // Load initial data
        this.loadAllLists();
        
        // Setup drag and drop
        this.dragDropManager = setupDragAndDrop({
            onDrop: () => this.loadAllLists(),
            getFilteredIdeas: (status) => getIdeasByStatus(status, this.topicId),
            projectId: this.topicId  // Note: keeping 'projectId' for drag-drop compatibility
        });
        
        // Setup cross-tab synchronization
        this.setupStorageListener();
        
        console.log(`[TOPIC-PAGE] Initialized ${this.config.name} page`);
    }
    
    /**
     * Load all lists (Ideas, Backlog, Done if present)
     */
    loadAllLists() {
        const renderOptions = {
            projectId: this.topicId,  // Note: keeping 'projectId' for rendering compatibility
            showProject: false,
            showEdit: true,
            editingIdeaId: this.editingIdeaId
        };
        
        // Load Ideas list
        loadListWithRender('new', 'ideas-list', 'ideas-count', renderOptions);
        
        // Load Backlog list
        loadListWithRender('backlog', 'backlog-list', 'backlog-count', renderOptions);
        
        // Load Done list if container exists (some pages don't have it)
        const doneContainer = document.getElementById('done-list');
        if (doneContainer) {
            loadListWithRender('done', 'done-list', 'done-count', renderOptions);
        }
    }
    
    /**
     * Start editing a task/idea
     */
    startEdit(ideaId) {
        this.editingIdeaId = ideaId;
        this.loadAllLists();
    }
    
    /**
     * Save edits to a task/idea
     */
    saveEdit(ideaId) {
        const text = document.getElementById(`edit-text-${ideaId}`)?.value.trim();
        const project = document.getElementById(`edit-project-${ideaId}`)?.value;
        const difficulty = document.getElementById(`edit-difficulty-${ideaId}`)?.value;
        const ranking = parseInt(document.getElementById(`edit-ranking-${ideaId}`)?.value);
        
        if (!text) {
            alert('Idea text cannot be empty');
            return;
        }
        
        updateIdea(ideaId, { text, project, difficulty, ranking });
        this.editingIdeaId = null;
        this.loadAllLists();
    }
    
    /**
     * Cancel editing
     */
    cancelEdit() {
        this.editingIdeaId = null;
        this.loadAllLists();
    }
    
    /**
     * Move task/idea to backlog
     */
    moveToBacklog(ideaId) {
        moveToBacklog(ideaId);
        this.loadAllLists();
    }
    
    /**
     * Move task/idea back to ideas
     */
    moveToNew(ideaId) {
        moveToNew(ideaId);
        this.loadAllLists();
    }
    
    /**
     * Mark task/idea as done
     */
    markDone(ideaId) {
        if (confirm('Mark this item as done?')) {
            moveToDone(ideaId);
            this.loadAllLists();
        }
    }
    
    /**
     * Delete task/idea with confirmation
     */
    deleteWithConfirm(ideaId) {
        if (confirm('Delete this idea? This cannot be undone.')) {
            deleteIdea(ideaId);
            this.loadAllLists();
        }
    }
    
    /**
     * Delete this topic with confirmation
     * All ideas in this topic will become untagged
     */
    deleteThisTopic() {
        const topicName = this.config.name;
        const message = `Remove the "${topicName}" topic?\n\nAll ideas in this topic will become untagged.\n\nThis action cannot be undone.`;
        
        if (confirm(message)) {
            const success = deleteTopic(this.topicId);
            if (success) {
                // Redirect to dashboard after deletion
                window.location.href = 'index.html';
            } else {
                alert('Failed to remove topic. Please try again.');
            }
        }
    }
    
    /**
     * Setup listener for changes from other tabs and SQL updates
     */
    setupStorageListener() {
        // Listen for SQL database updates (from this tab or others)
        window.addEventListener('ideasUpdated', () => {
            console.log('[TOPIC-PAGE] Data updated - reloading lists');
            this.loadAllLists();
        });
    }
}

/**
 * Global controller instance
 * Stored globally so inline onclick handlers can access it
 */
let pageController = null;

/**
 * Initialize a topic page
 * Call this from your HTML page with the topic ID
 * 
 * @param {string} topicId - The topic identifier (e.g., 'photography', 'work')
 * @param {Object} customConfig - Optional custom configuration
 */
function initializeTopicPage(topicId, customConfig = null) {
    pageController = new TopicPageController(topicId, customConfig);
    pageController.initialize();
}

/**
 * Global handler functions for onclick events in HTML
 * These delegate to the controller instance
 */
function startEditIdea(ideaId) {
    if (pageController) pageController.startEdit(ideaId);
}

function saveIdeaEdit(ideaId) {
    if (pageController) pageController.saveEdit(ideaId);
}

function cancelEdit() {
    if (pageController) pageController.cancelEdit();
}

function moveToBacklogHandler(ideaId) {
    if (pageController) pageController.moveToBacklog(ideaId);
}

function moveToNewHandler(ideaId) {
    if (pageController) pageController.moveToNew(ideaId);
}

function markAsDone(ideaId) {
    if (pageController) pageController.markDone(ideaId);
}

function deleteIdeaConfirm(ideaId) {
    if (pageController) pageController.deleteWithConfirm(ideaId);
}

function deleteTopicHandler() {
    if (pageController) pageController.deleteThisTopic();
}

// Export for module usage (if needed in future)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        TopicPageController,
        initializeTopicPage
    };
}
