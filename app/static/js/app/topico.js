/**
 * Topico Component JavaScript
 * Provides dynamic functionality for topic bar component
 */

export default {
    // Initialize topico functionality
    topico_init() {
        this.topico_setupEventListeners();
        this.topico_handleResponsiveLayout();
        this.topico_initializeTooltips();
    },

    topico_setupEventListeners() {
        // Handle tag clicks
        document.addEventListener('click', (e) => {
            if (!e || !e.target) return;
            const tag = this.topico_findClosest(e.target, '.topico-tag');
            if (tag) {
                this.topico_handleTagClick(tag);
            }
        });

        // Handle action button clicks
        document.addEventListener('click', (e) => {
            if (!e || !e.target) return;
            const button = this.topico_findClosest(e.target, '.btn-topico');
            if (button) {
                this.topico_handleActionClick(button);
            }
        });

        // Handle icon hover effects
        document.addEventListener('mouseenter', (e) => {
            if (!e || !e.target) return;
            const icon = this.topico_findClosest(e.target, '.topico-icon');
            if (icon) {
                this.topico_handleIconHover(icon, true);
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (!e || !e.target) return;
            const icon = this.topico_findClosest(e.target, '.topico-icon');
            if (icon) {
                this.topico_handleIconHover(icon, false);
            }
        }, true);
    },

    // Helper function to safely find closest element
    topico_findClosest(element, selector) {
        // Check if element exists and is a valid DOM element
        if (!element || typeof element.closest !== 'function') {
            return null;
        }
        try {
            return element.closest(selector);
        } catch (error) {
            console.warn('Error finding closest element:', error);
            return null;
        }
    },

    topico_handleTagClick(tag) {
        // Add click analytics or custom functionality
        const text = tag.textContent.trim();
        const type = this.topico_getTagType(tag);
        
        console.log(`Topico tag clicked: ${text} (${type})`);
        
        // Add visual feedback
        this.topico_addClickFeedback(tag);
        
        // Optional: Send to analytics service
        // analytics.track('topico_tag_click', { tag: text, type: type });
    },

    topico_handleActionClick(button) {
        // Add click analytics or custom functionality
        const text = button.textContent.trim();
        const type = this.topico_getButtonType(button);
        
        console.log(`Topico action clicked: ${text} (${type})`);
        
        // Add visual feedback
        this.topico_addClickFeedback(button);
        
        // Optional: Send to analytics service
        // analytics.track('topico_action_click', { action: text, type: type });
    },

    topico_handleIconHover(icon, isEntering) {
        // Safety check for the icon element
        if (!icon || !icon.style) {
            return;
        }
        
        try {
            if (isEntering) {
                // Add subtle animation on hover
                icon.style.transform = 'scale(1.05) rotate(5deg)';
            } else {
                // Reset animation
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        } catch (error) {
            console.warn('Error handling icon hover:', error);
        }
    },

    topico_getTagType(tag) {
        const classes = tag.className.split(' ');
        const typeClasses = ['primary', 'success', 'warning', 'danger', 'info', 'default'];
        return typeClasses.find(type => classes.includes(type)) || 'default';
    },

    topico_getButtonType(button) {
        const classes = button.className.split(' ');
        const typeClasses = ['primary', 'secondary', 'success', 'warning', 'danger'];
        return typeClasses.find(type => classes.includes(type)) || 'primary';
    },

    topico_addClickFeedback(element) {
        // Safety check for the element
        if (!element || !element.style) {
            return;
        }
        
        try {
            // Add temporary visual feedback on click
            element.style.transform = 'scale(0.95)';
            element.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                if (element && element.style) {
                    element.style.transform = '';
                    element.style.transition = '';
                }
            }, 100);
        } catch (error) {
            console.warn('Error adding click feedback:', error);
        }
    },

    topico_handleResponsiveLayout() {
        // Handle responsive layout adjustments
        const handleResize = () => {
            const topicos = document.querySelectorAll('.topico-container');
            
            topicos.forEach(topico => {
                const content = topico.querySelector('.topico-content');
                const tags = topico.querySelector('.topico-tags');
                const actions = topico.querySelector('.topico-actions');
                
                if (window.innerWidth <= 768) {
                    // Mobile layout adjustments
                    if (content) {
                        content.style.flexDirection = 'column';
                        content.style.alignItems = 'flex-start';
                    }
                } else {
                    // Desktop layout
                    if (content) {
                        content.style.flexDirection = 'row';
                        content.style.alignItems = 'center';
                    }
                }
            });
        };

        // Initial call
        handleResize();
        
        // Listen for window resize
        window.addEventListener('resize', handleResize);
    },

    topico_initializeTooltips() {
        // Add tooltips for elements that might need them
        const elements = document.querySelectorAll('.topico-tag, .btn-topico, .topico-icon');
        
        elements.forEach(element => {
            const title = element.getAttribute('title');
            if (title) {
                element.setAttribute('data-bs-toggle', 'tooltip');
                element.setAttribute('data-bs-placement', 'top');
            }
        });

        // Initialize Bootstrap tooltips if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    },

    // Utility methods for dynamic content management
    topico_updateTitle(containerId, newTitle) {
        const container = document.getElementById(containerId);
        if (container) {
            const titleElement = container.querySelector('.topico-title h4');
            if (titleElement) {
                titleElement.textContent = newTitle;
            }
        }
    },

    topico_updateDescription(containerId, newDescription) {
        const container = document.getElementById(containerId);
        if (container) {
            const descElement = container.querySelector('.topico-description span');
            if (descElement) {
                descElement.textContent = newDescription;
            }
        }
    },

    topico_addTag(containerId, tag) {
        const container = document.getElementById(containerId);
        if (container) {
            let tagsContainer = container.querySelector('.topico-tags');
            if (!tagsContainer) {
                // Create tags container if it doesn't exist
                tagsContainer = document.createElement('div');
                tagsContainer.className = 'topico-tags';
                const content = container.querySelector('.topico-content');
                const actions = container.querySelector('.topico-actions');
                if (actions) {
                    content.insertBefore(tagsContainer, actions);
                } else {
                    content.appendChild(tagsContainer);
                }
            }
            
            const tagElement = document.createElement('span');
            tagElement.className = `topico-tag ${tag.type || 'default'}`;
            if (tag.onclick) tagElement.setAttribute('onclick', tag.onclick);
            if (tag.title) tagElement.setAttribute('title', tag.title);
            if (tag.id) tagElement.setAttribute('id', tag.id);
            
            let innerHTML = '';
            if (tag.icon) innerHTML += `<i class="${tag.icon}"></i>`;
            innerHTML += tag.text;
            tagElement.innerHTML = innerHTML;
            
            tagsContainer.appendChild(tagElement);
        }
    },

    topico_removeTag(containerId, tagText) {
        const container = document.getElementById(containerId);
        if (container) {
            const tags = container.querySelectorAll('.topico-tag');
            tags.forEach(tag => {
                if (tag.textContent.trim() === tagText) {
                    tag.remove();
                }
            });
        }
    },

    topico_toggleTag(containerId, tagText, tag) {
        const container = document.getElementById(containerId);
        if (container) {
            const existingTag = Array.from(container.querySelectorAll('.topico-tag'))
                .find(t => t.textContent.trim() === tagText);
            
            if (existingTag) {
                this.topico_removeTag(containerId, tagText);
            } else {
                this.topico_addTag(containerId, tag);
            }
        }
    },

    /**
     * Creates topico HTML structure dynamically
     * @param {Object} options - Configuration object for the topico
     * @param {string} containerId - ID of the container where topico will be inserted
     */
    topico_createDynamic(options, containerId) {
        if (!containerId) {
            console.error('containerId is required for topico_createDynamic');
            return;
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found for topico`);
            return;
        }

        // Generate tags HTML
        let tagsHTML = '';
        if (options.tags && options.tags.length > 0) {
            tagsHTML = '<div class="topico-tags">';
            options.tags.forEach(tag => {
                let tagAttributes = `class="topico-tag ${tag.type || 'default'}"`;
                if (tag.id) tagAttributes += ` id="${tag.id}"`;
                if (tag.onclick) tagAttributes += ` onclick="${tag.onclick}"`;
                if (tag.title) tagAttributes += ` title="${tag.title}"`;
                
                let tagIconHTML = tag.icon ? `<i class="${tag.icon}"></i>` : '';
                tagsHTML += `<span ${tagAttributes}>${tagIconHTML}${tag.text}</span>`;
            });
            tagsHTML += '</div>';
        }

        // Generate actions HTML
        let actionsHTML = '';
        if (options.actions && options.actions.length > 0) {
            actionsHTML = '<div class="topico-actions">';
            options.actions.forEach(action => {
                let actionAttributes = `class="btn-topico ${action.type || 'primary'}"`;
                if (action.id) actionAttributes += ` id="${action.id}"`;
                if (action.style) actionAttributes += ` style="${action.style}"`;
                if (action.onclick) actionAttributes += ` onclick="${action.onclick}"`;
                if (action.title) actionAttributes += ` title="${action.title}"`;
                
                let actionIconHTML = action.icon ? `<i class="${action.icon}"></i>` : '';
                let actionTextHTML = action.text ? `<span>${action.text}</span>` : '';
                actionsHTML += `<button ${actionAttributes}>${actionIconHTML}${actionTextHTML}</button>`;
            });
            actionsHTML += '</div>';
        }

        // Generate description HTML
        let descriptionHTML = '';
        if (options.description) {
            let descAttributes = options.description_id ? ` id="${options.description_id}"` : '';
            descriptionHTML = `
                <div class="topico-description">
                    <span${descAttributes}>${options.description}</span>
                </div>
            `;
        }

        // Generate complete topico HTML
        let titleAttributes = options.title_id ? ` id="${options.title_id}"` : '';
        const topicoHTML = `
            <div class="topico-container">
                <div class="topico-modern">
                    <div class="topico-content">
                        <div class="topico-icon">
                            <i class="${options.icon || 'fas fa-info-circle'}"></i>
                        </div>
                        <div class="topico-info">
                            <div class="topico-title">
                                <h4${titleAttributes}>${options.title || ''}</h4>
                            </div>
                            ${descriptionHTML}
                        </div>
                        ${tagsHTML}
                        ${actionsHTML}
                    </div>
                </div>
            </div>
        `;

        // Insert into container
        container.innerHTML = topicoHTML;

        // Initialize functionality
        this.topico_initializeTooltips();
        this.topico_setupEventListeners();
    }
};
