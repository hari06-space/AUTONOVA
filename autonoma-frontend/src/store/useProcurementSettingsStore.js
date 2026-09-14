import { create } from 'zustand';
import procurementSettingsService from 'api/procurementSettingsService';

const useProcurementSettingsStore = create((set, get) => ({
    settings: null,
    loading: false,
    error: null,

    fetchSettings: async (divisionId) => {
        set({ loading: true, error: null });
        try {
            const response = await procurementSettingsService.getByDivision(divisionId);
            set({ settings: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    saveSettings: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await procurementSettingsService.saveSettings(data);
            set({ settings: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));

export default useProcurementSettingsStore;
