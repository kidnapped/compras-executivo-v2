let CardGenerator;

async function loadCardGenerator() {
  try {
    const module = await import(
      "/static/js/encontro/component/card-generator.js"
    );
    CardGenerator = module.default || window.CardGenerator;
    return CardGenerator;
  } catch (error) {
    console.error("Failed to load CardGenerator:", error);
    // Fallback to global
    return window.CardGenerator;
  }
}

/**
 * Encontro de Contas - Initialization Module
 * Handles page load, card creation, and data fetching orchestration
 */

const EncontroInit = {
  /**
   * Initialize the encontro page
   */
  async init() {
    try {
      console.log("🚀 Initializing Encontro de Contas...");

      // Load CardGenerator first
      CardGenerator = await loadCardGenerator();

      if (!CardGenerator) {
        throw new Error("CardGenerator could not be loaded");
      }

      console.log("✅ CardGenerator loaded successfully");

      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.onDOMReady());
      } else {
        this.onDOMReady();
      }
    } catch (error) {
      console.error("❌ Error initializing encontro:", error);
    }
  },

  /**
   * Called when DOM is fully loaded
   */
  onDOMReady() {
    console.log("✅ DOM Ready - Creating cards...");

    try {
      // Only create cards if we're on the encontro page
      if (this.isEncontroPage()) {
        // Create all the cards for the encontro page
        this.createPageCards();

        // Initialize API data fetching (if needed)
        this.initializeDataFetching();
      }

      console.log("✅ Encontro initialization complete");
    } catch (error) {
      console.error("❌ Error initializing encontro:", error);
    }
  },

  /**
   * Check if we're on the encontro de contas page
   */
  isEncontroPage() {
    return (
      window.location.pathname.includes("encontro-de-contas") ||
      document.querySelector("#ultimos-lancamentos-container") !== null
    );
  },

  /**
   * Creates all the cards for the encontro page
   */
  createPageCards() {
    console.log("🎨 Creating page cards...");

    // Verify CardGenerator is available
    if (!CardGenerator) {
      console.error("❌ CardGenerator not available for createPageCards");
      return;
    }

    // 1. Replace "Últimos Lançamentos" card
    //this.createUltimosLancamentosCard();

    // 2. Replace "Histórico Orçamentário" card
    //this.createHistoricoOrcamentarioCard();

    // 3. Replace "Empenhos Originais" card
    //this.createEmpenhosOriginaisCard();

    // 4. Create additional test cards
    // this.createTestCards();
  },

  /**
   * Creates the "Últimos Lançamentos" card
   */
  createUltimosLancamentosCard() {
    if (!CardGenerator) {
      console.error(
        "❌ CardGenerator not available for createUltimosLancamentosCard"
      );
      return;
    }

    const container = document.querySelector("#ultimos-lancamentos-container");
    if (!container) {
      console.warn("Container #ultimos-lancamentos-container not found");
      return;
    }

    const card = CardGenerator.createCard({
      title: "Últimos Lançamentos",
      subtitle: "Valores financeiro e orçamentário deste contrato",
      tbodyId: "ultimos-lancamentos-tbody",
      headers: ["📄", "Data", "💰", "Detalhes"],
      containerClass: "h-100",
    });

    // Replace the existing container content
    container.parentNode.replaceChild(card, container);
    card.id = "ultimos-lancamentos-container"; // Preserve the ID

    // Populate with sample data
    setTimeout(() => {
      CardGenerator.populateTable("ultimos-lancamentos-tbody", [
        {
          icon: "📄",
          data: "15/01/2025",
          money: "ℹ️",
          detalhes: "2023NE000983 - R$ 5.000,00",
        },
        {
          icon: "📄",
          data: "16/01/2025",
          money: "ℹ️",
          detalhes: "Pagamento Parcial - R$ 2.500,00",
        },
        {
          icon: "📄",
          data: "17/01/2025",
          money: "ℹ️",
          detalhes: "Saldo Restante - R$ 2.500,00",
        },
      ]);
    }, 500);

    console.log("✅ Últimos Lançamentos card created");
  },

  /**
   * Creates the "Histórico Orçamentário" card
   */
  createHistoricoOrcamentarioCard() {
    if (!CardGenerator) {
      console.error(
        "❌ CardGenerator not available for createHistoricoOrcamentarioCard"
      );
      return;
    }

    const container = document.querySelector(
      "#historico-orcamentario-container"
    );
    if (!container) {
      console.warn("Container #historico-orcamentario-container not found");
      return;
    }

    const card = CardGenerator.createPresetCard("financial", {
      title: "Histórico Orçamentário",
      subtitle: "Total de empenhos originais",
      tbodyId: "historico-orcamentario-tbody",
      headers: ["", "Data", "Valor"],
      containerClass: "h-100",
    });

    container.parentNode.replaceChild(card, container);
    card.id = "historico-orcamentario-container";

    // Populate with sample data
    setTimeout(() => {
      CardGenerator.populateTable("historico-orcamentario-tbody", [
        {
          icon: "📊",
          data: "Janeiro/2025",
          valor: "R$ 15.000,00",
        },
        {
          icon: "📈",
          data: "Dezembro/2024",
          valor: "R$ 12.500,00",
        },
        {
          icon: "📊",
          data: "Novembro/2024",
          valor: "R$ 8.750,00",
        },
      ]);
    }, 750);

    console.log("✅ Histórico Orçamentário card created");
  },

  /**
   * Creates the "Empenhos Originais" card
   */
  createEmpenhosOriginaisCard() {
    if (!CardGenerator) {
      console.error(
        "❌ CardGenerator not available for createEmpenhosOriginaisCard"
      );
      return;
    }

    const container = document.querySelector("#empenhos-originais-container");
    if (!container) {
      console.warn("Container #empenhos-originais-container not found");
      return;
    }

    const card = CardGenerator.createCard({
      title: "Empenhos Originais",
      subtitle: "Lista numerada de empenhos do contrato",
      tbodyId: "empenhos-originais-tbody",
      headers: [
        "#",
        "C",
        "Empenho",
        "Data",
        "Valor",
        "Espécie",
        "Orçamentária",
        "finanças",
        "Saldo",
        "PP",
        "G",
      ],
      containerClass: "h-100",
    });

    container.parentNode.replaceChild(card, container);
    card.id = "empenhos-originais-container";

    // Populate with sample data
    setTimeout(() => {
      CardGenerator.populateTable("empenhos-originais-tbody", [
        {
          numero: 1,
          empenho: "2025NE001001",
          data: "05/01/2025",
          valor: "R$ 8.000,00",
          status: "✅ Ativo",
        },
        {
          numero: 2,
          empenho: "2025NE001002",
          data: "08/01/2025",
          valor: "R$ 5.000,00",
          status: "✅ Ativo",
        },
        {
          numero: 3,
          empenho: "2025NE001003",
          data: "12/01/2025",
          valor: "R$ 2.000,00",
          status: "⏳ Pendente",
        },
        {
          numero: 4,
          empenho: "2025NE001004",
          data: "15/01/2025",
          valor: "R$ 3.500,00",
          status: "❌ Cancelado",
        },
      ]);
    }, 1000);

    console.log("✅ Empenhos Originais card created");
  },

  /**
   * Creates additional test cards in empty containers
   */
  createTestCards() {
    if (!CardGenerator) {
      console.error("❌ CardGenerator not available for createTestCards");
      return;
    }

    // Create test card in the financeiro grid container
    this.createFinanceiroGridCard();

    // Create test card in the movimentacoes container
    this.createMovimentacoesCard();
  },

  /**
   * Creates a card for the financeiro grid container
   */
  createFinanceiroGridCard() {
    if (!CardGenerator) return;

    const container = document.querySelector("#financeiro-grid-container");
    if (!container) return;

    const card = CardGenerator.createPresetCard("financial", {
      title: "Grid Financeiro",
      subtitle: "Movimentações financeiras detalhadas",
      tbodyId: "financeiro-grid-tbody",
      headers: ["#", "Data", "Padamento", "i", "Tipo", "Parcial", "Nominal"],
    });

    // Replace content but keep the container structure
    container.innerHTML = "";
    container.appendChild(card.querySelector(".card-header"));
    container.appendChild(card.querySelector(".card-content"));

    // Populate with sample data
    setTimeout(() => {
      CardGenerator.populateTable("financeiro-grid-tbody", [
        {
          numero: "PAG001",
          data: "15/01/2025",
          tipo: "Pagamento",
          valor: "R$ 2.500,00",
        },
        {
          numero: "PAG002",
          data: "18/01/2025",
          tipo: "Estorno",
          valor: "- R$ 500,00",
        },
        {
          numero: "PAG003",
          data: "20/01/2025",
          tipo: "Pagamento",
          valor: "R$ 1.800,00",
        },
      ]);
    }, 1250);

    console.log("✅ Financeiro Grid card created");
  },

  /**
   * Creates a card for the movimentacoes container
   */
  createMovimentacoesCard() {
    if (!CardGenerator) return;

    const container = document.querySelector("#movimentacoes-container");
    if (!container) {
      console.warn("Container #movimentacoes-container not found");
      return;
    }

    const card = CardGenerator.createCard({
      title: "Movimentações",
      subtitle: "Histórico de movimentações do contrato",
      tbodyId: "movimentacoes-tbody",
      headers: ["Data", "Tipo", "Valor", "Status"],
      containerClass: "h-100",
    });

    // Replace content but keep the container structure
    container.innerHTML = "";
    container.appendChild(card.querySelector(".card-header"));
    container.appendChild(card.querySelector(".card-content"));

    // Populate with sample data
    setTimeout(() => {
      CardGenerator.populateTable("movimentacoes-tbody", [
        {
          data: "15/01/2025",
          tipo: "Empenho",
          valor: "R$ 10.000,00",
          status: "✅ Confirmado",
        },
        {
          data: "18/01/2025",
          tipo: "Liquidação",
          valor: "R$ 8.500,00",
          status: "✅ Processado",
        },
        {
          data: "20/01/2025",
          tipo: "Pagamento",
          valor: "R$ 7.200,00",
          status: "⏳ Pendente",
        },
      ]);
    }, 1500);

    console.log("✅ Movimentações card created");
  },

  /**
   * Initialize data fetching (placeholder for future API integration)
   */
  async initializeDataFetching() {
    console.log("📡 Initializing data fetching...");

    // Check if there's a contract ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get("contrato");

    if (contratoId) {
      console.log(`🔍 Found contract ID: ${contratoId}`);

      try {
        // Load and instantiate the EncontroContas class
        console.log("📦 Loading EncontroContas module...");
        const EncontroContasModule = await import(
          "/static/js/encontro/encontro-contas.js"
        );
        const EncontroContas = EncontroContasModule.default;

        console.log("🏗️ Creating EncontroContas instance...");
        window.EncontroContas = new EncontroContas();

        console.log(
          "✅ EncontroContas instance created and assigned to window.EncontroContas"
        );
      } catch (error) {
        console.error("❌ Error loading EncontroContas:", error);
      }
    } else {
      console.log("ℹ️ No contract ID found, using sample data");
    }
  },

  /**
   * Update cards with real API data (placeholder)
   */
  updateCardsWithRealData() {
    console.log("🔄 Updating cards with real data...");
    // This would be called after API data is loaded
    // You would replace the sample data with real data here
  },

  /**
   * Utility method to show loading state on a card
   */
  showCardLoading(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="100%" class="text-center" style="padding: 40px;">
            <div class="br-loading" role="progressbar">
              <div class="br-loading-text">Carregando...</div>
            </div>
          </td>
        </tr>
      `;
    }
  },

  /**
   * Utility method to show error state on a card
   */
  showCardError(tbodyId, errorMessage = "Erro ao carregar dados") {
    const tbody = document.getElementById(tbodyId);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="100%" class="text-center" style="padding: 40px;">
            <div class="text-danger">
              <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <br />
              ${errorMessage}
            </div>
          </td>
        </tr>
      `;
    }
  },

  /**
   * Utility methods for external access
   */

  // Manual methods for testing/debugging
  loadContractData(contratoId) {
    console.log(`📋 Loading contract data for ID: ${contratoId}`);
    // This would integrate with your API modules when they're ready
    // Example: return EncontroAPI.fetchEncontroData(contratoId)
    return Promise.resolve({ message: `Contract ${contratoId} data loaded` });
  },

  refreshCards() {
    console.log("🔄 Refreshing all cards...");
    if (this.isEncontroPage()) {
      this.createPageCards();
    }
  },
};

// Auto-initialize when script loads
EncontroInit.init();

// Expose to global scope for debugging/manual control
window.EncontroInit = EncontroInit;

// Export as default for ES6 module import
export default EncontroInit;
