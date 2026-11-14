
package com.notifyme

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.Executors

class PaymentStorageModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val storage = EncryptedPaymentStorage(reactContext)
    private val executor = Executors.newSingleThreadExecutor()

    override fun getName(): String = "PaymentStorage"

    @ReactMethod
    fun getPayments(promise: Promise) {
        executor.execute {
            try {
                val payments = storage.getPayments()
                val result = Arguments.createArray()

                payments.forEach { payment ->
                    val item = Arguments.createMap().apply {
                        putString("id", payment.eventId)
                        putString("eventId", payment.eventId)
                        putDouble(
                            "amountPaise",
                            payment.amountPaise.toDouble()
                        )
                        putString("sender", payment.sender)
                        putDouble(
                            "receivedAtMillis",
                            payment.receivedAtMillis.toDouble()
                        )
                    }

                    result.pushMap(item)
                }

                promise.resolve(result)

            } catch (error: Exception) {
                promise.reject(
                    "PAYMENT_STORAGE_ERROR",
                    "Unable to retrieve payment history.",
                    error
                )
            }
        }
    }

    override fun invalidate() {
        executor.shutdown()
        super.invalidate()
    }
}
