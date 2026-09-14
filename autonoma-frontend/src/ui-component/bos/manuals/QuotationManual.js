export const QuotationManual = {
  title: "Supplier Quotation Management Manual",
  introduction: "The Supplier Quotation module is used to record the commercial terms and pricing details received from suppliers in response to an RFQ or as direct offers.",
  steps: [
    { num: '01', title: 'Enter Quotation Details', desc: 'Click "New Quotation" and select the relevant RFQ (or create a direct quotation). Enter the supplier\'s quotation reference number and date.' },
    { num: '02', title: 'Input Commercial Terms', desc: 'Specify payment terms, delivery terms, transport scope, and validity of the quote.' },
    { num: '03', title: 'Update Item Pricing', desc: 'Enter the quoted unit price, applicable taxes (CGST/SGST/IGST), and any discounts for each item.' },
    { num: '04', title: 'Submit for Evaluation', desc: 'Save and submit the quotation. It will be available for Quote Comparison and Negotiation.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'Quotation entry is in progress.' },
    { status: 'SUBMITTED', desc: 'Quotation is fully entered and locked.' },
    { status: 'NEGOTIATION', desc: 'Quotation is currently under negotiation.' },
    { status: 'REJECTED', desc: 'Quotation is rejected during evaluation.' }
  ],
  components: [
    { name: 'Tax Calculations', desc: 'Automatically computes total line values based on basic price, discounts, and tax rates.' },
    { name: 'Terms Definition', desc: 'Captures all essential commercial terms for accurate comparison.' }
  ]
};
