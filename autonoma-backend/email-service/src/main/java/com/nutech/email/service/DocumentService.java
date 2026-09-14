package com.nutech.email.service;

import com.nutech.email.model.*;
import com.nutech.email.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class DocumentService {

    private final TemplateEngine templateEngine;
    private final QuotationRepository quotationRepository;
    private final InvoiceRepository invoiceRepository;

    @Value("${document.storage-path:./generated-documents}")
    private String storagePath;

    /**
     * Generate a quotation PDF from resolved parts.
     */
    public Quotation generateQuotation(Customer customer,
                                        ProcessingRequest processingRequest,
                                        List<PartResolutionService.ResolvedPartInfo> resolvedParts,
                                        String specialInstructions) {
        // Generate quotation number
        String quotationNumber = "QT-" + String.format("%06d", quotationRepository.findMaxQuotationSequence() + 1);

        Quotation quotation = Quotation.builder()
                .quotationNumber(quotationNumber)
                .processingRequest(processingRequest)
                .customer(customer)
                .quotationDate(LocalDate.now())
                .validUntil(LocalDate.now().plusDays(30))
                .specialInstructions(specialInstructions)
                .currency("INR")
                .termsAndConditions("Standard terms and conditions apply. Validity: 30 days from date of quotation.")
                .build();

        // Build line items
        List<QuotationLine> lines = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (int i = 0; i < resolvedParts.size(); i++) {
            var rp = resolvedParts.get(i);
            MasterPart mp = rp.masterPart();
            int qty = rp.quantity() != null ? rp.quantity() : 1;

            BigDecimal lineTotal = mp.getUnitPrice().multiply(BigDecimal.valueOf(qty));
            BigDecimal lineTax = lineTotal.multiply(mp.getGstRate()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            QuotationLine line = QuotationLine.builder()
                    .quotation(quotation)
                    .lineNumber(i + 1)
                    .masterPart(mp)
                    .partCode(mp.getPartCode())
                    .partName(mp.getPartName())
                    .description(mp.getDescription())
                    .quantity(qty)
                    .unitPrice(mp.getUnitPrice())
                    .lineTotal(lineTotal)
                    .hsnCode(mp.getHsnCode())
                    .gstRate(mp.getGstRate())
                    .leadTimeDays(mp.getLeadTimeDays())
                    .build();

            lines.add(line);
            subtotal = subtotal.add(lineTotal);
            totalTax = totalTax.add(lineTax);
        }

        quotation.setLines(lines);
        quotation.setSubtotal(subtotal);
        quotation.setTaxAmount(totalTax);
        quotation.setTotalAmount(subtotal.add(totalTax));

        // Generate PDF
        byte[] pdfBytes = renderQuotationPdf(quotation);
        String filePath = savePdf(pdfBytes, quotationNumber + ".pdf");
        quotation.setPdfStoragePath(filePath);

        return quotationRepository.save(quotation);
    }

    /**
     * Render quotation HTML to PDF using Thymeleaf + Flying Saucer.
     */
    public byte[] renderQuotationPdf(Quotation quotation) {
        Context context = new Context();
        context.setVariable("quotation", quotation);
        context.setVariable("customer", quotation.getCustomer());
        context.setVariable("lines", quotation.getLines());
        context.setVariable("dateFormatter", DateTimeFormatter.ofPattern("dd-MMM-yyyy"));

        String html = templateEngine.process("quotation-template", context);

        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(os);
            log.info("Quotation PDF generated: {}", quotation.getQuotationNumber());
            return os.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate quotation PDF: {}", e.getMessage(), e);
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    private String savePdf(byte[] pdfBytes, String fileName) {
        try {
            Path dir = Paths.get(storagePath);
            Files.createDirectories(dir);
            Path filePath = dir.resolve(fileName);
            Files.write(filePath, pdfBytes);
            return filePath.toAbsolutePath().toString();
        } catch (IOException e) {
            log.error("Failed to save PDF: {}", e.getMessage(), e);
            throw new RuntimeException("PDF save failed", e);
        }
    }
}
