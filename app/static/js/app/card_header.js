/**
 * Card Header Component JavaScript
 * Provides dynamic functionality for card header creation
 */

export default {
    // Initialize card header functionality
    card_header_init() {
        this.card_header_setupEventListeners();
    },

    card_header_setupEventListeners() {
        // Add click analytics or other interactions if needed
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-govbr')) {
                const button = e.target.closest('.btn-govbr');
                this.card_header_trackButtonClick(button);
            }
        });
    },

    card_header_trackButtonClick(button) {
        // Optional: Add analytics tracking for card header button clicks
        const buttonId = button.getAttribute('id') || '';
        const buttonText = button.querySelector('span')?.textContent || '';
        
        console.log(`Card header button clicked: ${buttonId} - ${buttonText}`);
        
        // Example: Send to analytics service
        // analytics.track('card_header_button_click', { id: buttonId, text: buttonText });
    },

    /**
     * Creates card header HTML structure dynamically
     * @param {Object} options - Card header configuration
     * @param {string} containerId - ID of the container where card header will be inserted
     */
    card_header_createDynamic(options, containerId) {
        if (!containerId) {
            console.error('containerId is required for card_header_createDynamic');
            return;
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found for card header`);
            return;
        }

        const {
            icon = 'fas fa-cog',
            title = 'Title',
            title_id = null,
            subtitle = null,
            subtitle_id = null,
            actions = []
        } = options;

        // Generate actions HTML
        let actionsHTML = '';
        if (actions && actions.length > 0) {
            const actionsButtons = actions.map(action => {
                const actionId = action.id ? `id="${action.id}"` : '';
                const actionStyle = action.style ? `style="${action.style}"` : '';
                const actionOnclick = action.onclick ? `onclick="${action.onclick}"` : '';
                const actionTitle = action.title ? `title="${action.title}"` : '';
                const actionIcon = action.icon ? `<i class="${action.icon}"></i>` : '';
                const actionText = action.text ? `<span>${action.text}</span>` : '';
                const actionType = action.type || 'primary';

                return `
                    <button class="btn-govbr ${actionType}" 
                            ${actionId}
                            ${actionStyle}
                            ${actionOnclick}
                            ${actionTitle}>
                        ${actionIcon}
                        ${actionText}
                    </button>
                `;
            }).join('');

            actionsHTML = `
                <div class="govbr-actions">
                    ${actionsButtons}
                </div>
            `;
        }

        // Generate subtitle HTML
        const subtitleHTML = subtitle ? `
            <span class="govbr-subtitle" ${subtitle_id ? `id="${subtitle_id}"` : ''}>${subtitle}</span>
        ` : '';

        // Complete card header HTML
        const cardHeaderHTML = `
            <div class="card-header-govbr">
                <div class="govbr-header-content">
                    <div class="govbr-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="govbr-title">
                        <h3 ${title_id ? `id="${title_id}"` : ''}>${title}</h3>
                        ${subtitleHTML}
                    </div>
                    ${actionsHTML}
                </div>
            </div>
        `;

        // Insert into container
        container.innerHTML = cardHeaderHTML;

        // Initialize functionality
        this.card_header_setupEventListeners();
    },

    /**
     * Updates card header title dynamically
     * @param {string} containerId - ID of the container containing the card header
     * @param {string} newTitle - New title text
     * @param {string} titleId - Optional specific title element ID
     */
    card_header_updateTitle(containerId, newTitle, titleId = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found for title update`);
            return;
        }

        const titleElement = titleId ? 
            document.getElementById(titleId) : 
            container.querySelector('.govbr-title h3');

        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    },

    /**
     * Updates card header subtitle dynamically
     * @param {string} containerId - ID of the container containing the card header
     * @param {string} newSubtitle - New subtitle text
     * @param {string} subtitleId - Optional specific subtitle element ID
     */
    card_header_updateSubtitle(containerId, newSubtitle, subtitleId = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found for subtitle update`);
            return;
        }

        const subtitleElement = subtitleId ? 
            document.getElementById(subtitleId) : 
            container.querySelector('.govbr-subtitle');

        if (subtitleElement) {
            subtitleElement.textContent = newSubtitle;
        }
    },

    /**
     * Shows/hides action buttons dynamically
     * @param {string} buttonId - ID of the button to show/hide
     * @param {boolean} show - Whether to show (true) or hide (false) the button
     */
    card_header_toggleButton(buttonId, show) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = show ? 'inline-flex' : 'none';
        }
    }
};
