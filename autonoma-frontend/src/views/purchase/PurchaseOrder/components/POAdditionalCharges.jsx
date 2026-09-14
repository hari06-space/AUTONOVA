import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, TextField, Tooltip, Switch, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse, useTheme } from '@mui/material';
import { IconPlus, IconTrash, IconChevronDown, IconChevronUp, IconFileDescription } from '@tabler/icons-react';
import axios from 'utils/axios';

export default function POAdditionalCharges({ formData, setFormData, isReadOnly }) {
    const theme = useTheme();
    const [chargeMasters, setChargeMasters] = useState([]);
    const [chargesExpanded, setChargesExpanded] = useState(true);

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const res = await axios.get('/api/sm/additional-charges');
                setChargeMasters(res.data?.data || res.data || []);
            } catch (err) {
                console.error('Failed to fetch charge masters', err);
            }
        };
        fetchMasters();
    }, []);

    const charges = formData?.additionalCharges || [];
    const totalAdditionalCharges = charges.reduce((sum, c) => sum + Number(c.totalValue || 0), 0);

    const updateAdditionalCharge = (index, fieldOrObj, value) => {
        setFormData(prev => {
            const newCharges = [...(prev.additionalCharges || [])];
            const charge = { ...newCharges[index] };

            let isTaxRecalculationNeeded = false;

            if (typeof fieldOrObj === 'object') {
                Object.assign(charge, fieldOrObj);
                const keys = Object.keys(fieldOrObj);
                if (keys.some(k => ['amount', 'cgstPer', 'sgstPer', 'igstPer', 'taxApplicable'].includes(k))) {
                    isTaxRecalculationNeeded = true;
                }
            } else {
                charge[fieldOrObj] = value;
                if (['amount', 'cgstPer', 'sgstPer', 'igstPer', 'taxApplicable'].includes(fieldOrObj)) {
                    isTaxRecalculationNeeded = true;
                }
            }

            // Recalculate taxes if amounts change
            if (isTaxRecalculationNeeded) {
                const amount = Number(charge.amount || 0);
                if (charge.taxApplicable) {
                    const cPer = Number(charge.cgstPer || 0);
                    const sPer = Number(charge.sgstPer || 0);
                    const iPer = Number(charge.igstPer || 0);

                    charge.cgstValue = (amount * cPer) / 100;
                    charge.sgstValue = (amount * sPer) / 100;
                    charge.igstValue = (amount * iPer) / 100;

                    charge.totalValue = amount + charge.cgstValue + charge.sgstValue + charge.igstValue;
                } else {
                    charge.cgstPer = 0; charge.cgstValue = 0;
                    charge.sgstPer = 0; charge.sgstValue = 0;
                    charge.igstPer = 0; charge.igstValue = 0;
                    charge.totalValue = amount;
                }
            }

            newCharges[index] = charge;
            return { ...prev, additionalCharges: newCharges };
        });
    };

    const addAdditionalCharge = () => {
        setFormData(prev => ({
            ...prev,
            additionalCharges: [...(prev.additionalCharges || []), {
                chargesId: '',
                chargeName: '',
                amount: 0,
                taxApplicable: false,
                cgstPer: 0, cgstValue: 0,
                sgstPer: 0, sgstValue: 0,
                igstPer: 0, igstValue: 0,
                totalValue: 0
            }]
        }));
    };

    const removeAdditionalCharge = (index) => {
        setFormData(prev => {
            const newCharges = [...(prev.additionalCharges || [])];
            newCharges.splice(index, 1);
            return { ...prev, additionalCharges: newCharges };
        });
    };

    return (
        <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
            <Box
                sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', bgcolor: 'primary.main', color: 'white' }}
                onClick={() => setChargesExpanded(!chargesExpanded)}
            >
                <Box display="flex" alignItems="center">
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 0.5, borderRadius: 1, mr: 1.5, display: 'flex', color: 'white' }}>
                        <IconFileDescription size={20} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} color="inherit">
                        Additional Charges
                    </Typography>
                    <Box sx={{ ml: 1.5, bgcolor: 'white', color: 'primary.main', px: 1, py: 0.25, borderRadius: 4, fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {charges.length}
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    {!isReadOnly && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                addAdditionalCharge();
                                if (!chargesExpanded) setChargesExpanded(true);
                            }}
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                                px: 1.5,
                                py: 0.25,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                boxShadow: 'none'
                            }}
                            startIcon={<IconPlus size={16} />}
                        >
                            Add Additional Charge
                        </Button>
                    )}
                    <IconButton size="small" sx={{ color: 'white', p: 0.5 }}>
                        {chargesExpanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                    </IconButton>
                </Box>
            </Box>

            <Collapse in={chargesExpanded}>
                <TableContainer sx={{ maxHeight: 245, minHeight: charges.length === 0 ? 220 : 245, overflowY: 'auto' }}>
                    <Table size="small" stickyHeader>
                        <TableHead sx={{ '& th': { bgcolor: '#f8fafc', zIndex: 2 } }}>
                            <TableRow>
                                <TableCell width="5%" sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell width="30%" sx={{ fontWeight: 700 }}>CHARGE NAME</TableCell>
                                <TableCell width="25%" align="right" sx={{ fontWeight: 700 }}>AMOUNT (₹)</TableCell>
                                <TableCell width="30%" align="center" sx={{ fontWeight: 700 }}>TAXABLE DETAILS</TableCell>
                                {!isReadOnly && <TableCell width="10%" align="right" sx={{ fontWeight: 700 }}></TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {charges.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isReadOnly ? 4 : 5} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" color="text.secondary">No additional charges added.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : charges.map((charge, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            value={charge.chargesId || ''}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                const chargeMaster = chargeMasters.find(c => c.id === selectedId);
                                                updateAdditionalCharge(index, { chargesId: selectedId });
                                                if (chargeMaster) {
                                                    updateAdditionalCharge(index, { chargeName: chargeMaster.charges });
                                                }
                                            }}
                                            disabled={isReadOnly}
                                        >
                                            {chargeMasters.map(c => {
                                                const isSelectedElsewhere = charges.some((ch, i) => i !== index && ch.chargesId === c.id);
                                                return (
                                                    <MenuItem key={c.id} value={c.id} disabled={isSelectedElsewhere}>
                                                        {c.charges}
                                                    </MenuItem>
                                                );
                                            })}
                                        </TextField>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            value={charge.amount === 0 ? '' : charge.amount}
                                            placeholder="0.00"
                                            onChange={(e) => updateAdditionalCharge(index, 'amount', e.target.value)}
                                            disabled={isReadOnly}
                                            inputProps={{ style: { textAlign: 'right' } }}
                                        />
                                        {charge.taxApplicable && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                Tot: ₹ {Number(charge.totalValue || 0).toFixed(2)}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                                            <Tooltip title="Apply Tax">
                                                <Switch
                                                    size="small"
                                                    checked={charge.taxApplicable || false}
                                                    onChange={(e) => updateAdditionalCharge(index, 'taxApplicable', e.target.checked)}
                                                    disabled={isReadOnly}
                                                    color="success"
                                                />
                                            </Tooltip>
                                            {charge.taxApplicable && (
                                                <Box display="flex" gap={0.5}>
                                                    {(formData?.gstType || 'INTRA_STATE') === 'INTRA_STATE' ? (
                                                        <>
                                                            <TextField
                                                                size="small"
                                                                label="C%"
                                                                type="number"
                                                                value={charge.cgstPer === 0 ? '' : charge.cgstPer}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    updateAdditionalCharge(index, { cgstPer: val, sgstPer: val });
                                                                }}
                                                                disabled={isReadOnly}
                                                                sx={{ width: '70px', '& .MuiInputBase-input': { p: 0.5, fontSize: '0.75rem' } }}
                                                                InputLabelProps={{ shrink: true, style: { fontSize: '0.75rem' } }}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                label="S%"
                                                                type="number"
                                                                value={charge.sgstPer === 0 ? '' : charge.sgstPer}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    updateAdditionalCharge(index, { sgstPer: val, cgstPer: val });
                                                                }}
                                                                disabled={isReadOnly}
                                                                sx={{ width: '70px', '& .MuiInputBase-input': { p: 0.5, fontSize: '0.75rem' } }}
                                                                InputLabelProps={{ shrink: true, style: { fontSize: '0.75rem' } }}
                                                            />
                                                        </>
                                                    ) : (
                                                        <TextField
                                                            size="small"
                                                            label="I%"
                                                            type="number"
                                                            value={charge.igstPer === 0 ? '' : charge.igstPer}
                                                            onChange={(e) => updateAdditionalCharge(index, 'igstPer', e.target.value)}
                                                            disabled={isReadOnly}
                                                            sx={{ width: '70px', '& .MuiInputBase-input': { p: 0.5, fontSize: '0.75rem' } }}
                                                            InputLabelProps={{ shrink: true, style: { fontSize: '0.75rem' } }}
                                                        />
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </TableCell>
                                    {!isReadOnly && (
                                        <TableCell align="right">
                                            <IconButton color="error" size="small" onClick={() => removeAdditionalCharge(index)}>
                                                <IconTrash size={18} />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Collapse>
            <Box sx={{ p: 1.5, bgcolor: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                    Total Additional Charges
                </Typography>
                <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                    ₹ {totalAdditionalCharges.toFixed(2)}
                </Typography>
            </Box>
        </Box>
    );
}
