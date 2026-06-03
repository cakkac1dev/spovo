package com.spovo.app

import android.content.Context
import android.webkit.WebResourceResponse
import org.json.JSONObject
import java.io.File
import java.io.FilterInputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest

/**
 * Хранилище скачанных треков для офлайна.
 *   filesDir/offline/<key>.audio  — аудио
 *   filesDir/offline/<key>.jpg    — обложка (по возможности)
 *   filesDir/offline/<key>.json   — метаданные
 * key = sha1(id), где id — это значение ?url= из /api/stream.
 */
class OfflineStore(context: Context, private val baseUrl: String) {

    private val dir = File(context.filesDir, "offline").apply { mkdirs() }

    private fun key(id: String): String {
        val md = MessageDigest.getInstance("SHA-1").digest(id.toByteArray())
        return md.joinToString("") { "%02x".format(it) }
    }

    private fun audioFile(id: String) = File(dir, key(id) + ".audio")
    private fun artFile(id: String) = File(dir, key(id) + ".jpg")
    private fun metaFile(id: String) = File(dir, key(id) + ".json")

    fun has(id: String) = metaFile(id).exists() && audioFile(id).exists()

    /** Список скачанного в виде JSON-массива (для веб-интерфейса). */
    fun listJson(): String {
        val items = dir.listFiles { f -> f.name.endsWith(".json") }
            ?.mapNotNull { runCatching { JSONObject(it.readText()) }.getOrNull() }
            ?.sortedByDescending { it.optLong("ts") }
            ?: emptyList()
        return items.joinToString(prefix = "[", postfix = "]", separator = ",") { it.toString() }
    }

    fun remove(id: String) {
        audioFile(id).delete(); artFile(id).delete(); metaFile(id).delete()
    }

    fun clearAll() { dir.listFiles()?.forEach { it.delete() } }

    fun totalBytes(): Long = dir.listFiles()?.sumOf { it.length() } ?: 0L

    /**
     * Скачать трек. progress(pct) — 0..100, либо -1 при ошибке.
     */
    fun download(
        id: String, quality: String, title: String, artist: String,
        source: String, durationSec: Double, artUrl: String,
        progress: (Int) -> Unit
    ) {
        val tmp = File(dir, key(id) + ".part")
        try {
            val streamUrl = baseUrl.trimEnd('/') +
                "/api/stream?url=" + enc(id) + "&quality=" + enc(quality)
            val conn = (URL(streamUrl).openConnection() as HttpURLConnection).apply {
                connectTimeout = 20000; readTimeout = 30000; instanceFollowRedirects = true
            }
            conn.connect()
            if (conn.responseCode !in 200..299) throw Exception("HTTP ${conn.responseCode}")
            val mime = conn.contentType ?: "audio/mpeg"
            val total = conn.contentLengthLong
            conn.inputStream.use { input ->
                tmp.outputStream().use { out ->
                    val buf = ByteArray(64 * 1024)
                    var done = 0L; var n: Int; var lastPct = -1
                    while (input.read(buf).also { n = it } >= 0) {
                        out.write(buf, 0, n); done += n
                        if (total > 0) {
                            val pct = ((done * 100) / total).toInt().coerceIn(0, 99)
                            if (pct != lastPct) { lastPct = pct; progress(pct) }
                        }
                    }
                }
            }
            if (!tmp.renameTo(audioFile(id))) { tmp.copyTo(audioFile(id), overwrite = true); tmp.delete() }

            // обложка — best effort
            if (artUrl.isNotBlank()) runCatching {
                URL(artUrl).openStream().use { inp -> artFile(id).outputStream().use { inp.copyTo(it) } }
            }

            val meta = JSONObject().apply {
                put("id", id); put("title", title); put("artist", artist)
                put("source", source); put("duration", durationSec); put("quality", quality)
                put("mime", mime); put("size", audioFile(id).length())
                put("art", artFile(id).exists()); put("ts", System.currentTimeMillis())
            }
            metaFile(id).writeText(meta.toString())
            progress(100)
        } catch (e: Exception) {
            tmp.delete()
            progress(-1)
        }
    }

    private fun meta(id: String): JSONObject? =
        runCatching { JSONObject(metaFile(id).readText()) }.getOrNull()

    /** Ответ для аудио с поддержкой Range (перемотка). null — если нет файла. */
    fun audioResponse(id: String, rangeHeader: String?): WebResourceResponse? {
        if (!has(id)) return null
        val file = audioFile(id)
        val mime = meta(id)?.optString("mime", "audio/mpeg") ?: "audio/mpeg"
        val len = file.length()

        if (rangeHeader == null || !rangeHeader.startsWith("bytes=")) {
            val headers = mapOf("Accept-Ranges" to "bytes", "Content-Length" to len.toString())
            return WebResourceResponse(mime.substringBefore(';'), null, 200, "OK", headers, file.inputStream())
        }

        val spec = rangeHeader.removePrefix("bytes=").split("-")
        val start = spec.getOrNull(0)?.toLongOrNull() ?: 0L
        val end = spec.getOrNull(1)?.toLongOrNull()?.coerceAtMost(len - 1) ?: (len - 1)
        if (start > end || start >= len) {
            return WebResourceResponse(
                mime.substringBefore(';'), null, 416, "Range Not Satisfiable",
                mapOf("Content-Range" to "bytes */$len"), null
            )
        }
        val sliceLen = end - start + 1
        val stream = file.inputStream().apply { skip(start) }.limited(sliceLen)
        val headers = mapOf(
            "Accept-Ranges" to "bytes",
            "Content-Range" to "bytes $start-$end/$len",
            "Content-Length" to sliceLen.toString()
        )
        return WebResourceResponse(mime.substringBefore(';'), null, 206, "Partial Content", headers, stream)
    }

    fun artResponse(id: String): WebResourceResponse? {
        val f = artFile(id)
        if (!f.exists()) return null
        return WebResourceResponse("image/jpeg", null, f.inputStream())
    }

    private fun enc(s: String) = URLEncoder.encode(s, "UTF-8")
}

/** Ограничивает поток N байтами (для отдачи куска при Range-запросе). */
private fun InputStream.limited(limit: Long): InputStream = object : FilterInputStream(this) {
    private var remaining = limit
    override fun read(): Int {
        if (remaining <= 0) return -1
        val b = super.read(); if (b >= 0) remaining--; return b
    }
    override fun read(b: ByteArray, off: Int, len: Int): Int {
        if (remaining <= 0) return -1
        val n = super.read(b, off, minOf(len.toLong(), remaining).toInt())
        if (n > 0) remaining -= n
        return n
    }
    override fun available(): Int = minOf(super.available().toLong(), remaining).toInt()
}
