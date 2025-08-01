const admin_dw_tesouro = {
  admin_dw_tesouro_init() {
    this.admin_dw_tesouro_initElements();
    this.admin_dw_tesouro_bindEvents();
  },

  admin_dw_tesouro_initElements() {
    this.tableItems = document.querySelectorAll('.table-item');
    this.selectedTableName = document.getElementById('selectedTableName');
    this.selectedTableDesc = document.getElementById('selectedTableDesc');
    this.tableControls = document.getElementById('tableControls');
    this.emptyState = document.getElementById('emptyState');
    this.loadingState = document.getElementById('loadingState');
    this.tableContainer = document.getElementById('tableContainer');
    this.paginationWrapper = document.getElementById('paginationWrapper');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.tableSearch = document.getElementById('tableSearch');
  },

  admin_dw_tesouro_bindEvents() {
    // Table selection functionality
    this.tableItems.forEach(item => {
      item.addEventListener('click', (e) => this.admin_dw_tesouro_handleTableSelection(e));
    });

    // Search functionality
    this.tableSearch.addEventListener('input', (e) => this.admin_dw_tesouro_handleSearch(e));

    // Refresh button
    this.refreshBtn.addEventListener('click', () => this.admin_dw_tesouro_handleRefresh());

    // Export button
    this.exportBtn.addEventListener('click', () => this.admin_dw_tesouro_handleExport());
  },

  admin_dw_tesouro_handleTableSelection(event) {
    const item = event.currentTarget;
    
    // Remove active from all items
    this.tableItems.forEach(i => i.classList.remove('active'));
    
    // Add active to clicked item
    item.classList.add('active');
    
    // Get table data
    const tableName = item.dataset.table;
    const tableDesc = item.querySelector('.table-info small').textContent;
    
    // Update header
    this.selectedTableName.textContent = tableName;
    this.selectedTableDesc.textContent = tableDesc;
    
    // Show loading state
    this.emptyState.style.display = 'none';
    this.loadingState.style.display = 'flex';
    this.tableContainer.style.display = 'none';
    this.tableControls.style.display = 'none';
    this.paginationWrapper.style.display = 'none';
    this.refreshBtn.style.display = 'none';
    this.exportBtn.style.display = 'none';
    
    // Simulate loading (replace with actual API call)
    setTimeout(() => {
      this.admin_dw_tesouro_loadTableData(tableName);
    }, 1500);
  },

  admin_dw_tesouro_handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    this.tableItems.forEach(item => {
      const tableName = item.querySelector('.table-info span').textContent.toLowerCase();
      const tableDesc = item.querySelector('.table-info small').textContent.toLowerCase();
      
      if (tableName.includes(searchTerm) || tableDesc.includes(searchTerm)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  },

  admin_dw_tesouro_handleRefresh() {
    const activeItem = document.querySelector('.table-item.active');
    if (activeItem) {
      const tableName = activeItem.dataset.table;
      
      // Show loading briefly
      this.tableContainer.style.display = 'none';
      this.loadingState.style.display = 'flex';
      
      setTimeout(() => {
        this.admin_dw_tesouro_loadTableData(tableName);
      }, 1000);
    }
  },

  admin_dw_tesouro_handleExport() {
    const activeItem = document.querySelector('.table-item.active');
    if (activeItem) {
      const tableName = activeItem.dataset.table;
      
      // Create and download CSV (mock)
      const csvContent = "data:text/csv;charset=utf-8,ID,Nome,Valor,Data,Status\n1,Item 1,100.00,2024-01-01,Ativo\n";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${tableName}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show notification
      this.admin_dw_tesouro_showNotification(`Dados da tabela ${tableName} exportados com sucesso!`, 'success');
    }
  },

  admin_dw_tesouro_loadTableData(tableName) {
    // Hide loading, show table
    this.loadingState.style.display = 'none';
    this.tableContainer.style.display = 'block';
    this.tableControls.style.display = 'block';
    this.paginationWrapper.style.display = 'flex';
    this.refreshBtn.style.display = 'flex';
    this.exportBtn.style.display = 'flex';
    
    // Mock data generation
    this.admin_dw_tesouro_generateMockTable(tableName);
  },

  admin_dw_tesouro_generateMockTable(tableName) {
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // Mock headers based on table name
    let headers = [];
    let rows = [];
    
    switch(tableName) {
      case 'pagamentos':
        headers = ['ID', 'Data', 'Valor', 'Fornecedor', 'Status'];
        for(let i = 1; i <= 25; i++) {
          rows.push([
            i,
            `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            `R$ ${(Math.random() * 10000).toFixed(2)}`,
            `Fornecedor ${Math.floor(Math.random() * 100) + 1}`,
            Math.random() > 0.5 ? 'Pago' : 'Pendente'
          ]);
        }
        break;
      case 'receitas':
        headers = ['ID', 'Tipo', 'Valor', 'Data', 'Origem'];
        for(let i = 1; i <= 25; i++) {
          rows.push([
            i,
            ['Tributária', 'Contribuições', 'Patrimonial'][Math.floor(Math.random() * 3)],
            `R$ ${(Math.random() * 50000).toFixed(2)}`,
            `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            `Órgão ${Math.floor(Math.random() * 20) + 1}`
          ]);
        }
        break;
      default:
        headers = ['ID', 'Nome', 'Valor', 'Data', 'Status'];
        for(let i = 1; i <= 25; i++) {
          rows.push([
            i,
            `Item ${i}`,
            `R$ ${(Math.random() * 1000).toFixed(2)}`,
            `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            ['Ativo', 'Inativo'][Math.floor(Math.random() * 2)]
          ]);
        }
    }
    
    // Create header
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Create rows
    rows.forEach(rowData => {
      const tr = document.createElement('tr');
      rowData.forEach(cellData => {
        const td = document.createElement('td');
        td.textContent = cellData;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    
    // Update pagination info
    document.getElementById('paginationInfo').textContent = `Mostrando 1-25 de ${rows.length * 4} registros`;
  },

  admin_dw_tesouro_showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#10b981' : '#3b82f6'};
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
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  admin_dw_tesouro.admin_dw_tesouro_init();
});

// Export for ES modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = admin_dw_tesouro;
}
