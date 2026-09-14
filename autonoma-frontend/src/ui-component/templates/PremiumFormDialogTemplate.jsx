import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, MenuItem, useTheme } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import {
  IconSettings,
  IconListDetails,
  IconCloudUpload,
  IconCamera,
  IconFileDescription
} from '@tabler/icons-react';
import { BOSFormDialog, BOSFormSection, BOSTextField, getDialogStyles } from 'ui-component/bos';

// ==============================|| PREMIUM FORM DIALOG TEMPLATE (BOS SOP) ||============================== //

/**
 * Reference implementation template for new BOS master pages.
 * Copy this file and customize the sections/fields for your module.
 */
export default function PremiumFormDialogTemplate({ open, handleClose, initialData, readOnly = false }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isEditing, setIsEditing] = useState(!readOnly);
  const [field1, setField1] = useState(initialData?.field1 || '');
  const [dropdown1, setDropdown1] = useState(initialData?.dropdown1 || 'OPTION 1');

  const handleClear = () => {
    setField1('');
    setDropdown1('OPTION 1');
  };

  const handleSave = () => {
    // Save logic here
    handleClose();
  };

  const isViewOnly = readOnly && !isEditing;

  return (
    <BOSFormDialog
      open={open}
      onClose={handleClose}
      onSave={handleSave}
      onClear={handleClear}
      onEditClick={() => setIsEditing(true)}
      title="Standard Master Title"
      isViewOnly={isViewOnly}
      hasId={!!initialData?.id}
      maxWidth="lg"
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4, width: '100%', alignItems: 'start' }}>

        {/* ── LEFT COLUMN: Form Sections ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <BOSFormSection icon={<IconSettings size={20} color={theme.palette.primary.main} />} title="Section 1">
            <BOSTextField
              required
              error={!field1}
              helperText={!field1 ? 'Please fill this' : ''}
              label="Generic Input 1"
              value={field1}
              onChange={(e) => setField1(e.target.value)}
              disabled={isViewOnly}
            />
            <BOSTextField
              select
              label="Generic Dropdown"
              value={dropdown1}
              onChange={(e) => setDropdown1(e.target.value)}
              disabled={isViewOnly}
            >
              <MenuItem value="OPTION 1">OPTION 1</MenuItem>
              <MenuItem value="OPTION 2">OPTION 2</MenuItem>
            </BOSTextField>
          </BOSFormSection>

          <BOSFormSection icon={<IconListDetails size={20} color={theme.palette.warning.main} />} title="Section 2">
            <BOSTextField label="Generic Input 2" disabled={isViewOnly} />
          </BOSFormSection>
        </Box>

        {/* ── RIGHT COLUMN: Attachments & Scanning ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>

          {/* Uploaded Files */}
          <BOSFormSection icon={<IconCloudUpload size={20} color={theme.palette.primary.main} />} title="Attachments">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2, bgcolor: isDark ? 'transparent' : 'grey.50' }}>
              <Button component="label" variant="contained" color="primary" sx={{ borderRadius: '8px', textTransform: 'none', mb: 2 }} startIcon={<IconCloudUpload size={20} />}>
                Browse Files
                <input type="file" multiple hidden />
              </Button>
              <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
                <IconFileDescription size={52} stroke={1} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>No file uploaded yet</Typography>
                <Typography variant="caption">Upload files using the button above</Typography>
              </Box>
            </Box>
          </BOSFormSection>

          {/* Scan Documents */}
          <BOSFormSection icon={<IconCamera size={20} color={theme.palette.secondary.main} />} title="Scan Documents">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2, bgcolor: isDark ? 'transparent' : 'grey.50' }}>
              <Button component="label" variant="contained" color="primary" sx={{ borderRadius: '8px', textTransform: 'none', mb: 2 }} startIcon={<IconCamera size={20} />}>
                Upload
                <input type="file" accept="image/*" capture="environment" hidden />
              </Button>
              <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
                <IconFileDescription size={52} stroke={1} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>No file scanned yet</Typography>
                <Typography variant="caption">Scan documents using the camera</Typography>
              </Box>
            </Box>
          </BOSFormSection>
        </Box>
      </Box>
    </BOSFormDialog>
  );
}

PremiumFormDialogTemplate.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};
