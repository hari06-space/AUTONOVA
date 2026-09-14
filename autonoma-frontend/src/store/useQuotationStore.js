import { create } from 'zustand';
import quotationService from 'api/quotationService';
import rfqService from 'api/rfqService';
import axios from 'utils/axios';

const useQuotationStore = create((set, get) => ({
    quotations: [],
    rfqQuotations: [],
    currentQuotation: null,
    loading: false,
    error: null,

    fetchQuotations: async (divisionId) => {
        set({ loading: true, error: null });
        try {
            const response = await quotationService.getAllByDivision(divisionId);
            set({ quotations: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchQuotationsByRfq: async (rfqId) => {
        set({ loading: true, error: null });
        try {
            const response = await quotationService.getByRfq(rfqId);
            set({ rfqQuotations: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchQuotationById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await quotationService.getById(id);
            if (response.data) {
                if (response.data.rfqRefId) {
                    response.data.rfqId = response.data.rfqRefId;
                    try {
                        const rfqResponse = await rfqService.getById(response.data.rfqRefId);
                        if (rfqResponse.data) {
                            if (rfqResponse.data.suppliers) {
                                response.data.rfqSuppliers = rfqResponse.data.suppliers;
                            }
                            if (rfqResponse.data.prNo) {
                                response.data.prNo = rfqResponse.data.prNo;
                            }
                        }
                    } catch (e) {
                        console.error("Failed to load RFQ details for Quotation", e);
                    }
                }
                
                // Infer gstType from details if not explicitly present
                if (!response.data.gstType) {
                    const hasIgst = response.data.details && response.data.details.some(d => d.igstPer > 0 || d.igstValue > 0);
                    response.data.gstType = hasIgst ? 'INTER_STATE' : 'INTRA_STATE';
                }
            }
            set({ currentQuotation: response.data || null, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    setCurrentQuotation: (quotation) => {
        set({ currentQuotation: quotation });
        get().calculateTotals();
    },

    initNewQuotation: () => {
        set({
            currentQuotation: {
                quotationNo: '',
                rfqId: null,
                rfqNo: '',
                prNo: '',
                supplierId: null,
                supplierName: '',
                quotationDate: new Date().toISOString(),
                supplierReferenceNo: '',
                supplierReferenceDate: '',
                remarks: '',
                gstType: 'INTRA_STATE',
                rfqSuppliers: [],
                statusName: 'DRAFT',
                technicalStatusName: 'PENDING',
                details: [],
                subtotal: 0,
                grandTotal: 0,
                additionalCharges: [],
                discountAmount: 0
            }
        });
    },

    loadFromRfq: async (rfq) => {
        if (!rfq) return;
        set({ loading: true });
        try {
            // Fetch the full RFQ details since the list DTO doesn't have details
            const response = await rfqService.getById(rfq.id);
            const fullRfq = response.data;
            const rfqSuppliers = fullRfq.suppliers || [];
            let defaultSupplierId = null;
            let defaultSupplierName = '';
            if (rfqSuppliers.length === 1) {
                defaultSupplierId = rfqSuppliers[0].supplierId;
                defaultSupplierName = rfqSuppliers[0].supplierName;
            }
            
            // Pre-fetch all HSN codes for reliable mapping
            let hsnMap = {};
            try {
                const hsnListRes = await axios.get('/api/admin/hsn-codes');
                if (hsnListRes.data && Array.isArray(hsnListRes.data)) {
                    hsnListRes.data.forEach(h => {
                        if (h.hsnCode) hsnMap[String(h.hsnCode).trim()] = h;
                    });
                }
            } catch (err) {
                console.error("Failed to pre-fetch HSN codes", err);
            }

            const mappedDetails = await Promise.all((fullRfq.details || []).map(async (detail) => {
                let cgstPer = 0, sgstPer = 0, igstPer = 0;
                let hsnCode = '';
                try {
                    const prodRes = await axios.get(`/api/master/npd/product-master/${detail.itemId}`);
                    hsnCode = prodRes.data?.hsnCode || '';
                    if (hsnCode) {
                        const h = hsnMap[String(hsnCode).trim()];
                        if (h) {
                            cgstPer = h.cgstPer || 0;
                            sgstPer = h.sgstPer || 0;
                            igstPer = h.igstPer || 0;
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch product/HSN for item', detail.itemId, e);
                }

                return {
                    rfqDetailId: detail.id,
                    itemId: detail.itemId,
                    itemCode: detail.itemCode,
                    itemName: detail.itemName,
                    uom: detail.uom,
                    qty: detail.reqQty,
                    brand: detail.brand,
                    hsnCode: hsnCode || '',
                    remarks: '',
                    lastPurchasePrice: 0,
                    unitPrice: 0,
                    discountPercent: 0,
                    cgstPer,
                    sgstPer,
                    igstPer,
                    cgstValue: 0,
                    sgstValue: 0,
                    igstValue: 0,
                    totalAmount: 0
                };
            }));

            set((state) => ({
                currentQuotation: {
                    ...state.currentQuotation,
                    rfqId: fullRfq.id,
                    rfqNo: fullRfq.rfqNo,
                    prNo: fullRfq.prNo,
                    supplierId: defaultSupplierId || state.currentQuotation.supplierId,
                    supplierName: defaultSupplierName || state.currentQuotation.supplierName,
                    rfqSuppliers: rfqSuppliers,
                    details: mappedDetails
                },
                loading: false
            }));
            get().calculateTotals();
        } catch (error) {
            console.error("Failed to fetch full RFQ for quotation:", error);
            set({ error: error.message, loading: false });
        }
    },

    updateQuotationField: (field, value) => {
        set((state) => ({
            currentQuotation: {
                ...state.currentQuotation,
                [field]: value
            }
        }));
        if (['freight', 'packing', 'insurance', 'otherCharges', 'discountAmount', 'gstType'].includes(field)) {
            get().calculateTotals();
        }
    },

    updateQuotationDetail: (index, field, value) => {
        set((state) => {
            if (!state.currentQuotation || !state.currentQuotation.details) return state;
            const updatedDetails = [...state.currentQuotation.details];
            let detail = { ...updatedDetails[index] };

            if (typeof field === 'object' && field !== null) {
                detail = { ...detail, ...field };
            } else {
                detail[field] = value;
                const isInterState = state.currentQuotation.supplierGstType === 'INTER_STATE';
                if (!isInterState) {
                    if (field === 'cgstPer') detail.sgstPer = value;
                    else if (field === 'sgstPer') detail.cgstPer = value;
                }
            }

            // Recalculate row total
            const qty = parseFloat(detail.qty) || 0;
            const unitPrice = parseFloat(detail.unitPrice) || 0;
            const discountPercent = parseFloat(detail.discountPercent) || 0;
            
            const gross = qty * unitPrice;
            const discount = gross * (discountPercent / 100);
            const taxable = gross - discount;
            
            const cgstValue = taxable * ((parseFloat(detail.cgstPer) || 0) / 100);
            const sgstValue = taxable * ((parseFloat(detail.sgstPer) || 0) / 100);
            const igstValue = taxable * ((parseFloat(detail.igstPer) || 0) / 100);

            detail.cgstValue = cgstValue;
            detail.sgstValue = sgstValue;
            detail.igstValue = igstValue;

            detail.totalAmount = taxable + (state.currentQuotation?.supplierGstType === 'INTER_STATE' ? igstValue : (cgstValue + sgstValue));

            updatedDetails[index] = detail;
            return { currentQuotation: { ...state.currentQuotation, details: updatedDetails } };
        });
        get().calculateTotals();
    },

    removeQuotationDetail: (index) => {
        set((state) => {
            if (!state.currentQuotation || !state.currentQuotation.details) return state;
            const updatedDetails = [...state.currentQuotation.details];
            updatedDetails.splice(index, 1);
            return { currentQuotation: { ...state.currentQuotation, details: updatedDetails } };
        });
        get().calculateTotals();
    },

    addAdditionalCharge: () => {
        set((state) => {
            if (!state.currentQuotation) return state;
            const updatedCharges = [...(state.currentQuotation.additionalCharges || [])];
            updatedCharges.push({
                chargesId: null,
                chargeName: '',
                amount: 0,
                taxApplicable: false,
                cgstPer: 0,
                cgstValue: 0,
                sgstPer: 0,
                sgstValue: 0,
                igstPer: 0,
                igstValue: 0,
                totalValue: 0,
                status: true
            });
            return { currentQuotation: { ...state.currentQuotation, additionalCharges: updatedCharges } };
        });
        get().calculateTotals();
    },

    updateAdditionalCharge: (index, fieldOrObj, value) => {
        set((state) => {
            if (!state.currentQuotation || !state.currentQuotation.additionalCharges) return state;
            const updatedCharges = [...state.currentQuotation.additionalCharges];
            const charge = { ...updatedCharges[index] };
            if (typeof fieldOrObj === 'object') {
                Object.assign(charge, fieldOrObj);
            } else {
                charge[fieldOrObj] = value;
            }
            
            // if amount or tax changes, we might recalculate taxes here. 
            // For now, let's just assume amount = totalValue if tax is false
            const amount = parseFloat(charge.amount) || 0;
            if (!charge.taxApplicable) {
                charge.cgstValue = 0;
                charge.sgstValue = 0;
                charge.igstValue = 0;
                charge.totalValue = amount;
            } else {
                // If tax applicable, calculate based on percentages
                const cgst = amount * ((parseFloat(charge.cgstPer) || 0) / 100);
                const sgst = amount * ((parseFloat(charge.sgstPer) || 0) / 100);
                const igst = amount * ((parseFloat(charge.igstPer) || 0) / 100);
                charge.cgstValue = cgst;
                charge.sgstValue = sgst;
                charge.igstValue = igst;
                charge.totalValue = amount + cgst + sgst + igst;
            }

            updatedCharges[index] = charge;
            return { currentQuotation: { ...state.currentQuotation, additionalCharges: updatedCharges } };
        });
        get().calculateTotals();
    },

    removeAdditionalCharge: (index) => {
        set((state) => {
            if (!state.currentQuotation || !state.currentQuotation.additionalCharges) return state;
            const updatedCharges = [...state.currentQuotation.additionalCharges];
            updatedCharges.splice(index, 1);
            return { currentQuotation: { ...state.currentQuotation, additionalCharges: updatedCharges } };
        });
        get().calculateTotals();
    },

    calculateTotals: () => {
        set((state) => {
            if (!state.currentQuotation) return state;
            const gstType = state.currentQuotation.gstType || 'INTRA_STATE';
            
            let subtotal = 0;
            let taxAmount = 0;
            let discountAmount = parseFloat(state.currentQuotation.discountAmount) || 0;

            const details = (state.currentQuotation.details || []).map(item => {
                const newItem = { ...item };
                const qty = parseFloat(newItem.qty) || 0;
                const unitPrice = parseFloat(newItem.unitPrice) || 0;
                const discountPercent = parseFloat(newItem.discountPercent) || 0;
                
                const gross = qty * unitPrice;
                const discount = gross * (discountPercent / 100);
                const taxable = gross - discount;
                
                let cgstValue = 0, sgstValue = 0, igstValue = 0;
                
                if (gstType === 'INTRA_STATE') {
                    newItem.igstPer = 0; // Clear irrelevant tax
                    cgstValue = taxable * ((parseFloat(newItem.cgstPer) || 0) / 100);
                    sgstValue = taxable * ((parseFloat(newItem.sgstPer) || 0) / 100);
                } else {
                    newItem.cgstPer = 0; // Clear irrelevant tax
                    newItem.sgstPer = 0;
                    igstValue = taxable * ((parseFloat(newItem.igstPer) || 0) / 100);
                }

                newItem.cgstValue = cgstValue;
                newItem.sgstValue = sgstValue;
                newItem.igstValue = igstValue;
                newItem.totalAmount = taxable + cgstValue + sgstValue + igstValue;

                subtotal += taxable;
                taxAmount += (cgstValue + sgstValue + igstValue);
                
                return newItem;
            });
            let otherCharges = 0;
            const additionalCharges = (state.currentQuotation.additionalCharges || []).map(charge => {
                const newCharge = { ...charge };
                const amount = parseFloat(newCharge.amount) || 0;
                let cTax = 0, sTax = 0, iTax = 0;
                
                if (newCharge.taxApplicable) {
                    if (gstType === 'INTRA_STATE') {
                        newCharge.igstPer = 0;
                        cTax = amount * ((parseFloat(newCharge.cgstPer) || 0) / 100);
                        sTax = amount * ((parseFloat(newCharge.sgstPer) || 0) / 100);
                    } else {
                        newCharge.cgstPer = 0;
                        newCharge.sgstPer = 0;
                        iTax = amount * ((parseFloat(newCharge.igstPer) || 0) / 100);
                    }
                } else {
                    newCharge.cgstPer = 0;
                    newCharge.sgstPer = 0;
                    newCharge.igstPer = 0;
                }
                
                newCharge.cgstValue = cTax;
                newCharge.sgstValue = sTax;
                newCharge.igstValue = iTax;
                newCharge.totalValue = amount + cTax + sTax + iTax;
                
                otherCharges += newCharge.totalValue;
                return newCharge;
            });

            const grandTotal = subtotal - discountAmount + taxAmount + otherCharges;

            return {
                currentQuotation: {
                    ...state.currentQuotation,
                    details,
                    additionalCharges,
                    subtotal,
                    taxAmount,
                    grandTotal
                }
            };
        });
    },

    saveQuotation: async (data) => {
        set({ loading: true, error: null });
        try {
            // Map frontend state fields to backend DTO fields
            const payload = {
                ...data,
                rfqRefId: data.rfqId,
                supplierReferenceDate: data.supplierReferenceDate || null
            };
            const response = await quotationService.save(payload);
            set({ loading: false, currentQuotation: response.data });
            return response.data;
        } catch (error) {
            // Extract the backend error message (e.g. BusinessException message)
            const backendMsg = error?.response?.data?.message
                || error?.response?.data?.error
                || error?.message
                || 'Failed to save quotation';
            const richError = new Error(backendMsg);
            set({ error: backendMsg, loading: false });
            throw richError;
        }
    },

    evaluateTechnicalStatus: async (id, status) => {
        set({ loading: true, error: null });
        try {
            await quotationService.evaluateTechnicalStatus(id, status);
            set({ loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));

export default useQuotationStore;
