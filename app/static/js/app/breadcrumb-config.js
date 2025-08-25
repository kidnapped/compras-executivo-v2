/**
 * Breadcrumb Configuration
 * Defines common breadcrumb patterns and utilities
 */

// Common breadcrumb patterns
window.BreadcrumbPatterns = {
    // Home pattern
    HOME: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' }
    ],

    // Dashboard pattern
    DASHBOARD: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' },
        { title: 'Dashboard', icon: 'fas fa-tachometer-alt', url: '' }
    ],

    // Admin patterns
    ADMIN_ROOT: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' },
        { title: 'Administração', icon: 'fas fa-cog', url: '' }
    ],

    ADMIN_USERS: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' },
        { title: 'Administração', icon: 'fas fa-cog', url: '/admin' },
        { title: 'Usuários', icon: 'fas fa-users', url: '' }
    ],

    ADMIN_ETL: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' },
        { title: 'Administração', icon: 'fas fa-cog', url: '/admin' },
        { title: 'ETL', icon: 'fas fa-database', url: '' }
    ],

    ADMIN_DW_TESOURO: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' },
        { title: 'Administração', icon: 'fas fa-cog', url: '/admin' },
        { title: 'ETL', icon: 'fas fa-database', url: '/admin/etl' },
        { title: 'DW Tesouro', icon: 'fas fa-chart-bar', url: '' }
    ],

    // Reports patterns
    REPORTS_ROOT: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' },
        { title: 'Relatórios', icon: 'fas fa-chart-line', url: '' }
    ],

    REPORTS_FINANCIAL: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' },
        { title: 'Relatórios', icon: 'fas fa-chart-line', url: '/relatorios' },
        { title: 'Financeiro', icon: 'fas fa-dollar-sign', url: '' }
    ],

    // Contracts patterns
    CONTRACTS_ROOT: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' },
        { title: 'Contratos', icon: 'fas fa-file-contract', url: '' }
    ],

    CONTRACTS_DETAIL: [
        { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' },
        { title: 'Contratos', icon: 'fas fa-file-contract', url: '/contratos' },
        { title: 'Detalhes', icon: 'fas fa-info-circle', url: '' }
    ]
};

// Utility functions for breadcrumb management
window.BreadcrumbUtils = {
    /**
     * Create a custom breadcrumb path
     * @param {string} pattern - Base pattern key from BreadcrumbPatterns
     * @param {Object} customItem - Custom item to append
     * @returns {Array} Complete breadcrumb items array
     */
    createCustomPath: function(pattern, customItem) {
        const basePattern = window.BreadcrumbPatterns[pattern] || [];
        const result = [...basePattern];
        
        if (customItem) {
            // Remove the last item's URL to make it non-active
            if (result.length > 0) {
                result[result.length - 1].url = result[result.length - 1].url || '#';
            }
            result.push(customItem);
        }
        
        return result;
    },

    /**
     * Set page title based on breadcrumb
     * @param {Array} breadcrumbItems - Breadcrumb items array
     * @param {string} separator - Separator between titles (default: ' - ')
     */
    setPageTitle: function(breadcrumbItems, separator = ' - ') {
        const titles = breadcrumbItems.map(item => item.title).reverse();
        document.title = titles.join(separator);
    },

    /**
     * Generate breadcrumb for dynamic content
     * @param {string} section - Main section (e.g., 'admin', 'reports')
     * @param {string} subsection - Subsection (e.g., 'users', 'financial')
     * @param {string} page - Current page name
     * @returns {Array} Generated breadcrumb items
     */
    generateDynamicBreadcrumb: function(section, subsection, page) {
        const sectionConfig = {
            admin: {
                title: 'Administração',
                icon: 'fas fa-cog',
                url: '/admin'
            },
            reports: {
                title: 'Relatórios',
                icon: 'fas fa-chart-line',
                url: '/relatorios'
            },
            contracts: {
                title: 'Contratos',
                icon: 'fas fa-file-contract',
                url: '/contratos'
            }
        };

        const subsectionConfig = {
            users: { title: 'Usuários', icon: 'fas fa-users' },
            etl: { title: 'ETL', icon: 'fas fa-database' },
            dw_tesouro: { title: 'DW Tesouro', icon: 'fas fa-chart-bar' },
            financial: { title: 'Financeiro', icon: 'fas fa-dollar-sign' },
            monthly: { title: 'Mensal', icon: 'fas fa-calendar-alt' },
            detail: { title: 'Detalhes', icon: 'fas fa-info-circle' }
        };

        const breadcrumb = [
            { title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta' }
        ];

        if (section && sectionConfig[section]) {
            breadcrumb.push({
                ...sectionConfig[section],
                url: subsection ? sectionConfig[section].url : ''
            });
        }

        if (subsection && subsectionConfig[subsection]) {
            breadcrumb.push({
                ...subsectionConfig[subsection],
                url: page ? `${sectionConfig[section].url}/${subsection}` : ''
            });
        }

        if (page) {
            breadcrumb.push({
                title: page,
                icon: 'fas fa-file',
                url: ''
            });
        }

        return breadcrumb;
    },

    /**
     * Update breadcrumb based on current URL
     * @param {string} currentPath - Current URL path
     */
    updateFromCurrentPath: function(currentPath) {
        const pathSegments = currentPath.split('/').filter(segment => segment);
        
        if (pathSegments.length === 0) {
            return this.BreadcrumbPatterns.HOME;
        }

        const firstSegment = pathSegments[0];
        const secondSegment = pathSegments[1];
        const thirdSegment = pathSegments[2];

        // Route-based breadcrumb generation
        switch (firstSegment) {
            case 'admin':
                if (secondSegment === 'etl' && thirdSegment === 'dw-tesouro') {
                    return window.BreadcrumbPatterns.ADMIN_DW_TESOURO;
                } else if (secondSegment === 'etl') {
                    return window.BreadcrumbPatterns.ADMIN_ETL;
                } else if (secondSegment === 'users') {
                    return window.BreadcrumbPatterns.ADMIN_USERS;
                } else {
                    return window.BreadcrumbPatterns.ADMIN_ROOT;
                }
            
            case 'relatorios':
                if (secondSegment === 'financeiro') {
                    return window.BreadcrumbPatterns.REPORTS_FINANCIAL;
                } else {
                    return window.BreadcrumbPatterns.REPORTS_ROOT;
                }
            
            case 'contratos':
                if (secondSegment) {
                    return window.BreadcrumbPatterns.CONTRACTS_DETAIL;
                } else {
                    return window.BreadcrumbPatterns.CONTRACTS_ROOT;
                }
            
            case 'dashboard':
                return window.BreadcrumbPatterns.DASHBOARD;
            
            default:
                return window.BreadcrumbPatterns.HOME;
        }
    }
};

// Auto-initialize breadcrumb based on current path
document.addEventListener('DOMContentLoaded', function() {
    // Only auto-update if there's a breadcrumb component and no manual setup
    const breadcrumbContainer = document.querySelector('.breadcrumb-items');
    if (breadcrumbContainer && !breadcrumbContainer.hasAttribute('data-manual')) {
        const currentPath = window.location.pathname;
        const breadcrumbItems = window.BreadcrumbUtils.updateFromCurrentPath(currentPath);
        
        if (window.BreadcrumbComponent) {
            window.BreadcrumbComponent.updateBreadcrumb(breadcrumbItems);
        }
    }
});
