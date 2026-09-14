import { create } from 'zustand';
import axios from 'utils/axios';

const useGateEntryStore = create((set) => ({
    gateEntries: [],
    currentGateEntry: null,
    allowedActions: [],
    loading: false,
    error: null,

    fetchGateEntries: async (divisionId, page = 0, size = 10) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/v1/purchase/gate-entry/list/${divisionId}?page=${page}&size=${size}`);
            // Assuming response data is directly the paginated list, or adjust according to actual backend wrapper
            set({ gateEntries: response.data?.content || response.data || [], loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchGateEntryById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/v1/purchase/gate-entry/${id}`);
            set({ currentGateEntry: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchAllowedActions: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/v1/purchase/gate-entry/${id}/allowed-actions`);
            set({ allowedActions: response.data || [], loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    createGateEntry: async (gateEntryData) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`/api/v1/purchase/gate-entry`, gateEntryData);
            set((state) => ({ 
                gateEntries: [response.data, ...state.gateEntries],
                currentGateEntry: response.data,
                loading: false 
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateGateEntry: async (id, gateEntryData) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.put(`/api/v1/purchase/gate-entry/${id}`, gateEntryData);
            set((state) => ({
                gateEntries: state.gateEntries.map(entry => entry.id === id ? response.data : entry),
                currentGateEntry: response.data,
                loading: false
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    processAction: async (id, action) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`/api/v1/purchase/gate-entry/${id}/action/${action}`);
            set((state) => ({
                currentGateEntry: response.data,
                gateEntries: state.gateEntries.map(entry => entry.id === id ? response.data : entry),
                loading: false
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));

export default useGateEntryStore;
