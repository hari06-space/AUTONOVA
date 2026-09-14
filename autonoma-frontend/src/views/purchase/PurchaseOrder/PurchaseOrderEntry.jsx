import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper, useTheme } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import usePurchaseOrderStore from 'store/usePurchaseOrderStore';
import useProcurementSettingsStore from 'store/useProcurementSettingsStore';
import useAuth from 'hooks/useAuth';
import { bos, bosConfirm } from 'ui-component/bos/BOSConfirmDialog';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';

// Import newly created enterprise components
import POHeader from './components/POHeader';
import PODocumentFlow from './components/PODocumentFlow';
import POGeneralInfo from './components/POGeneralInfo';

import POItemGrid from './components/POItemGrid';
import POTotals from './components/POTotals';
import POTerms from './components/POTerms';
import POAuditLog from './components/POAuditLog';

export default function PurchaseOrderEntry() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { currentPo, loading, saving, fetchPoById, createPo, updatePo, submitPo, deletePo, verifyPo, rejectPo } = usePurchaseOrderStore();

    const handleDelete = async () => {
        const confirmed = await bosConfirm({
            title: 'Delete Purchase Order?',
            message: `Are you sure you want to delete PO ${formData?.poNo}? This action cannot be undone.`,
            type: 'warning',
            confirmText: 'Yes, Delete PO'
        });
        if (confirmed) {
            try {
                await deletePo(id);
                bos.success('Deleted!', 'Purchase Order has been deleted.');
                navigate('/purchase/po');
            } catch (e) {
                bos.error('Error!', e?.message || 'Failed to delete PO');
            }
        }
    };
    const { settings, fetchSettings } = useProcurementSettingsStore();
    const theme = useTheme();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState(null);
    const [errors, setErrors] = useState({});
    const [suppliers, setSuppliers] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [paymentTerms, setPaymentTerms] = useState([]);
    const [deliveryTerms, setDeliveryTerms] = useState([]);

    const isNew = !id;
    const statusName = formData?.statusName?.toUpperCase() || 'DRAFT';
    const isReadOnly = ['APPROVED', 'RELEASED', 'CANCELLED'].includes(statusName);

    // Initialization
    useEffect(() => {
        if (user?.divisionId) {
            fetchSettings(user.divisionId);
        }
        if (id) {
            fetchPoById(id);
        } else if (location.state?.previewData) {
            const preview = location.state.previewData;
            setFormData(f => ({
                ...f,
                poType: 'ONETIME',
                ...preview,
                currency: preview.currency || 'INR',
                exchangeRate: preview.exchangeRate || 1,
                poDate: preview.poDate ? String(preview.poDate).slice(0, 10) : new Date().toISOString().split('T')[0],
                expectedDeliveryDate: preview.expectedDeliveryDate ? String(preview.expectedDeliveryDate).slice(0, 10) : '',
                supplierReferenceDate: preview.supplierReferenceDate ? String(preview.supplierReferenceDate).slice(0, 10) : '',
            }));
        } else {
            setFormData(f => ({ ...f, sourceType: 'DIRECT', currency: 'INR', exchangeRate: 1, items: [], poDate: new Date().toISOString().split('T')[0], poType: 'ONETIME' }));
        }
    }, [id, user?.divisionId, fetchSettings, fetchPoById, location.state]);

    useEffect(() => {
        if (currentPo && id) setFormData(currentPo);
    }, [currentPo, id]);

    // Load supplier and division master data
    useEffect(() => {
        axios.get(`/api/master/vendors?type=supplier`)
            .then(res => setSuppliers((res.data || []).map(s => ({ value: s.id, label: s.ledgerName || s.name || s.supplierName || s.code || `Supplier #${s.id}`, ...s }))))
            .catch(() => { });

        axios.get(`/api/admin/currency`)
            .then(res => setCurrencies((res.data || []).map(c => ({ value: c.currencyCode, label: c.currencyCode }))))
            .catch(() => { });

        axios.get(`/api/payment-terms`)
            .then(res => setPaymentTerms((res.data || []).map(p => ({ value: p.termName || p.description, label: p.termName || p.description }))))
            .catch(() => { });

        axios.get(`/api/delivery-terms`)
            .then(res => setDeliveryTerms((res.data || []).map(d => ({ value: d.termName || d.description, label: d.termName || d.description }))))
            .catch(() => { });

        if (user?.companyId) {
            axios.get(`/api/admin/divisions/by-company/${user.companyId}/active`)
                .then(res => {
                    const divs = (res.data || []).map(d => {
                        const addrParts = [d.address, d.city, d.state, d.country].filter(Boolean).join(', ');
                        const fullAddr = addrParts + (d.pincode ? ` - ${d.pincode}` : '');
                        return { id: d.id, value: fullAddr, label: d.divisionName };
                    });
                    setDivisions(divs);

                    // Set default delivery address if new PO and not yet set
                    if (!id && divs.length > 0) {
                        // Match user's divisionId or fallback to the first active division
                        const userDiv = divs.find(d => String(d.id) === String(user?.divisionId)) || divs[0];
                        setFormData(f => f?.deliveryAddress ? f : { ...f, deliveryAddress: userDiv.value });
                    }
                })
                .catch(() => { });
        }
    }, [user?.divisionId, user?.companyId, id]);

    // Action Handlers
    const validateForm = () => {
        const newErrors = {};
        if (!formData?.poType) newErrors.poType = true;
        if (!formData?.supplierId) newErrors.supplierId = true;
        if (!formData?.expectedDeliveryDate) newErrors.expectedDeliveryDate = true;
        if (!formData?.deliveryAddress) newErrors.deliveryAddress = true;
        if (!formData?.currency) newErrors.currency = true;
        if (!formData?.exchangeRate || formData.exchangeRate <= 0) newErrors.exchangeRate = true;
        if (!formData?.poDate) newErrors.poDate = true;

        let hasItemErrors = false;
        const itemErrors = [];
        (formData?.items || []).forEach((item) => {
            const iErr = {};
            if (!item.itemId && !item.itemCode && !item.itemName) { iErr.itemId = true; hasItemErrors = true; }
            if (!item.qty || parseFloat(item.qty) <= 0) { iErr.qty = true; hasItemErrors = true; }
            if (!item.dueDate) { iErr.dueDate = true; hasItemErrors = true; }
            if (item.unitPrice === undefined || item.unitPrice === null || item.unitPrice === '' || parseFloat(item.unitPrice) < 0) { iErr.unitPrice = true; hasItemErrors = true; }

            if (formData?.gstType === 'INTRA_STATE') {
                if (item.cgstPer === undefined || item.cgstPer === null || item.cgstPer === '' || parseFloat(item.cgstPer) < 0) { iErr.cgstPer = true; hasItemErrors = true; }
                if (item.sgstPer === undefined || item.sgstPer === null || item.sgstPer === '' || parseFloat(item.sgstPer) < 0) { iErr.sgstPer = true; hasItemErrors = true; }
            } else {
                if (item.igstPer === undefined || item.igstPer === null || item.igstPer === '' || parseFloat(item.igstPer) < 0) { iErr.igstPer = true; hasItemErrors = true; }
            }
            itemErrors.push(iErr);
        });

        if (hasItemErrors) newErrors.items = itemErrors;
        return newErrors;
    };

    const focusFirstError = () => {
        setTimeout(() => {
            const errorField = document.querySelector('.bos-error-field input, .bos-error-field textarea, .bos-error-field');
            if (errorField) {
                errorField.focus();
                errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleSave = async () => {
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors({}); // Clear briefly to re-trigger animation
            setTimeout(() => {
                setErrors(newErrors);
                if (newErrors.items) {
                    dispatch(openSnackbar({ open: true, message: 'Please ensure all line items have Item, Qty, Unit Price and Tax filled properly.', variant: 'alert', severity: 'error' }));
                } else {
                    dispatch(openSnackbar({ open: true, message: 'Please fill all mandatory fields correctly.', variant: 'alert', severity: 'error' }));
                }
                focusFirstError();
            }, 10);
            return;
        } else {
            setErrors({});
        }

        if (!formData?.items?.length) {
            dispatch(openSnackbar({ open: true, message: 'At least one line item is required to save a PO.', variant: 'alert', severity: 'warning' }));
            return;
        }

        try {
            const payload = { ...formData, divisionId: user?.divisionId };
            let result;
            if (isNew) {
                result = await createPo(payload);
            } else {
                result = await updatePo(id, payload);
            }
            bos.success(isNew ? 'PO Created' : 'PO Updated', `PO No: ${result.poNo}`);
            if (isNew) navigate(`/purchase/po/entry/${result.id}`);
        } catch (e) {
            bos.error('Error', e?.message || 'Failed to save Purchase Order');
        }
    };

    const handleSubmit = async () => {
        // Smart Validation before Submit
        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors({}); // Clear briefly to re-trigger animation
            setTimeout(() => {
                setErrors(newErrors);
                if (newErrors.items) {
                    dispatch(openSnackbar({ open: true, message: 'Please ensure all line items have Item, Qty, Unit Price and Tax filled properly.', variant: 'alert', severity: 'error' }));
                } else {
                    dispatch(openSnackbar({ open: true, message: 'Please fill all mandatory fields correctly.', variant: 'alert', severity: 'error' }));
                }
                focusFirstError();
            }, 10);
            return;
        } else {
            setErrors({});
        }

        if (!formData?.items?.length) {
            dispatch(openSnackbar({ open: true, message: 'Please add at least one line item before submitting.', variant: 'alert', severity: 'warning' }));
            return;
        }

        const confirmed = await bosConfirm({ title: 'Submit for Approval?', message: 'Are you sure you want to submit this PO?', type: 'question', confirmText: 'Yes, Submit' });
        if (confirmed) {
            try {
                await submitPo(id);
                bos.success('Submitted', 'PO has been submitted for approval.');
            } catch (e) {
                bos.error('Error', e?.message || 'Failed to submit PO');
            }
        }
    };

    const handleVerify = async () => {
        const confirmed = await bosConfirm({ title: 'Verify Purchase Order', message: 'Do you want to verify this Purchase Order?', type: 'question', confirmText: 'Verify' });
        if (confirmed) {
            try {
                await verifyPo(id, '');
                bos.success('Verified!', 'PO has been verified successfully.');
            } catch (e) {
                bos.error('Error', e?.message || 'Failed to verify PO');
            }
        }
    };

    const handleReject = async () => {
        const confirmed = await bosConfirm({ title: 'Reject Purchase Order', message: 'Are you sure you want to reject this Purchase Order?', type: 'danger', confirmText: 'Reject' });
        if (confirmed) {
            try {
                await rejectPo(id, 'Rejected');
                bos.success('Rejected!', 'PO has been rejected.');
            } catch (e) {
                bos.error('Error', e?.message || 'Failed to reject PO');
            }
        }
    };

    // Memoize heavy components to optimize rendering
    const renderedGrid = useMemo(() => (
        <POItemGrid formData={formData} setFormData={setFormData} isReadOnly={isReadOnly} errors={errors} />
    ), [formData?.items, formData?.gstType, isReadOnly, errors]);

    const renderedTotals = useMemo(() => (
        <POTotals
            formData={formData}
            setFormData={setFormData}
            isReadOnly={isReadOnly}
            paymentTerms={paymentTerms}
            deliveryTerms={deliveryTerms}
        />
    ), [formData?.items, formData?.freightAmount, formData?.packingAmount, formData?.insuranceAmount, formData?.otherCharges, formData?.discountAmount, formData?.roundOff, formData?.additionalCharges, formData?.gstType, isReadOnly, paymentTerms, deliveryTerms]);


    if (loading && !formData) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
            <POHeader
                formData={formData}
                isNew={isNew}
                isReadOnly={isReadOnly}
                saving={saving}
                statusName={statusName}
                settings={settings}
                handleSave={handleSave}
                handleSubmit={handleSubmit}
                handleDelete={handleDelete}
                handleVerify={handleVerify}
                handleReject={handleReject}
            />

            <Box sx={{ px: { xs: 2, lg: 3 }, py: 2, display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: '100%', mx: 'auto' }}>

                <POGeneralInfo formData={formData} setFormData={setFormData} suppliers={suppliers} divisions={divisions} currencies={currencies} isReadOnly={isReadOnly} errors={errors} />

                {renderedGrid}
                {renderedTotals}

                <POTerms
                    formData={formData}
                    setFormData={setFormData}
                    paymentTerms={paymentTerms}
                    deliveryTerms={deliveryTerms}
                    isReadOnly={isReadOnly}
                />



                <PODocumentFlow formData={formData} />


            </Box>
        </Box>
    );
}
