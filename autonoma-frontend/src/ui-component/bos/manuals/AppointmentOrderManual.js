export const AppointmentOrderManual = {
  title: 'Appointment Order Management Workflow SOP',
  introduction: 'Management portal for generating, reviewing, issuing, and tracking formal candidate Appointment Orders with detailed terms of employment, salary structure, and background verification conditions.',
  steps: [
    { num: '01', title: 'Appointment Order Overview', desc: 'View all issued appointment orders in the master table. Search by candidate name, reference number, department, or status.' },
    { num: '02', title: 'Create / Amend Order', desc: 'Click + New Appointment Order to launch the creation workspace. Select an approved candidate to auto-populate profile and appointment details.' },
    { num: '03', title: 'Remuneration & Terms', desc: 'Configure salary breakdown structure, working hours, shift, work location, and customized appointment clauses.' },
    { num: '04', title: 'Preview & Issue', desc: 'Inspect the live document preview, print official hard copies, or dispatch the digital appointment order via email.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'Appointment order draft saved' },
    { status: 'PENDING_APPROVAL', desc: 'Submitted for HR authority verification' },
    { status: 'APPROVED', desc: 'Order approved for candidate issuance' },
    { status: 'EMAIL_SENT', desc: 'Appointment order emailed to candidate' },
    { status: 'ACCEPTED', desc: 'Candidate confirmed appointment acceptance' },
    { status: 'JOINED', desc: 'Employee onboarded and active in organization' },
    { status: 'CANCELLED', desc: 'Appointment order voided or cancelled' }
  ],
  examples: [
    'Open Overview -> Click + New Appointment Order -> Choose applicant -> Auto-populates terms & salary -> Preview & Print.',
    'Filter table by Status "Email Sent" -> Track delivery and candidate acceptance progress.'
  ]
};
