import React, { useMemo, useEffect } from 'react';
import { Box, Typography, Divider, Grid, TextField, Paper, alpha, useTheme } from '@mui/material';
import POAdditionalCharges from './POAdditionalCharges';
import { BOSAutocomplete, BOSTextField } from 'ui-component/bos';

export default function POTotals({ formData, setFormData, isReadOnly, paymentTerms, deliveryTerms }) {
    const theme = useTheme();

    const totals = useMemo(() => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        (formData?.items || []).forEach(item => {
            const qty = parseFloat(item.qty || 0);
            const price = parseFloat(item.unitPrice || 0);
            const disc = parseFloat(item.discountPercent || 0);

            const cgst = parseFloat(item.cgstPer || 0);
            const sgst = parseFloat(item.sgstPer || 0);
            const igst = parseFloat(item.igstPer || 0);
            const gstType = formData?.gstType || 'INTRA_STATE';
            const tax = gstType === 'INTRA_STATE' ? (cgst + sgst) : igst;

            const lineAmt = qty * price;
            const discAmt = lineAmt * disc / 100;
            const afterDisc = lineAmt - discAmt;
            const taxAmt = afterDisc * tax / 100;

            subtotal += lineAmt;
            totalDiscount += discAmt;
            totalTax += taxAmt;
        });

        const headerDisc = parseFloat(formData?.discountAmount || 0);

        const freight = parseFloat(formData?.freightAmount || 0);
        const packing = parseFloat(formData?.packingAmount || 0);
        const insurance = parseFloat(formData?.insuranceAmount || 0);
        const other = parseFloat(formData?.otherCharges || 0);

        const additionalChargesTotal = (formData?.additionalCharges || []).reduce((sum, c) => sum + Number(c.totalValue || 0), 0);
        const additionalChargesTax = (formData?.additionalCharges || []).reduce((sum, c) => sum + Number(c.cgstValue || 0) + Number(c.sgstValue || 0) + Number(c.igstValue || 0), 0);
        const overallTax = totalTax + additionalChargesTax;

        const roundOff = parseFloat(formData?.roundOff || 0);

        const taxableAmount = subtotal - totalDiscount - headerDisc;
        const grandTotal = taxableAmount + totalTax + freight + packing + insurance + other + additionalChargesTotal + roundOff;

        return { subtotal, totalDiscount, headerDisc, taxableAmount, totalTax, additionalChargesTax, overallTax, freight, packing, insurance, other, additionalChargesTotal, roundOff, grandTotal };
    }, [formData]);

    useEffect(() => {
        if (formData && (totals.grandTotal !== parseFloat(formData.grandTotal || 0) || totals.overallTax !== parseFloat(formData.taxAmount || 0))) {
            setFormData(f => ({ ...f, taxAmount: totals.overallTax, subtotal: totals.taxableAmount, grandTotal: totals.grandTotal }));
        }
    }, [totals.grandTotal, totals.overallTax, totals.taxableAmount]);

    const formatAmt = (val) => Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const editableInputStyles = {
        width: 130,
        '& .MuiInputBase-input': {
            textAlign: 'right',
            py: 0.5,
            px: 1,
            bgcolor: isReadOnly ? 'transparent' : alpha(theme.palette.primary.light, 0.1),
            borderRadius: 1
        }
    };

    return (
        <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            {/* Left side for Transport Scope and Remarks */}
            <Grid item xs={12} md={3} sx={{ width: { xs: '100%', md: '20%' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                    <BOSAutocomplete
                        fullWidth
                        label="Transport Scope"
                        value={formData?.transportScope || 'BUYER'}
                        options={[
                            { value: 'BUYER', label: 'BUYER' },
                            { value: 'SUPPLIER', label: 'SUPPLIER' }
                        ]}
                        onChange={v => setFormData(f => ({ ...f, transportScope: v?.value ?? v }))}
                        disabled={isReadOnly}
                    />
                    <BOSAutocomplete fullWidth
                        label="Payment Terms"
                        value={formData?.paymentTerms || null}
                        options={paymentTerms || []}
                        onChange={v => setFormData(f => ({ ...f, paymentTerms: v?.value ?? v }))}
                        disabled={isReadOnly}
                    />
                    <BOSAutocomplete fullWidth
                        label="Delivery Terms"
                        value={formData?.deliveryTerms || null}
                        options={deliveryTerms || []}
                        onChange={v => setFormData(f => ({ ...f, deliveryTerms: v?.value ?? v }))}
                        disabled={isReadOnly}
                    />
                    <BOSTextField
                        fullWidth
                        label="Remarks"
                        multiline
                        rows={10}
                        value={formData?.remarks || ''}
                        onChange={e => setFormData(f => ({ ...f, remarks: e.target.value }))}
                        disabled={isReadOnly} disableRichText
                        sx={{ '& textarea': { resize: 'both !important' }, '& .MuiInputBase-root': { alignItems: 'flex-start' } }}
                    />
                </Box>
            </Grid>

            {/* Right side group */}
            <Grid item xs={12} md={9} sx={{ width: { xs: '100%', md: '78%' } }}>
                <Grid container spacing={2} justifyContent="flex-end" alignItems="flex-start" sx={{ width: '100%' }}>
                    {/* Middle side for Additional Charges */}
                    <Grid item xs={12} md={7} lg={7} sx={{ width: { xs: '100%', md: '65%' } }}>
                        <POAdditionalCharges formData={formData} setFormData={setFormData} isReadOnly={isReadOnly} />
                    </Grid>

                    {/* Right side for Totals Summary */}
                    <Grid item xs={12} md={5} lg={5} sx={{ width: { xs: '100%', md: '30%' } }}>
                        <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                            <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={1.5}>
                                FINANCIAL SUMMARY
                            </Typography>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                                <Typography variant="body2" fontWeight={600}>{formatAmt(totals.subtotal)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Item Discount (−)</Typography>
                                <Typography variant="body2" fontWeight={600} color="error.main">{formatAmt(totals.totalDiscount)}</Typography>
                            </Box>
                            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Taxable Amount</Typography>
                                <Typography variant="body2" fontWeight={600}>{formatAmt(totals.taxableAmount)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Tax Amount</Typography>
                                <Typography variant="body2" fontWeight={600}>{formatAmt(totals.overallTax)}</Typography>
                            </Box>

                            {totals.freight > 0 && (
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" color="text.secondary">Legacy Freight (+)</Typography>
                                    <Typography variant="body2" fontWeight={600}>{formatAmt(totals.freight)}</Typography>
                                </Box>
                            )}
                            {totals.packing > 0 && (
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" color="text.secondary">Legacy Packing (+)</Typography>
                                    <Typography variant="body2" fontWeight={600}>{formatAmt(totals.packing)}</Typography>
                                </Box>
                            )}
                            {totals.insurance > 0 && (
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" color="text.secondary">Legacy Insurance (+)</Typography>
                                    <Typography variant="body2" fontWeight={600}>{formatAmt(totals.insurance)}</Typography>
                                </Box>
                            )}
                            {totals.other > 0 && (
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" color="text.secondary">Legacy Other (+)</Typography>
                                    <Typography variant="body2" fontWeight={600}>{formatAmt(totals.other)}</Typography>
                                </Box>
                            )}

                            {totals.additionalChargesTotal > 0 && (
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" color="text.secondary">Total Additional Charges (+)</Typography>
                                    <Typography variant="body2" fontWeight={600}>{formatAmt(totals.additionalChargesTotal)}</Typography>
                                </Box>
                            )}

                            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                            {[
                                { label: 'Additional Discount (−)', key: 'discountAmount' },
                                { label: 'Round Off', key: 'roundOff' },
                            ].map(f => (
                                <Box key={f.key} display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
                                    <Typography variant="body2" color="text.secondary">{f.label}</Typography>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={formData?.[f.key] === 0 ? '' : formData?.[f.key]}
                                        placeholder="0.00"
                                        sx={editableInputStyles}
                                        onChange={e => setFormData(fd => ({ ...fd, [f.key]: parseFloat(e.target.value) || 0 }))}
                                        disabled={isReadOnly}
                                        variant="outlined"
                                    />
                                </Box>
                            ))}

                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}
                                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), p: 1.5, borderRadius: 1, borderTop: `2px solid ${theme.palette.primary.main}` }}>
                                <Typography variant="subtitle1" fontWeight={700}>NET PO VALUE</Typography>
                                <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                                    {formData?.currency || 'INR'} {formatAmt(totals.grandTotal)}
                                </Typography>
                            </Box>
                            {formData?.currency && formData?.currency !== 'INR' && (
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1} px={1.5}>
                                    <Typography variant="body2" color="text.secondary" fontWeight={600}>NET VALUE (LC)</Typography>
                                    <Typography variant="body2" fontWeight={700} color="text.secondary">
                                        INR {formatAmt(totals.grandTotal * (parseFloat(formData?.exchangeRate) || 1))}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}
