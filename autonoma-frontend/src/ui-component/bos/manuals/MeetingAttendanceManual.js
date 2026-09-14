export const MeetingAttendanceManual = {
  title: 'QMS Meeting Attendance SOP & User Manual',
  introduction: 'The Meeting Attendance module tracks live participant check-in, check-out, and attendance status (Present, Late, Absent, Excused) for scheduled meetings.',
  steps: [
    { num: '01', title: 'Open Attendance Sheet', desc: 'Select scheduled meeting from the attendance list view.' },
    { num: '02', title: 'Mark Check-In', desc: 'Click "Check-In" or select Present/Late for attending participants.' },
    { num: '03', title: 'Mark Check-Out', desc: 'Record check-out time when participant leaves or meeting ends.' },
    { num: '04', title: 'Submit Attendance', desc: 'Save attendance records to update meeting status.' }
  ],
  statusFlow: [
    { status: 'PENDING', desc: 'Attendance check-in not yet recorded.' },
    { status: 'PRESENT', desc: 'Participant checked in on-time or within 10-minute grace window from scheduled start.' },
    { status: 'LATE', desc: 'Participant checked in after 10-minute grace window from scheduled start.' },
    { status: 'ABSENT', desc: 'Participant did not check in.' }
  ]
};
