import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

/**
 * Standardized Form Row for Autonoma ERP
 * Ensures perfect vertical alignment of input fields across all masters.
 *
 * @param {string} label - The label text
 * @param {node} children - The input field component
 * @param {boolean} required - Whether the field is mandatory
 * @param {number} labelWidth - Fixed width for the label column (default 220px)
 */
const FormRow = ({ label, children, required = false, labelWidth = 220 }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: `${labelWidth}px 1fr`,
      alignItems: 'center',
      gap: 3,
      mb: 1.2
    }}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#37474f', textAlign: 'right', pr: 2 }}>
      {label}{' '}
      {required && (
        <Box component="span" sx={{ color: 'error.main' }}>
          *
        </Box>
      )}
    </Typography>
    <Box sx={{ width: '100%' }}>{children}</Box>
  </Box>
);

FormRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  labelWidth: PropTypes.number
};

export default FormRow;
