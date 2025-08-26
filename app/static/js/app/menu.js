export default {
  // Variável para controlar execuções múltiplas
  lastAutoInitTime: 0,
  isInitializing: false,
  
  // Development-only menu items
  devMenuItems: [],

  // Auto-inicialização
  autoInit() {
    console.log('🔧 Menu.autoInit() chamado');
    
    // Evitar execuções múltiplas muito próximas (debounce de 1 segundo)
    const now = Date.now();
    if (now - this.lastAutoInitTime < 1000) {
      console.log('🔄 Menu autoInit executado recentemente, ignorando');
      return;
    }
    
    // Evitar sobreposição de execuções
    if (this.isInitializing) {
      console.log('🔄 Menu já está sendo inicializado, ignorando');
      return;
    }
    
    this.lastAutoInitTime = now;
    this.isInitializing = true;
    
    const menuContainer = document.getElementById('menu-dynamic-container');
    console.log('🔍 Elemento #menu-dynamic-container encontrado:', !!menuContainer);
    
    if (menuContainer) {
      console.log('🎯 Inicializando menu...');
      this.renderMenuHTML();
      // Simples: espera renderizar e chama a função original
      setTimeout(() => {
        this.menu();
        this.displayUasgs();
        this.isInitializing = false;
        console.log('✅ Menu initialized successfully');
        
        // Adicionar listener para mudanças de UASG
        this.setupUasgChangeListener();
      }, 100);
    } else {
      console.log('⚠️ Container #menu-dynamic-container não encontrado, menu não será inicializado');
      this.isInitializing = false;
    }
  },

  // Configura listener para mudanças de UASG
  setupUasgChangeListener() {
    // Escutar eventos de mudança de UASG
    document.addEventListener('unidadeSelected', () => {
      console.log('🔄 UASG atualizada, recarregando exibição no menu');
      setTimeout(() => this.displayUasgs(), 100);
    });
    
    document.addEventListener('unidadeCleared', () => {
      console.log('🔄 UASG removida, ocultando exibição no menu');
      const displayContainer = document.getElementById('menu-uasgs-display');
      if (displayContainer) {
        displayContainer.style.display = 'none';
      }
    });
  },

  // Renderiza HTML do menu
  renderMenuHTML() {
    const container = document.getElementById('menu-dynamic-container');
    if (!container) return;
    
    container.innerHTML = `
      <nav class="br-menu push" id="main-navigation">
        <div class="menu-header">
          <div class="menu-title">
            <img src="/static/images/govbr-logo.png" alt="Logo" style="height: 40px; margin-right: 10px;">
            Compras Executivo
          </div>
          <div class="menu-close">
            <button class="br-button circle" type="button" aria-label="Fechar o menu" data-dismiss="menu">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <nav class="menu-body" role="tree">
          <!-- UASG Display Section -->
          <div id="menu-uasgs-display">
            <div id="menu-uasgs-list">
              <!-- UASGs will be dynamically inserted here -->
            </div>
          </div>
          <div id="menu-dinamico"></div>
        </nav>
      </nav>
    `;

    // Criar tooltip separado no body se não existir
    if (!document.getElementById('menu-uasgs-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.id = 'menu-uasgs-tooltip';
      tooltip.style.display = 'none';
      document.body.appendChild(tooltip);
    }
  },

  // Check if we're in development mode
  isDevelopmentMode() {
    // Method 1: Check hostname
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("dev")
    ) {
      return true;
    }

    // Method 2: Check port (development usually runs on non-standard ports)
    if (
      window.location.port === "8000" ||
      window.location.port === "8001" ||
      window.location.port === "5000"
    ) {
      return true;
    }

    // Method 3: Check for development flag in localStorage
    if (localStorage.getItem("dev_mode") === "true") {
      return true;
    }

    // Method 4: Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("dev") === "true") {
      return true;
    }

    return false;
  },

  // Get menu items from session or show error message
  getSessionMenuItems() {
    const container = document.getElementById('menu-dynamic-container');
    if (container) {
      const sessionMenuData = container.getAttribute('data-session-menu');
      console.log('🔍 Raw session menu data:', sessionMenuData);
      
      if (sessionMenuData && sessionMenuData.trim() !== '' && sessionMenuData !== '[]') {
        try {
          const sessionMenu = JSON.parse(sessionMenuData);
          // Se há menu na sessão, usar ele
          if (sessionMenu && Array.isArray(sessionMenu) && sessionMenu.length > 0) {
            console.log('🍽️ Usando menu da sessão:', sessionMenu);
            return sessionMenu;
          } else {
            console.log('🍽️ Menu da sessão está vazio ou inválido:', sessionMenu);
          }
        } catch (e) {
          console.warn('❌ Erro ao parsear menu da sessão:', e);
          console.warn('📄 Dados que causaram erro:', sessionMenuData);
        }
      } else {
        console.log('🍽️ Nenhum menu encontrado na sessão ou menu vazio');
      }
    } else {
      console.log('❌ Container menu-dynamic-container não encontrado');
    }
    
    // Se não conseguiu pegar da sessão, retorna null para mostrar mensagem de erro
    console.log('❌ Não foi possível carregar o menu da sessão');
    return null;
  },

  // Get menu items based on environment
  getMenuItems() {
    // Primeiro tenta pegar da sessão
    const sessionItems = this.getSessionMenuItems();
    
    // Se não conseguiu pegar da sessão, retorna null para mostrar erro
    if (!sessionItems) {
      return null;
    }
    
    let items = [...sessionItems];

    // Add development items if in development mode
    if (this.isDevelopmentMode()) {
      // Insert dev items before "Sair" (last item)
      const sairIndex = items.findIndex((item) => item.texto === "Sair");
      if (sairIndex !== -1) {
        items.splice(sairIndex, 0, ...this.devMenuItems);
      } else {
        items.push(...this.devMenuItems);
      }
    }

    return items;
  },

  menu() {
    const container = document.getElementById("menu-dinamico");
    if (container) {
      container.innerHTML = "";

      // Use getMenuItems() instead of this.menuItems
      const menuItems = this.getMenuItems();

      // Se não conseguiu carregar o menu, mostra mensagem bonitinha
      if (!menuItems) {
        container.innerHTML = `
          <div class="menu-error-loading">
            <div class="menu-error-loading-spinner">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h5>Menu Indisponível</h5>
            <p>Não foi possível carregar o menu<br><span class="menu-error-loading-dots"><span></span><span></span><span></span></span></p>
          </div>
        `;
        return; // Para aqui se não tem menu
      }

      // Se tem menu, renderiza normalmente
      for (const item of menuItems) {
        const link = document.createElement("a");
        link.href = item.url;
        link.className = "menu-item";
        link.setAttribute("role", "treeitem");
        
        // Adicionar atributo para SPA navigation
        link.dataset.spa = "true";

                // Configurar o link como SPA
        link.dataset.spa = "true";
        link.dataset.originalHref = item.url; // Salvar href original

        // Verifica se é a página atual para marcar como ativo
        const currentPath = window.location.pathname;
        const itemPath = new URL(item.url, window.location.origin).pathname;
        
        // Diferentes cenários para considerar um item como ativo:
        let isActive = false;
        
        // 1. URL exata
        if (currentPath === itemPath) {
          isActive = true;
        }
        // 2. URL raiz vs /minha-conta
        else if ((currentPath === '/' && itemPath === '/minha-conta') || 
                 (currentPath === '/minha-conta' && itemPath === '/')) {
          isActive = true;
        }
        // 3. URL contém o caminho do item (para subpáginas)
        else if (itemPath !== '/' && itemPath !== '/minha-conta' && currentPath.startsWith(itemPath)) {
          // Verifica se é realmente uma subpágina (próximo caractere é / ou fim da string)
          const nextChar = currentPath.charAt(itemPath.length);
          if (nextChar === '/' || nextChar === '' || nextChar === '?' || nextChar === '#') {
            isActive = true;
          }
        }

        if (isActive) {
          link.classList.add("active");
          // Remove o href para tornar não clicável
          link.removeAttribute("href");
          link.style.cursor = "default";
          link.style.pointerEvents = "none";
          
          // Adiciona evento para prevenir clique
          link._clickHandler = function(e) {
            e.preventDefault();
            return false;
          };
          link.addEventListener('click', link._clickHandler);
        } else {
          // Garantir que itens não ativos sejam clicáveis
          link.style.cursor = "pointer";
          link.style.pointerEvents = "auto";
          
          // Adicionar marcação para o SPA Router identificar como link do menu
          link.dataset.spa = "true";
          link.dataset.menuItem = "true";
          
          // Remover qualquer listener anterior se existir
          if (link._clickHandler) {
            link.removeEventListener('click', link._clickHandler);
            link._clickHandler = null;
          }
        }

        link.innerHTML = `
          <span class="icon"><i class="${item.icone}" aria-hidden="true"></i></span>
          <span class="content">${item.texto}</span>
        `;
        container.appendChild(link);
      }
    }

    // Funcionalidade: abrir/fechar menu - REMOVIDO PARA EVITAR CONFLITO COM HEADER.JS
    // const menu = document.getElementById("main-navigation");
    // const body = document.body;
    // const menuButtons = document.querySelectorAll(
    //   'button[aria-label="Abrir Menu"], button[aria-label="Fechar Menu"]'
    // );

    // if (menuButtons.length && menu) {
    //   menuButtons.forEach((menuButton) => {
    //     // Remover listeners antigos antes de adicionar novos para evitar duplicação
    //     const existingHandler = menuButton._menuToggleHandler;
    //     if (existingHandler) {
    //       menuButton.removeEventListener("click", existingHandler);
    //     }
        
    //     // Criar novo handler e armazenar referência
    //     const newHandler = () => {
    //       const isOpen = menu.classList.contains("active");
    //       menu.classList.toggle("active", !isOpen);
    //       body.classList.toggle("menu-open", !isOpen);
          
    //       // Atualiza todos os botões
    //       menuButtons.forEach((btn) => {
    //         btn.innerHTML = isOpen
    //           ? "<span>&#9776;</span>"
    //           : "<span>&times;</span>";
    //         btn.setAttribute('aria-label', isOpen ? 'Abrir Menu' : 'Fechar Menu');
    //       });
    //     };
        
    //     menuButton._menuToggleHandler = newHandler;
    //     menuButton.addEventListener("click", newHandler);
    //   });
    // }
  },

  // Ativa/desativa campo de busca no mobile
  initBuscaMobile() {
    const botaoAbrir = document.getElementById("abrir-pesquisa");
    const botaoFechar = document.getElementById("fechar-pesquisa");
    const campoBusca = document.getElementById("busca-mobile");
    const campoInput = document.getElementById("campo-pesquisa-mobile");

    if (botaoAbrir && botaoFechar && campoBusca) {
      botaoAbrir.addEventListener("click", function () {
        document.getElementById("header-esquerda").style.display = "none";
        document.getElementById("header-direita-desktop").style.display =
          "none";
        botaoAbrir.style.display = "none";
        campoBusca.style.display = "flex";
        campoInput.focus();
      });

      botaoFechar.addEventListener("click", function () {
        document.getElementById("header-esquerda").style.display = "";
        document.getElementById("header-direita-desktop").style.display = "";
        botaoAbrir.style.display = "";
        campoBusca.style.display = "none";
      });
    }
  },

  // Atualiza o item ativo do menu (usado pelo SPA Router)
  updateActiveMenuItem() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.menu-item[data-spa="true"]');
    
    menuItems.forEach(link => {
      const itemPath = new URL(link.dataset.originalHref || link.href, window.location.origin).pathname;
      
      // Salvar href original se não foi salvo ainda
      if (!link.dataset.originalHref) {
        link.dataset.originalHref = link.href;
      }
      
      // Diferentes cenários para considerar um item como ativo:
      let isActive = false;
      
      // 1. URL exata
      if (currentPath === itemPath) {
        isActive = true;
      }
      // 2. URL raiz vs /minha-conta
      else if ((currentPath === '/' && itemPath === '/minha-conta') || 
               (currentPath === '/minha-conta' && itemPath === '/')) {
        isActive = true;
      }
      // 3. URL contém o caminho do item (para subpáginas)
      else if (itemPath !== '/' && itemPath !== '/minha-conta' && currentPath.startsWith(itemPath)) {
        // Verifica se é realmente uma subpágina (próximo caractere é / ou fim da string)
        const nextChar = currentPath.charAt(itemPath.length);
        if (nextChar === '/' || nextChar === '' || nextChar === '?' || nextChar === '#') {
          isActive = true;
        }
      }

      if (isActive) {
        // Item ativo
        link.classList.add("active");
        link.removeAttribute("href");
        link.style.cursor = "default";
        link.style.pointerEvents = "none";
        
        // Remover listener anterior se existir
        if (link._clickHandler) {
          link.removeEventListener('click', link._clickHandler);
        }
        
        // Adicionar evento para prevenir clique
        link._clickHandler = function(e) {
          e.preventDefault();
          return false;
        };
        link.addEventListener('click', link._clickHandler);
      } else {
        // Item não ativo - restaurar clicabilidade
        link.classList.remove("active");
        link.href = link.dataset.originalHref;
        link.style.cursor = "pointer";
        link.style.pointerEvents = "auto"; // Garantir que é clicável
        
        // Adicionar marcação para o SPA Router identificar como link do menu
        link.dataset.spa = "true";
        link.dataset.menuItem = "true";
        
        // Remover listener de prevenção de clique se existir
        if (link._clickHandler) {
          link.removeEventListener('click', link._clickHandler);
          link._clickHandler = null;
        }
      }
    });
  },

  // Exibe as UASGs do usuário no menu
  async displayUasgs() {
    try {
      // Criar tooltip se não existir
      this.createTooltipIfNeeded();
      
      // Obter UASGs do atributo data-uasgs do body
      const bodyUasgs = document.body.getAttribute('data-uasgs');
      console.log('🔍 UASGs encontradas no body:', bodyUasgs);
      
      if (!bodyUasgs || bodyUasgs.trim() === '') {
        console.log('📄 Nenhuma UASG encontrada na sessão');
        return;
      }
      
      const uasgCodes = bodyUasgs.split(',').map(code => code.trim()).filter(code => code !== '');
      
      if (uasgCodes.length === 0) {
        console.log('📄 Lista de UASGs vazia');
        return;
      }
      
      console.log('🏢 Buscando informações das UASGs:', uasgCodes);
      
      // Buscar informações das UASGs
      const response = await fetch(`/uasg-filter/search?codes=${uasgCodes.join(',')}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        this.renderUasgDisplay(data.data);
      } else {
        console.warn('⚠️ Erro ao buscar informações das UASGs:', data.message);
        // Fallback: exibir apenas os códigos
        this.renderUasgDisplayFallback(uasgCodes);
      }
      
    } catch (error) {
      console.error('❌ Erro ao exibir UASGs:', error);
      // Fallback: tentar exibir apenas os códigos se estão disponíveis
      const bodyUasgs = document.body.getAttribute('data-uasgs');
      if (bodyUasgs && bodyUasgs.trim() !== '') {
        const uasgCodes = bodyUasgs.split(',').map(code => code.trim()).filter(code => code !== '');
        if (uasgCodes.length > 0) {
          this.renderUasgDisplayFallback(uasgCodes);
        }
      }
    }
  },

  // Renderiza a exibição das UASGs com informações completas
  renderUasgDisplay(uasgs) {
    const displayContainer = document.getElementById('menu-uasgs-display');
    const listContainer = document.getElementById('menu-uasgs-list');
    
    if (!displayContainer || !listContainer) {
      console.warn('⚠️ Containers da exibição de UASGs não encontrados');
      return;
    }
    
    // Limpar lista atual
    listContainer.innerHTML = '';
    
    const maxVisible = 3;
    const hasMore = uasgs.length > maxVisible;
    const visibleUasgs = uasgs.slice(0, maxVisible);
    const hiddenUasgs = uasgs.slice(maxVisible);
    
    // Renderizar UASGs visíveis
    visibleUasgs.forEach((uasg, index) => {
      const uasgElement = this.createUasgElement(uasg);
      listContainer.appendChild(uasgElement);
    });
    
    // Se há mais UASGs, adicionar indicador com tooltip
    if (hasMore) {
      const moreIndicator = this.createMoreIndicator(hiddenUasgs.length, uasgs);
      listContainer.appendChild(moreIndicator);
    }
    
    // Mostrar o container
    displayContainer.style.display = 'block';
    
    console.log(`✅ Exibindo ${visibleUasgs.length} UASGs no menu (${hiddenUasgs.length} ocultas)`);
  },

  // Renderiza a exibição das UASGs apenas com códigos (fallback)
  renderUasgDisplayFallback(uasgCodes) {
    const displayContainer = document.getElementById('menu-uasgs-display');
    const listContainer = document.getElementById('menu-uasgs-list');
    
    if (!displayContainer || !listContainer) {
      console.warn('⚠️ Containers da exibição de UASGs não encontrados');
      return;
    }
    
    // Limpar lista atual
    listContainer.innerHTML = '';
    
    const maxVisible = 3;
    const hasMore = uasgCodes.length > maxVisible;
    const visibleCodes = uasgCodes.slice(0, maxVisible);
    const hiddenCodes = uasgCodes.slice(maxVisible);
    
    // Renderizar códigos visíveis
    visibleCodes.forEach(code => {
      const uasgElement = this.createUasgElementFallback(code);
      listContainer.appendChild(uasgElement);
    });
    
    // Se há mais códigos, adicionar indicador com tooltip
    if (hasMore) {
      const moreIndicator = this.createMoreIndicatorFallback(hiddenCodes.length, uasgCodes);
      listContainer.appendChild(moreIndicator);
    }
    
    // Mostrar o container
    displayContainer.style.display = 'block';
    
    console.log(`✅ Exibindo ${visibleCodes.length} UASGs no menu (fallback - ${hiddenCodes.length} ocultas)`);
  },

  // Cria elemento individual de UASG
  createUasgElement(uasg) {
    const div = document.createElement('div');
    div.className = 'menu-uasg-item';
    
    const truncatedName = uasg.nomeresumido && uasg.nomeresumido.length > 20 
      ? uasg.nomeresumido.substring(0, 20) + '...' 
      : uasg.nomeresumido || 'Nome não disponível';
    
    div.innerHTML = `
      <i class="fas fa-building"></i>
      <span class="menu-uasg-code">${uasg.codigo}</span>
      <span class="menu-uasg-name">- ${truncatedName}</span>
    `;
    
    return div;
  },

  // Cria elemento individual de UASG (fallback)
  createUasgElementFallback(code) {
    const div = document.createElement('div');
    div.className = 'menu-uasg-item';
    
    div.innerHTML = `
      <i class="fas fa-building"></i>
      <span class="menu-uasg-code">${code}</span>
      <span class="menu-uasg-name">- Carregando...</span>
    `;
    
    return div;
  },

  // Cria indicador "mais UASGs"
  createMoreIndicator(hiddenCount, allUasgs) {
    const div = document.createElement('div');
    div.className = 'menu-uasg-more';
    
    div.innerHTML = `
      <i class="fas fa-ellipsis-h"></i>
      <span class="menu-uasg-more-text">+${hiddenCount} mais</span>
    `;
    
    // Adicionar eventos de tooltip com delay
    div.addEventListener('mouseenter', (e) => {
      clearTimeout(this.hideTimeout);
      this.tooltipTimeout = setTimeout(() => {
        this.showUasgTooltip(e, allUasgs);
      }, 300); // 300ms delay antes de mostrar
    });
    
    div.addEventListener('mouseleave', () => {
      clearTimeout(this.tooltipTimeout);
      this.hideTimeout = setTimeout(() => {
        this.hideUasgTooltip();
      }, 500); // 500ms delay antes de esconder
    });
    
    return div;
  },

  // Cria indicador "mais UASGs" (fallback)
  createMoreIndicatorFallback(hiddenCount, allCodes) {
    const div = document.createElement('div');
    div.className = 'menu-uasg-more';
    
    div.innerHTML = `
      <i class="fas fa-ellipsis-h"></i>
      <span class="menu-uasg-more-text">+${hiddenCount} mais</span>
    `;
    
    // Adicionar eventos de tooltip com delay
    div.addEventListener('mouseenter', (e) => {
      clearTimeout(this.hideTimeout);
      this.tooltipTimeout = setTimeout(() => {
        this.showUasgTooltipFallback(e, allCodes);
      }, 300); // 300ms delay antes de mostrar
    });
    
    div.addEventListener('mouseleave', () => {
      clearTimeout(this.tooltipTimeout);
      this.hideTimeout = setTimeout(() => {
        this.hideUasgTooltip();
      }, 500); // 500ms delay antes de esconder
    });
    
    return div;
  },

  // Cria o tooltip se não existir
  createTooltipIfNeeded() {
    if (!document.getElementById('menu-uasgs-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.id = 'menu-uasgs-tooltip';
      tooltip.style.display = 'none';
      document.body.appendChild(tooltip);
      console.log('✅ Tooltip de UASGs criado');
    }
  },

  // Mostra tooltip com todas as UASGs
  showUasgTooltip(event, allUasgs) {
    const tooltip = document.getElementById('menu-uasgs-tooltip');
    if (!tooltip) return;
    
    let tooltipContent = '<div class="menu-uasgs-tooltip-header">Todas as UASGs:</div>';
    
    allUasgs.forEach(uasg => {
      const name = uasg.nomeresumido || 'Nome não disponível';
      tooltipContent += `
        <div class="menu-uasgs-tooltip-item">
          <span class="menu-uasgs-tooltip-code">${uasg.codigo}</span>
          <span class="menu-uasgs-tooltip-name">${name}</span>
        </div>
      `;
    });
    
    tooltip.innerHTML = tooltipContent;
    tooltip.style.display = 'block';
    
    // Posicionar tooltip na altura do primeiro item das UASGs
    const menuRect = document.getElementById('main-navigation').getBoundingClientRect();
    const firstUasgItem = document.querySelector('.menu-uasg-item');
    
    if (firstUasgItem) {
      const firstItemRect = firstUasgItem.getBoundingClientRect();
      tooltip.style.left = `${menuRect.right + 10}px`;
      tooltip.style.top = `${firstItemRect.top}px`;
    } else {
      // Fallback para o container se não houver itens
      const uasgDisplayRect = document.getElementById('menu-uasgs-display').getBoundingClientRect();
      tooltip.style.left = `${menuRect.right + 10}px`;
      tooltip.style.top = `${uasgDisplayRect.top}px`;
    }

    // Adicionar eventos para manter tooltip aberto quando mouse está sobre ele
    this.setupTooltipEvents(tooltip);
  },

  // Mostra tooltip com todas as UASGs (fallback)
  showUasgTooltipFallback(event, allCodes) {
    const tooltip = document.getElementById('menu-uasgs-tooltip');
    if (!tooltip) return;
    
    let tooltipContent = '<div class="menu-uasgs-tooltip-header">Todas as UASGs:</div>';
    
    allCodes.forEach(code => {
      tooltipContent += `
        <div class="menu-uasgs-tooltip-item">
          <span class="menu-uasgs-tooltip-code">${code}</span>
          <span class="menu-uasgs-tooltip-name">Carregando...</span>
        </div>
      `;
    });
    
    tooltip.innerHTML = tooltipContent;
    tooltip.style.display = 'block';
    
    // Posicionar tooltip na altura do primeiro item das UASGs
    const menuRect = document.getElementById('main-navigation').getBoundingClientRect();
    const firstUasgItem = document.querySelector('.menu-uasg-item');
    
    if (firstUasgItem) {
      const firstItemRect = firstUasgItem.getBoundingClientRect();
      tooltip.style.left = `${menuRect.right + 10}px`;
      tooltip.style.top = `${firstItemRect.top}px`;
    } else {
      // Fallback para o container se não houver itens
      const uasgDisplayRect = document.getElementById('menu-uasgs-display').getBoundingClientRect();
      tooltip.style.left = `${menuRect.right + 10}px`;
      tooltip.style.top = `${uasgDisplayRect.top}px`;
    }

    // Adicionar eventos para manter tooltip aberto quando mouse está sobre ele
    this.setupTooltipEvents(tooltip);
  },

  // Esconde tooltip
  // Configura eventos do tooltip para permitir interação
  setupTooltipEvents(tooltip) {
    // Remove eventos anteriores para evitar duplicação
    tooltip.removeEventListener('mouseenter', this.tooltipMouseEnter);
    tooltip.removeEventListener('mouseleave', this.tooltipMouseLeave);
    
    // Adiciona novos eventos
    this.tooltipMouseEnter = () => {
      clearTimeout(this.hideTimeout);
    };
    
    this.tooltipMouseLeave = () => {
      this.hideTimeout = setTimeout(() => {
        this.hideUasgTooltip();
      }, 300); // Delay menor quando sai do tooltip
    };
    
    tooltip.addEventListener('mouseenter', this.tooltipMouseEnter);
    tooltip.addEventListener('mouseleave', this.tooltipMouseLeave);
  },

  hideUasgTooltip() {
    const tooltip = document.getElementById('menu-uasgs-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

};
