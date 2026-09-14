package com.autonoma.erp.service.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DuplicateKeyException;

import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AutoIdGenerationService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public String getAccountYear(Date date) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date != null ? date : new Date());
        int year = cal.get(Calendar.YEAR);
        int month = cal.get(Calendar.MONTH); // 0-indexed: Jan=0, Feb=1, Mar=2, Apr=3...
        
        if (month < 3) { // Jan, Feb, Mar
            return (year - 1) + "-" + year;
        } else {
            return year + "-" + (year + 1);
        }
    }

    /**
     * Preview the next code WITHOUT incrementing the database sequence.
     * Read-only. Safe for parallel/cancellable dialog previews.
     */
    public String previewNextCode(String documentType, Date documentDate) {
        String accountYear = getAccountYear(documentDate);
        
        // 1. Fetch prefix configuration
        Map<String, Object> config = getPrefixConfig(documentType, accountYear);
        String prefix = (String) config.get("prefix");
        String suffix = (String) config.get("suffix");
        Integer digit = (Integer) config.get("digit");
        
        // 2. Fetch current number (default to 0 if not exists)
        int currentNum = 0;
        String seqSql = "SELECT CURRENT_NUMBER FROM AD_DOCUMENT_SEQUENCE WITH (NOLOCK) WHERE ACCOUNT_YEAR = ? AND DOCUMENT_TYPE = ?";
        List<Integer> seqList = jdbcTemplate.query(seqSql, (rs, rowNum) -> rs.getInt("CURRENT_NUMBER"), accountYear, documentType);
        if (!seqList.isEmpty()) {
            currentNum = seqList.get(0);
        }
        
        int nextNum = currentNum + 1;
        
        // 3. Check sequence overflow
        validateSequenceLimit(nextNum, digit, accountYear);
        
        // 4. Format code
        return prefix + String.format("%0" + digit + "d", nextNum) + suffix;
    }

    /**
     * Authoritatively generate and increment the next sequence number inside a transaction.
     * Implements concurrency locks.
     */
    @Transactional
    public String generateNextCode(String documentType, Date documentDate, String userId) {
        String accountYear = getAccountYear(documentDate);
        
        // 1. Fetch prefix configuration
        Map<String, Object> config = getPrefixConfig(documentType, accountYear);
        String prefix = (String) config.get("prefix");
        String suffix = (String) config.get("suffix");
        Integer digit = (Integer) config.get("digit");
        
        // 2. Authoritative sequence fetch with lock & retry
        int nextNum = lockAndIncrementSequence(accountYear, documentType, userId);
        
        // 3. Check sequence overflow
        validateSequenceLimit(nextNum, digit, accountYear);
        
        // 4. Format code
        return prefix + String.format("%0" + digit + "d", nextNum) + suffix;
    }

    private Map<String, Object> getPrefixConfig(String documentType, String accountYear) {
        String prefixCol;
        String suffixCol;
        String digitCol;
        String desc;

        if ("ATS_APPLICANT".equals(documentType)) {
            prefixCol = "ATS_PREFIX";
            suffixCol = "ATS_SUFFIX";
            digitCol = "ATS_DIGIT";
            desc = "ATS Applicant ID";
        } else if ("OFFER_LETTER".equals(documentType) || "OFFER_LETTER_DOCUMENT_NO".equals(documentType)) {
            prefixCol = "OFFER_LETTER_PREFIX";
            suffixCol = "OFFER_LETTER_SUFFIX";
            digitCol = "OFFER_LETTER_DIGIT";
            desc = "Offer Letter Document No";
        } else {
            throw new IllegalArgumentException("Unsupported document type: " + documentType);
        }
        
        String sql = "SELECT " + prefixCol + ", " + suffixCol + ", " + digitCol + ", STATUS FROM AD_PREFIX_CREDENTIALS WHERE ACCOUNT_YEAR = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, accountYear);
        
        if (rows.isEmpty()) {
            throw new RuntimeException(desc + " generation is not configured for Account Year " + accountYear + ". Please configure it in Prefix/Suffix Credentials.");
        }
        
        Map<String, Object> row = rows.get(0);
        Integer status = (Integer) row.get("STATUS");
        if (status == null || status != 1) {
            throw new RuntimeException(desc + " generation is disabled (inactive status) for Account Year " + accountYear + ". Please enable it in Prefix/Suffix Credentials.");
        }
        
        String prefix = (String) row.get(prefixCol);
        String suffix = (String) row.get(suffixCol);
        Integer digit = (Integer) row.get(digitCol);
        
        if (prefix == null || prefix.trim().isEmpty()) {
            prefix = "OFFER_LETTER".equals(documentType) || "OFFER_LETTER_DOCUMENT_NO".equals(documentType) ? "OL/" : "ATS/";
        }
        if (digit == null || digit <= 0) {
            digit = 6;
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("prefix", prefix.trim());
        result.put("suffix", suffix != null ? suffix.trim() : "");
        result.put("digit", digit);
        return result;
    }

    private int lockAndIncrementSequence(String accountYear, String documentType, String userId) {
        int retries = 3;
        while (retries > 0) {
            try {
                // Lock row with UPDLOCK, HOLDLOCK
                String selectSql = "SELECT CURRENT_NUMBER FROM AD_DOCUMENT_SEQUENCE WITH (UPDLOCK, HOLDLOCK) WHERE ACCOUNT_YEAR = ? AND DOCUMENT_TYPE = ?";
                List<Integer> list = jdbcTemplate.query(selectSql, (rs, rowNum) -> rs.getInt("CURRENT_NUMBER"), accountYear, documentType);
                
                if (list.isEmpty()) {
                    // Try to insert
                    try {
                        String insertSql = "INSERT INTO AD_DOCUMENT_SEQUENCE (ACCOUNT_YEAR, DOCUMENT_TYPE, CURRENT_NUMBER, CREATED_BY, CREATED_DATE) VALUES (?, ?, 1, ?, GETDATE())";
                        jdbcTemplate.update(insertSql, accountYear, documentType, userId != null ? userId : "System");
                        return 1;
                    } catch (DuplicateKeyException dke) {
                        // Concurrent insert occurred, retry selecting
                        retries--;
                        if (retries <= 0) {
                            throw new RuntimeException("Concurrent insert collision during sequence initialization for Account Year " + accountYear, dke);
                        }
                        continue;
                    }
                } else {
                    int nextNum = list.get(0) + 1;
                    String updateSql = "UPDATE AD_DOCUMENT_SEQUENCE SET CURRENT_NUMBER = ?, UPDATED_BY = ?, UPDATED_DATE = GETDATE() WHERE ACCOUNT_YEAR = ? AND DOCUMENT_TYPE = ?";
                    jdbcTemplate.update(updateSql, nextNum, userId != null ? userId : "System", accountYear, documentType);
                    return nextNum;
                }
            } catch (Exception e) {
                if (e instanceof DuplicateKeyException) {
                    retries--;
                    continue;
                }
                throw e;
            }
        }
        throw new RuntimeException("Failed to obtain concurrency lock for sequence generation after retries.");
    }

    private void validateSequenceLimit(int nextNum, int digit, String accountYear) {
        long maxVal = (long) Math.pow(10, digit) - 1;
        if (nextNum > maxVal) {
            throw new RuntimeException("Applicant ID sequence limit exceeded (" + maxVal + ") for Account Year " + accountYear + ". Please increase Digit capacity in Prefix/Suffix Credentials.");
        }
    }
}
