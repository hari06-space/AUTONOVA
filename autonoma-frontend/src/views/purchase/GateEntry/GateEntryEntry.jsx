import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, Grid, Typography, Button, CircularProgress, IconButton, Tooltip,
    TextField, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Stepper, Step, StepLabel, Dialog, DialogTitle, DialogContent, DialogActions,
    InputAdornment, Chip, Accordion, AccordionSummary, AccordionDetails,
    Avatar, List, ListItem, ListItemText, Paper, alpha, useTheme, Divider
} from "@mui/material";
import MainCard from "ui-component/cards/MainCard";
import { BOSTextField, BOSAutocomplete, BOSStatusChip, errorStyle } from "ui-component/bos";
import BOSFileUpload from "ui-component/bos/BOSFileUpload";
import { getFileViewUrl } from "utils/upload-helper";
import useGateEntryStore from "store/purchase/useGateEntryStore";
import useGoodsReceiptStore from "store/purchase/useGoodsReceiptStore";
import useAuth from "hooks/useAuth";
import useProcurementSettingsStore from "store/useProcurementSettingsStore";
import useRealtimeRefresh from "hooks/useRealtimeRefresh";
import {
    IconDeviceFloppy, IconArrowLeft, IconPrinter, IconPlus, IconTrash,
    IconSearch, IconCheck, IconHistory, IconPaperclip, IconTruck
} from "@tabler/icons-react";
import { CheckCircle, RadioButtonUnchecked, ExpandMore, LocalShipping } from "@mui/icons-material";
import { bos, bosConfirm } from "ui-component/bos/BOSConfirmDialog";
import axios from "utils/axios";
import autonovaLogo from 'assets/images/autonova-logo.png';



// ─── Add Source Dialog ─────────────────────────────────────────────────────────
function AddSourceDialog({ open, onClose, onAdd, existingSourceIds, supplierId }) {
    const [search, setSearch] = useState("");
    const [poList, setPoList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (!open) { setSearch(""); setSelected(null); return; }
        setLoading(true);
        axios.get("/api/v1/purchase/gate-entry/sources/open-pos")
            .then(r => setPoList(r.data || []))
            .catch(() => setPoList([]))
            .finally(() => setLoading(false));
    }, [open]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return (poList || []).filter(p =>
            !(existingSourceIds || []).includes(Number(p.id)) &&
            (!supplierId || Number(p.supplierId) === Number(supplierId)) &&
            (!q || (p.poNo || "").toLowerCase().includes(q) || (p.supplierName || "").toLowerCase().includes(q))
        );
    }, [poList, search, existingSourceIds, supplierId]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocalShipping color="primary" />
                    Add Source Document (Purchase Order)
                </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
                <TextField fullWidth size="small" placeholder="Search by PO No or Supplier name..."
                    value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }} />
                {loading ? <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box> : (
                    <TableContainer sx={{ maxHeight: 360, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>PO No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>PO Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Supplier</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.length === 0
                                    ? <TableRow><TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 4 }}>No open POs available.</TableCell></TableRow>
                                    : filtered.map((po, i) => (
                                        <TableRow key={po.id} hover onClick={() => setSelected(po)} selected={selected?.id === po.id}
                                            sx={{ cursor: "pointer", "&.Mui-selected": { bgcolor: "primary.lighter" }, "&.Mui-selected:hover": { bgcolor: "primary.lighter" } }}>
                                            <TableCell sx={{ color: "text.secondary" }}>{i + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>{po.poNo}</TableCell>
                                            <TableCell>{po.poDate ? String(po.poDate).slice(0, 10) : "-"}</TableCell>
                                            <TableCell>{po.supplierName}</TableCell>
                                            <TableCell>
                                                <Chip label={po.statusName || "ACTIVE"} size="small" color="info" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Cancel</Button>
                <Button onClick={() => { if (selected) { onAdd(selected); onClose(); } }} variant="contained" disabled={!selected} startIcon={<IconCheck size={16} />}>
                    Add PO
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Items Grid ────────────────────────────────────────────────────────────────
function ItemsGrid({ transactions, selectedSourceKey, onQtyChange, onRemoveItem, isReadOnly, itemErrors }) {
    const theme = useTheme();
    const items = useMemo(() => {
        if (!selectedSourceKey) return [];
        return (transactions || []).filter(t =>
            t.sourceDocumentNo === selectedSourceKey || String(t.sourceHeadId) === String(selectedSourceKey)
        );
    }, [transactions, selectedSourceKey]);

    if (!selectedSourceKey) return (
        <Box sx={{ py: 5, textAlign: "center", color: "text.disabled" }}>
            <LocalShipping sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">Select a source document on the left to view and edit items.</Typography>
        </Box>
    );

    if (items.length === 0) return (
        <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2">No items found for this source. The PO may not have active line items.</Typography>
        </Box>
    );

    return (
        <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100", width: 36 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100", minWidth: 300 }}>ITEM *</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>SCHEDULE</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>UOM</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }} align="right">PO Qty</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }} align="right">GE Issued</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }} align="right">Pending Qty</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100", minWidth: 100 }} align="center">Delivered Qty *</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Remarks</TableCell>
                        {!isReadOnly && <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100", width: 40 }} align="center"></TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item, idx) => {
                        const hasErr = itemErrors && itemErrors[item.itemId];
                        return (
                            <TableRow key={idx} hover>
                                <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem" }}>{idx + 1}</TableCell>
                                <TableCell sx={{ p: 1 }}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Avatar variant="rounded" src={item.imageUrl || autonovaLogo} sx={{ width: 48, height: 48, boxShadow: theme.shadows[1], bgcolor: '#fff', '& img': { objectFit: 'contain' } }} />
                                        <Box flex={1}>
                                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                                                {item.itemName || item.itemDescription || item.itemCode}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                                                {item.itemCode && (
                                                    <Typography variant="caption" display="block">
                                                        <span style={{ fontWeight: 600, color: theme.palette.primary.main, border: `1px solid ${theme.palette.primary.main}`, padding: '1px 4px', borderRadius: '4px' }}>{item.itemCode}</span>
                                                    </Typography>
                                                )}
                                                {item.hsnCode && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        <span style={{ fontWeight: 600, color: theme.palette.error.main, border: `1px solid ${theme.palette.error.main}`, padding: '1px 4px', borderRadius: '4px' }}>HSN: {item.hsnCode}</span>
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: "text.secondary" }}>
                                    {item.scheduleDate ? (
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} color="primary.main">{item.scheduleDate}</Typography>
                                            <Typography variant="caption" color="text.secondary">Qty: {item.scheduleQty}</Typography>
                                        </Box>
                                    ) : "-"}
                                </TableCell>
                                <TableCell sx={{ color: "text.secondary" }}>{item.uom}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 500 }}>{item.qty ?? "-"}</TableCell>
                                <TableCell align="right" sx={{ color: "info.main", fontWeight: 600 }}>{item.alreadyDeliveredQty ?? "-"}</TableCell>
                                <TableCell align="right" sx={{ color: item.pendingQty > 0 ? "warning.main" : "text.secondary", fontWeight: 600 }}>{item.pendingQty ?? "-"}</TableCell>
                                <TableCell align="center">
                                    {isReadOnly ? <Typography variant="body2">{item.deliveredQty}</Typography> :
                                        <TextField type="number" size="small" variant="outlined"
                                            value={item.deliveredQty ?? ""}
                                            onChange={e => onQtyChange(item, "deliveredQty", e.target.value)}
                                            error={hasErr}
                                            inputProps={{ min: 0, style: { textAlign: "right", MozAppearance: "textfield" } }}
                                            sx={{ width: 90, "& input::-webkit-outer-spin-button,& input::-webkit-inner-spin-button": { display: "none" }, ...(hasErr ? { "& fieldset": { borderColor: "error.main" } } : {}) }}
                                        />
                                    }
                                </TableCell>

                                <TableCell>
                                    {isReadOnly ? <Typography variant="body2" sx={{ color: "text.secondary" }}>{item.itemRemarks}</Typography> :
                                        <TextField size="small" variant="outlined" value={item.itemRemarks ?? ""}
                                            onChange={e => onQtyChange(item, "itemRemarks", e.target.value)}
                                            sx={{ width: 130 }} />
                                    }
                                </TableCell>
                                {!isReadOnly && (
                                    <TableCell align="center">
                                        <IconButton size="small" color="error" onClick={() => onRemoveItem(item)} title="Remove Item">
                                            <IconTrash size={16} />
                                        </IconButton>
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function GateEntryEntry() {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { user } = useAuth();
    const { currentGateEntry, allowedActions, loading, fetchGateEntryById, fetchAllowedActions, createGateEntry, updateGateEntry, processAction } = useGateEntryStore();
    const { settings, fetchSettings } = useProcurementSettingsStore();
    const requireDriverDetails = settings?.requireDriverLicense === 1;

    useRealtimeRefresh((force, detail) => {
        const entity = typeof detail === 'string' ? detail : detail?.entityName;
        if (entity && (entity.includes('ProcurementSettings') || entity.includes('settings'))) {
            if (user?.divisionId) {
                fetchSettings(user.divisionId);
            }
        }
    });

    const [formData, setFormData] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [transportModes, setTransportModes] = useState([]);
    const [selectedSourceKey, setSelectedSourceKey] = useState(null);
    const [addSourceOpen, setAddSourceOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [shakeFields, setShakeFields] = useState({});
    const [saving, setSaving] = useState(false);

    const isNew = !id || id === "new";
    const statusName = formData?.statusName?.toUpperCase() || "OPEN";
    const normStatus = statusName.replace(/[\s]+/g, "_");
    const isReadOnly = !isNew && ["CLOSED", "GRN_CREATED", "COMPLETED", "CANCELLED", "REJECTED"].includes(normStatus);

    const update = useCallback((field, val) => setFormData(f => ({ ...f, [field]: val })), []);

    // ─── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (id && id !== "new") { fetchGateEntryById(id); fetchAllowedActions(id); }
        else setFormData({
            entryType: "INWARD",
            gatePassType: "MATERIAL_RECEIPT",
            gateEntryDate: new Date().toISOString().split("T")[0],
            gateNo: "1",
            transactions: [], visitors: [], sources: [], attachments: []
        });
    }, [id]);
    
    useEffect(() => {
        if (user?.divisionId) {
            fetchSettings(user.divisionId);
        }
    }, [user?.divisionId, fetchSettings]);

    useEffect(() => { if (currentGateEntry && id && id !== "new") setFormData(currentGateEntry); }, [currentGateEntry, id]);

    useEffect(() => {
        axios.get("/api/master/vendors?type=supplier")
            .then(res => setSuppliers((res.data || []).map(s => ({ value: s.id, label: s.ledgerName }))))
            .catch(() => { });

        axios.get("/api/sm/despatch-mode")
            .then(res => setTransportModes((res.data || []).map(m => ({
                value: m.modeName || m.despatchMode || m.description || m.termName,
                label: m.modeName || m.despatchMode || m.description || m.termName
            }))))
            .catch(() => { });
    }, []);

    // ─── Add Source from PO ────────────────────────────────────────────────────
    const handleAddSource = useCallback(async (po) => {
        try {
            const res = await axios.get(`/api/v1/purchase/gate-entry/sources/po/${po.id}`);
            const poDetail = res.data;

            // Build transactions from all PO items
            const newItems = (poDetail.items || [])
                .filter(item => item.pendingQty > 0)
                .map(item => ({
                sourceHeadId: po.id,
                sourceDocumentNo: po.poNo,
                sourceType: "PURCHASE_ORDER",
                poTransId: item.id,
                purchaseScheduleId: item.scheduleId,
                scheduleDate: item.scheduleDate,
                scheduleQty: item.scheduleQty,
                itemId: item.itemId,
                itemCode: item.itemCode,
                itemName: item.itemName,
                uom: item.uom,
                qty: item.qty,
                pendingQty: item.pendingQty,
                alreadyDeliveredQty: item.alreadyDeliveredQty,
                unitPrice: item.unitPrice,
                hsnCode: item.hsnCode,
                deliveredQty: null,
                itemRemarks: "",
            }));

            const src = {
                sourceType: "PURCHASE_ORDER",
                sourceHeadId: po.id,
                sourceDocumentNo: po.poNo,
                supplierName: poDetail.supplierName,
            };

            if (newItems.length === 0) {
                bos.info("No Pending Items", "All items in this Purchase Order have already been fully delivered.");
                return;
            }

            setFormData(f => {
                const updated = {
                    ...f,
                    sources: [...(f.sources || []), src],
                    transactions: [...(f.transactions || []), ...newItems],
                };
                // Auto-fill header from PO if not already set
                if (!f.supplierId && poDetail.supplierId) {
                    updated.supplierId = poDetail.supplierId;
                    updated.supplierName = poDetail.supplierName;
                }
                if (!f.transporterId && poDetail.supplierId) {
                    updated.transporterId = poDetail.supplierId;
                }
                return updated;
            });
            setSelectedSourceKey(po.poNo);
        } catch (e) {
            bos.error("Error", "Failed to load PO details: " + (e?.message || ""));
        }
    }, []);

    const handleRemoveSource = useCallback((src) => {
        setFormData(f => ({
            ...f,
            sources: (f.sources || []).filter(s => s.sourceDocumentNo !== src.sourceDocumentNo),
            transactions: (f.transactions || []).filter(t => t.sourceDocumentNo !== src.sourceDocumentNo),
        }));
        setSelectedSourceKey(prev => prev === src.sourceDocumentNo ? null : prev);
    }, []);

    const handleRemoveItem = useCallback((itemToRemove) => {
        setFormData(f => ({
            ...f,
            transactions: (f.transactions || []).filter(t => t.poTransId !== itemToRemove.poTransId)
        }));
    }, []);

    const handleQtyChange = useCallback((item, field, val) => {
        let parsedVal = field === "itemRemarks" ? val : (val === "" ? null : parseFloat(val));

        if (field === "deliveredQty" && parsedVal !== null && item.pendingQty != null && parsedVal > item.pendingQty) {
            bos.warning("Invalid Quantity", `Delivered quantity cannot exceed pending quantity (${item.pendingQty}).`);
            parsedVal = item.pendingQty;
        }

        setFormData(f => ({
            ...f,
            transactions: f.transactions.map(t =>
                (t.itemId === item.itemId && t.sourceDocumentNo === item.sourceDocumentNo)
                    ? { ...t, [field]: parsedVal }
                    : t
            )
        }));
    }, []);

    const updateVisitor = useCallback((field, val) => {
        setFormData(f => ({
            ...f,
            visitors: f.visitors?.length > 0 ? [{ ...f.visitors[0], [field]: val }] : [{ [field]: val }]
        }));
    }, []);
    const visitor = formData?.visitors?.[0] || {};

    // ─── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};

        // Header validations
        if (!formData?.entryType) errs.entryType = true;
        if (!formData?.gatePassType) errs.gatePassType = true;
        if (!formData?.gateEntryDate) errs.gateEntryDate = true;
        if (!formData?.supplierId) errs.supplierId = true;

        const requireDriverDetails = settings?.requireDriverLicense === 1;
        if (requireDriverDetails) {
            const vis = formData?.visitors?.[0] || {};
            if (!vis.driverName || vis.driverName.trim() === "" || vis.driverName === "N/A") errs.driverName = true;
            if (!vis.driverMobile || vis.driverMobile.trim() === "" || vis.driverMobile === "N/A") errs.driverMobile = true;
            if (!vis.driverLicenseNo || vis.driverLicenseNo.trim() === "") errs.driverLicenseNo = true;
            if (!vis.licenseExpiry) errs.licenseExpiry = true;
            if (!vis.emergencyContact || vis.emergencyContact.trim() === "") errs.emergencyContact = true;
        }

        // Source documents required for INWARD MATERIAL_RECEIPT
        if (formData?.entryType === "INWARD" && formData?.gatePassType === "MATERIAL_RECEIPT") {
            if (!formData?.sources?.length) errs.sources = true;
        }

        // Item qty validation: deliveredQty required for each item
        const itemErrs = {};
        (formData?.transactions || []).forEach(t => {
            if (t.deliveredQty === null || t.deliveredQty === undefined || t.deliveredQty === "") {
                itemErrs[t.itemId] = true;
            }
        });
        if (Object.keys(itemErrs).length > 0) errs.items = itemErrs;

        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            setShakeFields({ ...errs });
            setTimeout(() => setShakeFields({}), 600);
            return false;
        }
        return true;
    };

    // ─── Save / Delete ─────────────────────────────────────────────────────────
    const handleDelete = async () => {
        const confirmed = await bosConfirm({ title: "Are you sure?", message: "You won't be able to revert this!", type: "warning", confirmText: "Yes, delete it!" });
        if (confirmed) {
            try {
                await axios.delete(`/api/v1/purchase/gate-entry/${id}`);
                bos.success("Deleted!", "Gate Entry has been deleted.");
                navigate("/purchase/gate-entry/list");
            } catch (err) {
                bos.error("Error", err?.response?.data?.message || "Failed to delete Gate Entry");
            }
        }
    };

    const handleCreateGrn = async () => {
        try {
            setSaving(true);
            const generateFromGateEntry = useGoodsReceiptStore.getState().generateFromGateEntry;
            const res = await generateFromGateEntry(id, user?.divisionId, user?.userId);
            bos.success("GRN Generated!", `GRN No: ${res.grnNo}`);
            navigate(`/purchase/goods-receipt/entry/${res.id}`);
        } catch (err) {
            bos.error("Error", err?.message || "Failed to generate GRN from Gate Entry");
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (isReadOnly) {
            bos.error("Read Only", `This Gate Entry is in ${statusName} status and cannot be modified.`);
            return;
        }
        if (!validate()) {
            bos.warning("Validation Error", errors.sources ? "Please add at least one source document (PO) before saving." : errors.items ? "Please enter Delivered Qty for all line items." : "Please fill all mandatory fields marked with *.");
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData, divisionId: user?.divisionId };
            
            if (payload.lrDate === '') {
                payload.lrDate = null;
            }

            if (payload.visitors && payload.visitors.length > 0) {
                payload.visitors = payload.visitors.map(visitor => ({
                    ...visitor,
                    licenseExpiry: visitor.licenseExpiry === '' ? null : visitor.licenseExpiry,
                    grossWeight: visitor.grossWeight === '' ? null : visitor.grossWeight,
                    tareWeight: visitor.tareWeight === '' ? null : visitor.tareWeight,
                    netWeight: visitor.netWeight === '' ? null : visitor.netWeight,
                }));
            }

            if (payload.attachments && payload.attachments.length > 0) {
                payload.attachments = payload.attachments.map(att => ({
                    ...att,
                    id: att.id && /^\d+$/.test(String(att.id)) ? parseInt(att.id, 10) : null
                }));
            }

            const result = isNew ? await createGateEntry(payload) : await updateGateEntry(id, payload);
            bos.success(isNew ? "Gate Entry Created!" : "Saved!", `GE No: ${result.gateEntryNo}`);
            if (isNew && result?.id) navigate(`/purchase/gate-entry/entry/${result.id}`);
        } catch (e) {
            bos.error("Error", e?.message || "Failed to save Gate Entry");
        } finally {
            setSaving(false);
        }
    };

    const handleAction = async (action) => {
        const confirmed = await bosConfirm({ title: `Process Action: "${action.replace(/_/g, " ")}"?`, message: "Are you sure you want to proceed?", type: "question" });
        if (confirmed) {
            try {
                await processAction(id, action);
                fetchAllowedActions(id);
                fetchGateEntryById(id);
                bos.success("Done!", `"${action.replace(/_/g, " ")}" processed.`);
            } catch (e) { bos.error("Error", e?.message || "Failed"); }
        }
    };

    if (loading && !formData) return <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress /></Box>;
    if (!formData) return null;

    const existingSourceIds = (formData.sources || []).map(s => Number(s.sourceHeadId)).filter(Boolean);

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 4 }}>
            <style>{`@keyframes shakeField{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}.shake-field{animation:shakeField .5s ease}`}</style>

            {/* ── Sticky Header ── */}
            <Paper elevation={0} sx={{
                position: "sticky", top: 0, zIndex: 10, px: 2, py: 1.5, mb: 1.5, borderRadius: 3,
                bgcolor: "background.paper", backgroundImage: "none", border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, color: "#fff", width: 42, height: 42, boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}` }}>
                        <LocalShipping fontSize="small" />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>
                            {isNew ? "New Gate Entry" : `Gate Entry: ${formData.gateEntryNo}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {isNew ? "Create a new inward/outward gate entry" : `Division: ${user?.divisionName}`}
                        </Typography>
                    </Box>
                    {!isNew && <BOSStatusChip status={statusName} />}
                </Box>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <Button variant="outlined" size="small" startIcon={<IconArrowLeft size={16} />} onClick={() => navigate("/purchase/gate-entry/list")}>Back</Button>
                    {!isNew && <Button variant="outlined" size="small" startIcon={<IconPrinter size={16} />}>Print</Button>}
                    {!isNew && normStatus === "OPEN" && (
                        <Button variant="outlined" color="error" size="small" startIcon={<IconTrash size={16} />} onClick={handleDelete}>Delete</Button>
                    )}
                    {!isNew && normStatus === "OPEN" && (
                        <Button variant="contained" color="success" size="small"
                            onClick={handleCreateGrn} disabled={saving}>
                            Create GRN
                        </Button>
                    )}
                    {!isReadOnly && (
                        <Button variant="contained" size="small"
                            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <IconDeviceFloppy size={16} />}
                            onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Gate Entry"}
                        </Button>
                    )}

                </Box>
            </Paper>

            <Box sx={{ px: { xs: 2, lg: 1 }, display: "flex", flexDirection: "column", gap: 1 }}>


                {/* ── General Info ── */}
                <Box sx={{ display: "flex", width: "100%", gap: 1, alignItems: "stretch" }}>
                    <MainCard stretch={false} sx={{ flex: 1, borderRadius: 2 }}>
                        <Grid container spacing={1.5} sx={{ width: '100%' }}>
                            {/* Row 1 */}
                            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSTextField label="Gate No" value={formData.gateNo || ""} onChange={v => update("gateNo", v?.target?.value ?? v)} disabled={isReadOnly} />
                            </Grid>
                            <Grid item xs={12} md={2} className={shakeFields.entryType ? "shake-field" : ""} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSAutocomplete label="Entry Type *" value={formData.entryType}
                                    onChange={v => { update("entryType", v?.value ?? v); setErrors(e => ({ ...e, entryType: false })); }}
                                    options={[{ value: "INWARD", label: "INWARD" }, { value: "OUTWARD", label: "OUTWARD" }]}
                                    disabled={!isNew} sx={errorStyle(errors.entryType)}
                                    className={errors.entryType ? "bos-error-field" : ""} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2} className={shakeFields.gatePassType ? "shake-field" : ""} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSAutocomplete label="Gate Pass Type *" value={formData.gatePassType}
                                    onChange={v => { update("gatePassType", v?.value ?? v); setErrors(e => ({ ...e, gatePassType: false })); }}
                                    options={[
                                        { value: "MATERIAL_RECEIPT", label: "Material Receipt" },
                                        { value: "RETURNABLE", label: "Returnable" },
                                        { value: "NON_RETURNABLE", label: "Non-Returnable" },
                                        { value: "VISITOR", label: "Visitor" }
                                    ]}
                                    disabled={isReadOnly} sx={errorStyle(errors.gatePassType)}
                                    className={errors.gatePassType ? "bos-error-field" : ""} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2} className={shakeFields.supplierId ? "shake-field" : ""} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSAutocomplete label="Supplier / Party *" value={formData.supplierId} fullWidth
                                    onChange={v => {
                                        const newVal = v?.value ?? v;
                                        setFormData(f => ({ ...f, supplierId: newVal, transporterId: f.transporterId || newVal }));
                                        setErrors(e => ({ ...e, supplierId: false }));
                                    }}
                                    options={suppliers} disabled={isReadOnly || !isNew} sx={errorStyle(errors.supplierId)}
                                    className={errors.supplierId ? "bos-error-field" : ""}
                                    helperText={!isNew ? "Supplier cannot be changed after creation" : ""} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSAutocomplete label="Transport Mode" value={formData.transportMode}
                                    onChange={v => update("transportMode", v?.value ?? v)}
                                    options={transportModes} disabled={isReadOnly} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSAutocomplete label="Transporter" value={formData.transporterId}
                                    onChange={v => update("transporterId", v?.value ?? v)}
                                    options={suppliers} disabled={isReadOnly} />
                            </Grid>

                            {/* Row 2 */}
                            <Grid item xs={6} md={2} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSTextField label="Vehicle No" value={formData.vehicleNo || ""} onChange={v => update("vehicleNo", v?.target?.value ?? v)} disabled={isReadOnly} />
                            </Grid>
                            <Grid item xs={6} md={2} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSTextField label="LR / RR No" value={formData.lrNo || ""} onChange={v => update("lrNo", v?.target?.value ?? v)} disabled={isReadOnly} />
                            </Grid>
                            <Grid item xs={6} md={2} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSTextField label="LR Date" type="date" value={formData.lrDate || ""} onChange={v => update("lrDate", v?.target?.value ?? v)} disabled={isReadOnly} />
                            </Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSTextField label="Invoice No" value={formData.invoiceNo || ""} onChange={v => update("invoiceNo", v?.target?.value ?? v)} disabled={isReadOnly} />
                            </Grid>
                            <Grid item xs={12} md={2.5} sx={{ width: { xs: '100%', md: '99%' } }}>
                                <BOSTextField
                                    fullWidth
                                    label={"Remarks"}
                                    multiline
                                    rows={2}
                                    value={formData.remarks || ""}
                                    onChange={e => update("remarks", e?.target?.value ?? e)}
                                    disabled={isReadOnly}
                                    disableRichText
                                    sx={{ '& textarea': { resize: 'both !important' } }}
                                />


                            </Grid>

                        </Grid>
                    </MainCard>

                    {/* Right card: GE No + Date */}
                    <MainCard stretch={false} sx={{ width: { xs: "100%", md: 220 }, flexShrink: 0, borderRadius: 2 }}>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%", justifyContent: "center" }}>
                            <Typography variant="h4" fontWeight={800} sx={{
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            }}>
                                Document Reference :-
                            </Typography>
                            <BOSTextField label="GE No" value={formData.gateEntryNo || ""} placeholder="Auto Generated" disabled
                                sx={{ "& .MuiInputBase-input": { fontWeight: "bold", color: theme.palette.primary.main } }} />
                            <BOSTextField label="Gate Entry Date *" type="date" value={formData.gateEntryDate || ""}
                                disabled={true} sx={errorStyle(errors.gateEntryDate)}
                                className={errors.gateEntryDate ? "bos-error-field" : ""} />
                        </Box>
                    </MainCard>
                </Box>

                {/* ── Source Documents + Items ── */}
                <MainCard stretch={false}
                    title={<Typography variant="h5" fontWeight={700}>Items / Source Documents</Typography>}
                    secondary={
                        !isReadOnly && formData.entryType !== "OUTWARD" && (
                            <Button size="small" variant="contained" color="primary"
                                startIcon={<IconPlus size={14} />}
                                onClick={() => setAddSourceOpen(true)}
                                className={shakeFields.sources ? "shake-field" : ""}>
                                Add PO Source
                            </Button>
                        )
                    }
                    sx={{ borderRadius: 2 }}
                >
                    <Grid container spacing={2} sx={{ width: '100%' }}>
                        {/* Left: Source list */}
                        <Grid item xs={12} md={3} sx={{ width: { xs: '100%', md: '28%' } }}>
                            <Box sx={{ border: "1px solid", borderColor: errors.sources ? "error.main" : "divider", borderRadius: 2, overflow: "hidden", height: "100%" }}>
                                <Box sx={{ bgcolor: "grey.100", px: 2, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="subtitle2" fontWeight={700} color={errors.sources ? "error" : "text.primary"}>
                                        Source Documents {errors.sources && <span style={{ color: "red" }}>*</span>}
                                    </Typography>
                                    <Box sx={{ px: 1, py: 0.5, bgcolor: errors.sources ? alpha(theme.palette.error.main, 0.08) : "white", borderRadius: 1, border: "1px dashed", borderColor: errors.sources ? "error.main" : "grey.300", textAlign: "right" }}>
                                        <Typography variant="caption" color={errors.sources ? "error" : "text.secondary"} fontWeight={700} display="block" sx={{ lineHeight: 1.2 }}>
                                            {errors.sources ? "⚠ Source Required!" : `Sources: ${formData.sources?.length || 0}`}
                                        </Typography>
                                        <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1.2 }}>{formData.transactions?.length || 0} Items</Typography>
                                    </Box>
                                </Box>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "grey.50" }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", width: 50 }}>TYPE</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>DOC NO</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>SUPPLIER</TableCell>
                                            {!isReadOnly && <TableCell sx={{ width: 36 }} />}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {!formData.sources?.length ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ color: errors.sources ? "error.main" : "text.secondary", py: 3, fontSize: "0.75rem" }}>
                                                    {errors.sources ? "⚠ Add a PO source document" : "No sources added."}
                                                </TableCell>
                                            </TableRow>
                                        ) : formData.sources.map((src, idx) => (
                                            <TableRow key={idx} hover
                                                onClick={() => setSelectedSourceKey(src.sourceDocumentNo)}
                                                selected={selectedSourceKey === src.sourceDocumentNo}
                                                sx={{ cursor: "pointer", "&.Mui-selected": { bgcolor: "primary.lighter" }, "&.Mui-selected:hover": { bgcolor: "primary.lighter" } }}>
                                                <TableCell sx={{ fontSize: "0.7rem" }}>
                                                    <Chip label="PO" size="small" color="info" sx={{ fontSize: "0.65rem", height: 18, fontWeight: 700 }} />
                                                </TableCell>
                                                <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: "primary.main" }}>{src.sourceDocumentNo}</TableCell>
                                                <TableCell sx={{ fontSize: "0.7rem", color: "text.secondary", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {src.supplierName}
                                                </TableCell>
                                                {!isReadOnly && (
                                                    <TableCell padding="none" align="center">
                                                        <IconButton size="small" color="error"
                                                            onClick={e => { e.stopPropagation(); handleRemoveSource(src); }}>
                                                            <IconTrash size={14} />
                                                        </IconButton>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Grid>

                        {/* Right: Items grid */}
                        <Grid item xs={12} md={9} sx={{ width: { xs: '100%', md: '70%' } }}>
                            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                                <Box sx={{ bgcolor: "grey.100", px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        Items {selectedSourceKey ? `— ${selectedSourceKey}` : "(Select a source document)"}
                                    </Typography>
                                    {selectedSourceKey && (
                                        <Typography variant="caption" color="text.secondary">
                                            {(formData.transactions || []).filter(t => t.sourceDocumentNo === selectedSourceKey).length} line items
                                        </Typography>
                                    )}
                                </Box>
                                <ItemsGrid
                                    transactions={formData.transactions || []}
                                    selectedSourceKey={selectedSourceKey}
                                    onQtyChange={handleQtyChange}
                                    onRemoveItem={handleRemoveItem}
                                    isReadOnly={isReadOnly}
                                    itemErrors={errors.items}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </MainCard>

                {/* ── Driver / Vehicle Info ── */}
                <Accordion defaultExpanded={false} sx={{ borderRadius: "12px !important", "&:before": { display: "none" }, border: "1px solid", borderColor: "divider" }}>
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ borderRadius: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <IconTruck size={18} color={theme.palette.primary.main} />
                            <Typography fontWeight={700}>Driver / Vehicle Info</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2.5} sx={{ width: '100%' }}>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label={requireDriverDetails ? <span>Driver Name *</span> : "Driver Name"} value={visitor.driverName || ""} onChange={v => updateVisitor("driverName", v?.target?.value ?? v)} disabled={isReadOnly} error={!!errors.driverName} className={shakeFields.driverName ? 'shake-field' : ''} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label={requireDriverDetails ? <span>Driver Mobile *</span> : "Driver Mobile"} value={visitor.driverMobile || ""} onChange={v => updateVisitor("driverMobile", v?.target?.value ?? v)} disabled={isReadOnly} error={!!errors.driverMobile} className={shakeFields.driverMobile ? 'shake-field' : ''} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label={requireDriverDetails ? <span>Driver License No *</span> : "Driver License No"} value={visitor.driverLicenseNo || ""} onChange={v => updateVisitor("driverLicenseNo", v?.target?.value ?? v)} disabled={isReadOnly} error={!!errors.driverLicenseNo} className={shakeFields.driverLicenseNo ? 'shake-field' : ''} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label={requireDriverDetails ? <span>License Expiry *</span> : "License Expiry"} type="date" value={visitor.licenseExpiry || ""} onChange={v => updateVisitor("licenseExpiry", v?.target?.value ?? v)} disabled={isReadOnly} error={!!errors.licenseExpiry} className={shakeFields.licenseExpiry ? 'shake-field' : ''} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Helper Name" value={visitor.helperName || ""} onChange={v => updateVisitor("helperName", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Transport Company" value={visitor.transportCompany || ""} onChange={v => updateVisitor("transportCompany", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Vehicle Type" value={visitor.vehicleType || ""} onChange={v => updateVisitor("vehicleType", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xxs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Trailer No" value={visitor.trailerNo || ""} onChange={v => updateVisitor("trailerNo", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Container No" value={visitor.containerNo || ""} onChange={v => updateVisitor("containerNo", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Seal No" value={visitor.sealNo || ""} onChange={v => updateVisitor("sealNo", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Gross Wt (kg)" type="number" value={visitor.grossWeight ?? ""} onChange={v => updateVisitor("grossWeight", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Tare Wt (kg)" type="number" value={visitor.tareWeight ?? ""} onChange={v => updateVisitor("tareWeight", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Net Wt (kg)" type="number" value={visitor.netWeight ?? ""} onChange={v => updateVisitor("netWeight", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Weighbridge Slip No" value={visitor.weighbridgeSlipNo || ""} onChange={v => updateVisitor("weighbridgeSlipNo", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label="Parking Location" value={visitor.parkingLocation || ""} onChange={v => updateVisitor("parkingLocation", v?.target?.value ?? v)} disabled={isReadOnly} /></Grid>
                            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '15%' } }}><BOSTextField label={requireDriverDetails ? <span>Emergency Contact *</span> : "Emergency Contact"} value={visitor.emergencyContact || ""} onChange={v => updateVisitor("emergencyContact", v?.target?.value ?? v)} disabled={isReadOnly} error={!!errors.emergencyContact} className={shakeFields.emergencyContact ? 'shake-field' : ''} /></Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>


                {/* ── Attachments ── */}
                <Accordion defaultExpanded={false} sx={{ borderRadius: "12px !important", "&:before": { display: "none" }, border: "1px solid", borderColor: "divider" }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <IconPaperclip size={18} color={theme.palette.primary.main} />
                            <Typography fontWeight={700}>Attachments</Typography>
                            {formData.attachments?.length > 0 && <Chip label={formData.attachments.length} size="small" color="primary" sx={{ height: 18, fontSize: "0.65rem" }} />}
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                        <BOSFileUpload
                            files={(formData.attachments || []).map(att => ({
                                id: att.id ? String(att.id) : att.serverFileName || att.filePath,
                                fileName: att.fileName || att.name,
                                serverFileName: att.filePath || att.serverFileName,
                                fileSize: att.fileSize,
                                fileType: att.mimeType || att.fileType,
                                isServer: true,
                            }))}
                            onChange={(updatedFiles) => {
                                const mapped = updatedFiles.map(f => ({
                                    id: f.id && /^\d+$/.test(String(f.id)) ? parseInt(f.id, 10) : null,
                                    fileName: f.fileName || f.name,
                                    filePath: f.serverFileName || f.path || f.filePath,
                                    serverFileName: f.serverFileName || f.path || f.filePath,
                                    fileSize: f.fileSize,
                                    mimeType: f.fileType || f.mimeType,
                                    attachmentType: 'GATE_ENTRY',
                                    activeStatus: 1,
                                }));
                                update("attachments", mapped);
                            }}
                            module="PURCHASE_GATE_ENTRY"
                            multiple={true}
                            maxFiles={20}
                            maxSizeMB={25}
                            disabled={isReadOnly}
                            compact={true}
                            scan={true}
                            sideBySide={true}
                            label="Gate Entry Attachments"
                            helperText="Upload vehicle photos, invoices, challans, driver documents, or any supporting documents"
                        />
                    </AccordionDetails>
                </Accordion>

                {/* ── History ── */}
                {!isNew && (
                    <Accordion defaultExpanded={false} sx={{ borderRadius: "12px !important", "&:before": { display: "none" }, border: "1px solid", borderColor: "divider" }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <IconHistory size={18} color={theme.palette.primary.main} />
                                <Typography fontWeight={700}>Activity Log / History</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            {formData.logs?.length > 0 ? (
                                <List dense disablePadding>
                                    {formData.logs.map((log, i) => (
                                        <React.Fragment key={i}>
                                            {i > 0 && <Divider component="li" />}
                                            <ListItem sx={{ py: 1 }}>
                                                <Avatar sx={{ width: 30, height: 30, bgcolor: "primary.main", mr: 2, fontSize: "0.7rem" }}>{(log.action || "?").charAt(0)}</Avatar>
                                                <ListItemText
                                                    primary={<Typography variant="body2"><strong>{log.action}</strong>{log.remarks ? ` — ${log.remarks}` : ""}</Typography>}
                                                    secondary={`By ${log.createdBy || "System"} | ${log.createdDate ? new Date(log.createdDate).toLocaleString() : "N/A"}`}
                                                />
                                            </ListItem>
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>No activity logs yet.</Typography>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}

            </Box>

            {/* ── Add Source Dialog ── */}
            <AddSourceDialog open={addSourceOpen} onClose={() => setAddSourceOpen(false)} onAdd={handleAddSource} existingSourceIds={existingSourceIds} supplierId={formData?.supplierId} />
        </Box>
    );
}
