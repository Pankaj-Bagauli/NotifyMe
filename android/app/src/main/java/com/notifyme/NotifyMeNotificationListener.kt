
package com.notifyme

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import java.math.BigDecimal
import java.security.MessageDigest
import java.util.concurrent.Executors

class NotifyMeNotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "NotifyMeListener"

        private const val GOOGLE_PAY_PACKAGE =
            "com.google.android.apps.nbu.paisa.user"

        private val PAYMENT_REGEX = Regex(
            """(?i)^(.*?)\bpaid you\b.*?₹\s*([0-9,]+(?:\.[0-9]{1,2})?)"""
        )

        @Volatile
        private var instance: NotifyMeNotificationListener? = null

        fun refreshActiveNotifications(
            onComplete: () -> Unit
        ): Boolean {
            val service = instance ?: return false
            service.scanActiveNotifications(onComplete)
            return true
        }
    }

    private val storageExecutor = Executors.newSingleThreadExecutor()

    private lateinit var paymentStorage: EncryptedPaymentStorage
    private lateinit var speechManager: PaymentSpeechManager

    override fun onCreate() {
        super.onCreate()

        instance = this
        paymentStorage = EncryptedPaymentStorage(applicationContext)
        speechManager = PaymentSpeechManager(applicationContext)
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        instance = this
        Log.i(TAG, "Notification Listener connected")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)

        if (sbn.packageName != GOOGLE_PAY_PACKAGE) return

        storageExecutor.execute {
            processPaymentNotification(sbn, announce = true)
        }
    }

    private fun scanActiveNotifications(onComplete: () -> Unit) {
        val activeNotifications = try {
            activeNotifications ?: emptyArray()
        } catch (error: Exception) {
            Log.e(TAG, "Unable to fetch active notifications", error)
            onComplete()
            return
        }

        storageExecutor.execute {
            try {
                val googlePayNotifications = activeNotifications.filter {
                    it.packageName == GOOGLE_PAY_PACKAGE
                }

                Log.i(
                    TAG,
                    "Manual refresh: scanning ${googlePayNotifications.size} active Google Pay notifications"
                )

                googlePayNotifications.forEach { notification ->
                    processPaymentNotification(
                        notification,
                        announce = false
                    )
                }

                Log.i(TAG, "Active notification scan completed")

            } catch (error: Exception) {
                Log.e(TAG, "Active notification scan failed", error)
            } finally {
                onComplete()
            }
        }
    }

    private fun processPaymentNotification(
        sbn: StatusBarNotification,
        announce: Boolean
    ) {
        try {
            val title = sbn.notification.extras
                .getCharSequence("android.title")
                ?.toString()
                ?.trim()

            if (title.isNullOrBlank()) {
                return
            }

            val match = PAYMENT_REGEX.find(title)

            if (match == null) {
                return
            }

            val sender = match.groupValues[1].trim()
                .ifBlank { "Unknown" }

            val amount = match.groupValues[2]
                .replace(",", "")
                .toBigDecimalOrNull()

            if (amount == null || amount <= BigDecimal.ZERO) {
                Log.w(TAG, "Invalid payment amount")
                return
            }

            val amountPaise = try {
                amount.movePointRight(2).longValueExact()
            } catch (error: ArithmeticException) {
                Log.w(TAG, "Invalid payment precision")
                return
            }

            val eventId = sha256(sbn.key)

            val record = PaymentRecord(
                eventId = eventId,
                amountPaise = amountPaise,
                sender = sender,
                receivedAtMillis = sbn.postTime
            )

            val saved = paymentStorage.savePayment(record)

            if (!saved) {
                Log.i(TAG, "Duplicate notification event ignored")
                return
            }

            Log.i(TAG, "Payment record saved securely")

            PaymentEventModule.emitPaymentSaved(applicationContext)

            if (announce) {
                val voiceEnabled = getSharedPreferences(
                    "notifyme_settings",
                    MODE_PRIVATE
                ).getBoolean("voice_enabled", true)

                if (voiceEnabled) {
                    speechManager.announcePayment(amountPaise)
                } else {
                    Log.i(TAG, "Voice announcements disabled. Skipping speech.")
                }
            } else {
                Log.i(
                    TAG,
                    "Payment recovered by manual refresh. Voice announcement skipped."
                )
            }

        } catch (error: Exception) {
            Log.e(TAG, "Payment processing failed", error)
        }
    }

    private fun sha256(value: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(value.toByteArray(Charsets.UTF_8))

        return digest.joinToString("") {
            "%02x".format(it.toInt() and 0xff)
        }
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w(TAG, "Notification Listener disconnected")
    }

    override fun onDestroy() {
        if (instance === this) {
            instance = null
        }

        storageExecutor.shutdown()

        if (::speechManager.isInitialized) {
            speechManager.release()
        }

        super.onDestroy()
    }
}
