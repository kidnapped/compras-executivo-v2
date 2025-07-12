/**
 * A generic manager for the reusable modal component.
 * Handles showing, hiding, and updating modal content.
 */

const modalEl = document.getElementById("reusable-modal");
const scrimEl = document.querySelector(".br-scrim");
const titleEl = document.getElementById("reusable-modal-title");
const bodyEl = document.getElementById("reusable-modal-body");

const open = () => {
  if (modalEl) modalEl.style.display = "block";
  if (scrimEl) scrimEl.style.display = "block";
  // Disable body scrolling when modal is open
  document.body.classList.add("modal-open");
};

const close = () => {
  if (modalEl) modalEl.style.display = "none";
  if (scrimEl) scrimEl.style.display = "none";
  // Re-enable body scrolling when modal is closed
  document.body.classList.remove("modal-open");
};

const setTitle = (title) => {
  if (titleEl) titleEl.textContent = title;
};

const setBody = (htmlContent) => {
  if (bodyEl) bodyEl.innerHTML = htmlContent;
};

const showLoading = () => {
  setBody('<div class="br-loading medium" role="progressbar"></div>');
};

const initialize = () => {
  // Add listeners to all elements that should close the modal
  document.querySelectorAll('[data-dismiss="br-modal"]').forEach((button) => {
    button.addEventListener("click", close);
  });
};

export default {
  initialize,
  open,
  close,
  setTitle,
  setBody,
  showLoading,
};
