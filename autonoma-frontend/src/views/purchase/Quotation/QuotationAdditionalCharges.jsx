import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Grid, TextField, Typography, IconButton, Button, Switch, FormControlLabel, MenuItem } from '@mui/material';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import useQuotationStore from 'store/useQuotationStore';
import { useTheme } from '@mui/material/styles';
import axios from 'utils/axios';

const QuotationAdditionalCharges = ({ isReadOnly }) => {
    const theme = useTheme();
    const { currentQuotation, addAdditionalCharge, updateAdditionalCharge, removeAdditionalCharge } = useQuotationStore();
    const [chargeMasters, setChargeMasters] = useState([]);

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

    if (!currentQuotation) return null;

    const charges = currentQuotation.additionalCharges || [];

    return (
        <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
                    Additional Charges
                </Typography>
                {!isReadOnly && (
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<IconPlus size={18} />}
                        onClick={addAdditionalCharge}
                        sx={{ borderRadius: 2 }}
                    >
                        Add Additional Charges
                    </Button>
                )}
            </Box>

            {charges.map((charge, index) => (
                <Card 
                    key={index} 
                    sx={{ 
                        mb: 2, 
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        borderRadius: 2,
                        boxShadow: 'none',
                        position: 'relative'
                    }}
                >
                    <Box 
                        sx={{ 
                            p: 1.5, 
                            borderBottom: '1px solid',
                            borderColor: theme.palette.divider,
                            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafd',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                            ADDITIONAL CHARGE {index + 1}
                        </Typography>
                        {!isReadOnly && (
                            <IconButton color="error" size="small" onClick={() => removeAdditionalCharge(index)}>
                                <IconTrash size={18} />
                            </IconButton>
                        )}
                    </Box>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Select Charge"
                                    value={charge.chargesId || ''}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const chargeMaster = chargeMasters.find(c => c.id === selectedId);
                                        updateAdditionalCharge(index, 'chargesId', selectedId);
                                        if (chargeMaster) {
                                            updateAdditionalCharge(index, 'chargeName', chargeMaster.charges);
                                        }
                                    }}
                                    disabled={isReadOnly}
                                >
                                    {chargeMasters.map(c => (
                                        <MenuItem key={c.id} value={c.id}>{c.charges}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Amount"
                                    type="number"
                                    value={charge.amount || ''}
                                    onChange={(e) => updateAdditionalCharge(index, 'amount', e.target.value)}
                                    disabled={isReadOnly}
                                />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={charge.taxApplicable || false}
                                            onChange={(e) => updateAdditionalCharge(index, 'taxApplicable', e.target.checked)}
                                            disabled={isReadOnly}
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" fontWeight={600}>Apply Tax</Typography>}
                                    sx={{ m: 0 }}
                                />
                            </Grid>
                            {charge.taxApplicable && (
                                <>
                                    <Grid item xs={12} sm={2}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="CGST (%)"
                                            type="number"
                                            value={charge.cgstPer || ''}
                                            onChange={(e) => updateAdditionalCharge(index, 'cgstPer', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="SGST (%)"
                                            type="number"
                                            value={charge.sgstPer || ''}
                                            onChange={(e) => updateAdditionalCharge(index, 'sgstPer', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="IGST (%)"
                                            type="number"
                                            value={charge.igstPer || ''}
                                            onChange={(e) => updateAdditionalCharge(index, 'igstPer', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                    </Grid>
                                </>
                            )}
                            <Grid item xs={12} sm={charge.taxApplicable ? 6 : 4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Total Value"
                                    type="number"
                                    value={Number(charge.totalValue || 0).toFixed(2)}
                                    InputProps={{ readOnly: true }}
                                    sx={{
                                        '& .MuiInputBase-input': { 
                                            fontWeight: 700, 
                                            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafd' 
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default QuotationAdditionalCharges;
