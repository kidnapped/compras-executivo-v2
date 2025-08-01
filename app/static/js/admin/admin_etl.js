
// admin_etl.js
// Funções para tela ETL - Administração, estilo dashboard.js

export default {
  // Inicializa listeners dos cards ETL
  init() {
    document.querySelectorAll('.admin_etl-card-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-target');
        if (target) {
          window.location.href = target;
        }
      });
    });
  },

  // (Opcional) Poderia adicionar métodos para renderizar cards dinamicamente, se necessário
};
