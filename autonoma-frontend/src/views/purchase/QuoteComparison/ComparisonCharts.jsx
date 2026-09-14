import React, { useState, useMemo } from 'react';
import { Box, Typography, useTheme, alpha, TextField, MenuItem, Stack, Grid, Divider } from '@mui/material';

/**
 * ComparisonCharts
 * Pure CSS/MUI bar charts — no external charting library.
 * 
 * Chart options:
 *  1. Total Price Comparison
 *  2. Subtotal Comparison
 *  3. Tax Comparison
 *  4. Freight Comparison
 *  5. Supplier Score Comparison (technical + commercial from backend)
 *  6. Delivery Days Comparison
 * 
 * Props:
 *  - suppliers: [{ id, name, deliveryDays, technicalScore, commercialScore, currency }]
 *  - supplierTotals: { [supplierId]: { subtotal, tax, freight, grandTotal } }
 */
export default function ComparisonCharts({ suppliers = [], supplierTotals = {} }) {
    const theme = useTheme();
    const [chartType, setChartType] = useState('TOTAL_PRICE');

    const CHART_OPTIONS = [
        { value: 'TOTAL_PRICE', label: 'Total Price Comparison' },
        { value: 'SUBTOTAL', label: 'Subtotal Comparison' },
        { value: 'TAX', label: 'Tax Comparison' },
        { value: 'FREIGHT', label: 'Freight Comparison' },
        { value: 'DELIVERY', label: 'Delivery Days Comparison' },
        { value: 'SCORE', label: 'Supplier Score Comparison' },
    ];

    const BAR_COLORS = [
        theme.palette.primary.main,
        theme.palette.info.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.secondary.main
    ];

    const chartData = useMemo(() => {
        return suppliers.map(s => {
            const totals = supplierTotals[s.id] || {};
            let value = 0;
            let label = '';
            switch (chartType) {
                case 'TOTAL_PRICE':
                    value = totals.grandTotal || 0;
                    label = value > 0 ? '₹ ' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 'N/A';
                    break;
                case 'SUBTOTAL':
                    value = totals.subtotal || 0;
                    label = value > 0 ? '₹ ' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 'N/A';
                    break;
                case 'TAX':
                    value = totals.tax || 0;
                    label = value > 0 ? '₹ ' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 'N/A';
                    break;
                case 'FREIGHT':
                    value = totals.freight || 0;
                    label = value > 0 ? '₹ ' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 'N/A';
                    break;
                case 'DELIVERY':
                    value = Number(s.deliveryDays || 0);
                    label = value > 0 ? `${value} Days` : 'N/A';
                    break;
                case 'SCORE':
                    const tech = Number(s.technicalScore || 0);
                    const comm = Number(s.commercialScore || 0);
                    value = tech > 0 && comm > 0 ? (tech + comm) / 2 : tech || comm || 0;
                    label = value > 0 ? value.toFixed(1) : 'N/A';
                    break;
                default:
                    value = totals.grandTotal || 0;
                    label = '—';
            }
            return { id: s.id, name: s.name, value, label };
        });
    }, [suppliers, supplierTotals, chartType]);

    const maxValue = useMemo(() => Math.max(...chartData.map(d => d.value), 1), [chartData]);
    const minValue = useMemo(() => {
        const positives = chartData.map(d => d.value).filter(v => v > 0);
        return positives.length > 0 ? Math.min(...positives) : 0;
    }, [chartData]);

    // Metrics for the strip
    const bestTotal = useMemo(() => {
        const totals = Object.values(supplierTotals).map(t => t.grandTotal || 0).filter(v => v > 0);
        return totals.length > 0 ? Math.min(...totals) : 0;
    }, [supplierTotals]);

    const maxTotal = useMemo(() => {
        const totals = Object.values(supplierTotals).map(t => t.grandTotal || 0);
        return totals.length > 0 ? Math.max(...totals) : 0;
    }, [supplierTotals]);
    
    const savings = maxTotal > bestTotal ? maxTotal - bestTotal : 0;

    const bestDelivery = useMemo(() => {
        const days = suppliers.map(s => Number(s.deliveryDays || 0)).filter(d => d > 0);
        return days.length > 0 ? Math.min(...days) : null;
    }, [suppliers]);

    const bestScore = useMemo(() => {
        const scores = suppliers.map(s => {
            const t = Number(s.technicalScore || 0);
            const c = Number(s.commercialScore || 0);
            return t > 0 && c > 0 ? (t + c) / 2 : (t || c || 0);
        }).filter(v => v > 0);
        return scores.length > 0 ? Math.max(...scores) : null;
    }, [suppliers]);

    return (
        <Box sx={{
            bgcolor: 'transparent',
            height: '100%'
        }}>
            {/* Header */}
            <Box sx={{
                pb: 1.5,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
            }}>
                <TextField
                    select
                    size="small"
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { height: 32 } }}
                    InputProps={{ sx: { fontSize: '0.85rem' } }}
                >
                    {CHART_OPTIONS.map(opt => (
                        <MenuItem key={opt.value} value={opt.value} sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{opt.label}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Metric Strip */}
            <Grid container spacing={0} sx={{ mb: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, overflow: 'hidden' }}>
                <Grid item xs={6} md={3} sx={{ p: 1.5, borderRight: `1px solid ${theme.palette.divider}`, borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' }, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>L1 Total</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                        {bestTotal > 0 ? `₹ ${bestTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'N/A'}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3} sx={{ p: 1.5, borderRight: { md: `1px solid ${theme.palette.divider}` }, borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' }, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Savings</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="success.main">
                        {savings > 0 ? `₹ ${savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'N/A'}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3} sx={{ p: 1.5, borderRight: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Fastest Delivery</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="info.main">
                        {bestDelivery ? `${bestDelivery} Days` : 'N/A'}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3} sx={{ p: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Best Score</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="warning.dark">
                        {bestScore ? bestScore.toFixed(1) : 'N/A'}
                    </Typography>
                </Grid>
            </Grid>

            <Box>
                {maxValue === 0 || maxValue === 1 && chartData.every(d => d.value === 0) ? (
                    <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: alpha(theme.palette.grey[500], 0.05), borderRadius: 1.5, border: `1px dashed ${theme.palette.divider}` }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>No data available for {CHART_OPTIONS.find(o => o.value === chartType)?.label.toLowerCase()}</Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {chartData.map((data, index) => {
                            const widthPct = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
                            const color = BAR_COLORS[index % BAR_COLORS.length];
                            const isBest = data.value > 0 && data.value === minValue && chartType !== 'SCORE';
                            const isHighest = data.value === maxValue && chartType === 'SCORE';

                            return (
                                <Box key={data.id}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                        <Typography variant="caption" fontWeight={700} noWrap sx={{ maxWidth: '65%' }}>
                                            {data.name}
                                            {isBest && <Box component="span" sx={{ ml: 1, color: 'success.main', fontWeight: 800 }}>★</Box>}
                                        </Typography>
                                        <Typography variant="caption" fontWeight={800} sx={{ color }}>
                                            {data.label}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        width: '100%', height: 18, borderRadius: 1,
                                        bgcolor: alpha(color, 0.05), overflow: 'hidden'
                                    }}>
                                        <Box sx={{
                                            width: `${widthPct}%`,
                                            height: '100%',
                                            borderRadius: 1,
                                            background: isBest || isHighest
                                                ? `linear-gradient(90deg, ${alpha(color, 0.7)} 0%, ${color} 100%)`
                                                : alpha(color, 0.65),
                                            transition: 'width 0.5s ease-in-out',
                                            minWidth: widthPct > 0 ? 4 : 0
                                        }} />
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>
                )}

                {/* Legend */}
                <Box mt={2} pt={1.5} sx={{ borderTop: `1px dashed ${theme.palette.divider}` }}>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                        {chartData.map((data, index) => (
                            <Stack key={data.id} direction="row" spacing={0.5} alignItems="center">
                                <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: BAR_COLORS[index % BAR_COLORS.length], flexShrink: 0 }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }} noWrap>{data.name}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                    {(chartType === 'SCORE') && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.58rem', mt: 0.8, display: 'block', fontStyle: 'italic' }}>
                            Score = Average of Technical + Commercial scores from PP_QUOTE_COMPARISON_SCORE
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
