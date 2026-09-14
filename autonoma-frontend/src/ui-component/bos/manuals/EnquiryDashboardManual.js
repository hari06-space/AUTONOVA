export const EnquiryDashboardManual = {
  title: 'Enquiry Dashboard & OCR Processing - User Manual',
  introduction: 'This module processes incoming customer enquiries from registered mailboxes. It utilizes OCR to parse attachments, automatically generates local cached previews, and maps reference ledger data.',
  steps: [
    { num: '01', title: 'Automated Polling', desc: 'The background service automatically polls unread messages from the Outlook Graph API every 60 seconds.' },
    { num: '02', title: 'Local Caching & OCR Extraction', desc: 'The system automatically filters email signature logos, saves real document/image attachments locally, and extracts EML email files for fast previewing.' },
    { num: '03', title: 'Inspect Enquiries', desc: 'View list of scanned enquiries, status of OCR processing, and open items needing approval.' },
    { num: '04', title: 'Preview Attachments', desc: 'Open a work item to view instant side-by-side previews of cached PDF, Excel, image, and .eml archive documents fetched from local storage.' }
  ],
  components: [
    { name: 'Automated Polling Service', desc: 'Background daemon that automatically synchronizes new unread emails from the Microsoft Graph shared mailbox.' },
    { name: 'Document Previewer', desc: 'Provides tabbed instant views of all cached email parts (.eml, PDF, Excel sheets) straight from the local file server.' },
    { name: 'Work Item Details', desc: 'Displays ledger mapping, extracted parts, text search, and validation status of the enquiry request.' }
  ],
  examples: [
    'Mark a processed email as unread in Outlook -> Wait for the automatic polling (every 60 seconds) -> The request will re-process and cache files locally.',
    'Click on an Enquiry -> Choose the "Attachments" tab -> Click "Preview EML" to read the raw email content.',
    'Select a cached Excel attachment -> Instantly download or view data extracted into mapped ledger entries.'
  ]
};
