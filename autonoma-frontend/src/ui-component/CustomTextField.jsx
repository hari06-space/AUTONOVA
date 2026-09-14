import React, { forwardRef } from 'react';
import { TextField as MuiTextField } from '@mui/material';

const CustomTextField = forwardRef((props, ref) => {
  const { onChange, select, ...rest } = props;

  const getLabelString = (lbl) => {
    if (!lbl) return '';
    if (typeof lbl === 'string') return lbl;
    if (typeof lbl === 'object' && lbl.props && lbl.props.children) {
      if (Array.isArray(lbl.props.children)) {
        return lbl.props.children.map((c) => (typeof c === 'string' ? c : (c?.props?.children || ''))).join(' ');
      }
      if (typeof lbl.props.children === 'string') return lbl.props.children;
    }
    return '';
  };

  const labelStr = getLabelString(props.label).toLowerCase();
  const nameStr = String(props.name || '').toLowerCase();

  const exactEmailNames = new Set([
    'email', 'emailid', 'email_id', 'mailid', 'mail_id', 'to', 'cc', 'bcc', 'from',
    'sender', 'recipient', 'username', 'dailydispatchmail'
  ]);
  const isEmailSuffix = nameStr.endsWith('email') || nameStr.endsWith('emailid') || nameStr.endsWith('email_id') || 
                        nameStr.endsWith('mailid') || nameStr.endsWith('mail_id') ||
                        nameStr.endsWith('emailfrom') || nameStr.endsWith('emailto') ||
                        nameStr.endsWith('emailtocustomer') || nameStr.endsWith('fromemailtocustomer');
  const isEmailField = props.type === 'email' ||
    props.type === 'mail' ||
    rest.type === 'email' ||
    rest.type === 'mail' ||
    exactEmailNames.has(nameStr) ||
    isEmailSuffix ||
    labelStr === 'email' ||
    labelStr === 'email id' ||
    labelStr === 'email address' ||
    labelStr === 'mail id' ||
    labelStr.startsWith('email id') ||
    labelStr.startsWith('mail id') ||
    labelStr.startsWith('email address');

  const isUsernameField = nameStr.includes('username') ||
    nameStr.includes('user') ||
    labelStr.includes('username') ||
    labelStr.includes('user name') ||
    labelStr.includes('user');

  const isEmailLike = isEmailField ||
    nameStr.includes('smtp') ||
    nameStr.includes('mail') ||
    nameStr.includes('recipient') ||
    nameStr.includes('website') ||
    nameStr.includes('url') ||
    labelStr.includes('smtp') ||
    labelStr.includes('recipient') ||
    labelStr.includes('mail');

  const disableCase = props.disableCaseTransform ||
    props.type === 'password' ||
    rest.type === 'password' ||
    isEmailField ||
    isEmailLike ||
    isUsernameField ||
    nameStr.includes('secret') ||
    nameStr.includes('password') ||
    nameStr.startsWith('ocr');

  const handleChange = (e) => {
    const caseStyle = window.localStorage.getItem('inputCaseStyle') || 'CUSTOM';

    if (isEmailLike && e && e.target && typeof e.target.value === 'string' && props.type !== 'password' && rest.type !== 'password') {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value = e.target.value.toLowerCase();
      if (start !== null && end !== null && e.target.setSelectionRange) {
        try { e.target.setSelectionRange(start, end); } catch (_) {}
      }
    } else if (!select && !disableCase && e && e.target && typeof e.target.value === 'string' && caseStyle !== 'CUSTOM') {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      if (caseStyle === 'UPPER_CASE') {
        e.target.value = e.target.value.toUpperCase();
      } else if (caseStyle === 'LOWER_CASE') {
        e.target.value = e.target.value.toLowerCase();
      } else if (caseStyle === 'PROPER_CASE') {
        // Simple proper case transformation (capitalize first letter of each word)
        e.target.value = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
      }
      if (start !== null && end !== null && e.target.setSelectionRange) {
        try { e.target.setSelectionRange(start, end); } catch (_) {}
      }
      // 'CUSTOM' or unrecognized means do nothing
    }

    if (onChange) {
      onChange(e);
    }
  };

  const caseStyle = (select || disableCase) ? 'CUSTOM' : (typeof window !== 'undefined' ? (window.localStorage.getItem('inputCaseStyle') || 'CUSTOM') : 'CUSTOM');
  let textTransform = 'none';
  if (isEmailLike) {
    textTransform = 'lowercase';
  } else if (!select && !disableCase && caseStyle !== 'CUSTOM') {
    if (caseStyle === 'UPPER_CASE') textTransform = 'uppercase';
    if (caseStyle === 'LOWER_CASE') textTransform = 'lowercase';
    if (caseStyle === 'PROPER_CASE') textTransform = 'capitalize';
  }

  let effectiveValue = rest.value;
  if (select && rest.value != null && typeof rest.value === 'string' && props.children) {
    const valLower = String(rest.value).trim().toLowerCase();
    React.Children.forEach(props.children, (child) => {
      if (child && child.props && child.props.value != null) {
        if (String(child.props.value).trim().toLowerCase() === valLower) {
          effectiveValue = child.props.value;
        }
      }
    });
  }

  return (
    <MuiTextField
      ref={ref}
      select={select}
      onChange={handleChange}
      {...rest}
      value={select && effectiveValue !== undefined ? effectiveValue : rest.value}
      inputProps={{
        ...rest.inputProps,
        style: {
          textTransform: textTransform,
          ...(rest.inputProps?.style || {})
        }
      }}
    />
  );
});

CustomTextField.displayName = 'CustomTextField';

export default CustomTextField;
