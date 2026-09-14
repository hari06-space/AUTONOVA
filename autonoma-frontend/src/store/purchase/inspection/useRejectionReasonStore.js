import { create } from 'zustand';
import axios from 'utils/axios';

const useRejectionReasonStore = create((set, get) => ({
    reasons: [],
    loading: false,
    error: null,

    fetchReasons: async () => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get('/api/purchase/rejection-reasons');
            set({ reasons: response.data || [], loading: false });
        } catch (error) {
            console.error('Error fetching rejection reasons:', error);
            set({ error: error.message, loading: false });
        }
    },

    createReason: async (reason, userId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post('/api/purchase/rejection-reasons', null, {
                params: {
                    reason: reason,
                    userId: userId
                }
            });
            const newReason = response.data;
            // Optimistically update the list
            set(state => ({
                reasons: [...state.reasons, newReason],
                loading: false
            }));
            return newReason;
        } catch (error) {
            console.error('Error creating rejection reason:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));

export default useRejectionReasonStore;
