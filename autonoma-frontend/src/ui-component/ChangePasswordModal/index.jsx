import React, { useState } from 'react';
import axios from 'utils/axios';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Stack,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormHelperText,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  IconLockCog,
  IconLock,
  IconEye,
  IconEyeOff,
  IconCircleCheckFilled,
  IconInfoCircle,
  IconAlertCircle
} from '@tabler/icons-react';

const ChangePasswordModal = ({ open, handleClose }) => {
  const theme = useTheme();

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [oldPasswordError, setOldPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOldPasswordError('');
      setIsSubmitting(false);
    }
  }, [open]);

  const calculateStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length > 7) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const strengthScore = calculateStrength(newPassword);

  const getStrengthColor = (index) => {
    if (strengthScore === 0) return theme.palette.grey[300];
    if (strengthScore <= 2) return index < strengthScore ? theme.palette.error.main : theme.palette.grey[300];
    if (strengthScore <= 3) return index < strengthScore ? theme.palette.warning.main : theme.palette.grey[300];
    if (strengthScore <= 4) return index < strengthScore ? theme.palette.info.main : theme.palette.grey[300];
    return index < 5 ? theme.palette.success.main : theme.palette.grey[300];
  };

  const getStrengthLabel = () => {
    if (strengthScore === 0) return '';
    if (strengthScore <= 2) return 'Weak';
    if (strengthScore <= 3) return 'Fair';
    if (strengthScore <= 4) return 'Good';
    return 'Strong';
  };

  const getStrengthLabelColor = () => {
    if (strengthScore <= 2) return theme.palette.error.main;
    if (strengthScore <= 3) return theme.palette.warning.main;
    if (strengthScore <= 4) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const isFormValid = () => {
    if (!oldPassword || !newPassword || !confirmPassword) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  };

  const handleUpdate = async () => {
    if (!oldPassword) {
      setOldPasswordError('Old password is required.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Backend API call to validate and update password
      await axios.post('/api/users/change-password', {
        oldPassword,
        newPassword
      });
      setOldPasswordError('');
      handleClose();
    } catch (error) {
      setOldPasswordError(error.response?.data?.message || 'Incorrect old password or failed to update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordsMatch = newPassword === confirmPassword && newPassword !== '';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      scroll="body"
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
          background: 'background.paper'
        }
      }}
    >
      <DialogContent sx={{ 
        textAlign: 'center', 
        p: 3,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' }
      }}>
        {/* Header Icon */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
            mb: 2,
            boxShadow: '0 8px 16px rgba(142, 197, 252, 0.4)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <IconLockCog size={32} color="#fff" />
          </Box>
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#1a1a24' }}>
          Change Password
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          Update your password securely
        </Typography>

        <Box sx={{ textAlign: 'left', mb: 3 }}>
          {/* Old Password */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#3e3e4a' }}>
            Old Password
          </Typography>
          <OutlinedInput
            fullWidth
            error={Boolean(oldPasswordError)}
            type={showOldPassword ? 'text' : 'password'}
            placeholder="Enter your old password"
            autoComplete="new-password"
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value);
              setOldPasswordError('');
            }}
            startAdornment={
              <InputAdornment position="start">
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: Boolean(oldPasswordError) ? '#ffebee' : '#f4f4f9', display: 'flex' }}>
                  <IconLock size={20} color={Boolean(oldPasswordError) ? theme.palette.error.main : theme.palette.primary.main} />
                </Box>
              </InputAdornment>
            }
            endAdornment={
              <InputAdornment position="end">
                <IconButton onClick={() => setShowOldPassword(!showOldPassword)} edge="end" size="small">
                  {showOldPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </IconButton>
              </InputAdornment>
            }
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: Boolean(oldPasswordError) ? theme.palette.error.main : '#e0e0e0' }
            }}
          />
          {oldPasswordError && (
            <FormHelperText error sx={{ display: 'flex', alignItems: 'center', mt: 1, fontWeight: 600 }}>
              <IconAlertCircle size={16} style={{ marginRight: 4 }} />
              {oldPasswordError}
            </FormHelperText>
          )}

          <Box sx={{ mb: 3 }} />

          {/* New Password */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#3e3e4a' }}>
            New Password
          </Typography>
          <OutlinedInput
            fullWidth
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Enter your new password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#f4f4f9', display: 'flex' }}>
                  <IconLock size={20} color={theme.palette.primary.main} />
                </Box>
              </InputAdornment>
            }
            endAdornment={
              <InputAdornment position="end">
                <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                  {showNewPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </IconButton>
              </InputAdornment>
            }
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' }
            }}
          />

          {/* Password Strength Indicator */}
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 0.5 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  sx={{
                    height: 4,
                    flexGrow: 1,
                    borderRadius: 2,
                    bgcolor: getStrengthColor(i),
                    transition: 'background-color 0.3s ease'
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: getStrengthLabelColor(), minWidth: 40, textAlign: 'right' }}>
              {getStrengthLabel()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 3 }}>
            <IconCircleCheckFilled size={16} color={strengthScore >= 5 ? theme.palette.success.main : theme.palette.grey[400]} />
            <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
              Use 8+ characters with a mix of letters, numbers & symbols.
            </Typography>
          </Box>

          {/* Confirm Password */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#3e3e4a' }}>
            Confirm Password
          </Typography>
          <OutlinedInput
            fullWidth
            error={confirmPassword !== '' && !passwordsMatch}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: confirmPassword !== '' && !passwordsMatch ? '#ffebee' : '#f4f4f9', display: 'flex' }}>
                  <IconLock size={20} color={confirmPassword !== '' && !passwordsMatch ? theme.palette.error.main : theme.palette.primary.main} />
                </Box>
              </InputAdornment>
            }
            endAdornment={
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                  {showConfirmPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </IconButton>
              </InputAdornment>
            }
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: confirmPassword !== '' && !passwordsMatch ? theme.palette.error.main : '#e0e0e0' }
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {passwordsMatch ? (
               <IconCircleCheckFilled size={16} color={theme.palette.success.main} />
            ) : (
               <IconInfoCircle size={16} color={confirmPassword !== '' && !passwordsMatch ? theme.palette.error.main : theme.palette.grey[500]} />
            )}
            <Typography variant="caption" sx={{ ml: 0.5, color: confirmPassword !== '' && !passwordsMatch ? 'error.main' : 'text.secondary' }}>
              {confirmPassword !== '' && !passwordsMatch ? "Passwords do not match." : "Make sure both passwords match."}
            </Typography>
          </Box>
        </Box>

        {/* Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 4, mb: 3 }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            fullWidth
            disabled={isSubmitting}
            sx={{
              borderRadius: 2,
              py: 1.5,
              borderColor: '#e0e0e0',
              color: 'text.primary',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#bdbdbd',
                bgcolor: '#f5f5f5'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleUpdate}
            disabled={!isFormValid() || isSubmitting}
            sx={{
              borderRadius: 2,
              py: 1.5,
              background: !isFormValid() ? theme.palette.action.disabledBackground : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              color: !isFormValid() ? theme.palette.action.disabled : '#fff',
              fontWeight: 600,
              boxShadow: !isFormValid() ? 'none' : '0 4px 12px rgba(118, 75, 162, 0.4)',
              '&:hover': {
                background: 'linear-gradient(90deg, #5a6fd6 0%, #633f8f 100%)'
              }
            }}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <IconLockCog size={20} />}
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>
        </Stack>

        {/* Footer Text */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
          <IconLockCog size={16} color={theme.palette.grey[500]} />
          <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
            Your password is encrypted and stored securely.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;
