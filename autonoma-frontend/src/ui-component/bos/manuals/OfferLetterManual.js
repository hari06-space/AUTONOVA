export const OfferLetterManual = {
  title: 'Offer Letter Management Module SOP',
  introduction: 'The Offer Letter module is used to generate, manage, preview, and issue offer letters for selected candidates during the onboarding process. Users can enter candidate details, employment information, salary structure, company information, and employment terms before generating the final offer letter.',
  steps: [
    { num: '01', title: 'Select Candidate', desc: 'Select the candidate from the applicant master list or candidate selection dropdown.' },
    { num: '02', title: 'Verify Candidate Info', desc: 'Verify candidate information (Candidate Name, Candidate ID, Email ID, Mobile Number, Gender, Date of Birth).' },
    { num: '03', title: 'Enter Job Details', desc: 'Enter job-related information (Designation, Department, Reporting Manager, Work Location, Employment Type, Grade).' },
    { num: '04', title: 'Fill Offer Details', desc: 'Fill offer details (Offer Letter Number, Offer Date, Joining Date, Probation Period, Employment Start Date, Offer Valid Till).' },
    { num: '05', title: 'Enter Salary Details', desc: 'Enter salary structure (CTC, Basic Salary, HRA, Special Allowance, Bonus, Variable Pay, Other Allowances, Deductions).' },
    { num: '06', title: 'Verify Company Info', desc: 'Verify company information (Company Name, Address, HR Name, HR Designation, Authorized Signatory, Company Logo).' },
    { num: '07', title: 'Configure Terms & Conditions', desc: 'Configure employment terms and conditions (Working Hours, Working Days, Notice Period, Leave Policy, Confidentiality, Background Check).' },
    { num: '08', title: 'Complete Mandatory Fields', desc: 'Complete all mandatory fields and configure any required dynamic custom fields.' },
    { num: '09', title: 'Click Save', desc: 'Click Save button to validate and save the offer letter record.' },
    { num: '10', title: 'Review Offer Letter Preview', desc: 'Review the generated Offer Letter PDF preview modal within the application.' },
    { num: '11', title: 'Generate Offer Letter PDF', desc: 'Generate the complete Offer Letter PDF reflecting all entered information and dynamic fields.' },
    { num: '12', title: 'Download or Share PDF', desc: 'Download or share the generated PDF directly with the candidate.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'Offer letter drafted and saved' },
    { status: 'PENDING_APPROVAL', desc: 'Awaiting HR authority verification' },
    { status: 'APPROVED', desc: 'Offer approved for candidate dispatch' },
    { status: 'SENT', desc: 'Job offer letter emailed or issued to candidate' },
    { status: 'ACCEPTED', desc: 'Candidate accepted employment offer' },
    { status: 'REJECTED', desc: 'Candidate declined job offer' },
    { status: 'EXPIRED', desc: 'Offer validity period expired' },
    { status: 'CANCELLED', desc: 'Offer letter voided by HR' }
  ],
  examples: [
    'Open Overview -> Click + New Offer Letter -> Select candidate "Hari Chakkaravarthy" -> Click Candidate Info button to verify profile.',
    'Enter salary & job details -> Click Save -> PDF Preview modal opens automatically displaying complete offer letter.'
  ]
};
