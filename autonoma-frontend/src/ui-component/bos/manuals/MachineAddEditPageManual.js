export const MachineAddEditPageManual = {
  title: "Asset & Machine Master Configuration Manual",
  introduction: "This module allows you to register and manage company assets, track physical specifications, schedule warranties and calibrations, list critical spare parts, and configure automated read/send database integrations.",
  steps: [
    { num: '01', title: 'Asset Information Setup', desc: 'Enter the primary Asset details like ID, Name, UOM, and print titles. Map the technical specifications (Model, Serial, Capacity, and network IP/Port) and purchase/warranty details.' },
    { num: '02', title: 'calibration and Maintenance Schedules', desc: 'Specify Calibration frequency, Last/Next calibration dates, and AMC details to track machine lifecycle compliance.' },
    { num: '03', title: 'Register Critical Spares', desc: 'Go to the "Criterial Spares" tab to register required spare parts with their codes, suppliers, rates, and baseline quantities.' },
    { num: '04', title: 'Database Integration Setup', desc: 'Open "Integration POC" tab. Choose the DB Type (e.g. MS SQL Server, MySQL, PostgreSQL) and fill in host, port, database, and credentials.' },
    { num: '05', title: 'Configure Read Jobs', desc: 'Test connection, select the Production Table from the searchable dropdown, load its columns, customize the SELECT query or use Auto-generate, and enable the Auto Read schedule.' },
    { num: '06', title: 'Configure Send Jobs', desc: 'Write the SQL query that gathers local data to transmit, choose output target database table or JSON file destination, and save the configuration.' }
  ],
  components: [
    { name: 'Asset Info Tab', desc: 'Holds primary info, technical specs, financial tracking, calibration, and deprecation details.' },
    { name: 'Criterial Spares Tab', desc: 'Table list to register item code and names of critical components required for the machine.' },
    { name: 'Integration POC Tab', desc: 'A control panel to setup read/send automated schedules and custom SQL synchronization with the machine DB.' }
  ]
};

export default MachineAddEditPageManual;
