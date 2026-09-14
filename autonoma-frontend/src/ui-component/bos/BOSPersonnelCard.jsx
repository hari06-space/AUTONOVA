import React from 'react';
import PropTypes from 'prop-types';
import { Stack, Typography, Avatar, Box, Chip, Tooltip } from '@mui/material';
import { IconUser, IconCrown, IconMicrophone, IconShield, IconUsers } from '@tabler/icons-react';

import { getUserImageUrl } from 'utils/upload-helper';
import { getPhotoUrl } from './BOSUtils';

const resolvePhotoUrl = (photo) => {
  if (!photo) return '';
  if (photo.includes('/') || photo.includes('\\')) {
    return getPhotoUrl(photo);
  }
  return getUserImageUrl(photo);
};

/**
 * Role icon mapping for featured card titles
 */
const ROLE_ICONS = {
  'chaired by': IconCrown,
  'host by': IconMicrophone,
  'host': IconMicrophone,
  'auditor': IconShield,
  'auditee': IconUser,
  'nc approved by': IconShield,
  'approver': IconShield,
  'participant': IconUsers
};

const getRoleIcon = (title) => {
  if (!title) return IconUser;
  const key = title.toLowerCase().replace(/#\d+/g, '').trim();
  return ROLE_ICONS[key] || IconUser;
};

// ═══════════════════════════════════════════
//  COMPACT VARIANT — for Participants list
// ═══════════════════════════════════════════
const CompactCard = ({ title, name, empCode, oldEmpCode, department, designation, photo, color }) => {
  const displayCode = oldEmpCode || empCode || '-';
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{
        p: 1.75,
        borderRadius: '12px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        flex: 1,
        minWidth: 0,
        '&:hover': {
          borderColor: color,
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
          transform: 'translateY(-1px)'
        }
      }}
    >
      <Tooltip
        placement="top"
        title={
          photo ? (
            <img
              src={resolvePhotoUrl(photo)}
              alt="Preview"
              style={{
                maxWidth: '180px',
                maxHeight: '180px',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '8px'
              }}
            />
          ) : (
            <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
          )
        }
      >
        <Avatar
          src={resolvePhotoUrl(photo)}
          variant="rounded"
          sx={{
            width: 58,
            height: 58,
            bgcolor: 'grey.100',
            border: '2.5px solid',
            borderColor: photo ? color : 'grey.300',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'text.secondary',
            flexShrink: 0,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.15)',
              zIndex: 10
            }
          }}
        >
          {name ? name.charAt(0).toUpperCase() : <IconUser size={28} color="#bbb" />}
        </Avatar>
      </Tooltip>
      <Stack spacing={0.3} sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {title && (
            <Chip
              label={title.toUpperCase()}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                bgcolor: color,
                color: 'white',
                borderRadius: '4px',
                '& .MuiChip-label': { px: 0.8 }
              }}
            />
          )}
        </Stack>
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.2, color: 'text.primary' }}>
          {name || '-'}
        </Typography>
        {displayCode && displayCode !== '-' && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            Code: {displayCode}
          </Typography>
        )}
        {((department && department !== '-') || (designation && designation !== '-')) && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.72rem', opacity: 0.85 }}>
            {[department !== '-' ? department : null, designation !== '-' ? designation : null].filter(Boolean).join(' • ')}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

// ═══════════════════════════════════════════
//  FEATURED VARIANT — for Host, Chair, Auditor, etc.
// ═══════════════════════════════════════════
const FeaturedCard = ({ title, name, empCode, department, photo, color, bgcolor, level }) => {
  const RoleIcon = getRoleIcon(title);

  return (
    <Stack
      spacing={2}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        bgcolor: bgcolor,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 4px 16px rgba(0,0,0,0.06)`
        },
        // Decorative gradient accent
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          borderRadius: '14px 14px 0 0'
        }
      }}
    >
      {/* Title Bar */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{
          width: 28,
          height: 28,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: color,
          color: 'white',
          flexShrink: 0
        }}>
          <RoleIcon size={16} />
        </Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            color: color,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            fontSize: '0.72rem'
          }}
        >
          {title}
        </Typography>
      </Stack>

      {/* Content */}
      <Stack direction="row" spacing={2.5} alignItems="center">
        <Tooltip
          placement="right"
          title={
            photo ? (
              <img
                src={resolvePhotoUrl(photo)}
                alt="Preview"
                style={{
                  maxWidth: '150px',
                  maxHeight: '150px',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
            )
          }
        >
          <Avatar
            src={resolvePhotoUrl(photo)}
            variant="rounded"
            sx={{
              width: 72,
              height: 88,
              bgcolor: 'background.paper',
              border: '2px solid',
              borderColor: photo ? color : 'grey.200',
              boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
              borderRadius: '10px',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'text.disabled',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.15)',
                zIndex: 10
              }
            }}
          >
            {name ? name.charAt(0).toUpperCase() : <IconUser size={32} color="#ccc" />}
          </Avatar>
        </Tooltip>
        <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
            {name || '-'}
          </Typography>
          {empCode && empCode !== '-' && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Code:
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>
                {empCode}
              </Typography>
            </Stack>
          )}
          {department && department !== '-' && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Dept:
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>
                {department}
              </Typography>
            </Stack>
          )}
          {level && level !== '-' && level !== 'null' && level !== 'undefined' && String(level).trim() !== '' && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Level:
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>
                {level}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

// ═══════════════════════════════════════════
//  MAIN EXPORT — BOSPersonnelCard
// ═══════════════════════════════════════════

/**
 * BOSPersonnelCard — Standardized personnel display card for the entire BOS system.
 *
 * Two variants:
 * - `compact`  : Slim inline card for participant lists (default for titles containing "Participant")
 * - `featured` : Prominent card for Host, Chair, Auditor, Auditee, NDA, Approver roles
 *
 * Photo is resolved from the `employeePhotoUpload` field via the backend file API.
 *
 * Usage:
 *   <BOSPersonnelCard title="Host By" name="John" empCode="EMP-001" department="QA" photo={emp.employeePhotoUpload} />
 *   <BOSPersonnelCard variant="compact" title="Participant #1" name="Jane" empCode="EMP-002" photo={emp.employeePhotoUpload} />
 */
const BOSPersonnelCard = ({
  title,
  name,
  empCode,
  department,
  photo,
  color = 'primary.main',
  bgcolor = 'grey.50',
  variant,
  level
}) => {
  // Auto-detect variant from title if not explicitly set
  const resolvedVariant = variant || (
    title?.toLowerCase().includes('participant') ? 'compact' : 'featured'
  );

  if (resolvedVariant === 'compact') {
    return <CompactCard title={title} name={name} empCode={empCode} department={department} photo={photo} color={color} />;
  }

  return <FeaturedCard title={title} name={name} empCode={empCode} department={department} photo={photo} color={color} bgcolor={bgcolor} level={level} />;
};

BOSPersonnelCard.propTypes = {
  /** Role label (e.g., "Host By", "Participant #1", "Auditor") */
  title: PropTypes.string,
  /** Employee full name */
  name: PropTypes.string,
  /** Employee code (e.g., "EMP-001") */
  empCode: PropTypes.string,
  /** Department name */
  department: PropTypes.string,
  /**
   * Employee photo path — should be `employee.employeePhotoUpload`.
   * Accepts relative server paths (e.g., "QMS/uuid.jpg") or full URLs.
   */
  photo: PropTypes.string,
  /** Theme color for accents (default: 'primary.main') */
  color: PropTypes.string,
  /** Background color for featured variant (default: 'grey.50') */
  bgcolor: PropTypes.string,
  /** Force a variant: 'compact' or 'featured'. Auto-detected from title if omitted. */
  variant: PropTypes.oneOf(['compact', 'featured'])
};

export default BOSPersonnelCard;
