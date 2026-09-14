import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack, Box } from '@mui/material';
import DoneAllTwoToneIcon from '@mui/icons-material/DoneAllTwoTone';
import DoneTwoToneIcon from '@mui/icons-material/DoneTwoTone';

const MessageInfoDialog = ({ open, onClose, message }) => {
    if (!message) return null;

    const isSeen = message.isSeen;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Message Info</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                        {message.messageContent || (message.messageType === 'FILE' ? 'Attachment' : '')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                        {new Date(message.createdAt).toLocaleString()}
                    </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', bgcolor: isSeen ? 'primary.light' : 'grey.200' }}>
                        {isSeen ? (
                            <DoneAllTwoToneIcon color="primary" />
                        ) : (
                            <DoneTwoToneIcon color="action" />
                        )}
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {isSeen ? 'Read' : 'Not Read'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isSeen ? 'Seen by recipient' : 'Delivered to recipient'}
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autoFocus>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default MessageInfoDialog;
