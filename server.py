"""
SPOVO — a desktop-style music streaming service (web UI served locally).

Sources:
  - YouTube / SoundCloud: search + full streaming via yt-dlp (no API key needed)
  - Spotify:              OAuth + Web Playback SDK on the frontend (in the browser)

Run:  python server.py   ->  opens http://127.0.0.1:8765
"""

import json
import os
import secrets
import sqlite3
import threading
import webbrowser
from functools import lru_cache

import re

import requests
from flask import (Flask, Response, request, jsonify, session,
                   send_from_directory, stream_with_context)
from werkzeug.security import generate_password_hash, check_password_hash
from yt_dlp import YoutubeDL

# YouTube Music gives real "music from music accounts" + radio recommendations.
# It's optional: if it isn't installed/reachable we fall back to yt-dlp search.
try:
    from ytmusicapi import YTMusic
except Exception:
    YTMusic = None

# Initialise YTMusic LAZILY (on first use), never at import — its constructor makes
# a network call, and on a flaky/filtered connection that could hang server startup.
_ytm = None
_ytm_ready = False
_ytm_lock = threading.Lock()


def get_ytm():
    global _ytm, _ytm_ready
    if _ytm_ready:
        return _ytm
    with _ytm_lock:
        if not _ytm_ready:
            try:
                # RU locale -> Russian artists on the Home feed
                _ytm = YTMusic(language="ru", location="RU") if YTMusic else None
            except Exception:
                try:
                    _ytm = YTMusic() if YTMusic else None
                except Exception:
                    _ytm = None
            _ytm_ready = True
    return _ytm

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, "static"), static_url_path="")

# ----- config the user can edit -----
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")

# ----- persisted library default shape -----
_DEFAULT_LIBRARY = {
    "favorites": [],
    "playlists": [],
    "eq": None,
    "volume": 0.7,
    "quality": "auto",
    "history": [],
    "waveStats": {},
}

QUALITY_FORMATS = {
    "auto": "bestaudio[ext=m4a]/http_mp3_1_0/http_mp3_0_0/bestaudio/best",
    "high": "bestaudio/best",
    "low": "worstaudio/worst",
}

# ----- accounts: SQLite + signed-cookie sessions -----
DB_PATH = os.path.join(BASE_DIR, "users.db")
SECRET_PATH = os.path.join(BASE_DIR, ".secret")


def _load_secret():
    """Persist a random secret key so sessions survive restarts."""
    try:
        with open(SECRET_PATH, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        s = secrets.token_hex(32)
        with open(SECRET_PATH, "w", encoding="utf-8") as f:
            f.write(s)
        return s


app.secret_key = _load_secret()
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 30,  # 30 days
)


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                username  TEXT UNIQUE NOT NULL,
                pw_hash   TEXT NOT NULL,
                library   TEXT NOT NULL DEFAULT '{}',
                created   TEXT DEFAULT CURRENT_TIMESTAMP
            )""")
        conn.commit()


def current_user():
    uid = session.get("uid")
    if not uid:
        return None
    with db() as conn:
        row = conn.execute("SELECT id, username FROM users WHERE id=?", (uid,)).fetchone()
    return dict(row) if row else None


def load_config():
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


# ---------------- SoundCloud via yt-dlp ----------------

_YDL_SEARCH = {
    "quiet": True,
    "no_warnings": True,
    "extract_flat": True,      # fast: don't resolve every track fully
    "skip_download": True,
}

# A progressive (single-file) audio stream the browser/proxy can read directly.
_YDL_RESOLVE_BASE = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
}

# Optional cookies.txt next to server.py — lets yt-dlp act like a logged-in
# browser, which avoids YouTube's "confirm you're not a bot" on datacenter IPs.
COOKIES_PATH = os.path.join(BASE_DIR, "cookies.txt")
if os.path.isfile(COOKIES_PATH):
    _YDL_SEARCH["cookiefile"] = COOKIES_PATH
    _YDL_RESOLVE_BASE["cookiefile"] = COOKIES_PATH

# source name -> yt-dlp search prefix
SEARCH_PREFIX = {
    "youtube": "ytsearch",
    "soundcloud": "scsearch",  # needs soundcloud.com reachable (VPN on some ISPs)
}


def _track_from_entry(e, source):
    """Normalize a yt-dlp search entry into our track shape."""
    thumb = e.get("thumbnail")
    if not thumb:
        thumbs = e.get("thumbnails") or []
        if thumbs:
            thumb = thumbs[-1].get("url")
    return {
        "id": e.get("url") or e.get("webpage_url") or e.get("id"),
        "title": e.get("title") or "Unknown",
        "artist": e.get("uploader") or e.get("channel") or source,
        "duration": e.get("duration"),
        "thumbnail": thumb,
        "source": source,
    }


_VIDEO_ID_RE = re.compile(r"(?:v=|youtu\.be/|music\.youtube\.com/watch\?v=)([\w-]{11})")


def _extract_video_id(url):
    m = _VIDEO_ID_RE.search(url or "")
    return m.group(1) if m else None


def _ytm_thumb(item):
    thumbs = item.get("thumbnails") or item.get("thumbnail") or []
    return thumbs[-1].get("url") if thumbs else None


def _ytm_to_track(item):
    """Map a ytmusicapi song/video/radio dict into our track shape."""
    vid = item.get("videoId")
    if not vid:
        return None
    artists = item.get("artists") or []
    artist = ", ".join(a.get("name", "") for a in artists if a.get("name")) or "YouTube Music"
    dur = item.get("duration_seconds")
    if not dur and (item.get("duration") or item.get("length")):
        parts = str(item.get("duration") or item.get("length")).split(":")
        try:
            dur = sum(int(p) * 60 ** i for i, p in enumerate(reversed(parts)))
        except ValueError:
            dur = None
    return {
        "id": f"https://www.youtube.com/watch?v={vid}",
        "title": item.get("title") or "Unknown",
        "artist": artist,
        "duration": dur,
        "thumbnail": _ytm_thumb(item),
        "source": "youtube",
    }


def _ytmusic_search(q, n):
    """Real YouTube Music search (songs from official music accounts)."""
    ytm = get_ytm()
    if not ytm:
        return None
    try:
        with _ytm_lock:
            res = ytm.search(q, filter="songs", limit=n)
        out = []
        for it in res:
            t = _ytm_to_track(it)
            if t:
                out.append(t)
            if len(out) >= n:
                break
        return out
    except Exception:
        return None


# YouTube channels that host official song audio are named "<Artist> - Topic".
_MUSIC_HINT = re.compile(r"-\s*topic$|vevo$|official", re.IGNORECASE)


def _ydl_music_search(q, n):
    """Fallback music search via yt-dlp, preferring music-account uploads."""
    with YoutubeDL(_YDL_SEARCH) as ydl:
        info = ydl.extract_info(f"ytsearch{n + 10}:{q}", download=False)
    entries = [e for e in (info.get("entries") or []) if e]
    tracks = [_track_from_entry(e, "youtube") for e in entries]
    music = [t for t in tracks if _MUSIC_HINT.search((t.get("artist") or ""))]
    ranked = music + [t for t in tracks if t not in music]
    return ranked[:n]


def _youtube_search(q, n):
    return _ytmusic_search(q, n) or _ydl_music_search(q, n)


def _interleave(a, b):
    out, seen = [], set()
    for x, y in zip(a, b):
        for t in (x, y):
            if t and t["id"] not in seen:
                seen.add(t["id"]); out.append(t)
    for t in (a[len(b):] + b[len(a):]):
        if t["id"] not in seen:
            seen.add(t["id"]); out.append(t)
    return out


@app.route("/api/search")
def api_search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"tracks": []})
    n = int(request.args.get("n", 25))
    source = request.args.get("src", "all")
    try:
        if source == "soundcloud":
            tracks = _search_tracks(q, "soundcloud", n)
        elif source == "youtube":
            tracks = _youtube_search(q, n)
        else:  # "all" — combined YouTube Music + SoundCloud
            yt = _youtube_search(q, n) or []
            try:
                sc = _search_tracks(q, "soundcloud", max(6, n // 2))
            except Exception:
                sc = []
            tracks = _interleave(yt, sc) if sc else yt
        return jsonify({"tracks": tracks})
    except Exception as exc:
        return jsonify({"error": str(exc), "tracks": []}), 500


@lru_cache(maxsize=512)
def _resolve_stream(url, quality="auto"):
    fmt = QUALITY_FORMATS.get(quality, QUALITY_FORMATS["auto"])
    opts = dict(_YDL_RESOLVE_BASE, format=fmt)
    with YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    audio_url = info.get("url")
    http_headers = info.get("http_headers") or {}
    return audio_url, http_headers


def _search_tracks(q, source="youtube", n=12):
    prefix = SEARCH_PREFIX.get(source, "ytsearch")
    with YoutubeDL(_YDL_SEARCH) as ydl:
        info = ydl.extract_info(f"{prefix}{n}:{q}", download=False)
    entries = info.get("entries") or []
    return [_track_from_entry(e, source) for e in entries if e]


@app.route("/api/resolve")
def api_resolve():
    """Full metadata for one track (used when starting playback)."""
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "url required"}), 400
    try:
        with YoutubeDL(dict(_YDL_RESOLVE_BASE, format=QUALITY_FORMATS["auto"])) as ydl:
            info = ydl.extract_info(url, download=False)
        return jsonify({
            "id": url,
            "title": info.get("title"),
            "artist": info.get("uploader"),
            "duration": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "source": info.get("extractor_key", "").lower() or "youtube",
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/stream")
def api_stream():
    """
    Proxy the audio with HTTP Range support so the <audio> element can seek.
    The browser hits /api/stream?url=<soundcloud track url>.
    """
    url = request.args.get("url")
    if not url:
        return "url required", 400
    quality = request.args.get("quality", "auto")
    if quality not in QUALITY_FORMATS:
        quality = "auto"
    try:
        audio_url, headers = _resolve_stream(url, quality)
    except Exception as exc:
        return f"resolve failed: {exc}", 502
    if not audio_url:
        return "no audio url", 502

    upstream_headers = dict(headers)
    range_header = request.headers.get("Range")
    if range_header:
        upstream_headers["Range"] = range_header

    r = requests.get(audio_url, headers=upstream_headers, stream=True, timeout=20)

    resp_headers = {
        "Content-Type": r.headers.get("Content-Type", "audio/mpeg"),
        "Accept-Ranges": "bytes",
    }
    for h in ("Content-Range", "Content-Length"):
        if h in r.headers:
            resp_headers[h] = r.headers[h]

    def generate():
        for chunk in r.iter_content(chunk_size=64 * 1024):
            if chunk:
                yield chunk

    return Response(stream_with_context(generate()), status=r.status_code, headers=resp_headers)


@app.route("/api/alternate")
def api_alternate():
    """Find the same track on another source when stream fails."""
    title = (request.args.get("title") or "").strip()
    artist = (request.args.get("artist") or "").strip()
    cur_src = request.args.get("src", "youtube")
    if not title and not artist:
        return jsonify({"track": None})
    q = f"{artist} {title}".strip()
    order = ["soundcloud", "youtube"] if cur_src == "youtube" else ["youtube", "soundcloud"]
    for src in order:
        try:
            tracks = _search_tracks(q, src, 5)
            for t in tracks:
                tid = (t.get("id") or "").lower()
                if title.lower()[:12] in tid or title.lower() in (t.get("title") or "").lower():
                    return jsonify({"track": t})
            if tracks:
                return jsonify({"track": tracks[0]})
        except Exception:
            continue
    return jsonify({"track": None})


def _resolve_seed_video_ids(seeds, maximum=3):
    """Turn seed tracks (any source) into YouTube Music video ids for radio."""
    ids = []
    for s in seeds:
        vid = _extract_video_id(s.get("id") or "")
        if not vid and get_ytm():
            q = f"{s.get('artist', '')} {s.get('title', '')}".strip()
            if q:
                r = _ytmusic_search(q, 1)
                if r:
                    vid = _extract_video_id(r[0]["id"])
        if vid and vid not in ids:
            ids.append(vid)
        if len(ids) >= maximum:
            break
    return ids


def _ytm_radio(video_ids, exclude, limit):
    """YouTube Music radio = an endless flow of similar songs (My Wave)."""
    ytm = get_ytm()
    if not ytm:
        return []
    out, seen, seen_titles = [], set(exclude), set()
    for vid in video_ids:           # never recommend the seed tracks themselves
        seen.add(f"https://www.youtube.com/watch?v={vid}")

    def base_title(t):
        return re.split(r"[\(\[]", (t.get("title") or "").lower(), 1)[0].strip()

    for vid in video_ids:
        try:
            with _ytm_lock:
                wp = ytm.get_watch_playlist(videoId=vid, radio=True, limit=limit + 20)
        except Exception:
            continue
        for it in (wp.get("tracks") or []):
            t = _ytm_to_track(it)
            if not t or t["id"] in seen:
                continue
            bt = base_title(t)
            if bt and bt in seen_titles:   # skip duplicate / sped-up / cover of same song
                continue
            seen.add(t["id"])
            seen_titles.add(bt)
            out.append(t)
            if len(out) >= limit:
                return out
    return out


@app.route("/api/wave", methods=["POST"])
def api_wave():
    """Recommend similar tracks (My Wave). Prefers YouTube Music radio."""
    data = request.get_json(force=True, silent=True) or {}
    exclude = set(data.get("exclude") or [])
    limit = min(int(data.get("limit", 20)), 40)
    seeds = data.get("seeds") or []

    # --- Best path: YouTube Music radio seeded from what the user plays/likes ---
    if get_ytm():
        seed_ids = _resolve_seed_video_ids(seeds)
        if not seed_ids:
            user = current_user()
            if user:
                with db() as conn:
                    row = conn.execute("SELECT library FROM users WHERE id=?", (user["id"],)).fetchone()
                try:
                    libd = json.loads(row["library"]) if row and row["library"] else {}
                    top = sorted((libd.get("waveStats") or {}).items(), key=lambda x: -x[1])
                    for artist, _c in top[:3]:
                        r = _ytmusic_search(f"{artist}", 1)
                        if r:
                            vid = _extract_video_id(r[0]["id"])
                            if vid:
                                seed_ids.append(vid)
                except (TypeError, json.JSONDecodeError):
                    pass
        radio = _ytm_radio(seed_ids, exclude, limit)
        if radio:
            return jsonify({"tracks": radio})

    # --- Fallback: text-search by listening stats (no ytmusicapi) ---
    stats = {}
    user = current_user()
    if user:
        with db() as conn:
            row = conn.execute("SELECT library FROM users WHERE id=?", (user["id"],)).fetchone()
        try:
            lib = json.loads(row["library"]) if row and row["library"] else {}
            stats = lib.get("waveStats") or {}
        except (TypeError, json.JSONDecodeError):
            stats = {}

    queries = []
    for artist, _cnt in sorted(stats.items(), key=lambda x: -x[1])[:4]:
        if artist:
            queries.append(f"{artist} popular songs")
            queries.append(f"{artist} mix")
    for s in seeds[:3]:
        a = (s.get("artist") or "").strip()
        t = (s.get("title") or "").strip()
        if a:
            queries.append(f"{a} similar artists")
        if a and t:
            queries.append(f"{a} {t.split('(')[0].strip()} remix")

    if not queries:
        for s in seeds[:5]:
            a = (s.get("artist") or "").strip()
            if a:
                queries.append(f"{a} music")
        if not queries:
            queries = ["chill lofi mix", "top hits mix", "electronic mix"]

    seen = set(exclude)
    out = []
    for q in queries:
        if len(out) >= limit:
            break
        try:
            for t in (_youtube_search(q, 8) or []):
                tid = t.get("id")
                if not tid or tid in seen:
                    continue
                seen.add(tid)
                out.append(t)
                if len(out) >= limit:
                    break
        except Exception:
            continue
    return jsonify({"tracks": out})


def _ytm_playlist_tracks(pid, limit):
    ytm = get_ytm()
    if not ytm or not pid:
        return []
    try:
        with _ytm_lock:
            pl = ytm.get_playlist(pid, limit=limit + 5)
        out = []
        seen = set()
        for t in (pl.get("tracks") or []):
            tr = _ytm_to_track(t)
            if tr and tr["id"] not in seen:
                seen.add(tr["id"]); out.append(tr)
            if len(out) >= limit:
                break
        return out
    except Exception:
        return []


_home_cache = {"ts": 0.0, "data": None}
_HOME_TTL = 60 * 60  # refresh once an hour


@app.route("/api/home")
def api_home():
    """Home page: auto-updating blocks (trending + YouTube Music home feed)."""
    import time
    now = time.time()
    if _home_cache["data"] and now - _home_cache["ts"] < _HOME_TTL:
        return jsonify(_home_cache["data"])

    blocks = []
    ytm = get_ytm()
    if ytm:
        country = (load_config().get("home_country") or "RU")
        seen = set()

        def add_block(title, tracks):
            uniq = []
            for t in tracks:
                if t and t["id"] not in seen:
                    seen.add(t["id"]); uniq.append(t)
            if len(uniq) >= 4:
                blocks.append({"title": title, "tracks": uniq[:18]})

        # 1) Trending — from the RU chart playlist (real, playable songs).
        try:
            with _ytm_lock:
                charts = ytm.get_charts(country=country)
            vids = charts.get("videos")
            items = vids.get("items") if isinstance(vids, dict) else vids
            pid = next((it.get("playlistId") for it in (items or []) if it.get("playlistId")), None)
            add_block("В тренде", _ytm_playlist_tracks(pid, 20))
        except Exception:
            pass

        # 2) Curated Russian blocks via targeted searches (guarantees RU artists).
        for title, query in [
            ("Новинки", "новинки русской музыки 2026"),
            ("Русский рэп", "русский рэп хиты"),
            ("Русский поп", "русский поп хиты"),
            ("Тренды СНГ", "хиты снг 2026"),
        ]:
            try:
                add_block(title, _ytmusic_search(query, 18) or [])
            except Exception:
                pass

    if blocks:
        _home_cache.update(ts=now, data={"blocks": blocks})
    return jsonify({"blocks": blocks})


@app.route("/api/formats")
def api_formats():
    url = request.args.get("url")
    if not url:
        return jsonify({"formats": []})
    try:
        opts = dict(_YDL_RESOLVE_BASE, listformats=True)
        with YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
        fmts = []
        for f in (info.get("formats") or []):
            if f.get("vcodec") == "none" and f.get("acodec") != "none":
                fmts.append({
                    "id": f.get("format_id"),
                    "ext": f.get("ext"),
                    "abr": f.get("abr"),
                    "note": f.get("format_note") or "",
                })
        fmts.sort(key=lambda x: x.get("abr") or 0, reverse=True)
        return jsonify({"formats": fmts[:8]})
    except Exception as exc:
        return jsonify({"formats": [], "error": str(exc)})


# ---------------- Spotify config passthrough ----------------

@app.route("/api/config")
def api_config():
    cfg = load_config()
    # only expose what the frontend needs (never secrets beyond the public client id)
    return jsonify({
        "spotify_client_id": cfg.get("spotify_client_id", ""),
        "spotify_redirect": f"http://127.0.0.1:{PORT}/callback",
    })


# ---------------- accounts ----------------

def _norm_username(u):
    return (u or "").strip().lower()


@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json(force=True, silent=True) or {}
    username = _norm_username(data.get("username"))
    password = data.get("password") or ""
    if len(username) < 3 or len(username) > 24 or not username.replace("_", "").isalnum():
        return jsonify({"error": "Имя: 3-24 символа, буквы/цифры/_"}), 400
    if len(password) < 4:
        return jsonify({"error": "Пароль минимум 4 символа"}), 400
    pw_hash = generate_password_hash(password)
    try:
        with db() as conn:
            cur = conn.execute(
                "INSERT INTO users (username, pw_hash, library) VALUES (?,?,?)",
                (username, pw_hash, json.dumps(_DEFAULT_LIBRARY)),
            )
            conn.commit()
            uid = cur.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({"error": "Такое имя уже занято"}), 409
    session.permanent = True
    session["uid"] = uid
    return jsonify({"username": username})


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(force=True, silent=True) or {}
    username = _norm_username(data.get("username"))
    password = data.get("password") or ""
    with db() as conn:
        row = conn.execute("SELECT id, pw_hash FROM users WHERE username=?", (username,)).fetchone()
    if not row or not check_password_hash(row["pw_hash"], password):
        return jsonify({"error": "Неверное имя или пароль"}), 401
    session.permanent = True
    session["uid"] = row["id"]
    return jsonify({"username": username})


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/me")
def api_me():
    return jsonify({"user": current_user()})


# ---------------- per-user library persistence ----------------

@app.route("/api/library", methods=["GET", "POST"])
def api_library():
    user = current_user()
    if not user:
        return jsonify({"error": "auth required"}), 401

    if request.method == "GET":
        with db() as conn:
            row = conn.execute("SELECT library FROM users WHERE id=?", (user["id"],)).fetchone()
        try:
            data = json.loads(row["library"]) if row and row["library"] else {}
        except (TypeError, json.JSONDecodeError):
            data = {}
        for k, v in _DEFAULT_LIBRARY.items():
            data.setdefault(k, v)
        return jsonify(data)

    # POST: merge this user's library blob
    data = request.get_json(force=True, silent=True) or {}
    merged = dict(_DEFAULT_LIBRARY)
    if user:
        with db() as conn:
            row = conn.execute("SELECT library FROM users WHERE id=?", (user["id"],)).fetchone()
        try:
            existing = json.loads(row["library"]) if row and row["library"] else {}
            merged.update({k: existing.get(k, v) for k, v in _DEFAULT_LIBRARY.items()})
        except (TypeError, json.JSONDecodeError):
            pass
    for k in _DEFAULT_LIBRARY:
        if k in data:
            merged[k] = data[k]
    with db() as conn:
        conn.execute("UPDATE users SET library=? WHERE id=?",
                     (json.dumps(merged, ensure_ascii=False), user["id"]))
        conn.commit()
    return jsonify({"ok": True})


@app.route("/callback")
def callback():
    # Spotify redirects here after login; the frontend reads the URL hash/query.
    return send_from_directory(app.static_folder, "callback.html")


# ---------------- static ----------------

_MOBILE_UA = (
    "iphone", "ipod", "ipad", "android", "mobile", "webos",
    "blackberry", "iemobile", "opera mini",
)
MOBILE_DIR = os.path.join(BASE_DIR, "static", "mobile")


def _is_mobile_client():
    """Phone/tablet gets mobile UI; ?desktop=1 forces PC layout."""
    if request.args.get("desktop") == "1":
        return False
    if request.args.get("mobile") == "1":
        return True
    ua = (request.headers.get("User-Agent") or "").lower()
    return any(token in ua for token in _MOBILE_UA)


@app.route("/")
def index():
    if _is_mobile_client() and os.path.isfile(os.path.join(MOBILE_DIR, "index.html")):
        return send_from_directory(MOBILE_DIR, "index.html")
    return send_from_directory(app.static_folder, "index.html")


@app.route("/mobile/<path:filename>")
def mobile_static(filename):
    return send_from_directory(MOBILE_DIR, filename)


@app.route("/manifest.json")
def pwa_manifest():
    return send_from_directory(app.static_folder, "manifest.json", mimetype="application/manifest+json")


@app.route("/sw.js")
def service_worker():
    resp = send_from_directory(app.static_folder, "sw.js", mimetype="application/javascript")
    resp.headers["Cache-Control"] = "no-cache"
    return resp


PORT = int(os.environ.get("LANE_PORT", 8765))
HOST = os.environ.get("LANE_HOST", "0.0.0.0")  # 0.0.0.0 = reachable on LAN / via tunnel

init_db()

if __name__ == "__main__":
    local_url = f"http://127.0.0.1:{PORT}"
    # only auto-open a browser when bound locally / on this machine
    if os.environ.get("LANE_NO_BROWSER") != "1":
        threading.Timer(1.0, lambda: webbrowser.open(local_url)).start()
    print(f"SPOVO running at {local_url}  (host={HOST})")
    app.run(host=HOST, port=PORT, threaded=True)
