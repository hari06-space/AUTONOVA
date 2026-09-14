import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, CircularProgress, List, ListItem, 
    ListItemText, InputAdornment 
} from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import axios from 'utils/axios';

const SupplierSearchDialog = ({ open, onClose, onSelect }) => {
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (open) {
            fetchSuppliers();
        }
    }, [open]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/master/vendors?type=supplier`);
            setSuppliers(res.data || []);
        } catch (err) {
            console.error("Failed to load suppliers", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.ledgerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Select Supplier</DialogTitle>
            <DialogContent dividers>
                <TextField 
                    fullWidth 
                    size="small"
                    placeholder="Search supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <IconSearch size={20} />
                            </InputAdornment>
                        )
                    }}
                    sx={{ mb: 2 }}
                />
                
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                        <CircularProgress />
                    </div>
                ) : (
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {filteredSuppliers.map((supplier) => (
                            <ListItem 
                                button 
                                key={supplier.id}
                                onClick={() => {
                                    onSelect(supplier);
                                    onClose();
                                }}
                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                                <ListItemText 
                                    primary={supplier.ledgerName} 
                                    secondary={supplier.gstin ? `GSTIN: ${supplier.gstin}` : 'No GSTIN'} 
                                />
                            </ListItem>
                        ))}
                        {filteredSuppliers.length === 0 && (
                            <ListItem>
                                <ListItemText secondary="No suppliers found." />
                            </ListItem>
                        )}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SupplierSearchDialog;
