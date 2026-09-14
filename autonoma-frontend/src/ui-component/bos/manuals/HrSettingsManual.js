const HrSettingsManual = {
  title: 'HR Policy & Master Configuration Settings Manual',
  introduction: 'The HR Policy & Master Configuration module provides centralized control over Leave, Permission, Attendance LOM, Overtime (OT), Biometric eSSL, and Payroll calculation rules across the organization.',
  steps: [
    { num: '01', title: 'Navigate Policy Tabs', desc: 'Select any of the 5 policy category tabs (Leave, Permission, Attendance & LOM, Overtime & eSSL, Payroll & Salary) to inspect parameters.' },
    { num: '02', title: 'Configure Policy Rules', desc: 'Adjust switches for Boolean policies or enter numeric thresholds for days, minutes, intervals, and multipliers.' },
    { num: '03', title: 'Save Settings', desc: 'Click "Save Settings" in the top sticky header toolbar to apply policy changes to the database.' },
    { num: '04', title: 'Reset to Defaults', desc: 'Click "Reset Defaults" if you wish to restore standard corporate default values across all policy categories.' }
  ],
  statusFlow: [
    { status: 'DRAFT', desc: 'Local setting adjustments modified on screen.' },
    { status: 'CONFIGURED', desc: 'Policy saved to HR_SETTING_MASTER database table.' },
    { status: 'ENFORCED', desc: 'Policy rules actively enforced during employee transactions and payroll processing.' }
  ],
  components: [
    { name: 'Leave Apply Policy Tab', desc: 'Controls backdated leave limits, advance notice days, sandwich rules, and negative balance toggles.' },
    { name: 'Permission Apply Policy Tab', desc: 'Controls short permission frequency, per-request caps, and monthly cumulative duration caps.' },
    { name: 'Attendance & LOM Policy Tab', desc: 'Configures Loss of Minutes grace period, permission waiving, and late arrival penalties.' },
    { name: 'Overtime & Biometric eSSL Tab', desc: 'Configures OT calculation rounding, minimum thresholds, OT multipliers, and biometric device sync intervals.' },
    { name: 'Payroll & Salary Components Tab', desc: 'Configures statutory PF/ESI/PT defaults, LTA eligibility defaults, and payslip cutoff days.' }
  ],
  examples: [
    'Enabling Sandwich Leave Rule so weekends between leave days are included in leave calculations.',
    'Setting Max Backdated Leave Days Allowed to 3 days to restrict late submissions.',
    'Configuring LOM Grace Period to 15 minutes to allow employee arrival tolerance.'
  ]
};

export default HrSettingsManual;
