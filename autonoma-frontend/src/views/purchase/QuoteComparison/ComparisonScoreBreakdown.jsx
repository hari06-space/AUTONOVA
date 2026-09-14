import React from 'react';
import {
    Box, Typography, useTheme, alpha, Stack, Divider, LinearProgress, Button
} from '@mui/material';
import { IconX } from '@tabler/icons-react';

/**
 * ComparisonScoreBreakdown
 * Shows score breakdown by criterion for each supplier.
 * Uses ONLY data available from backend (technicalScore, commercialScore from matrixItems).
 * 
 * Props:
 *  - suppliers: [{ id, name, technicalScore, commercialScore }]
 *  - supplierTotals: { [supplierId]: { grandTotal } }
 *  - onClose: () => void
 */

// Score criteria sourced purely from backend fields
const CRITERIA = [
    { label: 'Technical Score', key: 'technicalScore', weight: 50, description: 'From PP_QUOTE_COMPARISON_SCORE (TECHNICAL)' },
    { label: 'Commercial Score', key: 'commercialScore', weight: 50, description: 'From PP_QUOTE_COMPARISON_SCORE (COMMERCIAL)' },
];

const SUPPLIER_COLORS = ['#1565C0', '#1B5E20', '#4A148C', '#E65100', '#880E4F'];

export default function ComparisonScoreBreakdown({ suppliers = [], supplierTotals = {}, onClose }) {
    const theme = useTheme();

    const formatCurrency = (val) => {
        const num = Number(val);
        if (!num) return '—';
        return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const hasAnyScore = suppliers.some(s => s.technicalScore || s.commercialScore);

    return (
        <Box sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <Box sx={{
                px: 2.5, py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.primary.light, 0.05),
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <Typography variant="subtitle1" fontWeight={700}>Score Breakdown</Typography>
                {onClose && (
                    <Button size="small" onClick={onClose} sx={{ minWidth: 0, p: 0.5 }}>
                        <IconX size={16} />
                    </Button>
                )}
            </Box>

            <Box sx={{ p: 2.5 }}>
                {!hasAnyScore ? (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No score data available. Configure supplier evaluation scores in PP_QUOTE_COMPARISON_SCORE to enable this view.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Supplier color legend */}
                        <Stack direction="row" spacing={2} flexWrap="wrap" mb={2}>
                            {suppliers.map((s, idx) => (
                                <Stack key={s.id} direction="row" spacing={0.5} alignItems="center">
                                    <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: SUPPLIER_COLORS[idx % SUPPLIER_COLORS.length] }} />
                                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>{s.name}</Typography>
                                </Stack>
                            ))}
                        </Stack>

                        {/* Criteria rows */}
                        <Stack spacing={2.5}>
                            {CRITERIA.map(criterion => (
                                <Box key={criterion.key}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{criterion.label}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                                Weight: {criterion.weight}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Stack spacing={0.8}>
                                        {suppliers.map((s, idx) => {
                                            const score = Number(s[criterion.key] || 0);
                                            const pct = Math.min(score, 100);
                                            const color = SUPPLIER_COLORS[idx % SUPPLIER_COLORS.length];
                                            return (
                                                <Box key={s.id}>
                                                    <Box display="flex" justifyContent="space-between" mb={0.3}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{s.name}</Typography>
                                                        <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.68rem', color }}>
                                                            {score > 0 ? score.toFixed(2) : 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={pct}
                                                        sx={{
                                                            height: 6,
                                                            borderRadius: 3,
                                                            bgcolor: alpha(color, 0.12),
                                                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 }
                                                        }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {/* Grand Total comparison */}
                        <Box>
                            <Typography variant="body2" fontWeight={700} mb={1}>Grand Total Comparison</Typography>
                            <Stack spacing={0.8}>
                                {suppliers.map((s, idx) => {
                                    const gt = supplierTotals[s.id]?.grandTotal || 0;
                                    const maxGt = Math.max(...suppliers.map(x => supplierTotals[x.id]?.grandTotal || 0));
                                    const pct = maxGt > 0 ? (gt / maxGt) * 100 : 0;
                                    const color = SUPPLIER_COLORS[idx % SUPPLIER_COLORS.length];
                                    return (
                                        <Box key={s.id}>
                                            <Box display="flex" justifyContent="space-between" mb={0.3}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{s.name}</Typography>
                                                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.68rem', color }}>
                                                    {formatCurrency(gt)}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={pct}
                                                sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    bgcolor: alpha(color, 0.12),
                                                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 }
                                                }}
                                            />
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}
