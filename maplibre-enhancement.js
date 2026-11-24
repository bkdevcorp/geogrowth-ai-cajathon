/* GeoGrowth AI — mapa nacional con MapLibre GL JS + OpenFreeMap.
   Sin claves API. Marcadores agregados SBS (no domicilios). */
(function () {
  const STYLE = "https://tiles.openfreemap.org/styles/liberty";
  let mapStarted = false;
  window.initLeaflet = function () {
    const container = document.getElementById("leafletmap");
    if (!container || !window.maplibregl || typeof DATA === "undefined") return;
    const query = String(state.query || "").trim().toLocaleLowerCase("es");
    const features = DATA.filter(r =>
      (state.dep === "Todo el Perú" || r.departamento === state.dep) &&
      Number.isFinite(Number(r.latitud_ref_sbs)) &&
      Number.isFinite(Number(r.longitud_ref_sbs)) &&
      r.latitud_ref_sbs !== null && r.longitud_ref_sbs !== null &&
      (!query || String(r.ubigeo + " " + r.nombre_distrito).toLocaleLowerCase("es").includes(query))
    ).map(r => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(r.longitud_ref_sbs), Number(r.latitud_ref_sbs)] },
      properties: {
        ubigeo: r.ubigeo,
        distrito: r.nombre_distrito || ("UBIGEO " + r.ubigeo),
        departamento: r.departamento,
        puntos: r.sbs_puntos_2025 ?? 0,
        oficinas: r.sbs_oficinas_2025 ?? 0
      }
    }));
    if (!features.length) return;
    container.style.display = "block";
    container.style.opacity = "0";
    container.style.transition = "opacity 220ms";
    container.style.zIndex = "3";
    try {
      const center = state.dep === "Todo el Perú"
        ? [-75.06, -9.5]
        : features[0].geometry.coordinates;
      const map = new maplibregl.Map({
        container,
        style: STYLE,
        center,
        zoom: state.dep === "Todo el Perú" ? 4.3 : 7,
        attributionControl: true,
        cooperativeGestures: false
      });
      activeMap = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        const source = {
          type: "geojson",
          data: { type: "FeatureCollection", features },
          cluster: true,
          clusterMaxZoom: 11,
          clusterRadius: 48
        };
        map.addSource("territorios-sbs", source);
        map.addLayer({
          id: "territorios-cluster", type: "circle", source: "territorios-sbs",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#147b87",
            "circle-radius": ["step", ["get", "point_count"], 16, 20, 21, 100, 29],
            "circle-stroke-width": 2, "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.87
          }
        });
        map.addLayer({
          id: "territorios-cluster-count", type: "symbol", source: "territorios-sbs",
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
          paint: { "text-color": "#ffffff" }
        });
        map.addLayer({
          id: "territorios-point", type: "circle", source: "territorios-sbs",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": ["case", ["==", ["get", "ubigeo"], state.selected], "#f59e0b", "#2466ce"],
            "circle-radius": ["interpolate", ["linear"], ["sqrt", ["to-number", ["get", "puntos"]]],
              0, 5, 15, 9, 40, 13],
            "circle-opacity": 0.88, "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.5
          }
        });
        map.on("click", "territorios-cluster", e => {
          const f = e.features && e.features[0];
          if (f) map.easeTo({ center: f.geometry.coordinates, zoom: Math.min(map.getZoom() + 2, 13) });
        });
        map.on("click", "territorios-point", e => {
          const f = e.features && e.features[0];
          if (!f) return;
          const props = f.properties;
          const detail = "<b>" + safe(props.distrito) + " · " + safe(props.departamento) +
            "</b><br>UBIGEO: " + safe(props.ubigeo) +
            "<br>Puntos SBS 2025: " + fmt(props.puntos) +
            "<br>Oficinas: " + fmt(props.oficinas) +
            "<br><small>Coordenada media de puntos SBS. No es un domicilio empresarial.</small>";
          new maplibregl.Popup({ offset: 13, closeOnClick: true })
            .setLngLat(f.geometry.coordinates).setHTML(detail).addTo(map);
          state.selected = String(props.ubigeo);
        });
        ["territorios-cluster", "territorios-point"].forEach(id => {
          map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
        });
        if (state.dep !== "Todo el Perú" && features.length > 1) {
          const bounds = new maplibregl.LngLatBounds();
          features.forEach(f => bounds.extend(f.geometry.coordinates));
          map.fitBounds(bounds, { padding: 35, maxZoom: 10, duration: 0 });
        }
        container.style.opacity = "1";
        map.resize();
      });
      map.on("error", e => {
        const message = String(e?.error?.message || "");
        if (/failed to fetch|networkerror|access denied|403|404/i.test(message)) {
          container.style.opacity = "0";
          container.style.pointerEvents = "none";
        }
      });
    } catch (e) {
      container.style.display = "none";
      container.style.pointerEvents = "none";
    }
  };
  // El HTML principal ya hizo el primer render. Activar el nuevo mapa ahora.
  window.initLeaflet();
})();