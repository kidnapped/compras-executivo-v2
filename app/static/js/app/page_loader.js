/**
 * Sistema de Loading da Página
 * Gerencia o loading até que todos os recursos sejam carregados
 */

class PageLoader {
  constructor() {
    this.loadedResources = 0;
    this.totalResources = 0;
    this.isComplete = false;
    this.progressBar = null;
    this.statusText = null;
    this.startTime = Date.now();
    
    // Recursos a serem monitorados
    this.resourceTypes = {
      css: 'Carregando estilos...',
      js: 'Carregando scripts...',
      img: 'Carregando imagens...',
      font: 'Carregando fontes...',
      complete: 'Finalizando...'
    };
    
    this.init();
  }

  init() {
    // Adicionar classe loading ao body
    document.body.classList.add('loading');
    
    // Criar loader se não existir
    this.createLoader();
    
    // Iniciar monitoramento
    this.startMonitoring();
  }

  createLoader() {
    const existingLoader = document.getElementById('page-loader');
    if (existingLoader) return;

    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.className = 'page-loader';
    
    loader.innerHTML = `
      <div class="loader-container">
        <img src="/static/images/govbr-logo.png" alt="GovBR" class="loader-logo" />
        <div class="loader-spinner"></div>
        <div class="loader-text">Compras Executivo</div>
        <div class="loader-progress">
          <div class="loader-progress-bar" id="loader-progress-bar"></div>
        </div>
        <div class="loader-status" id="loader-status">Inicializando...</div>
      </div>
    `;
    
    document.body.insertBefore(loader, document.body.firstChild);
    
    this.progressBar = document.getElementById('loader-progress-bar');
    this.statusText = document.getElementById('loader-status');
  }

  startMonitoring() {
    // Contar recursos CSS
    this.countStylesheets();
    
    // Contar recursos JS
    this.countScripts();
    
    // Contar imagens
    this.countImages();
    
    // Contar fontes (via CSS Font Loading API se disponível)
    this.countFonts();
    
    // Monitorar estado do DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.onResourceLoad('DOM');
      });
      this.totalResources++;
    }
    
    // Monitorar estado da janela
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        this.onResourceLoad('Window');
      });
      this.totalResources++;
    }
    
    // Timeout de segurança
    setTimeout(() => {
      if (!this.isComplete) {
        console.warn('Loading timeout - forçando conclusão');
        this.completeLoading();
      }
    }, 10000); // 10 segundos
    
    // Atualizar progresso inicial
    this.updateProgress();
  }

  countStylesheets() {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(link => {
      this.totalResources++;
      
      if (link.sheet && link.sheet.cssRules) {
        // Já carregado
        this.onResourceLoad('CSS');
      } else {
        // Aguardar carregamento
        link.addEventListener('load', () => this.onResourceLoad('CSS'));
        link.addEventListener('error', () => this.onResourceLoad('CSS'));
      }
    });
  }

  countScripts() {
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      this.totalResources++;
      
      if (script.readyState === 'complete') {
        this.onResourceLoad('JS');
      } else {
        script.addEventListener('load', () => this.onResourceLoad('JS'));
        script.addEventListener('error', () => this.onResourceLoad('JS'));
      }
    });
  }

  countImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      this.totalResources++;
      
      if (img.complete && img.naturalHeight !== 0) {
        this.onResourceLoad('IMG');
      } else {
        img.addEventListener('load', () => this.onResourceLoad('IMG'));
        img.addEventListener('error', () => this.onResourceLoad('IMG'));
      }
    });
  }

  countFonts() {
    if ('fonts' in document) {
      // Contar fontes através do CSS Font Loading API
      const fontPromises = [];
      
      // Fontes principais do GovBR
      const govBrFonts = [
        'Rawline',
        'FontAwesome'
      ];
      
      govBrFonts.forEach(fontFamily => {
        const promise = document.fonts.load(`1em ${fontFamily}`).then(() => {
          this.onResourceLoad('FONT');
        }).catch(() => {
          this.onResourceLoad('FONT'); // Continuar mesmo com erro
        });
        
        fontPromises.push(promise);
        this.totalResources++;
      });
      
      // Monitorar todas as fontes
      document.fonts.ready.then(() => {
        // Todas as fontes foram carregadas
        this.onResourceLoad('FONTS_READY');
      });
      this.totalResources++;
    }
  }

  onResourceLoad(type) {
    this.loadedResources++;
    
    // Atualizar status baseado no tipo
    if (this.statusText) {
      const statusMap = {
        'CSS': 'Carregando estilos...',
        'JS': 'Carregando scripts...',
        'IMG': 'Carregando imagens...',
        'FONT': 'Carregando fontes...',
        'DOM': 'Processando página...',
        'Window': 'Finalizando...',
        'FONTS_READY': 'Fontes prontas...'
      };
      
      this.statusText.textContent = statusMap[type] || 'Carregando...';
    }
    
    this.updateProgress();
    
    // Verificar se tudo foi carregado
    if (this.loadedResources >= this.totalResources) {
      setTimeout(() => this.completeLoading(), 300);
    }
  }

  updateProgress() {
    if (!this.progressBar) return;
    
    const percentage = this.totalResources > 0 ? 
      Math.min((this.loadedResources / this.totalResources) * 100, 100) : 0;
    
    this.progressBar.style.width = `${percentage}%`;
    
    // Log de debug
    console.log(`Loading progress: ${this.loadedResources}/${this.totalResources} (${percentage.toFixed(1)}%)`);
  }

  completeLoading() {
    if (this.isComplete) return;
    
    this.isComplete = true;
    const loadTime = Date.now() - this.startTime;
    
    console.log(`Page loaded in ${loadTime}ms`);
    
    // Atualizar status final
    if (this.statusText) {
      this.statusText.textContent = 'Pronto!';
    }
    
    // Completar barra de progresso
    if (this.progressBar) {
      this.progressBar.style.width = '100%';
    }
    
    // Remover loader após animação
    setTimeout(() => {
      const loader = document.getElementById('page-loader');
      if (loader) {
        loader.classList.add('loaded');
        setTimeout(() => {
          loader.remove();
          document.body.classList.remove('loading');
          
          // Disparar evento customizado
          window.dispatchEvent(new Event('pageLoadComplete'));
        }, 500);
      }
    }, 200);
  }

  // Método público para forçar conclusão
  static forceComplete() {
    const loader = document.getElementById('page-loader');
    if (loader && window.pageLoaderInstance) {
      window.pageLoaderInstance.completeLoading();
    }
  }
}

// Inicializar assim que o script for carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pageLoaderInstance = new PageLoader();
  });
} else {
  window.pageLoaderInstance = new PageLoader();
}

// Expor globalmente para debug
window.PageLoader = PageLoader;
