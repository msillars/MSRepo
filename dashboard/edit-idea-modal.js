/**
 * Edit Idea Modal Controller
 * 
 * Handles modal-based editing of ideas with grid-based weight picker
 */

let currentEditingIdeaId = null;

/**
 * Open the edit modal for an idea
 * @param {Number|String} ideaId - The ID of the idea to edit
 */
function openEditIdeaModal(ideaId) {
    currentEditingIdeaId = ideaId;
    const idea = getIdeaById(ideaId);
    
    if (!idea) {
        alert('Idea not found');
        return;
    }
    
    // Get current weight (or default to 5)
    const currentWeight = idea.weight !== undefined && idea.weight !== null ? idea.weight : 5;
    
    // Create modal HTML with grid picker
    const modalHtml = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3>Edit Idea</h3>
                <button class="modal-close" onclick="closeEditIdeaModal()">&times;</button>
            </div>
            
            <div class="modal-body">
                <div class="form-group">
                    <label>Idea Text</label>
                    <textarea id="modal-edit-text" rows="3">${idea.text}</textarea>
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
                    <select id="modal-edit-difficulty">
                        <option value="easy" ${idea.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                        <option value="medium" ${idea.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="hard" ${idea.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                    </select>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeEditIdeaModal()">Cancel</button>
                <button class="btn-primary" onclick="saveEditIdeaModal()">Save Changes</button>
            </div>
        </div>
    `;
    
    // Get modal overlay
    const modalOverlay = document.getElementById('edit-idea-modal');
    
    // Update modal content
    modalOverlay.innerHTML = modalHtml;
    
    // Show modal
    modalOverlay.style.display = 'flex';
    
    // Store selected weight
    window.modalSelectedWeight = currentWeight;
}

/**
 * Select a weight in the grid picker
 * @param {Number} weight - Weight value (1-10)
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
 * Close the edit modal
 */
function closeEditIdeaModal() {
    const modal = document.getElementById('edit-idea-modal');
    modal.style.display = 'none';
    modal.innerHTML = ''; // Clear content
    currentEditingIdeaId = null;
    window.modalSelectedWeight = null;
}

/**
 * Save changes from the edit modal
 */
function saveEditIdeaModal() {
    if (!currentEditingIdeaId) return;
    
    const text = document.getElementById('modal-edit-text').value.trim();
    const difficulty = document.getElementById('modal-edit-difficulty').value;
    const weight = window.modalSelectedWeight || 5;
    
    if (!text) {
        alert('Idea text cannot be empty');
        return;
    }
    
    // Get current idea to preserve topic
    const idea = getIdeaById(currentEditingIdeaId);
    
    // Update the idea with new values
    updateIdea(currentEditingIdeaId, { 
        text, 
        difficulty, 
        weight,
        topic: idea.topic  // preserve topic
    });
    
    closeEditIdeaModal();
    
    // Reload lists via the controller
    if (pageController) {
        pageController.loadAllLists();
    }
}

/**
 * Handle keyboard shortcuts in modal
 * @param {KeyboardEvent} event
 */
function handleModalKeydown(event) {
    const modal = document.getElementById('edit-idea-modal');
    if (modal.style.display !== 'flex') return;
    
    if (event.key === 'Escape') {
        closeEditIdeaModal();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        saveEditIdeaModal();
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('edit-idea-modal');
    if (event.target === modal) {
        closeEditIdeaModal();
    }
});

// Handle keyboard shortcuts
window.addEventListener('keydown', handleModalKeydown);
