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
    this.minha_conta_formatCPF();
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
  }
};
