# Card Generator Component

A reusable JavaScript component for creating card layouts with table structures, designed to follow the project's Government Design System Brazil (GovBR-DS) patterns.

## Features

- ✅ Clean separation of concerns between DOM creation and data logic
- ✅ Modular and readable code structure
- ✅ XSS protection with HTML escaping
- ✅ Follows existing project design patterns
- ✅ Responsive table layouts
- ✅ Preset card configurations
- ✅ Easy data population utilities
- ✅ No external dependencies beyond project's existing CSS

## Basic Usage

### 1. Import the Component

```javascript
import CardGenerator from "./components/card-generator.js";
```

### 2. Create a Basic Card

```javascript
const card = CardGenerator.createCard({
  title: "Últimos Lançamentos",
  subtitle: "Valores financeiro e orçamentário deste contrato",
  tbodyId: "ultimos-lancamentos-tbody",
});

// Add to DOM
document.getElementById("container").appendChild(card);
```

### 3. Create a Card with Custom Headers

```javascript
const card = CardGenerator.createCard({
  title: "Histórico Orçamentário",
  subtitle: "Total de empenhos originais",
  tbodyId: "historico-orcamentario-tbody",
  headers: ["", "Data", "Valor"],
  icon: "/static/images/custom-icon.png", // Optional custom icon
  containerClass: "custom-card-class", // Optional additional CSS classes
});
```

## API Reference

### `createCard(options)`

Creates a complete card element with header, title, subtitle and table structure.

**Parameters:**

- `options.title` (string, required) - The card's main heading
- `options.subtitle` (string, required) - The card's subheading
- `options.tbodyId` (string, required) - The ID to assign to the tbody element
- `options.icon` (string, optional) - Icon URL (defaults to "/static/images/doc2.png")
- `options.headers` (Array, optional) - Table headers (defaults to empty, no header row)
- `options.containerClass` (string, optional) - Additional CSS classes for the card container

**Returns:** `HTMLElement` - The complete card DOM element

### `createPresetCard(layout, options)`

Creates a card using predefined layouts for common use cases.

**Available Layouts:**

- `'simple'` - Basic card with headers: ['#', 'Data', 'Descrição']
- `'financial'` - Financial data card with headers: ['#', 'Data', 'Tipo', 'Valor']
- `'data'` - General data card with headers: ['#', 'Item', 'Status', 'Detalhes']

**Example:**

```javascript
const financialCard = CardGenerator.createPresetCard("financial", {
  title: "Movimentações Financeiras",
  subtitle: "Pagamentos e transações do contrato",
  tbodyId: "financial-data-tbody",
});
```

### `populateTable(tbodyId, data, rowRenderer)`

Utility method to populate a table body with data.

**Parameters:**

- `tbodyId` (string, required) - ID of the tbody element to populate
- `data` (Array, required) - Array of row data objects
- `rowRenderer` (Function, optional) - Custom row renderer function

**Example:**

```javascript
const sampleData = [
  { number: "1", empenho: "2025NE001235", valor: "R$ 150.000,00" },
  { number: "2", empenho: "2025NE001236", valor: "R$ 75.500,00" },
];

CardGenerator.populateTable("my-tbody-id", sampleData);
```

## Custom Row Rendering

You can provide a custom row renderer function for more control over how data is displayed:

```javascript
const customRowRenderer = (rowData, index) => {
  return `
        <tr>
            <td>${index + 1}</td>
            <td><i class="fas fa-file-invoice"></i></td>
            <td>${rowData.empenho}</td>
            <td><strong>${rowData.valor}</strong></td>
        </tr>
    `;
};

CardGenerator.populateTable("my-tbody-id", data, customRowRenderer);
```

## Integration Examples

### Example 1: Basic Card Following Project Pattern

```javascript
// Create card matching the existing "Últimos Lançamentos" pattern
const ultimosLancamentosCard = CardGenerator.createCard({
  title: "Últimos Lançamentos",
  subtitle: "Valores financeiro e orçamentário deste contrato",
  tbodyId: "ultimos-lancamentos-tbody",
  headers: ["", "Data", "", "Detalhes"],
});

// Add to existing container
const container = document.querySelector(".col-6");
container.appendChild(ultimosLancamentosCard);
```

### Example 2: Empenhos Grid Card

```javascript
// Create card for empenhos data
const empenhosCard = CardGenerator.createCard({
  title: "Empenhos Originais",
  subtitle: "Lista numerada de empenhos do contrato",
  tbodyId: "empenhos-originais-tbody",
  headers: [
    "#",
    "",
    "Empenho",
    "Data",
    "",
    "Valor",
    "Espécie",
    "Orçamentário",
    "Finanças",
    "Saldo de empenho",
    "Status",
    "",
    "",
  ],
  containerClass: "h-100",
});

// Custom row renderer for empenhos
const renderEmpenhoRow = (empenho, index) => {
  return `
        <tr>
            <td>${index + 1}</td>
            <td><i class="fas fa-file-contract text-info"></i></td>
            <td>${empenho.numero}</td>
            <td>${empenho.data}</td>
            <td><i class="fas fa-money-bill-wave text-success"></i></td>
            <td>${empenho.valor}</td>
            <td>${empenho.especie}</td>
            <td>${empenho.orcamentario}</td>
            <td>${empenho.financas}</td>
            <td>${empenho.saldo}</td>
            <td><span class="badge badge-${empenho.status.toLowerCase()}">${
    empenho.status
  }</span></td>
            <td><i class="fas fa-chart-line" onclick="showChart(${
              empenho.id
            })"></i></td>
            <td><i class="fas fa-map-marker" onclick="showLocation(${
              empenho.id
            })"></i></td>
        </tr>
    `;
};

// Populate with data
CardGenerator.populateTable(
  "empenhos-originais-tbody",
  empenhosData,
  renderEmpenhoRow
);
```

## CSS Classes Used

The component uses the following CSS classes that should be defined in your project:

- `.br-card` - Main card container
- `.card-header` - Card header section
- `.card-content` - Card content section
- `.titulo` - Card title styling
- `.subtitulo` - Card subtitle styling
- `.table-responsive` - Responsive table wrapper
- `.br-table` - Table base styling
- `.table-hover` - Table hover effects
- `.text-center` - Center text alignment
- `.text-muted` - Muted text color

## Browser Compatibility

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Security

The component includes XSS protection by escaping all user-provided HTML content. All text content is escaped using `textContent` before being inserted into the DOM.

## Error Handling

The component includes validation for required parameters and will throw descriptive errors for missing required fields:

```javascript
// This will throw an error
try {
  const card = CardGenerator.createCard({
    title: "Missing subtitle and tbodyId",
  });
} catch (error) {
  console.error(error.message); // "title, subtitle, and tbodyId are required parameters"
}
```

## Performance Considerations

- DOM elements are created efficiently using `document.createElement`
- HTML escaping is performed only when necessary
- Event handlers are not attached by default (attach manually as needed)
- Table population handles large datasets efficiently

## Extending the Component

The component is designed to be easily extensible. You can add new preset layouts by modifying the `presets` object in the `createPresetCard` method:

```javascript
// Add a new preset in the component
const presets = {
  // ... existing presets
  custom: {
    headers: ["Custom", "Headers", "Here"],
    containerClass: "custom-card-styling",
  },
};
```
