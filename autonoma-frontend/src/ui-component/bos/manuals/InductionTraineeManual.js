export const InductionTraineeManual = {
  title: 'Induction & Trainee Management SOP',
  introduction: 'Tracks trainee onboard programs, maps department induction sessions, and logs completion statuses.',
  steps: [
    { num: '01', title: 'Assign Trainees', desc: 'Link new hires/trainees to specific department induction schedules.' },
    { num: '02', title: 'Log Progress & Training', desc: 'Update daily/weekly trainee assessment performance ratings.' },
    { num: '03', title: 'Induction Verification', desc: 'Final review by training coordinator to confirm induction completion.' }
  ],
  statusFlow: [
    { status: 'REGISTERED', desc: 'Trainee profile setup' },
    { status: 'INDUCTION_ASSIGNED', desc: 'Sessions mapped' },
    { status: 'IN_TRAINING', desc: 'Daily sessions active' },
    { status: 'VERIFICATION_PENDING', desc: 'Awaiting head approval' },
    { status: 'COMPLETED', desc: 'Trainee confirmed active employee' }
  ],
  examples: [
    'Select onboarded candidate -> Set induction calendar -> Status set to INDUCTION_ASSIGNED.',
    'Log attendance -> Set weekly score -> Final status transitions to COMPLETED upon verify.'
  ]
};
