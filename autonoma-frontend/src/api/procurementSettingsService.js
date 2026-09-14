import axios from 'utils/axios';

const API_URL = '/api/v1/procurement-settings';

class ProcurementSettingsService {
    getByDivision(divisionId) {
        return axios.get(`${API_URL}/division/${divisionId}`);
    }

    saveSettings(data) {
        return axios.post(API_URL, data);
    }
}

export default new ProcurementSettingsService();
