/**
 * Shared Drag-and-Drop System for All List Pages
 *
 * This module provides unified drag-and-drop functionality across:
 * - Ideas page (ideas.html)
 * - Topic pages (work.html, photography.html, etc.)
 * - Finished page (finished.html)
 *
 * Usage:
 * 1. Include this script after ideas-data.js
 * 2. Call setupDragAndDrop(callbacks) where callbacks contains:
 *    - onDrop: function to call after successful drop
 *    - getFilteredIdeas: function(status) to get ideas for a specific list
 *    - topicId: (optional) topic ID for filtering
 */

class DragDropManager {
    constructor(config = {}) {
        this.draggedElement = null;
        this.draggedIdeaId = null;
        this.onDrop = config.onDrop || (() => {});
        this.getFilteredIdeas = config.getFilteredIdeas || ((status) => getIdeasByStatus(status));
        this.topicId = config.topicId || null;
        this.enabled = true;

        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragend', (e) => this.handleDragEnd(e));
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
        document.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    }
    
    handleDragStart(e) {
        if (!this.enabled || !e.target.classList.contains('idea-card')) return;
        
        this.draggedElement = e.target;
        // Support both numeric and string IDs
        const rawId = e.target.dataset.ideaId;
        this.draggedIdeaId = isNaN(rawId) ? rawId : parseInt(rawId);
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        
        console.log('[DRAG] Started dragging idea:', this.draggedIdeaId);
    }
    
    handleDragEnd(e) {
        if (!e.target.classList.contains('idea-card')) return;
        e.target.classList.remove('dragging');
        document.querySelectorAll('.idea-card').forEach(card => {
            card.classList.remove('drag-over');
        });
    }
    
    handleDragOver(e) {
        if (!this.enabled) return;
        
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.target.closest('.idea-card');
        const listTarget = e.target.closest('.ideas-list');
        
        if (target && target !== this.draggedElement) {
            // Remove drag-over from all cards first
            document.querySelectorAll('.idea-card').forEach(card => {
                card.classList.remove('drag-over');
            });
            target.classList.add('drag-over');
        } else if (listTarget && !target) {
            listTarget.style.background = '#f0f0f0';
        }
        
        return false;
    }
    
    handleDragLeave(e) {
        const target = e.target.closest('.idea-card');
        if (target) {
            target.classList.remove('drag-over');
        }
        
        const listTarget = e.target.closest('.ideas-list');
        if (listTarget) {
            listTarget.style.background = 'white';
        }
    }
    
    handleDrop(e) {
        if (!this.enabled) return false;
        
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        console.log('[DROP] Drop event triggered');
        
        // Reset visual states
        document.querySelectorAll('.ideas-list').forEach(list => {
            list.style.background = 'white';
        });
        document.querySelectorAll('.idea-card').forEach(card => {
            card.classList.remove('drag-over');
        });
        
        const target = e.target.closest('.idea-card');
        const targetContainer = e.target.closest('.ideas-list');
        
        if (!targetContainer) {
            console.log('[DROP] No target container found');
            return false;
        }
        
        const targetStatus = targetContainer.dataset.status;
        const draggedContainer = this.draggedElement.closest('.ideas-list');
        const draggedStatus = draggedContainer ? draggedContainer.dataset.status : null;
        
        console.log('[DROP] Moving from', draggedStatus, 'to', targetStatus);
        
        // Check if moving between lists (different status)
        const isMovingBetweenLists = draggedStatus !== targetStatus;
        
        if (isMovingBetweenLists) {
            this.handleCrossListMove(
                targetStatus, 
                draggedStatus, 
                target, 
                targetContainer
            );
        } else {
            this.handleSameListMove(
                targetStatus,
                target,
                targetContainer
            );
        }
        
        // Call the onDrop callback to refresh the UI
        this.onDrop();
        
        return false;
    }
    
    /**
     * Handle moving a card to a different list (different status)
     */
    handleCrossListMove(targetStatus, draggedStatus, target, targetContainer) {
        console.log('[CROSS-LIST] Moving idea', this.draggedIdeaId, 'from', draggedStatus, 'to', targetStatus);
        
        // Step 1: Get the current order of ideas in the SOURCE list BEFORE making changes
        const sourceIdeasBefore = this.getFilteredIdeas(draggedStatus);
        const sourceIdsBefore = sourceIdeasBefore.map(i => i.id);
        
        // Step 2: Change the idea's status
        const statusChanged = moveIdeaToStatus(this.draggedIdeaId, targetStatus);
        if (!statusChanged) {
            console.error('[CROSS-LIST] Failed to change status');
            return;
        }
        
        // Step 3: Renumber the SOURCE list (remove the dragged idea and close the gap)
        const newSourceIds = sourceIdsBefore.filter(id => id !== this.draggedIdeaId);
        if (newSourceIds.length > 0) {
            console.log('[CROSS-LIST] Reordering source list:', newSourceIds);
            this.reorderList(newSourceIds, draggedStatus);
        }
        
        // Step 4: Get the current ideas in the TARGET list (now includes the dragged idea)
        const targetIdeasAfter = this.getFilteredIdeas(targetStatus);
        
        // Step 5: Determine where to insert the dragged idea in the target list
        let targetIdeaIds;
        
        if (!target || target === this.draggedElement) {
            // Dropped on empty area or self - place at end
            targetIdeaIds = targetIdeasAfter.map(i => i.id);
            console.log('[CROSS-LIST] Dropped on empty area, placing at end:', targetIdeaIds);
        } else {
            // Dropped on a specific card - insert before that card
            // Support both numeric and string IDs
            const rawTargetId = target.dataset.ideaId;
            const targetDroppedId = isNaN(rawTargetId) ? rawTargetId : parseInt(rawTargetId);
            
            // Build new order: all current target ideas, but insert dragged idea before the target
            targetIdeaIds = [];
            for (const idea of targetIdeasAfter) {
                if (idea.id === this.draggedIdeaId) {
                    continue; // Skip for now, we'll insert it in the right place
                }
                if (idea.id === targetDroppedId) {
                    targetIdeaIds.push(this.draggedIdeaId); // Insert before target
                }
                targetIdeaIds.push(idea.id);
            }
            
            // If we didn't insert it yet (dropped after the last item), add it now
            if (!targetIdeaIds.includes(this.draggedIdeaId)) {
                targetIdeaIds.push(this.draggedIdeaId);
            }
            
            console.log('[CROSS-LIST] Dropped on card', targetDroppedId, ', new order:', targetIdeaIds);
        }
        
        // Step 6: Renumber the TARGET list with the new order
        this.reorderList(targetIdeaIds, targetStatus);
        
        console.log('[CROSS-LIST] Cross-list move complete');
    }
    
    /**
     * Handle moving a card within the same list
     */
    handleSameListMove(status, target, container) {
        if (!target || target === this.draggedElement) {
            // Dropped on self or empty area - no action needed
            console.log('[SAME-LIST] Dropped on self or empty, no action needed');
            return;
        }
        
        console.log('[SAME-LIST] Moving within', status, 'list');
        
        // Get current order from data layer (not DOM)
        const currentIdeas = this.getFilteredIdeas(status);
        const ideaIds = currentIdeas.map(i => i.id);
        
        // Find indices
        const draggedIndex = ideaIds.indexOf(this.draggedIdeaId);
        // Support both numeric and string IDs
        const rawTargetId = target.dataset.ideaId;
        const targetId = isNaN(rawTargetId) ? rawTargetId : parseInt(rawTargetId);
        const targetIndex = ideaIds.indexOf(targetId);
        
        console.log('[SAME-LIST] Moving from index', draggedIndex, 'to', targetIndex);
        
        // Remove from old position and insert at new position
        const [movedId] = ideaIds.splice(draggedIndex, 1);
        ideaIds.splice(targetIndex, 0, movedId);
        
        console.log('[SAME-LIST] New order:', ideaIds);
        
        // Renumber the list with new order
        this.reorderList(ideaIds, status);
        
        console.log('[SAME-LIST] Same-list move complete');
    }
    
    /**
     * Reorder a specific list (status + optional topic)
     * This is a wrapper around the global reorderIdeas function
     */
    reorderList(ideaIds, status) {
        console.log('[REORDER] Reordering', status, 'list with', ideaIds.length, 'items');
        const success = reorderIdeas(ideaIds, status, this.topicId);
        if (!success) {
            console.error('[REORDER] Failed to reorder ideas');
        } else {
            console.log('[REORDER] Successfully reordered');
        }
        return success;
    }
    
    /**
     * Enable or disable drag and drop
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

/**
 * Setup drag and drop for a page
 * @param {Object} config - Configuration object
 * @param {Function} config.onDrop - Callback to refresh UI after drop
 * @param {Function} config.getFilteredIdeas - Function to get ideas for a status
 * @param {String} config.topicId - Optional topic ID for filtering
 */
function setupDragAndDrop(config = {}) {
    console.log('[DRAG-DROP] Initializing drag and drop system');
    return new DragDropManager(config);
}

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupDragAndDrop, DragDropManager };
}
