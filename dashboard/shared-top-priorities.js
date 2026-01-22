/**
 * Top Priorities Controller
 *
 * This module provides unified logic for the Top Priorities section on the dashboard.
 * It shows the highest-priority tasks across ALL topics and supports full interactivity.
 *
 * Architecture:
 * - UI Controller layer for the Top Priorities widget
 * - Depends on: ideas-data.js (data layer), shared-rendering.js (view layer)
 * - Handles: loading priorities, inline editing, status changes, cross-tab sync
 *
 * Features:
 * - Auto-calculated top 5 priorities using scoring algorithm
 * - Inline editing of all properties
 * - Move between statuses (Ideas ↔ Backlog, Mark Done)
 * - Visual topic badges
 * - Real-time cross-tab synchronization
 */

class TopPrioritiesController {
    constructor() {
        this.editingIdeaId = null;
        console.log('[TOP-PRIORITIES] Initializing controller');
    }
    
    /**
     * Initialize the controller
     */
    initialize() {
        this.loadPriorities();
        this.setupStorageListener();
        
        // Listen for updates from same tab
        window.addEventListener('ideasUpdated', () => {
            console.log('[TOP-PRIORITIES] Detected data update in same tab');
            this.loadPriorities();
        });
        
        console.log('[TOP-PRIORITIES] Controller initialized');
    }
    
    /**
     * Load and render top 5 priorities
     */
    loadPriorities() {
        const container = document.getElementById('priorities-list');
        if (!container) {
            console.error('[TOP-PRIORITIES] Container element not found');
            return;
        }

        // Use Items API for priorities and topics
        const top5 = getTopPrioritiesFromItems(5);
        const topicItems = getTopicsFromItems();
        const topics = topicItems.map(adaptItemToTopic);
        
        if (top5.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No priorities yet</div>
                    <div style="font-size: 14px;">Add some ideas to get started!</div>
                </div>
            `;
            return;
        }
        
        // Render each priority
        container.innerHTML = top5.map((idea, index) => {
            const isEditing = this.editingIdeaId === idea.id;
            const topic = topics.find(t => t.id === idea.topic);
            
            return this.renderPriorityCard(idea, index + 1, topic, isEditing, topics);
        }).join('');
        
        console.log('[TOP-PRIORITIES] Loaded', top5.length, 'priorities');
    }
    
    /**
     * Render a single priority card
     */
    renderPriorityCard(idea, position, topic, isEditing, allTopics) {
        const rankColor = getRankingColor(idea.ranking);
        const diffColor = getDifficultyColor(idea.difficulty);
        const topicColor = topic ? topic.color : '#999';
        const topicName = topic ? topic.name : 'Unknown';
        
        // Use three-tier fallback for icons: topic.icon → hardcoded mapping → default
        // TOPIC_ICON_FILES is defined globally in index.html
        const TOPIC_ICON_FILES = window.TOPIC_ICON_FILES || {};
        const iconFile = topic
            ? (topic.icon || TOPIC_ICON_FILES[topic.id] || 'Door.ICO')
            : 'Door.ICO';
        
        // Format ID for onclick handlers
        const formattedId = typeof idea.id === 'string' ? `'${idea.id}'` : idea.id;
        
        // Build action buttons based on current status and editing state
        let actionButtons = '';
        if (!isEditing) {
            if (idea.status === 'new') {
                actionButtons = `
                    <button class="idea-btn" onclick="topPrioritiesController.startEdit(${formattedId})">Edit</button>
                    <button class="idea-btn move-btn" onclick="topPrioritiesController.moveToBacklog(${formattedId})">→ To Backlog</button>
                    <button class="idea-btn done-btn" onclick="topPrioritiesController.markDone(${formattedId})">✓ Done</button>
                `;
            } else if (idea.status === 'backlog') {
                actionButtons = `
                    <button class="idea-btn" onclick="topPrioritiesController.startEdit(${formattedId})">Edit</button>
                    <button class="idea-btn move-btn" onclick="topPrioritiesController.moveToNew(${formattedId})">← To Ideas</button>
                    <button class="idea-btn done-btn" onclick="topPrioritiesController.markDone(${formattedId})">✓ Done</button>
                `;
            }
        } else {
            actionButtons = `
                <button class="idea-btn" onclick="topPrioritiesController.saveEdit(${formattedId})">Save</button>
                <button class="idea-btn" onclick="topPrioritiesController.cancelEdit()">Cancel</button>
            `;
        }
        
        // Build edit controls if editing
        let editControls = '';
        if (isEditing) {
            editControls = `
                <div class="idea-edit-controls">
                    <select id="edit-topic-${idea.id}">
                        <option value="untagged" ${idea.topic === 'untagged' ? 'selected' : ''}>Untagged</option>
                        ${allTopics.map(t => `<option value="${t.id}" ${idea.topic === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                    </select>
                    <select id="edit-difficulty-${idea.id}">
                        <option value="easy" ${idea.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                        <option value="medium" ${idea.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="hard" ${idea.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                    </select>
                    <select id="edit-ranking-${idea.id}">
                        ${[1,2,3,4,5].map(r => `<option value="${r}" ${idea.ranking === r ? 'selected' : ''}>Rank ${r}</option>`).join('')}
                    </select>
                </div>
            `;
        }
        
        // Build idea text (editable or display)
        const ideaText = isEditing
            ? `<textarea class="idea-text-input" id="edit-text-${idea.id}">${idea.text}</textarea>`
            : idea.text;
        
        // Build status badge
        const statusLabels = { 'new': 'Ideas', 'backlog': 'Backlog', 'done': 'Done' };
        const statusLabel = statusLabels[idea.status] || idea.status;
        
        return `
            <div class="priority-item" style="border-left-color: ${rankColor}; border-left-width: 4px;">
                <div class="priority-rank" style="background: ${rankColor}; color: white; border-color: ${rankColor};">${idea.ranking}</div>
                <div class="win31-icon priority-topic-icon" style="background: ${topicColor}20; border-color: ${topicColor};">
                    <img src="../Icons/${iconFile}" alt="${topicName}">
                </div>
                <div class="priority-content">
                    <div class="priority-text">${ideaText}</div>
                    <div class="priority-meta">
                        <span class="priority-topic" style="color: ${topicColor};">${topicName}</span>
                        <span class="badge" style="background: ${diffColor}; border-color: ${diffColor}; color: white;">${idea.difficulty.toUpperCase()}</span>
                        <span class="badge" style="background: gold; color: #000;">#${position} Priority</span>
                        <span class="badge" style="background: #E0E0E0;">${statusLabel}</span>
                    </div>
                    ${editControls}
                    <div class="idea-actions" style="margin-top: 12px; display: flex; gap: 8px;">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Start editing a priority
     */
    startEdit(ideaId) {
        console.log('[TOP-PRIORITIES] Starting edit for', ideaId);
        this.editingIdeaId = ideaId;
        this.loadPriorities();
    }
    
    /**
     * Save edits to a priority
     */
    saveEdit(ideaId) {
        const text = document.getElementById(`edit-text-${ideaId}`)?.value.trim();
        const topic = document.getElementById(`edit-topic-${ideaId}`)?.value;
        const difficulty = document.getElementById(`edit-difficulty-${ideaId}`)?.value;
        const ranking = parseInt(document.getElementById(`edit-ranking-${ideaId}`)?.value);
        
        if (!text) {
            alert('Idea text cannot be empty');
            return;
        }
        
        console.log('[TOP-PRIORITIES] Saving edits for', ideaId);
        updateIdea(ideaId, { text, topic, difficulty, ranking });
        this.editingIdeaId = null;
        this.loadPriorities();
    }
    
    /**
     * Cancel editing
     */
    cancelEdit() {
        console.log('[TOP-PRIORITIES] Canceling edit');
        this.editingIdeaId = null;
        this.loadPriorities();
    }
    
    /**
     * Move priority to backlog
     */
    moveToBacklog(ideaId) {
        console.log('[TOP-PRIORITIES] Moving to backlog:', ideaId);
        moveToBacklog(ideaId);
        this.loadPriorities();
    }
    
    /**
     * Move priority back to ideas
     */
    moveToNew(ideaId) {
        console.log('[TOP-PRIORITIES] Moving to ideas:', ideaId);
        moveToNew(ideaId);
        this.loadPriorities();
    }
    
    /**
     * Mark priority as done
     */
    markDone(ideaId) {
        if (confirm('Mark this item as done?')) {
            console.log('[TOP-PRIORITIES] Marking as done:', ideaId);
            moveToDone(ideaId);
            this.loadPriorities();
        }
    }
    
    /**
     * Setup listener for SQL database updates
     */
    setupStorageListener() {
        // Already listening to ideasUpdated in initialize(), no need for storage events
    }
}

/**
 * Global controller instance
 * Stored globally so inline onclick handlers can access it
 */
let topPrioritiesController = null;

/**
 * Initialize the Top Priorities controller
 * Call this from the dashboard HTML
 */
function initializeTopPriorities() {
    topPrioritiesController = new TopPrioritiesController();
    topPrioritiesController.initialize();
    return topPrioritiesController;
}

// Export for module usage (if needed in future)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        TopPrioritiesController,
        initializeTopPriorities
    };
}
