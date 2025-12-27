/**
 * Shared Modal System
 * 
 * Provides modal dialogs for editing ideas with weight picker
 */

/**
 * Create and show modal for editing an idea
 * @param {Number|String} ideaId - ID of idea to edit
 */
function openEditIdeaModal(ideaId) {
    const idea = getIdeaById(ideaId);
    if (!idea) {
        alert('Idea not found');
        return;
    }
    
    // Get current weight (or default to 5)
    const currentWeight = idea.weight !== undefined && idea.weight !== null ? idea.weight : 5;
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal-overlay" id="edit-modal" onclick="closeEditModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Edit Idea</h3>
                    <button class="modal-close" onclick="closeEditModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="form-group">
                        <label>Idea Text</label>
                        <textarea id="modal-idea-text" rows="3">${idea.text}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Weight</label>
                        <div class="weight-picker" id="weight-picker">
                            ${[1,2,3,4,5,6,7,8,9,10].map(w => `
                                <div class="weight-option ${w === currentWeight ? 'selected' : ''}" 
                                     data-weight="${w}"
                                     style="background: ${getWeightColor(w)};"
                                     onclick="selectWeight(${w})">
                                    ${w}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Difficulty</label>
                        <select id="modal-difficulty">
                            <option value="easy" ${idea.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                            <option value="medium" ${idea.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="hard" ${idea.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                        </select>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeEditModal()">Cancel</button>
                    <button class="btn-primary" onclick="saveIdeaFromModal(${typeof ideaId === 'string' ? `'${ideaId}'` : ideaId})">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Store selected weight
    window.modalSelectedWeight = currentWeight;
}

/**
 * Select a weight in the picker
 */
function selectWeight(weight) {
    window.modalSelectedWeight = weight;
    
    // Update visual selection
    document.querySelectorAll('.weight-option').forEach(option => {
        const optionWeight = parseInt(option.dataset.weight);
        if (optionWeight === weight) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

/**
 * Save idea from modal
 */
function saveIdeaFromModal(ideaId) {
    const text = document.getElementById('modal-idea-text').value.trim();
    const difficulty = document.getElementById('modal-difficulty').value;
    const weight = window.modalSelectedWeight || 5;
    
    if (!text) {
        alert('Idea text cannot be empty');
        return;
    }
    
    // Get current idea to preserve topic
    const idea = getIdeaById(ideaId);
    
    // Update idea with new values
    updateIdea(ideaId, {
        text,
        difficulty,
        weight,
        topic: idea.topic // preserve topic
    });
    
    closeEditModal();
    
    // Reload lists
    if (window.pageController) {
        window.pageController.loadAllLists();
    }
}

/**
 * Close the edit modal
 */
function closeEditModal(event) {
    // If event exists, only close if clicking overlay (not content)
    if (event && event.target.className !== 'modal-overlay') {
        return;
    }
    
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.remove();
    }
    window.modalSelectedWeight = null;
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEditModal();
    }
});
