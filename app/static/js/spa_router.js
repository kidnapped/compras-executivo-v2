/**
 * SPA Router - Sistema de navegação Single Page Application
 * Intercepta cliques de navegação e carrega apenas o conteúdo necessário
 */

class SPARouter {
  constructor() {
    this.isLoading = false;
    this.currentRoute = window.location.pathname;
    this.lastNavigationTime = 0;
    this.pendingRoute = null;
    this.clickHandler = null;
    this.popstateHandler = null;
    this.isProcessingClick = false;
    
    // Cache para evitar requisições duplicadas
    this.requestCache = new Map();
    this.pendingRequests = new Map();
    
    this.init();
  }

  init() {
    // Limpar listeners anteriores se existirem
    this.cleanup();
    
    // Interceptar navegação do browser (back/forward)
    this.popstateHandler = (event) => {
      if (event.state && event.state.route) {
        this.loadPage(event.state.route, false);
      }
    };
    window.addEventListener('popstate', this.popstateHandler);

    // Interceptar cliques em links de navegação
    this.interceptNavigation();

    // Marcar estado inicial
    const initialState = { route: this.currentRoute };
    window.history.replaceState(initialState, '', this.currentRoute);

    // Configurar limpeza automática do cache a cada 60 segundos
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanExpiredCache();
    }, 60000);
  }

  /**
   * Limpa listeners anteriores para evitar duplicação
   */
  cleanup() {
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
    }
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
    }
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    
    // Limpar caches e requisições pendentes
    this.clearCache();
    this.cancelPendingRequests();
  }

  /**
   * Intercepta cliques em links de navegação e menus
   */
  interceptNavigation() {
    // Remover listener existente se houver para evitar duplicação
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
    }
    
    // Criar novo handler
    this.clickHandler = (event) => {
      // Verificar se já está processando um clique
      if (this.isProcessingClick) {
        console.log('⚠️ Clique ignorado - já processando outro clique');
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      let target = event.target;
      
      // Procurar o link mais próximo
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target || target.tagName !== 'A') return;

      // Verificar se é um link interno
      const href = target.getAttribute('href');
      
      if (!href || 
          href.startsWith('#') || 
          href.startsWith('http') || 
          href.startsWith('mailto:') ||
          href.includes('/logout') ||
          href.includes('/login')) {
        return; // Deixar comportamento padrão
      }

      // Verificar se é um link do menu ou de navegação interna
      try {
        const isMenuLink = target.closest('.menu-item') || 
                          target.closest('#menu-dinamico') ||
                          target.closest('.br-menu') ||
                          (target.classList && target.classList.contains('nav-link')) ||
                          target.dataset.spa === 'true' ||
                          target.dataset.menuItem === 'true';

        if (isMenuLink) {
          // Verificar se este link específico foi clicado recentemente com debounce mais agressivo
          const linkKey = `link_${href}`;
          const now = Date.now();
          
          if (this[linkKey] && (now - this[linkKey]) < 2000) { // 2 segundos de debounce
            console.log('⚠️ Clique duplicado ignorado para:', href, `(${now - this[linkKey]}ms)`);
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          
          // Verificar se há uma requisição pendente para esta rota
          if (this.pendingRequests.has(href)) {
            console.log('⚠️ Clique ignorado - requisição pendente para:', href);
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          
          // Marcar que estamos processando um clique
          this.isProcessingClick = true;
          this[linkKey] = now;
          
          // Parar imediatamente a propagação do evento
          event.preventDefault();
          event.stopImmediatePropagation();
          
          console.log('🔗 Link interceptado:', href);
          
          // Navegar e resetar flag
          this.navigateTo(href).finally(() => {
            setTimeout(() => {
              this.isProcessingClick = false;
            }, 200); // Delay maior para garantir
          });
        }
      } catch (error) {
        this.isProcessingClick = false;
        console.warn('Erro na interceptação de navegação:', error);
      }
    };
    
    // Adicionar listener com prioridade máxima
    document.addEventListener('click', this.clickHandler, {
      capture: true,
      passive: false
    });
  }

  /**
   * Navega para uma nova rota
   */
  async navigateTo(route) {
    const now = Date.now();
    
    // Evitar navegação se já está carregando
    if (this.isLoading) {
      console.log('⚠️ Navegação ignorada - já carregando:', route);
      return;
    }
    
    // Verificar se é a mesma rota atual
    if (route === this.currentRoute) {
      console.log('⚠️ Navegação ignorada - mesma rota:', route);
      return;
    }
    
    // Evitar cliques duplos com debounce mais agressivo
    if (now - this.lastNavigationTime < 500) {
      console.log('⚠️ Navegação ignorada (debounce):', route, `${now - this.lastNavigationTime}ms desde última`);
      return;
    }
    
    // Verificar se há uma requisição pendente para esta rota
    if (this.pendingRequests.has(route)) {
      console.log('⚠️ Navegação ignorada - requisição já pendente:', route);
      return;
    }
    
    // Verificar se a mesma rota foi chamada recentemente
    if (this.pendingRoute === route) {
      console.log('⚠️ Navegação ignorada - rota pendente:', route);
      return;
    }
    
    this.lastNavigationTime = now;
    this.pendingRoute = route;

    console.log('🔄 Navegando para:', route);
    
    try {
      await this.loadPage(route, true);
    } catch (error) {
      console.error('Erro na navegação SPA:', error);
      // Fallback para navegação tradicional
      window.location.href = route;
    } finally {
      this.pendingRoute = null; // Limpar rota pendente
    }
  }

  /**
   * Carrega o conteúdo de uma página via AJAX
   */
  async loadPage(route, updateHistory = true) {
    if (this.isLoading) {
      console.log('⚠️ loadPage ignorado - já carregando');
      return;
    }

    // Verificar se já existe uma requisição pendente para esta rota
    if (this.pendingRequests.has(route)) {
      console.log('⚠️ loadPage ignorado - requisição já pendente para:', route);
      return this.pendingRequests.get(route);
    }

    this.isLoading = true;
    this.showLoading();

    // Criar a promise da requisição e armazená-la
    const requestPromise = this._fetchPageContent(route, updateHistory);
    this.pendingRequests.set(route, requestPromise);

    try {
      console.log('📡 Carregando página:', route);
      
      const data = await requestPromise;
      
      // Atualizar o conteúdo
      this.updateContent(data);
      
      // Atualizar histórico do browser
      if (updateHistory) {
        const state = { route: route };
        window.history.pushState(state, '', route);
      }
      
      this.currentRoute = route;
      
      // Atualizar menu ativo
      this.updateActiveMenu(route);
      
      // Executar scripts da página se necessário
      this.executePageScripts(data);

      // Armazenar no cache para requisições futuras (com TTL de 30 segundos)
      this.requestCache.set(route, {
        data: data,
        timestamp: Date.now(),
        ttl: 30000 // 30 segundos
      });

    } catch (error) {
      console.error('Erro ao carregar página:', error);
      throw error;
    } finally {
      this.isLoading = false;
      this.hideLoading();
      // Remover da lista de requisições pendentes
      this.pendingRequests.delete(route);
    }
  }

  /**
   * Executa a requisição HTTP para buscar o conteúdo da página
   */
  async _fetchPageContent(route, updateHistory) {
    // Verificar cache primeiro
    const cached = this.requestCache.get(route);
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      console.log('📋 Usando conteúdo do cache para:', route);
      return cached.data;
    }

    // Fazer requisição para obter apenas o conteúdo
    const response = await fetch(route, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-SPA-Request': 'true',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Atualiza o conteúdo principal da página
   */
  updateContent(data) {
    const mainContent = document.querySelector('main.br-main .container-lg');
    
    if (mainContent && data.content) {
      // Fade out
      mainContent.style.opacity = '0';
      
      setTimeout(() => {
        mainContent.innerHTML = data.content;
        
        // Atualizar título se fornecido
        if (data.title) {
          document.title = data.title;
        }
        
        // Executar scripts inline que estão no conteúdo
        this.executeInlineScripts();
        
        // Verificar se precisamos inicializar módulos específicos baseado na rota
        this.initializePageModules(data.route);
        
        // Fade in
        mainContent.style.opacity = '1';
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
      }, 150);
    }
  }

  /**
   * Inicializa módulos específicos baseado na rota atual
   */
  initializePageModules(route) {
    if (!route) return;
    
    // Aguardar o DOM estar pronto antes de inicializar módulos
    setTimeout(() => {
      // Página de Indicadores
      if (route.includes('/indicadores') && window.App) {
        // Evitar execução dupla
        const now = Date.now();
        if (this.lastIndicadoresPageInit && (now - this.lastIndicadoresPageInit) < 2000) {
          console.log('⚠️ initializePageModules Indicadores ignorado - muito recente');
          return;
        }
        
        if (typeof window.App.autoInit === 'function') {
          console.log('🔧 Inicializando Indicadores para rota:', route);
          this.lastIndicadoresPageInit = now;
          
          try {
            window.App.autoInit();
            console.log('✅ Indicadores inicializado via initializePageModules!');
          } catch (error) {
            console.error('Erro ao inicializar Indicadores via initializePageModules:', error);
          }
        }
      }
      
      // Página de Dashboard 
      else if (route.includes('/dashboard') && window.App) {
        if (typeof window.App.initDashboard === 'function') {
          console.log('🔧 Inicializando Dashboard para rota:', route);
          try {
            window.App.initDashboard();
            console.log('✅ Dashboard inicializado via initializePageModules!');
          } catch (error) {
            console.error('Erro ao inicializar Dashboard via initializePageModules:', error);
          }
        }
      }
      
      // Página de KPIs
      else if (route.includes('/kpis') && window.App) {
        if (typeof window.App.kpisInit === 'function') {
          console.log('🔧 Inicializando KPIs para rota:', route);
          try {
            window.App.kpisInit();
            console.log('✅ KPIs inicializado via initializePageModules!');
          } catch (error) {
            console.error('Erro ao inicializar KPIs via initializePageModules:', error);
          }
        }
      }
    }, 250); // Delay maior para garantir que o DOM esteja pronto
  }

  /**
   * Executa scripts inline que estão no conteúdo carregado
   */
  executeInlineScripts() {
    const scripts = document.querySelectorAll('main.br-main script');
    scripts.forEach(script => {
      try {
        if (script.textContent.trim()) {
          console.log('🔧 Executando script inline...');
          // Criar novo script para executar o código
          const newScript = document.createElement('script');
          newScript.textContent = script.textContent;
          document.head.appendChild(newScript);
          // Remover após execução
          setTimeout(() => newScript.remove(), 100);
        }
      } catch (error) {
        console.warn('Erro ao executar script inline:', error);
      }
    });
  }

  /**
   * Atualiza o item ativo no menu
   */
  updateActiveMenu(route) {
    // Usar o método do menu se disponível
    if (window.menuApp && typeof window.menuApp.updateActiveMenuItem === 'function') {
      window.menuApp.updateActiveMenuItem();
    } else {
      // Fallback: atualização manual
      try {
        document.querySelectorAll('.menu-item').forEach(item => {
          if (item && item.classList) {
            item.classList.remove('active');
          }
        });
        
        const activeMenuItem = document.querySelector(`.menu-item[href="${route}"]`);
        if (activeMenuItem && activeMenuItem.classList) {
          activeMenuItem.classList.add('active');
        }
      } catch (error) {
        console.warn('Erro ao atualizar menu ativo:', error);
      }
    }
  }

  /**
   * Executa scripts específicos da página carregada
   */
  executePageScripts(data) {
    // Verificar se é a página de indicadores e se o módulo já está carregado globalmente
    if (data.route === '/indicadores' && window.App && window.App.autoInit) {
      // Evitar execução dupla com um flag temporal
      const now = Date.now();
      if (this.lastIndicadoresInit && (now - this.lastIndicadoresInit) < 2000) {
        console.log('⚠️ Execução de Indicadores ignorada - muito recente');
        return;
      }
      
      console.log('✅ Página Indicadores detectada - inicializando módulo já carregado...');
      this.lastIndicadoresInit = now;
      
      setTimeout(() => {
        try {
          window.App.autoInit();
          console.log('✅ Módulo Indicadores re-inicializado via SPA!');
        } catch (error) {
          console.error('Erro ao re-inicializar Indicadores:', error);
        }
      }, 200);
      return;
    }
    
    if (!data.scripts || !Array.isArray(data.scripts)) {
      return;
    }
    
    data.scripts.forEach(script => {
      if (!script.src) {
        console.warn('Script sem src:', script);
        return;
      }
      
      try {
        if (script.type === 'module') {
          // Verificar se é o dashboard e se o App já existe
          if (script.src.includes('dashboard.js')) {
            if (window.App) {
              console.log('✅ Dashboard já carregado, apenas re-inicializando...');
              this.reinitializeDashboard();
              return;
            }
          }
          
          // Verificar se é indicadores e se o App já existe
          if (script.src.includes('indicadores.js')) {
            if (window.App && window.App.autoInit) {
              // Evitar execução dupla
              const now = Date.now();
              if (this.lastIndicadoresScriptInit && (now - this.lastIndicadoresScriptInit) < 2000) {
                console.log('⚠️ Script Indicadores ignorado - muito recente');
                return;
              }
              
              console.log('✅ Indicadores já carregado, apenas re-inicializando...');
              this.lastIndicadoresScriptInit = now;
              
              setTimeout(() => {
                try {
                  window.App.autoInit();
                  console.log('✅ Módulo Indicadores re-inicializado!');
                } catch (error) {
                  console.error('Erro ao re-inicializar Indicadores:', error);
                }
              }, 200);
              return;
            }
          }
          
          // Garantir que o caminho seja absoluto e válido
          let scriptUrl = script.src;
          if (!scriptUrl.startsWith('http') && !scriptUrl.startsWith('/')) {
            scriptUrl = '/' + scriptUrl;
          }
          
          // Importar e inicializar módulo
          import(scriptUrl).then(module => {
            console.log('✅ Módulo carregado:', scriptUrl);
            
            // Se for o dashboard, inicializar automaticamente
            if (scriptUrl.includes('dashboard.js')) {
              this.initializeDashboard(module.default);
            } else if (scriptUrl.includes('indicadores.js')) {
              // Para indicadores, chamar autoInit diretamente
              if (module.default && typeof module.default.autoInit === 'function') {
                console.log('🔧 Inicializando módulo Indicadores:', scriptUrl);
                setTimeout(() => {
                  module.default.autoInit();
                }, 200);
              }
            } else {
              // Para outros módulos, chamar autoInit se existir
              if (module.default && typeof module.default.autoInit === 'function') {
                console.log('🔧 Inicializando módulo genérico:', scriptUrl);
                module.default.autoInit();
              }
            }
          }).catch(error => {
            console.warn(`⚠️ Falha ao carregar módulo ${scriptUrl}:`, error.message);
          });
        } else {
          const scriptElement = document.createElement('script');
          scriptElement.src = script.src;
          scriptElement.defer = true;
          scriptElement.onerror = () => console.warn('⚠️ Falha ao carregar script:', script.src);
          document.head.appendChild(scriptElement);
        }
      } catch (error) {
        console.error('Erro ao processar script:', script, error);
      }
    });

    // Executar callback de inicialização da página se existir
    if (data.initCallback && typeof window[data.initCallback] === 'function') {
      window[data.initCallback]();
    }
  }

  /**
   * Re-inicializa o dashboard quando já está carregado
   */
  reinitializeDashboard() {
    if (window.App) {
      console.log('🔄 Re-inicializando Dashboard existente...');
      
      // Limpar possíveis timeouts/intervals anteriores
      this.clearDashboardTimers();
      
      // Re-inicializar componentes principais com delay maior
      setTimeout(() => {
        try {
          // Usar o método principal de inicialização do dashboard
          if (typeof window.App.initDashboard === 'function') {
            console.log('🔧 Chamando App.initDashboard...');
            window.App.initDashboard();
          }
          
          // Backup: inicializar gráficos de vigência separadamente
          if (typeof window.App.initVigenciaGauges === 'function') {
            console.log('🔧 Inicializando gráficos de vigência...');
            window.App.initVigenciaGauges();
          }
          
          // Backup: recarregar dashboard completo
          if (typeof window.App.reloadDashboard === 'function') {
            console.log('🔧 Recarregando dashboard...');
            window.App.reloadDashboard();
          }
          
          console.log('✅ Dashboard re-inicializado!');
        } catch (error) {
          console.error('Erro ao re-inicializar dashboard:', error);
        }
      }, 300);
    }
  }

  /**
   * Força a inicialização de todos os cards do dashboard
   */
  forceCardInitialization() {
    // Procurar por cards com loading e tentar inicializá-los
    const cardContainers = [
      'card-contratos-container',
      'card-contratos-exercicio-container', 
      'card-representacao-anual-valores',
      'card-proximas-atividades'
    ];
    
    cardContainers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        console.log(`🔧 Inicializando card: ${containerId}`);
        
        // Verificar se existe método específico para este card
        const methodName = this.getCardMethod(containerId);
        if (window.App && typeof window.App[methodName] === 'function') {
          try {
            window.App[methodName]();
          } catch (error) {
            console.warn(`Erro ao inicializar ${methodName}:`, error);
          }
        }
      }
    });
  }

  /**
   * Mapeia container ID para método de inicialização
   */
  getCardMethod(containerId) {
    const methodMap = {
      'card-contratos-container': 'loadContractsCard',
      'card-contratos-exercicio-container': 'loadContractsExercicioCard',
      'card-representacao-anual-valores': 'loadRepresentacaoAnualCard', 
      'card-proximas-atividades': 'loadProximasAtividadesCard'
    };
    
    return methodMap[containerId] || 'reloadDashboard';
  }

  /**
   * Inicializa o módulo do dashboard pela primeira vez
   */
  initializeDashboard(dashboardModule) {
    if (dashboardModule) {
      console.log('🔧 Inicializando Dashboard pela primeira vez...');
      
      // Expor globalmente para compatibilidade
      window.App = dashboardModule;
      
      // Aguardar o DOM estar pronto antes de inicializar
      setTimeout(() => {
        try {
          // Usar o método principal de inicialização
          if (typeof dashboardModule.initDashboard === 'function') {
            console.log('🔧 Chamando dashboardModule.initDashboard...');
            dashboardModule.initDashboard();
          }
          
          // Backup: inicializar componentes individuais
          if (typeof dashboardModule.initVigenciaGauges === 'function') {
            dashboardModule.initVigenciaGauges();
          }
          
          if (typeof dashboardModule.reloadDashboard === 'function') {
            dashboardModule.reloadDashboard();
          }
          
          console.log('✅ Dashboard inicializado pela primeira vez!');
        } catch (error) {
          console.error('Erro ao inicializar dashboard:', error);
        }
      }, 100);
    }
  }

  /**
   * Limpa timers do dashboard para evitar conflitos
   */
  clearDashboardTimers() {
    // Limpar possíveis setTimeouts/setIntervals que podem estar rodando
    if (window._dashboardTimers) {
      window._dashboardTimers.forEach(timer => clearTimeout(timer));
      window._dashboardTimers = [];
    }
  }

  /**
   * Mostra indicador de carregamento
   */
  showLoading() {
    const mainContent = document.querySelector('main.br-main .container-lg');
    if (mainContent) {
      mainContent.style.transition = 'opacity 0.15s ease';
      mainContent.style.opacity = '0.6';
      mainContent.style.pointerEvents = 'none';
    }

    // Mostrar loader no canto da tela
    this.createMiniLoader();
  }

  /**
   * Esconde indicador de carregamento
   */
  hideLoading() {
    const mainContent = document.querySelector('main.br-main .container-lg');
    if (mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.pointerEvents = 'auto';
    }

    this.removeMiniLoader();
  }

  /**
   * Cria um mini loader para indicar carregamento SPA
   */
  createMiniLoader() {
    if (document.getElementById('spa-mini-loader')) return;

    const loader = document.createElement('div');
    loader.id = 'spa-mini-loader';
    loader.innerHTML = `
      <div class="spa-loader-content">
        <div class="spa-loader-spinner"></div>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      #spa-mini-loader {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: rgba(19, 81, 180, 0.95);
        border-radius: 50px;
        padding: 8px 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        font-size: 12px;
        animation: slideInRight 0.3s ease;
      }
      
      .spa-loader-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-left: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(loader);
  }

  /**
   * Remove o mini loader
   */
  removeMiniLoader() {
    const loader = document.getElementById('spa-mini-loader');
    if (loader) {
      loader.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => loader.remove(), 300);
    }
  }

  /**
   * Força recarregamento de uma página (útil para debug)
   */
  forceReload() {
    window.location.reload();
  }

  /**
   * Obtém a rota atual
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Verifica se o router está carregando
   */
  isPageLoading() {
    return this.isLoading;
  }

  /**
   * Limpa o cache de requisições
   */
  clearCache() {
    this.requestCache.clear();
    console.log('🗑️ Cache de requisições limpo');
  }

  /**
   * Remove entradas antigas do cache
   */
  cleanExpiredCache() {
    const now = Date.now();
    for (const [route, cached] of this.requestCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.requestCache.delete(route);
        console.log('🗑️ Cache expirado removido para:', route);
      }
    }
  }

  /**
   * Cancela todas as requisições pendentes
   */
  cancelPendingRequests() {
    console.log('🚫 Cancelando requisições pendentes:', this.pendingRequests.size);
    this.pendingRequests.clear();
  }

  /**
   * Debug - mostra estado atual do router
   */
  getDebugInfo() {
    return {
      isLoading: this.isLoading,
      isProcessingClick: this.isProcessingClick,
      currentRoute: this.currentRoute,
      pendingRoute: this.pendingRoute,
      cacheSize: this.requestCache.size,
      pendingRequestsCount: this.pendingRequests.size,
      lastNavigationTime: this.lastNavigationTime
    };
  }
}

// Exportar para uso global
window.SPARouter = SPARouter;

export default SPARouter;
