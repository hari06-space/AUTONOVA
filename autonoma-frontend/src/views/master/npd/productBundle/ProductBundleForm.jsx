import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Switch,
  FormControlLabel,
  InputAdornment,
  useTheme
} from '@mui/material';
import {
  IconTrash,
  IconPlus,
  IconArrowLeft,
  IconDeviceFloppy,
  IconTags,
  IconCoins,
  IconDiscount,
  IconPackages,
  IconListDetails,
  IconSum,
  IconHistory,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSFormSection, BOSTextField, BOSAutocomplete } from 'ui-component/bos';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { autoUploadFiles } from 'utils/upload-helper';

const ProductBundleForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const theme = useTheme();

  const [formData, setFormData] = useState({
    bundleCode: '',
    bundleName: '',
    description: '',
    bundleType: 'Sales Bundle',
    effectiveFrom: '',
    effectiveTo: '',
    status: 'ACTIVE',
    isActive: true,
    details: [],
    isPriceOverridden: false
  });



  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchProducts();
    if (isEdit) {
      fetchBundle(id);
      fetchAuditHistory(id);
    }
  }, [id, isEdit]);

  const fetchAuditHistory = async (bundleId) => {
    try {
      const res = await axios.get(`/api/audit-trail/bundle/${bundleId}`);
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching audit history', err);
    }
  };


  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/master/npd/product-master');
      if (res && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Error fetching products', err);
    }
  };

  const fetchBundle = async (bundleId) => {
    try {
      const res = await axios.get(`/api/product-bundles/${bundleId}`);
      if (res && res.data) {
        const data = res.data;
        if (data.details) {
          data.details = data.details.map((d) => ({
            ...d,
            productId: d.product?.id || d.productId,
            productCode: d.product?.itemNo || d.productCode,
            productName: d.product?.itemName || d.productName,
            uom: d.product?.uom || d.uom,
            stockQty: d.product?.stockQty || d.stockQty || 0
          }));
        }
        setFormData(data);
      }
    } catch (err) {
      console.error('Error fetching bundle', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    if (name === 'effectiveFrom' || name === 'effectiveTo') {
      const from = name === 'effectiveFrom' ? value : formData.effectiveFrom;
      const to = name === 'effectiveTo' ? value : formData.effectiveTo;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let newIsActive = formData.isActive !== undefined ? formData.isActive : true;
      if (from && to) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(to);
        toDate.setHours(0, 0, 0, 0);

        if (today >= fromDate && today <= toDate) {
          newIsActive = true;
        } else {
          newIsActive = false;
        }
      } else if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        if (today >= fromDate) {
          newIsActive = true;
        } else {
          newIsActive = false;
        }
      }
      updatedData.isActive = newIsActive;
    }

    setFormData(updatedData);
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    const prod = products.find((p) => p.id === selectedProduct.id);
    if (!prod) return;

    if (formData.details.find((d) => d.productId === prod.id)) {
      dispatch(openSnackbar({ open: true, message: 'Product already added to bundle', variant: 'alert', severity: 'warning' }));
      return;
    }

    const newDetail = {
      productId: prod.id,
      productCode: prod.itemNo,
      productName: prod.itemName,
      uom: prod.uom,
      stockQty: prod.stockQty || 0,
      qty: 1,
      normalRate: prod.sellingRate || 0,
      bundleRate: prod.sellingRate || 0,
      discountPercent: 0,
      discountAmount: 0,
      isActive: true
    };

    setFormData({ ...formData, details: [...formData.details, newDetail] });
    setSelectedProduct(null);
  };

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...formData.details];
    updatedDetails[index][field] = value;

    if (['qty', 'normalRate', 'bundleRate'].includes(field)) {
      const qty = parseFloat(updatedDetails[index].qty) || 0;
      const normalRate = parseFloat(updatedDetails[index].normalRate) || 0;
      const bundleRate = parseFloat(updatedDetails[index].bundleRate) || 0;

      const totalNormal = qty * normalRate;
      const totalBundle = qty * bundleRate;
      const discountAmt = totalNormal - totalBundle;

      updatedDetails[index].discountAmount = discountAmt > 0 ? discountAmt : 0;
      updatedDetails[index].discountPercent = totalNormal > 0 && discountAmt > 0 ? ((discountAmt / totalNormal) * 100).toFixed(2) : 0;
    }

    setFormData({ ...formData, details: updatedDetails });
  };

  const handleRemoveProduct = (index) => {
    const updatedDetails = formData.details.filter((_, i) => i !== index);
    setFormData({ ...formData, details: updatedDetails });
  };

  const handleSubmit = async () => {
    try {
      let finalAttachments = [...(formData.attachments || [])];
      const filesToUpload = finalAttachments.filter((a) => a.file).map((a) => a.file);

      if (filesToUpload.length > 0) {
        const uploadedPaths = await autoUploadFiles(filesToUpload, 'PRODUCT_BUNDLE');
        let uploadIndex = 0;
        finalAttachments = finalAttachments.map((a) => {
          if (a.file) {
            const serverPath = uploadedPaths[uploadIndex++];
            return {
              docType: 'Image',
              fileName: a.fileName,
              path: serverPath,
              isNew: true
            };
          }
          return {
            docType: a.docType || 'Image',
            fileName: a.fileName,
            path: a.path,
            id: a.id
          };
        });
      }

      const payload = { ...formData, attachments: finalAttachments };

      if (isEdit) {
        await axios.put(`/api/product-bundles/${id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Bundle updated successfully', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post(`/api/product-bundles`, payload);
        dispatch(openSnackbar({ open: true, message: 'Bundle created successfully', variant: 'alert', severity: 'success' }));
      }
      navigate('/dd/product-bundle');
    } catch (error) {
      console.error('Error saving bundle:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to save bundle', variant: 'alert', severity: 'error' }));
    }
  };

  const totalNormalValue = formData.details.reduce((sum, d) => sum + (parseFloat(d.qty) || 0) * (parseFloat(d.normalRate) || 0), 0);
  const totalBundleValue = formData.details.reduce((sum, d) => sum + (parseFloat(d.qty) || 0) * (parseFloat(d.bundleRate) || 0), 0);
  const totalItemsCount = formData.details.length;
  const totalQty = formData.details.reduce((sum, d) => sum + (parseFloat(d.qty) || 0), 0);

  const calculateBundleStock = () => {
    if (!formData.details || formData.details.length === 0) return 0;

    let minStock = Infinity;
    for (const detail of formData.details) {
      const requiredQty = parseFloat(detail.qty) || 0;
      if (requiredQty > 0) {
        const availableStock = parseFloat(detail.stockQty) || 0;
        const possibleBundles = Math.floor(availableStock / requiredQty);
        if (possibleBundles < minStock) {
          minStock = possibleBundles;
        }
      }
    }
    return minStock === Infinity ? 0 : minStock;
  };
  const bundleStock = calculateBundleStock();

  return (
    <Box sx={{ display: 'flex', position: 'relative', width: '100%', alignItems: 'flex-start' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <MainCard
          auditProps={{
            isEdit,
            formData,
            auditLogs
          }}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconPackages size={24} color="#1e88e5" />
              <Typography variant="h4">{isEdit ? 'Edit Product Bundle' : 'Create Product Bundle'}</Typography>
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<IconArrowLeft />} onClick={() => navigate('/dd/product-bundle')}>
                Back
              </Button>
              <Button variant="contained" color="primary" startIcon={<IconDeviceFloppy />} onClick={handleSubmit}>
                {isEdit ? 'Update' : 'Save'}
              </Button>
            </Box>
          }
        >
          <Grid container spacing={2} >
            <Grid item xs={12} lg={12} width={"100%"}>
              <BOSFormSection title="Bundle Information">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4} lg={2}>
                    <BOSTextField
                      label="Bundle Code"
                      name="bundleCode"
                      value={formData.bundleCode || ''}
                      onChange={handleInputChange}
                      disabled={isEdit}
                      placeholder="Auto generated if empty"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} lg={2}>
                    <BOSTextField
                      required
                      label="Bundle Name"
                      name="bundleName"
                      value={formData.bundleName || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} lg={2}>
                    <BOSAutocomplete
                      label="Bundle Type"
                      options={['Sales Bundle', 'Kit', 'Package', 'Promotion Combo']}
                      value={formData.bundleType || ''}
                      onChange={(val) => setFormData({ ...formData, bundleType: val })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4} lg={2}>
                    <BOSTextField
                      type="date"
                      label="Effective From"
                      name="effectiveFrom"
                      value={formData.effectiveFrom || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} lg={2}>
                    <BOSTextField
                      type="date"
                      label="Effective To"
                      name="effectiveTo"
                      value={formData.effectiveTo || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} lg={2} display="flex" alignItems="center">
                    <Box sx={{ pl: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isActive !== false}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            color="primary"
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.isActive === false ? 'INACTIVE' : 'ACTIVE'}</Typography>}
                        labelPlacement="end"
                      />
                    </Box>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <BOSTextField
                    multiline
                    minRows={3}
                    label="Description/SOP"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
              </BOSFormSection>

              <Box sx={{ mt: 2 }}>
                <BOSFormSection title="Bundle Components">
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                    <BOSAutocomplete
                      label="Select Product"
                      options={products}
                      getOptionLabel={(option) => (option ? `${option.itemNo} - ${option.itemName}` : '')}
                      value={selectedProduct}
                      onChange={(val) => setSelectedProduct(val)}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button variant="contained" onClick={handleAddProduct} startIcon={<IconPlus />}>
                      Add
                    </Button>
                  </Box>

                  <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell>Product Code</TableCell>
                          <TableCell>Product Name</TableCell>
                          <TableCell>UOM</TableCell>
                          <TableCell>Stock</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>Normal Rate</TableCell>
                          <TableCell>Bundle Rate</TableCell>
                          <TableCell>Disc Amount</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.details.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} align="center">
                              No products added.
                            </TableCell>
                          </TableRow>
                        ) : (
                          formData.details.map((detail, index) => (
                            <TableRow key={index}>
                              <TableCell>{detail.productCode}</TableCell>
                              <TableCell>{detail.productName}</TableCell>
                              <TableCell>{detail.uom}</TableCell>
                              <TableCell sx={{ color: detail.stockQty > 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                                {detail.stockQty}
                              </TableCell>
                              <TableCell>
                                <BOSTextField
                                  type="number"
                                  value={detail.qty}
                                  onChange={(e) => handleDetailChange(index, 'qty', e.target.value)}
                                  sx={{ minWidth: 80 }}
                                />
                              </TableCell>
                              <TableCell>
                                <BOSTextField
                                  type="number"
                                  value={detail.normalRate}
                                  onChange={(e) => handleDetailChange(index, 'normalRate', e.target.value)}
                                  sx={{ minWidth: 100 }}
                                />
                              </TableCell>
                              <TableCell>
                                <BOSTextField
                                  type="number"
                                  value={detail.bundleRate}
                                  onChange={(e) => handleDetailChange(index, 'bundleRate', e.target.value)}
                                  sx={{ minWidth: 100 }}
                                />
                              </TableCell>
                              <TableCell>{detail.discountAmount}</TableCell>
                              <TableCell>
                                <IconButton size="small" color="error" onClick={() => handleRemoveProduct(index)}>
                                  <IconTrash size={18} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </BOSFormSection>
              </Box>
            </Grid>

            <Grid item xs={12} md={12} lg={12} width={"100%"}>
              <BOSFormSection title="Pricing & Stock Summary  ">
                <Box sx={{ overflow: 'hidden', p: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          bgcolor: 'background.default',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.3s',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                        }}
                      >
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#e2e8f0', color: '#64748b', display: 'flex' }}>
                          <IconListDetails size={24} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                          >
                            Bundle Items
                          </Typography>
                          <Typography variant="h3" sx={{ color: '#0f172a', mt: 0.5 }}>
                            {totalItemsCount}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: '#fde68a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.3s',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(245,158,11,0.15)' }
                        }}
                      >
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#fde68a', color: '#d97706', display: 'flex' }}>
                          <IconSum size={24} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: '#b45309', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                          >
                            Total Qty
                          </Typography>
                          <Typography variant="h3" sx={{ color: '#78350f', mt: 0.5 }}>
                            {totalQty}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          bgcolor: 'background.default',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.3s',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                        }}
                      >
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#e2e8f0', color: '#64748b', display: 'flex' }}>
                          <IconTags size={24} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                          >
                            Normal Value
                          </Typography>
                          <Typography variant="h3" sx={{ color: '#0f172a', mt: 0.5 }}>
                            {totalNormalValue.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: '#bae6fd',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.3s',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(14,165,233,0.15)' }
                        }}
                      >
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#bae6fd', color: '#0284c7', display: 'flex' }}>
                          <IconCoins size={24} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                          >
                            Bundle Value
                          </Typography>
                          <Typography variant="h3" sx={{ color: '#0c4a6e', mt: 0.5 }}>
                            {totalBundleValue.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: '#bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.3s',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(34,197,94,0.15)' }
                        }}
                      >
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#bbf7d0', color: '#16a34a', display: 'flex' }}>
                          <IconDiscount size={24} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: '#15803d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                          >
                            Discount
                          </Typography>
                          <Typography variant="h3" sx={{ color: '#14532d', mt: 0.5 }}>
                            {(totalNormalValue - totalBundleValue).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          background: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: '#ffc9c9',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.3s',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(250,82,82,0.15)' }
                        }}
                      >
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#ffc9c9', color: '#e03131', display: 'flex' }}>
                          <IconPackages size={24} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: '#c92a2a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                          >
                            Bundle Stock
                          </Typography>
                          <Typography variant="h3" sx={{ color: '#a61e1e', mt: 0.5 }}>
                            {bundleStock}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </BOSFormSection>
            </Grid>
          </Grid>
        </MainCard>
      </Box>
    </Box>
  );
};

export default ProductBundleForm;
