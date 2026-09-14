import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip } from '@mui/material';
import { IconCalendarEvent } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, btnNew } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'utils/axios';

import BOSStatusChip from 'ui-component/bos/BOSStatusChip';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'id', label: 'Schedule ID', minWidth: 100, bold: true },
  { id: 'orderNo', label: 'Order No', minWidth: 130 },
  { id: 'itemCode', label: 'Item Code', minWidth: 120 },
  { id: 'itemName', label: 'Item Name', minWidth: 150 },
  { id: 'uom', label: 'UOM', minWidth: 80 },
  { id: 'orderQty', label: 'Order Qty', minWidth: 100, align: 'right' },
  { id: 'scheduleDate', label: 'Schedule Date', minWidth: 110 },
  { id: 'scheduleQty', label: 'Schedule Qty', minWidth: 100, align: 'right' },
  { id: 'status', label: 'Status', minWidth: 100, render: (row) => <BOSStatusChip status={row.statusName || 'Pending'} /> },
];

export default function CustomerOrderScheduleList() {
  const perms = usePagePermissions(PAGE_CODES.SM_CUSTOMER_ORDER_SCHEDULE);
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const statusFilter = searchParams.get('status');

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/sm/customer-schedules', {
        params: { page, size, status: statusFilter }
      });
      setRows(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const navigate = useNavigate();

  const handleOpenAdd = () => { navigate('/sm/sales/customer/order-schedule/create'); };
  const handleOpenEdit = (row) => { navigate(`/sm/sales/customer/order-schedule/edit/${row.id}`); };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  return (
    <MainCard
      title="Customer Order Schedule"
      secondary={
        <Stack direction="row" spacing={1} alignItems="center">
          {perms.write && (
            <Tooltip title={shortcutTooltip('Create New Schedule', 'Ctrl + N')}>
              <Button variant="contained" color="primary" size="medium" onClick={handleOpenAdd} sx={btnNew}>
                + New
              </Button>
            </Tooltip>
          )}
        </Stack>
      }
    >
      <BOSDataTable
        columns={columns}
        data={rows}
        page={page}
        size={size}
        totalElements={rows.length}
        onPageChange={setPage}
        onSizeChange={setSize}
        loading={loading}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        emptyMessage="No schedules found"
      />
    </MainCard>
  );
}
