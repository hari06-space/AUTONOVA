export const BiometricAttendanceManual = {
  title: 'Biometric Attendance Standard Operating Procedure',
  introduction:
    'The Biometric Attendance module provides real-time tracking, synchronization from biometric devices (eSSL), daily punch analysis, shift matching, and monthly attendance processing for payroll.',
  steps: [
    {
      num: '01',
      title: 'View Daily & Monthly Attendance',
      desc: 'Switch between Daily attendance logs and the Monthly summary grid using the top tab selector.'
    },
    {
      num: '02',
      title: 'Biometric Sync-up',
      desc: 'Click on the "Sync-up" button to import biometric logs from connected eSSL devices either Month-Wise or Date-Wise.'
    },
    {
      num: '03',
      title: 'Manual Attendance Entry / Edit',
      desc: 'Use the action buttons to manually create or adjust punch-in/out records, assign shifts, and update status codes.'
    },
    {
      num: '04',
      title: 'Calculate & Process Attendance',
      desc: 'Run monthly attendance calculation to aggregate working hours, overtime hours, late arrival minutes, and absence records.'
    }
  ],
  statusFlow: [
    {
      status: 'PRESENT',
      desc: 'Employee punched in and out within shift hours fulfilling full-day working requirement.'
    },
    {
      status: 'HALF_DAY',
      desc: 'Employee worked half-day based on minimum working hours criteria.'
    },
    {
      status: 'ABSENT',
      desc: 'No punch recorded or unauthorized absence marked for the scheduled working day.'
    },
    {
      status: 'WO / HL',
      desc: 'Week Off or Company Declared Holiday.'
    }
  ],
  components: [
    {
      name: 'Daily & Monthly Tabs',
      desc: 'Enables quick switching between day-level transaction logs and aggregated monthly payroll sheets.'
    },
    {
      name: 'eSSL Sync Modal',
      desc: 'Allows pulling logs directly from biometric devices across specific month/year or date ranges.'
    },
    {
      name: 'Restore Deleted Logs',
      desc: 'Allows recovering accidentally deleted biometric logs within the current user session.'
    }
  ]
};

export default BiometricAttendanceManual;
