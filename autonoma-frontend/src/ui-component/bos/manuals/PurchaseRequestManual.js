export const PurchaseRequestManual = {
  title: "Purchase Request (PR) Management Manual",
  introduction: "The Purchase Request (PR) module allows departments to raise requests for materials. It supports internal approvals and serves as the starting point for the procurement lifecycle.",
  steps: [
    { num: '01', title: 'Create New PR', desc: 'Click "New Request" to initiate a PR. Select the requesting department and set the priority level.' },
    { num: '02', title: 'Add Material Details', desc: 'Add items to the request, specifying required quantities, expected delivery dates, and any technical remarks.' },
    { num: '03', title: 'Submit for Approval', desc: 'Once all details are filled, submit the PR. It will be routed to the respective department head or authority for approval.' },
    { num: '04', title: 'Approval Workflow', desc: 'Approvers can review the PR and either Approve, Reject, or request modifications.' },
    { num: '05', title: 'Proceed to Procurement', desc: 'Approved PRs are available to the purchase department for generating RFQs or Direct POs.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'PR is being prepared and is not yet submitted.' },
    { status: 'SUBMITTED', desc: 'PR is submitted and pending approval.' },
    { status: 'APPROVED', desc: 'PR is approved and ready for procurement action.' },
    { status: 'REJECTED', desc: 'PR was rejected by the approver.' }
  ],
  components: [
    { name: 'Priority Indicator', desc: 'Highlights urgent requests for faster processing.' },
    { name: 'Lifecycle Timeline', desc: 'Visual timeline showing the progression of the PR through RFQ, PO, and GRN.' }
  ]
};
