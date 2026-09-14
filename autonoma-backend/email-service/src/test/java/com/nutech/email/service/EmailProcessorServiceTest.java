package com.nutech.email.service;

import static org.junit.jupiter.api.Assertions.*;

import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Method;
import java.util.Map;

public class EmailProcessorServiceTest {

    @Test
    public void testExcelParsingAndValidation() throws Exception {
        // 1. Create a mock Excel sheet in memory
        Workbook workbook = new HSSFWorkbook();
        Sheet sheet = workbook.createSheet("Customer Registration");
        
        // Row 0: Headers
        Row headerRow = sheet.createRow(0);
        String[] headers = {
            "Customer Name", "Address Line 1", "Address Line 2", "City", "State", 
            "Country", "Pincode", "Mobile No", "Email ID", "Website", 
            "Currency", "PAN No", "GSTIN", "State Code", "Domain Name"
        };
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }
        
        // Row 1: Valid registration values
        Row valueRow = sheet.createRow(1);
        valueRow.createCell(0).setCellValue("Nutech Partner");
        valueRow.createCell(1).setCellValue("Industrial Area Phase 2");
        valueRow.createCell(2).setCellValue("Suite 4B");
        valueRow.createCell(3).setCellValue("Chennai");
        valueRow.createCell(4).setCellValue("Tamil Nadu");
        valueRow.createCell(5).setCellValue("India");
        valueRow.createCell(6).setCellValue("600001");
        valueRow.createCell(7).setCellValue("9876543210");
        valueRow.createCell(8).setCellValue("finance@nutechpartner.com");
        valueRow.createCell(9).setCellValue("www.nutechpartner.com");
        valueRow.createCell(10).setCellValue("INR");
        valueRow.createCell(11).setCellValue("PAN123456X");
        valueRow.createCell(12).setCellValue("33PAN123456X1Z2");
        valueRow.createCell(13).setCellValue("33");
        valueRow.createCell(14).setCellValue("nutechpartner.com");
        
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        workbook.write(bos);
        workbook.close();
        byte[] excelBytes = bos.toByteArray();
        
        // 2. Instantiate Service with mocked/null dependencies for testing utility methods
        EmailProcessorService service = new EmailProcessorService(
            null, null, null, null, null, null, null, null, null, null, null, null, null
        );
        
        // 3. Invoke private parseExcelFields method via Reflection
        Method parseMethod = EmailProcessorService.class.getDeclaredMethod("parseExcelFields", byte[].class);
        parseMethod.setAccessible(true);
        
        @SuppressWarnings("unchecked")
        Map<String, String> fields = (Map<String, String>) parseMethod.invoke(service, (Object) excelBytes);
        
        // 4. Assert parsed outcomes match source values
        assertNotNull(fields);
        assertEquals("Nutech Partner", fields.get("name"));
        assertEquals("finance@nutechpartner.com", fields.get("email"));
        assertEquals("9876543210", fields.get("mobile"));
        assertEquals("600001", fields.get("pincode"));
        assertEquals("33PAN123456X1Z2", fields.get("gstin"));
        assertEquals("nutechpartner.com", fields.get("domain"));
    }
}
