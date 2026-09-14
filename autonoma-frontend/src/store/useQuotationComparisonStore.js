import { create } from 'zustand';
import quotationComparisonService from 'api/quotationComparisonService';

const useQuotationComparisonStore = create((set, get) => ({
    comparisonData: null,
    currentDecision: null,
    loading: false,
    error: null,

    generateComparison: async (rfqId, divisionId) => {
        set({ loading: true, error: null });
        try {
            const response = await quotationComparisonService.generateComparison(rfqId, divisionId);
            set({ comparisonData: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchDecision: async (rfqId) => {
        set({ loading: true, error: null });
        try {
            const response = await quotationComparisonService.getDecision(rfqId);
            set({ currentDecision: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    saveDecision: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await quotationComparisonService.saveDecision(data);
            set({ currentDecision: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    approveDecision: async (id) => {
        set({ loading: true, error: null });
        try {
            await quotationComparisonService.approveDecision(id);
            set({ loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));

export default useQuotationComparisonStore;
