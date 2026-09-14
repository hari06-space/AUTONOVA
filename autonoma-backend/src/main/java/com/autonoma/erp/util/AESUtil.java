package com.autonoma.erp.util;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class AESUtil {

    private static final String ALGORITHM = "AES";
    // EXACTLY 16 characters
    private static final String KEY = "AutonomaERP@2026";


    public static String encrypt(String value) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(KEY.getBytes(), ALGORITHM);

            Cipher cipher = Cipher.getInstance(ALGORITHM);

            cipher.init(Cipher.ENCRYPT_MODE, secretKey);

            byte[] encryptedValue = cipher.doFinal(value.getBytes());

            return Base64.getEncoder()
                    .encodeToString(encryptedValue);

        } catch (Exception e) {
            throw new RuntimeException("Error while encrypting", e);
        }
    }

    public static String decrypt(String value) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(KEY.getBytes(), ALGORITHM);

            Cipher cipher = Cipher.getInstance(ALGORITHM);

            cipher.init(Cipher.DECRYPT_MODE, secretKey);

            byte[] originalValue = cipher.doFinal(Base64.getDecoder().decode(value));

            return new String(originalValue);

        } catch (Exception e) {
            return value;
        }
    }
}