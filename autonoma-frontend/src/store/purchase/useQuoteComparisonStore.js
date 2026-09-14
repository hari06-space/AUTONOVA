import { create } from 'zustand';
import axios from 'utils/axios';

const useQuoteComparisonStore = create((set) => ({
    comparisons: [],
    currentComparison: null,
    loading: false,
    error: null,

    fetchComparisons: async (divisionId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/purchase/quote-comparison/division/${divisionId}`);
            set({ comparisons: Array.isArray(response.data) ? response.data : [], loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchComparisonById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/purchase/quote-comparison/${id}`);
            set({ currentComparison: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    generateComparison: async (rfqId, userId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`/api/purchase/quote-comparison/generate/${rfqId}`, {}, {
                headers: { userId }
            });
            set({ currentComparison: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    lockComparison: async (id, userId, data) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`/api/purchase/quote-comparison/${id}/lock`, data, {
                headers: { userId }
            });
            set({ currentComparison: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    verifyComparison: async (id, userId, remarks) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.put(`/api/purchase/quote-comparison/${id}/verify`, { remarks }, {
                headers: { userId }
            });
            set({ currentComparison: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteComparison: async (id) => {
        set({ loading: true, error: null });
        try {
            await axios.delete(`/api/purchase/quote-comparison/${id}`);
            set(state => ({
                comparisons: state.comparisons.filter(c => c.id !== id),
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));

export default useQuoteComparisonStore;
