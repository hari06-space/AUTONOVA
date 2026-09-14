import React, { useState } from 'react';
import { Box, Typography, Chip, Paper, IconButton, Collapse, alpha, useTheme } from '@mui/material';
import { Timeline } from '@mui/icons-material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

export default function POAuditLog({ auditLog }) {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);
    const eventsCount = (auditLog || []).length;

    return (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" 
                onClick={() => setExpanded(!expanded)} 
                sx={{ cursor: 'pointer' }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="overline" color="primary" fontWeight={700}>
                        AUDIT HISTORY
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {eventsCount} Events
                    </Typography>
                </Box>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                    {expanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                <Box mt={2}>
                    {eventsCount === 0 ? (
                        <Typography color="text.secondary" variant="body2">No audit events recorded yet.</Typography>
                    ) : (
                        auditLog.map((log, i) => (
                            <Box key={i} display="flex" gap={2} mb={1.5} pb={1.5} sx={{ borderBottom: i < eventsCount - 1 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                                <Box sx={{
                                    minWidth: 40, height: 40, borderRadius: '50%',
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Timeline fontSize="small" color="primary" />
                                </Box>
                                <Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Chip label={log.eventType} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            {log.performedBy} — {log.eventDate ? new Date(log.eventDate).toLocaleString() : ''}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" mt={0.5} fontWeight={500}>{log.eventDescription}</Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
}
