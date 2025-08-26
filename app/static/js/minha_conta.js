export default {
  // Variável para controlar execuções múltiplas
  lastAutoInitTime: 0,
  isInitializing: false,
  
  // Método para inicialização automática quando o módulo é carregado
  autoInit() {
    console.log('🔧 MinhaContaPage.autoInit() chamado');
    
    // Evitar execuções múltiplas muito próximas (debounce de 1 segundo)
    const now = Date.now();
    if (now - this.lastAutoInitTime < 1000) {
      console.log('⚠️ autoInit() ignorado - muito recente (debounce)');
      return;
    }
    
    // Evitar sobreposição de execuções
    if (this.isInitializing) {
      console.log('⚠️ autoInit() ignorado - já está inicializando');
      return;
    }
    
    this.lastAutoInitTime = now;
    this.isInitializing = true;
    
    // Verifica se estamos na página correta procurando pelo elemento principal
    const minhaContaPage = document.querySelector('.minha_conta_profile_page');
    console.log('🔍 Elemento .minha_conta_profile_page encontrado:', !!minhaContaPage);
    
    if (minhaContaPage) {
      console.log('✅ Página de minha conta detectada - iniciando componentes...');
      
      // Se encontrou o elemento, inicializa automaticamente
      setTimeout(() => {
        this.minha_conta_init();
        this.isInitializing = false;
      }, 100); // Pequeno delay para garantir que todos os elementos estejam carregados
    } else {
      console.log('⚠️ Página de minha conta não detectada - elemento .minha_conta_profile_page não encontrado');
      this.isInitializing = false;
    }
  },

  minha_conta_init() {
    console.log('🔧 minha_conta_init() chamado');
    
    // Verifica se estamos na página correta
    if (!this.minha_conta_initElements()) {
      console.log('⚠️ Elementos não encontrados, cancelando inicialização');
      return;
    }
    
    console.log('✅ Elementos encontrados, inicializando componentes...');
    
    // Inicializa todos os componentes
    this.minha_conta_initBreadcrumb();
    this.minha_conta_initCardHeaders();
    this.minha_conta_formatCPF();
    this.minha_conta_formatProfileName();
    this.minha_conta_initScrollAnimations();
    this.minha_conta_initHoverEffects();
    this.minha_conta_initPulseAnimation();
    this.minha_conta_initCopyToClipboard();
    
    console.log('✅ Minha Conta initialized successfully');
  },

  minha_conta_initElements() {
    console.log('🔍 Verificando elementos da página de minha conta...');
    
    this.container = document.querySelector('.minha_conta_profile_page');
    
    // Verifica se os elementos essenciais existem
    if (!this.container) {
      console.log('❌ Container principal (.minha_conta_profile_page) não encontrado');
      return false;
    }
    
    console.log('✅ Minha conta elements initialized successfully');
    return true;
  },

  // Nova função para inicializar o breadcrumb dinamicamente
  minha_conta_initBreadcrumb() {
    console.log('🔧 Inicializando breadcrumb da minha conta...');

    // Verifica se o módulo breadcrumb está disponível
    if ( 
      typeof App !== 'undefined' &&
      App.breadcrumb &&
      App.breadcrumb.breadcrumb_createDynamic
    ) {
      // Usa o módulo breadcrumb para criar dinamicamente
      App.breadcrumb.breadcrumb_createDynamic(
        [
          {
            icon: 'fas fa-home',
            title: 'Início',
            url: '/'
          },
          {
            icon: 'fas fa-user',
            title: 'Minha Conta',
            url: null
          }
        ],
        'minha-conta-breadcrumb-dynamic-container'
      );
      console.log('✅ Breadcrumb da minha conta criado via módulo breadcrumb');
    } else {
      console.log('⚠️ Módulo breadcrumb não disponível, usando fallback');
      this.minha_conta_initBreadcrumbFallback();
    }
  },

  // Função de fallback para o breadcrumb (caso o módulo não esteja disponível)
  minha_conta_initBreadcrumbFallback() {
    console.log('🔧 Carregando breadcrumb da minha conta (fallback)...');
    
    const breadcrumbContainer = document.getElementById('minha-conta-breadcrumb-dynamic-container');
    if (!breadcrumbContainer) {
      console.log('⚠️ Container do breadcrumb não encontrado');
      return;
    }

    const breadcrumbHTML = `
      <div class="row mb-2">
        <div class="col-12">
          <div class="minha_conta_breadcrumb_modern">
            <div class="minha_conta_breadcrumb_items">
              <div class="minha_conta_breadcrumb_item">
                <a href="/">
                  <i class="fas fa-home"></i>
                  Início
                </a>
              </div>
              <div class="minha_conta_breadcrumb_separator">
                <i class="fas fa-chevron-right"></i>
              </div>
              <div class="minha_conta_breadcrumb_item active">
                <i class="fas fa-user"></i>
                Minha Conta
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    breadcrumbContainer.innerHTML = breadcrumbHTML;
    console.log('✅ Breadcrumb da minha conta carregado com sucesso (fallback)');
  },

  // Nova função para inicializar os headers dos cards dinamicamente
  minha_conta_initCardHeaders() {
    console.log('🔧 Inicializando headers dos cards da minha conta...');

    // Verifica se o módulo cardHeader está disponível
    if (
      typeof App !== 'undefined' &&
      App.cardHeader &&
      App.cardHeader.card_header_createDynamic
    ) {
      // Header do card Perfil do Usuário
      App.cardHeader.card_header_createDynamic(
        {
          title: 'Perfil do Usuário',
          subtitle: 'Suas informações principais no sistema',
          icon: 'fas fa-user'
        },
        'minha-conta-perfil-header'
      );

      // Header do card Informações Pessoais
      App.cardHeader.card_header_createDynamic(
        {
          title: 'Informações Pessoais',
          subtitle: 'Dados do seu cadastro no sistema',
          icon: 'fas fa-id-card'
        },
        'minha-conta-informacoes-header'
      );

      // Header do card Acesso Rápido
      App.cardHeader.card_header_createDynamic(
        {
          title: 'Acesso Rápido',
          subtitle: 'Links úteis do sistema',
          icon: 'fas fa-bolt'
        },
        'minha-conta-acesso-header'
      );

      // Header do card Status do Sistema
      App.cardHeader.card_header_createDynamic(
        {
          title: 'Status do Sistema',
          subtitle: 'Informações da sessão atual',
          icon: 'fas fa-info-circle'
        },
        'minha-conta-status-header'
      );

      // Header do card UASGs Vinculadas
      App.cardHeader.card_header_createDynamic(
        {
          title: 'UASGs Vinculadas',
          subtitle: 'Unidades administrativas às quais você tem acesso',
          icon: 'fas fa-building'
        },
        'minha-conta-uasgs-header'
      );
      console.log('✅ Headers dos cards da minha conta criados via módulo cardHeader');
    } else {
      console.log('⚠️ Módulo cardHeader não disponível, usando fallback');
      this.minha_conta_initCardHeadersFallback();
    }
  },

  // Função de fallback para os headers dos cards (caso o módulo não esteja disponível)
  minha_conta_initCardHeadersFallback() {
    console.log('🔧 Carregando headers dos cards da minha conta (fallback)...');
    
    // Header do card Perfil do Usuário
    const perfilHeaderContainer = document.getElementById('minha-conta-perfil-header');
    if (perfilHeaderContainer) {
      const perfilHeaderHTML = `
        <div class="card-header-govbr">
          <div class="govbr-header-content">
            <div class="govbr-icon">
              <i class="fas fa-user"></i>
            </div>
            <div class="govbr-title">
              <h3>Perfil do Usuário</h3>
              <span class="govbr-subtitle">Suas informações principais no sistema</span>
            </div>
          </div>
        </div>
      `;
      perfilHeaderContainer.innerHTML = perfilHeaderHTML;
    }

    // Header do card Informações Pessoais
    const informacoesHeaderContainer = document.getElementById('minha-conta-informacoes-header');
    if (informacoesHeaderContainer) {
      const informacoesHeaderHTML = `
        <div class="card-header-govbr">
          <div class="govbr-header-content">
            <div class="govbr-icon">
              <i class="fas fa-id-card"></i>
            </div>
            <div class="govbr-title">
              <h3>Informações Pessoais</h3>
              <span class="govbr-subtitle">Dados do seu cadastro no sistema</span>
            </div>
          </div>
        </div>
      `;
      informacoesHeaderContainer.innerHTML = informacoesHeaderHTML;
    }

    // Header do card Acesso Rápido
    const acessoHeaderContainer = document.getElementById('minha-conta-acesso-header');
    if (acessoHeaderContainer) {
      const acessoHeaderHTML = `
        <div class="card-header-govbr">
          <div class="govbr-header-content">
            <div class="govbr-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <div class="govbr-title">
              <h3>Acesso Rápido</h3>
              <span class="govbr-subtitle">Links úteis do sistema</span>
            </div>
          </div>
        </div>
      `;
      acessoHeaderContainer.innerHTML = acessoHeaderHTML;
    }

    // Header do card Status do Sistema
    const statusHeaderContainer = document.getElementById('minha-conta-status-header');
    if (statusHeaderContainer) {
      const statusHeaderHTML = `
        <div class="card-header-govbr">
          <div class="govbr-header-content">
            <div class="govbr-icon">
              <i class="fas fa-info-circle"></i>
            </div>
            <div class="govbr-title">
              <h3>Status do Sistema</h3>
              <span class="govbr-subtitle">Informações da sessão atual</span>
            </div>
          </div>
        </div>
      `;
      statusHeaderContainer.innerHTML = statusHeaderHTML;
    }

    // Header do card UASGs Vinculadas
    const uasgsHeaderContainer = document.getElementById('minha-conta-uasgs-header');
    if (uasgsHeaderContainer) {
      const uasgsHeaderHTML = `
        <div class="card-header-govbr">
          <div class="govbr-header-content">
            <div class="govbr-icon">
              <i class="fas fa-building"></i>
            </div>
            <div class="govbr-title">
              <h3>UASGs Vinculadas</h3>
              <span class="govbr-subtitle">Unidades administrativas às quais você tem acesso</span>
            </div>
          </div>
        </div>
      `;
      uasgsHeaderContainer.innerHTML = uasgsHeaderHTML;
    }
    
    console.log('✅ Headers dos cards da minha conta carregados com sucesso (fallback)');
  },

  // Format CPF with mask for display
  minha_conta_formatCPF() {
    const cpfDisplay = document.getElementById('cpf-display');
    if (cpfDisplay && cpfDisplay.textContent) {
      let cpf = cpfDisplay.textContent.replace(/\D/g, '');
      if (cpf.length === 11) {
        cpfDisplay.textContent = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    }
  },

  // Format profile name with capitalize effect
  minha_conta_formatProfileName() {
    const profileName = document.querySelector('.profile-name');
    if (profileName && profileName.textContent) {
      const originalText = profileName.textContent.trim();
      // Convert to lowercase first, then capitalize each word
      const formattedText = originalText
        .toLowerCase()
        .split(' ')
        .map(word => {
          if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
          return word;
        })
        .join(' ');
      
      profileName.textContent = formattedText;
      console.log(`✅ Nome formatado: "${originalText}" → "${formattedText}"`);
    }
  },

  // Animate cards on scroll
  minha_conta_initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe all cards
    document.querySelectorAll('.minha_conta_info_card').forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'all 0.6s ease-out';
      observer.observe(card);
    });
  },

  // Add hover effects to quick actions
  minha_conta_initHoverEffects() {
    document.querySelectorAll('.minha_conta_quick_action_item').forEach(item => {
      item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateX(8px)';
      });
      
      item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateX(0)';
      });
    });
  },

  // Pulse animation for online status
  minha_conta_initPulseAnimation() {
    setInterval(() => {
      document.querySelectorAll('.minha_conta_status_indicator.online, .minha_conta_avatar_status.online').forEach(indicator => {
        indicator.style.animation = 'none';
        setTimeout(() => {
          indicator.style.animation = 'minha_conta_pulse 2s ease-in-out infinite';
        }, 10);
      });
    }, 3000);
  },

  // Copy to clipboard functionality
  minha_conta_initCopyToClipboard() {
    document.querySelectorAll('.minha_conta_clickable_item').forEach(item => {
      item.addEventListener('click', async (event) => {
        const textToCopy = event.target.getAttribute('data-copy');
        
        try {
          await navigator.clipboard.writeText(textToCopy);
          this.minha_conta_showCopyNotification('Copiado para a área de transferência!', 'success');
          
          // Add visual feedback
          event.target.classList.add('copied');
          setTimeout(() => {
            event.target.classList.remove('copied');
          }, 1000);
          
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
          document.body.appendChild(textArea);
          textArea.select();
          
          try {
            document.execCommand('copy');
            this.minha_conta_showCopyNotification('Copiado para a área de transferência!', 'success');
            
            event.target.classList.add('copied');
            setTimeout(() => {
              event.target.classList.remove('copied');
            }, 1000);
          } catch (fallbackErr) {
            this.minha_conta_showCopyNotification('Erro ao copiar. Tente novamente.', 'error');
          }
          
          document.body.removeChild(textArea);
        }
      });
    });
  },

  // Copy notification function
  minha_conta_showCopyNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.minha_conta_copy_notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `minha_conta_copy_notification ${type}`;
    notification.innerHTML = `
      <div class="minha_conta_notification_content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  },

  // Função para mostrar configurações (chamada pelo botão do header)
  minha_conta_showSettings() {
    console.log('🔧 Abrindo configurações da conta...');
    
    // Cria uma notificação temporária (pode ser substituída por um modal real posteriormente)
    this.minha_conta_showCopyNotification('Funcionalidade em desenvolvimento', 'success');
  }
};
