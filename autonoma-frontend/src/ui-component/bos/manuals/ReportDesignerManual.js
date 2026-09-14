export const ReportDesignerManual = {
  title: 'PDF Report Designer - Quick Help Guide',
  introduction: 'This configuration-driven designer turns canvas blueprints into high-fidelity PDF documents mapped to live ERP database variables.',
  steps: [
    { num: '01', title: 'Initialize & Configure', desc: 'Set a name and unique code, then link the template to any active ERP page via autocomplete search.' },
    { num: '02', title: 'Add Layout Components', desc: 'Insert labels, dynamic binding placeholders, data tables, qr codes, or dividers onto the canvas.' },
    { num: '03', title: 'Drag, Align & Snap', desc: 'Drag components freely on A4 sheet. Toggle "Snap Grid" to lock elements to a 10px alignment grid.' },
    { num: '04', title: 'Bind Database Fields', desc: 'Select a canvas block, expand the ERP Data Binding Tree on properties bar, and click on any column path.' }
  ],
  components: [
    { name: 'Text Block', desc: 'Static company labels, headers, terms.' },
    { name: 'Dynamic Field', desc: 'Binds variable keys (e.g., {{doc.number}}).' },
    { name: 'Image', desc: 'Authorized seals, stamps, or logos.' },
    { name: 'Data Table', desc: 'Loopable grids for transactions list.' },
    { name: 'QR / Barcode', desc: 'Scannable verification codes.' }
  ],
  examples: [
    'Click Text Block -> position X:40, Y:30 -> Set text: {{company.companyName}}',
    'Click Dynamic Field -> position X:600, Y:30 -> Bind value: {{doc.number}}',
    'Click Line -> stretch to page width -> place below header block.'
  ]
};
