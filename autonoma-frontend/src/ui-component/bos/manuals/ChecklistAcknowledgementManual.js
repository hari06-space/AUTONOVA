const ChecklistAcknowledgementManual = {
  title: "QMS Checklist Acknowledgement User Manual",
  introduction: "The Checklist Acknowledgement module enables employees to review, accept, or reject checklist reassignments assigned to them by Administrators with full audit logging and role-based notifications.",
  steps: [
    {
      num: "01",
      title: "View Pending Reassignments",
      desc: "Navigate to QMS > Checklist > Checklist Acknowledgement. The dashboard displays all reassignments pending your review."
    },
    {
      num: "02",
      title: "Review Reassignment Details",
      desc: "Inspect the Checklist Code, Checking Point, Assigned Member Role (Primary, Secondary, or Tertiary), Reassigned By, and Reassignment Reason."
    },
    {
      num: "03",
      title: "Accepting Reassignment",
      desc: "Click 'Accept' to confirm your ownership. The checklist member binding will update permanently, and the reassigner will receive an acceptance notification."
    },
    {
      num: "04",
      title: "Rejecting Reassignment",
      desc: "Click 'Reject' if you cannot accept the assignment. A mandatory modal will prompt you for comments (minimum 5 characters). Upon rejection, Checklist Master Administrators receive a high-priority alert."
    }
  ],
  statusFlow: [
    { status: "PENDING", desc: "Reassignment initiated by Administrator; awaiting employee response." },
    { status: "ACCEPTED", desc: "Employee accepted reassignment; member binding permanently updated." },
    { status: "REJECTED", desc: "Employee rejected reassignment with comments; routed for Admin review." },
    { status: "INACTIVE", desc: "Reassignment was closed or superseded by a newer reassignment." }
  ],
  components: [
    { name: "Summary Cards", desc: "Real-time metrics showing total Pending, Accepted, and Rejected reassignments." },
    { name: "Rejection Modal", desc: "Mandatory comment popup requiring a detailed explanation for rejection." }
  ]
};

export default ChecklistAcknowledgementManual;
