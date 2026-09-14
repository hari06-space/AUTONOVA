const OtVerifyManual = {
  title: 'Overtime (OT) Verification Standard Operating Procedure',
  introduction:
    'The Overtime (OT) Verification module provides Department Heads and Vertical Leads with a streamlined approval queue to verify, approve, or reject employee overtime submissions before monthly payroll execution.',
  steps: [
    {
      num: '01',
      title: 'Review Verification Queue',
      desc: 'Access pending OT requests assigned to your department or vertical head account.'
    },
    {
      num: '02',
      title: 'Inspect Employee Submissions',
      desc: 'Examine the employee name, OT date, hours worked (HH:mm), and work reason remarks.'
    },
    {
      num: '03',
      title: 'Approve or Reject',
      desc: 'Click "Approve" to approve individual requests or select multiple rows using checkboxes for bulk approval.'
    },
    {
      num: '04',
      title: 'Document Rejection Reason',
      desc: 'If rejecting, specify the reason for record transparency and audit logging.'
    }
  ],
  statusFlow: [
    {
      status: 'PENDING_VERIFICATION',
      desc: 'Entry is pending review by HOD.'
    },
    {
      status: 'APPROVED / VERIFIED',
      desc: 'Entry is verified and pushed to monthly payroll summary.'
    },
    {
      status: 'REJECTED',
      desc: 'Entry is rejected and excluded from payroll calculation.'
    }
  ],
  components: [
    {
      name: 'Batch Action Buttons',
      desc: 'Approve Selected or Reject Selected buttons for quick multi-record verification.'
    },
    {
      name: 'Queue Counter Badge',
      desc: 'Displays the live count of pending requests requiring manager attention.'
    }
  ],
  examples: [
    'Example 1: HOD selects 5 pending OT requests and clicks "Approve Selected".',
    'Example 2: HOD rejects an invalid OT entry, logging the rejection reason for the employee.'
  ]
};

export default OtVerifyManual;
