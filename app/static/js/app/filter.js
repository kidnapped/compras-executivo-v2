/**
 * Filter Component JavaScript
 * Provides dynamic functionality for filter management
 */

export default {
  // Initialize filter functionality
  filter_init() {
    this.filter_setupEventListeners();
    this.filter_handleResponsiveTooltips();
    this.filter_initializeFilterState();
    this.filter_initializeVisibility();
  },

  filter_initializeVisibility() {
    const container = document.querySelector(".filter-container");
    if (!container) return;

    // Check if there are any existing filters on page load
    const filters = this.filter_getCurrentFilters();
    const hasFilters = Object.keys(filters).length > 0;
    
    if (hasFilters) {
      this.filter_showContainer();
    } else {
      this.filter_hideContainer();
    }
  },

  filter_showContainer() {
    const container = document.querySelector(".filter-container");
    if (!container) return;

    // Remove any existing animation classes
    container.classList.remove("filter-collapsing");
    
    // Show the container
    container.style.display = "block";
    
    // Force a reflow
    container.offsetHeight;
    
    // Add expanding animation
    container.classList.add("filter-expanding");
    
    // Add show class after a brief delay to ensure proper animation
    setTimeout(() => {
      container.classList.add("filter-show");
      container.classList.remove("filter-expanding");
    }, 400);
  },

  filter_hideContainer() {
    const container = document.querySelector(".filter-container");
    if (!container) return;

    // Add collapsing animation
    container.classList.add("filter-collapsing");
    container.classList.remove("filter-show");
    
    // Hide the container after animation completes
    setTimeout(() => {
      container.style.display = "none";
      container.classList.remove("filter-collapsing");
    }, 300);
  },

  filter_setupEventListeners() {
    // Add click analytics or other interactions if needed
    document.addEventListener("click", (e) => {
      if (e.target.closest(".filter-remove-btn")) {
        const removeBtn = e.target.closest(".filter-remove-btn");
        const filterItem = removeBtn.closest(".filter-item");
        if (filterItem) {
          const filterKey = filterItem.getAttribute("data-filter-key");
          const filterValue = filterItem.getAttribute("data-filter-value");
          this.filter_removeFilter(filterKey, filterValue);
        }
      }

      if (e.target.closest(".filter-clear-all-btn")) {
        this.filter_clearAllFilters();
      }
    });
  },

  filter_trackFilterAction(action, filterKey, filterValue) {
    // Optional: Add analytics tracking for filter actions
    console.log(`Filter ${action}: ${filterKey} -> ${filterValue}`);

    // Example: Send to analytics service
    // analytics.track('filter_action', { action, filterKey, filterValue });
  },

  filter_handleResponsiveTooltips() {
    // Add tooltips for mobile devices where text might be truncated
    const filterItems = document.querySelectorAll(".filter-item");

    filterItems.forEach((item) => {
      const text = item.querySelector(".filter-item-text");
      const icon = item.querySelector("i");

      if (text && icon) {
        icon.setAttribute("title", text.textContent);
        icon.setAttribute("data-bs-toggle", "tooltip");
        icon.setAttribute("data-bs-placement", "top");
      }
    });

    // Initialize Bootstrap tooltips if available
    if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
      const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  },

  filter_initializeFilterState() {
    // Initialize the global filter state if it doesn't exist
    if (!window._dashboardFilters) {
      window._dashboardFilters = {};
    }
  },

  /**
   * Add a filter to the current filter state
   * @param {string} filterKey - The type/category of filter (e.g., 'status', 'uasg', 'date')
   * @param {string} filterValue - The value of the filter
   * @param {string} displayText - The text to display for the filter
   * @param {string} filterType - Optional type for styling (status, date, category, uasg)
   */
  filter_addFilter(
    filterKey,
    filterValue,
    displayText,
    filterType = "default"
  ) {
    if (!window._dashboardFilters) {
      this.filter_initializeFilterState();
    }

    // Initialize array for this filter key if it doesn't exist
    if (!window._dashboardFilters[filterKey]) {
      window._dashboardFilters[filterKey] = [];
    }

    // Check if filter already exists
    const existingFilter = window._dashboardFilters[filterKey].find(
      (f) => f.value === filterValue
    );

    if (!existingFilter) {
      window._dashboardFilters[filterKey].push({
        value: filterValue,
        displayText: displayText,
        type: filterType,
      });

      this.filter_renderFilters();
      this.filter_trackFilterAction("add", filterKey, filterValue);
      this.filter_notifyFilterChange();
    }
  },

  /**
   * Remove a specific filter
   * @param {string} filterKey - The type/category of filter
   * @param {string} filterValue - The value of the filter to remove
   */
  filter_removeFilter(filterKey, filterValue) {
    if (!window._dashboardFilters || !window._dashboardFilters[filterKey]) {
      return;
    }

    const filterIndex = window._dashboardFilters[filterKey].findIndex(
      (f) => f.value === filterValue
    );

    if (filterIndex !== -1) {
      window._dashboardFilters[filterKey].splice(filterIndex, 1);

      // Remove the key if no filters remain for this type
      if (window._dashboardFilters[filterKey].length === 0) {
        delete window._dashboardFilters[filterKey];
      }

      this.filter_renderFilters();
      this.filter_trackFilterAction("remove", filterKey, filterValue);
      this.filter_notifyFilterChange();
    }
  },

  /**
   * Clear all filters
   */
  filter_clearAllFilters() {
    if (window._dashboardFilters) {
      const filterCount = Object.keys(window._dashboardFilters).length;
      if (filterCount > 0) {
        window._dashboardFilters = {};
        this.filter_renderFilters();
        this.filter_trackFilterAction("clear_all", "all", "all");
        this.filter_notifyFilterChange();
      }
    }
  },

  /**
   * Remove all filters of a specific key/type
   * @param {string} filterKey - The type/category of filters to remove
   */
  filter_removeFiltersByKey(filterKey) {
    if (window._dashboardFilters && window._dashboardFilters[filterKey]) {
      delete window._dashboardFilters[filterKey];
      this.filter_renderFilters();
      this.filter_trackFilterAction("remove_by_key", filterKey, "all");
      this.filter_notifyFilterChange();
    }
  },

  /**
   * Get current filter state
   * @returns {Object} Current filter state
   */
  filter_getCurrentFilters() {
    return window._dashboardFilters || {};
  },

  /**
   * Set filter state (useful for restoring from URL parameters or saved state)
   * @param {Object} filters - The filter state to set
   */
  filter_setFilters(filters) {
    window._dashboardFilters = filters || {};
    this.filter_renderFilters();
    this.filter_notifyFilterChange();
  },

  /**
   * Check if a specific filter is active
   * @param {string} filterKey - The filter key to check
   * @param {string} filterValue - The filter value to check
   * @returns {boolean} Whether the filter is active
   */
  filter_hasFilter(filterKey, filterValue) {
    return (
      window._dashboardFilters &&
      window._dashboardFilters[filterKey] &&
      window._dashboardFilters[filterKey].some((f) => f.value === filterValue)
    );
  },

  /**
   * Toggle a filter (add if not present, remove if present)
   * @param {string} filterKey - The filter key
   * @param {string} filterValue - The filter value
   * @param {string} displayText - The display text
   * @param {string} filterType - The filter type for styling
   */
  filter_toggleFilter(
    filterKey,
    filterValue,
    displayText,
    filterType = "default"
  ) {
    if (this.filter_hasFilter(filterKey, filterValue)) {
      this.filter_removeFilter(filterKey, filterValue);
    } else {
      this.filter_addFilter(filterKey, filterValue, displayText, filterType);
    }
  },

  /**
   * Render all current filters in the UI
   */
  filter_renderFilters() {
    const container = document.querySelector(".filter-items");
    if (!container) return;

    const filters = this.filter_getCurrentFilters();
    const hasFilters = Object.keys(filters).length > 0;
    const containerElement = document.querySelector(".filter-container");
    const wasVisible = containerElement && containerElement.classList.contains("filter-show");

    container.innerHTML = "";

    if (!hasFilters) {
      // Only animate hide if it was previously visible
      if (wasVisible) {
        this.filter_hideContainer();
      }
      return;
    }

    // Only animate show if it was previously hidden
    if (!wasVisible) {
      this.filter_showContainer();
    }

    // Render filter items
    Object.keys(filters).forEach((filterKey) => {
      filters[filterKey].forEach((filter) => {
        const filterItem = this.filter_createFilterItem(filterKey, filter);
        container.appendChild(filterItem);
      });
    });

    // Add clear all button if there are filters
    const clearAllBtn = this.filter_createClearAllButton();
    container.appendChild(clearAllBtn);

    // Reinitialize tooltips
    this.filter_handleResponsiveTooltips();
  },

  /**
   * Create a filter item element
   * @param {string} filterKey - The filter key
   * @param {Object} filter - The filter object
   * @returns {HTMLElement} The filter item element
   */
  filter_createFilterItem(filterKey, filter) {
    const filterItem = document.createElement("div");
    filterItem.className = `filter-item filter-type-${filter.type} filter-item-enter`;
    filterItem.setAttribute("data-filter-key", filterKey);
    filterItem.setAttribute("data-filter-value", filter.value);

    const icon = this.filter_getFilterIcon(filter.type);

    filterItem.innerHTML = `
            <i class="${icon}"></i>
            <span class="filter-item-text">${filter.displayText}</span>
            <button type="button" class="filter-remove-btn" aria-label="Remover filtro" title="Remover filtro">
                &times;
            </button>
        `;

    return filterItem;
  },

  /**
   * Create clear all button
   * @returns {HTMLElement} The clear all button element
   */
  filter_createClearAllButton() {
    const clearAllBtn = document.createElement("button");
    clearAllBtn.className = "filter-clear-all-btn";
    clearAllBtn.setAttribute("title", "Limpar todos os filtros");
    clearAllBtn.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <span>Limpar filtros</span>
        `;

    return clearAllBtn;
  },

  /**
   * Get icon for filter type
   * @param {string} filterType - The filter type
   * @returns {string} The icon class
   */
  filter_getFilterIcon(filterType) {
    const iconMap = {
      status: "fas fa-circle",
      date: "fas fa-calendar",
      category: "fas fa-tag",
      uasg: "fas fa-building",
      default: "fas fa-filter",
    };

    return iconMap[filterType] || iconMap.default;
  },

  /**
   * Notify other components about filter changes
   */
  filter_notifyFilterChange() {
    // Dispatch custom event for other components to listen to
    const event = new CustomEvent("filtersChanged", {
      detail: {
        filters: this.filter_getCurrentFilters(),
      },
    });
    document.dispatchEvent(event);
  },

  /**
   * Creates filter HTML structure dynamically
   * @param {string} containerId - ID of the container where filters will be inserted
   */
  filter_createDynamic(containerId) {
    if (!containerId) {
      console.error("containerId is required for filter_createDynamic");
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container ${containerId} not found for filters`);
      return;
    }

    // Complete filter HTML - starts hidden
    const filterHTML = `
            <div class="filter-container" style="display: none;">
                <div class="filter-modern">
                    <div class="filter-items">
                    </div>
                </div>
            </div>
        `;

    // Insert into container
    container.innerHTML = filterHTML;

    // Initialize functionality
    this.filter_init();
  },
};
