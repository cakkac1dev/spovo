package com.spovo.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.SafeBrowsingResponse
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    companion object {
        // Адрес твоего сервера SPOVO. Меняешь домен — меняешь только эту строку.
        private const val START_URL = "https://spovo.xyz/"

        // ссылка на активную Activity, чтобы сервис мог слать команды в WebView
        @Volatile var current: MainActivity? = null
    }

    private lateinit var webView: WebView
    private lateinit var offline: OfflineStore
    private val dlPool = Executors.newFixedThreadPool(2)

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        current = this
        offline = OfflineStore(this, START_URL)

        // разрешение на показ медиа-уведомления (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#09090b"))
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
                userAgentString = "$userAgentString SPOVOApp/1.2"
                safeBrowsingEnabled = false
            }
            addJavascriptInterface(NativeBridge(), "SpovoNative")
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView, request: WebResourceRequest
                ): Boolean = false

                override fun shouldInterceptRequest(
                    view: WebView, request: WebResourceRequest
                ): WebResourceResponse? {
                    val uri = request.url
                    when (uri.path) {
                        "/api/stream" -> {
                            val id = uri.getQueryParameter("url") ?: return null
                            if (!offline.has(id)) return null   // нет локально — обычный стрим
                            return offline.audioResponse(id, request.requestHeaders["Range"])
                        }
                        "/api/offline-art" -> {
                            val id = uri.getQueryParameter("url") ?: return null
                            return offline.artResponse(id)
                        }
                    }
                    return null
                }

                override fun onSafeBrowsingHit(
                    view: WebView, request: WebResourceRequest,
                    threatType: Int, callback: SafeBrowsingResponse
                ) {
                    // свой сервер — проходим мимо ложного предупреждения, без репорта
                    callback.proceed(false)
                }

                override fun onPageFinished(view: WebView, url: String?) {
                    view.evaluateJavascript(BRIDGE_JS, null)
                }
            }
            webChromeClient = WebChromeClient()
        }

        setContentView(webView)

        if (savedInstanceState == null) webView.loadUrl(START_URL)
        else webView.restoreState(savedInstanceState)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else moveTaskToBack(true)
            }
        })
    }

    /** Выполнить команду плеера в WebView (зовёт сервис из уведомления/локскрина). */
    fun runControl(cmd: String) {
        runJs("window.__spovoControl && window.__spovoControl(${jsString(cmd)});")
    }

    fun runJs(js: String) {
        webView.post { webView.evaluateJavascript(js, null) }
    }

    private fun jsString(s: String) = "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

    /** Мост JS → нативка: веб-плеер сообщает, что и как играет. */
    inner class NativeBridge {
        @JavascriptInterface
        fun update(
            title: String, artist: String, artUrl: String,
            playing: Boolean, durationMs: Long, positionMs: Long
        ) {
            val intent = Intent(this@MainActivity, PlaybackService::class.java).apply {
                action = PlaybackService.ACTION_UPDATE
                putExtra(PlaybackService.EX_TITLE, title)
                putExtra(PlaybackService.EX_ARTIST, artist)
                putExtra(PlaybackService.EX_ART, artUrl)
                putExtra(PlaybackService.EX_PLAYING, playing)
                putExtra(PlaybackService.EX_DURATION, durationMs)
                putExtra(PlaybackService.EX_POSITION, positionMs)
            }
            try {
                ContextCompat.startForegroundService(this@MainActivity, intent)
            } catch (_: Exception) {
                // на Android 12+ старт FGS из фона может быть запрещён — звук при этом не прерывается
            }
        }

        /** Список скачанного (JSON-массив) для веб-интерфейса. */
        @JavascriptInterface
        fun downloads(): String = offline.listJson()

        @JavascriptInterface
        fun isDownloaded(id: String): Boolean = offline.has(id)

        /** Скачать трек в офлайн. Прогресс прилетает в window.__spovoDl(id, pct). */
        @JavascriptInterface
        fun download(
            id: String, quality: String, title: String, artist: String,
            source: String, durationSec: Double, artUrl: String
        ) {
            if (offline.has(id)) { runJs("window.__spovoDl && window.__spovoDl(${jsString(id)}, 100);"); return }
            dlPool.execute {
                offline.download(id, quality, title, artist, source, durationSec, artUrl) { pct ->
                    runJs("window.__spovoDl && window.__spovoDl(${jsString(id)}, $pct);")
                }
            }
        }

        @JavascriptInterface
        fun removeDownload(id: String) {
            offline.remove(id)
            runJs("window.__spovoDl && window.__spovoDl(${jsString(id)}, -2);")
        }

        @JavascriptInterface
        fun clearDownloads() { offline.clearAll() }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        current = this
        webView.onResume()
    }

    // намеренно НЕ вызываем webView.onPause() — чтобы музыка играла в фоне

    override fun onDestroy() {
        if (current === this) current = null
        dlPool.shutdownNow()
        webView.destroy()
        super.onDestroy()
    }
}

// JS-мост, внедряется в страницу после загрузки. Цепляется к <audio id="audio">
// и кнопкам плеера (#play/#prev/#next), шлёт состояние в нативку, принимает команды.
private const val BRIDGE_JS = """
(function(){
  function init(){
    if (window.__spovoBridge) return;
    var audio = document.getElementById('audio');
    if (!audio) { setTimeout(init, 800); return; }
    window.__spovoBridge = true;
    var lastPush = 0;
    function meta(){
      var tn = document.getElementById('np-title');
      var an = document.getElementById('np-artist');
      var im = document.getElementById('np-art');
      var t = tn && tn.textContent ? tn.textContent.trim() : 'SPOVO';
      if (!t || t === '—') t = 'SPOVO';
      var a = an && an.textContent ? an.textContent.trim() : '';
      var art = (im && im.getAttribute('src')) || '';
      if (art && art.indexOf('http') !== 0 && art.indexOf('//') !== 0) {
        try { art = new URL(art, location.href).href; } catch(e){}
      }
      return { title: t, artist: a, art: art };
    }
    function push(force){
      var now = Date.now();
      if (!force && now - lastPush < 1000) return;
      lastPush = now;
      try {
        var m = meta();
        SpovoNative.update(
          m.title, m.artist, m.art, !audio.paused,
          isFinite(audio.duration) ? Math.round(audio.duration * 1000) : 0,
          Math.round((audio.currentTime || 0) * 1000)
        );
      } catch(e){}
    }
    ['play','pause','ended','loadedmetadata'].forEach(function(ev){
      audio.addEventListener(ev, function(){ push(true); });
    });
    audio.addEventListener('timeupdate', function(){ push(false); });
    var tn = document.getElementById('np-title');
    if (tn) new MutationObserver(function(){ push(true); })
              .observe(tn, { childList:true, subtree:true, characterData:true });
    window.__spovoControl = function(cmd){
      try {
        if (cmd === 'toggle') { var b=document.getElementById('play'); b && b.click(); }
        else if (cmd === 'next') { var n=document.getElementById('next'); n && n.click(); }
        else if (cmd === 'prev') { var p=document.getElementById('prev'); p && p.click(); }
        else if (cmd.indexOf('seek:') === 0) { audio.currentTime = parseFloat(cmd.slice(5)) / 1000; }
      } catch(e){}
      setTimeout(function(){ push(true); }, 150);
    };
    push(true);
  }
  init();
})();
"""
