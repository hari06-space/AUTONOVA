import TextField from 'ui-component/CustomTextField';
import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// material-ui
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Box, Stack, Avatar, IconButton, Tooltip, CircularProgress, alpha, Divider, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useAuth from 'hooks/useAuth';
import { setFilterConfig, resetFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { BOSDataTable } from 'ui-component/bos';

// assets
import {
  IconSettings,
  IconPlus,
  IconPencil,
  IconX,
  IconDeviceFloppy,
  IconCalendarEvent,
  IconUser,
  IconInfoCircle,
  IconTrash
} from '@tabler/icons-react';

// ==============================|| PREFERENCE MASTER ||============================== //

const preferenceSearchConfig = [
  { id: 'prefName', label: 'Preference Name', type: 'text', placeholder: 'Search Name...', isStarred: true },
  { id: 'prefValue', label: 'Value', type: 'text', placeholder: 'Search Value...' },
  { id: 'prefType', label: 'Type', type: 'text', placeholder: 'Search Type...', isStarred: true }
];

const MODULE_OPTIONS = [
  'HRA',
  'QMS',
  'SALES',
  'PURCHASE',
  'FINANCE',
  'SCHEDULER',
  'AUDIT',
  'MEETINGS',
  'MAINTENANCE',
  'STORE & LOGISTICS',
  'ADMIN'
];

const getModuleColor = (typeStr) => {
  const t = (typeStr || '').toUpperCase();
  if (t.includes('HRA') || t.includes('LEAVE') || t.includes('ATTENDANCE')) return '#673ab7';
  if (t.includes('QMS')) return '#009688';
  if (t.includes('SALES')) return '#e91e63';
  if (t.includes('PURCHASE')) return '#9c27b0';
  if (t.includes('FINANCE')) return '#2e7d32';
  if (t.includes('SCHEDULER') || t.includes('TRIGGER')) return '#0288d1';
  if (t.includes('AUDIT')) return '#ed6c02';
  if (t.includes('MEETING')) return '#4caf50';
  if (t.includes('ADMIN')) return '#3f51b5';
  return '#673ab7';
};

const PreferenceMaster = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const { user } = useAuth();
  const searchQuery = useSelector((state) => state.search.query);

  const perms = usePagePermissions(PAGE_CODES.AD_APP_PREFERENCE);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getErrorMessage = (err) => {
    if (typeof err === 'string') return err;
    return err?.message || err?.error || err?.detail || JSON.stringify(err) || 'An unexpected error occurred';
  };

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/preferences/all');
      const hraMovedKeys = [
        'SANDWICH_LEAVE',
        'OT_MIN_MINUTES',
        'ESSL_SYNC_INTERVAL_MINUTES',
        'LOM_GRACE_MINUTES',
        'LOM_MAX_LATE_MONTH',
        'LOM_PERMISSION_WAIVE',
        'LOM_DEDUCTION_THRESHOLD'
      ];
      const data = (response.data || []).filter(
        (p) => !hraMovedKeys.includes(p.prefName?.toUpperCase().trim())
      );
      setPreferences(data);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err) || 'Failed to fetch preferences', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
    dispatch(setFilterConfig(preferenceSearchConfig));
    dispatch(resetFilters());
    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
    };
  }, [dispatch]);

  const filteredPreferences = useMemo(() => {
    const query = searchQuery?.toLowerCase() || '';
    if (!query) return preferences;

    return preferences.filter((pref) =>
      pref.prefName?.toLowerCase().includes(query) ||
      pref.prefValue?.toLowerCase().includes(query) ||
      pref.prefType?.toLowerCase().includes(query) ||
      pref.comments?.toLowerCase().includes(query)
    );
  }, [preferences, searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.rowId);
    setDeleteTargetName(row.prefName || 'this preference');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/preferences/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Preference deleted successfully', variant: 'alert', severity: 'success' }));
      fetchPreferences();
    } catch (err) {
      console.error('Delete failed:', err);
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err) || 'Delete failed', variant: 'alert', severity: 'error' }));
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRow(null);
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    setOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 145px)', gap: 1, overflow: 'hidden' }}>
      {/* ── HEADER SECTION ── */}
      <Box sx={{
        bgcolor: 'background.paper',
        p: '10px 24px',
        borderRadius: '12px',
        border: '1px solid #eef2f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar
            sx={{
              width: 50,
              height: 50,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <IconSettings size={28} />
          </Avatar>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a223f', lineHeight: 1.2 }}>App Preferences</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', fontSize: '0.65rem' }}>SYSTEM CONFIGURATION MANAGER</Typography>
          </Box>
        </Stack>

        {perms.write && (
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={handleClickOpen}
            sx={{
              height: 40,
              borderRadius: '8px',
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark },
              px: 3,
              fontWeight: 700,
              boxShadow: 'none'
            }}
          >
            Add Preference
          </Button>
        )}
      </Box>

      {/* ── TABLE SECTION ── */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #eef2f6',
        bgcolor: 'background.paper',
        minHeight: 0
      }}>
        {(() => {
          const columns = [
            { id: 'index', label: '#' },
            {
              id: 'prefName',
              label: 'Preference Name',
              render: (row) => (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#2196f3', textTransform: 'uppercase', fontSize: '0.75rem', lineHeight: 1.2 }}>{row.prefName}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem' }}>{row.comments || 'No description available'}</Typography>
                </Box>
              )
            },
            {
              id: 'prefValue',
              label: 'Value',
              render: (row) => (
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a223f', fontSize: '0.75rem' }}>{row.prefValue}</Typography>
              )
            },

            {
              id: 'prefType',
              label: 'Module / Type',
              render: (row) => {
                const color = getModuleColor(row.prefType);
                return (
                  <Typography variant="caption" sx={{ fontWeight: 800, color: color, bgcolor: alpha(color, 0.1), px: 1.2, py: 0.4, borderRadius: '6px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {row.prefType || 'ADMIN'}
                  </Typography>
                );
              }
            },
            {
              id: 'updatedDate',
              label: 'Last Updated',
              render: (row) => (
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconCalendarEvent size={14} color="#94a3b8" />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1a223f', display: 'block', lineHeight: 1.1 }}>
                      {row.updatedDate || row.createdDate ? new Date(row.updatedDate || row.createdDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconUser size={10} color="#94a3b8" />
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700 }}>{row.updatedBy || row.createdBy || 'System'}</Typography>
                    </Stack>
                  </Box>
                </Stack>
              )
            }
          ];

          const actionColumn = {
            render: (row) => (
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                <Tooltip title="Edit Preference" arrow>
                  <IconButton
                    onClick={() => handleEdit(row)}
                    sx={{
                      bgcolor: alpha('#2196f3', 0.1),
                      color: '#2196f3',
                      borderRadius: '6px',
                      p: 0.5,
                      '&:hover': { bgcolor: '#2196f3', color: 'white' }
                    }}
                  >
                    {perms.write ? <IconPencil size={18} /> : <IconInfoCircle size={18} />}
                  </IconButton>
                </Tooltip>
                {perms.delete && (
                  <Tooltip title="Delete Preference" arrow>
                    <IconButton
                      onClick={() => handleDeleteClick(row)}
                      sx={{
                        bgcolor: alpha('#f44336', 0.1),
                        color: '#f44336',
                        borderRadius: '6px',
                        p: 0.5,
                        '&:hover': { bgcolor: '#f44336', color: 'white' }
                      }}
                    >
                      <IconTrash size={18} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            )
          };

          return (
            <BOSDataTable
              id="preference-master-table"
              columns={columns}
              data={filteredPreferences}
              page={page}
              size={rowsPerPage}
              totalCount={filteredPreferences.length}
              onPageChange={setPage}
              onSizeChange={(s) => { setRowsPerPage(s); setPage(0); }}
              showActions={true}
              actionColumn={actionColumn}
              loading={loading}
              onDoubleClickRow={handleEdit}
            />
          );
        })()}
      </Box>

      {/* ── PREFERENCE DIALOG (COMMAND CENTER DESIGN - MATCHING IMAGE) ── */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' } }}>
        <DialogTitle sx={{ p: 0, bgcolor: '#1a223f' }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconSettings size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'inherit', lineHeight: 1.1, fontSize: '1.1rem' }}>Prefence Configuration Editor</Typography>
                <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>ADVANCED SYSTEM PREFERENCES</Typography>
              </Box>
            </Stack>
            <IconButton onClick={handleClose} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <IconX size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <Formik
          enableReinitialize={true}
          initialValues={{
            name: editingRow ? editingRow.prefName : '',
            value: editingRow ? editingRow.prefValue : '',
            comments: editingRow?.comments || '',
            type: editingRow ? editingRow.prefType : '',
            submit: null
          }}
          validationSchema={Yup.object().shape({
            name: Yup.string()
              .max(100)
              .required('Preference name is required')
              .test('unique-name', 'This preference key already exists', function (value) {
                if (!value) return true;
                return !preferences.some(p =>
                  p.prefName.toLowerCase() === value.toLowerCase() &&
                  (!editingRow || p.rowId !== editingRow.rowId)
                );
              }),
            value: Yup.string().max(100).required('Value is required'),
            comments: Yup.string().max(500),
            type: Yup.string().max(100).required('Type is required')
          })}
          onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
            try {
              if (editingRow) {
                await axios.put(`/api/preferences/update/${editingRow.rowId}`, {
                  prefName: values.name,
                  prefValue: values.value,
                  comments: values.comments,
                  prefType: values.type,
                  updatedBy: user?.id || 'System'
                });
              } else {
                await axios.post('/api/preferences/create', {
                  prefName: values.name,
                  prefValue: values.value,
                  comments: values.comments,
                  prefType: values.type,
                  createdBy: user?.id || 'System'
                });
              }
              dispatch(openSnackbar({ open: true, message: `Preference ${editingRow ? 'updated' : 'saved'} successfully`, variant: 'alert', severity: 'success' }));
              handleClose();
              await fetchPreferences();
            } catch (err) {
              console.error('Save failed:', err);
              setErrors({ submit: getErrorMessage(err) });
              setSubmitting(false);
            }
          }}
        >
          {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
            <form noValidate onSubmit={handleSubmit}>
              <DialogContent sx={{ p: 4, bgcolor: 'background.paper' }}>
                <Box sx={{
                  p: 4,
                  borderRadius: '24px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  bgcolor: 'background.paper'
                }}>
                  <Stack spacing={4}>
                    <TextField
                      select
                      fullWidth
                      label="MODULE / TYPE"
                      name="type"
                      value={values.type}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.type && errors.type)}
                      helperText={touched.type && errors.type}
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      InputProps={{
                        sx: { fontWeight: 700, fontSize: '0.9rem', color: '#1a223f' }
                      }}
                      InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.75rem', color: '#1a223f !important' } }}
                    >
                      {MODULE_OPTIONS.map((m) => (
                        <MenuItem key={m} value={m} sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {m}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      fullWidth
                      label="PREFERENCE KEY"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.name && errors.name)}
                      helperText={touched.name && errors.name}
                      variant="outlined"
                      placeholder="Enter key..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      InputProps={{
                        sx: { fontWeight: 700, fontSize: '0.9rem', color: '#1a223f' }
                      }}
                      InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.75rem', color: '#1a223f !important' } }}
                    />

                    <TextField
                      fullWidth
                      label="SYSTEM VALUE"
                      name="value"
                      value={values.value}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.value && errors.value)}
                      helperText={touched.value && errors.value}
                      variant="outlined"
                      placeholder="Enter value..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      InputProps={{
                        sx: { fontWeight: 700, fontSize: '0.9rem', color: '#1a223f' }
                      }}
                      InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.75rem', color: '#1a223f !important' } }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="ADMINISTRATOR COMMENTS"
                      name="comments"
                      value={values.comments}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      variant="outlined"
                      placeholder="Add detailed configuration notes..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      InputProps={{
                        sx: { fontWeight: 500, fontSize: '0.85rem', color: '#1a223f' }
                      }}
                      InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.75rem', color: '#1a223f !important' } }}
                    />
                  </Stack>
                </Box>
                {errors.submit && (
                  <Box sx={{ mt: 2, p: 1, bgcolor: alpha('#f44336', 0.05), borderRadius: '8px', textAlign: 'center' }}>
                    <Typography color="error" variant="caption" sx={{ fontWeight: 700 }}>{errors.submit}</Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 4, pt: 0, bgcolor: 'background.paper', justifyContent: 'center', borderTop: 'none' }}>
                <Stack direction="row" spacing={3} alignItems="center" sx={{ width: '100%', justifyContent: 'center', borderTop: '1px dashed #eee', pt: 4 }}>
                  <Button
                    onClick={handleClose}
                    sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.95rem', '&:hover': { bgcolor: 'transparent', color: '#1a223f' } }}
                  >
                    Discard
                  </Button>
                  {perms.write && (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
                      sx={{
                        px: 5,
                        py: 1.5,
                        fontWeight: 800,
                        borderRadius: '16px',
                        bgcolor: '#1a223f',
                        color: 'white',
                        fontSize: '0.95rem',
                        boxShadow: '0 12px 24px rgba(26, 34, 63, 0.3)',
                        '&:hover': { bgcolor: '#000', transform: 'translateY(-2px)' },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {editingRow ? 'Commit Changes' : 'Save Preference'}
                    </Button>
                  )}
                </Stack>
              </DialogActions>
            </form>
          )}
        </Formik>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Preference"
        message="Are you sure you want to delete this preference? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </Box>
  );
};

export default PreferenceMaster;
