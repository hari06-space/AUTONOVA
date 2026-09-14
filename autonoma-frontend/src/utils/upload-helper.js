import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';

/**
 * Automatically infers the storage module based on the current browser URL.
 * Syncs with BosDocConstants.java backend mapping.
 */
export const getModuleFromPath = () => {
  const path = window.location.pathname.toLowerCase();

  // Check specific 3-level menu routes first

  // QMS - Checklist Sub-routes
  if (path.includes('/qms/checklist/verify')) return 'QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CHECKLIST_VERIFY';
  if (path.includes('/qms/checklist/close-renewal')) return 'QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CLOSE_CHECKLIST_RENEWAL';
  if (path.includes('/qms/checklist/renewal-verify')) return 'QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CHECKLIST_RENEWAL_VERIFY';
  if (path.includes('/qms/checklist/renewal-report')) return 'QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CHECKLIST_RENEWAL_REPORT';
  if (path.includes('/qms/checklist')) return 'QMS_CHECKLIST'; // general checklist fallback

  // QMS - Audit Sub-routes
  if (path.includes('/qms/audit/schedule')) return 'QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_SCHEDULE';
  if (path.includes('/qms/audit/observation')) return 'QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION';
  if (path.includes('/qms/audit/ncr/close')) return 'QUALITY_MANAGEMENT_SYSTEMS_AUDIT_CLOSE_NC_OFI';
  if (path.includes('/qms/audit/ncr/approval')) return 'QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_NC_OFI_APPROVAL';
  if (path.includes('/qms/audit')) return 'QMS_AUDIT'; // general audit fallback

  // QMS - Meeting / MOM
  if (path.includes('/qms/close-mom')) return 'QUALITY_MANAGEMENT_SYSTEMS_MEETING_CLOSE_MOM';
  if (path.includes('/qms/minutesofmeeting')) return 'QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING';
  if (path.includes('/qms/mom-approval') || path.includes('/qms/mom-verify')) return 'QUALITY_MANAGEMENT_SYSTEMS_MEETING_MOM_APPROVAL';
  if (path.includes('/qms/meeting-schedule')) return 'QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_SCHEDULE';
  if (path.includes('/qms/meeting-attendance')) return 'QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_USER_ATTENDANCE';
  if (path.includes('/master/qms/meeting/master')) return 'MASTER_QMS_MEETING_MEETING_MASTER';


  // Master/HRA/ATS Sub-routes
  if (path.includes('/master/hr/ats/interview-criteria') || path.includes('/hra/ats/interview-criteria'))
    return 'MASTER_HR_ATS_INTERVIEW_CRITERIA_MASTER';
  if (path.includes('/master/hr/ats/induction-criteria') || path.includes('/hra/ats/induction-criteria'))
    return 'MASTER_HR_ATS_INDUCTION_CRITERIA';
  if (path.includes('/hra/ats/induction-assignment')) return 'HRA_INDUCTION_INDUCTION_PENDING';
  if (path.includes('/hra/ats/induction-training')) return 'HRA_INDUCTION_INDUCTION_TRAINING';
  if (path.includes('/hra/ats/induction-trainee')) return 'HRA_INDUCTION_INDUCTION_TRAINEE';
  if (path.includes('/hra/ats') || path.includes('/master/hr/ats')) return 'MASTER_HR_ATS_APPLICATION_TRACKING_SYSTEM';

  // Master - HR - Employee
  if (path.includes('/hr/employee/master') || path.includes('/master/hr/employee/master')) return 'MASTER_HR_EMPLOYEE_EMPLOYEE_MASTER';
  if (path.includes('/hr/') || path.includes('/master/hr/')) return 'HRA';

  // Sales & Marketing Sub-routes
  if (path.includes('/sm/enquiry/dashboard')) return 'SALES_MARKETING_OCR_ENQUIRY_DASHBOARD';
  if (path.includes('/sm/enquiries')) return 'SALES_MARKETING_OCR_ENQUIRY';
  if (path.includes('/sm/quotations')) return 'SALES_MARKETING_OCR_QUOTATION';
  if (path.includes('/sm/customers')) return 'SALES_CUSTOMER';

  // Admin Sub-routes
  if (path.includes('/admin/company-profile')) return 'ADMIN_BOS_COMPANY_PROFILE';
  if (path.includes('/admin/user-credentials')) return 'ADMIN_BOS_USER_CREDENTIALS';

  // Then general module fallbacks
  if (path.includes('/user-overview') || path.includes('/profile')) return 'USER_PROFILE';
  if (path.includes('/finance/')) return 'FINANCE';
  if (path.includes('/production/')) return 'PRODUCTION';
  if (path.includes('/purchase/gate-entry') || path.includes('/purchase/gateentry')) return 'PURCHASE_GATE_ENTRY';
  if (path.includes('/purchase/')) return 'PURCHASE';
  if (path.includes('/maintenance/')) return 'MAINTENANCE';
  if (path.includes('/quality/')) return 'QUALITY';
  if (path.includes('/assets/')) return 'ASSETS';
  if (path.includes('/npd/')) return 'NPD';
  if (path.includes('/stores/')) return 'STORES';
  if (path.includes('/ocr/')) return 'OCR';

  return 'DEFAULT';
};

/**
 * Automated File Upload Helper
 * Handles FormData creation and module auto-detection.
 * @param {File} file - The file object to upload
 * @param {String} overrideModule - Optional module override
 * @returns {Promise<String>} - The relative path of the uploaded file (e.g. "QMS/uuid_name.pdf")
 */
export const autoUploadFile = async (file, overrideModule = null, onProgress = null, options = {}) => {
  if (!file) return null;

  const module = overrideModule || getModuleFromPath();
  const formData = new FormData();
  const cleanName = (file.name || '').replace(/\\/g, '/').split('/').pop();
  formData.append('file', file, cleanName);
  formData.append('module', module);
  if (options.pageCode) formData.append('pageCode', options.pageCode);
  if (options.refId) formData.append('refId', options.refId);

  try {
    console.debug(`[AutoUpload] Uploading to module: ${module}`);
    const response = await axios.post(`${API_PATHS.FILES}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    if (response.data && response.data.path) {
      return response.data.path;
    } else if (typeof response.data === 'string') {
      return response.data;
    }
    return response.data; // fallback
  } catch (error) {
    console.error(`[AutoUpload] Failed for module ${module}:`, error);
    throw error;
  }
};

/**
 * Uploads an array of files concurrently.
 */
export const autoUploadFiles = async (files, overrideModule = null, onProgress = null, options = {}) => {
  if (!files || files.length === 0) return [];

  let totalProgress = 0;
  const progressMap = new Array(files.length).fill(0);

  const uploadPromises = files.map((file, index) => {
    return autoUploadFile(file, overrideModule, (progress) => {
      progressMap[index] = progress;
      if (onProgress) {
        const total = progressMap.reduce((a, b) => a + b, 0) / files.length;
        onProgress(total);
      }
    }, options);
  });

  return Promise.all(uploadPromises);
};

export const getFileViewUrl = (serverFileName) => {
  if (!serverFileName) return '';
  const baseUrl = (axios.defaults.baseURL || '').replace(/\/+$/, '');
  const filesPath = API_PATHS.FILES.startsWith('/') ? API_PATHS.FILES : `/${API_PATHS.FILES}`;

  // Use query parameter to avoid Tomcat path variable restrictions (spaces, slashes, etc.)
  return `${baseUrl}${filesPath}/view?path=${encodeURIComponent(serverFileName)}`;
};

export const getFileDownloadUrl = (serverFileName) => {
  if (!serverFileName) return '';
  const baseUrl = (axios.defaults.baseURL || '').replace(/\/+$/, '');
  const filesPath = API_PATHS.FILES.startsWith('/') ? API_PATHS.FILES : `/${API_PATHS.FILES}`;

  return `${baseUrl}${filesPath}/download?path=${encodeURIComponent(serverFileName)}`;
};

export const getUserImageUrl = (imgName) => {
  if (!imgName || typeof imgName !== 'string') return '';
  if (imgName.startsWith('http') || imgName.startsWith('blob:')) return imgName;
  const baseUrl = (axios.defaults.baseURL || '').replace(/\/+$/, '');
  return `${baseUrl}/api/users/image?fileNameParam=${encodeURIComponent(imgName)}`;
};

export const getCompanyImageUrl = (imgName) => {
  if (!imgName || typeof imgName !== 'string') return '';
  if (imgName.startsWith('http') || imgName.startsWith('blob:')) return imgName;
  const baseUrl = (axios.defaults.baseURL || '').replace(/\/+$/, '');
  return `${baseUrl}/api/company-profile/image?fileNameParam=${encodeURIComponent(imgName)}`;
};
