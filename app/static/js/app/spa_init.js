/**
 * Inicialização do Sistema SPA + Menu
 * Integra o SPA Router com o sistema de menu dinâmico
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inicializando sistema SPA...');
  
  // Aguardar carregamento dos módulos
  let attempts = 0;
  const maxAttempts = 50;
  
  function initializeSPA() {
    attempts++;
    
    // Verificar se o SPA Router está carregado (menuApp se auto-inicializa)
    if (window.SPARouter) {
      // Evitar criar múltiplas instâncias
      if (!window.spaRouter) {
        console.log('🔧 Criando instância do SPA Router...');
        // Inicializar SPA Router
        window.spaRouter = new window.SPARouter();
        
        // Configurar integração com menu
        setupMenuIntegration();
        
        console.log('✅ Sistema SPA inicializado com sucesso!');
      } else {
        console.log('ℹ️ SPA Router já existe, pulando inicialização');
      }
      
    } else if (attempts < maxAttempts) {
      // Tentar novamente em 100ms
      setTimeout(initializeSPA, 100);
      
    } else {
      console.warn('⚠️ Não foi possível inicializar o sistema SPA - SPARouter não encontrado');
      console.log('SPARouter disponível:', !!window.SPARouter);
    }
  }
  
  function setupMenuIntegration() {
    // Escutar mudanças de rota para atualizar menu
    window.addEventListener('popstate', function() {
      if (window.menuApp && typeof window.menuApp.updateActiveMenuItem === 'function') {
        setTimeout(() => window.menuApp.updateActiveMenuItem(), 100);
      }
    });
    
    // Observer para mudanças no menu dinâmico
    const menuContainer = document.getElementById('menu-dinamico');
    if (menuContainer) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Menu foi reconstruído, atualizar item ativo
            setTimeout(() => {
              if (window.menuApp && typeof window.menuApp.updateActiveMenuItem === 'function') {
                window.menuApp.updateActiveMenuItem();
              }
            }, 50);
          }
        });
      });
      
      observer.observe(menuContainer, {
        childList: true,
        subtree: true
      });
    }
    
    // Atualizar menu inicial após carregamento
    setTimeout(() => {
      if (window.menuApp && typeof window.menuApp.updateActiveMenuItem === 'function') {
        window.menuApp.updateActiveMenuItem();
      }
    }, 200);
  }
  
  // Iniciar tentativas de inicialização
  initializeSPA();
});

// Função global para debug
window.debugSPA = function() {
  console.log('📊 Estado do Sistema SPA:', {
    spaRouter: window.spaRouter,
    currentRoute: window.spaRouter?.getCurrentRoute(),
    isLoading: window.spaRouter?.isPageLoading(),
    menuApp: window.menuApp,
    menuItems: document.querySelectorAll('.menu-item').length,
    activeMenuItem: document.querySelector('.menu-item.active')?.textContent?.trim()
  });
};
