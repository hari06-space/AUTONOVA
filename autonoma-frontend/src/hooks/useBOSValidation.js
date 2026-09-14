import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { fetchMasterDataCached } from 'utils/masterDataCache';
import { parsePhoneString } from 'utils/phoneUtils';

/**
 * BOS SOP #6, #9, #10 — Centralized Form Validation Hook
 *
 * Usage:
 *   const { errors, validate, clearErrors } = useBOSValidation();
 *   const isValid = validate(formData, rules);
 *
 * Rules format:
 *   [
 *     { field: 'departmentName', label: 'Department Name', required: true, maxLength: 100 },
 *     { field: 'departmentNo',   label: 'Department Number', required: true, type: 'number' },
 *     { field: 'email',          label: 'Email', pattern: /^[^@]+@[^@]+$/ },
 *   ]
 */
export default function useBOSValidation() {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetchMasterDataCached('/api/admin/countries', { skipGlobalAlert: true })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCountries(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load countries in useBOSValidation', err);
      });
  }, []);

  const clearErrors = useCallback((fieldName) => {
    if (fieldName) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  const isPhoneField = (fieldName) => {
    const name = String(fieldName).toLowerCase();
    // Exclude numeric config/metadata/financial fields that happen to contain 'phone' or 'mobile'
    const isConfigField = name.includes('length') || name.includes('min') || name.includes('max') ||
      name.includes('limit') || name.includes('count') || name.includes('allowance') ||
      name.includes('annual') || name.includes('cug') || name.includes('salary') ||
      name.includes('amount') || name.includes('ctc');
    if (isConfigField) return false;
    return name.includes('phone') || name.includes('mobile') || name.includes('whatsapp') || name === 'contactno';
  };

  const validate = useCallback(
    (formDataOrRules, rulesArg) => {
      const newErrors = {};
      let firstError = null;

      let formData = {};
      let rules = [];

      if (Array.isArray(formDataOrRules)) {
        rules = formDataOrRules;
        rules.forEach(r => { formData[r.field] = r.value; });
      } else if (formDataOrRules && typeof formDataOrRules === 'object' && !rulesArg) {
        rules = Object.keys(formDataOrRules).map(key => ({
          field: key,
          ...(formDataOrRules[key] || {})
        }));
        rules.forEach(r => { formData[r.field] = r.value; });
      } else {
        formData = formDataOrRules || {};
        rules = Array.isArray(rulesArg)
          ? rulesArg
          : (rulesArg && typeof rulesArg === 'object'
            ? Object.keys(rulesArg).map(k => ({ field: k, ...(rulesArg[k] || {}) }))
            : []);
      }

      for (const rule of rules) {
        const value = formData[rule.field];
        const label = rule.label || rule.field;

        // Required check (SOP #9)
        if (rule.required) {
          if (
            value === undefined ||
            value === null ||
            (typeof value === 'string' && !value.trim()) ||
            (Array.isArray(value) && value.length === 0)
          ) {
            newErrors[rule.field] = rule.requiredMessage || `${label} is required *`;
            if (!firstError) firstError = newErrors[rule.field];
            continue;
          }
        }

        // Skip further checks if empty and not required (unless there is a custom validator)
        if ((value === undefined || value === null || value === '') && !rule.validate) continue;

        // Dynamic Phone validation
        if (rule.type === 'phone' || isPhoneField(rule.field)) {
          if (value === undefined || value === null || value === '') {
            continue;
          }
          const { countryCode, localNumber, country } = parsePhoneString(String(value), countries);
          const cleanedLocal = (localNumber || '').replace(/[^0-9]/g, '');
          
          if (country) {
            const min = country.phoneMinLength || 10;
            const max = country.phoneMaxLength || 10;
            if (cleanedLocal.length < min || cleanedLocal.length > max) {
              const msg = min === max
                ? `${label} must be ${min} digits`
                : `${label} must be between ${min} and ${max} digits`;
              newErrors[rule.field] = rule.patternMessage || msg;
              if (!firstError) firstError = newErrors[rule.field];
            }
          } else {
            // General fallback length validation
            if (cleanedLocal.length < 8 || cleanedLocal.length > 15) {
              newErrors[rule.field] = `${label} must be between 8 and 15 digits`;
              if (!firstError) firstError = newErrors[rule.field];
            }
          }
          continue;
        }

        // Max length check (SOP #10)
        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
          newErrors[rule.field] = `${label} must be ${rule.maxLength} characters or less`;
          if (!firstError) firstError = newErrors[rule.field];
        }

        // Min length check
        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
          newErrors[rule.field] = `${label} must be at least ${rule.minLength} characters`;
          if (!firstError) firstError = newErrors[rule.field];
        }

        // Number type check
        if (rule.type === 'number' && isNaN(Number(value))) {
          newErrors[rule.field] = `${label} must be a valid number`;
          if (!firstError) firstError = newErrors[rule.field];
        }

        // Pattern check
        // Pattern check
        if (rule.pattern && value && typeof value === 'string') {
          const testVal = (rule.field === 'aadharNo' || String(rule.label || '').toLowerCase().includes('aadhar'))
            ? value.replace(/[\s-]/g, '')
            : value;
          if (testVal && !rule.pattern.test(testVal)) {
            newErrors[rule.field] = rule.patternMessage || `${label} format is invalid`;
            if (!firstError) firstError = newErrors[rule.field];
          }
        }

        // Custom validator
        if (rule.validate && typeof rule.validate === 'function') {
          const customError = rule.validate(value, formData);
          if (customError) {
            newErrors[rule.field] = customError;
            if (!firstError) firstError = customError;
          }
        }
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        dispatch(
          openSnackbar({
            open: true,
            message: firstError || 'Please fill the mandatory field',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'error',
            close: false
          })
        );
        return false;
      }

      return true;
    },
    [dispatch, countries]
  );

  const handleInputChange = useCallback(
    (e, setter) => {
      const { name, value } = e.target;
      if (setter) {
        setter((prev) => ({ ...prev, [name]: value }));
      }
      if (errors[name]) {
        clearErrors(name);
      }
    },
    [errors, clearErrors]
  );

  return { errors, validate, clearErrors, setErrors, handleInputChange };
}

