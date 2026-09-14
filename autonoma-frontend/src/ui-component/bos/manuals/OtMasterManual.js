const OtMasterManual = {
  title: 'Overtime (OT) Master & Verification SOP',
  introduction: 'The OT Master module enables standardized management of employee overtime hours, strict eligibility enforcement, HOD verification workflows, and seamless payroll calculation integration.',
  steps: [
    {
      num: '01',
      title: 'Filter Eligible Employees',
      desc: 'When creating an OT entry, the system strictly renders employees whose Overtime Allowed setting is set to YES in the Employee Master.'
    },
    {
      num: '02',
      title: 'Enter OT Date & Time Duration',
      desc: 'Select the OT date and input duration in HH:mm format. The client UI automatically converts the input to total minutes before saving to the database.'
    },
    {
      num: '03',
      title: 'Automated HR Policy Verification Check',
      desc: 'If HR OT Verification setting is enabled, entries save as PENDING TO VERIFY and alert the employee’s Vertical Head/HOD. If disabled, entries save as VERIFIED immediately.'
    },
    {
      num: '04',
      title: 'HOD Verification & Approval Queue',
      desc: 'Vertical Heads/Team Leads access the Verification Queue tab to review pending overtime hours (in HH:mm format) and perform single or batch approvals/rejections.'
    },
    {
      num: '05',
      title: 'Payroll Calculation Integration',
      desc: 'During monthly payroll processing, the system aggregates all VERIFIED OT minutes for the pay period, converts them to hours, and calculates final OT payouts.'
    }
  ],
  statusFlow: [
    { status: 'PENDING TO VERIFY', desc: 'OT entry submitted and awaiting review by Vertical Head / HOD.' },
    { status: 'VERIFIED', desc: 'Approved by HOD or auto-approved by HR Policy. Eligible for payroll calculation.' },
    { status: 'REJECTED', desc: 'Declined by HOD with documented rejection reason.' }
  ],
  components: [
    { name: 'OT Entry Register Tab', desc: 'Main register listing all overtime records with date filtering and consider date toggle.' },
    { name: 'OT Verification Queue Tab', desc: 'Targeted HOD queue displaying pending records assigned to the logged-in team lead.' },
    { name: 'HH:mm Client Time Converter', desc: 'Formatted time display ensuring clean data storage in integer minutes.' }
  ],
  examples: [
    'Example 1: Employee works 2 hours 30 mins OT on 15-Aug -> Input 02:30 -> Stored as 150 minutes in DB.',
    'Example 2: HOD opens Verification Queue -> Selects 3 pending OT entries -> Clicks Batch Approve -> Status updates to VERIFIED.'
  ]
};

export default OtMasterManual;
