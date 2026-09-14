export const QuoteComparisonManual = {
  title: "Quote Comparison (CS) Management Manual",
  introduction: "The Quote Comparison module allows the purchase team to evaluate multiple supplier quotations against an RFQ in a side-by-side format, aiding in vendor selection.",
  steps: [
    { num: '01', title: 'Generate Comparison', desc: 'Select an RFQ to generate a comparative statement of all received quotations.' },
    { num: '02', title: 'Evaluate Quotes side-by-side', desc: 'Review pricing, taxes, and commercial terms across all suppliers.' },
    { num: '03', title: 'Select Preferred Supplier', desc: 'Mark the most suitable quotation as "Selected" based on cost, delivery time, and terms.' },
    { num: '04', title: 'Approval Workflow', desc: 'Submit the comparison for approval by management to authorize the release of a Purchase Order.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'Comparison is generated but not yet evaluated.' },
    { status: 'SUBMITTED', desc: 'Evaluation is complete and submitted for management approval.' },
    { status: 'APPROVED', desc: 'Comparison is approved; a PO can now be issued to the selected vendor.' },
    { status: 'REJECTED', desc: 'Comparison was rejected by management.' }
  ],
  components: [
    { name: 'Comparative Matrix', desc: 'Side-by-side display of supplier prices and terms.' },
    { name: 'L1 Indicator', desc: 'Highlights the lowest bidder (L1) for quick decision making.' }
  ]
};
