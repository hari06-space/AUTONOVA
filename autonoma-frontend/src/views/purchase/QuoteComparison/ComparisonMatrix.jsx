import React, { useMemo } from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter,
    Typography, useTheme, alpha, Chip, Radio, Stack, Tooltip
} from '@mui/material';
import { IconTrophy, IconStar } from '@tabler/icons-react';

/**
 * ComparisonMatrix
 * 
 * Enterprise-grade price comparison grid.
 * 
 * Left fixed columns: #, Item Description, UOM, Req. Qty
 * Per-supplier sub-columns: Unit Price, Delivery Days
 * Rightmost column: Best Per Item (supplier name with lowest total)
 * 
 * Highlights: lowest price per item in green, negotiated price chip.
 * 
 * Props:
 *  - items: [{ id, name, qty, uom, itemCode }]
 *  - suppliers: [{ id, name, quotationNo, quotationDate, deliveryDays, warranty, paymentTerms, currency }]
 *  - matrix: { [itemId]: { [supplierId]: matrixItemDTO } }
 *  - lowestTotals: { [itemId]: number }
 *  - supplierTotals: { [supplierId]: { subtotal, tax, freight, grandTotal } }
 *  - lowestGrandTotal: number
 *  - selectionType: 'ENTIRE_RFQ' | 'ITEM_WISE'
 *  - selectedSupplierId: number (for ENTIRE_RFQ)
 *  - onSupplierSelect: (supplierId) => void
 *  - isLocked: boolean
 *  - searchTerm: string
 *  - supplierFilter: 'ALL' | supplierId
 *  - showVariationsOnly: boolean
 */
export default function ComparisonMatrix({
    items = [],
    suppliers = [],
    matrix = {},
    lowestTotals = {},
    supplierTotals = {},
    lowestGrandTotal = 0,
    selectionType = 'ENTIRE_RFQ',
    selectedSupplierId,
    onSupplierSelect,
    isLocked = false,
    searchTerm = '',
    supplierFilter = 'ALL',
    showVariationsOnly = false
}) {
    const theme = useTheme();

    // Filter items by search
    const filteredItems = useMemo(() => {
        let result = items;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(i =>
                (i.name || '').toLowerCase().includes(term) ||
                (i.itemCode || '').toLowerCase().includes(term)
            );
        }
        if (showVariationsOnly) {
            // Only show items where prices differ across suppliers
            result = result.filter(item => {
                const prices = suppliers.map(s => {
                    const cell = matrix[item.id]?.[s.id];
                    return cell ? Number(cell.isNegotiated ? cell.negotiatedPrice : cell.originalPrice) : null;
                }).filter(p => p !== null);
                if (prices.length < 2) return false;
                return new Set(prices).size > 1;
            });
        }
        return result;
    }, [items, searchTerm, showVariationsOnly, suppliers, matrix]);

    // Filter suppliers
    const filteredSuppliers = useMemo(() => {
        if (supplierFilter === 'ALL') return suppliers;
        return suppliers.filter(s => String(s.id) === String(supplierFilter));
    }, [suppliers, supplierFilter]);

    // Best supplier per item (lowest effective price * qty = totalAmount)
    const bestPerItem = useMemo(() => {
        const result = {};
        items.forEach(item => {
            let minTotal = Infinity;
            let bestId = null;
            let bestName = null;
            suppliers.forEach(s => {
                const cell = matrix[item.id]?.[s.id];
                if (cell) {
                    const total = Number(cell.totalAmount) || 0;
                    if (total > 0 && total < minTotal) {
                        minTotal = total;
                        bestId = s.id;
                        bestName = s.name;
                    }
                }
            });
            result[item.id] = bestId ? { id: bestId, name: bestName } : null;
        });
        return result;
    }, [items, suppliers, matrix]);

    // Supplier with lowest grand total
    const lowestSupplierId = useMemo(() => {
        let minId = null;
        let minTotal = Infinity;
        suppliers.forEach(s => {
            const gt = supplierTotals[s.id]?.grandTotal || 0;
            if (gt > 0 && gt < minTotal) {
                minTotal = gt;
                minId = s.id;
            }
        });
        return minId;
    }, [suppliers, supplierTotals]);

    const fmtCurr = (val) => (typeof val === 'number' && !isNaN(val)) ? `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

    const cellBg = (theme.palette.mode === 'dark') ? '#1e293b !important' : '#ffffff !important';
    const headerBg = theme.palette.primary.main + ' !important';
    const headerTextColor = '#ffffff !important';
    const defaultTextColor = (theme.palette.mode === 'dark') ? '#f1f5f9 !important' : '#334155 !important';
    return (
        <TableContainer sx={{
            maxHeight: 540,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff'
        }}>
            <Table stickyHeader size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                    {/* Row 1: Supplier group headers */}
                    <TableRow>
                        {/* Fixed left columns span */}
                        <TableCell
                            colSpan={4}
                            sx={{ bgcolor: headerBg, borderBottom: `1px solid ${theme.palette.divider}`, zIndex: 4, py: 0.8, top: 0 }}
                        />

                        {/* Supplier group headers */}
                        {filteredSuppliers.map(s => {
                            const isL1 = s.id === lowestSupplierId;
                            return (
                                <TableCell
                                    key={`grp-${s.id}`}
                                    colSpan={3}
                                    align="center"
                                    sx={{
                                        bgcolor: isL1 ? cellBg : headerBg,
                                        backgroundImage: isL1 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.25) 100%) !important' : 'none',
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        borderLeft: `2px solid ${isL1 ? theme.palette.warning.main : theme.palette.divider}`,
                                        boxShadow: isL1 ? `inset 0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}` : 'none',
                                        zIndex: 3,
                                        py: 0.8,
                                        top: 0
                                    }}
                                >
                                    {isL1 && (
                                        <Box display="flex" justifyContent="center" alignItems="center" gap={0.5} mb={0.5}>
                                            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.gif" alt="trophy" width="22" height="22" />
                                            <Typography variant="caption" fontWeight={800} color="warning.dark" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Best Offer
                                            </Typography>
                                        </Box>
                                    )}
                                    {selectionType === 'ENTIRE_RFQ' && (
                                        <Radio
                                            size="small"
                                            checked={selectedSupplierId === s.id}
                                            onChange={() => onSupplierSelect(s.id)}
                                            disabled={isLocked}
                                            color="primary"
                                            sx={{ p: 0.2 }}
                                        />
                                    )}
                                    <Typography
                                        variant="caption"
                                        fontWeight={700}
                                        color={isL1 ? 'warning.dark' : headerTextColor}
                                        display="block"
                                        noWrap
                                    >
                                        {s.name}
                                    </Typography>
                                    {(s.quotationNo || s.supplierReferenceNo) && (
                                        <Typography variant="caption" sx={{ fontSize: '0.58rem', color: isL1 ? defaultTextColor : alpha('#ffffff', 0.8), opacity: 0.8 }} display="block">
                                            Qtn: {s.quotationNo || s.supplierReferenceNo}
                                        </Typography>
                                    )}
                                </TableCell>
                            );
                        })}

                        {/* Best Per Item header */}
                        <TableCell
                            align="center"
                            sx={{
                                bgcolor: cellBg,
                                backgroundImage: `linear-gradient(0deg, ${alpha(theme.palette.warning.light, 0.15)}, ${alpha(theme.palette.warning.light, 0.15)}) !important`,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                borderLeft: `2px solid ${theme.palette.warning.main}`,
                                zIndex: 3, py: 0.8, top: 0
                            }}
                        >
                            <Stack direction="row" spacing={0.3} justifyContent="center" alignItems="center">
                                <IconStar size={12} color={theme.palette.warning.main} />
                                <Typography variant="caption" fontWeight={700} color="warning.dark" sx={{ fontSize: '0.65rem' }}>
                                    Best Per Item
                                </Typography>
                            </Stack>
                        </TableCell>
                    </TableRow>

                    {/* Row 2: Column sub-headers */}
                    <TableRow>
                        <TableCell sx={{ bgcolor: headerBg, borderBottom: `2px solid ${theme.palette.divider}`, zIndex: 4, width: 36, py: 0.8, top: 70 }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: headerTextColor }}>#</Typography>
                        </TableCell>
                        <TableCell sx={{ bgcolor: headerBg, borderBottom: `2px solid ${theme.palette.divider}`, zIndex: 4, minWidth: 180, py: 0.8, top: 70 }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: headerTextColor }}>Item Description</Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ bgcolor: headerBg, borderBottom: `2px solid ${theme.palette.divider}`, zIndex: 4, width: 55, py: 0.8, top: 70 }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: headerTextColor }}>UOM</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: headerBg, borderBottom: `2px solid ${theme.palette.divider}`, zIndex: 4, width: 70, py: 0.8, top: 70 }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: headerTextColor }}>Req. Qty</Typography>
                        </TableCell>

                        {/* Per-supplier sub-columns */}
                        {filteredSuppliers.map(s => {
                            const isL1 = s.id === lowestSupplierId;
                            return (
                                <React.Fragment key={`sub-${s.id}`}>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            bgcolor: isL1 ? cellBg : headerBg,
                                            borderBottom: `2px solid ${theme.palette.divider}`,
                                            borderLeft: `2px solid ${isL1 ? theme.palette.warning.main : theme.palette.divider}`,
                                            zIndex: 3, width: 110, py: 0.8, top: 70,
                                            backgroundImage: isL1 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.25) 100%) !important' : 'none'
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={700} sx={{ color: isL1 ? 'warning.dark' : headerTextColor }}>Unit Price</Typography>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: isL1 ? cellBg : headerBg,
                                            borderBottom: `2px solid ${theme.palette.divider}`,
                                            borderLeft: `1px dashed ${isL1 ? alpha(theme.palette.warning.main, 0.5) : alpha('#ffffff', 0.3)}`,
                                            zIndex: 3, width: 70, py: 0.8, top: 70,
                                            backgroundImage: isL1 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.25) 100%) !important' : 'none'
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={700} sx={{ color: isL1 ? 'warning.dark' : headerTextColor }}>Del. Days</Typography>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: isL1 ? cellBg : headerBg,
                                            borderBottom: `2px solid ${theme.palette.divider}`,
                                            borderLeft: `1px dashed ${isL1 ? alpha(theme.palette.warning.main, 0.5) : alpha('#ffffff', 0.3)}`,
                                            zIndex: 3, width: 90, py: 0.8, top: 70,
                                            backgroundImage: isL1 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.25) 100%) !important' : 'none'
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={700} sx={{ color: isL1 ? 'warning.dark' : headerTextColor }}>Warranty</Typography>
                                    </TableCell>
                                </React.Fragment>
                            );
                        })}

                        {/* Best per item sub-header */}
                        <TableCell
                            align="center"
                            sx={{
                                bgcolor: cellBg,
                                backgroundImage: `linear-gradient(0deg, ${alpha(theme.palette.warning.light, 0.15)}, ${alpha(theme.palette.warning.light, 0.15)}) !important`,
                                borderBottom: `2px solid ${theme.palette.divider}`,
                                borderLeft: `2px solid ${theme.palette.warning.main}`,
                                zIndex: 3, width: 120, py: 0.8, top: 70
                            }}
                        >
                            <Typography variant="caption" fontWeight={700} color="warning.dark">Supplier</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {filteredItems.map((item, index) => {
                        const lowestLineTotal = lowestTotals[item.id];
                        const best = bestPerItem[item.id];

                        return (
                            <TableRow
                                key={item.id}
                                sx={{
                                    bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.primary.light, 0.02),
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.05) },
                                    transition: 'background-color 0.15s'
                                }}
                            >
                                <TableCell sx={{ py: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{index + 1}</Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                    <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.3 }}>{item.name}</Typography>
                                </TableCell>
                                <TableCell align="center" sx={{ py: 1 }}>
                                    <Typography variant="caption" color="text.secondary">{item.uom || 'Nos'}</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>{Number(item.qty || 0).toLocaleString('en-IN')}</Typography>
                                </TableCell>

                                {/* Per-supplier cells */}
                                {filteredSuppliers.map(s => {
                                    const cell = matrix[item.id]?.[s.id];
                                    const isL1Supplier = s.id === lowestSupplierId;
                                    if (!cell) {
                                        return (
                                            <React.Fragment key={`cell-${s.id}`}>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        py: 1,
                                                        borderLeft: `2px solid ${isL1Supplier ? theme.palette.warning.main : theme.palette.divider}`
                                                    }}
                                                >
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 1, borderLeft: `1px dashed ${theme.palette.divider}` }}>
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 1, borderLeft: `1px dashed ${theme.palette.divider}` }}>
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                </TableCell>
                                            </React.Fragment>
                                        );
                                    }

                                    const effectivePrice = cell.isNegotiated ? Number(cell.negotiatedPrice) : Number(cell.originalPrice);
                                    const lineTotal = Number(cell.totalAmount) || 0;
                                    const isLowest = lineTotal > 0 && lineTotal === lowestLineTotal;

                                    return (
                                        <React.Fragment key={`cell-${s.id}`}>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    py: 1,
                                                    borderLeft: `2px solid ${isL1Supplier ? theme.palette.warning.main : theme.palette.divider}`,
                                                    bgcolor: isLowest ? alpha(theme.palette.warning.main, 0.08) : 'transparent'
                                                }}
                                            >
                                                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                                    {cell.isNegotiated && Number(cell.originalPrice) !== Number(cell.negotiatedPrice) && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.disabled"
                                                            sx={{ textDecoration: 'line-through', mr: 0.5, fontSize: '0.65rem' }}
                                                        >
                                                            {fmtCurr(cell.originalPrice)}
                                                        </Typography>
                                                    )}
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={isLowest ? 700 : 400}
                                                        color={isLowest ? 'warning.dark' : 'text.primary'}
                                                    >
                                                        {fmtCurr(effectivePrice)}
                                                    </Typography>
                                                    {isLowest && (
                                                        <Tooltip title="Lowest price for this item">
                                                            <Box component="span" sx={{ color: 'warning.main', lineHeight: 0 }}>★</Box>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                {cell.isNegotiated && (
                                                    <Box textAlign="right">
                                                        <Tooltip 
                                                            title={
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, borderBottom: '1px solid #ffffff55', pb: 0.5 }}>
                                                                        Negotiation Details
                                                                    </Typography>
                                                                    {cell.negotiationDate && (
                                                                        <Typography variant="caption" display="block">
                                                                            <strong>Date:</strong> {new Date(cell.negotiationDate).toLocaleDateString('en-GB')}
                                                                        </Typography>
                                                                    )}
                                                                    <Typography variant="caption" display="block">
                                                                        <strong>Original Price:</strong> {fmtCurr(cell.originalPrice)}
                                                                    </Typography>
                                                                    <Typography variant="caption" display="block">
                                                                        <strong>Final Price:</strong> {fmtCurr(cell.negotiatedPrice)}
                                                                    </Typography>
                                                                    {cell.negotiationRemarks && (
                                                                        <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic', maxWidth: 200, whiteSpace: 'pre-wrap' }}>
                                                                            <strong>Remarks:</strong> {cell.negotiationRemarks}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            } 
                                                            arrow 
                                                            placement="top"
                                                        >
                                                            <Chip
                                                                label="Nego"
                                                                size="small"
                                                                color="info"
                                                                variant="outlined"
                                                                sx={{ height: 14, fontSize: '0.52rem', mt: 0.2, cursor: 'help' }}
                                                            />
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    py: 1,
                                                    borderLeft: `1px dashed ${theme.palette.divider}`
                                                }}
                                            >
                                                <Typography variant="caption" fontWeight={500}>
                                                    {cell.deliveryDays ? `${cell.deliveryDays}d` : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    py: 1,
                                                    borderLeft: `1px dashed ${theme.palette.divider}`
                                                }}
                                            >
                                                <Typography variant="caption" fontWeight={500} sx={{ display: 'block', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cell.warranty || ''}>
                                                    {cell.warranty || '—'}
                                                </Typography>
                                            </TableCell>
                                        </React.Fragment>
                                    );
                                })}

                                {/* Best Per Item cell */}
                                <TableCell
                                    align="center"
                                    sx={{
                                        py: 1,
                                        borderLeft: `2px solid ${theme.palette.warning.main}`,
                                        bgcolor: alpha(theme.palette.warning.light, 0.06)
                                    }}
                                >
                                    {best ? (
                                        <Typography variant="caption" fontWeight={700} color="warning.dark" noWrap sx={{ fontSize: '0.65rem' }}>
                                            {best.name}
                                        </Typography>
                                    ) : (
                                        <Typography variant="caption" color="text.disabled">—</Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>

                {/* Sticky Footer Totals */}
                <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 2, bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50] }}>
                    {/* Item Total Row */}
                    <TableRow sx={{ '& td': { borderTop: `2px solid ${theme.palette.divider}` } }}>
                        <TableCell colSpan={3} sx={{ py: 0.8, pl: 2 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Item Total</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 0.8 }}>—</TableCell>
                        {filteredSuppliers.map(s => {
                            const isL1Supplier = s.id === lowestSupplierId;
                            return (
                                <TableCell key={`it-${s.id}`} colSpan={3} align="right" sx={{ py: 0.8, borderLeft: `2px solid ${isL1Supplier ? theme.palette.warning.main : theme.palette.divider}` }}>
                                    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{`Formula: Sum(Req. Qty × Unit Price)\nActual: ∑ = ${fmtCurr(supplierTotals[s.id]?.subtotal || 0)}`}</span>} placement="top" arrow>
                                        <Typography variant="caption" color="text.primary" fontWeight={600} sx={{ cursor: 'help' }}>
                                            {fmtCurr(supplierTotals[s.id]?.subtotal || 0)}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                            );
                        })}
                        <TableCell align="center" sx={{ py: 0.8, borderLeft: `2px solid ${theme.palette.warning.main}`, bgcolor: alpha(theme.palette.warning.light, 0.06) }}>—</TableCell>
                    </TableRow>

                    {/* Additional Charges Row */}
                    <TableRow>
                        <TableCell colSpan={3} sx={{ py: 0.8, pl: 2 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Additional Charges</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 0.8 }}>—</TableCell>
                        {filteredSuppliers.map(s => {
                            const isL1Supplier = s.id === lowestSupplierId;
                            return (
                                <TableCell key={`ac-${s.id}`} colSpan={3} align="right" sx={{ py: 0.8, borderLeft: `2px solid ${isL1Supplier ? theme.palette.warning.main : theme.palette.divider}` }}>
                                    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{`Formula: Sum(Item Freight) + Header Freight\nActual: ∑ Freight = ${fmtCurr(supplierTotals[s.id]?.freight || 0)}`}</span>} placement="top" arrow>
                                        <Typography variant="caption" color="text.primary" fontWeight={600} sx={{ cursor: 'help' }}>
                                            {fmtCurr(supplierTotals[s.id]?.freight || 0)}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                            );
                        })}
                        <TableCell align="center" sx={{ py: 0.8, borderLeft: `2px solid ${theme.palette.warning.main}`, bgcolor: alpha(theme.palette.warning.light, 0.06) }}>—</TableCell>
                    </TableRow>

                    {/* Tax Row */}
                    <TableRow>
                        <TableCell colSpan={3} sx={{ py: 0.8, pl: 2 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Tax</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 0.8 }}>—</TableCell>
                        {filteredSuppliers.map(s => {
                            const isL1Supplier = s.id === lowestSupplierId;
                            return (
                                <TableCell key={`tx-${s.id}`} colSpan={3} align="right" sx={{ py: 0.8, borderLeft: `2px solid ${isL1Supplier ? theme.palette.warning.main : theme.palette.divider}` }}>
                                    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{`Formula: Sum(Item Tax) + Header Tax\nActual: ∑ Tax = ${fmtCurr(supplierTotals[s.id]?.tax || 0)}`}</span>} placement="top" arrow>
                                        <Typography variant="caption" color="text.primary" fontWeight={600} sx={{ cursor: 'help' }}>
                                            {fmtCurr(supplierTotals[s.id]?.tax || 0)}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                            );
                        })}
                        <TableCell align="center" sx={{ py: 0.8, borderLeft: `2px solid ${theme.palette.warning.main}`, bgcolor: alpha(theme.palette.warning.light, 0.06) }}>—</TableCell>
                    </TableRow>

                    {/* Grand Total Row */}
                    <TableRow sx={{ '& td': { borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `2px solid ${theme.palette.divider}` } }}>
                        <TableCell colSpan={3} sx={{ py: 1.5, pl: 2 }}>
                            <Typography variant="subtitle2" fontWeight={800} color="text.primary">Grand Total ({filteredItems.length} Items)</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>—</TableCell>

                        {filteredSuppliers.map(s => {
                            const gt = supplierTotals[s.id]?.grandTotal || 0;
                            const isL1 = gt === lowestGrandTotal && gt > 0;
                            const isL1Supplier = s.id === lowestSupplierId;
                            return (
                                <TableCell
                                    key={`ft-${s.id}`}
                                    align="right"
                                    colSpan={3}
                                    sx={{
                                        py: 1.5,
                                        borderLeft: `2px solid ${isL1Supplier ? theme.palette.warning.main : theme.palette.divider}`
                                    }}
                                >
                                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                                        <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{`Formula: Subtotal + Additional Charges + Tax\nActual: ${fmtCurr(supplierTotals[s.id]?.subtotal || 0)} + ${fmtCurr(supplierTotals[s.id]?.freight || 0)} + ${fmtCurr(supplierTotals[s.id]?.tax || 0)} = ${fmtCurr(gt)}`}</span>} placement="top" arrow>
                                            <Typography variant="subtitle2" fontWeight={800} color={isL1 ? 'warning.dark' : 'text.primary'} sx={{ cursor: 'help' }}>
                                                {fmtCurr(gt)}
                                            </Typography>
                                        </Tooltip>
                                        {isL1 && <Chip label="BEST OFFER" size="small" color="warning" sx={{ height: 16, fontSize: '0.6rem', mt: 0.5, fontWeight: 700 }} />}
                                        {!isL1 && gt > 0 && lowestGrandTotal > 0 && (
                                            <Typography variant="caption" color="error.main" sx={{ fontSize: '0.58rem', mt: 0.5 }}>
                                                +{fmtCurr(gt - lowestGrandTotal)}
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                            );
                        })}

                        {/* Best Per Item footer */}
                        <TableCell
                            align="center"
                            sx={{
                                py: 1,
                                borderLeft: `2px solid ${theme.palette.warning.main}`,
                                bgcolor: alpha(theme.palette.warning.light, 0.12)
                            }}
                        >
                            <Typography variant="caption" fontWeight={700} color="warning.dark" sx={{ fontSize: '0.65rem' }}>
                                {fmtCurr(lowestGrandTotal)}
                            </Typography>
                        </TableCell>
                    </TableRow>
                    
                    {/* Visual Separator for Performance */}
                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff' }}>
                        <TableCell colSpan={4} sx={{ py: 1.5, pl: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Supplier Performance
                            </Typography>
                        </TableCell>
                        {filteredSuppliers.map(s => {
                            const isL1Supplier = s.id === lowestSupplierId;
                            return (
                                <TableCell key={`perf-hdr-${s.id}`} colSpan={3} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, borderLeft: `2px solid ${isL1Supplier ? theme.palette.warning.main : theme.palette.divider}` }} />
                            );
                        })}
                        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}`, borderLeft: `2px solid ${theme.palette.warning.main}`, bgcolor: alpha(theme.palette.warning.light, 0.12) }} />
                    </TableRow>

                    {/* Extra Row: Distance */}
                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                        <TableCell colSpan={4} sx={{ py: 0.8, pl: 2, borderBottom: 'none' }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">Transport Scope (Distance)</Typography>
                        </TableCell>
                        {filteredSuppliers.map(s => {
                            const isL1Supplier = s.id === lowestSupplierId;
                            return (
                                <TableCell key={`dist-${s.id}`} colSpan={3} align="center" sx={{ py: 0.8, borderLeft: `2px solid ${isL1Supplier ? theme.palette.warning.main : theme.palette.divider}`, borderBottom: 'none' }}>
                                    <Typography variant="caption" fontWeight={600} color="text.primary">
                                        {s.transportScope || '—'}{s.distance ? ` (${s.distance} km)` : ''}
                                    </Typography>
                                </TableCell>
                            );
                        })}
                        <TableCell sx={{ borderLeft: `2px solid ${theme.palette.warning.main}`, bgcolor: alpha(theme.palette.warning.light, 0.12), borderBottom: 'none' }} />
                    </TableRow>

                    {/* Extra Row: Historical Performance */}
                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                        <TableCell colSpan={4} sx={{ py: 0.8, pl: 2, borderBottom: 'none' }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">Past Delay & Quality Score</Typography>
                        </TableCell>
                        {filteredSuppliers.map(s => {
                            const isL1Supplier = s.id === lowestSupplierId;
                            return (
                                <TableCell key={`perf-${s.id}`} colSpan={3} align="center" sx={{ py: 0.8, borderLeft: `2px solid ${isL1Supplier ? theme.palette.warning.main : theme.palette.divider}`, borderBottom: 'none' }}>
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <Typography variant="caption" fontWeight={600} color={s.pastDeliveryPerformance < 60 ? 'error.main' : 'text.primary'}>
                                            D: {s.pastDeliveryPerformance ? `${s.pastDeliveryPerformance}%` : 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" fontWeight={600} color={s.pastQualityPerformance < 60 ? 'error.main' : 'text.primary'}>
                                            Q: {s.pastQualityPerformance ? `${s.pastQualityPerformance}%` : 'N/A'}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                            );
                        })}
                        <TableCell sx={{ borderLeft: `2px solid ${theme.palette.warning.main}`, bgcolor: alpha(theme.palette.warning.light, 0.12), borderBottom: 'none' }} />
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );
}
