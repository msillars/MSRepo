/**
 * Shared Rendering Functions for Idea Cards
 * 
 * This module provides unified rendering across all list pages.
 * Includes functions for:
 * - Rendering idea cards with weight badges
 * - Rendering empty states
 * - Common UI utilities
 */

/**
 * Render a single idea card
 * @param {Object} idea - The idea object
 * @param {String} status - Current status (new/backlog/done)
 * @param {Object} options - Rendering options
 * @param {Boolean} options.showProject - Whether to show project badge (default: false)
 * @param {Boolean} options.showEdit - Whether to show edit button (default: false)
 * @param {Boolean} options.isEditing - Whether this card is being edited (default: false)
 * @param {String} options.projectName - Override project name display
 * @param {Array} options.projects - Projects list for edit dropdown
 * @returns {String} HTML string for the card
 */
function renderIdeaCard(idea, status, options = {}) {
    const {
        showProject = false,
        showEdit = false,
        isEditing = false,
        projectName = null,
        projects = []
    } = options;
    
    // Use weight if available, otherwise fall back to ranking
    const hasWeight = idea.weight !== undefined && idea.weight !== null;
    const displayValue = hasWeight ? idea.weight : idea.ranking;
    const displayColor = hasWeight ? getWeightColor(idea.weight) : getRankingColor(idea.ranking);
    
    // Format ID for use in onclick handlers (add quotes if string)
    const formattedId = typeof idea.id === 'string' ? `'${idea.id}'` : idea.id;
    
    // Determine action buttons based on status
    let actionButtons = '';
    
    if (!isEditing) {
        if (status === 'new') {
            actionButtons = `
                ${showEdit ? `<button class="idea-btn" onclick="openEditIdeaModal(${formattedId})">Edit</button>` : ''}
                <button class="idea-btn move-btn" onclick="moveToBacklogHandler(${formattedId})">→ To Backlog</button>
                <button class="idea-btn done-btn" onclick="markAsDone(${formattedId})">✓ Done</button>
                ${showEdit ? `<button class="idea-btn" onclick="deleteIdeaConfirm(${formattedId})">Delete</button>` : ''}
            `;
        } else if (status === 'backlog') {
            actionButtons = `
                ${showEdit ? `<button class="idea-btn" onclick="openEditIdeaModal(${formattedId})">Edit</button>` : ''}
                <button class="idea-btn move-btn" onclick="moveToNewHandler(${formattedId})">← To Ideas</button>
                <button class="idea-btn done-btn" onclick="markAsDone(${formattedId})">✓ Done</button>
                ${showEdit ? `<button class="idea-btn" onclick="deleteIdeaConfirm(${formattedId})">Delete</button>` : ''}
            `;
        } else if (status === 'done') {
            actionButtons = `
                <button class="idea-btn move-btn" onclick="moveToNewHandler(${formattedId})">↩ Restore to Ideas</button>
                ${showEdit ? `<button class="idea-btn" onclick="deleteIdeaConfirm(${formattedId})">Delete Forever</button>` : ''}
            `;
        }
    }
    
    // Build project badge if needed
    let projectBadge = '';
    if (showProject) {
        const proj = projects.find(p => p.id === idea.topic);
        const displayName = projectName || (proj ? proj.name : 'Untagged');
        const projectColor = proj ? proj.color : '#999';
        projectBadge = `<span class="idea-project" style="background: ${projectColor}20; border-color: ${projectColor}">${displayName}</span>`;
    }
    
    // Render weight badge or ranking circle
    const weightBadge = hasWeight 
        ? `<div class="weight-badge idea-weight-badge" style="background: ${displayColor};">${idea.weight}</div>`
        : `<div class="idea-rank" style="background: ${displayColor}; color: white;">${idea.ranking}</div>`;
    
    const diffColor = getDifficultyColor(idea.difficulty);
    
    return `
        <div class="idea-card" draggable="true" data-idea-id="${idea.id}">
            <div class="idea-header">
                ${weightBadge}
                <div class="idea-text">${idea.text}</div>
            </div>
            <div class="idea-meta">
                ${projectBadge}
                <span class="idea-difficulty" style="background: ${diffColor}; border-color: ${diffColor}">${idea.difficulty.toUpperCase()}</span>
                <span class="idea-timestamp">${formatTimestamp(idea.timestamp)}</span>
            </div>
            <div class="idea-actions">
                ${actionButtons}
            </div>
        </div>
    `;
}

/**
 * Render empty state for a list
 * @param {String} listType - Type of list (ideas/backlog/done)
 * @returns {String} HTML string for empty state
 */
function renderEmptyState(listType) {
    const emptyStates = {
        ideas: {
            icon: '💭',
            title: 'No ideas yet',
            message: 'Capture your first idea above'
        },
        backlog: {
            icon: '📋',
            title: 'Backlog is empty',
            message: 'Move ideas here that you plan to work on'
        },
        done: {
            icon: '✓',
            title: 'No completed items',
            message: 'Items you mark as done will appear here'
        }
    };
    
    const state = emptyStates[listType] || emptyStates.ideas;
    
    return `
        <div class="empty-state">
            <div class="empty-icon">${state.icon}</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${state.title}</div>
            <div style="font-size: 14px;">${state.message}</div>
        </div>
    `;
}

/**
 * Load and render a list
 * @param {String} status - Status to filter by (new/backlog/done)
 * @param {String} containerId - ID of container element
 * @param {String} countId - ID of count element
 * @param {Object} options - Rendering options (passed to renderIdeaCard)
 * @param {String} options.projectId - Optional project ID for filtering
 * @param {Number} options.editingIdeaId - ID of idea being edited
 */
function loadListWithRender(status, containerId, countId, options = {}) {
    const container = document.getElementById(containerId);
    const countElement = document.getElementById(countId);
    
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }
    
    // Get ideas
    const ideas = options.projectId 
        ? getIdeasByStatus(status, options.projectId)
        : getIdeasByStatus(status);
    
    // Update count
    if (countElement) {
        countElement.textContent = `${ideas.length} item${ideas.length !== 1 ? 's' : ''}`;
    }
    
    // Handle empty state
    if (ideas.length === 0) {
        const listTypeMap = {
            'new': 'ideas',
            'backlog': 'backlog',
            'done': 'done'
        };
        container.innerHTML = renderEmptyState(listTypeMap[status] || 'ideas');
        return;
    }
    
    // Sort by order
    ideas.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Get topics for rendering
    const projects = getTopics();
    
    // Render cards
    container.innerHTML = ideas.map(idea => {
        const isEditing = options.editingIdeaId === idea.id;
        return renderIdeaCard(idea, status, {
            ...options,
            isEditing,
            projects
        });
    }).join('');
}

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        renderIdeaCard, 
        renderEmptyState,
        loadListWithRender
    };
}
