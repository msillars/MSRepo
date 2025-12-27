/**
 * Weight Utilities
 * 
 * Provides functions for working with topic weights (1-10 scale)
 * Includes color gradient calculation: yellow (1) → orange (5) → red (10)
 */

/**
 * Get color for a weight value (1-10)
 * @param {number} weight - Weight value from 1 to 10
 * @returns {string} - Hex color code
 */
function getWeightColor(weight) {
    // Clamp weight to valid range
    weight = Math.max(1, Math.min(10, weight));
    
    // Color stops:
    // 1 = #FDD835 (yellow)
    // 5 = #FF8A65 (orange) 
    // 10 = #EF5350 (red)
    
    if (weight <= 5) {
        // Yellow to Orange (1-5)
        const t = (weight - 1) / 4; // 0 to 1
        return interpolateColor('#FDD835', '#FF8A65', t);
    } else {
        // Orange to Red (5-10)
        const t = (weight - 5) / 5; // 0 to 1
        return interpolateColor('#FF8A65', '#EF5350', t);
    }
}

/**
 * Interpolate between two hex colors
 * @param {string} color1 - Start color (hex)
 * @param {string} color2 - End color (hex)
 * @param {number} t - Interpolation factor (0-1)
 * @returns {string} - Interpolated hex color
 */
function interpolateColor(color1, color2, t) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Render a weight badge (square design)
 * @param {number} weight - Weight value from 1 to 10
 * @param {object} options - Rendering options
 * @param {string} options.size - Size variant ('small'|'medium'|'large')
 * @returns {string} - HTML string for weight badge
 */
function renderWeightBadge(weight, options = {}) {
    const { size = 'medium' } = options;
    const color = getWeightColor(weight);
    
    const sizeStyles = {
        small: 'width: 24px; height: 24px; font-size: 11px;',
        medium: 'width: 32px; height: 32px; font-size: 13px;',
        large: 'width: 40px; height: 40px; font-size: 16px;'
    };
    
    const style = sizeStyles[size] || sizeStyles.medium;
    
    return `<div class="weight-badge" style="background: ${color}; ${style}" title="Weight: ${weight}/10">${weight}</div>`;
}

/**
 * Get text color (black or white) based on background
 * @param {string} hexColor - Background color
 * @returns {string} - 'black' or 'white'
 */
function getContrastTextColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? 'black' : 'white';
}

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        getWeightColor,
        interpolateColor,
        renderWeightBadge,
        getContrastTextColor
    };
}
