import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';

const FLOW_STEPS = {
    DIRECT: ['Purchase Order'],
    PURCHASE_REQUEST: ['Purchase Request', 'Purchase Order'],
    RFQ: ['RFQ', 'Purchase Order'],
    SUPPLIER_QUOTATION: ['RFQ', 'Quotation', 'Purchase Order'],
    NEGOTIATION: ['RFQ', 'Quotation', 'Negotiation', 'Purchase Order'],
    QUOTATION_COMPARISON: ['Purchase Request', 'RFQ', 'Quotation', 'Negotiation', 'Comparison', 'Purchase Order'],
};

export default function PODocumentFlow({ formData }) {
    const theme = useTheme();
    const flowSteps = FLOW_STEPS[formData?.sourceType] || ['Purchase Order'];

    return (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>
                PROCUREMENT DOCUMENT FLOW
            </Typography>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                {flowSteps.map((step, i) => {
                    const isPoStep = step === 'Purchase Order';
                    const isCompleted = !isPoStep || (formData?.poNo && formData?.poNo !== 'New Purchase Order');
                    const isCurrent = isPoStep;
                    return (
                        <React.Fragment key={step}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                {isCompleted || isCurrent
                                    ? <CheckCircle sx={{ color: isCurrent ? 'primary.main' : 'success.main', fontSize: 18 }} />
                                    : <RadioButtonUnchecked sx={{ color: 'text.disabled', fontSize: 18 }} />
                                }
                                <Box>
                                    <Typography variant="body2" fontWeight={isCurrent ? 700 : 600}
                                        color={isCurrent ? 'primary.main' : isCompleted ? 'text.primary' : 'text.disabled'}>
                                        {step}
                                    </Typography>
                                </Box>
                            </Box>
                            {i < flowSteps.length - 1 && (
                                <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>→</Typography>
                            )}
                        </React.Fragment>
                    );
                })}
            </Box>
        </Paper>
    );
}
