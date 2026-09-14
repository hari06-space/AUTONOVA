export const CloseMomManual = {
  title: 'QMS MOM Action Tracking & Closure SOP & User Manual',
  introduction: 'The Close MOM module enables action item assignees to submit completion proof, action observations, and request closure verification.',
  steps: [
    { num: '01', title: 'View Assigned Actions', desc: 'Filter list by assigned action items.' },
    { num: '02', title: 'Enter Action Taken', desc: 'Input details of corrective action taken and observations.' },
    { num: '03', title: 'Attach Evidence', desc: 'Upload completion evidence or verification document if required.' },
    { num: '04', title: 'Submit for Verification', desc: 'Click Submit to forward action item to Verifier for approval.' }
  ],
  statusFlow: [
    { status: 'OPEN', desc: 'Action item pending execution.' },
    { status: 'PENDING FOR VERIFIED', desc: 'Action submitted by assignee; awaiting verifier approval.' },
    { status: 'VERIFIED / CLOSED', desc: 'Action verified and closed.' },
    { status: 'REJECTED', desc: 'Action rejected by verifier with remarks.' }
  ]
};
