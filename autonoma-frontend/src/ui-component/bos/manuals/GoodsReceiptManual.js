export const GoodsReceiptManual = {
  title: "Goods Receipt Note (GRN) Management Manual",
  introduction: "The Goods Receipt Note (GRN) module facilitates the receipt and stock inward process for materials entering the plant. It supports flexible generation workflows including Gate Entry verification, Direct PO mode (skipping Gate Entry), and Direct Manual GRN generation.",
  steps: [
    { num: '01', title: 'Initiate GRN Generation', desc: 'Click "New GRN" on the main toolbar to launch the generation dialog.' },
    { num: '02', title: 'Select Generation Workflow', desc: 'Choose between "Via Gate Entry", "Direct PO Mode (Skip Gate Entry)", or "Direct Manual GRN".' },
    { num: '03', title: 'Select Source Document', desc: 'Pick the relevant Gate Entry or approved Purchase Order from the eligible records list.' },
    { num: '04', title: 'Review Quantities & Items', desc: 'Verify incoming item quantities, accepted/rejected counts, UOM, and remarks.' },
    { num: '05', title: 'Save & Post GRN', desc: 'Save as DRAFT, then click "Post GRN" to automatically update inventory stock balances and generate batch tracking numbers.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'Initial creation state where quantities, remarks, and line items can be modified.' },
    { status: 'POSTED', desc: 'Final inventory inward committed; batch numbers generated and stock updated.' }
  ],
  components: [
    { name: 'Gate Entry Mode', desc: 'Imports verified material and vehicle details from security Gate Entry.' },
    { name: 'Direct PO Mode', desc: 'Generates GRN directly against approved PO lines, bypassing Gate Entry.' },
    { name: 'Direct Manual GRN', desc: 'Allows direct material inward entry without linking to pre-existing gate passes or POs.' }
  ]
};

export default GoodsReceiptManual;
