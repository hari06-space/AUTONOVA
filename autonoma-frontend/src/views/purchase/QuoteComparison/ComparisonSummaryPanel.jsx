import React from 'react';
import { Box, Typography, useTheme, alpha, Button, Divider, Stack, Chip } from '@mui/material';
import { IconArrowRight, IconTrophy, IconChartBar } from '@tabler/icons-react';

/**
 * ComparisonSummaryPanel
 * Sticky right-side panel showing best offer, full price breakup, and action buttons.
 * 
 * Props:
 *  - bestSupplier: { id, name, technicalScore, commercialScore }
 *  - rankedSuppliers: [{ id, name }] — ordered L1→Ln
 *  - supplierTotals: { [id]: { subtotal, tax, freight, grandTotal } }
 *  - currency: string
 *  - priceBreakup: { totalItems, additionalCharges, taxAmount, discount }
 *  - grandTotal: number
 *  - onProceed: () => void
 *  - onViewScoreBreakdown: () => void
 *  - isLocked: boolean
 */
export default function ComparisonSummaryPanel({
    bestSupplier,
    rankedSuppliers = [],
    supplierTotals = {},
    currency = 'INR',
    priceBreakup = {},
    grandTotal,
    onProceed,
    onViewScoreBreakdown,
    isLocked
}) {
    const theme = useTheme();

    const fmt = (val) => {
        const n = Number(val);
        if (!n || isNaN(n)) return '₹ 0.00';
        return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const MEDALS = ['🥇', '🥈', '🥉'];

    return (
        <Box sx={{
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: 'hidden',
            position: 'sticky',
            top: 80
        }}>
            {/* Panel header */}
            <Box sx={{
                px: 2, py: 1.5,
                bgcolor: alpha(theme.palette.primary.light, 0.06),
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex', alignItems: 'center', gap: 1
            }}>
                <Box sx={{ width: 28, height: 28, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.warning.main, 0.15), color: theme.palette.warning.main }}>
                    <IconTrophy size={16} />
                </Box>
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>Comparison Summary</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>Best Offer</Typography>
                </Box>
            </Box>

            <Box sx={{ p: 2 }}>
                {/* Best supplier */}
                <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Lowest Total Offer
                </Typography>
                <Typography variant="h6" fontWeight={800} color="success.main" sx={{ mt: 0.3, mb: 0.2, lineHeight: 1.2 }}>
                    {bestSupplier?.name || 'N/A'}
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: theme.palette.text.primary, mb: 0.3 }}>
                    {fmt(grandTotal)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.58rem', fontStyle: 'italic' }}>
                    You can select any supplier below
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                {/* Supplier ranking (L1, L2, L3) */}
                {rankedSuppliers.length > 1 && (
                    <>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Ranking
                        </Typography>
                        <Stack spacing={0.6} mt={0.8} mb={1.5}>
                            {rankedSuppliers.slice(0, 3).map((s, idx) => (
                                <Box key={s.id} display="flex" justifyContent="space-between" alignItems="center">
                                    <Box display="flex" alignItems="center" gap={0.8}>
                                        <Typography sx={{ fontSize: '0.9rem' }}>{MEDALS[idx] || `L${idx + 1}`}</Typography>
                                        <Typography variant="caption" fontWeight={idx === 0 ? 700 : 500} color={idx === 0 ? 'success.main' : 'text.primary'} noWrap sx={{ maxWidth: 100 }}>
                                            {s.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" fontWeight={700} color={idx === 0 ? 'success.main' : 'text.secondary'} sx={{ fontSize: '0.65rem' }}>
                                        {fmt(supplierTotals[s.id]?.grandTotal)}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                        <Divider sx={{ mb: 1.5 }} />
                    </>
                )}

                {/* Price Breakup */}
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Price Breakup
                </Typography>
                <Stack spacing={0.7} mt={0.8}>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Item Total</Typography>
                        <Typography variant="caption" fontWeight={600}>{fmt(priceBreakup.totalItems)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Additional Charges</Typography>
                        <Typography variant="caption" fontWeight={600}>{fmt(priceBreakup.additionalCharges)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Tax Amount</Typography>
                        <Typography variant="caption" fontWeight={600}>{fmt(priceBreakup.taxAmount)}</Typography>
                    </Box>
                    {priceBreakup.discount > 0 && (
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Discount</Typography>
                            <Typography variant="caption" fontWeight={600} color="error.main">-{fmt(priceBreakup.discount)}</Typography>
                        </Box>
                    )}
                </Stack>

                <Box
                    sx={{
                        mt: 1.5, p: 1.5, borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={700}>Grand Total</Typography>
                    <Typography variant="h5" fontWeight={900} color="primary.main">{fmt(grandTotal)}</Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Actions */}
                <Stack spacing={1}>
                    {onViewScoreBreakdown && (
                        <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            startIcon={<IconChartBar size={15} />}
                            onClick={onViewScoreBreakdown}
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                            View Score Breakdown
                        </Button>
                    )}
                    {!isLocked && (
                        <Button
                            variant="contained"
                            fullWidth
                            color="primary"
                            endIcon={<IconArrowRight size={15} />}
                            onClick={onProceed}
                            sx={{
                                borderRadius: 1.5, textTransform: 'none', fontWeight: 700,
                                fontSize: '0.8rem', py: 1,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                            }}
                        >
                            Proceed to Supplier Selection
                        </Button>
                    )}
                    {isLocked && (
                        <Chip label="Comparison Locked" color="success" size="small" sx={{ fontWeight: 600 }} />
                    )}
                </Stack>
            </Box>
        </Box>
    );
}
