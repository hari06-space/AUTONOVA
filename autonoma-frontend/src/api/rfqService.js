import axios from 'utils/axios';

const API_URL = '/api/v1/rfq';

class RfqService {
    getAllByDivision(divisionId) {
        return axios.get(`${API_URL}/division/${divisionId}`);
    }

    getById(id) {
        return axios.get(`${API_URL}/${id}`);
    }

    create(data) {
        return axios.post(API_URL, data);
    }

    update(id, data) {
        return axios.put(`${API_URL}/${id}`, data);
    }

    sendEmails(id, data) {
        return axios.post(`${API_URL}/${id}/send-emails`, data);
    }

    getLatestEmail(id) {
        return axios.get(`${API_URL}/${id}/latest-email`);
    }

    getEmailHistory(id) {
        return axios.get(`${API_URL}/${id}/email-history`);
    }

    generatePo(id) {
        return axios.post(`${API_URL}/${id}/generate-po`);
    }

    delete(id) {
        return axios.delete(`${API_URL}/${id}`);
    }

    // Attachment Methods
    getAttachments(id) {
        return axios.get(`${API_URL}/${id}/attachments`);
    }

    uploadAttachments(id, formData) {
        return axios.post(`${API_URL}/${id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    deleteAttachment(attachmentId) {
        return axios.delete(`${API_URL}/attachments/${attachmentId}`);
    }
}

export default new RfqService();
