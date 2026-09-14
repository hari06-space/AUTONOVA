/**
 * Organization: Nutech Wind Parts Pvt Ltd
 * Owner: Yuvanesh M
 * Created At: 2026-08-30
 * Updated By: Yuvanesh M
 * Updated At: 2026-09-01
 * Description: Memoized Form Dialog for Offer Letter Create/Edit/View (HA1360).
 *              Encapsulates candidate, organizational, compensation, and terms sections.
 *              Pass embedded=true to render the fields without dialog chrome (full-page New flow).
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  useTheme
} from '@mui/material';
import {
  IconUser,
  IconBriefcase,
  IconCalendar,
  IconCashBanknote,
  IconMail,
  IconPhone,
  IconInfoCircle
} from '@tabler/icons-react';
import {
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  BOSAutocomplete,
  BOSCandidateAutocomplete,
  BOSDatePicker,
  errorStyle,
  getDisplayString,
  normalizeGender,
  extractDateString,
  getPhotoUrl,
  GENDER_OPTIONS
} from 'ui-component/bos';
import { getFileViewUrl, getUserImageUrl } from 'utils/upload-helper';
import SalaryStructureTable from './SalaryStructureTable';


const OfferLetterFormDialog = memo(function OfferLetterFormDialog({
  open = false,
  onClose,
  dialogMode = 'new', // 'new' | 'edit' | 'view'
  onSave,
  saving = false,
  onClear,
  candidates = [],
  selectedCandidate,
  onSelectCandidate,
  loadingCandidates = false,
  // Candidate form values
  candidateName = '',
  candidateCode = '',
  email = '',
  onEmailChange,
  phone = '',
  onPhoneChange,
  gender = '',
  onGenderChange,
  dob = '',
  onDobChange,
  candidatePhoto = '',
  // Job details
  department = '',
  onDepartmentChange,
  departmentsList = [],
  designation = '',
  onDesignationChange,
  designationsList = [],
  employmentType = '',
  onEmploymentTypeChange,
  employeeTypesList = [],
  workLocation = '',
  onWorkLocationChange,
  locationsList = [],
  grade = '',
  onGradeChange,
  gradesList = [],
  // Offer timeline
  refNo = '',
  offerDate = '',
  onOfferDateChange,
  joiningDate = '',
  onJoiningDateChange,
  probationPeriod = '6',
  onProbationPeriodChange,
  // Salary state
  salaryEarnings = [],
  salaryDeductions = [],
  salaryContributions = [],
  localSalary = {},
  onSalaryFieldChange,
  salaryLoading = false,
  isPFEnabled = true,
  isESIEnabled = true,
  isPTaxEnabled = true,
  onSalaryToggleChange,
  grossVal = 0,
  deductionsVal = 0,
  contributionsVal = 0,
  netVal = 0,
  ctcVal = 0,
  totalCTC = 0,
  onOpenSalaryChangeLog,
  onAutoCalculate,
  activeCompsList = [],
  // Terms
  terms = {},
  onTermsChange,
  // Validation
  errors = {},
  embedded = false
}) {
  const theme = useTheme();
  const isReadOnly = dialogMode === 'view';

  const formBody = (
      <Stack spacing={3} sx={{ mt: embedded ? 0 : 1 }}>
        {/* 1. CANDIDATE SELECTION & BASIC DETAILS */}
        <BOSFormSection
          icon={<IconUser size={22} color={theme.palette.primary.main} />}
          title="Candidate & Personal Details"
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: '1.15fr 0.95fr 1.05fr 1.45fr 0.65fr 0.95fr'
              },
              gap: 2,
              width: '100%',
              alignItems: 'flex-start'
            }}
          >
            {/* 1. CANDIDATE SELECTION DROPDOWN */}
            <BOSCandidateAutocomplete
              fullWidth
              sx={{ width: '100%', ...errorStyle(!!errors.candidateName) }}
              label="Select Candidate / Employee *"
              placeholder="Search candidate / employee..."
              candidates={candidates}
              value={selectedCandidate || null}
              onChange={(val) => {
                if (onSelectCandidate) onSelectCandidate(val);
              }}
              loading={loadingCandidates}
              disabled={isReadOnly}
              error={!!errors.candidateName}
              helperText={errors.candidateName}
              required
              minPopperWidth={420}
            />

            {/* 2. CANDIDATE ID */}
            <BOSTextField
              fullWidth
              sx={{ width: '100%' }}
              label="Candidate / Employee ID"
              value={getDisplayString(candidateCode || selectedCandidate?.applicantCode)}
              disabled
              placeholder="Auto-populated ID"
            />

            {/* 3. MAIL ID */}
            <BOSTextField
              fullWidth
              label="Mail ID *"
              type="email"
              value={getDisplayString(email)}
              onChange={(e) => onEmailChange && onEmailChange(e.target.value)}
              disabled={isReadOnly}
              required
              error={!!errors.email}
              helperText={errors.email}
              sx={{ width: '100%', ...errorStyle(!!errors.email) }}
              placeholder="candidate@example.com"
            />

            {/* 4. MOBILE NO */}
            <BOSTextField
              fullWidth
              label="Mobile No *"
              type="phone"
              value={phone}
              onChange={(e) => onPhoneChange && onPhoneChange(e.target.value)}
              disabled={isReadOnly}
              required
              error={!!errors.phone}
              helperText={errors.phone}
              sx={{ width: '100%', ...errorStyle(!!errors.phone) }}
            />

            {/* 5. GENDER */}
            <BOSAutocomplete
              fullWidth
              sx={{ width: '100%' }}
              label="Gender"
              options={GENDER_OPTIONS}
              value={normalizeGender(gender) || null}
              onChange={(e, val) => {
                const selected = val !== undefined ? val : (e?.target ? e.target.value : e);
                if (onGenderChange) onGenderChange(normalizeGender(selected) || '');
              }}
              disabled={isReadOnly}
            />

            {/* 6. DATE OF BIRTH */}
            <BOSDatePicker
              fullWidth
              sx={{ width: '100%' }}
              label="Date of Birth"
              value={dob}
              onChange={(e) => {
                const dStr = extractDateString(e);
                if (onDobChange) onDobChange(dStr);
              }}
              disabled={isReadOnly}
            />
          </Box>
        </BOSFormSection>

        {/* 2. JOB DETAILS SECTION */}
        <BOSFormSection
          icon={<IconBriefcase size={22} color={theme.palette.primary.main} />}
          title="Job & Organizational Details"
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(5, 1fr)'
              },
              gap: 2,
              width: '100%',
              alignItems: 'flex-start'
            }}
          >
            <BOSAutocomplete
              fullWidth
              sx={{ width: '100%' }}
              label="Department *"
              options={departmentsList}
              value={getDisplayString(department) || null}
              onChange={(e, val) => {
                const selected = val?.name ?? val?.value ?? (typeof val === 'string' ? val : (e?.target ? e.target.value : val));
                if (onDepartmentChange) onDepartmentChange(getDisplayString(selected) || '');
              }}
              disabled={isReadOnly}
              required
              error={!!errors.department}
              helperText={errors.department}
            />

            <BOSAutocomplete
              fullWidth
              sx={{ width: '100%' }}
              label="Designation *"
              options={designationsList}
              value={getDisplayString(designation) || null}
              onChange={(e, val) => {
                const selected = val?.name ?? val?.value ?? (typeof val === 'string' ? val : (e?.target ? e.target.value : val));
                if (onDesignationChange) onDesignationChange(getDisplayString(selected) || '');
              }}
              disabled={isReadOnly}
              required
              error={!!errors.designation}
              helperText={errors.designation}
            />

            <BOSAutocomplete
              fullWidth
              sx={{ width: '100%' }}
              label="Employee Type"
              options={employeeTypesList}
              value={getDisplayString(employmentType) || null}
              onChange={(e, val) => {
                const selected = val?.typeName ?? val?.name ?? val?.value ?? (typeof val === 'string' ? val : (e?.target ? e.target.value : val));
                if (onEmploymentTypeChange) onEmploymentTypeChange(getDisplayString(selected) || '');
              }}
              disabled={isReadOnly}
            />

            <BOSTextField
              fullWidth
              sx={{ width: '100%' }}
              label="Work Location"
              value={getDisplayString(workLocation)}
              onChange={(e) => onWorkLocationChange && onWorkLocationChange(e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter work location"
            />

            <BOSAutocomplete
              fullWidth
              sx={{ width: '100%' }}
              label="Grade / Band"
              options={gradesList}
              value={getDisplayString(grade) || null}
              onChange={(e, val) => {
                const selected = val?.gradeCode ?? val?.gradeName ?? val?.name ?? val?.value ?? (typeof val === 'string' ? val : (e?.target ? e.target.value : val));
                if (onGradeChange) onGradeChange(getDisplayString(selected) || '');
              }}
              disabled={isReadOnly}
            />
          </Box>
        </BOSFormSection>

        {/* 3. TIMELINE SECTION */}
        <BOSFormSection
          icon={<IconCalendar size={22} color={theme.palette.primary.main} />}
          title="Offer & Employment Timeline"
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: '1.2fr 1fr 1fr 1fr 1fr'
              },
              gap: 2,
              width: '100%',
              alignItems: 'flex-start'
            }}
          >
            <BOSTextField
              fullWidth
              label="Offer Letter No"
              value={refNo || 'Auto-generated'}
              disabled
              placeholder="Auto-generated from Prefix/Suffix"
            />

            <BOSDatePicker
              fullWidth
              label="Offer Issue Date"
              value={offerDate}
              onChange={(e) => {
                const dStr = extractDateString(e);
                if (onOfferDateChange) onOfferDateChange(dStr);
              }}
              disabled={isReadOnly}
            />

            <BOSDatePicker
              fullWidth
              label="Joining Date"
              value={joiningDate}
              onChange={(e) => {
                const dStr = extractDateString(e);
                if (onJoiningDateChange) onJoiningDateChange(dStr);
              }}
              disabled={isReadOnly}
            />

            <BOSTextField
              fullWidth
              label="Probation Period (Months)"
              type="number"
              value={probationPeriod}
              onChange={(e) => onProbationPeriodChange && onProbationPeriodChange(e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 6"
            />

            <BOSTextField
              fullWidth
              label="Notice Period"
              placeholder="e.g. 30 Days"
              value={getDisplayString(terms?.noticePeriod)}
              onChange={(e) => {
                const val = e.target.value;
                if (onTermsChange) {
                  onTermsChange((prev) => ({ ...(typeof prev === 'object' ? prev : terms), noticePeriod: val }));
                }
              }}
              disabled={isReadOnly}
            />
          </Box>
        </BOSFormSection>

        {/* 4. COMPENSATION SECTION (MEMOIZED CHILD) */}
        <BOSFormSection
          icon={<IconCashBanknote size={22} color={theme.palette.primary.main} />}
          title="Compensation Breakdown & Annual CTC"
        >
          <SalaryStructureTable
            salaryEarnings={salaryEarnings}
            salaryDeductions={salaryDeductions}
            salaryContributions={salaryContributions}
            localSalary={localSalary}
            onSalaryFieldChange={onSalaryFieldChange}
            isReadOnly={isReadOnly}
            salaryLoading={salaryLoading}
            isPFEnabled={isPFEnabled}
            isESIEnabled={isESIEnabled}
            isPTaxEnabled={isPTaxEnabled}
            onSalaryToggleChange={onSalaryToggleChange}
            grossVal={grossVal}
            deductionsVal={deductionsVal}
            contributionsVal={contributionsVal}
            netVal={netVal}
            ctcVal={ctcVal}
            totalCTC={totalCTC}
            onOpenSalaryChangeLog={onOpenSalaryChangeLog}
            onAutoCalculate={onAutoCalculate}
            activeCompsList={activeCompsList}
          />
        </BOSFormSection>
      </Stack>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      title={dialogMode === 'view' ? 'View Offer Letter' : dialogMode === 'edit' ? 'Edit Offer Letter' : 'New Offer Letter'}
      fullWidth
      maxWidth="lg"
      onSave={isReadOnly ? null : onSave}
      saveButtonDisabled={saving}
      isViewOnly={isReadOnly}
      onClear={onClear}
    >
      {formBody}
    </BOSFormDialog>
  );
});

OfferLetterFormDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  dialogMode: PropTypes.string,
  onSave: PropTypes.func,
  saving: PropTypes.bool,
  onClear: PropTypes.func,
  candidates: PropTypes.array,
  selectedCandidate: PropTypes.object,
  onSelectCandidate: PropTypes.func,
  loadingCandidates: PropTypes.bool,
  candidateName: PropTypes.string,
  candidateCode: PropTypes.string,
  email: PropTypes.string,
  onEmailChange: PropTypes.func,
  phone: PropTypes.string,
  onPhoneChange: PropTypes.func,
  gender: PropTypes.string,
  onGenderChange: PropTypes.func,
  dob: PropTypes.string,
  onDobChange: PropTypes.func,
  candidatePhoto: PropTypes.string,
  department: PropTypes.string,
  onDepartmentChange: PropTypes.func,
  departmentsList: PropTypes.array,
  designation: PropTypes.string,
  onDesignationChange: PropTypes.func,
  designationsList: PropTypes.array,
  employmentType: PropTypes.string,
  onEmploymentTypeChange: PropTypes.func,
  employeeTypesList: PropTypes.array,
  workLocation: PropTypes.string,
  onWorkLocationChange: PropTypes.func,
  locationsList: PropTypes.array,
  grade: PropTypes.string,
  onGradeChange: PropTypes.func,
  gradesList: PropTypes.array,
  refNo: PropTypes.string,
  offerDate: PropTypes.string,
  onOfferDateChange: PropTypes.func,
  joiningDate: PropTypes.string,
  onJoiningDateChange: PropTypes.func,
  probationPeriod: PropTypes.string,
  onProbationPeriodChange: PropTypes.func,
  salaryEarnings: PropTypes.array,
  salaryDeductions: PropTypes.array,
  salaryContributions: PropTypes.array,
  localSalary: PropTypes.object,
  onSalaryFieldChange: PropTypes.func,
  salaryLoading: PropTypes.bool,
  isPFEnabled: PropTypes.bool,
  isESIEnabled: PropTypes.bool,
  isPTaxEnabled: PropTypes.bool,
  onSalaryToggleChange: PropTypes.func,
  grossVal: PropTypes.number,
  deductionsVal: PropTypes.number,
  contributionsVal: PropTypes.number,
  netVal: PropTypes.number,
  ctcVal: PropTypes.number,
  totalCTC: PropTypes.number,
  onOpenSalaryChangeLog: PropTypes.func,
  onAutoCalculate: PropTypes.func,
  activeCompsList: PropTypes.array,
  terms: PropTypes.object,
  onTermsChange: PropTypes.func,
  errors: PropTypes.object,
  embedded: PropTypes.bool
};

export default OfferLetterFormDialog;
