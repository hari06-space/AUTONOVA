import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Button } from '@mui/material';
import { IconChartLine } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';
import { BOSDataTable } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import QuotationFollowUpPopup from './QuotationFollowUpPopup';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'custName', label: 'Cust Name', minWidth: 150 },
  { id: 'custGroup', label: 'Cust Group', minWidth: 150 },
  { id: 'partNo', label: 'Part No', minWidth: 120 },
  { id: 'partName', label: 'Part Name', minWidth: 150 },
  { id: 'quoteNo', label: 'Quote No', minWidth: 120, bold: true },
  { id: 'quoteDate', label: 'Quote Date', minWidth: 120 },
  { id: 'qty', label: 'Qty', minWidth: 80, align: 'right' },
  { id: 'price', label: 'Price', minWidth: 100, align: 'right' },
  { id: 'totalAmount', label: 'Total Amount', minWidth: 120, align: 'right' },
  { id: 'mailSentStatus', label: 'Mail Sent Status', minWidth: 120 },
  { id: 'followDate', label: 'Follow Date', minWidth: 120 }
];

export default function QuotationFollowUp() {
  const perms = usePagePermissions(PAGE_CODES.SM_QUOTATION_FOLLOW_UP); // Correct page code
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);
  
  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const [followUpRes, quotationRes, custRes, prodRes] = await Promise.all([
         axios.get('/api/sm/quotation-follow-up').catch(() => ({ data: [] })),
         axios.get('/api/sm/quotation').catch(() => ({ data: [] })),
         axios.get('/api/sm/customers').catch(() => ({ data: [] })),
         axios.get('/api/master/npd/product-master').catch(() => ({ data: [] }))
      ]);

      const custMap = {};
      (custRes.data || []).forEach(c => custMap[c.id] = c);

      const prodMap = {};
      (prodRes.data || []).forEach(p => prodMap[p.id] = p);

      const followUpMap = {};
      (followUpRes.data || []).forEach(f => {
         const key = `${f.quotationId}_${f.partId}`;
         if (!followUpMap[key] || new Date(f.followUpDate) > new Date(followUpMap[key].followUpDate)) {
             followUpMap[key] = f;
         }
      });

      const rowsData = [];
      (quotationRes.data || []).forEach(q => {
          const statusName = String(q.quotationStatusName || q.status || '').trim().toUpperCase();
          const isVerified = statusName === 'VERIFIED' || q.quotationStatus === 24;
          if (!isVerified) return;

          const cust = custMap[q.customerId] || {};
          (q.parts || []).forEach(part => {
              const prod = prodMap[part.partNoId] || {};
              const followUp = followUpMap[`${q.id}_${part.partNoId}`] || {};

              rowsData.push({
                 id: `${q.id}_${part.id}`,
                 quotationId: q.id,
                 customerId: q.customerId,
                 partId: part.partNoId,
                 custName: cust.customerName || '-',
                 custGroup: cust.segment || cust.customerGroup || '-',
                 partNo: prod.itemNo || prod.partNo || '-',
                 partName: prod.itemName || prod.partName || '-',
                 quoteNo: q.quotationNo || '-',
                 quoteDate: q.quotationDate ? new Date(q.quotationDate).toLocaleDateString('en-GB') : '-',
                 currency: q.currency || '',
                 exchangeRate: q.exchangeRate || '',
                 enquiryMode: q.enquiryMode || '',
                 qty: part.qty || 0,
                 price: part.amount || 0,
                 totalAmount: part.totalValue || 0,
                 mailSentStatus: q.mailSentStatus ? 'Yes' : '-',
                 followDate: followUp.followUpDate ? new Date(followUp.followUpDate).toLocaleDateString('en-GB') : '-'
              });
          });
      });

      setRows(rowsData);
    } catch (error) {
      console.error('Failed to fetch quotation parts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);

  const handleSelectionChange = (row, newSelected) => {
    // BOSDataTable passes the row and the new array of selected row IDs
    setSelectedRows(newSelected || []);
  };

  const handleOpenPopup = () => {
    if (selectedRows.length !== 1) {
      dispatch(openSnackbar({ open: true, message: 'Please select exactly one row to follow up.', variant: 'warning' }));
      return;
    }
    setPopupOpen(true);
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenPopup
  });

  const selectedRowData = selectedRows.length === 1 ? rows.find(r => r.id === selectedRows[0]) : null;

  return (
    <MainCard fullWidth
      icon={IconChartLine}
      title={"Quotation Follow Up"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          {perms.write && (
             <Button variant="contained" onClick={handleOpenPopup} disabled={selectedRows.length !== 1} startIcon={<IconChartLine />}>
                Follow Up
             </Button>
          )}
        </Stack>
      }
    >
      <BOSDataTable
        columns={columns}
        rows={rows}
        loading={loading}
        selectable={true}
        onClickRow={handleSelectionChange}
        disableSearchFilter={false}
      />
      
      {popupOpen && selectedRowData && (
        <QuotationFollowUpPopup
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          onSave={fetchFollowUps}
          rowData={selectedRowData}
        />
      )}
    </MainCard>
  );
}
