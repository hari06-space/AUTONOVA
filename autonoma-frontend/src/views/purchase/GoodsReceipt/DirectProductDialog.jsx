import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Box, CircularProgress, IconButton, Checkbox
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'utils/axios';
import BOSDataTable from 'ui-component/bos/BOSDataTable';
import BOSTextField from 'ui-component/bos/BOSTextField';

const DirectProductDialog = ({ open, onClose, onAddItems }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (open) {
            fetchProducts();
        } else {
            setItems([]);
            setSelectedIds([]);
            setSearchQuery('');
        }
    }, [open]);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/master/npd/product-master/list');
            // Assuming response.data is an array of products
            setItems(response.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedIds(filteredItems.map(item => item.id));
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

    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(i => 
            (i.itemCode || '').toLowerCase().includes(q) || 
            (i.itemName || '').toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    const columns = useMemo(() => [
        {
            id: 'select',
            label: (
                <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < filteredItems.length}
                    checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
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
        { id: 'itemCode', label: 'Item Code', minWidth: 120 },
        { id: 'itemName', label: 'Item Name', minWidth: 200 },
        { id: 'uom', label: 'UOM', minWidth: 80 },
        { id: 'hsnCode', label: 'HSN Code', minWidth: 100 }
    ], [filteredItems, selectedIds]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">Select Direct Items</Typography>
                    <Box display="flex" gap={2} alignItems="center">
                        <BOSTextField 
                            size="small" 
                            placeholder="Search items..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
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
                ) : filteredItems.length === 0 ? (
                    <Box p={3} textAlign="center">
                        <Typography>No products found.</Typography>
                    </Box>
                ) : (
                    <BOSDataTable
                        id="grn-direct-product-dialog-table"
                        columns={columns}
                        data={filteredItems}
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

export default DirectProductDialog;
