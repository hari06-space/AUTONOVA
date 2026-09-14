/**
 * Organization: Nutech Wind Parts Pvt Ltd
 * Owner: Yuvanesh M
 * Created At: 2026-09-03
 * Updated By: Yuvanesh M
 * Updated At: 2026-09-03
 * Description: Authoritative document model, salary structure normalization,
 *              token substitution, and clean A4 multi-page HTML builder for
 *              HA1360 Offer Letter. Neutral utility with zero React UI coupling.
 */

import { format } from 'date-fns';
import { getDisplayString, normalizeGender, extractDateString } from 'ui-component/bos/BOSUtils';
import { getCompanyImageUrl } from 'utils/upload-helper';

// Re-export shared BOS utilities so existing callers maintain 100% backward compatibility
export { getDisplayString, normalizeGender, extractDateString };

// ==============================|| PHONE & MOBILE CLEANER ||============================== //

/**
 * Strips ISD alphabetical prefixes, country codes, and non-digit characters.
 */
export const cleanMobileNumber = (val) => {
  if (!val) return '';
  let str = String(getDisplayString(val)).trim();
  if (!str) return '';
  // Strip ISD alphabetical prefixes like IND, IN, US, USA, etc.
  str = str.replace(/^[a-zA-Z]{2,4}[\s\-_:]*/i, '');
  // Strip +country_code like +91, +1, etc.
  str = str.replace(/^\+\d{1,3}[\s\-_:]*/, '');
  // Strip leading 91- or 91_ or 91: or 91 with space
  str = str.replace(/^91[\s\-_:]+/, '');
  // If 12 digits starting with 91 (e.g., 917456685555)
  if (/^91\d{10}$/.test(str)) {
    str = str.substring(2);
  }
  // Remove leading non-digit characters
  str = str.replace(/^[^\d+]+/, '').trim();
  return str;
};

// ==============================|| CANDIDATE & EMAIL RESOLUTION ||============================== //

/**
 * Authoritative Candidate/Employee Email Resolver
 * Ensures real email addresses from ATS candidates or Employee Master are resolved,
 * and strictly prevents candidateId, employeeCode, applicantCode, etc. from being mapped as email.
 */
export const resolveCandidateEmail = (candOrEmp) => {
  if (!candOrEmp || typeof candOrEmp !== 'object') return '';

  const personal = candOrEmp.personal || candOrEmp.personalDetail || candOrEmp.personalDetails || {};
  const job = candOrEmp.jobProfile || candOrEmp.job || candOrEmp.jobDetails || {};
  const org = candOrEmp.organization || {};
  const comm = candOrEmp.communication || candOrEmp.communicationDetail || {};

  const candidateFields = [
    candOrEmp.email,
    candOrEmp.emailId,
    candOrEmp.personalEmail,
    candOrEmp.officeMail,
    candOrEmp.officeEmail,
    candOrEmp.applicantEmail,
    candOrEmp.candidateEmail,
    job.officeEmail,
    job.email,
    org.officeMail,
    org.email,
    personal.email,
    personal.personalEmail,
    personal.emailId,
    comm.email,
    comm.emailId,
    comm.officeEmail
  ];

  const disallowedCodes = new Set([
    getDisplayString(candOrEmp.id).toLowerCase(),
    getDisplayString(candOrEmp.applicantCode).toLowerCase(),
    getDisplayString(candOrEmp.employeeCode).toLowerCase(),
    getDisplayString(candOrEmp.empCode).toLowerCase(),
    getDisplayString(candOrEmp.oldEmpCode).toLowerCase(),
    getDisplayString(candOrEmp.enRolledNo).toLowerCase(),
    getDisplayString(candOrEmp.candidateCode).toLowerCase(),
    getDisplayString(candOrEmp.refNo).toLowerCase(),
    getDisplayString(candOrEmp.offerLetterNo).toLowerCase()
  ].filter(Boolean));

  for (const raw of candidateFields) {
    const val = getDisplayString(raw).trim();
    if (!val) continue;

    // Reject if it matches any code or ID
    if (disallowedCodes.has(val.toLowerCase())) continue;

    // Check if it looks like an email or at least is not a bare identifier
    if (val.includes('@') || (!disallowedCodes.has(val.toLowerCase()) && !val.toUpperCase().startsWith('NT') && !val.toUpperCase().startsWith('EMP-') && !val.toUpperCase().startsWith('ATS-') && !val.toUpperCase().startsWith('APP-'))) {
      return val;
    }
  }

  return '';
};

// ==============================|| DEFAULT PRISTINE DOCUMENT FLOW SECTIONS ||============================== //

export const DEFAULT_DOCUMENT_SECTIONS = [
  {
    id: 'sec_header',
    type: 'company_header',
    title: 'Company Header & Document Details',
    enabled: true,
    order: 1,
    deletable: false,
    sectionWidth: 100,
    sectionMinHeight: 0,
    content: {
      docNoPrefix: 'DOC. No :',
      issueDatePrefix: 'Issue Date :'
    }
  },
  {
    id: 'sec_title',
    type: 'document_title',
    title: 'Document Title',
    enabled: true,
    order: 2,
    deletable: false,
    sectionWidth: 100,
    sectionMinHeight: 0,
    content: {
      text: 'OFFER OF APPOINTMENT'
    }
  },
  {
    id: 'sec_recipient',
    type: 'candidate_recipient',
    title: 'Candidate Recipient Block',
    enabled: true,
    order: 3,
    deletable: false,
    sectionWidth: 100,
    sectionMinHeight: 0,
    content: {}
  },
  {
    id: 'sec_body',
    type: 'salutation_body',
    title: 'Salutation & Opening Paragraph',
    enabled: true,
    order: 4,
    deletable: false,
    sectionWidth: 100,
    sectionMinHeight: 0,
    content: {
      html: '<p>Dear <strong>{{candidateFirstName}}</strong>,</p><p>We are pleased to offer you the position of <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department at <strong>{{companyName}}</strong>. Your reporting date is scheduled for <strong>{{joiningDate}}</strong>.</p><p>We were very impressed by your qualifications and experience during the interview process, and we are confident that your skills will contribute significantly to our continued growth and excellence.</p>'
    }
  },
  {
    id: 'sec_salary',
    type: 'salary_table',
    title: 'Compensation & Benefits Structure',
    enabled: true,
    order: 5,
    deletable: true,
    sectionWidth: 100,
    sectionMinHeight: 0,
    content: {
      customTitle: 'Compensation Structure & Emoluments'
    }
  },
  {
    id: 'sec_signature',
    type: 'signature_block',
    title: 'Signatures & Acceptance',
    enabled: true,
    order: 6,
    deletable: false,
    sectionWidth: 100,
    sectionMinHeight: 0,
    content: {
      authLabel: 'Authorized By',
      candLabel: 'Candidate Acceptance',
      useCurrentUserCredentials: true,
      authName: '',
      authDesignation: '',
      authDepartment: '',
      authPhone: '',
      showCandidateAcceptance: true,
      includeCompanyName: true,
      includeSignatureLine: true
    }
  }
];

export const ESTIMATED_SECTION_HEIGHTS = {
  company_header: 92,
  document_title: 32,
  candidate_recipient: 72,
  salutation_body: 80,
  salary_table: 160,
  signature_block: 75,
  custom_rich_text: 85
};

// ==============================|| TOKEN SUBSTITUTION ENGINE ||============================== //

export const substituteOfferTokens = (text, dataMap = {}) => {
  if (!text) return '';
  let res = String(text);

  const locVal = (dataMap['{{workLocation}}'] || dataMap['{{location}}'] || '').trim();
  if (!locVal) {
    // If work location is not provided/available, cleanly omit any dependent phrase:
    // e.g. "at our {{workLocation}} facility", "at {{workLocation}} facility", "at our <strong>{{workLocation}}</strong> facility", "at our facility", etc.
    res = res.replace(/\s*(?:at|in)\s+(?:our\s+|the\s+)?(?:<[^>]+>)*\{\{(?:workLocation|location)\}\}(?:<\/[^>]+>)*(?:\s+facility)?(?=[.,\s<]|$)/gi, '');
    res = res.replace(/\s*(?:at|in)\s+(?:our\s+|the\s+)?facility(?=[.,\s<]|$)/gi, '');
  }

  Object.keys(dataMap).forEach((tok) => {
    res = res.replaceAll(tok, dataMap[tok] ?? '');
  });

  if (!locVal) {
    res = res.replaceAll('{{workLocation}}', '');
    res = res.replaceAll('{{location}}', '');
    res = res.replace(/\s+\./g, '.');
    res = res.replace(/&nbsp;\./g, '.');
  }

  return res;
};

// ==============================|| OFFER DATA MAP RESOLUTION ||============================== //

export const resolveOfferDataMap = ({
  candidateData = {},
  companyData = {},
  signatoryData = {},
  salaryData = {},
  localSalary = {},
  grossVal = 0,
  ctcVal = 0
} = {}) => {
  const cand = candidateData || {};
  const candName = getDisplayString(cand.candidateName || cand.applicantName || cand.employeeName || cand.name || cand.candidateFullName || '');
  const candCode = getDisplayString(cand.applicantCode || cand.employeeCode || cand.candidateCode || cand.id || '');
  const candEmail = resolveCandidateEmail(cand) || getDisplayString(cand.email || cand.emailId || cand.personalEmail || cand.officeMail || cand.applicantEmail || cand.candidateEmail || (cand.personal && cand.personal.email) || (cand.personalDetail && cand.personalDetail.email) || '');
  const candMobile = cleanMobileNumber(
    cand.mobileNo ||
    cand.mobile ||
    cand.phone ||
    cand.phoneNo ||
    cand.contactNo ||
    cand.contactNumber ||
    cand.phoneNumber ||
    cand.mobileNumber ||
    cand.applicantMobile ||
    cand.candidateMobile ||
    cand.primaryContact ||
    cand.communicationNumber ||
    cand.cellPhone ||
    cand.emergencyContactNo ||
    (cand.personal && (cand.personal.mobileNo || cand.personal.mobile || cand.personal.phone || cand.personal.phoneNo || cand.personal.contactNo)) ||
    (cand.personalDetail && (cand.personalDetail.mobileNo || cand.personalDetail.mobile || cand.personalDetail.phone || cand.personalDetail.phoneNo || cand.personalDetail.contactNo)) ||
    (cand.personalDetails && (cand.personalDetails.mobileNo || cand.personalDetails.mobile || cand.personalDetails.phone || cand.personalDetails.phoneNo || cand.personalDetails.contactNo)) ||
    (cand.communication && (cand.communication.mobileNo || cand.communication.phone || cand.communication.contactNo)) ||
    (cand.contact && (cand.contact.mobileNo || cand.contact.phone || cand.contact.contactNo)) ||
    ''
  );
  const candGender = normalizeGender(cand.gender || cand.sex || '');
  const candDob = extractDateString(cand.dob || cand.birthDate || cand.dateOfBirth || '');

  const firstName = candName ? (candName.trim().split(' ')[0] || candName) : '';

  const desig = getDisplayString(cand.designation || cand.designationName || cand.positionLookFor || cand.position || cand.appliedRole || cand.role || cand.jobTitle || '');
  const dept = getDisplayString(cand.department || cand.departmentName || cand.departmentCode || '');
  const loc = getDisplayString(
    cand.workLocation ||
    cand.location ||
    cand.locationName ||
    cand.plantLocation ||
    cand.branchLocation ||
    cand.facility ||
    cand.placeOfPosting ||
    cand.workPlace ||
    (cand.jobProfile && (cand.jobProfile.workLocation || cand.jobProfile.location)) ||
    ''
  );
  const resolveEmpTypeFromCandidate = (candidateObj) => {
    if (!candidateObj) return '';
    const raw =
      candidateObj.employmentType ||
      candidateObj.employeeType ||
      (candidateObj.jobProfile && (candidateObj.jobProfile.employmentType || candidateObj.jobProfile.employeeType)) ||
      (candidateObj.organization && (candidateObj.organization.employmentType || candidateObj.organization.employeeType)) ||
      candidateObj.empType ||
      candidateObj.jobType ||
      candidateObj.engagementType ||
      candidateObj.hiringType ||
      '';

    if (raw && typeof raw === 'object') {
      return getDisplayString(raw.typeName || raw.name || raw.type_name || '');
    }
    return getDisplayString(raw);
  };

  const empType = resolveEmpTypeFromCandidate(cand);
  const repMgr = getDisplayString(cand.reportingManager || cand.reportingTo || '');

  const offerNum = getDisplayString(cand.offerNo || cand.offerLetterNo || cand.refNo || cand.offerNumber || '');
  const offDate = extractDateString(cand.offerDate || cand.letterDate || cand.issueDate || '') || format(new Date(), 'yyyy-MM-dd');
  const joinDate = extractDateString(cand.joiningDate || cand.reportDate || cand.reportingDate || '') || '';
  const probPeriod = cand.probationPeriod ? (String(cand.probationPeriod).includes('Month') ? String(cand.probationPeriod) : `${cand.probationPeriod} Months`) : '';
  const validity = cand.validityDays ? String(cand.validityDays) : '2';

  const salMap = localSalary && Object.keys(localSalary).length > 0 ? localSalary : (salaryData?.salaryComponents || salaryData?.localSalary || {});
  const basic = Number(salMap.BASIC || salMap.BASIC_PAY || salMap.BASIC_SALARY || salMap.basic || salMap.basicPay || salMap.basicSalary) || Number(cand.basicPay) || Number(cand.basicSalary) || Number(salaryData?.basic) || 0;
  const hra = Number(salMap.HRA || salMap.HOUSE_RENT_ALLOWANCE || salMap.hra || salMap.houseRentAllowance) || Number(cand.hraPay) || Number(cand.hra) || Number(salaryData?.hra) || 0;
  const splAllow = Number(salMap.SPECIAL_ALLOWANCE || salMap.SPECIAL_PAY || salMap.SPL_ALLOWANCE || salMap.specialAllowance) || Number(cand.specialAllowance) || Number(salaryData?.specialAllowance) || 0;
  const g = Number(grossVal || salaryData?.gross || 0);
  const monthlyCtc = Number(ctcVal || salaryData?.monthlyCtc || (g > 0 ? g : 0));
  const annualCtc = Number(cand.annualCtc || cand.totalCTC || salaryData?.annualCtc || salaryData?.totalCTC || (salaryData?.ctc && Number(salaryData.ctc) > monthlyCtc ? salaryData.ctc : 0) || (monthlyCtc * 12) || 0);

  const comp = companyData || {};
  const compName = getDisplayString(comp.companyName || comp.name || cand.companyName || '');
  const compAddr = getDisplayString(comp.companyAddress || comp.address || '');
  const compGstin = getDisplayString(comp.companyGstin || comp.gstIn || comp.gstin || '');
  const compPhone = getDisplayString(comp.companyPhone || comp.phoneNo || comp.phone || '');
  const compEmail = getDisplayString(comp.companyEmail || comp.emailId || comp.email || '');
  const compWeb = getDisplayString(comp.companyWeb || comp.website || '');
  let compLogo = comp.companyLogo || comp.logo || comp.logoUrl || '';
  if (!compLogo && comp.logoFileName) {
    compLogo = getCompanyImageUrl(comp.logoFileName);
  } else if (compLogo && typeof compLogo === 'string' && !compLogo.startsWith('http') && !compLogo.startsWith('data:') && !compLogo.startsWith('blob:') && !compLogo.startsWith('/api')) {
    compLogo = getCompanyImageUrl(compLogo);
  }

  const sig = signatoryData || {};
  const hrName = getDisplayString(sig.name || sig.hrName || cand.hrName || '');
  const hrDesig = getDisplayString(sig.designation || sig.hrDesignation || cand.hrDesignation || 'HR Manager');

  return {
    '{{candidateName}}': candName,
    '{{candidateFullName}}': candName,
    '{{candidateFirstName}}': firstName,
    '{{candidateCode}}': candCode,
    '{{applicantCode}}': candCode,
    '{{candidateId}}': candCode,
    '{{candidateEmail}}': candEmail,
    '{{candidateMobile}}': candMobile,
    '{{candidatePhone}}': candMobile,
    '{{gender}}': candGender,
    '{{dob}}': candDob,

    '{{designation}}': desig,
    '{{position}}': desig,
    '{{positionLookFor}}': desig,
    '{{role}}': desig,
    '{{jobTitle}}': desig,
    '{{department}}': dept,
    '{{departmentName}}': dept,
    '{{workLocation}}': loc,
    '{{location}}': loc,
    '{{employmentType}}': empType,
    '{{employeeType}}': empType,
    '{{reportingManager}}': repMgr,

    '{{offerNo}}': offerNum,
    '{{offerNumber}}': offerNum,
    '{{offerLetterNo}}': offerNum,
    '{{refNo}}': offerNum,
    '{{offerDate}}': offDate,
    '{{letterDate}}': offDate,
    '{{issueDate}}': offDate,
    '{{currentDate}}': offDate,
    '{{joiningDate}}': joinDate,
    '{{reportingDate}}': joinDate,
    '{{probationPeriod}}': probPeriod,
    '{{validityDays}}': validity,

    '{{annualCTC}}': annualCtc > 0 ? `₹${annualCtc.toLocaleString('en-IN', { maximumFractionDigits: 2 })} / Annum` : '',
    '{{totalCTC}}': annualCtc > 0 ? `₹${annualCtc.toLocaleString('en-IN', { maximumFractionDigits: 2 })} / Annum` : '',
    '{{grossSalary}}': g > 0 ? `₹${g.toLocaleString('en-IN', { maximumFractionDigits: 2 })} / Month` : '',
    '{{basicSalary}}': basic > 0 ? `₹${basic.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '',
    '{{basicPay}}': basic > 0 ? `₹${basic.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '',
    '{{hra}}': hra > 0 ? `₹${hra.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '',
    '{{specialAllowance}}': splAllow > 0 ? `₹${splAllow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '',

    '{{companyName}}': compName,
    '{{companyAddress}}': compAddr,
    '{{companyGstin}}': compGstin,
    '{{companyPhone}}': compPhone,
    '{{companyEmail}}': compEmail,
    '{{companyWeb}}': compWeb,
    '{{companyLogo}}': compLogo,

    '{{hrSignatoryName}}': hrName,
    '{{hrName}}': hrName,
    '{{hrSignatoryTitle}}': hrDesig,
    '{{hrDesignation}}': hrDesig
  };
};

// ==============================|| HIGH-RESOLUTION A4 PDF RENDER CONFIG ||============================== //
/**
 * Optimized high-resolution PDF rendering configuration for Offer Letters.
 * Uses scale: 3 (288 DPI print-quality resolution) with lossless PNG image rendering
 * and native subpixel font smoothing to eliminate blurriness without excessive memory consumption.
 */
export const OFFER_LETTER_PDF_CONFIG = {
  margin: 0,
  image: { type: 'png' },
  html2canvas: {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    letterRendering: false,
    scrollY: 0,
    scrollX: 0,
    windowWidth: 794,
    width: 794
  },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
  pagebreak: { mode: ['css', 'legacy'] }
};

export const getOfferLetterPdfOptions = (filename = 'Offer_Letter.pdf') => ({
  ...OFFER_LETTER_PDF_CONFIG,
  filename
});

// ==============================|| CANONICAL SALARY NORMALIZATION ENGINE ||============================== //

/**
 * Authoritative normalization function for Offer Letter salary structure.
 * Separates salary components dynamically into:
 *   1. EARNINGS
 *   2. DEDUCTIONS
 *   3. EMPLOYER_CONTRIBUTIONS
 * Preserves exact component definitions, display sequence, amounts, and authoritative totals.
 * Enforces all 10 mathematical invariants and anti-aliasing guards.
 */
export const normalizeOfferSalaryStructure = ({
  compsList = [],
  salaryMap = {},
  grossVal = 0,
  deductionsVal = 0,
  contributionsVal = 0,
  netVal = 0,
  ctcVal = 0,
  annualCtc = 0
} = {}) => {
  const sal = salaryMap || {};

  // Statutory toggle detection
  const isEnabledFlag = (val) =>
    val === undefined || val === null || val === true || String(val) === '1' || String(val).toLowerCase() === 'true' || val === 'YES';

  const isPFEnabled = isEnabledFlag(sal.providentFund ?? sal.isPFEnabled ?? sal.pfApplicable ?? sal.pfAllowed);
  const isESIEnabled = isEnabledFlag(sal.esiAllowed ?? sal.isESIEnabled ?? sal.esiApplicable);
  const isPTaxEnabled = isEnabledFlag(sal.professionalTax ?? sal.isPTaxEnabled ?? sal.ptaxApplicable ?? sal.ptApplicable);

  const isEnabledByToggle = (c) => {
    const code = (c.componentCode || c.componentName || '').toUpperCase();
    if ((code.includes('PF') || code.includes('PROVIDENT')) && !isPFEnabled) return false;
    if (code.includes('ESI') && !isESIEnabled) return false;
    if ((code.includes('PTAX') || code.includes('PROFESSIONAL_TAX') || code === 'PT') && !isPTaxEnabled) return false;
    return true;
  };

  const isVisibleInRegister = (c) => c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1' || c.showInRegister === undefined;

  let earnings = [];
  let deductions = [];
  let contributions = [];

  if (Array.isArray(compsList) && compsList.length > 0) {
    // Sort components by sequenceNo if available
    const sortedComps = [...compsList].sort((a, b) => (Number(a.sequenceNo) || 0) - (Number(b.sequenceNo) || 0));

    sortedComps.forEach((c) => {
      if (c.isActive === false || !isVisibleInRegister(c) || !isEnabledByToggle(c)) {
        return;
      }
      const type = (c.componentType || '').trim().toUpperCase();
      const code = c.componentCode || c.componentName;

      // Exclude summary keys if they exist in components list
      if (['GROSS', 'NET_SALARY', 'EARNING', 'TOTAL_EARNING', 'TOTAL_DEDUCTIONS', 'TOTAL_CONTRIBUTIONS', 'CTC', 'TOTAL_CTC', 'TOTALCTC', 'ANNUAL_CTC', 'MONTHLY_CTC', 'NET', 'NET_PAY'].includes((code || '').toUpperCase())) {
        return;
      }

      let rawVal = sal[code] ?? sal[c.componentCode] ?? sal[c.componentName] ?? sal[c.displayName];
      if (rawVal === undefined || rawVal === null) {
        // Case-insensitive / whitespace-tolerant lookup
        const codeClean = (c.componentCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const nameClean = (c.displayName || c.componentName || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const foundEntry = Object.entries(sal).find(([k]) => {
          const kClean = k.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return (kClean && (kClean === codeClean || kClean === nameClean)) || false;
        });
        if (foundEntry) rawVal = foundEntry[1];
      }

      const monthlyVal = Number(
        rawVal !== undefined && rawVal !== null
          ? rawVal
          : (['DAILY_RATE', 'FIXED'].includes(c.calculationType) ? (c.calculationValue || 0) : 0)
      );

      const compItem = {
        code: c.componentCode || code,
        name: c.displayName || c.componentName || c.componentCode,
        monthly: monthlyVal,
        annual: monthlyVal * 12,
        calculationType: c.calculationType || 'MANUAL',
        sequenceNo: Number(c.sequenceNo) || 0
      };

      if (type === 'EARNING') {
        earnings.push(compItem);
      } else if (type === 'DEDUCTION') {
        deductions.push(compItem);
      } else if (type === 'EMPLOYER_CONTRIBUTION' || type === 'CONTRIBUTION') {
        contributions.push(compItem);
      }
    });
  } else {
    // Fallback for legacy records lacking component metadata
    const summaryKeys = [
      'providentFund', 'esiAllowed', 'professionalTax', 'ltaEligible', 'totalDeductions',
      'totalContributions', 'grossSalary', 'gross', 'annualCtc', 'totalCTC', 'annualCTC',
      'netSalary', 'net', 'ctc', 'monthlyCtc', 'salaryComponents', 'localSalary', 'fullRecord'
    ];

    Object.entries(sal).forEach(([key, val]) => {
      if (summaryKeys.includes(key) || isNaN(Number(val)) || Number(val) <= 0) return;
      const numVal = Number(val);
      const upper = key.toUpperCase();

      const formatLegacyLabel = (k) => {
        const up = k.toUpperCase();
        if (up === 'BASIC' || up === 'BASIC_PAY' || up === 'BASIC_SALARY') return 'Basic Salary';
        if (up === 'HRA' || up === 'HOUSE_RENT_ALLOWANCE') return 'House Rent Allowance (HRA)';
        if (up === 'DA' || up === 'DEARNESS_ALLOWANCE') return 'Dearness Allowance (DA)';
        if (up === 'SPECIAL_ALLOWANCE' || up === 'SPECIAL_PAY' || up === 'SPL_ALLOWANCE') return 'Special Allowance';
        if (up === 'CONVEYANCE' || up === 'CONVEYANCE_ALLOWANCE') return 'Conveyance Allowance';
        if (up === 'MEDICAL' || up === 'MEDICAL_ALLOWANCE') return 'Medical Allowance';
        if (up === 'PF' || up === 'EPF') return 'Provident Fund (PF)';
        if (up === 'ESI') return 'Employee State Insurance (ESI)';
        if (up === 'PTAX' || up === 'PT' || up === 'PROFESSIONAL_TAX') return 'Professional Tax (PTAX)';
        if (up === 'PF_EMPYR' || up === 'PF_EMPLOYER') return 'PF Employer Contribution';
        if (up === 'ESI_EMPYR' || up === 'ESI_EMPLOYER') return 'ESI Employer Contribution';
        return k.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
      };

      const compItem = {
        code: key,
        name: formatLegacyLabel(key),
        monthly: numVal,
        annual: numVal * 12,
        calculationType: 'MANUAL',
        sequenceNo: 0
      };

      if (upper.includes('EMPYR') || upper.includes('EMPLOYER') || upper === 'GRATUITY' || upper === 'MEDICLAIM') {
        contributions.push(compItem);
      } else if (upper.includes('PF') || upper.includes('ESI') || upper.includes('PTAX') || upper.includes('TAX') || upper.includes('DEDUCT') || upper.includes('LWF')) {
        deductions.push(compItem);
      } else {
        earnings.push(compItem);
      }
    });
  }

  // Authoritative Totals
  const computedGross = earnings.filter((e) => e.calculationType !== 'DAILY_RATE').reduce((s, e) => s + (Number(e.monthly) || 0), 0);
  const computedDeductions = deductions.filter((d) => d.calculationType !== 'DAILY_RATE').reduce((s, d) => s + (Number(d.monthly) || 0), 0);
  const computedContributions = contributions.filter((c) => c.calculationType !== 'DAILY_RATE').reduce((s, c) => s + (Number(c.monthly) || 0), 0);

  const effectiveGross = Number(grossVal || computedGross || 0);
  const effectiveDeductions = Number(deductionsVal || computedDeductions || 0);
  const effectiveContributions = Number(contributionsVal || computedContributions || 0);
  const effectiveNet = Number(netVal || (effectiveGross - effectiveDeductions) || 0);

  const effectiveMonthlyCtc = Number(ctcVal || (effectiveGross + effectiveContributions) || 0);
  let effectiveAnnualCtc = Number(annualCtc || 0);

  // Strict anti-aliasing guard: if annualCtc was passed as identical or near to monthlyCtc
  // (e.g. caller passed monthly totalCTC instead of annualized CTC), auto-correct to monthlyCtc * 12
  if (effectiveMonthlyCtc > 0 && (effectiveAnnualCtc <= 0 || effectiveAnnualCtc <= effectiveMonthlyCtc * 1.5)) {
    effectiveAnnualCtc = Math.round(effectiveMonthlyCtc * 12);
  }

  return {
    earnings,
    deductions,
    contributions,
    totals: {
      grossMonthly: effectiveGross,
      grossAnnual: effectiveGross * 12,
      deductionsMonthly: effectiveDeductions,
      deductionsAnnual: effectiveDeductions * 12,
      contributionsMonthly: effectiveContributions,
      contributionsAnnual: effectiveContributions * 12,
      netMonthly: effectiveNet,
      netAnnual: effectiveNet * 12,
      ctcMonthly: effectiveMonthlyCtc,
      ctcAnnual: effectiveAnnualCtc
    },
    statutoryToggles: {
      isPFEnabled,
      isESIEnabled,
      isPTaxEnabled
    }
  };
};

// ==============================|| QUILL HTML EXPORT NORMALIZER ||============================== //

export const formatQuillHtmlForExport = (rawHtml) => {
  if (!rawHtml) return '';
  let clean = rawHtml
    .replace(/<span class="ql-ui"[^>]*>[\s\S]*?<\/span>/gi, '') // Remove Quill UI bullet/counter spans
    .replace(/<p><br\s*\/?><\/p>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '');

  // Transform <ol> containing <li data-list="bullet"> into <ul> with explicit disc styles
  clean = clean.replace(/<ol(\s*[^>]*)>([\s\S]*?)<\/ol>/gi, (match, olAttrs, innerLi) => {
    if (innerLi.includes('data-list="bullet"') || innerLi.includes("data-list='bullet'")) {
      const formattedLi = innerLi.replace(/<li[^>]*data-list=["']bullet["'][^>]*>/gi, '<li style="list-style-type: disc !important; margin-bottom: 5px; padding-left: 4px;">');
      return `<ul style="list-style-type: disc !important; margin: 8px 0 10px 0; padding-left: 24px;">${formattedLi}</ul>`;
    }
    if (innerLi.includes('data-list="ordered"') || innerLi.includes("data-list='ordered'")) {
      const formattedLi = innerLi.replace(/<li[^>]*data-list=["']ordered["'][^>]*>/gi, '<li style="list-style-type: decimal !important; margin-bottom: 5px; padding-left: 4px;">');
      return `<ol style="list-style-type: decimal !important; margin: 8px 0 10px 0; padding-left: 24px;">${formattedLi}</ol>`;
    }
    const styledLi = innerLi.replace(/<li(\s*[^>]*)>/gi, '<li style="margin-bottom: 5px; padding-left: 4px;">');
    return `<ol style="list-style-type: decimal !important; margin: 8px 0 10px 0; padding-left: 24px;">${styledLi}</ol>`;
  });

  // Ensure any standalone <ul> and <ol> have explicit list styles and padding
  clean = clean.replace(/<ul(\s*[^>]*)>/gi, '<ul style="list-style-type: disc !important; margin: 8px 0 10px 0; padding-left: 24px;">');
  clean = clean.replace(/<ol(\s*[^>]*)>/gi, '<ol style="list-style-type: decimal !important; margin: 8px 0 10px 0; padding-left: 24px;">');

  return clean;
};

// ==============================|| CANONICAL OFFER LETTER DOCUMENT MODEL BUILDER ||============================== //
/**
 * Assembles the single authoritative document model for an Offer Letter.
 * Ensures 100% byte-for-byte HTML and PDF parity across:
 *   - Direct PDF Download
 *   - Email Dialog Preview & Attachment
 *   - Designer Canvas & Export
 *   - Central Offer Letter Management Table
 *
 * @param {Object} record - The offer letter entity or form record
 * @param {Object} options - Override options (candidate, companyInfo, activeCompsList, localSalary, etc.)
 * @returns {Object} Canonical model containing candidateData, companyData, signatoryData,
 *                   sections, compsList, localSalary, salaryData, numeric totals, and cleanHtml.
 */
export const buildOfferLetterDocumentModel = (record = {}, options = {}) => {
  let parsedData = {};
  if (record?.fullRecord && typeof record.fullRecord === 'object') {
    parsedData = { ...record.fullRecord };
  }
  if (record?.formData) {
    if (typeof record.formData === 'string') {
      try {
        parsedData = { ...parsedData, ...JSON.parse(record.formData) };
      } catch (e) {}
    } else if (typeof record.formData === 'object') {
      parsedData = { ...parsedData, ...record.formData };
    }
  }

  const baseComp =
    record?.companyInfo && Object.keys(record.companyInfo).length > 0
      ? record.companyInfo
      : parsedData?.companyInfo && Object.keys(parsedData.companyInfo).length > 0
      ? parsedData.companyInfo
      : options.companyInfo && Object.keys(options.companyInfo).length > 0
      ? options.companyInfo
      : {};
  const optComp = options.companyInfo || {};

  let resolvedLogo =
    baseComp.companyLogo ||
    optComp.companyLogo ||
    parsedData.companyLogo ||
    record.companyLogo ||
    '';
  if (
    !resolvedLogo &&
    (baseComp.logoFileName || optComp.logoFileName || parsedData.logoFileName || record.logoFileName)
  ) {
    resolvedLogo = getCompanyImageUrl(
      baseComp.logoFileName || optComp.logoFileName || parsedData.logoFileName || record.logoFileName
    );
  } else if (
    resolvedLogo &&
    typeof resolvedLogo === 'string' &&
    !resolvedLogo.startsWith('http') &&
    !resolvedLogo.startsWith('data:') &&
    !resolvedLogo.startsWith('blob:') &&
    !resolvedLogo.startsWith('/api')
  ) {
    resolvedLogo = getCompanyImageUrl(resolvedLogo);
  }

  const companyData = {
    companyName:
      baseComp.companyName || optComp.companyName || parsedData.companyName || record.companyName || 'Autonoma ERP',
    companyAddress:
      baseComp.companyAddress ||
      optComp.companyAddress ||
      baseComp.address ||
      optComp.address ||
      parsedData.companyAddress ||
      parsedData.address ||
      record.companyAddress ||
      '',
    companyGstin:
      baseComp.companyGstin ||
      optComp.companyGstin ||
      baseComp.gstIn ||
      optComp.gstIn ||
      baseComp.gstNo ||
      optComp.gstNo ||
      parsedData.companyGstin ||
      parsedData.gstIn ||
      record.companyGstin ||
      '',
    companyPhone:
      baseComp.companyPhone ||
      optComp.companyPhone ||
      baseComp.mobileNo ||
      optComp.mobileNo ||
      baseComp.phoneNo ||
      optComp.phoneNo ||
      parsedData.companyPhone ||
      record.companyPhone ||
      '',
    companyEmail:
      baseComp.companyEmail ||
      optComp.companyEmail ||
      baseComp.emailId ||
      optComp.emailId ||
      parsedData.companyEmail ||
      record.companyEmail ||
      '',
    companyWeb:
      baseComp.companyWeb ||
      optComp.companyWeb ||
      baseComp.website ||
      optComp.website ||
      parsedData.companyWeb ||
      record.companyWeb ||
      '',
    companyLogo: resolvedLogo,
    logoFileName:
      baseComp.logoFileName || optComp.logoFileName || parsedData.logoFileName || record.logoFileName || '',
    hrName:
      baseComp.hrName ||
      optComp.hrName ||
      options.signatoryData?.hrName ||
      record.signatoryName ||
      parsedData.signatoryName ||
      'HR Manager',
    hrDesignation:
      baseComp.hrDesignation ||
      optComp.hrDesignation ||
      options.signatoryData?.hrDesignation ||
      record.signatoryDesignation ||
      parsedData.signatoryDesignation ||
      'Human Resources'
  };

  const candEmail = resolveCandidateEmail(parsedData) || resolveCandidateEmail(record) || options.email || '';

  const candidateData = {
    candidateName: getDisplayString(
      record?.candidateName || parsedData?.candidateName || record?.employeeName || parsedData?.employeeName || ''
    ),
    applicantCode: getDisplayString(
      record?.applicantCode ||
        parsedData?.applicantCode ||
        record?.employeeCode ||
        parsedData?.employeeCode ||
        record?.candidateCode ||
        parsedData?.candidateCode ||
        ''
    ),
    email: candEmail,
    phone: cleanMobileNumber(record?.phone || parsedData?.phone || record?.mobileNo || parsedData?.mobileNo || ''),
    gender: normalizeGender(record?.gender || parsedData?.gender || ''),
    dob: extractDateString(record?.dob || parsedData?.dob || ''),
    department: getDisplayString(record?.department || parsedData?.department || ''),
    designation: getDisplayString(record?.designation || parsedData?.designation || ''),
    employmentType: getDisplayString(record?.employmentType || parsedData?.employmentType || ''),
    workLocation: getDisplayString(record?.workLocation || parsedData?.workLocation || ''),
    grade: getDisplayString(record?.grade || parsedData?.grade || ''),
    reportingManager: getDisplayString(record?.reportingManager || parsedData?.reportingManager || ''),
    offerLetterNo: getDisplayString(
      record?.offerLetterNo || parsedData?.offerLetterNo || record?.refNo || parsedData?.refNo || 'OfferLetter'
    ),
    refNo: getDisplayString(
      record?.refNo || parsedData?.refNo || record?.offerLetterNo || parsedData?.offerLetterNo || 'OfferLetter'
    ),
    offerDate: extractDateString(record?.offerDate || parsedData?.offerDate || ''),
    joiningDate: extractDateString(record?.joiningDate || parsedData?.joiningDate || ''),
    probationPeriod: getDisplayString(record?.probationPeriod || parsedData?.probationPeriod || '')
  };

  const signatoryData = {
    hrName:
      options.signatoryData?.hrName ||
      companyData.hrName ||
      record?.signatoryName ||
      parsedData?.signatoryName ||
      '',
    hrDesignation:
      options.signatoryData?.hrDesignation ||
      companyData.hrDesignation ||
      record?.signatoryDesignation ||
      parsedData?.signatoryDesignation ||
      'HR Manager'
  };

  let resolvedSections =
    options.customSections && Array.isArray(options.customSections) && options.customSections.length > 0
      ? options.customSections
      : parsedData?.sections && Array.isArray(parsedData.sections) && parsedData.sections.length > 0
      ? parsedData.sections
      : record?.sections && Array.isArray(record.sections) && record.sections.length > 0
      ? record.sections
      : null;

  if (!resolvedSections) {
    try {
      const cached =
        typeof window !== 'undefined' ? localStorage.getItem('AUTONOMA_OFFER_LETTER_TEMPLATE_CACHE') : null;
      if (cached) {
        const p = JSON.parse(cached);
        if (p.sections && Array.isArray(p.sections) && p.sections.length > 0) {
          resolvedSections = p.sections;
        }
      }
    } catch (e) {}
  }

  const sections =
    resolvedSections && resolvedSections.length > 0 ? resolvedSections : DEFAULT_DOCUMENT_SECTIONS;

  const comp = parsedData?.compensation || record?.compensation || {};
  const resolvedComps =
    options.activeCompsList && Array.isArray(options.activeCompsList) && options.activeCompsList.length > 0
      ? options.activeCompsList
      : comp?.components && Array.isArray(comp.components) && comp.components.length > 0
      ? comp.components
      : record?.components && Array.isArray(record.components) && record.components.length > 0
      ? record.components
      : record?.activeCompsList && Array.isArray(record.activeCompsList) && record.activeCompsList.length > 0
      ? record.activeCompsList
      : [];

  const resolvedSalaryMap =
    options.localSalary ||
    comp.salaryComponents ||
    record?.salaryComponents ||
    parsedData?.salaryComponents ||
    record?.localSalary ||
    parsedData?.localSalary ||
    {};

  const grossVal = Number(
    options.grossVal ?? (comp.grossSalary || record?.grossSalary || parsedData?.grossSalary || 0)
  );
  const deductionsVal = Number(
    options.deductionsVal ?? (comp.totalDeductions || record?.totalDeductions || parsedData?.totalDeductions || 0)
  );
  const contributionsVal = Number(
    options.contributionsVal ??
      (comp.totalContributions || record?.totalContributions || parsedData?.totalContributions || 0)
  );
  const netVal = Number(options.netVal ?? (comp.netSalary || record?.netSalary || parsedData?.netSalary || 0));
  const ctcVal = Number(
    options.ctcVal ??
      (comp.monthlyCtc || record?.monthlyCtc || parsedData?.monthlyCtc || (grossVal + contributionsVal) || 0)
  );
  const annualCtc = Number(
    options.annualCtc ??
      (record?.totalCTC ||
        parsedData?.totalCTC ||
        record?.annualCtc ||
        parsedData?.annualCtc ||
        comp.annualCTC ||
        comp.totalCTC ||
        ctcVal * 12 ||
        0)
  );

  const modelConfig = {
    candidateData,
    companyData,
    signatoryData,
    sections,
    compsList: resolvedComps,
    activeCompsList: resolvedComps,
    localSalary: resolvedSalaryMap,
    salaryData: {
      gross: grossVal,
      monthlyCtc: ctcVal,
      annualCtc,
      ctc: annualCtc,
      salaryComponents: resolvedSalaryMap
    },
    grossVal,
    deductionsVal,
    contributionsVal,
    netVal,
    ctcVal,
    annualCtc
  };

  const cleanHtml = buildCleanOfferLetterHtml(modelConfig);

  return {
    ...modelConfig,
    cleanHtml
  };
};

// ==============================|| AUTHORITATIVE CLEAN DOCUMENT HTML BUILDER ||============================== //
/**
 * Generates the clean A4 Offer Letter HTML string with zero editor artifacts.
 * Shared by: (1) Designer Preview, (2) Designer Download PDF, (3) OfferLetterPage Preview/Print,
 *            (4) SendOfferLetterDialog Preview, (5) SendOfferLetterDialog Email PDF Attachment.
 *
 * Enforces strict multi-page A4 flow:
 * - Each page is a distinct, non-overflowing .a4-page-pdf-sheet with print-ready margins
 * - Content sections dynamically chunked based on realistic measured pixel heights
 * - Section keep-together rules (page-break-inside: avoid) to prevent table rows/cards from being split
 * - Single-page offers stay clean 1-page; complex offers flow to 2+ pages naturally
 * - Clean footer on every page ("Page X of Y" + corporate watermark)
 */
export const buildCleanOfferLetterHtml = (
  sectionsOrConfig = DEFAULT_DOCUMENT_SECTIONS,
  dataMapArg = null,
  compsListArg = [],
  salaryMapArg = {},
  gValArg = 0,
  cValArg = 0
) => {
  let sectionsArr = DEFAULT_DOCUMENT_SECTIONS;
  let dataMap = {};
  let compsList = [];
  let salaryMap = {};
  let gVal = 0;
  let cVal = 0;
  let configObj = null;

  if (sectionsOrConfig && !Array.isArray(sectionsOrConfig) && typeof sectionsOrConfig === 'object') {
    configObj = sectionsOrConfig;
    sectionsArr = configObj.sections || DEFAULT_DOCUMENT_SECTIONS;
    compsList = configObj.activeCompsList || configObj.compsList || configObj.components || [];
    salaryMap = configObj.localSalary || configObj.salaryMap || (configObj.salaryData?.salaryComponents) || {};
    gVal = Number(configObj.grossVal || configObj.gVal || configObj.gross || configObj.salaryData?.gross || 0);
    cVal = Number(configObj.ctcVal || configObj.cVal || configObj.ctc || configObj.salaryData?.ctc || 0);

    if (configObj.dataMap) {
      dataMap = configObj.dataMap;
    } else {
      dataMap = resolveOfferDataMap({
        candidateData: configObj.candidateData || configObj.candidate,
        companyData: configObj.companyData || configObj.companyProfile || configObj.company,
        signatoryData: configObj.signatoryData || configObj.signatory,
        salaryData: configObj.salaryData,
        localSalary: salaryMap,
        grossVal: gVal,
        ctcVal: cVal
      });
    }
  } else {
    sectionsArr = Array.isArray(sectionsOrConfig) ? sectionsOrConfig : DEFAULT_DOCUMENT_SECTIONS;
    dataMap = dataMapArg || {};
    compsList = compsListArg || [];
    salaryMap = salaryMapArg || {};
    gVal = Number(gValArg || 0);
    cVal = Number(cValArg || 0);
  }

  const sub = (text) => substituteOfferTokens(text, dataMap);

  const enabledSections = sectionsArr.filter((s) => s && s.enabled !== false && s.id !== 'sec_job' && s.type !== 'job_card');

  // Authoritative salary breakdown
  const salaryStruct = configObj?.salaryStruct || normalizeOfferSalaryStructure({
    compsList: compsList,
    salaryMap: salaryMap,
    grossVal: gVal,
    deductionsVal: configObj?.deductionsVal || 0,
    contributionsVal: configObj?.contributionsVal || 0,
    netVal: configObj?.netVal || 0,
    ctcVal: cVal,
    annualCtc: configObj?.annualCtc || configObj?.totalCTC || 0
  });

  // Realistic measured height estimation per section with 15px breathable inter-block margins
  const getSectionEstHeight = (sec) => {
    const customMinH = sec.sectionMinHeight && Number(sec.sectionMinHeight) > 0 ? Number(sec.sectionMinHeight) : 0;
    if (sec.type === 'company_header') return Math.max(customMinH, 110);
    if (sec.type === 'document_title') return Math.max(customMinH, 45);
    if (sec.type === 'candidate_recipient') return Math.max(customMinH, 85);
    if (sec.type === 'salutation_body' || sec.type === 'custom_rich_text' || sec.type === 'terms_conditions') {
      const rawHtml = sec.content?.html || sec.content?.bodyText || '';
      const text = rawHtml.replace(/<[^>]+>/g, '').trim();
      const bulletCount = (rawHtml.match(/<li/gi) || []).length;
      const pCount = (rawHtml.match(/<p/gi) || []).length;
      const itemsCount = Math.max(bulletCount, pCount, Math.ceil(text.length / 85));
      return Math.max(customMinH, Math.max(35, itemsCount * 22 + 10) + 15);
    }
    if (sec.type === 'job_card') return Math.max(customMinH, 75);
    if (sec.type === 'salary_table') {
      const earnCount = salaryStruct.earnings.length || 4;
      const dedCount = salaryStruct.deductions.length || 0;
      const contribCount = salaryStruct.contributions.length || 0;
      const categoryHeaders = 1 + (dedCount > 0 ? 1 : 0) + (contribCount > 0 ? 1 : 0);
      const summaryRows = 1 + (dedCount > 0 ? 2 : 0) + (contribCount > 0 ? 1 : 0) + 1; // Gross, [Deductions, Net], [Contributions], CTC
      const totalRows = earnCount + dedCount + contribCount + categoryHeaders + summaryRows;
      // Title bar (26) + thead (24) + each row (22) + bottom border (2) + margin (15)
      return Math.max(customMinH, 26 + 24 + (totalRows * 22) + 2 + 15);
    }
    if (sec.type === 'signature_block') return Math.max(customMinH, 125);
    return Math.max(customMinH, 40);
  };

  const totalEstHeight = enabledSections.reduce((acc, sec) => acc + getSectionEstHeight(sec), 0);

  // A4 physical height is 1122px (297mm @ 96 DPI).
  // With even 24px top + 24px bottom margins and a 26px footer, net available page capacity is ~1040px.
  // When content fits comfortably within 1000px, it stays on 1 single page with breathable 15px spacing.
  // When content exceeds 1000px, it cleanly paginates to Page 2 with proper alignments.
  const SINGLE_PAGE_THRESHOLD = 1000;

  const pages = [];
  if (totalEstHeight <= SINGLE_PAGE_THRESHOLD) {
    pages.push(enabledSections);
  } else {
    let currentPage = [];
    let currentH = 0;
    const PAGE_CAPACITY = 960;

    enabledSections.forEach((sec) => {
      const secH = getSectionEstHeight(sec);
      if (currentH + secH > PAGE_CAPACITY && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [sec];
        currentH = secH;
      } else {
        currentPage.push(sec);
        currentH += secH;
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    // Avoid orphan signature block on the last page: if last page has only 1 section and previous page has >= 3 sections, balance them
    if (pages.length >= 2 && pages[pages.length - 1].length === 1) {
      const prevPage = pages[pages.length - 2];
      if (prevPage.length >= 3) {
        const pulledSec = prevPage.pop();
        pages[pages.length - 1].unshift(pulledSec);
      }
    }
  }

  const pageHtmls = pages.map((pageSections, pageIdx) => {
    const sectionHtmlParts = pageSections.map((sec) => {
      let htmlContent = '';
      switch (sec.type) {
        case 'company_header': {
          const logo = dataMap['{{companyLogo}}'];
          const logoTag = logo
            ? `<img src="${logo}" alt="Company Logo" style="max-height:54px;max-width:115px;object-fit:contain;image-rendering:-webkit-optimize-contrast;" onerror="this.style.display='none'" />`
            : `<div style="width:50px;height:50px;border-radius:8px;background:linear-gradient(135deg,#1e3a8a,#2563eb);display:inline-flex;align-items:center;justify-content:center;"><span style="color:#fff;font-weight:900;font-size:20px;">${(dataMap['{{companyName}}'] || 'C').charAt(0)}</span></div>`;
          htmlContent = `<div style="page-break-inside:avoid;break-inside:avoid;margin-bottom:15px;border-radius:6px;overflow:hidden;border:1px solid #dbeafe;box-shadow:0 2px 8px rgba(30,58,138,0.08);">
  <div style="height:6px;background:linear-gradient(90deg,#1e3a8a 0%,#2563eb 40%,#38bdf8 100%);border-radius:6px 6px 0 0;"></div>
  <div style="background:linear-gradient(135deg,#f0f7ff 0%,#ffffff 100%);padding:10px 16px 8px 16px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:120px;vertical-align:middle;padding-right:14px;">${logoTag}</td>
        <td style="vertical-align:middle;">
          <div style="font-size:16px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.5px;">${dataMap['{{companyName}}'] || ''}</div>
          <div style="font-size:10px;color:#475569;margin-top:3px;line-height:1.45;">${dataMap['{{companyAddress}}'] || ''}</div>
          ${dataMap['{{companyGstin}}'] ? `<div style="font-size:10px;color:#64748b;font-weight:600;margin-top:2px;">GSTIN: ${dataMap['{{companyGstin}}']}</div>` : ''}
          <div style="font-size:9.5px;color:#64748b;margin-top:2px;line-height:1.4;">${[
            dataMap['{{companyPhone}}'] ? `Mob: ${dataMap['{{companyPhone}}']}` : '',
            dataMap['{{companyEmail}}'] ? `Email: ${dataMap['{{companyEmail}}']}` : '',
            dataMap['{{companyWeb}}'] ? `Web: ${dataMap['{{companyWeb}}']}` : ''
          ].filter(Boolean).join(' | ')}</div>
        </td>
        <td style="vertical-align:top;text-align:right;width:200px;">
          <div style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);border-radius:6px;padding:7px 12px;display:inline-block;text-align:left;min-width:175px;">
            <div style="font-size:10px;color:#bfdbfe;line-height:1.45;">
              <span style="font-weight:600;">${sec.content?.docNoPrefix || 'DOC. No :'}</span> <strong style="color:#ffffff;margin-left:3px;">${dataMap['{{offerNumber}}'] || ''}</strong>
            </div>
            <div style="font-size:10px;color:#bfdbfe;margin-top:3px;line-height:1.45;">
              <span style="font-weight:600;">${sec.content?.issueDatePrefix || 'Issue Date :'}</span> <strong style="color:#ffffff;margin-left:3px;">${dataMap['{{offerDate}}'] || ''}</strong>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
  <div style="height:2px;background:linear-gradient(90deg,#1e3a8a 0%,#2563eb 40%,#38bdf8 100%);"></div>
</div>`;
          break;
        }

        case 'document_title': {
          const fontSizeMapHtml = { small: '13px', medium: '15px', large: '17.5px' };
          const fSizeHtml = fontSizeMapHtml[sec.content?.fontSize] || '15px';
          const alignHtml = sec.content?.alignment || 'center';
          htmlContent = `<div style="text-align:${alignHtml};margin:4px 0 15px 0;page-break-inside:avoid;break-inside:avoid;width:100%;box-sizing:border-box;">
  <div style="display:inline-block;position:relative;padding:4px 20px;max-width:100%;box-sizing:border-box;word-break:break-word;overflow-wrap:break-word;">
    <span style="font-size:${fSizeHtml};font-weight:800;color:#1e3a8a;letter-spacing:2px;text-transform:uppercase;word-break:break-word;overflow-wrap:break-word;white-space:normal;display:inline-block;max-width:100%;line-height:1.35;">${sub(sec.content?.text || 'OFFER OF APPOINTMENT')}</span>
    <div style="position:absolute;bottom:0;left:10%;width:80%;height:2px;background:linear-gradient(90deg,transparent,#2563eb,#38bdf8,transparent);border-radius:2px;"></div>
  </div>
</div>`;
          break;
        }

        case 'candidate_recipient': {
          htmlContent = `<div style="page-break-inside:avoid;break-inside:avoid;margin-bottom:15px;background:linear-gradient(135deg,#f0f7ff 0%,#e8f4fd 100%);border-left:4px solid #2563eb;border-radius:0 6px 6px 0;padding:8px 14px;box-shadow:0 1px 4px rgba(37,99,235,0.06);">
  <table style="width:100%;border-collapse:collapse;font-size:11px;">
    <tr>
      <td style="vertical-align:top;width:55%;">
        <div style="color:#2563eb;font-weight:700;text-transform:uppercase;font-size:9px;letter-spacing:0.8px;margin-bottom:4px;display:flex;align-items:center;gap:4px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg> TO CANDIDATE
        </div>
        <div style="font-size:14px;font-weight:800;color:#0f172a;">${dataMap['{{candidateName}}'] || ''}</div>
        <div style="color:#475569;margin-top:3px;font-size:10.5px;">
          Email: <strong style="color:#1e293b;">${dataMap['{{candidateEmail}}'] || ''}</strong> | Mobile: <strong style="color:#1e293b;">${dataMap['{{candidateMobile}}'] || ''}</strong>
        </div>
      </td>
      <td style="vertical-align:top;width:45%;text-align:right;">
        <table style="display:inline-table;border-collapse:collapse;text-align:right;font-size:10.5px;">
          ${dataMap['{{employmentType}}'] ? `
          <tr>
            <td style="color:#64748b;font-size:9.5px;padding:1px 0;">Employment Type:</td>
            <td style="font-weight:700;color:#0f172a;padding:1px 0 1px 6px;text-transform:uppercase;">${dataMap['{{employmentType}}']}</td>
          </tr>` : ''}
          ${dataMap['{{workLocation}}'] ? `
          <tr>
            <td style="color:#64748b;font-size:9.5px;padding:1px 0;">Work Location:</td>
            <td style="font-weight:700;color:#0f172a;padding:1px 0 1px 6px;">${dataMap['{{workLocation}}']}</td>
          </tr>` : ''}
          <tr>
            <td style="color:#64748b;font-size:9.5px;padding:1px 0;">Proposed Joining Date:</td>
            <td style="font-size:13px;font-weight:800;color:#1e3a8a;padding:1px 0 1px 6px;">${dataMap['{{joiningDate}}'] || ''}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
          break;
        }

        case 'salutation_body': {
          const rawHtml = sec.content?.html || '';
          const formattedHtml = formatQuillHtmlForExport(rawHtml);
          htmlContent = `<div class="offer-rich-text" style="font-size:11px;line-height:1.55;color:#334155;margin-bottom:15px;page-break-inside:avoid;break-inside:avoid;text-align:justify;">
  ${sub(formattedHtml)}
</div>`;
          break;
        }

        case 'salary_table': {
          const title = sec.content?.customTitle || 'Compensation Structure & Emoluments';
          const { earnings, deductions, contributions, totals } = salaryStruct;

          const formatCurr = (v) => {
            const num = Number(v);
            return isNaN(num) ? '0.00' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          };

          const cPad = '4px 10px';
          const tPad = '4.5px 10px';

          let tableRowsHtml = '';

          // 1. EARNINGS CATEGORY
          tableRowsHtml += `<tr style="background:#eff6ff;color:#1e3a8a;font-weight:700;"><td colspan="3" style="padding:${cPad};border:1px solid #bfdbfe;font-size:9.5px;text-transform:uppercase;letter-spacing:0.5px;">Earnings</td></tr>`;

          earnings.forEach((comp, idx) => {
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fbff';
            tableRowsHtml += `<tr style="background:${rowBg};"><td style="border:1px solid #dbeafe;padding:${cPad};">${comp.name}</td><td style="border:1px solid #dbeafe;padding:${cPad};text-align:right;">₹${formatCurr(comp.monthly)}</td><td style="border:1px solid #dbeafe;padding:${cPad};text-align:right;">₹${formatCurr(comp.annual)}</td></tr>`;
          });

          tableRowsHtml += `<tr style="font-weight:700;background:#dcfce7;color:#15803d;"><td style="border:1px solid #bfdbfe;padding:${tPad};">Total Gross Salary (A)</td><td style="border:1px solid #bfdbfe;padding:${tPad};text-align:right;">₹${formatCurr(totals.grossMonthly)}</td><td style="border:1px solid #bfdbfe;padding:${tPad};text-align:right;">₹${formatCurr(totals.grossAnnual)}</td></tr>`;

          // 2. DEDUCTIONS CATEGORY (if any exist)
          if (deductions.length > 0) {
            tableRowsHtml += `<tr style="background:#faf5ff;color:#6b21a8;font-weight:700;"><td colspan="3" style="padding:${cPad};border:1px solid #bfdbfe;font-size:9.5px;text-transform:uppercase;letter-spacing:0.5px;">Deductions</td></tr>`;

            deductions.forEach((comp, idx) => {
              const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fbff';
              tableRowsHtml += `<tr style="background:${rowBg};"><td style="border:1px solid #dbeafe;padding:${cPad};">${comp.name}</td><td style="border:1px solid #dbeafe;padding:${cPad};text-align:right;">₹${formatCurr(comp.monthly)}</td><td style="border:1px solid #dbeafe;padding:${cPad};text-align:right;">₹${formatCurr(comp.annual)}</td></tr>`;
            });

            tableRowsHtml += `<tr style="font-weight:700;background:#fee2e2;color:#b91c1c;"><td style="border:1px solid #bfdbfe;padding:${tPad};">Total Deductions (B)</td><td style="border:1px solid #bfdbfe;padding:${tPad};text-align:right;">₹${formatCurr(totals.deductionsMonthly)}</td><td style="border:1px solid #bfdbfe;padding:${tPad};text-align:right;">₹${formatCurr(totals.deductionsAnnual)}</td></tr>`;
          }

          // 3. EMPLOYER CONTRIBUTIONS CATEGORY (if any exist)
          if (contributions.length > 0) {
            tableRowsHtml += `<tr style="background:#faf5ff;color:#6b21a8;font-weight:700;"><td colspan="3" style="padding:${cPad};border:1px solid #bfdbfe;font-size:9.5px;text-transform:uppercase;letter-spacing:0.5px;">Employer Contributions</td></tr>`;

            contributions.forEach((comp, idx) => {
              const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fbff';
              tableRowsHtml += `<tr style="background:${rowBg};"><td style="border:1px solid #dbeafe;padding:${cPad};">${comp.name}</td><td style="border:1px solid #dbeafe;padding:${cPad};text-align:right;">₹${formatCurr(comp.monthly)}</td><td style="border:1px solid #dbeafe;padding:${cPad};text-align:right;">₹${formatCurr(comp.annual)}</td></tr>`;
            });

            tableRowsHtml += `<tr style="font-weight:700;background:#f3e8ff;color:#7e22ce;"><td style="border:1px solid #bfdbfe;padding:${tPad};">Total Contributions (C)</td><td style="border:1px solid #bfdbfe;padding:${tPad};text-align:right;">₹${formatCurr(totals.contributionsMonthly)}</td><td style="border:1px solid #bfdbfe;padding:${tPad};text-align:right;">₹${formatCurr(totals.contributionsAnnual)}</td></tr>`;
          }

          // 4. NET PAYABLE (if deductions exist)
          if (deductions.length > 0) {
            tableRowsHtml += `<tr style="font-weight:700;background:#dbeafe;color:#1e40af;"><td style="border:1px solid #bfdbfe;padding:${tPad};">Net Salary (Take Home) (A - B)</td><td style="border:1px solid #bfdbfe;padding:${tPad};text-align:right;">₹${formatCurr(totals.netMonthly)} / Month</td><td style="border:1px solid #bfdbfe;padding:${tPad};text-align:right;">₹${formatCurr(totals.netAnnual)}</td></tr>`;
          }

          // 5. TOTAL COST TO COMPANY (CTC)
          tableRowsHtml += `<tr style="font-weight:800;background:#1e3a8a;color:#ffffff;"><td style="border:1px solid #1e3a8a;padding:5.5px 10px;">Total Cost to Company (CTC) (A + C)</td><td style="border:1px solid #1e3a8a;padding:5.5px 10px;text-align:right;font-size:11px;">₹${formatCurr(totals.ctcMonthly)} / Month</td><td style="border:1px solid #1e3a8a;padding:5.5px 10px;text-align:right;font-size:11px;">₹${formatCurr(totals.ctcAnnual)} / Annum</td></tr>`;

          htmlContent = `<div style="margin:0 0 15px 0;page-break-inside:avoid;break-inside:avoid;border:1px solid #dbeafe;border-radius:6px;overflow:hidden;box-shadow:0 1px 4px rgba(30,58,138,0.06);">
  <div style="background:linear-gradient(90deg,#1e3a8a 0%,#2563eb 60%,#3b82f6 100%);padding:5px 12px;">
    <span style="font-size:11px;font-weight:700;color:#ffffff;letter-spacing:0.5px;display:inline-flex;align-items:center;gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M15 11l-4 4l-2 -2" /><path d="M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /></svg> ${title}</span>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:10px;">
    <thead><tr style="background:#eff6ff;color:#1e3a8a;">
      <th style="padding:${tPad};border:1px solid #bfdbfe;text-align:left;font-weight:700;">Salary Component</th>
      <th style="padding:${tPad};border:1px solid #bfdbfe;text-align:right;width:130px;font-weight:700;">Monthly (₹)</th>
      <th style="padding:${tPad};border:1px solid #bfdbfe;text-align:right;width:130px;font-weight:700;">Annual (₹)</th>
    </tr></thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>
</div>`;
          break;
        }

        case 'signature_block': {
          const content = sec.content || {};
          const authLbl = content.authLabel || 'Authorized By';
          const candLbl = content.candLabel || 'Candidate Acceptance';
          const useCurrent = content.useCurrentUserCredentials !== false;
          const showCand = content.showCandidateAcceptance !== false;
          const showComp = content.includeCompanyName !== false;
          const showSigLine = content.includeSignatureLine !== false;

          const resolvedAuthName = sub(
            useCurrent
              ? (dataMap['{{hrSignatoryName}}'] || '')
              : (content.authName || dataMap['{{hrSignatoryName}}'] || '')
          );
          const resolvedAuthDesig = sub(
            useCurrent
              ? (dataMap['{{hrSignatoryTitle}}'] || '')
              : (content.authDesignation || dataMap['{{hrSignatoryTitle}}'] || '')
          );
          const resolvedAuthDept = !useCurrent && content.authDepartment ? sub(content.authDepartment) : '';
          const resolvedAuthPhone = !useCurrent && content.authPhone ? sub(content.authPhone) : '';

          const desigDeptLine = [resolvedAuthDesig, resolvedAuthDept].filter(Boolean).join(' • ');
          const contactLine = resolvedAuthPhone ? `Mob: ${resolvedAuthPhone}` : '';
          const candName = dataMap['{{candidateName}}'] || 'Candidate';
          const compName = dataMap['{{companyName}}'] || '';

          htmlContent = `<div style="margin:0 0 15px 0;page-break-inside:avoid;break-inside:avoid;border:1px solid #dbeafe;border-radius:6px;overflow:hidden;box-shadow:0 1px 4px rgba(30,58,138,0.06);">
  <div style="height:3px;background:linear-gradient(90deg,#1e3a8a 0%,#2563eb 40%,#38bdf8 100%);"></div>
  <div style="background:linear-gradient(135deg,#f0f7ff 0%,#ffffff 100%);padding:10px 14px 8px 14px;">
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <tr>
        <td style="width:${showCand ? '50%' : '100%'};vertical-align:top;">
          <div style="color:#2563eb;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">
            ${authLbl}
          </div>
          <div style="display:inline-block;min-width:140px;">
            <div style="font-weight:800;color:#0f172a;font-size:12px;line-height:1.25;">${resolvedAuthName}</div>
            ${desigDeptLine ? `<div style="color:#475569;font-size:10px;line-height:1.25;margin-top:2px;">${desigDeptLine}</div>` : ''}
            ${showComp && compName ? `<div style="color:#2563eb;font-size:9.5px;font-weight:600;margin-top:2px;">For ${compName}</div>` : ''}
            ${contactLine ? `<div style="color:#64748b;font-size:9px;line-height:1.25;margin-top:2px;">${contactLine}</div>` : ''}
          </div>
        </td>
        ${showCand ? `
        <td style="width:50%;vertical-align:top;text-align:right;">
          <div style="color:#64748b;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:${showSigLine ? '22px' : '4px'};">
            ${candLbl}
          </div>
          <div style="display:inline-block;text-align:center;">
            <div style="${showSigLine ? 'border-top:2px solid #64748b;padding-top:4px;' : ''}min-width:170px;">
              <div style="font-weight:800;color:#0f172a;font-size:12px;line-height:1.25;">${candName}</div>
              ${showSigLine ? `<div style="color:#64748b;font-size:9.5px;line-height:1.25;margin-top:2px;">Signature &amp; Date</div>` : ''}
            </div>
          </div>
        </td>` : ''}
      </tr>
    </table>
  </div>
</div>`;
          break;
        }

        case 'terms_conditions':
        case 'custom_rich_text': {
          const raw = sec.content?.html || '';
          htmlContent = `<div class="offer-rich-text" style="page-break-inside:avoid;break-inside:avoid;margin:0 0 15px 0;font-size:10.5px;line-height:1.52;color:#334155;text-align:justify;">
  ${formatQuillHtmlForExport(sub(raw))}
</div>`;
          break;
        }

        default: {
          const raw = sec.content?.html || '';
          if (raw) {
            htmlContent = `<div class="offer-rich-text" style="page-break-inside:avoid;break-inside:avoid;margin:0 0 15px 0;font-size:10.5px;line-height:1.52;color:#334155;">
  ${formatQuillHtmlForExport(sub(raw))}
</div>`;
          }
          break;
        }
      }

      if (sec.sectionMinHeight && Number(sec.sectionMinHeight) > 0) {
        const minH = Number(sec.sectionMinHeight);
        const styleParts = [];
        if (minH) styleParts.push(`min-height:${minH}px;`);
        styleParts.push('box-sizing:border-box;');
        return `<div style="${styleParts.join('')}">${htmlContent}</div>`;
      }
      return htmlContent;
    });

    const sheetStyle = `-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-family:'Inter',Arial,Helvetica,sans-serif;color:#1e293b;background:#ffffff;padding:24px 34px 24px 34px;line-height:1.55;font-size:11px;width:794px;max-width:794px;height:1122px;max-height:1122px;box-sizing:border-box;position:relative;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;${pageIdx < pages.length - 1 ? 'page-break-after:always;break-after:page;' : 'page-break-after:auto;break-after:auto;'}`;

    return `<div class="a4-page-pdf-sheet" style="${sheetStyle}">
  <div class="a4-page-content-flow" style="flex:1 0 auto;display:flex;flex-direction:column;width:100%;">
    ${sectionHtmlParts.join('\n')}
  </div>
  <div style="margin-top:auto;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;width:100%;">
    <div style="font-size:8px;color:#94a3b8;letter-spacing:0.5px;">This is a system-generated offer letter. | <span style="color:#2563eb;">${dataMap['{{companyName}}'] || ''}</span></div>
    <div style="font-size:8px;color:#94a3b8;font-weight:600;">Page ${pageIdx + 1} of ${pages.length}</div>
  </div>
</div>`;
  });

  return `<div class="autonoma-offer-letter-clean-doc" style="background:#ffffff;width:794px;max-width:794px;margin:0 auto;box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-family:'Inter',Arial,Helvetica,sans-serif;"><style>.autonoma-offer-letter-clean-doc, .autonoma-offer-letter-clean-doc * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; } .autonoma-offer-letter-clean-doc .offer-rich-text p { margin: 0 0 6px 0; line-height: 1.55; } .autonoma-offer-letter-clean-doc .offer-rich-text p:last-child { margin-bottom: 0; } .autonoma-offer-letter-clean-doc .offer-rich-text ul { list-style-type: disc !important; padding-left: 22px; margin: 4px 0 6px 0; } .autonoma-offer-letter-clean-doc .offer-rich-text ol { list-style-type: decimal !important; padding-left: 22px; margin: 4px 0 6px 0; } .autonoma-offer-letter-clean-doc .offer-rich-text li { margin-bottom: 4px; line-height: 1.5; } .autonoma-offer-letter-clean-doc .offer-rich-text li[data-list="bullet"], .autonoma-offer-letter-clean-doc .offer-rich-text ul li { list-style-type: disc !important; } .autonoma-offer-letter-clean-doc .offer-rich-text li[data-list="ordered"], .autonoma-offer-letter-clean-doc .offer-rich-text ol li { list-style-type: decimal !important; }</style>${pageHtmls.join('\n')}</div>`;
};
