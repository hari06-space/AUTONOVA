export const MeetingScheduleManual = {
  title: 'QMS Meeting Schedule SOP & User Manual',
  introduction: 'The Meeting Schedule module creates and manages meeting instances, recurrence configurations (Daily, Weekly, Monthly, etc.), chairpersons, hosts, and participants.',
  steps: [
    { num: '01', title: 'Schedule a Meeting', desc: 'Click "+ NEW" in Meeting Schedule List. Select Meeting Type, Date, Time, and Frequency.' },
    { num: '02', title: 'Set Subject & Agenda', desc: 'Provide a mandatory Subject and specific meeting agenda items.' },
    { num: '03', title: 'Assign Roles', desc: 'Assign Chaired By, Host By, Secondary Host, and Participants.' },
    { num: '04', title: 'Configure Recurrence', desc: 'Select Frequency (Daily, Weekly, Monthly, Quarterly, Bi-Annual, Annual). For Weekly, weekday is auto-set.' },
    { num: '05', title: 'Save Schedule', desc: 'Saving automatically creates recurrence configuration and pre-generates the next scheduled interval.' }
  ],
  statusFlow: [
    { status: 'Open', desc: 'Meeting schedule is active and upcoming.' },
    { status: 'Reschedule', desc: 'Meeting date or time was rescheduled.' },
    { status: 'Closed', desc: 'Meeting conducted and MOM finalized.' },
    { status: 'Auto Closed', desc: 'Meeting end time passed without attendance marked.' }
  ],
  components: [
    { name: 'Consider Date Switch', desc: 'Toggles date range filtering across meeting list.' },
    { name: 'Recurrence Generator', desc: 'Automatically schedules next meeting instance upon save or completion.' }
  ]
};
