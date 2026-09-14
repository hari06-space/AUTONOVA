export const MeetingMasterManual = {
  title: 'QMS Meeting Master SOP & User Manual',
  introduction: 'The Meeting Master module defines standard recurring and ad-hoc meeting types, agenda templates, default employee participant mappings, and document attachments.',
  steps: [
    { num: '01', title: 'Access Meeting Master', desc: 'Navigate to QMS > Meeting Master from the main navigation menu.' },
    { num: '02', title: 'Create New Meeting Type', desc: 'Click "+ NEW" button. Fill in Meeting Name, Prefix, Description (min 150 chars), and Agenda.' },
    { num: '03', title: 'Assign Participants', desc: 'Select employee participants from the multi-select dropdown. All user-linked employees are available.' },
    { num: '04', title: 'Attach Documents', desc: 'Upload mandatory or reference attachments if required for this meeting type.' },
    { num: '05', title: 'Save & Activate', desc: 'Click Save to persist the meeting master. Status defaults to ACTIVE.' }
  ],
  statusFlow: [
    { status: 'ACTIVE', desc: 'Meeting master is active and available for selection when creating meeting schedules.' },
    { status: 'INACTIVE', desc: 'Meeting master is disabled and cannot be selected for new schedules.' }
  ],
  components: [
    { name: 'Meeting Prefix', desc: 'Auto-generates schedule numbers (e.g. QSR/2526/000001).' },
    { name: 'Employee Name Multi-Select', desc: 'Maps default participants to the meeting type.' }
  ]
};
