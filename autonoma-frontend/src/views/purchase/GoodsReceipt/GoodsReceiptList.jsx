import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { 
    Box, Tooltip, IconButton, Chip, Dialog, DialogTitle, DialogContent, 
    DialogActions, Button, TextField, Table, TableHead, TableRow, TableCell, 
    TableBody, TableContainer, CircularProgress, InputAdornment, Typography, Divider,
    Tabs, Tab, Alert, useTheme, Avatar, Paper
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { IconEye, IconSearch, IconCheck } from '@tabler/icons-react';
import { LocalShipping, ShoppingBag, PostAdd, Inventory } from '@mui/icons-material';
import PageUserManual from 'ui-component/bos/PageUserManual';
import { useNavigate } from 'react-router-dom';
import axios from 'utils/axios';

// Project imports
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import BOSStatusChip from 'ui-component/bos/BOSStatusChip';
import useAuth from 'hooks/useAuth';
import useGoodsReceiptStore from 'store/purchase/useGoodsReceiptStore';
import procurementSettingsService from 'api/procurementSettingsService';

function CreateGrnDialog({ open, onClose, onGenerate, enableGateEntry }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(enableGateEntry === 1 ? 'gate-entry' : 'direct-po');
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [dataList, setDataList] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (open) {
            setActiveTab(enableGateEntry === 1 ? 'gate-entry' : 'direct-po');
        }
    }, [open, enableGateEntry]);

    useEffect(() => {
        let isCurrent = true;
        if (open && user?.divisionId) {
            setSearch("");
            setSelected(null);
            setDataList([]);
            setLoading(true);

            if (activeTab === 'gate-entry') {
                axios.get(`/api/v1/purchase/gate-entry/list/${user.divisionId}?size=50`)
                    .then(res => {
                        if (!isCurrent) return;
                        const content = res.data?.content || res.data || [];
                        const eligible = content.filter(ge => {
                            const st = (ge.statusName || ge.status || "").toUpperCase();
                            return st !== "CANCELLED" && st !== "REJECTED" && st !== "CLOSED" && st !== "GRN_CREATED" && st !== "COMPLETED" && !ge.grnCreatedTime;
                        });
                        setDataList(eligible);
                    })
                    .catch(err => {
                        if (!isCurrent) return;
                        console.error("Failed to load gate entries", err);
                    })
                    .finally(() => {
                        if (isCurrent) setLoading(false);
                    });
            } else if (activeTab === 'direct-po') {
                axios.get(`/api/v1/purchase-order/division/${user.divisionId}`)
                    .then(res => {
                        if (!isCurrent) return;
                        const content = res.data?.content || res.data || [];
                        const eligible = content.filter(po => {
                            const st = (po.statusName || po.status || "").toUpperCase();
                            return st !== "CANCELLED" && st !== "REJECTED" && st !== "CLOSED" && st !== "COMPLETED";
                        });
                        setDataList(eligible);
                    })
                    .catch(err => {
                        if (!isCurrent) return;
                        console.error("Failed to load POs", err);
                    })
                    .finally(() => {
                        if (isCurrent) setLoading(false);
                    });
            } else {
                setDataList([]);
                setLoading(false);
            }
        } else {
            setDataList([]);
            setLoading(false);
        }

        return () => {
            isCurrent = false;
        };
    }, [open, user?.divisionId, activeTab]);

    const filtered = useMemo(() => {
        if (!search.trim()) return dataList;
        const q = search.toLowerCase();
        return dataList.filter(item =>
            (item.gateEntryNo || item.poNo || "").toLowerCase().includes(q) ||
            (item.supplierName || item.supplier || "").toLowerCase().includes(q) ||
            (item.vehicleNo || "").toLowerCase().includes(q)
        );
    }, [dataList, search]);

    const handleConfirm = async () => {
        if (!selected && activeTab !== 'direct-manual') return;
        setGenerating(true);
        try {
            await onGenerate(selected?.id || null, activeTab);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, height: 600, maxHeight: 600, display: 'flex', flexDirection: 'column' } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocalShipping color="primary" />
                    <Typography variant="h3" fontWeight={700}>Select Source for GRN Generation</Typography>
                </Box>
            </DialogTitle>
            <Divider />
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1, bgcolor: 'grey.50' }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(_, val) => setActiveTab(val)}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab 
                        value="gate-entry" 
                        label="Via Gate Entry" 
                        icon={<LocalShipping fontSize="small" />} 
                        iconPosition="start"
                        sx={{ fontWeight: 600 }}
                    />
                    <Tab 
                        value="direct-po" 
                        label="Direct PO Mode (Skip Gate Entry)" 
                        icon={<ShoppingBag fontSize="small" />} 
                        iconPosition="start"
                        sx={{ fontWeight: 600 }}
                    />
                    <Tab 
                        value="direct-manual" 
                        label="Direct Manual GRN" 
                        icon={<PostAdd fontSize="small" />} 
                        iconPosition="start"
                        sx={{ fontWeight: 600 }}
                    />
                </Tabs>
            </Box>

            <DialogContent sx={{ pt: 2.5, px: 3, flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflowY: 'auto' }}>
                {activeTab === 'direct-manual' ? (
                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.lighter', borderRadius: 3, border: '1px dashed', borderColor: 'primary.main', my: 'auto' }}>
                        <PostAdd color="primary" sx={{ fontSize: 52, mb: 1 }} />
                        <Typography variant="h3" fontWeight={700} color="primary.main" gutterBottom>
                            Direct Manual GRN Generation
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 520, mx: 'auto' }}>
                            Generate a Goods Receipt Note directly without requiring a Gate Entry pass or Purchase Order reference. Item quantities and supplier details can be selected on the entry form.
                        </Typography>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="large" 
                            startIcon={<PostAdd />}
                            onClick={() => {
                                onGenerate(null, 'direct-manual');
                                onClose();
                            }}
                        >
                            Proceed to Direct GRN Entry
                        </Button>
                    </Box>
                ) : (
                    <>
                        <TextField 
                            fullWidth 
                            size="small" 
                            placeholder={activeTab === 'gate-entry' ? "Search by Gate Entry No, Vehicle No, Supplier..." : "Search by PO No, Supplier Name..."}
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            sx={{ mb: 2 }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }} 
                        />
                        {loading ? (
                            <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            filtered.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: "center", bgcolor: "grey.50", borderRadius: 2, border: "1px dashed", borderColor: "divider", my: 'auto' }}>
                                    <Alert severity="info" sx={{ mb: 2, textAlign: "left", borderRadius: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {activeTab === 'gate-entry' ? "No pending Gate Entries found for GRN generation." : "No approved Purchase Orders found."}
                                        </Typography>
                                        <Typography variant="body2">
                                            {activeTab === 'gate-entry' 
                                                ? "If materials arrived directly without a security gate pass, you can generate GRN directly from an approved Purchase Order or create a Direct Manual GRN."
                                                : "You can create a Direct Manual GRN directly without linking a Purchase Order."
                                            }
                                        </Typography>
                                    </Alert>
                                    <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                                        {activeTab === 'gate-entry' && (
                                            <Button variant="contained" color="primary" startIcon={<ShoppingBag fontSize="small" />} onClick={() => setActiveTab('direct-po')}>
                                                Switch to Direct PO Mode
                                            </Button>
                                        )}
                                        <Button variant="outlined" color="secondary" startIcon={<PostAdd fontSize="small" />} onClick={() => { onGenerate(null, 'direct-manual'); onClose(); }}>
                                            Create Direct Manual GRN
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <TableContainer sx={{ flex: 1, minHeight: 280, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>{activeTab === 'gate-entry' ? "Gate Entry No" : "PO No"}</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Date</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Supplier</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>{activeTab === 'gate-entry' ? "Vehicle / Details" : "Status"}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtered.map((item, i) => (
                                                <TableRow key={item.id} hover onClick={() => setSelected(item)} selected={selected?.id === item.id}
                                                    sx={{ cursor: "pointer", "&.Mui-selected": { bgcolor: "primary.lighter" }, "&.Mui-selected:hover": { bgcolor: "primary.lighter" } }}>
                                                    <TableCell sx={{ color: "text.secondary" }}>{i + 1}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>{item.gateEntryNo || item.poNo}</TableCell>
                                                    <TableCell>{item.gateEntryDate || item.poDate ? String(item.gateEntryDate || item.poDate).slice(0, 10) : "-"}</TableCell>
                                                    <TableCell>{item.supplierName || item.supplier || "-"}</TableCell>
                                                    <TableCell>
                                                        {activeTab === 'gate-entry' ? (
                                                            <Chip label={item.vehicleNo || item.gatePassType || "MATERIAL"} size="small" color="info" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                                                        ) : (
                                                            <BOSStatusChip status={item.statusName || "APPROVED"} />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )
                        )}
                    </>
                )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Cancel</Button>
                {activeTab !== 'direct-manual' && (
                    <Button onClick={handleConfirm} variant="contained" disabled={!selected || generating} startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={16} />}>
                        {generating ? "Generating..." : "Generate GRN"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

const GoodsReceiptList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const [createOpen, setCreateOpen] = useState(false);
    const [enableGateEntry, setEnableGateEntry] = useState(1);
    
    // Store
    const { receipts, totalCount, loading, searchReceipts } = useGoodsReceiptStore();

    useEffect(() => {
        if (user?.divisionId) {
            procurementSettingsService.getByDivision(user.divisionId)
                .then(res => {
                    const settings = res.data;
                    setEnableGateEntry(settings?.enableGateEntry ?? 1);
                })
                .catch(err => console.error("Failed to fetch procurement settings", err));
        }
    }, [user?.divisionId]);

    const fetchRows = useCallback((params = {}) => {
        if (!user?.divisionId) return;
        searchReceipts({
            divisionId: user.divisionId,
            page: params.page || 0,
            size: params.pageSize || 10,
            grnNo: params.search || ''
        });
    }, [user?.divisionId, searchReceipts]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const handleGenerateGrn = async (sourceId, mode) => {
        setCreateOpen(false);
        if (mode === 'gate-entry') {
            navigate(`/purchase/goods-receipt/entry/new?gateEntryId=${sourceId}`);
        } else if (mode === 'direct-po' || mode === 'po') {
            navigate(`/purchase/goods-receipt/entry/new?poHeadId=${sourceId}`);
        } else {
            navigate(`/purchase/goods-receipt/entry/new?mode=direct`);
        }
    };

    const columns = useMemo(() => [
        { id: 'index', label: 'Sl.No', minWidth: 60 },
        { id: 'grnNo', label: 'GRN No', minWidth: 150 },
        { id: 'grnDate', label: 'Date', minWidth: 120 },
        { id: 'supplierName', label: 'Supplier', minWidth: 200 },
        { id: 'poNo', label: 'PO No', minWidth: 150 },
        { id: 'gateEntryNo', label: 'Gate Entry No', minWidth: 150, render: (row) => row.gateEntryNo || 'N/A (Direct PO)' },
        { 
            id: 'statusName', 
            label: 'Status', 
            minWidth: 120,
            render: (row) => <BOSStatusChip status={row.statusName || 'DRAFT'} />
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 100,
            align: 'center',
            render: (row) => (
                <Tooltip title="View / Edit">
                    <IconButton color="primary" onClick={() => navigate(`/purchase/goods-receipt/entry/${row.id}`)}>
                        <IconEye stroke={1.5} size="1.3rem" />
                    </IconButton>
                </Tooltip>
            )
        }
    ], [navigate]);

    return (
        <>
            <MainCard
                pageCode="PU1130"
                icon={Inventory}
                title="Goods Receipt Note (GRN)"
                subtitle="Manage and track all goods receipts"
                content={false}
                secondary={
                    <BOSTableToolbar
                        onRefresh={fetchRows}
                        exportData={receipts || []}
                        exportFilename="GoodsReceiptList"
                        newLabel="New GRN"
                        onNew={() => setCreateOpen(true)}
                        columns={columns}
                    />
                }
            >
                <BOSDataTable
                    id="goods-receipt-list-table"
                    columns={columns}
                    data={receipts || []}
                    loading={loading}
                    total={totalCount}
                    onPaginationChange={fetchRows}
                    onSearch={fetchRows}
                    onDoubleClickRow={(row) => navigate(`/purchase/goods-receipt/entry/${row.id}`)}
                />
            </MainCard>

            <CreateGrnDialog 
                open={createOpen} 
                onClose={() => setCreateOpen(false)} 
                onGenerate={handleGenerateGrn} 
                enableGateEntry={enableGateEntry}
            />
        </>
    );
};

export default GoodsReceiptList;
