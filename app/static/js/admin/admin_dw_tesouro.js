export default {
  // Método para inicialização automática quando o módulo é carregado
  autoInit() {
    // Verifica se estamos na página correta procurando pelo elemento principal
    if (document.getElementById('adminDwTesouroTablesList')) {
      // Se encontrou o elemento, inicializa automaticamente
      setTimeout(() => {
        this.admin_dw_tesouro_initBreadcrumb();
        this.admin_dw_tesouro_initCardHeaders();
        this.admin_dw_tesouro_init();
      }, 100); // Pequeno delay para garantir que todos os elementos estejam carregados
    }
  },

  // Nova função para inicializar o breadcrumb dinamicamente
  admin_dw_tesouro_initBreadcrumb() {
    // Verifica se o módulo breadcrumb está disponível
    if (typeof App !== "undefined" && App.breadcrumb && App.breadcrumb.breadcrumb_createDynamic) {
      const breadcrumbItems = [
        {title: 'Página Inicial', icon: 'fas fa-home', url: '/inicio'},
        {title: 'Administração', icon: 'fas fa-cog', url: '/admin'},
        {title: 'ETL', icon: 'fas fa-database', url: '/admin/etl'},
        {title: 'DW Tesouro', icon: 'fas fa-chart-bar', url: ''}
      ];
      
      App.breadcrumb.breadcrumb_createDynamic(breadcrumbItems, 'admin-dw-breadcrumb-dynamic-container');
      console.log('Breadcrumb DW Tesouro initialized dynamically');
    } else {
      console.warn('Breadcrumb module not available - retrying in 500ms');
      // Retry after a short delay if breadcrumb is not available yet
      setTimeout(() => {
        this.admin_dw_tesouro_initBreadcrumb();
      }, 500);
    }
  },

  // Nova função para inicializar os card headers dinamicamente
  admin_dw_tesouro_initCardHeaders() {
    // Verifica se o módulo card_header está disponível
    if (typeof App !== "undefined" && App.card_header && App.card_header.card_header_createDynamic) {
      
      // Card header da sidebar (tabelas)
      const tablesCardOptions = {
        icon: 'fas fa-table',
        title: 'Tabelas do DW',
        subtitle: 'Selecione uma tabela'
      };
      App.card_header.card_header_createDynamic(tablesCardOptions, 'admin-dw-tables-card-header');

      // Card header da área principal
      const mainCardOptions = {
        icon: 'fas fa-database',
        title: 'Selecione uma Tabela',
        title_id: 'selectedTableName',
        subtitle: 'Clique em uma tabela ao lado para visualizar seus dados',
        subtitle_id: 'selectedTableDesc',
        actions: [
          {
            id: 'refreshBtn',
            type: 'secondary',
            icon: 'fas fa-sync-alt',
            text: 'Atualizar',
            style: 'display: none;'
          },
          {
            id: 'exportBtn',
            type: 'primary',
            icon: 'fas fa-download',
            text: 'Exportar',
            style: 'display: none;'
          }
        ]
      };
      App.card_header.card_header_createDynamic(mainCardOptions, 'admin-dw-main-card-header');

      console.log('Card headers DW Tesouro initialized dynamically');
    } else {
      console.warn('Card header module not available - retrying in 500ms');
      // Retry after a short delay if card_header is not available yet
      setTimeout(() => {
        this.admin_dw_tesouro_initCardHeaders();
      }, 500);
    }
  },

  admin_dw_tesouro_init() {
    // Só inicializa se estivermos na página correta
    if (!this.admin_dw_tesouro_initElements()) {
      console.log('Admin DW Tesouro elements not found, skipping initialization');
      return;
    }
    
    this.admin_dw_tesouro_bindEvents();
    this.admin_dw_tesouro_loadTables(); // Carrega as tabelas ao inicializar
  },

  admin_dw_tesouro_initElements() {
    this.tablesList = document.getElementById('adminDwTesouroTablesList');
    this.selectedTableName = document.getElementById('selectedTableName');
    this.selectedTableDesc = document.getElementById('selectedTableDesc');
    this.tableControls = document.getElementById('tableControls');
    this.emptyState = document.getElementById('emptyState');
    this.loadingState = document.getElementById('loadingState');
    this.tableContainer = document.getElementById('tableContainer');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.tableSearch = document.getElementById('tableSearch');
    this.tableHeaderDW = document.getElementById('tableHeaderDW'); // Novo elemento para header grudado
    
    // Verifica se os elementos essenciais existem
    if (!this.tablesList) {
      return false;
    }
    
    console.log('Admin DW Tesouro elements initialized successfully');
    return true;
  },

  // Nova função para priorizar campos: DT_CARGA_C primeiro, depois ID_*, depois resto
  admin_dw_tesouro_sortHeadersByPriority(headers) {
    const prioritized = [];
    const dtCargaFields = [];
    const idFields = [];
    const otherFields = [];
    
    headers.forEach(header => {
      if (header === 'DT_CARGA_C') {
        dtCargaFields.push(header);
      } else if (header.startsWith('ID_')) {
        idFields.push(header);
      } else {
        otherFields.push(header);
      }
    });
    
    // Ordena campos ID_ alfabeticamente
    idFields.sort();
    // Ordena outros campos alfabeticamente
    otherFields.sort();
    
    // Retorna na ordem: DT_CARGA_C, ID_*, resto
    return [...dtCargaFields, ...idFields, ...otherFields];
  },

  admin_dw_tesouro_bindEvents() {
    // Search functionality
    if (this.tableSearch) {
      this.tableSearch.addEventListener('input', (e) => this.admin_dw_tesouro_handleSearch(e));
    }

    // Refresh button
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => this.admin_dw_tesouro_handleRefresh());
    }

    // Export button
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.admin_dw_tesouro_handleExport());
    }
    
    // Refresh tables list button (se existir)
    const refreshTablesBtn = document.getElementById('refreshTablesBtn');
    if (refreshTablesBtn) {
      refreshTablesBtn.addEventListener('click', () => this.admin_dw_tesouro_loadTables());
    }
    
    console.log('Admin DW Tesouro events bound successfully');
  },

  // Nova função para carregar as tabelas do endpoint
  async admin_dw_tesouro_loadTables() {
    // Verificar se o elemento existe antes de tentar usar
    if (!this.tablesList) {
      console.warn('Element adminDwTesouroTablesList not found');
      return;
    }
    
    // Mostrar loading state
    this.admin_dw_tesouro_showTablesLoading();
    
    try {
      const response = await fetch('/admin/etl/dw-tesouro/lista-tabelas');
      if (response.ok) {
        const data = await response.json();
        
        // Simular um delay mínimo para que o loading seja visível
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Construir HTML a partir dos dados JSON
        const html = this.admin_dw_tesouro_buildTablesHTML(data.schemas);
        this.tablesList.innerHTML = html;
        
        // Bind events to newly created table items
        this.admin_dw_tesouro_bindTableEvents();
      } else {
        console.error('Erro ao carregar tabelas:', response.status);
        this.tablesList.innerHTML = '<div class="alert alert-danger">Erro ao carregar tabelas do DW Tesouro</div>';
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      this.tablesList.innerHTML = '<div class="alert alert-danger">Erro de conexão ao carregar tabelas</div>';
    }
  },

  // Nova função para construir o HTML das tabelas a partir do JSON
  admin_dw_tesouro_buildTablesHTML(schemas) {
    let html = "";
    
    for (const [schema, tabelas] of Object.entries(schemas)) {
      html += `<li class='schema'>${schema}<ul>`;
      for (const tabela of tabelas) {
        html += `<li class='tabela' data-schema='${schema}' data-table='${tabela}'>${tabela}</li>`;
      }
      html += "</ul></li>";
    }
    
    return html;
  },

  // Função para mostrar loading da lista de tabelas
  admin_dw_tesouro_showTablesLoading() {
    if (!this.tablesList) {
      console.warn('Element adminDwTesouroTablesList not found for loading');
      return;
    }
    
    console.log('Showing tables loading...');
    this.tablesList.innerHTML = `
      <div class="admin-dw-tesouro-tables-list-loading">
        <div class="admin-dw-tesouro-tables-list-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando tabelas</h5>
        <p>Buscando tabelas do DW Tesouro<span class="admin-dw-tesouro-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;
  },

  // Bind events para os itens de tabela carregados dinamicamente
  admin_dw_tesouro_bindTableEvents() {
    const schemaItems = this.tablesList.querySelectorAll('.schema');
    const tableItems = this.tablesList.querySelectorAll('.tabela');
    
    // Eventos para expandir/colapsar schemas
    schemaItems.forEach(schema => {
      schema.addEventListener('click', (e) => {
        e.stopPropagation();
        const ul = schema.querySelector('ul');
        if (ul) {
          ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
        }
      });
    });
    
    // Eventos para seleção de tabelas
    tableItems.forEach(table => {
      table.addEventListener('click', (e) => {
        e.stopPropagation();
        this.admin_dw_tesouro_handleTableSelection(e);
      });
    });
  },

  admin_dw_tesouro_handleTableSelection(event) {
    const tableItem = event.currentTarget;
    
    // Remove active from all table items
    const allTables = this.tablesList.querySelectorAll('.tabela');
    allTables.forEach(t => t.classList.remove('active'));
    
    // Add active to clicked table
    tableItem.classList.add('active');
    
    // Get table and schema info from data attributes
    const schema = tableItem.dataset.schema;
    const tableName = tableItem.dataset.table;
    
    if (schema && tableName) {
      // Update header using dynamic card header functions
      if (App.card_header) {
        App.card_header.card_header_updateTitle('admin-dw-main-card-header', `${schema}.${tableName}`, 'selectedTableName');
        App.card_header.card_header_updateSubtitle('admin-dw-main-card-header', `Tabela ${tableName} do schema ${schema}`, 'selectedTableDesc');
      }
      
      // Show loading state
      this.emptyState.style.display = 'none';
      this.loadingState.style.display = 'flex';
      this.tableContainer.style.display = 'none';
      
      // Hide buttons using dynamic card header functions
      if (App.card_header) {
        App.card_header.card_header_toggleButton('refreshBtn', false);
        App.card_header.card_header_toggleButton('exportBtn', false);
      }
      
      // Load actual table data from API
      this.admin_dw_tesouro_loadTableData(tableName, schema);
    }
  },

  admin_dw_tesouro_handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    const schemas = this.tablesList.querySelectorAll('.schema');
    
    schemas.forEach(schema => {
      const schemaText = schema.childNodes[0].textContent.toLowerCase();
      const tables = schema.querySelectorAll('.tabela');
      let hasVisibleTables = false;
      
      tables.forEach(table => {
        const tableText = table.textContent.toLowerCase();
        
        if (tableText.includes(searchTerm) || schemaText.includes(searchTerm)) {
          table.style.display = 'list-item';
          hasVisibleTables = true;
        } else {
          table.style.display = 'none';
        }
      });
      
      // Show/hide schema based on whether it has visible tables or matches search
      if (hasVisibleTables || schemaText.includes(searchTerm)) {
        schema.style.display = 'list-item';
        // Show the ul if schema is visible and has tables
        const ul = schema.querySelector('ul');
        if (ul && hasVisibleTables) {
          ul.style.display = 'block';
        }
      } else {
        schema.style.display = 'none';
      }
    });
  },

  admin_dw_tesouro_handleRefresh() {
    const activeItem = this.tablesList.querySelector('.tabela.active');
    if (activeItem) {
      const schema = activeItem.dataset.schema;
      const tableName = activeItem.dataset.table;
      
      if (schema && tableName) {
        // Show loading briefly
        this.tableContainer.style.display = 'none';
        this.loadingState.style.display = 'flex';
        
        // Reload table data
        this.admin_dw_tesouro_loadTableData(tableName, schema);
      }
    }
  },

  admin_dw_tesouro_handleExport() {
    const activeItem = this.tablesList.querySelector('.tabela.active');
    if (activeItem) {
      const schema = activeItem.dataset.schema;
      const tableName = activeItem.dataset.table;
      
      // Get current table data
      const table = document.getElementById('dataTable');
      const rows = table.querySelectorAll('tr');
      
      if (rows.length === 0) {
        this.admin_dw_tesouro_showNotification('Nenhum dado para exportar', 'warning');
        return;
      }
      
      // Build CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      rows.forEach((row, index) => {
        const cols = row.querySelectorAll('th, td');
        const rowData = Array.from(cols).map(col => {
          let value = col.textContent.replace(/"/g, '""');
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value}"`;
          }
          return value;
        });
        csvContent += rowData.join(',');
        if (index < rows.length - 1) csvContent += '\n';
      });
      
      // Create and download file
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${schema}_${tableName}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show notification
      this.admin_dw_tesouro_showNotification(`Dados da tabela ${schema}.${tableName} exportados com sucesso!`, 'success');
    }
  },

  async admin_dw_tesouro_loadTableData(tableName, schema) {
    try {
      // Call the API to get table data
      const response = await fetch(`/admin/etl/dw-tesouro/lista-campos?schema=${encodeURIComponent(schema)}&tabela=${encodeURIComponent(tableName)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Hide loading, show table
      this.loadingState.style.display = 'none';
      
      if (data.error) {
        // Show error message
        this.tableContainer.innerHTML = `
          <div class="alert alert-danger">
            <h5>Erro ao carregar dados da tabela</h5>
            <p>${data.error}</p>
          </div>
        `;
        this.tableContainer.style.display = 'block';
        return;
      }
      
      // Show table and controls
      this.tableContainer.style.display = 'block';
      
      // Show buttons using dynamic card header functions
      if (App.card_header) {
        App.card_header.card_header_toggleButton('refreshBtn', true);
        App.card_header.card_header_toggleButton('exportBtn', true);
      }
      
      // Generate table from API data
      this.admin_dw_tesouro_generateTableFromAPI(data);
      
    } catch (error) {
      console.error('Erro ao carregar dados da tabela:', error);
      
      // Hide loading
      this.loadingState.style.display = 'none';
      
      // Show error
      this.tableContainer.innerHTML = `
        <div class="alert alert-danger">
          <h5>Erro de Conexão</h5>
          <p>Não foi possível carregar os dados da tabela: ${error.message}</p>
        </div>
      `;
      this.tableContainer.style.display = 'block';
    }
  },

  // Nova função para calcular largura proporcional baseada no nome da coluna
  admin_dw_tesouro_calculateColumnWidth(headerName) {
    // Largura base mínima
    const minWidth = 50;
    // Largura máxima para evitar colunas muito largas
    const maxWidth = 300;
    // Largura base por caractere (aproximadamente 8px por caractere)
    const charWidth = 8;
    // Padding adicional para dar espaço
    const padding = 30;
    
    // Calcula largura baseada no número de caracteres
    let calculatedWidth = (headerName.length * charWidth) + padding;
    
    // Aplica limites mínimo e máximo
    calculatedWidth = Math.max(minWidth, calculatedWidth);
    calculatedWidth = Math.min(maxWidth, calculatedWidth);
    
    return calculatedWidth;
  },

  admin_dw_tesouro_generateTableFromAPI(apiData) {
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    const { headers, data, schema, tabela, total_registros } = apiData;
    
    // Prioriza os campos: DT_CARGA_C, depois ID_*, depois resto
    const sortedHeaders = this.admin_dw_tesouro_sortHeadersByPriority(headers);
    
    // Cria mapeamento de índices originais para os campos reordenados
    const headerIndexMap = {};
    sortedHeaders.forEach((header, newIndex) => {
      const originalIndex = headers.indexOf(header);
      headerIndexMap[newIndex] = originalIndex;
    });
    
    // Cria o header com funcionalidade de redimensionamento
    const headerRow = document.createElement('tr');
    sortedHeaders.forEach((header, index) => {
      const th = document.createElement('th');
      th.textContent = header;
      
      // Calcula largura proporcional baseada no nome da coluna
      const columnWidth = this.admin_dw_tesouro_calculateColumnWidth(header);
      
      th.style.cssText = `
        text-align: center; 
        border-right: 1px solid #ddd; 
        padding: 4px 8px; 
        font-size: 12px; 
        font-weight: 600;
        position: relative;
        width: ${columnWidth}px;
        min-width: 50px;
        max-width: 300px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        user-select: none;
      `;
      
      // Adiciona linha de redimensionamento (exceto na última coluna)
      if (index < sortedHeaders.length - 1) {
        const resizer = document.createElement('div');
        resizer.className = 'column-resizer';
        resizer.style.cssText = `
          position: absolute;
          top: 0;
          right: 0;
          width: 5px;
          height: 100%;
          cursor: col-resize;
          background: transparent;
          z-index: 1;
        `;
        
        // Adiciona funcionalidade de redimensionamento
        this.admin_dw_tesouro_addColumnResize(resizer, th, index);
        th.appendChild(resizer);
      }
      
      headerRow.appendChild(th);
    });
    
    // Remove último border-right
    const lastTh = headerRow.lastElementChild;
    if (lastTh) {
      lastTh.style.borderRight = 'none';
    }
    
    thead.appendChild(headerRow);
    
    // Calcula largura total da tabela e ajusta para scroll horizontal
    this.admin_dw_tesouro_adjustTableWidth(sortedHeaders);
    
    // Create rows usando a nova ordenação dos campos
    data.forEach(rowData => {
      const tr = document.createElement('tr');
      sortedHeaders.forEach((header, newIndex) => {
        const originalIndex = headerIndexMap[newIndex];
        const td = document.createElement('td');
        const cellValue = rowData[originalIndex] || '';
        td.textContent = cellValue;
        
        // Usa a mesma largura proporcional do header correspondente
        const columnWidth = this.admin_dw_tesouro_calculateColumnWidth(header);
        
        td.style.cssText = `
          text-align: center; 
          border-right: 1px solid #ddd; 
          padding: 8px 12px; 
          font-size: 12px;
          width: ${columnWidth}px;
          min-width: 50px;
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;
        
        tr.appendChild(td);
      });
      
      // Remove último border-right da linha
      const lastTd = tr.lastElementChild;
      if (lastTd) {
        lastTd.style.borderRight = 'none';
      }
      
      tbody.appendChild(tr);
    });
  },

  // Nova função para ajustar a largura total da tabela
  admin_dw_tesouro_adjustTableWidth(headers) {
    const table = document.getElementById('dataTable');
    
    // Calcula largura total somando todas as colunas
    let totalWidth = 0;
    headers.forEach(header => {
      totalWidth += this.admin_dw_tesouro_calculateColumnWidth(header);
    });
    
    // Define largura mínima da tabela
    const containerWidth = table.parentElement.offsetWidth;
    const finalWidth = Math.max(totalWidth, containerWidth);
    
    // Aplica a largura calculada
    table.style.width = finalWidth + 'px';
    table.style.minWidth = totalWidth + 'px';
  },

  // Nova função para adicionar funcionalidade de redimensionamento de colunas
  admin_dw_tesouro_addColumnResize(resizer, th, columnIndex) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    
    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = th.offsetWidth;
      
      // Adiciona classe visual durante redimensionamento
      resizer.style.background = '#1351b4';
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const width = startWidth + (e.clientX - startX);
      const minWidth = 50; // Tamanho mínimo de 50px
      const maxWidth = 400; // Tamanho máximo aumentado para 400px
      
      if (width >= minWidth && width <= maxWidth) {
        th.style.width = width + 'px';
        th.style.minWidth = width + 'px';
        th.style.maxWidth = width + 'px';
        
        // Aplica a mesma largura para todas as células da coluna
        const table = document.getElementById('dataTable');
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cell = row.children[columnIndex];
          if (cell) {
            cell.style.width = width + 'px';
            cell.style.minWidth = width + 'px';
            cell.style.maxWidth = width + 'px';
          }
        });
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.style.background = 'transparent';
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  },

  admin_dw_tesouro_showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add notification styles
    const bgColor = type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${bgColor};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
};
