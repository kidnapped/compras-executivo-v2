export default async function getEcharts() {
  if (window.echarts) return window.echarts;
  const mod = await import(/* webpackIgnore: true */ "/static/echarts/echarts.esm.min.js");
  return mod.default || mod;
}
