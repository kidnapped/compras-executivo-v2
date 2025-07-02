if (process.env.ENVIRONMENT === "production") {
    import("./style.js");
}

import environment from "./environment.js";
import menu from "./menu.js";
import admin from "./admin.js";

import card_kpi from "./kpi/card.js";
import contratos_dashboard from "./contrato/dashboard.js";
import * as kpis_kpi from "./kpi/kpis.js";

const App = {
    ...environment,
    ...menu,
    ...admin,
    ...card_kpi,
    ...contratos_dashboard,
    ...kpis_kpi,
};

window.App = App;

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
