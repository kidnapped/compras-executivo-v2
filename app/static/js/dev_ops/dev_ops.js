export default {
  // State management for the unidades selector
  unidadesState: {
    searchTimeout: null,
    selectedUnit: null,
    isLoading: false,
    lastSearchTerm: ''
  },

  // Initialize dev_ops functionality
  initDevOps() {
    this.initUnidadesSelector();
    this.initClearUasgButton();
    this.initCpfValidator();
    this.initQuickLinks();
  },

  // Initialize the unidades organizational selector
  initUnidadesSelector() {
    console.log('Initializing unidades selector...');
    
    const searchInput = document.getElementById('unidades-search-input');
    const dropdown = document.getElementById('unidades-dropdown');
    const loadingIndicator = document.getElementById('unidades-loading');

    console.log('Elements found:', {
      searchInput: !!searchInput,
      dropdown: !!dropdown,
      loadingIndicator: !!loadingIndicator
    });

    if (!searchInput || !dropdown) {
      console.error('Required elements not found for unidades selector');
      return;
    }

    // Setup search input event listeners
    searchInput.addEventListener('input', (e) => {
      console.log('Search input changed:', e.target.value);
      this.handleUnidadesSearch(e.target.value);
    });

    searchInput.addEventListener('focus', () => {
      console.log('Search input focused');
      if (this.unidadesState.lastSearchTerm) {
        dropdown.style.display = 'block';
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#unidades-search-input') && !e.target.closest('#unidades-dropdown')) {
        dropdown.style.display = 'none';
      }
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      this.handleUnidadesKeyboard(e);
    });

    console.log('Unidades selector initialized successfully');
  },

  // Handle search input with debouncing
  handleUnidadesSearch(searchTerm) {
    const dropdown = document.getElementById('unidades-dropdown');
    const loadingIndicator = document.getElementById('unidades-loading');
    
    // Clear previous timeout
    if (this.unidadesState.searchTimeout) {
      clearTimeout(this.unidadesState.searchTimeout);
    }

    // Hide dropdown and loading if search term is too short
    if (searchTerm.length < 2) {
      dropdown.style.display = 'none';
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      this.unidadesState.lastSearchTerm = '';
      return;
    }

    // Debounce the search
    this.unidadesState.searchTimeout = setTimeout(() => {
      this.searchUnidades(searchTerm);
    }, 300);
  },

  // Perform the actual search
  async searchUnidades(searchTerm) {
    console.log('Searching unidades for term:', searchTerm);
    
    const dropdown = document.getElementById('unidades-dropdown');
    const loadingIndicator = document.getElementById('unidades-loading');

    try {
      this.unidadesState.isLoading = true;
      this.unidadesState.lastSearchTerm = searchTerm;
      
      // Show loading
      if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
      }

      const url = `/dev-ops/unidades?search=${encodeURIComponent(searchTerm)}&limit=50`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const unidades = await response.json();
      console.log('Received unidades:', unidades);
      
      this.displayUnidadesResults(unidades);

    } catch (error) {
      console.error('Error searching unidades:', error);
      this.displayUnidadesError();
    } finally {
      this.unidadesState.isLoading = false;
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
    }
  },

  // Display search results in dropdown
  displayUnidadesResults(unidades) {
    const dropdown = document.getElementById('unidades-dropdown');
    
    if (!dropdown) return;

    if (unidades.length === 0) {
      dropdown.innerHTML = `
        <div style="padding: 10px; color: #666; font-style: italic; text-align: center;">
          <i class="fas fa-search" style="margin-right: 8px;"></i>
          Nenhuma unidade encontrada
        </div>
      `;
    } else {
      dropdown.innerHTML = unidades.map(unidade => `
        <div 
            class="dropdown-item" 
            data-codigo="${unidade.codigo}" 
            data-nome="${this.escapeHtml(unidade.nomeresumido)}"
            style="
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s;
            "
            onmouseover="this.style.backgroundColor='#f8f9fa'"
            onmouseout="this.style.backgroundColor='white'"
        >
            <div style="display: flex; align-items: center;">
            <span style="font-weight: 500; color: #00366f;">${unidade.codigo}</span>
            <span style="margin: 0 8px; color: #666;"> - </span>
            <span style="color: #666;">${this.escapeHtml(unidade.nomeresumido)}</span>
            </div>
        </div>
        `).join('');

      // Add click event listeners to dropdown items
      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          const codigo = item.dataset.codigo;
          const nome = item.dataset.nome;
          this.selectUnidade(codigo, nome);
        });
      });
    }

    dropdown.style.display = 'block';
  },

  // Display error message
  displayUnidadesError() {
    const dropdown = document.getElementById('unidades-dropdown');
    
    if (!dropdown) return;

    dropdown.innerHTML = `
      <div style="padding: 10px; color: #dc3545; text-align: center;">
        <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
        Erro ao buscar unidades. Tente novamente.
      </div>
    `;
    dropdown.style.display = 'block';
  },

  // Select a unit from the dropdown
  async selectUnidade(codigo, nomeresumido) {
    const searchInput = document.getElementById('unidades-search-input');
    const dropdown = document.getElementById('unidades-dropdown');

    if (!searchInput || !dropdown) return;

    try {
      // Call API to update session
      const response = await fetch('/dev-ops/set-uasg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigo: parseInt(codigo) })
      });

      const result = await response.json();

      if (result.success) {
        // Update state
        this.unidadesState.selectedUnit = { codigo, nomeresumido };

        // Update UI - clear search and hide dropdown
        searchInput.value = '';
        dropdown.style.display = 'none';

        // Show success message
        this.updateStatusMessage(result.message, 'success');

        // Show the current UASG display or update it
        this.showCurrentUasgDisplay(codigo, nomeresumido);

        // Trigger custom event for other components to listen
        document.dispatchEvent(new CustomEvent('unidadeSelected', {
          detail: { codigo, nomeresumido }
        }));

        console.log('UASG atualizada na sessão:', { codigo, nomeresumido });
      } else {
        this.updateStatusMessage(result.message || 'Erro ao definir UASG', 'error');
      }

    } catch (error) {
      console.error('Error setting UASG:', error);
      this.updateStatusMessage('Erro ao conectar com o servidor', 'error');
    }
  },

  // Clear the current selection
  clearUnidadesSelection() {
    const searchInput = document.getElementById('unidades-search-input');
    const dropdown = document.getElementById('unidades-dropdown');

    if (!searchInput) return;

    // Clear state
    this.unidadesState.selectedUnit = null;
    this.unidadesState.lastSearchTerm = '';

    // Clear UI
    searchInput.value = '';
    dropdown.style.display = 'none';

    // Trigger custom event
    document.dispatchEvent(new CustomEvent('unidadeCleared'));

    console.log('Seleção de unidade limpa');
  },

  // Initialize clear UASG button
  initClearUasgButton() {
    const clearBtn = document.getElementById('clear-uasg-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearCurrentUasg();
      });
    }
  },

  // Clear current UASG from session
  async clearCurrentUasg() {
    try {
      const response = await fetch('/dev-ops/clear-uasg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        // Hide the current UASG display
        const currentDisplay = document.getElementById('current-uasg-display');
        if (currentDisplay) {
          currentDisplay.style.display = 'none';
        }

        // Update status message
        this.updateStatusMessage('UASG removida da sessão', 'success');

        // Clear state
        this.unidadesState.selectedUnit = null;

        // Trigger custom event
        document.dispatchEvent(new CustomEvent('unidadeCleared'));

        console.log('UASG removida da sessão');
      } else {
        this.updateStatusMessage(result.message || 'Erro ao remover UASG', 'error');
      }

    } catch (error) {
      console.error('Error clearing UASG:', error);
      this.updateStatusMessage('Erro ao conectar com o servidor', 'error');
    }
  },

  // Handle keyboard navigation in the dropdown
  handleUnidadesKeyboard(e) {
    const dropdown = document.getElementById('unidades-dropdown');
    
    if (!dropdown || dropdown.style.display === 'none') return;

    const items = dropdown.querySelectorAll('.dropdown-item');
    if (items.length === 0) return;

    let currentIndex = -1;
    items.forEach((item, index) => {
      if (item.classList.contains('selected')) {
        currentIndex = index;
      }
    });

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        this.highlightUnidadesItem(items, currentIndex);
        break;

      case 'ArrowUp':
        e.preventDefault();
        currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        this.highlightUnidadesItem(items, currentIndex);
        break;

      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0 && items[currentIndex]) {
          const codigo = items[currentIndex].dataset.codigo;
          const nome = items[currentIndex].dataset.nome;
          this.selectUnidade(codigo, nome);
        }
        break;

      case 'Escape':
        dropdown.style.display = 'none';
        break;
    }
  },

  // Highlight a specific item in the dropdown
  highlightUnidadesItem(items, index) {
    items.forEach(item => item.classList.remove('selected'));
    if (items[index]) {
      items[index].classList.add('selected');
      items[index].style.backgroundColor = '#e3f2fd';
    }
  },

  // Get the currently selected unit
  getSelectedUnidade() {
    return this.unidadesState.selectedUnit;
  },

  // Update status message in the blue box
  updateStatusMessage(message, type = 'info') {
    const statusText = document.getElementById('status-text');
    const statusMessage = document.getElementById('status-message');
    
    if (!statusText || !statusMessage) return;

    // Update message text
    statusText.textContent = message;

    // Update styles based on type
    if (type === 'success') {
      statusMessage.style.backgroundColor = '#d4edda';
      statusMessage.style.borderColor = '#c3e6cb';
      statusText.style.color = '#155724';
      statusMessage.querySelector('i').className = 'fas fa-check-circle';
    } else if (type === 'error') {
      statusMessage.style.backgroundColor = '#f8d7da';
      statusMessage.style.borderColor = '#f5c6cb';
      statusText.style.color = '#721c24';
      statusMessage.querySelector('i').className = 'fas fa-exclamation-triangle';
    } else {
      statusMessage.style.backgroundColor = '#e3f2fd';
      statusMessage.style.borderColor = '#bbdefb';
      statusText.style.color = '#1976d2';
      statusMessage.querySelector('i').className = 'fas fa-info-circle';
    }

    // Reset to default after 5 seconds
    if (type !== 'info') {
      setTimeout(() => {
        statusText.textContent = 'Ao selecionar uma unidade, ela será definida como padrão para sua sessão';
        statusMessage.style.backgroundColor = '#e3f2fd';
        statusMessage.style.borderColor = '#bbdefb';
        statusText.style.color = '#1976d2';
        statusMessage.querySelector('i').className = 'fas fa-info-circle';
      }, 5000);
    }
  },

  // Show or update current UASG display
  showCurrentUasgDisplay(codigo, nomeresumido) {
    let currentDisplay = document.getElementById('current-uasg-display');
    
    // If display doesn't exist, create it
    if (!currentDisplay) {
      const statusMessage = document.getElementById('status-message');
      if (!statusMessage || !statusMessage.parentNode) return;

      currentDisplay = document.createElement('div');
      currentDisplay.id = 'current-uasg-display';
      currentDisplay.style.marginTop = '15px';
      
      // Insert before status message
      statusMessage.parentNode.insertBefore(currentDisplay, statusMessage);
    }

    // Update content
    currentDisplay.innerHTML = `
      <div style="padding: 10px; background-color: #e8f4fd; border: 1px solid #bee5eb; border-radius: 4px; display: flex; align-items: center; justify-content: between;">
        <div style="display: flex; align-items: center;">
          <i class="fas fa-check-circle" style="margin-right: 8px; color: #00366f"></i>
          <span style="color: #00366f; font-weight: 500;">
            UASG ${codigo} selecionada
          </span>
        </div>
        <button 
          id="clear-uasg-btn" 
          style="margin-left: auto; background: none; border: none; color: #666; cursor: pointer; padding: 4px 8px; border-radius: 3px;"
          title="Limpar seleção"
          onmouseover="this.style.backgroundColor='#dee2e6'"
          onmouseout="this.style.backgroundColor='transparent'"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Show display
    currentDisplay.style.display = 'block';

    // Re-initialize clear button
    this.initClearUasgButton();
  },

  // Utility function to escape HTML to prevent XSS
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Initialize CPF validator functionality
  initCpfValidator() {
    console.log('Initializing CPF validator...');
    
    const cpfInput = document.getElementById('cpf-input');
    const validateBtn = document.getElementById('validate-cpf-btn');
    const resultDiv = document.getElementById('cpf-result');

    console.log('CPF elements found:', {
      cpfInput: !!cpfInput,
      validateBtn: !!validateBtn,
      resultDiv: !!resultDiv
    });

    if (!cpfInput || !validateBtn || !resultDiv) {
      console.error('Required CPF elements not found');
      return;
    }

    // Add input formatting
    cpfInput.addEventListener('input', (e) => {
      this.formatCpfInput(e.target);
    });

    // Add validation on button click
    validateBtn.addEventListener('click', () => {
      this.validateCpf();
    });

    // Add validation on Enter key
    cpfInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.validateCpf();
      }
    });

    console.log('CPF validator initialized successfully');
  },

  // Format CPF input as user types
  formatCpfInput(input) {
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    // Clear previous result when user starts typing
    this.clearCpfResult();
    
    // Apply CPF formatting
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    input.value = value;
  },

  // Validate CPF
  async validateCpf() {
    const cpfInput = document.getElementById('cpf-input');
    const validateBtn = document.getElementById('validate-cpf-btn');
    const resultDiv = document.getElementById('cpf-result');

    if (!cpfInput || !validateBtn || !resultDiv) {
      console.error('CPF elements not found');
      return;
    }

    const cpfValue = cpfInput.value.trim();
    
    if (!cpfValue) {
      this.showCpfResult('Por favor, digite um CPF', 'error');
      return;
    }

    // Show loading state
    const originalBtnText = validateBtn.innerHTML;
    validateBtn.disabled = true;
    validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Validando...';

    try {
      const response = await fetch('/dev-ops/validate-cpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: cpfValue })
      });

      const result = await response.json();

      if (response.ok) {
        this.showCpfResult(result.message, result.success ? 'success' : 'error', result);
      } else {
        this.showCpfResult(result.message || 'Erro ao validar CPF', 'error');
      }

    } catch (error) {
      console.error('Error validating CPF:', error);
      this.showCpfResult('Erro ao conectar com o servidor', 'error');
    } finally {
      // Restore button state
      validateBtn.disabled = false;
      validateBtn.innerHTML = originalBtnText;
    }
  },

  // Show CPF validation result
  showCpfResult(message, type = 'info', resultData = null) {
    const resultDiv = document.getElementById('cpf-result');
    
    if (!resultDiv) return;

    let iconClass = 'fas fa-info-circle';
    let bgColor = '#e3f2fd';
    let borderColor = '#bbdefb';
    let textColor = '#1976d2';

    if (type === 'success') {
      iconClass = 'fas fa-check-circle';
      bgColor = '#d4edda';
      borderColor = '#c3e6cb';
      textColor = '#155724';
    } else if (type === 'error') {
      iconClass = 'fas fa-exclamation-triangle';
      bgColor = '#f8d7da';
      borderColor = '#f5c6cb';
      textColor = '#721c24';
    }

    let content = `
      <div style="padding: 12px; background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 4px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <i class="${iconClass}" style="margin-right: 8px; color: ${textColor}"></i>
          <span style="color: ${textColor}; font-weight: 500;">${this.escapeHtml(message)}</span>
        </div>
    `;

    // Add additional information if validation was successful and user was found
    if (resultData && resultData.exists_in_database && resultData.user_info) {
      content += `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${borderColor};">
          <div style="color: ${textColor}; font-size: 14px;">
            <strong>Informações do usuário:</strong>
          </div>
          <div style="margin-top: 8px; color: ${textColor}; font-size: 13px;">
            <div><strong>Nome:</strong> ${this.escapeHtml(resultData.user_info.name)}</div>
            <div><strong>Email:</strong> ${this.escapeHtml(resultData.user_info.email || 'Não informado')}</div>
            <div><strong>UG Primária:</strong> ${resultData.user_info.ugprimaria || 'Não informado'}</div>
            <div><strong>ID:</strong> ${resultData.user_info.id}</div>
          </div>
        </div>
      `;
    } else if (resultData && resultData.valid_format && !resultData.exists_in_database) {
      content += `
        <div style="margin-top: 8px; color: ${textColor}; font-size: 13px;">
          <strong>CPF:</strong> ${this.escapeHtml(resultData.cpf)}
        </div>
      `;
    }

    content += '</div>';

    resultDiv.innerHTML = content;
    resultDiv.style.display = 'block';

    // Auto-hide after 10 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        resultDiv.style.display = 'none';
      }, 10000);
    }
  },

  // Clear CPF validation result
  clearCpfResult() {
    const resultDiv = document.getElementById('cpf-result');
    if (resultDiv) {
      resultDiv.style.display = 'none';
      resultDiv.innerHTML = '';
    }
  },

  // Initialize quick links functionality
  initQuickLinks() {
    console.log('Initializing quick links...');
    
    const quickLinkButtons = document.querySelectorAll('[id$="-link-btn"]');
    
    console.log('Quick link buttons found:', quickLinkButtons.length);

    quickLinkButtons.forEach(button => {
      if (button.dataset.url) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const url = button.dataset.url;
          console.log('Navigating to:', url);
          
          // Add loading state
          const originalContent = button.innerHTML;
          button.disabled = true;
          button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Carregando...';
          
          // Navigate to URL
          window.location.href = url;
          
          // Note: The page will change, so we don't need to restore the button state
        });
      }
    });

    console.log('Quick links initialized successfully');
  }
};
