import { useState, useEffect } from 'react';
import { Grid, TextField, Typography, Box, Divider, Button, IconButton, Switch, MenuItem, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Collapse, Autocomplete } from '@mui/material';
import { IconTrash, IconPlus, IconFileDescription, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import useQuotationStore from 'store/useQuotationStore';
import { useTheme } from '@mui/material/styles';
import axios from 'utils/axios';

const CommercialSummary = ({ isReadOnly }) => {
    const theme = useTheme();
    const { currentQuotation, updateQuotationField, addAdditionalCharge, updateAdditionalCharge, removeAdditionalCharge } = useQuotationStore();
    const [chargeMasters, setChargeMasters] = useState([]);
    const [paymentTermsMaster, setPaymentTermsMaster] = useState([]);
    const [deliveryTermsMaster, setDeliveryTermsMaster] = useState([]);
    const [chargesExpanded, setChargesExpanded] = useState(true);

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [resCharges, resPayment, resDelivery] = await Promise.all([
                    axios.get('/api/sm/additional-charges'),
                    axios.get('/api/payment-terms').catch(() => ({ data: [] })),
                    axios.get('/api/delivery-terms').catch(() => ({ data: [] }))
                ]);
                setChargeMasters(resCharges.data?.data || resCharges.data || []);
                setPaymentTermsMaster(resPayment.data?.data || resPayment.data || []);
                setDeliveryTermsMaster(resDelivery.data?.data || resDelivery.data || []);
            } catch (err) {
                console.error('Failed to fetch masters', err);
            }
        };
        fetchMasters();
    }, []);

    if (!currentQuotation) return null;

    const charges = currentQuotation.additionalCharges || [];
    const totalAdditionalCharges = charges.reduce((sum, c) => sum + Number(c.totalValue || 0), 0);

    const renderSummaryRow = (label, value, isBold = false, isTotal = false, isNegative = false) => (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} width="100%">
            <Typography
                variant={isTotal ? 'subtitle1' : 'body2'}
                color={isTotal ? 'primary.main' : 'text.secondary'}
                sx={{ fontWeight: isBold || isTotal ? 700 : 500 }}
            >
                {label}
            </Typography>
            <TextField
                size="small"
                value={isNegative && value > 0 ? `- ₹ ${Number(value).toFixed(2)}` : `₹ ${Number(value || 0).toFixed(2)}`}
                InputProps={{ readOnly: true }}
                sx={{
                    width: '180px',
                    '& .MuiInputBase-input': {
                        textAlign: 'right',
                        fontWeight: isTotal ? 800 : 600,
                        bgcolor: isTotal ? 'action.selected' : 'transparent',
                        color: isNegative && value > 0 ? 'error.main' : (isTotal ? 'primary.main' : 'text.primary'),
                        borderRadius: 1,
                        border: 'none',
                        p: isTotal ? 1 : 0.5
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        border: isTotal ? 'none' : `1px solid ${theme.palette.divider}`
                    }
                }}
            />
        </Box>
    );

    return (
        <Box sx={{
            mt: 1,
            '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                display: 'none',
                WebkitAppearance: 'none',
                margin: 0,
            },
            '& input[type=number]': {
                MozAppearance: 'textfield',
            }
        }}>


            <Grid container spacing={1} sx={{ width: '100 %' }}>

                {/* ── Left Side: Remarks & Additional Charges ── */}
                <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '25%' } }}>

                    <Box mb={2}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Transport Scope"
                            value={currentQuotation.transportScope || 'BUYER'}
                            onChange={(e) => updateQuotationField('transportScope', e.target.value)}
                            disabled={isReadOnly}
                        >
                            <MenuItem value="SUPPLIER">Supplier</MenuItem>
                            <MenuItem value="BUYER">Buyer</MenuItem>
                        </TextField>
                    </Box>

                    <Box mb={2}>
                        <Autocomplete
                            options={paymentTermsMaster}
                            getOptionLabel={(option) => option.termName || option.description || ''}
                            value={paymentTermsMaster.find(t => (t.termName || t.description) === currentQuotation.paymentTerms) || null}
                            onChange={(event, newValue) => updateQuotationField('paymentTerms', newValue ? (newValue.termName || newValue.description) : '')}
                            disabled={isReadOnly}
                            renderInput={(params) => (
                                <TextField {...params} label="Payment Terms" size="small" fullWidth />
                            )}
                        />
                    </Box>

                    <Box mb={2}>
                        <Autocomplete
                            options={deliveryTermsMaster}
                            getOptionLabel={(option) => option.termName || option.description || option.deliveryTerms || ''}
                            value={deliveryTermsMaster.find(t => (t.termName || t.description || t.deliveryTerms) === currentQuotation.deliveryTerms) || null}
                            onChange={(event, newValue) => updateQuotationField('deliveryTerms', newValue ? (newValue.termName || newValue.description || newValue.deliveryTerms) : '')}
                            disabled={isReadOnly}
                            renderInput={(params) => (
                                <TextField {...params} label="Delivery Terms" size="small" fullWidth />
                            )}
                        />
                    </Box>

                    {/* Header Remarks */}
                    <Box mb={3}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            size="small"
                            label="Header Remarks"
                            value={currentQuotation.remarks || ''}
                            onChange={(e) => updateQuotationField('remarks', e.target.value)}
                            placeholder="Enter general remarks for this quotation..."
                            disabled={isReadOnly}
                        />
                    </Box>


                </Grid>

                <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '45%' } }}>
                    {/* Additional Charges Section */}
                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableRow>
                                            <TableCell width="5%" sx={{ fontWeight: 700 }}>#</TableCell>
                                            <TableCell width="30%" sx={{ fontWeight: 700 }}>CHARGE NAME</TableCell>
                                            <TableCell width="25%" align="right" sx={{ fontWeight: 700 }}>AMOUNT (₹)</TableCell>
                                            <TableCell width="30%" align="center" sx={{ fontWeight: 700 }}>TAXABLE DETAILS</TableCell>
                                            {!isReadOnly && <TableCell width="10%" align="right" sx={{ fontWeight: 700 }}></TableCell>}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {charges.map((charge, index) => (
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
                                                        value={charge.amount || ''}
                                                        onChange={(e) => updateAdditionalCharge(index, 'amount', e.target.value)}
                                                        disabled={isReadOnly}
                                                        inputProps={{ style: { textAlign: 'right' } }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, visibility: charge.taxApplicable ? 'visible' : 'hidden' }}>
                                                        Tot: ₹ {Number(charge.totalValue || charge.amount || 0).toFixed(2)}
                                                    </Typography>
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
                                                                {(currentQuotation.gstType || 'INTRA_STATE') === 'INTRA_STATE' ? (
                                                                    <>
                                                                        <TextField
                                                                            size="small"
                                                                            label="C%"
                                                                            type="number"
                                                                            value={charge.cgstPer === 0 ? '' : charge.cgstPer}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                updateAdditionalCharge(index, 'cgstPer', val);
                                                                                updateAdditionalCharge(index, 'sgstPer', val);
                                                                            }}
                                                                            disabled={isReadOnly}
                                                                            sx={{ width: '50px', '& .MuiInputBase-input': { p: 0.5, fontSize: '0.75rem' } }}
                                                                            InputLabelProps={{ shrink: true, style: { fontSize: '0.75rem' } }}
                                                                        />
                                                                        <TextField
                                                                            size="small"
                                                                            label="S%"
                                                                            type="number"
                                                                            value={charge.sgstPer === 0 ? '' : charge.sgstPer}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                updateAdditionalCharge(index, 'sgstPer', val);
                                                                                updateAdditionalCharge(index, 'cgstPer', val);
                                                                            }}
                                                                            disabled={isReadOnly}
                                                                            sx={{ width: '50px', '& .MuiInputBase-input': { p: 0.5, fontSize: '0.75rem' } }}
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
                                                                        sx={{ width: '50px', '& .MuiInputBase-input': { p: 0.5, fontSize: '0.75rem' } }}
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

                        {/* Total Additional Charges Bar */}
                        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                                Total Additional Charges
                            </Typography>
                            <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                                ₹ {totalAdditionalCharges.toFixed(2)}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* ── Right Side: Final Summary Block ── */}
                <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '28%' } }}>
                    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 2px 14px 0 rgba(0,0,0,0.05)' }}>
                        {renderSummaryRow('Subtotal (Items Total)', currentQuotation.subtotal)}
                        {charges.length > 0 && renderSummaryRow('Total Additional Charges', totalAdditionalCharges)}
                        {renderSummaryRow('Item Tax Amount', currentQuotation.taxAmount)}

                        {/* Editable Discount Row */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} width="100%">
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Overall Discount Amount
                            </Typography>
                            <TextField
                                size="small"
                                type="number"
                                disabled={isReadOnly}
                                value={currentQuotation.discountAmount || ''}
                                onChange={(e) => updateQuotationField('discountAmount', e.target.value)}
                                sx={{
                                    width: '150px',
                                    '& .MuiInputBase-input': {
                                        textAlign: 'right',
                                        fontWeight: 600,
                                        color: currentQuotation.discountAmount > 0 ? 'error.main' : 'inherit'
                                    }
                                }}
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {renderSummaryRow('Grand Total', currentQuotation.grandTotal, true, true)}
                    </Box>
                </Grid>

            </Grid>
        </Box>
    );
};

export default CommercialSummary;
