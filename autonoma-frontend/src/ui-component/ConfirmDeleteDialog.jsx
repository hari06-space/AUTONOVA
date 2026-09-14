import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Stack, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconTrash, IconX, IconAlertTriangle } from '@tabler/icons-react';

// ==============================|| CONFIRM DELETE DIALOG - BOS SOP #5 ||============================== //

/**
 * Reusable Delete Confirmation Dialog (BOS SOP Rule #5)
 * Displays a centered, themed MUI dialog before any delete operation.
 *
 * @param {boolean} open - Whether the dialog is visible
 * @param {function} onClose - Called when cancel/close is clicked
 * @param {function} onConfirm - Called when the user confirms deletion
 * @param {string} title - Dialog title (default: "Confirm Deletion")
 * @param {string} message - Body message describing what is being deleted
 * @param {string} itemName - Optional name of the item to highlight
 */
export default function ConfirmDeleteDialog({ open, onClose, onConfirm, title = 'Confirm Deletion', message, itemName }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      // Check if Ctrl + Y is pressed
      const isY = e.key === 'y' || e.key === 'Y' || e.code === 'KeyY' || e.keyCode === 89;
      if (e.ctrlKey && isY) {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      }
      // Check if Ctrl + N is pressed
      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, onConfirm]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          bgcolor: isDark ? '#161b22' : '#fff',
          border: isDark ? '1px solid #30363d' : 'none',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: isDark ? '#1c2128' : '#fef2f2',
          borderBottom: '1px solid',
          borderColor: isDark ? '#30363d' : '#fecaca',
          py: 2,
          px: 3
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: isDark ? 'rgba(248,81,73,0.15)' : '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <IconAlertTriangle size={22} color={theme.palette.error.main} />
        </Box>
        <Typography variant="h5" fontWeight={600} color={isDark ? '#f85149' : 'error.main'}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3, px: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {message || 'Are you sure you want to delete this record? This action cannot be undone.'}
        </Typography>
        {itemName && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(248,81,73,0.08)' : '#fef2f2',
              border: '1px solid',
              borderColor: isDark ? '#30363d' : '#fecaca'
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} color="error.main">
              {itemName}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Tooltip title="Esc" arrow placement="top">
          <span>
            <Button
              variant="outlined"
              color="secondary"
              onClick={onClose}
              startIcon={<IconX size={18} />}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
            >
              No
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Ctrl+Y" arrow placement="top">
          <span>
            <Button
              variant="contained"
              color="error"
              onClick={onConfirm}
              startIcon={<IconTrash size={18} />}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
            >
              Yes
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
}

ConfirmDeleteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  itemName: PropTypes.string
};
