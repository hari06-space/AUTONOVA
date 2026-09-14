/**
 * User Manual & SOP Documentation for Terms Master (M5210)
 */
export const TermsMasterManual = {
  title: 'Terms Master SOP & User Manual',
  introduction:
    'The Terms Master module manages standard commercial, payment, delivery, and contractual terms utilized across sales, purchasing, and operations within the enterprise ERP system.',
  steps: [
    {
      num: '01',
      title: 'Accessing Terms Master',
      desc: 'Navigate to Masters > Sales > Terms & Logistics > Terms Master from the main sidebar navigation.'
    },
    {
      num: '02',
      title: 'Searching and Filtering Terms',
      desc: 'Use the global search or column-specific filters to quickly search terms by Type, Code, or Description.'
    },
    {
      num: '03',
      title: 'Creating New Terms',
      desc: 'Click on the "New" button (or press Ctrl + N). Select the Term Type (e.g., PAYMENT, DELIVERY, COMMERCIAL, GENERAL), provide a Code, enter the full detailed Description, and specify the Active status.'
    },
    {
      num: '04',
      title: 'Editing Terms',
      desc: 'Click on the Edit icon on any row to open the editing dialog and update the code, description, or toggle status.'
    },
    {
      num: '05',
      title: 'Deleting Terms',
      desc: 'Click on the Delete icon to remove a term. Note: Terms linked to historical quotations or orders should instead be set to Inactive to maintain audit history.'
    }
  ],
  components: [
    { name: 'Term Type', desc: 'Category of terms such as PAYMENT, DELIVERY, COMMERCIAL, or GENERAL.' },
    { name: 'Term Code', desc: 'Short identifier or alphanumeric code for reference (e.g. NET30, ADV100, CIF).' },
    { name: 'Description', desc: 'Full text definition of the terms.' },
    { name: 'Status', desc: 'Active (1) or Inactive (0) status toggle.' }
  ]
};

export default TermsMasterManual;
