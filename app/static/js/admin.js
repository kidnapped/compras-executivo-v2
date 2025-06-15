export default {

    adminCards() {
        const container = document.getElementById("admin-cards");
        if (!container) return;

        const cards = [
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
                descricao: "Carga e sincronização de dados",
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
            },
        ];

        cards.forEach((card) => {
            const col = document.createElement("div");
            col.className = "col-12 col-md-6 col-lg-3 mb-3";
            col.innerHTML = `
                <div class="br-card h-100">
                    <div class="card-content text-center p-3">
                        <i class="${card.icone} fa-2x mb-2" style="color:#1351b4;"></i>
                        <h5 class="mt-2">${card.titulo}</h5>
                        <p class="text-muted small">${card.descricao}</p>
                        <a href="${card.url}" class="br-button primary small mt-2">${card.botao}</a>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });
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
                        <td>${u.email || ""}</td>
                        <td>${u.usuario}</td>
                        <td>${u.origem_login}</td>
                        <td><span class="badge ${u.ativo ? "success" : "danger"
                        }">${u.ativo ? "Sim" : "Não"}</span></td>
                        <td>
                            <button class="br-button circle small btn-editar-usuario"
                                    data-id="${u.id}"
                                    data-nome="${u.nome}"
                                    data-email="${u.email || ""}"
                                    data-ativo="${u.ativo}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <form method="post" action="/admin/usuarios/excluir/${u.id
                        }" style="display:inline" onsubmit="return confirm('Confirma exclusão?')">
                                <button class="br-button circle small" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </form>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

                document.querySelectorAll(".btn-editar-usuario").forEach((botao) => {
                    botao.addEventListener("click", (e) => {
                        e.preventDefault();
                        App.adminModalEditar(e.currentTarget);
                    });
                });

                App.adminPaginacaoUsuarios(data.pagina, data.limite, data.total);

                const botao = document.getElementById("abrir-modal-novo-usuario");
                if (botao) {
                    botao.onclick = () => App.adminModalNovoUsuario();
                }
            });
    },

    adminPaginacaoUsuarios(paginaAtual, limite, total) {
        const container = document.getElementById("paginacao-usuarios");
        container.innerHTML = "";
        const totalPaginas = Math.ceil(total / limite);

        for (let i = 1; i <= totalPaginas; i++) {
            const btn = document.createElement("button");
            btn.className = "br-button small" + (i === paginaAtual ? " primary" : "");
            btn.innerText = i;
            btn.onclick = () => App.adminUsuarios(i);
            container.appendChild(btn);
        }
    },

    adminModalEditar(botao) {
        const id = botao.dataset.id;
        const nome = botao.dataset.nome;
        const email = botao.dataset.email;
        const ativo = botao.dataset.ativo === "true";

        const modal = document.createElement("div");
        modal.className = "br-modal active";
        modal.setAttribute("role", "dialog");
        modal.innerHTML = `
            <div class="br-modal-dialog">
                <div class="br-modal-content">
                    <div class="br-modal-header">
                        <h2 class="br-modal-title">Editar Usuário</h2>
                        <button class="br-button circle small" onclick="this.closest('.br-modal').remove()"><i class="fas fa-times"></i></button>
                    </div>
                    <form method="post" action="/admin/usuarios/editar/${id}">
                        <div class="br-modal-body">
                            <div class="br-input">
                                <label for="nome">Nome</label>
                                <input name="nome" type="text" value="${nome}" required>
                            </div>
                            <div class="br-input">
                                <label for="email">Email</label>
                                <input name="email" type="email" value="${email}">
                            </div>
                            <div class="br-input">
                                <label for="ativo">Ativo</label>
                                <select name="ativo">
                                    <option value="true" ${ativo ? "selected" : ""
            }>Sim</option>
                                    <option value="false" ${!ativo ? "selected" : ""
            }>Não</option>
                                </select>
                            </div>
                        </div>
                        <div class="br-modal-footer">
                            <button class="br-button secondary" type="button" onclick="this.closest('.br-modal').remove()">Cancelar</button>
                            <button class="br-button primary" type="submit">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    adminModalNovoUsuario() {
        const container = document.getElementById("modais-usuarios");
        if (!container) return;

        // Evita múltiplos modais empilhados
        container.innerHTML = "";

        const modal = document.createElement("div");
        modal.className = "br-modal active";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-label", "Novo Usuário");

        modal.innerHTML = `
            <div class="br-modal-dialog" role="document">
                <div class="br-modal-content">
                    <div class="br-modal-header">
                        <h2 class="br-modal-title">Novo Usuário</h2>
                        <button class="br-button circle small" onclick="this.closest('.br-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form method="post" action="/admin/usuarios/criar">
                        <div class="br-modal-body">
                            <div class="br-input">
                                <label>Nome</label>
                                <input name="nome" type="text" required>
                            </div>
                            <div class="br-input">
                                <label>CPF</label>
                                <input name="cpf" type="text" required>
                            </div>
                            <div class="br-input">
                                <label>Email</label>
                                <input name="email" type="email">
                            </div>
                            <div class="br-input">
                                <label>Usuário</label>
                                <input name="usuario" type="text" required>
                            </div>
                            <div class="br-input">
                                <label>Senha</label>
                                <input name="senha" type="password">
                            </div>
                            <div class="br-input">
                                <label>Ativo</label>
                                <select name="ativo">
                                    <option value="true" selected>Sim</option>
                                    <option value="false">Não</option>
                                </select>
                            </div>
                        </div>
                        <div class="br-modal-footer">
                            <button class="br-button secondary" type="button" onclick="this.closest('.br-modal').remove()">Cancelar</button>
                            <button class="br-button primary" type="submit">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        container.appendChild(modal);
    },

};