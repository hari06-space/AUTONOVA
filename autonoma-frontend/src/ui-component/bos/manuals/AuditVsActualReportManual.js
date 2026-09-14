export const AuditVsActualReportManual = {
  title: 'Audit vs Actual Report User Manual & SOP',
  introduction:
    'The Audit vs Actual Report provides a comprehensive comparison between planned QMS audit schedules and actual audit execution observations, tracking adherence, on-time completion, and audit results across Audit Type Wise and Department Wise views, each supporting both Summary Matrix and Detailed Table modes.',
  steps: [
    {
      num: '01',
      title: 'Filter & Search Audits',
      desc: 'Use the top global filter bar to filter audits by Year (in Summary View), Date Range with Consider toggle (in Detailed View), department, audit type, auditor scope (Mine/Team/Company), or execution status.'
    },
    {
      num: '02',
      title: 'Select Primary Tab',
      desc: 'Choose between the "Audit Type Wise" tab (groups audits by Audit Type) and the "Department Wise" tab (groups audits by Department).'
    },
    {
      num: '03',
      title: 'Switch between Summary & Detailed View',
      desc: 'Inside either tab, toggle between "Summary View" (12-month Plan vs Actual Matrix Grid with active/past month highlights) and "Detailed View" (complete row-by-row table with optional date range filter).'
    },
    {
      num: '04',
      title: 'Compare Planned vs Actual Dates',
      desc: 'Analyze planned schedule dates (sch dt) against actual observation dates (obr dt) with active month highlights, deviation tags (+/- days), and audit scores.'
    },
    {
      num: '05',
      title: '1-Click PDF Inspection',
      desc: 'Click on the PDF icon next to any conducted observation to open and review the full official audit observation report modal.'
    },
    {
      num: '06',
      title: 'Export & Print Reports',
      desc: 'Utilize the BOS Export button to generate official Excel spreadsheets or customized PDF reports tailored to whichever tab and view mode is currently active.'
    }
  ],
  statusFlow: [
    { status: 'SCHEDULED / PENDING', desc: 'Audit has been planned and assigned to auditor/auditee with a future target date.' },
    { status: 'CONDUCTED / COMPLETED', desc: 'Audit has been executed and observation findings/scores have been recorded.' },
    { status: 'OVERDUE', desc: 'Scheduled audit target date has passed without recorded observations.' },
    { status: 'CLOSED', desc: 'Audit findings and subsequent NCR/OFI actions have been verified and closed.' }
  ],
  components: [
    { name: 'Audit Type Wise Tab', desc: 'Focuses on audit programs categorized by Audit Types, offering both Monthly Matrix and Detailed tabular list.' },
    { name: 'Department Wise Tab', desc: 'Focuses on organizational units categorized by Department, offering both Monthly Matrix and Detailed tabular list.' },
    { name: 'Summary Matrix Grid', desc: 'Excel-style multi-month grid comparing Plan (sch dt) and Actual (obr dt) with Active Month highlight and Inactive Past Month mode.' },
    { name: 'Detailed Data Table', desc: 'Full tabular list displaying Schedule No, Dates, Auditors, Auditees, Observation Details, and Results, filtered by Date Range when Consider Date is active.' },
    { name: 'Global Header Filter Bar', desc: 'Centralized global header filtering: dynamically switches between Year filter (for Summary Matrix) and Date Range filter (for Detailed Table).' },
    { name: 'BOS Export Designer', desc: 'Standard export modal supporting customized PDF layouts and multi-column Excel downloads matching the active tab & view.' }
  ]
};
