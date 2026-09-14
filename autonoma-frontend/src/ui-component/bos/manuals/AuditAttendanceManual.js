export const AuditAttendanceManual = {
  title: 'QMS Audit User Attendance SOP & User Manual',
  introduction: 'The Audit Attendance module manages auditor check-in and check-out times, attendance verification, and punctuality tracking for scheduled quality audits.',
  steps: [
    { num: '01', title: 'Select Audit Schedule', desc: 'Locate the assigned audit schedule in the list view (filtered by Mine, Team, or Company).' },
    { num: '02', title: 'Record Auditor Check-In', desc: 'Click "Check-In" to mark auditor in-time. Opens 10 minutes prior to scheduled start time.' },
    { num: '03', title: 'Conduct Quality Audit', desc: 'Perform assigned audit sections, verify checklist questions, and log observations.' },
    { num: '04', title: 'Record Auditor Check-Out', desc: 'Click "Check-Out" when the audit concludes to calculate total audit hours.' }
  ],
  statusFlow: [
    { status: 'SCHEDULED', desc: 'Audit schedule created and awaiting auditor check-in.' },
    { status: 'PRESENT', desc: 'Auditor checked in on time or within 10-minute grace window.' },
    { status: 'LATE', desc: 'Auditor checked in beyond the 10-minute grace limit.' },
    { status: 'COMPLETED', desc: 'Audit finished and check-out time recorded.' }
  ]
};
