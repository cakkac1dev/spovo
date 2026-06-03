package com.spovo.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.IBinder
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle
import androidx.media.session.MediaButtonReceiver
import java.net.URL
import java.util.concurrent.Executors

class PlaybackService : android.app.Service() {

    companion object {
        const val CHANNEL_ID = "spovo_playback"
        const val NOTIF_ID = 42

        const val ACTION_UPDATE = "com.spovo.app.UPDATE"
        const val ACTION_TOGGLE = "com.spovo.app.TOGGLE"
        const val ACTION_NEXT = "com.spovo.app.NEXT"
        const val ACTION_PREV = "com.spovo.app.PREV"
        const val ACTION_STOP = "com.spovo.app.STOP"

        const val EX_TITLE = "title"
        const val EX_ARTIST = "artist"
        const val EX_ART = "art"
        const val EX_PLAYING = "playing"
        const val EX_DURATION = "duration"
        const val EX_POSITION = "position"
    }

    private lateinit var session: MediaSessionCompat
    private val io = Executors.newSingleThreadExecutor()

    private var title = "SPOVO"
    private var artist = ""
    private var playing = false
    private var durationMs = 0L
    private var positionMs = 0L
    private var artUrl = ""
    private var artBitmap: Bitmap? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createChannel()
        session = MediaSessionCompat(this, "SPOVO").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() = control("toggle")
                override fun onPause() = control("toggle")
                override fun onSkipToNext() = control("next")
                override fun onSkipToPrevious() = control("prev")
                override fun onStop() = control("toggle")
                override fun onSeekTo(pos: Long) = control("seek:$pos")
            })
            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_UPDATE -> {
                title = intent.getStringExtra(EX_TITLE) ?: "SPOVO"
                artist = intent.getStringExtra(EX_ARTIST) ?: ""
                playing = intent.getBooleanExtra(EX_PLAYING, false)
                durationMs = intent.getLongExtra(EX_DURATION, 0L)
                positionMs = intent.getLongExtra(EX_POSITION, 0L)
                val newArt = intent.getStringExtra(EX_ART) ?: ""
                if (newArt != artUrl) { artUrl = newArt; artBitmap = null; loadArt(newArt) }
                pushSession()
                showNotification()
            }
            ACTION_TOGGLE -> control("toggle")
            ACTION_NEXT -> control("next")
            ACTION_PREV -> control("prev")
            ACTION_STOP -> {
                control("toggle")
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            else -> MediaButtonReceiver.handleIntent(session, intent)
        }
        return START_NOT_STICKY
    }

    private fun control(cmd: String) {
        MainActivity.current?.runControl(cmd)
    }

    private fun pushSession() {
        val meta = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, durationMs)
        artBitmap?.let { meta.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, it) }
        session.setMetadata(meta.build())

        val state = if (playing) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
        session.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setActions(
                    PlaybackStateCompat.ACTION_PLAY or
                        PlaybackStateCompat.ACTION_PAUSE or
                        PlaybackStateCompat.ACTION_PLAY_PAUSE or
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                        PlaybackStateCompat.ACTION_SEEK_TO or
                        PlaybackStateCompat.ACTION_STOP
                )
                .setState(state, positionMs, if (playing) 1f else 0f)
                .build()
        )
    }

    private fun showNotification() {
        val contentIntent = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java)
                .setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE
        )
        val playIcon = if (playing) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play
        val playLabel = if (playing) "Пауза" else "Играть"

        val notif: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_spovo)
            .setContentTitle(title)
            .setContentText(artist)
            .setLargeIcon(artBitmap)
            .setContentIntent(contentIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(playing)
            .setShowWhen(false)
            .addAction(android.R.drawable.ic_media_previous, "Назад", action(ACTION_PREV))
            .addAction(playIcon, playLabel, action(ACTION_TOGGLE))
            .addAction(android.R.drawable.ic_media_next, "Вперёд", action(ACTION_NEXT))
            .setStyle(
                MediaStyle()
                    .setMediaSession(session.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )
            .build()

        startForeground(NOTIF_ID, notif)
        if (!playing) stopForeground(STOP_FOREGROUND_DETACH)
    }

    private fun action(act: String): PendingIntent {
        val i = Intent(this, PlaybackService::class.java).setAction(act)
        return PendingIntent.getService(
            this, act.hashCode(), i,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    private fun loadArt(url: String) {
        if (url.isBlank()) return
        io.execute {
            try {
                val bmp = URL(url).openStream().use { BitmapFactory.decodeStream(it) }
                if (bmp != null && artUrl == url) {
                    artBitmap = bmp
                    pushSession()
                    showNotification()
                }
            } catch (_: Exception) {}
        }
    }

    private fun createChannel() {
        val ch = NotificationChannel(
            CHANNEL_ID, "Воспроизведение", NotificationManager.IMPORTANCE_LOW
        ).apply {
            setShowBadge(false)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
    }

    override fun onDestroy() {
        session.isActive = false
        session.release()
        io.shutdownNow()
        super.onDestroy()
    }
}
