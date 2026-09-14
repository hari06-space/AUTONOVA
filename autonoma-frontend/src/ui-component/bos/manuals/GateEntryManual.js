export const GateEntryManual = {
  title: "Gate Entry Management Manual",
  introduction: "The Gate Entry module acts as the first point of check for materials entering the factory premises. It records vehicle and challan details before materials are unloaded for GRN.",
  steps: [
    { num: '01', title: 'Record Arrival', desc: 'Click "New Gate Entry" when a vehicle arrives at the security gate.' },
    { num: '02', title: 'Enter Vehicle & Supplier Details', desc: 'Input the vehicle number, supplier name, and the driver\'s details.' },
    { num: '03', title: 'Link Source Document', desc: 'Optionally link the entry to an approved Purchase Order or Returnable Gate Pass.' },
    { num: '04', title: 'Verify & Submit', desc: 'Record challan/invoice numbers and submit the entry, allowing the vehicle to proceed to the stores.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'Entry is partially filled.' },
    { status: 'SUBMITTED', desc: 'Gate entry is recorded; pending stores action (GRN).' },
    { status: 'PROCESSED', desc: 'GRN has been generated against this Gate Entry.' },
    { status: 'CANCELLED', desc: 'Gate entry was cancelled due to error or return.' }
  ],
  components: [
    { name: 'Gate Pass Types', desc: 'Supports different inward types (Material, Returnable, Non-Returnable).' },
    { name: 'Weighbridge Integration', desc: 'Fields to capture gross, tare, and net weights.' }
  ]
};
