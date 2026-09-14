import { useState, useCallback, useMemo } from 'react';

/**
 * useBOSForm - A standardized hook to handle form state and validation.
 * Resolves the "uncontrolled to controlled" warning by ensuring safe defaults.
 *
 * @param {Object} initialValues - The starting data for the form.
 * @returns {Object} { formData, setFormData, handleFormChange, resetForm }
 */
export default function useBOSForm(initialValues = {}) {
  const sanitizedInitial = useMemo(() => {
    return Object.keys(initialValues).reduce((acc, key) => {
      acc[key] = initialValues[key] ?? '';
      return acc;
    }, {});
  }, [JSON.stringify(initialValues)]);

  const [formData, setFormData] = useState(sanitizedInitial);
  const [errors, setErrors] = useState({});

  const handleFormChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value ?? ''
      }));
      // Clear error when user types
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: false }));
      }
    },
    [errors]
  );

  const resetForm = useCallback(() => {
    setFormData(sanitizedInitial);
    setErrors({});
  }, [sanitizedInitial]);

  const updateForm = useCallback((newData) => {
    setFormData((prev) => ({
      ...prev,
      ...Object.keys(newData).reduce((acc, key) => {
        acc[key] = newData[key] ?? '';
        return acc;
      }, {})
    }));
  }, []);

  /**
   * validate - Checks mandatory fields and triggers shake animation
   * @param {Array} fields - Array of { field, label } objects
   * @returns {boolean} - True if valid
   */
  const validate = useCallback(
    (fields = []) => {
      const newErrors = {};
      let isValid = true;
      let firstMissing = null;

      fields.forEach((f) => {
        if (!formData[f.field]) {
          newErrors[f.field] = true;
          isValid = false;
          if (!firstMissing) firstMissing = f.label;
        }
      });

      setErrors(newErrors);
      return { isValid, firstMissing, newErrors };
    },
    [formData]
  );

  return { formData, setFormData, errors, setErrors, handleFormChange, resetForm, updateForm, validate };
}
