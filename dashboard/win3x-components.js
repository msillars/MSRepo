/**
 * Win3x UI Components
 * Reusable components following Windows 3.1 standards
 * See docs/WIN3X_TITLE_BAR.md for the title bar specification
 */

/**
 * Render a Windows 3.1 style title bar
 *
 * Layout: [System Menu] --- Title --- [Minimize] [Maximize]
 * No close button (authentic Win 3.1)
 * Double-click system menu to close
 *
 * @param {Object} options
 * @param {string} options.title - Window title text
 * @param {string} [options.id] - Optional ID for the title bar element
 * @param {string} [options.onClose] - JS to execute on system menu double-click (closes window)
 * @param {string} [options.onMinimize] - JS to execute on minimize click
 * @param {string} [options.onMaximize] - JS to execute on maximize click
 * @param {boolean} [options.showMinimize=true] - Show minimize button
 * @param {boolean} [options.showMaximize=true] - Show maximize button
 * @returns {string} HTML string
 */
function renderTitleBar(options) {
    const {
        title,
        id,
        onClose,
        onMinimize,
        onMaximize,
        showMinimize = true,
        showMaximize = true
    } = options;

    const idAttr = id ? ` id="${id}"` : '';
    const closeHandler = onClose ? ` ondblclick="${onClose}"` : '';
    const minimizeHandler = onMinimize ? ` onclick="${onMinimize}"` : '';
    const maximizeHandler = onMaximize ? ` onclick="${onMaximize}"` : '';

    return `
        <div class="title-bar"${idAttr}>
            <div class="title-bar-controls">
                <button class="system-menu" aria-label="System menu"${closeHandler}></button>
            </div>
            <div class="title-bar-text">${title}</div>
            <div class="title-bar-controls">
                ${showMinimize ? `<button data-minimize aria-label="Minimize"${minimizeHandler}></button>` : ''}
                ${showMaximize ? `<button data-maximize aria-label="Maximize"${maximizeHandler}></button>` : ''}
            </div>
        </div>
    `.trim();
}

/**
 * Render a complete Windows 3.1 style window
 *
 * @param {Object} options
 * @param {string} options.title - Window title text
 * @param {string} options.content - HTML content for the window body
 * @param {string} [options.id] - Optional ID for the window element
 * @param {string} [options.className] - Additional CSS classes for the window
 * @param {boolean} [options.active=false] - Whether window appears active
 * @param {string} [options.onClose] - JS to execute on close
 * @param {string} [options.onMinimize] - JS to execute on minimize
 * @param {string} [options.onMaximize] - JS to execute on maximize
 * @param {boolean} [options.showMinimize=true] - Show minimize button
 * @param {boolean} [options.showMaximize=true] - Show maximize button
 * @param {Object} [options.bodyStyle] - Inline styles for window body
 * @returns {string} HTML string
 */
function renderWindow(options) {
    const {
        title,
        content,
        id,
        className = '',
        active = false,
        onClose,
        onMinimize,
        onMaximize,
        showMinimize = true,
        showMaximize = true,
        bodyStyle = {}
    } = options;

    const idAttr = id ? ` id="${id}"` : '';
    const activeClass = active ? ' active' : '';
    const classes = `window${activeClass}${className ? ' ' + className : ''}`;

    const styleStr = Object.entries(bodyStyle)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
    const styleAttr = styleStr ? ` style="${styleStr}"` : '';

    const titleBar = renderTitleBar({
        title,
        onClose,
        onMinimize,
        onMaximize,
        showMinimize,
        showMaximize
    });

    return `
        <div class="${classes}"${idAttr}>
            ${titleBar}
            <div class="window-body"${styleAttr}>
                ${content}
            </div>
        </div>
    `.trim();
}

/**
 * Render a modal dialog window
 *
 * @param {Object} options
 * @param {string} options.title - Dialog title
 * @param {string} options.content - HTML content for the dialog body
 * @param {string} options.id - ID for the modal (required for show/hide)
 * @param {string} [options.onClose] - JS to execute on close
 * @returns {string} HTML string
 */
function renderModal(options) {
    const {
        title,
        content,
        id,
        onClose
    } = options;

    const windowHtml = renderWindow({
        title,
        content,
        className: 'modal-content',
        active: true,
        onClose,
        showMinimize: true,
        showMaximize: true
    });

    return `
        <div class="modal" id="${id}">
            ${windowHtml}
        </div>
    `.trim();
}

// Export for use in other modules (if using ES modules)
if (typeof window !== 'undefined') {
    window.Win3x = {
        renderTitleBar,
        renderWindow,
        renderModal
    };
}
