/**
 * A generic tooltip manager for elements with title attributes.
 * Automatically converts title attributes to custom tooltips.
 */

const attachTooltip = (el) => {
  if (!el.hasAttribute('title')) return;
  
  // Store original title and remove it to prevent browser tooltip
  const originalTitle = el.getAttribute('title');
  el.removeAttribute('title');
  el.setAttribute('data-tooltip', originalTitle);
  
  el.addEventListener('mouseenter', function(e) {
    let tooltip = document.getElementById('custom-tooltip');
      if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'custom-tooltip';
          tooltip.style.position = 'fixed';
          tooltip.style.background = '#ffffff';
          tooltip.style.color = '#000000';
          tooltip.style.padding = '8px 12px';
          tooltip.style.borderRadius = '6px';
          tooltip.style.border = '1px solid #c5d9f1';
          tooltip.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          tooltip.style.pointerEvents = 'none';
          tooltip.style.fontSize = '14px';
          tooltip.style.fontFamily = 'Arial, sans-serif';
          tooltip.style.zIndex = '10000';
          tooltip.style.maxWidth = '300px';
          tooltip.style.wordWrap = 'break-word';
          tooltip.style.opacity = '0';
          tooltip.style.transition = 'opacity 0.2s ease-in-out';
          document.body.appendChild(tooltip);
      }

    const tooltipText = el.getAttribute('data-tooltip');
    if (tooltipText) {
      tooltip.textContent = tooltipText;
      tooltip.style.display = 'block';
      
      // Position tooltip
      const updatePosition = (e) => {
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = e.clientX + 10;
        let top = e.clientY + 10;
        
        // Adjust if tooltip goes off-screen
        if (left + rect.width > viewportWidth) {
          left = e.clientX - rect.width - 10;
        }
        if (top + rect.height > viewportHeight) {
          top = e.clientY - rect.height - 10;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      };
      
      updatePosition(e);
      
      // Show tooltip with fade-in
      setTimeout(() => {
        tooltip.style.opacity = '1';
      }, 10);
      
      // Update position on mouse move
      el._tooltipMoveHandler = updatePosition;
      el.addEventListener('mousemove', el._tooltipMoveHandler);
    }
  });

  el.addEventListener('mouseleave', () => {
    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      setTimeout(() => {
        tooltip.style.display = 'none';
      }, 200);
    }
    
    // Remove mouse move handler
    if (el._tooltipMoveHandler) {
      el.removeEventListener('mousemove', el._tooltipMoveHandler);
      el._tooltipMoveHandler = null;
    }
  });
};

const initializeExistingElements = () => {
  // Initialize tooltips on existing elements
  document.querySelectorAll('[title]').forEach(attachTooltip);
};

const observeNewElements = () => {
  // Watch for new elements being added to the DOM
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          // Check if the node itself has a title
          if (node.hasAttribute && node.hasAttribute('title')) {
            attachTooltip(node);
          }
          // Check for child elements with title
          if (node.querySelectorAll) {
            node.querySelectorAll('[title]').forEach(attachTooltip);
          }
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  return observer;
};

const initialize = () => {
  // Initialize tooltips on page load
  initializeExistingElements();
  
  // Start observing for new elements
  observeNewElements();
  
  console.log('Tooltip manager initialized');
};

export default {
  initialize,
  attachTooltip,
  initializeExistingElements,
};
