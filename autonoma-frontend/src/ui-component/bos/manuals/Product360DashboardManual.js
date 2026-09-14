export const Product360DashboardManual = {
  title: 'Product 360 & Inventory / Production Intelligence Dashboard - User Manual',
  introduction: 'The Product 360 Dashboard delivers an end-to-end operational intelligence view of any manufactured or purchased item. It integrates physical & available stock, reservation sources, 30/60/90-day demand forecasts, ROL & safety stock compliance, shop floor WIP by process, production material shortages, supplier price trends, IQC quality statistics, purchase returns, stock aging, ABC/XYZ classification, and actionable BOSS Intelligence insights.',
  steps: [
    { num: '01', title: 'Product Search & Selection', desc: 'Use the top autocomplete search bar to find an item by Product Code, Name, Part Number, Drawing Number, or HSN Code. Selecting an item instantly loads its consolidated 360° analytics.' },
    { num: '02', title: 'Division & Date Range Filtering', desc: 'Toggle between "All Divisions" or a specific operating division (Chennai, Bangalore, Pune) and adjust analysis date range to filter transaction ledgers and consumption rates.' },
    { num: '03', title: 'Inspect 11 Key Inventory KPIs', desc: 'Review high-impact metrics: Current Stock, Available Stock, Reserved Stock, In-Transit, Open PO Qty, Open PR Qty, ROL, Safety Stock, Max Stock, Days of Inventory (DOI), and Stock Value.' },
    { num: '04', title: 'Evaluate Demand & 90-Day Forecast', desc: 'Examine demand distribution across Customer Orders, Production, and Internal requirements. Review historical trends and projected 30/60/90-day consumption models.' },
    { num: '05', title: 'Shop Floor WIP & Bottlenecks', desc: 'Check process-wise WIP levels across cutting, machining, heat treatment, grinding, assembly, inspection, and packing to locate delayed stages and production bottlenecks.' },
    { num: '06', title: 'Production Material Shortages', desc: 'Inspect component availability against active routing cards. Shortages are immediately highlighted in red with affected parent quantities.' },
    { num: '07', title: 'Procurement & Reorder Action', desc: 'Inspect the explainable Smart Reorder Recommendation and review Open PR / RFQ / PO status in the procurement pipeline.' },
    { num: '08', title: 'Supplier, Quality & Returns Deep-Dive', desc: 'Explore the tabbed deep-dive section for supplier price histories, IQC inspection acceptance %, top defect Pareto charts, purchase returns, and stock aging buckets.' },
    { num: '09', title: 'Interactive Drill-Downs', desc: 'Click on any KPI badge, table row, or insight alert to open dedicated drill-down modals with complete underlying transaction documents.' }
  ],
  components: [
    { name: 'Product Summary Header', desc: 'Displays master item information, 3D visual preview, current cost, last purchase rate, default supplier, and one-click quick action buttons.' },
    { name: 'Inventory KPI Grid', desc: '11 styled metric cards displaying real-time stock balances, pipeline quantities, and days of inventory.' },
    { name: 'Demand & Forecast Charts', desc: 'Interactive Donut, Trend Line, and 30/60/90-day Forecast vs Actual comparative bar charts.' },
    { name: 'ROL & Safety Gauge', desc: 'Visual semi-circular gauge tracking available stock against Reorder Level and minimum buffer thresholds.' },
    { name: 'Projected Stock Trajectory', desc: 'Forward-looking area curve modeling stock depletion vs open incoming shipments.' },
    { name: 'Shop Floor WIP & Shortage', desc: 'Horizontal bar visualization of stage-wise WIP coupled with a bill-of-materials shortage tracking table.' },
    { name: 'BOSS Intelligence Feed', desc: 'Live actionable insight alerts highlighting critical production delays, component shortages, and reorder triggers.' }
  ],
  examples: [
    'Search for "FG-1001" -> Review Current Stock (1,240 NOS) vs Reserved (1,000 NOS) -> Note Available Stock (240 NOS) is below ROL (500 NOS).',
    'Click on "Material Shortage" table -> Inspect RM-1003 (120 NOS Short) -> Click [View All Material Shortage] for complete supplier and PO resolution.',
    'Review BOSS Intelligence Insight "Machining has the highest WIP" -> Click [View Process WIP] to analyze machine queue times and active routing cards.'
  ]
};

export default Product360DashboardManual;
