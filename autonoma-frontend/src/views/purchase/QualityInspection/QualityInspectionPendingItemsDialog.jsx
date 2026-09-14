import React, { useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, Box, TextField, Typography, useTheme, useMediaQuery } from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import BOSDataTable from 'ui-component/bos/BOSDataTable';

export default function QualityInspectionPendingItemsDialog({ open, onClose, pendingItems, onAdd }) {
    const theme = useTheme();
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchText, setSearchText] = useState('');

    const filteredItems = useMemo(() => {
        const itemsWithId = (pendingItems || []).map((item, idx) => ({
            ...item,
            id: `${item.itemCode || item.item_code || ''}_${item.batchNo || item.batch_no || ''}_${idx}`
        }));

        if (!searchText) return itemsWithId;

        const lower = searchText.toLowerCase();
        return itemsWithId.filter(item => {
            const iCode = String(item.itemCode || item.item_code || '');
            const iName = String(item.itemName || item.item_name || '');
            const bNo = String(item.batchNo || item.batch_no || '');
            const gQty = String(item.grnQty || item.grn_qty || '');
            const rQty = String(item.remainingQty || item.remaining_qty || '');
            const uom = String(item.uom || '');
            const hNo = String(item.heatNo || item.heat_no || '');
            const tc = String(item.testCertificate || item.test_certificate || '');
            const tcSrc = String(item.tcSource || item.tc_source || '');
            
            return iCode.toLowerCase().includes(lower) ||
                iName.toLowerCase().includes(lower) ||
                bNo.toLowerCase().includes(lower) ||
                gQty.toLowerCase().includes(lower) ||
                rQty.toLowerCase().includes(lower) ||
                uom.toLowerCase().includes(lower) ||
                hNo.toLowerCase().includes(lower) ||
                tc.toLowerCase().includes(lower) ||
                tcSrc.toLowerCase().includes(lower);
        });
    }, [pendingItems, searchText]);

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedIds(filteredItems.map(item => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleAdd = () => {
        const itemsToAdd = filteredItems.filter(item => selectedIds.includes(item.id));
        onAdd(itemsToAdd);
        setSelectedIds([]);
        onClose();
    };

    const columns = useMemo(() => [
        {
            id: 'select',
            label: (
                <Checkbox
                    checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < filteredItems.length}
                    onChange={handleSelectAll}
                    size="small"
                />
            ),
            minWidth: 50,
            align: 'center',
            disableSort: true,
            render: (row) => {
                return (
                    <Checkbox 
                        checked={selectedIds.includes(row.id)} 
                        onChange={() => handleSelect(row.id)}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                    />
                );
            }
        },
        { id: 'itemCode', label: 'Item Code', minWidth: 100 },
        { id: 'itemName', label: 'Item Name', minWidth: 150 },
        { id: 'batchNo', label: 'Batch No', minWidth: 100 },
        { id: 'grnQty', label: 'GRN Qty', minWidth: 80, align: 'right' },
        { 
            id: 'inspected', 
            label: 'Previous Inspected', 
            minWidth: 100, 
            align: 'right',
            render: (row) => {
                const grn = parseFloat(row.grnQty || row.grn_qty) || 0;
                const bal = parseFloat(row.remainingQty || row.remaining_qty) || 0;
                return grn - bal;
            }
        },
        { 
            id: 'remainingQty', 
            label: 'Balance Qty', 
            minWidth: 80, 
            align: 'right',
            render: (row) => {
                const bal = parseFloat(row.remainingQty || row.remaining_qty) || 0;
                return <Typography fontWeight="bold" color="primary.main">{bal}</Typography>;
            }
        },
        { id: 'uom', label: 'UOM', minWidth: 80 },
        { id: 'heatNo', label: 'Heat No', minWidth: 100 },
        { id: 'testCertificate', label: 'Test Certificate', minWidth: 120 },
        { id: 'tcSource', label: 'TC Source', minWidth: 100 },
    ], [filteredItems, selectedIds]);

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="xl" 
            fullWidth
            PaperProps={{
                sx: { 
                    height: '85vh',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            <DialogTitle sx={{ 
                m: 0, 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider',
                position: 'relative'
            }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>Select Pending Items</Typography>
                
                <Box sx={{ 
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '50%',
                    maxWidth: '600px'
                }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search across all fields..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        InputProps={{
                            startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />,
                            sx: { borderRadius: 2, bgcolor: theme.palette.grey[50] }
                        }}
                    />
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <BOSDataTable
                        columns={columns}
                        rows={filteredItems}
                        dense={true}
                        sx={{ 
                            height: '100%', 
                            minHeight: 'unset',
                            '& .MuiChip-root': { display: 'none' }
                        }}
                        disableDoubleClick={true}
                        onClickRow={(row) => handleSelect(row.id)}
                        selectedRowId={selectedIds}
                    />
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button 
                    onClick={handleAdd} 
                    color="primary" 
                    variant="contained"
                    disabled={selectedIds.length === 0}
                >
                    Add Selected ({selectedIds.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
}
