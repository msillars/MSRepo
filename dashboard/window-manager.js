/**
 * Window Manager - Interactive window behavior for Win 3.1 styled windows
 *
 * Provides: move, resize, minimize, maximize, restore, focus/z-order
 *
 * Usage:
 *   const wm = new WindowManager(containerElement, options);
 *   wm.setupWindow(windowElement);
 *   wm.openWindow(windowElement);
 *   wm.closeWindow(windowElement);
 */

class WindowManager {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            // Icon grid configuration for minimized windows
            iconWidth: options.iconWidth || 100,
            iconHeight: options.iconHeight || 32,
            iconGap: options.iconGap || 8,
            iconMargin: options.iconMargin || 8,
            // Minimum window dimensions
            minWidth: options.minWidth || 200,
            minHeight: options.minHeight || 150,
            // Callbacks
            onWindowOpen: options.onWindowOpen || null,
            onWindowClose: options.onWindowClose || null,
            onWindowMinimize: options.onWindowMinimize || null,
            onWindowMaximize: options.onWindowMaximize || null,
            onWindowRestore: options.onWindowRestore || null,
            onWindowFocus: options.onWindowFocus || null,
        };

        this.highestZIndex = 10;
        this.activeWindow = null;
        this.dragState = null;

        // Bind methods for event listeners
        this._onDrag = this._onDrag.bind(this);
        this._endDrag = this._endDrag.bind(this);
    }

    /**
     * Set up a window with interactive behavior
     * @param {HTMLElement} win - The window element (must have .window.draggable class)
     */
    setupWindow(win) {
        const titleBar = win.querySelector('.title-bar');
        const minimizeBtn = win.querySelector('[data-minimize]');
        const maximizeBtn = win.querySelector('[data-maximize]');
        const systemMenu = win.querySelector('.system-menu');
        const resizeHandles = win.querySelectorAll('.resize-handle');

        if (!titleBar) {
            console.warn('WindowManager: Window missing title bar', win);
            return;
        }

        // Title bar drag to move
        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            if (win.classList.contains('maximized')) return;

            this.setActiveWindow(win);
            this._startDrag(e, win, 'move');
        });

        // Minimize button
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.minimizeWindow(win);
            });
        }

        // Maximize/Restore button
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (win.classList.contains('maximized')) {
                    this.restoreWindow(win);
                } else {
                    this.maximizeWindow(win);
                }
            });
        }

        // System menu double-click to close
        if (systemMenu) {
            systemMenu.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.closeWindow(win);
            });
        }

        // Resize handles
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.setActiveWindow(win);
                const direction = Array.from(handle.classList).find(c =>
                    ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].includes(c)
                );
                this._startDrag(e, win, 'resize', direction);
            });
        });

        // Click to focus
        win.addEventListener('mousedown', () => {
            this.setActiveWindow(win);
        });
    }

    /**
     * Open/show a window
     */
    openWindow(win) {
        win.style.display = 'flex';
        win.classList.remove('minimized');
        this.setActiveWindow(win);

        if (this.options.onWindowOpen) {
            this.options.onWindowOpen(win);
        }
    }

    /**
     * Close/hide a window
     */
    closeWindow(win) {
        win.style.display = 'none';

        // Remove any minimized icon
        const icon = this.container.querySelector(`.window-icon[data-window-id="${win.id}"]`);
        if (icon) icon.remove();

        if (this.options.onWindowClose) {
            this.options.onWindowClose(win);
        }
    }

    /**
     * Set a window as active (focused)
     */
    setActiveWindow(win) {
        // Remove active from all draggable windows
        this.container.querySelectorAll('.window.draggable').forEach(w => {
            w.classList.remove('active');
        });

        win.classList.add('active');
        this.highestZIndex++;
        win.style.zIndex = this.highestZIndex;
        this.activeWindow = win;

        if (this.options.onWindowFocus) {
            this.options.onWindowFocus(win);
        }
    }

    /**
     * Minimize a window to an icon
     */
    minimizeWindow(win) {
        if (!win.classList.contains('maximized')) {
            this._saveRestoreState(win);
        }

        const title = win.querySelector('.title-bar-text')?.textContent || 'Window';
        const pos = this._getNextIconPosition();

        const icon = document.createElement('div');
        icon.className = 'window-icon';
        icon.dataset.windowId = win.id;
        icon.style.left = pos.left + 'px';
        icon.style.top = pos.top + 'px';
        icon.innerHTML = `
            <div class="icon-symbol"></div>
            <span class="icon-title">${title}</span>
        `;

        icon.addEventListener('click', () => {
            this.restoreFromMinimize(win);
        });

        this.container.appendChild(icon);
        win.classList.add('minimized');

        if (this.options.onWindowMinimize) {
            this.options.onWindowMinimize(win);
        }
    }

    /**
     * Restore a window from minimized state
     */
    restoreFromMinimize(win) {
        const icon = this.container.querySelector(`.window-icon[data-window-id="${win.id}"]`);
        if (icon) icon.remove();

        win.classList.remove('minimized');
        this.setActiveWindow(win);

        if (this.options.onWindowRestore) {
            this.options.onWindowRestore(win);
        }
    }

    /**
     * Maximize a window to fill its container
     */
    maximizeWindow(win) {
        if (!win.classList.contains('maximized')) {
            this._saveRestoreState(win);
        }

        win.classList.add('maximized');
        win.style.left = '0';
        win.style.top = '0';
        win.style.width = '100%';
        win.style.height = '100%';

        if (this.options.onWindowMaximize) {
            this.options.onWindowMaximize(win);
        }
    }

    /**
     * Restore a window from maximized state
     */
    restoreWindow(win) {
        win.classList.remove('maximized');
        win.style.left = (win.dataset.restoreLeft || 40) + 'px';
        win.style.top = (win.dataset.restoreTop || 30) + 'px';
        win.style.width = (win.dataset.restoreWidth || 600) + 'px';
        win.style.height = (win.dataset.restoreHeight || 400) + 'px';

        if (this.options.onWindowRestore) {
            this.options.onWindowRestore(win);
        }
    }

    /**
     * Toggle maximize state
     */
    toggleMaximize(win) {
        if (win.classList.contains('maximized')) {
            this.restoreWindow(win);
        } else {
            this.maximizeWindow(win);
        }
    }

    // ===== Private Methods =====

    _saveRestoreState(win) {
        win.dataset.restoreLeft = parseInt(win.style.left) || 40;
        win.dataset.restoreTop = parseInt(win.style.top) || 30;
        win.dataset.restoreWidth = parseInt(win.style.width) || 600;
        win.dataset.restoreHeight = parseInt(win.style.height) || 400;
    }

    _getNextIconPosition() {
        const { iconWidth, iconHeight, iconGap, iconMargin } = this.options;
        const existingIcons = this.container.querySelectorAll('.window-icon');
        const containerRect = this.container.getBoundingClientRect();
        const cols = Math.floor((containerRect.width - iconMargin * 2) / (iconWidth + iconGap));

        const occupied = new Set();
        existingIcons.forEach(icon => {
            const col = Math.round((parseInt(icon.style.left) - iconMargin) / (iconWidth + iconGap));
            const row = Math.round((containerRect.height - parseInt(icon.style.top) - iconHeight - iconMargin) / (iconHeight + iconGap));
            occupied.add(`${col},${row}`);
        });

        for (let row = 0; row < 100; row++) {
            for (let col = 0; col < cols; col++) {
                if (!occupied.has(`${col},${row}`)) {
                    return {
                        left: iconMargin + col * (iconWidth + iconGap),
                        top: containerRect.height - iconMargin - iconHeight - row * (iconHeight + iconGap)
                    };
                }
            }
        }
        return { left: iconMargin, top: containerRect.height - iconMargin - iconHeight };
    }

    _startDrag(e, win, type, direction = null) {
        e.preventDefault();

        const rect = win.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        this.dragState = {
            type,
            direction,
            win,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: rect.left - containerRect.left,
            startTop: rect.top - containerRect.top,
            startWidth: rect.width,
            startHeight: rect.height,
            containerWidth: containerRect.width,
            containerHeight: containerRect.height,
            minWidth: this.options.minWidth,
            minHeight: this.options.minHeight
        };

        document.addEventListener('mousemove', this._onDrag);
        document.addEventListener('mouseup', this._endDrag);
    }

    _onDrag(e) {
        if (!this.dragState) return;

        const dx = e.clientX - this.dragState.startX;
        const dy = e.clientY - this.dragState.startY;
        const win = this.dragState.win;

        if (this.dragState.type === 'move') {
            let newLeft = this.dragState.startLeft + dx;
            let newTop = this.dragState.startTop + dy;

            const minVisible = 40;
            newLeft = Math.max(-win.offsetWidth + minVisible,
                      Math.min(newLeft, this.dragState.containerWidth - minVisible));
            newTop = Math.max(0,
                     Math.min(newTop, this.dragState.containerHeight - minVisible));

            win.style.left = newLeft + 'px';
            win.style.top = newTop + 'px';
            win.style.width = this.dragState.startWidth + 'px';
            win.style.height = this.dragState.startHeight + 'px';
        }
        else if (this.dragState.type === 'resize') {
            let newLeft = this.dragState.startLeft;
            let newTop = this.dragState.startTop;
            let newWidth = this.dragState.startWidth;
            let newHeight = this.dragState.startHeight;
            const dir = this.dragState.direction;

            if (dir.includes('e')) {
                newWidth = Math.max(this.dragState.minWidth, this.dragState.startWidth + dx);
                newWidth = Math.min(newWidth, this.dragState.containerWidth - newLeft);
            }
            if (dir.includes('w')) {
                const maxDx = this.dragState.startWidth - this.dragState.minWidth;
                const actualDx = Math.max(-this.dragState.startLeft, Math.min(dx, maxDx));
                newLeft = this.dragState.startLeft + actualDx;
                newWidth = this.dragState.startWidth - actualDx;
            }
            if (dir.includes('s')) {
                newHeight = Math.max(this.dragState.minHeight, this.dragState.startHeight + dy);
                newHeight = Math.min(newHeight, this.dragState.containerHeight - newTop);
            }
            if (dir.includes('n')) {
                const maxDy = this.dragState.startHeight - this.dragState.minHeight;
                const actualDy = Math.max(-this.dragState.startTop, Math.min(dy, maxDy));
                newTop = this.dragState.startTop + actualDy;
                newHeight = this.dragState.startHeight - actualDy;
            }

            win.style.left = newLeft + 'px';
            win.style.top = newTop + 'px';
            win.style.width = newWidth + 'px';
            win.style.height = newHeight + 'px';
        }
    }

    _endDrag() {
        if (this.dragState && this.dragState.type !== 'move') {
            const win = this.dragState.win;
            if (!win.classList.contains('maximized')) {
                this._saveRestoreState(win);
            }
        }
        this.dragState = null;
        document.removeEventListener('mousemove', this._onDrag);
        document.removeEventListener('mouseup', this._endDrag);
    }

    /**
     * Initialize all draggable windows in the container
     */
    initAllWindows() {
        const windows = this.container.querySelectorAll('.window.draggable');
        windows.forEach(win => {
            this.setupWindow(win);
        });
    }
}

// Export for module usage or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowManager;
} else {
    window.WindowManager = WindowManager;
}
