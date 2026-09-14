import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MenuItem, useTheme, Grid, FormControlLabel, Checkbox, Stack, Typography, Box, Tooltip, Button, CircularProgress, Breadcrumbs, Link, InputAdornment, Switch, Skeleton, Chip, Divider, Paper, alpha, Avatar } from '@mui/material';
import axios from 'utils/axios';
import useLookups from 'hooks/useLookups';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormSection, BOSTextField, BOSStatusField, BOSAutocomplete, errorStyle, btnSave, btnCancel, btnClear } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import ProductImageGallery from './ProductImageGallery';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import { getFileViewUrl, autoUploadFiles } from 'utils/upload-helper';
import useAuth from 'hooks/useAuth';
import MainCard from 'ui-component/cards/MainCard';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import {
  IconArrowLeft, IconEraser, IconDeviceFloppy, IconBarcode,
  IconFileDescription, IconTag, IconRuler, IconPhoto, IconList,
  IconTypography, IconUser, IconExchange, IconAlertCircle,
  IconCalendar, IconArchive, IconBox, IconBuildingFactory,
  IconReportAnalytics, IconCurrencyRupee, IconCoin, IconCheck
} from '@tabler/icons-react';

// ==============================|| PRODUCT MASTER - ADD/EDIT PAGE ||============================== //

const VALIDATION_RULES = [
  { field: 'itemNo', label: 'Item No', required: true, maxLength: 100 },
  { field: 'itemName', label: 'Item Name', required: true, maxLength: 255 }
];

const INITIAL_STATE = {
  itemNo: '', itemName: '', status: 'ACTIVE',
  inventoryType: '', itemGroup: '', itemCategory: '', itemSubCategory: '',
  leadTimeMin: '', leadTimeMax: '', oemNameId: '', webProduct: false,
  consNonMoving: false, consStockValue: false, primeProduct: false, capacityId: '',
  supplierPartNo: '', ldRequired: false, weightPerQty: '', partNoOld: '',
  partCodePrefix: '', oemPrefix: '', alternativePartNo: '', weeklyReconciliation: false,
  monthlyReconciliation: false, printName: '', itemCode: '', revNo: '',
  revDate: '', hsnCode: '', element: '', grade: '', shape: '',
  stockQty: '', rolQty: '', uom: '', isExpiryItem: false, selfLife: '',
  drmReq: false, modelNo: '', ndaReq: false, od: '', innerDiameter: '',
  length: '', width: '', thickness: '', attachments: [],
  keyWord1: '', keyWord2: '', keyWord3: '', reportDescription: '',
  wtgQuantity: '', cavity: '', inspectionRemarks: '', purchaseRate: '',
  maximumPurchaseRate: '', locationDivision: '', inspectionReq: false,
  identifications: []
};

export default function AddProduct() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from || '/master/product-master';
  const { id } = useParams();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();
  const perms = usePagePermissions(PAGE_CODES.NPD_PRODUCT_MASTER);
  const isViewOnly = !perms.write;

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [renderAll, setRenderAll] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRenderAll(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Master Data Options via Global Cache
  const lookups = useLookups([
    'INVENTORY_TYPES', 'ITEM_GROUPS', 'ITEM_CATEGORIES', 'ITEM_SUB_CATEGORIES',
    'OEMS', 'CAPACITIES', 'HSNS', 'ELEMENTS', 'MATERIAL_GRADES', 'SHAPES',
    'CONDITIONS', 'UOMS', 'MODELS', 'DIVISIONS'
  ]);

  const inventoryTypes = lookups.inventoryTypes || [];
  const itemGroups = lookups.itemGroups || [];
  const itemCategories = lookups.itemCategories || [];
  const itemSubCategories = lookups.itemSubCategories || [];
  const oems = lookups.oems || [];
  const capacities = lookups.capacities || [];
  const hsns = lookups.hsns || [];
  const elements = lookups.elements || [];
  const grades = lookups.materialGrades || [];
  const shapes = lookups.shapes || [];
  const conditions = lookups.conditions || [];
  const uoms = lookups.uoms || [];
  const models = lookups.models || [];
  const divisions = lookups.divisions || [];

  useEffect(() => {
    clearErrors();
    if (id) {
      setLoading(true);
      axios.get(`${API_PATHS.NPD.PRODUCT_MASTER}/${id}`)
        .then((response) => {
          setFormData({
            ...INITIAL_STATE,
            ...response.data,
            status: response.data.status || 'ACTIVE'
          });
        })
        .catch((error) => {
          console.error('Failed to fetch product:', error);
          dispatch(openSnackbar({ open: true, message: 'Failed to load product details.', variant: 'alert', severity: 'error' }));
        })
        .finally(() => setLoading(false));
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [id, clearErrors, dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAutocompleteChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      let finalAttachments = [...(formData.attachments || [])];

      const filesToUpload = finalAttachments.filter(a => a.file).map(a => a.file);
      if (filesToUpload.length > 0) {
        const uploadedPaths = await autoUploadFiles(filesToUpload, 'PRODUCT_MASTER', null, {
          pageCode: 'M3115',
          refId: formData.itemNo || ''
        });
        let uploadIndex = 0;
        finalAttachments = finalAttachments.map(a => {
          if (a.file) {
            const serverPath = uploadedPaths[uploadIndex++];
            return {
              fileName: a.fileName,
              serverFileName: serverPath,
              path: serverPath,
              preview: a.preview,
              isNew: true
            };
          }
          return a;
        });
      }

      const payload = {
        ...formData,
        attachments: finalAttachments,
        createdBy: formData.id ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: user?.id || 'Admin'
      };

      if (id) {
        await axios.put(`${API_PATHS.NPD.PRODUCT_MASTER}/${id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Product updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.PRODUCT_MASTER, payload);
        dispatch(openSnackbar({ open: true, message: 'Product created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      navigate(fromPath);
    } catch (error) {
      console.error('Failed to save product:', error);
      const errorMsg = error.message || 'Failed to save product.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    } finally {
      setSubmitting(false);
    }
  };

  useKeyboardShortcuts({
    'ctrl+s': handleSave,
    'ctrl+backspace': handleClear,
    'escape': () => navigate(fromPath)
  }, true);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Premium Header Action Bar */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1200,
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
          <Avatar
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.main,
              color: '#fff',
              width: 45,
              height: 45,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
            }}
          >
            <IconBuildingFactory size={24} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="800" sx={{
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}>
              {id ? `Edit Product: ${formData.itemNo || ''}` : 'New Product'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
              {id ? 'Modify the details of this product' : 'Create a new product in the master database'}
            </Typography>
          </Box>
        </Box>
        <Box gap={1.5} display="flex" alignItems="center">
          {id && (
            <Chip label={formData.status || 'ACTIVE'} size="small" color={formData.status === 'ACTIVE' ? 'success' : 'default'} sx={{ fontWeight: 600, fontSize: '0.75rem', mr: 1 }} />
          )}
          <Button variant="outlined" sx={{ borderRadius: 2, px: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }} onClick={() => navigate(fromPath)}>
            Close
          </Button>
          <Tooltip title={shortcutTooltip('Clear Form', 'Ctrl + Backspace')}>
            <Button variant="outlined" color="primary" sx={{ borderRadius: 2 }} startIcon={<IconEraser size={16} />} onClick={handleClear}>Clear</Button>
          </Tooltip>
          <Tooltip title={shortcutTooltip('Save', 'Ctrl + S')}>
            <Button
              variant="contained"
              color="warning"
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={16} />}
              onClick={handleSave}
              disabled={submitting}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                fontWeight: '700',
                boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.3)}`,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 10px 20px ${alpha(theme.palette.warning.main, 0.5)}`,
                }
              }}
            >
              {submitting ? 'Saving...' : 'Save Product'}
            </Button>
          </Tooltip>
        </Box>
      </Paper>


      <Stack spacing={2}>

        {/* PRODUCT SUMMARY CARD */}
        <Paper elevation={0} sx={{
          p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider',
          borderRadius: 2
        }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="caption" color="text.secondary">Item No</Typography>
              <Typography variant="subtitle2">{formData.itemNo || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Item Name</Typography>
              <Typography variant="subtitle2">{formData.itemName || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="caption" color="text.secondary">Inventory Type</Typography>
              <Typography variant="subtitle2">{formData.inventoryType || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="caption" color="text.secondary">Item Group</Typography>
              <Typography variant="subtitle2">{formData.itemGroup || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="caption" color="text.secondary">Item Category</Typography>
              <Typography variant="subtitle2">{formData.itemCategory || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Typography variant="subtitle2" sx={{ color: formData.status === 'ACTIVE' ? 'success.main' : 'text.primary', fontWeight: 600 }}>{formData.status || 'ACTIVE'}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* TWO-COLUMN LAYOUT */}
        <Grid container spacing={2} sx={{ width: '100%' }}>

          {/* LEFT COLUMN */}
          <Grid item xs={12} md={6} sx={{ width: '100%' }}>
            <Stack spacing={2} sx={{ width: '100%' }}>
              {/* Basic Information */}
              <BOSFormSection
                sx={{ width: { xs: '100%', md: '100%' } }}
                title="Basic Information"
                icon={<Box sx={{ p: 0.5, bgcolor: 'primary.main', borderRadius: 1, display: 'flex' }}><IconFileDescription size={16} color='#fff' /></Box>}
              >
                <Grid container spacing={1.5} sx={{ mt: 0 }}>
                  {/* Row 1 */}
                  <Grid item xs={12} sm={4}><BOSTextField name="itemNo" label="Item No" value={formData.itemNo} onChange={handleChange} required maxLength={100} error={!!errors.itemNo} helperText={errors.itemNo} sx={errorStyle(!!errors.itemNo)} InputProps={{ startAdornment: <InputAdornment position="start"><IconList size={16} /></InputAdornment> }} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="itemName" label="Item Name" value={formData.itemName} onChange={handleChange} required maxLength={255} error={!!errors.itemName} helperText={errors.itemName} sx={errorStyle(!!errors.itemName)} InputProps={{ startAdornment: <InputAdornment position="start"><IconFileDescription size={16} /></InputAdornment> }} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="printName" label="Print Name" value={formData.printName || ''} onChange={handleChange} maxLength={150} size="small" /></Grid>

                  {/* Row 2 */}
                  <Grid item xs={12} sm={4}><BOSTextField name="itemCode" label="Item Code" type="number" value={formData.itemCode || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="revNo" label="Revision No" value={formData.revNo || ''} onChange={handleChange} maxLength={10} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="revDate" label="Revision Date" type="date" value={formData.revDate ? formData.revDate.substring(0, 10) : ''} onChange={handleChange} InputLabelProps={{ shrink: true }} size="small" /></Grid>

                  {/* Row 3 */}
                  <Grid item xs={12} sm={4}><BOSTextField name="alternativePartNo" label="Alternative Part No" value={formData.alternativePartNo || ''} onChange={handleChange} maxLength={50} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="partNoOld" label="Part No Old" value={formData.partNoOld || ''} onChange={handleChange} maxLength={50} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="supplierPartNo" label="Supplier Part No" value={formData.supplierPartNo || ''} onChange={handleChange} maxLength={50} size="small" /></Grid>

                  {/* Row 4 */}
                  <Grid item xs={12} sm={6}><BOSTextField name="partCodePrefix" label="Part Code Prefix" value={formData.partCodePrefix || ''} onChange={handleChange} maxLength={50} size="small" /></Grid>
                  <Grid item xs={12} sm={6}><BOSTextField name="oemPrefix" label="OEM Prefix" value={formData.oemPrefix || ''} onChange={handleChange} maxLength={50} size="small" /></Grid>
                </Grid>
              </BOSFormSection>

              {/* Material / Input Details */}
              <BOSFormSection sx={{ width: { xs: '100%', md: '100%' } }}
                title="Material / Input Details"
                icon={<Box sx={{ p: 0.5, bgcolor: 'error.main', borderRadius: 1, display: 'flex' }}><IconTag size={16} color="#fff" /></Box>}
              >
                <Grid container spacing={1.5} sx={{ mt: 0 }}>
                  <Grid item xs={6} sm={4}><BOSAutocomplete name="hsnCode" label="HSN Code" value={formData.hsnCode || ''} options={hsns} getOptionLabel={(opt) => typeof opt === 'object' ? opt.hsnCode : opt} onChange={(val) => handleAutocompleteChange('hsnCode', typeof val === 'object' ? val.hsnCode : val)} size="small" /></Grid>
                  <Grid item xs={6} sm={4}><BOSAutocomplete name="element" label="Element" value={formData.element || ''} options={elements} getOptionLabel={(opt) => typeof opt === 'object' ? opt.code : opt} onChange={(val) => handleAutocompleteChange('element', typeof val === 'object' ? val.code : val)} size="small" /></Grid>
                  <Grid item xs={6} sm={4}><BOSAutocomplete name="grade" label="Grade" value={formData.grade || ''} options={grades} getOptionLabel={(opt) => typeof opt === 'object' ? opt.code : opt} onChange={(val) => handleAutocompleteChange('grade', typeof val === 'object' ? val.code : val)} size="small" /></Grid>
                  <Grid item xs={6} sm={6}><BOSAutocomplete name="shape" label="Shape" value={formData.shape || ''} options={shapes} getOptionLabel={(opt) => typeof opt === 'object' ? opt.code : opt} onChange={(val) => handleAutocompleteChange('shape', typeof val === 'object' ? val.code : val)} size="small" /></Grid>
                  <Grid item xs={6} sm={6}><BOSAutocomplete name="conditions" label="Conditions" value={formData.conditions || ''} options={conditions} getOptionLabel={(opt) => typeof opt === 'object' ? opt.code : opt} onChange={(val) => handleAutocompleteChange('conditions', typeof val === 'object' ? val.code : val)} size="small" /></Grid>
                </Grid>
              </BOSFormSection>

              {/* Inventory & Tracking */}
              <BOSFormSection sx={{ width: { xs: '100%', md: '100%' } }}
                title="Inventory & Tracking"
                icon={<Box sx={{ p: 0.5, bgcolor: 'warning.main', borderRadius: 1, display: 'flex' }}><IconBarcode size={16} color="#fff" /></Box>}
              >
                <Grid container spacing={1.5} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={6}><BOSAutocomplete name="locationDivision" label="Location/Division" value={formData.locationDivision || ''} options={divisions} getOptionLabel={(opt) => typeof opt === 'object' ? (opt.divisionName || opt.name || opt.code || '') : opt} onChange={(val) => handleAutocompleteChange('locationDivision', typeof val === 'object' ? (val.divisionName || val.name || val.code || '') : val)} size="small" /></Grid>
                  <Grid item xs={6} sm={3}><BOSTextField name="rackName" label="Rack Name" value={formData.rackName || ''} onChange={handleChange} maxLength={100} size="small" /></Grid>
                  <Grid item xs={6} sm={3}><BOSTextField name="binName" label="Bin Name" value={formData.binName || ''} onChange={handleChange} maxLength={100} size="small" /></Grid>

                  <Grid item xs={6} sm={3}><BOSTextField name="stockQty" label="Min Stock Level" type="number" value={formData.stockQty || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={6} sm={3}><BOSTextField name="rolQty" label="Max Stock Level" type="number" value={formData.rolQty || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={6} sm={3}><BOSTextField name="reorderLevel" label="Reorder Level" type="number" value={formData.reorderLevel || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={6} sm={3}><BOSTextField name="selfLife" label="Shelf Life (Days)" type="number" value={formData.selfLife || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={6} sm={6}><BOSTextField name="leadTimeMin" label="Min Lead Time (Days)" type="number" value={formData.leadTimeMin || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={6} sm={6}><BOSTextField name="leadTimeMax" label="Max Lead Time (Days)" type="number" value={formData.leadTimeMax || ''} onChange={handleChange} size="small" /></Grid>
                </Grid>
              </BOSFormSection>

            </Stack>
          </Grid>

          {/* RIGHT COLUMN */}
          <Grid item xs={12} md={6} >
            <Stack spacing={2}>

              {/* Classification */}
              <BOSFormSection sx={{ width: { xs: '100%', md: '100%' } }}
                title="Classification"
                icon={<Box sx={{ p: 0.5, bgcolor: 'secondary.main', borderRadius: 1, display: 'flex' }}><IconTag size={16} color="#fff" /></Box>}
              >
                <Grid container spacing={1.5} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={4}><BOSAutocomplete name="inventoryType" label="Inventory Type" value={formData.inventoryType || ''} options={inventoryTypes} getOptionLabel={(opt) => typeof opt === 'object' ? opt.code : opt} onChange={(val) => handleAutocompleteChange('inventoryType', typeof val === 'object' ? val.code : val)} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSAutocomplete name="itemGroup" label="Item Group" value={formData.itemGroup || ''} options={itemGroups} getOptionLabel={(opt) => typeof opt === 'object' ? opt.groupName : opt} onChange={(val) => handleAutocompleteChange('itemGroup', typeof val === 'object' ? val.groupName : val)} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSAutocomplete name="itemCategory" label="Item Category" value={formData.itemCategory || ''} options={itemCategories} getOptionLabel={(opt) => typeof opt === 'object' ? opt.itemType : opt} onChange={(val) => handleAutocompleteChange('itemCategory', typeof val === 'object' ? val.itemType : val)} size="small" /></Grid>

                  <Grid item xs={12} sm={3}><BOSAutocomplete name="itemSubCategory" label="Item Sub Cat." value={formData.itemSubCategory || ''} options={itemSubCategories} getOptionLabel={(opt) => typeof opt === 'object' ? opt.subType : opt} onChange={(val) => handleAutocompleteChange('itemSubCategory', typeof val === 'object' ? val.subType : val)} size="small" /></Grid>
                  <Grid item xs={12} sm={3}><BOSAutocomplete name="oemNameId" label="OEM Name" value={formData.oemNameId || ''} options={oems} getOptionLabel={(opt) => typeof opt === 'object' ? opt.oemName : opt} onChange={(val) => handleAutocompleteChange('oemNameId', typeof val === 'object' ? val.id : val)} size="small" /></Grid>
                  <Grid item xs={12} sm={3}><BOSAutocomplete name="modelNo" label="Model No" value={formData.modelNo || ''} options={models} getOptionLabel={(opt) => typeof opt === 'object' ? opt.modelNo : opt} onChange={(val) => handleAutocompleteChange('modelNo', typeof val === 'object' ? val.modelNo : val)} size="small" /></Grid>
                  <Grid item xs={12} sm={3}><BOSAutocomplete name="capacityId" label="Capacity" value={formData.capacityId || ''} options={capacities} getOptionLabel={(opt) => typeof opt === 'object' ? String(opt.id) : String(opt)} onChange={(val) => handleAutocompleteChange('capacityId', typeof val === 'object' ? val.id : val)} size="small" /></Grid>
                </Grid>
              </BOSFormSection>

              {/* Dimensions & Units */}
              <BOSFormSection sx={{ width: { xs: '100%', md: '100%' } }}
                title="Dimensions & Units"
                icon={<Box sx={{ p: 0.5, bgcolor: 'info.main', borderRadius: 1, display: 'flex' }}><IconRuler size={16} color="#fff" /></Box>}
              >
                <Grid container spacing={1.5} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={4}><BOSAutocomplete name="uom" label="UOM" value={formData.uom || ''} options={uoms} getOptionLabel={(opt) => typeof opt === 'object' ? opt.uomCode : opt} onChange={(val) => handleAutocompleteChange('uom', typeof val === 'object' ? val.uomCode : val)} size="small" /></Grid>
                  <Grid item xs={6} sm={4}><BOSTextField name="od" label="Outer Diameter (OD)" type="number" value={formData.od || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={6} sm={4}><BOSTextField name="innerDiameter" label="Inner Diameter (ID)" type="number" value={formData.innerDiameter || ''} onChange={handleChange} size="small" /></Grid>

                  <Grid item xs={6} sm={3}><BOSTextField name="length" label="Length" type="number" value={formData.length || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={6} sm={3}><BOSTextField name="width" label="Width" type="number" value={formData.width || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={6} sm={3}><BOSTextField name="thickness" label="Thickness" type="number" value={formData.thickness || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={6} sm={3}><BOSTextField name="weightPerQty" label="Weight Per Qty" type="number" value={formData.weightPerQty || ''} onChange={handleChange} InputProps={{ endAdornment: <InputAdornment position="end"><Box sx={{ bgcolor: 'action.hover', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.75rem' }}>kg</Box></InputAdornment> }} size="small" /></Grid>
                </Grid>
              </BOSFormSection>

              {/* Pricing Details */}
              <BOSFormSection sx={{ width: { xs: '100%', md: '100%' } }}
                title="Pricing Details"
                icon={<Box sx={{ p: 0.5, bgcolor: 'success.main', borderRadius: 1, display: 'flex' }}><IconCoin size={16} color="#fff" /></Box>}
              >
                <Grid container spacing={1.5} sx={{ mt: 0 }}>
                  {/* COST */}
                  <Grid item xs={12}>
                    <Typography variant="overline" color="primary">COST</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="itemCost" label="Item Cost" type="number" value={formData.itemCost || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="purchaseRate" label="Purchase Rate" type="number" value={formData.purchaseRate || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="maximumPurchaseRate" label="Max Purchase Rate" type="number" value={formData.maximumPurchaseRate || ''} onChange={handleChange} size="small" /></Grid>

                  {/* SELLING */}
                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="overline" color="success.main">SELLING</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="mrpRate" label="MRP Rate" type="number" value={formData.mrpRate || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="sellingRate" label="Selling Rate" type="number" value={formData.sellingRate || ''} onChange={handleChange} size="small" /></Grid>
                  <Grid item xs={12} sm={4}><BOSTextField name="minSellingRate" label="Min Selling Rate" type="number" value={formData.minSellingRate || ''} onChange={handleChange} size="small" /></Grid>
                </Grid>
              </BOSFormSection>

            </Stack>
          </Grid>

        </Grid>

        {/* Additional Information */}
        <BOSFormSection sx={{ width: { xs: '100%', md: '100%' } }}
          title="Additional Information"
          icon={<Box sx={{ p: 0.5, bgcolor: 'warning.dark', borderRadius: 1, display: 'flex' }}><IconFileDescription size={16} color="#fff" /></Box>}
        >
          <Grid container spacing={1.5} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={4} md={2}><BOSTextField name="keyWord1" label="Key Word 1" value={formData.keyWord1 || ''} onChange={handleChange} maxLength={250} size="small" /></Grid>
            <Grid item xs={12} sm={4} md={2}><BOSTextField name="keyWord2" label="Key Word 2" value={formData.keyWord2 || ''} onChange={handleChange} maxLength={250} size="small" /></Grid>
            <Grid item xs={12} sm={4} md={2}><BOSTextField name="keyWord3" label="Key Word 3" value={formData.keyWord3 || ''} onChange={handleChange} maxLength={250} size="small" /></Grid>
            <Grid item xs={12} sm={12} md={6}><BOSTextField name="reportDescription" label="Report Description" value={formData.reportDescription || ''} onChange={handleChange} maxLength={250} size="small" /></Grid>

            <Grid item xs={12} sm={6} md={3}><BOSTextField name="wtgQuantity" label="WTG Quantity" type="number" value={formData.wtgQuantity || ''} onChange={handleChange} size="small" /></Grid>
            <Grid item xs={12} sm={6} md={3}><BOSTextField name="cavity" label="Cavity" value={formData.cavity || ''} onChange={handleChange} maxLength={250} size="small" /></Grid>
            <Grid item xs={12} sm={12} md={6}><BOSTextField name="inspectionRemarks" label="Inspection Remarks" value={formData.inspectionRemarks || ''} onChange={handleChange} maxLength={250} size="small" /></Grid>
          </Grid>
        </BOSFormSection>

        {/* Identification */}
        <BOSFormSection sx={{ width: { xs: '100%', md: '100%' } }}
          title="Identification"
          icon={<Box sx={{ p: 0.5, bgcolor: '#9c27b0', borderRadius: 1, display: 'flex' }}><IconTag size={16} color="#fff" /></Box>}
        >
          {(!formData.identifications || formData.identifications.length === 0) ? (
            <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>No identification records added</Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>Add an identification record to track this product.</Typography>
              <Button variant="outlined" size="small" onClick={() => setFormData(prev => ({ ...prev, identifications: [{}] }))}>+ Add Identification</Button>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.palette.grey[100], borderBottom: '2px solid', borderBottomColor: theme.palette.divider }}>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Identification</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Instrument Location</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Purchase Date</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Supplied By</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Calibration</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Frequency</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Last Calibration</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Next Calibration</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Mac Address</th>
                    <th style={{ padding: 8, textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: theme.palette.text.secondary }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.identifications?.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid', borderBottomColor: theme.palette.divider }}>
                      <td style={{ padding: '6px 4px' }}><BOSTextField name={`idt-id-${idx}`} size="small" value={row.identification || ''} onChange={(e) => { const newIdts = [...formData.identifications]; newIdts[idx].identification = e.target.value; setFormData(prev => ({ ...prev, identifications: newIdts })); }} /></td>
                      <td style={{ padding: '6px 4px' }}><BOSTextField name={`idt-loc-${idx}`} size="small" value={row.instrumentLocation || ''} onChange={(e) => { const newIdts = [...formData.identifications]; newIdts[idx].instrumentLocation = e.target.value; setFormData(prev => ({ ...prev, identifications: newIdts })); }} /></td>
                      <td style={{ padding: '6px 4px' }}><BOSTextField name={`idt-pd-${idx}`} type="date" size="small" value={row.purchaseDate ? row.purchaseDate.substring(0, 10) : ''} onChange={(e) => { const newIdts = [...formData.identifications]; newIdts[idx].purchaseDate = e.target.value; setFormData(prev => ({ ...prev, identifications: newIdts })); }} InputLabelProps={{ shrink: true }} /></td>
                      <td style={{ padding: '6px 4px' }}><BOSTextField name={`idt-sup-${idx}`} size="small" value={row.suppliedBy || ''} onChange={(e) => { const newIdts = [...formData.identifications]; newIdts[idx].suppliedBy = e.target.value; setFormData(prev => ({ ...prev, identifications: newIdts })); }} /></td>
                      <td style={{ padding: '6px 4px' }}><BOSTextField name={`idt-cal-${idx}`} size="small" value={row.calibration || ''} onChange={(e) => { const newIdts = [...formData.identifications]; newIdts[idx].calibration = e.target.value; setFormData(prev => ({ ...prev, identifications: newIdts })); }} /></td>
                      <td style={{ padding: '6px 4px' }}>
                        <BOSAutocomplete name={`idt-freq-${idx}`} size="small" value={row.frequency || ''} options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']} onChange={(val) => { const newIdts = [...formData.identifications]; newIdts[idx].frequency = val; setFormData(prev => ({ ...prev, identifications: newIdts })); }} />
                      </td>
                      <td style={{ padding: '6px 4px' }}><BOSTextField name={`idt-lcd-${idx}`} type="date" size="small" value={row.lastCalibrationDate ? row.lastCalibrationDate.substring(0, 10) : ''} onChange={(e) => { const newIdts = [...formData.identifications]; newIdts[idx].lastCalibrationDate = e.target.value; setFormData(prev => ({ ...prev, identifications: newIdts })); }} InputLabelProps={{ shrink: true }} /></td>
                      <td style={{ padding: '6px 4px' }}><BOSTextField name={`idt-ncd-${idx}`} type="date" size="small" value={row.nextCalibrationDate ? row.nextCalibrationDate.substring(0, 10) : ''} onChange={(e) => { const newIdts = [...formData.identifications]; newIdts[idx].nextCalibrationDate = e.target.value; setFormData(prev => ({ ...prev, identifications: newIdts })); }} InputLabelProps={{ shrink: true }} /></td>
                      <td style={{ padding: '6px 4px' }}><BOSTextField name={`idt-mac-${idx}`} size="small" value={row.macAddress || ''} onChange={(e) => { const newIdts = [...formData.identifications]; newIdts[idx].macAddress = e.target.value; setFormData(prev => ({ ...prev, identifications: newIdts })); }} /></td>
                      <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                        <Button size="small" color="error" onClick={() => { const newIdts = [...formData.identifications]; newIdts.splice(idx, 1); setFormData(prev => ({ ...prev, identifications: newIdts })); }}>Del</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button size="small" variant="outlined" sx={{ mt: 2 }} onClick={() => setFormData(prev => ({ ...prev, identifications: [...(prev.identifications || []), {}] }))}>+ Add Row</Button>
            </Box>
          )}
        </BOSFormSection>

        {/* Settings & Flags */}
        <BOSFormSection sx={{ width: { xs: '100%', md: '100%' } }}
          title="Settings & Flags"
          icon={<Box sx={{ p: 0.5, bgcolor: 'success.dark', borderRadius: 1, display: 'flex' }}><IconBox size={16} color="#fff" /></Box>}
        >
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={3}>
              <Typography variant="overline" color="text.secondary" gutterBottom sx={{ display: 'block' }}>PRODUCT BEHAVIOR</Typography>
              <Stack spacing={1}>
                {['webProduct', 'consNonMoving', 'primeProduct', 'consStockValue'].map(name => {
                  const labels = { webProduct: 'Web Product', consNonMoving: 'Non Moving', primeProduct: 'Prime Product', consStockValue: 'Consolidate Stock Value' };
                  return (
                    <Box key={name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                      <Typography variant="body2">{labels[name]}</Typography>
                      <Switch size="small" name={name} checked={!!formData[name]} onChange={(e) => handleChange({ target: { name, value: e.target.checked, type: 'checkbox', checked: e.target.checked } })} />
                    </Box>
                  );
                })}
              </Stack>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="overline" color="text.secondary" gutterBottom sx={{ display: 'block' }}>COMPLIANCE / CONTROL</Typography>
              <Stack spacing={1}>
                {['ldRequired', 'ndaReq', 'inspectionReq', 'drmReq'].map(name => {
                  const labels = { ldRequired: 'LD Required', ndaReq: 'NDA Required', inspectionReq: 'Inspection Required', drmReq: 'DRM Required' };
                  return (
                    <Box key={name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                      <Typography variant="body2">{labels[name]}</Typography>
                      <Switch size="small" name={name} checked={!!formData[name]} onChange={(e) => handleChange({ target: { name, value: e.target.checked, type: 'checkbox', checked: e.target.checked } })} />
                    </Box>
                  );
                })}
              </Stack>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="overline" color="text.secondary" gutterBottom sx={{ display: 'block' }}>INVENTORY</Typography>
              <Stack spacing={1}>
                {['isExpiryItem', 'weeklyReconciliation', 'monthlyReconciliation'].map(name => {
                  const labels = { isExpiryItem: 'Is Expiry Item', weeklyReconciliation: 'Weekly Reconciliation', monthlyReconciliation: 'Monthly Reconciliation' };
                  return (
                    <Box key={name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                      <Typography variant="body2">{labels[name]}</Typography>
                      <Switch size="small" name={name} checked={!!formData[name]} onChange={(e) => handleChange({ target: { name, value: e.target.checked, type: 'checkbox', checked: e.target.checked } })} />
                    </Box>
                  );
                })}
              </Stack>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="overline" color="text.secondary" gutterBottom sx={{ display: 'block' }}>STATUS</Typography>
              <Box sx={{ mt: 1 }}>
                <BOSStatusField
                  isCreate={!id}
                  type="string-upper"
                  name="status"
                  label=""
                  value={formData.status || 'ACTIVE'}
                  onChange={handleChange}
                  disabled={isViewOnly || !id}
                />
              </Box>
            </Grid>
          </Grid>
        </BOSFormSection>

        {/* Product Images */}
        <BOSFormSection sx={{ width: { xs: '100%', md: '100%' } }}
          title="Product Images"
          icon={<Box sx={{ p: 0.5, bgcolor: 'primary.dark', borderRadius: 1, display: 'flex' }}><IconPhoto size={16} color='#fff' /></Box>}
        >
          <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <ProductImageGallery
              files={formData.attachments || []}
              onChange={(files) => setFormData((prev) => ({ ...prev, attachments: files }))}
              module="PRODUCT_MASTER"
              maxFiles={5}
            />
          </Box>
        </BOSFormSection>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 500 }}>* Required fields</Typography>
        </Box>

      </Stack>
    </Box>
  );
}
