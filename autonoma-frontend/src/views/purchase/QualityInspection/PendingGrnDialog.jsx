import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Box, CircularProgress, IconButton, TextField, InputAdornment
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { IconSearch } from '@tabler/icons-react';
import axios from 'utils/axios';
import BOSDataTable from 'ui-component/bos/BOSDataTable';
import useAuth from 'hooks/useAuth';

const PendingGrnDialog = ({ open, onClose, onSelect }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (open && user?.divisionId) {
            setSearchQuery('');
            fetchPendingGrns();
        } else {
            setItems([]);
        }
    }, [open, user?.divisionId]);

    const fetchPendingGrns = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/purchase/grn/search', { params: { size: 100, divisionId: user.divisionId } });
            const data = response.data;
            if (data && data.content) {
                // Filter to show valid GRNs (only OPEN ones that are not closed)
                const validGrns = data.content.filter(g => {
                    const status = g.statusName?.toUpperCase();
                    return status === 'OPEN';
                });
                setItems(validGrns);
            } else {
                setItems([]);
            }
        } catch (err) {
            setError(err?.message || 'Failed to fetch pending GRNs');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        const lowerQ = searchQuery.toLowerCase();
        return items.filter(item => 
            item.grnNo?.toLowerCase().includes(lowerQ) || 
            item.supplierName?.toLowerCase().includes(lowerQ) ||
            item.poNo?.toLowerCase().includes(lowerQ)
        );
    }, [items, searchQuery]);

    const columns = useMemo(() => [
        { id: 'grnNo', label: 'GRN No', minWidth: 150 },
        { id: 'grnDate', label: 'GRN Date', minWidth: 120 },
        { id: 'supplierName', label: 'Supplier Name', minWidth: 200 },
        { id: 'poNo', label: 'PO No', minWidth: 120 },
        { 
            id: 'gateEntryNo', 
            label: 'Gate Entry No', 
            minWidth: 120,
            render: (row) => row.gateEntryNo || row.gateEntryHead?.gateEntryNo || '-'
        },
        { id: 'documentType', label: 'Document Type', minWidth: 130 },
        { id: 'documentNo', label: 'Document No', minWidth: 130 },
        { id: 'documentDate', label: 'Document Date', minWidth: 120 },
        { id: 'billNo', label: 'Bill No', minWidth: 120 },
        { id: 'billDate', label: 'Bill Date', minWidth: 120 },
        { id: 'statusName', label: 'Status', minWidth: 100 }
    ], []);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ pb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">Select Goods Receipt Note (GRN)</Typography>
                    <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 2, width: { xs: '100%', sm: 400 }, mx: 'auto' }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by GRN No, Supplier, or PO No..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconSearch size={20} />
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                            <Typography color="text.secondary">No pending GRNs found matching your search.</Typography>
                        </Box>
                    ) : (
                        <BOSDataTable
                            columns={columns}
                            data={filteredItems}
                            disablePagination
                            sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
                            containerSx={{ flex: 1, overflow: 'auto' }}
                            onDoubleClickRow={(row) => {
                                onSelect(row.id, row.grnNo);
                                onClose();
                            }}
                            editTooltip="Double-click to Select"
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined" color="secondary">Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PendingGrnDialog;
