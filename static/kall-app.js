// SPOVO unified app (desktop + mobile)
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const IS_MOBILE = document.body.classList.contains("mobile");

const _fetch = window.fetch.bind(window);
window.fetch = (url, opts = {}) => {
  opts.headers = Object.assign({}, opts.headers, { "ngrok-skip-browser-warning": "1" });
  return _fetch(url, opts);
};

const _svg = (inner, filled) =>
  `<svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="${filled ? "none" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONS = {
  search: _svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  library: _svg('<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>'),
  wave: _svg('<path d="M2 12c2-8 6-8 8 0s6 8 8 0 6-8 8 0"/>'),
  spotify: _svg('<circle cx="12" cy="12" r="10"/><path d="M7 14.5c2.5-1 6-1 9 .5"/><path d="M6.5 11c3-1.2 7.5-1 10.5.8"/><path d="M7 8c3.5-1 8 -.5 10.5 1"/>'),
  sliders: _svg('<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>'),
  user: _svg('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  logout: _svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>'),
  play: _svg('<polygon points="6 3 20 12 6 21 6 3"/>', true),
  pause: _svg('<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>', true),
  prev: _svg('<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>', true),
  next: _svg('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>', true),
  shuffle: _svg('<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>'),
  repeat: _svg('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
  repeatOne: _svg('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4" stroke-width="2"/>'),
  volume: _svg('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
  plus: _svg('<path d="M5 12h14"/><path d="M12 5v14"/>'),
  trash: _svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  list: _svg('<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/>'),
  music: _svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  radio: _svg('<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>'),
  home: _svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  chevL: _svg('<polyline points="15 18 9 12 15 6"/>'),
  chevR: _svg('<polyline points="9 18 15 12 9 6"/>'),
  sun: _svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
  moon: _svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  heart: _svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
  heartFilled: _svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>', true),
  close: _svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  download: _svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>'),
  check: _svg('<polyline points="20 6 9 17 4 12"/>'),
};
const setIcon = (el, name) => { if (el) el.innerHTML = ICONS[name] || ""; };
function applyIcons() { $$("[data-icon]").forEach((el) => setIcon(el, el.dataset.icon)); }

// ---------- theme (light / dark) ----------
const currentTheme = () => (document.documentElement.classList.contains("light") ? "light" : "dark");
function applyTheme(theme) {
  document.documentElement.className = theme;            // 'light' | 'dark'
  try { localStorage.setItem("spovo-theme", theme); } catch {}
  const b = $("#theme-toggle");
  if (b) b.innerHTML = `<span class="ic">${theme === "light" ? ICONS.moon : ICONS.sun}</span>`;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "light" ? "#f3f3f7" : "#09090b";
}
function toggleTheme() { applyTheme(currentTheme() === "light" ? "dark" : "light"); }

function paintRange(el) {
  if (!el) return;
  const min = +el.min || 0, max = +el.max || 100;
  const pct = max > min ? ((+el.value - min) / (max - min)) * 100 : 0;
  el.style.background = `linear-gradient(to right, var(--txt) 0%, var(--txt) ${pct}%, var(--range-track) ${pct}%, var(--range-track) 100%)`;
}

function fmt(sec) {
  if (sec == null || isNaN(sec)) return "0:00";
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
}
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

const audio = $("#audio");
let queue = [], curIndex = -1, curTrack = null;
let source = "all", shuffle = false, repeat = "off";
let waveActive = false, waveLoading = false, altTried = false, wavePreview = [];
let radioActive = false, radioSeed = null;
let searchListRef = null, activeView = "search", authMode = "login";

const LIB_DEFAULT = { favorites: [], playlists: [], eq: null, volume: 0.7, quality: "auto", history: [], waveStats: {} };
let lib = { ...LIB_DEFAULT };

async function loadLibrary() {
  try {
    const r = await fetch("/api/library");
    lib = Object.assign({}, LIB_DEFAULT, await r.json());
  } catch {}
  if (!lib.waveStats) lib.waveStats = {};
  if (!lib.history) lib.history = [];
  if (lib.eq) applyEqState(lib.eq);
  const vol = lib.volume != null ? +lib.volume : 0.7;
  if ($("#vol")) { $("#vol").value = vol; paintRange($("#vol")); applyVolume(vol); }
  if ($("#quality")) $("#quality").value = lib.quality || "auto";
  renderNowPlayingFav();
}
let saveTimer = null;
function saveLibrary() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch("/api/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lib) }).catch(() => {});
  }, 300);
}

const isFav = (id) => lib.favorites.some((t) => t.id === id);

function trackSnapshot(t) {
  return { id: t.id, title: t.title, artist: t.artist, duration: t.duration, thumbnail: t.thumbnail, source: t.source || source };
}

function addHistory(t) {
  if (!t?.id) return;
  lib.history = [trackSnapshot(t), ...lib.history.filter((x) => x.id !== t.id)].slice(0, 80);
  wavePreview = [];   // refresh recommendations next time the wave view opens
  saveLibrary();
  if (activeView === "library") renderHistory();
}

function bumpWaveStats(t) {
  const a = (t.artist || "").trim();
  if (!a) return;
  lib.waveStats[a] = (lib.waveStats[a] || 0) + 1;
  saveLibrary();
}

function updateBlur(thumb) {
  const bg = $("#bg-blur");
  if (!bg) return;
  if (thumb) { bg.style.backgroundImage = `url(${thumb})`; bg.classList.add("on"); }
  else { bg.classList.remove("on"); bg.style.backgroundImage = ""; }
}

function streamUrl(t) {
  const q = lib.quality || "auto";
  return `/api/stream?url=${encodeURIComponent(t.id)}&quality=${encodeURIComponent(q)}`;
}

function trackRow(t, i, ctx) {
  const row = document.createElement("div");
  row.className = "track" + (curTrack && curTrack.id === t.id ? " playing" : "");
  row.dataset.id = t.id;
  row.innerHTML = `
    <div class="t-thumb">
      <img src="${esc(t.thumbnail) || ""}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"/>
      <span class="playing-bars"><i></i><i></i><i></i><i></i></span>
    </div>
    <div class="t-main"><div class="t-title">${esc(t.title)}</div><div class="t-artist">${esc(t.artist || "")}</div></div>
    <div class="row-actions">
      ${t.source ? `<span class="src-tag ${t.source === "soundcloud" ? "sc" : "yt"}">${t.source === "soundcloud" ? "SC" : "YT"}</span>` : ""}
      <button class="icon-btn radio" title="Радио по этому треку">${ICONS.radio}</button>
      <button class="icon-btn fav ${isFav(t.id) ? "on" : ""}" title="В избранное">${isFav(t.id) ? ICONS.heartFilled : ICONS.heart}</button>
      <button class="icon-btn add" title="В плейлист">${ICONS.plus}</button>
      ${IS_MOBILE ? "" : `<span class="t-dur">${fmt(t.duration)}</span>`}
    </div>`;
  row.addEventListener("click", (e) => { if (!e.target.closest(".icon-btn")) (ctx.onPlay ? ctx.onPlay(i) : playFromList(ctx.list, i)); });
  row.querySelector(".radio").addEventListener("click", (e) => { e.stopPropagation(); startTrackRadio(t); });
  row.querySelector(".fav").addEventListener("click", (e) => { e.stopPropagation(); toggleFav(t); });
  row.querySelector(".add").addEventListener("click", (e) => { e.stopPropagation(); openAddMenu(e, t); });
  return row;
}

function renderTrackList(container, list, ctx = {}) {
  ctx.list = list;
  container.innerHTML = "";
  if (!list.length) { container.innerHTML = `<div class="empty">Пусто.</div>`; return; }
  list.forEach((t, i) => container.appendChild(trackRow(t, i, ctx)));
}

function filterTracks(list, q) {
  q = (q || "").trim().toLowerCase();
  if (!q) return list;
  return list.filter((t) => (t.title || "").toLowerCase().includes(q) || (t.artist || "").toLowerCase().includes(q));
}

async function doSearch() {
  const q = $("#search-input").value.trim();
  if (!q) return;
  if (activeView !== "search") showView("search");
  if (source === "spotify") {
    $("#results").innerHTML = `<div class="empty">Spotify подключается отдельно (нужен Premium + Client ID).</div>`;
    return;
  }
  const label = { all: "музыку", youtube: "на YouTube", soundcloud: "на SoundCloud" }[source] || "музыку";
  $("#results").innerHTML = `<div class="spinner">Ищу ${label}…</div>`;
  try {
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&src=${source}`);
    searchListRef = (await r.json()).tracks || [];
    renderTrackList($("#results"), searchListRef, { onPlay: (i) => playFromList(searchListRef, i) });
  } catch (e) {
    $("#results").innerHTML = `<div class="empty">Ошибка: ${e}</div>`;
  }
}

function toggleFav(t) {
  const i = lib.favorites.findIndex((x) => x.id === t.id);
  if (i >= 0) lib.favorites.splice(i, 1);
  else lib.favorites.unshift(trackSnapshot(t));
  wavePreview = [];
  saveLibrary();
  refreshFavUI(t.id);
}
// Update every heart for this track id live — all visible rows AND the player —
// without rebuilding the list (so nothing jumps / re-animates).
function refreshFavUI(id) {
  if (id) {
    const on = isFav(id);
    $$(".track").forEach((row) => {
      if (row.dataset.id !== id) return;
      const fav = row.querySelector(".icon-btn.fav");
      if (fav) { fav.classList.toggle("on", on); fav.innerHTML = on ? ICONS.heartFilled : ICONS.heart; }
    });
  }
  // library shows the favourites list itself, so it must re-render to add/remove the row
  if (activeView === "library") renderLibrary();
  renderNowPlayingFav();
}

function newPlaylist() {
  const name = prompt("Название плейлиста:");
  if (!name) return;
  lib.playlists.push({ id: "pl_" + Date.now(), name: name.trim(), tracks: [] });
  saveLibrary(); renderLibrary();
}
function deletePlaylist(id) {
  if (!confirm("Удалить плейлист?")) return;
  lib.playlists = lib.playlists.filter((p) => p.id !== id);
  saveLibrary(); $("#playlist-detail").style.display = "none"; renderLibrary();
}
function addToPlaylist(plId, t) {
  const pl = lib.playlists.find((p) => p.id === plId);
  if (!pl || pl.tracks.some((x) => x.id === t.id)) return;
  pl.tracks.push(trackSnapshot(t));
  saveLibrary();
}
function removeFromPlaylist(plId, id) {
  const pl = lib.playlists.find((p) => p.id === plId);
  if (!pl) return;
  pl.tracks = pl.tracks.filter((x) => x.id !== id);
  saveLibrary(); openPlaylist(plId);
}

function openAddMenu(e, t) {
  const m = $("#ctx-menu");
  let html = `<div class="ctx-item" data-act="fav">${isFav(t.id) ? "Убрать из избранного" : "В избранное"}</div>`;
  html += `<div class="ctx-item" data-act="radio">Радио по треку</div>`;
  if (window.SpovoNative) {
    const dl = dlSet.has(t.id), prog = (t.id in dlProg);
    html += `<div class="ctx-item" data-act="${dl ? "undl" : "dl"}">${dl ? "Удалить загрузку" : prog ? `Скачивается ${dlProg[t.id]}%` : "Скачать офлайн"}</div>`;
  }
  html += `<div class="ctx-sep"></div>`;
  html += `<div class="ctx-title">В плейлист</div>`;
  if (!lib.playlists.length) html += `<div class="ctx-title">нет плейлистов</div>`;
  lib.playlists.forEach((p) => { html += `<div class="ctx-item" data-pl="${p.id}">${esc(p.name)}</div>`; });
  html += `<div class="ctx-sep"></div><div class="ctx-item" data-act="new">+ Новый плейлист…</div>`;
  m.innerHTML = html; m.style.display = "block";
  const rect = e.target.getBoundingClientRect();
  m.style.left = Math.min(Math.max(8, rect.left - 120), window.innerWidth - 220) + "px";
  m.style.top = Math.min(rect.bottom + 4, window.innerHeight - 300) + "px";
  m.querySelectorAll(".ctx-item").forEach((it) => {
    it.addEventListener("click", () => {
      if (it.dataset.pl) addToPlaylist(it.dataset.pl, t);
      else if (it.dataset.act === "fav") toggleFav(t);
      else if (it.dataset.act === "radio") startTrackRadio(t);
      else if (it.dataset.act === "dl") startDownload(t);
      else if (it.dataset.act === "undl") removeDownload(t.id);
      else if (it.dataset.act === "new") {
        const name = prompt("Название:");
        if (name) { const id = "pl_" + Date.now(); lib.playlists.push({ id, name: name.trim(), tracks: [] }); addToPlaylist(id, t); saveLibrary(); }
      }
      m.style.display = "none";
    });
  });
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#ctx-menu") && !e.target.closest(".add")) $("#ctx-menu").style.display = "none";
});

const VIEWS = ["home", "search", "wave", "radio", "library", "downloads", "spotify"];
const VIEW_TITLES = { home: "Главное", search: "Поиск", wave: "Волна", radio: "Радио", library: "Моя музыка", downloads: "Загрузки", spotify: "Spotify" };
function showView(v) {
  activeView = v;
  VIEWS.forEach((x) => { const el = $("#view-" + x); if (el) el.style.display = x === v ? "block" : "none"; });
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
  const title = $("#view-title"); if (title) title.textContent = VIEW_TITLES[v] || "";
  if (v === "search") setTimeout(() => $("#search-input")?.focus(), 50);
  if (v === "home") renderHome();
  if (v === "library") renderLibrary();
  if (v === "downloads") renderDownloads();
  if (v === "wave") renderWaveView();
  if (v === "radio") renderRadioView();
}

// ---------- Home (auto-updating blocks) ----------
let homeData = null;
async function renderHome() {
  const box = $("#home-blocks");
  if (!box) return;
  if (!homeData) {
    box.innerHTML = `<div class="spinner">Загружаем…</div>`;
    try { homeData = (await (await fetch("/api/home")).json()).blocks || []; } catch { homeData = []; }
  }
  if (!homeData.length) { box.innerHTML = `<div class="empty">Не удалось загрузить. Обнови позже.</div>`; return; }
  box.innerHTML = "";
  homeData.forEach((blk) => {
    const sec = document.createElement("div");
    sec.className = "home-row";
    sec.innerHTML = `
      <div class="home-row-head">
        <h3 class="home-row-title">${esc(blk.title)}</h3>
        <div class="home-arrows">
          <button class="home-arrow" data-dir="-1" aria-label="Назад">${ICONS.chevL}</button>
          <button class="home-arrow" data-dir="1" aria-label="Вперёд">${ICONS.chevR}</button>
        </div>
      </div>
      <div class="home-cards"></div>`;
    const cards = sec.querySelector(".home-cards");
    blk.tracks.forEach((t, i) => {
      const c = document.createElement("div");
      c.className = "home-card";
      c.innerHTML = `<div class="home-card-art">
          <img src="${esc(t.thumbnail) || ""}" loading="lazy" onerror="this.style.visibility='hidden'"/>
          <span class="home-card-play">${ICONS.play}</span></div>
        <div class="home-card-title">${esc(t.title)}</div>
        <div class="home-card-artist">${esc(t.artist || "")}</div>`;
      c.addEventListener("click", () => playFromList(blk.tracks, i));
      cards.appendChild(c);
    });
    // arrow scrolling
    const updateArrows = () => {
      const atStart = cards.scrollLeft <= 4;
      const atEnd = cards.scrollLeft + cards.clientWidth >= cards.scrollWidth - 4;
      sec.querySelector('.home-arrow[data-dir="-1"]').classList.toggle("disabled", atStart);
      sec.querySelector('.home-arrow[data-dir="1"]').classList.toggle("disabled", atEnd);
    };
    sec.querySelectorAll(".home-arrow").forEach((btn) =>
      btn.addEventListener("click", () => {
        cards.scrollBy({ left: (+btn.dataset.dir) * cards.clientWidth * 0.85, behavior: "smooth" });
      })
    );
    cards.addEventListener("scroll", updateArrows, { passive: true });
    box.appendChild(sec);
    requestAnimationFrame(updateArrows);
  });
}

function renderHistory() {
  const box = $("#history");
  if (!box) return;
  renderTrackList(box, lib.history, {});
}

function renderLibrary() {
  const q = ($("#lib-filter")?.value || "").trim();
  renderTrackList($("#favorites"), filterTracks(lib.favorites, q), {});
  $("#fav-count").textContent = lib.favorites.length ? `${lib.favorites.length} трек(ов)` : "";
  renderHistory();
  const grid = $("#playlists");
  grid.innerHTML = "";
  const pls = lib.playlists.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  if (!pls.length) grid.innerHTML = `<div class="empty">${q ? "Ничего не найдено." : "Пока нет плейлистов."}</div>`;
  pls.forEach((p) => {
    const c = document.createElement("div");
    c.className = "pl-card";
    c.innerHTML = `<div class="pl-ico">${ICONS.music}</div><div class="pl-name">${esc(p.name)}</div><div class="pl-sub">${p.tracks.length} трек(ов)</div>`;
    c.addEventListener("click", () => openPlaylist(p.id));
    grid.appendChild(c);
  });
  $("#playlist-detail").style.display = "none";
}

function openPlaylist(id) {
  const p = lib.playlists.find((x) => x.id === id);
  if (!p) return;
  const d = $("#playlist-detail");
  d.style.display = "block";
  d.innerHTML = `<button class="back-link" id="pl-back">← Назад</button>
    <div class="lib-head"><h2>${esc(p.name)}</h2><span class="muted-sm">${p.tracks.length} трек(ов)</span>
    <button class="mini-btn accent" id="pl-play">Слушать</button><button class="mini-btn" id="pl-del">Удалить</button></div>
    <div id="pl-tracks" class="track-list"></div>`;
  const ctx = { list: p.tracks };
  const cont = d.querySelector("#pl-tracks");
  if (!p.tracks.length) cont.innerHTML = `<div class="empty">Плейлист пуст.</div>`;
  p.tracks.forEach((t, i) => {
    const row = trackRow(t, i, ctx);
    const add = row.querySelector(".add");
    add.innerHTML = ICONS.trash; add.title = "Убрать";
    add.replaceWith(add.cloneNode(true));
    row.querySelector(".add").addEventListener("click", (e) => { e.stopPropagation(); removeFromPlaylist(id, t.id); });
    cont.appendChild(row);
  });
  d.querySelector("#pl-back").onclick = () => { d.style.display = "none"; };
  d.querySelector("#pl-del").onclick = () => deletePlaylist(id);
  d.querySelector("#pl-play").onclick = () => { if (p.tracks.length) { waveActive = false; playFromList(p.tracks, 0); } };
}

async function renderWaveView() {
  const btn = $("#wave-toggle");
  if (btn) {
    btn.textContent = waveActive ? "Стоп" : "Плывём";
    btn.classList.toggle("active", waveActive);
  }
  const badge = $("#wave-status");
  const box = $("#wave-tracks");
  if (badge) badge.textContent = "";
  if (waveActive) {
    // play within the wave queue, never reset it
    renderTrackList(box, queue, { list: queue, onPlay: (i) => playIndex(i) });
    return;
  }
  if (!wavePreview.length) {
    box.innerHTML = `<div class="spinner">Подбираем…</div>`;
    wavePreview = await fetchWaveTracks();
  }
  if (!wavePreview.length) {
    box.innerHTML = `<div class="empty">Послушай пару треков — и здесь появится волна.</div>`;
    return;
  }
  // clicking a recommendation starts the wave from there (and keeps flowing)
  renderTrackList(box, wavePreview, {
    list: wavePreview,
    onPlay: (i) => { waveActive = true; radioActive = false; updateRadioNav(); queue = wavePreview.slice(); wavePreview = []; playIndex(i); renderWaveView(); },
  });
}

async function fetchWaveTracks() {
  if (waveLoading) return [];
  waveLoading = true;
  try {
    const seeds = [];
    const pushSeed = (t) => { if (t && (t.artist || t.title)) seeds.push({ id: t.id, artist: t.artist, title: t.title }); };
    pushSeed(curTrack);
    lib.history.slice(0, 5).forEach(pushSeed);
    lib.favorites.slice(0, 3).forEach(pushSeed);
    const exclude = queue.map((t) => t.id).concat(lib.history.slice(0, 15).map((t) => t.id));
    const r = await fetch("/api/wave", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seeds, exclude, limit: 20 }),
    });
    return (await r.json()).tracks || [];
  } catch { return []; }
  finally { waveLoading = false; }
}

async function startWave() {
  waveActive = true; radioActive = false; updateRadioNav();
  toast("Моя волна — подбираем похожие треки");
  const tracks = wavePreview.length ? wavePreview.slice() : await fetchWaveTracks();
  if (!tracks.length) { toast("Не удалось подобрать треки"); waveActive = false; renderWaveView(); return; }
  queue = tracks; wavePreview = [];
  playIndex(0);
  renderWaveView();
}

function stopWave() { waveActive = false; renderWaveView(); }

// The Radio tab appears only while a station is active, and hides otherwise.
function updateRadioNav() {
  document.body.classList.toggle("radio-on", radioActive);
  if (!radioActive && activeView === "radio") showView("home");
}

// Spotify-style "radio by track": its own tab, independent from "Моя волна".
async function startTrackRadio(t) {
  toast(`Радио: ${t.title}`);
  radioActive = true; waveActive = false; radioSeed = trackSnapshot(t);
  updateRadioNav();
  showView("radio");
  $("#radio-tracks").innerHTML = `<div class="spinner">Собираем станцию…</div>`;
  let tracks = [];
  try {
    const r = await fetch("/api/wave", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seeds: [{ id: t.id, artist: t.artist, title: t.title }], exclude: [t.id], limit: 30 }),
    });
    tracks = (await r.json()).tracks || [];
  } catch {}
  queue = [trackSnapshot(t), ...tracks];
  playIndex(0);
  renderRadioView();
}

function renderRadioView() {
  const title = $("#radio-title"), badge = $("#radio-status"), box = $("#radio-tracks");
  if (!box) return;
  if (!radioActive || !radioSeed) {
    if (title) title.textContent = "Радио";
    if (badge) badge.textContent = "";
    box.innerHTML = "";
    return;
  }
  if (title) title.textContent = radioSeed.title;        // station name = the seed track
  if (badge) badge.textContent = radioSeed.artist || "";
  // onPlay keeps the station intact (no reset) — just play that index of the queue
  renderTrackList(box, queue, { list: queue, onPlay: (i) => playIndex(i) });
}

async function fetchRadioTracks() {
  if (!radioSeed) return [];
  try {
    const exclude = queue.map((t) => t.id);
    const r = await fetch("/api/wave", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seeds: [radioSeed], exclude, limit: 20 }),
    });
    return (await r.json()).tracks || [];
  } catch { return []; }
}

// Append new rows to an existing list without rebuilding it (keeps scroll position,
// no re-animation). Indices line up with the queue.
function appendTracks(container, fullList, fromIndex, ctx) {
  ctx.list = fullList;
  const empty = container.querySelector(".empty");
  if (empty) empty.remove();
  for (let i = fromIndex; i < fullList.length; i++) {
    container.appendChild(trackRow(fullList[i], i, ctx));
  }
}

function refillRadioIfNeeded() {
  if (!radioActive) return;
  if (curIndex >= queue.length - 3) {
    fetchRadioTracks().then((more) => {
      const before = queue.length;
      more.forEach((t) => { if (!queue.some((x) => x.id === t.id)) queue.push(t); });
      if (activeView === "radio" && queue.length > before)
        appendTracks($("#radio-tracks"), queue, before, { list: queue, onPlay: (i) => playIndex(i) });
      renderQueuePanel();
    });
  }
}

async function refillWaveIfNeeded() {
  if (!waveActive || waveLoading) return;
  if (curIndex >= queue.length - 3) {
    const before = queue.length;
    const more = await fetchWaveTracks();
    more.forEach((t) => { if (!queue.some((x) => x.id === t.id)) queue.push(t); });
    if (activeView === "wave" && queue.length > before)
      appendTracks($("#wave-tracks"), queue, before, { list: queue, onPlay: (i) => playIndex(i) });
    renderQueuePanel();
  }
}

function playFromList(list, i) { waveActive = false; radioActive = false; updateRadioNav(); queue = list.slice(); playIndex(i); }

function playIndex(i) {
  if (i < 0 || i >= queue.length) return;
  curIndex = i; curTrack = queue[i]; altTried = false;
  $("#np-title").textContent = curTrack.title;
  $("#np-artist").textContent = curTrack.artist || "";
  const art = $("#np-art");
  if (curTrack.thumbnail) { art.style.display = ""; art.src = curTrack.thumbnail; }
  else { art.removeAttribute("src"); art.style.display = "none"; }
  updateBlur(curTrack.thumbnail);
  audio.src = streamUrl(curTrack);
  ensureAudioGraph();
  audio.play().catch(() => {});
  // Only move the "playing" highlight — do NOT rebuild the wave/radio list on every
  // track change (that caused the constant list refresh / re-animation).
  highlightPlaying();
  renderNowPlayingFav(); renderQueuePanel();
}
function highlightPlaying() {
  $$(".track").forEach((r) => r.classList.toggle("playing", !!curTrack && r.dataset.id === curTrack.id));
}

async function tryAlternateSource() {
  if (!curTrack || altTried) return false;
  altTried = true;
  toast("Трек недоступен — ищем другой источник…");
  try {
    const r = await fetch(`/api/alternate?title=${encodeURIComponent(curTrack.title)}&artist=${encodeURIComponent(curTrack.artist || "")}&src=${encodeURIComponent(curTrack.source || source)}`);
    const data = await r.json();
    if (data.track) {
      Object.assign(curTrack, data.track);
      queue[curIndex] = curTrack;
      audio.src = streamUrl(curTrack);
      await audio.play().catch(() => {});
      toast("Нашли на другом источнике");
      return true;
    }
  } catch {}
  toast("Не удалось воспроизвести — пропускаем");
  return false;
}

function nextTrack() {
  if (repeat === "one") { audio.currentTime = 0; audio.play(); return; }
  if (shuffle && queue.length > 1) { let n; do { n = Math.floor(Math.random() * queue.length); } while (n === curIndex); playIndex(n); return; }
  if (curIndex + 1 < queue.length) playIndex(curIndex + 1);
  else if (repeat === "all") playIndex(0);
  else if (waveActive) fetchWaveTracks().then((t) => { if (t.length) { queue.push(...t); playIndex(curIndex + 1); } });
  else if (radioActive) fetchRadioTracks().then((t) => { if (t.length) { queue.push(...t); playIndex(curIndex + 1); } });
  refillWaveIfNeeded();
  refillRadioIfNeeded();
}
function prevTrack() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  if (curIndex > 0) playIndex(curIndex - 1);
}
function togglePlay() {
  if (!audio.src) { if (queue.length) playIndex(0); return; }
  if (audio.paused) audio.play(); else audio.pause();
}

function renderQueuePanel() {
  const list = $("#queue-list");
  if (!list) return;
  list.innerHTML = "";
  queue.forEach((t, i) => {
    const d = document.createElement("div");
    d.className = "queue-item" + (i === curIndex ? " playing" : "");
    d.innerHTML = `
      <div class="q-thumb">
        <img src="${esc(t.thumbnail) || ""}" loading="lazy" onerror="this.style.visibility='hidden'"/>
        <span class="playing-bars"><i></i><i></i><i></i><i></i></span>
      </div>
      <div class="q-meta"><div class="q-title">${esc(t.title)}</div><div class="q-artist">${esc(t.artist || "")}</div></div>
      <button class="q-remove" title="Убрать">${ICONS.close}</button>`;
    d.addEventListener("click", (e) => { if (!e.target.closest(".q-remove")) playIndex(i); });
    d.querySelector(".q-remove").addEventListener("click", (e) => {
      e.stopPropagation(); queue.splice(i, 1);
      if (i < curIndex) curIndex--;
      else if (i === curIndex) playIndex(Math.min(curIndex, queue.length - 1));
      renderQueuePanel();
    });
    list.appendChild(d);
  });
  if (!queue.length) list.innerHTML = `<div class="empty">Очередь пуста.</div>`;
}

const volCurve = (v) => Math.pow(Math.max(0, Math.min(1, v)), 2.5);
function applyVolume(v) { audio.volume = volCurve(v); lib.volume = v; saveLibrary(); }

// EQ
const EQ_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_PRESETS = { "Плоский": [0,0,0,0,0,0,0,0,0,0], "Бас-буст": [6,5,4,2,0,0,0,0,0,0], "Высокие": [0,0,0,0,0,1,2,4,5,6], "Вокал": [-2,-1,0,2,4,4,3,1,0,-1], "Рок": [4,3,1,-1,-1,1,2,3,4,4], "Поп": [-1,0,2,3,3,2,0,-1,-1,-1], "Электроника": [5,4,1,0,-1,1,0,1,3,5], "Классика": [3,2,1,0,0,0,-1,-1,2,3] };
let actx = null, srcNode = null, eqNodes = [], eqGraphReady = false;
let eqState = { enabled: false, gains: [0,0,0,0,0,0,0,0,0,0], preset: "Плоский" };

function ensureAudioGraph() {
  if (eqGraphReady) { if (actx.state === "suspended") actx.resume(); return; }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    srcNode = actx.createMediaElementSource(audio);
    let prev = srcNode;
    eqNodes = EQ_FREQS.map((f, i) => {
      const node = actx.createBiquadFilter();
      node.type = i === 0 ? "lowshelf" : i === EQ_FREQS.length - 1 ? "highshelf" : "peaking";
      node.frequency.value = f; node.Q.value = 1.0;
      node.gain.value = eqState.enabled ? eqState.gains[i] : 0;
      prev.connect(node); prev = node; return node;
    });
    prev.connect(actx.destination); eqGraphReady = true;
  } catch (e) { console.warn("EQ", e); }
}
function applyEqGains() { if (eqGraphReady) eqNodes.forEach((n, i) => { n.gain.value = eqState.enabled ? eqState.gains[i] : 0; }); }
function applyEqState(s) { eqState = Object.assign(eqState, s); if ($("#eq-enabled")) $("#eq-enabled").checked = !!eqState.enabled; buildEqUI(); applyEqGains(); }
function buildEqUI() {
  const wrap = $("#eq-bands"); if (!wrap) return;
  wrap.innerHTML = "";
  EQ_FREQS.forEach((f, i) => {
    const band = document.createElement("div");
    band.className = "eq-band";
    band.innerHTML = `<div class="gain">${eqState.gains[i] > 0 ? "+" : ""}${eqState.gains[i]}</div><input type="range" min="-12" max="12" step="1" value="${eqState.gains[i]}" /><div class="freq">${f >= 1000 ? f/1000 + "k" : f}</div>`;
    band.querySelector("input").addEventListener("input", (ev) => {
      eqState.gains[i] = +ev.target.value;
      band.querySelector(".gain").textContent = (eqState.gains[i] > 0 ? "+" : "") + eqState.gains[i];
      eqState.preset = "Свой"; syncPreset(); applyEqGains(); persistEq();
    });
    wrap.appendChild(band);
  });
  renderPresetChips();
}
function renderPresetChips() {
  const box = $("#eq-presets"); if (!box) return;
  box.innerHTML = "";
  Object.keys(EQ_PRESETS).concat(["Свой"]).forEach((name) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (eqState.preset === name ? " active" : "");
    chip.textContent = name;
    chip.addEventListener("click", () => {
      if (!EQ_PRESETS[name]) return;
      eqState.gains = EQ_PRESETS[name].slice(); eqState.preset = name;
      buildEqUI(); applyEqGains(); persistEq();
    });
    box.appendChild(chip);
  });
}
function syncPreset() { $$("#eq-presets .chip").forEach((c) => c.classList.toggle("active", c.textContent === eqState.preset)); }
function persistEq() { lib.eq = eqState; saveLibrary(); }

function renderNowPlayingFav() {
  const b = $("#np-fav"); if (!b) return;
  if (!curTrack) { setIcon(b, "heart"); b.classList.remove("on"); return; }
  const on = isFav(curTrack.id);
  setIcon(b, on ? "heartFilled" : "heart"); b.classList.toggle("on", on);
}

function wirePlayer() {
  $("#play")?.addEventListener("click", togglePlay);
  $("#next")?.addEventListener("click", nextTrack);
  $("#prev")?.addEventListener("click", prevTrack);
  $("#shuffle")?.addEventListener("click", () => { shuffle = !shuffle; $("#shuffle").classList.toggle("active", shuffle); });
  $("#repeat")?.addEventListener("click", () => {
    repeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
    $("#repeat").classList.toggle("active", repeat !== "off");
    setIcon($("#repeat"), repeat === "one" ? "repeatOne" : "repeat");
  });
  $("#np-fav")?.addEventListener("click", () => { if (curTrack) toggleFav(curTrack); });
  $("#np-radio")?.addEventListener("click", () => { if (curTrack) startTrackRadio(curTrack); });

  // Smooth progress: drive the seek thumb + fill at 60fps (rAF), not the choppy
  // ~4fps "timeupdate" event — so the circle moves evenly, in sync with the bar.
  let seeking = false, progressRAF = null;
  const seekEl = $("#seek");
  function progressTick() {
    if (!seeking && audio.duration) {
      const t = audio.currentTime;
      seekEl.value = t;
      paintRange(seekEl);
      $("#cur").textContent = fmt(t);
    }
    progressRAF = requestAnimationFrame(progressTick);
  }
  function startProgress() { if (progressRAF == null) progressTick(); }
  function stopProgress() { if (progressRAF != null) { cancelAnimationFrame(progressRAF); progressRAF = null; } }

  audio.addEventListener("play", () => { setIcon($("#play"), "pause"); document.body.classList.add("playing"); startProgress(); });
  audio.addEventListener("pause", () => { setIcon($("#play"), "play"); document.body.classList.remove("playing"); stopProgress(); });
  audio.addEventListener("ended", () => { stopProgress(); if (curTrack) { addHistory(curTrack); bumpWaveStats(curTrack); } nextTrack(); refillWaveIfNeeded(); });
  audio.addEventListener("loadedmetadata", () => { $("#dur").textContent = fmt(audio.duration); seekEl.max = audio.duration || 100; paintRange(seekEl); });
  audio.addEventListener("timeupdate", () => {
    if (curTrack && audio.currentTime > 25 && !curTrack._logged) { curTrack._logged = true; bumpWaveStats(curTrack); }
  });
  audio.addEventListener("error", async () => {
    if (!(await tryAlternateSource())) setTimeout(nextTrack, 400);
  });

  $("#seek")?.addEventListener("input", () => { seeking = true; $("#cur").textContent = fmt(seekEl.value); paintRange(seekEl); });
  $("#seek")?.addEventListener("change", () => { audio.currentTime = +seekEl.value; seeking = false; });
  $("#vol")?.addEventListener("input", () => { applyVolume(+$("#vol").value); paintRange($("#vol")); });
  $("#quality")?.addEventListener("change", () => { lib.quality = $("#quality").value; saveLibrary(); if (curTrack) { audio.src = streamUrl(curTrack); audio.play().catch(() => {}); } });
}

function wireUI() {
  $("#search-input")?.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
  $("#search-input")?.addEventListener("search", () => { if ($("#search-input").value) doSearch(); });
  $("#search-open")?.addEventListener("click", () => showView("search"));   // mobile header icon
  $("#theme-toggle")?.addEventListener("click", toggleTheme);
  $("#new-playlist")?.addEventListener("click", newPlaylist);
  $("#lib-filter")?.addEventListener("input", () => renderLibrary());
  $$(".src-toggle .src").forEach((b) => b.addEventListener("click", () => {
    $$(".src-toggle .src").forEach((x) => x.classList.remove("on")); b.classList.add("on"); source = b.dataset.src;
  }));
  $$(".nav-item[data-view]").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
  $("#wave-toggle")?.addEventListener("click", () => { waveActive ? stopWave() : startWave(); });
  $("#queue-open")?.addEventListener("click", () => { renderQueuePanel(); $("#queue-modal").style.display = "flex"; });
  $("#queue-close")?.addEventListener("click", () => { $("#queue-modal").style.display = "none"; });
  $("#queue-modal")?.addEventListener("click", (e) => { if (e.target.id === "queue-modal") $("#queue-modal").style.display = "none"; });
  $("#eq-open")?.addEventListener("click", () => { $("#eq-modal").style.display = "flex"; buildEqUI(); });
  $("#eq-open2")?.addEventListener("click", () => { $("#eq-modal").style.display = "flex"; buildEqUI(); });
  $("#eq-close")?.addEventListener("click", () => { $("#eq-modal").style.display = "none"; });
  $("#eq-modal")?.addEventListener("click", (e) => { if (e.target.id === "eq-modal") $("#eq-modal").style.display = "none"; });
  $("#eq-enabled")?.addEventListener("change", (e) => { eqState.enabled = e.target.checked; ensureAudioGraph(); applyEqGains(); persistEq(); });
  if (!IS_MOBILE) document.addEventListener("keydown", (e) => { if (e.code === "Space" && e.target.tagName !== "INPUT") { e.preventDefault(); togglePlay(); } });
}

function showAuth(show) {
  $("#auth-screen").style.display = show ? "flex" : "none";
  if (IS_MOBILE) {
    $("#app").style.display = show ? "none" : "flex";
    $(".player").style.display = show ? "none" : "flex";
    $(".bottom-nav").style.display = show ? "none" : "flex";
  } else {
    $("#app").style.display = show ? "none" : "grid";
    $(".player").style.display = show ? "none" : "grid";
  }
}

async function enterApp(username) {
  if ($("#user-name")) $("#user-name").textContent = username;
  showAuth(false);
  lib = { ...LIB_DEFAULT }; queue = []; curIndex = -1; curTrack = null;
  await loadLibrary();
  applyVolume(lib.volume != null ? +lib.volume : 0.7);
  showView("home");
}

$("#auth-submit")?.addEventListener("click", submitAuth);
$("#auth-password")?.addEventListener("keydown", (e) => { if (e.key === "Enter") submitAuth(); });
$("#auth-username")?.addEventListener("keydown", (e) => { if (e.key === "Enter") submitAuth(); });
$$(".auth-tab").forEach((t) => t.addEventListener("click", () => setAuthMode(t.dataset.tab)));

function setAuthMode(mode) {
  authMode = mode;
  $$(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === mode));
  $("#auth-submit").textContent = mode === "login" ? "Войти" : "Создать аккаунт";
  $("#auth-password").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("#auth-error").textContent = "";
}
async function submitAuth() {
  const username = $("#auth-username").value.trim();
  const password = $("#auth-password").value;
  if (!username || !password) { $("#auth-error").textContent = "Заполни оба поля"; return; }
  $("#auth-submit").disabled = true;
  try {
    const r = await fetch("/api/" + authMode, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const data = await r.json();
    if (!r.ok) { $("#auth-error").textContent = data.error || "Ошибка"; return; }
    await enterApp(data.username);
  } catch { $("#auth-error").textContent = "Сеть недоступна"; }
  finally { $("#auth-submit").disabled = false; }
}
$("#logout-btn")?.addEventListener("click", async () => { await fetch("/api/logout", { method: "POST" }).catch(() => {}); audio.pause(); location.reload(); });

async function boot() {
  try {
    const r = await fetch("/api/me");
    const { user } = await r.json();
    if (user) await enterApp(user.username);
    else { showAuth(true); setAuthMode("login"); }
  } catch {
    // нет сети: если в приложении есть скачанные треки — открываем офлайн-режим
    if (hasOfflineDownloads()) enterOffline();
    else { showAuth(true); setAuthMode("login"); }
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

applyIcons();
applyTheme(currentTheme());
wirePlayer();
wireUI();
paintRange($("#seek"));
paintRange($("#vol"));
boot();

/* ============================================================
   ОФЛАЙН-ЗАГРУЗКИ (работают только внутри приложения SPOVO,
   где есть нативный мост window.SpovoNative). В обычном
   браузере/PWA весь блок просто не активируется.
   ============================================================ */
let dlSet = new Set();     // id скачанных треков
let dlProg = {};           // id -> процент текущей загрузки

function hasOfflineDownloads() {
  if (!window.SpovoNative) return false;
  try { return JSON.parse(window.SpovoNative.downloads() || "[]").length > 0; }
  catch { return false; }
}

function offlineTracks() {
  if (!window.SpovoNative) return [];
  let items = [];
  try { items = JSON.parse(window.SpovoNative.downloads() || "[]"); } catch {}
  return items.map((m) => ({
    id: m.id, title: m.title, artist: m.artist,
    duration: m.duration, source: m.source,
    thumbnail: m.art ? `/api/offline-art?url=${encodeURIComponent(m.id)}` : "",
  }));
}

function startDownload(t) {
  if (!window.SpovoNative) { toast("Скачивание доступно только в приложении"); return; }
  if (dlSet.has(t.id) || t.id in dlProg) return;
  dlProg[t.id] = 0;
  toast("Скачиваю: " + (t.title || ""));
  window.SpovoNative.download(
    t.id, lib.quality || "auto", t.title || "", t.artist || "",
    t.source || source || "", Number(t.duration) || 0, t.thumbnail || ""
  );
  updateNpDl();
}

function removeDownload(id) {
  if (!window.SpovoNative) return;
  window.SpovoNative.removeDownload(id);
  dlSet.delete(id); delete dlProg[id];
  if (activeView === "downloads") renderDownloads();
  updateNpDl();
  toast("Удалено из загрузок");
}

// прогресс/итог прилетает из нативки
window.__spovoDl = function (id, pct) {
  if (pct === 100) { dlSet.add(id); delete dlProg[id]; toast("Скачано ✓"); }
  else if (pct === -1) { delete dlProg[id]; toast("Не удалось скачать"); }
  else if (pct === -2) { dlSet.delete(id); delete dlProg[id]; }
  else { dlProg[id] = pct; }
  if (activeView === "downloads") renderDownloads();
  updateNpDl();
};

function renderDownloads() {
  const cont = $("#downloads-list"); if (!cont) return;
  const hint = $("#dl-hint"), badge = $("#dl-offline-badge"), count = $("#dl-count");
  if (badge) badge.style.display = document.body.classList.contains("offline-mode") ? "" : "none";
  if (!window.SpovoNative) {
    if (hint) hint.style.display = "block";
    cont.innerHTML = ""; if (count) count.textContent = "";
    return;
  }
  if (hint) hint.style.display = "none";
  const tracks = offlineTracks();
  if (count) count.textContent = tracks.length ? `${tracks.length} трек(ов)` : "";
  renderTrackList(cont, tracks, { onPlay: (i) => playFromList(tracks, i) });
  // у каждой строки превращаем "＋" в "удалить загрузку"
  $$("#downloads-list .track").forEach((row, i) => {
    const add = row.querySelector(".add");
    if (!add || !tracks[i]) return;
    add.innerHTML = ICONS.trash; add.title = "Удалить загрузку";
    const clone = add.cloneNode(true); add.replaceWith(clone);
    clone.addEventListener("click", (e) => { e.stopPropagation(); removeDownload(tracks[i].id); });
  });
  if (!tracks.length) cont.innerHTML = `<div class="empty">Пока ничего не скачано. Нажми ⬇ у трека или в плеере.</div>`;
}

function updateNpDl() {
  const b = $("#np-dl"); if (!b) return;
  if (!window.SpovoNative || !curTrack) { b.style.display = "none"; return; }
  b.style.display = "";
  const id = curTrack.id;
  if (dlSet.has(id)) { b.classList.add("on"); b.innerHTML = ICONS.check; b.title = "Скачано — удалить"; }
  else if (id in dlProg) { b.classList.remove("on"); b.innerHTML = `<span class="dl-pct">${dlProg[id]}%</span>`; b.title = "Скачивается…"; }
  else { b.classList.remove("on"); b.innerHTML = ICONS.download; b.title = "Скачать офлайн"; }
}

function enterOffline() {
  showAuth(false);
  document.body.classList.add("offline-mode");
  toast("Офлайн-режим: доступны скачанные треки");
  showView("downloads");
}

function initOffline() {
  if (!window.SpovoNative) {
    $$('.nav-downloads').forEach((b) => (b.style.display = "none"));
    const b = $("#np-dl"); if (b) b.style.display = "none";
    return;
  }
  $$('.nav-downloads').forEach((b) => (b.style.display = ""));
  try { offlineTracks().forEach((t) => dlSet.add(t.id)); } catch {}
  const tn = $("#np-title");
  if (tn) new MutationObserver(updateNpDl).observe(tn, { childList: true, subtree: true, characterData: true });
  const b = $("#np-dl");
  if (b) b.addEventListener("click", () => {
    if (!curTrack) return;
    if (dlSet.has(curTrack.id)) removeDownload(curTrack.id);
    else if (!(curTrack.id in dlProg)) startDownload(curTrack);
  });
  updateNpDl();
}
initOffline();
