import React from 'react';
import { Box, Typography, Button, CircularProgress, Chip, IconButton, Paper, alpha, useTheme, Avatar } from '@mui/material';
import { IconDeviceFloppy, IconArrowLeft, IconSend, IconTruckDelivery, IconPrinter, IconX, IconTrash } from '@tabler/icons-react';
import { Inventory2, ShoppingCart } from '@mui/icons-material';
import { BOSStatusChip } from 'ui-component/bos';
import { useNavigate } from 'react-router-dom';

export default function POHeader({ formData, isNew, isReadOnly, saving, statusName, settings, handleSave, handleSubmit, handleDelete, handleVerify, handleReject }) {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
        <Paper
            elevation={0}
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                p: 1.25,
                mb: 1.5,
                borderRadius: 4,
                bgcolor: 'background.paper',
                backgroundImage: 'none',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease-in-out'
            }}
        >
            <Box display="flex" alignItems="center" gap={2.5}>
                <IconButton onClick={() => navigate('/purchase/po')} sx={{ p: 1.25, bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) } }}>
                    <IconArrowLeft size={20} />
                </IconButton>

                <Avatar
                    variant="rounded"
                    sx={{
                        width: 44,
                        height: 44,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        borderRadius: 2.5
                    }}
                >
                    <ShoppingCart sx={{ fontSize: 24 }} />
                </Avatar>

                <Box>
                    <Typography variant="h3" fontWeight="700" display="flex" alignItems="center" gap={1.5}>
                        {formData?.poNo || 'New Purchase Order'}
                        {formData?.revisionNo > 0 && (
                            <Chip label={`Rev. ${formData.revisionNo}`} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                        {!isNew && <BOSStatusChip status={statusName || 'DRAFT'} />}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                        {!isNew ? 'View or modify the details of this purchase order' : 'Create a new purchase order for suppliers'}
                    </Typography>
                </Box>
            </Box>

            <Box gap={1.5} display="flex" flexWrap="wrap">
                <Button variant="outlined" startIcon={<IconPrinter size={18} />}>Print</Button>
                {!isNew && statusName === 'DRAFT' && handleDelete && (
                    <Button variant="outlined" color="error" startIcon={<IconTrash size={18} />} onClick={handleDelete}>
                        Delete PO
                    </Button>
                )}
                <Button variant="outlined" color="error" startIcon={<IconX size={18} />} onClick={() => navigate('/purchase/po')}>
                    Close
                </Button>

                {!isNew && statusName === 'DRAFT' && (
                    <Button variant="contained" color="success" startIcon={<IconSend size={18} />} onClick={handleSubmit}>
                        Submit
                    </Button>
                )}

                {!isNew && (statusName === 'SUBMITTED' || statusName === 'PENDING APPROVAL') && handleVerify && (
                    <Button variant="contained" color="warning" onClick={handleVerify}>
                        Verify
                    </Button>
                )}

                {!isNew && (statusName === 'SUBMITTED' || statusName === 'PENDING APPROVAL') && handleReject && (
                    <Button variant="contained" color="error" onClick={handleReject}>
                        Reject
                    </Button>
                )}

                {!isReadOnly && (
                    <Button variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <IconDeviceFloppy size={18} />}
                        onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save PO'}
                    </Button>
                )}
                {!isNew && ['VERIFIED', 'APPROVED', 'PARTIALLY RECEIVED'].includes(statusName) && (
                    settings?.enableGateEntry ? (
                        <Button variant="contained" color="warning" startIcon={<IconTruckDelivery size={18} />} onClick={() => navigate('/purchase/gate-entry/entry/new', { state: { poId: formData?.id } })}>
                            Generate Gate Entry
                        </Button>
                    ) : (
                        <Button variant="contained" color="success" startIcon={<Inventory2 sx={{ fontSize: 18 }} />} onClick={() => navigate('/purchase/grn/entry/new', { state: { poId: formData?.id } })}>
                            Generate GRN
                        </Button>
                    )
                )}

            </Box>
        </Paper>
    );
}
