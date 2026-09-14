import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Button, Tooltip } from '@mui/material';
import { IconFileTypePdf } from '@tabler/icons-react';

/**
 * BOSPdfButton — Centralized PDF Action Button / Icon
 * Provides unified appearance, iconography, and interactions across the ERP.
 */
export default function BOSPdfButton({
  onClick,
  variant = 'icon', // 'icon' | 'button' | 'contained'
  size = 'small',
  title = 'View / Export PDF',
  disabled = false,
  label = 'PDF',
  iconSize = 18,
  sx = {}
}) {
  if (variant === 'button') {
    return (
      <Button
        size={size}
        variant="outlined"
        disabled={disabled}
        onClick={onClick}
        startIcon={<IconFileTypePdf size={iconSize} color="#d32f2f" />}
        sx={{
          color: '#d32f2f',
          borderColor: '#ffcdd2',
          bgcolor: '#fff5f5',
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: 2,
          '&:hover': {
            bgcolor: '#ffebee',
            borderColor: '#ef9a9a',
            color: '#b71c1c'
          },
          ...sx
        }}
      >
        {label}
      </Button>
    );
  }

  if (variant === 'contained') {
    return (
      <Button
        size={size}
        variant="contained"
        disabled={disabled}
        onClick={onClick}
        startIcon={<IconFileTypePdf size={iconSize} color="#ffffff" />}
        sx={{
          bgcolor: '#d32f2f',
          color: '#ffffff',
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)',
          '&:hover': {
            bgcolor: '#b71c1c',
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.4)'
          },
          ...sx
        }}
      >
        {label}
      </Button>
    );
  }

  // Default circular icon button
  return (
    <Tooltip title={title} arrow>
      <span>
        <IconButton
          size={size}
          disabled={disabled}
          onClick={onClick}
          sx={{
            color: '#d32f2f',
            bgcolor: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '50%',
            p: 0.8,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: '#ffcdd2',
              color: '#b71c1c',
              transform: 'scale(1.06)'
            },
            '&.Mui-disabled': {
              bgcolor: '#f1f5f9',
              borderColor: '#e2e8f0',
              color: '#94a3b8'
            },
            ...sx
          }}
        >
          <IconFileTypePdf size={iconSize} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

BOSPdfButton.propTypes = {
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['icon', 'button', 'contained']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  title: PropTypes.string,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  iconSize: PropTypes.number,
  sx: PropTypes.object
};
