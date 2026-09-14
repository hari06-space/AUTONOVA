import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper } from '@mui/material';
import useRfqStore from 'store/useRfqStore';
import BOSExportButton from 'ui-component/bos/BOSExportButton';
import { LocalPrintshop } from '@mui/icons-material';
import { format } from 'date-fns';

const RfqPrint = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentRfq, fetchRfqById } = useRfqStore();

    useEffect(() => {
        if (id) {
            fetchRfqById(id);
        }
    }, [id, fetchRfqById]);

    const printColumns = useMemo(() => [
        { id: 'itemCode', label: 'Item Code' },
        { id: 'itemName', label: 'Item Description' },
        { id: 'uom', label: 'UOM' },
        { id: 'reqQty', label: 'Req Qty' },
        { id: 'remarks', label: 'Remarks' },
    ], []);

    if (!currentRfq?.id) return <Typography p={3}>Loading...</Typography>;

    const customDetails = [
        { label: 'RFQ No', value: currentRfq.rfqNo },
        { label: 'RFQ Date', value: currentRfq.rfqDate ? format(new Date(currentRfq.rfqDate), 'dd-MM-yyyy') : '' },
        { label: 'Closing Date', value: currentRfq.closingDate ? format(new Date(currentRfq.closingDate), 'dd-MM-yyyy HH:mm') : '' },
        { label: 'Buyer', value: currentRfq.buyerName || '' },
        { label: 'Department', value: currentRfq.departmentName || '' },
        { label: 'PR Ref No', value: currentRfq.prRefNo || '' }
    ];

    const customBottomDetails = [
        { label: 'Commercial Terms', value: currentRfq.commercialTerms || '' },
        { label: 'Internal Notes', value: currentRfq.internalNotes || '' }
    ];

    return (
        <Box p={4} minHeight="80vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <Paper elevation={3} sx={{ p: 6, width: '100%', maxWidth: 700, textAlign: 'center', borderRadius: 4 }}>
                <Typography variant="h3" color="primary" mb={2}>Request For Quotation: {currentRfq.rfqNo}</Typography>
                <Typography variant="body1" color="textSecondary" mb={5}>
                    Click below to preview and export this RFQ as a high-fidelity PDF report with company watermark and signatures.
                </Typography>
                
                <Box display="flex" justifyContent="center" gap={3}>
                    <Button variant="outlined" onClick={() => navigate('/purchase/rfq/list')} sx={{ px: 4, borderRadius: 2 }}>
                        Back to List
                    </Button>
                    <BOSExportButton
                        variant="contained"
                        color="secondary"
                        buttonLabel="Preview & Export PDF"
                        buttonIcon={<LocalPrintshop />}
                        sx={{ px: 4, borderRadius: 2 }}
                        data={currentRfq.transactions || []}
                        columns={printColumns}
                        filename={`RFQ_${currentRfq.rfqNo || id}`}
                        reportTitle={`REQUEST FOR QUOTATION`}
                        customDetails={customDetails}
                        customBottomDetails={customBottomDetails}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default RfqPrint;
