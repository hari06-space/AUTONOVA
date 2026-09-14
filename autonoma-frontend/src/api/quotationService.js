import axios from 'utils/axios';

const API_URL = '/api/v1/quotation';

class QuotationService {
    getAllByDivision(divisionId) {
        return axios.get(`${API_URL}/division/${divisionId}`);
    }

    getByRfq(rfqId) {
        return axios.get(`${API_URL}/rfq/${rfqId}`);
    }

    getById(id) {
        return axios.get(`${API_URL}/${id}`);
    }

    save(data) {
        return axios.post(API_URL, data);
    }

    evaluateTechnicalStatus(id, status) {
        return axios.put(`${API_URL}/${id}/technical-evaluate`, null, { params: { status } });
    }
}

export default new QuotationService();
