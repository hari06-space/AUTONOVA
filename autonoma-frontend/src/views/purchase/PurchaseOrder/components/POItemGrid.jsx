import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, IconButton, TextField, Tooltip, Paper, useTheme, alpha, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, Chip, TableFooter, MenuItem, Radio, Stack } from '@mui/material';
import { Inventory2, InfoOutlined } from '@mui/icons-material';
import { IconX, IconCalendarEvent } from '@tabler/icons-react';
import { BOSDataTable, BOSTextField, BOSAutocomplete, errorStyle } from 'ui-component/bos';
import { useMasterDataStore } from 'store/useMasterDataStore';
import { API_BASE } from 'utils/api-constants';
import autonomaLogo from 'assets/images/autonoma-logo.png';
import { getCompanyImageUrl } from 'utils/upload-helper';

const getDisplayImage = (url, companyLogo, autonomaLogo) => {
    if (url) return url.startsWith('http') ? url : `${API_BASE}/files${url}`;
    if (companyLogo) return companyLogo;
    return autonomaLogo;
};

export default function POItemGrid({ formData, setFormData, isReadOnly, errors }) {
    const theme = useTheme();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [hsnMap, setHsnMap] = useState({});
    const [companyLogo, setCompanyLogo] = useState('');
    const [uoms, setUoms] = useState([]);
    const [selectedScheduleItemIndex, setSelectedScheduleItemIndex] = useState(null);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { default: axios } = await import('utils/axios');
                const [prodRes, hsnRes, compRes, uomRes] = await Promise.all([
                    axios.get('/api/master/npd/product-master/list').catch(() => ({ data: [] })),
                    axios.get('/api/admin/hsn-codes').catch(() => ({ data: [] })),
                    axios.get('/api/company-profile/all').catch(() => ({ data: [] })),
                    axios.get('/api/master/admin/uom').catch(() => ({ data: [] }))
                ]);
                setProducts(prodRes.data || []);
                const map = {};
                (hsnRes.data || []).forEach(h => {
                    map[h.hsnCode] = h;
                });
                setHsnMap(map);
                setUoms(uomRes.data ? uomRes.data.filter(u => u.status === 'Active' || u.status === 'ACTIVE' || !u.status) : []);
                
                if (compRes.data && compRes.data.length > 0 && compRes.data[0].logoFileName) {
                    setCompanyLogo(getCompanyImageUrl(compRes.data[0].logoFileName));
                }
            } catch (err) {
                console.error('Failed to fetch data', err);
            }
        };
        fetchData();
    }, []);

    const gstType = formData?.gstType || 'INTRA_STATE';

    // Auto-populate GST percentages from HSN map if item taxes are 0/missing
    useEffect(() => {
        if (Object.keys(hsnMap).length > 0 && formData?.items?.length > 0) {
            let changed = false;
            const updated = formData.items.map(item => {
                const hsn = hsnMap[item.hsnCode] || {};
                const cgst = Number(item.cgstPer ?? 0) || Number(hsn.cgstPer || 0);
                const sgst = Number(item.sgstPer ?? 0) || Number(hsn.sgstPer || 0);
                const igst = Number(item.igstPer ?? 0) || Number(hsn.igstPer || 0);
                
                if ((!Number(item.cgstPer) && !Number(item.sgstPer) && !Number(item.igstPer) && (hsn.cgstPer || hsn.igstPer)) || (!Number(item.taxAmount) && (cgst || sgst || igst))) {
                    changed = true;
                    const tax = gstType === 'INTRA_STATE' ? (cgst + sgst) : igst;
                    const lineAmt = Number(item.qty || 0) * Number(item.unitPrice || 0);
                    const discAmt = lineAmt * Number(item.discountPercent || 0) / 100;
                    const afterDisc = lineAmt - discAmt;
                    const taxAmt = afterDisc * tax / 100;
                    return {
                        ...item,
                        cgstPer: cgst,
                        sgstPer: sgst,
                        igstPer: igst,
                        taxAmount: taxAmt.toFixed(2),
                        netAmount: (afterDisc + taxAmt).toFixed(2)
                    };
                }
                return item;
            });
            if (changed) {
                setFormData(f => ({ ...f, items: updated }));
            }
        }
    }, [hsnMap, formData?.items?.length, gstType]);

    const uomOptions = useMemo(() => {
        const list = uoms.map(u => {
            const val = u.uomCode || u.uomName || u.name || u.uom;
            return { value: val, label: val };
        });
        (formData?.items || []).forEach(item => {
            if (item.uom && !list.some(o => o.value === item.uom)) {
                list.push({ value: item.uom, label: item.uom });
            }
        });
        return list;
    }, [uoms, formData?.items]);

    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState([]);

    const handleToggleProductSelect = (id) => {
        setSelectedProductIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleAddSelectedProducts = () => {
        const selectedProductsList = products.filter(p => selectedProductIds.includes(p.id));
        const newItems = [...(formData?.items || [])];

        if (activeRowIndex !== null && newItems[activeRowIndex] && !newItems[activeRowIndex].itemId) {
            newItems.splice(activeRowIndex, 1);
        }

        let addedCount = 0;
        selectedProductsList.forEach(product => {
            const isDuplicate = newItems.some(t => String(t.itemId) === String(product.id));
            if (!isDuplicate) {
                const hsn = hsnMap[product.hsnCode] || {};
                const cgst = hsn.cgstPer || 0;
                const sgst = hsn.sgstPer || 0;
                const igst = hsn.igstPer || 0;
                let calculatedDueDate = null;
                const lTime = parseInt(product.leadTime || product.leadTimeDays || product.leadTimeMax || 0, 10);
                if (!isNaN(lTime) && lTime > 0) {
                    const d = new Date();
                    d.setDate(d.getDate() + lTime);
                    calculatedDueDate = d.toISOString().split('T')[0];
                }

                newItems.push({
                    itemId: product.id,
                    itemName: product.itemName || product.itemCode || '',
                    itemCode: product.itemCode || '',
                    uom: product.uom || '',
                    dueDate: calculatedDueDate,
                    hsnCode: product.hsnCode || '',
                    hsnDescription: product.hsnDescription || hsn.description || '',
                    imageUrl: product.productImage || product.photo || '',
                    qty: 1,
                    unitPrice: 0,
                    discountPercent: 0,
                    cgstPer: cgst,
                    sgstPer: sgst,
                    igstPer: igst,
                    taxAmount: 0,
                    netAmount: 0
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            setFormData(f => ({ ...f, items: newItems }));
        }
        setProductDialogOpen(false);
        setSelectedProductIds([]);
    };

    const productColumns = useMemo(() => [
        {
            id: 'checkbox',
            label: 'Select',
            minWidth: 80,
            align: 'center',
            render: (row) => (
                <Checkbox
                    checked={selectedProductIds.includes(row.id)}
                    onChange={(e) => {
                        e.stopPropagation();
                        handleToggleProductSelect(row.id);
                    }}
                    sx={{ p: 0 }}
                />
            )
        },
        { id: 'index', label: 'Sl.No', minWidth: 60, align: 'center' },
        {
            id: 'productImage',
            label: 'Image',
            minWidth: 80,
            align: 'center',
            render: (row) => {
                let imgSrc = autonomaLogo;
                if (row.productImage) {
                    imgSrc = row.productImage.startsWith('http') ? row.productImage : `${API_BASE}/files${row.productImage}`;
                } else if (companyLogo) {
                    imgSrc = companyLogo;
                }
                
                return (
                    <Tooltip
                        title={<img src={imgSrc} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }} />}
                        placement="right"
                        componentsProps={{ tooltip: { sx: { bgcolor: 'background.paper', boxShadow: theme.shadows[5], p: 1, border: '1px solid', borderColor: 'divider' } } }}
                    >
                        <Avatar variant="rounded" src={imgSrc} sx={{ width: 40, height: 40, cursor: 'pointer', bgcolor: theme.palette.mode === 'dark' ? '#333' : '#f1f5f9' }} />
                    </Tooltip>
                );
            }
        },
        { id: 'itemCode', label: 'Item Code', minWidth: 100 },
        { id: 'itemName', label: 'Item Name', minWidth: 200 },
        { id: 'itemCategory', label: 'Category', minWidth: 120 },
        { id: 'uom', label: 'UOM', minWidth: 80 }
    ], [selectedProductIds, companyLogo]);

    const filteredProducts = useMemo(() => {
        let list = products;
        
        // Filter out already added items
        const addedItemIds = (formData?.items || []).map(item => String(item.itemId)).filter(id => id && id !== 'undefined' && id !== 'null');
        if (addedItemIds.length > 0) {
            list = list.filter(p => !addedItemIds.includes(String(p.id)));
        }

        if (!productSearch) return list;
        const lower = productSearch.toLowerCase();
        return list.filter(p =>
            (p.itemName && p.itemName.toLowerCase().includes(lower)) ||
            (p.itemCode && p.itemCode.toLowerCase().includes(lower)) ||
            (p.itemCategory && p.itemCategory.toLowerCase().includes(lower))
        );
    }, [products, productSearch, formData?.items]);

    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const updated = [...(prev?.items || [])];
            if (!updated[index]) return prev;

            if (typeof field === 'object' && field !== null) {
                updated[index] = { ...updated[index], ...field };
            } else {
                updated[index] = { ...updated[index], [field]: value };
                const currentGstType = prev?.gstType || gstType;
                if (currentGstType === 'INTRA_STATE') {
                    if (field === 'cgstPer') {
                        updated[index].sgstPer = value;
                    } else if (field === 'sgstPer') {
                        updated[index].cgstPer = value;
                    }
                }
            }
            
            if (field === 'itemId' || (typeof field === 'object' && field.itemId !== undefined)) {
                const itemIdVal = typeof field === 'object' ? field.itemId : value;
                const selectedItem = itemOptions.find(i => i.value === itemIdVal);
                if (selectedItem) {
                    const productRef = products.find(p => String(p.id) === String(selectedItem.value)) || {};
                    let calculatedDueDate = null;
                    const lTime = parseInt(productRef.leadTime || productRef.leadTimeDays || productRef.leadTimeMax || selectedItem.leadTime || selectedItem.leadTimeMax || 0, 10);
                    if (!isNaN(lTime) && lTime > 0) {
                        const d = new Date();
                        d.setDate(d.getDate() + lTime);
                        calculatedDueDate = d.toISOString().split('T')[0];
                    }

                    updated[index].itemName = selectedItem.productName;
                    updated[index].itemCode = selectedItem.productCode;
                    updated[index].uom = selectedItem.uomName || selectedItem.uom || '';
                    updated[index].dueDate = calculatedDueDate;
                    updated[index].hsnCode = selectedItem.hsnCode || '';
                    updated[index].hsnDescription = selectedItem.hsnDescription || '';
                    updated[index].imageUrl = selectedItem.productImage || '';
                }
            }

            // Recalculate net
            const qty = parseFloat(updated[index].qty || 0);
            const price = parseFloat(updated[index].unitPrice || 0);
            const disc = parseFloat(updated[index].discountPercent || 0);
            
            const cgst = parseFloat(updated[index].cgstPer || 0);
            const sgst = parseFloat(updated[index].sgstPer || 0);
            const igst = parseFloat(updated[index].igstPer || 0);
            const currentGstType = prev?.gstType || gstType;
            const tax = currentGstType === 'INTRA_STATE' ? (cgst + sgst) : igst;
            
            const lineAmt = qty * price;
            const discAmt = lineAmt * disc / 100;
            const afterDisc = lineAmt - discAmt;
            const taxAmt = afterDisc * tax / 100;
            
            updated[index].taxAmount = taxAmt.toFixed(2);
            updated[index].netAmount = (afterDisc + taxAmt).toFixed(2);
            return { ...prev, items: updated };
        });
    };

    const addItem = () => {
        setFormData(f => ({ ...f, items: [...(f.items || []), { itemId: null, itemName: '', itemCode: '', uom: '', dueDate: null, qty: 1, unitPrice: 0, discountPercent: 0, cgstPer: 0, sgstPer: 0, igstPer: 0, taxAmount: 0, netAmount: 0 }] }));
    };

    const removeItem = (index) => {
        setFormData(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
    };

    const editableInputStyles = {
        '& .MuiInputBase-input': { 
            py: 0.5, 
            px: 1,
            bgcolor: isReadOnly ? 'transparent' : alpha(theme.palette.primary.light, 0.1),
            borderRadius: 1
        }
    };
    
    const editableInputRightStyles = {
        '& .MuiInputBase-input': { 
            textAlign: 'right', 
            py: 0.5, 
            px: 1,
            bgcolor: isReadOnly ? 'transparent' : alpha(theme.palette.primary.light, 0.1),
            borderRadius: 1
        }
    };

    const summary = useMemo(() => {
        return (formData?.items || []).reduce((acc, item) => {
            acc.qty += parseFloat(item.qty || 0);
            acc.taxAmount += parseFloat(item.taxAmount || 0);
            acc.netAmount += parseFloat(item.netAmount || 0);
            return acc;
        }, { qty: 0, taxAmount: 0, netAmount: 0 });
    }, [formData?.items]);

    return (
        <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} borderBottom={`1px solid ${theme.palette.divider}`}>
                <Typography variant="overline" color="primary" fontWeight={700} display="flex" alignItems="center" gap={1}>
                    LINE ITEMS
                    <Chip size="small" label={(formData?.items || []).length} color="primary" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600 }} />
                </Typography>
                <Box display="flex" gap={1}>
                    {selectedScheduleItemIndex !== null && (
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            disableElevation
                            startIcon={<IconCalendarEvent size={18} />}
                            onClick={() => {
                                const selectedItem = formData.items[selectedScheduleItemIndex];
                                if (selectedItem?.id || selectedItem?.itemId) {
                                    // If row has an ID it means it was saved. If not, it might just be the product ID (itemId). 
                                    // Let's pass the row id or product id (itemCode won't work perfectly for mapping, but we can pass whatever we have).
                                    // Ideally, we pass the saved order details ID. But wait, `formData.id` is the PO id. 
                                    navigate(`/purchase/po-schedule/entry?poId=${formData.id}&itemId=${selectedItem.id || selectedItem.itemId}`);
                                }
                            }}
                        >
                            Create Schedule
                        </Button>
                    )}
                    {!isReadOnly && (
                        <Button size="small" variant="contained" disableElevation startIcon={<Inventory2 fontSize="small" />} onClick={() => setProductDialogOpen(true)}>
                            Add Item
                        </Button>
                    )}
                </Box>
            </Box>

            <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ minWidth: 40, p: 1, bgcolor: theme.palette.grey[50] }}>#</TableCell>
                            <TableCell sx={{ minWidth: 200, p: 1, pl: '68px', bgcolor: theme.palette.grey[50] }}>ITEM *</TableCell>
                            <TableCell sx={{ minWidth: 80, p: 1, bgcolor: theme.palette.grey[50] }}>UOM</TableCell>
                            <TableCell align="right" sx={{ minWidth: 100, p: 1, bgcolor: theme.palette.grey[50] }}>QTY *</TableCell>
                            <TableCell sx={{ minWidth: 130, p: 1, bgcolor: theme.palette.grey[50] }}>DUE DATE *</TableCell>
                            <TableCell sx={{ minWidth: 120, p: 1, bgcolor: theme.palette.grey[50] }}>WARRANTY</TableCell>
                            <TableCell align="right" sx={{ minWidth: 120, p: 1, bgcolor: theme.palette.grey[50] }}>UNIT PRICE *</TableCell>
                            <TableCell align="right" sx={{ minWidth: 80, p: 1, bgcolor: theme.palette.grey[50] }}>DISC %</TableCell>
                            {gstType === 'INTRA_STATE' ? (
                                <>
                                    <TableCell align="right" sx={{ minWidth: 70, p: 1, bgcolor: theme.palette.grey[50] }}>CGST % *</TableCell>
                                    <TableCell align="right" sx={{ minWidth: 70, p: 1, bgcolor: theme.palette.grey[50] }}>SGST % *</TableCell>
                                </>
                            ) : (
                                <TableCell align="right" sx={{ minWidth: 70, p: 1, bgcolor: theme.palette.grey[50] }}>IGST % *</TableCell>
                            )}
                            <TableCell align="right" sx={{ minWidth: 120, p: 1, bgcolor: theme.palette.grey[50] }}>TAX AMT</TableCell>
                            <TableCell align="right" sx={{ minWidth: 120, p: 1, bgcolor: theme.palette.grey[50] }}>LINE TOTAL</TableCell>
                            {!isReadOnly && <TableCell align="center" sx={{ p: 1, bgcolor: theme.palette.grey[50] }}>ACT</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(formData?.items || []).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={gstType === 'INTRA_STATE' ? 13 : 12} align="center" sx={{ py: 8 }}>
                                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                        <Typography variant="h6" color="text.secondary">No Line Items Added</Typography>
                                        <Typography variant="body2" color="text.secondary">Add items to create the Purchase Order</Typography>
                                        {!isReadOnly && (
                                            <Button variant="outlined" startIcon={<Inventory2 fontSize="small" />} onClick={() => setProductDialogOpen(true)}>
                                                Add Item
                                            </Button>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            (formData?.items || []).map((item, i) => {
                                const isSaved = !!item.id;
                                const isPoApproved = ['APPROVED', 'RELEASED', 'VERIFIED'].includes(formData?.statusName?.toUpperCase());
                                const canSelect = isSaved && isPoApproved;
                                return (
                                <TableRow 
                                    key={i} 
                                    hover 
                                    selected={selectedScheduleItemIndex === i}
                                    onClick={(e) => {
                                        if (!canSelect) return;
                                        if (['INPUT', 'BUTTON', 'SVG', 'PATH'].includes(e.target.tagName.toUpperCase())) return;
                                        setSelectedScheduleItemIndex(selectedScheduleItemIndex === i ? null : i);
                                    }}
                                    sx={{ '& td': { borderBottom: `1px solid ${theme.palette.divider}` }, cursor: canSelect ? 'pointer' : 'default' }}
                                >
                                    <TableCell sx={{ p: 1 }}>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Radio
                                                checked={selectedScheduleItemIndex === i}
                                                onChange={() => canSelect && setSelectedScheduleItemIndex(i)}
                                                disabled={!canSelect}
                                                size="small"
                                                sx={{ p: 0 }}
                                            />
                                            <span>{i + 1}</span>
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ p: 1 }}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Tooltip
                                                title={<img src={getDisplayImage(item.imageUrl, companyLogo, autonomaLogo)} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }} />}
                                                placement="right"
                                                componentsProps={{ tooltip: { sx: { bgcolor: 'background.paper', boxShadow: theme.shadows[5], p: 1, border: '1px solid', borderColor: 'divider' } } }}
                                            >
                                                <Avatar variant="rounded" src={getDisplayImage(item.imageUrl, companyLogo, autonomaLogo)} sx={{ width: 48, height: 48, boxShadow: theme.shadows[1], bgcolor: '#fff', '& img': { objectFit: 'contain' }, cursor: 'pointer' }} />
                                            </Tooltip>
                                            <Box flex={1}>
                                                {isReadOnly || item.sourceDocumentNo ? (
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <Typography variant="body2" fontWeight={700} color="text.primary">{item.itemName || item.itemCode || 'Select Item...'}</Typography>
                                                        {item.sourceDocumentNo && (
                                                            <Tooltip title={`Source: ${item.sourceDocumentNo} | Rank: ${item.rank || 'N/A'}`} arrow>
                                                                <InfoOutlined fontSize="small" color="primary" sx={{ cursor: 'pointer', fontSize: 16 }} />
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ minWidth: 200, mb: 0.5 }}>
                                                        <BOSTextField
                                                            fullWidth
                                                            value={item.itemName || item.itemCode || item.itemId || ''}
                                                            placeholder="Click to select product..."
                                                            onClick={() => {
                                                                setActiveRowIndex(i);
                                                                setProductDialogOpen(true);
                                                            }}
                                                            InputProps={{ readOnly: true }}
                                                            error={!!errors?.items?.[i]?.itemId}
                                                            sx={{ cursor: 'pointer', '& .MuiOutlinedInput-root': { cursor: 'pointer', bgcolor: 'background.paper' }, ...(errors?.items?.[i]?.itemId ? { animation: 'shake 0.5s' } : {}) }}
                                                            className={errors?.items?.[i]?.itemId ? 'bos-error-field' : ''}
                                                            size="small"
                                                        />
                                                    </Box>
                                                )}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                                                    {item.itemCode && (
                                                        <Typography variant="caption" display="block">
                                                            <span style={{ fontWeight: 600, color: theme.palette.primary.main, border: `1px solid ${theme.palette.primary.main}`, padding: '1px 4px', borderRadius: '4px' }}>{item.itemCode}</span>
                                                        </Typography>
                                                    )}
                                                    {item.hsnCode && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            <span style={{ fontWeight: 600, color: theme.palette.error.main, border: `1px solid ${theme.palette.error.main}`, padding: '1px 4px', borderRadius: '4px' }}>HSN: {item.hsnCode}</span>
                                                        </Typography>
                                                    )}
                                                </Box>
                                                {(item.sourceDocumentNo || item.isNegotiated) && (
                                                    <Box display="flex" gap={1} mt={0.5}>
                                                        {item.sourceDocumentNo && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: theme.palette.grey[100], px: 0.5, borderRadius: 1 }}>
                                                                {item.sourceDocumentNo}
                                                            </Typography>
                                                        )}
                                                        {item.isNegotiated && (
                                                            <Tooltip title="Price finalized through Quote Negotiation" arrow>
                                                                <Typography variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: theme.palette.warning.light, color: theme.palette.warning.dark, px: 0.5, borderRadius: 1, fontWeight: 600 }}>
                                                                    Negotiated
                                                                </Typography>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ p: 1 }}>
                                        <BOSAutocomplete
                                            size="small"
                                            value={item.uom || null}
                                            options={uomOptions}
                                            onChange={v => handleItemChange(i, 'uom', v?.value ?? v)}
                                            disabled={isReadOnly}
                                            sx={{ minWidth: 120, ...(errors?.items?.[i]?.uom ? { animation: 'shake 0.5s' } : {}) }}
                                            className={errors?.items?.[i]?.uom ? 'bos-error-field' : ''}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ p: 1 }}>
                                        <TextField size="small" type="number" value={item.qty || ''} sx={{ width: 80, ...editableInputRightStyles, ...(errors?.items?.[i]?.qty ? { animation: 'shake 0.5s' } : {}) }}
                                            error={!!errors?.items?.[i]?.qty}
                                            onChange={e => handleItemChange(i, 'qty', e.target.value)} disabled={isReadOnly} variant="outlined" className={errors?.items?.[i]?.qty ? 'bos-error-field' : ''} />
                                    </TableCell>
                                    <TableCell sx={{ p: 1 }}>
                                        <TextField size="small" type="date" value={item.dueDate ? (item.dueDate.length > 10 ? item.dueDate.split('T')[0] : item.dueDate) : ''} sx={{ ...editableInputStyles, ...(errors?.items?.[i]?.dueDate ? { animation: 'shake 0.5s' } : {}) }}
                                            error={!!errors?.items?.[i]?.dueDate}
                                            onChange={e => handleItemChange(i, 'dueDate', e.target.value || null)} disabled={isReadOnly} variant="outlined" className={errors?.items?.[i]?.dueDate ? 'bos-error-field' : ''} />
                                    </TableCell>
                                    <TableCell sx={{ p: 1 }}>
                                        <TextField size="small" value={item.warrantyTerms ?? ''} sx={editableInputStyles}
                                            onChange={e => handleItemChange(i, 'warrantyTerms', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1 Year" variant="outlined" />
                                    </TableCell>
                                    <TableCell align="right" sx={{ p: 1 }}>
                                        <TextField size="small" type="number" value={item.unitPrice ?? ''} sx={{ width: 100, ...editableInputRightStyles, ...(errors?.items?.[i]?.unitPrice ? { animation: 'shake 0.5s' } : {}) }}
                                            error={!!errors?.items?.[i]?.unitPrice}
                                            onChange={e => handleItemChange(i, 'unitPrice', e.target.value)} disabled={isReadOnly} variant="outlined" className={errors?.items?.[i]?.unitPrice ? 'bos-error-field' : ''} />
                                    </TableCell>
                                    <TableCell align="right" sx={{ p: 1 }}>
                                        <TextField size="small" type="number" value={item.discountPercent ?? ''} sx={{ width: 70, ...editableInputRightStyles }}
                                            onChange={e => handleItemChange(i, 'discountPercent', e.target.value)} disabled={isReadOnly} variant="outlined" />
                                    </TableCell>
                                    {gstType === 'INTRA_STATE' ? (
                                        <>
                                             <TableCell align="right" sx={{ p: 1 }}>
                                                <TextField size="small" type="number" value={item.cgstPer ?? ''} sx={{ width: 70, ...editableInputRightStyles, ...(errors?.items?.[i]?.cgstPer ? { animation: 'shake 0.5s' } : {}) }}
                                                    error={!!errors?.items?.[i]?.cgstPer}
                                                    onChange={e => handleItemChange(i, 'cgstPer', e.target.value)} disabled={isReadOnly} variant="outlined" className={errors?.items?.[i]?.cgstPer ? 'bos-error-field' : ''} />
                                            </TableCell>
                                            <TableCell align="right" sx={{ p: 1 }}>
                                                <TextField size="small" type="number" value={item.sgstPer ?? ''} sx={{ width: 70, ...editableInputRightStyles, ...(errors?.items?.[i]?.sgstPer ? { animation: 'shake 0.5s' } : {}) }}
                                                    error={!!errors?.items?.[i]?.sgstPer}
                                                    onChange={e => handleItemChange(i, 'sgstPer', e.target.value)} disabled={isReadOnly} variant="outlined" className={errors?.items?.[i]?.sgstPer ? 'bos-error-field' : ''} />
                                            </TableCell>
                                        </>
                                    ) : (
                                        <TableCell align="right" sx={{ p: 1 }}>
                                            <TextField size="small" type="number" value={item.igstPer ?? ''} sx={{ width: 70, ...editableInputRightStyles, ...(errors?.items?.[i]?.igstPer ? { animation: 'shake 0.5s' } : {}) }}
                                                error={!!errors?.items?.[i]?.igstPer}
                                                onChange={e => handleItemChange(i, 'igstPer', e.target.value)} disabled={isReadOnly} variant="outlined" className={errors?.items?.[i]?.igstPer ? 'bos-error-field' : ''} />
                                        </TableCell>
                                    )}
                                    <TableCell align="right" sx={{ p: 1, color: 'text.secondary' }}>
                                        {Number(item.taxAmount || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ p: 1, fontWeight: 700, color: theme.palette.primary.main }}>
                                        {Number(item.netAmount || 0).toFixed(2)}
                                    </TableCell>
                                    {!isReadOnly && (
                                        <TableCell align="center" sx={{ p: 1 }}>
                                            <IconButton size="small" color="error" onClick={() => removeItem(i)} sx={{ p: 0.5 }}>
                                                <IconX size={18} />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                    {(formData?.items || []).length > 0 && (
                        <TableFooter>
                            <TableRow sx={{ '& td': { position: 'sticky', bottom: 0, zIndex: 2, bgcolor: theme.palette.grey[100], fontWeight: 700, borderTop: `2px solid ${theme.palette.divider}`, borderBottom: 'none' } }}>
                                <TableCell colSpan={4} align="right">TOTAL</TableCell>
                                <TableCell align="right">{summary.qty.toFixed(2)}</TableCell>
                                <TableCell colSpan={gstType === 'INTRA_STATE' ? 5 : 4}></TableCell>
                                <TableCell align="right" sx={{ color: 'text.secondary' }}>{summary.taxAmount.toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ color: theme.palette.primary.main, fontSize: '1.1rem' }}>{summary.netAmount.toFixed(2)}</TableCell>
                                {!isReadOnly && <TableCell></TableCell>}
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </TableContainer>

            <Dialog open={productDialogOpen} onClose={() => { setProductDialogOpen(false); setSelectedProductIds([]); }} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, height: '80vh' } }}>
                <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" color="inherit">Select Product</Typography>
                    <BOSTextField
                        placeholder="Search products..."
                        size="small"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        sx={{
                            width: 250,
                            '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.9)' }
                        }}
                    />
                </DialogTitle>
                <DialogContent sx={{ p: 0, bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                    <BOSDataTable
                        columns={productColumns}
                        data={filteredProducts}
                        onClickRow={(row, e, idx) => handleToggleProductSelect(row.id)}
                        selectedRowId={selectedProductIds}
                        sx={{ height: '100%', flexGrow: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => { setProductDialogOpen(false); setSelectedProductIds([]); }} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
                    <Button onClick={handleAddSelectedProducts} variant="contained" color="primary" sx={{ borderRadius: 2 }} disabled={selectedProductIds.length === 0}>Add Selected ({selectedProductIds.length})</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
