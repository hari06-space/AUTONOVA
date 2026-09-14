import React, { useMemo } from 'react';
import { Box, Typography, useTheme, alpha, Stack, Chip, Divider } from '@mui/material';
import { IconBulb, IconCheck, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';

/**
 * ComparisonInsights
 * 
 * Auto-generates data-driven procurement insights from REAL available data only.
 * No fabrication. If a metric is unavailable, that insight is simply omitted.
 * 
 * Uses:
 *  - rankedSuppliers: sorted by grand total (L1 = lowest price)
 *  - supplierTotals: { [id]: { subtotal, tax, freight, grandTotal } }
 *  - items: [{ id, name, qty, uom }]
 *  - suppliers: [{ id, name, deliveryDays, technicalScore, commercialScore, warranty, paymentTerms }]
 *  - matrix: { [itemId]: { [supplierId]: matrixItemDTO } }
 *  - lowestGrandTotal: number
 */
export default function ComparisonInsights({
    rankedSuppliers = [],
    supplierTotals = {},
    items = [],
    suppliers = [],
    matrix = {},
    lowestGrandTotal = 0,
    hideRecommendation = false
}) {
    const theme = useTheme();

    const insights = useMemo(() => {
        const result = [];
        if (!suppliers.length || !items.length) return result;

        const L1 = rankedSuppliers[0];
        const L2 = rankedSuppliers[1];
        const L2Total = L2 ? supplierTotals[L2.id]?.grandTotal || 0 : 0;
        const L1Total = L1 ? supplierTotals[L1.id]?.grandTotal || 0 : 0;

        // ── INSIGHT 1: Lowest price supplier ──────────────────────────
        if (L1 && L1Total > 0) {
            result.push({
                type: 'positive',
                text: `${L1.name} offers the lowest total price of ₹${L1Total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.`
            });
        }

        // ── INSIGHT 2: Price gap vs L2 ────────────────────────────────
        if (L1 && L2 && L1Total > 0 && L2Total > 0) {
            const gap = L2Total - L1Total;
            const pct = ((gap / L2Total) * 100).toFixed(1);
            if (gap > 0) {
                result.push({
                    type: 'info',
                    text: `${L1.name} is ₹${gap.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${pct}%) cheaper than ${L2.name}.`
                });
            }
        }

        // ── INSIGHT 3: Fastest overall delivery ───────────────────────
        const suppliersWithDelivery = suppliers.filter(s => s.deliveryDays && Number(s.deliveryDays) > 0);
        if (suppliersWithDelivery.length > 0) {
            const fastest = suppliersWithDelivery.reduce((a, b) =>
                Number(a.deliveryDays) < Number(b.deliveryDays) ? a : b
            );
            result.push({
                type: 'positive',
                text: `${fastest.name} offers the fastest delivery at ${fastest.deliveryDays} days.`
            });
        }

        // ── INSIGHT 4: Highest technical score ────────────────────────
        const suppliersWithTechScore = suppliers.filter(s => s.technicalScore && Number(s.technicalScore) > 0);
        if (suppliersWithTechScore.length > 0) {
            const bestTech = suppliersWithTechScore.reduce((a, b) =>
                Number(a.technicalScore) > Number(b.technicalScore) ? a : b
            );
            result.push({
                type: 'info',
                text: `${bestTech.name} has the highest technical score (${Number(bestTech.technicalScore).toFixed(1)}).`
            });
        }

        // ── INSIGHT 5: Highest commercial score ──────────────────────
        const suppliersWithCommScore = suppliers.filter(s => s.commercialScore && Number(s.commercialScore) > 0);
        if (suppliersWithCommScore.length > 0) {
            const bestComm = suppliersWithCommScore.reduce((a, b) =>
                Number(a.commercialScore) > Number(b.commercialScore) ? a : b
            );
            result.push({
                type: 'info',
                text: `${bestComm.name} has the highest commercial score (${Number(bestComm.commercialScore).toFixed(1)}).`
            });
        }

        // ── INSIGHT 6: Items where L1 is not the cheapest ─────────────
        let l1NotCheapestCount = 0;
        if (L1) {
            items.forEach(item => {
                const l1Cell = matrix[item.id]?.[L1.id];
                const l1Total = l1Cell ? Number(l1Cell.totalAmount) : Infinity;
                // check if any other supplier is cheaper for this item
                const others = suppliers.filter(s => s.id !== L1.id);
                const isL1Cheapest = others.every(s => {
                    const cell = matrix[item.id]?.[s.id];
                    return !cell || Number(cell.totalAmount) >= l1Total;
                });
                if (!isL1Cheapest) l1NotCheapestCount++;
            });
            if (l1NotCheapestCount > 0) {
                result.push({
                    type: 'warning',
                    text: `${L1.name} is not the cheapest for ${l1NotCheapestCount} item(s). Consider item-wise split if your policy allows.`
                });
            }
        }

        // ── INSIGHT 7: Negotiated price available ─────────────────────
        let negotiatedCount = 0;
        suppliers.forEach(s => {
            items.forEach(item => {
                const cell = matrix[item.id]?.[s.id];
                if (cell?.isNegotiated) negotiatedCount++;
            });
        });
        if (negotiatedCount > 0) {
            result.push({
                type: 'positive',
                text: `${negotiatedCount} line item(s) have negotiated prices applied.`
            });
        }

        // ── INSIGHT 8: Warranty coverage ─────────────────────────────
        const suppliersWithWarranty = suppliers.filter(s => s.warranty && s.warranty.trim() !== '');
        if (suppliersWithWarranty.length > 0 && suppliersWithWarranty.length < suppliers.length) {
            const noWarranty = suppliers.filter(s => !s.warranty || s.warranty.trim() === '');
            if (noWarranty.length > 0) {
                result.push({
                    type: 'warning',
                    text: `${noWarranty.map(s => s.name).join(', ')} has no warranty information provided.`
                });
            }
        }

        // ── INSIGHT 9: Historical Delivery & Quality Performance for L1 ─────────────
        if (L1) {
            if (L1.pastDeliveryPerformance && Number(L1.pastDeliveryPerformance) < 80) {
                result.push({
                    type: 'warning',
                    text: `Risk: The cheapest supplier (${L1.name}) has a poor past delivery performance of ${Number(L1.pastDeliveryPerformance).toFixed(0)}%.`
                });
            }
            if (L1.pastQualityPerformance && Number(L1.pastQualityPerformance) < 80) {
                result.push({
                    type: 'warning',
                    text: `Risk: The cheapest supplier (${L1.name}) has a poor past quality performance of ${Number(L1.pastQualityPerformance).toFixed(0)}%.`
                });
            }
        }

        // ── INSIGHT 10: Transport Distance ─────────────────────────────
        if (L1 && L1.distance && Number(L1.distance) > 500) {
             result.push({
                 type: 'info',
                 text: `${L1.name} is located ${L1.distance}km away. Factor in potential transport delays or elevated freight costs.`
             });
        }

        return result;
    }, [rankedSuppliers, supplierTotals, items, suppliers, matrix]);

    const iconConfig = {
        positive: { icon: <IconCheck size={14} />, color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.08) },
        info: { icon: <IconInfoCircle size={14} />, color: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.08) },
        warning: { icon: <IconAlertTriangle size={14} />, color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.08) },
    };

    const recommended = rankedSuppliers[0];

    if (!suppliers.length) return null;

    return (
        <Box sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            overflow: 'hidden',
            mb: 2
        }}>
            {/* Header */}
            <Box sx={{
                px: 2.5, py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.warning.light, 0.06),
                display: 'flex', alignItems: 'center', gap: 1
            }}>
                <Box sx={{
                    width: 28, height: 28, borderRadius: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha(theme.palette.warning.main, 0.15),
                    color: theme.palette.warning.main
                }}>
                    <IconBulb size={16} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>Comparison Insights</Typography>
                <Chip
                    label={`${insights.length} insights`}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ ml: 'auto', height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                />
            </Box>

            <Box sx={{ p: 2 }}>
                {insights.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                        Insufficient data to generate insights. Ensure all supplier quotations and delivery information are complete.
                    </Typography>
                ) : (
                    <Stack spacing={0.8}>
                        {insights.map((insight, idx) => {
                            const cfg = iconConfig[insight.type] || iconConfig.info;
                            return (
                                <Box
                                    key={idx}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1,
                                        px: 1.2, py: 0.8,
                                        borderRadius: 1,
                                        bgcolor: cfg.bg,
                                        border: `1px solid ${alpha(cfg.color, 0.2)}`
                                    }}
                                >
                                    <Box sx={{ color: cfg.color, mt: 0.1, flexShrink: 0 }}>{cfg.icon}</Box>
                                    <Typography variant="caption" sx={{ fontSize: '0.73rem', lineHeight: 1.5, color: 'text.primary' }}>
                                        {insight.text}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                )}

                {/* Recommended Supplier */}
                {recommended && !hideRecommendation && (
                    <>
                        <Divider sx={{ my: 1.5 }} />
                        <Box sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            px: 1.5, py: 1, borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.success.main, 0.08),
                            border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`
                        }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Recommended Supplier (L1 — Lowest Total Cost)
                                </Typography>
                                <Typography variant="subtitle2" fontWeight={700} color="success.main">
                                    🥇 {recommended.name}
                                </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight={800} color="success.main">
                                ₹{(supplierTotals[recommended.id]?.grandTotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.58rem', fontStyle: 'italic', mt: 0.5, display: 'block', px: 0.5 }}>
                            Recommendation is based on lowest total cost (L1 rule). Override requires justification.
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    );
}
