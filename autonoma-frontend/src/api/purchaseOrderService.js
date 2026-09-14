import axios from 'utils/axios';

const API_URL = '/api/v1/purchase-order';

class PurchaseOrderService {
    getAllByDivision(divisionId) {
        return axios.get(`${API_URL}/division/${divisionId}`);
    }

    getById(id) {
        return axios.get(`${API_URL}/${id}`);
    }

    previewFromSource(request) {
        // request: { sourceType, sourceDocId, divisionId }
        return axios.post(`${API_URL}/preview`, request);
    }

    create(data) {
        return axios.post(API_URL, data);
    }

    update(id, data) {
        return axios.put(`${API_URL}/${id}`, data);
    }

    submit(id) {
        return axios.post(`${API_URL}/${id}/submit`);
    }

    cancel(id, reason) {
        return axios.post(`${API_URL}/${id}/cancel`, { reason });
    }

    delete(id) {
        return axios.delete(`${API_URL}/${id}`);
    }

    verify(id, remarks) {
        return axios.post(`${API_URL}/${id}/verify`, { remarks });
    }

    reject(id, remarks) {
        return axios.post(`${API_URL}/${id}/reject`, { remarks });
    }
}

export default new PurchaseOrderService();
