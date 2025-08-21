// Detecta o ambiente (development, production, etc.)
const ENV =
  (typeof process !== "undefined" && process.env && process.env.ENVIRONMENT) ||
  (typeof window !== "undefined" &&
    window.__ENV__ &&
    window.__ENV__.ENVIRONMENT) ||
  "development";

// Deixa o valor disponível no browser em window.process.env.ENVIRONMENT
if (typeof window !== "undefined") {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  window.process.env.ENVIRONMENT = ENV;
}

// Exportação nomeada para quem quiser só a string do ambiente
export const ENVIRONMENT = ENV;

// Exportação default
export default {
  ENV,
  ENVIRONMENT
};
