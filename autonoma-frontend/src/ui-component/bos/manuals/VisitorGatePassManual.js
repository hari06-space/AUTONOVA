export const VisitorGatePassManual = {
  title: 'Visitor Gate Pass SOP & User Manual',
  introduction: 'The Visitor Gate Pass module logs external visitors, vendors, contractors, and guests entering the facility premises with real-time Gate-In and Gate-Out tracking.',
  steps: [
    { num: '01', title: 'Pre-Register / Create Pass', desc: 'Enter visitor details, mobile number, person to meet, purpose, and safety kit allowance.' },
    { num: '02', title: 'Gate In (Entry)', desc: 'Security verifies identity, captures photo, and stamps actual In-Time.' },
    { num: '03', title: 'Facility Visit', desc: 'Host employee receives visitor inside the facility. Tracked under "INSIDE PLANT".' },
    { num: '04', title: 'Gate Out (Exit)', desc: 'Security verifies pass, stamps Out-Time, and archives pass under "CHECKED OUT".' }
  ],
  statusFlow: [
    { status: 'OPEN / PENDING', desc: 'Visitor pass created, awaiting gate arrival.' },
    { status: 'INSIDE PLANT', desc: 'In-Time recorded; visitor currently on premises.' },
    { status: 'CHECKED OUT', desc: 'Out-Time recorded; visitor has safely exited the plant.' },
    { status: 'CANCELLED', desc: 'Visit cancelled or rejected by host.' }
  ]
};
