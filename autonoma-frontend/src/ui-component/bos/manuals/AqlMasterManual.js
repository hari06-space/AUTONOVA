export const AqlMasterManual = {
  title: "Acceptable Quality Limit (AQL) Master Manual",
  introduction: "The AQL Master module maintains Acceptable Quality Limit configurations and lot-size-based sampling rules for Incoming Inspection and Quality Control workflows.",
  steps: [
    { num: '01', title: 'Create AQL Configuration', desc: 'Click "+ Add AQL" on the toolbar to open the basic configuration form.' },
    { num: '02', title: 'Define Basic Parameters', desc: 'Specify AQL Name, Inspection Level (e.g. Level II), Inspection Type (Normal/Tightened/Reduced), and AQL Value.' },
    { num: '03', title: 'Add Sampling Rules', desc: 'Define lot size ranges (Lot Size From - Lot Size To), Sample Size, Acceptance Qty, and Rejection Qty.' },
    { num: '04', title: 'Validate & Save', desc: 'Ensure lot size ranges do not overlap, Sample Size > 0, and Acceptance Qty <= Sample Size before saving.' }
  ],
  statusFlow: [
    { status: 'ACTIVE', desc: 'AQL master configuration is available for assignment in Inspection Specifications.' },
    { status: 'INACTIVE', desc: 'AQL master is disabled and cannot be linked to new specifications.' }
  ],
  components: [
    { name: 'Basic Information', desc: 'Maintains header settings including inspection levels and AQL values.' },
    { name: 'Sampling Rules Matrix', desc: 'Defines dynamic sample size resolution based on incoming lot quantities.' }
  ]
};

export default AqlMasterManual;
