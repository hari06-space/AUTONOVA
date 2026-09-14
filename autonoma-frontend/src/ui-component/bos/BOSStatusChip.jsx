import PropTypes from 'prop-types';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';
import { IconCheck, IconBan, IconAlertCircle, IconHourglass } from '@tabler/icons-react';
import { getStatusTone, getStatusToneColors, STATUS_TONES, getCallStatusConfig, getInterviewStatusConfig, getOfferStatusConfig, getVerificationStatusConfig } from './BOSStyles';

/**
 * BOSStatusChip — the single, unified status indicator for every module.
 *
 * Colours come from the centralized 5-tone system in BOSStyles
 * (success / danger / warning / info / neutral), are HSL-tuned with
 * soft fills, carry a micro-indicator dot, and adapt to dark mode.
 * Standardising here means every page shows identical status styling.
 *
 * Optional leading glyph for the strongest states (verified ✓, rejected ⊘…)
 * can be toggled with `showIcon`.
 */

const ICON_BY_KEYWORD = [
  { match: ['verified', 'completed', 'accepted', 'success', 'passed', 'approved', 'active', 'assigned', 'done', 'excellent', 'very good', 'top performing'], tone: 'success', Icon: IconCheck },
  { match: ['rejected', 'failed', 'cancelled', 'canceled', 'missed', 'blocked', 'poor', 'watchlist'], tone: 'danger', Icon: IconBan },
  { match: ['overdue', 'expired', 'absent', 'error'], tone: 'danger', Icon: IconAlertCircle },
  { match: ['pending', 'pending for verify', 'pending for verified', 'pending for approval', 'pending for accepted', 'waiting', 'awaiting', 'un assigned', 'unassigned', 'not assigned', 'on hold', 'hold', 'late', 'good', 'moderate'], tone: 'warning', Icon: IconHourglass }
];

const resolveIcon = (normalized, color) => {
  for (const entry of ICON_BY_KEYWORD) {
    if (entry.match.some((kw) => normalized === kw || (kw.length > 3 && normalized.includes(kw)))) {
      const { Icon } = entry;
      return <Icon size={13} style={{ color }} />;
    }
  }
  return null;
};

export default function BOSStatusChip({ status, width = 160, showIcon = false, endIcon = null, sx = {}, toneOverride, isCall = false, isInterview = false, isOffer = false, isVerification = false }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  let label = typeof status === 'object' && status !== null ? (status.name ?? status.label ?? status.status) : status;
  label = (label === undefined || label === null || String(label).trim() === '') ? 'Pending to Verify' : String(label);

  let currentToneOverride = toneOverride;

  if (isCall) {
    const config = getCallStatusConfig(label);
    label = config.label;
    if (!currentToneOverride) {
      currentToneOverride = config.tone;
    }
  } else if (isInterview) {
    const config = getInterviewStatusConfig(label);
    label = config.label;
    if (!currentToneOverride) {
      currentToneOverride = config.tone;
    }
  } else if (isOffer) {
    const config = getOfferStatusConfig(label);
    label = config.label;
    if (!currentToneOverride) {
      currentToneOverride = config.tone;
    }
  } else if (isVerification) {
    const config = getVerificationStatusConfig(label);
    label = config.label;
    if (!currentToneOverride) {
      currentToneOverride = config.tone;
    }
  } else {
    if (String(label).trim().toLowerCase() === 'approved') {
      label = 'Verified';
    } else if (String(label).trim().toLowerCase() === 'pending for verify' || String(label).trim().toLowerCase() === 'pending for verified') {
      label = 'Pending to Verify';
    }
  }


  const toTitleCase = (str) => {
    if (!str) return '';
    const upperStr = str.trim().toUpperCase();
    if (upperStr === 'N/A' || upperStr === 'NA' || upperStr === 'RM' || upperStr === 'NPD' || upperStr === 'QMS' || upperStr === 'HR' || upperStr === 'ATS' || upperStr === 'NCR' || upperStr === 'OFI') {
      return upperStr;
    }
    return str
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map((word) => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  label = toTitleCase(label);

  const normalized = label.trim().toLowerCase();
  const tone = currentToneOverride || getStatusTone(label);
  const c = currentToneOverride 
    ? STATUS_TONES[currentToneOverride][isDark ? 'dark' : 'light'] 
    : getStatusToneColors(label, isDark);

  const glyph = showIcon ? resolveIcon(normalized, c.text) : null;

  // Leading micro-indicator: a glyph when requested & available, else a soft dot.
  const indicator = glyph || (
    <Box
      component="span"
      sx={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        bgcolor: c.dot,
        flexShrink: 0,
        boxShadow: `0 0 0 2px ${c.bg}`
      }}
    />
  );

  return (
    <Tooltip title={label} arrow placement="top">
      <span style={{ display: 'inline-flex', minWidth: width, maxWidth: width }}>
        <Chip
          size="small"
          data-tone={tone}
          label={
            <>
              {indicator}
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </Box>
              {endIcon && (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.2, opacity: 0.9 }}>
                  {endIcon}
                </Box>
              )}
            </>
          }
          sx={{
            minWidth: '100%',
            maxWidth: '100%',
            height: 26,
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.01em',
            justifyContent: 'center',
            bgcolor: c.bg,
            color: c.text,
            border: `1px solid ${c.border}`,
            borderRadius: '8px',
            transition: 'background-color 180ms cubic-bezier(0.4,0,0.2,1), box-shadow 180ms cubic-bezier(0.4,0,0.2,1)',
            '&:hover': { boxShadow: `0 2px 8px ${c.border}` },
            '& .MuiChip-label': {
              px: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            },
            ...sx
          }}
        />
      </span>
    </Tooltip>
  );
}

BOSStatusChip.propTypes = {
  status: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  showIcon: PropTypes.bool,
  endIcon: PropTypes.node,
  sx: PropTypes.object,
  isCall: PropTypes.bool,
  isInterview: PropTypes.bool,
  isOffer: PropTypes.bool,
  isVerification: PropTypes.bool
};
