import React, { useState, useEffect } from 'react';
import { Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme, Autocomplete, MenuItem, TextField } from '@mui/material';
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react';
import { BOSFormSection, BOSTextField } from 'ui-component/bos';
import axios from 'utils/axios';
import { autoUploadFile, getFileDownloadUrl } from 'utils/upload-helper';

const Th = ({ children, align = 'left', minWidth = 120 }) => (
  <TableCell align={align} sx={{ color: '#fff', minWidth, borderRight: '1px solid rgba(255,255,255,0.2)', py: 1, whiteSpace: 'nowrap', fontWeight: 'bold' }}>
    {children}
  </TableCell>
);

const Td = ({ children, align = 'left' }) => (
  <TableCell align={align} sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', p: 0.5 }}>
    {children}
  </TableCell>
);

const InputStyle = {
  '& .MuiInputBase-root': { borderRadius: '20px' },
  '& .MuiInputBase-input': { p: '6px 12px', fontSize: '0.85rem' }
};

const QuotationPartsMatrix = ({ formData, setFormData, isViewOnly, isInterState = false }) => {
  const theme = useTheme();
  const [allProducts, setAllProducts] = useState([]);
  const [uomList, setUomList] = useState([]);
  const [hsnList, setHsnList] = useState([]);

  const initialPartState = {
    partNo: '', name: '', hsnCode: '', model: '', custPartNo: '', uom: 'Nos', unitRate: 0, curStock: 0, reqQty: 0, amount: 0,
    disType: 'N/A', discount: 0, assValue: 0, cgstRate: 0, cgstAmt: 0, sgstRate: 0, sgstAmt: 0, igstRate: 0, igstAmt: 0,
    freightAmt: 0, freightTaxRate: 0, freightTaxAmt: 0, finalAmount: 0, enquiryNo: '',
    oemPartNo: '', capacity: '', additionalComments: '', warranty: '', leadTimeType: 'N/A', leadTimeDays: 0,
    lastQuotedPrice: 0, remarks: '', status: 'OPEN', approvalStatus: 'CREATED'
  };

  useEffect(() => {
    Promise.all([

      axios.get('/api/master/npd/product-master', { skipGlobalAlert: true }).catch(() => ({ data: [] })),
      axios.get('/api/master/admin/uom', { skipGlobalAlert: true }).catch(() => ({ data: [] })),
      axios.get('/api/admin/hsn-codes', { skipGlobalAlert: true }).catch(() => ({ data: [] })),
      axios.get('/api/sm/enquiries', { skipGlobalAlert: true }).catch(() => ({ data: [] }))
    ]).then(([prodRes, uomRes, hsnRes, enqRes]) => {

      setAllProducts(prodRes.data || []);
      setUomList(uomRes.data ? uomRes.data.filter(u => u.status === 'Active' || u.status === 'ACTIVE' || !u.status) : []);
      setHsnList(hsnRes.data || []);
    });
  }, []);

  const handleAddRow = () => {
    const updatedParts = [...(formData.parts || []), { ...initialPartState }];
    setFormData(prev => ({ ...prev, parts: updatedParts }));
  };

  const calculateAmounts = (data) => {
    const qty = parseFloat(data.reqQty) || 0;
    const rate = parseFloat(data.unitRate) || 0;
    const amount = qty * rate;

    let discountAmt = 0;
    const dis = parseFloat(data.discount) || 0;
    if (data.disType === '%') {
      discountAmt = amount * (dis / 100);
    } else if (data.disType === 'Amt') {
      discountAmt = dis;
    }

    const assValue = amount - discountAmt;
    
    const cgstAmt = isInterState ? 0 : assValue * ((parseFloat(data.cgstRate) || 0) / 100);
    const sgstAmt = isInterState ? 0 : assValue * ((parseFloat(data.sgstRate) || 0) / 100);
    const igstAmt = isInterState ? assValue * ((parseFloat(data.igstRate) || 0) / 100) : 0;
    
    const freight = parseFloat(data.freightAmt) || 0;
    const freightTaxAmt = freight * ((parseFloat(data.freightTaxRate) || 0) / 100);

    const finalAmount = assValue + cgstAmt + sgstAmt + igstAmt + freight + freightTaxAmt;

    return {
      ...data,
      amount: amount.toFixed(3),
      assValue: assValue.toFixed(3),
      cgstAmt: cgstAmt.toFixed(3),
      sgstAmt: sgstAmt.toFixed(3),
      igstAmt: igstAmt.toFixed(3),
      freightTaxAmt: freightTaxAmt.toFixed(3),
      finalAmount: finalAmount.toFixed(3)
    };
  };

  const prevIsInterState = React.useRef(isInterState);
  useEffect(() => {
    let needsUpdate = false;
    if (isInterState !== prevIsInterState.current) {
      needsUpdate = true;
      prevIsInterState.current = isInterState;
    }

    if (formData.parts && formData.parts.length > 0) {
      const hasMissingFinalAmount = formData.parts.some(p => p.finalAmount === undefined || p.finalAmount === 0);
      if (hasMissingFinalAmount || needsUpdate) {
        setFormData(prev => {
          const updatedParts = (prev.parts || []).map(p => calculateAmounts(p));
          const totalAmount = updatedParts.reduce((sum, p) => sum + parseFloat(p.finalAmount || 0), 0);
          return { ...prev, parts: updatedParts, totalAmount: totalAmount.toFixed(3) };
        });
      }
    }
  }, [formData.parts, isInterState]);

  const handlePartChange = (index, fieldOrUpdates, value) => {
    setFormData(prev => {
      const updatedParts = [...(prev.parts || [])];
      
      if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
        updatedParts[index] = { ...updatedParts[index], ...fieldOrUpdates };
      } else {
        updatedParts[index] = { ...updatedParts[index], [fieldOrUpdates]: value };
      }
      
      updatedParts[index] = calculateAmounts(updatedParts[index]);

      const totalAmount = updatedParts.reduce((sum, p) => sum + parseFloat(p.finalAmount || 0), 0);
      return { ...prev, parts: updatedParts, totalAmount: totalAmount.toFixed(3) };
    });
  };

  const fetchApplicablePrice = async (index, productId, fallbackPrice, expectedPartNo) => {
    try {
      const customerId = formData.customerId || '';
      const res = await axios.get('/api/sales/price-master/applicable-price', {
        params: { productId, customerId }
      });
      
      setFormData(prev => {
        const updatedParts = [...(prev.parts || [])];
        if (updatedParts[index]?.partNo !== expectedPartNo) return prev; // Abort if user changed partNo

        const fetched = (res.data && res.data > 0) ? res.data : (fallbackPrice || 0);
        updatedParts[index] = { ...updatedParts[index], unitRate: fetched, fetchedPrice: fetched };
        updatedParts[index] = calculateAmounts(updatedParts[index]);
        const totalAmount = updatedParts.reduce((sum, p) => sum + parseFloat(p.finalAmount || 0), 0);
        return { ...prev, parts: updatedParts, totalAmount: totalAmount.toFixed(3) };
      });
    } catch (err) {
      console.error('Failed to fetch applicable price', err);
      setFormData(prev => {
        const updatedParts = [...(prev.parts || [])];
        if (updatedParts[index]?.partNo !== expectedPartNo) return prev; 
        updatedParts[index] = { ...updatedParts[index], unitRate: fallbackPrice || 0, fetchedPrice: fallbackPrice || 0 };
        updatedParts[index] = calculateAmounts(updatedParts[index]);
        const totalAmount = updatedParts.reduce((sum, p) => sum + parseFloat(p.finalAmount || 0), 0);
        return { ...prev, parts: updatedParts, totalAmount: totalAmount.toFixed(3) };
      });
    }
  };

  const handleDeletePart = (index) => {
    const updated = (formData.parts || []).filter((_, i) => i !== index);
    const totalAmount = updated.reduce((sum, p) => sum + parseFloat(p.finalAmount || 0), 0);
    setFormData(prev => ({ ...prev, parts: updated, totalAmount: totalAmount.toFixed(3) }));
  };

  const renderInput = (part, index, field, type = 'text', readOnly = false, width = '100%') => (
    <BOSTextField
      variant="outlined"
      size="small"
      type={type}
      value={part[field] || (type === 'number' ? 0 : '')}
      onChange={(e) => handlePartChange(index, field, e.target.value)}
      disabled={isViewOnly || !formData.customerId || readOnly}
      sx={{ ...InputStyle, width, '& .MuiInputBase-root': { bgcolor: (readOnly || !formData.customerId) ? '#f5f5f5' : '#fff' } }}
      InputLabelProps={{ shrink: false }}
    />
  );

  return (
    <BOSFormSection 
      title="Quotation Parts Specification Matrix" 
      defaultExpanded
      action={
        !isViewOnly && (
          <Button variant="contained" startIcon={<IconPlus />} onClick={handleAddRow} disabled={!formData.customerId} size="small" sx={{ borderRadius: '6px', backgroundColor: '#2196f3', color: '#fff', '&:hover': { backgroundColor: '#1976d2' }, '&.Mui-disabled': { backgroundColor: '#ccc', color: '#666' } }}>
            Add Item
          </Button>
        )
      }
    >
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflowX: 'auto', minHeight: 200, mt: 1 }}>
        <Table size="small" sx={{ minWidth: 3500 }}>
          <TableHead sx={{ bgcolor: '#2196f3' }}>
            <TableRow>
              <Th minWidth={50}>#</Th>
              <Th minWidth={60}>IMAGE</Th>
              <Th minWidth={250}>PART NO</Th>
              <Th minWidth={150}>PART NAME</Th>
              <Th minWidth={120}>HSN CODE</Th>
              <Th minWidth={120}>MODEL</Th>
              <Th minWidth={150}>CUST PART NO</Th>
              <Th minWidth={100}>UOM</Th>
              <Th align="right" minWidth={120}>UNIT RATE</Th>
              <Th align="right" minWidth={100}>CUR.STOCK</Th>
              <Th align="right" minWidth={100}>QTY</Th>
              <Th align="right" minWidth={120}>AMOUNT</Th>
              <Th minWidth={120}>DIS.TYPE</Th>
              <Th align="right" minWidth={100}>DISCOUNT</Th>
              <Th align="right" minWidth={120}>ASS. VALUE</Th>
              
              {!isInterState && (
                <>
                  <Th align="right" minWidth={80}>CGST %</Th>
                  <Th align="right" minWidth={100}>CGST AMT</Th>
                  <Th align="right" minWidth={80}>SGST %</Th>
                  <Th align="right" minWidth={100}>SGST AMT</Th>
                </>
              )}
              {isInterState && (
                <>
                  <Th align="right" minWidth={80}>IGST %</Th>
                  <Th align="right" minWidth={100}>IGST AMT</Th>
                </>
              )}
              
              <Th align="right" minWidth={120}>FREIGHT AMT</Th>
              <Th align="right" minWidth={100}>FREIGHT TAX %</Th>
              <Th align="right" minWidth={100}>FREIGHT TAX AMT</Th>
              <TableCell align="right" sx={{ color: '#fff', minWidth: 150, borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: 'bold' }}>FINAL AMOUNT</TableCell>
              <Th minWidth={120}>ENQUIRY NO</Th>
              <Th minWidth={150}>OEM PART NO</Th>
              <Th minWidth={120}>CAPACITY</Th>
              <Th minWidth={200}>ADDITIONAL COMMENTS</Th>
              <Th minWidth={150}>WARRANTY</Th>
              <Th minWidth={120}>LEAD TIME TYPE</Th>
              <Th minWidth={100}>LEAD TIME</Th>
              <Th align="right" minWidth={120}>LAST QUOTE PRICE</Th>
              <Th minWidth={200}>REMARKS</Th>
              <Th minWidth={100}>STATUS</Th>
              <Th minWidth={120}>APPROVAL STATUS</Th>
              {!isViewOnly && <TableCell align="center" sx={{ color: '#fff', minWidth: 60, position: 'sticky', right: 0, bgcolor: '#2196f3', zIndex: 1, fontWeight: 'bold' }}>ACTIONS</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {(!formData.parts || formData.parts.length === 0) ? (
              <TableRow>
                <TableCell colSpan={32} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No part items added. Click "Add Item" to add a row.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              formData.parts.map((part, index) => (
                <TableRow key={index} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                  <Td>{index + 1}</Td>
                  <Td align="center">
                    {part.imageUrl ? (
                      <Box sx={{ position: 'relative', width: 40, height: 40, margin: 'auto' }}>
                        <img 
                          src={getFileDownloadUrl(part.imageUrl)} 
                          alt="part" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                        {!isViewOnly && (
                          <IconButton size="small" component="label" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'rgba(255,255,255,0.8)' }}>
                            <IconEdit size={12} color="#1976d2" />
                            <input type="file" hidden accept="image/*" onChange={async (e) => {
                               const file = e.target.files[0];
                               if (file) {
                                  try {
                                     const path = await autoUploadFile(file, 'NPD');
                                     handlePartChange(index, 'imageUrl', path);
                                  } catch (err) {
                                     console.error(err);
                                  }
                               }
                            }} />
                          </IconButton>
                        )}
                      </Box>
                    ) : (
                       (!isViewOnly && !!formData.customerId) ? (
                          <IconButton component="label">
                            <IconPlus size={16} color="#aaa" />
                            <input type="file" hidden accept="image/*" onChange={async (e) => {
                               const file = e.target.files[0];
                               if (file) {
                                  try {
                                     const path = await autoUploadFile(file, 'NPD');
                                     handlePartChange(index, 'imageUrl', path);
                                  } catch (err) {
                                     console.error(err);
                                  }
                               }
                            }} />
                          </IconButton>
                       ) : <IconPlus size={16} color="#aaa" />
                    )}
                  </Td>
                  <Td>
                    <Autocomplete
                      options={allProducts}
                      getOptionLabel={(option) => typeof option === 'string' ? option : (option.itemNo || '')}
                      value={allProducts.find(p => p.itemNo === part.partNo) || null}
                      onChange={(e, val) => {
                        if (val) {
                          handlePartChange(index, {
                            partNo: val.itemNo || '',
                            name: val.description || val.partName || val.itemName || '',
                            uom: val.uom || 'Nos',
                            oemPartNo: val.oemPartNo || '',
                            hsnCode: val.hsnCode || '',
                            model: val.modelNo || val.model || '',
                            unitRate: val.sellingRate || val.price || val.unitRate || 0,
                            curStock: val.stockQty || 0,
                            cgstRate: val.cgstRate || 0,
                            sgstRate: val.sgstRate || 0,
                            igstRate: val.igstRate || 0,
                            imageUrl: val.attachments && val.attachments.length > 0 ? (val.attachments[0].path || val.attachments[0].attachmentPath || '') : '',
                            fetchedPrice: val.sellingRate || val.price || val.unitRate || 0
                          });
                          if (val.id) {
                             fetchApplicablePrice(index, val.id, val.sellingRate || val.price || val.unitRate || 0, val.itemNo);
                          }
                        } else {
                          handlePartChange(index, 'partNo', '');
                        }
                      }}
                      disabled={isViewOnly || !formData.customerId}
                      renderInput={(params) => <TextField {...params} variant="outlined" size="small" sx={{ '& .MuiInputBase-root': { borderRadius: '20px', padding: '0px' }, '& .MuiInputBase-input': { p: '6px 12px', fontSize: '0.85rem' }, bgcolor: (!formData.customerId || isViewOnly) ? '#f5f5f5' : '#fff' }} />}
                      sx={{ width: '100%' }}
                    />
                  </Td>
                  <Td>{renderInput(part, index, 'name')}</Td>
                  <Td>
                    {renderInput(part, index, 'hsnCode', 'text', true)}
                  </Td>
                  <Td>{renderInput(part, index, 'model')}</Td>
                  <Td>{renderInput(part, index, 'custPartNo')}</Td>
                  <Td>
                    {allProducts.some(p => p.itemNo === part.partNo) ? (
                      renderInput(part, index, 'uom', 'text', true)
                    ) : (
                      <BOSTextField select value={part.uom || ''} onChange={(e) => handlePartChange(index, 'uom', e.target.value)} size="small" disabled={isViewOnly || !formData.customerId} sx={{ ...InputStyle, width: '100%' }}>
                        {uomList.map(u => {
                           const val = typeof u === 'string' ? u : (u.uomCode || u.code || u.uomName || '');
                           return val ? <MenuItem key={val} value={val}>{val}</MenuItem> : null;
                        })}
                      </BOSTextField>
                    )}
                  </Td>
                  <Td>
                    {(() => {
                       const isReadOnlyPrice = isViewOnly;
                       return renderInput(part, index, 'unitRate', 'number', isReadOnlyPrice);
                    })()}
                  </Td>
                  <Td>{renderInput(part, index, 'curStock', 'number', true)}</Td>
                  <Td>{renderInput(part, index, 'reqQty', 'number')}</Td>
                  <Td>{renderInput(part, index, 'amount', 'number', true)}</Td>
                  <Td>
                    <BOSTextField
                      select
                      value={part.disType}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'N/A') {
                          handlePartChange(index, { disType: val, discount: 0 });
                        } else {
                          handlePartChange(index, 'disType', val);
                        }
                      }}
                      size="small"
                      disabled={isViewOnly || !formData.customerId}
                      sx={{ ...InputStyle, width: '100%' }}
                    >
                      <MenuItem value="N/A">N/A</MenuItem>
                      <MenuItem value="%">%</MenuItem>
                      <MenuItem value="Amt">Amt</MenuItem>
                    </BOSTextField>
                  </Td>
                  <Td>{renderInput(part, index, 'discount', 'number', part.disType === 'N/A')}</Td>
                  <Td>{renderInput(part, index, 'assValue', 'number', true)}</Td>
                  
                  {!isInterState && (
                    <>
                      {/* CGST */}
                      <Td>{renderInput(part, index, 'cgstRate', 'number', true)}</Td>
                      <Td>{renderInput(part, index, 'cgstAmt', 'number', true)}</Td>
                      {/* SGST */}
                      <Td>{renderInput(part, index, 'sgstRate', 'number', true)}</Td>
                      <Td>{renderInput(part, index, 'sgstAmt', 'number', true)}</Td>
                    </>
                  )}
                  {isInterState && (
                    <>
                      {/* IGST */}
                      <Td>{renderInput(part, index, 'igstRate', 'number', true)}</Td>
                      <Td>{renderInput(part, index, 'igstAmt', 'number', true)}</Td>
                    </>
                  )}
                  
                  <Td>{renderInput(part, index, 'freightAmt', 'number')}</Td>
                  {/* Freight Tax */}
                  <Td>{renderInput(part, index, 'freightTaxRate', 'number')}</Td>
                  <Td>{renderInput(part, index, 'freightTaxAmt', 'number', true)}</Td>

                  <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main', borderRight: '1px solid rgba(224, 224, 224, 1)', p: 0.5, bgcolor: '#e3f2fd' }}>
                    {part.finalAmount}
                  </TableCell>
                  
                  <Td>{renderInput(part, index, 'enquiryNo')}</Td>
                  <Td>{renderInput(part, index, 'oemPartNo')}</Td>
                  <Td>{renderInput(part, index, 'capacity')}</Td>
                  <Td>{renderInput(part, index, 'additionalComments')}</Td>
                  <Td>{renderInput(part, index, 'warranty')}</Td>
                  <Td>
                    <BOSTextField
                      select
                      value={part.leadTimeType}
                      onChange={(e) => handlePartChange(index, 'leadTimeType', e.target.value)}
                      size="small"
                      disabled={isViewOnly || !formData.customerId}
                      sx={{ ...InputStyle, width: '100%' }}
                    >
                      <MenuItem value="N/A">N/A</MenuItem>
                      <MenuItem value="Days">Days</MenuItem>
                      <MenuItem value="Weeks">Weeks</MenuItem>
                      <MenuItem value="Months">Months</MenuItem>
                    </BOSTextField>
                  </Td>
                  <Td>{renderInput(part, index, 'leadTimeDays', 'number', part.leadTimeType === 'N/A')}</Td>
                  <Td>{renderInput(part, index, 'lastQuotedPrice', 'number')}</Td>
                  <Td>{renderInput(part, index, 'remarks')}</Td>
                  <Td>{renderInput(part, index, 'status', 'text', true)}</Td>
                  <Td>{renderInput(part, index, 'approvalStatus', 'text', true)}</Td>
                  {!isViewOnly && (
                    <TableCell align="center" sx={{ position: 'sticky', right: 0, bgcolor: 'background.paper', borderLeft: '2px solid #ddd', p: 0.5 }}>
                      <IconButton size="small" color="error" onClick={() => handleDeletePart(index)} disabled={!formData.customerId}>
                        <IconTrash size={16} />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </BOSFormSection>
  );
};

export default QuotationPartsMatrix;
