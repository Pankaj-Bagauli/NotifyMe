
package com.notifyme

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.AtomicFile
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

data class PaymentRecord(
    val eventId: String,
    val amountPaise: Long,
    val sender: String,
    val receivedAtMillis: Long
)

class EncryptedPaymentStorage(context: Context) {

    companion object {
        private const val TAG = "NotifyMeStorage"

        private const val KEY_ALIAS = "notifyme_payment_key"
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val IV_LENGTH = 12
        private const val MAX_RECORDS = 1000

        private val storageLock = Any()
    }

    private val storageFile = java.io.File(
        context.applicationContext.filesDir,
        "payments.enc"
    )

    private val atomicFile = AtomicFile(storageFile)

    fun savePayment(record: PaymentRecord): Boolean {
        synchronized(storageLock) {
            val existingRecords = readRecordsLocked()

            if (existingRecords.any { it.eventId == record.eventId }) {
                Log.i(TAG, "Duplicate payment event ignored")
                return false
            }

            val updatedRecords = (existingRecords + record)
                .takeLast(MAX_RECORDS)

            writeRecordsLocked(updatedRecords)

            Log.i(TAG, "Payment saved successfully")
            return true
        }
    }

    fun getPayments(): List<PaymentRecord> {
        synchronized(storageLock) {
            return readRecordsLocked()
                .sortedByDescending { it.receivedAtMillis }
        }
    }

    private fun readRecordsLocked(): List<PaymentRecord> {
        val encryptedBytes = try {
            atomicFile.openRead().use {
                it.readBytes()
            }
        } catch (error: FileNotFoundException) {
            Log.i(TAG, "Payment storage file does not exist yet")
            return emptyList()
        } catch (error: Exception) {
            Log.e(TAG, "Unable to read payment storage", error)
            throw error
        }

        return try {
            val decryptedBytes = decrypt(encryptedBytes)

            val root = JSONObject(
                String(decryptedBytes, Charsets.UTF_8)
            )

            require(root.getInt("version") == 1) {
                "Unsupported storage version"
            }

            val array = root.getJSONArray("records")
            val records = mutableListOf<PaymentRecord>()

            for (index in 0 until array.length()) {
                val item = array.getJSONObject(index)

                records.add(
                    PaymentRecord(
                        eventId = item.getString("eventId"),
                        amountPaise = item.getLong("amountPaise"),
                        sender = item.getString("sender"),
                        receivedAtMillis = item.getLong("receivedAtMillis")
                    )
                )
            }

            records
        } catch (error: Exception) {
            Log.e(
                TAG,
                "Payment storage is corrupted or cannot be decrypted. Original file preserved.",
                error
            )
            throw error
        }
    }

    private fun writeRecordsLocked(records: List<PaymentRecord>) {
        val array = JSONArray()

        records.forEach { record ->
            array.put(
                JSONObject().apply {
                    put("eventId", record.eventId)
                    put("amountPaise", record.amountPaise)
                    put("sender", record.sender)
                    put("receivedAtMillis", record.receivedAtMillis)
                }
            )
        }

        val root = JSONObject().apply {
            put("version", 1)
            put("records", array)
        }

        val encryptedBytes = encrypt(
            root.toString().toByteArray(Charsets.UTF_8)
        )

        val output: FileOutputStream = atomicFile.startWrite()

        try {
            output.write(encryptedBytes)
            atomicFile.finishWrite(output)

        } catch (error: Throwable) {
            Log.e(TAG, "Payment storage write failed", error)

            try {
                atomicFile.failWrite(output)
                Log.w(TAG, "AtomicFile rollback attempted")
            } catch (rollbackError: Throwable) {
                error.addSuppressed(rollbackError)

                Log.e(
                    TAG,
                    "AtomicFile rollback also failed",
                    rollbackError
                )
            }

            throw error
        }
    }

    private fun encrypt(plainBytes: ByteArray): ByteArray {
        val cipher = Cipher.getInstance(TRANSFORMATION)

        cipher.init(
            Cipher.ENCRYPT_MODE,
            getOrCreateSecretKey()
        )

        val encrypted = cipher.doFinal(plainBytes)
        val iv = cipher.iv

        require(iv.size == IV_LENGTH) {
            "Unexpected AES-GCM IV length"
        }

        return iv + encrypted
    }

    private fun decrypt(encryptedBytes: ByteArray): ByteArray {
        require(encryptedBytes.size > IV_LENGTH) {
            "Invalid encrypted storage file"
        }

        val iv = encryptedBytes.copyOfRange(0, IV_LENGTH)

        val ciphertext = encryptedBytes.copyOfRange(
            IV_LENGTH,
            encryptedBytes.size
        )

        val cipher = Cipher.getInstance(TRANSFORMATION)

        cipher.init(
            Cipher.DECRYPT_MODE,
            getExistingSecretKey(),
            GCMParameterSpec(128, iv)
        )

        return cipher.doFinal(ciphertext)
    }

    private fun getOrCreateSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)

        if (keyStore.containsAlias(KEY_ALIAS)) {
            val existingKey = keyStore.getKey(KEY_ALIAS, null)

            if (existingKey is SecretKey) {
                return existingKey
            }

            throw IllegalStateException(
                "Existing payment encryption key is unavailable or invalid"
            )
        }

        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEYSTORE
        )

        val keySpec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or
                KeyProperties.PURPOSE_DECRYPT
        )
            .setKeySize(256)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(
                KeyProperties.ENCRYPTION_PADDING_NONE
            )
            .setRandomizedEncryptionRequired(true)
            .build()

        keyGenerator.init(keySpec)

        return keyGenerator.generateKey()
    }

    private fun getExistingSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)

        if (!keyStore.containsAlias(KEY_ALIAS)) {
            throw IllegalStateException(
                "Payment encryption key is missing. Existing storage cannot be decrypted."
            )
        }

        val existingKey = keyStore.getKey(KEY_ALIAS, null)

        return existingKey as? SecretKey
            ?: throw IllegalStateException(
                "Payment encryption key is unavailable or invalid"
            )
    }
}
