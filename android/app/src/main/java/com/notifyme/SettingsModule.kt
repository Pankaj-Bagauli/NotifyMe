
package com.notifyme

import android.content.Intent
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale

class SettingsModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "NotifyMeSettings"
        private const val PREFS_NAME = "notifyme_settings"
        private const val KEY_VOICE_ENABLED = "voice_enabled"
        private const val DEFAULT_VOICE_ENABLED = true
    }

    private val preferences by lazy {
        reactContext.getSharedPreferences(
            PREFS_NAME,
            android.content.Context.MODE_PRIVATE
        )
    }

    private var testTts: TextToSpeech? = null

    override fun getName(): String = "NotifyMeSettings"

    // Read saved voice preference
    @ReactMethod
    fun getVoiceEnabled(promise: Promise) {
        try {
            val enabled = preferences.getBoolean(
                KEY_VOICE_ENABLED,
                DEFAULT_VOICE_ENABLED
            )

            promise.resolve(enabled)
        } catch (error: Exception) {
            Log.e(TAG, "Unable to read voice preference", error)

            promise.reject(
                "VOICE_PREFERENCE_ERROR",
                "Unable to read voice preference.",
                error
            )
        }
    }

    // Save voice preference
    @ReactMethod
    fun setVoiceEnabled(enabled: Boolean, promise: Promise) {
        try {
            val saved = preferences.edit()
                .putBoolean(KEY_VOICE_ENABLED, enabled)
                .commit()

            if (!saved) {
                throw IllegalStateException("Unable to persist voice preference.")
            }

            Log.i(TAG, "Voice preference updated: $enabled")
            promise.resolve(true)

        } catch (error: Exception) {
            Log.e(TAG, "Unable to save voice preference", error)

            promise.reject(
                "VOICE_PREFERENCE_ERROR",
                "Unable to save voice preference.",
                error
            )
        }
    }

    // Check notification access permission
    @ReactMethod
    fun isNotificationAccessEnabled(promise: Promise) {
        try {
            val enabledListeners = Settings.Secure.getString(
                reactContext.contentResolver,
                "enabled_notification_listeners"
            )

            val componentName = android.content.ComponentName(
                reactContext,
                NotifyMeNotificationListener::class.java
            )

            val enabled = enabledListeners
                ?.split(":")
                ?.any {
                    it.equals(componentName.flattenToString(), true)
                }
                ?: false

            promise.resolve(enabled)

        } catch (error: Exception) {
            Log.e(TAG, "Unable to check notification access", error)

            promise.reject(
                "NOTIFICATION_ACCESS_ERROR",
                "Unable to check notification access.",
                error
            )
        }
    }

    // Open Android notification access settings
    @ReactMethod
    fun openNotificationSettings(promise: Promise) {
        try {
            val intent = Intent(
                Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            reactContext.startActivity(intent)
            promise.resolve(true)

        } catch (error: Exception) {
            Log.e(TAG, "Unable to open notification settings", error)

            promise.reject(
                "NOTIFICATION_SETTINGS_ERROR",
                "Unable to open notification settings.",
                error
            )
        }
    }

    // Play a Hindi test announcement without creating a payment record
    @ReactMethod
    fun testVoice(promise: Promise) {
        try {
            testTts?.stop()
            testTts?.shutdown()
            testTts = null

            val engine = TextToSpeech(
                reactContext.applicationContext
            ) { status ->

                if (status != TextToSpeech.SUCCESS) {
                    Log.e(TAG, "Test TTS initialization failed: $status")

                    releaseTestTts(testTts)

                    promise.reject(
                        "TEST_VOICE_ERROR",
                        "Unable to initialize text-to-speech."
                    )
                    return@TextToSpeech
                }

                val currentEngine = testTts

                if (currentEngine == null) {
                    promise.reject(
                        "TEST_VOICE_ERROR",
                        "Test voice engine is unavailable."
                    )
                    return@TextToSpeech
                }

                try {
                    val languageResult = currentEngine.setLanguage(
                        Locale("hi", "IN")
                    )

                    if (
                        languageResult == TextToSpeech.LANG_MISSING_DATA ||
                        languageResult == TextToSpeech.LANG_NOT_SUPPORTED
                    ) {
                        Log.e(TAG, "Hindi TTS language unavailable")

                        releaseTestTts(currentEngine)

                        promise.reject(
                            "TEST_VOICE_LANGUAGE_ERROR",
                            "Hindi voice is not available on this device."
                        )
                        return@TextToSpeech
                    }

                    currentEngine.setSpeechRate(0.95f)
                    currentEngine.setPitch(1.0f)

                    currentEngine.setOnUtteranceProgressListener(
                        object : UtteranceProgressListener() {

                            override fun onStart(utteranceId: String?) {
                                Log.i(TAG, "Test voice started")
                            }

                            override fun onDone(utteranceId: String?) {
                                Log.i(TAG, "Test voice completed")
                                releaseTestTts(currentEngine)
                            }

                            override fun onError(utteranceId: String?) {
                                Log.e(TAG, "Test voice playback failed")
                                releaseTestTts(currentEngine)
                            }

                            override fun onError(
                                utteranceId: String?,
                                errorCode: Int
                            ) {
                                Log.e(
                                    TAG,
                                    "Test voice error: $errorCode"
                                )
                                releaseTestTts(currentEngine)
                            }
                        }
                    )

                    val result = currentEngine.speak(
                        "नमस्ते! NotifyMe की आवाज़ सही से काम कर रही है।",
                        TextToSpeech.QUEUE_FLUSH,
                        null,
                        "notifyme_test_voice"
                    )

                    if (result == TextToSpeech.ERROR) {
                        releaseTestTts(currentEngine)

                        promise.reject(
                            "TEST_VOICE_PLAYBACK_ERROR",
                            "Unable to play the test announcement."
                        )
                    } else {
                        Log.i(TAG, "Test voice request accepted")
                        promise.resolve(true)
                    }

                } catch (error: Exception) {
                    Log.e(TAG, "Test voice playback error", error)
                    releaseTestTts(currentEngine)

                    promise.reject(
                        "TEST_VOICE_ERROR",
                        "Unable to play test voice.",
                        error
                    )
                }
            }

            testTts = engine

        } catch (error: Exception) {
            Log.e(TAG, "Test voice initialization error", error)

            promise.reject(
                "TEST_VOICE_ERROR",
                "Unable to initialize test voice.",
                error
            )
        }
    }

    private fun releaseTestTts(engine: TextToSpeech?) {
        if (engine != null && testTts === engine) {
            testTts = null
            engine.shutdown()
        }
    }
}
