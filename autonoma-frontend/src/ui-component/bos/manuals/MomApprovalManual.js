export const MomApprovalManual = {
  title: 'QMS MOM Verification & Approval SOP & User Manual',
  introduction: 'The MOM Approval module allows verifiers and department heads to review submitted action items, verify completion evidence, and approve or reject closures.',
  steps: [
    { num: '01', title: 'Review Submitted Actions', desc: 'Access list of actions pending verification.' },
    { num: '02', title: 'Inspect Completion Evidence', desc: 'Review action taken details and uploaded attachments.' },
    { num: '03', title: 'Approve or Reject', desc: 'Click Verify to approve closure, or Reject with mandatory rejection remarks.' }
  ],
  statusFlow: [
    { status: 'PENDING FOR VERIFIED', desc: 'Submitted action awaiting verification.' },
    { status: 'ACCEPTED / VERIFIED', desc: 'Action approved and closed.' },
    { status: 'REJECTED', desc: 'Action returned to assignee for re-execution.' }
  ]
};
