# Componente Breadcrumb

## Estrutura dos Arquivos

```
app/
├── templates/
│   └── partials/
│       └── breadcrumb.html              # Template do componente
├── static/
│   ├── css/
│   │   └── common/
│   │       └── breadcrumb.css           # Estilos do componente
│   └── js/
│       └── common/
│           ├── breadcrumb.js            # JavaScript do componente
│           └── breadcrumb-config.js     # Configurações e padrões
```

## Como Usar

### 1. Uso Básico no Template

```html
<!-- Definir os items do breadcrumb -->
{% set breadcrumb_items = [
  {'title': 'Página Inicial', 'icon': 'fas fa-home', 'url': '/inicio'},
  {'title': 'Administração', 'icon': 'fas fa-cog', 'url': '/admin'},
  {'title': 'ETL', 'icon': 'fas fa-database', 'url': '/admin/etl'},
  {'title': 'DW Tesouro', 'icon': 'fas fa-chart-bar', 'url': ''}
] %}

<!-- Incluir o componente -->
{% include 'partials/breadcrumb.html' %}
```

### 2. Incluir CSS e JS

```html
{% block stylesheets %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/common/breadcrumb.css') }}">
<!-- outros estilos -->
{% endblock %}

{% block scripts %}
<script src="{{ url_for('static', filename='js/common/breadcrumb.js') }}"></script>
<script src="{{ url_for('static', filename='js/common/breadcrumb-config.js') }}"></script>
<!-- outros scripts -->
{% endblock %}
```

### 3. Uso com Padrões Pré-definidos

```html
<!-- Usar padrão do dashboard -->
{% set breadcrumb_items = breadcrumb_patterns.DASHBOARD %}
{% include 'partials/breadcrumb.html' %}

<!-- Ou definir no JavaScript -->
<script>
// Usar padrão administrativo
const breadcrumb = window.BreadcrumbPatterns.ADMIN_DW_TESOURO;
window.BreadcrumbComponent.updateBreadcrumb(breadcrumb);
</script>
```

### 4. Uso Dinâmico com JavaScript

```javascript
// Atualizar breadcrumb dinamicamente
const newItems = [
  { title: 'Home', icon: 'fas fa-home', url: '/' },
  { title: 'Dashboard', icon: 'fas fa-tachometer-alt', url: '/dashboard' },
  { title: 'Relatórios', icon: 'fas fa-chart-line', url: '' }
];

window.BreadcrumbComponent.updateBreadcrumb(newItems);

// Obter caminho atual
const currentPath = window.BreadcrumbComponent.getCurrentPath();
console.log(currentPath);

// Usar padrões pré-definidos
window.BreadcrumbComponent.updateBreadcrumb(window.BreadcrumbPatterns.ADMIN_DW_TESOURO);

// Gerar breadcrumb dinâmico
const dynamicBreadcrumb = window.BreadcrumbUtils.generateDynamicBreadcrumb('admin', 'etl', 'DW Tesouro');
window.BreadcrumbComponent.updateBreadcrumb(dynamicBreadcrumb);

// Criar caminho customizado
const customPath = window.BreadcrumbUtils.createCustomPath('ADMIN_ROOT', {
  title: 'Nova Página',
  icon: 'fas fa-star',
  url: ''
});
window.BreadcrumbComponent.updateBreadcrumb(customPath);
```

## Padrões Pré-definidos

O componente inclui padrões comuns de navegação:

- `HOME` - Apenas página inicial
- `DASHBOARD` - Início → Dashboard
- `ADMIN_ROOT` - Início → Administração
- `ADMIN_USERS` - Início → Administração → Usuários
- `ADMIN_ETL` - Início → Administração → ETL
- `ADMIN_DW_TESOURO` - Início → Administração → ETL → DW Tesouro
- `REPORTS_ROOT` - Início → Relatórios
- `REPORTS_FINANCIAL` - Início → Relatórios → Financeiro
- `CONTRACTS_ROOT` - Início → Contratos
- `CONTRACTS_DETAIL` - Início → Contratos → Detalhes

## Estrutura dos Items

Cada item do breadcrumb deve ter a seguinte estrutura:

```javascript
{
  title: 'Título do Item',    // Texto exibido
  icon: 'fas fa-icon-name',   // Classe do ícone FontAwesome
  url: '/caminho/da/url'      // URL do link (vazio para item ativo)
}
```

## Características

- **Responsivo**: Esconde textos em telas pequenas, mostra apenas ícones
- **Tooltips**: Adiciona tooltips aos ícones em dispositivos móveis
- **Dinâmico**: Permite atualização via JavaScript
- **Acessível**: Inclui ARIA labels e estrutura semântica
- **Modular**: Fácil de reutilizar em qualquer template

## Exemplos de Uso

### Dashboard
```html
{% set breadcrumb_items = [
  {'title': 'Início', 'icon': 'fas fa-home', 'url': '/'},
  {'title': 'Dashboard', 'icon': 'fas fa-tachometer-alt', 'url': ''}
] %}
{% include 'partials/breadcrumb.html' %}
```

### Página de Admin
```html
{% set breadcrumb_items = [
  {'title': 'Início', 'icon': 'fas fa-home', 'url': '/'},
  {'title': 'Administração', 'icon': 'fas fa-cog', 'url': '/admin'},
  {'title': 'Usuários', 'icon': 'fas fa-users', 'url': ''}
] %}
{% include 'partials/breadcrumb.html' %}
```

### Página de Relatórios
```html
{% set breadcrumb_items = [
  {'title': 'Início', 'icon': 'fas fa-home', 'url': '/'},
  {'title': 'Relatórios', 'icon': 'fas fa-chart-line', 'url': '/relatorios'},
  {'title': 'Financeiro', 'icon': 'fas fa-dollar-sign', 'url': ''}
] %}
{% include 'partials/breadcrumb.html' %}
```
