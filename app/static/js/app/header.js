export default {
  // Variável para controlar execuções múltiplas
  lastAutoInitTime: 0,
  isInitializing: false,

  // Método único para inicialização completa via SPA
  header_initComplete() {
    console.log('🔧 header_initComplete() chamado via SPA');
    
    // Evitar execução dupla
    const now = Date.now();
    if (now - this.lastAutoInitTime < 1000) {
      console.log('⚠️ Header: execução muito próxima, ignorando');
      return;
    }
    
    // Evitar sobreposição de execuções
    if (this.isInitializing) {
      console.log('⚠️ Header: já está inicializando, ignorando');
      return;
    }
    
    this.lastAutoInitTime = now;
    this.isInitializing = true;
    
    // Verifica se estamos na página correta
    const headerContainer = document.getElementById('header-dynamic-container');
    console.log('🔍 Elemento header-dynamic-container encontrado:', !!headerContainer);
    
    if (headerContainer) {
      console.log('✅ Container encontrado, inicializando header...');
      this.header_init();
    } else {
      console.log('❌ Container do header não encontrado, pulando inicialização');
    }
    
    this.isInitializing = false;
  },

  // Método para inicialização automática quando o módulo é carregado
  autoInit() {
    console.log('🔧 Header.autoInit() chamado');
    
    // Evitar execuções múltiplas muito próximas (debounce de 1 segundo)
    const now = Date.now();
    if (now - this.lastAutoInitTime < 1000) {
      console.log('⚠️ Header: execução muito próxima, ignorando');
      return;
    }
    
    // Evitar sobreposição de execuções
    if (this.isInitializing) {
      console.log('⚠️ Header: já está inicializando, ignorando');
      return;
    }
    
    this.lastAutoInitTime = now;
    this.isInitializing = true;
    
    // Verifica se estamos na página correta procurando pelo elemento principal
    const headerContainer = document.getElementById('header-dynamic-container');
    console.log('🔍 Elemento header-dynamic-container encontrado:', !!headerContainer);
    
    if (headerContainer) {
      console.log('✅ Container encontrado, inicializando header...');
      this.header_init();
    } else {
      console.log('❌ Container do header não encontrado, pulando inicialização');
    }
    
    this.isInitializing = false;
  },

  // Função principal para inicializar o header
  header_init() {
    console.log('🔧 header_init() chamado');
    
    // Só inicializa se o container existir
    if (!this.header_initElements()) {
      console.error('Elementos essenciais do header não encontrados');
      return;
    }
    
    console.log('✅ Elementos encontrados, renderizando header...');
    this.header_render();
    this.header_bindEvents();
    
    console.log('✅ Header initialized successfully');
  },

  header_initElements() {
    console.log('🔍 Verificando elementos da página do header...');
    
    this.headerContainer = document.getElementById('header-dynamic-container');
    
    // Verifica se o elemento essencial existe
    if (!this.headerContainer) {
      console.error('❌ Container do header não encontrado');
      return false;
    }
    
    console.log('✅ Header elements initialized successfully');
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
    console.log('🔧 Renderizando dados dinâmicos do header...');
    
    const sessionData = this.header_getSessionData();
    const isLoggedIn = sessionData.cpf && sessionData.cpf.length > 0;
    
    console.log('📊 Dados de sessão:', sessionData);
    console.log('🔐 Usuário logado:', isLoggedIn);
    
    // Apenas preenche os textos dinâmicos no container
    this.headerContainer.innerHTML = `
      <div class="header-sign">
        Compras Executivo
      </div>
      <div class="header-title">
        Design System | Versão 3.6.1
      </div>
    `;
    
    // Preenche os dados do usuário no container específico
    const userContainer = document.getElementById('header-user-dynamic-container');
    if (userContainer) {
      userContainer.innerHTML = isLoggedIn ? this.header_renderLoggedInUser(sessionData) : this.header_renderLoginButton();
    }
    
    console.log('✅ Header dados dinâmicos renderizados com sucesso');
  },

  // Função para renderizar usuário logado
  header_renderLoggedInUser(sessionData) {
    return `
      <div class="header-user-container">
        <div class="header-user-info">
          <div class="header-user-details">
            <span class="header-cpf-display" id="cpf-display">${sessionData.cpf}</span>
            ${sessionData.usuario_name ? `
              <span class="header-user-name">${sessionData.usuario_name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
            ` : ''}
          </div>
          ${sessionData.usuario_role ? `
            <span class="header-user-role">${sessionData.usuario_role}</span>
          ` : ''}
        </div>
      </div>
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
    console.log('🔧 Vinculando eventos do header...');
    
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

    console.log('✅ Header events bound successfully');
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