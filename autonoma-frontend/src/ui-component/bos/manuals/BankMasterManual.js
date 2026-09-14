export const BankMasterManual = {
  title: 'Bank Master SOP & User Guide',
  introduction: 'The Bank Master module allows HR & Payroll administrators to configure corporate bank accounts, branch details, IFSC codes, and account holder credentials for salary processing and direct bank transfers.',
  steps: [
    {
      num: '01',
      title: 'Access Bank Master',
      desc: 'Navigate to Payroll Master -> Bank Master from the sidebar navigation menu.'
    },
    {
      num: '02',
      title: 'Add New Bank Details (Space + N)',
      desc: 'Click "+ Add Bank" or press Space + N. Enter the Bank Name, Account Number, Account Holder Name, and 11-character IFSC Code.'
    },
    {
      num: '03',
      title: 'Specify Branch & Account Type',
      desc: 'Select the Account Type (Savings, Current, Salary, or Overdraft) and specify Branch Name and Branch Location.'
    },
    {
      num: '04',
      title: 'Save Bank Configuration (Space + S)',
      desc: 'Click "Save" or press Space + S. The system validates uniqueness of the account number and bank code.'
    },
    {
      num: '05',
      title: 'Edit & Manage Status',
      desc: 'Double-click any row to edit bank information or update active status.'
    }
  ],
  components: [
    {
      name: 'BOSDataTable',
      desc: 'Enterprise data table with search filtering and sorting.'
    },
    {
      name: 'BOSTableToolbar',
      desc: 'Action toolbar providing refresh, new bank creation, and Excel export.'
    }
  ]
};

export default BankMasterManual;
