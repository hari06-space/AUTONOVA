import React, { useMemo } from 'react';
import {
    Box, Typography, useTheme, alpha, Stack, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip
} from '@mui/material';
import { IconTrophy } from '@tabler/icons-react';

/**
 * ComparisonSupplierRating
 * Displays supplier ranking table and quality metric ratings.
 * 
 * Props:
 *  - rankedSuppliers: [{ id, name, technicalScore, commercialScore }]
 *  - supplierTotals: { [supplierId]: { grandTotal } }
 */

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

/**
 * StarRating — converts a 0–100 score to a 5-star visual.
 * Only called if score is actually available.
 */
function StarRating({ score, maxScore = 100 }) {
    const stars = maxScore > 0 ? Math.min((score / maxScore) * 5, 5) : 0;
    const fullStars = Math.floor(stars);
    const hasHalf = stars - fullStars >= 0.4;
    return (
        <Stack direction="row" spacing={0.2} alignItems="center">
            {[1, 2, 3, 4, 5].map(i => (
                <Box key={i} sx={{
                    color: i <= fullStars ? '#F59E0B' : (i === fullStars + 1 && hasHalf) ? '#F59E0B' : '#D1D5DB',
                    fontSize: '13px', lineHeight: 1, opacity: (i === fullStars + 1 && hasHalf) ? 0.5 : 1
                }}>
                    ★
                </Box>
            ))}
            <Typography variant="caption" fontWeight={700} sx={{ ml: 0.5, fontSize: '0.68rem', color: '#F59E0B' }}>
                {stars.toFixed(1)}/5
            </Typography>
        </Stack>
    );
}

export default function ComparisonSupplierRating({ rankedSuppliers = [], supplierTotals = {} }) {
    const theme = useTheme();

    const formatCurrency = (val) => {
        const num = Number(val);
        if (!num) return '—';
        return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    /**
     * Build scored list.
     * Priority: use technicalScore + commercialScore from backend (sourced from PP_QUOTE_COMPARISON_SCORE).
     * Composite = average of available scores. Never invent values.
     */
    const scoredSuppliers = useMemo(() => {
        return rankedSuppliers.map((s) => {
            const techScore = Number(s.technicalScore || 0);
            const commScore = Number(s.commercialScore || 0);
            // Use dynamic composite score calculated from Purchase Configuration weights
            let composite = supplierTotals[s.id]?.compositeScore;
            // Fallback for legacy manually entered scores
            if (composite == null || isNaN(composite) || composite === 0) {
                if (techScore > 0 && commScore > 0) {
                    composite = (techScore + commScore) / 2;
                } else if (techScore > 0) {
                    composite = techScore;
                } else if (commScore > 0) {
                    composite = commScore;
                } else {
                    composite = null;
                }
            }
            return { ...s, composite, grandTotal: supplierTotals[s.id]?.grandTotal || 0 };
        });
    }, [rankedSuppliers, supplierTotals]);

    const hasScores = scoredSuppliers.some(s => s.composite !== null);
    const maxComposite = Math.max(...scoredSuppliers.map(s => s.composite || 0), 1);

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
                bgcolor: alpha(theme.palette.primary.light, 0.04),
                display: 'flex', alignItems: 'center', gap: 1
            }}>
                <Box sx={{ width: 28, height: 28, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.warning.main, 0.15), color: theme.palette.warning.main }}>
                    <IconTrophy size={16} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>Supplier Ranking & Scores</Typography>
                {!hasScores && (
                    <Chip label="Score data not configured" size="small" color="default" sx={{ ml: 'auto', fontSize: '0.6rem', fontWeight: 600 }} />
                )}
            </Box>

            {/* Ranking Table */}
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.light, 0.02) }}>
                            <TableCell sx={{ borderBottom: `2px solid ${theme.palette.divider}`, width: '25%' }}></TableCell>
                            <TableCell align="center" sx={{ borderBottom: `2px solid ${theme.palette.divider}`, fontWeight: 700, color: 'text.secondary' }}>Price Rank</TableCell>
                            <TableCell align="center" sx={{ borderBottom: `2px solid ${theme.palette.divider}`, fontWeight: 700, color: 'text.secondary' }}>Technical</TableCell>
                            <TableCell align="center" sx={{ borderBottom: `2px solid ${theme.palette.divider}`, fontWeight: 700, color: 'text.secondary' }}>Commercial</TableCell>
                            <TableCell align="center" sx={{ borderBottom: `2px solid ${theme.palette.divider}`, fontWeight: 700, color: 'text.secondary' }}>Overall</TableCell>
                            <TableCell align="right" sx={{ borderBottom: `2px solid ${theme.palette.divider}`, fontWeight: 700, color: 'text.secondary', pr: 2.5 }}>Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {scoredSuppliers.map((supplier, index) => {
                            const isL1 = index === 0;
                            const techScore = Number(supplier.technicalScore || 0);
                            const commScore = Number(supplier.commercialScore || 0);
                            const composite = supplier.composite;

                            return (
                                <TableRow
                                    key={supplier.id}
                                    sx={{
                                        bgcolor: isL1 ? alpha(theme.palette.success.light, 0.04) : 'transparent',
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.05) },
                                        '& td': { borderBottom: `1px solid ${theme.palette.divider}` },
                                        '&:last-child td': { borderBottom: 'none' }
                                    }}
                                >
                                    <TableCell sx={{ pl: 2.5, py: 1.5 }}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="subtitle2" fontWeight={800} color={isL1 ? 'success.dark' : 'text.primary'}>
                                                {supplier.name}
                                            </Typography>
                                            {isL1 && <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800 }}>★ Recommended</Typography>}
                                        </Box>
                                    </TableCell>
                                    
                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                        <Typography variant="body2" fontWeight={700}>#{index + 1}</Typography>
                                    </TableCell>
                                    
                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                        <Tooltip title={techScore > 0 ? <span style={{ whiteSpace: 'pre-line' }}>{supplier.techScoreFormula}</span> : ''} placement="top" arrow>
                                            <Typography variant="body2" fontWeight={600} color={techScore > 0 ? 'text.primary' : 'text.disabled'} sx={{ cursor: techScore > 0 ? 'help' : 'default' }}>
                                                {techScore > 0 ? techScore.toFixed(1) : 'Not Configured'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    
                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                        <Tooltip title={commScore > 0 ? <span style={{ whiteSpace: 'pre-line' }}>{supplier.commScoreFormula}</span> : ''} placement="top" arrow>
                                            <Typography variant="body2" fontWeight={600} color={commScore > 0 ? 'text.primary' : 'text.disabled'} sx={{ cursor: commScore > 0 ? 'help' : 'default' }}>
                                                {commScore > 0 ? commScore.toFixed(1) : 'Not Configured'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    
                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                        {composite !== null ? (
                                            <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{supplier.compositeScoreFormula}</span>} placement="top" arrow>
                                                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} sx={{ cursor: 'help' }}>
                                                    <Typography variant="body2" fontWeight={700}>{composite.toFixed(1)}</Typography>
                                                </Box>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body2" fontWeight={600} color="text.disabled">Not Configured</Typography>
                                        )}
                                    </TableCell>
                                    
                                    <TableCell align="right" sx={{ py: 1.5, pr: 2.5 }}>
                                        <Typography variant="subtitle2" fontWeight={800} color={isL1 ? 'success.main' : 'text.primary'}>
                                            {formatCurrency(supplier.grandTotal)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* No score data state info */}
            {!hasScores && (
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.info.light, 0.05), borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ color: theme.palette.info.main }}>ℹ</span> 
                        Ranking is currently based on total quotation value.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
