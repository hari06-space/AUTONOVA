package com.autonoma.erp.modules.pdfdesigner.service;


import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.*;

@Service
public class PdfDesignerSchemaService {

    public static class SchemaField {
        private String field;
        private String label;
        private String category;

        public SchemaField(String field, String label, String category) {
            this.field = field;
            this.label = label;
            this.category = category;
        }

        public String getField() { return field; }
        public String getLabel() { return label; }
        public String getCategory() { return category; }
    }

    public List<SchemaField> getSchemaFields(String documentType) {
        List<SchemaField> fields = new ArrayList<>();
        if ("PAYSLIP".equalsIgnoreCase(documentType)) {
            fields.add(new SchemaField("empCode", "Employee Code", "Employee Info"));
            fields.add(new SchemaField("employeeName", "Employee Name", "Employee Info"));
            fields.add(new SchemaField("departmentName", "Department", "Employee Info"));
            fields.add(new SchemaField("designationName", "Designation", "Employee Info"));
            
            fields.add(new SchemaField("presentDays", "Present Days", "Attendance"));
            fields.add(new SchemaField("lopDays", "LOP Days", "Attendance"));
            fields.add(new SchemaField("paidDays", "Paid Days", "Attendance"));

            fields.add(new SchemaField("payrollMonth", "Payroll Month", "Period"));
            fields.add(new SchemaField("payrollYear", "Payroll Year", "Period"));
            fields.add(new SchemaField("financialYear", "Financial Year", "Period"));

            fields.add(new SchemaField("netSalary", "Net Salary", "Earnings & Deductions"));
            fields.add(new SchemaField("grossEarnings", "Gross Salary", "Earnings & Deductions"));
            fields.add(new SchemaField("totalDeductions", "Total Deductions", "Earnings & Deductions"));
        } else if ("INVOICE".equalsIgnoreCase(documentType)) {
            fields.add(new SchemaField("invoiceNumber", "Invoice Number", "Invoice Header"));
            fields.add(new SchemaField("invoiceDate", "Invoice Date", "Invoice Header"));
            fields.add(new SchemaField("customerCode", "Customer Code", "Customer Info"));
            fields.add(new SchemaField("customerName", "Customer Name", "Customer Info"));
            fields.add(new SchemaField("billingAddress", "Billing Address", "Customer Info"));
            fields.add(new SchemaField("shippingAddress", "Shipping Address", "Customer Info"));

            fields.add(new SchemaField("paymentTerms", "Payment Terms", "Logistics & Terms"));
            fields.add(new SchemaField("deliveryTerms", "Delivery Terms", "Logistics & Terms"));

            fields.add(new SchemaField("subTotal", "Sub Total", "Financials"));
            fields.add(new SchemaField("taxRate", "Tax Rate (%)", "Financials"));
            fields.add(new SchemaField("taxAmount", "Tax Amount", "Financials"));
            fields.add(new SchemaField("discountAmount", "Discount Amount", "Financials"));
            fields.add(new SchemaField("grandTotal", "Grand Total", "Financials"));
        } else if ("PURCHASE_ORDER".equalsIgnoreCase(documentType)) {
            fields.add(new SchemaField("poNumber", "PO Number", "PO Header"));
            fields.add(new SchemaField("poDate", "PO Date", "PO Header"));
            fields.add(new SchemaField("vendorCode", "Vendor Code", "Vendor Info"));
            fields.add(new SchemaField("vendorName", "Vendor Name", "Vendor Info"));
            fields.add(new SchemaField("shippingAddress", "Shipping Address", "Vendor Info"));

            fields.add(new SchemaField("paymentTerms", "Payment Terms", "Logistics & Terms"));
            fields.add(new SchemaField("deliveryTerms", "Delivery Terms", "Logistics & Terms"));

            fields.add(new SchemaField("subTotal", "Sub Total", "Financials"));
            fields.add(new SchemaField("taxAmount", "Tax Amount", "Financials"));
            fields.add(new SchemaField("grandTotal", "Grand Total", "Financials"));
        } else if ("EMPLOYEE_ID_CARD".equalsIgnoreCase(documentType)) {
            fields.add(new SchemaField("empCode", "Employee Code", "Employee Info"));
            fields.add(new SchemaField("employeeName", "Employee Name", "Employee Info"));
            fields.add(new SchemaField("departmentName", "Department", "Employee Info"));
            fields.add(new SchemaField("designationName", "Designation", "Employee Info"));
            fields.add(new SchemaField("bloodGroup", "Blood Group", "Medical Info"));
            fields.add(new SchemaField("emergencyContact", "Emergency Contact", "Medical Info"));
            fields.add(new SchemaField("validUntil", "Valid Until", "Validity"));
        } else {
            // Default fallbacks
            fields.add(new SchemaField("documentNo", "Document Number", "General"));
            fields.add(new SchemaField("documentDate", "Document Date", "General"));
            fields.add(new SchemaField("partyName", "Party Name", "General"));
            fields.add(new SchemaField("totalAmount", "Total Amount", "Financials"));
        }
        return fields;
    }

    public Map<String, Object> getSampleDataContext(String documentType) {
        Map<String, Object> context = new HashMap<>();
        
        // General metadata
        context.put("companyName", "Autonoma Enterprise Solutions Pvt Ltd");
        context.put("companyAddress", "Tech Park Phase II, Sector 62, Noida, UP, 201301");
        context.put("companyPhone", "+91-120-4567890");
        context.put("companyEmail", "finance@autonoma.com");
        context.put("logoPath", "/assets/images/logo.png");

        if ("PAYSLIP".equalsIgnoreCase(documentType)) {
            context.put("empCode", "EMP024");
            context.put("employeeName", "Vijay Kumar");
            context.put("departmentName", "Software Engineering");
            context.put("designationName", "Senior Consultant");
            context.put("presentDays", new BigDecimal("28.0"));
            context.put("lopDays", new BigDecimal("2.0"));
            context.put("paidDays", new BigDecimal("28.0"));
            context.put("payrollMonth", "JUNE");
            context.put("payrollYear", 2026);
            context.put("financialYear", "2026-2027");

            // Dynamic salary components list for the table
            List<Map<String, Object>> details = new ArrayList<>();
            
            // Earnings
            details.add(createSalaryItem("Basic Salary", "BASIC", "EARNING", 45000.00, 50000.00));
            details.add(createSalaryItem("Dearness Allowance", "DA", "EARNING", 4500.00, 5000.00));
            details.add(createSalaryItem("House Rent Allowance", "HRA", "EARNING", 18000.00, 20000.00));
            
            // Deductions
            details.add(createSalaryItem("Provident Fund", "PF_EMP", "DEDUCTION", 1800.00, 1800.00));
            details.add(createSalaryItem("ESI Employee Share", "ESI_EMP", "DEDUCTION", 0.00, 0.00));
            details.add(createSalaryItem("Professional Tax", "PT", "DEDUCTION", 200.00, 200.00));

            context.put("details", details);

            // Totals
            context.put("grossEarnings", new BigDecimal("67500.00"));
            context.put("totalDeductions", new BigDecimal("2000.00"));
            context.put("netSalary", new BigDecimal("65500.00"));
        } else if ("INVOICE".equalsIgnoreCase(documentType)) {
            context.put("invoiceNumber", "INV-2026-00891");
            context.put("invoiceDate", "2026-06-08");
            context.put("customerCode", "CUST-TATA");
            context.put("customerName", "Tata Consultancy Services Ltd");
            context.put("billingAddress", "Gate No. 4, TCS Sahyadri Park, Hinjawadi Phase III, Pune, MH, 411057");
            context.put("shippingAddress", "TCS Sahyadri Park, Hinjawadi Phase III, Pune, MH, 411057");
            
            context.put("paymentTerms", "Net 30 Days");
            context.put("deliveryTerms", "FOB Destination");

            // Items table list
            List<Map<String, Object>> items = new ArrayList<>();
            items.add(createInvoiceItem("IT-DEV-SR", "Senior Java Architect Consulting (hrs)", 40.0, 1500.0));
            items.add(createInvoiceItem("IT-DEV-MID", "React Frontend Developer Support (hrs)", 80.0, 950.0));
            items.add(createInvoiceItem("LIC-CLOUD-BOS", "Autonoma BOS Cloud Tenant Subscription (annual)", 1.0, 45000.0));
            context.put("items", items);

            context.put("subTotal", new BigDecimal("181000.00"));
            context.put("taxRate", new BigDecimal("18.00"));
            context.put("taxAmount", new BigDecimal("32580.00"));
            context.put("discountAmount", new BigDecimal("5000.00"));
            context.put("grandTotal", new BigDecimal("208580.00"));
        } else if ("PURCHASE_ORDER".equalsIgnoreCase(documentType)) {
            context.put("poNumber", "PO-2026-319");
            context.put("poDate", "2026-06-08");
            context.put("vendorCode", "VEN-DELL");
            context.put("vendorName", "Dell India Private Limited");
            context.put("shippingAddress", "Autonoma Tech Park Warehouse, Noida, Sector 62, UP, 201301");
            context.put("paymentTerms", "Cash on Delivery");
            context.put("deliveryTerms", "Ex-Works Bangalore");

            // Items table list
            List<Map<String, Object>> items = new ArrayList<>();
            items.add(createInvoiceItem("HW-LAP-5440", "Dell Latitude 5440 i7 16GB 512GB", 10.0, 85000.0));
            items.add(createInvoiceItem("HW-MON-27", "Dell 27-inch UltraSharp Monitor", 10.0, 24000.0));
            context.put("items", items);

            context.put("subTotal", new BigDecimal("1090000.00"));
            context.put("taxAmount", new BigDecimal("196200.00"));
            context.put("grandTotal", new BigDecimal("1286200.00"));
        } else if ("EMPLOYEE_ID_CARD".equalsIgnoreCase(documentType)) {
            context.put("empCode", "EMP024");
            context.put("employeeName", "Vijay Kumar");
            context.put("departmentName", "Software Engineering");
            context.put("designationName", "Senior Consultant");
            context.put("bloodGroup", "O Positive (O+)");
            context.put("emergencyContact", "+91-9988776655");
            context.put("validUntil", "2030-12-31");
        } else {
            // General
            context.put("documentNo", "DOC-999");
            context.put("documentDate", "2026-06-08");
            context.put("partyName", "Standard Demo Customer");
            context.put("totalAmount", new BigDecimal("5000.00"));
            
            List<Map<String, Object>> items = new ArrayList<>();
            items.add(createInvoiceItem("ITEM-001", "Demo ERP Sample Item 1", 2.0, 1250.0));
            items.add(createInvoiceItem("ITEM-002", "Demo ERP Sample Item 2", 1.0, 2500.0));
            context.put("items", items);
        }

        return context;
    }

    private Map<String, Object> createSalaryItem(String name, String code, String type, double calc, double orig) {
        Map<String, Object> item = new HashMap<>();
        item.put("componentName", name);
        item.put("componentCode", code);
        item.put("componentType", type);
        item.put("calculatedAmount", new BigDecimal(calc).setScale(2, java.math.RoundingMode.HALF_UP));
        item.put("originalAmount", new BigDecimal(orig).setScale(2, java.math.RoundingMode.HALF_UP));
        return item;
    }

    private Map<String, Object> createInvoiceItem(String code, String name, double qty, double rate) {
        Map<String, Object> item = new HashMap<>();
        item.put("itemCode", code);
        item.put("itemName", name);
        item.put("quantity", new BigDecimal(qty).setScale(2, java.math.RoundingMode.HALF_UP));
        item.put("rate", new BigDecimal(rate).setScale(2, java.math.RoundingMode.HALF_UP));
        item.put("amount", new BigDecimal(qty * rate).setScale(2, java.math.RoundingMode.HALF_UP));
        return item;
    }
}
