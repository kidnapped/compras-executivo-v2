export default {
  // State management for the unidades selector
  unidadesState: {
    searchTimeout: null,
    selectedUnit: null,
    isLoading: false,
    lastSearchTerm: ''
  },

  // Auto-initialize when DOM is ready
  init() {
    console.log('Dev-ops page loaded, checking for window.App...');
    console.log('window.App exists:', !!window.App);
    console.log('window.App.initDevOps exists:', !!(window.App && window.App.initDevOps));
    
    // Initialize dev-ops functionality
    if (window.App && window.App.initDevOps) {
      console.log('Initializing dev-ops functionality...');
      window.App.initDevOps();
    } else {
      console.error('App.initDevOps not found. Available App methods:', window.App ? Object.keys(window.App) : 'App not found');
      
      // Fallback: Try to manually import and initialize
      if (window.App && window.App.initUnidadesSelector) {
        console.log('Using fallback initialization...');
        window.App.initUnidadesSelector();
        if (window.App.initClearUasgButton) {
          window.App.initClearUasgButton();
        }
        if (window.App.initCpfValidation) {
          window.App.initCpfValidation();
        }
        if (window.App.initEventListeners) {
          window.App.initEventListeners();
        }
      }
    }
  },

  // Initialize dev-ops functionality
  initDevOps() {
    this.initUnidadesSelector();
    this.initClearUasgButton();
    this.initCpfValidation();
    this.initEventListeners();
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

  // Initialize CPF validation functionality
  initCpfValidation() {
    console.log('Initializing CPF validation...');
    
    const cpfInput = document.getElementById('cpf-input');
    const validateBtn = document.getElementById('validate-cpf-btn');
    const resultDiv = document.getElementById('cpf-result');
    
    if (!cpfInput || !validateBtn || !resultDiv) {
      console.error('CPF validation elements not found');
      return;
    }
    
    // Format CPF as user types
    cpfInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      }
      
      e.target.value = value;
    });
    
  // Validate on button click
  validateBtn.addEventListener('click', () => {
    this.validateCpfWithDatabase();
  });
    
  // Validate on Enter key
  cpfInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      this.validateCpfWithDatabase();
    }
  });
    
    console.log('CPF validation initialized successfully');
  },

  // Initialize event listeners for dev-ops events
  initEventListeners() {
    // Listen for unit selection events
    document.addEventListener('unidadeSelected', (event) => {
      console.log('Unidade selecionada:', event.detail);
      // You can add additional logic here when a unit is selected
    });
    
    document.addEventListener('unidadeCleared', (event) => {
      console.log('Seleção de unidade limpa');
      // You can add additional logic here when selection is cleared
    });
  },

  // Validate CPF with database lookup
  async validateCpfWithDatabase() {
    const cpfInput = document.getElementById('cpf-input');
    const validateBtn = document.getElementById('validate-cpf-btn');
    const resultDiv = document.getElementById('cpf-result');
    
    if (!cpfInput || !validateBtn || !resultDiv) return;
    
    const cpf = cpfInput.value.trim();
    
    if (!cpf) {
      this.showCpfResult({ 
        success: false, 
        valid_format: false, 
        message: 'Digite um CPF para validar' 
      });
      return;
    }
    
    // Clean CPF for local validation
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // First validate locally
    const localValidation = this.validateCPF(cleanCpf);
    
    if (!localValidation) {
      this.showCpfResult({ 
        success: false, 
        valid_format: false, 
        cpf: cpf,
        message: 'CPF inválido - verificação de dígitos falhou' 
      });
      return;
    }
    
    // Show loading state
    validateBtn.disabled = true;
    validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Validando...';
    
    try {
      const response = await fetch('/dev-ops/validate-cpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: cpf })
      });

      const result = await response.json();
      
      if (response.ok) {
        this.showCpfResult(result);
      } else {
        this.showCpfResult({ 
          success: false, 
          valid_format: false, 
          message: result.message || 'Erro ao validar CPF' 
        });
      }

    } catch (error) {
      console.error('Error validating CPF:', error);
      this.showCpfResult({ 
        success: false, 
        valid_format: false, 
        message: 'Erro ao conectar com o servidor' 
      });
    } finally {
      // Reset button state
      validateBtn.disabled = false;
      validateBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Validar CPF';
    }
  },

  // CPF validation algorithm
  validateCPF(cpf) {
    // Remove any non-numeric characters
    cpf = cpf.replace(/\D/g, '');
    
    // Check if CPF has 11 digits
    if (cpf.length !== 11) {
      return false;
    }
    
    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }
    
    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let checkDigit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cpf.charAt(9)) !== checkDigit1) {
      return false;
    }
    
    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let checkDigit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cpf.charAt(10)) === checkDigit2;
  },

  // Display CPF validation result
  showCpfResult(result) {
    const resultDiv = document.getElementById('cpf-result');
    
    if (!resultDiv) return;
    
    // Handle old format (boolean) for backward compatibility
    if (typeof result === 'boolean') {
      const cpfInput = document.getElementById('cpf-input');
      const cpf = cpfInput ? cpfInput.value.replace(/\D/g, '') : '';
      result = {
        success: result,
        valid_format: result,
        cpf: cpf,
        message: result ? 'CPF válido' : 'CPF inválido'
      };
    }
    
    if (result.success && result.valid_format) {
      const formattedCpf = result.cpf || 'N/A';
      
      if (result.exists_in_database && result.user_info) {
        // CPF found in database
        resultDiv.innerHTML = `
          <div style="padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <i class="fas fa-check-circle" style="margin-right: 8px; color: #155724; font-size: 16px;"></i>
              <div>
                <strong style="color: #155724;">CPF Válido e Encontrado</strong><br>
                <small style="color: #155724;">Número: ${formattedCpf}</small>
              </div>
            </div>
            <div style="margin-top: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 3px solid #155724;">
              <strong style="color: #495057; font-size: 12px;">INFORMAÇÕES DO USUÁRIO:</strong><br>
              <div style="margin-top: 5px;">
                <div style="display: flex; margin-bottom: 3px;">
                  <span style="font-weight: 500; color: #495057; min-width: 60px; font-size: 12px;">Nome:</span>
                  <span style="color: #6c757d; font-size: 12px;">${this.escapeHtml(result.user_info.name)}</span>
                </div>
                <div style="display: flex; margin-bottom: 3px;">
                  <span style="font-weight: 500; color: #495057; min-width: 60px; font-size: 12px;">Email:</span>
                  <span style="color: #6c757d; font-size: 12px;">${this.escapeHtml(result.user_info.email || 'Não informado')}</span>
                </div>
                <div style="display: flex; margin-bottom: 3px;">
                  <span style="font-weight: 500; color: #495057; min-width: 60px; font-size: 12px;">ID:</span>
                  <span style="color: #6c757d; font-size: 12px;">${result.user_info.id}</span>
                </div>
                ${result.user_info.ugprimaria ? `
                <div style="display: flex;">
                  <span style="font-weight: 500; color: #495057; min-width: 60px; font-size: 12px;">UG:</span>
                  <span style="color: #6c757d; font-size: 12px;">${result.user_info.ugprimaria}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      } else if (result.exists_in_database === false) {
        // CPF valid but not found in database
        resultDiv.innerHTML = `
          <div style="padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
            <div style="display: flex; align-items: center;">
              <i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: #856404; font-size: 16px;"></i>
              <div>
                <strong style="color: #856404;">CPF Válido - Não Encontrado</strong><br>
                <small style="color: #856404;">Número: ${formattedCpf}</small><br>
                <small style="color: #856404; font-style: italic;">Este CPF é válido mas não está cadastrado no sistema</small>
              </div>
            </div>
          </div>
        `;
      } else {
        // CPF valid (fallback)
        resultDiv.innerHTML = `
          <div style="padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
            <div style="display: flex; align-items: center;">
              <i class="fas fa-check-circle" style="margin-right: 8px; color: #155724; font-size: 16px;"></i>
              <div>
                <strong style="color: #155724;">CPF Válido</strong><br>
                <small style="color: #155724;">Número: ${formattedCpf}</small>
              </div>
            </div>
          </div>
        `;
      }
    } else {
      // CPF invalid
      resultDiv.innerHTML = `
        <div style="padding: 15px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
          <div style="display: flex; align-items: center;">
            <i class="fas fa-times-circle" style="margin-right: 8px; color: #721c24; font-size: 16px;"></i>
            <div>
              <strong style="color: #721c24;">CPF Inválido</strong><br>
              <small style="color: #721c24;">${result.message || 'Verifique os dígitos informados'}</small>
            </div>
          </div>
        </div>
      `;
    }
    
    resultDiv.style.display = 'block';
  },

  // Utility function to escape HTML to prevent XSS
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Get the module from window.App if available, otherwise use the default export
  const devOpsModule = (window.App && window.App.init) ? window.App : (window.devOpsModule || {});
  
  if (devOpsModule.init) {
    devOpsModule.init();
  } else {
    console.error('Dev-ops module initialization method not found');
  }
});
