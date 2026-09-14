import { create } from 'zustand';
import axios from 'utils/axios'; // Adjust based on your actual axios instance path

const useSupplierReturnStore = create((set, get) => ({
    returnsList: [],
    currentReturn: null,
    loading: false,
    error: null,
    totalRecords: 0,

    getAllReturns: async (divisionId, page = 0, size = 10) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get('/api/purchase/supplier-return', {
                params: { divisionId, page, size }
            });
            set({ 
                returnsList: response.data.data.content,
                totalRecords: response.data.data.totalElements,
                loading: false 
            });
        } catch (error) {
            set({ error: error.message || 'Failed to fetch supplier returns', loading: false });
        }
    },

    getReturnById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/purchase/supplier-return/${id}`);
            set({ currentReturn: response.data.data, loading: false });
        } catch (error) {
            set({ error: error.message || 'Failed to fetch return', loading: false });
        }
    },

    generateFromQi: async (divisionId, qiHeadId, returnType) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get('/api/purchase/supplier-return/generate', {
                params: { divisionId, qiHeadId, returnType }
            });
            set({ currentReturn: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateTransactionLine: (transId, field, value) => {
        const { currentReturn } = get();
        if (!currentReturn) return;
        
        const updatedTransactions = currentReturn.transactions.map(t => 
            t.grnTransId === transId || t.id === transId ? { ...t, [field]: value } : t
        );
        
        set({ currentReturn: { ...currentReturn, transactions: updatedTransactions } });
    },

    saveReturn: async (dto) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post('/api/purchase/supplier-return', dto);
            set({ currentReturn: response.data.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to save return', loading: false });
            throw error;
        }
    },

    postReturn: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`/api/purchase/supplier-return/${id}/post`);
            set({ currentReturn: response.data.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to post return', loading: false });
            throw error;
        }
    },

    cancelReturn: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`/api/purchase/supplier-return/${id}/cancel`);
            set({ currentReturn: response.data.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to cancel return', loading: false });
            throw error;
        }
    },

    clearCurrentReturn: () => set({ currentReturn: null })
}));

export default useSupplierReturnStore;
