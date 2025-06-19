import getEcharts from "../util/echarts.js";

export default {
  dashboardGridFiltroOpcoes() {
    const box = document.getElementById("filtro-opcoes-menu");
    if (box) {
      box.style.display = box.style.display === "none" ? "block" : "none";
    }
  },

  dashboardContratosCard() {
    const container = document.getElementById("card-contratos-container");
    if (!container) return;

    fetch("/dashboard/contratos")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data) => {
        container.outerHTML = this.renderDashboardCardContratos(data);
      })
      .catch((err) => {
        container.innerHTML =
          '<div class="text-danger">Erro ao carregar dados</div>';
        console.error("Erro ao buscar contratos:", err);
      });
  },

  async dashboardContratosPorExercicioCard() {
    const container = document.getElementById(
      "card-contratos-exercicio-container"
    );
    if (!container) return;

    try {
      const res = await fetch("/dashboard/contratos-por-exercicio");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();

      const novoCard = this.renderDashboardCardContratosPorExercicio({
        id: "grafico-contratos-por-exercicio",
        titulo: "Contratos por exercício",
        subtitulo: "Histórico de contratos por ano",
        icone: "/static/images/doc2.png",
      });

      const wrapper = document.createElement("div");
      wrapper.innerHTML = novoCard.trim();
      const novoElemento = wrapper.firstChild;
      const parent = container.parentElement;
      if (parent) parent.replaceChild(novoElemento, container);

      const chartDom = document.getElementById(
        "grafico-contratos-por-exercicio"
      );
      if (!chartDom) return;

      const echarts = await getEcharts();
      const chart = echarts.init(chartDom);
      chart.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (p) =>
            `${p[0].axisValue}<br/><strong>${p[0].data} Contratos</strong>`,
        },
        grid: { right: 20 },
        xAxis: {
          type: "category",
          data: data.anos,
          axisLabel: { rotate: 45, fontSize: 11 },
        },
        yAxis: {
          type: "value",
          axisLabel: { show: false },
          splitLine: { show: true },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        series: [
          {
            name: "Contratos",
            type: "bar",
            data: data.valores,
            itemStyle: { color: "#5470C6" },
            barMaxWidth: 20,
          },
        ],
      });
    } catch (err) {
      console.error("Erro ao carregar gráfico:", err);
    }
  },

  async dashboardRepresentacaoAnualValores() {
    const container = document.getElementById(
      "card-representacao-anual-valores"
    );
    if (!container) return;

    try {
      const res = await fetch("/dashboard/valores-por-exercicio");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();

      const novoCard = App.renderDashboardCardContratosPorExercicio({
        id: "grafico-representacao-anual-valores",
        titulo: "Valores por exercício",
        subtitulo: "Valores de contratos nos últimos 6 anos",
        icone: "/static/images/clock.png",
      });

      const wrapper = document.createElement("div");
      wrapper.innerHTML = novoCard.trim();
      const novoElemento = wrapper.firstChild;
      const parent = container.parentElement;
      if (parent) parent.replaceChild(novoElemento, container);

      const chartDom = document.getElementById(
        "grafico-representacao-anual-valores"
      );
      if (!chartDom) return;

      const echarts = await getEcharts();
      const chart = echarts.init(chartDom);
      chart.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (p) =>
            `${
              p[0].axisValue
            }<br/><strong>R$ ${p[0].data.toLocaleString()}</strong>`,
        },
        grid: { right: 20 },
        xAxis: {
          type: "category",
          data: data.anos,
          axisLabel: { rotate: 45, fontSize: 11 },
        },
        yAxis: {
          type: "value",
          axisLabel: { show: false },
          splitLine: { show: true },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        series: [
          {
            name: "Contratos",
            type: "bar",
            data: data.coluna,
            itemStyle: { color: "#0072c6" },
            barMaxWidth: 20,
          },
          {
            name: "Aditivos",
            type: "line",
            data: data.linha,
            smooth: true,
            lineStyle: { width: 3, color: "#0099ff" },
            symbol: "circle",
            symbolSize: 10,
            itemStyle: {
              borderWidth: 2,
              borderColor: "#fff",
              color: "#5470c6",
            },
          },
        ],
      });
    } catch (err) {
      console.error("Erro ao carregar gráfico de valores:", err);
    }
  },

  dashboardProximasAtividades() {
    const container = document.getElementById("card-proximas-atividades");
    if (!container) return;

    fetch("/dashboard/atividades")
      .then((res) => res.json())
      .then((data) => {
        const atividades = data.atividades || [];
        const conteudo = atividades
          .slice(0, 50)
          .map((atividade) => {
            const diasExibir =
              atividade.dias_restantes < 45
                ? 45
                : atividade.dias_restantes > 90
                ? 120
                : 90;
            const dia = atividade.dias_restantes === 1 ? "dia" : "dias";

            return `
        <div class="widget-atividades-item">
          <i class="fas fa-clock"></i>
          <a href="#">${atividade.data}</a>
          <span>em ${atividade.dias_restantes} ${dia}</span><br>
          Renovação de <b>${diasExibir} dias</b> para o contrato ${atividade.numero}
        </div>`;
          })
          .join("");

        container.innerHTML = `
          <div class="br-card h-100 card-contratos">
            <div class="card-content" style="padding: 0px; height: 186px !important;">
              <div class="widget-atividades-box">
                <div class="widget-atividades-header">
                  <i class="fas fa-chart-line"></i> Próximas atividades
                </div>
                <div class="widget-atividades-lista">${conteudo}</div>
              </div>
            </div>
          </div>`;
      })
      .catch((err) => {
        console.error("Erro ao carregar próximas atividades:", err);
        container.innerHTML =
          '<div class="text-danger">Erro ao carregar atividades</div>';
      });
  },

  renderDashboardCardContratos({
    titulo = "",
    subtitulo = "",
    quantidade_total = "",
    vigentes = 0,
    finalizados = 0,
    criticos = 0,
    dias120 = 0,
    dias90 = 0,
    dias45 = 0,
    outros = 0,
    icone = "/static/images/doc2.png",
  }) {
    return `
      <div class="col-12 col-lg-3">
        <div class="br-card h-100 card-contratos">
          ${App.cardHeader({ titulo, subtitulo, icone })}
          <div class="card-content" style="padding-top: 8px;">
            <div class="valor-principal">${quantidade_total}</div>
            <div class="linha">
              <div><div>Vigentes</div><div class="valor-azul">${vigentes}</div></div>
              <div class="divider"></div>
              <div><div>Finalizados</div><div class="valor-azul">${finalizados}</div></div>
              <div class="divider"></div>
              <div><div>Críticos</div><div class="valor-vermelho">${criticos}</div></div>
            </div>
            <div class="linha" style="gap: 8px;">
              <div><div>120 dias</div><div class="valor-vermelho">${dias120}</div></div>
              <div class="divider"></div>
              <div><div>90 dias</div><div class="valor-vermelho">${dias90}</div></div>
              <div class="divider"></div>
              <div><div>45 dias</div><div class="valor-vermelho">${dias45}</div></div>
              <div class="divider"></div>
              <div><div>Outros</div><div class="valor-azul">${outros}</div></div>
            </div>
          </div>
        </div>
      </div>`;
  },

  renderDashboardCardContratosPorExercicio({
    id,
    titulo,
    subtitulo,
    icone = "/static/images/doc2.png",
  }) {
    return `
      <div class="col-12 col-lg-3">
        <div class="br-card h-100 card-contratos" style="min-height: 180px;">
          ${App.cardHeader({ titulo, subtitulo, icone })}
          <div class="card-content" style="padding: 0px; height: 180px !important;">
            <div id="${id}" style="width: 100%; height: 210px; margin-top: -40px;"></div>
          </div>
        </div>
      </div>`;
  },
};
