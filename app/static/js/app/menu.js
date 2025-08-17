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
        this.isInitializing = false;
        console.log('✅ Menu initialized successfully');
      }, 100);
    } else {
      console.log('⚠️ Container #menu-dynamic-container não encontrado, menu não será inicializado');
      this.isInitializing = false;
    }
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
          <div id="menu-dinamico"></div>
        </nav>
      </nav>
    `;
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
        // 2. URL raiz vs /inicio
        else if ((currentPath === '/' && itemPath === '/inicio') || 
                 (currentPath === '/inicio' && itemPath === '/')) {
          isActive = true;
        }
        // 3. URL contém o caminho do item (para subpáginas)
        else if (itemPath !== '/' && itemPath !== '/inicio' && currentPath.startsWith(itemPath)) {
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

    // Funcionalidade: abrir/fechar menu
    const menu = document.getElementById("main-navigation");
    const body = document.body;
    const menuButtons = document.querySelectorAll(
      'button[aria-label="Abrir Menu"], button[aria-label="Fechar Menu"]'
    );

    if (menuButtons.length && menu) {
      menuButtons.forEach((menuButton) => {
        menuButton.addEventListener("click", () => {
          const isOpen = menu.classList.contains("active");
          menu.classList.toggle("active", !isOpen);
          body.classList.toggle("menu-open", !isOpen);
          
          // Atualiza todos os botões
          menuButtons.forEach((btn) => {
            btn.innerHTML = isOpen
              ? "<span>&#9776;</span>"
              : "<span>&times;</span>";
            btn.setAttribute('aria-label', isOpen ? 'Abrir Menu' : 'Fechar Menu');
          });
        });
      });
    }
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
      // 2. URL raiz vs /inicio
      else if ((currentPath === '/' && itemPath === '/inicio') || 
               (currentPath === '/inicio' && itemPath === '/')) {
        isActive = true;
      }
      // 3. URL contém o caminho do item (para subpáginas)
      else if (itemPath !== '/' && itemPath !== '/inicio' && currentPath.startsWith(itemPath)) {
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
  }

};
