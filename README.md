# 🎵 SPOVO — self-hosted music streaming

A Spotify-style music streaming service you run yourself. Search and stream from
**YouTube Music** and **SoundCloud** in one place, build playlists, get a personal
radio ("Моя волна"), and listen on desktop, mobile web, or an installable PWA /
Android app — all backed by a single Python server.

> Personal project. Built to learn full-stack audio streaming, PWA packaging and
> self-hosting end-to-end.

## ✨ Features

- 🔎 **Unified search** across YouTube Music + SoundCloud (via `yt-dlp`, no API key)
- ▶️ **Full streaming** with a dark, Spotify-like player UI
- 📻 **"Моя волна"** personal radio powered by `ytmusicapi`
- 📚 **Accounts** — register/login, per-user library, playlists, favorites, history
- 🎚️ Equalizer, play queue, listening history
- 📱 **One URL, two UIs** — desktop and mobile layouts auto-detected (`?mobile=1` / `?desktop=1` to force)
- 💾 **Installable PWA** (manifest + service worker) and a WebView **Android app** (`android-app/`)
- 🔐 Sessions via signed cookies; passwords hashed with Werkzeug

## 🧱 Tech stack

| Layer | Tech |
|-------|------|
| Backend | Python, Flask, `yt-dlp`, `ytmusicapi` |
| Storage | SQLite (accounts), JSON (library) |
| Frontend | Vanilla JS, HTML, CSS (no framework) |
| Packaging | PWA (service worker), Android WebView (Gradle) |

## 🚀 Run locally

```bash
# 1. install dependencies
pip install flask yt-dlp ytmusicapi werkzeug

# 2. start the server
python server.py

# 3. open the app
#    http://localhost:8765
```

The same URL serves the desktop UI on a computer and the mobile UI on a phone.

### Configuration

Optional Spotify metadata enrichment:

```bash
cp config.example.json config.json
# then put your Spotify client id into config.json
```

The session secret (`.secret`), the accounts DB (`users.db`) and your library
(`data.json`) are created automatically on first run and are **git-ignored**.

## 📡 Sharing over the internet

For a quick demo you can expose the local server with a tunnel
(e.g. `ngrok http 8765`) and send the link to a friend — they open it, register,
and listen. For a permanent setup, see the deploy notes below.

## 🖥️ Deploy to a VPS

A reference setup lives in [`deploy/setup.sh`](deploy/setup.sh). The short version:

```bash
# on the server
sudo apt update && sudo apt install -y python3-pip
pip3 install flask yt-dlp ytmusicapi werkzeug
# copy the project to /opt/spovo, then run server.py under systemd
# put Nginx in front for HTTPS on port 80/443 -> 8765
```

## 📁 Project layout

```
spovo/
├── server.py              # Flask backend: search, streaming, accounts, radio
├── config.example.json    # optional Spotify client id template
├── data.example.json      # empty library seed (favorites/playlists/history)
├── static/                # desktop UI (index.html, app.js, style.css)
│   ├── mobile/            # mobile UI
│   ├── icons/             # PWA icons
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # service worker
├── android-app/           # Android WebView wrapper (Gradle)
└── deploy/setup.sh        # VPS deployment reference
```

## ⚖️ Disclaimer

Built for personal/educational use. Streaming pulls from third-party sources via
`yt-dlp`; respect the terms of service and copyright laws in your country.
