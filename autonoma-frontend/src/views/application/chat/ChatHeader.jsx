import PropTypes from 'prop-types';
import React, { memo, useState } from 'react';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CallTwoToneIcon from '@mui/icons-material/CallTwoTone';
import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupsTwoToneIcon from '@mui/icons-material/GroupsTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import CheckBoxTwoToneIcon from '@mui/icons-material/CheckBoxTwoTone';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import AvatarStatus from './AvatarStatus';
import { getUserImageUrl } from 'utils/upload-helper';

function ChatHeaderComponent({
  channel,
  currentUserId,
  onBack,
  onOpenDetails,
  onStartCall,
  onToggleSelectionMode,
  onDeleteChat,
  onSearchClick,
  isMobile
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState(null);

  if (!channel) return null;

  const isDirect = channel.channelType === 'DIRECT';
  const isGroup = !isDirect;
  let displayMember = isDirect
    ? channel.members?.find((m) => String(m.userId).toLowerCase() !== String(currentUserId).toLowerCase()) || channel.members?.[0]
    : null;
  const displayName = isDirect
    ? displayMember?.employeeName || channel.channelName || 'Contact'
    : channel.channelName || 'Group Chat';
  const avatarSrc = isDirect
    ? displayMember?.imgName ? getUserImageUrl(displayMember.imgName) : ''
    : channel.imgName ? getUserImageUrl(channel.imgName) : '';
  const isOnline = isDirect ? displayMember?.isOnline : false;

  const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1.5, sm: 2 },
        py: 1,
        bgcolor: theme.palette.background.paper,
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: 2,
        flexShrink: 0
      }}
    >
      {/* Left: Back (Mobile) + Avatar + Name */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0, cursor: 'pointer' }} onClick={onOpenDetails}>
        {isMobile && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onBack && onBack();
            }}
            sx={{ p: 0.75, mr: -0.5, color: theme.palette.text.secondary }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        <Badge
          overlap="circular"
          badgeContent={!isGroup ? <AvatarStatus status={isOnline ? 'available' : 'offline'} /> : null}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Avatar
            alt={displayName}
            src={avatarSrc}
            sx={{
              width: 42,
              height: 42,
              bgcolor: isGroup ? theme.palette.secondary.main : theme.palette.primary.main,
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
            }}
          >
            {isGroup ? <GroupsTwoToneIcon sx={{ fontSize: '1.25rem' }} /> : displayName?.[0] || 'U'}
          </Avatar>
        </Badge>

        <Box sx={{ minWidth: 0, pr: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: '0.96rem',
              color: theme.palette.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.25
            }}
          >
            {displayName}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              fontSize: '0.75rem',
              color: isOnline ? theme.palette.success.main : theme.palette.text.secondary,
              fontWeight: isOnline ? 600 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block'
            }}
          >
            {isGroup
              ? `${channel.members?.length || 0} members`
              : isOnline
              ? 'online'
              : displayMember?.designationName || 'offline'}
          </Typography>
        </Box>
      </Stack>

      {/* Right: Actions (Voice Call, Video Call, Search, 3-dots) */}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Tooltip title="Voice Call">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onStartCall && onStartCall(false);
            }}
            sx={{
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              p: 1,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) }
            }}
          >
            <CallTwoToneIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Video Call">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onStartCall && onStartCall(true);
            }}
            sx={{
              color: theme.palette.secondary.main,
              bgcolor: alpha(theme.palette.secondary.main, 0.08),
              p: 1,
              '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.16) }
            }}
          >
            <VideocamTwoToneIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Search in chat">
          <IconButton
            size="small"
            onClick={onSearchClick}
            sx={{ color: theme.palette.text.secondary, p: 1 }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <IconButton
          size="small"
          onClick={handleOpenMenu}
          sx={{ color: theme.palette.text.secondary, p: 1 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* 3-dots Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '10px',
              minWidth: 160,
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)'
            }
          }
        }}
      >
        <MenuItem
          onClick={() => {
            onOpenDetails && onOpenDetails();
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1, fontSize: '0.85rem' }}
        >
          <InfoOutlinedIcon fontSize="small" /> {isGroup ? 'Group info' : 'Contact info'}
        </MenuItem>

        <MenuItem
          onClick={() => {
            onToggleSelectionMode && onToggleSelectionMode();
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1, fontSize: '0.85rem' }}
        >
          <CheckBoxTwoToneIcon fontSize="small" /> Select messages
        </MenuItem>

        <MenuItem
          onClick={() => {
            onDeleteChat && onDeleteChat();
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1, fontSize: '0.85rem', color: 'error.main' }}
        >
          <DeleteTwoToneIcon fontSize="small" /> Delete chat
        </MenuItem>
      </Menu>
    </Box>
  );
}

ChatHeaderComponent.propTypes = {
  channel: PropTypes.object,
  currentUserId: PropTypes.string,
  onBack: PropTypes.func,
  onOpenDetails: PropTypes.func,
  onStartCall: PropTypes.func,
  onToggleSelectionMode: PropTypes.func,
  onDeleteChat: PropTypes.func,
  onSearchClick: PropTypes.func,
  isMobile: PropTypes.bool
};

const ChatHeader = memo(ChatHeaderComponent);
export default ChatHeader;
