export const InspectionSpecificationManual = {
  title: "Inspection Specification Master Manual",
  introduction: "The Inspection Specification Master defines quality parameters, measurement tolerances, and AQL sampling linkages for Item Quality Plans used during Incoming Quality Control (IQC).",
  steps: [
    { num: '01', title: 'Header Setup', desc: 'Select an Item to auto-derive its Item Group. Enter Specification Name, Version, and Effective Date range.' },
    { num: '02', title: 'Open Parameter Drawer', desc: 'Click "+ Add Parameter" to open the slide-out drawer for parameter configuration.' },
    { num: '03', title: 'Define Parameter Criteria', desc: 'Specify Parameter Name, Group Heading, Process, Instrument, Condition (MIN_MAX, VISUAL, etc.), and UOM.' },
    { num: '04', title: 'Link AQL Configuration', desc: 'Select an active AQL Master to automatically resolve sampling rules dynamically during incoming inspections.' },
    { num: '05', title: 'Select Inspection Stages', desc: 'Select relevant stages (Incoming, Final, Line, etc.) and save parameters to the specification matrix.' },
    { num: '06', title: 'Validate & Save Specification', desc: 'Click Save/Update. The system performs date-overlap validation against active versions for the same item.' }
  ],
  statusFlow: [
    { status: 'ACTIVE', desc: 'Active specification used by Incoming Inspection for quality resolution.' },
    { status: 'INACTIVE', desc: 'Archived or superseded specification version.' }
  ],
  components: [
    { name: 'Item-Level Mapping', desc: 'Item Group is automatically derived from the selected Item to ensure data consistency.' },
    { name: 'Parameter Matrix', desc: 'Displays a dense summary of all inspection parameters with sequence order.' },
    { name: 'Parameter Drawer', desc: 'Slide-out interface organizing parameters into logical tabs and dynamic condition fields.' },
    { name: 'Date Overlap Guard', desc: 'Prevents active effective-date collisions for the same item across versions.' }
  ]
};

export default InspectionSpecificationManual;
