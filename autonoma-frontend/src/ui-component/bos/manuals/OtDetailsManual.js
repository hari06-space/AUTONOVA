const OtDetailsManual = {
  title: 'Overtime (OT) Details Standard Operating Procedure',
  introduction:
    'The Overtime (OT) Details module allows employees and HR administrators to record daily extra working hours in HH:mm format, track verification status, and maintain compliant records for salary calculation.',
  steps: [
    {
      num: '01',
      title: 'Initiate OT Entry',
      desc: 'Click on the "+ Add OT Entry" button in the sticky page header.'
    },
    {
      num: '02',
      title: 'Select OT-Eligible Employee',
      desc: 'Use the searchable dropdown to select an active employee who is eligible for overtime benefits.'
    },
    {
      num: '03',
      title: 'Enter Overtime Date & Duration',
      desc: 'Select the exact date worked and input hours and minutes (e.g. 02h 30m). The system converts this to total minutes (150 mins) automatically.'
    },
    {
      num: '04',
      title: 'Submit & Route for Verification',
      desc: 'Save the entry. Based on company preferences, the record is immediately submitted into the HOD Verification Queue.'
    }
  ],
  statusFlow: [
    {
      status: 'PENDING_VERIFICATION',
      desc: 'Overtime request is submitted and waiting for Team Lead / HOD approval.'
    },
    {
      status: 'VERIFIED',
      desc: 'Request is verified and approved for inclusion in monthly payroll calculation.'
    },
    {
      status: 'REJECTED',
      desc: 'Request is rejected by HOD with a documented reason.'
    }
  ],
  components: [
    {
      name: 'Date Range & Consider Date Filter',
      desc: 'Filter OT entries across custom date ranges or view all historic entries by toggling Consider Date to No.'
    },
    {
      name: 'Duration Live Preview Badge',
      desc: 'Displays duration in HH:mm format alongside raw minutes for clear user validation.'
    }
  ],
  examples: [
    'Example 1: Employee works 2 hours 30 minutes extra on 2026-08-01 -> System converts to 150 minutes for SQL aggregation.',
    'Example 2: HR Administrator reviews monthly OT register with Consider Date enabled.'
  ]
};

export default OtDetailsManual;
