import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Box, CircularProgress, IconButton, Checkbox
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'utils/axios';
import BOSDataTable from 'ui-component/bos/BOSDataTable';

const PendingPoItemsDialog = ({ open, onClose, supplierId, onAddItems }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open && supplierId) {
            fetchPendingItems();
        } else {
            setItems([]);
            setSelectedIds([]);
        }
    }, [open, supplierId]);

    const fetchPendingItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/v1/purchase-order/pending-items/supplier/${supplierId}`);
            setItems(response.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch pending PO items');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedIds(items.map(item => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (event, id) => {
        if (event.target.checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id));
        }
    };

    const handleAdd = () => {
        const selectedItems = items.filter(item => selectedIds.includes(item.id));
        onAddItems(selectedItems);
        onClose();
    };

    const columns = useMemo(() => [
        {
            id: 'select',
            label: (
                <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < items.length}
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={handleSelectAll}
                />
            ),
            minWidth: 50,
            render: (row) => (
                <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onChange={(e) => handleSelectOne(e, row.id)}
                />
            )
        },
        { id: 'sourceDocumentNo', label: 'PO No', minWidth: 120 },
        { id: 'itemCode', label: 'Item Code', minWidth: 120 },
        { id: 'itemName', label: 'Item Name', minWidth: 200 },
        { id: 'uom', label: 'UOM', minWidth: 80 },
        { id: 'hsnCode', label: 'HSN Code', minWidth: 100 },
        { id: 'taxPercent', label: 'GST %', minWidth: 80, align: 'right' },
        { id: 'pendingQty', label: 'Pending Qty', minWidth: 100, align: 'right' }
    ], [items, selectedIds]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">Select PO Items</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, height: '60vh' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box p={3} textAlign="center">
                        <Typography color="error">{error}</Typography>
                    </Box>
                ) : items.length === 0 ? (
                    <Box p={3} textAlign="center">
                        <Typography>No pending PO items found for this supplier.</Typography>
                    </Box>
                ) : (
                    <BOSDataTable
                        id="grn-pending-po-items-dialog-table"
                        columns={columns}
                        data={items}
                        disablePagination
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button 
                    onClick={handleAdd} 
                    variant="contained" 
                    color="primary"
                    disabled={selectedIds.length === 0}
                >
                    Add Selected ({selectedIds.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PendingPoItemsDialog;
