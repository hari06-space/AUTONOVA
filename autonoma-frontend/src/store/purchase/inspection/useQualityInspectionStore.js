import { create } from 'zustand';
import axios from 'utils/axios';

const useQualityInspectionStore = create((set) => ({
    inspections: [],
    loading: false,
    error: null,
    totalRows: 0,
    currentInspection: null,

    fetchInspections: async (params) => {
        set({ loading: true, error: null });
        try {
            const { data } = await axios.get('/api/purchase/quality-inspection/search', { params });
            set({
                inspections: data.content,
                totalRows: data.totalElements,
                loading: false
            });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    getInspectionById: async (id) => {
        set({ loading: true, error: null });
        try {
            const { data } = await axios.get(`/api/purchase/quality-inspection/${id}`);
            set({ currentInspection: data, loading: false });
            return data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    generateFromGrn: async (grnId, divisionId, userId) => {
        set({ loading: true, error: null });
        try {
            const { data } = await axios.post(`/api/purchase/quality-inspection/generate`, null, {
                params: { grnId, divisionId, userId }
            });
            set({ currentInspection: data, loading: false });
            return data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    saveInspection: async (id, payload, userId) => {
        set({ loading: true, error: null });
        try {
            const { data } = await axios.put(`/api/purchase/quality-inspection/${id}`, payload, {
                params: { userId }
            });
            set({ currentInspection: data, loading: false });
            return data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    postInspection: async (id, userId) => {
        set({ loading: true, error: null });
        try {
            const { data } = await axios.post(`/api/purchase/quality-inspection/${id}/post`, null, {
                params: { userId }
            });
            set({ currentInspection: data, loading: false });
            return data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    clearCurrentInspection: () => set({ currentInspection: null })
}));

export default useQualityInspectionStore;
