/**
 * Example usage of the Filter module
 * This demonstrates how to use the new filter system
 */

// Example of how to use the filter module in dashboard or other pages
const FilterExampleUsage = {
  
  // Example: Add different types of filters
  addSampleFilters() {
    if (window.App && window.App.filter) {
      // Add status filters
      window.App.filter.filter_addFilter('status', 'vigentes', 'Vigentes', 'status');
      window.App.filter.filter_addFilter('status', 'criticos', 'Críticos', 'status');
      
      // Add date filters
      window.App.filter.filter_addFilter('prazo', '30dias', 'Próximos 30 dias', 'date');
      window.App.filter.filter_addFilter('prazo', '90dias', 'Próximos 90 dias', 'date');
      
      // Add UASG filters
      window.App.filter.filter_addFilter('uasg', '123456', 'UASG 123456', 'uasg');
      
      // Add category filters
      window.App.filter.filter_addFilter('categoria', 'servicos', 'Serviços', 'category');
    }
  },

  // Example: Remove a specific filter
  removeSampleFilter() {
    if (window.App && window.App.filter) {
      window.App.filter.filter_removeFilter('status', 'vigentes');
    }
  },

  // Example: Clear all filters
  clearAllSampleFilters() {
    if (window.App && window.App.filter) {
      window.App.filter.filter_clearAllFilters();
    }
  },

  // Example: Check if a filter is active
  checkFilterStatus() {
    if (window.App && window.App.filter) {
      const hasVigentesFilter = window.App.filter.filter_hasFilter('status', 'vigentes');
      console.log('Has "vigentes" filter:', hasVigentesFilter);
    }
  },

  // Example: Get all current filters (useful for API requests)
  getCurrentFiltersForAPI() {
    if (window.App && window.App.filter) {
      const filters = window.App.filter.filter_getCurrentFilters();
      console.log('Current filters for API:', filters);
      
      // Convert to format suitable for API requests
      const apiFilters = {};
      Object.keys(filters).forEach(filterKey => {
        apiFilters[filterKey] = filters[filterKey].map(f => f.value);
      });
      
      return apiFilters;
    }
    return {};
  },

  // Example: Listen for filter changes
  setupFilterChangeListener() {
    document.addEventListener('filtersChanged', (event) => {
      console.log('🔄 Filters changed:', event.detail.filters);
      
      // Here you can trigger API calls, update tables, refresh charts, etc.
      // Example:
      // this.refreshDashboard();
      // this.loadContractsWithFilters(event.detail.filters);
    });
  },

  // Example: Initialize filters from URL parameters or saved state
  initializeFiltersFromState(savedFilters) {
    if (window.App && window.App.filter) {
      // Example saved state
      const exampleFilters = savedFilters || {
        status: [
          { value: 'vigentes', displayText: 'Vigentes', type: 'status' }
        ],
        prazo: [
          { value: '30dias', displayText: 'Próximos 30 dias', type: 'date' }
        ]
      };
      
      window.App.filter.filter_setFilters(exampleFilters);
    }
  }
};

// Export for use in other modules
export default FilterExampleUsage;
