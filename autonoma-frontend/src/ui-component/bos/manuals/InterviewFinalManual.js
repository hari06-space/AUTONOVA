export const InterviewFinalManual = {
  title: 'Interview Final Process & Call Letters SOP',
  introduction: 'Manages salary negotiation rounds, prepares official Call Letters, and prepares joining offers for selected candidates.',
  steps: [
    { num: '01', title: 'Select Candidates', desc: 'Filter candidates who cleared technical and manager interview panels.' },
    { num: '02', title: 'HR Discussion & Negotiation', desc: 'Discuss package parameters, joining date, and general benefits details.' },
    { num: '03', title: 'Call Letter Issuance', desc: 'Generate the Call Letter PDF with scheduled reporting details and dispatch via email.' }
  ],
  statusFlow: [
    { status: 'SHORTLISTED', desc: 'Cleared interview rounds' },
    { status: 'NEGOTIATION', desc: 'Salary package discussion' },
    { status: 'CALL_LETTER_PENDING', desc: 'Awaiting template mapping' },
    { status: 'CALL_LETTER_SENT', desc: 'Dispatched to applicant' },
    { status: 'APPOINTMENT_READY', desc: 'Candidate accepted offer' }
  ],
  examples: [
    'Select candidate -> Click "Configure Call Letter" -> Set reporting date.',
    'Click "Generate Call Letter" -> PDF is compiled dynamically using template AD1200.',
    'Candidate accepts -> Click "Prepare Appointment Order" to transition status.'
  ]
};
