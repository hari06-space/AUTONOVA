package com.autonoma.erp.modules.platform.files.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class DocxToPdfConverterService {

    private static final Logger log = LoggerFactory.getLogger(DocxToPdfConverterService.class);

    /**
     * Converts a DOCX InputStream to a PDF OutputStream using Native Windows MS Word COM Interop.
     */
    public void convertDocxToPdf(InputStream docxInputStream, OutputStream pdfOutputStream) throws Exception {
        log.info("Starting Native Windows DOCX to PDF conversion...");
        
        Path tempDir = Files.createTempDirectory("docx_pdf_convert_");
        Path docxFile = tempDir.resolve("input.docx");
        Path pdfFile = tempDir.resolve("output.pdf");
        Path scriptFile = tempDir.resolve("convert.ps1");

        try {
            // Write input stream to temp docx file
            Files.copy(docxInputStream, docxFile, StandardCopyOption.REPLACE_EXISTING);

            // Create PowerShell script
            String psScript = "$word = New-Object -ComObject Word.Application\n" +
                    "$word.Visible = $false\n" +
                    "$word.DisplayAlerts = 'wdAlertsNone'\n" +
                    "try {\n" +
                    "  $doc = $word.Documents.Open('" + docxFile.toAbsolutePath().toString() + "')\n" +
                    "  $doc.SaveAs([ref] '" + pdfFile.toAbsolutePath().toString() + "', [ref] 17)\n" +
                    "  $doc.Close()\n" +
                    "} finally {\n" +
                    "  $word.Quit()\n" +
                    "  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null\n" +
                    "}\n";
            Files.writeString(scriptFile, psScript);

            // Execute PowerShell script
            ProcessBuilder pb = new ProcessBuilder("powershell.exe", "-ExecutionPolicy", "Bypass", "-File", scriptFile.toAbsolutePath().toString());
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Read output for debugging
            String output = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                log.error("PowerShell script failed with exit code {}. Output: {}", exitCode, output);
                throw new RuntimeException("MS Word COM Interop failed with exit code: " + exitCode);
            }

            // Copy generated PDF to output stream
            Files.copy(pdfFile, pdfOutputStream);
            
            log.info("Native DOCX to PDF conversion completed successfully.");
        } catch (Exception e) {
            log.error("Failed to convert DOCX to PDF natively: ", e);
            throw e;
        } finally {
            // Clean up temporary files
            try { Files.deleteIfExists(docxFile); } catch (Exception ignored) {}
            try { Files.deleteIfExists(pdfFile); } catch (Exception ignored) {}
            try { Files.deleteIfExists(scriptFile); } catch (Exception ignored) {}
            try { Files.deleteIfExists(tempDir); } catch (Exception ignored) {}
        }
    }
}
