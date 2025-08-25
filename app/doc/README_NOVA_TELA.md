# Como Criar uma Nova Tela no Sistema

Este guia explica como criar uma nova tela seguindo o padrão arquitetural do sistema, incluindo integração com SPA (Single Page Application).

## Estrutura de Arquivos

Cada nova tela deve ter 4 arquivos principais:

1. **HTML Template** (`app/templates/nome_tela.html`)
2. **JavaScript Module** (`app/static/js/nome_tela.js`)
3. **CSS Stylesheet** (`app/static/css/nome_tela.css`)
4. **Python Endpoint** (`app/endpoints/nome_tela.py`)

## Como Copiar Elementos de Outras Telas

**IMPORTANTE**: Quando solicitado para copiar breadcrumbs, títulos, ou outros elementos dinâmicos de uma tela existente, siga este padrão que funciona corretamente:

### 1. Copiar Configuração do Breadcrumb

**De uma tela existente** (ex: `indicadores.js`):
```javascript
// ✅ COPIE ESTA ESTRUTURA
nomeTela_initBreadcrumb() {
  console.log('🔧 Inicializando breadcrumb...');
  
  if (typeof App !== "undefined" && App.breadcrumb && App.breadcrumb.breadcrumb_createDynamic) {
    App.breadcrumb.breadcrumb_createDynamic(
      "nome-tela-breadcrumb-dynamic-container", // ← Ajuste o ID para sua tela
      [
        { texto: "Início", url: "/" },
        { texto: "Sua Nova Tela", url: "/sua-nova-tela", ativo: true } // ← Ajuste
      ]
    );
  } else {
    console.warn('❌ Módulo breadcrumb não disponível');
  }
}
```

### 2. Copiar Configuração do Tópico (Header)

**De uma tela existente** (ex: `indicadores.js`):
```javascript
// ✅ COPIE ESTA ESTRUTURA
nomeTela_initTopico() {
  console.log('🔧 Inicializando tópico...');
  
  if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
    App.topico.topico_createDynamic(
      "nome-tela-topico-container", // ← Ajuste o ID para sua tela
      {
        titulo: "Título da Sua Tela", // ← Copie e ajuste
        subtitulo: "Descrição da funcionalidade", // ← Copie e ajuste
        icone: "fas fa-chart-bar", // ← Copie e ajuste o ícone
        acoes: [
          {
            titulo: "Filtros",
            icone: "fas fa-filter",
            acao: "this.nomeTela_showFilters()", // ← Ajuste nome da função
          },
          {
            titulo: "Atualizar",
            icone: "fas fa-sync-alt",
            acao: "this.nomeTela_refresh()", // ← Ajuste nome da função
          }
        ]
      }
    );
  } else {
    console.warn('❌ Módulo topico não disponível');
  }
}
```

### 3. Copiar Configuração de Card Header

**De uma tela existente** (ex: `indicadores.js`):
```javascript
// ✅ COPIE ESTA ESTRUTURA
nomeTela_initCardHeaders() {
  console.log('🔧 Inicializando headers dos cards...');
  
  if (typeof App !== "undefined" && App.card_header && App.card_header.card_header_createDynamic) {
    App.card_header.card_header_createDynamic(
      "nome-tela-card1-header", // ← Ajuste o ID para sua tela
      {
        titulo: "Título do Card", // ← Copie e ajuste
        subtitulo: "Descrição do card", // ← Copie e ajuste
        icone: "fas fa-chart-line", // ← Copie e ajuste o ícone
        acoes: [
          {
            titulo: "Exportar",
            icone: "fas fa-download",
            acao: "this.nomeTela_exportCard()", // ← Ajuste nome da função
          }
        ]
      }
    );
  } else {
    console.warn('❌ Módulo card_header não disponível');
  }
}
```

### 4. Padrão de Inicialização SPA com Retry

**SEMPRE use este padrão para compatibilidade SPA**:
```javascript
// ✅ PADRÃO QUE FUNCIONA - Use waitForElement para SPA
async nomeTela_initComplete() {
  console.log('🔧 nomeTela_initComplete() chamado via SPA');
  
  const waitForElement = (selector, maxAttempts = 10, delay = 100) => {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const check = () => {
        const element = document.querySelector(selector);
        const isCorrectPath = window.location.pathname === '/nome-tela'; // ← Ajuste a URL
        
        console.log(`🔍 Tentativa ${attempts + 1}: Elemento encontrado: ${!!element}, URL correta: ${isCorrectPath}`);
        
        if (element && isCorrectPath) {
          resolve(element);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, delay);
        } else {
          console.log('❌ Elemento não encontrado após', maxAttempts, 'tentativas');
          resolve(null);
        }
      };
      
      check();
    });
  };
  
  const nomeTelaPage = await waitForElement('.nome-tela-page'); // ← Ajuste a classe
  
  if (nomeTelaPage) {
    console.log('✅ Página encontrada, inicializando componentes...');
    
    // Inicializar componentes dinâmicos
    this.nomeTela_initBreadcrumb();
    this.nomeTela_initTopico();
    
    // Aguardar um pouco e inicializar o resto
    setTimeout(() => {
      this.nomeTela_init();
    }, 100);
  } else {
    console.log('❌ Página nome-tela não encontrada');
  }
}
```

### 5. Regras de Nomenclatura ao Copiar

- **IDs dos containers**: Sempre ajuste para o nome da sua tela
  - `"indicadores-breadcrumb-dynamic-container"` → `"nome-tela-breadcrumb-dynamic-container"`
  - `"indicadores-topico-container"` → `"nome-tela-topico-container"`

- **Classes CSS**: Sempre ajuste o prefixo
  - `.indicadores-page` → `.nome-tela-page`
  - `.indicadores-content` → `.nome-tela-content`

- **Nomes de funções**: Sempre ajuste o prefixo
  - `indicadores_showFilters()` → `nomeTela_showFilters()`
  - `indicadores_refresh()` → `nomeTela_refresh()`

- **URLs**: Sempre ajuste para sua rota
  - `window.location.pathname === '/indicadores'` → `window.location.pathname === '/nome-tela'`

### 6. Checklist ao Copiar Elementos

- [ ] Ajustei todos os IDs dos containers
- [ ] Ajustei todas as classes CSS
- [ ] Ajustei todos os nomes de funções
- [ ] Ajustei a URL de verificação
- [ ] Ajustei títulos e textos
- [ ] Implementei o padrão waitForElement
- [ ] Testei a navegação SPA

**Este padrão garante que os elementos dinâmicos funcionem corretamente tanto no carregamento direto quanto na navegação SPA.**

## 1. Template HTML (`app/templates/nome_tela.html`)

```html
{% extends "app/base.html" %}

{% block title %}Nome da Tela - Compras Executivo{% endblock %}

{% block content %}
<div class="nome-tela-page">
  <div class="container-fluid">
    <!-- Breadcrumb Component - Dynamic -->
    <div id="nome-tela-breadcrumb-dynamic-container">
      <!-- Breadcrumb será carregado dinamicamente via JavaScript -->
    </div>

    <!-- Topico Component - Dynamic -->
    <div id="nome-tela-topico-container">
      <!-- Topico será carregado dinamicamente via JavaScript -->
    </div>

    <!-- Main Content -->
    <div id="nome-tela-content" class="nome-tela-layout">
      <!-- Content Layout -->
      <div class="row">
        <!-- Card 1 -->
        <div class="col-xl-6 col-lg-6 col-md-12 col-12 mb-3">
          <div class="nome-tela-content">
            <div class="sidebar-card">
              <!-- Card Header Component - Dynamic -->
              <div id="nome-tela-card1-header">
                <!-- Header será carregado dinamicamente -->
              </div>
              
              <div class="card-body-govbr">
                <div id="nome-tela-card1-content" class="nome-tela-card-content">
                  <!-- Conteúdo será preenchido via JavaScript -->
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="col-xl-6 col-lg-6 col-md-12 col-12 mb-3">
          <div class="nome-tela-content">
            <div class="sidebar-card">
              <!-- Card Header Component - Dynamic -->
              <div id="nome-tela-card2-header">
                <!-- Header será carregado dinamicamente -->
              </div>
              
              <div class="card-body-govbr">
                <div id="nome-tela-card2-content" class="nome-tela-card-content">
                  <!-- Conteúdo será preenchido via JavaScript -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

{% endblock %}
```

### Regras do HTML:
- **NUNCA** misturar CSS ou JavaScript inline
- Usar classes CSS com prefixo do nome da tela (`nome-tela-`)
- Estrutura modular com containers dinâmicos
- Usar sistema de grid responsivo do Bootstrap
- Elementos com IDs únicos para manipulação via JavaScript

## 2. JavaScript Module (`app/static/js/nome_tela.js`)

```javascript
export default {
  // Variáveis para controlar execuções múltiplas
  lastAutoInitTime: 0,
  lastInitCompleteTime: 0,
  isInitializing: false,
  isInitializingComplete: false,
  
  // Método único para inicialização completa via SPA
  nomeTela_initComplete() {
    console.log('🔧 nomeTela_initComplete() chamado via SPA');
    
    // Evitar execução dupla
    const now = Date.now();
    if (now - this.lastInitCompleteTime < 800) {
      console.log('⚠️ nomeTela_initComplete ignorado - muito rápido');
      return;
    }
    
    // Evitar sobreposição de execuções
    if (this.isInitializingComplete) {
      console.log('⚠️ nomeTela_initComplete ignorado - já inicializando');
      return;
    }
    
    this.lastInitCompleteTime = now;
    this.isInitializingComplete = true;
    
    // Verifica se estamos na página correta
    const nomeTelaPage = document.querySelector('.nome-tela-page');
    console.log('🔍 Elemento .nome-tela-page encontrado:', !!nomeTelaPage);
    
    if (nomeTelaPage) {
      // Inicializar componentes dinâmicos
      this.nomeTela_initBreadcrumb();
      this.nomeTela_initTopico();
      
      // Inicializar a tela
      setTimeout(() => {
        this.nomeTela_init();
        this.isInitializingComplete = false;
      }, 100);
    } else {
      console.log('❌ Página nome-tela não encontrada');
      this.isInitializingComplete = false;
    }
  },

  // Método para inicialização automática quando o módulo é carregado
  autoInit() {
    console.log('🔧 NomeTela.autoInit() chamado');
    
    // Evitar execuções múltiplas muito próximas
    const now = Date.now();
    if (now - this.lastAutoInitTime < 1000) {
      console.log('⚠️ NomeTela.autoInit ignorado - muito rápido');
      return;
    }
    
    // Evitar sobreposição de execuções
    if (this.isInitializing) {
      console.log('⚠️ NomeTela.autoInit ignorado - já inicializando');
      return;
    }
    
    this.lastAutoInitTime = now;
    this.isInitializing = true;
    
    // Função para verificar e inicializar
    const checkAndInit = () => {
      if (window.location.pathname === '/nome-tela') {
        console.log('✅ Estamos na página nome-tela, inicializando...');
        this.nomeTela_initComplete();
      } else {
        console.log('ℹ️ Não estamos na página nome-tela, pulando inicialização');
      }
      this.isInitializing = false;
    };
    
    // Executar verificação
    checkAndInit();
  },

  // Inicializar breadcrumb dinamicamente
  nomeTela_initBreadcrumb() {
    console.log('🔧 Inicializando breadcrumb...');
    
    if (typeof App !== "undefined" && App.breadcrumb && App.breadcrumb.breadcrumb_createDynamic) {
      App.breadcrumb.breadcrumb_createDynamic(
        "nome-tela-breadcrumb-dynamic-container",
        [
          { texto: "Início", url: "/" },
          { texto: "Nome da Tela", url: "/nome-tela", ativo: true }
        ]
      );
    } else {
      console.warn('❌ Módulo breadcrumb não disponível');
    }
  },

  // Inicializar tópico dinamicamente
  nomeTela_initTopico() {
    console.log('🔧 Inicializando tópico...');
    
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      App.topico.topico_createDynamic(
        "nome-tela-topico-container",
        {
          titulo: "Nome da Tela",
          subtitulo: "Descrição da funcionalidade",
          icone: "fas fa-chart-bar",
          acoes: [
            {
              titulo: "Filtros",
              icone: "fas fa-filter",
              acao: "this.nomeTela_showFilters()",
            },
            {
              titulo: "Configurações",
              icone: "fas fa-cog",
              acao: "this.nomeTela_showSettings()",
            }
          ]
        }
      );
    } else {
      console.warn('❌ Módulo topico não disponível');
    }
  },

  // Verificar se elementos da página existem
  nomeTela_initElements() {
    const nomeTelaPage = document.querySelector('.nome-tela-page');
    const card1Content = document.getElementById('nome-tela-card1-content');
    const card2Content = document.getElementById('nome-tela-card2-content');
    
    console.log('🔍 Verificando elementos:', {
      nomeTelaPage: !!nomeTelaPage,
      card1Content: !!card1Content,
      card2Content: !!card2Content
    });
    
    return nomeTelaPage && card1Content && card2Content;
  },

  // Inicializar headers dos cards dinamicamente
  nomeTela_initCardHeaders() {
    console.log('🔧 Inicializando headers dos cards...');
    
    if (typeof App !== "undefined" && App.card_header && App.card_header.card_header_createDynamic) {
      // Card 1
      App.card_header.card_header_createDynamic(
        "nome-tela-card1-header",
        {
          titulo: "Card 1",
          subtitulo: "Descrição do Card 1",
          icone: "fas fa-chart-line",
          acoes: [
            {
              titulo: "Atualizar",
              icone: "fas fa-sync-alt",
              acao: "this.nomeTela_refreshCard1()",
            },
            {
              titulo: "Exportar",
              icone: "fas fa-download",
              acao: "this.nomeTela_exportCard1()",
            }
          ]
        }
      );

      // Card 2
      App.card_header.card_header_createDynamic(
        "nome-tela-card2-header",
        {
          titulo: "Card 2",
          subtitulo: "Descrição do Card 2",
          icone: "fas fa-chart-pie",
          acoes: [
            {
              titulo: "Atualizar",
              icone: "fas fa-sync-alt",
              acao: "this.nomeTela_refreshCard2()",
            }
          ]
        }
      );
    } else {
      console.warn('❌ Módulo card_header não disponível');
    }
  },

  // Preencher conteúdo dos cards
  nomeTela_fillCardContent() {
    console.log('🔧 Preenchendo conteúdo dos cards...');
    
    // Card 1
    const card1Content = document.getElementById('nome-tela-card1-content');
    if (card1Content) {
      card1Content.innerHTML = `
        <div class="nome-tela-loading">
          <div class="nome-tela-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando dados</h5>
          <p>Buscando informações...</p>
        </div>
      `;
    }

    // Card 2
    const card2Content = document.getElementById('nome-tela-card2-content');
    if (card2Content) {
      card2Content.innerHTML = `
        <div class="nome-tela-loading">
          <div class="nome-tela-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando gráfico</h5>
          <p>Processando dados...</p>
        </div>
      `;
    }
  },

  // Inicialização principal
  nomeTela_init() {
    console.log('🔧 nomeTela_init() chamado');
    
    // Só inicializa se estivermos na página correta
    if (!this.nomeTela_initElements()) {
      console.log('❌ Elementos não encontrados');
      return;
    }
    
    console.log('✅ Elementos encontrados, inicializando...');
    
    // Inicializa os headers dos cards
    this.nomeTela_initCardHeaders();
    
    // Preenche o conteúdo dos cards
    this.nomeTela_fillCardContent();
    
    // Carrega dados dos endpoints
    setTimeout(() => {
      this.nomeTela_loadData();
    }, 500);
    
    console.log('✅ Nome Tela initialized successfully');
  },

  // Carregar dados dos endpoints
  async nomeTela_loadData() {
    try {
      // Fazer requisições para os endpoints
      const response1 = await fetch('/nome-tela/dados-card1');
      const data1 = await response1.json();
      
      const response2 = await fetch('/nome-tela/dados-card2');
      const data2 = await response2.json();
      
      // Atualizar cards com os dados
      this.nomeTela_updateCard1(data1);
      this.nomeTela_updateCard2(data2);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    }
  },

  // Atualizar Card 1
  nomeTela_updateCard1(data) {
    const card1Content = document.getElementById('nome-tela-card1-content');
    if (card1Content) {
      card1Content.innerHTML = `
        <div class="nome-tela-card1-data">
          <h3>${data.titulo}</h3>
          <p>${data.valor}</p>
        </div>
      `;
    }
  },

  // Atualizar Card 2
  nomeTela_updateCard2(data) {
    const card2Content = document.getElementById('nome-tela-card2-content');
    if (card2Content) {
      card2Content.innerHTML = `
        <div class="nome-tela-card2-data">
          <div id="nome-tela-grafico"></div>
        </div>
      `;
      
      // Criar gráfico com ECharts
      this.nomeTela_createChart(data);
    }
  },

  // Criar gráfico
  async nomeTela_createChart(data) {
    try {
      const echarts = await App.getEcharts();
      const chartContainer = document.getElementById('nome-tela-grafico');
      
      if (chartContainer) {
        const chart = echarts.init(chartContainer);
        
        const option = {
          title: {
            text: data.titulo
          },
          tooltip: {},
          xAxis: {
            data: data.categorias
          },
          yAxis: {},
          series: [{
            name: 'Valores',
            type: 'bar',
            data: data.valores
          }]
        };
        
        chart.setOption(option);
      }
    } catch (error) {
      console.error('❌ Erro ao criar gráfico:', error);
    }
  },

  // Ações dos botões
  nomeTela_refreshCard1() {
    console.log('🔄 Atualizando Card 1...');
    // Implementar lógica de atualização
  },

  nomeTela_exportCard1() {
    console.log('📥 Exportando Card 1...');
    // Implementar lógica de exportação
  },

  nomeTela_refreshCard2() {
    console.log('🔄 Atualizando Card 2...');
    // Implementar lógica de atualização
  },

  nomeTela_showFilters() {
    console.log('🔍 Mostrando filtros...');
    // Implementar modal de filtros
  },

  nomeTela_showSettings() {
    console.log('⚙️ Mostrando configurações...');
    // Implementar modal de configurações
  }
};
```

### Regras do JavaScript:
- Exportar como `export default`
- Usar nomenclatura `nomeTela_` para todas as funções
- Controlar execuções múltiplas com flags
- Usar `console.log` com emojis para debug
- Funções assíncronas para carregar dados
- Verificar disponibilidade de módulos antes de usar

## 3. CSS Stylesheet (`app/static/css/nome_tela.css`)

```css
/* ===================== NOME TELA PAGE ===================== */

.nome-tela-page {
  padding: 0;
  margin: 0;
}

.nome-tela-page .container-fluid {
  padding: 20px;
}

/* ===================== ESTILOS GLOBAIS PARA CARDS ===================== */

/* Padding zero para todos os card bodies */
.nome-tela-page .card-body-govbr {
  padding: 0;
  margin: 0;
}

/* Padding zero para todos os card contents */
.nome-tela-page .nome-tela-card-content {
  padding: 15px;
  margin: 0;
}

/* ===================== LAYOUT PRINCIPAL ===================== */

/* Container dos cards */
.nome-tela-layout {
  margin-top: 20px;
}

.nome-tela-layout .row {
  margin: 0;
}

/* Layout das colunas */
.nome-tela-layout .col-xl-6 {
  padding: 0 10px;
}

.nome-tela-layout .col-xl-6:first-child {
  padding-left: 0;
}

.nome-tela-layout .col-xl-6:last-child {
  padding-right: 0;
}

/* Containers dos cards */
.nome-tela-content {
  height: 100%;
}

/* Cards */
.nome-tela-layout .sidebar-card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 400px;
  display: flex;
  flex-direction: column;
}

/* Body dos cards */
.nome-tela-layout .card-body-govbr {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

/* Conteúdo dos cards */
.nome-tela-layout .nome-tela-card-content {
  height: 100%;
  overflow-y: auto;
  padding: 15px;
}

/* ===================== LOADING E CHARTS ===================== */

/* Loading container */
.nome-tela-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.nome-tela-loading-spinner {
  margin-bottom: 15px;
}

.nome-tela-loading-spinner .fa-spinner {
  font-size: 2rem;
  color: #8f9dd2;
  animation: spin 1s linear infinite;
}

.nome-tela-loading h5 {
  color: #333;
  margin-bottom: 5px;
}

.nome-tela-loading p {
  color: #666;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Container do gráfico */
.nome-tela-card1-data,
.nome-tela-card2-data {
  padding: 20px;
  text-align: center;
}

#nome-tela-grafico {
  width: 100%;
  height: 300px;
  margin-top: 20px;
}

/* ===================== RESPONSIVE DESIGN ===================== */

/* Desktop (xl) */
@media (min-width: 1200px) {
  .nome-tela-layout .sidebar-card {
    height: 450px;
  }
}

/* Tablet (lg) */
@media (max-width: 1199px) and (min-width: 992px) {
  .nome-tela-layout .sidebar-card {
    height: 400px;
  }
}

/* Tablet pequeno e mobile */
@media (max-width: 991px) {
  .nome-tela-layout .col-xl-6 {
    padding: 0 5px;
    margin-bottom: 20px;
  }
  
  .nome-tela-layout .col-xl-6:first-child,
  .nome-tela-layout .col-xl-6:last-child {
    padding: 0 5px;
  }
  
  .nome-tela-layout .sidebar-card {
    height: 350px;
  }
}

/* Mobile pequeno */
@media (max-width: 767px) {
  .nome-tela-page .container-fluid {
    padding: 10px;
  }
  
  .nome-tela-layout .col-xl-6 {
    padding: 0;
    margin-bottom: 15px;
  }
  
  .nome-tela-layout .sidebar-card {
    height: 300px;
  }
  
  #nome-tela-grafico {
    height: 200px;
  }
}

/* ===================== SCROLLBAR CUSTOMIZADA ===================== */

.nome-tela-card-content::-webkit-scrollbar {
  width: 6px;
}

.nome-tela-card-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.nome-tela-card-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.nome-tela-card-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Para Firefox */
.nome-tela-card-content {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* ===================== ALERTAS E MENSAGENS ===================== */

.nome-tela-page .alert {
  margin: 15px 0;
  border-radius: 6px;
}

.nome-tela-page .alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.nome-tela-page .alert-danger i {
  margin-right: 8px;
}
```

### Regras do CSS:
- Usar prefixo `.nome-tela-` para todas as classes
- Estrutura responsiva com breakpoints
- Scrollbar customizada
- Animações suaves
- Cores consistentes com o design system

## 4. Python Endpoint (`app/endpoints/nome_tela.py`)

```python
from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.templates import templates
from app.db.session import get_session_contratos
from app.utils.spa_utils import spa_route_handler, get_page_scripts, add_spa_context
from app.core.config import settings

router = APIRouter()

@router.get("/nome-tela", response_class=HTMLResponse)
async def nome_tela(request: Request):
    # Check if user is logged in
    cpf = request.session.get("cpf")
    if not cpf:
        return RedirectResponse(url="/login?next=/nome-tela")
    
    # Criar contexto
    context = {
        "request": request,
        "template_name": "nome_tela"
    }
    
    # Adicionar contexto SPA
    context = add_spa_context(context, request)
    
    # Usar o handler SPA
    return spa_route_handler(
        template_name="nome_tela.html",
        context=context,
        templates=templates,
        request=request,
        title="Nome da Tela - Compras Executivo",
        scripts=get_page_scripts("nome_tela")
    )

@router.get("/nome-tela/dados-card1")
async def get_nome_tela_dados_card1(
    db: AsyncSession = Depends(get_session_contratos)
):
    """Endpoint para dados do Card 1"""
    query = """
        SELECT 
            COUNT(*) as total,
            'Dados Card 1' as titulo
        FROM sua_tabela
        WHERE condicao = true;
    """
    result = await db.execute(text(query))
    row = result.mappings().first() or {}

    return {
        "titulo": row.get("titulo", "Sem dados"),
        "valor": row.get("total", 0)
    }

@router.get("/nome-tela/dados-card2")
async def get_nome_tela_dados_card2(
    db: AsyncSession = Depends(get_session_contratos)
):
    """Endpoint para dados do Card 2 (gráfico)"""
    query = """
        SELECT 
            categoria,
            COUNT(*) as valor
        FROM sua_tabela
        GROUP BY categoria
        ORDER BY valor DESC;
    """
    result = await db.execute(text(query))
    rows = result.mappings().all() or []

    categorias = [row.get("categoria") for row in rows]
    valores = [row.get("valor", 0) for row in rows]

    return {
        "titulo": "Gráfico Card 2",
        "categorias": categorias,
        "valores": valores
    }
```

### Regras do Python:
- Usar `router = APIRouter()`
- Verificar autenticação em todas as rotas
- Usar `spa_route_handler` para compatibilidade SPA
- Endpoints de dados separados
- Tratamento de erros adequado

## 5. Integração no Sistema

### 5.1. Adicionar no `app.js`

```javascript
// Em app/static/js/app.js
import nomeTela from "./nome_tela.js";

const App = {
  // ... outros módulos
  ...nomeTela,
  // ... resto dos módulos
};

document.addEventListener("DOMContentLoaded", () => {
  // ... outras inicializações
  nomeTela.autoInit();
  // ... resto das inicializações
});
```

### 5.2. Adicionar scripts no `spa_utils.py`

```python
# Em app/utils/spa_utils.py na função get_page_scripts
def get_page_scripts(page_type: str) -> List[Dict[str, str]]:
    scripts_map = {
        # ... outros scripts
        "nome_tela": [
            {"src": "/static/js/nome_tela.js", "type": "module"},
        ],
        # ... resto dos scripts
    }
    
    return scripts_map.get(page_type, [])
```

### 5.3. Configurar parâmetros no `config.py`

```python
# Em app/core/config.py
class Settings(BaseSettings):
    # ... outras configurações
    
    # Nome Tela Configuration
    NOME_TELA_ENABLED: bool = True
    NOME_TELA_MAX_RESULTS: int = 100
    NOME_TELA_CACHE_TTL: int = 300  # 5 minutos
    
    # ... resto das configurações
```

### 5.4. Registrar rotas no `main.py`

```python
# Em app/main.py
from app.endpoints import nome_tela

# Registrar rotas
app.include_router(nome_tela.router, tags=["nome_tela"])
```

## 6. Checklist de Implementação

- [ ] Criar template HTML sem CSS/JS inline
- [ ] Criar módulo JavaScript com export default
- [ ] Criar stylesheet CSS com prefixos únicos
- [ ] Criar endpoint Python com spa_route_handler
- [ ] Adicionar import no app.js
- [ ] Adicionar autoInit() no app.js
- [ ] Adicionar scripts no spa_utils.py
- [ ] Configurar parâmetros no config.py
- [ ] Registrar rotas no main.py
- [ ] Testar SPA navigation
- [ ] Verificar responsividade
- [ ] Validar loading states

## 7. Nomenclatura e Padrões

### Arquivos:
- `nome_tela.html` (snake_case)
- `nome_tela.js` (snake_case)
- `nome_tela.css` (snake_case) 
- `nome_tela.py` (snake_case)

### Classes CSS:
- `.nome-tela-page` (kebab-case)
- `.nome-tela-content` (kebab-case)
- `.nome-tela-card-content` (kebab-case)

### IDs HTML:
- `nome-tela-breadcrumb-dynamic-container` (kebab-case)
- `nome-tela-card1-header` (kebab-case)

### Funções JavaScript:
- `nomeTela_init()` (camelCase com prefixo)
- `nomeTela_loadData()` (camelCase com prefixo)

### Endpoints Python:
- `/nome-tela` (kebab-case)
- `/nome-tela/dados-card1` (kebab-case)

## 8. Debugging e Logs

- Use `console.log` com emojis para facilitar debugging
- Implemente controles de execução múltipla
- Verifique disponibilidade de módulos antes de usar
- Trate erros de forma adequada
- Use loading states durante carregamento de dados

## 9. Debugging de Elementos Dinâmicos e SPA

### 9.1. Como Debuggar Problemas de SPA

**Problema comum**: "Element not found" durante navegação SPA

**Solução comprovada**:
```javascript
// ✅ SEMPRE use este padrão para debug SPA
const waitForElement = (selector, maxAttempts = 10, delay = 100) => {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const check = () => {
      const element = document.querySelector(selector);
      const isCorrectPath = window.location.pathname === '/sua-tela';
      
      console.log(`🔍 Debug - Tentativa ${attempts + 1}:`);
      console.log(`   • Elemento "${selector}": ${!!element}`);
      console.log(`   • URL atual: ${window.location.pathname}`);
      console.log(`   • URL esperada: /sua-tela`);
      console.log(`   • Match: ${isCorrectPath}`);
      
      if (element && isCorrectPath) {
        console.log(`✅ Elemento encontrado na tentativa ${attempts + 1}`);
        resolve(element);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(check, delay);
      } else {
        console.log(`❌ Elemento "${selector}" não encontrado após ${maxAttempts} tentativas`);
        resolve(null);
      }
    };
    
    check();
  });
};
```

### 9.2. Verificar Módulos Disponíveis

**Sempre verifique se os módulos estão carregados**:
```javascript
// ✅ Debug de módulos disponíveis
nomeTela_debugModules() {
  console.log('🔧 Verificando módulos disponíveis:');
  console.log('   • App:', typeof App !== "undefined");
  console.log('   • App.breadcrumb:', !!(App && App.breadcrumb));
  console.log('   • App.topico:', !!(App && App.topico));
  console.log('   • App.card_header:', !!(App && App.card_header));
  
  if (typeof App !== "undefined") {
    console.log('   • Breadcrumb.breadcrumb_createDynamic:', !!(App.breadcrumb && App.breadcrumb.breadcrumb_createDynamic));
    console.log('   • Topico.topico_createDynamic:', !!(App.topico && App.topico.topico_createDynamic));
    console.log('   • CardHeader.card_header_createDynamic:', !!(App.card_header && App.card_header.card_header_createDynamic));
  }
}
```

### 9.3. Logs Essenciais para Debug

**Use este padrão de logs em todas as funções**:
```javascript
// ✅ Padrão de logs para debug
nomeTela_initComplete() {
  console.log('🔧 nomeTela_initComplete() chamado via SPA');
  console.log('   • URL atual:', window.location.pathname);
  console.log('   • Timestamp:', new Date().toISOString());
  
  // Debug de módulos
  this.nomeTela_debugModules();
  
  // Continuar com waitForElement...
}
```

### 9.4. Problemas Comuns e Soluções

| Problema | Causa | Solução |
|----------|--------|---------|
| "Element not found" | SPA carrega JS antes do HTML | Use `waitForElement` com retry |
| Breadcrumb não aparece | Módulo não carregado | Verifique `App.breadcrumb` |
| Funções undefined | Escopo incorreto | Use `this.nomeTela_funcao()` |
| CSS não aplicado | Classe errada | Verifique prefixo `.nome-tela-` |
| SPA não funciona | Falta atributos | Adicione `spa-link` e `data-spa="true"` |

### 9.5. Console Logs Recomendados

**Sempre inclua estes logs para debug eficiente**:
```javascript
// No início da função
console.log('🔧 nomeTela_initComplete() chamado via SPA');

// Para verificar elementos
console.log('🔍 Verificando elemento:', selector, !!document.querySelector(selector));

// Para verificar URL
console.log('🌐 URL atual:', window.location.pathname);

// Para verificar módulos
console.log('📦 Módulo disponível:', typeof App !== "undefined");

// Para sucesso
console.log('✅ Inicialização completa');

// Para erros
console.log('❌ Erro:', error.message);

// Para timing
console.log('⏱️ Aguardando elemento...');
```

Este padrão garante:
- ✅ Separação completa de responsabilidades
- ✅ Compatibilidade com SPA
- ✅ Responsividade  
- ✅ Manutenibilidade
- ✅ Escalabilidade
- ✅ Consistência visual e funcional
- ✅ **Debug eficiente de problemas SPA**
- ✅ **Logs estruturados para troubleshooting**
