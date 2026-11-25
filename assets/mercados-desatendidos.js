/* GeoGrowth AI — Módulo 03: Mercados desatendidos (Caja Trujillo · Eje 2) */
(function () {
  "use strict";

  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = n => (n == null || Number.isNaN(Number(n))) ? "N/D" : Number(n).toLocaleString("es-PE");
  const dload = (name, obj) => {
    const b = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  // Estados de dato con tooltip
  function dataState(val, hasSource) {
    if (!hasSource) return { label: "Sin cobertura de fuente", cls: "insuf", tip: "La fuente oficial no reporta cobertura para este UBIGEO." };
    if (val == null) return { label: "N/D sin dato", cls: "insuf", tip: "Registro presente en el cruce, pero sin valor numérico publicado." };
    if (Number(val) === 0) return { label: "0 verificado", cls: "baja", tip: "Valor cero reportado explícitamente en la fuente oficial." };
    return { label: fmt(val), cls: "", tip: "Dato verificado en fuente oficial." };
  }

  // Cálculo normalizado dentro de territorios compatibles (mismo departamento, periodo y ambas fuentes)
  function computeMetrics(rows, minEmpresas) {
    const compatibles = rows.filter(r => r.ambas_fuentes && r.empresas_2015 != null && r.sbs_puntos_2025 != null && Number(r.empresas_2015) >= minEmpresas);
    const ratios = compatibles.filter(r => r.sbs_puntos_2025 > 0).map(r => r.empresas_2015 / r.sbs_puntos_2025);
    const maxRatio = Math.max(1, ...ratios);
    const maxEmp = Math.max(1, ...compatibles.map(r => Math.log1p(r.empresas_2015 || 0)));

    return rows.map(r => {
      const emp = r.empresas_2015;
      const mypes = (Number(r.micro_2015) || 0) + (Number(r.pequena_2015) || 0);
      const pts = r.sbs_puntos_2025;
      const hasProd = emp != null;
      const hasSbs = pts != null;
      const zeroPts = hasSbs && Number(pts) === 0;

      // Calidad de evidencia separada de oportunidad
      let evidenciaNivel = "Baja";
      if (r.ambas_fuentes && r.latitud_ref_sbs != null && r.nombre_distrito) evidenciaNivel = "Alta";
      else if (r.ambas_fuentes) evidenciaNivel = "Parcial";

      const elegible = hasProd && hasSbs && Number(emp) >= minEmpresas;
      const ratio = (hasProd && hasSbs && Number(pts) > 0) ? (emp / pts) : null;

      // Puntaje 0-100 (solo elegibles)
      let score = null, compRatio = 0, compMype = 0, compSector = 0, nivel = "Insuficiente";
      if (elegible) {
        const normRatio = zeroPts ? 1 : Math.min(1, (ratio || 0) / maxRatio);
        const normMype = Math.log1p(mypes) / maxEmp;
        const mypeShare = emp > 0 ? Math.min(1, mypes / emp) : 0;
        compRatio = Math.round(normRatio * 55 * 10) / 10;
        compMype = Math.round(normMype * 30 * 10) / 10;
        compSector = Math.round(mypeShare * 15 * 10) / 10;
        score = Math.round((compRatio + compMype + compSector) * 10) / 10;
        nivel = score >= 65 ? "Alta" : score >= 40 ? "Media" : "Baja";
      }

      return {
        ...r,
        distritoLabel: r.nombre_distrito || ("Distrito " + r.ubigeo),
        mypes,
        hasProd, hasSbs, zeroPts, elegible,
        ratio, score, nivel, evidenciaNivel,
        aportes: { compRatio, compMype, compSector }
      };
    });
  }

  function shell() {
    return `
      <div class="page-head">
        <div>
          <span class="eyebrow">PROSPECCIÓN · INTELIGENCIA TERRITORIAL</span>
          <h1>Mercados desatendidos</h1>
          <p class="subtitle">Territorios con brecha relativa de cobertura financiera para orientar visitas del Asesor de Negocios.</p>
        </div>
        <span class="badge">Enfoque Caja Trujillo</span>
      </div>
      <section id="gg-md-root" class="md-wrap" aria-live="polite">
        <div class="card">Preparando análisis territorial de La Libertad...</div>
      </section>`;
  }

  function mount(app, hooks = {}) {
    const root = document.getElementById("gg-md-root");
    if (!root) return;

    const state = {
      dep: "La Libertad",
      periodo: "Último disponible (PRODUCE 2015 + SBS 2025)",
      minEmp: 20,
      nivel: "Todos",
      evidencia: "Todas",
      query: "",
      preset: "",
      sortKey: "score",
      sortDir: "desc",
      hoverUbigeo: null,
      selectedUbigeo: null,
      compare: [],
      showCajaLayer: true,
      showOtrasLayer: true,
      showModalCalc: false,
      cajaPuntos: [] // Listado interno con coordenadas cargado por el usuario (sin scraping)
    };

    const deps = [...new Set(app.territories.map(r => r.departamento))].sort((a, b) => a.localeCompare(b, "es"));
    if (!deps.includes(state.dep) && deps.length) state.dep = deps[0];

    function getFiltered() {
      const depRows = app.territories.filter(r => r.departamento === state.dep);
      const enriched = computeMetrics(depRows, state.minEmp);
      const filtered = enriched.filter(r => {
        if (state.nivel !== "Todos" && r.nivel !== state.nivel) return false;
        if (state.evidencia !== "Todas" && r.evidenciaNivel !== state.evidencia) return false;
        if (state.preset === "solida" && !(r.nivel === "Alta" && r.evidenciaNivel === "Alta")) return false;
        if (state.preset === "sin_puntos" && !r.zeroPts) return false;
        if (state.preset === "ratio" && !(r.elegible && (r.ratio == null || r.ratio >= 15))) return false;
        if (state.query) {
          const q = state.query.toLowerCase();
          if (!`${r.distritoLabel} ${r.ubigeo} ${r.ciiu2_2015 || ""}`.toLowerCase().includes(q)) return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        const dir = state.sortDir === "asc" ? 1 : -1;
        const va = a[state.sortKey] ?? -1;
        const vb = b[state.sortKey] ?? -1;
        if (typeof va === "string") return va.localeCompare(String(vb), "es") * dir;
        return (Number(va) - Number(vb)) * dir;
      });

      return { totalDep: enriched.length, enriched, filtered };
    }

    // Mapa SVG con proyección automática (fitBounds real al departamento o distrito filtrado)
    function renderMapSVG(rows) {
      const pts = rows.filter(r => r.latitud_ref_sbs != null && r.longitud_ref_sbs != null);
      if (!pts.length) {
        return `<div style="padding:24px;text-align:center;color:#475569">No hay coordenadas SBS para los filtros actuales. <button class="md-btn" data-md-clear="1">Limpiar filtros</button></div>`;
      }
      const lats = pts.map(p => p.latitud_ref_sbs);
      const lngs = pts.map(p => p.longitud_ref_sbs);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const padLat = Math.max(0.08, (maxLat - minLat) * 0.14);
      const padLng = Math.max(0.08, (maxLng - minLng) * 0.14);
      const W = 520, H = 440;

      const proj = (lat, lng) => {
        const x = ((lng - (minLng - padLng)) / ((maxLng + padLng) - (minLng - padLng))) * (W - 40) + 20;
        const y = H - (((lat - (minLat - padLat)) / ((maxLat + padLat) - (minLat - padLat))) * (H - 40) + 20);
        return [x, y];
      };

      const colorFor = r => {
        if (!r.elegible) return "url(#md-stripe)";
        if (r.nivel === "Alta") return "#0f766e";
        if (r.nivel === "Media") return "#0284c7";
        return "#99f6e4";
      };

      const circles = pts.map(r => {
        const [cx, cy] = proj(r.latitud_ref_sbs, r.longitud_ref_sbs);
        const isSel = r.ubigeo === state.selectedUbigeo;
        const isHov = r.ubigeo === state.hoverUbigeo;
        const rad = isSel ? 11 : isHov ? 9 : r.elegible ? 7 : 5;
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad}"
          fill="${colorFor(r)}" stroke="${isSel ? "#0f172a" : "#ffffff"}" stroke-width="${isSel ? 3 : 1.5}"
          data-md-pin="${esc(r.ubigeo)}" style="cursor:pointer">
          <title>${esc(r.distritoLabel)} (${esc(r.ubigeo)}) · Nivel: ${esc(r.nivel)} · Evidencia: ${esc(r.evidenciaNivel)}</title>
        </circle>`;
      }).join("");

      const cajaPins = state.showCajaLayer ? state.cajaPuntos
        .filter(p => p.lat != null && p.lng != null)
        .map(p => {
          const [cx, cy] = proj(p.lat, p.lng);
          return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="#c8102e" stroke="#fff" stroke-width="2">
            <title>Caja Trujillo: ${esc(p.nombre || "Punto de atención")}</title>
          </circle>`;
        }).join("") : "";

      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa de brecha relativa de cobertura financiera en ${esc(state.dep)}">
        <defs>
          <pattern id="md-stripe" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#e2e8f0"></rect>
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" stroke-width="2"></line>
          </pattern>
        </defs>
        <rect width="${W}" height="${H}" fill="#f8fafc"></rect>
        ${circles}
        ${cajaPins}
      </svg>`;
    }

    function renderDrawer(item) {
      if (!item) return "";
      const empSt = dataState(item.empresas_2015, item.hasProd);
      const ptsSt = dataState(item.sbs_puntos_2025, item.hasSbs);
      const ratioText = item.zeroPts ? "Sin puntos financieros registrados" : (item.ratio != null ? `${item.ratio.toFixed(1)} empresas / punto` : "No comparable");
      return `
        <div class="md-drawer-backdrop" data-md-close-drawer="1">
          <aside class="md-drawer" role="dialog" aria-modal="true" aria-label="Ficha de evidencia territorial">
            <div class="md-drawer-head">
              <div>
                <span class="md-pill ${item.nivel.toLowerCase()}">${esc(item.nivel)}</span>
                <span class="md-pill ev-${item.evidenciaNivel.toLowerCase()}">Evidencia ${esc(item.evidenciaNivel)}</span>
                <h2 style="margin:6px 0 2px">${esc(item.distritoLabel)}</h2>
                <small style="color:#475569">${esc(item.departamento)} · UBIGEO ${esc(item.ubigeo)}</small>
              </div>
              <button type="button" class="md-close" data-md-close-drawer="1" aria-label="Cerrar ficha">×</button>
            </div>

            <div class="md-period-banner" style="margin-top:12px">
              <b>Dónde visitar primero:</b> ${item.elegible ? `Indicador principal de <b>${esc(ratioText)}</b>. ` : `Debajo del umbral mínimo (${state.minEmp} empresas) o sin cruce completo. `}
              Enfoque "Para tu negocio": <b>${fmt(item.mypes)}</b> micro y pequeñas empresas (PRODUCE 2015).
            </div>

            <h3>Descomposición del puntaje (${item.score != null ? item.score + " / 100" : "No rankeado"})</h3>
            <div style="display:grid;gap:8px;margin-bottom:14px">
              <div>
                <div style="display:flex;justify-content:space-between"><span>Brecha empresas / punto (55%)</span><b>${item.aportes.compRatio} pts</b></div>
                <div class="md-bar" style="width:100%"><span style="width:${(item.aportes.compRatio / 55) * 100}%"></span></div>
              </div>
              <div>
                <div style="display:flex;justify-content:space-between"><span>Masa MYPE · "Para tu negocio" (30%)</span><b>${item.aportes.compMype} pts</b></div>
                <div class="md-bar" style="width:100%"><span style="width:${(item.aportes.compMype / 30) * 100}%"></span></div>
              </div>
              <div>
                <div style="display:flex;justify-content:space-between"><span>Concentración micro/pequeña (15%)</span><b>${item.aportes.compSector} pts</b></div>
                <div class="md-bar" style="width:100%"><span style="width:${(item.aportes.compSector / 15) * 100}%"></span></div>
              </div>
            </div>

            <h3>Cobertura financiera separada (SBS Dic. 2025)</h3>
            <div class="stat-line"><span>Agencias / oficinas</span><b>${fmt(item.sbs_oficinas_2025)}</b></div>
            <div class="stat-line"><span>Agentes / POS</span><b>${fmt(item.sbs_pos_2025)}</b></div>
            <div class="stat-line"><span>ATMs y otros canales (EOB)</span><b>${fmt((item.sbs_atm_2025 || 0) + (item.sbs_eob_2025 || 0))}</b></div>
            <div class="stat-line"><span>Estado empresas (PRODUCE 2015)</span><b title="${esc(empSt.tip)}">${esc(empSt.label)}</b></div>
            <div class="stat-line"><span>Estado puntos (SBS 2025)</span><b title="${esc(ptsSt.tip)}">${esc(ptsSt.label)}</b></div>

            <h3 style="margin-top:14px">Qué verificar en campo (checklist accionable)</h3>
            <div>
              <label class="md-check-item"><input type="checkbox"><span>Confirmar actividad comercial vigente en corredores principales del distrito.</span></label>
              <label class="md-check-item"><input type="checkbox"><span>Validar presencia actual de agentes corresponsales o agencias no reflejadas en corte SBS.</span></label>
              <label class="md-check-item"><input type="checkbox"><span>Identificar necesidades de capital de trabajo o activo fijo con consentimiento del emprendedor.</span></label>
            </div>

            <div class="actions-row" style="margin-top:16px">
              <button type="button" class="md-btn primary" data-md-go-exp="1">Ver licencias de este distrito</button>
              <button type="button" class="md-btn" data-md-export-one="${esc(item.ubigeo)}">Exportar ficha JSON</button>
            </div>
          </aside>
        </div>`;
    }

    function render() {
      const { totalDep, enriched, filtered } = getFiltered();
      const altaSolida = enriched.filter(r => r.nivel === "Alta" && r.evidenciaNivel === "Alta").length;
      const sinPuntos = enriched.filter(r => r.zeroPts).length;
      const elegibles = enriched.filter(r => r.elegible).length;
      const selectedItem = enriched.find(r => r.ubigeo === state.selectedUbigeo) || null;
      const compareItems = state.compare.map(u => enriched.find(r => r.ubigeo === u)).filter(Boolean);

      const chips = [];
      if (state.nivel !== "Todos") chips.push({ k: "nivel", label: "Nivel: " + state.nivel });
      if (state.evidencia !== "Todas") chips.push({ k: "evidencia", label: "Evidencia: " + state.evidencia });
      if (state.preset) chips.push({ k: "preset", label: "Acceso rápido activo" });
      if (state.query) chips.push({ k: "query", label: `Búsqueda: "${state.query}"` });

      root.innerHTML = `
        <div class="md-trust-banner">
          <div><b>Aviso de confianza:</b> No implica exclusión financiera ni evalúa crédito. Verifica en campo antes de contactar.</div>
          <button type="button" class="md-btn" data-md-calc="1">¿Cómo se calcula?</button>
        </div>

        <div class="md-period-banner">
          <b>Periodos mezclados:</b> Empresas proviene de <b>PRODUCE 2015</b> (histórico) y puntos financieros de <b>SBS Dic. 2025</b>. Compara únicamente distritos dentro de <b>${esc(state.dep)}</b>.
        </div>

        <div class="md-presets" role="group" aria-label="Accesos rápidos Caja Trujillo">
          <button type="button" class="md-preset-btn ${state.preset === "solida" ? "active" : ""}" data-md-preset="solida">Alta oportunidad + evidencia sólida</button>
          <button type="button" class="md-preset-btn ${state.preset === "sin_puntos" ? "active" : ""}" data-md-preset="sin_puntos">Sin punto financiero registrado</button>
          <button type="button" class="md-preset-btn ${state.preset === "ratio" ? "active" : ""}" data-md-preset="ratio">Más empresas por punto (&ge;15)</button>
          <label class="md-preset-btn" title="Carga un JSON interno con coordenadas de agencias/agentes Caja Trujillo (sin scraping)">
            Cargar agencias Caja Trujillo (JSON)
            <input type="file" id="md-caja-file" accept=".json" hidden>
          </label>
        </div>

        <section class="card" style="margin-bottom:14px">
          <div class="md-filters">
            <div class="md-field">
              <label for="md-dep">Departamento (demo: La Libertad)</label>
              <select id="md-dep">${deps.map(d => `<option value="${esc(d)}" ${d === state.dep ? "selected" : ""}>${esc(d)}</option>`).join("")}</select>
            </div>
            <div class="md-field">
              <label for="md-periodo">Periodo de fuentes</label>
              <select id="md-periodo" disabled title="Único corte integrado disponible actualmente">
                <option>${esc(state.periodo)}</option>
              </select>
            </div>
            <div class="md-field">
              <label for="md-min">Umbral mínimo de empresas</label>
              <input id="md-min" type="number" min="0" max="5000" step="10" value="${state.minEmp}">
            </div>
            <div class="md-field">
              <label for="md-nivel">Nivel de oportunidad</label>
              <select id="md-nivel">${["Todos", "Alta", "Media", "Baja", "Insuficiente"].map(v => `<option ${v === state.nivel ? "selected" : ""}>${v}</option>`).join("")}</select>
            </div>
            <div class="md-field">
              <label for="md-ev">Calidad de evidencia</label>
              <select id="md-ev">${["Todas", "Alta", "Parcial", "Baja"].map(v => `<option ${v === state.evidencia ? "selected" : ""}>${v}</option>`).join("")}</select>
            </div>
            <div class="md-field">
              <label for="md-q">Buscar distrito o UBIGEO</label>
              <input id="md-q" type="search" placeholder="Ej. Trujillo, 130101" value="${esc(state.query)}">
            </div>
          </div>

          <div class="md-filter-bar">
            <div class="md-chips">
              <strong>Mostrando ${filtered.length} de ${totalDep} distritos</strong>
              ${chips.map(c => `<span class="md-chip">${esc(c.label)} <button type="button" data-md-rm="${esc(c.k)}" aria-label="Quitar filtro">×</button></span>`).join("")}
            </div>
            <button type="button" class="md-btn" data-md-clear="1">Limpiar filtros</button>
          </div>
        </section>

        <div class="md-kpis">
          <button type="button" class="md-kpi ${state.preset === "solida" ? "active" : ""}" data-md-preset="solida">
            <b>${altaSolida}</b><span>Alta oportunidad + evidencia sólida</span><small>${altaSolida} de ${totalDep} distritos</small>
          </button>
          <button type="button" class="md-kpi ${state.preset === "sin_puntos" ? "active" : ""}" data-md-preset="sin_puntos">
            <b>${sinPuntos}</b><span>Sin puntos financieros</span><small>Denominador cero verificado</small>
          </button>
          <button type="button" class="md-kpi" data-md-clear="1">
            <b>${elegibles}</b><span>Elegibles para ranking</span><small>Con &ge; ${state.minEmp} empresas y ambas fuentes</small>
          </button>
          <button type="button" class="md-kpi" disabled title="Carga el JSON interno de agencias/agentes Caja Trujillo para activar">
            <b>${state.cajaPuntos.length}</b><span>Puntos Caja Trujillo cargados</span><small>Listado interno (sin scraping)</small>
          </button>
        </div>

        <div class="md-split">
          <section class="card md-map-panel">
            <div class="card-header">
              <div><h2>Mapa territorial · ${esc(state.dep)}</h2><p>Zoom automático al universo filtrado. Haz clic en un punto para ver su ficha.</p></div>
            </div>
            <div class="md-map-stage">${renderMapSVG(filtered)}</div>
            <div class="md-legend">
              <span><i class="md-swatch" style="background:#0f766e"></i>Alta</span>
              <span><i class="md-swatch" style="background:#0284c7"></i>Media</span>
              <span><i class="md-swatch" style="background:#99f6e4"></i>Baja</span>
              <span><i class="md-swatch insuf"></i>Info insuficiente</span>
              <span><i class="md-swatch caja"></i>Caja Trujillo (solo rojo)</span>
            </div>
          </section>

          <section class="card md-table-panel">
            <div class="card-header">
              <div><h2>Dónde visitar primero (detalle)</h2><p>Ordenable · Sincronizado con el mapa</p></div>
            </div>
            <table class="md-table">
              <thead>
                <tr>
                  <th>Comp.</th>
                  <th><button type="button" data-md-sort="distritoLabel">Distrito</button></th>
                  <th><button type="button" data-md-sort="ratio">Emp. / punto</button></th>
                  <th><button type="button" data-md-sort="score">Puntaje</button></th>
                  <th>Oportunidad / Evidencia</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(r => `
                  <tr class="md-row ${r.ubigeo === state.selectedUbigeo ? "is-selected" : ""} ${r.ubigeo === state.hoverUbigeo ? "is-hover" : ""}" data-md-row="${esc(r.ubigeo)}">
                    <td><input type="checkbox" data-md-cmp="${esc(r.ubigeo)}" ${state.compare.includes(r.ubigeo) ? "checked" : ""} aria-label="Comparar ${esc(r.distritoLabel)}"></td>
                    <td><strong>${esc(r.distritoLabel)}</strong><div style="font-size:12px;color:#475569">${esc(r.ubigeo)} · ${fmt(r.mypes)} MYPEs</div></td>
                    <td>${r.zeroPts ? '<span class="md-pill sin-puntos">Sin puntos registrados</span>' : (r.ratio != null ? `<b>${r.ratio.toFixed(1)}</b>` : '<span class="md-pill insuf">N/D</span>')}</td>
                    <td>${r.score != null ? `<b>${r.score}</b><div class="md-bar"><span style="width:${r.score}%"></span></div>` : '<span style="color:#64748b">—</span>'}</td>
                    <td>
                      <span class="md-pill ${r.nivel.toLowerCase()}">${esc(r.nivel)}</span>
                      <span class="md-pill ev-${r.evidenciaNivel.toLowerCase()}">Ev. ${esc(r.evidenciaNivel)}</span>
                    </td>
                  </tr>`).join("") || `<tr><td colspan="5" style="padding:20px;text-align:center">Sin distritos para estos filtros. <button type="button" class="md-btn" data-md-clear="1">Limpiar filtros</button></td></tr>`}
              </tbody>
            </table>
          </section>
        </div>

        ${compareItems.length >= 2 ? `
          <section class="card" style="margin-top:14px">
            <div class="card-header"><div><h2>Comparador de territorios (${compareItems.length}/3)</h2><p>Mismo departamento y corte de fuentes</p></div><button type="button" class="md-btn" data-md-clear-cmp="1">Limpiar comparador</button></div>
            <div class="md-compare-grid">
              ${compareItems.map(c => `<div class="signal">
                <b>${esc(c.distritoLabel)} (${esc(c.ubigeo)})</b>
                <div class="stat-line"><span>Empresas / punto</span><b>${c.zeroPts ? "Sin puntos" : (c.ratio ? c.ratio.toFixed(1) : "N/D")}</b></div>
                <div class="stat-line"><span>MYPEs (2015)</span><b>${fmt(c.mypes)}</b></div>
                <div class="stat-line"><span>Oficinas / Agentes</span><b>${fmt(c.sbs_oficinas_2025)} / ${fmt(c.sbs_pos_2025)}</b></div>
                <div class="stat-line"><span>Puntaje</span><b>${c.score ?? "No rankeado"}</b></div>
              </div>`).join("")}
            </div>
          </section>` : ""}

        ${state.showModalCalc ? `
          <div class="md-drawer-backdrop" data-md-calc="0">
            <div class="md-drawer" style="max-width:460px">
              <div class="md-drawer-head"><h2>¿Cómo se calcula?</h2><button class="md-close" data-md-calc="0">×</button></div>
              <p style="margin-top:12px"><b>Puntaje (0–100):</b> 55% Brecha relativa (empresas / punto financiero normalizado al máximo del departamento) + 30% Masa MYPE (logarítmica) + 15% Proporción micro/pequeña empresa.</p>
              <p><b>Umbral mínimo:</b> Solo entran al ranking distritos con al menos <b>${state.minEmp} empresas</b> y cruce completo PRODUCE 2015 + SBS 2025.</p>
              <p><b>Denominador cero:</b> Si un distrito elegible registra 0 puntos financieros verificados, recibe el valor máximo en el componente de brecha y muestra la insignia <i>"Sin puntos financieros registrados"</i> (nunca infinito).</p>
            </div>
          </div>` : ""}

        ${renderDrawer(selectedItem)}
      `;
    }

    // Eventos en vivo (sin botón Buscar obligatorio)
    root.addEventListener("input", e => {
      if (e.target.id === "md-q") { state.query = e.target.value; render(); }
      if (e.target.id === "md-min") { state.minEmp = Math.max(0, Number(e.target.value) || 0); render(); }
    });

    root.addEventListener("change", async e => {
      const id = e.target.id;
      if (id === "md-dep") { state.dep = e.target.value; state.selectedUbigeo = null; state.compare = []; render(); }
      else if (id === "md-nivel") { state.nivel = e.target.value; render(); }
      else if (id === "md-ev") { state.evidencia = e.target.value; render(); }
      else if (id === "md-caja-file" && e.target.files?.[0]) {
        try {
          const data = JSON.parse(await e.target.files[0].text());
          state.cajaPuntos = Array.isArray(data) ? data : (data.puntos || []);
          hooks.toast?.(`Se cargaron ${state.cajaPuntos.length} puntos internos de Caja Trujillo.`);
          render();
        } catch { hooks.toast?.("El archivo JSON de Caja Trujillo no tiene un formato válido."); }
      } else if (e.target.dataset.mdCmp) {
        const u = e.target.dataset.mdCmp;
        if (e.target.checked) {
          if (state.compare.length >= 3) { e.target.checked = false; hooks.toast?.("Máximo 3 territorios para comparar."); return; }
          state.compare.push(u);
        } else {
          state.compare = state.compare.filter(x => x !== u);
        }
        render();
      }
    });

    root.addEventListener("click", e => {
      if (e.target.closest("[data-md-cmp]")) return;
      const clear = e.target.closest("[data-md-clear]");
      if (clear) { state.nivel = "Todos"; state.evidencia = "Todas"; state.query = ""; state.preset = ""; render(); return; }
      const rm = e.target.closest("[data-md-rm]");
      if (rm) { const k = rm.dataset.mdRm; state[k] = k === "nivel" ? "Todos" : k === "evidencia" ? "Todas" : ""; render(); return; }
      const preset = e.target.closest("[data-md-preset]");
      if (preset) { const p = preset.dataset.mdPreset; state.preset = state.preset === p ? "" : p; render(); return; }
      const sort = e.target.closest("[data-md-sort]");
      if (sort) {
        const k = sort.dataset.mdSort;
        state.sortDir = (state.sortKey === k && state.sortDir === "desc") ? "asc" : "desc";
        state.sortKey = k; render(); return;
      }
      const calc = e.target.closest("[data-md-calc]");
      if (calc) { state.showModalCalc = calc.dataset.mdCalc === "1"; render(); return; }
      if (e.target.dataset.mdCloseDrawer === "1") { state.selectedUbigeo = null; render(); return; }
      const clearCmp = e.target.closest("[data-md-clear-cmp]");
      if (clearCmp) { state.compare = []; render(); return; }
      const goExp = e.target.closest("[data-md-go-exp]");
      if (goExp) { hooks.goExpansion?.(); return; }
      const expOne = e.target.closest("[data-md-export-one]");
      if (expOne) {
        const item = getFiltered().enriched.find(r => r.ubigeo === expOne.dataset.mdExportOne);
        if (item) dload(`ficha_desatendidos_${item.ubigeo}.json`, { tipo: "GeoGrowthMercadoDesatendidoV1", aviso: "No implica exclusión financiera ni evalúa crédito.", territorio: item });
        return;
      }
      const pinOrRow = e.target.closest("[data-md-pin],[data-md-row]");
      if (pinOrRow) { state.selectedUbigeo = pinOrRow.dataset.mdPin || pinOrRow.dataset.mdRow; render(); }
    });

    render();
  }

  window.GeoGrowthDesatendidos = { shell, mount };
})();