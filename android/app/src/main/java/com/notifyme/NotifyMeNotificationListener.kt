
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
    }

    private val storageExecutor = Executors.newSingleThreadExecutor()

    private lateinit var paymentStorage: EncryptedPaymentStorage
    private lateinit var speechManager: PaymentSpeechManager

    override fun onCreate() {
        super.onCreate()

        paymentStorage = EncryptedPaymentStorage(applicationContext)
        speechManager = PaymentSpeechManager(applicationContext)
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.i(TAG, "Notification Listener connected")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)

        if (sbn.packageName != GOOGLE_PAY_PACKAGE) return

        val title = sbn.notification.extras
            .getCharSequence("android.title")
            ?.toString()
            ?.trim()

        if (title.isNullOrBlank()) {
            Log.i(TAG, "Empty Google Pay notification ignored")
            return
        }

        val match = PAYMENT_REGEX.find(title)

        if (match == null) {
            Log.i(TAG, "No supported payment pattern found")
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

        val eventId = sha256("${sbn.key}|${sbn.postTime}")

        val record = PaymentRecord(
            eventId = eventId,
            amountPaise = amountPaise,
            sender = sender,
            receivedAtMillis = sbn.postTime
        )

        storageExecutor.execute {
            try {
                val saved = paymentStorage.savePayment(record)

                if (saved) {
                    Log.i(TAG, "Payment record saved securely")

                    PaymentEventModule.emitPaymentSaved(applicationContext)
                    Log.i(TAG, "PaymentSaved event emitted")

                    // Announce only after successfully saving the payment.
                    speechManager.announcePayment(amountPaise)
                } else {
                    Log.i(TAG, "Duplicate notification event ignored")
                }

            } catch (error: Exception) {
                Log.e(TAG, "Payment processing failed", error)
            }
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
        storageExecutor.shutdown()

        if (::speechManager.isInitialized) {
            speechManager.release()
        }

        super.onDestroy()
    }
}
