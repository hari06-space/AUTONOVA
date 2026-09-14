import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Grid, TextField, Typography, Divider, FormControlLabel, Switch, Tooltip, Stack } from '@mui/material';
import { IconInfoCircle } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import useProcurementSettingsStore from 'store/useProcurementSettingsStore';
import useAuth from 'hooks/useAuth';
import { useSnackbar } from 'notistack';

const ProcurementSettings = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { settings, loading, fetchSettings, saveSettings } = useProcurementSettingsStore();
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        weightPrice: '',
        weightDelivery: '',
        weightRating: '',
        weightWarranty: '',
        weightPayment: '',
        poApprovalThreshold: '',
        defaultCurrencyId: '1',
        enableGateEntry: 0,
        requireSecurityApproval: 0,
        requireStoresVerification: 0,
        requireVehiclePhotos: 0,
        requireDriverLicense: 0,
        requireSealVerification: 0,
        requireWeighbridge: 0
    });

    useEffect(() => {
        if (user?.divisionId) {
            fetchSettings(user.divisionId);
        }
    }, [user?.divisionId, fetchSettings]);

    useEffect(() => {
        if (settings) {
            setFormData({
                weightPrice: settings.weightPrice || '40.00',
                weightDelivery: settings.weightDelivery || '20.00',
                weightRating: settings.weightRating || '15.00',
                weightWarranty: settings.weightWarranty || '10.00',
                weightPayment: settings.weightPayment || '15.00',
                poApprovalThreshold: settings.poApprovalThreshold || '10000.00',
                defaultCurrencyId: settings.defaultCurrencyId || '1',
                enableGateEntry: settings.enableGateEntry || 0,
                requireSecurityApproval: settings.requireSecurityApproval || 0,
                requireStoresVerification: settings.requireStoresVerification || 0,
                requireVehiclePhotos: settings.requireVehiclePhotos || 0,
                requireDriverLicense: settings.requireDriverLicense || 0,
                requireSealVerification: settings.requireSealVerification || 0,
                requireWeighbridge: settings.requireWeighbridge || 0
            });
        }
    }, [settings]);

    const handleSave = async () => {
        const total = parseFloat(formData.weightPrice) + 
                      parseFloat(formData.weightDelivery) + 
                      parseFloat(formData.weightRating) + 
                      parseFloat(formData.weightWarranty) + 
                      parseFloat(formData.weightPayment);
                      
        if (total !== 100) {
            enqueueSnackbar(`Total weights must equal 100%. Current total: ${total}%`, { variant: 'error' });
            return;
        }

        if (!user?.divisionId) {
            enqueueSnackbar('Please select a division first', { variant: 'warning' });
            return;
        }

        const payload = { ...formData, divisionId: user.divisionId };
        Object.keys(payload).forEach(key => {
            if (payload[key] === '') {
                payload[key] = null;
            }
        });

        try {
            await saveSettings(payload);
            enqueueSnackbar('Settings updated successfully', { variant: 'success' });
            
            // Dispatch local event for instant UI update in the current tab
            window.dispatchEvent(new CustomEvent('bos-realtime-update', { 
                detail: { entityName: 'ProcurementSettings', action: 'saveSettings' } 
            }));
            
            // Broadcast to other tabs in the same browser via BroadcastChannel
            try {
                const bc = new BroadcastChannel('bos-notifications-leader');
                bc.postMessage({ 
                    type: 'GLOBAL_UPDATE_RECEIVED', 
                    payload: { entityName: 'ProcurementSettings', action: 'saveSettings' } 
                });
                bc.close();
            } catch (bcErr) {
                console.error('[REALTIME_SYNC] Broadcast failed:', bcErr);
            }
        } catch (error) {
            enqueueSnackbar('Failed to update settings', { variant: 'error' });
        }
    };

    return (
        <MainCard title="Purchase Configuration">
            <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Commercial Comparison Weightages</Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    Configure the percentage weights for the dynamic Commercial Comparison Scoring Engine. The total must equal 100%.
                </Typography>
                
                <Grid container spacing={3} mt={2}>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth 
                            label="Price Weight (%)" 
                            type="number" 
                            value={formData.weightPrice} 
                            onChange={(e) => setFormData({...formData, weightPrice: e.target.value})} 
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth 
                            label="Delivery Weight (%)" 
                            type="number" 
                            value={formData.weightDelivery} 
                            onChange={(e) => setFormData({...formData, weightDelivery: e.target.value})} 
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth 
                            label="Supplier Rating Weight (%)" 
                            type="number" 
                            value={formData.weightRating} 
                            onChange={(e) => setFormData({...formData, weightRating: e.target.value})} 
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth 
                            label="Warranty Terms Weight (%)" 
                            type="number" 
                            value={formData.weightWarranty} 
                            onChange={(e) => setFormData({...formData, weightWarranty: e.target.value})} 
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth 
                            label="Payment Terms Weight (%)" 
                            type="number" 
                            value={formData.weightPayment} 
                            onChange={(e) => setFormData({...formData, weightPayment: e.target.value})} 
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="subtitle1" color="primary" gutterBottom>Purchase Operations Settings</Typography>
                <Grid container spacing={3} mt={1}>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth 
                            label="PO Approval Threshold Amount" 
                            type="number" 
                            value={formData.poApprovalThreshold} 
                            onChange={(e) => setFormData({...formData, poApprovalThreshold: e.target.value})} 
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth 
                            label="Default Currency ID" 
                            type="number" 
                            value={formData.defaultCurrencyId} 
                            onChange={(e) => setFormData({...formData, defaultCurrencyId: e.target.value})} 
                            helperText="1 = INR, 2 = USD, etc."
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="subtitle1" color="primary" gutterBottom>Gate Entry Settings</Typography>
                <Grid container spacing={3} mt={1}>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                            control={<Switch checked={formData.enableGateEntry === 1} onChange={(e) => setFormData({...formData, enableGateEntry: e.target.checked ? 1 : 0})} color="primary" />}
                            label="Enable Gate Entry System"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                            control={<Switch checked={formData.requireSecurityApproval === 1} onChange={(e) => setFormData({...formData, requireSecurityApproval: e.target.checked ? 1 : 0})} color="primary" />}
                            label="Require Security Approval"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                            control={<Switch checked={formData.requireStoresVerification === 1} onChange={(e) => setFormData({...formData, requireStoresVerification: e.target.checked ? 1 : 0})} color="primary" />}
                            label="Require Stores Verification"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                            control={<Switch checked={formData.requireVehiclePhotos === 1} onChange={(e) => setFormData({...formData, requireVehiclePhotos: e.target.checked ? 1 : 0})} color="primary" />}
                            label="Require Vehicle Photos"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                            control={<Switch checked={formData.requireDriverLicense === 1} onChange={(e) => setFormData({...formData, requireDriverLicense: e.target.checked ? 1 : 0})} color="primary" />}
                            label={
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <span>Require Driver Details</span>
                                    <Tooltip title="By enabling this, the fields Driver Name, Driver Mobile, Driver Licence No, Licence Expiry, and Emergency Contact become mandatory.">
                                        <IconInfoCircle size={16} style={{ cursor: 'pointer', color: 'gray' }} />
                                    </Tooltip>
                                </Stack>
                            }
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                            control={<Switch checked={formData.requireSealVerification === 1} onChange={(e) => setFormData({...formData, requireSealVerification: e.target.checked ? 1 : 0})} color="primary" />}
                            label="Require Seal Verification"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                            control={<Switch checked={formData.requireWeighbridge === 1} onChange={(e) => setFormData({...formData, requireWeighbridge: e.target.checked ? 1 : 0})} color="primary" />}
                            label="Require Weighbridge"
                        />
                    </Grid>
                </Grid>
            </CardContent>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" color="primary" onClick={handleSave}>
                    Save Settings
                </Button>
            </Box>
        </MainCard>
    );
};

export default ProcurementSettings;
