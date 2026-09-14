import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IconBuildingSkyscraper } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

// ==============================|| CLIENT MASTER - LIST PAGE (ADMIN LEVEL 5 ONLY) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'clientCode', label: 'Client Code', minWidth: 120, bold: true },
  { id: 'companyName', label: 'Company Name', minWidth: 220 },
  { id: 'shortName', label: 'Short Name', minWidth: 120 },
  { id: 'gstIn', label: 'GST No', minWidth: 150 },
  { id: 'panNo', label: 'PAN No', minWidth: 130 },
  { id: 'emailId', label: 'Email', minWidth: 180 },
  { id: 'mobileNo', label: 'Mobile No', minWidth: 130 },
  { id: 'city', label: 'City', minWidth: 120 },
  { id: 'state', label: 'State', minWidth: 130 },
  { id: 'status', label: 'Status', minWidth: 100 }
];

export default function ClientMasterList({ onNew, onEdit }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isLevel5Admin = Boolean(user?.userLevel >= 5 || user?.role === 'SUPER_ADMIN' || user?.username === 'admin');
  const perms = {
    loading: false,
    enabled: isLevel5Admin,
    read: isLevel5Admin,
    write: isLevel5Admin,
    delete: isLevel5Admin,
    export: isLevel5Admin
  };
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // ── Register search/filter config ─────────────────────────────────────────
  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'Active', label: 'ACTIVE' },
          { value: 'Inactive', label: 'INACTIVE' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'companyName',
        label: 'Company Name',
        type: 'text',
        placeholder: 'Search by Company Name...',
        isStarred: true
      },
      {
        id: 'clientCode',
        label: 'Client Code',
        type: 'text',
        placeholder: 'Search by Client Code...'
      },
      {
        id: 'city',
        label: 'City',
        type: 'text',
        placeholder: 'Search by City...'
      }
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  // ── Fetch companies data ──────────────────────────────────────────────────
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/company-profile/all');
      const list = Array.isArray(response.data) ? response.data : [];
      setRows(list);
    } catch (error) {
      console.error('Failed to fetch client companies:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load client company details.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleOpenAdd = useCallback(() => {
    if (onNew) {
      onNew();
    } else {
      navigate('/client-management/client-master/add');
    }
  }, [onNew, navigate]);

  const handleOpenEdit = useCallback((row) => {
    if (onEdit) {
      onEdit(row);
    } else {
      navigate(`/client-management/client-master/edit/${row.id}`);
    }
  }, [onEdit, navigate]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  // ── Filter / Paginate ─────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    return rows
      .map((r, i) => ({
        ...r,
        index: i + 1,
        status: r.isActive !== false ? 'Active' : 'Inactive'
      }))
      .filter((row) => {
        // Status filter
        const statusFilter = globalFilters?.status || 'All';
        const matchesStatus =
          statusFilter === 'All' ||
          (statusFilter === 'Active' && row.status === 'Active') ||
          (statusFilter === 'Inactive' && row.status === 'Inactive');

        // Company Name filter
        const companyFilter = (globalFilters?.companyName || '').toLowerCase().trim();
        const matchesCompany =
          !companyFilter || (row.companyName && row.companyName.toLowerCase().includes(companyFilter));

        // Client Code filter
        const codeFilter = (globalFilters?.clientCode || '').toLowerCase().trim();
        const matchesCode =
          !codeFilter || (row.clientCode && row.clientCode.toLowerCase().includes(codeFilter));

        // City filter
        const cityFilter = (globalFilters?.city || '').toLowerCase().trim();
        const matchesCity =
          !cityFilter || (row.city && row.city.toLowerCase().includes(cityFilter));

        // Global query filter
        const q = (globalQuery || '').toLowerCase().trim();
        const matchesQuery =
          !q ||
          (row.companyName && row.companyName.toLowerCase().includes(q)) ||
          (row.clientCode && row.clientCode.toLowerCase().includes(q)) ||
          (row.shortName && row.shortName.toLowerCase().includes(q)) ||
          (row.gstIn && row.gstIn.toLowerCase().includes(q)) ||
          (row.panNo && row.panNo.toLowerCase().includes(q)) ||
          (row.emailId && row.emailId.toLowerCase().includes(q)) ||
          (row.mobileNo && row.mobileNo.toLowerCase().includes(q)) ||
          (row.city && row.city.toLowerCase().includes(q)) ||
          (row.state && row.state.toLowerCase().includes(q));

        return matchesStatus && matchesCompany && matchesCode && matchesCity && matchesQuery;
      });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * size, page * size + size),
    [filteredRows, page, size]
  );

  if (!user || (!isLevel5Admin && user.userLevel < 5)) {
    return <Navigate to="/access-denied" replace />;
  }

  return (
    <MainCard
      icon={IconBuildingSkyscraper}
      title="Client Master"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchCompanies}
          onNew={perms.write ? handleOpenAdd : undefined}
          newTooltip={shortcutTooltip('Create New Client / Company', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportColumns={[
            { header: 'Client Code', key: 'clientCode' },
            { header: 'Company Name', key: 'companyName' },
            { header: 'Short Name', key: 'shortName' },
            { header: 'GST No', key: 'gstIn' },
            { header: 'PAN No', key: 'panNo' },
            { header: 'Email', key: 'emailId' },
            { header: 'Mobile No', key: 'mobileNo' },
            { header: 'City', key: 'city' },
            { header: 'State', key: 'state' },
            { header: 'Status', key: 'status' }
          ]}
          exportFilename="Client_Master"
          hasExportPermission={perms.export}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onDoubleClickRow={handleOpenEdit}
        onEditRow={handleOpenEdit}
      />
    </MainCard>
  );
}
