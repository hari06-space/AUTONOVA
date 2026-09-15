import axiosServices from 'utils/axios';

// axiosServices already has the correct baseURL (VITE_API_URL) and JWT interceptor
// configured in utils/axios.js — no need to create a separate axios instance.
const api = axiosServices;

// ─────────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────────

/**
 * Send a message to Autonova AI.
 * @param {string} question
 * @param {string|null} sessionId
 */
export const sendMessage = (question, sessionId = null) => api.post('/api/ai/chat', { question, sessionId });

/**
 * Get conversation history for the current user.
 */
export const getConversations = () => api.get('/api/ai/conversations');

/**
 * Clear conversation history.
 */
export const clearConversations = () => api.delete('/api/ai/conversations');

/**
 * Get suggested prompts based on user's module access.
 */
export const getSuggestions = () => api.get('/api/ai/suggestions');

/**
 * Health check.
 */
export const checkHealth = () => api.get('/api/ai/health');

// ─────────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────────

/**
 * Download an Excel report.
 * @param {Object} payload { title, headers, rows, module }
 */
export const downloadExcelReport = async (payload) => {
  const res = await api.post('/api/ai/report/excel', payload, { responseType: 'blob' });
  triggerDownload(res, 'report.xlsx');
};

/**
 * Download a PDF report.
 */
export const downloadPdfReport = async (payload) => {
  const res = await api.post('/api/ai/report/pdf', payload, { responseType: 'blob' });
  triggerDownload(res, 'report.pdf');
};

/**
 * Download a Word report.
 */
export const downloadWordReport = async (payload) => {
  const res = await api.post('/api/ai/report/word', payload, { responseType: 'blob' });
  triggerDownload(res, 'report.docx');
};

// ─────────────────────────────────────────────────────────────────
// FORECAST
// ─────────────────────────────────────────────────────────────────

/**
 * Run a forecast.
 * @param {string} question
 * @param {string} forecastType  SALES | INVENTORY | FINANCE | HR | TASK | CUSTOM
 */
export const runForecast = (question, forecastType) => api.post('/api/ai/forecast', { question, forecastType });

/**
 * Get forecast history.
 */
export const getForecastHistory = () => api.get('/api/ai/forecast/history');

/**
 * Get available forecast types.
 */
export const getForecastTypes = () => api.get('/api/ai/forecast/types');

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function triggerDownload(response, fallbackName) {
  const contentDisposition = response.headers['content-disposition'];
  let filename = fallbackName;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }
  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
