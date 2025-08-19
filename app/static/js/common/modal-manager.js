/**
 * A generic manager for the reusable modal component.
 * Creates and destroys modals dynamically to avoid positioning issues.
 */

let modalEl = null;
let scrimEl = null;
let titleEl = null;
let bodyEl = null;
let originalBodyStyles = null;

const createModal = () => {
  // Prevent multiple modals
  if (modalEl || scrimEl) {
    console.warn("Modal already exists, destroying previous instance");
    destroyModal();
  }

  // Store original body styles for safe restoration
  originalBodyStyles = {
    overflow: document.body.style.overflow,
    position: document.body.style.position,
    width: document.body.style.width,
    top: document.body.style.top,
  };

  try {
    // Create scrim
    scrimEl = document.createElement("div");
    scrimEl.className = "modal-scrim-dynamic";

    // Use setAttribute for better cross-browser compatibility
    Object.assign(scrimEl.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: "10998",
      display: "block",
      margin: "0",
      padding: "0",
    });

    scrimEl.setAttribute("data-dismiss", "modal-dynamic");
    scrimEl.setAttribute("role", "presentation");
    scrimEl.setAttribute("aria-hidden", "true");

    // Create modal
    modalEl = document.createElement("div");
    modalEl.id = "dynamic-modal";
    modalEl.className = "modal-container-dynamic";

    // Use Object.assign for better style management
    Object.assign(modalEl.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10999",
      padding: "20px",
      boxSizing: "border-box",
      margin: "0",
    });

    // Create modal structure with minimal classes
    modalEl.innerHTML = `
    <div class="modal-dialog-dynamic" style="
      max-width: 90vw; 
      max-height: 90vh; 
      margin: 0; 
      width: 100%; 
      max-width: 800px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      overflow: hidden;
    ">
      <div class="modal-content-dynamic" style="
        max-height: 90vh; 
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      ">
        <div class="modal-header-dynamic" style="
          padding: 16px 20px;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
        ">
          <div class="modal-title-dynamic" id="dynamic-modal-title" style="
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin: 0;
          ">Modal Title</div>
          <button class="modal-close-btn" type="button" aria-label="Fechar" data-dismiss="modal-dynamic" style="
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
            color: #666;
            border-radius: 4px;
          ">
            ✕
          </button>
        </div>
        <div class="modal-body-dynamic" id="dynamic-modal-body" style="
          padding: 20px;
          flex: 1;
          overflow-y: auto;
        ">
          Modal content
        </div>
      </div>
    </div>
  `;

    // Get references to elements
    titleEl = modalEl.querySelector("#dynamic-modal-title");
    bodyEl = modalEl.querySelector("#dynamic-modal-body");

    // Add close event listeners
    modalEl
      .querySelectorAll('[data-dismiss="modal-dynamic"]')
      .forEach((button) => {
        button.addEventListener("click", close);
      });

    // Close when clicking on the modal background (not the content)
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) {
        close();
      }
    });

    // Also close when clicking on scrim
    scrimEl.addEventListener("click", close);

    // Append to body
    document.body.appendChild(scrimEl);
    document.body.appendChild(modalEl);

    // Prevent body scrolling
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  } catch (error) {
    console.error("Error creating modal:", error);
    destroyModal(); // Clean up on error
  }
};

const destroyModal = () => {
  try {
    // Remove elements from DOM
    if (scrimEl && scrimEl.parentNode) {
      scrimEl.parentNode.removeChild(scrimEl);
    }
    if (modalEl && modalEl.parentNode) {
      modalEl.parentNode.removeChild(modalEl);
    }

    // Reset references
    modalEl = null;
    scrimEl = null;
    titleEl = null;
    bodyEl = null;

    // Restore body scrolling safely
    if (originalBodyStyles) {
      document.body.style.overflow = originalBodyStyles.overflow || "";
      document.body.style.position = originalBodyStyles.position || "";
      document.body.style.width = originalBodyStyles.width || "";
      document.body.style.top = originalBodyStyles.top || "";
    } else {
      // Fallback if originalBodyStyles wasn't set
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    }
  } catch (error) {
    console.error("Error destroying modal:", error);
    // Force cleanup even if there's an error
    modalEl = null;
    scrimEl = null;
    titleEl = null;
    bodyEl = null;

    // Force restore body styles
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.top = "";
  }
};

const open = () => {
  if (!modalEl) {
    createModal();
  }
};

const close = () => {
  destroyModal();
};

const setTitle = (title) => {
  if (titleEl) titleEl.textContent = title;
};

const setBody = (htmlContent) => {
  if (bodyEl) bodyEl.innerHTML = htmlContent;
};

const showLoading = () => {
  setBody(
    '<div style="text-align: center; padding: 40px;"><div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>'
  );
};

const initialize = () => {
  // No initialization needed since we create modals dynamically
  console.log("Modal manager initialized - using dynamic modal creation");
};

export default {
  initialize,
  open,
  close,
  setTitle,
  setBody,
  showLoading,
};
