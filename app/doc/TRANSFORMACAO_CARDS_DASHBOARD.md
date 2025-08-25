# Guia de Transformação de Cards para o Novo Modelo do Dashboard

Este documento detalha o processo completo para transformar cards do dashboard do formato antigo para o novo modelo unificado com **sidebar-card** e headers dinâmicos.

## 📋 Resumo das Mudanças

O novo modelo padroniza todos os cards do dashboard com:
- Estrutura HTML unificada usando `sidebar-card`
- Headers dinâmicos carregados via JavaScript
- Conteúdo isolado em containers específicos
- CSS consistente com altura padronizada
- Sistema de filtros integrado

## 🏗️ Estrutura do Novo Modelo

### HTML Template Structure
```html
<div class="col-12 col-md-3" id="card-{nome}-container">
  <div class="sidebar-card">
    <!-- Card Header Component - Dynamic -->
    <div id="dashboard-{nome}-header">
      <!-- Card header será carregado dinamicamente via JavaScript -->
    </div>
    <div class="card-body-govbr">
      <!-- Content for Card -->
      <div class="dashboard-card-content" id="dashboard{Nome}Content">
        <div class="d-flex justify-content-center align-items-center">
          <div class="br-loading medium" role="progressbar" aria-label="carregando {tipo}"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 🔄 Processo de Transformação Passo a Passo

### Passo 1: Modificar o HTML Template (`dashboard.html`)

#### 1.1 - Identificar o Card Antigo
Localize o card que precisa ser transformado. Exemplo do formato antigo:
```html
<div class="col-12 col-md-3">
  <div class="br-card">
    <div class="card-header">
      <div class="d-flex align-items-center">
        <i class="fas fa-chart-bar"></i>
        <h4>Título do Card</h4>
      </div>
    </div>
    <div class="card-body">
      <div id="conteudo-antigo">
        <!-- conteúdo específico -->
      </div>
    </div>
  </div>
</div>
```

#### 1.2 - Substituir pela Nova Estrutura
```html
<div class="col-12 col-md-3" id="card-{nome}-container">
  <div class="sidebar-card">
    <!-- Card Header Component - Dynamic -->
    <div id="dashboard-{nome}-header">
      <!-- Card header será carregado dinamicamente via JavaScript -->
    </div>
    <div class="card-body-govbr">
      <!-- Content for Card -->
      <div class="dashboard-card-content" id="dashboard{Nome}Content">
        <div class="d-flex justify-content-center align-items-center">
          <div class="br-loading medium" role="progressbar" aria-label="carregando {tipo}"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Convenções de Nomenclatura:**
- `id="card-{nome}-container"`: Container principal do card
- `id="dashboard-{nome}-header"`: Container para header dinâmico
- `id="dashboard{Nome}Content"`: Container para conteúdo (CamelCase)

### Passo 2: Atualizar o CSS (`dashboard.css`)

#### 2.1 - Adicionar Seletores Estruturais Comuns
```css
/* Dashboard card container with new layout */
#card-contratos-container .sidebar-card,
#card-contratos-exercicio-container .sidebar-card,
#card-representacao-anual-valores .sidebar-card,
#card-proximas-atividades .sidebar-card,
#card-{novo-card}-container .sidebar-card {
  height: 220px !important;
  min-height: 220px !important;
  max-height: 220px !important;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: "Rawline", sans-serif;
  font-feature-settings: "tnum";
}

/* Card body for new layout */
#card-contratos-container .card-body-govbr,
#card-contratos-exercicio-container .card-body-govbr,
#card-representacao-anual-valores .card-body-govbr,
#card-proximas-atividades .card-body-govbr,
#card-{novo-card}-container .card-body-govbr {
  height: calc(220px - 48px) !important;
  min-height: calc(220px - 48px) !important;
  max-height: calc(220px - 48px) !important;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Dashboard card content (comum a todos) */
#card-contratos-container .dashboard-card-content,
#card-contratos-exercicio-container .dashboard-card-content,
#card-representacao-anual-valores .dashboard-card-content,
#card-proximas-atividades .dashboard-card-content,
#card-{novo-card}-container .dashboard-card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 !important;
}
```

#### 2.2 - Adicionar Estilos Específicos do Card (Se Necessário)
⚠️ **IMPORTANTE**: Apenas adicione estilos específicos se o seu card realmente usa essas classes CSS.

**Exemplo para cards com filtros clicáveis (como o card de contratos):**
```css
/* Estilos específicos apenas para cards que usam filtros clicáveis */
#card-{novo-card}-container .dashboard-card-filter.clickable {
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s, box-shadow 0.15s;
  padding: 4px 6px;
}

#card-{novo-card}-container .dashboard-card-filter.clickable:hover,
#card-{novo-card}-container .dashboard-card-filter.active {
  background: #e6f0fa;
  box-shadow: 0 0 0 2px #8f9dd2;
}
```

**Exemplo para cards com valores principais e linhas (como o card de contratos):**
```css
/* Estilos específicos apenas para cards que usam .valor-principal e .linha */
#card-{novo-card}-container .valor-principal {
  margin: 0px 0px 4px 20px !important;
  font-size: 30px;
  color: #ff8000;
  text-align: left;
}

#card-{novo-card}-container .linha {
  display: flex;
  align-items: flex-start;
  margin: 0px 0px 0px 16px !important;
  font-size: 10px;
  white-space: nowrap;
  justify-content: flex-start;
  gap: 16px;
}

#card-{novo-card}-container .linha .valor-azul {
  color: #00366f;
  font-weight: bold;
}

#card-{novo-card}-container .linha .valor-vermelho {
  color: #ff4d4d;
  font-weight: bold;
}
```

### Passo 3: Modificar o JavaScript (`dashboard.js`)

#### 3.1 - Adicionar Header Dinâmico
Na função `initDashboardCardHeaders()`, adicione:
```javascript
// {Novo Card}
App.card_header.card_header_createDynamic(
  "dashboard-{nome}-header",
  "{Título do Card}",
  "fas fa-{icone}",
  "#084a8a"
);
```

#### 3.2 - Atualizar/Criar Função de Conteúdo
Modifique a função existente ou crie uma nova para trabalhar apenas com conteúdo:

**Para cards com gráficos (ECharts):**
```javascript
async dashboard{Nome}Card() {
  const contentContainer = document.getElementById("dashboard{Nome}Content");
  if (!contentContainer) return;

  try {
    const res = await fetch("/dashboard/{endpoint}");
    if (!res.ok) throw new Error("Erro ao carregar");
    const data = await res.json();

    // Create chart HTML content for the new card structure
    const chartHtml = `
      <div id="grafico-{nome}" style="width: 100%; height: 100%; min-height: 132px;"></div>
    `;

    // Update the content area
    contentContainer.innerHTML = chartHtml;

    const chartDom = document.getElementById("grafico-{nome}");
    if (!chartDom) return;

    const echarts = await getEcharts();
    const chart = echarts.init(chartDom);
    
    // Configurar o gráfico...
    chart.setOption({
      // opções do gráfico
    });

  } catch (err) {
    console.error("Erro ao carregar gráfico:", err);
    contentContainer.innerHTML = '<div class="text-danger">Erro ao carregar gráfico</div>';
  }
}
```

**Para cards com conteúdo HTML:**
```javascript
dashboard{Nome}Card() {
  const contentContainer = document.getElementById("dashboard{Nome}Content");
  if (!contentContainer) return;

  fetch("/dashboard/{endpoint}")
    .then((res) => res.json())
    .then((data) => {
      // Criar HTML específico do conteúdo
      const conteudoHtml = `
        <div class="custom-content">
          ${/* processar dados */}
        </div>
      `;

      // Update the content area with the new card structure
      contentContainer.innerHTML = conteudoHtml;

      // Setup event handlers se necessário
      this.setup{Nome}EventHandlers();
    })
    .catch((err) => {
      console.error("Erro ao carregar dados:", err);
      contentContainer.innerHTML = '<div class="text-danger">Erro ao carregar dados</div>';
    });
}
```

#### 3.3 - Adicionar Chamada na Inicialização
Na função `initCards()`, adicione:
```javascript
initCards() {
  this.initDashboardCardHeaders();
  this.dashboardContratosCard();
  this.dashboardContratosPorExercicioCard();
  this.dashboardRepresentacaoAnualValores();
  this.dashboardProximasAtividades();
  this.dashboard{Nome}Card(); // <- Nova chamada
}
```

#### 3.4 - Adicionar ao Sistema de Filtros (se aplicável)
Na função `updateDashboardFilters()`, adicione:
```javascript
updateDashboardFilters() {
  // Reset pagination to page 1 when filters change
  this.tableState.currentPage = 1;

  // Debounce rapid filter changes
  clearTimeout(this._filterUpdateTimeout);
  this._filterUpdateTimeout = setTimeout(() => {
    this.loadContractsTable();
    this.dashboardContratosCard();
    this.dashboardContratosPorExercicioCard();
    this.dashboardRepresentacaoAnualValores();
    this.dashboardProximasAtividades();
    this.dashboard{Nome}Card(); // <- Nova chamada
  }, 150);
}
```

### Passo 4: Atualizar Backend (se necessário)

#### 4.1 - Remover Propriedades de Ícone
Se o endpoint retorna propriedades de ícone, remova-as:
```python
# Em dashboard.py
@router.get("/{endpoint}")
async def get_{nome}():
    return {
        "titulo": "Título",
        "dados": [...],
        # "icone": "/static/images/icon.png"  # <- Remover esta linha
    }
```

## 📝 Exemplo Completo: Transformação do Card "Contratos e Renovações"

### Antes (Formato Antigo)
```html
<div class="col-12 col-md-3">
  <div class="br-card card-contratos">
    <div class="card-header">
      <h4><i class="fas fa-handshake"></i> Contratos e Renovações</h4>
    </div>
    <div class="card-body">
      <div id="dashboardContratosContent">
        <!-- conteúdo antigo -->
      </div>
    </div>
  </div>
</div>
```

### Depois (Novo Formato)
```html
<div class="col-12 col-md-3" id="card-contratos-container">
  <div class="sidebar-card">
    <!-- Card Header Component - Dynamic -->
    <div id="dashboard-contratos-header">
      <!-- Card header será carregado dinamicamente via JavaScript -->
    </div>
    <div class="card-body-govbr">
      <!-- Content for Card -->
      <div class="dashboard-card-content" id="dashboardContratosContent">
        <div class="d-flex justify-content-center align-items-center">
          <div class="br-loading medium" role="progressbar" aria-label="carregando contratos"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### JavaScript Atualizado
```javascript
// Header dinâmico adicionado
App.card_header.card_header_createDynamic(
  "dashboard-contratos-header",
  "Contratos e Renovações",
  "fas fa-handshake",
  "#084a8a"
);

// Função modificada para trabalhar apenas com conteúdo
dashboardContratosCard() {
  const container = document.getElementById("dashboardContratosContent");
  if (!container) return;

  // Resto da função permanece igual...
  container.innerHTML = this.renderDashboardCardContratosContent(data);
}
```

## ✅ Checklist de Verificação

Após cada transformação, verifique:

- [ ] **HTML**: Container tem ID único `card-{nome}-container`
- [ ] **HTML**: Usa `sidebar-card` em vez de `br-card`
- [ ] **HTML**: Header dinâmico tem ID `dashboard-{nome}-header`
- [ ] **HTML**: Conteúdo tem ID `dashboard{Nome}Content`
- [ ] **CSS**: Seletores incluem o novo container
- [ ] **CSS**: Altura definida como 220px
- [ ] **JS**: Header dinâmico adicionado em `initDashboardCardHeaders()`
- [ ] **JS**: Função atualizada para trabalhar apenas com conteúdo
- [ ] **JS**: Chamada adicionada em `initCards()`
- [ ] **JS**: Chamada adicionada em `updateDashboardFilters()` (se aplicável)
- [ ] **Backend**: Propriedades de ícone removidas (se aplicável)

## ⚠️ Boas Práticas de CSS

### Evitar Seletores Desnecessários
**❌ ERRADO:** Aplicar estilos específicos a todos os cards
```css
/* NÃO faça isso - aplica .valor-principal a cards que não usam essa classe */
#card-contratos-container .valor-principal,
#card-exercicio-container .valor-principal,
#card-valores-container .valor-principal {
  /* estilos... */
}
```

**✅ CORRETO:** Aplicar estilos apenas onde são necessários
```css
/* Aplique apenas aos cards que realmente usam essas classes */
#card-contratos-container .valor-principal {
  /* estilos... */
}
```

### Estrutura CSS Recomendada
1. **Estilos estruturais comuns**: Aplicar a todos os cards (sidebar-card, card-body-govbr, etc.)
2. **Estilos específicos**: Aplicar apenas aos cards que usam determinadas classes CSS
3. **Responsividade**: Manter consistente para todos os cards

## 🎨 Padrões Visuais

### Altura dos Cards
- Altura total: **220px**
- Altura do header: **48px** (automático)
- Altura do conteúdo: **172px** (`calc(220px - 48px)`)

### Cores e Estilos
- Background: `white`
- Border: `1px solid #e9ecef`
- Border radius: `8px`
- Box shadow: `0 2px 8px rgba(0, 0, 0, 0.1)`
- Font family: `"Rawline", sans-serif`

### Loading States
Todos os cards devem mostrar um loading spinner durante o carregamento:
```html
<div class="d-flex justify-content-center align-items-center">
  <div class="br-loading medium" role="progressbar" aria-label="carregando {tipo}"></div>
</div>
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Card não aparece**: Verifique se o CSS foi atualizado com os novos seletores
2. **Header não carrega**: Confirme se `App.card_header` está disponível
3. **Conteúdo não atualiza**: Verifique se a função está sendo chamada em `updateDashboardFilters()`
4. **Altura inconsistente**: Confirme se o card está incluído nos seletores CSS

### Debug

Para debugar problemas:
```javascript
// Verificar se o container existe
console.log(document.getElementById("dashboard{Nome}Content"));

// Verificar se o card_header está disponível
console.log(window.App?.card_header?.card_header_createDynamic);
```

## 📚 Referências

- **Template base**: `app/templates/dashboard.html`
- **Estilos**: `app/static/css/dashboard.css`
- **JavaScript**: `app/static/js/contrato/dashboard.js`
- **Backend**: `app/endpoints/dashboard.py`

---

*Este documento foi criado baseado na transformação realizada nos 4 cards principais do dashboard: Contratos e Renovações, Contratos por Exercício, Representação Anual de Valores e Próximas Atividades.*
