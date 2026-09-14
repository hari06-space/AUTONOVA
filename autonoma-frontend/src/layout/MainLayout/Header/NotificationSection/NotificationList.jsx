import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';

// project imports
import { withAlpha } from 'utils/colorUtils';

// assets
import { 
  IconBell, 
  IconX, 
  IconClipboardList, 
  IconCheck, 
  IconRefresh, 
  IconUser, 
  IconMessageCircle 
} from '@tabler/icons-react';

const getNotifStyles = (title = '') => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('task assigned')) {
    return { color: '#1976d2', icon: <IconClipboardList size={20} />, bg: '#e3f2fd' };
  } else if (lowerTitle.includes('task completed')) {
    return { color: '#2e7d32', icon: <IconCheck size={20} />, bg: '#e8f5e9' };
  } else if (lowerTitle.includes('rework')) {
    return { color: '#ed6c02', icon: <IconRefresh size={20} />, bg: '#fff3e0' };
  } else if (lowerTitle.includes('approval')) {
    return { color: '#ffb300', icon: <IconUser size={20} />, bg: '#fff8e1' };
  } else if (lowerTitle.includes('comment')) {
    return { color: '#9c27b0', icon: <IconMessageCircle size={20} />, bg: '#f3e5f5' };
  }
  return { color: '#1976d2', icon: <IconBell size={20} />, bg: '#e3f2fd' };
};

function ListItemWrapper({ children, isRead, onClick }) {
  const theme = useTheme();

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        position: 'relative',
        bgcolor: isRead ? 'transparent' : withAlpha(theme.palette.primary.light, 0.05),
        '&:hover': {
          bgcolor: isRead ? theme.palette.grey[50] : withAlpha(theme.palette.primary.light, 0.1)
        }
      }}
    >
      {!isRead && (
        <Box 
          sx={{ 
            position: 'absolute', 
            left: 0, 
            top: 0, 
            bottom: 0, 
            width: 4, 
            bgcolor: 'primary.main',
            borderTopRightRadius: 4,
            borderBottomRightRadius: 4
          }} 
        />
      )}
      {children}
    </Box>
  );
}

ListItemWrapper.propTypes = {
  children: PropTypes.node,
  isRead: PropTypes.bool,
  onClick: PropTypes.func
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    if (Array.isArray(dateStr)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateStr;
      const date = new Date(year, month - 1, day, hour, minute, second);
      if (!isNaN(date.getTime())) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
      }
      return '';
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return '';
  }
};

export default function NotificationList({ notifications = [], onNotifClick, onNotifDismiss }) {
  const theme = useTheme();
  const [expandedIds, setExpandedIds] = useState({});
  const containerSX = { gap: 1, pl: '44px', pb: 1 };

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (!notifications || notifications.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">No notifications</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', minWidth: 320, maxWidth: 400, py: 0 }}>
      {notifications.map((notif, index) => {
        const styles = getNotifStyles(notif.title);
        return (
          <ListItemWrapper key={notif.id || index} isRead={notif.isRead} onClick={() => onNotifClick && onNotifClick(notif)}>
            <ListItem
              alignItems="flex-start"
              disablePadding
            >
              <ListItemAvatar sx={{ minWidth: 56, mt: 0.5 }}>
                <Avatar 
                  src={notif.imgName}
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: notif.imgName ? 'transparent' : styles.bg,
                    color: styles.color 
                  }}
                >
                  {!notif.imgName && styles.icon}
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                sx={{ m: 0 }}
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      {notif.title}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {!notif.isRead && (
                         <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                      )}
                      <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {formatTime(notif.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>
                }
                secondary={
                  <Typography 
                    variant="body2" 
                    onClick={(e) => toggleExpand(notif.id || index, e)}
                    sx={{ 
                      color: 'text.secondary', 
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      mt: 0.5,
                      whiteSpace: 'pre-line',
                      cursor: 'pointer',
                      ...(!expandedIds[notif.id || index] ? {
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      } : {})
                    }}
                  >
                    {notif.message}
                  </Typography>
                }
              />
            </ListItem>
          </ListItemWrapper>
        );
      })}
    </List>
  );
}

NotificationList.propTypes = {
  notifications: PropTypes.array,
  onNotifClick: PropTypes.func,
  onNotifDismiss: PropTypes.func
};
