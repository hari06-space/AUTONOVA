import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { useColorScheme } from '@mui/material/styles';
import { IconCheck } from '@tabler/icons-react';
import { STATUS_TONES } from './BOSStyles';

/**
 * AssetStatusChip - custom status chip specifically for Asset modules status column.
 * Displays "✓ Active" in soft green pill or "✓ Inactive" in soft red pill.
 */
export default function AssetStatusChip({ active }) {
  const isActive = !!active;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mode = isDark ? 'dark' : 'light';

  const tone = isActive ? STATUS_TONES.success[mode] : STATUS_TONES.danger[mode];
  const label = isActive ? 'Active' : 'Inactive';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        bgcolor: tone.bg,
        color: tone.text,
        border: `1px solid ${tone.border}`,
        borderRadius: '24px',
        px: '14px',
        py: '4px',
        height: '28px',
        minWidth: '120px',
        maxWidth: '120px',
        fontSize: '0.8rem',
        fontWeight: 700,
        boxSizing: 'border-box',
        transition: 'all 180ms ease-in-out',
        '&:hover': {
          boxShadow: `0 2px 8px ${tone.border}`
        }
      }}
    >
      <IconCheck size={14} stroke={3} style={{ color: tone.text, flexShrink: 0 }} />
      <Box
        component="span"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

AssetStatusChip.propTypes = {
  active: PropTypes.bool
};
