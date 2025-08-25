export default {

    // Inicialização da página Admin
    init() {
        console.log("🔧 Inicializando página Admin...");
        this.initBreadcrumb();
        this.initTopico();
        this.adminCards();
    },

    // Nova função para inicializar o breadcrumb dinamicamente
    initBreadcrumb() {
        console.log('🔧 Inicializando breadcrumb do Admin...');
        
        // Verifica se o módulo breadcrumb está disponível
        if (typeof App !== "undefined" && App.breadcrumb && App.breadcrumb.breadcrumb_createDynamic) {
            const breadcrumbItems = [
                {title: 'Página Inicial', icon: 'fas fa-home', url: '/minha-conta'},
                {title: 'Administração', icon: 'fas fa-cog', url: ''}
            ];
            
            App.breadcrumb.breadcrumb_createDynamic(breadcrumbItems, 'admin-breadcrumb-dynamic-container');
            console.log('✅ Breadcrumb Admin initialized dynamically');
        } else {
            console.warn('❌ Breadcrumb module not available - App:', typeof App, 'breadcrumb:', App?.breadcrumb ? 'exists' : 'missing');
            console.warn('⏳ Retrying in 500ms...');
            // Retry after a short delay if breadcrumb is not available yet
            setTimeout(() => {
                this.initBreadcrumb();
            }, 500);
        }
    },

    // Nova função para inicializar o tópico dinamicamente
    initTopico() {
        console.log('🔧 Inicializando tópico do Admin...');
        
        // Verifica se o módulo topico está disponível
        if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
            const topicoConfig = {
                title: 'Administração do Sistema',
                description: 'Gerencie usuários, permissões, dados e configurações da aplicação',
                icon: 'fas fa-cog',
                tags: [
                    {
                        text: 'Sistema',
                        type: 'info',
                        icon: 'fas fa-server',
                        title: 'Configurações do sistema'
                    },
                ],
                actions: [
                    {
                        icon: 'fas fa-users',
                        text: 'Usuários',
                        title: 'Gerenciar usuários do sistema',
                        onclick: 'window.location.href="/admin/usuarios"',
                        type: 'secondary'
                    },
                    {
                        icon: 'fas fa-database',
                        text: 'ETL',
                        title: 'Processos de carga de dados',
                        onclick: 'window.location.href="/admin/etl"',
                        type: 'secondary'
                    }
                ]
            };
            
            App.topico.topico_createDynamic(topicoConfig, 'admin-topico-container');
            console.log('✅ Topico Admin initialized dynamically');
        } else {
            console.warn('❌ Topico module not available - App:', typeof App, 'topico:', App?.topico ? 'exists' : 'missing');
            console.warn('⏳ Retrying in 500ms...');
            // Retry after a short delay if topico is not available yet
            setTimeout(() => {
                this.initTopico();
            }, 500);
        }
    },

    adminCards() {
        const container = document.getElementById("admin-cards");
        if (!container) return;

        const cards = [
            {
                titulo: "CPF Alias",
                descricao: "Aliases de CPF",
                icone: "fas fa-user-tag",
                url: "/admin/cpf_alias",
                botao: "Gerenciar",
            },
            {
                titulo: "Usuários",
                descricao: "Cadastro, edição e perfis",
                icone: "fas fa-users",
                url: "/admin/usuarios",
                botao: "Acessar",
            },
            {
                titulo: "Perfis",
                descricao: "Tipos de perfil e regras",
                icone: "fas fa-id-badge",
                url: "/admin/perfis",
                botao: "Gerenciar",
            },
            {
                titulo: "Permissões",
                descricao: "Papéis e acessos",
                icone: "fas fa-user-shield",
                url: "/admin/permissoes",
                botao: "Acessar",
            },
            {
                titulo: "Logs",
                descricao: "Auditoria e histórico",
                icone: "fas fa-file-alt",
                url: "/admin/logs",
                botao: "Ver registros",
            },
            {
                titulo: "Sistema",
                descricao: "Configurações gerais",
                icone: "fas fa-cogs",
                url: "/admin/sistema",
                botao: "Configurar",
            },
            {
                titulo: "ETL",
                descricao: "Carga e sincronização",
                icone: "fas fa-database",
                url: "/admin/etl",
                botao: "Executar",
            },
            {
                titulo: "UASGs",
                descricao: "Vínculos entre UASGs",
                icone: "fas fa-university",
                url: "/admin/uasgs",
                botao: "Gerenciar",
            },
            {
                titulo: "Parâmetros",
                descricao: "Configuração de variáveis",
                icone: "fas fa-sliders-h",
                url: "/admin/parametros",
                botao: "Ajustar",
            },
            {
                titulo: "Integrações",
                descricao: "APIs e conectores externos",
                icone: "fas fa-plug",
                url: "/admin/integracoes",
                botao: "Conferir",
            }
        ];

        cards.forEach((card) => {
            const col = document.createElement("div");
            col.className = "col-12 col-md-6 col-lg-3 mb-3";
            
            // Apenas "Usuários", "ETL" e "CPF Alias" estão funcionais
            const isDisabled = card.titulo !== "ETL" && card.titulo !== "CPF Alias";
            
            col.innerHTML = `
                <div class="br-card h-100">
                    <div class="card-content text-center p-3">
                        <i class="${card.icone} fa-2x mb-2" style="color:#8f9dd2;"></i>
                        <h5 class="mt-2">${card.titulo}</h5>
                        <p class="text-muted small">${card.descricao}</p>
                        ${isDisabled ? 
                            `<button class="br-button primary small mt-2 admin-card-button disabled-button" 
                                     data-card-titulo="${card.titulo}" 
                                     style="background-color:#8f9dd2; border-color:#8f9dd2;">
                                ${card.botao}
                             </button>` :
                            `<a href="${card.url}" class="br-button primary small mt-2 admin-card-button spa-link" 
                                data-card-titulo="${card.titulo}" 
                                data-spa="true"
                                style="background-color:#8f9dd2; border-color:#8f9dd2;">
                                ${card.botao}
                             </a>`
                        }
                    </div>
                </div>
            `;
            container.appendChild(col);
        });

        // Adicionar event listeners para botões desabilitados
        container.addEventListener('click', (event) => {
            if (event.target.classList.contains('disabled-button')) {
                event.preventDefault();
                this.showDisabledFeatureWarning();
            }
        });
    },

    showDisabledFeatureWarning() {
        // Remove mensagem anterior se existir
        const existingMessage = document.querySelector('.br-message.warning.feature-disabled');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Criar mensagem de warning usando padrão Gov.BR
        const warningHtml = `
            <div class="br-message warning feature-disabled" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <div class="icon">
                    <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                </div>
                <div class="content">
                    <span class="message-title">Funcionalidade Desabilitada</span>
                    <span class="message-body">Esta funcionalidade ainda não está disponível. Apenas o módulo de Usuários está ativo no momento.</span>
                </div>
                <div class="close">
                    <button class="br-button circle small" type="button" aria-label="Fechar mensagem">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;

        // Adicionar a mensagem ao body
        document.body.insertAdjacentHTML('beforeend', warningHtml);

        // Adicionar event listener para fechar
        const closeBtn = document.querySelector('.br-message.feature-disabled .close button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.querySelector('.br-message.feature-disabled').remove();
            });
        }

        // Auto-remover após 5 segundos
        setTimeout(() => {
            const message = document.querySelector('.br-message.feature-disabled');
            if (message) {
                message.style.opacity = '0';
                message.style.transition = 'opacity 0.3s ease-out';
                setTimeout(() => {
                    if (message.parentNode) {
                        message.remove();
                    }
                }, 300);
            }
        }, 5000);
    },

    showUsuarioModal({
        modo = 'novo',
        usuario = null,
        onSave = null
    } = {}) {
        // Remove modal anterior se existir
        document.querySelectorAll('.kpi-modal-overlay.usuario-modal').forEach(e => e.remove());

        const isEdit = modo === 'editar' && usuario;
        const titulo = isEdit ? 'Editar Usuário' : 'Novo Usuário';
        const action = isEdit ? `/admin/usuarios/editar/${usuario.id}` : '/admin/usuarios/criar';
        const showSenha = !isEdit;
        const checked = isEdit ? (usuario.ativo ? 'checked' : '') : 'checked';
        const readOnlyUser = isEdit ? 'readonly' : '';
        const readOnlyCpf = isEdit ? 'readonly' : '';

        const modalHtml = `
        <div class="kpi-modal-overlay usuario-modal" style="z-index:2000" onclick="this.remove()">
          <div class="kpi-modal-content" style="max-width:420px;min-width:320px;" onclick="event.stopPropagation()">
            <div class="kpi-modal-header">
              <h5 class="kpi-modal-title">${titulo}</h5>
              <button type="button" class="kpi-modal-close" onclick="this.closest('.kpi-modal-overlay').remove()">×</button>
            </div>
            <div class="kpi-modal-body">
              <form id="form-usuario-modal" method="POST" action="${action}" autocomplete="off">
                ${isEdit ? `<input type='hidden' name='usuario_id' value='${usuario.id}'>` : ''}
                <div class="br-input mb-3">
                  <label for="nome">Nome</label>
                  <input type="text" id="nome" name="nome" class="form-control" required value="${isEdit ? usuario.nome : ''}">
                </div>
                <div class="br-input mb-3">
                  <label for="cpf">CPF</label>
                  <input type="text" id="cpf" name="cpf" class="form-control" required value="${isEdit ? usuario.cpf : ''}" ${readOnlyCpf}>
                </div>
                <div class="br-input mb-3">
                  <label for="email">Email</label>
                  <input type="email" id="email" name="email" class="form-control" value="${isEdit ? (usuario.email || '') : ''}">
                </div>
                <div class="br-input mb-3">
                  <label for="usuario">Usuário</label>
                  <input type="text" id="usuario" name="usuario" class="form-control" required value="${isEdit ? usuario.usuario : ''}" ${readOnlyUser}>
                </div>
                ${showSenha ? `<div class='br-input mb-3'><label for='senha'>Senha</label><input type='password' id='senha' name='senha' class='form-control'></div>` : ''}
                <div class="br-checkbox mb-3">
                  <input type="checkbox" id="ativo" name="ativo" value="true" ${checked}>
                  <label for="ativo">Ativo</label>
                </div>
              </form>
            </div>
            <div class="kpi-modal-footer">
              <button type="button" class="kpi-btn kpi-btn-secondary" onclick="this.closest('.kpi-modal-overlay').remove()">Cancelar</button>
              <button type="button" class="kpi-btn kpi-btn-primary" id="salvar-usuario-modal">Salvar</button>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        // Handler para submit
        document.getElementById('salvar-usuario-modal').onclick = () => {
            document.getElementById('form-usuario-modal').submit();
        };
        // Enter key submit
        document.getElementById('form-usuario-modal').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('salvar-usuario-modal').click();
            }
        });
    },

    initModal() {
        // Abrir modal para novo usuário
        const btnModal = document.getElementById('abrir-modal-novo-usuario');
        if (btnModal) {
            btnModal.addEventListener('click', () => {
                this.showUsuarioModal({modo: 'novo'});
            });
        }
    },

    abrirModalEdicao(usuario) {
        this.showUsuarioModal({modo: 'editar', usuario});
    },

    adminUsuarios(pagina = 1) {
        const tabela = document.querySelector("#tabela-usuarios tbody");
        if (!tabela) return;

        fetch(`/admin/usuarios/lista?pagina=${pagina}`)
            .then((res) => res.json())
            .then((data) => {
                const tbody = document.querySelector("#tabela-usuarios tbody");
                tbody.innerHTML = "";

                data.usuarios.forEach((u) => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${u.id}</td>
                        <td>${u.nome}</td>
                        <td>${u.cpf}</td>
                        <td>${u.email || '-'}</td>
                        <td>${u.usuario}</td>
                        <td>${u.origem_login}</td>
                        <td>${u.ativo ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
                        <td>
                            <button class="br-button secondary small editar-usuario" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="br-button danger small excluir-usuario" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;

                    tr.querySelector('.editar-usuario').addEventListener('click', () => this.abrirModalEdicao(u));
                    tr.querySelector('.excluir-usuario').addEventListener('click', () => {
                        if (confirm('Tem certeza que deseja excluir este usuário?')) {
                            fetch(`/admin/usuarios/excluir/${u.id}`, { method: 'POST' })
                                .then(() => this.adminUsuarios(pagina));
                        }
                    });

                    tbody.appendChild(tr);
                });

                // Paginação
                const paginacao = document.getElementById('paginacao-usuarios');
                if (paginacao) {
                    const totalPaginas = Math.ceil(data.total / data.limite);
                    let html = '<div class="br-pagination">';
                    
                    // Botão anterior
                    if (pagina > 1) {
                        html += `<button class="br-button secondary small" onclick="App.adminUsuarios(${pagina - 1})">
                            <i class="fas fa-chevron-left"></i>
                        </button>`;
                    }

                    // Números das páginas
                    for (let i = 1; i <= totalPaginas; i++) {
                        if (i === pagina) {
                            html += `<button class="br-button primary small">${i}</button>`;
                        } else {
                            html += `<button class="br-button secondary small" onclick="App.adminUsuarios(${i})">${i}</button>`;
                        }
                    }

                    // Botão próximo
                    if (pagina < totalPaginas) {
                        html += `<button class="br-button secondary small" onclick="App.adminUsuarios(${pagina + 1})">
                            <i class="fas fa-chevron-right"></i>
                        </button>`;
                    }

                    html += '</div>';
                    paginacao.innerHTML = html;
                }
            });
    },

    // Auto-inicialização da página admin se estivermos na página correta
    autoInit() {
        // Verificar se estamos na página admin
        if (window.location.pathname === '/admin') {
            console.log("🔧 Auto-inicializando página admin...");
            this.init();
        }
    },

    // Método único para inicialização completa via SPA
    admin_initComplete() {
        console.log('🔧 admin_initComplete() chamado via SPA');
        // Verifica se estamos na página correta
        const adminCards = document.querySelector('#admin-cards');
        console.log('🔍 Elemento #admin-cards encontrado:', !!adminCards);
        if (adminCards || window.location.pathname === '/admin') {
            console.log('✅ Página de Admin detectada - iniciando componentes...');
            // Ensure containers exist before initialization
            const breadcrumbContainer = document.getElementById('admin-breadcrumb-dynamic-container');
            const topicoContainer = document.getElementById('admin-topico-container');
            if (!breadcrumbContainer || !topicoContainer) {
                console.warn('⚠️ Containers não encontrados, aguardando DOM...');
                setTimeout(() => {
                    this.admin_initComplete();
                }, 100);
                return;
            }
            // Initialize components directly instead of calling init()
            this.initBreadcrumb();
            this.initTopico();
            this.adminCards();
        } else {
            console.log('⚠️ Página de Admin não detectada');
        }
    }
};
