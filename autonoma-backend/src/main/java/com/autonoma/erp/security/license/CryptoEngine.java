package com.autonoma.erp.security.license;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Base64;

public class CryptoEngine {

    // Obfuscated Public Key parts to make static analysis harder
    private static final String PUB_KEY_PART1 = "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtxTYLm2zbR1Hm0+jW05emoxZjdfNrQADQU4E0vBM69Sy";
    private static final String PUB_KEY_PART2 = "ZyImR7s1fj9kjIih0VdjwUZ4vu3UobYl0cj7Bxo2cCXgjWu/p4RAtWFmHOtmmFRxJdABP7lQj4eX/63sanMZP6kv";
    private static final String PUB_KEY_PART3 = "nAc3QTuQe0jbEYxxCOaKC5OWPPVg3f9oiD+mLcuB5UDF+nHezy1AVintf1XgsBgHDt+1JKSbLzjQG8t3nQMZbsUx";
    private static final String PUB_KEY_PART4 = "NIRW0MLEj6+nIR3lNZf03raHTnJbG6JJ/AxtWYWs/rWzt4adfsguoGRbkQjafx/rzmS1oVmkB8+X/zUK0wztLM/6";
    private static final String PUB_KEY_PART5 = "DwW5AqopWVYgODu4UeGBrj4UD2hXdJkCa/ceMSM0FFJxtdx4qumdQOI5TccZAhY40e7M8x4C5ak4ZEypBQXLNNon";
    private static final String PUB_KEY_PART6 = "WKhtliP1j8nrPdCacoHHDsAY+spoEpTyYS3BXio1u9paESPBS8+mtJgjWDcBtmnHIkDy55KYClNNxFqvoEbFY5da";
    private static final String PUB_KEY_PART7 = "sRbVViUMd+9F5ZWqa/G00UZMukM9d8Q0X35ep8ewVaVjVr+hw8y01i88PWBcgR8c9Fs+imVnPBDDforR7vTAs/rcxVtJsie7MnODQqe2SV+32JnvuOv+fS6OcrGhUG9iemguUR6GXMKDnN7A8QyGAt1tWECGQ4LpK9BYyTkA2mm0DxmvtMEEXplSWT0JgXfz+Ec7mNkCAwEAAQ==";

    private static final String RSA_PUBLIC_KEY_B64 = PUB_KEY_PART1 + PUB_KEY_PART2 + PUB_KEY_PART3 + PUB_KEY_PART4
            + PUB_KEY_PART5 + PUB_KEY_PART6 + PUB_KEY_PART7; // placeholder, will derive dynamic keypair generation for
                                                             // tests

    // Obfuscated AES key derivation constant
    private static final byte[] AES_SALT = new byte[] {
            0x41, 0x75, 0x74, 0x6f, 0x6e, 0x6f, 0x6d, 0x61, 0x45, 0x52, 0x50, 0x4c, 0x69, 0x63, 0x65, 0x6e
    };

    /**
     * Reconstructs public key.
     */
    public static PublicKey getPublicKey(byte[] keyBytes) throws Exception {
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePublic(spec);
    }

    /**
     * Loads Private Key securely. Supports both standard PKCS#8 and PKCS#1 RSA
     * private keys.
     */
    public static PrivateKey getPrivateKey(byte[] keyBytes) throws Exception {
        KeyFactory kf = KeyFactory.getInstance("RSA");
        try {
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            return kf.generatePrivate(spec);
        } catch (Exception e) {
            // Fallback: Try converting PKCS#1 to PKCS#8
            try {
                byte[] pkcs8Bytes = convertPkcs1ToPkcs8(keyBytes);
                PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(pkcs8Bytes);
                return kf.generatePrivate(spec);
            } catch (Exception ex) {
                // If fallback fails, throw the original exception
                throw e;
            }
        }
    }

    private static byte[] convertPkcs1ToPkcs8(byte[] pkcs1Bytes) throws Exception {
        int pkcs1Length = pkcs1Bytes.length;
        byte[] algId = new byte[] {
                0x30, 0x0d, 0x06, 0x09, 0x2a, (byte) 0x86, 0x48, (byte) 0x86, (byte) 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05,
                0x00
        };

        int privateKeyOctetLen = pkcs1Length;
        byte[] octetHeader;
        if (privateKeyOctetLen < 128) {
            octetHeader = new byte[] { 0x04, (byte) privateKeyOctetLen };
        } else if (privateKeyOctetLen < 256) {
            octetHeader = new byte[] { 0x04, (byte) 0x81, (byte) privateKeyOctetLen };
        } else if (privateKeyOctetLen < 65536) {
            octetHeader = new byte[] { 0x04, (byte) 0x82, (byte) (privateKeyOctetLen >> 8),
                    (byte) (privateKeyOctetLen & 0xFF) };
        } else {
            octetHeader = new byte[] { 0x04, (byte) 0x83, (byte) (privateKeyOctetLen >> 16),
                    (byte) (privateKeyOctetLen >> 8), (byte) (privateKeyOctetLen & 0xFF) };
        }

        int contentLen = 3 + algId.length + octetHeader.length + pkcs1Length;

        byte[] seqHeader;
        if (contentLen < 128) {
            seqHeader = new byte[] { 0x30, (byte) contentLen };
        } else if (contentLen < 256) {
            seqHeader = new byte[] { 0x30, (byte) 0x81, (byte) contentLen };
        } else if (contentLen < 65536) {
            seqHeader = new byte[] { 0x30, (byte) 0x82, (byte) (contentLen >> 8), (byte) (contentLen & 0xFF) };
        } else {
            seqHeader = new byte[] { 0x30, (byte) 0x83, (byte) (contentLen >> 16), (byte) (contentLen >> 8),
                    (byte) (contentLen & 0xFF) };
        }

        ByteBuffer buffer = ByteBuffer.allocate(seqHeader.length + 3 + algId.length + octetHeader.length + pkcs1Length);
        buffer.put(seqHeader);
        buffer.put(new byte[] { 0x02, 0x01, 0x00 });
        buffer.put(algId);
        buffer.put(octetHeader);
        buffer.put(pkcs1Bytes);

        return buffer.array();
    }

    /**
     * Generates a signed and encrypted license file using the configured public key.
     */
    public static byte[] generateLicenseFile(LicensePayload payload, byte[] privateKeyBytes) throws Exception {
        byte[] pubKeyBytes = Base64.getDecoder().decode(RSA_PUBLIC_KEY_B64);
        return generateLicenseFile(payload, privateKeyBytes, pubKeyBytes);
    }

    /**
     * Generates a signed and encrypted license file.
     */
    public static byte[] generateLicenseFile(LicensePayload payload, byte[] privateKeyBytes, byte[] publicKeyBytes) throws Exception {
        PrivateKey privateKey = getPrivateKey(privateKeyBytes);
        PublicKey publicKey = getPublicKey(publicKeyBytes);

        // Verify that the private key matches the public key
        try {
            byte[] dummyData = "keypair-validation-token".getBytes(StandardCharsets.UTF_8);
            Signature testSign = Signature.getInstance("SHA256withRSA");
            testSign.initSign(privateKey);
            testSign.update(dummyData);
            byte[] testSig = testSign.sign();

            Signature testVerify = Signature.getInstance("SHA256withRSA");
            testVerify.initVerify(publicKey);
            testVerify.update(dummyData);
            if (!testVerify.verify(testSig)) {
                throw new IllegalArgumentException("The uploaded private key does not match the public key.");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Keypair verification failed: " + e.getMessage(), e);
        }

        // Format payload string: clientCode|productCode|expiryDate
        String rawPayload = payload.clientCode() + "|" + payload.productCode() + "|" + payload.expiryDate().toString();
        byte[] payloadBytes = rawPayload.getBytes(StandardCharsets.UTF_8);

        // Sign payload using RSA SHA256
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(payloadBytes);
        byte[] sigBytes = signature.sign();

        // Prepare raw packet: [payload length (4 bytes)][payload][signature length (4
        // bytes)][signature]
        ByteBuffer buffer = ByteBuffer.allocate(4 + payloadBytes.length + 4 + sigBytes.length);
        buffer.putInt(payloadBytes.length);
        buffer.put(payloadBytes);
        buffer.putInt(sigBytes.length);
        buffer.put(sigBytes);
        byte[] plainPacket = buffer.array();

        // Generate dynamic AES key for GCM
        byte[] aesKeyBytes = new byte[32];
        SecureRandom sr = SecureRandom.getInstanceStrong();
        sr.nextBytes(aesKeyBytes);
        SecretKeySpec aesKey = new SecretKeySpec(aesKeyBytes, "AES");

        // Encrypt packet with AES-GCM
        byte[] iv = new byte[12];
        sr.nextBytes(iv);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.ENCRYPT_MODE, aesKey, spec);
        byte[] encryptedPacket = cipher.doFinal(plainPacket);

        // Wrap AES key with RSA Private Key? No, wrap with public key or embed?
        // Wait, to decrypt, client only needs the AES key.
        // We can encrypt the AES key using a second mechanism, or derive the AES key
        // from a shared secret,
        // or we can wrap the AES key using a derived key.
        // Let's derive a static/dynamic key using PBKDF2 with a fixed salt + clientCode
        // so only that client can decrypt,
        // or just use a fixed key obfuscated in code.
        // Let's use a derived key
        byte[] derivedKeyBytes = deriveKey("AutonomaLicenseMasterKey2026");
        SecretKeySpec derivedKey = new SecretKeySpec(derivedKeyBytes, "AES");

        // Encrypt the AES key with the derived key
        Cipher keyCipher = Cipher.getInstance("AES/GCM/NoPadding");
        byte[] keyIv = new byte[12];
        sr.nextBytes(keyIv);
        GCMParameterSpec keySpec = new GCMParameterSpec(128, keyIv);
        keyCipher.init(Cipher.ENCRYPT_MODE, derivedKey, keySpec);
        byte[] wrappedAesKey = keyCipher.doFinal(aesKeyBytes);

        // Final payload structure:
        // [Key IV (12 bytes)][Wrapped AES Key (32 + 16 = 48 bytes)][Packet IV (12
        // bytes)][Encrypted Packet]
        ByteBuffer finalBuffer = ByteBuffer.allocate(12 + wrappedAesKey.length + 12 + encryptedPacket.length);
        finalBuffer.put(keyIv);
        finalBuffer.put(wrappedAesKey);
        finalBuffer.put(iv);
        finalBuffer.put(encryptedPacket);

        // Zero out key buffers
        Arrays.fill(aesKeyBytes, (byte) 0);
        Arrays.fill(derivedKeyBytes, (byte) 0);

        return finalBuffer.array();
    }

    /**
     * Decrypts and verifies the license file using the built-in public key.
     */
    public static LicensePayload decryptAndVerifyLicense(byte[] licenseBytes) throws Exception {
        byte[] pubBytes = Base64.getDecoder().decode(RSA_PUBLIC_KEY_B64);
        return decryptAndVerifyLicense(licenseBytes, pubBytes);
    }

    /**
     * Decrypts and verifies the license file.
     */
    public static LicensePayload decryptAndVerifyLicense(byte[] licenseBytes, byte[] publicKeyBytes) throws Exception {
        if (licenseBytes.length < 72) {
            throw new GeneralSecurityException("License validation failed.");
        }

        ByteBuffer buffer = ByteBuffer.wrap(licenseBytes);

        byte[] keyIv = new byte[12];
        buffer.get(keyIv);

        byte[] wrappedAesKey = new byte[48]; // 32 bytes key + 16 bytes GCM tag
        buffer.get(wrappedAesKey);

        byte[] packetIv = new byte[12];
        buffer.get(packetIv);

        byte[] encryptedPacket = new byte[buffer.remaining()];
        buffer.get(encryptedPacket);

        // We don't know the client code yet, so how do we derive the key?
        // Wait! We can try to derive the key from the target client master codes, or we
        // can use a master salt/password that is fixed,
        // or we can loop through the active client codes configured for this instance
        // (typically just one for a tenant setup).
        // Since Autonoma ERP has a main company client code (e.g. '123456' as seeded),
        // we can retrieve the active client code from database/config
        // or try to derive using a standard default, or pass it in.
        // Let's use a standard default client code or loop through known client codes
        // if multiple.
        // Better yet: we can use a system-level master secret key derived from a fixed
        // token, or we can use the default client code '123456'.
        // Let's try to derive using '123456' or any other active client code, or use a
        // master derivation string.
        // Let's derive key using a master derivation phrase like
        // "AutonomaLicenseMasterKey2026". That way, it doesn't depend on clientCode to
        // decrypt,
        // but still uses dynamic envelope encryption!
        // Let's use the master key derivation phrase:
        byte[] derivedKeyBytes = deriveKey("AutonomaLicenseMasterKey2026");
        SecretKeySpec derivedKey = new SecretKeySpec(derivedKeyBytes, "AES");

        byte[] aesKeyBytes;
        try {
            Cipher keyCipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec keySpec = new GCMParameterSpec(128, keyIv);
            keyCipher.init(Cipher.DECRYPT_MODE, derivedKey, keySpec);
            aesKeyBytes = keyCipher.doFinal(wrappedAesKey);
        } catch (Exception e) {
            throw new GeneralSecurityException("License validation failed.");
        }

        SecretKeySpec aesKey = new SecretKeySpec(aesKeyBytes, "AES");
        byte[] plainPacket;
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec spec = new GCMParameterSpec(128, packetIv);
            cipher.init(Cipher.DECRYPT_MODE, aesKey, spec);
            plainPacket = cipher.doFinal(encryptedPacket);
        } catch (Exception e) {
            throw new GeneralSecurityException("License validation failed.");
        } finally {
            Arrays.fill(aesKeyBytes, (byte) 0);
            Arrays.fill(derivedKeyBytes, (byte) 0);
        }

        ByteBuffer packetBuffer = ByteBuffer.wrap(plainPacket);
        int payloadLen = packetBuffer.getInt();
        if (payloadLen <= 0 || payloadLen > packetBuffer.remaining()) {
            throw new GeneralSecurityException("License validation failed.");
        }
        byte[] payloadBytes = new byte[payloadLen];
        packetBuffer.get(payloadBytes);

        int sigLen = packetBuffer.getInt();
        if (sigLen <= 0 || sigLen > packetBuffer.remaining()) {
            throw new GeneralSecurityException("License validation failed.");
        }
        byte[] sigBytes = new byte[sigLen];
        packetBuffer.get(sigBytes);

        // Verify digital signature
        PublicKey publicKey = getPublicKey(publicKeyBytes);
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initVerify(publicKey);
        signature.update(payloadBytes);
        if (!signature.verify(sigBytes)) {
            throw new GeneralSecurityException("License validation failed.");
        }

        String rawPayload = new String(payloadBytes, StandardCharsets.UTF_8);
        String[] parts = rawPayload.split("\\|");
        if (parts.length != 3) {
            throw new GeneralSecurityException("License validation failed.");
        }

        return new LicensePayload(parts[0], parts[1], LocalDate.parse(parts[2]));
    }

    private static byte[] deriveKey(String saltSource) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        digest.update(AES_SALT);
        return digest.digest(saltSource.getBytes(StandardCharsets.UTF_8));
    }

    public static void wipeMemory(byte[] buffer) {
        if (buffer != null) {
            Arrays.fill(buffer, (byte) 0);
        }
    }
}
