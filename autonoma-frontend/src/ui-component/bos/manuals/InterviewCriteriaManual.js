export const InterviewCriteriaManual = {
  title: 'Interview Criteria Master SOP',
  introduction: 'Enables recruitment managers to define questions, answers, and department/level mappings for different interview rounds, as well as specify mandatory attachment requirements.',
  steps: [
    { num: '01', title: 'Add New Criteria', desc: 'Click "Create New Criteria" (Ctrl + N) to open the form. Select the Interview Round, enter the question (Criteria Details), and define the expected answers.' },
    { num: '02', title: 'Map Departments and Levels', desc: 'Select one or more departments and designation levels for which this criteria is applicable. Use "Select All" for global criteria.' },
    { num: '03', title: 'Specify Attachment Requirements', desc: 'Set "Attachment Required" to YES if a reference document is mandatory. The upload field will be highlighted in red until a file is uploaded.' }
  ],
  statusFlow: [
    { status: 'ACTIVE', desc: 'Criteria is active and will be fetched when generating evaluation forms for candidate interviews.' },
    { status: 'INACTIVE', desc: 'Criteria is deactivated and will not be included in active interview rounds.' }
  ],
  examples: [
    'Toggle "Attachment Required" to YES -> Border turns red -> Save without uploading -> Form shakes and blocks save -> Upload reference PDF -> Form saves.',
    'Create TECHNICAL round criteria -> Map to Engineering department and L1/L2 designation levels -> Save successfully.'
  ]
};
