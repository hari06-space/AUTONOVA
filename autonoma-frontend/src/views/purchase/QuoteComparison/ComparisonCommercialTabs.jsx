import React, { useState } from 'react';
import {
    Box, Tabs, Tab, Typography, useTheme, alpha, Stack, Chip, Card, CardContent, Grid, TextField, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { IconTruck, IconCash, IconCertificate, IconFile, IconNote, IconShield } from '@tabler/icons-react';

function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ py: 2, px: 0.5 }}>{children}</Box> : null;
}

function LabelValue({ label, value, valueColor }) {
    const theme = useTheme();
    return (
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.8}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80, flexShrink: 0 }}>{label}:</Typography>
            <Typography variant="caption" fontWeight={600} color={valueColor || 'text.primary'} textAlign="right" sx={{ ml: 1 }}>
                {value || 'N/A'}
            </Typography>
        </Box>
    );
}

function SupplierComparisonTable({ suppliers, rows }) {
    const theme = useTheme();
    return (
        <Box sx={{ width: '100%', overflowX: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5 }}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.light, 0.05) }}>
                        <TableCell sx={{ minWidth: 150, borderRight: `1px solid ${theme.palette.divider}`, fontWeight: 700, color: 'text.secondary' }}>Details</TableCell>
                        {suppliers.map(s => (
                            <TableCell key={s.id} align="center" sx={{ minWidth: 150, borderRight: `1px solid ${theme.palette.divider}`, fontWeight: 800, color: 'primary.main' }}>
                                {s.name}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, idx) => (
                        <TableRow key={idx} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell sx={{ borderRight: `1px solid ${theme.palette.divider}`, fontWeight: 600, color: 'text.secondary', bgcolor: alpha(theme.palette.grey[100], 0.3) }}>
                                {row.label}
                            </TableCell>
                            {suppliers.map(s => (
                                <TableCell key={s.id} align="center" sx={{ borderRight: `1px solid ${theme.palette.divider}` }}>
                                    {row.render(s)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
}

/**
 * ComparisonCommercialTabs
 * 
 * Tabs: Commercial Terms | Delivery Details | Payment Terms | Quality & Warranty | Documents | Notes
 * 
 * Uses only real backend-provided data. Never fabricates values.
 * 
 * Props:
 *  - suppliers: [{ id, name, deliveryDays, warranty, paymentTerms, currency, technicalScore, commercialScore }]
 *  - matrix: { [itemId]: { [supplierId]: matrixItemDTO } } — needed for per-item delivery
 *  - items: [{ id, name }]
 *  - remarks: string
 *  - onRemarksChange: (val) => void
 *  - isLocked: boolean
 */
export default function ComparisonCommercialTabs({
    suppliers = [],
    matrix = {},
    items = [],
    remarks = '',
    onRemarksChange,
    isLocked = false
}) {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);

    const TABS = [
        { label: 'Commercial Terms', icon: <IconCash size={14} /> },
        { label: 'Delivery Details', icon: <IconTruck size={14} /> },
        { label: 'Payment Terms', icon: <IconCertificate size={14} /> },
        { label: 'Quality & Warranty', icon: <IconShield size={14} /> },
        { label: 'Documents', icon: <IconFile size={14} /> },
        { label: 'Notes', icon: <IconNote size={14} /> },
    ];

    return (
        <Box sx={{
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: 'hidden'
        }}>
            <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.primary.light, 0.03),
                    minHeight: 40,
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', minHeight: 40, py: 0 },
                    '& .Mui-selected': { color: theme.palette.primary.main }
                }}
            >
                {TABS.map((tab, i) => (
                    <Tab key={i} icon={tab.icon} iconPosition="start" label={tab.label} />
                ))}
            </Tabs>

            <Box sx={{ px: 2, py: 0 }}>

                {/* TAB 0: Commercial Terms */}
                <TabPanel value={tabValue} index={0}>
                    <SupplierComparisonTable
                        suppliers={suppliers}
                        rows={[
                            {
                                label: 'Delivery',
                                render: (s) => <Typography variant="body2" fontWeight={600}>{s.deliveryDays ? `${s.deliveryDays} Days` : 'N/A'}</Typography>
                            },
                            {
                                label: 'Payment Terms',
                                render: (s) => <Typography variant="body2" fontWeight={500}>{s.paymentTerms || 'N/A'}</Typography>
                            },
                            {
                                label: 'Warranty',
                                render: (s) => <Typography variant="body2" fontWeight={500}>{s.warranty || 'N/A'}</Typography>
                            },
                            {
                                label: 'Currency',
                                render: (s) => <Typography variant="body2" fontWeight={600} color="warning.main">{s.currency || 'INR'}</Typography>
                            },
                            {
                                label: 'Freight',
                                render: (s) => <Typography variant="body2" fontWeight={500}>{s.freight !== undefined ? (s.freight ? `₹${s.freight}` : 'Inclusive') : 'N/A'}</Typography>
                            }
                        ]}
                    />
                </TabPanel>

                {/* TAB 1: Delivery Details */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={1.5} mb={2}>
                        {suppliers.map(s => (
                            <Grid item xs={12} md={4} lg={3} key={s.id}>
                                <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 2, height: '100%' }}>
                                    <Typography variant="subtitle2" fontWeight={800} color="primary.main" mb={1.5} noWrap>
                                        {s.name}
                                    </Typography>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} sx={{ bgcolor: alpha(theme.palette.primary.light, 0.05), p: 1, borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Lead Time</Typography>
                                        <Chip
                                            label={s.deliveryDays ? `${s.deliveryDays} Days` : 'N/A'}
                                            size="small"
                                            color={s.deliveryDays && s.deliveryDays <= 7 ? 'success' : s.deliveryDays && s.deliveryDays <= 14 ? 'warning' : 'default'}
                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                        />
                                    </Box>
                                    {/* Per-item delivery days from matrix */}
                                    <Stack spacing={0.5} mt={1.5}>
                                        {items.slice(0, 5).map(item => {
                                            const cell = matrix[item.id]?.[s.id];
                                            return cell ? (
                                                <Box key={item.id} display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120, fontSize: '0.65rem' }}>{item.name}</Typography>
                                                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem' }}>
                                                        {cell.deliveryDays ? `${cell.deliveryDays}d` : '—'}
                                                    </Typography>
                                                </Box>
                                            ) : null;
                                        })}
                                        {items.length > 5 && (
                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', mt: 1, display: 'block' }}>
                                                +{items.length - 5} more items...
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </TabPanel>

                {/* TAB 2: Payment Terms */}
                <TabPanel value={tabValue} index={2}>
                    <SupplierComparisonTable
                        suppliers={suppliers}
                        rows={[
                            {
                                label: 'Payment Terms',
                                render: (s) => <Typography variant="body2" fontWeight={500}>{s.paymentTerms || 'No payment terms specified'}</Typography>
                            },
                            {
                                label: 'Currency',
                                render: (s) => <Typography variant="body2" fontWeight={600} color="warning.main">{s.currency || 'INR'}</Typography>
                            }
                        ]}
                    />
                </TabPanel>

                {/* TAB 3: Quality & Warranty */}
                <TabPanel value={tabValue} index={3}>
                    <SupplierComparisonTable
                        suppliers={suppliers}
                        rows={[
                            {
                                label: 'Warranty',
                                render: (s) => <Typography variant="body2" fontWeight={500}>{s.warranty || 'N/A'}</Typography>
                            },
                            {
                                label: 'Technical Score',
                                render: (s) => {
                                    const score = Number(s.technicalScore);
                                    return score > 0 ? (
                                        <Typography variant="body2" fontWeight={700} color="info.main">{score.toFixed(2)}</Typography>
                                    ) : (
                                        <Typography variant="caption" color="text.disabled">Not Configured</Typography>
                                    );
                                }
                            },
                            {
                                label: 'Commercial Score',
                                render: (s) => {
                                    const score = Number(s.commercialScore);
                                    return score > 0 ? (
                                        <Typography variant="body2" fontWeight={700} color="success.main">{score.toFixed(2)}</Typography>
                                    ) : (
                                        <Typography variant="caption" color="text.disabled">Not Configured</Typography>
                                    );
                                }
                            }
                        ]}
                    />
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', fontStyle: 'italic', display: 'block', mt: 1, px: 1 }}>
                        Configure scores in PP_QUOTE_COMPARISON_SCORE to enable quality evaluation.
                    </Typography>
                </TabPanel>

                {/* TAB 4: Documents */}
                <TabPanel value={tabValue} index={4}>
                    <Box sx={{ py: 3, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, borderRadius: 2 }}>
                        <IconFile size={32} color={theme.palette.text.disabled} />
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Quotation document attachments will appear here when available.
                        </Typography>
                    </Box>
                </TabPanel>

                {/* TAB 5: Notes */}
                <TabPanel value={tabValue} index={5}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <Typography variant="subtitle2" fontWeight={600} mb={1}>Comparison Remarks</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                placeholder="Record supplier justification, price negotiation notes, delivery concerns, quality concerns, or management remarks..."
                                value={remarks}
                                onChange={(e) => onRemarksChange?.(e.target.value)}
                                disabled={isLocked}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.85rem' } }}
                                inputProps={{ maxLength: 1000 }}
                                helperText={`${(remarks || '').length} / 1000`}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">Guidance</Typography>
                            <Stack spacing={1}>
                                {['Supplier justification', 'Price negotiation notes', 'Delivery concerns', 'Quality concerns', 'Management remarks'].map(hint => (
                                    <Box key={hint} display="flex" alignItems="center" gap={0.8}>
                                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled', flexShrink: 0 }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{hint}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Grid>
                    </Grid>
                </TabPanel>

            </Box>
        </Box>
    );
}
