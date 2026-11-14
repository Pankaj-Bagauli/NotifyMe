
package com.notifyme

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.AtomicFile
import org.json.JSONArray
import org.json.JSONObject
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
                return false
            }

            val updatedRecords = (existingRecords + record)
                .takeLast(MAX_RECORDS)

            writeRecordsLocked(updatedRecords)
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
        if (!storageFile.exists()) {
            return emptyList()
        }

        val encryptedBytes = atomicFile.openRead().use {
            it.readBytes()
        }

        val decryptedBytes = decrypt(encryptedBytes)
        val root = JSONObject(String(decryptedBytes, Charsets.UTF_8))

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

        return records
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
        } catch (error: Exception) {
            atomicFile.failWrite(output)
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

        require(iv.size == IV_LENGTH)

        return iv + encrypted
    }

    private fun decrypt(encryptedBytes: ByteArray): ByteArray {
        require(encryptedBytes.size > IV_LENGTH)

        val iv = encryptedBytes.copyOfRange(0, IV_LENGTH)
        val ciphertext = encryptedBytes.copyOfRange(
            IV_LENGTH,
            encryptedBytes.size
        )

        val cipher = Cipher.getInstance(TRANSFORMATION)

        cipher.init(
            Cipher.DECRYPT_MODE,
            getOrCreateSecretKey(),
            GCMParameterSpec(128, iv)
        )

        return cipher.doFinal(ciphertext)
    }

    private fun getOrCreateSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)

        val existingKey = keyStore.getKey(KEY_ALIAS, null)

        if (existingKey is SecretKey) {
            return existingKey
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
}
