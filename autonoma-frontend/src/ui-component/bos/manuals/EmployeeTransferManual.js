export const EmployeeTransferManual = {
  title: 'Employee Transfer Management SOP',
  description: 'Standard Operating Procedure for handling employee department, designation, unit, and type transfers.',
  sections: [
    {
      title: '1. Overview',
      content: 'The Employee Transfer module enables HR administrators to record internal transfers of employees across departments, designations, operating units, or employment categories with scheduled effective revision dates.'
    },
    {
      title: '2. Performing an Employee Transfer',
      content: '1. Click "+ Add Employee Transfer" in the top action bar.\n2. Search and select the employee using the photo-enabled employee lookup.\n3. Verify the employee\'s current profile details displayed in the banner.\n4. Select the target transfer department, designation, unit, or employee type in the Transfer Target section.\n5. Specify the Expected Revision Date (must be today or future date).\n6. Enter optional remarks and click "Save" to execute the transfer.'
    },
    {
      title: '3. Transfer Validation Rules',
      content: '• At least one field (Department, Designation, Unit, Employee Type, or Employee Code) must be modified to perform a transfer.\n• Expected Revision Date is mandatory and cannot be set in the past.\n• Historical transfer logs remain audit-tracked.'
    }
  ]
};

export default EmployeeTransferManual;
