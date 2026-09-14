import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Box, Typography, Stack, useTheme, Collapse, IconButton } from '@mui/material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useColorScheme } from '@mui/material/styles';
import { getDialogStyles } from './BOSStyles';

const renderIcon = (icon) => {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === 'function' || (typeof icon === 'object' && icon?.$$typeof)) {
    const IconComp = icon;
    return <IconComp size={18} />;
  }
  return icon;
};

export default function BOSFormSection({ icon, title, children, defaultOpen = true, sx = {}, contentSx = {}, action }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ds = getDialogStyles(theme, isDark);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Box sx={{ ...ds.sectionCard, ...sx }}>
      {title && (
        <Box
          sx={{
            ...ds.sectionHeader,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {renderIcon(icon)}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {title}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {action && <Box onClick={(e) => e.stopPropagation()}>{action}</Box>}
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              {isOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </IconButton>
          </Stack>
        </Box>
      )}
      <Collapse in={isOpen} sx={{ '& .MuiCollapse-wrapper': { overflow: 'visible' }, '& .MuiCollapse-wrapperInner': { overflow: 'visible' } }}>
        <Box sx={{ p: { xs: 1.25, sm: 1.5 }, pb: { xs: 2, sm: 2.25 }, ...contentSx }}>
          <Stack spacing={1} sx={{ width: '100%' }}>
            {children}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

BOSFormSection.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  defaultOpen: PropTypes.bool,
  sx: PropTypes.object,
  contentSx: PropTypes.object,
  action: PropTypes.node
};
