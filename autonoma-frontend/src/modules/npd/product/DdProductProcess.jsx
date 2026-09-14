import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSettings } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| DD PRODUCT PROCESS MASTER ||============================== //

const columns = [
  { id: 'index', label: 'Row Id', minWidth: 70 },
  { id: 'partNo', label: 'Part No', minWidth: 150, bold: true },
  { id: 'partName', label: 'Part Name', minWidth: 200 },
  { id: 'category', label: 'Category', minWidth: 150 },
  { id: 'drawingNo', label: 'Drawing No', minWidth: 120 },
  { id: 'processCount', label: 'Total Processes', minWidth: 150 },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 140 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 140 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 }
];

export default function DdProductProcess() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_PRODUCT_PROCESS);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Set filters for Status and Process Where
  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        isRequired: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      },
      {
        id: 'processWhere',
        label: 'Process Where',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: 'INTERNAL', label: 'INTERNAL' },
          { value: 'EXTERNAL', label: 'EXTERNAL' },
          { value: 'BOTH', label: 'BOTH' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      },
      ...getCommonDateFilters('createdAt', 'updatedAt')
    ];
    dispatch(setFilterConfig(config));
    dispatch(
      setFilters({
        status: 'ACTIVE',
        processWhere: 'All',
        createdAt: '',
        updatedAt: ''
      })
    );
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.PRODUCT_PROCESS);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch product processes:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleOpenAdd = () => {
    navigate('/dd/product-process/create');
  };

  const handleOpenEdit = (row) => {
    navigate(`/dd/product-process/edit/${row.id}`);
  };


  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  const groupedRows = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.productId) {
        if (!map.has(r.productId)) {
          map.set(r.productId, {
            id: r.productId,
            partNo: r.partNo,
            partName: r.partName,
            category: r.category,
            drawingNo: r.drawingNo,
            processCount: 1,
            createdBy: r.createdBy,
            createdAt: r.createdAt,
            updatedBy: r.updatedBy,
            updatedAt: r.updatedAt
          });
        } else {
          const existing = map.get(r.productId);
          existing.processCount++;
          if (r.updatedAt && (!existing.updatedAt || new Date(r.updatedAt) > new Date(existing.updatedAt))) {
            existing.updatedAt = r.updatedAt;
            existing.updatedBy = r.updatedBy;
          }
        }
      }
    });
    return Array.from(map.values());
  }, [rows]);

  const processedRows = useMemo(() => {
    return groupedRows.map((row) => {
      const isUpdated =
        row.updatedAt && row.createdAt && Math.abs(new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime()) > 1000;
      return {
        ...row,
        updatedBy: isUpdated ? row.updatedBy || '-' : '-',
        updatedAt: isUpdated ? row.updatedAt : null
      };
    });
  }, [groupedRows]);

  const filteredRows = useMemo(() => {
    return processedRows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      // 3. Search query
      const matchesSearch = !globalQuery || (row.partNo && row.partNo.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [processedRows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      sx={{
        mx: { xs: -2, sm: -3 },
        width: { xs: 'calc(100% + 32px)', sm: 'calc(100% + 48px)' },
        borderRadius: 0
      }}
      icon={IconSettings}
      title="Product Process Master"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchProcesses}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Product Process', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Product_Process_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="npd-product-process-table"
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
      />
    </MainCard>
  );
}
