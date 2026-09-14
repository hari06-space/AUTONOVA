export const EmailContentManual = {
  title: 'Email Content Master Workflow SOP',
  introduction: 'Enables HR administrators to configure email templates with dynamic placeholders and resolve sender signatures dynamically at runtime.',
  steps: [
    { num: '01', title: 'Create or Edit Template', desc: 'Select email template type (e.g., CALL LETTER, OFFER LETTER, BACKGROUND VERIFICATION) and define the subject and body structure.' },
    { num: '02', title: 'Configure Sender Credentials', desc: 'Toggle "Use Current Logged-in User Credentials" to YES for dynamic sender signature resolution at email preview/send time, or NO to specify static signature parameters.' },
    { num: '03', title: 'Perform Profile Integrity Checks', desc: 'Ensure that the active user\'s Employee Master -> Job Details contains Name, Designation, Department, Office Email, and Official Contact. Any missing details will block template saving and sending.' },
    { num: '04', title: 'Dynamic Placeholder Insertion', desc: 'Two methods are available: (A) Drag & Drop: Drag a chip from the Dynamic Placeholders panel and drop it into the Subject or Body/Content editor. (B) "/" Suggestion Dropdown: Type "/" in the Subject or Body/Content field to open the contextual suggestion dropdown and select a placeholder to insert it at the cursor position.' }
  ],
  statusFlow: [
    { status: 'ACTIVE', desc: 'Template is verified and available for automated or manual email dispatches.' },
    { status: 'INACTIVE', desc: 'Template is disabled and will not be resolved or sent by the recruitment module.' }
  ],
  examples: [
    'Toggle dynamic credentials -> Red alert displays missing fields -> Add Office Email in Job Details -> Validation clears.',
    'Select CALL LETTER -> Edit template body with placeholders -> Save -> Template resolves sending HR credentials at runtime.',
    'Type "/" inside the Subject input -> Select {{position}} from the contextual dropdown list -> Placeholder is inserted at cursor position.'
  ]
};
