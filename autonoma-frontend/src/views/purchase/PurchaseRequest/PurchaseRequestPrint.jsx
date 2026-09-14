import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper } from '@mui/material';
import usePurchaseRequestStore from '../../../store/usePurchaseRequestStore';
import BOSExportButton from 'ui-component/bos/BOSExportButton';
import { LocalPrintshop } from '@mui/icons-material';

const PurchaseRequestPrint = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentPR, getById } = usePurchaseRequestStore();

    useEffect(() => {
        if (id) {
            getById(id);
        }
    }, [id]);

    const printColumns = useMemo(() => [
        { id: 'itemCode', label: 'Item Code' },
        { id: 'itemName', label: 'Item Description' },
        { id: 'uom', label: 'UOM' },
        { id: 'price', label: 'Price' },
        { id: 'reqQty', label: 'Req Qty' },
        { id: 'reqDate', label: 'Req Date' },
        { id: 'amount', label: 'Amount' },
        { id: 'statusName', label: 'Status' },
        { id: 'remarks', label: 'Remarks' },
    ], []);

    if (!currentPR.id) return <Typography p={3}>Loading...</Typography>;

    return (
        <Box p={4} minHeight="80vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <Paper elevation={3} sx={{ p: 6, width: '100%', maxWidth: 700, textAlign: 'center', borderRadius: 4 }}>
                <Typography variant="h3" color="primary" mb={2}>Purchase Request {currentPR.prNo}</Typography>
                <Typography variant="body1" color="textSecondary" mb={5}>
                    Click below to preview and export this Purchase Request as a high-fidelity PDF report with company watermark and signatures.
                </Typography>
                
                <Box display="flex" justifyContent="center" gap={3}>
                    <Button variant="outlined" onClick={() => navigate('/purchase/pr/list')} sx={{ px: 4, borderRadius: 2 }}>
                        Back to List
                    </Button>
                    <BOSExportButton
                        variant="contained"
                        color="secondary"
                        buttonLabel="Preview & Export PDF"
                        buttonIcon={<LocalPrintshop />}
                        sx={{ px: 4, borderRadius: 2 }}
                        data={currentPR.transactions || []}
                        columns={printColumns}
                        filename={`Purchase_Request_${currentPR.prNo || id}`}
                        reportTitle={`Purchase Request: ${currentPR.prNo || id}`}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default PurchaseRequestPrint;
