import React from 'react';
import { Box, Typography, Paper, Grid, alpha, useTheme } from '@mui/material';
import { BOSStatusChip } from 'ui-component/bos';

export default function POContextBar({ formData }) {
    const theme = useTheme();

    if (!formData) return null;

    return (
        <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.light, 0.05)
        }}>
            <Grid container spacing={4}>
                {/* DOCUMENT */}
                <Grid item xs={12} md={5}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                        DOCUMENT
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">PO Date</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {formData.poDate ? String(formData.poDate).slice(0, 10) : '-'}
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">Status</Typography>
                            <Box mt={0.25}>
                                <BOSStatusChip status={formData.statusName || 'DRAFT'} />
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">Source</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {formData.sourceType ? formData.sourceType.replace(/_/g, ' ') : 'DIRECT'}
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>

                {/* SOURCE DOCUMENT */}
                <Grid item xs={12} md={3}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                        SOURCE DOCUMENT
                    </Typography>
                    {formData.sourceDocumentNo ? (
                        <Box>
                            <Typography variant="caption" color="primary" fontWeight={700} display="block">
                                [ {formData.sourceType ? formData.sourceType.replace(/_/g, ' ') : 'DOCUMENT'} ]
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>{formData.sourceDocumentNo}</Typography>
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                </Grid>

                {/* SUPPLIER */}
                <Grid item xs={12} md={4}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                        SUPPLIER
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.dark" sx={{ fontSize: '1.1rem' }}>
                        {formData.supplierName || 'Not Selected'}
                    </Typography>
                    {['NEGOTIATION', 'QUOTATION_COMPARISON'].includes(formData?.sourceType) && (
                        <Typography variant="caption" color="success.main" fontWeight={600} display="block" mt={0.5}>
                            ✓ Supplier auto-assigned from {formData?.sourceType?.replace(/_/g, ' ')}
                        </Typography>
                    )}
                </Grid>
            </Grid>
        </Paper>
    );
}
