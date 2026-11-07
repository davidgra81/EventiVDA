// app.js - EventiVDA v9.0
// Auth + Moderation + Real 74 Comuni VdA Map + Curved Bubble Timeline + Filtering

const App = (() => {
  "use strict";

  /* ══════════════════════════════
     STATE
  ══════════════════════════════ */
  let _currentView = 'eventi';
  let _authUser = null;
  let _pendingSponsorMode = null;
  let _activeMapRegion = null;
  let _editingEventId = null;
  let _activeComuneFilter = '';
  let _activeRassegnaFilter = '';
  let _mapMode = 'comuni'; // 'comuni' | 'street'
  let _mapZoomLevel = 1;

  /* ══════════════════════════════
     UTILS
  ══════════════════════════════ */
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  function getTodayIsoStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function addDaysToIso(isoStr, days) {
    const d = new Date(isoStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getEvents() {
    try {
      const raw = JSON.parse(localStorage.getItem("vda_events")) || [];
      const todayStr = getTodayIsoStr();
      let changed = false;
      const cleaned = [];
      raw.forEach((evt, idx) => {
        if (!evt || !evt.title || /annullat/i.test(evt.title)) {
          changed = true;
          return;
        }
        const eEnd = evt.endDate || evt.date || todayStr;
        if (eEnd < todayStr) {
          changed = true;
          return;
        }
        if (!evt.date || evt.date < todayStr) {
          evt.date = addDaysToIso(todayStr, idx % 22);
          if (!evt.endDate || evt.endDate < evt.date) evt.endDate = evt.date;
          changed = true;
        }
        cleaned.push(evt);
      });
      if (changed) {
        localStorage.setItem("vda_events", JSON.stringify(cleaned));
      }
      return cleaned;
    } catch(e) {
      return [];
    }
  }
  function saveEvents(arr) { localStorage.setItem("vda_events", JSON.stringify(arr)); }
  function getSources() { try { return JSON.parse(localStorage.getItem("vda_sources")) || []; } catch(e){ return []; } }
  function saveSources(arr) { localStorage.setItem("vda_sources", JSON.stringify(arr)); }
  function getServices() { try { return JSON.parse(localStorage.getItem("vda_services")) || []; } catch(e){ return []; } }
  function saveServices(arr) { localStorage.setItem("vda_services", JSON.stringify(arr)); }
  function getAds() { try { return JSON.parse(localStorage.getItem("vda_ads")) || []; } catch(e){ return []; } }
  function getUsers() { try { return JSON.parse(localStorage.getItem("vda_users")) || []; } catch(e){ return []; } }
  function saveUsers(arr) { localStorage.setItem("vda_users", JSON.stringify(arr)); }
  function getComuni() { try { return JSON.parse(localStorage.getItem("vda_comuni")) || []; } catch(e){ return []; } }
  function saveComuni(arr) { localStorage.setItem("vda_comuni", JSON.stringify(arr)); }

  function formatDate(ds) {
    if (!ds) return '';
    const [y,m,d] = ds.split('-');
    return `${d}/${m}/${y}`;
  }

  function categoryLabel(cat) {
    const map = { culture:'Cultura', music:'Musica', sport:'Sport', food_wine:'Enogastronomia', nature:'Natura', markets:'Fiere' };
    return map[cat] || cat;
  }

  function categoryIcon(cat) {
    const map = { culture:'fas fa-landmark', music:'fas fa-music', sport:'fas fa-running',
                  food_wine:'fas fa-utensils', nature:'fas fa-tree', markets:'fas fa-store' };
    return map[cat] || 'fas fa-calendar';
  }

  function areaLabel(a) {
    const map = { aosta:'Aosta Città', alta:'Alta Valle', media:'Media Valle', bassa:'Bassa Valle' };
    return map[a] || a;
  }

  function sourceTypeIcon(type) {
    const cls = { facebook:'source-facebook', instagram:'source-instagram', official:'source-official', other:'source-other' };
    return `<span class="source-icon ${cls[type]||'source-other'}"></span>`;
  }

  function genId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  }

  /* ══════════════════════════════
     NAVIGATION
  ══════════════════════════════ */
  function navTo(view) {
    _currentView = view;
    $$('.tab-section').forEach(el => el.classList.add('hidden'));
    $$('.nav-link').forEach(el => el.classList.remove('active'));

    const viewMap = { eventi:'eventsView', servizi:'servicesView', admin:'adminView' };
    const dash = $('topDashboard');
    const banner = $('bizBanner');

    if (viewMap[view]) {
      $(viewMap[view]).classList.remove('hidden');
    }

    const activeLink = document.querySelector(`.nav-link[data-target="${view}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Mostra/nasconde dashboard e banner
    if (view === 'admin') {
      dash.style.display = 'none';
      if (banner) banner.style.display = 'none';
    } else {
      dash.style.display = '';
      if (banner) banner.style.display = '';
      if (_leafletMap) {
        setTimeout(() => _leafletMap.invalidateSize(), 200);
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'admin') renderAdminView();
    if (view === 'eventi') renderEvents();
    if (view === 'servizi') renderServices();
  }

  window.navTo = navTo;

  /* ══════════════════════════════
     THEME
  ══════════════════════════════ */
  function initTheme() {
    const saved = localStorage.getItem("vda_theme") || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }

  function toggleTheme() {
    const curr = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = curr === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem("vda_theme", next);
    updateThemeIcon(next);
    updateMapTileLayer();
  }

  function updateThemeIcon(theme) {
    const icon = $('themeIcon');
    if (!icon) return;
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  /* ══════════════════════════════
     INTERACTIVE COMUNI SVG MAP & LEAFLET STREET MAP
  ══════════════════════════════ */
  let _leafletMap = null;
  let _mapMarkersGroup = null;
  let _zonePolygonsGroup = null;
  let _eventsViewMode = 'grid'; // 'grid' | 'list' | 'timeline'
  let _eventsSortBy = 'date';   // 'date' | 'relevance' | 'location'
  let _activeTimePreset = '30d'; // '30d' | 'today' | 'tomorrow' | 'this_weekend' | 'all_weekends' | 'all' | 'custom'

  const CATEGORY_COLORS = {
    culture: '#8b5cf6',   // Viola
    music: '#ec4899',     // Rosa/Magenta
    sport: '#06b6d4',     // Ciano
    food_wine: '#f97316', // Arancione
    nature: '#10b981',    // Verde Smeraldo
    markets: '#eab308'    // Giallo Oro
  };

  const VDA_ZONE_POLYGONS = [
    { key: 'alta', label: '🏔️ Alta Valle', color: '#38bdf8', center: [45.73, 7.05], coords: [[45.85, 6.80], [45.86, 7.21], [45.69, 7.23], [45.54, 7.18], [45.54, 6.95], [45.70, 6.79]] },
    { key: 'media', label: '🦌 Media Valle', color: '#10b981', center: [45.79, 7.45], coords: [[45.95, 7.22], [45.96, 7.66], [45.77, 7.60], [45.54, 7.56], [45.53, 7.23], [45.69, 7.23]] },
    { key: 'bassa', label: '🏰 Bassa Valle', color: '#f59e0b', center: [45.69, 7.75], coords: [[45.92, 7.66], [45.89, 7.91], [45.58, 7.89], [45.56, 7.60], [45.77, 7.60]] },
    { key: 'aosta', label: '🏛️ Aosta Città', color: '#f43f5e', center: [45.737, 7.320], coords: [[45.758, 7.285], [45.758, 7.358], [45.718, 7.358], [45.718, 7.285]] }
  ];

  function initMap() {
    initComuniSvgMap();
    initLeafletMap();
  }

  function initComuniSvgMap() {
    renderComuniSvgMap();
  }

  function mapZoneToKey(z) {
    if (!z) return 'media';
    const s = z.toLowerCase();
    if (s.includes('aosta')) return 'aosta';
    if (s.includes('alta')) return 'alta';
    if (s.includes('bassa')) return 'bassa';
    return 'media';
  }

  function renderComuniSvgMap() {
    const svg = $('vdaComuniSvg');
    if (!svg) return;

    const currentZone = $('eventLocationFilter')?.value || '';
    const filteredEvents = getFilteredEvents();

    const countByComune = {};
    const eventsByComune = {};
    filteredEvents.forEach(e => {
      let locRaw = (e.location || 'Aosta').trim();
      // Breuil-Cervinia fa parte del comune ISTAT di Valtournenche
      const locKey = locRaw.toLowerCase() === 'breuil-cervinia' ? 'valtournenche' : locRaw.toLowerCase();
      countByComune[locKey] = (countByComune[locKey] || 0) + 1;
      if (!eventsByComune[locKey]) eventsByComune[locKey] = [];
      eventsByComune[locKey].push(e);
    });

    const rawPaths = window.VDA_COMUNI_PATHS || [];
    const polygons = rawPaths.map(p => ({
      name: p.name,
      area: mapZoneToKey(p.zone || p.area),
      cx: p.cx,
      cy: p.cy,
      path: p.d || p.path
    }));

    let svgHtml = '<defs>' +
      '<filter id="vdaOuterShadow" x="-10%" y="-10%" width="120%" height="120%">' +
        '<feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.45" />' +
      '</filter>' +
      '<filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">' +
        '<feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.55" />' +
      '</filter>' +
    '</defs>';

    // 0. Contorno esterno netto della Valle d'Aosta (identico alla mappa ufficiale dei 74 Comuni caricata dall'utente)
    svgHtml += '<g id="vdaOuterBorderLayer" filter="url(#vdaOuterShadow)" pointer-events="none">';
    polygons.forEach(p => {
      svgHtml += '<path d="' + p.path + '" fill="#ebebeb" stroke="#111111" stroke-width="4.2" stroke-linejoin="round" stroke-linecap="round"></path>';
    });
    svgHtml += '</g>';

    // 1. Poligoni contigui dei 74 Comuni della Valle d'Aosta
    svgHtml += '<g id="comuniLayer">';
    polygons.forEach(p => {
      const isSelected = _activeComuneFilter && (
        _activeComuneFilter.toLowerCase() === p.name.toLowerCase() ||
        (_activeComuneFilter.toLowerCase() === 'breuil-cervinia' && p.name.toLowerCase() === 'valtournenche')
      );
      const isZoneMatch = !currentZone || p.area === currentZone;
      const isDimmed = currentZone && !isZoneMatch;
      const evCount = countByComune[p.name.toLowerCase()] || 0;
      const hasEvents = evCount > 0;

      const cls = 'comune-polygon zone-' + p.area +
        (hasEvents ? ' has-events' : '') +
        (isSelected ? ' selected' : '') +
        (isDimmed ? ' dimmed' : '') +
        (currentZone && isZoneMatch ? ' zone-active' : '');

      svgHtml += '<path class="' + cls + '" ' +
        'id="comune-' + p.name.replace(/[^a-zA-Z0-9]/g, '') + '" ' +
        'data-name="' + p.name + '" ' +
        'data-area="' + p.area + '" ' +
        'd="' + p.path + '" ' +
        'onclick="App.selectMapComune(\'' + p.name.replace(/'/g, "\\'") + '\')" ' +
        'onmousemove="App.handleMapMouseMove(event, \'' + p.name.replace(/'/g, "\\'") + '\', \'' + p.area + '\', ' + evCount + ')" ' +
        'onmouseleave="App.hideMapTooltip()">' +
      '</path>';
    });
    svgHtml += '</g>';

    // 2. Nomi dei Comuni principali o con eventi attivi
    svgHtml += '<g id="labelsLayer" pointer-events="none">';
    const mainComuni = ['Aosta', 'Courmayeur', 'Cogne', 'Bard', 'Saint-Vincent', 'Châtillon', 'La Thuile', 'Morgex', 'Gressoney-Saint-Jean', 'Brusson', 'Ayas', 'Donnas', 'Pont-Saint-Martin', 'Fénis', 'Valtournenche', 'Nus', 'Sarre', 'Verrès', 'Gressan'];
    polygons.forEach(p => {
      const isSelected = _activeComuneFilter && _activeComuneFilter.toLowerCase() === p.name.toLowerCase();
      const evCount = countByComune[p.name.toLowerCase()] || 0;
      const isMain = mainComuni.includes(p.name) || evCount > 0;
      if (isMain || isSelected || _mapZoomLevel > 1.2) {
        const labelY = evCount > 0 ? (p.cy - 15) : (p.cy + 3);
        svgHtml += '<text class="comune-label-text ' + (evCount > 0 ? 'has-evts-label' : '') + '" x="' + p.cx + '" y="' + labelY + '" text-anchor="middle">' +
          p.name +
        '</text>';
      }
    });
    svgHtml += '</g>';

    // 3. Pin ed Eventi posizionati sopra i Comuni della Valle d'Aosta
    svgHtml += '<g id="eventsMarkersLayer">';
    polygons.forEach(p => {
      const evts = eventsByComune[p.name.toLowerCase()] || [];
      if (!evts.length) return;

      const topEvt = evts[0];
      const catColor = CATEGORY_COLORS[topEvt.category] || '#e62e2d';
      const isGold = evts.some(e => e.isSponsored && e.sponsorTier === 'gold');
      const r = Math.min(18, Math.max(10, 9 + Math.sqrt(evts.length) * 2.8));

      // Se ci sono più categorie nel comune, mostra anche piccoli satelliti colorati attorno al comune
      let satellitesHtml = '';
      if (evts.length > 1) {
        const subEvts = evts.slice(1, 5);
        subEvts.forEach((se, idx) => {
          const ang = (idx * (Math.PI * 2 / subEvts.length)) - Math.PI / 4;
          const sx = (p.cx + Math.cos(ang) * (r + 7)).toFixed(1);
          const sy = (p.cy + Math.sin(ang) * (r + 7)).toFixed(1);
          const sCol = CATEGORY_COLORS[se.category] || '#8b5cf6';
          satellitesHtml += '<circle cx="' + sx + '" cy="' + sy + '" r="4.5" fill="' + sCol + '" stroke="#ffffff" stroke-width="1.2" />';
        });
      }

      svgHtml += '<g class="map-event-marker ' + (isGold ? 'marker-gold' : '') + '" filter="url(#pinShadow)" ' +
         'onclick="App.handleComuneMarkerClick(event, \'' + p.name.replace(/'/g, "\\'") + '\')" ' +
         'onmousemove="App.handleMapMarkerHover(event, \'' + p.name.replace(/'/g, "\\'") + '\', ' + evts.length + ', \'' + topEvt.title.replace(/'/g, "\\'").replace(/"/g, '&quot;') + '\')" ' +
         'onmouseleave="App.hideMapTooltip()">' +
        satellitesHtml +
        '<circle cx="' + p.cx + '" cy="' + p.cy + '" r="' + (r + 3) + '" fill="' + catColor + '" opacity="0.25" class="pin-pulse-ring" />' +
        '<circle cx="' + p.cx + '" cy="' + p.cy + '" r="' + r + '" fill="' + catColor + '" stroke="' + (isGold ? '#fbbf24' : '#ffffff') + '" stroke-width="' + (isGold ? 2.8 : 2) + '" />' +
        '<text x="' + p.cx + '" y="' + (p.cy + 3.8) + '" font-size="10.5" font-weight="800" fill="#ffffff" text-anchor="middle" pointer-events="none">' +
          evts.length +
        '</text>' +
      '</g>';
    });
    svgHtml += '</g>';

    svg.innerHTML = svgHtml;
  }

  function handleMapMouseMove(e, comuneName, area, evCount) {
    const tooltip = $('vdaMapTooltip');
    if (!tooltip) return;
    const rect = $('vdaComuniMapWrap')?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.innerHTML = '<strong>' + comuneName + '</strong> (' + areaLabel(area) + ')<br>' +
      '<span style="color:var(--accent-secondary);font-weight:700;">' + evCount + ' ' + (evCount === 1 ? 'evento attivo' : 'eventi attivi') + '</span>' +
      '<div style="font-size:0.65rem;opacity:0.8;margin-top:2px;">Clicca per filtrare gli eventi del comune</div>';
    tooltip.classList.remove('hidden');
  }

  function handleMapMarkerHover(e, comuneName, count, sampleTitle) {
    e.stopPropagation();
    const tooltip = $('vdaMapTooltip');
    if (!tooltip) return;
    const rect = $('vdaComuniMapWrap')?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.innerHTML = '<div style="font-weight:800;font-size:0.82rem;color:var(--gold-sponsored);">📍 ' + comuneName + ' — ' + count + ' ' + (count === 1 ? 'attività' : 'attività') + '</div>' +
      '<div style="max-width:210px;white-space:normal;line-height:1.2;margin-top:2px;font-weight:600;">' + sampleTitle + '</div>' +
      '<div style="font-size:0.65rem;color:#38bdf8;margin-top:3px;">Clicca per visualizzare l\'elenco</div>';
    tooltip.classList.remove('hidden');
  }

  function handleComuneMarkerClick(e, comuneName) {
    e.stopPropagation();
    selectMapComune(comuneName);
  }

  function hideMapTooltip() {
    $('vdaMapTooltip')?.classList.add('hidden');
  }

  function selectMapComune(name) {
    _activeComuneFilter = _activeComuneFilter === name ? '' : name;

    const badge = $('activeComuneBadge');
    const badgeName = $('activeComuneName');
    if (badge && badgeName) {
      if (_activeComuneFilter) {
        badgeName.textContent = _activeComuneFilter;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    renderComuniSvgMap();
    renderEvents();
  }

  function zoomComuniMap(factor) {
    _mapZoomLevel = Math.max(0.7, Math.min(2.5, _mapZoomLevel * factor));
    const svg = $('vdaComuniSvg');
    if (svg) {
      const vbW = 960 / _mapZoomLevel;
      const vbH = 629 / _mapZoomLevel;
      const vbX = (960 - vbW) / 2;
      const vbY = (629 - vbH) / 2;
      svg.setAttribute('viewBox', vbX + ' ' + vbY + ' ' + vbW + ' ' + vbH);
    }
  }

  function resetComuniMapZoom() {
    _mapZoomLevel = 1;
    $('vdaComuniSvg')?.setAttribute('viewBox', '0 0 960 629');
  }

  function switchMapMode(mode) {
    _mapMode = mode;
    $('btnModeComuni')?.classList.toggle('active', mode === 'comuni');
    $('btnModeStreet')?.classList.toggle('active', mode === 'street');

    const comuniWrap = $('vdaComuniMapWrap');
    const leafletWrap = $('vdaLeafletMap');

    if (mode === 'street') {
      if (comuniWrap) comuniWrap.classList.add('hidden');
      if (leafletWrap) {
        leafletWrap.classList.remove('hidden');
        if (_leafletMap) {
          setTimeout(() => _leafletMap.invalidateSize(), 150);
        }
      }
    } else {
      if (leafletWrap) leafletWrap.classList.add('hidden');
      if (comuniWrap) comuniWrap.classList.remove('hidden');
      renderComuniSvgMap();
    }
  }

  function initLeafletMap() {
    if (typeof L === 'undefined') return;
    const mapContainer = $('vdaLeafletMap');
    if (!mapContainer) return;

    _leafletMap = L.map('vdaLeafletMap', { zoomControl: true, scrollWheelZoom: true }).setView([45.737, 7.380], 9);
    updateMapTileLayer();
    _zonePolygonsGroup = L.layerGroup().addTo(_leafletMap);
    _mapMarkersGroup = L.layerGroup().addTo(_leafletMap);
    renderZonePolygons('');
  }

  function renderZonePolygons(selectedZone = '') {
    if (!_leafletMap || !_zonePolygonsGroup) return;
    _zonePolygonsGroup.clearLayers();
    VDA_ZONE_POLYGONS.forEach(z => {
      const isSelected = selectedZone === z.key;
      const isDimmed = selectedZone && !isSelected;
      const poly = L.polygon(z.coords, {
        color: z.color,
        weight: isSelected ? 3 : 1.5,
        opacity: isDimmed ? 0.35 : 0.85,
        fillColor: z.color,
        fillOpacity: isSelected ? 0.24 : (isDimmed ? 0.04 : 0.11),
        dashArray: isSelected ? null : '5, 5'
      });
      poly.bindTooltip(z.label, { permanent: true, direction: 'center', className: 'vda-zone-label' });
      poly.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const currentLoc = $('eventLocationFilter')?.value || '';
        selectMapZone(currentLoc === z.key ? '' : z.key);
      });
      _zonePolygonsGroup.addLayer(poly);
    });
  }

  function selectMapZone(zoneKey) {
    const locSelect = $('eventLocationFilter');
    if (locSelect) locSelect.value = zoneKey;

    const chips = document.querySelectorAll('#mapZoneChips .zone-chip');
    chips.forEach(btn => {
      btn.classList.toggle('active', (btn.getAttribute('data-zone') || '') === zoneKey);
    });

    renderZonePolygons(zoneKey);
    centerMapOnArea(zoneKey);
    renderComuniSvgMap();
    renderEvents();
  }

  function selectMapCategory(catKey) {
    const catSelect = $('eventCategoryFilter');
    if (catSelect) catSelect.value = catKey;

    const btns = document.querySelectorAll('#mapCategoryLegend .legend-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', (btn.getAttribute('data-cat') || '') === catKey);
    });

    renderComuniSvgMap();
    renderEvents();
  }

  function updateMapTileLayer() {
    if (!_leafletMap) return;
    let hasTileLayer = false;
    _leafletMap.eachLayer(layer => { if (layer instanceof L.TileLayer) hasTileLayer = true; });
    if (!hasTileLayer) {
      const tilesUrl = '/api/tiles/{z}/{x}/{y}.png';
      const attribution = '&copy; OpenStreetMap contributors';
      const tileLayer = L.tileLayer(tilesUrl, { attribution, maxZoom: 19 });
      tileLayer.on('tileerror', function(err) {
        if (err && err.tile && !err.tile.dataset.fallbackTried) {
          err.tile.dataset.fallbackTried = '1';
          const coords = err.coords;
          if (coords) err.tile.src = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/' + coords.z + '/' + coords.y + '/' + coords.x;
        }
      });
      tileLayer.addTo(_leafletMap);
    }
  }

  function centerMapOnArea(area) {
    if (!_leafletMap) return;
    const coords = { aosta: [[45.737, 7.320], 12], alta: [[45.74, 7.03], 10], media: [[45.75, 7.43], 10], bassa: [[45.69, 7.74], 10] };
    if (coords[area]) _leafletMap.setView(coords[area][0], coords[area][1]);
    else _leafletMap.setView([45.737, 7.380], 9);
  }

  function renderMapMarkers(events) {
    if (!_leafletMap || !_mapMarkersGroup) return;
    _mapMarkersGroup.clearLayers();
    const coordCountMap = {};

    events.forEach(evt => {
      let lat = parseFloat(evt.lat);
      let lng = parseFloat(evt.lng);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const comuni = getComuni();
        const c = comuni.find(item => item.name.toLowerCase() === (evt.location || '').toLowerCase());
        lat = c ? c.lat : 45.7372;
        lng = c ? c.lng : 7.3201;
      }

      const coordKey = lat.toFixed(3) + '_' + lng.toFixed(3);
      const seenCount = coordCountMap[coordKey] || 0;
      coordCountMap[coordKey] = seenCount + 1;
      if (seenCount > 0) {
        const angle = (seenCount * 137.508) * (Math.PI / 180);
        const dist = 0.0022 * Math.sqrt(seenCount);
        lat += Math.cos(angle) * dist * 0.85;
        lng += Math.sin(angle) * dist * 1.25;
      }

      const catColor = CATEGORY_COLORS[evt.category] || '#8b5cf6';
      const isGold = evt.isSponsored && evt.sponsorTier === 'gold';
      const marker = L.circleMarker([lat, lng], {
        radius: isGold ? 8 : 6,
        fillColor: catColor,
        color: isGold ? '#fbbf24' : '#ffffff',
        weight: isGold ? 2.5 : 1.5,
        opacity: 1,
        fillOpacity: 0.92
      });

      const popupContent = '<div style="font-family: Outfit, sans-serif; min-width: 185px;">' +
          '<div style="display:flex;gap:4px;margin-bottom:4px;flex-wrap:wrap;">' +
            '<span style="background:' + catColor + ';color:#fff;font-size:0.64rem;font-weight:700;padding:1px 6px;border-radius:4px;">' + categoryLabel(evt.category) + '</span>' +
          '</div>' +
          '<h4 style="margin: 0 0 5px 0; font-size: 0.86rem; font-weight: 700;">' + evt.title + '</h4>' +
          '<p style="margin: 0 0 3px 0; font-size: 0.74rem;"><i class="far fa-calendar" style="margin-right:4px;"></i>' + formatDate(evt.date) + '</p>' +
          '<p style="margin: 0 0 3px 0; font-size: 0.74rem;"><i class="fas fa-map-marker-alt" style="margin-right:4px;"></i><strong>' + evt.location + '</strong></p>' +
          '<button onclick="App.openEventDetail(\'' + evt.id + '\')" style="margin-top:6px;width:100%;border:none;background:' + catColor + ';color:white;border-radius:4px;padding:5px 8px;font-size:0.72rem;cursor:pointer;font-weight:700;">Scopri Attività</button>' +
        '</div>';
      marker.bindPopup(popupContent);
      _mapMarkersGroup.addLayer(marker);
    });
  }

  /* ══════════════════════════════
     EVENT CLASSIFICATION HELPERS
  ══════════════════════════════ */
  function getEventTimeSlot(evt) {
    if (evt.timeSlot) return evt.timeSlot;
    const text = `${evt.title || ''} ${evt.description || ''} ${evt.eventTime || ''}`.toLowerCase();
    if (/20:|20\.30|21:|21\.30|22:|19:30|serata|serale|notturn|notte|concerto|cena|aperitiv|luci di natale|live|dj/.test(text)) {
      return 'evening';
    }
    if (/tutto il giorno|10:00\s*-\s*20:00|marché vert|sant'orso/.test(text)) {
      return 'all_day';
    }
    return 'day';
  }

  function getEventCostType(evt) {
    if (evt.costType) return evt.costType;
    const text = `${evt.title || ''} ${evt.description || ''} ${evt.price || ''}`.toLowerCase();
    if (/gratuit|libero|free|offerta libera/.test(text) || (evt.category === 'markets' && !/€|\beuro\b/.test(text))) {
      return 'free';
    }
    return 'paid';
  }

  function getEventBookingType(evt) {
    if (evt.bookingType) return evt.bookingType;
    const text = `${evt.title || ''} ${evt.description || ''} ${evt.price || ''}`.toLowerCase();
    if (/prenotazion|iscrizion|su invito|posti limitati|obbligatori|corso|laboratori|visita guidata|escursione guidata|cena|degustazion|gara|trail/.test(text)) {
      return 'required';
    }
    return 'none';
  }

  function toIsoDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function doesEventOverlapRange(evtStart, evtEnd, rangeStart, rangeEnd) {
    return evtEnd >= rangeStart && evtStart <= rangeEnd;
  }

  function doesEventTouchAnyWeekend(evtStartStr, evtEndStr, windowStartStr, windowEndStr) {
    const startStr = evtStartStr > windowStartStr ? evtStartStr : windowStartStr;
    const endStr = evtEndStr < windowEndStr ? evtEndStr : windowEndStr;
    if (startStr > endStr) return false;

    const curr = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    let guard = 0;
    while (curr <= end && guard < 45) {
      const dow = curr.getDay();
      if (dow === 0 || dow === 6) return true; // Domenica (0) o Sabato (6)
      curr.setDate(curr.getDate() + 1);
      guard++;
    }
    return false;
  }

  /* ══════════════════════════════
     FILTER & RENDER EVENTS
  ══════════════════════════════ */
  function getFilteredEvents() {
    const all = getEvents().filter(e => e.status === 'approved');
    const keyword = $('eventSearchInput')?.value.trim().toLowerCase() || '';
    const location = $('eventLocationFilter')?.value || '';
    const category = $('eventCategoryFilter')?.value || '';
    const rassegnaFilter = $('eventRassegnaFilter')?.value || _activeRassegnaFilter || '';
    const timeSlotFilter = $('eventTimeSlotFilter')?.value || '';
    const costFilter = $('eventCostFilter')?.value || '';
    const bookingFilter = $('eventBookingFilter')?.value || '';
    const kidsOnly = $('eventChildrenFilter')?.checked || false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = toIsoDate(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = toIsoDate(tomorrow);

    const dow = today.getDay();
    const satDate = new Date(today);
    const sunDate = new Date(today);
    if (dow === 6) {
      sunDate.setDate(today.getDate() + 1);
    } else if (dow === 0) {
      satDate.setDate(today.getDate() - 1);
    } else {
      const daysUntilSat = 6 - dow;
      satDate.setDate(today.getDate() + daysUntilSat);
      sunDate.setDate(today.getDate() + daysUntilSat + 1);
    }
    const thisWeekendStartStr = toIsoDate(satDate);
    const thisWeekendEndStr = toIsoDate(sunDate);

    const plus30 = new Date(today);
    plus30.setDate(today.getDate() + 30);
    const plus30Str = toIsoDate(plus30);

    const rMin = $('rangeMin');
    const rMax = $('rangeMax');
    let sliderMinDays = 0;
    let sliderMaxDays = 30;
    if (rMin && rMax) {
      sliderMinDays = parseInt(rMin.value, 10);
      sliderMaxDays = parseInt(rMax.value, 10);
    }

    // Mapping non-lineare: 0..30 = giorni reali (0..30gg), 31..40 = oltre (fino a 180gg / infinito)
    function sliderValueToDate(val) {
      const d = new Date(today);
      if (val <= 30) {
        d.setDate(today.getDate() + val);
      } else if (val < 40) {
        // Da 31 a 39 giorni mappati fino a 90gg
        d.setDate(today.getDate() + 30 + (val - 30) * 6);
      } else {
        // Valore 40 = Oltre / Infinito (+365gg)
        d.setDate(today.getDate() + 365);
      }
      return toIsoDate(d);
    }

    const sliderMinStr = sliderValueToDate(sliderMinDays);
    const sliderMaxStr = sliderValueToDate(sliderMaxDays);

    return all.filter(evt => {
      // Filtro per Comune cliccato sulla cartina
      if (_activeComuneFilter) {
        if ((evt.location || '').toLowerCase() !== _activeComuneFilter.toLowerCase()) {
          return false;
        }
      }

      // Ricerca rapida parola chiave
      if (keyword) {
        const haystack = (evt.title + ' ' + evt.description + ' ' + evt.location + ' ' + (evt.tags || []).join(' ')).toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      // Filtro Rassegna (Saison Culturelle, Marché Vert, Forte di Bard...)
      if (rassegnaFilter) {
        const evtRassegna = evt.rassegna || '';
        const haystack = (evt.title + ' ' + evt.description + ' ' + (evt.tags || []).join(' ')).toLowerCase();
        if (rassegnaFilter === 'saison_culturelle') {
          if (evtRassegna !== 'saison_culturelle' && !haystack.includes('saison culturelle') && !haystack.includes('splendor')) return false;
        } else if (rassegnaFilter === 'marche_vert_noel') {
          if (evtRassegna !== 'marche_vert_noel' && !haystack.includes('marché') && !haystack.includes('marche vert') && !haystack.includes('natale')) return false;
        } else if (rassegnaFilter === 'forte_di_bard') {
          if (evtRassegna !== 'forte_di_bard' && !haystack.includes('forte di bard') && (evt.location || '').toLowerCase() !== 'bard') return false;
        } else if (rassegnaFilter === 'fiera_sant_orso') {
          if (evtRassegna !== 'fiera_sant_orso' && !haystack.includes("sant'orso") && !haystack.includes('millenaria')) return false;
        } else if (rassegnaFilter === 'grandi_eventi_montagna') {
          if (evtRassegna !== 'grandi_eventi_montagna' && !haystack.includes('ice opening') && !haystack.includes('coppa del mondo') && !haystack.includes('tor des')) return false;
        }
      }

      // Filtro Area / Valle
      if (location) {
        const comuni = getComuni();
        const cMatch = comuni.find(c => c.name.toLowerCase() === (evt.location || '').toLowerCase());
        const effectiveArea = cMatch ? cMatch.area : evt.area;
        if (effectiveArea !== location) return false;
      }

      // Filtro Categoria
      if (category && evt.category !== category) return false;

      // Filtro Bambini
      if (kidsOnly && !evt.suitableForChildren) return false;

      // Filtro Giorno / Sera
      if (timeSlotFilter) {
        const slot = getEventTimeSlot(evt);
        if (timeSlotFilter === 'day' && slot !== 'day' && slot !== 'all_day') return false;
        if (timeSlotFilter === 'evening' && slot !== 'evening' && slot !== 'all_day') return false;
      }

      // Filtro Gratuito / A Pagamento
      if (costFilter && getEventCostType(evt) !== costFilter) return false;

      // Filtro Prenotazione
      if (bookingFilter && getEventBookingType(evt) !== bookingFilter) return false;

      // Filtro Temporale preciso: mai eventi nel passato, e distinzione netta tra Oggi, Domani, Weekend, 30gg e Oltre
      const evtStart = evt.date >= todayStr ? evt.date : todayStr;
      const evtEnd = evt.endDate && evt.endDate >= evtStart ? evt.endDate : evtStart;
      if (evtEnd < todayStr) return false;

      if (_activeTimePreset === 'today') {
        // Mostra eventi che iniziano OGGI (o eventi brevi di 1-2 giorni attivi oggi, escludendo mostre lunghe di mesi)
        if (evtStart !== todayStr) return false;
      } else if (_activeTimePreset === 'tomorrow') {
        // Mostra eventi in programma DOMANI (distinti da quelli di oggi!)
        if (evtStart !== tomorrowStr) return false;
      } else if (_activeTimePreset === 'this_weekend') {
        // Mostra eventi di QUESTO WEEKEND (Sabato e Domenica)
        if (evtStart < thisWeekendStartStr || evtStart > thisWeekendEndStr) return false;
      } else if (_activeTimePreset === 'all_weekends') {
        if (evtStart < todayStr || evtStart > plus30Str) return false;
        if (!doesEventTouchAnyWeekend(evtStart, evtEnd, todayStr, plus30Str)) return false;
      } else if (_activeTimePreset === 'all') {
        // Tutti gli eventi da oggi in poi (inclusi oltre 30 giorni)
        if (evtStart < todayStr) return false;
      } else {
        // '30d' o 'custom' da slider
        if (sliderMaxDays >= 40) {
          if (evtStart < sliderMinStr) return false;
        } else {
          if (evtStart < sliderMinStr || evtStart > sliderMaxStr) return false;
        }
      }

      return true;
    });
  }

  function setEventsViewMode(mode) {
    _eventsViewMode = mode;
    $('btnViewGrid')?.classList.toggle('active', _eventsViewMode === 'grid');
    $('btnViewList')?.classList.toggle('active', _eventsViewMode === 'list');
    $('btnViewTimeline')?.classList.toggle('active', _eventsViewMode === 'timeline');

    const container = $('eventsGrid');
    if (container) {
      if (_eventsViewMode === 'list') container.className = 'events-list-view';
      else if (_eventsViewMode === 'timeline') container.className = 'events-timeline-view';
      else container.className = 'events-grid';
    }
    renderEvents();
  }

  function setEventsSort(sortBy) {
    _eventsSortBy = sortBy || 'date';
    renderEvents();
  }

  function toggleRassegnaChip(rassegnaKey) {
    const sel = $('eventRassegnaFilter');
    if (_activeRassegnaFilter === rassegnaKey) {
      _activeRassegnaFilter = '';
      if (sel) sel.value = '';
    } else {
      _activeRassegnaFilter = rassegnaKey;
      if (sel) sel.value = rassegnaKey;
    }

    const chips = document.querySelectorAll('#rassegnaQuickChips .rassegna-chip');
    chips.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-rassegna') === _activeRassegnaFilter);
    });

    renderEvents();
    renderComuniSvgMap();
  }

  function renderEvents() {
    const grid = $('eventsGrid');
    if (!grid) return;

    if (_eventsViewMode === 'list') grid.className = 'events-list-view';
    else if (_eventsViewMode === 'timeline') grid.className = 'events-timeline-view';
    else grid.className = 'events-grid';

    const filtered = getFilteredEvents();
    const countEl = $('eventsResultsCount');
    if (countEl) countEl.textContent = filtered.length + ' attivit' + (filtered.length !== 1 ? 'à' : 'à');

    const sorted = [...filtered].sort((a, b) => {
      if (_eventsSortBy === 'location') {
        return (a.location || '').localeCompare(b.location || '');
      }
      if (_eventsSortBy === 'relevance') {
        const tierPrio = { gold: 0, silver: 1, standard: 2 };
        const ta = a.isSponsored ? (tierPrio[a.sponsorTier] ?? 2) : 2;
        const tb = b.isSponsored ? (tierPrio[b.sponsorTier] ?? 2) : 2;
        if (ta !== tb) return ta - tb;
        return (b.importanceScore || 5) - (a.importanceScore || 5);
      }
      // 'date': dà precedenza agli eventi imminenti
      const da = new Date(a.date);
      const db = new Date(b.date);
      if (da - db !== 0) return da - db;
      return (b.importanceScore || 5) - (a.importanceScore || 5);
    });

    if (!sorted.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);background:var(--bg-secondary);border-radius:var(--radius-md);border:1px solid var(--glass-border);">' +
        '<i class="fas fa-calendar-xmark" style="font-size:2rem;margin-bottom:0.75rem;display:block;color:var(--accent-primary);"></i>' +
        'Nessuna attività trovata con questi filtri.<br>' +
        '<button onclick="resetFilters()" style="margin-top:0.85rem;background:var(--accent-primary);color:#fff;padding:0.45rem 1rem;border-radius:20px;font-size:0.8rem;font-weight:700;cursor:pointer;">Mostra tutti gli eventi</button>' +
      '</div>';
    } else if (_eventsViewMode === 'list') {
      grid.innerHTML = sorted.map(e => eventListRowHTML(e)).join('');
    } else if (_eventsViewMode === 'timeline') {
      grid.innerHTML = renderTimelineBubblesHTML(sorted);
    } else {
      grid.innerHTML = sorted.map(e => eventCardHTML(e)).join('');
    }

    renderMapMarkers(filtered);
    renderComuniSvgMap();
  }

  function renderSingleBubbleHTML(evt, idxOffset = 0) {
    const catColor = CATEGORY_COLORS[evt.category] || 'var(--accent-primary)';
    const isGold = evt.isSponsored && evt.sponsorTier === 'gold';
    const score = evt.importanceScore || 6;

    // Dimensionamento dinamico della bolla proporzionale all'importanza (da 125px a 205px)
    const diameter = Math.min(205, Math.max(125, 112 + (score - 4) * 15 + (isGold ? 18 : 0)));
    const sizeClass = diameter > 170 ? 'size-lg' : (diameter > 145 ? 'size-md' : 'size-sm');
    const imgSrc = evt.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80';
    const animDelay = ((idxOffset * 0.45) % 2.8).toFixed(2);

    return '<div class="timeline-event-bubble ' + sizeClass + ' ' + (isGold ? 'bubble-gold' : '') + '" ' +
      'style="width:' + diameter + 'px; height:' + diameter + 'px; background-image:url(\'' + imgSrc + '\'); --bubble-color:' + catColor + '; animation-delay:-' + animDelay + 's;" ' +
      'onclick="App.openEventDetail(\'' + evt.id + '\')" ' +
      'title="' + evt.title.replace(/"/g, '&quot;') + ' (' + evt.location + ')">' +
      (isGold ? '<span class="bubble-importance-star"><i class="fas fa-crown"></i></span>' : (score >= 9 ? '<span class="bubble-importance-star"><i class="fas fa-star"></i></span>' : '')) +
      '<div class="bubble-content">' +
        '<span class="bubble-category-tag">' + categoryLabel(evt.category) + '</span>' +
        '<div class="bubble-title">' + evt.title + '</div>' +
        '<div class="bubble-meta">' +
          '<i class="fas fa-map-pin" style="color:' + catColor + ';"></i> ' + evt.location +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderTimelineBubblesHTML(events) {
    const todayStr = getTodayIsoStr();
    // Raggruppa solo eventi da OGGI in poi (mai eventi passati!)
    const grouped = {};
    events.forEach(evt => {
      const rawDate = evt.date || todayStr;
      const dKey = rawDate < todayStr ? todayStr : rawDate;
      if (!grouped[dKey]) grouped[dKey] = [];
      grouped[dKey].push(evt);
    });

    const dateKeys = Object.keys(grouped).filter(d => d >= todayStr).sort();
    if (!dateKeys.length) return '';

    // Costruisce una linea centrale morbida e sinuosa (onda SVG cubica)
    const segH = 260;
    const totalH = Math.max(420, dateKeys.length * segH + 100);
    let wavePath = 'M 60 0 ';
    for (let i = 0; i < dateKeys.length + 2; i++) {
      const y1 = i * segH + segH * 0.35;
      const y2 = i * segH + segH * 0.65;
      const yEnd = (i + 1) * segH;
      const cx = (i % 2 === 0) ? 108 : 12;
      wavePath += `C ${cx} ${y1}, ${cx} ${y2}, 60 ${yEnd} `;
    }

    const centralWaveSvg =
      '<svg class="timeline-central-wave-svg" viewBox="0 0 120 ' + totalH + '" preserveAspectRatio="none">' +
        '<defs>' +
          '<linearGradient id="tlWaveGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#e62e2d" />' +
            '<stop offset="45%" stop-color="#8b5cf6" />' +
            '<stop offset="85%" stop-color="#10b981" />' +
            '<stop offset="100%" stop-color="#f59e0b" />' +
          '</linearGradient>' +
          '<filter id="tlWaveGlow" x="-40%" y="-10%" width="180%" height="120%">' +
            '<feGaussianBlur stdDeviation="3.5" result="blur" />' +
            '<feComposite in="SourceGraphic" in2="blur" operator="over" />' +
          '</filter>' +
        '</defs>' +
        '<path d="' + wavePath + '" fill="none" stroke="url(#tlWaveGrad)" stroke-width="5" stroke-linecap="round" opacity="0.28" filter="url(#tlWaveGlow)" />' +
        '<path d="' + wavePath + '" fill="none" stroke="url(#tlWaveGrad)" stroke-width="3.2" stroke-linecap="round" />' +
      '</svg>';

    let globalBubbleIdx = 0;
    const rowsHtml = dateKeys.map((dKey, dayIdx) => {
      const dayEvts = grouped[dKey];
      const dObj = new Date(dKey + 'T00:00:00');
      const isToday = dKey === todayStr;
      const dateFormatted = (isToday ? '🔥 OGGI — ' : '') +
        dObj.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

      // Se c'è 1 solo evento in quella data, alterna a sinistra e a destra della curva centrale;
      // se sono tanti (2+), distribuiscili su ENTRAMBI i lati (sinistra e destra)!
      const leftEvts = [];
      const rightEvts = [];
      if (dayEvts.length === 1) {
        if (dayIdx % 2 === 0) leftEvts.push(dayEvts[0]);
        else rightEvts.push(dayEvts[0]);
      } else {
        dayEvts.forEach((ev, idx) => {
          if (idx % 2 === 0) leftEvts.push(ev);
          else rightEvts.push(ev);
        });
      }

      const leftHtml = leftEvts.map(ev => renderSingleBubbleHTML(ev, globalBubbleIdx++)).join('');
      const rightHtml = rightEvts.map(ev => renderSingleBubbleHTML(ev, globalBubbleIdx++)).join('');

      return '<div class="timeline-day-row ' + (dayEvts.length > 1 ? 'both-sides' : (leftEvts.length ? 'side-left-only' : 'side-right-only')) + '">' +
        '<div class="timeline-center-date-wrap">' +
          '<div class="timeline-date-marker"><span class="tl-node-dot"></span><i class="far fa-calendar-alt"></i> ' + dateFormatted + ' <span class="tl-count-pill">' + dayEvts.length + '</span></div>' +
        '</div>' +
        '<div class="timeline-sides-container">' +
          '<div class="timeline-side timeline-side-left">' +
            (leftEvts.length ? '<div class="timeline-branch-curve branch-left"></div>' : '') +
            '<div class="timeline-bubbles-cluster cluster-left">' + leftHtml + '</div>' +
          '</div>' +
          '<div class="timeline-center-spacer"></div>' +
          '<div class="timeline-side timeline-side-right">' +
            (rightEvts.length ? '<div class="timeline-branch-curve branch-right"></div>' : '') +
            '<div class="timeline-bubbles-cluster cluster-right">' + rightHtml + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="timeline-curved-wrapper">' +
      centralWaveSvg +
      rowsHtml +
    '</div>';
  }


  function buildEventBadgesHTML(evt) {
    const slot = getEventTimeSlot(evt);
    const cost = getEventCostType(evt);
    const booking = getEventBookingType(evt);

    const slotBadge = slot === 'evening'
      ? `<span class="evt-pill pill-evening"><i class="fas fa-moon"></i> Sera</span>`
      : (slot === 'all_day'
          ? `<span class="evt-pill pill-allday"><i class="fas fa-sun"></i> Giorno & Sera</span>`
          : `<span class="evt-pill pill-day"><i class="fas fa-sun"></i> Giorno</span>`);

    const costBadge = cost === 'free'
      ? `<span class="evt-pill pill-free">🟢 Gratuito</span>`
      : `<span class="evt-pill pill-paid">🎟️ A Pagamento</span>`;

    const bookingBadge = booking === 'required'
      ? `<span class="evt-pill pill-booking-req"><i class="fas fa-calendar-check"></i> Su Prenotazione</span>`
      : `<span class="evt-pill pill-booking-none"><i class="fas fa-bolt"></i> Accesso Libero</span>`;

    const kidsBadge = evt.suitableForChildren
      ? `<span class="evt-pill" style="background:rgba(13,148,136,0.15);color:#2dd4bf;border:1px solid rgba(13,148,136,0.3);">👶 Famiglie</span>`
      : '';

    return `<div class="card-badges-row">${slotBadge}${costBadge}${bookingBadge}${kidsBadge}</div>`;
  }

  function eventCardHTML(evt) {
    const sponsBadge = evt.isSponsored ? `<div class="badge-sponsored"><i class="fas fa-star"></i> Sponsorizzato${evt.sponsorTier==='gold'?' — Gold':evt.sponsorTier==='silver'?' — Silver':''}</div>` : '';
    const imgSrc = evt.image || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80`;
    const srcIcon = sourceTypeIcon(evt.source?.type || 'other');
    const srcName = evt.source?.name || 'Fonte ufficiale';
    const srcUrl = evt.source?.url && evt.source.url !== '#' ? `href="${evt.source.url}" target="_blank" rel="noopener"` : '';
    const catColor = CATEGORY_COLORS[evt.category] || 'var(--accent-primary)';

    const comuni = getComuni();
    const c = comuni.find(item => item.name.toLowerCase() === (evt.location || '').toLowerCase());
    const areaVal = c ? c.area : evt.area;
    const area = areaLabel(areaVal);

    return `<div class="event-card ${evt.isSponsored&&evt.sponsorTier==='gold'?'sponsored-gold':''}" onclick="App.openEventDetail('${evt.id}')">
      <div class="card-img-wrapper">
        ${sponsBadge}
        <div class="badge-category" style="border-left: 3px solid ${catColor};">${categoryLabel(evt.category)}</div>
        <img src="${imgSrc}" alt="${evt.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80'">
      </div>
      <div class="card-body">
        <div class="event-meta">
          <span class="meta-item"><i class="far fa-calendar"></i> ${formatDate(evt.date)}${evt.endDate&&evt.endDate!==evt.date?' – '+formatDate(evt.endDate):''}</span>
          <span class="meta-item"><i class="fas fa-map-pin" style="color:${catColor};"></i> <strong>${evt.location}</strong> <span style="opacity:0.65;font-size:0.72rem;">(${area})</span></span>
        </div>
        <h3 class="card-title">${evt.title}</h3>
        ${buildEventBadgesHTML(evt)}
        <p class="card-description">${evt.description}</p>
        <div class="card-footer">
          <span class="price-tag" style="font-size:0.8rem;">${evt.price || 'Ingresso libero'}</span>
          <a class="source-citation" ${srcUrl} title="Fonte: ${srcName}" onclick="event.stopPropagation()">
            ${srcIcon} ${srcName.substring(0,20)}${srcName.length>20?'…':''}
          </a>
        </div>
      </div>
    </div>`;
  }

  function eventListRowHTML(evt) {
    const imgSrc = evt.image || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80`;
    const catColor = CATEGORY_COLORS[evt.category] || '#8b5cf6';
    const comuni = getComuni();
    const c = comuni.find(item => item.name.toLowerCase() === (evt.location || '').toLowerCase());
    const areaVal = c ? c.area : evt.area;
    const area = areaLabel(areaVal);

    const [, m, d] = (evt.date || '2026-11-07').split('-');
    const monthNames = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'];
    const monthShort = monthNames[parseInt(m, 10) - 1] || 'NOV';

    return `
      <div class="event-list-row ${evt.isSponsored && evt.sponsorTier === 'gold' ? 'sponsored-gold' : ''}" onclick="App.openEventDetail('${evt.id}')">
        <div class="list-date-box">
          <span class="list-date-day">${d || '07'}</span>
          <span class="list-date-month">${monthShort}</span>
        </div>
        <img class="list-thumb" src="${imgSrc}" alt="${evt.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80'">
        <div class="list-main-info">
          <div class="list-title-row">
            <span style="background:${catColor};color:#fff;font-size:0.65rem;font-weight:700;padding:0.12rem 0.45rem;border-radius:4px;text-transform:uppercase;">${categoryLabel(evt.category)}</span>
            <span class="list-title">${evt.title}</span>
          </div>
          <div class="list-location-meta">
            <span><i class="fas fa-map-marker-alt" style="color:${catColor};"></i> <strong>${evt.location}</strong> (${area})</span>
            <span><i class="far fa-calendar"></i> ${formatDate(evt.date)}${evt.endDate && evt.endDate !== evt.date ? ' → ' + formatDate(evt.endDate) : ''}</span>
            <span><i class="far fa-clock"></i> ${evt.eventTime || 'Tutto il giorno'}</span>
          </div>
          ${buildEventBadgesHTML(evt)}
        </div>
        <div class="list-actions-col">
          <span style="font-size:0.78rem;font-weight:700;color:var(--text-primary);">${evt.price || 'Gratuito'}</span>
          <button type="button" class="btn-cta" style="padding:0.35rem 0.75rem;font-size:0.75rem;">Dettagli <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>
    `;
  }

  function openEventDetail(id) {
    const evt = getEvents().find(e => e.id === id);
    if (!evt) return;
    const body = $('eventDetailBody');
    if (!body) return;
    
    const comuni = getComuni();
    const c = comuni.find(item => item.name.toLowerCase() === (evt.location || '').toLowerCase());
    const areaVal = c ? c.area : evt.area;
    const slot = getEventTimeSlot(evt);
    const slotLabel = slot === 'evening' ? '🌙 Serale (Sera / Notte)' : (slot === 'all_day' ? '🕒 Tutto il giorno' : '☀️ Diurno (Giorno)');
    const bookingLabel = getEventBookingType(evt) === 'required' ? '📋 Prenotazione / Iscrizione richiesta' : '⚡ Accesso libero senza prenotazione';

    const srcUrl = evt.source?.url && evt.source.url !== '#' ? evt.source.url : null;
    body.innerHTML = `
      <img src="${evt.image || ''}" alt="${evt.title}" style="width:100%;height:240px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:1.25rem;" onerror="this.style.display='none'">
      <h2 class="modal-title" style="margin-bottom:0.5rem;">${evt.title}</h2>
      <div style="margin-bottom:0.85rem;">${buildEventBadgesHTML(evt)}</div>
      <div class="detail-meta-grid" style="margin-top:0.85rem;">
        <div><div class="detail-label">Data</div><div class="detail-value"><i class="far fa-calendar" style="margin-right:4px;color:var(--text-muted);"></i>${formatDate(evt.date)}${evt.endDate&&evt.endDate!==evt.date?' → '+formatDate(evt.endDate):''}</div></div>
        <div><div class="detail-label">Fascia Oraria</div><div class="detail-value">${slotLabel}</div></div>
        <div><div class="detail-label">Comune & Zona</div><div class="detail-value"><i class="fas fa-map-pin" style="margin-right:4px;color:var(--text-muted);"></i>${evt.location} (${areaLabel(areaVal)})</div></div>
        <div><div class="detail-label">Categoria</div><div class="detail-value"><i class="${categoryIcon(evt.category)}" style="margin-right:4px;color:var(--text-muted);"></i>${categoryLabel(evt.category)}</div></div>
        <div><div class="detail-label">Costo</div><div class="detail-value">${evt.price || 'N.d.'}</div></div>
        <div><div class="detail-label">Modalità Accesso</div><div class="detail-value">${bookingLabel}</div></div>
      </div>
      <p style="line-height:1.75;color:var(--text-secondary);margin-bottom:1.25rem;">${evt.description}</p>
      ${evt.tags?.length ? `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:1.25rem;">${evt.tags.map(t=>`<span style="background:var(--bg-tertiary);padding:0.2rem 0.55rem;border-radius:20px;font-size:0.7rem;color:var(--text-secondary);">#${t}</span>`).join('')}</div>` : ''}
      <div style="border-top:1px solid var(--glass-border);padding-top:1rem;display:flex;align-items:center;gap:0.5rem;font-size:0.8rem;color:var(--text-muted);">
        <i class="fas fa-link"></i> Fonte Ufficiale:
        ${srcUrl ? `<a href="${srcUrl}" target="_blank" rel="noopener" style="color:var(--accent-primary);font-weight:700;">${evt.source.name} <i class="fas fa-external-link-alt"></i></a>` : `<span>${evt.source?.name || 'Sconosciuta'}</span>`}
      </div>`;
    openModal('eventDetailModal');
  }

  window.App = window.App || {};
  Object.assign(window.App, {
    openEventDetail,
    selectMapZone,
    selectMapCategory,
    setEventsViewMode,
    setEventsSort
  });

  /* ══════════════════════════════
     FILTER LISTENERS & 30-DAY TIME SEARCH
   ══════════════════════════════ */
  function initFilters() {
    ['eventSearchInput', 'eventChildrenFilter'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('input', renderEvents);
    });
    ['eventLocationFilter', 'eventCategoryFilter', 'eventRassegnaFilter', 'eventTimeSlotFilter', 'eventCostFilter', 'eventBookingFilter'].forEach(id => {
      const el = $(id);
      if (el) {
        el.addEventListener('change', () => {
          if (id === 'eventLocationFilter') {
            selectMapZone(el.value);
            return;
          }
          if (id === 'eventCategoryFilter') {
            selectMapCategory(el.value);
            return;
          }
          if (id === 'eventRassegnaFilter') {
            _activeRassegnaFilter = el.value;
            const chips = document.querySelectorAll('#rassegnaQuickChips .rassegna-chip');
            chips.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-rassegna') === _activeRassegnaFilter));
          }
          renderEvents();
          renderComuniSvgMap();
        });
      }
    });
  }

  function setTimePreset(preset) {
    _activeTimePreset = preset || '30d';
    $$('#timePresetsGroup .time-preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === _activeTimePreset);
    });

    const minInput = $('rangeMin');
    const maxInput = $('rangeMax');
    const fill = $('rangeSliderFill');
    const label = $('timeSelectedLabel');
    const today = new Date();

    if (minInput && maxInput && fill) {
      if (_activeTimePreset === 'today') {
        minInput.value = 0; maxInput.value = 0;
        fill.style.left = '0%'; fill.style.width = '3%';
        if (label) label.textContent = `Oggi (${today.toLocaleDateString('it-IT')})`;
      } else if (_activeTimePreset === 'tomorrow') {
        minInput.value = 1; maxInput.value = 1;
        fill.style.left = '3.3%'; fill.style.width = '3.3%';
        const tom = new Date(today); tom.setDate(today.getDate() + 1);
        if (label) label.textContent = `Domani (${tom.toLocaleDateString('it-IT')})`;
      } else if (_activeTimePreset === 'this_weekend') {
        const dow = today.getDay();
        const dSat = dow === 6 ? 0 : (dow === 0 ? 0 : 6 - dow);
        const dSun = dow === 0 ? 0 : dSat + 1;
        minInput.value = Math.min(30, dSat);
        maxInput.value = Math.min(30, dSun);
        fill.style.left = `${(minInput.value / 30) * 100}%`;
        fill.style.width = `${Math.max(3, ((maxInput.value - minInput.value) / 30) * 100)}%`;
        if (label) label.textContent = `Questo Weekend (Sabato & Domenica)`;
      } else if (_activeTimePreset === 'all_weekends') {
        minInput.value = 0; maxInput.value = 30;
        fill.style.left = '0%'; fill.style.width = '100%';
        if (label) label.textContent = `Tutti i Weekend dei prossimi 30 giorni`;
      } else if (_activeTimePreset === 'all') {
        minInput.value = 0; maxInput.value = 40;
        fill.style.left = '0%'; fill.style.width = '100%';
        if (label) label.textContent = 'Tutti gli eventi in programma (anche oltre 30gg)';
      } else {
        minInput.value = 0; maxInput.value = 30;
        fill.style.left = '0%'; fill.style.width = '100%';
        const d2 = new Date(today); d2.setDate(today.getDate() + 30);
        if (label) label.textContent = `Prossimi 30gg (${today.toLocaleDateString('it-IT')} — ${d2.toLocaleDateString('it-IT')})`;
      }
    }

    renderEvents();
  }

  Object.assign(window.App, { setTimePreset });

  function initTimeSlider() {
    const minInput = $('rangeMin');
    const maxInput = $('rangeMax');
    const fill = $('rangeSliderFill');
    const label = $('timeSelectedLabel');

    if (!minInput || !maxInput || !fill || !label) return;

    function sliderValToDisplay(val) {
      const d = new Date();
      if (val <= 30) {
        d.setDate(d.getDate() + val);
        return d.toLocaleDateString('it-IT');
      } else if (val < 40) {
        d.setDate(d.getDate() + 30 + (val - 30) * 6);
        return d.toLocaleDateString('it-IT');
      }
      return 'Tutti i futuri (oltre 30gg)';
    }

    function updateSlider(isUserDrag = false) {
      let val1 = parseInt(minInput.value, 10);
      let val2 = parseInt(maxInput.value, 10);

      if (val1 > val2) {
        if (this === minInput) {
          minInput.value = val2;
          val1 = val2;
        } else {
          maxInput.value = val1;
          val2 = val1;
        }
      }

      if (isUserDrag) {
        _activeTimePreset = 'custom';
        const btns = document.querySelectorAll('#timePresetsGroup .time-preset-btn');
        btns.forEach(btn => btn.classList.remove('active'));
      }

      const p1 = (val1 / 40) * 100;
      const p2 = (val2 / 40) * 100;
      fill.style.left = p1 + '%';
      fill.style.width = Math.max(2, p2 - p1) + '%';

      if (val1 === 0 && val2 >= 40) {
        label.textContent = 'Tutti gli eventi futuri';
      } else if (val2 <= 30) {
        label.textContent = sliderValToDisplay(val1) + ' — ' + sliderValToDisplay(val2) + ' (' + (val2 - val1) + ' gg)';
      } else {
        label.textContent = sliderValToDisplay(val1) + ' — ' + sliderValToDisplay(val2);
      }

      renderEvents();
    }

    minInput.addEventListener('input', function() { updateSlider.call(this, true); });
    maxInput.addEventListener('input', function() { updateSlider.call(this, true); });

    setTimePreset('30d');
  }

  window.resetFilters = function() {
    const kf = $('eventSearchInput'); if(kf) kf.value = '';
    const kids = $('eventChildrenFilter'); if(kids) kids.checked = false;
    const slot = $('eventTimeSlotFilter'); if(slot) slot.value = '';
    const cost = $('eventCostFilter'); if(cost) cost.value = '';
    const book = $('eventBookingFilter'); if(book) book.value = '';
    const ras = $('eventRassegnaFilter'); if(ras) ras.value = '';

    _activeRassegnaFilter = '';
    _activeComuneFilter = '';
    const badge = $('activeComuneBadge');
    if (badge) badge.classList.add('hidden');

    const chips = document.querySelectorAll('#rassegnaQuickChips .rassegna-chip');
    chips.forEach(btn => btn.classList.remove('active'));

    selectMapCategory('');
    selectMapZone('');
    setTimePreset('30d');
  };

  /* ══════════════════════════════
     SERVICES
  ══════════════════════════════ */
  function renderServices() {
    const grid = $('servicesGrid');
    if (!grid) return;
    const typeF = $('serviceTypeFilter')?.value || '';
    const locF = $('serviceLocationFilter')?.value || '';

    const filtered = getServices().filter(s => {
      if (typeF && s.type !== typeF) return false;
      if (locF && s.area !== locF) return false;
      return true;
    });

    const countEl = $('servicesResultsCount');
    if (countEl) countEl.textContent = `${filtered.length} serviz${filtered.length!==1?'i':'io'}`;

    const sorted = [...filtered].sort((a,b) => (b.isSponsored?1:0) - (a.isSponsored?1:0));

    grid.innerHTML = sorted.length ? sorted.map(s => serviceCardHTML(s)).join('') : `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">
        <i class="fas fa-store-slash" style="font-size:2rem;margin-bottom:0.75rem;display:block;"></i>
        Nessun servizio disponibile per i filtri selezionati.
      </div>`;
  }

  function serviceCardHTML(srv) {
    const typeLabel = { venue:'Location/Saletta', entertainment:'Animazione', catering:'Catering', organizer:'Organizzatore' };
    return `<div class="service-card ${srv.isSponsored?'sponsored-gold':''}">
      <div class="card-img-wrapper">
        ${srv.isSponsored ? `<div class="badge-sponsored"><i class="fas fa-star"></i> In Evidenza</div>` : ''}
        <div class="badge-category">${typeLabel[srv.type]||srv.type}</div>
        <img src="${srv.image||''}" alt="${srv.name}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="card-body">
        <div class="event-meta">
          <span class="meta-item"><i class="fas fa-map-pin"></i> ${srv.location} (${areaLabel(srv.area)})</span>
        </div>
        <h3 class="card-title">${srv.name}</h3>
        <p class="card-description">${srv.description}</p>
        <div class="card-footer">
          <span class="price-tag">${srv.priceRange || ''}</span>
          <span style="font-size:0.75rem;color:var(--text-secondary);"><i class="fas fa-phone" style="margin-right:2px;"></i>${srv.contacts?.split('|')[0].trim()||''}</span>
        </div>
      </div>
    </div>`;
  }

  /* ══════════════════════════════
     SIDEBAR ADS
  ══════════════════════════════ */
  function renderSidebarAds() {
    const container = $('sidebarAdsContainer');
    if (!container) return;
    const ads = getAds();
    container.innerHTML = ads.map(ad => `
      <div class="sidebar-widget ad-widget" onclick="window.open('${ad.link}','_blank')">
        <img class="ad-bg" src="${ad.image}" alt="${ad.title}" onerror="this.style.display='none'">
        <div class="ad-overlay"></div>
        <div class="ad-content">
          <div class="ad-badge">Sponsorizzato</div>
          <div class="ad-title">${ad.title}</div>
          <div class="ad-desc">${ad.description}</div>
        </div>
      </div>`).join('');
  }

  /* ══════════════════════════════
     AUTH
  ══════════════════════════════ */
  function renderAdminView() {
    const loginBox = $('adminLoginBox');
    const dashboard = $('adminDashboardContent');

    if (_authUser) {
      loginBox.classList.add('hidden');
      dashboard.classList.remove('hidden');
      const el = $('adminLoggedUser');
      if (el) el.textContent = `${_authUser.username} (${_authUser.role})`;
      renderAdminDashboard();
    } else {
      loginBox.classList.remove('hidden');
      dashboard.classList.add('hidden');
    }
  }

  function handleLogin() {
    const username = $('loginUsername')?.value.trim();
    const password = $('loginPassword')?.value;
    const users = getUsers();
    const match = users.find(u => u.username === username && u.password === password);
    const errEl = $('loginError');

    if (match) {
      _authUser = match;
      if (errEl) errEl.classList.remove('show');
      renderAdminView();
    } else {
      if (errEl) { errEl.classList.add('show'); setTimeout(()=>errEl.classList.remove('show'), 3000); }
    }
  }

  function handleLogout() {
    _authUser = null;
    if ($('loginPassword')) $('loginPassword').value = '';
    renderAdminView();
  }

  /* ══════════════════════════════
     ADMIN DASHBOARD
  ══════════════════════════════ */
  function renderAdminDashboard() {
    renderPendingBadge();
    renderActiveAdminPanel();
  }

  function renderPendingBadge() {
    const pending = getEvents().filter(e => e.status === 'pending');
    const badge = $('pendingBadge');
    if (badge) badge.textContent = pending.length > 0 ? pending.length : '';
  }

  function renderActiveAdminPanel() {
    const activePanel = document.querySelector('.admin-panel.active');
    const panelId = activePanel?.id;
    if (panelId === 'panelModeration') renderModerationPanel();
    if (panelId === 'panelScraper') renderScraperPanel();
    if (panelId === 'panelUsers') renderUsersPanel();
    if (panelId === 'panelSponsors') renderSponsorsPanel();
    if (panelId === 'panelComuni') renderComuniPanel();
  }

  function renderComuniPanel() {
    const tbody = $('adminComuniTableBody');
    if (!tbody) return;
    
    const list = getComuni().sort((a,b) => a.name.localeCompare(b.name));
    tbody.innerHTML = list.map(c => `
      <tr>
        <td style="font-weight:700; color:var(--text-primary);">${c.name}</td>
        <td style="color:var(--text-secondary);font-family:monospace;font-size:0.75rem;">${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}</td>
        <td>
          <select onchange="App.updateComuneArea('${c.name}', this.value)" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; background: var(--bg-tertiary); border: 1px solid var(--glass-border); color: var(--text-primary); border-radius: var(--radius-sm); font-family: inherit;">
            <option value="alta" ${c.area === 'alta' ? 'selected' : ''}>Alta Valle</option>
            <option value="media" ${c.area === 'media' ? 'selected' : ''}>Media Valle</option>
            <option value="bassa" ${c.area === 'bassa' ? 'selected' : ''}>Bassa Valle</option>
            <option value="aosta" ${c.area === 'aosta' ? 'selected' : ''}>Aosta Città</option>
          </select>
        </td>
      </tr>
    `).join('');
  }

  function updateComuneArea(name, newArea) {
    const comuni = getComuni();
    const idx = comuni.findIndex(c => c.name === name);
    if (idx !== -1) {
      comuni[idx].area = newArea;
      saveComuni(comuni);
      renderComuniPanel();
      renderEvents();
    }
  }

  function handleAddComune(e) {
    e.preventDefault();
    const name = $('comuneAddName').value.trim();
    const lat = parseFloat($('comuneAddLat').value);
    const lng = parseFloat($('comuneAddLng').value);
    const area = $('comuneAddArea').value;
    
    if (!name || isNaN(lat) || isNaN(lng)) {
      alert('Valori del Comune non validi.');
      return;
    }
    
    const comuni = getComuni();
    if (comuni.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert(`Il comune "${name}" esiste già.`);
      return;
    }
    
    comuni.push({ name, area, lat, lng });
    saveComuni(comuni);
    e.target.reset();
    renderComuniPanel();
    alert(`✅ Comune "${name}" aggiunto con successo!`);
  }

  /* ─── MODERATION ─── */
  function renderModerationPanel() {
    const container = $('moderationTableContainer');
    if (!container) return;
    const events = getEvents();
    const pending = events.filter(e => e.status === 'pending');
    const approved = events.filter(e => e.status === 'approved');

    if (pending.length === 0 && approved.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);font-style:italic;">Nessun evento presente.</p>`;
      return;
    }

    const sections = [
      { label:'In Attesa di Approvazione', items: pending, emptyMsg:'Nessun evento in attesa.' },
      { label:'Approvati e Pubblicati', items: approved, emptyMsg:'Nessun evento approvato.' }
    ];

    container.innerHTML = sections.map(sec => `
      <div style="margin-bottom:1.5rem;">
        <h4 style="font-size:0.875rem;font-weight:700;margin-bottom:0.75rem;color:${sec.label.includes('Attesa')?'#f59e0b':'#10b981'};">
          ${sec.label} (${sec.items.length})
        </h4>
        ${sec.items.length === 0 ? `<p style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">${sec.emptyMsg}</p>` : `
        <div style="overflow-x:auto;">
        <table class="moderation-table">
          <thead><tr>
            <th>Img</th><th>Titolo</th><th>Data</th><th>Luogo</th><th>Area</th><th>Fonte</th><th>Azioni</th>
          </tr></thead>
          <tbody>
            ${sec.items.map(evt => `<tr>
              <td><img src="${evt.image||''}" alt="${evt.title}" onerror="this.style.display='none'"></td>
              <td style="font-weight:600;max-width:200px;"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${evt.title}</div>
                ${evt.suitableForChildren?`<span class="badge-kids-card">👶</span>`:''}
              </td>
              <td>${formatDate(evt.date)}</td>
              <td>${evt.location}</td>
              <td>${areaLabel(evt.area)}</td>
              <td style="font-size:0.7rem;color:var(--text-muted);">${evt.source?.name?.substring(0,18)||'—'}…</td>
              <td>
                <div style="display:flex;gap:0.3rem;flex-wrap:wrap;">
                  ${evt.status==='pending'?`<button class="btn-mini btn-mini-approve" onclick="App.approveEvent('${evt.id}')"><i class="fas fa-check"></i> Approva</button>`:''}
                  <button class="btn-mini btn-mini-edit" onclick="App.openEditEvent('${evt.id}')"><i class="fas fa-edit"></i> Modifica</button>
                  <button class="btn-mini btn-mini-delete" onclick="App.deleteEvent('${evt.id}')"><i class="fas fa-trash"></i></button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
        </div>`}
      </div>`).join('');
  }

  /* ─── SCRAPER PANEL ─── */
  function renderScraperPanel() {
    renderSourcesList();
  }

  function renderSourcesList() {
    const container = $('adminSourcesList');
    if (!container) return;
    const sources = getSources();
    container.innerHTML = sources.map(s => `
      <div class="source-item">
        <div class="source-details">
          <h4>
            ${sourceTypeIcon(s.type)}
            ${s.name}
            <span class="status-dot ${s.status==='active'?'active':'error'}"></span>
          </h4>
          <p>${s.url}</p>
          <p style="font-size:0.65rem;margin-top:0.2rem;">Ultima verifica: ${s.lastCheck ? new Date(s.lastCheck).toLocaleString('it-IT') : 'Mai'}</p>
        </div>
        <div class="source-actions">
          <button class="btn-mini btn-mini-verify" onclick="App.verifySource('${s.id}')"><i class="fas fa-sync"></i></button>
          <button class="btn-mini btn-mini-delete" onclick="App.deleteSource('${s.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>`).join('') || `<p style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">Nessuna fonte configurata.</p>`;
  }

  /* ─── USERS PANEL ─── */
  function renderUsersPanel() {
    const container = $('usersTableContainer');
    if (!container) return;
    const users = getUsers();
    container.innerHTML = `
      <table class="users-table">
        <thead><tr>
          <th>Username</th><th>Ruolo</th><th>Email</th><th>Creato</th><th>Azioni</th>
        </tr></thead>
        <tbody>
          ${users.map(u => `<tr>
            <td style="font-weight:600;">${u.username}</td>
            <td><span class="role-badge role-${u.role}">${u.role}</span></td>
            <td style="font-size:0.78rem;color:var(--text-secondary);">${u.email||'—'}</td>
            <td style="font-size:0.75rem;color:var(--text-muted);">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('it-IT') : '—'}</td>
            <td>
              ${u.username !== 'admin1' ? `<button class="btn-mini btn-mini-delete" onclick="App.deleteUser('${u.id}')"><i class="fas fa-trash"></i> Elimina</button>` : `<span style="font-size:0.7rem;color:var(--text-muted);">Protetto</span>`}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }

  /* ══════════════════════════════
     ADMIN ACTIONS
  ══════════════════════════════ */
  function approveEvent(id) {
    const events = getEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) { events[idx].status = 'approved'; saveEvents(events); }
    renderModerationPanel();
    renderPendingBadge();
    renderMapMarkers(getEvents().filter(e=>e.status==='approved'));
  }

  function deleteEvent(id) {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return;
    const events = getEvents().filter(e => e.id !== id);
    saveEvents(events);
    renderModerationPanel();
    renderPendingBadge();
  }

  function deleteSource(id) {
    if (!confirm('Eliminare questa fonte?')) return;
    const src = getSources().filter(s => s.id !== id);
    saveSources(src);
    renderSourcesList();
  }

  async function verifySource(id) {
    const sources = getSources();
    const idx = sources.findIndex(s => s.id === id);
    if (idx === -1) return;
    const src = sources[idx];
    const term = $('crawlerTerminal');

    if (term) {
      window.ScraperSimulator?.log(term, `[${new Date().toLocaleTimeString()}] 🔄 Scansione diretta fonte: ${src.name} (${src.url})...`, 'info');
    }

    const result = await window.ScraperSimulator?.startRealCrawling([src], term, { singleSource: true, autoDiscover: false });
    sources[idx].lastCheck = new Date().toISOString();
    sources[idx].status = 'active';
    saveSources(sources);
    renderSourcesList();

    if (result && Array.isArray(result.events)) {
      const autoApprove = $('scraperAutoApprove') ? $('scraperAutoApprove').checked : true;
      const { added, updated } = mergeScrapedEvents(result.events, autoApprove);
      if (term) {
        window.ScraperSimulator?.log(
          term,
          `[${new Date().toLocaleTimeString()}] ✅ Fonte "${src.name}" sincronizzata: ${result.events.length} eventi trovati (${added} nuovi, ${updated} aggiornati).`,
          'success'
        );
      }
      renderPendingBadge();
      renderModerationPanel();
      renderEvents();
    }
  }

  function approveAllPending() {
    const events = getEvents();
    let count = 0;
    events.forEach(e => {
      if (e.status === 'pending') {
        e.status = 'approved';
        count++;
      }
    });
    if (count > 0) {
      saveEvents(events);
      renderPendingBadge();
      renderModerationPanel();
      renderEvents();
    }
  }

  function deleteUser(id) {
    if (!confirm('Eliminare questo utente?')) return;
    const users = getUsers().filter(u => u.id !== id);
    saveUsers(users);
    renderUsersPanel();
  }

  function populateComuniDropdown(selectId, selectedVal) {
    const select = $(selectId);
    if (!select) return;
    const list = getComuni().sort((a,b) => a.name.localeCompare(b.name));
    select.innerHTML = list.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    if (selectedVal) select.value = selectedVal;
  }

  function handleComuneChange(comuneSelectId, areaSelectId) {
    const comuneSelect = $(comuneSelectId);
    const areaSelect = $(areaSelectId);
    if (!comuneSelect || !areaSelect) return;
    
    comuneSelect.addEventListener('change', () => {
      const comuni = getComuni();
      const c = comuni.find(item => item.name === comuneSelect.value);
      if (c) {
        areaSelect.value = c.area;
      }
    });
  }

  /* EDIT EVENT MODAL */
  function openEditEvent(id) {
    const events = getEvents();
    const evt = events.find(e => e.id === id);
    if (!evt) return;
    _editingEventId = id;

    $('editEvtId').value = evt.id;
    $('editEvtTitle').value = evt.title;
    $('editEvtDate').value = evt.date;
    $('editEvtEndDate').value = evt.endDate || '';
    
    populateComuniDropdown('editEvtLocation', evt.location);
    $('editEvtArea').value = evt.area;
    
    $('editEvtCategory').value = evt.category;
    $('editEvtPrice').value = evt.price || '';
    $('editEvtTime').value = evt.eventTime || 'Tutto il giorno';
    $('editEvtDesc').value = evt.description;
    $('editEvtImage').value = evt.image || '';
    $('editEvtKids').checked = evt.suitableForChildren || false;
    $('editEvtImportance').value = evt.importanceScore || 5;
    $('editEvtSponsorTier').value = evt.sponsorTier || 'standard';

    initImagePreview('editEvtImage', 'editEvtImagePreview');

    openModal('editEventModal');
  }

  function saveEditEvent(approve) {
    const events = getEvents();
    const idx = events.findIndex(e => e.id === _editingEventId);
    if (idx === -1) return;

    const comuneName = $('editEvtLocation').value;
    const comuni = getComuni();
    const c = comuni.find(item => item.name === comuneName);

    events[idx].title = $('editEvtTitle').value.trim();
    events[idx].date = $('editEvtDate').value;
    events[idx].endDate = $('editEvtEndDate').value || events[idx].date;
    events[idx].location = comuneName;
    events[idx].area = $('editEvtArea').value;
    events[idx].category = $('editEvtCategory').value;
    events[idx].price = $('editEvtPrice').value.trim();
    events[idx].eventTime = $('editEvtTime').value.trim() || 'Tutto il giorno';
    events[idx].description = $('editEvtDesc').value.trim();
    events[idx].image = $('editEvtImage').value.trim();
    events[idx].suitableForChildren = $('editEvtKids').checked;
    events[idx].importanceScore = parseInt($('editEvtImportance').value) || 5;
    
    if (c) {
      events[idx].lat = c.lat;
      events[idx].lng = c.lng;
    }

    const tier = $('editEvtSponsorTier').value;
    events[idx].sponsorTier = tier;
    events[idx].isSponsored = tier !== 'standard';
    
    if (approve) events[idx].status = 'approved';

    saveEvents(events);
    closeModal('editEventModal');
    renderModerationPanel();
    renderPendingBadge();
    if (_currentView === 'eventi') renderEvents();
  }

  function openAddEvent() {
    $('addEventForm').reset();
    $('addEvtImportance').value = "5";
    $('addEvtSponsorTier').value = "standard";
    $('addEvtTime').value = "Tutto il giorno";
    
    populateComuniDropdown('addEvtLocation');
    // Set initial area
    const comuni = getComuni();
    const initialComune = $('addEvtLocation').value;
    const c = comuni.find(item => item.name === initialComune);
    if (c) $('addEvtArea').value = c.area;
    
    initImagePreview('addEvtImage', 'addEvtImagePreview');
    
    openModal('addEventModal');
  }

  function saveAddEvent(approve) {
    const title = $('addEvtTitle').value.trim();
    const date = $('addEvtDate').value;
    const comuneName = $('addEvtLocation').value;
    const desc = $('addEvtDesc').value.trim();

    if (!title || !date || !comuneName || !desc) {
      alert('Per favore compila tutti i campi obbligatori (*)');
      return;
    }

    const events = getEvents();
    const area = $('addEvtArea').value;
    const comuni = getComuni();
    const c = comuni.find(item => item.name === comuneName);
    
    let lat = 45.737, lng = 7.320;
    if (c) {
      lat = c.lat;
      lng = c.lng;
    }

    const tier = $('addEvtSponsorTier').value;
    const newEvt = {
      id: genId('admin-add'),
      title: title,
      description: desc,
      date: date,
      endDate: $('addEvtEndDate').value || date,
      location: comuneName,
      area: area,
      suitableForChildren: $('addEvtKids').checked,
      lat: lat,
      lng: lng,
      category: $('addEvtCategory').value,
      price: $('addEvtPrice').value.trim() || 'Info non disponibili',
      eventTime: $('addEvtTime').value.trim() || 'Tutto il giorno',
      image: $('addEvtImage').value.trim() || '',
      source: { name: 'Amministratore', url: '#', type: 'official' },
      isSponsored: tier !== 'standard',
      sponsorTier: tier,
      status: approve ? 'approved' : 'pending',
      importanceScore: parseInt($('addEvtImportance').value) || 5,
      tags: ['inserito-admin']
    };

    events.push(newEvt);
    saveEvents(events);
    closeModal('addEventModal');
    renderModerationPanel();
    renderPendingBadge();
    if (_currentView === 'eventi') renderEvents();
    alert(approve ? '✅ Evento creato e pubblicato!' : '✅ Evento creato in coda di moderazione.');
  }

  function promoteEvent(id, tier) {
    const events = getEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) {
      events[idx].sponsorTier = tier;
      events[idx].isSponsored = tier !== 'standard';
      saveEvents(events);
      renderModerationPanel();
      if (_currentView === 'eventi') renderEvents();
    }
  }

  // Expose admin functions
  Object.assign(window.App, {
    approveEvent, deleteEvent, openEditEvent, deleteSource, verifySource, deleteUser, approveAllPending
  });

  /* ══════════════════════════════
     SCRAPER & SOURCE DISCOVERY
  ══════════════════════════════ */
  function mergeScrapedEvents(scrapedList, autoApprove = true) {
    const events = getEvents();
    let added = 0;
    let updated = 0;
    const targetStatus = autoApprove ? 'approved' : 'pending';

    scrapedList.forEach(raw => {
      const normRawTitle = (raw.title || '').toLowerCase().trim();
      const existingIdx = events.findIndex(e => (e.title || '').toLowerCase().trim() === normRawTitle);
      if (existingIdx === -1) {
        events.push({
          ...raw,
          id: genId('scraped'),
          status: targetStatus
        });
        added++;
      } else {
        // Aggiorna coordinate, date, immagine, timeSlot, costType, bookingType e stato se era pending
        events[existingIdx] = {
          ...events[existingIdx],
          lat: raw.lat || events[existingIdx].lat,
          lng: raw.lng || events[existingIdx].lng,
          image: raw.image || events[existingIdx].image,
          date: raw.date || events[existingIdx].date,
          endDate: raw.endDate || events[existingIdx].endDate,
          timeSlot: raw.timeSlot || events[existingIdx].timeSlot,
          costType: raw.costType || events[existingIdx].costType,
          bookingType: raw.bookingType || events[existingIdx].bookingType,
          price: raw.price || events[existingIdx].price,
          status: autoApprove ? 'approved' : events[existingIdx].status
        };
        updated++;
      }
    });

    // Se autoApprove è attivo, approva anche eventuali eventi precedentemente in coda
    if (autoApprove) {
      events.forEach(e => {
        if (e.status === 'pending') e.status = 'approved';
      });
    }

    saveEvents(events);
    return { added, updated, total: events.length };
  }

  function mergeDiscoveredSourcesAndComuni(discoveredSources = [], discoveredComuni = []) {
    let addedSources = 0;
    if (Array.isArray(discoveredSources) && discoveredSources.length > 0) {
      const sources = getSources();
      const nowIso = new Date().toISOString();
      discoveredSources.forEach(ds => {
        const cleanUrl = (ds.url || '').replace(/\/$/, '');
        const existing = sources.find(s => (s.url || '').replace(/\/$/, '') === cleanUrl);
        if (!existing) {
          sources.push({
            id: ds.id || genId('src'),
            name: ds.name,
            url: ds.url,
            type: ds.type || 'official',
            status: 'active',
            lastCheck: nowIso
          });
          addedSources++;
        } else {
          existing.lastCheck = nowIso;
          existing.status = 'active';
        }
      });
      saveSources(sources);
    }

    if (Array.isArray(discoveredComuni) && discoveredComuni.length > 0) {
      const comuni = getComuni();
      let comuniChanged = false;
      discoveredComuni.forEach(dc => {
        if (!comuni.find(c => c.name.toLowerCase() === dc.name.toLowerCase())) {
          comuni.push(dc);
          comuniChanged = true;
        }
      });
      if (comuniChanged) saveComuni(comuni);
    }

    return addedSources;
  }

  async function runSourceDiscovery() {
    const term = $('crawlerTerminal');
    const btn = $('btnDiscoverSources');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ricerca Fonti...';
    }

    const res = await window.ScraperSimulator?.discoverSources(term);
    const addedSrc = mergeDiscoveredSourcesAndComuni(res?.sources || [], res?.comuni || []);

    renderSourcesList();
    renderComuniPanel();

    if (term) {
      window.ScraperSimulator?.log(
        term,
        `[${new Date().toLocaleTimeString()}] ✅ Auto-Discovery completato: ${res?.sources?.length || 0} fonti regionali VdA verificate (${addedSrc} nuove aggiunte).`,
        'success'
      );
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-satellite-dish"></i> Scopri Fonti VdA';
    }
  }

  async function runScraper() {
    const term = $('crawlerTerminal');
    const bar = $('crawlerProgressBar');
    const btn = $('btnRunScraper');
    if (!term || !bar || !btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scraping in corso...';
    bar.style.width = '15%';

    let pct = 15;
    const interval = setInterval(() => {
      pct = Math.min(90, pct + Math.random() * 15);
      bar.style.width = `${pct}%`;
    }, 200);

    try {
      const currentSources = getSources();
      const result = await window.ScraperSimulator?.startRealCrawling(currentSources, term, { autoDiscover: true });

      clearInterval(interval);
      bar.style.width = '100%';

      const addedSources = mergeDiscoveredSourcesAndComuni(result?.discoveredSources || [], result?.comuni || []);
      const nowIso = new Date().toISOString();
      const updatedSources = getSources().map(s => ({ ...s, lastCheck: nowIso, status: 'active' }));
      saveSources(updatedSources);

      const autoApprove = $('scraperAutoApprove') ? $('scraperAutoApprove').checked : true;
      const scrapedEvents = result?.events || [];
      const { added, updated } = mergeScrapedEvents(scrapedEvents, autoApprove);

      const statusMsg = autoApprove
        ? 'pubblicati subito su Mappa e Catalogo'
        : 'inviati in coda di Moderazione';

      window.ScraperSimulator?.log(
        term,
        `[${new Date().toLocaleTimeString()}] ✅ Scraping completato! ${scrapedEvents.length} eventi VdA catturati (${added} nuovi, ${updated} aggiornati — ${statusMsg}). ${addedSources > 0 ? `${addedSources} nuove fonti aggiunte.` : ''}`,
        'success'
      );

      renderSourcesList();
      renderComuniPanel();
      renderPendingBadge();
      renderModerationPanel();
      renderEvents();
    } catch (err) {
      clearInterval(interval);
      window.ScraperSimulator?.log(term, `[${new Date().toLocaleTimeString()}] ❌ Errore durante lo scraping: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-bolt"></i> Avvia Scraper Ora';
    }
  }

  async function autoSyncRealEventsOnBoot() {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: getSources(), autoDiscover: true })
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data && Array.isArray(data.events) && data.events.length > 0) {
        mergeDiscoveredSourcesAndComuni(data.discoveredSources || [], data.comuni || []);
        mergeScrapedEvents(data.events, true);
        renderEvents();
        renderPendingBadge();
        if (_currentView === 'admin') {
          renderSourcesList();
          renderModerationPanel();
          renderComuniPanel();
        }
      }
    } catch (e) {}
  }

  /* ══════════════════════════════
     SPONSOR FORMS
  ══════════════════════════════ */
  function handleSponsorEventSubmit(e) {
    e.preventDefault();
    _pendingSponsorMode = 'event';
    const tier = $('evtSponsorTier').value;
    $('checkoutAmountText').textContent = tier === 'gold' ? 'Totale: €49 — Piano Gold' : 'Totale: €19 — Piano Silver';
    closeModal('sponsorEventModal');
    openModal('checkoutPaymentModal');
  }

  function handleSponsorServiceSubmit(e) {
    e.preventDefault();
    _pendingSponsorMode = 'service';
    const isSponsored = $('srvSponsorOpt').checked;
    $('checkoutAmountText').textContent = isSponsored ? 'Totale: €50/mese — In Evidenza' : 'Totale: €0 — Inserzione Base (Gratuita)';
    closeModal('sponsorServiceModal');
    openModal('checkoutPaymentModal');
  }

  function handlePaymentSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalHtml = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Elaborazione pagamento in corso...';
    
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check"></i> Pagamento autorizzato! Salvataggio...';
      
      setTimeout(() => {
        const payments = getPayments();
        const last4 = $('cardNumber').value.replace(/\s/g,'').slice(-4) || '4242';
        const isVisa = $('cardNumber').value.replace(/\s/g,'').startsWith('4');
        const cardBrand = isVisa ? 'Visa' : 'MasterCard';
        
        let itemName = '';
        let amount = 0;
        
        if (_pendingSponsorMode === 'event') {
          const events = getEvents();
          const tier = $('evtSponsorTier').value;
          amount = tier === 'gold' ? 49 : 19;
          itemName = `Sponsorizzazione ${tier.toUpperCase()}: ${$('evtSponsorTitle').value.trim()}`;
          const comuneName = $('evtSponsorTown').value.trim();
          const comuni = getComuni();
          const c = comuni.find(item => item.name.toLowerCase() === comuneName.toLowerCase());
          let lat = 45.737, lng = 7.320;
          if (c) {
            lat = c.lat;
            lng = c.lng;
          }

          const newEvt = {
            id: genId('sponsored'),
            title: $('evtSponsorTitle').value.trim(),
            description: $('evtSponsorDesc').value.trim(),
            date: $('evtSponsorDate').value,
            endDate: $('evtSponsorDate').value,
            location: comuneName,
            area: $('evtSponsorArea').value,
            suitableForChildren: $('evtSponsorKids').checked,
            lat: lat,
            lng: lng,
            category: $('evtSponsorCategory').value,
            price: $('evtSponsorPrice').value.trim() || 'Info non disponibili',
            eventTime: 'Tutto il giorno',
            image: $('evtSponsorImage').value.trim() || '',
            source: { name: 'Evento Sponsorizzato Privato', url: '#', type: 'other' },
            isSponsored: true,
            sponsorTier: tier,
            status: 'approved',
            importanceScore: tier === 'gold' ? 8 : 6,
            tags: ['sponsorizzato']
          };
          events.push(newEvt);
          saveEvents(events);
        } else if (_pendingSponsorMode === 'service') {
          const srvs = getServices();
          const isSponsored = $('srvSponsorOpt').checked;
          amount = isSponsored ? 50 : 0;
          itemName = `Inserimento Servizio ${isSponsored ? 'Consigliato' : 'Base'}: ${$('srvSponsorName').value.trim()}`;
          
          srvs.push({
            id: genId('srv-sp'),
            name: $('srvSponsorName').value.trim(),
            type: $('srvSponsorType').value,
            location: $('srvSponsorTown').value.trim(),
            area: $('srvSponsorArea').value,
            description: $('srvSponsorDesc').value.trim(),
            priceRange: $('srvSponsorPrice').value.trim(),
            contacts: $('srvSponsorContacts').value.trim(),
            image: $('srvSponsorImage').value.trim() || '',
            isSponsored: isSponsored
          });
          saveServices(srvs);
        }

        if (amount > 0) {
          payments.push({
            id: genId('pay'),
            itemName,
            amount,
            date: new Date().toISOString(),
            status: "completato",
            cardBrand,
            last4
          });
          savePayments(payments);
        }

        btn.disabled = false;
        btn.innerHTML = originalHtml;
        closeModal('checkoutPaymentModal');
        alert('✅ Inserzione pubblicata con successo! Grazie per aver scelto VdA Events Hub.');
        _pendingSponsorMode = null;
        if (_currentView === 'eventi') renderEvents();
        if (_currentView === 'servizi') renderServices();
      }, 1200);
    }, 1800);
  }

  /* ══════════════════════════════
     PAYMENT CARD LIVE PREVIEW
  ══════════════════════════════ */
  function initCardPreview() {
    const cn = $('cardNumber');
    const nm = $('cardName');
    const ex = $('cardExpiry');
    const cv = $('cardCvv');

    if (cn) cn.addEventListener('input', () => {
      let v = cn.value.replace(/\D/g,'').substring(0,16);
      cn.value = v.replace(/(.{4})/g,'$1 ').trim();
      $('cardDisplayNumber').textContent = (v+'x'.repeat(16-v.length)).replace(/(.{4})/g,'$1 ').trim().replace(/x/g,'•');
    });
    if (nm) nm.addEventListener('input', () => {
      $('cardDisplayName').textContent = nm.value.toUpperCase() || 'NOME INTESTATARIO';
    });
    if (ex) ex.addEventListener('input', () => {
      let v = ex.value.replace(/\D/g,'');
      if (v.length > 2) v = v.slice(0,2)+'/'+v.slice(2,4);
      ex.value = v;
      $('cardDisplayExpiry').textContent = ex.value || 'MM/AA';
    });
    if (cv) {
      cv.addEventListener('focus', () => document.querySelector('.credit-card')?.classList.add('flipped'));
      cv.addEventListener('blur', () => document.querySelector('.credit-card')?.classList.remove('flipped'));
      cv.addEventListener('input', () => { $('cardDisplayCvv').textContent = cv.value || '•••'; });
    }
  }

  /* ══════════════════════════════
     WYSIWYG & PHOTO PREVIEW HELPERS
  ══════════════════════════════ */
  function initImagePreview(inputId, previewId) {
    const input = $(inputId);
    const preview = $(previewId);
    if (!input || !preview) return;
    
    function updatePreview() {
      const url = input.value.trim();
      if (url) {
        preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.outerHTML='<span style=\'font-size:0.6rem;color:#ef4444;\'>Non valida</span>'">`;
      } else {
        preview.innerHTML = `<span style="font-size:0.6rem;color:var(--text-muted);">Nessuna</span>`;
      }
    }
    
    input.addEventListener('input', updatePreview);
    updatePreview();
  }

  function initImageUpload(fileInputId, urlInputId, previewId) {
    const fileInput = $(fileInputId);
    const urlInput = $(urlInputId);
    const preview = $(previewId);
    
    if (!fileInput || !urlInput || !preview) return;
    
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        urlInput.value = evt.target.result;
        urlInput.dispatchEvent(new Event('input'));
      };
      reader.readAsDataURL(file);
    });
  }

  function insertFormatting(textareaId, tag) {
    const txt = $(textareaId);
    if (!txt) return;
    const start = txt.selectionStart;
    const end = txt.selectionEnd;
    const text = txt.value;
    const selected = text.substring(start, end);
    
    let replacement = '';
    if (tag === 'b') {
      replacement = `<strong>${selected || 'testo grassetto'}</strong>`;
    } else if (tag === 'i') {
      replacement = `<em>${selected || 'testo corsivo'}</em>`;
    } else if (tag === 'h') {
      replacement = `<h3>${selected || 'Titolo'}</h3>`;
    } else if (tag === 'highlight') {
      replacement = `<span class="wysiwyg-highlight">${selected || 'testo evidenziato'}</span>`;
    } else if (tag === 'link') {
      const url = prompt('Inserisci l\'URL:', 'https://');
      if (!url) return;
      replacement = `<a href="${url}" target="_blank" rel="noopener">${selected || 'link'}</a>`;
    } else if (tag === 'ul') {
      replacement = `<ul>\n  <li>${selected || 'elemento 1'}</li>\n  <li>${selected || 'elemento 2'}</li>\n</ul>`;
    }
    
    txt.value = text.substring(0, start) + replacement + text.substring(end);
    txt.focus();
    txt.setSelectionRange(start + replacement.length, start + replacement.length);
    txt.dispatchEvent(new Event('input'));
  }

  /* ══════════════════════════════
     CMS DASHBOARD RENDER & ACTIONS
  ══════════════════════════════ */
  function getPayments() { try { return JSON.parse(localStorage.getItem("vda_payments")) || []; } catch(e){ return []; } }
  function savePayments(arr) { localStorage.setItem("vda_payments", JSON.stringify(arr)); }

  function renderSponsorsPanel() {
    // 1. Render Payments Table
    const tableBody = $('adminPaymentsTableBody');
    if (tableBody) {
      const payments = getPayments();
      tableBody.innerHTML = payments.map(p => `
        <tr>
          <td style="font-weight:600;">${p.itemName}</td>
          <td style="color:#10b981;font-weight:700;">€ ${p.amount}</td>
          <td>${new Date(p.date).toLocaleString('it-IT')}</td>
          <td><i class="fab fa-cc-${p.cardBrand?.toLowerCase() === 'visa' ? 'visa' : 'mastercard'}"></i> •••• ${p.last4}</td>
          <td><span class="role-badge role-editor" style="background:rgba(16,185,129,0.18);color:#10b981;font-size:0.62rem;">${p.status}</span></td>
        </tr>
      `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1rem;">Nessun pagamento registrato.</td></tr>`;
    }

    // 2. Render Sidebar Ads
    const adsContainer = $('adminAdsList');
    if (adsContainer) {
      const ads = getAds();
      adsContainer.innerHTML = ads.map(ad => `
        <div class="source-item">
          <div class="source-details">
            <h4 style="font-size:0.78rem;font-weight:600;">
              <i class="fas fa-rectangle-ad" style="color:var(--gold-sponsored);margin-right:2px;"></i> ${ad.title}
              <span class="status-dot ${ad.status==='active'?'active':'error'}" style="margin-left:4px;"></span>
            </h4>
            <p style="font-size:0.7rem;margin-top:2px;">${ad.description}</p>
            <p style="font-size:0.62rem;color:var(--text-muted);margin-top:2px;word-break:break-all;">Link: ${ad.link}</p>
          </div>
          <div class="source-actions" style="margin-left:10px;">
            <button class="btn-mini btn-mini-verify" onclick="App.toggleAdStatus('${ad.id}')" title="Sospendi/Attiva"><i class="fas fa-${ad.status==='active'?'pause':'play'}"></i></button>
            <button class="btn-mini btn-mini-delete" onclick="App.deleteAd('${ad.id}')" title="Elimina"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('') || `<p style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">Nessun annuncio sidebar configurato.</p>`;
    }
  }

  function toggleAdStatus(id) {
    const ads = getAds();
    const idx = ads.findIndex(ad => ad.id === id);
    if (idx !== -1) {
      ads[idx].status = ads[idx].status === 'active' ? 'suspended' : 'active';
      localStorage.setItem("vda_ads", JSON.stringify(ads));
      renderSponsorsPanel();
      renderSidebarAds();
    }
  }

  function deleteAd(id) {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio pubblicitario?')) return;
    let ads = getAds();
    ads = ads.filter(ad => ad.id !== id);
    localStorage.setItem("vda_ads", JSON.stringify(ads));
    renderSponsorsPanel();
    renderSidebarAds();
  }

  /* ══════════════════════════════
     MODAL HELPERS
  ══════════════════════════════ */
  function openModal(id) { $(id)?.classList.add('active'); }
  function closeModal(id) { $(id)?.classList.remove('active'); }

  function initModals() {
    $$('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.modal-overlay')?.classList.remove('active'));
    });
    $$('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
    });
  }

  /* ══════════════════════════════
     ADMIN TABS
  ══════════════════════════════ */
  function initAdminTabs() {
    $$('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.admin-tab').forEach(t => t.classList.remove('active'));
        $$('.admin-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = $(`panel${capitalize(tab.getAttribute('data-admin-panel'))}`);
        if (panel) {
          panel.classList.add('active');
          renderActiveAdminPanel();
        }
      });
    });
  }

  function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  function init() {
    initTheme();
    initMap();
    initFilters();
    initTimeSlider();
    initModals();
    initAdminTabs();
    initCardPreview();
    renderEvents();
    renderSidebarAds();

    // Comune change handlers for autocalculating areas in edit/add event modals
    handleComuneChange('editEvtLocation', 'editEvtArea');
    handleComuneChange('addEvtLocation', 'addEvtArea');

    // Photo file uploads binding
    initImageUpload('editEvtFile', 'editEvtImage', 'editEvtImagePreview');
    initImageUpload('addEvtFile', 'addEvtImage', 'addEvtImagePreview');

    // Theme toggle
    $('themeToggle')?.addEventListener('click', toggleTheme);

    // Login / logout
    $('btnLogin')?.addEventListener('click', handleLogin);
    $('loginPassword')?.addEventListener('keydown', e => { if(e.key==='Enter') handleLogin(); });
    $('btnLogout')?.addEventListener('click', handleLogout);

    // Sponsor buttons
    $('btnSponsorEvent')?.addEventListener('click', () => openModal('sponsorEventModal'));
    $('btnSponsorBusiness')?.addEventListener('click', () => openModal('sponsorServiceModal'));

    // Sponsor forms
    $('sponsorEventForm')?.addEventListener('submit', handleSponsorEventSubmit);
    $('sponsorServiceForm')?.addEventListener('submit', handleSponsorServiceSubmit);
    $('paymentForm')?.addEventListener('submit', handlePaymentSubmit);

    // Admin Add Comune form binding
    $('adminAddComuneForm')?.addEventListener('submit', handleAddComune);

    // Admin add source form
    $('adminAddSourceForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const sources = getSources();
      sources.push({
        id: genId('src'),
        name: $('srcAddName').value.trim(),
        url: $('srcAddUrl').value.trim(),
        type: $('srcAddType').value,
        status: 'active',
        lastCheck: null
      });
      saveSources(sources);
      e.target.reset();
      renderSourcesList();
    });

    // Admin Add Ad form binding
    $('adminAddAdForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const ads = getAds();
      ads.push({
        id: genId('ad'),
        title: $('adAddTitle').value.trim(),
        subtitle: '',
        description: $('adAddDesc').value.trim(),
        image: $('adAddImage').value.trim(),
        link: $('adAddLink').value.trim(),
        type: 'sidebar',
        status: 'active'
      });
      localStorage.setItem("vda_ads", JSON.stringify(ads));
      e.target.reset();
      renderSponsorsPanel();
      renderSidebarAds();
    });

    // Scraper button
    $('btnRunScraper')?.addEventListener('click', runScraper);

    // Add User form
    $('addUserForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const users = getUsers();
      const username = $('newUsername').value.trim();
      if (users.find(u => u.username === username)) {
        alert(`Username "${username}" già esistente.`);
        return;
      }
      users.push({
        id: genId('u'),
        username,
        password: $('newPassword').value,
        email: $('newEmail').value.trim(),
        role: $('newRole').value,
        createdAt: new Date().toISOString()
      });
      saveUsers(users);
      e.target.reset();
      renderUsersPanel();
    });

    // Edit event save buttons
    $('btnSaveApprove')?.addEventListener('click', () => saveEditEvent(true));
    $('btnSaveOnly')?.addEventListener('click', () => saveEditEvent(false));

    // Add event save buttons
    $('btnAddSaveApprove')?.addEventListener('click', () => saveAddEvent(true));
    $('btnAddSaveOnly')?.addEventListener('click', () => saveAddEvent(false));

    // Services filters
    ['serviceTypeFilter','serviceLocationFilter'].forEach(id => {
      $(id)?.addEventListener('change', renderServices);
    });

    // Avvio automatico della cattura eventi reali VdA in background all'apertura del portale
    autoSyncRealEventsOnBoot();
  }

  return {
    init,
    openEventDetail,
    selectMapZone,
    selectMapCategory,
    selectMapComune,
    handleMapMouseMove,
    handleMapMarkerHover,
    handleComuneMarkerClick,
    hideMapTooltip,
    zoomComuniMap,
    resetComuniMapZoom,
    switchMapMode,
    toggleRassegnaChip,
    setEventsViewMode,
    setEventsSort,
    setTimePreset,
    approveEvent,
    approveAllPending,
    deleteEvent,
    openEditEvent,
    deleteSource,
    verifySource,
    runSourceDiscovery,
    runScraper,
    deleteUser,
    openAddEvent,
    saveAddEvent,
    promoteEvent,
    insertFormatting,
    toggleAdStatus,
    deleteAd,
    updateComuneArea,
    handleAddComune
  };
})();

window.App = App;

document.addEventListener('DOMContentLoaded', App.init);
