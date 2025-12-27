/**
 * Shared Weight Picker Component - Windows 3.1 Style
 * 
 * Provides a consistent, retro-styled weight picker (1-10 scale)
 * Used for both ideas and topics throughout the management system.
 * 
 * Features:
 * - Chunky Windows 3.1 style slider
 * - Large square weight badge preview
 * - Increment/decrement buttons
 * - Gradient color feedback (yellow → orange → red)
 */

/**
 * Render a Windows 3.1 style weight picker
 * @param {Object} options - Configuration options
 * @param {Number} options.currentWeight - Current weight value (1-10)
 * @param {String} options.id - Unique ID for this picker instance
 * @param {String} options.label - Label text (e.g., "Idea Weight", "Topic Weight")
 * @param {Boolean} options.showHelp - Show help text below picker
 * @returns {String} HTML string for the weight picker
 */
function renderWeightPicker(options = {}) {
    const {
        currentWeight = 5,
        id = 'weight',
        label = 'Weight',
        showHelp = true
    } = options;
    
    const helpText = showHelp ? `
        <div class="weight-picker-help">
            1-3 = Low Priority (Yellow) • 4-7 = Medium Priority (Orange) • 8-10 = High Priority (Red)
        </div>
    ` : '';
    
    return `
        <div class="weight-picker-container" id="${id}-container">
            <label class="weight-picker-label">${label}</label>
            <div class="weight-picker-controls">
                <!-- Left: Slider with buttons -->
                <div class="weight-picker-slider-section">
                    <button class="weight-btn weight-btn-decrement" 
                            onclick="changeWeight('${id}', -1)"
                            type="button">
                        <span class="weight-btn-arrow">◄</span>
                    </button>
                    <div class="weight-slider-track">
                        <input type="range" 
                               id="${id}-slider" 
                               class="weight-slider"
                               min="1" 
                               max="10" 
                               value="${currentWeight}"
                               oninput="updateWeightDisplay('${id}')"
                               onchange="updateWeightDisplay('${id}')">
                        <div class="weight-slider-ticks">
                            ${[1,2,3,4,5,6,7,8,9,10].map(n => 
                                `<span class="weight-tick" style="left: ${(n-1) * 11.11}%">${n}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <button class="weight-btn weight-btn-increment" 
                            onclick="changeWeight('${id}', 1)"
                            type="button">
                        <span class="weight-btn-arrow">►</span>
                    </button>
                </div>
                
                <!-- Right: Preview badge -->
                <div class="weight-picker-preview">
                    <div id="${id}-badge" 
                         class="weight-badge weight-badge-large" 
                         style="background: ${getWeightColor(currentWeight)};">
                        ${currentWeight}
                    </div>
                    <div class="weight-preview-label">Preview</div>
                </div>
            </div>
            ${helpText}
        </div>
    `;
}

/**
 * Update weight display when slider changes
 * @param {String} pickerId - ID of the picker instance
 */
function updateWeightDisplay(pickerId) {
    const slider = document.getElementById(`${pickerId}-slider`);
    const badge = document.getElementById(`${pickerId}-badge`);
    
    if (!slider || !badge) return;
    
    const weight = parseInt(slider.value);
    badge.textContent = weight;
    badge.style.background = getWeightColor(weight);
}

/**
 * Change weight by increment (via buttons)
 * @param {String} pickerId - ID of the picker instance
 * @param {Number} delta - Amount to change (-1 or +1)
 */
function changeWeight(pickerId, delta) {
    const slider = document.getElementById(`${pickerId}-slider`);
    if (!slider) return;
    
    const currentValue = parseInt(slider.value);
    const newValue = Math.max(1, Math.min(10, currentValue + delta));
    
    slider.value = newValue;
    updateWeightDisplay(pickerId);
    
    // Trigger change event for any listeners
    slider.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Get current weight value from picker
 * @param {String} pickerId - ID of the picker instance
 * @returns {Number} Current weight value (1-10)
 */
function getWeightValue(pickerId) {
    const slider = document.getElementById(`${pickerId}-slider`);
    return slider ? parseInt(slider.value) : 5;
}

/**
 * Set weight value in picker
 * @param {String} pickerId - ID of the picker instance
 * @param {Number} weight - Weight value to set (1-10)
 */
function setWeightValue(pickerId, weight) {
    const slider = document.getElementById(`${pickerId}-slider`);
    if (!slider) return;
    
    slider.value = Math.max(1, Math.min(10, weight));
    updateWeightDisplay(pickerId);
}

// Add CSS for weight picker (injected into page)
const WEIGHT_PICKER_CSS = `
<style>
/* Weight Picker Container */
.weight-picker-container {
    margin-bottom: 20px;
}

.weight-picker-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
}

.weight-picker-controls {
    display: flex;
    gap: 20px;
    align-items: center;
}

/* Slider Section */
.weight-picker-slider-section {
    flex: 1;
    display: flex;
    gap: 8px;
    align-items: center;
}

.weight-btn {
    width: 32px;
    height: 32px;
    border: 2px solid #000;
    background: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
    padding: 0;
}

.weight-btn:hover {
    background: #000;
    color: white;
}

.weight-btn:active {
    transform: translate(1px, 1px);
}

.weight-btn-arrow {
    display: block;
    line-height: 1;
}

/* Slider Track */
.weight-slider-track {
    flex: 1;
    position: relative;
    padding: 0 8px;
}

.weight-slider {
    width: 100%;
    height: 8px;
    border: 2px solid #000;
    background: #E0E0E0;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
    position: relative;
    z-index: 2;
}

/* Chrome/Safari slider thumb */
.weight-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border: 2px solid #000;
    background: white;
    cursor: pointer;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
}

.weight-slider::-webkit-slider-thumb:hover {
    background: #F0F0F0;
}

.weight-slider::-webkit-slider-thumb:active {
    background: #000;
    box-shadow: none;
}

/* Firefox slider thumb */
.weight-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border: 2px solid #000;
    background: white;
    cursor: pointer;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
    border-radius: 0;
}

.weight-slider::-moz-range-thumb:hover {
    background: #F0F0F0;
}

.weight-slider::-moz-range-thumb:active {
    background: #000;
    box-shadow: none;
}

/* Slider ticks */
.weight-slider-ticks {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    position: relative;
    padding: 0 4px;
}

.weight-tick {
    font-size: 9px;
    font-weight: 600;
    color: #666;
    text-align: center;
    min-width: 12px;
}

/* Preview Section */
.weight-picker-preview {
    flex-shrink: 0;
    text-align: center;
}

.weight-badge-large {
    width: 64px;
    height: 64px;
    font-size: 28px;
    margin-bottom: 8px;
}

.weight-preview-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
}

/* Help Text */
.weight-picker-help {
    margin-top: 12px;
    padding: 12px;
    background: #F5F5F7;
    border: 2px solid #E0E0E0;
    font-size: 11px;
    color: #666;
    text-align: center;
    line-height: 1.6;
}
</style>
`;

// Inject CSS when module loads
if (typeof document !== 'undefined') {
    const style = document.createElement('div');
    style.innerHTML = WEIGHT_PICKER_CSS;
    document.head.appendChild(style.firstElementChild);
}

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        renderWeightPicker,
        updateWeightDisplay,
        changeWeight,
        getWeightValue,
        setWeightValue
    };
}
