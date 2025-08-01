/**
 * Breadcrumb Component JavaScript
 * Provides dynamic functionality for breadcrumb navigation
 */

export default {
    // Initialize breadcrumb functionality
    breadcrumb_init() {
        this.breadcrumb_setupEventListeners();
        this.breadcrumb_handleResponsiveTooltips();
    },

    breadcrumb_setupEventListeners() {
        // Add click analytics or other interactions if needed
        document.addEventListener('click', (e) => {
            if (e.target.closest('.breadcrumb-item a')) {
                const link = e.target.closest('.breadcrumb-item a');
                this.breadcrumb_trackBreadcrumbClick(link);
            }
        });
    },

    breadcrumb_trackBreadcrumbClick(link) {
        // Optional: Add analytics tracking for breadcrumb navigation
        const href = link.getAttribute('href');
        const text = link.querySelector('span')?.textContent || '';
        
        console.log(`Breadcrumb navigation: ${text} -> ${href}`);
        
        // Example: Send to analytics service
        // analytics.track('breadcrumb_click', { page: text, url: href });
    },

    breadcrumb_handleResponsiveTooltips() {
        // Add tooltips for mobile devices where text is hidden
        const breadcrumbItems = document.querySelectorAll('.breadcrumb-item a, .breadcrumb-item.active');
        
        breadcrumbItems.forEach(item => {
            const span = item.querySelector('span');
            const icon = item.querySelector('i');
            
            if (span && icon) {
                icon.setAttribute('title', span.textContent);
                icon.setAttribute('data-bs-toggle', 'tooltip');
                icon.setAttribute('data-bs-placement', 'top');
            }
        });

        // Initialize Bootstrap tooltips if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(
                document.querySelectorAll('[data-bs-toggle="tooltip"]')
            );
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    },

    /**
     * Dynamically update breadcrumb items
     * @param {Array} items - Array of breadcrumb items
     */
    breadcrumb_updateBreadcrumb(items) {
        const container = document.querySelector('.breadcrumb-items');
        if (!container) return;

        container.innerHTML = '';

        items.forEach((item, index) => {
            const isLast = index === items.length - 1;
            
            // Create breadcrumb item
            const itemDiv = document.createElement('div');
            itemDiv.className = isLast ? 'breadcrumb-item active' : 'breadcrumb-item';
            
            if (isLast) {
                itemDiv.innerHTML = `
                    <i class="${item.icon}"></i>
                    <span>${item.title}</span>
                `;
            } else {
                const link = document.createElement('a');
                link.href = item.url;
                link.innerHTML = `
                    <i class="${item.icon}"></i>
                    <span>${item.title}</span>
                `;
                itemDiv.appendChild(link);
            }
            
            container.appendChild(itemDiv);
            
            // Add separator if not last item
            if (!isLast) {
                const separator = document.createElement('div');
                separator.className = 'breadcrumb-separator';
                separator.innerHTML = '<i class="fas fa-chevron-right"></i>';
                container.appendChild(separator);
            }
        });

        // Reinitialize tooltips
        this.breadcrumb_handleResponsiveTooltips();
    },

    /**
     * Get current breadcrumb path as array
     * @returns {Array} Current breadcrumb items
     */
    breadcrumb_getCurrentPath() {
        const items = [];
        const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
        
        breadcrumbItems.forEach(item => {
            const link = item.querySelector('a');
            const icon = item.querySelector('i');
            const span = item.querySelector('span');
            
            if (icon && span) {
                items.push({
                    title: span.textContent,
                    icon: icon.className,
                    url: link ? link.href : null,
                    active: item.classList.contains('active')
                });
            }
        });
        
        return items;
    },

    /**
     * Function for the back button in breadcrumb
     * Goes back to the previous page in browser history
     */
    breadcrumb_goBackInBreadcrumb() {
        // Add a smooth transition effect
        const backBtn = document.querySelector('.breadcrumb-back-btn');
        if (backBtn) {
            backBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                window.history.back();
            }, 150);
        } else {
            window.history.back();
        }
    }
};
