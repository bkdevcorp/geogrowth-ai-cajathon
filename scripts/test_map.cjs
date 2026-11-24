"use strict";
/* Smoke test without browser, external API keys or npm dependencies.
 * Run from repository root: node scripts/test_map.cjs
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const code = fs.readFileSync(path.join(__dirname, "../assets/map-integrado.js"), "utf8");
const geojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { NOMBDEP: "AREQUIPA" },
      geometry: { type: "Polygon", coordinates: [[
        [-72.1,-16.2],[-71.8,-16.2],[-71.8,-16.5],[-72.1,-16.5],[-72.1,-16.2]
      ]] }
    },
    {
      type: "Feature",
      properties: { NOMBDEP: "CALLAO" },
      geometry: { type: "MultiPolygon", coordinates: [[[ 
        [-77.2,-12],[-77,-12],[-77,-12.2],[-77.2,-12.2],[-77.2,-12]
      ]]] }
    }
  ]
};

const svg = { addEventListener() {}, setAttribute() {} };
const host = {
  isConnected: true,
  innerHTML: "",
  classList: { add() {} },
  querySelector(selector) { return selector === "#ggv5svg" ? svg : null; },
  querySelectorAll() { return []; }
};
let requests = 0;
const sandbox = {
  window: {},
  console,
  document: { head: { appendChild() {} }, createElement() { return {}; } },
  fetch: async url => {
    requests++;
    assert.equal(url, "data/peru_departamentos.geojson");
    return { ok: true, json: async () => geojson };
  }
};

async function main() {
  vm.runInNewContext(code, sandbox, { filename: "assets/map-integrado.js" });
  const map = sandbox.window.GeoGrowthEmbeddedMap;
  assert.equal(typeof map?.mount, "function");

  const rows = [
    { ubigeo: "040101", departamento: "AREQUIPA", nombre_distrito: "Arequipa",
      sbs_puntos_2025: 32, latitud_ref_sbs: -16.4, longitud_ref_sbs: -71.9 },
    { ubigeo: "070101", departamento: "CALLAO", nombre_distrito: "Callao",
      sbs_puntos_2025: 21, latitud_ref_sbs: -12.1, longitud_ref_sbs: -77.1 }
  ];
  const flush = () => new Promise(resolve => setImmediate(resolve));

  map.mount({ element: host, data: rows, department: "Todo el Perú" });
  await flush();
  assert.match(host.innerHTML, /<svg[^>]*viewBox=/, "National map should render an SVG");
  assert.match(host.innerHTML, /data-gg-map-dep="AREQUIPA"/);
  assert.match(host.innerHTML, /data-gg-map-dep="CALLAO"/);

  map.mount({ element: host, data: rows, department: "AREQUIPA" });
  await flush();
  assert.match(host.innerHTML, /data-gg-map-pick="040101"/, "District marker must render");
  assert.equal(requests, 1, "GeoJSON must be cached within the session");

  console.log("OK: GeoGrowth V11 SVG map, Polygon/MultiPolygon, district markers and GeoJSON caching");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
