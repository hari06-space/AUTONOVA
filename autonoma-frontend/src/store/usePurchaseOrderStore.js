import { create } from 'zustand';
import purchaseOrderService from 'api/purchaseOrderService';

const usePurchaseOrderStore = create((set, get) => ({
    pos: [],
    currentPo: null,
    previewPo: null,
    loading: false,
    saving: false,
    error: null,

    fetchAllPos: async (divisionId) => {
        set({ loading: true, error: null });
        try {
            const res = await purchaseOrderService.getAllByDivision(divisionId);
            set({ pos: res.data || [], loading: false });
        } catch (err) {
            set({ loading: false, error: err?.response?.data?.message || err.message });
        }
    },

    fetchPoById: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await purchaseOrderService.getById(id);
            set({ currentPo: res.data, loading: false });
            return res.data;
        } catch (err) {
            set({ loading: false, error: err?.response?.data?.message || err.message });
            throw err;
        }
    },

    previewFromSource: async (request) => {
        set({ loading: true, error: null, previewPo: null });
        try {
            const res = await purchaseOrderService.previewFromSource(request);
            set({ previewPo: res.data, loading: false });
            return res.data;
        } catch (err) {
            set({ loading: false, error: err?.response?.data?.message || err.message });
            throw err;
        }
    },

    clearPreview: () => set({ previewPo: null }),

    createPo: async (data) => {
        set({ saving: true, error: null });
        try {
            const res = await purchaseOrderService.create(data);
            set(state => ({
                pos: [res.data, ...state.pos],
                currentPo: res.data,
                saving: false
            }));
            return res.data;
        } catch (err) {
            set({ saving: false, error: err?.response?.data?.message || err.message });
            throw err;
        }
    },

    updatePo: async (id, data) => {
        set({ saving: true, error: null });
        try {
            const res = await purchaseOrderService.update(id, data);
            set(state => ({
                pos: state.pos.map(p => p.id === id ? res.data : p),
                currentPo: res.data,
                saving: false
            }));
            return res.data;
        } catch (err) {
            set({ saving: false, error: err?.response?.data?.message || err.message });
            throw err;
        }
    },

    submitPo: async (id) => {
        set({ saving: true, error: null });
        try {
            await purchaseOrderService.submit(id);
            // Refresh current PO
            const res = await purchaseOrderService.getById(id);
            set(state => ({
                pos: state.pos.map(p => p.id === id ? { ...p, statusName: 'SUBMITTED' } : p),
                currentPo: res.data,
                saving: false
            }));
        } catch (err) {
            set({ saving: false, error: err?.response?.data?.message || err.message });
            throw err;
        }
    },

    cancelPo: async (id, reason) => {
        set({ saving: true, error: null });
        try {
            await purchaseOrderService.cancel(id, reason);
            set(state => ({
                pos: state.pos.map(p => p.id === id ? { ...p, statusName: 'CANCELLED' } : p),
                saving: false
            }));
        } catch (err) {
            set({ saving: false, error: err?.response?.data?.message || err.message });
            throw err;
        }
    },

    verifyPo: async (id, remarks) => {
        set({ saving: true, error: null });
        try {
            await purchaseOrderService.verify(id, remarks);
            const res = await purchaseOrderService.getById(id);
            set(state => ({
                pos: state.pos.map(p => p.id === id ? { ...p, statusName: 'VERIFIED' } : p),
                currentPo: res.data,
                saving: false
            }));
        } catch (err) {
            set({ saving: false, error: err?.response?.data?.message || err.message });
            throw err;
        }
    },

    rejectPo: async (id, remarks) => {
        set({ saving: true, error: null });
        try {
            await purchaseOrderService.reject(id, remarks);
            const res = await purchaseOrderService.getById(id);
            set(state => ({
                pos: state.pos.map(p => p.id === id ? { ...p, statusName: 'REJECTED' } : p),
                currentPo: res.data,
                saving: false
            }));
        } catch (err) {
            set({ saving: false, error: err?.response?.data?.message || err.message });
            throw err;
        }
    },

    deletePo: async (id) => {
        set({ saving: true, error: null });
        try {
            await purchaseOrderService.delete(id);
            set(state => ({
                pos: state.pos.filter(p => p.id !== id),
                saving: false,
                currentPo: state.currentPo?.id === id ? null : state.currentPo
            }));
        } catch (err) {
            set({ saving: false, error: err?.response?.data?.message || err.message });
            throw err;
        }
    },

    setCurrentPo: (po) => set({ currentPo: po }),
    clearCurrentPo: () => set({ currentPo: null }),
}));

export default usePurchaseOrderStore;
