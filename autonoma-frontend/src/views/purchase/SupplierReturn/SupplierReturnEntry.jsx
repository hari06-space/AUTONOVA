import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Box, Grid, Typography, Button, TextField, 
    Divider, CircularProgress, Alert, Chip, MenuItem
} from '@mui/material';
import { IconDeviceFloppy, IconCheck, IconX, IconPrinter } from '@tabler/icons-react';

import MainCard from 'ui-component/cards/MainCard';
import useAuth from 'hooks/useAuth';
import useSupplierReturnStore from 'store/purchase/useSupplierReturnStore';

// Assuming we have a store/hook to fetch Return Reasons
// For now we'll hardcode or mock the fetch
const REASONS = [
    { id: 1, name: 'Damaged' },
    { id: 2, name: 'Wrong Item' },
    { id: 3, name: 'Wrong Quantity' },
    { id: 4, name: 'Quality Issue' },
    { id: 5, name: 'IQC Rejected' },
    { id: 6, name: 'Specification Mismatch' },
    { id: 7, name: 'Supplier Recall' },
    { id: 8, name: 'Excess Supply' },
    { id: 9, name: 'Other' }
];

const SupplierReturnEntry = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    const { 
        currentReturn, loading, error, 
        getReturnById, generateFromQi, saveReturn, postReturn, cancelReturn, updateTransactionLine 
    } = useSupplierReturnStore();

    useEffect(() => {
        if (id && id !== 'new') {
            getReturnById(id);
        } else if (id === 'new') {
            const queryParams = new URLSearchParams(location.search);
            const qiHeadId = queryParams.get('qiId');
            const returnType = queryParams.get('type');
            
            if (qiHeadId && returnType && user?.divisionId) {
                generateFromQi(user.divisionId, qiHeadId, returnType);
            }
        }
    }, [id, location.search, user, getReturnById, generateFromQi]);

    const handleSave = async () => {
        if (!currentReturn) return;
        try {
            await saveReturn(currentReturn);
            if (id === 'new') {
                navigate('/purchase/supplier-return');
            }
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    const handlePost = async () => {
        if (!currentReturn) return;
        try {
            await postReturn(id);
        } catch (err) {
            console.error("Post failed", err);
        }
    };

    const handleCancel = async () => {
        if (!currentReturn) return;
        try {
            await cancelReturn(id);
        } catch (err) {
            console.error("Cancel failed", err);
        }
    };

    const columns = useMemo(() => {
        const isDraft = currentReturn?.statusName === 'DRAFT' || id === 'new';
        
        return [
            { id: 'itemCode', label: 'Item Code', width: '12%' },
            { id: 'itemName', label: 'Item Name', width: '18%' },
            { id: 'uom', label: 'UOM', width: '5%' },
            { id: 'batchNo', label: 'Batch', width: '10%' },
            { 
                id: 'sourceQty', 
                label: currentReturn?.returnType === 'ACCEPTED_STOCK' ? 'Accepted Qty' : 'Rejected Qty', 
                width: '10%', 
                align: 'right' 
            },
            { id: 'previousReturnedQty', label: 'Prev Return', width: '10%', align: 'right' },
            { 
                id: 'returnableQty', 
                label: 'Returnable', 
                width: '10%', 
                align: 'right',
                render: (val, row) => {
                    const returnable = row.sourceQty - row.previousReturnedQty;
                    return <Typography fontWeight="bold" color="primary">{returnable.toFixed(2)}</Typography>;
                }
            },
            {
                id: 'returnQty',
                label: 'Return Qty',
                width: '10%',
                align: 'right',
                render: (val, row) => {
                    const returnable = row.sourceQty - row.previousReturnedQty;
                    return isDraft ? (
                        <TextField
                            size="small"
                            type="number"
                            value={val}
                            onChange={(e) => {
                                const newQty = parseFloat(e.target.value) || 0;
                                updateTransactionLine(row.id || row.grnTransId, 'returnQty', newQty);
                            }}
                            inputProps={{ 
                                min: 0, 
                                max: returnable, 
                                step: "0.01",
                                style: { textAlign: 'right' }
                            }}
                            error={val > returnable}
                            helperText={val > returnable ? `Max: ${returnable}` : ''}
                            disabled={returnable <= 0}
                        />
                    ) : (
                        <Typography fontWeight="bold">{val}</Typography>
                    )
                }
            },
            {
                id: 'returnReasonId',
                label: 'Reason',
                width: '15%',
                render: (val, row) => (
                    isDraft ? (
                        <TextField
                            select
                            size="small"
                            fullWidth
                            value={val || ''}
                            onChange={(e) => updateTransactionLine(row.id || row.grnTransId, 'returnReasonId', e.target.value)}
                        >
                            {REASONS.map((r) => (
                                <MenuItem key={r.id} value={r.id}>
                                    {r.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    ) : (
                        <Typography>{row.returnReasonName}</Typography>
                    )
                )
            }
        ];
    }, [currentReturn?.statusName, currentReturn?.returnType, id, updateTransactionLine]);

    if (loading && !currentReturn) {
        return <Box p={3} display="flex" justifyContent="center"><CircularProgress /></Box>;
    }

    if (!currentReturn && !loading) {
        return <Alert severity="error">Supplier Return not found or failed to load.</Alert>;
    }

    const isDraft = currentReturn?.statusName === 'DRAFT' || id === 'new';
    const isPosted = currentReturn?.statusName === 'POSTED';
    const isRejectedStock = currentReturn?.returnType === 'REJECTED_STOCK';

    return (
        <MainCard 
            title={`Supplier Return : ${currentReturn?.returnNo || 'NEW'}`}
            pageCode="HA1135"
            sx={{
                '& .MuiCardHeader-root': {
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }
            }}
            secondary={
                <Box display="flex" gap={1}>
                    {isDraft && (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<IconDeviceFloppy />}
                            onClick={handleSave}
                        >
                            Save Draft
                        </Button>
                    )}
                    {(currentReturn?.statusName === 'DRAFT' || currentReturn?.statusName === 'APPROVED') && id !== 'new' && (
                        <Button 
                            variant="contained" 
                            color="success" 
                            startIcon={<IconCheck />}
                            onClick={handlePost}
                        >
                            Post Return
                        </Button>
                    )}
                    {isPosted && (
                        <Button 
                            variant="outlined" 
                            color="error" 
                            startIcon={<IconX />}
                            onClick={handleCancel}
                        >
                            Cancel Return
                        </Button>
                    )}
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        onClick={() => navigate('/purchase/supplier-return')}
                    >
                        Close
                    </Button>
                </Box>
            }
        >
            <Grid container spacing={2}>
                {/* Header Information */}
                <Grid item xs={12}>
                    <Box p={2} bgcolor="grey.50" borderRadius={1} border="1px solid" borderColor="grey.200">
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                                <Typography variant="caption" color="textSecondary">Supplier</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{currentReturn?.supplierName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <Typography variant="caption" color="textSecondary">Source GRN</Typography>
                                <Typography variant="subtitle1">{currentReturn?.grnNo}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <Typography variant="caption" color="textSecondary">Source PO</Typography>
                                <Typography variant="subtitle1">{currentReturn?.poNo}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Typography variant="caption" color="textSecondary">Inventory Type</Typography>
                                <Box mt={0.5}>
                                    <Chip 
                                        label={isRejectedStock ? 'REJECTED STOCK' : 'NORMAL (ACCEPTED) STOCK'} 
                                        color={isRejectedStock ? 'error' : 'primary'}
                                        size="small"
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <Typography variant="caption" color="textSecondary">Status</Typography>
                                <Box mt={0.5}>
                                    <Chip 
                                        label={currentReturn?.statusName || 'DRAFT'} 
                                        color={isPosted ? 'success' : 'default'}
                                        size="small"
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>

                {/* Line Items */}
                <Grid item xs={12}>
                    <Typography variant="h5" mb={2}>Return Items</Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                    {columns.map(col => (
                                        <th key={col.id} style={{ padding: '8px', width: col.width, textAlign: col.align || 'left' }}>
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentReturn?.transactions?.map((row, i) => (
                                    <tr key={row.id || row.grnTransId} style={{ borderBottom: '1px solid #eee' }}>
                                        {columns.map(col => (
                                            <td key={col.id} style={{ padding: '8px', textAlign: col.align || 'left' }}>
                                                {col.render ? col.render(row[col.id], row) : row[col.id]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                </Grid>

                <Grid item xs={12} display="flex" justifyContent="flex-end" mt={2}>
                    <Box textAlign="right" p={2} bgcolor="grey.50" borderRadius={1} minWidth={300}>
                        <Grid container spacing={1}>
                            <Grid item xs={6}><Typography variant="subtitle1">Total Qty:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="h6">{currentReturn?.totalQty?.toFixed(2) || '0.00'}</Typography></Grid>
                            
                            <Grid item xs={6}><Typography variant="subtitle1">Total Amount:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="h6">{currentReturn?.totalAmount?.toFixed(2) || '0.00'}</Typography></Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </MainCard>
    );
};

export default SupplierReturnEntry;
