export const OfferLetterDesignerManual = {
  title: 'Offer Letter Template Designer SOP Manual',
  introduction:
    'The Offer Letter Template Designer provides a professional A4 document editor for designing offer letters visually — with drag-to-reorder sections, rich-text editing, live salary data, dynamic field tokens, and clean PDF export — without any technical knowledge.',
  steps: [
    {
      num: '01',
      title: 'A4 Document Canvas',
      desc: 'The editor displays a real-world A4 portrait sheet. Sections flow top-to-bottom naturally. Content automatically expands blocks — no fixed heights, no overlapping. When content exceeds one page, a page-break indicator is shown.'
    },
    {
      num: '02',
      title: 'Live Candidate Selection',
      desc: 'Select a candidate from the top dropdown. All dynamic tokens (Candidate Name, Designation, Department, Annual CTC, Joining Date) update immediately across the canvas preview and PDF output.'
    },
    {
      num: '03',
      title: 'Rich Text Editing with ATS Content',
      desc: 'The opening paragraph is automatically loaded from the "OFFER LETTER" email template in ATS Email Content Master. Click any paragraph to edit it using standard formatting tools. Your edits only affect this template — the global ATS email content is never modified.'
    },
    {
      num: '04',
      title: 'Dynamic Field Insertion',
      desc: 'Insert verified tokens using: (1) Click a token chip in the Fields tab → inserts at cursor, (2) Drag a token badge onto the canvas, (3) Type "/" inside any rich text block for inline autocomplete suggestions.'
    },
    {
      num: '05',
      title: 'Section Management (Drag / Reorder / Show-Hide)',
      desc: 'Hover over any section to reveal the floating action toolbar. Use arrow icons or drag the grip handle to reorder sections. Click the eye icon to hide/show. Duplicated and custom sections can be freely deleted.'
    },
    {
      num: '06',
      title: 'Delete & Restore Blocks',
      desc: 'When a section is deleted, it moves to the "Deleted" tab in the toolbox — it is NOT permanently lost. Switch to the Deleted tab and click "Restore" to bring any block back to the document. The Undo (Ctrl+Z) / Redo (Ctrl+Y) buttons also work for all changes.'
    },
    {
      num: '07',
      title: 'Compensation Structure (Dynamic)',
      desc: 'The salary table automatically reflects live payroll components from the HR engine. Every earning component (Basic, HRA, Special Allowance, etc.) is shown with monthly and annual amounts. No values are hardcoded.'
    },
    {
      num: '08',
      title: 'Properties Inspector (Right Panel)',
      desc: 'Click any section to open its properties in the right-side Inspector panel. Edit the document title alignment, font size, signature labels, salary table title, and other section-specific settings without touching HTML or CSS.'
    },
    {
      num: '09',
      title: 'Download PDF & Save Template',
      desc: 'Click "Download PDF" (or Space + D) to export a crisp A4 PDF. Click "Save Template" (or Space + S) to persist the current layout to the server for future onboarding workflows.'
    }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'Template being designed — not yet finalized' },
    { status: 'ACTIVE', desc: 'Active offer letter template used in onboarding workflow' }
  ],
  components: [
    { name: 'Sections Tab (Left)', desc: 'Manage the vertical section hierarchy — visibility, order, custom sections, and duplication' },
    { name: 'Fields Tab (Left)', desc: 'Catalog of verified dynamic tokens organized by category: Candidate, Job, Offer, Salary, Company, Signatory' },
    { name: 'Deleted Tab (Left)', desc: 'Restore bin for deleted sections — click Restore to bring any deleted block back' },
    { name: 'A4 Canvas (Center)', desc: 'Live document sheet with real-time content expansion, page-break indicators, and section hover controls' },
    { name: 'Properties Inspector (Right)', desc: 'Context-aware panel for editing section properties such as alignment, font size, labels, and visibility' },
    { name: 'Slash Command Autocomplete', desc: 'Inline popup activated by typing "/" in rich text blocks for instant dynamic field insertion' }
  ]
};

export default OfferLetterDesignerManual;
