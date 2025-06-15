import '../css/rawline.css';
import '../css/app.css';

import environment from "./environment.js";
import menu from "./menu.js";
import admin from "./admin.js";

import card_kpi from "./kpi/card.js";
import contratos_dashboard from "./contrato/dashboard.js";

import * as echarts from 'echarts';

const App = {
    ...environment,
    ...menu,
    ...admin,
    ...card_kpi,
    ...contratos_dashboard,
};

window.App = App;

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
