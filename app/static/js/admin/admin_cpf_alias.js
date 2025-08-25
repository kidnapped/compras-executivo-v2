export default {
    // Variáveis para controlar execuções múltiplas
    lastAutoInitTime: 0,
    lastInitCompleteTime: 0,
    isInitializing: false,
    isInitializingComplete: false,
    
    // Método único para inicialização completa via SPA
    cpfAlias_initComplete() {
        console.log('🔧 cpfAlias_initComplete() chamado via SPA');
        
        // Evitar execução dupla
        const now = Date.now();
        if (now - this.lastInitCompleteTime < 800) {
            console.log('⚠️ cpfAlias_initComplete ignorado - muito rápido');
            return;
        }
        
        // Evitar sobreposição de execuções
        if (this.isInitializingComplete) {
            console.log('⚠️ cpfAlias_initComplete ignorado - já inicializando');
            return;
        }
        
        this.lastInitCompleteTime = now;
        this.isInitializingComplete = true;
        
        // Aguardar o DOM estar pronto e tentar encontrar o elemento
        const waitForElement = (attempts = 0) => {
            const cpfAliasPage = document.querySelector('.cpf-alias-page');
            console.log('🔍 Tentativa', attempts + 1, '- Elemento .cpf-alias-page encontrado:', !!cpfAliasPage);
            
            if (cpfAliasPage) {
                console.log('✅ Página cpf-alias encontrada, inicializando componentes...');
                
                // Inicializar componentes dinâmicos
                this.cpfAlias_initBreadcrumb();
                this.cpfAlias_initTopico();
                
                // Inicializar a tela
                setTimeout(() => {
                    this.init();
                    this.isInitializingComplete = false;
                }, 100);
            } else if (attempts < 10) {
                // Tentar novamente após um pequeno delay
                console.log('⏳ Aguardando elemento aparecer... tentativa', attempts + 1);
                setTimeout(() => waitForElement(attempts + 1), 100);
            } else {
                console.log('❌ Página cpf-alias não encontrada após 10 tentativas');
                this.isInitializingComplete = false;
            }
        };
        
        // Iniciar verificação
        waitForElement();
    },

    // Inicializar breadcrumb dinamicamente
    cpfAlias_initBreadcrumb() {
        console.log('🔧 Inicializando breadcrumb CPF Alias...');
        
        if (typeof App !== "undefined" && App.breadcrumb && App.breadcrumb.breadcrumb_createDynamic) {
            const breadcrumbItems = [
                {title: 'Página Inicial', icon: 'fas fa-home', url: '/'},
                {title: 'Administração', icon: 'fas fa-cog', url: '/admin'},
                {title: 'CPF Alias', icon: 'fas fa-user-tag', url: ''}
            ];
            
            App.breadcrumb.breadcrumb_createDynamic(breadcrumbItems, 'cpf-alias-breadcrumb-dynamic-container');
            console.log('✅ Breadcrumb CPF Alias initialized dynamically');
        } else {
            console.warn('❌ Breadcrumb module not available - App:', typeof App, 'breadcrumb:', App?.breadcrumb ? 'exists' : 'missing');
            console.warn('⏳ Retrying in 500ms...');
            // Retry after a short delay if breadcrumb is not available yet
            setTimeout(() => {
                this.cpfAlias_initBreadcrumb();
            }, 500);
        }
    },

    // Inicializar tópico dinamicamente
    cpfAlias_initTopico() {
        console.log('🔧 Inicializando tópico CPF Alias...');
        
        if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
            const topicoConfig = {
                title: 'CPF Alias',
                description: 'Gerenciamento de aliases de CPF',
                icon: 'fas fa-user-tag',
                tags: [
                    {
                        text: 'Administração',
                        type: 'info',
                        icon: 'fas fa-cog',
                        title: 'Funcionalidade administrativa'
                    },
                ],
                actions: [
                    {
                        icon: 'fas fa-plus',
                        text: 'Novo Alias',
                        title: 'Adicionar novo alias de CPF',
                        onclick: 'App.cpfAlias_showAddModal()',
                        type: 'primary'
                    },
                    {
                        icon: 'fas fa-cog',
                        text: 'Configurações',
                        title: 'Configurações do módulo',
                        onclick: 'App.cpfAlias_showSettings()',
                        type: 'secondary'
                    }
                ]
            };
            
            App.topico.topico_createDynamic(topicoConfig, 'cpf-alias-topico-container');
            console.log('✅ Topico CPF Alias initialized dynamically');
        } else {
            console.warn('❌ Topico module not available - App:', typeof App, 'topico:', App?.topico ? 'exists' : 'missing');
            console.warn('⏳ Retrying in 500ms...');
            // Retry after a short delay if topico is not available yet
            setTimeout(() => {
                this.cpfAlias_initTopico();
            }, 500);
        }
    },
    
    // Inicialização da página CPF Alias
    init() {
        console.log("🏷️ Inicializando página CPF Alias...");
        this.loadContent();
    },

    // Carrega o conteúdo da página
    loadContent() {
        const container = document.getElementById("cpf-alias-content");
        if (!container) return;

        // Conteúdo será implementado aqui conforme necessário
        container.innerHTML = `
            <!-- Conteúdo do CPF Alias será implementado aqui -->
        `;
    },

    // Auto-inicialização da página se estivermos na página correta
    autoInit() {
        console.log('🔧 CpfAlias.autoInit() chamado');
        
        // Evitar execuções múltiplas muito próximas
        const now = Date.now();
        if (now - this.lastAutoInitTime < 1000) {
            console.log('⚠️ CpfAlias.autoInit ignorado - muito rápido');
            return;
        }
        
        // Evitar sobreposição de execuções
        if (this.isInitializing) {
            console.log('⚠️ CpfAlias.autoInit ignorado - já inicializando');
            return;
        }
        
        this.lastAutoInitTime = now;
        this.isInitializing = true;
        
        // Função para verificar e inicializar
        const checkAndInit = () => {
            // Verifica se estamos na página correta procurando pelo elemento principal
            const cpfAliasPage = document.querySelector('.cpf-alias-page');
            console.log('🔍 Elemento .cpf-alias-page encontrado:', !!cpfAliasPage);
            console.log('🔍 Pathname atual:', window.location.pathname);
            
            // Também verificar pela URL se o elemento não foi encontrado ainda
            const isCpfAliasRoute = window.location.pathname.includes('/admin/cpf_alias');
            console.log('🔍 É rota de cpf-alias:', isCpfAliasRoute);
            
            if (cpfAliasPage || isCpfAliasRoute) {
                console.log('✅ Estamos na página cpf-alias, inicializando...');
                this.cpfAlias_initComplete();
            } else {
                console.log('ℹ️ Não estamos na página cpf-alias, pulando inicialização');
            }
            this.isInitializing = false;
        };
        
        // Executar verificação
        checkAndInit();
    }
};
