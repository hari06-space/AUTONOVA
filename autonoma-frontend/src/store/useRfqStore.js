import { create } from 'zustand';
import rfqService from 'api/rfqService';

const useRfqStore = create((set, get) => ({
    rfqs: [],
    currentRfq: null,
    loading: false,
    error: null,

    fetchRfqs: async (divisionId) => {
        set({ loading: true, error: null });
        try {
            const response = await rfqService.getAllByDivision(divisionId);
            set({ rfqs: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchRfqById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await rfqService.getById(id);
            set({ currentRfq: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    createRfq: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await rfqService.create(data);
            set((state) => ({ rfqs: [...state.rfqs, response.data], loading: false }));
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateRfq: async (id, data) => {
        set({ loading: true, error: null });
        try {
            const response = await rfqService.update(id, data);
            set((state) => ({
                rfqs: state.rfqs.map(r => r.id === id ? response.data : r),
                currentRfq: response.data,
                loading: false
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteRfq: async (id) => {
        set({ loading: true, error: null });
        try {
            await rfqService.delete(id);
            set(state => ({
                rfqs: state.rfqs.filter(r => r.id !== id),
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    sendEmails: async (id, payload) => {
        set({ loading: true, error: null });
        try {
            await rfqService.sendEmails(id, payload);
            set({ loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    getLatestEmail: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await rfqService.getLatestEmail(id);
            set({ loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },
    
    generatePo: async (id) => {
        set({ loading: true, error: null });
        try {
            await rfqService.generatePo(id);
            set({ loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));

export default useRfqStore;
