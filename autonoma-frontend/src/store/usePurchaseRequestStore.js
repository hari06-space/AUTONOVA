import { create } from 'zustand';
import purchaseRequestService from '../api/purchaseRequestService';

const usePurchaseRequestStore = create((set, get) => ({
    list: [],
    departments: [],
    employees: [],
    products: [],
    loading: false,
    error: null,
    
    currentPR: {
        id: null,
        prNo: '',
        prDate: new Date().toISOString().split('T')[0],
        departmentId: null,
        plannerId: null,
        prFrom: 'REGULAR',
        remarks: '',
        status: true,
        transactions: []
    },

    setField: (field, value) => set((state) => ({
        currentPR: { ...state.currentPR, [field]: value }
    })),

    addTransaction: (trans) => set((state) => ({
        currentPR: {
            ...state.currentPR,
            transactions: [...state.currentPR.transactions, trans]
        }
    })),

    updateTransaction: (index, field, value) => set((state) => {
        const transactions = [...state.currentPR.transactions];
        transactions[index] = { ...transactions[index], [field]: value };
        
        // Auto calculate amount
        if (field === 'price' || field === 'reqQty') {
            const price = parseFloat(transactions[index].price || 0);
            const qty = parseFloat(transactions[index].reqQty || 0);
            transactions[index].amount = (price * qty).toFixed(4);
        }
        
        return { currentPR: { ...state.currentPR, transactions } };
    }),

    removeTransaction: (index) => set((state) => {
        const transactions = [...state.currentPR.transactions];
        transactions.splice(index, 1);
        return { currentPR: { ...state.currentPR, transactions } };
    }),

    resetForm: () => set({
        currentPR: {
            id: null,
            prNo: '',
            prDate: new Date().toISOString().split('T')[0],
            departmentId: null,
            plannerId: null,
            prFrom: 'REGULAR',
            remarks: '',
            status: true,
            transactions: []
        }
    }),

    deletePurchaseRequest: async (id) => {
        set({ loading: true, error: null });
        try {
            await purchaseRequestService.delete(id);
            set(state => ({
                list: state.list.filter(item => item.id !== id)
            }));
        } catch (error) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    
    fetchMasterData: async () => {
        try {
            const axios = (await import('../utils/axios')).default;
            const [deptRes, empRes] = await Promise.all([
                axios.get('/api/master/hr/departments'),
                axios.get('/api/master/hr/employees/list')
            ]);
            set({
                departments: deptRes.data || [],
                employees: empRes.data || []
            });
        } catch (error) {
            console.error('Failed to fetch master data:', error);
        }
    },

    fetchProducts: async () => {
        try {
            const axios = (await import('../utils/axios')).default;
            const response = await axios.get('/api/master/npd/product-master/list');
            set({ products: response.data || [] });
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    },

    searchPurchaseRequests: async (params) => {
        set({ loading: true, error: null });
        try {
            const response = await purchaseRequestService.search(params);
            set({ list: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    getById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await purchaseRequestService.getById(id);
            // Format dates
            const data = response.data;
            if (data.prDate) data.prDate = data.prDate.split('T')[0];
            data.transactions.forEach(t => {
                if (t.reqDate) t.reqDate = t.reqDate.split('T')[0];
            });
            set({ currentPR: data, loading: false });
            return data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    savePurchaseRequest: async () => {
        const { currentPR } = get();
        set({ loading: true, error: null });
        try {
            // Filter out empty rows where no item is selected
            const validTransactions = (currentPR.transactions || []).filter(t => t.itemId);
            const payload = { ...currentPR, transactions: validTransactions };

            let response;
            if (payload.id) {
                response = await purchaseRequestService.update(payload.id, payload);
            } else {
                response = await purchaseRequestService.create(payload);
            }
            set({ loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    approveItem: async (transId) => {
        set({ loading: true, error: null });
        try {
            await purchaseRequestService.approveItem(transId);
            set({ loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    rejectItem: async (transId) => {
        set({ loading: true, error: null });
        try {
            await purchaseRequestService.rejectItem(transId);
            set({ loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));

export default usePurchaseRequestStore;
