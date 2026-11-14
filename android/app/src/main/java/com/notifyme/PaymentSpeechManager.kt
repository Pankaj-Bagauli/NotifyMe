
package com.notifyme

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale
import java.util.concurrent.ConcurrentLinkedQueue

class PaymentSpeechManager(context: Context) {

    companion object {
        private const val TAG = "NotifyMeTTS"
    }

    private val appContext = context.applicationContext
    private var textToSpeech: TextToSpeech? = null
    private var isInitialized = false
    private var isReleased = false

    private val pendingMessages = ConcurrentLinkedQueue<String>()

    init {
        textToSpeech = TextToSpeech(appContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val engine = textToSpeech ?: return@TextToSpeech

                val result = engine.setLanguage(Locale("hi", "IN"))
                Log.i(TAG, "Hindi language result: $result")

                if (result != TextToSpeech.LANG_MISSING_DATA &&
                    result != TextToSpeech.LANG_NOT_SUPPORTED
                ) {
                    engine.setSpeechRate(0.95f)
                    engine.setPitch(1.0f)
                    isInitialized = true

                    Log.i(TAG, "Hindi TTS initialized")
                    speakPendingMessages()
                } else {
                    Log.w(TAG, "Hindi TTS language unavailable")
                }
            } else {
                Log.e(TAG, "TTS initialization failed")
            }
        }
    }

    @Synchronized
    fun announcePayment(amountPaise: Long) {
        if (isReleased || amountPaise <= 0L) return

        val amountRupees = amountPaise / 100L
        val amountPaisa = amountPaise % 100L

        val amountWords = buildString {
            append(numberToHindi(amountRupees))
            append(" रुपये")

            if (amountPaisa > 0) {
                append(" ")
                append(numberToHindi(amountPaisa))
                append(" पैसे")
            }
        }

        val message = "$amountWords प्राप्त हुए।"

        if (isInitialized) {
            speak(message)
        } else {
            pendingMessages.offer(message)
        }
    }

    @Synchronized
    private fun speakPendingMessages() {
        while (isInitialized && !isReleased) {
            val message = pendingMessages.poll() ?: break
            speak(message)
        }
    }

    private fun speak(message: String) {
    val engine = textToSpeech

    if (engine == null) {
        Log.e(TAG, "TTS engine is null")
        return
    }

    Log.i(TAG, "Speaking request: $message")

    val result = engine.speak(
        message,
        TextToSpeech.QUEUE_ADD,
        null,
        "payment_${System.nanoTime()}"
    )

    Log.i(TAG, "TTS speak() result: $result")
}

    private fun numberToHindi(number: Long): String {
        if (number == 0L) return "शून्य"
        if (number < 0L) return "माइनस ${numberToHindi(-number)}"

        val units = arrayOf(
            "", "एक", "दो", "तीन", "चार", "पाँच",
            "छह", "सात", "आठ", "नौ", "दस",
            "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह",
            "सोलह", "सत्रह", "अठारह", "उन्नीस", "बीस",
            "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस",
            "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस", "तीस",
            "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस",
            "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस", "चालीस",
            "इकतालीस", "बयालीस", "तैंतालीस", "चवालीस", "पैंतालीस",
            "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास", "पचास",
            "इक्यावन", "बावन", "तिरेपन", "चौवन", "पचपन",
            "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ", "साठ",
            "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ",
            "छियासठ", "सड़सठ", "अड़सठ", "उनहत्तर", "सत्तर",
            "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर",
            "छिहत्तर", "सतहत्तर", "अठहत्तर", "उनासी", "अस्सी",
            "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी",
            "छियासी", "सत्तासी", "अट्ठासी", "नवासी", "नब्बे",
            "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पचानवे",
            "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे"
        )

        if (number < 100) {
            return units[number.toInt()]
        }

        val scales = listOf(
            1_00_00_00_000L to "अरब",
            1_00_00_000L to "करोड़",
            1_00_000L to "लाख",
            1_000L to "हज़ार",
            100L to "सौ"
        )

        var remaining = number
        val parts = mutableListOf<String>()

        for ((value, label) in scales) {
            if (remaining >= value) {
                val quotient = remaining / value
                parts.add("${numberToHindi(quotient)} $label")
                remaining %= value
            }
        }

        if (remaining > 0) {
            parts.add(numberToHindi(remaining))
        }

        return parts.joinToString(" ")
    }

    @Synchronized
    fun release() {
        if (isReleased) return

        isReleased = true
        isInitialized = false
        pendingMessages.clear()

        textToSpeech?.stop()
        textToSpeech?.shutdown()
        textToSpeech = null
    }
}
