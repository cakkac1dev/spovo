// ================= Lane PC frontend =================
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// ngrok-free shows a browser-warning interstitial; this header skips it for fetch/API calls
const _fetch = window.fetch.bind(window);
window.fetch = (url, opts = {}) => {
  opts.headers = Object.assign({}, opts.headers, { "ngrok-skip-browser-warning": "1" });
  return _fetch(url, opts);
};

// ---------- SVG icon set (Lucide-style) ----------
const _svg = (inner, filled) =>
  `<svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="${filled ? "none" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONS = {
  search: _svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  library: _svg('<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>'),
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
  music: _svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  heart: _svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
  heartFilled: _svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>', true),
  close: _svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
};
const setIcon = (el, name) => { if (el) el.innerHTML = ICONS[name] || ""; };
function applyIcons() { $$("[data-icon]").forEach((el) => setIcon(el, el.dataset.icon)); }

// fill the played/level portion of a range slider (white) vs the rest (gray)
function paintRange(el) {
  if (!el) return;
  const min = +el.min || 0, max = +el.max || 100;
  const pct = max > min ? ((+el.value - min) / (max - min)) * 100 : 0;
  el.style.background = `linear-gradient(to right, #fff 0%, #fff ${pct}%, #4a4a52 ${pct}%, #4a4a52 100%)`;
}

const audio = $("#audio");
let queue = [];
let curIndex = -1;
let source = "youtube";
let shuffle = false;
let repeat = "off"; // off | all | one

// library state (persisted on the backend)
let lib = { favorites: [], playlists: [], eq: null };

// ---------- persistence ----------
async function loadLibrary() {
  try {
    const r = await fetch("/api/library");
    lib = Object.assign({ favorites: [], playlists: [], eq: null }, await r.json());
  } catch {}
  if (lib.eq) applyEqState(lib.eq);
  renderNowPlayingFav();
}
let saveTimer = null;
function saveLibrary() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lib),
    }).catch(() => {});
  }, 300);
}

// ---------- helpers ----------
function fmt(sec) {
  if (sec == null || isNaN(sec)) return "0:00";
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
           : `${m}:${s.toString().padStart(2, "0")}`;
}
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const isFav = (id) => lib.favorites.some((t) => t.id === id);

// ---------- track rows ----------
function trackRow(t, i, ctx) {
  const row = document.createElement("div");
  row.className = "track" + (curTrack && curTrack.id === t.id ? " playing" : "");
  row.dataset.index = i;
  row.innerHTML = `
    <img src="${esc(t.thumbnail) || ""}" alt="" onerror="this.style.visibility='hidden'"/>
    <div class="t-main">
      <div class="t-title">${esc(t.title)}</div>
      <div class="t-artist">${esc(t.artist || "")}</div>
    </div>
    <div class="row-actions">
      <button class="icon-btn fav ${isFav(t.id) ? "on" : ""}" title="В избранное">${isFav(t.id) ? ICONS.heartFilled : ICONS.heart}</button>
      <button class="icon-btn add" title="В плейлист">${ICONS.plus}</button>
      <span class="t-dur">${fmt(t.duration)}</span>
    </div>`;
  row.addEventListener("click", (e) => {
    if (e.target.closest(".icon-btn")) return;
    playFromList(ctx.list, i);
  });
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

// ---------- search ----------
async function doSearch() {
  const q = $("#search-input").value.trim();
  if (!q) return;
  showView("search");
  if (source === "spotify") {
    $("#results").innerHTML = "";
    $("#hint").style.display = "block";
    $("#hint").textContent = "Spotify подключается отдельно (нужен Premium + Client ID).";
    return;
  }
  const label = source === "soundcloud" ? "SoundCloud" : "YouTube";
  $("#hint").style.display = "none";
  $("#results").innerHTML = `<div class="spinner">Ищу на ${label}…</div>`;
  try {
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&src=${source}`);
    const data = await r.json();
    searchListRef = data.tracks || [];
    renderTrackList($("#results"), searchListRef);
  } catch (e) {
    $("#results").innerHTML = `<div class="spinner">Ошибка поиска: ${e}</div>`;
  }
}

// ---------- favorites ----------
let searchListRef = null;
function toggleFav(t) {
  const i = lib.favorites.findIndex((x) => x.id === t.id);
  if (i >= 0) lib.favorites.splice(i, 1);
  else lib.favorites.unshift({ id: t.id, title: t.title, artist: t.artist, duration: t.duration, thumbnail: t.thumbnail, source: t.source });
  saveLibrary();
  refreshFavUI();
}
function refreshFavUI() {
  if (activeView === "library") renderLibrary();
  else if (activeView === "search" && searchListRef) renderTrackList($("#results"), searchListRef);
  renderNowPlayingFav();
}

// ---------- playlists ----------
function newPlaylist() {
  const name = prompt("Название плейлиста:");
  if (!name) return;
  lib.playlists.push({ id: "pl_" + Date.now(), name: name.trim(), tracks: [] });
  saveLibrary();
  renderLibrary();
}
function deletePlaylist(id) {
  if (!confirm("Удалить плейлист?")) return;
  lib.playlists = lib.playlists.filter((p) => p.id !== id);
  saveLibrary();
  $("#playlist-detail").style.display = "none";
  renderLibrary();
}
function addToPlaylist(plId, t) {
  const pl = lib.playlists.find((p) => p.id === plId);
  if (!pl) return;
  if (pl.tracks.some((x) => x.id === t.id)) return;
  pl.tracks.push({ id: t.id, title: t.title, artist: t.artist, duration: t.duration, thumbnail: t.thumbnail, source: t.source });
  saveLibrary();
}
function removeFromPlaylist(plId, id) {
  const pl = lib.playlists.find((p) => p.id === plId);
  if (!pl) return;
  pl.tracks = pl.tracks.filter((x) => x.id !== id);
  saveLibrary();
  openPlaylist(plId);
}

// add-to-playlist popover
function openAddMenu(e, t) {
  const m = $("#ctx-menu");
  let html = `<div class="ctx-title">Добавить в плейлист</div>`;
  html += `<div class="ctx-item" data-act="fav">${isFav(t.id) ? "Убрать из избранного" : "В избранное"}</div>`;
  html += `<div class="ctx-sep"></div>`;
  if (!lib.playlists.length) html += `<div class="ctx-title">нет плейлистов</div>`;
  lib.playlists.forEach((p) => { html += `<div class="ctx-item" data-pl="${p.id}">${esc(p.name)}</div>`; });
  html += `<div class="ctx-sep"></div><div class="ctx-item" data-act="new">+ Новый плейлист…</div>`;
  m.innerHTML = html;
  m.style.display = "block";
  const x = Math.min(e.clientX, window.innerWidth - 200);
  const y = Math.min(e.clientY, window.innerHeight - 260);
  m.style.left = x + "px";
  m.style.top = y + "px";
  m.querySelectorAll(".ctx-item").forEach((it) => {
    it.addEventListener("click", () => {
      if (it.dataset.pl) addToPlaylist(it.dataset.pl, t);
      else if (it.dataset.act === "fav") toggleFav(t);
      else if (it.dataset.act === "new") {
        const name = prompt("Название плейлиста:");
        if (name) { const id = "pl_" + Date.now(); lib.playlists.push({ id, name: name.trim(), tracks: [] }); addToPlaylist(id, t); saveLibrary(); }
      }
      m.style.display = "none";
    });
  });
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#ctx-menu") && !e.target.closest(".add")) $("#ctx-menu").style.display = "none";
});

// ---------- views ----------
let activeView = "search";
function showView(v) {
  activeView = v;
  ["search", "library", "spotify"].forEach((x) => {
    $("#view-" + x).style.display = x === v ? "block" : "none";
  });
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
  if (v === "library") renderLibrary();
}

function renderLibrary() {
  renderTrackList($("#favorites"), lib.favorites, {});
  $("#fav-count").textContent = lib.favorites.length ? `${lib.favorites.length} трек(ов)` : "";
  const grid = $("#playlists");
  grid.innerHTML = "";
  if (!lib.playlists.length) grid.innerHTML = `<div class="empty">Пока нет плейлистов.</div>`;
  lib.playlists.forEach((p) => {
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
  d.innerHTML = `
    <button class="back-link" id="pl-back">← Назад</button>
    <div class="lib-head">
      <h2>${esc(p.name)}</h2>
      <span class="muted-sm">${p.tracks.length} трек(ов)</span>
      <button class="mini-btn accent" id="pl-play">Слушать</button>
      <button class="mini-btn" id="pl-del">Удалить</button>
    </div>
    <div id="pl-tracks" class="track-list"></div>`;
  // hide grid/fav while in detail
  const ctx = { list: p.tracks };
  const cont = d.querySelector("#pl-tracks");
  cont.innerHTML = "";
  if (!p.tracks.length) cont.innerHTML = `<div class="empty">Плейлист пуст. Добавляй треки через ＋.</div>`;
  p.tracks.forEach((t, i) => {
    const row = trackRow(t, i, ctx);
    // replace the "+" with a remove button in playlist context
    const add = row.querySelector(".add");
    add.innerHTML = ICONS.trash;
    add.title = "Убрать из плейлиста";
    add.replaceWith(add.cloneNode(true));
    row.querySelector(".add").addEventListener("click", (e) => { e.stopPropagation(); removeFromPlaylist(id, t.id); });
    cont.appendChild(row);
  });
  d.querySelector("#pl-back").addEventListener("click", () => { d.style.display = "none"; });
  d.querySelector("#pl-del").addEventListener("click", () => deletePlaylist(id));
  d.querySelector("#pl-play").addEventListener("click", () => { if (p.tracks.length) playFromList(p.tracks, 0); });
  d.scrollIntoView({ behavior: "smooth" });
}

// ---------- playback ----------
let curTrack = null;
function playFromList(list, i) {
  queue = list.slice();
  playIndex(i);
}
function playIndex(i) {
  if (i < 0 || i >= queue.length) return;
  curIndex = i;
  const t = queue[i];
  curTrack = t;
  $("#np-title").textContent = t.title;
  $("#np-artist").textContent = t.artist || "";
  const art = $("#np-art");
  if (t.thumbnail) { art.style.display = ""; art.src = t.thumbnail; }
  else { art.removeAttribute("src"); art.style.display = "none"; }   // show music-note placeholder
  audio.src = `/api/stream?url=${encodeURIComponent(t.id)}`;
  ensureAudioGraph();
  audio.play().catch(() => {});
  $$(".track").forEach((r) => r.classList.remove("playing"));
  renderNowPlayingFav();
}
function nextTrack() {
  if (repeat === "one") { audio.currentTime = 0; audio.play(); return; }
  if (shuffle && queue.length > 1) { let n; do { n = Math.floor(Math.random() * queue.length); } while (n === curIndex); playIndex(n); return; }
  if (curIndex + 1 < queue.length) playIndex(curIndex + 1);
  else if (repeat === "all") playIndex(0);
}
function prevTrack() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  if (curIndex > 0) playIndex(curIndex - 1);
}
function togglePlay() {
  if (!audio.src) { if (queue.length) playIndex(0); return; }
  if (audio.paused) audio.play(); else audio.pause();
}

$("#play").addEventListener("click", togglePlay);
$("#next").addEventListener("click", nextTrack);
$("#prev").addEventListener("click", prevTrack);
$("#shuffle").addEventListener("click", () => { shuffle = !shuffle; $("#shuffle").classList.toggle("active", shuffle); });
$("#repeat").addEventListener("click", () => {
  repeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
  $("#repeat").classList.toggle("active", repeat !== "off");
  setIcon($("#repeat"), repeat === "one" ? "repeatOne" : "repeat");
});

audio.addEventListener("play", () => setIcon($("#play"), "pause"));
audio.addEventListener("pause", () => setIcon($("#play"), "play"));
audio.addEventListener("ended", nextTrack);
audio.addEventListener("loadedmetadata", () => { $("#dur").textContent = fmt(audio.duration); $("#seek").max = audio.duration || 100; paintRange($("#seek")); });
audio.addEventListener("timeupdate", () => { $("#cur").textContent = fmt(audio.currentTime); if (!seeking) { $("#seek").value = audio.currentTime; paintRange($("#seek")); } });

let seeking = false;
$("#seek").addEventListener("input", () => { seeking = true; $("#cur").textContent = fmt($("#seek").value); paintRange($("#seek")); });
$("#seek").addEventListener("change", () => { audio.currentTime = +$("#seek").value; seeking = false; });
// Perceptual volume: human loudness is logarithmic, so map the slider through a
// power curve. Low slider positions become much quieter and finer to control.
const volCurve = (v) => Math.pow(Math.max(0, Math.min(1, v)), 2.5);
$("#vol").addEventListener("input", () => { audio.volume = volCurve(+$("#vol").value); paintRange($("#vol")); });
audio.volume = volCurve(+$("#vol").value);

// now playing fav
function renderNowPlayingFav() {
  const b = $("#np-fav");
  if (!curTrack) { setIcon(b, "heart"); b.classList.remove("on"); return; }
  const on = isFav(curTrack.id);
  setIcon(b, on ? "heartFilled" : "heart");
  b.classList.toggle("on", on);
}
$("#np-fav").addEventListener("click", () => { if (curTrack) toggleFav(curTrack); });

// ================= Equalizer (Web Audio API) =================
const EQ_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_PRESETS = {
  "Плоский": [0,0,0,0,0,0,0,0,0,0],
  "Бас-буст": [6,5,4,2,0,0,0,0,0,0],
  "Высокие": [0,0,0,0,0,1,2,4,5,6],
  "Вокал": [-2,-1,0,2,4,4,3,1,0,-1],
  "Рок": [4,3,1,-1,-1,1,2,3,4,4],
  "Поп": [-1,0,2,3,3,2,0,-1,-1,-1],
  "Электроника": [5,4,1,0,-1,1,0,1,3,5],
  "Классика": [3,2,1,0,0,0,-1,-1,2,3],
};
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
      node.frequency.value = f;
      node.Q.value = 1.0;
      node.gain.value = eqState.enabled ? eqState.gains[i] : 0;
      prev.connect(node);
      prev = node;
      return node;
    });
    prev.connect(actx.destination);
    eqGraphReady = true;
  } catch (e) { console.warn("EQ graph error", e); }
}
function applyEqGains() {
  if (!eqGraphReady) return;
  eqNodes.forEach((n, i) => { n.gain.value = eqState.enabled ? eqState.gains[i] : 0; });
}
function applyEqState(s) {
  eqState = Object.assign(eqState, s);
  $("#eq-enabled").checked = !!eqState.enabled;
  buildEqUI();
  applyEqGains();
}
function buildEqUI() {
  const wrap = $("#eq-bands");
  wrap.innerHTML = "";
  EQ_FREQS.forEach((f, i) => {
    const band = document.createElement("div");
    band.className = "eq-band";
    band.innerHTML = `
      <div class="gain">${eqState.gains[i] > 0 ? "+" : ""}${eqState.gains[i]}</div>
      <input type="range" min="-12" max="12" step="1" value="${eqState.gains[i]}" />
      <div class="freq">${f >= 1000 ? f/1000 + "k" : f}</div>`;
    const slider = band.querySelector("input");
    slider.addEventListener("input", () => {
      eqState.gains[i] = +slider.value;
      band.querySelector(".gain").textContent = (eqState.gains[i] > 0 ? "+" : "") + eqState.gains[i];
      eqState.preset = "Свой";
      syncPreset();
      applyEqGains();
      persistEq();
    });
    wrap.appendChild(band);
  });
  renderPresetChips();
}
function renderPresetChips() {
  const box = $("#eq-presets");
  box.innerHTML = "";
  Object.keys(EQ_PRESETS).concat(["Свой"]).forEach((name) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (eqState.preset === name ? " active" : "");
    chip.textContent = name;
    chip.dataset.preset = name;
    chip.addEventListener("click", () => {
      if (!EQ_PRESETS[name]) return;            // "Свой" is only a status, not clickable
      eqState.gains = EQ_PRESETS[name].slice();
      eqState.preset = name;
      buildEqUI();
      applyEqGains();
      persistEq();
    });
    box.appendChild(chip);
  });
}
function syncPreset() {
  $$("#eq-presets .chip").forEach((c) => c.classList.toggle("active", c.dataset.preset === eqState.preset));
}
function persistEq() { lib.eq = eqState; saveLibrary(); }

$("#eq-enabled").addEventListener("change", (e) => { eqState.enabled = e.target.checked; ensureAudioGraph(); applyEqGains(); persistEq(); });
function openEq() { $("#eq-modal").style.display = "flex"; buildEqUI(); }
$("#eq-open").addEventListener("click", openEq);
$("#eq-open2").addEventListener("click", openEq);
$("#eq-close").addEventListener("click", () => ($("#eq-modal").style.display = "none"));
$("#eq-modal").addEventListener("click", (e) => { if (e.target.id === "eq-modal") $("#eq-modal").style.display = "none"; });

// ---------- ui wiring ----------
$("#search-input").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
$(".search-ic").addEventListener("click", doSearch);
$("#new-playlist").addEventListener("click", newPlaylist);
$$(".src-toggle .src").forEach((b) => b.addEventListener("click", () => {
  $$(".src-toggle .src").forEach((x) => x.classList.remove("on"));
  b.classList.add("on"); source = b.dataset.src;
}));
$$(".nav-item").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target.tagName !== "INPUT") { e.preventDefault(); togglePlay(); }
});

// ================= Auth =================
let authMode = "login";
function showAuth(show) {
  $("#auth-screen").style.display = show ? "flex" : "none";
  $("#app").style.display = show ? "none" : "grid";
  $(".player").style.display = show ? "none" : "grid";
}
function setAuthMode(mode) {
  authMode = mode;
  $$(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === mode));
  $("#auth-submit").textContent = mode === "login" ? "Войти" : "Создать аккаунт";
  $("#auth-password").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("#auth-error").textContent = "";
}
$$(".auth-tab").forEach((t) => t.addEventListener("click", () => setAuthMode(t.dataset.tab)));

async function submitAuth() {
  const username = $("#auth-username").value.trim();
  const password = $("#auth-password").value;
  if (!username || !password) { $("#auth-error").textContent = "Заполни оба поля"; return; }
  $("#auth-submit").disabled = true;
  try {
    const r = await fetch("/api/" + authMode, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json();
    if (!r.ok) { $("#auth-error").textContent = data.error || "Ошибка"; return; }
    await enterApp(data.username);
  } catch (e) {
    $("#auth-error").textContent = "Сеть недоступна";
  } finally {
    $("#auth-submit").disabled = false;
  }
}
$("#auth-submit").addEventListener("click", submitAuth);
$("#auth-password").addEventListener("keydown", (e) => { if (e.key === "Enter") submitAuth(); });
$("#auth-username").addEventListener("keydown", (e) => { if (e.key === "Enter") submitAuth(); });

async function enterApp(username) {
  $("#user-name").textContent = username;
  showAuth(false);
  // reset in-memory state, then load this user's library
  lib = { favorites: [], playlists: [], eq: null };
  queue = []; curIndex = -1; curTrack = null;
  await loadLibrary();
  showView("search");
}

$("#logout-btn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" }).catch(() => {});
  audio.pause();
  location.reload();
});

async function boot() {
  try {
    const r = await fetch("/api/me");
    const { user } = await r.json();
    if (user) { await enterApp(user.username); }
    else { showAuth(true); setAuthMode("login"); }
  } catch {
    showAuth(true); setAuthMode("login");
  }
}
applyIcons();
paintRange($("#seek"));
paintRange($("#vol"));
boot();
