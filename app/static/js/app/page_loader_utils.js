/**
 * Utilitários para o Sistema de Loading
 * Extensões e funcionalidades adicionais para o page-loader
 */

// Listeners para eventos de loading
window.addEventListener('pageLoadComplete', function() {
  console.log('✅ Page loading completed');
  
  // Disparar eventos para componentes que dependem do loading completo
  window.dispatchEvent(new Event('initializeComponents'));
  
  // Re-habilitar scroll suave se foi desabilitado durante o loading
  document.documentElement.style.scrollBehavior = '';
});

// Utilitário para aguardar o loading estar completo
window.waitForPageLoad = function() {
  return new Promise((resolve) => {
    if (window.pageLoaderInstance && window.pageLoaderInstance.isComplete) {
      resolve();
    } else {
      window.addEventListener('pageLoadComplete', resolve, { once: true });
    }
  });
};

// Função para adicionar recursos adicionais ao monitoramento
window.addResourceToLoader = function(type, element) {
  if (window.pageLoaderInstance && !window.pageLoaderInstance.isComplete) {
    window.pageLoaderInstance.totalResources++;
    
    const onLoad = () => {
      window.pageLoaderInstance.onResourceLoad(type);
      cleanup();
    };
    
    const onError = () => {
      window.pageLoaderInstance.onResourceLoad(type);
      cleanup();
    };
    
    const cleanup = () => {
      element.removeEventListener('load', onLoad);
      element.removeEventListener('error', onError);
    };
    
    element.addEventListener('load', onLoad);
    element.addEventListener('error', onError);
  }
};

// Debug helpers
window.debugPageLoader = function() {
  if (window.pageLoaderInstance) {
    console.log('Loading Progress:', {
      loaded: window.pageLoaderInstance.loadedResources,
      total: window.pageLoaderInstance.totalResources,
      complete: window.pageLoaderInstance.isComplete,
      percentage: ((window.pageLoaderInstance.loadedResources / window.pageLoaderInstance.totalResources) * 100).toFixed(1) + '%'
    });
  } else {
    console.log('Page loader not initialized');
  }
};

// Detectar se há recursos carregando dinamicamente
function detectDynamicResources() {
  // Observar mudanças no DOM para detectar novos recursos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Verificar se é um script
          if (node.tagName === 'SCRIPT' && node.src) {
            window.addResourceToLoader('JS_DYNAMIC', node);
          }
          // Verificar se é uma imagem
          else if (node.tagName === 'IMG') {
            window.addResourceToLoader('IMG_DYNAMIC', node);
          }
          // Verificar se é CSS
          else if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
            window.addResourceToLoader('CSS_DYNAMIC', node);
          }
          
          // Procurar por recursos dentro do elemento adicionado
          const scripts = node.querySelectorAll && node.querySelectorAll('script[src]');
          const images = node.querySelectorAll && node.querySelectorAll('img');
          const stylesheets = node.querySelectorAll && node.querySelectorAll('link[rel="stylesheet"]');
          
          if (scripts) {
            scripts.forEach(script => window.addResourceToLoader('JS_DYNAMIC', script));
          }
          if (images) {
            images.forEach(img => window.addResourceToLoader('IMG_DYNAMIC', img));
          }
          if (stylesheets) {
            stylesheets.forEach(link => window.addResourceToLoader('CSS_DYNAMIC', link));
          }
        }
      });
    });
  });
  
  // Observar apenas se o loader ainda não está completo
  if (window.pageLoaderInstance && !window.pageLoaderInstance.isComplete) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Parar de observar quando o loading estiver completo
    window.addEventListener('pageLoadComplete', () => {
      observer.disconnect();
    }, { once: true });
  }
}

// Inicializar detecção de recursos dinâmicos quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectDynamicResources);
} else {
  detectDynamicResources();
}
