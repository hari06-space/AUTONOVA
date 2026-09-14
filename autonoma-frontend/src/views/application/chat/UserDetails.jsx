import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// Icons
import CallTwoToneIcon from '@mui/icons-material/CallTwoTone';
import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';
import GroupAddTwoToneIcon from '@mui/icons-material/GroupAddTwoTone';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import StarBorderTwoToneIcon from '@mui/icons-material/StarBorderTwoTone';
import NotificationsNoneTwoToneIcon from '@mui/icons-material/NotificationsNoneTwoTone';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import KeyboardArrowRightTwoToneIcon from '@mui/icons-material/KeyboardArrowRightTwoTone';

import { getUserImageUrl } from 'utils/upload-helper';

export default function UserDetails({ channel, currentUserId, startCall, messages }) {
  const theme = useTheme();

  if (!channel) return null;

  const isDirect = channel.channelType === 'DIRECT';
  const isGroup = !isDirect;
  
  // For direct chats, we show the other person's details
  let displayMember = isDirect
    ? channel.members?.find((m) => String(m.userId).toLowerCase() !== String(currentUserId).toLowerCase()) || channel.members?.[0]
    : null;
  const displayName = isDirect
    ? displayMember?.employeeName || channel.channelName || 'Contact'
    : channel.channelName || 'Group Chat';
  const avatarSrc = isDirect
    ? displayMember?.imgName ? getUserImageUrl(displayMember.imgName) : ''
    : channel.imgName ? getUserImageUrl(channel.imgName) : '';

  // Extract media from messages
  const mediaMessages = messages?.filter(m => 
    m.messageType === 'IMAGE' || m.messageType === 'VIDEO' || m.messageType === 'DOCUMENT'
  ) || [];

  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', height: '100%', overflowY: 'auto' }}>
      {/* Header section */}
      <Box sx={{ textAlign: 'center', p: 3, pt: 4, bgcolor: 'grey.50' }}>
        <Avatar
          alt={displayName}
          src={avatarSrc}
          sx={{
            m: '0 auto',
            width: 140,
            height: 140,
            mb: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        />
        <Typography variant="h3" sx={{ fontWeight: 500, mb: 0.5 }}>{displayName}</Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
          {isGroup ? `Group · ${channel.members?.length || 0} members` : (displayMember?.designationName || displayMember?.departmentName || 'Contact')}
        </Typography>

        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton onClick={() => startCall && startCall(false)} sx={{ bgcolor: 'background.paper', boxShadow: 1, mb: 1, width: 44, height: 44 }}>
                <CallTwoToneIcon color="primary" />
              </IconButton>
              <Typography variant="caption">Voice</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton onClick={() => startCall && startCall(true)} sx={{ bgcolor: 'background.paper', boxShadow: 1, mb: 1, width: 44, height: 44 }}>
                <VideocamTwoToneIcon color="primary" />
              </IconButton>
              <Typography variant="caption">Video</Typography>
            </Box>
          </Grid>
          {isGroup && (
            <Grid item xs={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton sx={{ bgcolor: 'background.paper', boxShadow: 1, mb: 1, width: 44, height: 44 }}>
                  <GroupAddTwoToneIcon color="primary" />
                </IconButton>
                <Typography variant="caption">Add</Typography>
              </Box>
            </Grid>
          )}
          <Grid item xs={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton sx={{ bgcolor: 'background.paper', boxShadow: 1, mb: 1, width: 44, height: 44 }}>
                <SearchTwoToneIcon color="primary" />
              </IconButton>
              <Typography variant="caption">Search</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      <List sx={{ p: 0 }}>
        {isGroup && (
          <>
            <ListItem button sx={{ py: 2 }}>
              <ListItemText primary="Add group description" primaryTypographyProps={{ color: 'primary', variant: 'subtitle1' }} />
            </ListItem>
            <Divider />
          </>
        )}

        <ListItem button sx={{ py: 2 }} secondaryAction={<KeyboardArrowRightTwoToneIcon />}>
          <ListItemText 
            primary="Media, links and docs" 
            primaryTypographyProps={{ variant: 'subtitle1' }}
            secondary={mediaMessages.length > 0 ? mediaMessages.length : 'None'}
          />
        </ListItem>
        {mediaMessages.length > 0 && (
          <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1, overflowX: 'auto' }}>
            {mediaMessages.slice(0, 5).map((m, i) => (
              m.messageType === 'IMAGE' ? (
                <Box key={i} component="img" src={m.attachmentUrl} sx={{ width: 64, height: 64, borderRadius: 1, objectFit: 'cover' }} />
              ) : (
                <Box key={i} sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="textSecondary">{m.messageType}</Typography>
                </Box>
              )
            ))}
          </Box>
        )}
        <Divider />

        <ListItem button sx={{ py: 1.5 }}>
          <ListItemIcon><StarBorderTwoToneIcon /></ListItemIcon>
          <ListItemText primary="Starred messages" primaryTypographyProps={{ variant: 'subtitle1' }} />
        </ListItem>
        <ListItem button sx={{ py: 1.5 }}>
          <ListItemIcon><NotificationsNoneTwoToneIcon /></ListItemIcon>
          <ListItemText primary="Notification settings" primaryTypographyProps={{ variant: 'subtitle1' }} />
        </ListItem>
        <ListItem button sx={{ py: 1.5 }}>
          <ListItemIcon><LockOutlinedIcon /></ListItemIcon>
          <ListItemText 
            primary="Encryption" 
            secondary="Messages are end-to-end encrypted. Click to learn more."
            primaryTypographyProps={{ variant: 'subtitle1' }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </ListItem>
        <Divider />

        {isGroup && channel.members && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>{channel.members.length} members</Typography>
            <List disablePadding>
              {channel.members.map((member) => (
                <ListItem key={member.userId} disableGutters sx={{ py: 1 }}>
                  <ListItemIcon>
                    <Avatar src={member.imgName ? getUserImageUrl(member.imgName) : ''} alt={member.employeeName} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={member.employeeName} 
                    secondary={member.userId === currentUserId ? 'You' : member.designationName || 'Member'} 
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </List>
    </Box>
  );
}

UserDetails.propTypes = { 
  channel: PropTypes.object,
  currentUserId: PropTypes.string,
  startCall: PropTypes.func,
  messages: PropTypes.array
};
