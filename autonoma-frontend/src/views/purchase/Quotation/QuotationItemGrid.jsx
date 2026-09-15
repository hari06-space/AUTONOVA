import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, TextField, Typography, useTheme, IconButton, Box, Button, Avatar, Tooltip, MenuItem } from '@mui/material';
import { useState } from 'react';
import MainCard from 'ui-component/cards/MainCard';
import useQuotationStore from 'store/useQuotationStore';
import { IconTrendingDown, IconTrendingUp, IconTrash, IconCalendarEvent } from '@tabler/icons-react';
import autonovaLogo from 'assets/images/autonova-logo.png';
import { API_BASE } from 'utils/api-constants';

const getDisplayImage = (url, autonovaLogo) => {
    if (url) return url.startsWith('http') ? url : `${API_BASE}/files${url}`;
    return autonovaLogo;
};

const QuotationItemGrid = ({ isReadOnly, errors = {}, setErrors }) => {
    const theme = useTheme();
    const { currentQuotation, updateQuotationDetail, removeQuotationDetail } = useQuotationStore();
    const [quickFillDate, setQuickFillDate] = useState('');

    if (!currentQuotation || !currentQuotation.details) return null;

    const handleQuickFillDeliveryDate = () => {
        if (!quickFillDate) return;
        currentQuotation.details.forEach((_, idx) => {
            updateQuotationDetail(idx, 'deliveryDate', quickFillDate);
            if (setErrors) {
                setErrors(prev => ({ ...prev, [`deliveryDate_${idx}`]: null }));
            }
        });
    };

    const renderTrendIcon = (currentPrice, lastPrice) => {
        if (!lastPrice || lastPrice === 0) return <Typography variant="caption" color="textSecondary">-</Typography>;
        if (currentPrice > lastPrice) return <IconTrendingUp color={theme.palette.error.main} size={18} />;
        if (currentPrice < lastPrice) return <IconTrendingDown color={theme.palette.success.main} size={18} />;
        return <Typography variant="caption" color="textSecondary">Same</Typography>;
    };

    return (
        <MainCard stretch={false} content={false} sx={{ 
            borderRadius: 3, 
            boxShadow: theme.shadows[1],
            '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                display: 'none',
                WebkitAppearance: 'none',
                margin: 0,
            },
            '& input[type=number]': {
                MozAppearance: 'textfield',
            }
        }}>
            <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 4, height: 14, bgcolor: 'primary.main', borderRadius: 1, mr: 1 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                        Item Specifications {currentQuotation?.details ? `(${currentQuotation.details.length})` : ''}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {!isReadOnly && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="600" color="textSecondary">
                                Quick Fill Delivery Date:
                            </Typography>
                            <TextField
                                type="date"
                                size="small"
                                value={quickFillDate}
                                onChange={(e) => setQuickFillDate(e.target.value)}
                                sx={{ width: 140, '& .MuiInputBase-input': { py: 0.75 } }}
                            />
                            <Button 
                                variant="outlined" 
                                size="small" 
                                startIcon={<IconCalendarEvent size={16} />} 
                                onClick={handleQuickFillDeliveryDate}
                                disabled={!quickFillDate}
                                sx={{ textTransform: 'none' }}
                            >
                                Apply to All
                            </Button>
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'action.hover', p: 0.75, px: 2, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Item Value : 
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} color="primary.main" sx={{ ml: 1, minWidth: '80px', textAlign: 'right' }}>
                            ₹ {currentQuotation.details.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0).toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>#</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', minWidth: 350 }}>ITEM *</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>UOM</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">RFQ QTY</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">UNIT PRICE</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">LPP</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">TREND</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">DISC %</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">DISC AMT</TableCell>
                            {(currentQuotation.gstType || 'INTRA_STATE') === 'INTRA_STATE' ? (
                                <>
                                    <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">CGST %</TableCell>
                                    <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">SGST %</TableCell>
                                </>
                            ) : (
                                <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">IGST %</TableCell>
                            )}
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">TAX AMT</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="right">NET AMOUNT</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', minWidth: 150 }}>DELIVERY DATE</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>WARRANTY</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', minWidth: 150 }}>REMARKS</TableCell>
                            {!isReadOnly && <TableCell sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">ACTION</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentQuotation.details.map((row, index) => {
                            const unitPriceError = errors[`unitPrice_${index}`];
                            return (
                                <TableRow key={index} hover sx={{ '& td': { verticalAlign: 'top', py: 1.5 } }}>
                                    <TableCell sx={{ pt: 3.5, fontWeight: 600 }}>{index + 1}</TableCell>
                                    <TableCell sx={{ p: 1 }}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Tooltip
                                                title={<img src={getDisplayImage(row.imageUrl, autonovaLogo)} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }} />}
                                                placement="right"
                                                componentsProps={{ tooltip: { sx: { bgcolor: 'background.paper', boxShadow: theme.shadows[5], p: 1, border: '1px solid', borderColor: 'divider' } } }}
                                            >
                                                <Avatar variant="rounded" src={getDisplayImage(row.imageUrl, autonovaLogo)} sx={{ width: 48, height: 48, boxShadow: theme.shadows[1], bgcolor: '#fff', '& img': { objectFit: 'contain' }, cursor: 'pointer' }} />
                                            </Tooltip>
                                            <Box flex={1}>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Typography variant="body2" fontWeight={700} color="text.primary">{row.itemName || row.itemCode || 'Unknown Item'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                                                    {row.itemCode && (
                                                        <Typography variant="caption" display="block">
                                                            <span style={{ fontWeight: 600, color: theme.palette.primary.main, border: `1px solid ${theme.palette.primary.main}`, padding: '1px 4px', borderRadius: '4px' }}>{row.itemCode}</span>
                                                        </Typography>
                                                    )}
                                                    {row.hsnCode && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            <span style={{ fontWeight: 600, color: theme.palette.error.main, border: `1px solid ${theme.palette.error.main}`, padding: '1px 4px', borderRadius: '4px' }}>HSN: {row.hsnCode}</span>
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ pt: 3 }}>
                                        <TextField
                                            select
                                            size="small"
                                            value={row.uom || ''}
                                            disabled={true}
                                            sx={{ width: '90px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        >
                                            <MenuItem value={row.uom}>{row.uom}</MenuItem>
                                        </TextField>
                                    </TableCell>
                                    <TableCell align="right">{row.qty}</TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            size="small"
                                            id={`unitPrice_${index}`}
                                            type="number"
                                            variant="outlined"
                                            value={row.unitPrice || ''}
                                            disabled={isReadOnly}
                                            error={!!unitPriceError}
                                            onChange={(e) => {
                                                updateQuotationDetail(index, 'unitPrice', e.target.value);
                                                if (setErrors) {
                                                    setErrors(prev => ({ ...prev, [`unitPrice_${index}`]: null }));
                                                }
                                            }}
                                            inputProps={{ style: { textAlign: 'right' } }}
                                            sx={{ width: '120px', ...(unitPriceError ? { animation: 'shake 0.5s' } : {}) }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">{row.lastPurchasePrice || 0}</TableCell>
                                    <TableCell align="right">
                                        {renderTrendIcon(row.unitPrice, row.lastPurchasePrice)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            size="small"
                                            type="number"
                                            variant="outlined"
                                            value={row.discountPercent || ''}
                                            disabled={isReadOnly}
                                            onChange={(e) => updateQuotationDetail(index, 'discountPercent', e.target.value)}
                                            inputProps={{ style: { textAlign: 'right' } }}
                                            sx={{ width: '80px' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="subtitle2">
                                            {Number(((row.qty || 0) * (row.unitPrice || 0)) * ((row.discountPercent || 0) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </Typography>
                                    </TableCell>
                                    {(currentQuotation.gstType || 'INTRA_STATE') === 'INTRA_STATE' ? (
                                        <>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    variant="outlined"
                                                    value={row.cgstPer || ''}
                                                    disabled={isReadOnly}
                                                    onChange={(e) => updateQuotationDetail(index, 'cgstPer', e.target.value)}
                                                    inputProps={{ style: { textAlign: 'right' } }}
                                                    sx={{ width: '70px' }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    variant="outlined"
                                                    value={row.sgstPer || ''}
                                                    disabled={isReadOnly}
                                                    onChange={(e) => updateQuotationDetail(index, 'sgstPer', e.target.value)}
                                                    inputProps={{ style: { textAlign: 'right' } }}
                                                    sx={{ width: '70px' }}
                                                />
                                            </TableCell>
                                        </>
                                    ) : (
                                        <TableCell align="right">
                                            <TextField
                                                size="small"
                                                type="number"
                                                variant="outlined"
                                                value={row.igstPer || ''}
                                                disabled={isReadOnly}
                                                onChange={(e) => {
                                                    updateQuotationDetail(index, 'igstPer', e.target.value);
                                                }}
                                                inputProps={{ style: { textAlign: 'right' } }}
                                                sx={{ width: '70px' }}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell align="right">
                                        <Typography variant="subtitle2">
                                            {Number((row.cgstValue || 0) + (row.sgstValue || 0) + (row.igstValue || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="subtitle1">
                                            {(row.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            id={`deliveryDate_${index}`}
                                            type="date"
                                            variant="outlined"
                                            value={row.deliveryDate ? (row.deliveryDate.includes('T') ? row.deliveryDate.split('T')[0] : row.deliveryDate) : ''}
                                            disabled={isReadOnly}
                                            error={!!errors[`deliveryDate_${index}`]}
                                            onChange={(e) => {
                                                updateQuotationDetail(index, 'deliveryDate', e.target.value);
                                                if (setErrors) {
                                                    setErrors(prev => ({ ...prev, [`deliveryDate_${index}`]: null }));
                                                }
                                            }}
                                            sx={{ width: '130px', ...(errors[`deliveryDate_${index}`] ? { animation: 'shake 0.5s' } : {}) }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            variant="outlined"
                                            value={row.warrantyTerms || ''}
                                            disabled={isReadOnly}
                                            onChange={(e) => updateQuotationDetail(index, 'warrantyTerms', e.target.value)}
                                            placeholder="e.g. 1 Year"
                                            sx={{ width: '100px' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            variant="outlined"
                                            value={row.remarks || ''}
                                            disabled={isReadOnly}
                                            onChange={(e) => updateQuotationDetail(index, 'remarks', e.target.value)}
                                            placeholder="Item remarks..."
                                            fullWidth
                                        />
                                    </TableCell>
                                    {!isReadOnly && (
                                        <TableCell align="center">
                                            <IconButton color="error" size="small" onClick={() => removeQuotationDetail(index)}>
                                                <IconTrash size={18} />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                        {currentQuotation.details.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={15} align="center">No items found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {(currentQuotation.details || []).length > 0 && (
                        <TableFooter>
                            <TableRow sx={{ '& td': { position: 'sticky', bottom: 0, zIndex: 2, bgcolor: theme.palette.grey[100], fontWeight: 700, borderTop: `2px solid ${theme.palette.divider}`, borderBottom: 'none' } }}>
                                <TableCell colSpan={3} align="right">TOTAL</TableCell>
                                <TableCell align="right">
                                    {currentQuotation.details.reduce((sum, row) => sum + (Number(row.qty) || 0), 0).toFixed(2)}
                                </TableCell>
                                <TableCell colSpan={(currentQuotation.gstType || 'INTRA_STATE') === 'INTRA_STATE' ? 7 : 6}></TableCell>
                                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                    {currentQuotation.details.reduce((sum, row) => sum + ((Number(row.cgstValue) || 0) + (Number(row.sgstValue) || 0) + (Number(row.igstValue) || 0)), 0).toFixed(2)}
                                </TableCell>
                                <TableCell align="right" sx={{ color: theme.palette.primary.main, fontSize: '1.1rem' }}>
                                    {currentQuotation.details.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0).toFixed(2)}
                                </TableCell>
                                <TableCell colSpan={isReadOnly ? 3 : 4}></TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </TableContainer>
        </MainCard>
    );
};

export default QuotationItemGrid;
