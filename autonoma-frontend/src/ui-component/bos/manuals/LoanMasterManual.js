export const LoanMasterManual = {
  title: 'Loan Master SOP & User Guide',
  introduction: 'The Loan Master module allows HR administrators to define loan and advance types, configure minimum and maximum loan limits, and manage active loan master configurations.',
  steps: [
    {
      num: '01',
      title: 'Access Loan Master',
      desc: 'Navigate to Payroll Master -> Loan Master from the sidebar navigation menu or via shortcut.'
    },
    {
      num: '02',
      title: 'Create New Loan Type (Space + N)',
      desc: 'Click on the "+ Add Loan" button or press Space + N. Select a Loan Type from the predefined list or choose OTHERS to enter a custom loan name.'
    },
    {
      num: '03',
      title: 'Set Loan Limits & Remarks',
      desc: 'Specify the Minimum Limit and Maximum Limit allowed for the loan type. Equal minimum and maximum values are allowed (e.g. ₹5,000 to ₹5,000).'
    },
    {
      num: '04',
      title: 'Save Configuration (Space + S)',
      desc: 'Click "Save" or press Space + S. The system validates uniqueness of the loan code and loan type name.'
    },
    {
      num: '05',
      title: 'Edit or Remove Configuration',
      desc: 'Double-click any row or click the Edit icon to modify limits. Deletion is prevented if the loan type is currently issued to active employees.'
    }
  ],
  components: [
    {
      name: 'BOSDataTable',
      desc: 'Enterprise data table with server-side pagination, search filtering, and dense viewing.'
    },
    {
      name: 'BOSTableToolbar',
      desc: 'Action toolbar providing refresh, add, column selection, and Excel export.'
    }
  ]
};

export default LoanMasterManual;
