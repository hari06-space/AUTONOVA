import { useState } from 'react';
import PropTypes from 'prop-types';
import { Stack, Typography, Button, Box } from '@mui/material';
import { BOSFormDialog, BOSTextField, btnCancel, btnWarning } from 'ui-component/bos';
import { IconAlertTriangle } from '@tabler/icons-react';

const ShortCloseDialog = ({ open, onClose, onConfirm, itemName }) => {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!remarks.trim()) {
      setError('Justification remarks are mandatory to short close a penalty.');
      return;
    }
    setError('');
    onConfirm(remarks.trim());
    setRemarks('');
  };

  const handleClose = () => {
    setRemarks('');
    setError('');
    onClose();
  };

  return (
    <BOSFormDialog
      open={open}
      onClose={handleClose}
      title="Short Close Penalty"
      maxWidth="sm"
      hideFooter={true}
      sx={{ zIndex: 1350 }}
    >
      <Stack spacing={3}>
        <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 2, border: '1px solid', borderColor: 'warning.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconAlertTriangle size={22} color="#ed6c02" />
          <Typography variant="body2" color="warning.dark" fontWeight={700}>
            You are about to short close the penalty for <strong>{itemName || 'this employee'}</strong>. This action will remove the penalty from the payroll deduction pipeline.
          </Typography>
        </Box>

        <BOSTextField
          label="Justification Remarks *"
          value={remarks}
          onChange={(e) => { setRemarks(e.target.value.toUpperCase()); setError(''); }}
          multiline
          rows={3}
          placeholder="Enter the reason for short closing this penalty..."
          error={!!error}
          helperText={error}
          required
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
          <Button onClick={handleClose} variant="contained" sx={btnCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirm} sx={btnWarning}>
            Confirm Short Close
          </Button>
        </Box>
      </Stack>
    </BOSFormDialog>
  );
};

ShortCloseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  itemName: PropTypes.string
};

export default ShortCloseDialog;
