import React, { useState } from 'react';
import { Typography, Button, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, IconButton, Paper, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, Box, Divider } from '@mui/material';
import { IconTrash, IconPlus, IconCheck } from '@tabler/icons-react';
import { BOSTextField } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import { useSnackbar } from 'notistack';
import axios from 'utils/axios';

export default function CustomerOrderScheduleItemGrid({ orderDetails, scheduleItems, setScheduleItems }) {
    const theme = useTheme();
    const { enqueueSnackbar } = useSnackbar();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModalItems, setSelectedModalItems] = useState([]);
    const [deleteModalState, setDeleteModalState] = useState({ open: false, index: null, item: null });

    // Available items from the Customer Order
    const availableItems = orderDetails?.orderDetails || orderDetails?.lineItems || orderDetails?.items || [];

    const promptRemoveRow = (index, item) => {
        setDeleteModalState({ open: true, index, item });
    };

    const confirmRemoveRow = async () => {
        const { index, item } = deleteModalState;
        if (index === null) return;

        if (typeof item.id === 'number') {
            try {
                // Assuming similar endpoint structure
                await axios.delete(`/api/v1/sm/customer-schedules/${item.id}`);
                enqueueSnackbar('Schedule item deleted successfully', { variant: 'success' });
            } catch (error) {
                enqueueSnackbar(`Failed to delete schedule item: ${error?.response?.data?.message || error.message}`, { variant: 'error' });
                setDeleteModalState({ open: false, index: null, item: null });
                return;
            }
        }

        const newList = [...scheduleItems];
        newList.splice(index, 1);
        setScheduleItems(newList);
        setDeleteModalState({ open: false, index: null, item: null });
    };

    const cancelRemoveRow = () => {
        setDeleteModalState({ open: false, index: null, item: null });
    };

    const handleRowChange = (index, field, value) => {
        let finalValue = value;
        const newList = [...scheduleItems];

        // Basic validation for Qty
        if (field === 'scheduledQty') {
            const numValue = parseFloat(value) || 0;
            const currentRow = newList[index];
            const sumOtherRows = newList.reduce((sum, row, i) => {
                if (i !== index && row.orderItemId === currentRow.orderItemId) {
                    return sum + (parseFloat(row.scheduledQty) || 0);
                }
                return sum;
            }, 0);

            const orderQty = parseFloat(currentRow.orderQty) || 0;
            const receiveQty = parseFloat(currentRow.itemReceiveQty) || 0;
            const maxAllowed = orderQty - receiveQty - sumOtherRows;

            if (numValue > maxAllowed && orderDetails?.orderType !== 'BLANKET') {
                enqueueSnackbar(`Scheduled Qty cannot exceed Order Qty. Max allowed is ${maxAllowed}`, { variant: 'error' });
                finalValue = maxAllowed > 0 ? maxAllowed : 0;
            }
        }

        newList[index] = { ...newList[index], [field]: finalValue };
        setScheduleItems(newList);
    };

    const handleOpenModal = () => {
        setSelectedModalItems([]);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleToggleModalItem = (item) => {
        const currentIndex = selectedModalItems.findIndex(i => i.id === item.id);
        const newSelected = [...selectedModalItems];
        if (currentIndex === -1) {
            newSelected.push(item);
        } else {
            newSelected.splice(currentIndex, 1);
        }
        setSelectedModalItems(newSelected);
    };

    const handleAddSelectedItems = () => {
        const newRows = selectedModalItems.map(item => ({
            id: Math.random().toString(36).substr(2, 9),
            orderItemId: item.id,
            itemCode: item.partNo || item.itemCode || item.product?.itemCode || '',
            itemName: item.partName || item.itemName || item.product?.itemName || '',
            uom: item.uom || item.product?.uom || '',
            scheduledDate: '',
            scheduledQty: 0,
            orderQty: item.qty || item.quantity || 0,
            despatchQty: item.despatchQty || item.deliveredQty || 0,
            balanceQty: item.balanceQty ?? ((item.qty || item.quantity || 0) - (item.despatchQty || item.deliveredQty || 0)),
            status: 'Pending'
        }));
        
        setScheduleItems([...scheduleItems, ...newRows]);
        setIsModalOpen(false);
    };

    return (
        <MainCard 
            title="Schedule Items" 
            stretch={true}
            sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
            contentSX={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
            secondary={
                <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={handleOpenModal} disabled={!orderDetails || availableItems.length === 0}>
                    Add Item
                </Button>
            }
        >
            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2, flex: 1, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell width={150}>ITEM NO</TableCell>
                            <TableCell>ITEM NAME</TableCell>
                            <TableCell>UOM</TableCell>
                            <TableCell align="right">ORDER QTY</TableCell>
                            <TableCell width={160}>SCHEDULED DATE</TableCell>
                            <TableCell align="right" width={140}>SCHEDULED QTY</TableCell>
                            <TableCell align="right">RECEIVE QTY</TableCell>
                            <TableCell align="right">BALANCE QTY</TableCell>
                            <TableCell align="center">STATUS</TableCell>
                            <TableCell align="center" width={80}>ACTION</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {scheduleItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No items scheduled. Click "Add Item" to begin.
                                </TableCell>
                            </TableRow>
                        ) : (
                            scheduleItems.map((row, index) => {
                                const totalScheduled = scheduleItems.reduce((sum, r) => {
                                    if (r.orderItemId === row.orderItemId) {
                                        return sum + (parseFloat(r.scheduledQty) || 0);
                                    }
                                    return sum;
                                }, 0);
                                
                                const orderQty = parseFloat(row.orderQty) || 0;
                                const receiveQty = parseFloat(row.itemReceiveQty) || 0;
                                const dynamicBalance = orderQty - receiveQty - totalScheduled;

                                return (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            {row.itemCode}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                            {row.itemName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{row.uom}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>{row.orderQty}</TableCell>
                                    <TableCell>
                                        <BOSTextField
                                            size="small"
                                            type="date"
                                            value={row.scheduledDate || ''}
                                            onChange={(e) => handleRowChange(index, 'scheduledDate', e.target.value)}
                                            fullWidth
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <BOSTextField
                                            size="small"
                                            type="number"
                                            value={row.scheduledQty}
                                            onChange={(e) => handleRowChange(index, 'scheduledQty', e.target.value)}
                                            fullWidth
                                            inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">{receiveQty}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: dynamicBalance > 0 ? theme.palette.primary.main : 'inherit' }}>
                                        {dynamicBalance}
                                    </TableCell>
                                    <TableCell align="center">{row.status}</TableCell>
                                    <TableCell align="center">
                                        <IconButton 
                                            color="error" 
                                            size="small" 
                                            onClick={() => promptRemoveRow(index, row)}
                                        >
                                            <IconTrash size={18} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Items Modal */}
            <Dialog 
                open={isModalOpen} 
                onClose={handleCloseModal} 
                maxWidth="lg" 
                fullWidth 
                PaperProps={{ sx: { borderRadius: 3, height: '85vh', display: 'flex', flexDirection: 'column' } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1, flexShrink: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconPlus color={theme.palette.primary.main} />
                        Select Items to Schedule
                    </Box>
                </DialogTitle>
                <Divider sx={{ flexShrink: 0 }} />
                <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedModalItems.length > 0 && selectedModalItems.length < availableItems.length}
                                            checked={availableItems.length > 0 && selectedModalItems.length === availableItems.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedModalItems([...availableItems]);
                                                } else {
                                                    setSelectedModalItems([]);
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Order No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Item Code</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Item Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>UOM</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }} align="right">Order Qty</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }} align="right">Balance Qty</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {availableItems.map((item) => {
                                    const isSelected = selectedModalItems.findIndex(i => i.id === item.id) !== -1;
                                    const itemCode = item.partNo || item.itemCode || item.product?.itemCode || '';
                                    const itemName = item.partName || item.itemName || item.product?.itemName || '';
                                    const uom = item.uom || item.product?.uom || '';
                                    const orderQty = item.qty || item.quantity || 0;
                                    const despatchQty = item.despatchQty || item.deliveredQty || 0;
                                    const balanceQty = item.balanceQty ?? (orderQty - despatchQty);

                                    return (
                                        <TableRow 
                                            key={item.id} 
                                            hover 
                                            onClick={() => handleToggleModalItem(item)}
                                            role="checkbox"
                                            aria-checked={isSelected}
                                            selected={isSelected}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox checked={isSelected} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{orderDetails?.orderNo}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{itemCode}</TableCell>
                                            <TableCell>{itemName}</TableCell>
                                            <TableCell>{uom}</TableCell>
                                            <TableCell align="right">{orderQty}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: balanceQty > 0 ? 'success.main' : 'error.main' }}>
                                                {balanceQty}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {availableItems.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            No items found in this Customer Order.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseModal} variant="outlined" color="inherit">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleAddSelectedItems} 
                        variant="contained" 
                        disabled={selectedModalItems.length === 0} 
                        startIcon={<IconCheck size={16} />}
                    >
                        Add {selectedModalItems.length > 0 ? `(${selectedModalItems.length}) ` : ''}Items
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteModalState.open} onClose={cancelRemoveRow} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this schedule item?
                        {typeof deleteModalState.item?.id === 'number' && (
                            <Box component="span" sx={{ display: 'block', mt: 1, color: 'error.main', fontWeight: 500 }}>
                                This will also permanently remove the record from the system.
                            </Box>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={cancelRemoveRow} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={confirmRemoveRow} variant="contained" color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
}
