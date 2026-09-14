export const MeetingMinutesManual = {
  title: 'QMS Minutes of Meeting (MOM) SOP & User Manual',
  introduction: 'The Minutes of Meeting module records discussed points, decisions (INFO), and action items (ACTION) with assigned owners, target dates, and review schedules.',
  steps: [
    { num: '01', title: 'Create MOM', desc: 'Click "+ NEW" in MOM List. Select target Meeting Schedule.' },
    { num: '02', title: 'Add Discussed Points', desc: 'Enter discussion points. Select Point Type and Process Type (INFO or ACTION).' },
    { num: '03', title: 'Assign Action Items', desc: 'For ACTION items, assign Responsible Owner and mandatory Target Date.' },
    { num: '04', title: 'Submit MOM', desc: 'Save and submit MOM. Updates meeting status to CLOSED and triggers action item assignments.' }
  ],
  statusFlow: [
    { status: 'OPEN', desc: 'MOM is in draft or active action tracking.' },
    { status: 'VERIFIED', desc: 'MOM actions verified and closed.' },
    { status: 'CLOSED', desc: 'All action items completed.' }
  ]
};
