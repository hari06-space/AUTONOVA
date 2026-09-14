import React, { useMemo } from 'react';
import {
    Box, Typography, useTheme, alpha, Stack, Chip, Tooltip, Table, TableHead, TableBody, TableRow, TableCell, TableContainer
} from '@mui/material';
import { IconTruck, IconClock, IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';

/**
 * ComparisonDeliveryComparison
 * Shows item-wise delivery days comparison across all suppliers.
 * Highlights early (green), on-time (amber), late (red) — relative to the best/min delivery days.
 * 
 * NOTE: Backend provides `deliveryDays` (integer) at item level. We compare relative performance
 * since the backend does not provide an absolute required delivery date.
 * We show "Early/Fast", "On Time", "Late" relative to the best (minimum) days among suppliers.
 * 
 * Props:
 *  - items: [{ id, name, qty, uom }]
 *  - suppliers: [{ id, name }]
 *  - matrix: { [itemId]: { [supplierId]: matrixItemDTO } }
 */
export default function ComparisonDeliveryComparison({ items = [], suppliers = [], matrix = {} }) {
    const theme = useTheme();

    // For each item, find the minimum delivery days across all suppliers
    const itemMinDelivery = useMemo(() => {
        const result = {};
        items.forEach(item => {
            let min = Infinity;
            suppliers.forEach(s => {
                const cell = matrix[item.id]?.[s.id];
                const days = Number(cell?.deliveryDays);
                if (cell && days > 0 && days < min) min = days;
            });
            result[item.id] = min === Infinity ? null : min;
        });
        return result;
    }, [items, suppliers, matrix]);

    const getDeliveryStatus = (deliveryDays, minDays) => {
        if (!deliveryDays || !minDays) return null;
        const days = Number(deliveryDays);
        if (days === minDays) return 'BEST';
        if (days <= minDays * 1.2) return 'OK';    // Within 20% of best
        return 'LATE';
    };

    const statusConfig = {
        BEST: { label: 'Fastest', color: theme.palette.success.main, bgColor: alpha(theme.palette.success.main, 0.08), icon: <IconCheck size={12} /> },
        OK: { label: 'OK', color: theme.palette.warning.main, bgColor: alpha(theme.palette.warning.main, 0.08), icon: <IconClock size={12} /> },
        LATE: { label: 'Slower', color: theme.palette.error.main, bgColor: alpha(theme.palette.error.main, 0.08), icon: <IconAlertTriangle size={12} /> }
    };

    // Check if any delivery data exists at all
    const hasAnyDeliveryInfo = useMemo(() => {
        for (const item of items) {
            for (const supplier of suppliers) {
                if (Number(matrix[item.id]?.[supplier.id]?.deliveryDays) > 0) return true;
            }
        }
        return false;
    }, [items, suppliers, matrix]);

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
                bgcolor: alpha(theme.palette.info.light, 0.05),
                display: 'flex', alignItems: 'center', gap: 1
            }}>
                <Box sx={{ width: 28, height: 28, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.info.main, 0.12), color: theme.palette.info.main }}>
                    <IconTruck size={16} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>Item-wise Delivery Comparison</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (Delivery days per item across suppliers)
                </Typography>
            </Box>

            {!hasAnyDeliveryInfo ? (
                <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Delivery information was not provided by suppliers.
                    </Typography>
                </Box>
            ) : (
                <>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50] }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                                Item
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', borderBottom: `2px solid ${theme.palette.divider}` }}>
                                Best (Days)
                            </TableCell>
                            {suppliers.map(s => (
                                <TableCell
                                    key={s.id}
                                    align="center"
                                    sx={{
                                        fontWeight: 700, fontSize: '0.7rem', color: 'primary.main',
                                        borderBottom: `2px solid ${theme.palette.divider}`,
                                        borderLeft: `1px solid ${theme.palette.divider}`
                                    }}
                                >
                                    {s.name}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => {
                            const minDays = itemMinDelivery[item.id];
                            return (
                                <TableRow
                                    key={item.id}
                                    sx={{
                                        bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.primary.light, 0.02),
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.05) }
                                    }}
                                >
                                    <TableCell sx={{ py: 1 }}>
                                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 180 }}>
                                            {item.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                            Qty: {item.qty} {item.uom}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1 }}>
                                        <Chip
                                            label={minDays ? `${minDays} Days` : 'N/A'}
                                            size="small"
                                            color={minDays ? 'success' : 'default'}
                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                        />
                                    </TableCell>
                                    {suppliers.map(s => {
                                        const cell = matrix[item.id]?.[s.id];
                                        const days = cell ? Number(cell.deliveryDays) : null;
                                        const status = days && minDays ? getDeliveryStatus(days, minDays) : null;
                                        const cfg = status ? statusConfig[status] : null;

                                        return (
                                            <TableCell
                                                key={s.id}
                                                align="center"
                                                sx={{
                                                    py: 1,
                                                    borderLeft: `1px solid ${theme.palette.divider}`,
                                                    bgcolor: cfg ? cfg.bgColor : 'transparent'
                                                }}
                                            >
                                                {days ? (
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700} color={cfg?.color || 'text.primary'}>
                                                            {days} Days
                                                        </Typography>
                                                        {cfg && (
                                                            <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.3}>
                                                                <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
                                                                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: cfg.color, fontWeight: 600 }}>
                                                                    {cfg.label}
                                                                </Typography>
                                                            </Stack>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Legend */}
            <Box sx={{ px: 2.5, py: 1, borderTop: `1px dashed ${theme.palette.divider}`, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                    <Stack key={key} direction="row" spacing={0.5} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cfg.color }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{cfg.label}</Typography>
                    </Stack>
                ))}
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', ml: 'auto', fontStyle: 'italic' }}>
                    Relative to fastest supplier
                </Typography>
            </Box>

                </>
            )}
        </Box>
    );
}
