import axios from 'utils/axios';

const API_URL = '/api/purchase/pr';

class PurchaseRequestService {
    create(data) {
        return axios.post(API_URL, data);
    }

    update(id, data) {
        return axios.put(`${API_URL}/${id}`, data);
    }

    getById(id) {
        return axios.get(`${API_URL}/${id}`);
    }

    delete(id) {
        return axios.delete(`${API_URL}/${id}`);
    }

    search(params) {
        return axios.get(`${API_URL}/search`, { params });
    }

    submitForApproval(id) {
        return axios.post(`${API_URL}/${id}/submit`);
    }

    verify(id) {
        return axios.post(`${API_URL}/${id}/verify`);
    }

    approve(id) {
        return axios.post(`${API_URL}/${id}/verify`);
    }

    reject(id) {
        return axios.post(`${API_URL}/${id}/reject`);
    }

    cancel(id) {
        return axios.post(`${API_URL}/${id}/cancel`);
    }

    verifyItem(transId) {
        return axios.post(`${API_URL}/trans/${transId}/verify`);
    }

    approveItem(transId) {
        return axios.post(`${API_URL}/trans/${transId}/verify`);
    }

    rejectItem(transId) {
        return axios.post(`${API_URL}/trans/${transId}/reject`);
    }
}

export default new PurchaseRequestService();
