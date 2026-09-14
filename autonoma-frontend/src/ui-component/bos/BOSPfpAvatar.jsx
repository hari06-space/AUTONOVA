import React from 'react';
import { Box, Avatar, Tooltip } from '@mui/material';
import { IconUser } from '@tabler/icons-react';
import { getFileViewUrl, getUserImageUrl } from 'utils/upload-helper';

export default function BOSPfpAvatar({
  photoPath,
  name = 'Applicant',
  size = 56,
  previewSize = 150,
  onClick,
  sx = {}
}) {
  const photoUrl = photoPath
    ? (photoPath.includes('/') ? getFileViewUrl(photoPath) : getUserImageUrl(photoPath))
    : null;

  const avatarElement = (
    <Box sx={{ display: 'inline-block', position: 'relative' }}>
      <Avatar
        src={photoUrl || undefined}
        alt={name}
        onClick={onClick}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
          border: '2px solid',
          borderColor: 'primary.light',
          flexShrink: 0,
          cursor: photoUrl ? 'pointer' : 'default',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': photoUrl ? { transform: 'scale(1.1)', zIndex: 10 } : {},
          '& img': { objectFit: 'cover' },
          ...sx
        }}
      >
        <IconUser size={Math.round(size * 0.5)} color="#ffffff" />
      </Avatar>
    </Box>
  );

  if (!photoUrl) {
    return avatarElement;
  }

  return (
    <Tooltip
      placement="right"
      arrow
      enterDelay={150}
      leaveDelay={0}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.2)',
            border: '1px solid',
            borderColor: 'divider',
            p: 0.75,
            borderRadius: '14px',
            maxWidth: 'none'
          }
        }
      }}
      title={
        <Box sx={{ p: 0.5, textAlign: 'center' }}>
          <Box
            component="img"
            src={photoUrl}
            alt={`${name} Enlarged Photo`}
            sx={{
              width: previewSize,
              height: previewSize,
              borderRadius: '10px',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </Box>
      }
    >
      {avatarElement}
    </Tooltip>
  );
}
