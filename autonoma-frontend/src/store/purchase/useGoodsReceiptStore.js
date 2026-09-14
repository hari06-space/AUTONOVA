import { create } from 'zustand';
import axios from 'utils/axios';

const useGoodsReceiptStore = create((set, get) => ({
    receipts: [],
    currentReceipt: null,
    loading: false,
    error: null,
    totalCount: 0,

    searchReceipts: async (params) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get('/api/purchase/grn/search', { params });
            set({
                receipts: response.data.content,
                totalCount: response.data.totalElements,
                loading: false
            });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    getReceiptById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/purchase/grn/${id}`);
            set({ currentReceipt: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    generateFromInspection: async (inspectionId, divisionId, userId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`/api/purchase/grn/generate/inspection/${inspectionId}`, null, {
                params: { divisionId },
                headers: { userId }
            });
            set({ currentReceipt: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    previewFromGateEntry: async (gateEntryId, userId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/purchase/grn/preview/gate-entry/${gateEntryId}`, {
                headers: { userId }
            });
            set({ currentReceipt: { ...response.data, documentType: response.data.documentType || 'Invoice' }, loading: false });
            return response.data;
        } catch (error) {
            const msg = error?.response?.data?.message || error.message;
            set({ error: msg, loading: false });
            throw new Error(msg);
        }
    },

    previewFromPurchaseOrder: async (poHeadId, userId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/purchase/grn/preview/purchase-order/${poHeadId}`, {
                headers: { userId }
            });
            set({ currentReceipt: { ...response.data, documentType: response.data.documentType || 'Invoice' }, loading: false });
            return response.data;
        } catch (error) {
            const msg = error?.response?.data?.message || error.message;
            set({ error: msg, loading: false });
            throw new Error(msg);
        }
    },

    generateFromGateEntry: async (gateEntryId, divisionId, userId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`/api/purchase/grn/generate/gate-entry/${gateEntryId}`, null, {
                params: { divisionId },
                headers: { userId }
            });
            set({ currentReceipt: response.data, loading: false });
            return response.data;
        } catch (error) {
            const msg = error?.response?.data?.message || error.message;
            set({ error: msg, loading: false });
            throw new Error(msg);
        }
    },

    saveReceipt: async (id, data, userId) => {
        set({ loading: true, error: null });
        try {
            let response;
            if (!id || id === 'new') {
                response = await axios.post('/api/purchase/grn', data, {
                    headers: { userId }
                });
            } else {
                response = await axios.put(`/api/purchase/grn/${id}`, data, {
                    headers: { userId }
                });
            }
            set({ currentReceipt: response.data, loading: false });
            return response.data;
        } catch (error) {
            const msg = error?.response?.data?.message || error.message;
            set({ error: msg, loading: false });
            throw new Error(msg);
        }
    },

    deleteReceipt: async (id, userId) => {
        set({ loading: true, error: null });
        try {
            await axios.delete(`/api/purchase/grn/${id}`, {
                headers: { userId }
            });
            set({ currentReceipt: null, loading: false });
        } catch (error) {
            const msg = error?.response?.data?.message || error.message;
            set({ error: msg, loading: false });
            throw new Error(msg);
        }
    },

    postReceipt: async (id, userId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.put(`/api/purchase/grn/${id}/post`, null, {
                headers: { userId }
            });
            set({ currentReceipt: response.data, loading: false });
            return response.data;
        } catch (error) {
            const msg = error?.response?.data?.message || error.message;
            set({ error: msg, loading: false });
            throw new Error(msg);
        }
    },
    
    updateTransactionLine: (transId, field, value) => {
        const { currentReceipt } = get();
        if (!currentReceipt) return;
        
        const updatedTransactions = (currentReceipt.transactions || []).map((t, index) => {
            const matches = t.id ? (t.id === transId) : (index === transId || t.gateEntryTransId === transId);
            return matches ? { ...t, [field]: value } : t;
        });
        
        set({
            currentReceipt: {
                ...currentReceipt,
                transactions: updatedTransactions
            }
        });
    }
}));

export default useGoodsReceiptStore;
