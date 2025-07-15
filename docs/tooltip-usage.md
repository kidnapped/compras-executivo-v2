# Tooltip Component Documentation

## Overview

The tooltip component is based on the Gov.br Design System specification and provides interactive tooltips for your application elements. It follows the existing project structure and best practices.

## Basic Usage

### 1. Text Tooltips

Add tooltips using data attributes on any HTML element:

```html
<!-- Basic tooltip -->
<button data-tooltip-text="This is a helpful tooltip">Click me</button>

<!-- Positioned tooltip -->
<i
  class="fas fa-info-circle"
  data-tooltip-text="Additional information about this field"
  data-tooltip-place="right"
  data-tooltip-type="info"
></i>
```

### 2. Component Tooltips

For more complex tooltips with HTML content, create a hidden element and reference it:

```html
<!-- Tooltip activator -->
<button
  data-tooltip-target="complex-tooltip"
  data-tooltip-place="bottom"
  data-tooltip-type="info"
>
  Show Details
</button>

<!-- Hidden tooltip content -->
<div id="complex-tooltip" style="display: none;">
  <strong>Complex Content</strong>
  <p>This tooltip can contain HTML content like lists, links, etc.</p>
</div>
```

## Attributes

### Required Attributes

| Attribute             | Description                             | Example                            |
| --------------------- | --------------------------------------- | ---------------------------------- |
| `data-tooltip-text`   | Simple text tooltip                     | `data-tooltip-text="Help text"`    |
| `data-tooltip-target` | ID of element to use as tooltip content | `data-tooltip-target="my-tooltip"` |

### Optional Attributes

| Attribute                   | Values                                | Default | Description                 |
| --------------------------- | ------------------------------------- | ------- | --------------------------- |
| `data-tooltip-place`        | `top`, `bottom`, `left`, `right`      | `top`   | Tooltip position            |
| `data-tooltip-type`         | `info`, `success`, `warning`, `error` | `info`  | Tooltip style               |
| `data-tooltip-timer`        | Number (milliseconds)                 | None    | Auto-hide after X ms        |
| `data-tooltip-on-activator` | Present/absent                        | `false` | Append to activator element |

## JavaScript API

### Creating Tooltips Programmatically

```javascript
// Create a new tooltip
const tooltip = App.createTooltip({
  activator: document.getElementById("my-button"),
  textTooltip: "Dynamic tooltip text",
  place: "bottom",
  type: "success",
});

// Update tooltip text
tooltip.updateText("New tooltip text");

// Destroy tooltip
tooltip.destroy();
```

### Managing All Tooltips

```javascript
// Re-initialize all tooltips (useful after DOM changes)
App.initializeTooltips();

// Destroy all tooltips
App.destroyAllTooltips();
```

## Examples

### Information Icons

```html
<span>
  Username
  <i
    class="fas fa-info-circle"
    data-tooltip-text="Your username must be unique and contain only letters and numbers"
    data-tooltip-place="right"
    data-tooltip-type="info"
  ></i>
</span>
```

### Form Validation

```html
<input type="email" id="email-input" />
<i
  class="fas fa-exclamation-triangle text-warning"
  data-tooltip-text="Please enter a valid email address"
  data-tooltip-place="bottom"
  data-tooltip-type="warning"
  style="display: none;"
></i>
```

### Success Indicators

```html
<button
  class="btn btn-success"
  data-tooltip-text="Data saved successfully!"
  data-tooltip-type="success"
  data-tooltip-timer="3000"
>
  Save
</button>
```

### Error Messages

```html
<input
  type="password"
  data-tooltip-text="Password must be at least 8 characters long"
  data-tooltip-place="bottom"
  data-tooltip-type="error"
/>
```

## Styling

The tooltip styles are included in `app.css` and follow the Gov.br Design System color scheme:

- **Info**: Dark gray background (`#333`)
- **Success**: Green background (`#168821`)
- **Warning**: Yellow background (`#ffcd07`)
- **Error**: Red background (`#e52207`)

## Responsive Behavior

Tooltips automatically:

- Adjust position to stay within viewport
- Reduce size on smaller screens
- Support touch events on mobile devices

## Integration Notes

- Tooltips are automatically initialized on DOM ready
- Dynamic content is monitored and tooltips are re-initialized automatically
- No script tags needed in templates - everything is handled by the app.js module system
- Compatible with the existing modal manager and other components

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers with touch support
- Graceful degradation for older browsers
