import { create } from 'zustand';
import axios from 'utils/axios';
import { showAppAlert } from 'utils/alert';

const API_BASE_URL = '/api/v1/purchase/negotiation';

const useQuoteNegotiationStore = create((set, get) => ({
    negotiations: [],
    currentNegotiation: null,
    loading: false,
    error: null,

    // Fetch all for a division
    fetchNegotiations: async (divisionId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${API_BASE_URL}/division/${divisionId}`);
            set({ negotiations: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            showAppAlert("Failed to load quote negotiations", 'error');
        }
    },

    // Get negotiation by quotation id
    fetchNegotiationByQuotationId: async (quotationId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${API_BASE_URL}/quotation/${quotationId}`);
            // If 204 no content, response.data will be empty string, return null
            const data = response.data ? response.data : null;
            set({ currentNegotiation: data, loading: false });
            return data;
        } catch (error) {
            set({ error: error.message, loading: false });
            showAppAlert("Failed to load negotiation for quotation", 'error');
            return null;
        }
    },

    // Initialize new negotiation by quotation id (does not save to DB)
    initNegotiationByQuotationId: async (quotationId, buyerId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${API_BASE_URL}/init/${quotationId}?buyerId=${buyerId || 1}`);
            set({ currentNegotiation: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            showAppAlert("Failed to initialize negotiation", 'error');
            return null;
        }
    },

    // Get negotiation by its own ID
    fetchNegotiationById: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            set({ currentNegotiation: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            showAppAlert("Failed to load quote negotiation", 'error');
            return null;
        }
    },

    // Save or update negotiation
    saveNegotiation: async (dto) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(API_BASE_URL, dto);
            set({ currentNegotiation: response.data, loading: false });
            showAppAlert("Negotiation saved successfully", 'success');
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            showAppAlert("Failed to save negotiation", 'error');
            throw error;
        }
    },

    // Update status
    updateStatus: async (id, statusId, remarks = "") => {
        set({ loading: true, error: null });
        try {
            const response = await axios.put(`${API_BASE_URL}/${id}/status/${statusId}`, remarks, {
                headers: { 'Content-Type': 'text/plain' }
            });
            set({ currentNegotiation: response.data, loading: false });
            showAppAlert("Status updated successfully", 'success');
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            showAppAlert("Failed to update status", 'error');
            throw error;
        }
    },

    // Reset current
    resetCurrentNegotiation: () => set({ currentNegotiation: null })
}));

export default useQuoteNegotiationStore;
