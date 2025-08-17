export default {
  // Método para inicialização automática quando o módulo é carregado
  autoInit() {
    // Verifica se estamos em uma página que precisa do header
    const headerContainer = document.getElementById('header-dynamic-container');
    if (headerContainer) {
      console.log('Inicializando header dinamicamente...');
      this.header_init();
    }
  },

  // Função principal para inicializar o header
  header_init() {
    // Só inicializa se o container existir
    if (!this.header_initElements()) {
      console.error('Elementos essenciais do header não encontrados');
      return;
    }
    
    this.header_render();
    this.header_bindEvents();
  },

  header_initElements() {
    this.headerContainer = document.getElementById('header-dynamic-container');
    
    // Verifica se o elemento essencial existe
    if (!this.headerContainer) {
      console.error('Container do header não encontrado');
      return false;
    }
    
    console.log('Header elements initialized successfully');
    return true;
  },

  // Função para obter dados da sessão dos data attributes do container do header
  header_getSessionData() {
    const headerContainer = this.headerContainer;
    const body = document.body;
    return {
      cpf: headerContainer.getAttribute('data-session-cpf') || '',
      usuario_name: headerContainer.getAttribute('data-session-usuario-name') || '',
      usuario_role: headerContainer.getAttribute('data-session-usuario-role') || '',
      usuario_email: headerContainer.getAttribute('data-session-usuario-email') || '',
      uasgs: body.getAttribute('data-uasgs') || ''
    };
  },

  // Função para renderizar o header dinamicamente
  header_render() {
    const sessionData = this.header_getSessionData();
    const isLoggedIn = sessionData.cpf && sessionData.cpf.length > 0;
    
    console.log('Renderizando header com dados:', sessionData);
    
    const headerHTML = `
      <header class="br-header" data-sticky="data-sticky">
        <div class="header-container">
          <div class="header-top header-top-flex">

            <!-- BLOCO ESQUERDO -->
            <div id="header-esquerda" style="display: flex; align-items: center; gap: 20px;">
              <div style="display: flex; flex-direction: column; align-items: start;">
                <!-- LOGO -->
                <img src="/static/images/govbr-logo.png" alt="gov.br" style="margin-bottom: 0.25rem;">
                <!-- BOTÃO HAMBURGUER -->
                <button id="menu-toggle-button" 
                        class="br-button small circle" 
                        type="button" 
                        aria-label="Abrir Menu"
                        data-tooltip-text="Menu" 
                        data-tooltip-place="bottom" 
                        data-tooltip-type="info">
                  <span>&#9776;</span>
                </button>
              </div>
              <!-- Textos -->
              <div style="margin: 30px 0px -30px -30px;">
                <div class="header-sign" style="color: #1351b4;">
                  Compras Executivo
                </div>
                <div class="header-title" style="color: #555;">
                  Design System | Versão 3.6.1
                </div>
              </div>
            </div>

            <!-- BLOCO DIREITO -->
            <!-- VERSÃO DESKTOP -->
            <div id="header-direita-desktop" class="d-none d-lg-flex header-direita-desktop" style="align-items: center; gap: 10px;">
              ${isLoggedIn ? this.header_renderLoggedInUser(sessionData) : this.header_renderLoginButton()}

              <!-- Separador vertical -->
              <div style="height: 24px; width: 1px; background-color: #ccc; margin: 0 1rem;"></div>

              <!-- Botão Minha Conta -->
              <a href="/minha-conta" 
                 class="br-button small circle" 
                 data-tooltip-text="Minha conta" 
                 data-tooltip-place="bottom" 
                 data-tooltip-type="info"
                 aria-label="Minha Conta">
                <i class="fas fa-user-circle"></i>
              </a>
            </div>

            <!-- VERSÃO MOBILE -->
            <div id="header-direita-mobile" class="d-flex d-lg-none header-direita-mobile">
              <button id="abrir-pesquisa" class="br-button small circle" type="button" aria-label="Buscar">
                <i class="fas fa-search header-icon"></i>
              </button>
            </div>

            <!-- CAMPO DE BUSCA MOBILE -->
            <div id="busca-mobile" class="d-lg-none">
              <div class="br-input input-highlight">
                <input id="campo-pesquisa-mobile" type="text" placeholder="Buscar..." autocomplete="off" aria-autocomplete="list">
                <i class="fas fa-search"></i>
                <button id="fechar-pesquisa">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- BARRA DE PESQUISA -->
          <div class="header-bottom" id="header-search-bar">
            <div class="br-input input-highlight">
              <input id="campo-pesquisa" type="text" placeholder="O que você procura?" autocomplete="off" aria-autocomplete="list">
              <i class="fas fa-search"></i>
            </div>
          </div>
        </div>
      </header>
    `;
    
    this.headerContainer.innerHTML = headerHTML;
  },

  // Função para renderizar usuário logado
  header_renderLoggedInUser(sessionData) {
    return `
      <div style="display: flex; flex-direction: column; align-items: flex-end; margin-right: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #1351b4; font-weight: bold; font-size: 12px; font-family: Arial; margin-top:2px;" 
                id="cpf-display"
                data-tooltip-text="CPF" 
                data-tooltip-place="bottom" 
                data-tooltip-type="info">${sessionData.cpf}</span>
          ${sessionData.usuario_name ? `
            <span style="color: #555; font-weight: 600; font-size: 14px;"
                  data-tooltip-text="Usuário" 
                  data-tooltip-place="bottom" 
                  data-tooltip-type="info">${sessionData.usuario_name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
          ` : ''}
        </div>
        ${sessionData.usuario_role ? `
          <span style="color: #666; font-size: 12px; font-style: italic;"
                data-tooltip-text="Perfil no sistema"
                data-tooltip-place="bottom" 
                data-tooltip-type="info">${sessionData.usuario_role}</span>
        ` : ''}
      </div>
      <a href="/logout" 
         class="br-button small circle" 
         data-tooltip-text="Sair do sistema" 
         data-tooltip-place="bottom" 
         data-tooltip-type="info"
         aria-label="Sair">
        <i class="fas fa-sign-out-alt"></i>
      </a>
    `;
  },

  // Função para renderizar botão de login
  header_renderLoginButton() {
    return `
      <a href="/login" class="br-button small" title="Entrar">Entrar</a>
    `;
  },

  // Função para vincular eventos do header
  header_bindEvents() {
    // Evento do botão de menu hamburguer
    const menuToggleButton = document.getElementById('menu-toggle-button');
    if (menuToggleButton) {
      menuToggleButton.addEventListener('click', this.header_handleMenuToggle.bind(this));
    }

    // Eventos da busca mobile
    const abrirPesquisa = document.getElementById('abrir-pesquisa');
    const fecharPesquisa = document.getElementById('fechar-pesquisa');
    const buscaMobile = document.getElementById('busca-mobile');

    if (abrirPesquisa && buscaMobile) {
      abrirPesquisa.addEventListener('click', () => {
        buscaMobile.style.display = 'block';
        const input = document.getElementById('campo-pesquisa-mobile');
        if (input) input.focus();
      });
    }

    if (fecharPesquisa && buscaMobile) {
      fecharPesquisa.addEventListener('click', () => {
        buscaMobile.style.display = 'none';
      });
    }

    // Eventos de busca (se necessário implementar funcionalidade)
    const campoPesquisa = document.getElementById('campo-pesquisa');
    const campoPesquisaMobile = document.getElementById('campo-pesquisa-mobile');
    
    if (campoPesquisa) {
      campoPesquisa.addEventListener('keypress', this.header_handleSearch.bind(this));
    }
    
    if (campoPesquisaMobile) {
      campoPesquisaMobile.addEventListener('keypress', this.header_handleSearch.bind(this));
    }

    console.log('Header events bound successfully');
  },

  // Handler para o toggle do menu
  header_handleMenuToggle(event) {
    event.preventDefault();
    console.log('Menu toggle clicked');
    
    // Busca o menu direto e alterna
    const menu = document.getElementById("main-navigation");
    if (menu) {
      const isOpen = menu.classList.contains("active");
      menu.classList.toggle("active");
      document.body.classList.toggle("menu-open");
      
      // Atualiza o botão
      const btn = event.currentTarget;
      btn.innerHTML = isOpen ? "<span>&#9776;</span>" : "<span>&times;</span>";
      btn.setAttribute('aria-label', isOpen ? 'Abrir Menu' : 'Fechar Menu');
      
      // Salva no cookie
      const expires = new Date();
      expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
      document.cookie = `menu=${!isOpen ? '1' : '0'};expires=${expires.toUTCString()};path=/`;
    }
  },

  // Handler para busca
  header_handleSearch(event) {
    if (event.key === 'Enter') {
      const searchTerm = event.target.value.trim();
      if (searchTerm) {
        console.log('Pesquisando por:', searchTerm);
        // Implementar lógica de busca aqui
        this.header_performSearch(searchTerm);
      }
    }
  },

  // Função para realizar busca
  header_performSearch(searchTerm) {
    // Implementar lógica de busca
    console.log('Realizando busca por:', searchTerm);
    // Aqui você pode redirecionar para uma página de resultados ou abrir um modal
    // window.location.href = `/busca?q=${encodeURIComponent(searchTerm)}`;
  }
};