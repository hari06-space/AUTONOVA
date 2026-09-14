import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Paper, useTheme, CircularProgress, Tooltip } from '@mui/material';
import { IconX, IconUser, IconBuildingBank, IconReceiptTax, IconBuildingStore, IconArrowRight, IconArrowDown } from '@tabler/icons-react';
import Tree from 'react-d3-tree';
import axios from 'utils/axios';

const renderForeignObjectNode = ({ nodeDatum, toggleNode, foreignObjectProps, isDark }) => {
  const { title, subtitle, Icon, color } = nodeDatum.attributes || {};
  
  return (
    <g>
      <foreignObject {...foreignObjectProps}>
        <Paper 
          elevation={isDark ? 4 : 2}
          onClick={toggleNode}
          sx={{
            p: 1.5,
            borderTop: `4px solid ${color || '#000'}`,
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            borderRadius: 2,
            bgcolor: isDark ? 'background.paper' : 'common.white',
            textAlign: 'center',
            cursor: nodeDatum.children && nodeDatum.children.length > 0 ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: 6
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, color: color || '#000' }}>
            {Icon && <Icon size={24} />}
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? 'text.primary' : 'grey.900', wordWrap: 'break-word', lineHeight: 1.2 }}>
            {title || nodeDatum.name}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', wordWrap: 'break-word' }}>
              {subtitle}
            </Typography>
          )}
        </Paper>
      </foreignObject>
    </g>
  );
};

export default function VendorMindMapDialog({ open, onClose, vendor }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const [ledgerGroups, setLedgerGroups] = useState([]);
  const [financeLedgers, setFinanceLedgers] = useState([]);
  const [taxLedgers, setTaxLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHorizontal, setIsHorizontal] = useState(true);

  // Dynamic centering
  const [translate, setTranslate] = useState({ x: 200, y: 200 });
  const containerRef = useCallback((containerElem) => {
    if (containerElem !== null) {
      const { width, height } = containerElem.getBoundingClientRect();
      setTranslate(
        isHorizontal 
          ? { x: width / 4, y: height / 2 } 
          : { x: width / 2, y: height / 4 }
      );
    }
  }, [isHorizontal]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        axios.get('/api/master/finance/ledger-group'),
        axios.get('/api/master/finance/ledger'),
        axios.get('/api/master/finance/tax-ledger')
      ]).then(([gRes, fRes, tRes]) => {
        setLedgerGroups(gRes.data || []);
        setFinanceLedgers(fRes.data || []);
        setTaxLedgers(tRes.data || []);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [open]);

  if (!vendor) return null;

  const group = ledgerGroups.find(g => g.id === vendor.groupId);
  const groupName = group ? group.groupName : 'No Group Assigned';

  const salesLedger = financeLedgers.find(l => l.id === vendor.salesLedgerId);
  const purchaseLedger = financeLedgers.find(l => l.id === vendor.purchaseLedgerId);
  const serviceLedger = financeLedgers.find(l => l.id === vendor.serviceLedgerId);
  const labourLedger = financeLedgers.find(l => l.id === vendor.labourSalesId);
  const tdsLedger = taxLedgers.find(l => l.id === vendor.tdsLedgerId);

  const vendorType = vendor.isSupplier && vendor.isCustomer ? 'Customer & Supplier' 
    : vendor.isSupplier ? 'Supplier' 
    : 'Customer';

  const buildTreeData = () => {
    const children = [];
    if (salesLedger) children.push({ name: salesLedger.ledgerName, attributes: { title: salesLedger.ledgerName, subtitle: "Sales Ledger", Icon: IconBuildingBank, color: theme.palette.success.main } });
    if (purchaseLedger) children.push({ name: purchaseLedger.ledgerName, attributes: { title: purchaseLedger.ledgerName, subtitle: "Purchase Ledger", Icon: IconBuildingBank, color: theme.palette.info.main } });
    if (serviceLedger) children.push({ name: serviceLedger.ledgerName, attributes: { title: serviceLedger.ledgerName, subtitle: "Service Ledger", Icon: IconBuildingBank, color: theme.palette.warning.main } });
    if (labourLedger) children.push({ name: labourLedger.ledgerName, attributes: { title: labourLedger.ledgerName, subtitle: "Labour Sales Ledger", Icon: IconBuildingBank, color: theme.palette.warning.main } });
    if (tdsLedger) children.push({ name: tdsLedger.ledgerName, attributes: { title: tdsLedger.ledgerName, subtitle: "TDS Ledger", Icon: IconReceiptTax, color: theme.palette.error.main } });
    
    if (children.length === 0) {
      children.push({ name: 'No Ledgers', attributes: { title: "No Ledgers", subtitle: "Unmapped", Icon: IconBuildingBank, color: theme.palette.grey[500] } });
    }

    return {
      name: vendor.vendorName || vendor.vendorCode,
      attributes: {
        title: vendor.vendorName || vendor.vendorCode,
        subtitle: vendorType,
        Icon: IconUser,
        color: theme.palette.primary.main
      },
      children: [
        {
          name: groupName,
          attributes: {
            title: groupName,
            subtitle: "Ledger Group",
            Icon: IconBuildingStore,
            color: theme.palette.secondary.main
          },
          children
        }
      ]
    };
  };

  const nodeSize = isHorizontal ? { x: 260, y: 150 } : { x: 220, y: 200 };
  const foreignObjectProps = { width: 180, height: 110, x: -90, y: -55 };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { minHeight: '80vh', borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: isDark ? 'background.default' : 'primary.light', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconUser size={24} color={theme.palette.primary.main} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Financial Mappings Map
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><IconX /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, bgcolor: isDark ? 'grey.900' : 'grey.50', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Box sx={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, display: 'flex', gap: 1, bgcolor: 'background.paper', p: 1, borderRadius: 2, boxShadow: 3 }}>
              <Tooltip title="Toggle Layout Direction">
                <IconButton size="small" onClick={() => setIsHorizontal(!isHorizontal)}>
                  {isHorizontal ? <IconArrowDown size={20} /> : <IconArrowRight size={20} />}
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ width: '100%', height: '100%', minHeight: '70vh' }} ref={containerRef}>
              <Tree
                data={buildTreeData()}
                orientation={isHorizontal ? 'horizontal' : 'vertical'}
                pathFunc="step"
                nodeSize={nodeSize}
                renderCustomNodeElement={(rd3tProps) => renderForeignObjectNode({ ...rd3tProps, foreignObjectProps, isDark })}
                translate={translate}
              />
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
