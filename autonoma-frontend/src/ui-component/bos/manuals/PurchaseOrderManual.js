export const PurchaseOrderManual = {
  title: "Purchase Order (PO) Management Manual",
  introduction: "The Purchase Order (PO) module is used to issue legally binding orders to suppliers. It can be generated from various sources like an Approved PR, Quotation, Quote Comparison, or as a Direct Order.",
  steps: [
    { num: '01', title: 'Initiate PO', desc: 'Click "New Purchase Order" and choose the appropriate source (e.g., Quote Comparison or Direct Mode).' },
    { num: '02', title: 'Review Details', desc: 'Verify the imported item quantities, rates, taxes, and commercial terms.' },
    { num: '03', title: 'Add Additional Charges', desc: 'Include any freight, packing, or insurance charges to calculate the final landed cost.' },
    { num: '04', title: 'Approval & Release', desc: 'Submit the PO for internal verification and approval. Once approved, the PO can be sent to the supplier.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'PO is being drafted.' },
    { status: 'SUBMITTED', desc: 'PO is submitted for verification/approval.' },
    { status: 'VERIFIED', desc: 'PO is verified by intermediate authority.' },
    { status: 'APPROVED', desc: 'PO is fully approved and legally binding.' },
    { status: 'CANCELLED', desc: 'PO has been cancelled before execution.' }
  ],
  components: [
    { name: 'Source Selection', desc: 'Flexible options to create POs from PRs, RFQs, Quotes, or direct entry.' },
    { name: 'Charges Calculation', desc: 'Comprehensive computation of subtotal, taxes, and additional charges.' }
  ]
};
