import React from 'react';
import { Box, Grid, Typography, useTheme, alpha, IconButton, Tooltip, Chip } from '@mui/material';
import { IconFileInvoice, IconCalendar, IconCurrencyRupee, IconBox, IconUsers, IconClock, IconCopy } from '@tabler/icons-react';

function InfoBlock({ icon: Icon, label, value, color, theme, children }) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : alpha(color || theme.palette.primary.main, 0.03),
                border: `1px solid ${alpha(color || theme.palette.primary.main, 0.15)}`,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : alpha(color || theme.palette.primary.main, 0.08),
                    transform: 'translateY(-3px)',
                    boxShadow: `0 6px 16px ${alpha(color || theme.palette.primary.main, 0.12)}`
                }
            }}
        >
            <Box
                sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(color || theme.palette.primary.main, 0.15),
                    color: color || theme.palette.primary.main
                }}
            >
                <Icon size={20} stroke={2.5} />
            </Box>
            <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block' }}>
                    {label}
                </Typography>
                {children ? children : (
                    <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.3, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {value || '—'}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

/**
 * Props:
 *  - rfqNo, rfqDate, currency, totalItems, quotesReceived, totalSuppliers, validTill
 */
export default function ComparisonRfqSummary({ rfqNo, rfqDate, prNo, prDate, totalItems, quotesReceived, totalSuppliers }) {
    const theme = useTheme();

    const handleCopyRfqNo = () => {
        if (rfqNo) navigator.clipboard.writeText(rfqNo);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)'
                },
                gap: 1.5,
                width: '100%'
            }}
        >
            {/* Combined PR No and Date */}
            <InfoBlock icon={IconFileInvoice} label="PR Details" color={theme.palette.secondary.main} theme={theme}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                        {prNo || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, borderLeft: `1px solid ${theme.palette.divider}`, pl: 1 }}>
                        {formatDate(prDate)}
                    </Typography>
                </Box>
            </InfoBlock>

            {/* Combined RFQ No and Date */}
            <InfoBlock icon={IconFileInvoice} label="RFQ Details" color={theme.palette.primary.main} theme={theme}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                        {rfqNo || '—'}
                    </Typography>
                    {rfqNo && (
                        <Tooltip title="Copy RFQ No">
                            <IconButton size="small" onClick={handleCopyRfqNo} sx={{ p: 0.2, '&:hover': { color: theme.palette.primary.main } }}>
                                <IconCopy size={14} />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, borderLeft: `1px solid ${theme.palette.divider}`, pl: 1 }}>
                        {formatDate(rfqDate)}
                    </Typography>
                </Box>
            </InfoBlock>
            
            <InfoBlock icon={IconBox} label="Total Items" value={totalItems} color={theme.palette.success.main} theme={theme} />

            {/* Quotes Received */}
            <InfoBlock icon={IconUsers} label="Quotes Received" color={theme.palette.warning.main} theme={theme}>
                <Chip
                    label={`${quotesReceived || 0} / ${totalSuppliers || quotesReceived || 0}`}
                    size="small"
                    color={quotesReceived > 0 && quotesReceived === totalSuppliers ? 'success' : 'warning'}
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, mt: 0.2, borderRadius: 1 }}
                />
            </InfoBlock>
        </Box>
    );
}
