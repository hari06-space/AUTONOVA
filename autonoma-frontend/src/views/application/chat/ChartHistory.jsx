import PropTypes from 'prop-types';
import React, { memo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

// project imports
import MessageBubble from './MessageBubble';

const getDateLabel = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'TODAY';

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

    return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  } catch (e) {
    return '';
  }
};

function ChartHistoryComponent({
  data = [],
  currentUserId,
  isGroup,
  onReply,
  onForward,
  onDelete,
  onReact,
  reactions = {},
  selectionMode,
  selectedMessages = [],
  onToggleSelect
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!data || data.length === 0) {
    return (
      <Box sx={{ py: 12, px: 2, textAlign: 'center' }}>
        <Chip
          label="🔒 Messages and calls are end-to-end encrypted"
          size="small"
          sx={{
            bgcolor: isDark ? 'rgba(32, 44, 51, 0.85)' : 'rgba(255, 243, 199, 0.95)',
            color: isDark ? '#ffd279' : '#735c0f',
            fontWeight: 600,
            fontSize: '0.75rem',
            p: 1.5,
            height: 'auto',
            borderRadius: '10px'
          }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
          Send a message to start the conversation!
        </Typography>
      </Box>
    );
  }

  // Group messages by day
  const groupedData = [];
  let lastDateStr = null;

  data.forEach((msg) => {
    const msgDate = (msg.createdAt || msg.timestamp || msg.sentAt || '').split('T')[0] || 'unknown';
    if (msgDate !== lastDateStr) {
      groupedData.push({ type: 'date', dateStr: msg.createdAt || msg.timestamp || msg.sentAt });
      lastDateStr = msgDate;
    }
    groupedData.push({ type: 'message', message: msg });
  });

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, minHeight: '100%' }}>
      {/* WhatsApp Encryption Notice Banner at Top */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Chip
          label="🔒 Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them."
          size="small"
          sx={{
            bgcolor: isDark ? 'rgba(32, 44, 51, 0.85)' : 'rgba(255, 243, 199, 0.95)',
            color: isDark ? '#ffd279' : '#735c0f',
            fontWeight: 500,
            fontSize: '0.72rem',
            px: 1,
            py: 0.8,
            height: 'auto',
            borderRadius: '10px',
            maxWidth: 420,
            whiteSpace: 'normal',
            lineHeight: 1.3
          }}
        />
      </Box>

      {groupedData.map((item, index) => {
        if (item.type === 'date') {
          return (
            <Box key={`date-${index}`} sx={{ textAlign: 'center', my: 1.5 }}>
              <Chip
                label={getDateLabel(item.dateStr)}
                size="small"
                sx={{
                  bgcolor: isDark ? '#182229' : 'rgba(255, 255, 255, 0.95)',
                  color: isDark ? '#8696a0' : '#54656f',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                }}
              />
            </Box>
          );
        }

        const msg = item.message;
        const isSelected = selectedMessages.some((m) => m.id === msg.id);
        const msgReactions = reactions[msg.id] || [];

        return (
          <MessageBubble
            key={msg.id || index}
            message={msg}
            currentUserId={currentUserId}
            isGroup={isGroup}
            onReply={onReply}
            onForward={onForward}
            onDelete={onDelete}
            onReact={onReact}
            reactions={msgReactions}
            selectionMode={selectionMode}
            isSelected={isSelected}
            onToggleSelect={onToggleSelect}
          />
        );
      })}
    </Box>
  );
}

ChartHistoryComponent.propTypes = {
  data: PropTypes.array,
  currentUserId: PropTypes.string.isRequired,
  isGroup: PropTypes.bool,
  onReply: PropTypes.func,
  onForward: PropTypes.func,
  onDelete: PropTypes.func,
  onReact: PropTypes.func,
  reactions: PropTypes.object,
  selectionMode: PropTypes.bool,
  selectedMessages: PropTypes.array,
  onToggleSelect: PropTypes.func
};

const ChartHistory = memo(ChartHistoryComponent);
export default ChartHistory;
