export const RfqManual = {
  title: "Request for Quotation (RFQ) Management Manual",
  introduction: "The RFQ module enables the purchase department to request pricing and terms from multiple suppliers for the materials approved in Purchase Requests.",
  steps: [
    { num: '01', title: 'Create New RFQ', desc: 'Click "New RFQ" to generate a request. Select the source (usually an approved Purchase Request) to pull in the required items.' },
    { num: '02', title: 'Select Suppliers', desc: 'Choose one or more approved suppliers from whom you wish to request quotations.' },
    { num: '03', title: 'Set Deadlines', desc: 'Specify the quotation submission deadline and expected delivery date for the materials.' },
    { num: '04', title: 'Submit & Release', desc: 'Submit the RFQ and mark it as Released once it has been communicated to the selected suppliers.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'RFQ is created but not yet finalized.' },
    { status: 'SUBMITTED', desc: 'RFQ is finalized internally.' },
    { status: 'RELEASED', desc: 'RFQ has been sent out to suppliers.' },
    { status: 'CLOSED', desc: 'RFQ is closed (e.g., quotations received or deadline passed).' }
  ],
  components: [
    { name: 'Supplier Selection', desc: 'Allows selecting multiple vendors for competitive bidding.' },
    { name: 'Source Tracking', desc: 'Maintains traceability back to the original Purchase Request.' }
  ]
};
