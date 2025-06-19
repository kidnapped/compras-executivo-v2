if (import.meta.env?.MODE === "production" || process.env.NODE_ENV === "production") {
  const requireCSS = require.context("../", true, /\.css$/);
  requireCSS.keys().forEach(requireCSS);
}