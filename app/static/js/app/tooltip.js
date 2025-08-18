/**
 * Tooltip component based on Gov.br Design System
 * Handles initialization and management of tooltips throughout the application
 */

class Tooltip {
  constructor(config) {
    this.activator = config.activator;
    this.place = config.place || "top";
    this.textTooltip = config.textTooltip || "";
    this.type = config.type || "info";
    this.timer = config.timer || null;
    this.onActivator = config.onActivator || false;
    this.component = config.component || null;

    this.tooltipElement = null;
    this.isVisible = false;
    this.hideTimeout = null;

    this.init();
  }

  init() {
    if (!this.activator) return;

    this.createTooltipElement();
    this.bindEvents();
  }

  createTooltipElement() {
    this.tooltipElement = document.createElement("div");
    this.tooltipElement.className = `br-tooltip ${this.type} ${this.place}`;
    this.tooltipElement.setAttribute("role", "tooltip");
    this.tooltipElement.style.position = "absolute";
    this.tooltipElement.style.zIndex = "9999";
    this.tooltipElement.style.visibility = "hidden";
    this.tooltipElement.style.opacity = "0";
    this.tooltipElement.style.transition =
      "opacity 0.2s ease, visibility 0.2s ease";

    // Create tooltip content
    if (this.component) {
      const targetElement = document.getElementById(this.component);
      if (targetElement) {
        this.tooltipElement.appendChild(targetElement.cloneNode(true));
      }
    } else {
      this.tooltipElement.textContent = this.textTooltip;
    }

    // Append to activator or body
    if (this.onActivator && this.activator.style.position !== "static") {
      this.activator.appendChild(this.tooltipElement);
    } else {
      document.body.appendChild(this.tooltipElement);
    }
  }

  bindEvents() {
    this.activator.addEventListener("mouseenter", () => this.show());
    this.activator.addEventListener("mouseleave", () => this.hide());
    this.activator.addEventListener("focus", () => this.show());
    this.activator.addEventListener("blur", () => this.hide());

    // Touch events for mobile
    this.activator.addEventListener("touchstart", () => this.show());
    this.activator.addEventListener("touchend", () => this.hide(true));
  }

  show() {
    if (this.isVisible) return;

    this.clearHideTimeout();
    this.positionTooltip();

    this.tooltipElement.style.visibility = "visible";
    this.tooltipElement.style.opacity = "1";
    this.isVisible = true;

    // Auto-hide if timer is set
    if (this.timer) {
      this.hideTimeout = setTimeout(() => this.hide(), this.timer);
    }
  }

  hide(immediate = false) {
    if (!this.isVisible) return;

    this.clearHideTimeout();

    if (immediate) {
      this.tooltipElement.style.visibility = "hidden";
      this.tooltipElement.style.opacity = "0";
      this.isVisible = false;
    } else {
      // Small delay to prevent flickering when moving between activator and tooltip
      this.hideTimeout = setTimeout(() => {
        this.tooltipElement.style.visibility = "hidden";
        this.tooltipElement.style.opacity = "0";
        this.isVisible = false;
      }, 100);
    }
  }

  positionTooltip() {
    if (!this.tooltipElement || !this.activator) return;

    const activatorRect = this.activator.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    let top, left;

    switch (this.place) {
      case "top":
        top = activatorRect.top + scrollTop - tooltipRect.height - 8;
        left =
          activatorRect.left +
          scrollLeft +
          (activatorRect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = activatorRect.bottom + scrollTop + 8;
        left =
          activatorRect.left +
          scrollLeft +
          (activatorRect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top =
          activatorRect.top +
          scrollTop +
          (activatorRect.height - tooltipRect.height) / 2;
        left = activatorRect.left + scrollLeft - tooltipRect.width - 8;
        break;
      case "right":
        top =
          activatorRect.top +
          scrollTop +
          (activatorRect.height - tooltipRect.height) / 2;
        left = activatorRect.right + scrollLeft + 8;
        break;
      default:
        top = activatorRect.top + scrollTop - tooltipRect.height - 8;
        left =
          activatorRect.left +
          scrollLeft +
          (activatorRect.width - tooltipRect.width) / 2;
    }

    // Ensure tooltip stays within viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    if (left < 0) left = 8;
    if (left + tooltipRect.width > viewport.width) {
      left = viewport.width - tooltipRect.width - 8;
    }
    if (top < scrollTop) top = scrollTop + 8;
    if (top + tooltipRect.height > scrollTop + viewport.height) {
      top = scrollTop + viewport.height - tooltipRect.height - 8;
    }

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }

  clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  destroy() {
    this.clearHideTimeout();
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
    }
  }

  updateText(newText) {
    this.textTooltip = newText;
    if (this.tooltipElement && !this.component) {
      this.tooltipElement.textContent = newText;
    }
  }
}

// Tooltip manager for handling multiple tooltips
const tooltipInstances = [];

const initializeTooltips = () => {
  // Clear existing tooltips
  destroyAllTooltips();

  // Initialize tooltips with data-tooltip-text attribute
  document.querySelectorAll("[data-tooltip-text]").forEach((element) => {
    const textTooltip = element.getAttribute("data-tooltip-text");
    const place = element.getAttribute("data-tooltip-place") || "top";
    const type = element.getAttribute("data-tooltip-type") || "info";
    const timer = element.getAttribute("data-tooltip-timer");
    const onActivator = element.hasAttribute("data-tooltip-on-activator");

    const config = {
      activator: element,
      place,
      textTooltip,
      type,
      timer: timer ? parseInt(timer) : null,
      onActivator,
    };

    const tooltip = new Tooltip(config);
    tooltipInstances.push(tooltip);
  });

  // Initialize tooltips with data-tooltip-target attribute
  document.querySelectorAll("[data-tooltip-target]").forEach((element) => {
    const targetId = element.getAttribute("data-tooltip-target");
    const place = element.getAttribute("data-tooltip-place") || "top";
    const type = element.getAttribute("data-tooltip-type") || "info";
    const timer = element.getAttribute("data-tooltip-timer");
    const onActivator = element.hasAttribute("data-tooltip-on-activator");

    const config = {
      activator: element,
      place,
      type,
      timer: timer ? parseInt(timer) : null,
      onActivator,
      component: targetId,
    };

    const tooltip = new Tooltip(config);
    tooltipInstances.push(tooltip);
  });
};

const destroyAllTooltips = () => {
  tooltipInstances.forEach((tooltip) => tooltip.destroy());
  tooltipInstances.length = 0;
};

const createTooltip = (config) => {
  const tooltip = new Tooltip(config);
  tooltipInstances.push(tooltip);
  return tooltip;
};

const initialize = () => {
  initializeTooltips();

  // Re-initialize tooltips when DOM changes (for dynamic content)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if any added nodes have tooltip attributes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const hasTooltipText =
              node.hasAttribute && node.hasAttribute("data-tooltip-text");
            const hasTooltipTarget =
              node.hasAttribute && node.hasAttribute("data-tooltip-target");
            const containsTooltips =
              node.querySelector &&
              (node.querySelector("[data-tooltip-text]") ||
                node.querySelector("[data-tooltip-target]"));

            if (hasTooltipText || hasTooltipTarget || containsTooltips) {
              // Delay to ensure DOM is ready
              setTimeout(initializeTooltips, 100);
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

export default {
  initialize,
  initializeTooltips,
  destroyAllTooltips,
  createTooltip,
  Tooltip,
};
