import axios from 'utils/axios';

const API_URL = '/api/v1/quotation-comparison';

class QuotationComparisonService {
    generateComparison(rfqId, divisionId) {
        return axios.get(`${API_URL}/generate/rfq/${rfqId}/division/${divisionId}`);
    }

    getDecision(rfqId) {
        return axios.get(`${API_URL}/decision/rfq/${rfqId}`);
    }

    saveDecision(data) {
        return axios.post(`${API_URL}/decision`, data);
    }

    approveDecision(id) {
        return axios.post(`${API_URL}/decision/${id}/approve`);
    }
}

export default new QuotationComparisonService();
