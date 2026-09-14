export const InterviewProcessManual = {
  title: 'Interview Process - Recruitment Workflow SOP',
  introduction: 'Tracks initial candidate screening, technical evaluation rounds, and department head interviews to select qualified candidates.',
  steps: [
    { num: '01', title: 'Screening', desc: 'Review resume files and shortlist applicants matching primary qualification filters.' },
    { num: '02', title: 'Interview Scheduling', desc: 'Set dates, assign interview panels, and dispatch system meeting invitations.' },
    { num: '03', title: 'Technical Rounds', desc: 'Assess core coding, engineering, or administration skills and log review grades.' },
    { num: '04', title: 'Management / Final Round', desc: 'Final review by department heads to evaluate salary expectations and role alignment.' }
  ],
  statusFlow: [
    { status: 'APPLIED', desc: 'Resume submitted' },
    { status: 'SCREENING', desc: 'Initial qualification filter' },
    { status: 'TECHNICAL_ROUND', desc: 'Core skill evaluation' },
    { status: 'MANAGER_ROUND', desc: 'Role alignment check' },
    { status: 'SHORTLISTED', desc: 'Cleared for final offer stage' }
  ],
  examples: [
    'Click "New Candidate" -> Upload PDF CV -> Status set to SCREENING.',
    'Assign Panel Panelist_A -> Send Interview Link -> Status transitions to TECHNICAL_ROUND.',
    'Pass Grade > 8.0 -> Status moves to MANAGER_ROUND.'
  ]
};
