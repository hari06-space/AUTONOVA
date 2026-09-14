export const QuoteNegotiationManual = {
  title: "Quote Negotiation Management Manual",
  introduction: "The Quote Negotiation module facilitates tracking and recording rounds of negotiations with suppliers to achieve the best possible pricing and terms.",
  steps: [
    { num: '01', title: 'Initiate Negotiation', desc: 'Select an existing Quotation that requires negotiation.' },
    { num: '02', title: 'Record Revised Terms', desc: 'Enter the revised prices, discounts, or updated commercial terms agreed upon during the negotiation round.' },
    { num: '03', title: 'Document Remarks', desc: 'Add detailed remarks explaining the negotiation discussion and rationale.' },
    { num: '04', title: 'Submit Revision', desc: 'Submit the negotiation record, which will update the quotation to its latest revised state.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'Negotiation details are being drafted.' },
    { status: 'SUBMITTED', desc: 'Negotiation round is completed and recorded.' }
  ],
  components: [
    { name: 'Revision Tracking', desc: 'Maintains a history of changes from the original quote to the final negotiated offer.' }
  ]
};
