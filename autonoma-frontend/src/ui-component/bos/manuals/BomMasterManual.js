export const BomMasterManual = {
  title: "Product BOM Master Manual",
  introduction: "The Product Bill of Materials (BOM) module allows you to define the standard manufacturing process, required materials, machine allocations, and tools for a specific product. This serves as the fundamental blueprint for all production planning and execution.",
  steps: [
    { num: '01', title: 'Create BOM', desc: 'Click "Add" to define a new BOM configuration. Select the target Parent Product.' },
    { num: '02', title: 'Define Processes', desc: 'Add manufacturing processes in sequence. Specify Process Cost and toggles for Auto GIR / Auto QC.' },
    { num: '03', title: 'Allocate Materials', desc: 'Map raw materials to each process step with their required quantities and UOMs.' },
    { num: '04', title: 'Map Machines & Tools', desc: 'Assign primary and alternative machines (including Setup and Cycle times) and specific tools required for each process.' },
    { num: '05', title: 'Update & Revise', desc: 'Updating an existing BOM automatically increments its Revision Number (e.g., R0 to R1) to maintain an accurate configuration history without duplicating records.' }
  ],
  components: [
    { name: 'Split View Interface', desc: 'Simultaneously view the BOM header details alongside a detailed, interactive process breakdown.' },
    { name: 'Process Summary Metrics', desc: 'The list view automatically aggregates and displays the total number of processes, materials, machines, and tools mapped to each BOM.' }
  ]
};
