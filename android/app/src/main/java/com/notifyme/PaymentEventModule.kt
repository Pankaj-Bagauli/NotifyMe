
package com.notifyme

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class PaymentEventModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PaymentEvents"

    @ReactMethod
    fun addListener(eventName: String) {
        // Required by NativeEventEmitter.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required by NativeEventEmitter.
    }

    companion object {
        const val EVENT_PAYMENT_SAVED = "PaymentSaved"

        
        fun emitPaymentSaved(context: Context) {
            val application = context.applicationContext as? ReactApplication
                ?: return

            val reactContext = application.reactHost
                ?.currentReactContext
                ?: return

            if (!reactContext.hasActiveReactInstance()) return

            reactContext
                .getJSModule(
                    DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                )
                .emit(EVENT_PAYMENT_SAVED, null)
        }

    }
}
