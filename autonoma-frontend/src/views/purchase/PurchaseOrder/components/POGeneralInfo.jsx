import React from 'react';
import { Grid, Typography, Divider, Box, TextField, useTheme } from '@mui/material';
import { BOSTextField, BOSAutocomplete, errorStyle } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import { isInterStateTransaction } from 'utils/taxUtils';

export default function POGeneralInfo({ formData, setFormData, suppliers, divisions, currencies, isReadOnly, errors }) {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', width: '100%', gap: 2, alignItems: 'stretch' }}>
            <MainCard stretch={false} sx={{ flex: 1, borderRadius: 2 }}>
                <Grid container spacing={3}>

                    {/* --- DOCUMENT INFO --- */}
                    <Grid item xs={12} md={2.5}>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={12}>
                                <BOSAutocomplete
                                    label="PO Type *"
                                    value={formData?.poType || null}
                                    options={[
                                        { value: 'OPEN', label: 'OPEN' },
                                        { value: 'ONETIME', label: 'ONETIME' }
                                    ]}
                                    onChange={v => setFormData(f => ({ ...f, poType: v?.value ?? v }))}
                                    disabled={isReadOnly}
                                    sx={errorStyle(errors?.poType)}
                                    className={errors?.poType ? 'bos-error-field' : ''}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Source Document" size="small"
                                    value={formData?.sourceDocumentNo || '-'}
                                    disabled={true} />
                            </Grid>
                        </Grid>
                    </Grid>



                    {/* --- DELIVERY DETAILS --- */}
                    <Grid item xs={12} md={4.5}>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <BOSTextField label="Expected Date *" type="date" value={formData?.expectedDeliveryDate ? String(formData.expectedDeliveryDate).slice(0, 10) : ''}
                                    onChange={e => setFormData(f => ({ ...f, expectedDeliveryDate: e?.target?.value ?? e }))} disabled={isReadOnly} sx={errorStyle(errors?.expectedDeliveryDate)} className={errors?.expectedDeliveryDate ? 'bos-error-field' : ''} />
                            </Grid>

                            <Grid item xs={12} sm={8}>
                                <BOSTextField
                                    label="Delivery Address *"
                                    multiline
                                    rows={2}
                                    value={formData?.deliveryAddress || ''}
                                    onChange={e => setFormData(f => ({ ...f, deliveryAddress: e?.target?.value ?? e }))}
                                    disabled={isReadOnly}
                                    disableRichText
                                    sx={{ width: '400px !important', '& textarea': { resize: 'both !important' }, ...errorStyle(errors?.deliveryAddress) }}
                                    className={errors?.deliveryAddress ? 'bos-error-field' : ''}
                                />
                            </Grid>
                        </Grid>

                    </Grid>



                    {/* --- DELIVERY INFO --- */}
                    <Grid item xs={12} md={4}>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <BOSAutocomplete
                                    label="Supplier *"
                                    value={formData?.supplierId || null}
                                    options={suppliers}
                                    onChange={(v) => {
                                        const val = v?.value ?? v;
                                        const sup = suppliers.find(s => s.value === val);
                                        const isInterState = isInterStateTransaction(sup?.stateCode || sup?.state); // Use stateCode or state depending on the API
                                        setFormData(f => ({
                                            ...f,
                                            supplierId: val,
                                            supplierName: sup?.label || '',
                                            gstType: isInterState ? 'INTER_STATE' : 'INTRA_STATE'
                                        }));
                                    }}
                                    disabled={isReadOnly || ['NEGOTIATION', 'QUOTATION_COMPARISON'].includes(formData?.sourceType)}
                                    sx={errorStyle(errors?.supplierId)}
                                    className={errors?.supplierId ? 'bos-error-field' : ''}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={12}>
                                <BOSTextField label="Supplier Reference No" value={formData?.supplierReferenceNo || ''}
                                    onChange={e => setFormData(f => ({ ...f, supplierReferenceNo: e?.target?.value ?? e }))} disabled={isReadOnly} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={12}>
                                <TextField fullWidth label="Reference Date" type="date" size="small"
                                    value={formData?.supplierReferenceDate ? String(formData.supplierReferenceDate).slice(0, 10) : ''}
                                    onChange={e => setFormData(f => ({ ...f, supplierReferenceDate: e.target.value }))}
                                    InputLabelProps={{ shrink: true }} disabled={isReadOnly} />
                            </Grid>
                            <Grid item xs={6} sm={4} md={2.5}>
                                <BOSAutocomplete
                                    label="Currency *"
                                    value={formData?.currency || null}
                                    options={currencies || []}
                                    onChange={v => setFormData(f => ({ ...f, currency: v?.value ?? v }))}
                                    disabled={isReadOnly}
                                    sx={errorStyle(errors?.currency)}
                                    className={errors?.currency ? 'bos-error-field' : ''}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4} md={2}>
                                <BOSTextField label="Exchange Rate *" type="number" value={formData?.exchangeRate ?? ''}
                                    onChange={e => setFormData(f => ({ ...f, exchangeRate: e?.target?.value ?? e }))} disabled={isReadOnly} sx={errorStyle(errors?.exchangeRate)} className={errors?.exchangeRate ? 'bos-error-field' : ''} />
                            </Grid>
                        </Grid>
                    </Grid>

                </Grid>
            </MainCard>

            <MainCard stretch={false} sx={{ width: { xs: '100%', md: '250px' }, flexShrink: 0, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', justifyContent: 'center' }}>

                    <BOSTextField
                        fullWidth
                        label="PO No"
                        value={formData?.poNo || ''}
                        placeholder="Auto Generated"
                        disabled
                        sx={{ '& .MuiInputBase-input': { fontWeight: 'bold', color: theme.palette.primary.main } }}
                    />
                    <BOSTextField
                        fullWidth
                        type="date"
                        label="PO Date *"
                        InputLabelProps={{ shrink: true }}
                        value={formData?.poDate ? String(formData.poDate).slice(0, 10) : ''}
                        onChange={e => setFormData(f => ({ ...f, poDate: e.target.value }))}
                        disabled={true}
                        sx={errorStyle(errors?.poDate)}
                        className={errors?.poDate ? 'bos-error-field' : ''}
                    />
                </Box>
            </MainCard>
        </Box>
    );
}
