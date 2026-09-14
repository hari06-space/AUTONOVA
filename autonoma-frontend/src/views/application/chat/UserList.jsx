import PropTypes from 'prop-types';
import React, { memo } from 'react';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';

// icons
import PhoneMissedTwoToneIcon from '@mui/icons-material/PhoneMissedTwoTone';
import GroupsTwoToneIcon from '@mui/icons-material/GroupsTwoTone';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import MicIcon from '@mui/icons-material/Mic';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

// project imports
import AvatarStatus from './AvatarStatus';
import { getUserImageUrl } from 'utils/upload-helper';

const getInitials = (name = '') => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const formatMessageTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const msgDate = new Date(timeStr);
    const now = new Date();
    const isToday = msgDate.toDateString() === now.toDateString();
    if (isToday) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
};

function UserListComponent({ channels = [], setChannel, activeChannel, currentUserId }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!channels || channels.length === 0) {
    return (
      <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          No conversations found
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
          Tap the new chat button to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding sx={{ width: '100%' }}>
      {channels.map((channel) => {
        const isDirect = channel.channelType === 'DIRECT';
        const isGroup = !isDirect;
        let displayMember = isDirect
          ? channel.members?.find((m) => String(m.userId).toLowerCase() !== String(currentUserId).toLowerCase()) || channel.members?.[0]
          : null;

        const displayName = isDirect
          ? displayMember?.employeeName || channel.channelName || 'Unknown'
          : channel.channelName || 'Group Chat';
        const avatarSrc = isDirect
          ? displayMember?.imgName ? getUserImageUrl(displayMember.imgName) : ''
          : channel.imgName ? getUserImageUrl(channel.imgName) : '';
        const onlineStatus = isDirect && displayMember?.isOnline ? 'available' : 'offline';
        const isSelected = activeChannel?.id === channel.id;
        const hasUnread = Boolean(channel.unreadCount && channel.unreadCount > 0);
        const rawLastMsg = channel.lastMessage || '';
        let lastMsg = rawLastMsg;
        if (lastMsg.startsWith('>>>REPLY:') && lastMsg.includes('<<<\n')) {
          const endIdx = lastMsg.indexOf('<<<\n');
          lastMsg = lastMsg.slice(endIdx + 4);
        }

        const isAudio = lastMsg.startsWith('[AUDIO]') || channel.lastMessageType === 'AUDIO';
        const isImage = channel.lastMessageType === 'IMAGE';
        const isDoc = channel.lastMessageType === 'DOCUMENT';
        const isMissed = lastMsg.toLowerCase().includes('missed voice call') || lastMsg.toLowerCase().includes('missed video call');

        return (
          <ListItemButton
            key={channel.id}
            selected={isSelected}
            onClick={() => setChannel(channel)}
            sx={{
              py: 1.25,
              px: { xs: 1.5, sm: 2 },
              borderBottom: '1px solid',
              borderColor: 'divider',
              transition: 'background-color 0.15s ease',
              bgcolor: isSelected
                ? alpha(theme.palette.primary.main, 0.1)
                : 'transparent',
              '&:hover': {
                bgcolor: isSelected
                  ? alpha(theme.palette.primary.main, 0.14)
                  : alpha(theme.palette.primary.main, 0.04)
              },
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            <ListItemAvatar sx={{ minWidth: 54 }}>
              <Badge
                overlap="circular"
                badgeContent={!isGroup ? <AvatarStatus status={onlineStatus} /> : null}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Avatar
                  alt={displayName}
                  src={avatarSrc}
                  sx={{
                    width: 48,
                    height: 48,
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    bgcolor: isGroup ? theme.palette.secondary.main : theme.palette.primary.main,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {isGroup ? <GroupsTwoToneIcon sx={{ fontSize: '1.4rem' }} /> : getInitials(displayName)}
                </Avatar>
              </Badge>
            </ListItemAvatar>

            <ListItemText
              sx={{ my: 0, minWidth: 0 }}
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: hasUnread || isSelected ? 700 : 600,
                      fontSize: '0.92rem',
                      color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      pr: 1
                    }}
                  >
                    {displayName}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: hasUnread ? 700 : 400,
                      color: hasUnread ? theme.palette.primary.main : theme.palette.text.secondary,
                      flexShrink: 0
                    }}
                  >
                    {formatMessageTime(channel.lastMessageTime)}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0, pr: 1 }}>
                    {isMissed ? (
                      <PhoneMissedTwoToneIcon sx={{ fontSize: '0.95rem', color: 'error.main', flexShrink: 0 }} />
                    ) : isAudio ? (
                      <MicIcon sx={{ fontSize: '0.95rem', color: theme.palette.text.secondary, flexShrink: 0 }} />
                    ) : isImage ? (
                      <PhotoCameraIcon sx={{ fontSize: '0.95rem', color: theme.palette.text.secondary, flexShrink: 0 }} />
                    ) : isDoc ? (
                      <InsertDriveFileIcon sx={{ fontSize: '0.95rem', color: theme.palette.text.secondary, flexShrink: 0 }} />
                    ) : (
                      <DoneAllIcon sx={{ fontSize: '0.95rem', color: theme.palette.text.secondary, flexShrink: 0 }} />
                    )}

                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.82rem',
                        color: isMissed
                          ? 'error.main'
                          : hasUnread
                          ? theme.palette.text.primary
                          : theme.palette.text.secondary,
                        fontWeight: hasUnread ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isAudio ? 'Voice message' : isImage ? 'Photo' : isDoc ? 'Document' : lastMsg || 'No messages yet'}
                    </Typography>
                  </Stack>

                  {hasUnread && (
                    <Box
                      sx={{
                        height: 20,
                        minWidth: 20,
                        px: 0.6,
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText || '#ffffff',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {channel.unreadCount}
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

UserListComponent.propTypes = {
  channels: PropTypes.array,
  setChannel: PropTypes.func.isRequired,
  activeChannel: PropTypes.object,
  currentUserId: PropTypes.string.isRequired
};

const UserList = memo(UserListComponent);
export default UserList;
