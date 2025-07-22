/**
 * Card Generator Component
 * Creates reusable card layouts with table structure following the project's design system
 *
 * Usage:
 * const card = CardGenerator.createCard({
 *   title: "My Card Title",
 *   subtitle: "Card description",
 *   tbodyId: "my-table-body"
 * });
 *
 * // Append to DOM
 * document.getElementById('container').appendChild(card);
 */

const CardGenerator = {
  /**
   * Creates a complete card element with header, title, subtitle and table structure
   * @param {Object} options - Configuration options
   * @param {string} options.title - The card's main heading
   * @param {string} options.subtitle - The card's subheading
   * @param {string} options.tbodyId - The ID to assign to the tbody element
   * @param {string} [options.icon] - Icon URL (optional, defaults to doc2.png)
   * @param {Array} [options.headers] - Table headers (optional, defaults to generic headers)
   * @param {string} [options.containerClass] - Additional CSS classes for the card container
   * @returns {HTMLElement} The complete card DOM element
   */
  createCard({
    title,
    subtitle,
    tbodyId,
    icon = "/static/images/doc2.png",
    headers = [],
    containerClass = "",
  }) {
    // Validate required parameters
    if (!title || !subtitle || !tbodyId) {
      throw new Error("title, subtitle, and tbodyId are required parameters");
    }

    // Create the main card container
    const cardContainer = this._createCardContainer(containerClass);

    // Create and append the header section
    const cardHeader = this._createCardHeader(title, subtitle, icon);
    cardContainer.appendChild(cardHeader);

    // Create and append the content section with table
    const cardContent = this._createCardContent(tbodyId, headers);
    cardContainer.appendChild(cardContent);

    return cardContainer;
  },

  /**
   * Creates the main card container element
   * @param {string} containerClass - Additional CSS classes
   * @returns {HTMLElement} Card container div
   * @private
   */
  _createCardContainer(containerClass) {
    const container = document.createElement("div");
    container.className = `br-card ${containerClass}`.trim();
    return container;
  },

  /**
   * Creates the card header section with title, subtitle and icon
   * @param {string} title - Card title
   * @param {string} subtitle - Card subtitle
   * @param {string} icon - Icon URL
   * @returns {HTMLElement} Card header element
   * @private
   */
  _createCardHeader(title, subtitle, icon) {
    const header = document.createElement("div");
    header.className = "card-header";

    header.innerHTML = `
      <div class="d-flex" style="width: 100%">
        <div class="ml-3" style="flex-grow: 1">
          <div class="titulo">
            <img
              src="${this._escapeHtml(icon)}"
              alt="Ícone"
              style="height: 36px; margin: 10px 0px -10px 0px"
            />
            ${this._escapeHtml(title)}
          </div>
          <div
            style="border-bottom: 1px solid #ccc; margin: -6px 0px 0px 26px"
          ></div>
          <div class="subtitulo">
            ${this._escapeHtml(subtitle)}
          </div>
        </div>
      </div>
    `;

    return header;
  },

  /**
   * Creates the card content section with table structure
   * @param {string} tbodyId - ID for the tbody element
   * @param {Array} headers - Array of header strings
   * @returns {HTMLElement} Card content element
   * @private
   */
  _createCardContent(tbodyId, headers) {
    const content = document.createElement("div");
    content.className = "card-content";
    content.style.padding = "0";

    const tableContainer = this._createTableContainer();
    const table = this._createTable(tbodyId, headers);

    tableContainer.appendChild(table);
    content.appendChild(tableContainer);

    return content;
  },

  /**
   * Creates the table container with responsive wrapper
   * @returns {HTMLElement} Table container div
   * @private
   */
  _createTableContainer() {
    const container = document.createElement("div");
    container.className = "table-responsive";
    return container;
  },

  /**
   * Creates the table element with thead and tbody
   * @param {string} tbodyId - ID for the tbody element
   * @param {Array} headers - Array of header strings
   * @returns {HTMLElement} Table element
   * @private
   */
  _createTable(tbodyId, headers) {
    const table = document.createElement("table");
    table.className = "br-table table-hover";

    // Determine column count
    const columnCount = headers.length > 0 ? headers.length : 1;

    // Create thead if headers are provided
    if (headers.length > 0) {
      const thead = this._createTableHeader(headers);
      table.appendChild(thead);
    }

    // Create tbody with the specified ID and column count
    const tbody = this._createTableBody(tbodyId, columnCount);
    table.appendChild(tbody);

    return table;
  },

  /**
   * Creates the table header element
   * @param {Array} headers - Array of header strings
   * @returns {HTMLElement} Thead element
   * @private
   */
  _createTableHeader(headers) {
    const thead = document.createElement("thead");
    thead.style.backgroundColor = "#f8f8f8";

    const headerRow = document.createElement("tr");

    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.style.border = "none";
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    return thead;
  },

  /**
   * Creates the table body element with specified ID
   * @param {string} tbodyId - ID for the tbody element
   * @param {number} columnCount - Number of columns for proper colspan
   * @returns {HTMLElement} Tbody element
   * @private
   */
  _createTableBody(tbodyId, columnCount = 1) {
    const tbody = document.createElement("tbody");
    tbody.id = tbodyId;

    // Add a default empty state row with proper colspan
    tbody.innerHTML = `
      <tr>
        <td colspan="${columnCount}" class="text-center" style="padding: 40px;">
          <div class="text-muted">
            <i class="fas fa-inbox fa-2x mb-3"></i>
            <br />
            Aguardando dados...
          </div>
        </td>
      </tr>
    `;

    return tbody;
  },

  /**
   * Escapes HTML to prevent XSS attacks
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML string
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Creates a card with predefined layouts for common use cases
   * @param {string} layout - Layout type ('simple', 'financial', 'data')
   * @param {Object} options - Configuration options
   * @returns {HTMLElement} The complete card DOM element
   */
  createPresetCard(layout, options) {
    const presets = {
      simple: {
        headers: ["#", "Data", "Descrição"],
        containerClass: "h-100",
      },
      financial: {
        headers: ["#", "Data", "Tipo", "Valor"],
        containerClass: "h-100",
      },
      data: {
        headers: ["#", "Item", "Status", "Detalhes"],
        containerClass: "h-100",
      },
    };

    const preset = presets[layout];
    if (!preset) {
      throw new Error(`Unknown layout preset: ${layout}`);
    }

    return this.createCard({
      ...options,
      headers: options.headers || preset.headers,
      containerClass: `${preset.containerClass} ${
        options.containerClass || ""
      }`.trim(),
    });
  },

  /**
   * Utility method to populate a table body with data
   * @param {string} tbodyId - ID of the tbody element to populate
   * @param {Array} data - Array of row data objects
   * @param {Function} [rowRenderer] - Optional custom row renderer function
   * @param {number} [columnCount] - Number of columns for proper empty state (auto-detected if not provided)
   */
  populateTable(tbodyId, data, rowRenderer = null, columnCount = null) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
      console.warn(`Table body with ID '${tbodyId}' not found`);
      return;
    }

    // Auto-detect column count if not provided
    if (columnCount === null) {
      // Try to get column count from the table header
      const table = tbody.closest("table");
      const headerRow = table?.querySelector("thead tr");
      if (headerRow) {
        columnCount = headerRow.children.length;
      } else if (data && data.length > 0) {
        // Fallback: use the number of properties in the first data object
        columnCount = Object.keys(data[0]).length;
      } else {
        columnCount = 1; // Default fallback
      }
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${columnCount}" class="text-center" style="padding: 40px;">
            <div class="text-muted">
              <i class="fas fa-inbox fa-2x mb-3"></i>
              <br />
              Nenhum dado encontrado
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const rows = data
      .map((rowData, index) => {
        if (rowRenderer && typeof rowRenderer === "function") {
          return rowRenderer(rowData, index);
        }

        // Default row renderer
        return this._renderDefaultRow(rowData, index);
      })
      .join("");

    tbody.innerHTML = rows;
  },

  /**
   * Default row renderer for table data
   * @param {Object} rowData - Data for the row
   * @param {number} index - Row index
   * @returns {string} HTML string for the row
   * @private
   */
  _renderDefaultRow(rowData, index) {
    const cells = Object.values(rowData)
      .map((value) => `<td>${this._escapeHtml(String(value))}</td>`)
      .join("");

    return `<tr>${cells}</tr>`;
  },
};

// Expose to global scope for easy access
window.CardGenerator = CardGenerator;

export default CardGenerator;
