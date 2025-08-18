export default {
  // Variável para controlar execuções múltiplas
  lastAutoInitTime: 0,
  isInitializing: false,
  isInitialized: false, // Flag para evitar reinicializações desnecessárias
  
  // Nome do cookie para salvar estado do menu
  menuStateCookieName: 'menu_state',

  // Método único para inicialização completa via SPA
  header_initComplete() {
    console.log('🔧 header_initComplete() chamado via SPA');
    
    // Se já foi inicializado recentemente, evitar nova inicialização
    const now = Date.now();
    if (this.isInitialized && (now - this.lastAutoInitTime) < 2000) {
      console.log('⚠️ Header já inicializado recentemente, ignorando');
      return;
    }
    
    this.lastAutoInitTime = now;
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
    
    // Marcar como inicializado
    this.isInitialized = true;
    
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

  // Função para salvar o estado do menu no cookie
  header_saveMenuState(isOpen) {
    try {
      // Usar o módulo cookie do App global
      if (window.App && window.App.cookieSet) {
        const success = window.App.cookieSet(this.menuStateCookieName, isOpen ? 'open' : 'closed', {
          expires: 30, // 30 dias
          path: '/'
        });
        
        if (success) {
          console.log(`✅ Estado do menu salvo: ${isOpen ? 'aberto' : 'fechado'}`);
        } else {
          console.error('❌ Erro ao salvar estado do menu no cookie');
        }
        
        return success;
      } else {
        console.error('❌ Módulo cookie não disponível');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao salvar estado do menu:', error);
      return false;
    }
  },

  // Função para recuperar o estado do menu do cookie
  header_getMenuState() {
    try {
      // Usar o módulo cookie do App global
      if (window.App && window.App.cookieGet) {
        const savedState = window.App.cookieGet(this.menuStateCookieName);
        console.log(`📖 Estado do menu recuperado do cookie: ${savedState || 'não definido'}`);
        return savedState === 'open';
      } else {
        console.error('❌ Módulo cookie não disponível');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao recuperar estado do menu:', error);
      return false;
    }
  },

  // Função para aplicar o estado do menu
  header_applyMenuState(isOpen) {
    const menu = document.getElementById("main-navigation");
    const menuToggleButton = document.getElementById('menu-toggle-button');
    
    if (menu && menuToggleButton) {
      if (isOpen) {
        menu.classList.add("active");
        document.body.classList.add("menu-open");
        menuToggleButton.innerHTML = "<span>&times;</span>";
        menuToggleButton.setAttribute('aria-label', 'Fechar Menu');
      } else {
        menu.classList.remove("active");
        document.body.classList.remove("menu-open");
        menuToggleButton.innerHTML = "<span>&#9776;</span>";
        menuToggleButton.setAttribute('aria-label', 'Abrir Menu');
      }
      
      console.log(`✅ Estado do menu aplicado: ${isOpen ? 'aberto' : 'fechado'}`);
      return true;
    } else {
      console.error('❌ Elementos do menu não encontrados');
      return false;
    }
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
      // Remover listener anterior se existir
      if (menuToggleButton._headerToggleHandler) {
        menuToggleButton.removeEventListener('click', menuToggleButton._headerToggleHandler);
      }
      
      // Criar e armazenar referência do novo handler
      menuToggleButton._headerToggleHandler = this.header_handleMenuToggle.bind(this);
      menuToggleButton.addEventListener('click', menuToggleButton._headerToggleHandler);
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

    // Restaurar estado do menu salvo no cookie
    setTimeout(() => {
      const savedMenuState = this.header_getMenuState();
      this.header_applyMenuState(savedMenuState);
    }, 100); // Pequeno delay para garantir que todos os elementos estejam prontos

    console.log('✅ Header events bound successfully');
  },

  // Handler para o toggle do menu
  header_handleMenuToggle(event) {
    event.preventDefault();
    console.log('Menu toggle clicked');
    
    // Busca o menu direto e alterna
    const menu = document.getElementById("main-navigation");
    
    if (menu) {
      // Aplica o toggle primeiro
      menu.classList.toggle("active");
      document.body.classList.toggle("menu-open");
      
      // Agora verifica o estado atual APÓS o toggle
      const isNowOpen = menu.classList.contains("active");
      
      // Atualiza o botão baseado no estado atual
      const btn = event.currentTarget;
      btn.innerHTML = isNowOpen ? "<span>&times;</span>" : "<span>&#9776;</span>";
      btn.setAttribute('aria-label', isNowOpen ? 'Fechar Menu' : 'Abrir Menu');
      
      // Salva o estado atual no cookie
      this.header_saveMenuState(isNowOpen);
      
      console.log(`🔄 Menu agora está: ${isNowOpen ? 'aberto' : 'fechado'}`);
    } else {
      console.error('❌ Elemento main-navigation não encontrado!');
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