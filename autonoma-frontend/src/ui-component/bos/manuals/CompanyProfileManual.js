const CompanyProfileManual = {
  title: 'Company Credentials & Security Settings Manual',
  introduction: 'The Company Profile & Credentials module manages corporate entity details, document storage, SMTP settings, eSSL integration, and enterprise Login Access Security / Device & Network restrictions.',
  steps: [
    { num: '01', title: 'Manage Corporate Details', desc: 'Maintain company name, GSTIN, legal address, contact numbers, and branding logos.' },
    { num: '02', title: 'Configure Document Storage & Services', desc: 'Set up Central Document Storage paths, OCR endpoints, SMTP email relays, and biometric eSSL databases.' },
    { num: '03', title: 'Configure Login Access Security', desc: 'Navigate to the "Login Security" tab to configure IP Address, Device / MAC, or combined IP+Device restrictions.' },
    { num: '04', title: 'Register Authorized IPs & Devices', desc: 'Add allowed IP addresses or click "Register Current Device" to authorize workstations before enabling security.' },
    { num: '05', title: 'Enable Security Enforcement', desc: 'Switch Login Security to ENABLED. The system validates admin lockout safeguards to prevent accidental administrator lockout.' }
  ],
  statusFlow: [
    { status: 'SECURITY_DISABLED', desc: 'Login access restrictions are inactive. All authorized accounts log in normally.' },
    { status: 'IP_RESTRICTED', desc: 'Logins are only allowed from configured, active IP addresses.' },
    { status: 'DEVICE_RESTRICTED', desc: 'Logins are only allowed from registered, authorized client devices.' },
    { status: 'IP_AND_DEVICE_RESTRICTED', desc: 'Strict AND enforcement requiring both authorized IP and registered device.' }
  ],
  components: [
    { name: 'Global Security Switch', desc: 'Enables or disables login access restrictions across the enterprise.' },
    { name: 'Access Control Method', desc: 'Selects IP Address, Device / MAC, or IP + Device enforcement mode.' },
    { name: 'Allowed IPs Table', desc: 'Manages permitted IPv4/IPv6 networks and workstations with validity date ranges.' },
    { name: 'Registered Devices Table', desc: 'Maintains authorized workstation device identifier tokens and user mappings.' },
    { name: 'Register Current Device', desc: 'One-click registration of current administrator workstation and IP.' },
    { name: 'Login Security Logs', desc: 'Real-time audit log of allowed and blocked login attempts with failure diagnostics.' }
  ]
};

export default CompanyProfileManual;
