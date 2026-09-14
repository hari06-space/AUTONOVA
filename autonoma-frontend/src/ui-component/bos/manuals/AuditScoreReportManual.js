export const AuditScoreReportManual = {
  title: 'Audit Score & Findings Multi-View Report SOP & User Manual',
  introduction: 'The Audit Score Report (QM1270) provides comprehensive multi-dimensional analytical views of QMS audit observations, score averages, and finding breakdowns grouped by Department, Audit Type, or individual Observation details.',
  steps: [
    { num: '01', title: 'Set Filter Criteria', desc: 'Select Date Range with Consider Date switch, Department, Audit Type, and Scope.' },
    { num: '02', title: 'Choose View Mode', desc: 'Switch between Detailed Observations List, Department Score Averages, or Audit Type Summary views.' },
    { num: '03', title: 'Analyze Scores & Findings', desc: 'Review average scores, compliance ratios, OFI counts, and non-conformances (NCR).' },
    { num: '04', title: 'Export & Print', desc: 'Export filtered dataset to Excel, CSV, PDF or trigger browser print.' }
  ],
  components: [
    { name: 'Consider Date Switch', desc: 'When enabled ("Yes"), filters records strictly between From Date and To Date. When disabled ("No"), includes all historical records.' },
    { name: 'Department Score Summary', desc: 'Calculates department-wise audit score averages, compliance averages, OFI averages, and NCR averages.' },
    { name: 'Detailed Observation View', desc: 'Provides itemized observation records with schedule details and PDF report download.' }
  ]
};
